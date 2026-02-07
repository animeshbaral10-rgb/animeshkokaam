'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { alertsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  petName: string;
  type: string;
  time: string;
  message?: string;
  isRead: boolean;
  severity?: string;
  createdAt: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [criticalAlerts, setCriticalAlerts] = useState(0);
  const [selectedPet, setSelectedPet] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertsData, unreadCount] = await Promise.all([
        alertsApi.getAll().catch(() => []),
        alertsApi.getUnreadCount().catch(() => ({ count: 0 })),
      ]);

      const alertsMapped = alertsData.map((alert: any) => ({
        id: alert.id,
        petName: alert.pet?.name || 'Unknown Pet',
        type: alert.alertType || 'Alert',
        time: formatAlertTime(alert.createdAt),
        message: alert.message || '',
        isRead: alert.isRead || false,
        severity: alert.severity || 'medium',
        createdAt: alert.createdAt,
      }));

      setAlerts(alertsMapped);
      setTotalAlerts(alertsMapped.length);
      setUnreadAlerts(unreadCount.count);
      setCriticalAlerts(alertsMapped.filter((a) => a.severity === 'critical').length);
      
      if (alertsMapped.length > 0 && !selectedAlert) {
        setSelectedAlert(alertsMapped[0]);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load alerts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAlertTime = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      const hours = date.getHours();
      const mins = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await alertsApi.markAsRead(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      );
      if (selectedAlert?.id === id) {
        setSelectedAlert({ ...selectedAlert, isRead: true });
      }
      setUnreadAlerts((prev) => Math.max(0, prev - 1));
      toast({ title: 'Success', description: 'Alert marked as read' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark alert as read',
        variant: 'destructive',
      });
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedPet !== 'all' && alert.petName.toLowerCase() !== selectedPet.toLowerCase()) {
      return false;
    }
    if (selectedType !== 'all' && alert.type.toLowerCase() !== selectedType.toLowerCase()) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading alerts...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const uniquePets = Array.from(new Set(alerts.map((a) => a.petName)));

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <h1 className="text-2xl font-semibold text-foreground">Alerts & Notifications</h1>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={selectedPet} onValueChange={setSelectedPet}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select pet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pets</SelectItem>
                {uniquePets.map((pet) => (
                  <SelectItem key={pet} value={pet.toLowerCase()}>
                    {pet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Alert type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="geofence">Geofence</SelectItem>
                <SelectItem value="battery">Battery</SelectItem>
                <SelectItem value="inactivity">Inactivity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-3 gap-6">
            {/* Recent Alerts */}
            <div className="col-span-2 bg-card rounded-lg border border-border">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium text-foreground">Recent Alerts</h3>
              </div>

              <div className="divide-y divide-border">
                {filteredAlerts.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No alerts found
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedAlert?.id === alert.id ? 'bg-muted/30' : ''
                      }`}
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${alert.isRead ? 'bg-muted' : 'bg-accent'}`} />
                        <div>
                          <span className="font-medium text-foreground">{alert.petName}</span>
                          <span className="text-muted-foreground"> - {alert.type}</span>
                          <p className="text-xs text-muted-foreground">{alert.time}</p>
                        </div>
                      </div>
                      <Badge variant={alert.isRead ? 'secondary' : 'default'}>
                        {alert.isRead ? 'Read' : 'Unread'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Alert Summary */}
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-medium text-foreground mb-4">Alert Summary</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Total alerts today</span>
                      <span className="text-foreground font-medium">{totalAlerts}</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Unread alerts</span>
                      <span className="text-foreground font-medium">{unreadAlerts}</span>
                    </div>
                    <Progress value={(unreadAlerts / totalAlerts) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Critical alerts</span>
                      <span className="text-foreground font-medium">{criticalAlerts}</span>
                    </div>
                    <Progress value={(criticalAlerts / totalAlerts) * 100} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Alert Details */}
              {selectedAlert && (
                <div className="bg-card rounded-lg border border-border p-4">
                  <h3 className="font-medium text-foreground mb-4">Alert Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pet:</span>
                      <span className="text-foreground">{selectedAlert.petName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="text-foreground">{selectedAlert.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="text-foreground">{selectedAlert.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Severity:</span>
                      <span className="text-foreground capitalize">{selectedAlert.severity || 'medium'}</span>
                    </div>
                    {selectedAlert.message && (
                      <div className="pt-2">
                        <span className="text-muted-foreground">Message:</span>
                        <p className="text-foreground mt-1">{selectedAlert.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    {!selectedAlert.isRead && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleMarkAsRead(selectedAlert.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

