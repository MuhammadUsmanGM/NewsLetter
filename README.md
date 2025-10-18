# React + Vite - AI Updates Newsletter

This is a newsletter signup application with a stunning UI that collects user names and emails for an AI updates newsletter. The form data is stored in a Supabase database.

## Setup

### Prerequisites

1. Node.js (v16 or higher)
2. A Supabase account (sign up at [supabase.com](https://supabase.com))

### Installation

1. Clone or download this repository
2. Install dependencies: `npm install`
3. Create a Supabase project and get your credentials (see "Supabase Setup" section below)
4. Create a `.env` file with your Supabase credentials
5. Run the development server: `npm run dev`

### Supabase Setup

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. In your project dashboard, go to "Project Settings" → "API" to get:
   - **Project URL**: This will be your `VITE_SUPABASE_URL`
   - **Anonymous key**: This will be your `VITE_SUPABASE_ANON_KEY`
4. In the SQL Editor, run this query to create your table:

```sql
CREATE TABLE newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public insertions
CREATE POLICY "Allow public insertions" ON newsletter_subscribers
FOR INSERT TO authenticated, anon
WITH CHECK (true);
```

### Environment Variables

Create a `.env` file in the project root with the following content:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Replace the placeholders with your actual Supabase credentials.

## Development

To start the development server:

```bash
npm run dev
```

This will start the application on [http://localhost:5173](http://localhost:5173).

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
