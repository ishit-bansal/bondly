# ✅ Bondly Setup Checklist

Follow these steps to get your app running:

## 1. Dependencies
- [ ] Run `pnpm install` to install all packages
- [ ] Verify installation completed without errors

## 2. Supabase Setup
- [ ] Create a Supabase account at [supabase.com](https://app.supabase.com)
- [ ] Create a new project (takes ~2 minutes)
- [ ] Go to SQL Editor
- [ ] Copy contents of `scripts/001_create_tables.sql`
- [ ] Run the SQL script
- [ ] Go to Authentication > Providers
- [ ] Enable "Anonymous sign-ins" (IMPORTANT!)
- [ ] Go to Settings > API
- [ ] Copy your Project URL (e.g., `https://xxxxx.supabase.co`)
- [ ] Copy your `anon public` key

## 3. Google AI Setup
- [ ] Visit [Google AI Studio](https://aistudio.google.com/apikey)
- [ ] Sign in with your Google account
- [ ] Click "Create API Key"
- [ ] Copy your API key

## 4. Environment Variables
- [ ] Run `./setup.sh` (or create `.env.local` manually)
- [ ] Open `.env.local` in your editor
- [ ] Replace `NEXT_PUBLIC_SUPABASE_URL` with your Supabase URL
- [ ] Replace `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your Supabase anon key
- [ ] Replace `GOOGLE_GENERATIVE_AI_API_KEY` with your Google AI key
- [ ] Save the file

## 5. Run the App
- [ ] Run `pnpm dev` in your terminal
- [ ] Open [http://localhost:3000](http://localhost:3000) in your browser
- [ ] Verify the home page loads correctly

## 6. Test the Flow
- [ ] Click "Start a Session"
- [ ] Fill out the form with test data
- [ ] Submit and get a share link
- [ ] Open the share link in an incognito/private window
- [ ] Fill out the partner's perspective
- [ ] Wait for AI analysis to complete
- [ ] View the personalized advice

## 🐛 Troubleshooting

If you encounter issues:

### "Failed to create session"
- Check that anonymous sign-ins are enabled in Supabase
- Verify `.env.local` has correct values
- Check browser console for errors

### "Module not found: @ai-sdk/google"
- Run `pnpm install` again
- Clear `.next` folder: `rm -rf .next`
- Restart dev server

### "Failed to analyze session"
- Check Google AI API key is valid
- Check API key hasn't exceeded free tier limits
- Look at terminal logs for detailed errors

### Database errors
- Verify SQL script ran successfully in Supabase
- Check table names in Supabase match: `sessions`, `responses`, `advice`
- Verify RLS policies are enabled

## 📝 Quick Commands

```bash
# Install dependencies
pnpm install

# Setup environment file
./setup.sh

# Run development server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Run linter
pnpm lint
```

## 🎯 Success Criteria

You'll know everything is working when:
- ✅ Home page loads at http://localhost:3000
- ✅ You can create a session
- ✅ Share link is generated
- ✅ Partner can submit their response
- ✅ AI analysis completes
- ✅ Advice is displayed for both perspectives

## 📚 Additional Resources

- [SETUP.md](./SETUP.md) - Detailed setup guide
- [README.md](./README.md) - Project overview
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

---

**Need Help?** Check the terminal output for error messages. Most issues are related to:
1. Missing environment variables
2. Anonymous sign-ins not enabled
3. SQL script not run
4. Invalid API keys

