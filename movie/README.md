# ReSpectro : Watch Movies

A modern web app for discovering movies and TV series, built with React, Vite and Tailwind CSS.

## Features

- **Discover** top rated movies and TV shows, sorted by popularity
- **Search** for any movie or series
- **Filter** by media type (movies / series) and by genre
- **Detail view** for every title: a cinematic backdrop header with rating, year, runtime and tagline, the story, top billed cast, and key details (status, release date, budget/revenue or seasons/episodes, original language)
- **Player** with multiple selectable streaming servers; series include season and episode pickers
- **Watched tracking** — sign in to mark titles as watched and browse your personal watched list
- **Suggested** section showing your most searched titles
- **Responsive design** with a mobile menu, infinite scroll, and keyboard-friendly modals (Escape closes the detail view)

## Tech stack

- [React 19](https://react.dev) + [Vite](https://vite.dev) for the app and dev server
- [Tailwind CSS v4](https://tailwindcss.com) for styling
- [TMDB API](https://www.themoviedb.org/documentation/api) for movie, series, genre and cast data
- [Clerk](https://clerk.com) for authentication
- [Appwrite](https://appwrite.io) for storing search trends and per-user watched lists

## Getting started

### Prerequisites

- Node.js 20 or newer
- A TMDB API key (free with a [TMDB account](https://www.themoviedb.org/signup))
- A Clerk account (for sign-in)
- An Appwrite project with two collections:
  - a **searches** collection: `searchTerm` (string), `count` (integer), `movie_id` (string), `poster_url` (string), `user_id` (string)
  - a **watched** collection: `user_id` (string), `media_type` (string), `media_id` (string)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with the following variables:

   ```env
   VITE_TMDB_API_KEY=your_tmdb_read_access_token
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   VITE_APPWRITE_PROJECT_ID=your_appwrite_project_id
   VITE_APPWRITE_DATABASE_ID=your_appwrite_database_id
   VITE_APPWRITE_COLLECTION_ID=your_searches_collection_id
   VITE_APPWRITE_WATCHED_COLLECTION_ID=your_watched_collection_id
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
├── App.jsx                  # Main app: fetching, filtering, pagination
├── appwrite.js              # Appwrite helpers (trending searches, watched list)
├── main.jsx                 # Entry point, Clerk provider
├── components/
│   ├── ExpandedCard.jsx     # Detail view / player modal
│   ├── MovieCard.jsx        # Grid card for a movie or series
│   ├── Navbar.jsx           # Top navigation with filters and auth
│   ├── Search.jsx           # Search bar
│   └── Spinner.jsx          # Loading indicator
└── hooks/
    └── useWatched.js        # Per-user watched list state
```
