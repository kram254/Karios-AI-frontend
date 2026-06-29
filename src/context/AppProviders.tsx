import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ChatProvider } from './ChatContext';
import { AnonymousAuthProvider } from './AnonymousAuthContext';

const AnonymousAuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <AnonymousAuthProvider isAuthenticated={isAuthenticated}>
      {children}
    </AnonymousAuthProvider>
  );
};

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnonymousAuthWrapper>
          <ChatProvider>
            {children}
          </ChatProvider>
        </AnonymousAuthWrapper>
      </AuthProvider>
    </BrowserRouter>
  );
};
