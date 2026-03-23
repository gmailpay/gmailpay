# GmailPay - Migrated from Base44 to Supabase

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

### 3. Setup Supabase Database
1. Go to your Supabase Dashboard > SQL Editor
2. Copy the contents of `supabase/migrations/001_create_tables.sql`
3. Run the SQL query - this creates all 7 tables with RLS policies

### 4. Enable Auth
In Supabase Dashboard > Authentication > Providers, enable Email provider.

### 5. Run Development Server
```bash
npm run dev
```

### 6. Deploy to Vercel
```bash
npm run build
# Upload to GitHub, connect to Vercel
```

## Architecture
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (email/password)
- **AI Chatbot**: Google Gemini API
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui

## Notes
- Email notifications (SendEmail) have been replaced with toast notifications
- To add email back, integrate Resend or SendGrid via Supabase Edge Functions
- Admin codes: configured in AppLayout.jsx
