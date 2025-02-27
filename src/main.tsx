import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ChatProvider } from './context/ChatContext'
import { BrowserRouter } from 'react-router-dom'

// Initialize endpoints
import { Endpoints } from './config/endpoints'
Endpoints.setEnvironment(Endpoints.environment)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ChatProvider>
        <App />
      </ChatProvider>
    </BrowserRouter>
  </React.StrictMode>
)
