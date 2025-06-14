import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import * as serviceWorker from './utils/serviceWorker'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for offline support and caching
serviceWorker.register({
  onUpdate: (registration) => {
    // Show update notification to user
    console.log('New version available! Please refresh the page.');
  },
  onSuccess: (registration) => {
    console.log('App is ready for offline use!');
  }
})

// Request persistent storage for better caching
serviceWorker.requestPersistentStorage()
