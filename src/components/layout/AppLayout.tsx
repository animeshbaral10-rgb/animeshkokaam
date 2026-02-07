import React from 'react';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="p-4 md:p-6 flex-1 flex flex-col min-h-0">
        {children}
      </main>
      <AppFooter />
    </div>
  );
};
