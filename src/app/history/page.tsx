'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Play, Pause, Download, Trash2 } from 'lucide-react';
import { locationsApi, petsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LeafletMapComponent } from '@/components/map/LeafletMapClient';

interface HistoryRecord {
  id: string;
  time: string;
  latitude: string;
  longitude: string;
  speed: string;
  event: string;
  recordedAt: string;
}

const REPLAY_INTERVAL_MS = 150;
const REPLAY_DURATION_MS = 12000; // full replay over 12 seconds

export default function HistoryPage() {
  const [timelineValue, setTimelineValue] = useState(0);
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState('');
  const [dateRange, setDateRange] = useState('today');
  const [loading, setLoading] = useState(false);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const replayIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPets();
  }, []);

  useEffect(() => {
    if (selectedPet) {
      loadHistory();
    }
  }, [selectedPet, dateRange]);

  const loadPets = async () => {
    try {
      const petsData = await petsApi.getAll().catch(() => []);
      setPets(petsData);
      if (petsData.length > 0) {
        setSelectedPet(petsData[0].id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load pets',
        variant: 'destructive',
      });
    }
  };

  const loadHistory = async () => {
    if (!selectedPet) return;

    try {
      setLoading(true);
      const { startTime, endTime } = getDateRange(dateRange);

      const locations = await locationsApi.getByPet(selectedPet, startTime, endTime);

      const records: HistoryRecord[] = locations
        .map((loc: any) => ({
          id: loc.id,
          time: formatTime(loc.recordedAt || loc.createdAt),
          latitude: loc.latitude?.toString() || '0',
          longitude: loc.longitude?.toString() || '0',
          speed: loc.speed ? `${loc.speed} km/h` : '0 km/h',
          event: 'Location',
          recordedAt: loc.recordedAt || loc.createdAt,
        }))
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

      setHistoryData(records);
      setTimelineValue(0);
      setIsReplayPlaying(false);
      if (replayIntervalRef.current) {
        clearInterval(replayIntervalRef.current);
        replayIntervalRef.current = null;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /** Get start and end ISO strings for the selected range. Uses calendar boundaries (midnight) and fixes yesterday to not include today. */
  const getDateRange = (range: string): { startTime: string; endTime: string } => {
    const now = new Date();
    const toMidnight = (d: Date) => {
      const c = new Date(d);
      c.setHours(0, 0, 0, 0);
      return c;
    };
    const toEndOfDay = (d: Date) => {
      const c = new Date(d);
      c.setHours(23, 59, 59, 999);
      return c;
    };

    switch (range) {
      case 'today': {
        const start = toMidnight(now);
        return { startTime: start.toISOString(), endTime: now.toISOString() };
      }
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const start = toMidnight(yesterday);
        const end = toEndOfDay(yesterday);
        return { startTime: start.toISOString(), endTime: end.toISOString() };
      }
      case 'week': {
        // Start of current week (Sunday 00:00)
        const start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        return { startTime: toMidnight(start).toISOString(), endTime: now.toISOString() };
      }
      case 'last7': {
        const start = new Date(now);
        start.setDate(start.getDate() - 6);
        return { startTime: toMidnight(start).toISOString(), endTime: now.toISOString() };
      }
      case 'month': {
        // First day of current month 00:00
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startTime: start.toISOString(), endTime: now.toISOString() };
      }
      case 'last30': {
        const start = new Date(now);
        start.setDate(start.getDate() - 29);
        return { startTime: toMidnight(start).toISOString(), endTime: now.toISOString() };
      }
      default:
        const start = toMidnight(now);
        return { startTime: start.toISOString(), endTime: now.toISOString() };
    }
  };

  /** Human-readable label for the current range (e.g. "Today · Dec 7" or "Yesterday · Dec 6") */
  const getDateRangeLabel = (range: string): string => {
    const now = new Date();
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: now.getFullYear() !== d.getFullYear() ? 'numeric' : undefined });
    switch (range) {
      case 'today':
        return `Today · ${fmt(now)}`;
      case 'yesterday': {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        return `Yesterday · ${fmt(y)}`;
      }
      case 'week':
        return 'This week (Sun–today)';
      case 'last7':
        return 'Last 7 days';
      case 'month':
        return `This month · ${now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
      case 'last30':
        return 'Last 30 days';
      default:
        return fmt(now);
    }
  };

  const formatTime = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const replayIndex =
    historyData.length === 0
      ? -1
      : Math.min(
          Math.round((timelineValue / 100) * (historyData.length - 1)),
          historyData.length - 1
        );
  const currentReplayRecord = replayIndex >= 0 ? historyData[replayIndex] : null;

  const handleReplayPlayPause = () => {
    if (historyData.length <= 1) return;
    if (isReplayPlaying) {
      if (replayIntervalRef.current) {
        clearInterval(replayIntervalRef.current);
        replayIntervalRef.current = null;
      }
      setIsReplayPlaying(false);
      return;
    }
    setIsReplayPlaying(true);
    const step = 100 / (REPLAY_DURATION_MS / REPLAY_INTERVAL_MS);
    replayIntervalRef.current = setInterval(() => {
      setTimelineValue((v) => {
        const next = v + step;
        if (next >= 100) {
          if (replayIntervalRef.current) {
            clearInterval(replayIntervalRef.current);
            replayIntervalRef.current = null;
          }
          setIsReplayPlaying(false);
          return 100;
        }
        return next;
      });
    }, REPLAY_INTERVAL_MS);
  };

  const handleExportCSV = () => {
    if (historyData.length === 0) {
      toast({
        title: 'No data',
        description: 'No history data to export',
        variant: 'destructive',
      });
      return;
    }

    const csv = [
      ['Time', 'Latitude', 'Longitude', 'Speed', 'Event'],
      ...historyData.map((record) => [
        record.time,
        record.latitude,
        record.longitude,
        record.speed,
        record.event,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pet-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: 'Success', description: 'History exported to CSV' });
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <h1 className="text-2xl font-semibold text-foreground">Location History</h1>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={selectedPet} onValueChange={setSelectedPet}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select pet" />
              </SelectTrigger>
              <SelectContent>
                {pets.map((pet) => (
                  <SelectItem key={pet.id} value={pet.id}>
                    {pet.name || 'Unnamed Pet'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[11rem]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This week (Sun–today)</SelectItem>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="last30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {getDateRangeLabel(dateRange)}
            </span>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-2 gap-6">
            {/* Map Replay */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium text-foreground">Map Replay</h3>
              </div>

              <div className="p-4">
                <LeafletMapComponent
                  markers={
                    currentReplayRecord
                      ? [
                          {
                            id: currentReplayRecord.id,
                            name: currentReplayRecord.time,
                            lat: parseFloat(currentReplayRecord.latitude) || 0,
                            lng: parseFloat(currentReplayRecord.longitude) || 0,
                            color: '#10B981',
                          },
                        ]
                      : []
                  }
                  path={
                    replayIndex >= 0
                      ? historyData
                          .slice(0, replayIndex + 1)
                          .map((r) => ({
                            lat: parseFloat(r.latitude) || 0,
                            lng: parseFloat(r.longitude) || 0,
                          }))
                      : []
                  }
                  center={
                    currentReplayRecord
                      ? {
                          lat: parseFloat(currentReplayRecord.latitude) || 0,
                          lng: parseFloat(currentReplayRecord.longitude) || 0,
                        }
                      : undefined
                  }
                  height="400px"
                  zoom={historyData.length > 0 ? 15 : 13}
                />

                {/* Replay timeline */}
                <div className="mt-4 flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleReplayPlayPause}
                    disabled={historyData.length <= 1}
                    title={isReplayPlaying ? 'Pause' : 'Play replay'}
                  >
                    {isReplayPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[4rem]">
                    {historyData.length > 0 ? historyData[0].time : '--'}
                  </span>
                  <Slider
                    value={[timelineValue]}
                    onValueChange={(values) => setTimelineValue(values[0])}
                    max={100}
                    step={0.1}
                    className="flex-1"
                    disabled={isReplayPlaying}
                  />
                  <span className="text-sm text-muted-foreground min-w-[4rem]">
                    {currentReplayRecord
                      ? currentReplayRecord.time
                      : historyData.length > 0
                        ? historyData[historyData.length - 1].time
                        : '--'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {historyData.length > 0
                    ? `Replay: ${replayIndex + 1} of ${historyData.length} points`
                    : 'Load a pet and date range to see replay'}
                </p>
              </div>
            </div>

            {/* History Details */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium text-foreground">History Details</h3>
              </div>

              <div className="overflow-auto max-h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Latitude</TableHead>
                      <TableHead>Longitude</TableHead>
                      <TableHead>Speed</TableHead>
                      <TableHead>Event</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Loading history...
                        </TableCell>
                      </TableRow>
                    ) : historyData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No history data found
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyData.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-muted-foreground">{record.time}</TableCell>
                          <TableCell className="text-muted-foreground">{record.latitude}</TableCell>
                          <TableCell className="text-muted-foreground">{record.longitude}</TableCell>
                          <TableCell className="text-muted-foreground">{record.speed}</TableCell>
                          <TableCell className="text-muted-foreground">{record.event}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 border-t border-border flex gap-2">
                <Button variant="default" size="sm" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

