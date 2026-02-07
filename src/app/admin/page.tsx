'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, Unlock, Key, Trash2, RefreshCw, Users, UserCheck, UserX, PawPrint, Smartphone, ChevronDown, ChevronUp, Search, Filter, AlertTriangle, TrendingUp, Clock, UserPlus, Activity, BarChart3 } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  lastLogin?: string | null;
  hasLoggedIn?: boolean;
  petsCount?: number;
  devicesCount?: number;
  profile: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
  } | null;
  pets?: Array<{
    id: string;
    name: string;
    species: string;
    breed?: string;
    createdAt: string;
  }>;
  devices?: Array<{
    id: string;
    name?: string;
    deviceId: string;
    status: string;
    batteryLevel?: number;
    lastContact?: string;
  }>;
}

interface Statistics {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  adminUsers: number;
  usersWithLogin: number;
  totalPets: number;
  totalDevices: number;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'locked' | 'inactive'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview');

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      toast({
        title: 'Access Denied',
        description: 'Admin access required',
        variant: 'destructive',
      });
      router.push('/dashboard');
    }
  }, [user, loading, router, toast]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchUsers();
      fetchStatistics();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await adminApi.getStatistics();
      setStatistics(stats);
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      toast({
        title: 'Invalid Password',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    try {
      await adminApi.changeUserPassword(selectedUser.id, newPassword);
      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });
      setPasswordDialogOpen(false);
      setNewPassword('');
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    }
  };

  const handleUnlock = async (userId: string) => {
    try {
      await adminApi.unlockUser(userId);
      toast({
        title: 'Success',
        description: 'User account unlocked',
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unlock user',
        variant: 'destructive',
      });
    }
  };

  const handleLock = async (userId: string) => {
    try {
      await adminApi.lockUser(userId);
      toast({
        title: 'Success',
        description: 'User account locked',
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to lock user',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await adminApi.deleteUser(selectedUser.id);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  if (loading || !user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Enhanced Header Section */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-primary/10 to-teal-500/10 rounded-2xl blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-primary/30 rounded-xl blur-md"></div>
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-purple-500/20 via-primary/20 to-teal-500/20 border border-primary/30 shadow-lg">
                    <Shield className="w-8 h-8 text-primary drop-shadow-lg" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-primary to-teal-600 bg-clip-text text-transparent mb-2">
                    Admin Panel
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary/60" />
                    View all user activity, manage accounts, pets, and devices
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => { fetchUsers(); fetchStatistics(); }} 
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                size="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold">Total Users</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                  {statistics.totalUsers}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {statistics.adminUsers} admin{statistics.adminUsers !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold">Active Users</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-all">
                  <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                  {statistics.usersWithLogin}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {statistics.activeUsers} active
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-red-500/50 transition-all duration-300 hover:shadow-xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold">Locked Accounts</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 group-hover:from-red-500/30 group-hover:to-orange-500/30 transition-all">
                  <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-1">
                  {statistics.lockedUsers}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Need admin unlock
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold">Total Pets</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-teal-500/20 group-hover:from-primary/30 group-hover:to-teal-500/30 transition-all">
                  <PawPrint className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent mb-1">
                  {statistics.totalPets}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  {statistics.totalDevices} devices
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="bg-card rounded-xl border-2 border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
          {loadingUsers ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Loading users...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-teal-500/5 border-b-2 border-primary/20">
                  <TableHead className="w-12 font-semibold"></TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Login Status</TableHead>
                  <TableHead className="font-semibold">Failed Attempts</TableHead>
                  <TableHead className="font-semibold">Pets/Devices</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const isExpanded = expandedUsers.has(user.id);
                    return (
                      <React.Fragment key={user.id}>
                        <TableRow>
                          <TableCell>
                            {(user.petsCount && user.petsCount > 0) || (user.devicesCount && user.devicesCount > 0) ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleUserExpansion(user.id)}
                                className="h-8 w-8 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            ) : null}
                          </TableCell>
                          <TableCell className="font-medium">
                            {user.email}
                            {user.isAdmin && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                                Admin
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{user.profile?.fullName || '-'}</TableCell>
                          <TableCell>
                            {user.isLocked ? (
                              <Badge variant="destructive">Locked</Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-600">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.hasLoggedIn ? (
                              <Badge variant="outline" className="text-green-600">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Logged In
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Never
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.failedLoginAttempts > 0 ? (
                              <span className="text-destructive font-medium">
                                {user.failedLoginAttempts}/5
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0/5</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.petsCount !== undefined && (
                                <Badge variant="outline" className="gap-1">
                                  <PawPrint className="w-3 h-3" />
                                  {user.petsCount}
                                </Badge>
                              )}
                              {user.devicesCount !== undefined && (
                                <Badge variant="outline" className="gap-1">
                                  <Smartphone className="w-3 h-3" />
                                  {user.devicesCount}
                                </Badge>
                              )}
                              {(!user.petsCount && !user.devicesCount) && (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog
                            open={passwordDialogOpen && selectedUser?.id === user.id}
                            onOpenChange={(open) => {
                              setPasswordDialogOpen(open);
                              if (!open) {
                                setSelectedUser(null);
                                setNewPassword('');
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Key className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Change Password</DialogTitle>
                                <DialogDescription>
                                  Change password for {user.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label htmlFor="newPassword">New Password</Label>
                                  <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password (min 6 characters)"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setPasswordDialogOpen(false);
                                    setNewPassword('');
                                    setSelectedUser(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleChangePassword}>Change Password</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {user.isLocked ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnlock(user.id)}
                            >
                              <Unlock className="w-4 h-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLock(user.id)}
                              disabled={user.isAdmin}
                            >
                              <Lock className="w-4 h-4 text-destructive" />
                            </Button>
                          )}

                          {!user.isAdmin && (
                            <Dialog
                              open={deleteDialogOpen && selectedUser?.id === user.id}
                              onOpenChange={(open) => {
                                setDeleteDialogOpen(open);
                                if (!open) {
                                  setSelectedUser(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete User</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete {user.email}? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setDeleteDialogOpen(false);
                                      setSelectedUser(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button variant="destructive" onClick={handleDelete}>
                                    Delete
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (user.pets && user.pets.length > 0 || user.devices && user.devices.length > 0) && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/30 p-0">
                          <div className="p-4 space-y-4">
                            {user.pets && user.pets.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <PawPrint className="w-4 h-4 text-primary" />
                                  Pets ({user.pets.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {user.pets.map((pet) => (
                                    <Card key={pet.id} className="p-3">
                                      <CardContent className="p-0">
                                        <div className="font-medium">{pet.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {pet.species} {pet.breed && `• ${pet.breed}`}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          Added: {new Date(pet.createdAt).toLocaleDateString()}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}
                            {user.devices && user.devices.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <Smartphone className="w-4 h-4 text-primary" />
                                  Devices ({user.devices.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {user.devices.map((device) => (
                                    <Card key={device.id} className="p-3">
                                      <CardContent className="p-0">
                                        <div className="font-medium">{device.name || device.deviceId}</div>
                                        <div className="text-sm text-muted-foreground">
                                          ID: {device.deviceId}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                          <Badge variant={device.status === 'active' ? 'default' : 'secondary'}>
                                            {device.status}
                                          </Badge>
                                          {device.batteryLevel !== null && device.batteryLevel !== undefined && (
                                            <Badge variant="outline">
                                              Battery: {device.batteryLevel}%
                                            </Badge>
                                          )}
                                        </div>
                                        {device.lastContact && (
                                          <div className="text-xs text-muted-foreground mt-1">
                                            Last: {new Date(device.lastContact).toLocaleString()}
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

