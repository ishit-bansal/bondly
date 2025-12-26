# Bondly

A private, encrypted space for couples to understand each other better.

## What is Bondly?

When words feel hard to say, Bondly helps couples express their feelings privately, understand each other's perspective, and receive thoughtful guidance — all without judgment.

**[Live Site](https://bondly-roan.vercel.app)**

**Key Features:**
- **End-to-end encrypted** — Your words are encrypted before leaving your device
- **Auto-deleted in 24 hours** — No traces left behind
- **No sign-up required** — Completely anonymous
- **AI-powered guidance** — Personalized advice for both partners

## How It Works

1. **You write** — Describe the situation and how you're feeling
2. **Share the link** — Your partner gets a private link to share their side
3. **Both receive guidance** — AI analyzes both perspectives and gives personalized advice

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Supabase account (free)
- Google AI API key (free)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL files in `scripts/` folder (in order)
3. Enable "Anonymous sign-ins" in Authentication → Providers

### Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Next.js 16** — React framework
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Styling
- **Supabase** — Database & auth
- **Google Gemini** — AI advice generation

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

Vercel handles the cron job for 24-hour data cleanup automatically.

## Project Structure

```
bondly/
├── app/
│   ├── page.tsx              # Landing page
│   ├── session/new/          # Create session
│   ├── session/[id]/share/   # Share link with partner
│   ├── partner/[token]/      # Partner's response form
│   ├── advice/[id]/          # View personalized advice
│   └── api/                  # API routes
├── components/ui/            # UI components
├── lib/
│   ├── encryption.ts         # Client-side encryption
│   └── supabase/             # Database clients
└── scripts/                  # SQL setup files
```

## Security

- **Client-side encryption** — Data encrypted before leaving browser
- **URL fragment keys** — Encryption keys never sent to server
- **Anonymous sessions** — No user accounts, no tracking
- **24-hour deletion** — Automatic cleanup via cron job
- **Row Level Security** — Database-level access control

## License

MIT