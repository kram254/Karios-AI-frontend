import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ChatProvider } from './context/ChatContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AnonymousAuthProvider } from './context/AnonymousAuthContext'
import { BrowserRouter } from 'react-router-dom'

// Initialize endpoints
import { Endpoints, Environment } from './config/endpoints'

// Set environment based on the current URL
const isProduction = window.location.hostname.includes('onrender.com');
Endpoints.setEnvironment(isProduction ? Environment.PRODUCTION : Environment.DEVELOPMENT);
console.log(`Using ${isProduction ? 'production' : 'development'} environment`);

const AnonymousAuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return (
    <AnonymousAuthProvider isAuthenticated={isAuthenticated}>
      {children}
    </AnonymousAuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AnonymousAuthWrapper>
          <ChatProvider>
            <App />
          </ChatProvider>
        </AnonymousAuthWrapper>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
