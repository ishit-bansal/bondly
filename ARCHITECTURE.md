# 🏗️ Bondly - Architecture Documentation

## System Overview

Bondly is a full-stack Next.js application that facilitates AI-powered relationship counseling through a structured three-phase process.

---

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐│
│  │  Next.js   │  │  React 19  │  │   Tailwind CSS +       ││
│  │  App       │  │  Client    │  │   shadcn/ui            ││
│  └────────────┘  └────────────┘  └────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server (App Router)              │
│  ┌────────────────┐  ┌─────────────────────────────────┐   │
│  │  Server Side   │  │    API Routes                   │   │
│  │  Rendering     │  │    /api/analyze-session         │   │
│  └────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
            ↓↑                              ↓↑
┌──────────────────────┐        ┌──────────────────────────┐
│   Supabase Backend   │        │   Google AI (Gemini)     │
│  ┌────────────────┐  │        │  ┌────────────────────┐  │
│  │  PostgreSQL    │  │        │  │  Gemini 2.0 Flash  │  │
│  │  Database      │  │        │  │  Exp               │  │
│  └────────────────┘  │        │  └────────────────────┘  │
│  ┌────────────────┐  │        │                          │
│  │  Auth Service  │  │        │  Advice Generation       │
│  │  (Anonymous)   │  │        │  & Analysis              │
│  └────────────────┘  │        └──────────────────────────┘
└──────────────────────┘
```

---

## 📊 Data Flow

### Phase 1: Session Creation

```
User A (Browser)
    │
    │ 1. Fill form with perspective
    │
    ▼
Next.js Client (/session/new)
    │
    │ 2. Create anonymous user
    │
    ▼
Supabase Auth
    │
    │ 3. Return user_id
    │
    ▼
Next.js Client
    │
    │ 4. Insert session + response
    │
    ▼
Supabase Database
    │
    │ sessions: { creator_id, share_token, status: "waiting_for_partner" }
    │ responses: { session_id, user_id, is_creator: true, ... }
    │
    ▼
Redirect to /session/[id]/share
    │
    │ 5. Display shareable link
    │
    ▼
User A copies link
```

### Phase 2: Partner Response

```
User B (Browser)
    │
    │ 1. Open share link (/partner/[token])
    │
    ▼
Next.js Client
    │
    │ 2. Fetch session by token
    │
    ▼
Supabase Database
    │
    │ 3. Return session data
    │
    ▼
User B fills form
    │
    │ 4. Create anonymous user for User B
    │
    ▼
Supabase Auth
    │
    │ 5. Return user_id
    │
    ▼
Next.js Client
    │
    │ 6. Insert response, update session status
    │
    ▼
Supabase Database
    │
    │ responses: { session_id, user_id, is_creator: false, ... }
    │ sessions: { status: "completed" }
    │
    ▼
    │ 7. Trigger AI analysis
    │
    ▼
POST /api/analyze-session
```

### Phase 3: AI Analysis

```
POST /api/analyze-session
    │
    │ 1. Fetch session + both responses
    │
    ▼
Supabase Database
    │
    │ 2. Return session + 2 responses
    │
    ▼
API Route Handler
    │
    │ 3. Prepare prompts for each person
    │
    ▼
Google Gemini AI (via Vercel AI SDK)
    │
    │ 4. Generate advice for User A
    │ 5. Generate advice for User B
    │
    ▼
API Route Handler
    │
    │ 6. Parse AI responses
    │ 7. Insert advice records
    │
    ▼
Supabase Database
    │
    │ advice: [
    │   { user_id: A, advice_text, conversation_starters, action_steps },
    │   { user_id: B, advice_text, conversation_starters, action_steps }
    │ ]
    │ sessions: { status: "analyzed" }
    │
    ▼
Client polls /session/[id]/processing
    │
    │ 8. Detect status change
    │
    ▼
Redirect to /session/[id]/advice
    │
    │ 9. Display personalized advice
    │
    ▼
