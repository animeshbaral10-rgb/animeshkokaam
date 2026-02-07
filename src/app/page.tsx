'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { PawPrint, MapPin, Bell, Shield } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      // Redirect admin users to admin page, others to dashboard
      if (user.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  // Show loading for max 3 seconds, then show landing page
  const [showLoading, setShowLoading] = React.useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 3000); // Max 3 seconds loading

    if (!loading) {
      setShowLoading(false);
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <PawPrint className="h-12 w-12 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 shadow-sm border border-primary/20">
            <PawPrint className="h-6 w-6 text-primary stroke-2" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-teal-500 bg-clip-text text-transparent">
            Real time location tracking system for pets
          </span>
        </div>
        <Button onClick={() => router.push('/auth')}>
          Get Started
        </Button>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Keep Your Pets Safe, Always
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Real-time GPS tracking, geofencing alerts, and peace of mind for pet owners. 
            Know where your furry friends are, anytime, anywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => router.push('/auth')}>
              Start Tracking Today
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/auth')}>
              Learn More
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="p-6 rounded-2xl bg-card border border-border/50 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Live Location</h3>
            <p className="text-muted-foreground">
              Track your pet's location in real-time with GPS precision.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-card border border-border/50 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Safe Zones</h3>
            <p className="text-muted-foreground">
              Set up geofences and get alerts when your pet leaves safe areas.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-card border border-border/50 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Alerts</h3>
            <p className="text-muted-foreground">
              Receive notifications for boundary escapes and low battery.
            </p>
          </div>
        </div>
      </main>

      {/* Footer with Copyright */}
      <footer className="mt-24 border-t border-border/50 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Copyright - Left Side */}
            <div className="flex flex-col md:flex-row items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-primary" />
                <span>© {new Date().getFullYear()}</span>
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
                <span className="text-xl font-bold bg-gradient-to-r from-primary via-purple-600 to-teal-500 bg-clip-text text-transparent">
                  Animesh Baral
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

