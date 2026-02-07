import React from 'react';
import { PawPrint } from 'lucide-react';

export const AppFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-gradient-to-b from-card/50 to-primary/5 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          {/* Copyright - Left Side */}
          <div className="flex flex-col md:flex-row items-center gap-2">
            <div className="flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-primary" />
              <span>© {currentYear}</span>
            </div>
            <span className="hidden md:inline">•</span>
            <span className="font-medium text-foreground">Real time location tracking system for pets</span>
            <span className="hidden md:inline">•</span>
            <span>All rights reserved</span>
          </div>
          
          {/* Developer Name - Right Side, Attractive */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>Developed by</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-teal-500 bg-clip-text text-transparent">
                Animesh Baral
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