Users view their advice
```

---

## 🗄️ Database Schema

### Tables

#### `sessions`
```sql
id              uuid PRIMARY KEY
creator_id      uuid REFERENCES auth.users(id)
creator_name    text NOT NULL
partner_name    text
status          text NOT NULL  -- 'waiting_for_partner' | 'completed' | 'analyzed'
share_token     text UNIQUE NOT NULL
created_at      timestamp
updated_at      timestamp
```

#### `responses`
```sql
id                      uuid PRIMARY KEY
session_id              uuid REFERENCES sessions(id)
user_id                 uuid REFERENCES auth.users(id)
is_creator              boolean NOT NULL
situation_description   text NOT NULL
feelings                text NOT NULL
emotional_state         text[]  -- ['Frustrated', 'Anxious', ...]
created_at              timestamp
```

#### `advice`
```sql
id                      uuid PRIMARY KEY
session_id              uuid REFERENCES sessions(id)
user_id                 uuid REFERENCES auth.users(id)
is_creator              boolean NOT NULL
advice_text             text NOT NULL
conversation_starters   text[]
action_steps            text[]
created_at              timestamp
```

### Row Level Security (RLS)

**sessions:**
- Users can view their own sessions (where creator_id = auth.uid())
- Users can insert/update their own sessions

**responses:**
- Users can view responses for sessions they created
- Users can view their own responses
- Users can insert their own responses

**advice:**
- Users can view their own advice (where user_id = auth.uid())
- Service role can insert advice (for AI-generated content)

---

## 🔐 Authentication Flow

### Anonymous Users (Default)

```
User visits /session/new
    │
    │ No login required!
    │
    ▼
Client calls supabase.auth.signInAnonymously()
    │
    │ Supabase creates temporary user
    │
    ▼
User gets auth.users.id
    │
    │ Used for creating session + response
    │
    ▼
Session created and linked to anonymous user
```

### Registered Users (Optional)

```
User visits /auth/sign-up
    │
    │ Enters email + password
    │
    ▼
Client calls supabase.auth.signUp()
    │
    │ Supabase creates permanent user
    │
    ▼
User gets auth.users.id
    │
    │ Can track sessions via dashboard
    │
    ▼
Dashboard shows user's session history
```

---

## 🎨 Frontend Architecture

### Page Structure

```
app/
├── page.tsx                    # Landing page (public)
├── layout.tsx                  # Root layout
│
├── session/
│   ├── new/
│   │   └── page.tsx           # Create session form (client)
│   └── [id]/
│       ├── share/
│       │   └── page.tsx       # Share link display (server)
│       ├── processing/
│       │   └── page.tsx       # AI processing status (client, polls)
│       └── advice/
│           └── page.tsx       # View advice (server)
│
├── partner/
│   └── [token]/
│       └── page.tsx           # Partner response form (client)
│
├── auth/
│   ├── login/
│   │   └── page.tsx           # Login page (client)
│   └── sign-up/
│       └── page.tsx           # Sign up page (client)
│
├── dashboard/
│   └── page.tsx               # Session history (server, protected)
│
└── api/
    └── analyze-session/
        └── route.ts           # AI analysis endpoint (POST)
