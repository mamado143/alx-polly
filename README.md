# 🗳️ Polling App

A modern, real-time polling application built with Next.js, Supabase, and TypeScript. Create polls, vote on them, and see live results with a beautiful, responsive interface.

## ✨ Features

### 🎯 **Core Functionality**
- **Create Polls**: Build custom polls with questions and multiple options
- **Vote Anonymously**: Vote without registration or with user authentication
- **Live Results**: Real-time vote counting and percentage display
- **Poll Management**: Edit and delete your own polls
- **Expiration Support**: Set optional expiration dates for polls
- **QR Code Sharing**: Generate QR codes for easy poll sharing

### 🔐 **Authentication & Security**
- **Supabase Auth**: Secure user authentication and management
- **Row Level Security**: Database-level security policies
- **Anonymous Voting**: Support for both authenticated and anonymous voting
- **Duplicate Prevention**: Prevents multiple votes from the same user
- **Data Validation**: Comprehensive input validation with Zod schemas

### 📊 **Dashboard & Analytics**
- **Poll Dashboard**: View all polls with statistics and management options
- **Live Statistics**: Total polls, votes, and active polls counters
- **Vote Tracking**: Real-time vote counts and percentages
- **Poll Status**: Visual indicators for expired polls
- **Creator Information**: See who created each poll

### 🎨 **User Experience**
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Toast Notifications**: Success and error feedback
- **Loading States**: Smooth loading animations
- **Form Validation**: Real-time form validation with helpful error messages
- **Accessibility**: Built with accessibility best practices

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Forms**: React Hook Form + Zod validation
- **Real-time**: Supabase Realtime subscriptions
- **QR Codes**: qrcode.react
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <https://github.com/mamado143/alx-polly.git>
   cd polling-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migration from `supabase/migrations/001_initial_schema.sql`
   - Get your project URL and anon key

4. **Environment Variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

5. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
polling-app/
├── app/                          # Next.js App Router
│   ├── auth/                     # Authentication pages
│   ├── polls/                    # Poll-related pages
│   │   ├── [id]/                 # Dynamic poll detail pages
│   │   │   ├── edit/             # Edit poll page
│   │   │   └── delete/           # Delete poll route
│   │   ├── new/                  # Create poll page
│   │   └── page.tsx              # Polls dashboard
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── polls/                    # Poll-specific components
│   │   ├── CreatePollForm.tsx    # Poll creation form
│   │   ├── EditPollForm.tsx      # Poll editing form
│   │   ├── PollVotingForm.tsx    # Voting interface
│   │   └── PollResults.tsx       # Live results display
│   ├── shared/                   # Shared components
│   │   └── QRCodeCard.tsx        # QR code generation
│   ├── ui/                       # shadcn/ui components
│   └── AuthButton.tsx            # Authentication button
├── lib/                          # Utility libraries
│   ├── actions/                  # Server actions
│   │   ├── create-poll.ts        # Poll creation logic
│   │   ├── update-poll.ts        # Poll update logic
│   │   ├── delete-poll.ts        # Poll deletion logic
│   │   └── submit-vote.ts        # Vote submission logic
│   ├── supabase/                 # Supabase configuration
│   │   ├── client.ts             # Client-side Supabase
│   │   └── server.ts             # Server-side Supabase
│   └── utils.ts                  # Utility functions
├── supabase/                     # Database schema
│   ├── migrations/               # Database migrations
│   │   └── 001_initial_schema.sql
│   └── README.md                 # Database documentation
└── public/                       # Static assets
```

## 🗄️ Database Schema

### Tables

#### `polls`
- `id` (UUID, Primary Key): Unique poll identifier
- `question` (TEXT): Poll question (10-280 characters)
- `options` (TEXT[]): Array of poll options (2-10 options, 1-80 chars each)
- `created_by` (UUID): Foreign key to auth.users
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `expires_at` (TIMESTAMPTZ, nullable): Optional expiration date

#### `votes`
- `id` (UUID, Primary Key): Unique vote identifier
- `poll_id` (UUID): Foreign key to polls table
- `option_index` (INTEGER): Index of selected option (0-based)
- `voter_id` (UUID, nullable): Foreign key to auth.users (anonymous voting)
- `created_at` (TIMESTAMPTZ): Vote timestamp

### Functions
- `get_poll_results(poll_uuid)`: Returns vote counts for each option
- `is_poll_expired(poll_uuid)`: Checks if a poll has expired

## 🎯 Usage Guide

### Creating a Poll
1. Navigate to `/polls/new` or click "Create Poll" in the header
2. Enter your poll question (10-280 characters)
3. Add 2-10 options (1-80 characters each)
4. Optionally set an expiration date
5. Click "Create Poll"

### Voting on a Poll
1. Visit a poll URL (e.g., `/polls/[id]`)
2. Select your preferred option using radio buttons
3. Click "Submit Vote"
4. See the thank you message and live results

### Managing Polls
- **View All Polls**: Visit `/polls` to see the dashboard
- **Edit Poll**: Click "Edit" on your own polls
- **Delete Poll**: Click "Delete" with confirmation
- **View Results**: Click "Results" to see detailed vote breakdowns

### Sharing Polls
- Use the QR code on the poll page for easy sharing
- Copy the poll URL directly
- Share via social media or messaging apps

## 🔧 API Reference

### Server Actions

#### `createPoll(input)`
Creates a new poll with validation.
- **Input**: `{ question: string, options: string[], expiresAt?: Date }`
- **Returns**: `{ ok: boolean, data?: { id: string }, error?: string }`

#### `submitVote(pollId, optionIndex)`
Submits a vote for a poll.
- **Input**: `pollId: string, optionIndex: number`
- **Returns**: `{ ok: boolean, error?: string }`

#### `updatePoll(pollId, input)`
Updates an existing poll (owner only).
- **Input**: `pollId: string, input: PollData`
- **Returns**: `{ ok: boolean, data?: PollData, error?: string }`

#### `deletePoll(pollId)`
Deletes a poll (owner only).
- **Input**: `pollId: string`
- **Returns**: `{ ok: boolean, error?: string }`

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation
- Review the code comments

---

**Happy Polling! 🗳️**