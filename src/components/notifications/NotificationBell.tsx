'use client';

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { alertsApi } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Alert {
  id: string;
  alertType: string;
  title: string;
  message?: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
  pet?: { name: string };
  device?: { name: string; deviceId: string };
  geofence?: { name: string };
}

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { socket } = useSocket();
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadUnreadCount();
    loadAlerts();
  }, []);

  // Listen for real-time alerts
  useEffect(() => {
    if (!socket) return;

    const handleNewAlert = (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Show toast notification
      toast({
        title: alert.title,
        description: alert.message || `${alert.alertType} alert`,
        variant: alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'default',
      });
    };

    const handleUnreadCount = (data: { count: number }) => {
      setUnreadCount(data.count);
    };

    socket.on('alert:new', handleNewAlert);
    socket.on('alert:unread_count', handleUnreadCount);

    return () => {
      socket.off('alert:new', handleNewAlert);
      socket.off('alert:unread_count', handleUnreadCount);
    };
  }, [socket, toast]);

  const loadUnreadCount = async () => {
    try {
      const data = await alertsApi.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertsApi.getAll();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await alertsApi.markAsRead(alertId);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const handleAlertClick = (alert: Alert) => {
    if (!alert.isRead) {
      handleMarkAsRead(alert.id);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'geofence_exit':
        return '🚨';
      case 'geofence_entry':
        return '📍';
      case 'low_battery':
        return '🔋';
      case 'device_offline':
        return '📴';
      case 'inactivity':
        return '⏱️';
      default:
        return '🔔';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-accent/10">
          <Bell className="w-5 h-5 text-accent" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No alerts</p>
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 hover:bg-accent/50 cursor-pointer transition-colors ${
                    !alert.isRead ? 'bg-accent/30' : ''
                  }`}
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-xl">{getAlertIcon(alert.alertType)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!alert.isRead ? 'font-semibold' : ''}`}>
                          {alert.title}
                        </p>
                        {!alert.isRead && (
                          <div className={`h-2 w-2 rounded-full flex-shrink-0 mt-1.5 ${getSeverityColor(alert.severity)}`} />
                        )}
                      </div>
                      {alert.message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {alert.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </span>
                        {alert.pet && (
                          <span className="text-xs text-muted-foreground">• {alert.pet.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {alerts.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setOpen(false);
                window.location.href = '/alerts';
              }}
            >
              View All Alerts
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