```

### Client vs Server Components

**Client Components** (use "use client"):
- `/session/new` - Form with state
- `/partner/[token]` - Form with state
- `/session/[id]/processing` - Polling with useEffect
- `/auth/*` - Forms with state

**Server Components**:
- `/` - Static landing page
- `/session/[id]/share` - Fetches session data
- `/session/[id]/advice` - Fetches advice data
- `/dashboard` - Fetches user's sessions

---

## 🤖 AI Integration

### Prompt Engineering

The AI receives a structured prompt with:

1. **Context**: "You are a compassionate relationship counselor"
2. **Data**:
   - Person A's perspective, feelings, emotions
   - Person B's perspective, feelings, emotions
3. **Instructions**:
   - Validate feelings
   - Provide understanding
   - Suggest actionable steps
   - Create conversation starters
4. **Format**: JSON response expected

### Response Processing

```typescript
{
  "advice": "2-3 paragraph empathetic advice",
  "actionSteps": [
    "Concrete step 1",
    "Concrete step 2",
    "Concrete step 3"
  ],
  "conversationStarters": [
    "Opening question 1",
    "Opening question 2",
    "Opening question 3"
  ]
}
```

### Error Handling

- Retry logic for API failures
- Fallback responses if parsing fails
- Detailed logging with `[v0]` prefix

---

## 🔄 State Management

### Session States

1. **`waiting_for_partner`**
   - Initial state after creation
   - Only creator's response submitted
   - Share link active

2. **`completed`**
   - Both responses submitted
   - AI analysis triggered
   - Processing page shows loading

3. **`analyzed`**
   - AI generated advice for both users
   - Advice page accessible
   - Session complete

### State Transitions

```
waiting_for_partner
        │
        │ Partner submits response
        │
        ▼
    completed
        │
        │ AI analysis completes
        │
        ▼
    analyzed
```

---

## 🚀 Performance Optimizations

### Server-Side Rendering
- Static pages pre-rendered
- Database queries on server
- Reduced client-side data fetching

### Client-Side Features
- Form state management
- Optimistic UI updates
- Polling with intervals

### Database Indexes
```sql
CREATE INDEX sessions_creator_id_idx ON sessions(creator_id);
CREATE INDEX sessions_share_token_idx ON sessions(share_token);
CREATE INDEX responses_session_id_idx ON responses(session_id);
CREATE INDEX advice_session_id_idx ON advice(session_id);
```

---

## 🔒 Security Features

### Authentication
- Anonymous auth for privacy
- Optional permanent accounts
- Secure session tokens (UUID)

### Authorization
- Row Level Security on all tables
- Users can only see their own data
- Share tokens provide scoped access

### API Security
- Server-side API key storage
- Environment variables for secrets
- No client-side AI credentials

---

## 📱 UI/UX Design

### Design System
- **Colors**: Rose/Pink theme for relationships
- **Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 4
- **Fonts**: Geist Sans & Geist Mono

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Touch-friendly buttons and forms

### User Feedback
- Loading states
- Error messages
- Success confirmations
- Real-time status updates

---

## 🧪 Testing Strategy

### Manual Testing Checklist
1. Create session as User A
2. Share link with User B
3. Submit both responses
4. Verify AI analysis
5. Check advice display
6. Test with/without account

### Error Scenarios
- Missing environment variables
- Database connection failures
- AI API rate limits
- Invalid session tokens
- Network timeouts

---

## 📈 Scalability Considerations

### Current Limitations
- Synchronous AI generation (blocks request)
- No rate limiting
- Single region database
- No caching layer

### Future Improvements
- Queue-based AI processing
- Redis caching for sessions
- CDN for static assets
- Multi-region deployment
- Background job processing

---

## 🛠️ Development Workflow

### Local Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Check code quality
```

### Environment Variables
- `.env.local` - Local development
- `.env.production` - Production (Vercel)
- Never commit sensitive keys!

### Code Quality
- TypeScript for type safety
- ESLint for code standards
- Prettier for formatting (recommended)

---

## 📦 Deployment

### Vercel (Recommended)
1. Connect GitHub repo
2. Auto-detect Next.js
3. Add environment variables
4. Deploy!

### Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
GOOGLE_GENERATIVE_AI_API_KEY
```

### Build Configuration
- Node.js 20+
- Build command: `npm run build`
- Output directory: `.next`

---

## 📚 Technology Choices

### Why Next.js?
- Server-side rendering for SEO
- API routes for backend logic
- File-based routing
- Great developer experience

### Why Supabase?
- PostgreSQL database
- Built-in authentication
- Row Level Security
- Real-time capabilities (future)

### Why Google Gemini?
- Cost-effective AI
- Good context window
- Fast response times
- JSON output support

### Why Tailwind?
- Utility-first styling
- Great DX with IntelliSense
- Consistent design system
- Small production bundle

---

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

<div align="center">

**This architecture enables a scalable, secure, and user-friendly relationship counseling platform.**

Built with modern best practices and ready for production!

</div>

