# 🚀 Bondly - Setup Guide

## Overview
Bondly is an AI-powered relationship counseling app that helps couples work through conflicts by collecting both perspectives and providing personalized advice.

## Prerequisites
- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Supabase account (free tier works)
- Google AI API key

---

## Step 1: Install Dependencies

```bash
pnpm install
```

---

## Step 2: Setup Supabase

### 2.1 Create a Supabase Project
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in the project details
4. Wait for the project to be created (takes ~2 minutes)

### 2.2 Run Database Setup Script
1. In your Supabase project, go to the SQL Editor
2. Copy the contents of `scripts/001_create_tables.sql`
3. Paste and run it in the SQL Editor
4. This creates the necessary tables: `sessions`, `responses`, and `advice`

### 2.3 Enable Anonymous Sign-ins (Important!)
1. Go to Authentication > Providers
2. Enable "Anonymous sign-ins"
3. This allows users to create sessions without creating an account

### 2.4 Get Your API Keys
1. Go to Project Settings > API
2. Copy the `Project URL` (looks like: https://xxxxx.supabase.co)
3. Copy the `anon public` key

---

## Step 3: Setup Google AI

1. Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy the API key

---

## Step 4: Configure Environment Variables

Create a file named `.env.local` in the root directory with the following content:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Site URL (for generating share links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# AI Provider (for relationship advice generation)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here
```

Replace the placeholder values with your actual keys from Steps 2 and 3.

---

## Step 5: Run the Development Server

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

---

## 🎯 How It Works

### User Flow:
1. **Create Session** (`/session/new`)
   - User A fills out their perspective on a relationship issue
   - System creates a session and anonymous user
   - Generates a shareable link

2. **Share Link** (`/session/[id]/share`)
   - User A shares the link with User B (their partner)

3. **Partner Response** (`/partner/[token]`)
   - User B opens the link and fills out their perspective
   - System triggers AI analysis automatically

4. **Processing** (`/session/[id]/processing`)
   - AI analyzes both perspectives
   - Generates personalized advice for each person

5. **View Advice** (`/session/[id]/advice`)
   - Each user sees their personalized advice
   - Includes: analysis, action steps, conversation starters

### Optional Features:
- **Login/Sign-up** (`/auth/login`, `/auth/sign-up`)
  - Users can create accounts to track session history
  - Anonymous sessions work without accounts

- **Dashboard** (`/dashboard`)
  - View all past sessions
  - See session statuses (waiting/completed/analyzed)

---

## 🏗️ Architecture

### Database Schema:
- **sessions**: Stores session metadata and status
- **responses**: Stores each partner's perspective
- **advice**: Stores AI-generated advice for each partner

### API Routes:
- `/api/analyze-session`: POST endpoint that triggers AI analysis

### Key Technologies:
- **Next.js 16** with App Router
- **Supabase** for database and auth
- **Vercel AI SDK** for streaming AI responses
- **Google Gemini 2.5 Flash** for relationship advice generation
- **Tailwind CSS 4** for styling
- **shadcn/ui** for UI components

---

## 🐛 Troubleshooting

### "Failed to create session"
- Check that anonymous sign-ins are enabled in Supabase
- Verify your environment variables are set correctly

### "Failed to analyze session"
- Check that your Google AI API key is valid
- Ensure both responses have been submitted

### Database errors
- Verify you ran the SQL script in Supabase
- Check that Row Level Security policies are set up correctly

---

## 📝 Development Notes

- TypeScript errors are ignored in build (`ignoreBuildErrors: true`)
- Images are unoptimized for faster development
- Uses server-side rendering for auth pages
- Client-side rendering for interactive forms

---

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Other Platforms
- Set environment variables
- Build command: `pnpm build`
- Start command: `pnpm start`
- Node.js version: 18+

---

## 📄 License

This project was created with v0.

