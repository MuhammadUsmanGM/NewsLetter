# AI Updates Newsletter

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)

## 🚀 Live Demo

[![Deploy with Vercel](https://vercel.com/button)](https://news-letter-umber-five.vercel.app/)

## 📖 About

AI Updates Newsletter is a modern, beautifully designed newsletter subscription application that provides subscribers with the latest insights, trends, and developments in artificial intelligence. Built with React and Vite, featuring a stunning glass-morphism UI and powered by Supabase for secure data storage.

## ✨ Features

- ✅ **Stunning UI/UX** - Glass-morphism design with smooth animations
- ✅ **Real-time Database** - Secure storage with Supabase
- ✅ **Form Validation** - Client-side and server-side validation
- ✅ **Responsive Design** - Works perfectly on all devices
- ✅ **Loading States** - Visual feedback during operations
- ✅ **Error Handling** - Detailed error messages with user-friendly UI
- ✅ **Welcome Animation** - Engaging on-load experience
- ✅ **Custom Favicon** - Professional branding
- ✅ **GitHub Integration** - Easy social connection

## 🎁 What Subscribers Get

By subscribing to our AI Updates Newsletter, you'll receive:

- 🤖 **Latest AI Trends** - Stay ahead with cutting-edge insights
- 📚 **Educational Content** - In-depth analysis of AI technologies
- 🌐 **Industry News** - Updates on major AI advancements
- 🔥 **Exclusive Resources** - Access to curated AI tools and resources
- 💡 **Practical Applications** - Real-world AI use cases and implementations
- 🗓️ **Daily Updates** - Regular newsletter delivery to your inbox

## 🛠️ Tech Stack

| Technology | Description |
|------------|-------------|
| [React](https://react.dev/) | JavaScript library for building user interfaces |
| [Vite](https://vitejs.dev/) | Next-generation frontend build tool |
| [Supabase](https://supabase.com/) | Open-source Firebase alternative with PostgreSQL |
| [CSS3](https://developer.mozilla.org/en-US/docs/Web/CSS) | Styling with modern CSS features |
| [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) | Programming language for interactive web development |

### Dependencies
- `@supabase/supabase-js` - Official Supabase client library

### Dev Dependencies
- `@vitejs/plugin-react` - Vite plugin for React projects
- `eslint` - JavaScript linting tool
- `vite` - Build tool for modern web projects

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/ai-newsletter.git
```

2. Navigate to the project directory:
```bash
cd ai-newsletter
```

3. Install dependencies:
```bash
npm install
# or
yarn install
```

4. Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to [http://localhost:5173](http://localhost:5173)

## 🔐 Environment Variables

To run this project, you need to add the following environment variables to your `.env` file:

`VITE_SUPABASE_URL` - Your Supabase project URL (get from your Supabase dashboard)
`VITE_SUPABASE_ANON_KEY` - Your Supabase anon key (get from your Supabase dashboard)

### Setting up Supabase

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in your Supabase dashboard
3. Get your Project URL and Anonymous Key under Project Settings → API
4. Run the following SQL in your SQL Editor to create the database table:

```sql
CREATE TABLE newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  timezone TEXT,  -- Store timezone as string (e.g., "Asia/Karachi", "America/New_York")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public insertions
CREATE POLICY "Allow public insertions" ON newsletter_subscribers
FOR INSERT TO authenticated, anon
WITH CHECK (true);
```

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/your-repo-name)

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. The build files will be available in the `dist` directory
3. Deploy the `dist` directory to your preferred hosting platform

## 🤝 Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 💬 Contact

MuhammadUsmanGM - muhammadusman5965etc@gmail.com

Project Link: [https://github.com/your-username/ai-newsletter](https://github.com/MuhammadUsmanGM/NewsLetter)

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/your-username/ai-newsletter?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/ai-newsletter?style=social)
![GitHub contributors](https://img.shields.io/github/contributors/your-username/ai-newsletter)
![GitHub issues](https://img.shields.io/github/issues/your-username/ai-newsletter)
![GitHub last commit](https://img.shields.io/github/last-commit/your-username/ai-newsletter)

---

Made with ❤️ using React, Vite, and Supabase

## 📧 Newsletter Sample

![Sample Newsletter](src/assets/OutPut.png)

*This is the type of mail you will get*
