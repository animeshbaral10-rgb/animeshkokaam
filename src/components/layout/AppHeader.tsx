'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, ChevronDown, Menu, X, LogOut, LayoutDashboard, PawPrint, MapPin, Bell, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Pets & Devices', path: '/pets-devices', icon: PawPrint },
  { label: 'Geofence', path: '/geofence', icon: MapPin },
  { label: 'Alerts', path: '/alerts', icon: Bell },
  { label: 'History', path: '/history', icon: Clock },
];

export const AppHeader: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    router.push('/');
  };

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-primary/10 px-4 md:px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 group-hover:from-primary/30 group-hover:to-purple-500/30 transition-all duration-200 shadow-sm border border-primary/20">
              <PawPrint className="w-6 h-6 text-primary stroke-2" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary via-purple-600 to-teal-500 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:via-primary group-hover:to-teal-600 transition-all duration-300">
              Real time location tracking system for pets
            </span>
          </Link>

          {/* Desktop Navigation - Hide on admin page */}
          {pathname !== '/admin' && (
            <nav className="hidden lg:flex items-center gap-6">
              {navItems.map((item) => {
                if (item.adminOnly && !user?.isAdmin) return null;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`text-sm transition-colors duration-200 px-3 py-1.5 rounded-full flex items-center gap-2 ${
                      pathname === item.path
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <NotificationBell />

          {/* Desktop User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hidden md:flex items-center gap-2 hover:bg-primary/10">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                {user?.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <span className="font-semibold text-lg">Menu</span>
                </div>
                
                <nav className="flex flex-col gap-2 flex-1">
                  {pathname !== '/admin' && navItems.map((item) => {
                    if (item.adminOnly && !user?.isAdmin) return null;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-4 py-3 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                          pathname === item.path
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="border-t border-border pt-4 mt-4">
                  <div className="px-4 py-2 text-sm text-muted-foreground truncate">
                    {user?.email}
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setSettingsOpen(true);
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile & Settings
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
};
