import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#cecefb',
    colorBackground: '#0f0d23',
    colorText: '#cecefb',
    colorTextSecondary: '#a8b5db',
    colorInputBackground: '#030014',
    colorInputText: '#cecefb',
    borderRadius: '0.5rem',
    fontFamily: '"DM Sans", sans-serif',
  },
  elements: {
    card: {
      backgroundColor: '#0f0d23',
      border: '1px solid rgba(206, 206, 251, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    },
    formButtonPrimary: {
      backgroundColor: '#1d4ed8',
      '&:hover': { backgroundColor: '#1e40af' },
    },
    footerActionLink: {
      color: '#cecefb',
    },
    userButtonPopoverCard: {
      backgroundColor: '#0f0d23',
    },
  },
}

createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={clerkAppearance}>
    <App />
  </ClerkProvider>
)
