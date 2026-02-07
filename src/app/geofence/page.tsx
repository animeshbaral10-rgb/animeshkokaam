'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { geofencesApi, petsApi, devicesApi, locationsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/useSocket';
import { LeafletMapComponent } from '@/components/map/LeafletMapClient';

const DEVICE_LOCATION_POLL_INTERVAL_MS = 5000;

interface GeofenceItem {
  id: string;
  name: string;
  petId?: string;
  petName?: string;
  type: string;
  radius: number;
  radiusMeters?: number;
  centerLatitude?: number;
  centerLongitude?: number;
  polygonCoordinates?: number[][];
  isActive: boolean;
}

export default function GeofencePage() {
  const [geofences, setGeofences] = useState<GeofenceItem[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState('');
  const [geofenceType, setGeofenceType] = useState('circle');
  const [zoneName, setZoneName] = useState('');
  const [radius, setRadius] = useState(100);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<GeofenceItem | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<number[][]>([]);
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const { toast } = useToast();
  const { socket } = useSocket();

  useEffect(() => {
    loadData();
  }, []);

  // Linked device for selected pet (for real-time updates)
  const linkedDevice = devices.find(
    (d) => d.petLinks?.some((l: any) => l.petId === selectedPet && l.isActive !== false)
  );

  const updateDeviceLocationFromApi = (deviceId: string) => {
    locationsApi
      .getLatestByDevice(deviceId)
      .then((loc: any) => {
        if (loc?.latitude != null && loc?.longitude != null) {
          setDeviceLocation({ lat: Number(loc.latitude), lng: Number(loc.longitude) });
        } else {
          setDeviceLocation(null);
        }
      })
      .catch(() => setDeviceLocation(null));
  };

  // Initial fetch + polling: GPS device location when dialog is open and pet selected
  useEffect(() => {
    if (!dialogOpen || !selectedPet || !linkedDevice?.id) {
      setDeviceLocation(null);
      return;
    }
    updateDeviceLocationFromApi(linkedDevice.id);
    const interval = setInterval(
      () => updateDeviceLocationFromApi(linkedDevice.id),
      DEVICE_LOCATION_POLL_INTERVAL_MS
    );
    return () => clearInterval(interval);
  }, [dialogOpen, selectedPet, linkedDevice?.id]);

  // Real-time WebSocket: update device marker when backend broadcasts a new location for this device
  useEffect(() => {
    if (!dialogOpen || !linkedDevice?.id || !socket) return;
    const onLocationUpdate = (payload: any) => {
      const deviceId = payload?.deviceId ?? payload?.device?.id;
      if (deviceId !== linkedDevice.id) return;
      const lat = payload?.latitude;
      const lng = payload?.longitude;
      if (lat != null && lng != null) {
        setDeviceLocation({ lat: Number(lat), lng: Number(lng) });
      }
    };
    socket.on('location_update', onLocationUpdate);
    return () => {
      socket.off('location_update', onLocationUpdate);
    };
  }, [dialogOpen, linkedDevice?.id, socket]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [geofencesData, petsData, devicesData] = await Promise.all([
        geofencesApi.getAll().catch(() => []),
        petsApi.getAll().catch(() => []),
        devicesApi.getAll().catch(() => []),
      ]);

      setPets(petsData);
      setDevices(devicesData || []);
      setGeofences(geofencesData.map((g: any) => ({
        id: g.id,
        name: g.name || 'Unnamed Geofence',
        petId: g.petId,
        petName: g.pet?.name || '',
        type: g.type || 'circle',
        radius: g.radiusMeters || 100,
        radiusMeters: g.radiusMeters || 100,
        centerLatitude: g.centerLatitude,
        centerLongitude: g.centerLongitude,
        polygonCoordinates: g.polygonCoordinates,
        isActive: g.isActive !== false,
      })));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGeofence = async () => {
    if (!zoneName || !selectedPet) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (geofenceType === 'circle') {
      if (!selectedLocation) {
        toast({
          title: 'Error',
          description: 'Please click on the map to select a location',
          variant: 'destructive',
        });
        return;
      }
    } else if (geofenceType === 'polygon') {
      if (polygonPoints.length < 3) {
        toast({
          title: 'Error',
          description: 'Please add at least 3 points on the map for a polygon',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const geofenceData: any = {
        name: zoneName,
        petId: selectedPet,
        type: geofenceType,
        isActive: true,
      };

      if (geofenceType === 'circle' && selectedLocation) {
        geofenceData.centerLatitude = selectedLocation.lat;
        geofenceData.centerLongitude = selectedLocation.lng;
        geofenceData.radiusMeters = radius;
      } else if (geofenceType === 'polygon') {
        geofenceData.polygonCoordinates = polygonPoints;
      }

      await geofencesApi.create(geofenceData);
      toast({ title: 'Success', description: 'Geofence created successfully' });
      setDialogOpen(false);
      setZoneName('');
      setRadius(100);
      setSelectedPet('');
      setSelectedLocation(null);
      setPolygonPoints([]);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create geofence',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateGeofence = async () => {
    if (!editingGeofence || !zoneName) return;

    try {
      const updateData: any = {
        name: zoneName,
        isActive: editingGeofence.isActive,
      };

      if (editingGeofence.type === 'circle') {
        if (selectedLocation) {
          updateData.centerLatitude = selectedLocation.lat;
          updateData.centerLongitude = selectedLocation.lng;
        }
        updateData.radiusMeters = radius;
      } else if (editingGeofence.type === 'polygon' && polygonPoints.length > 0) {
        updateData.polygonCoordinates = polygonPoints;
      }

      await geofencesApi.update(editingGeofence.id, updateData);
      toast({ title: 'Success', description: 'Geofence updated successfully' });
      setDialogOpen(false);
      setEditingGeofence(null);
      setZoneName('');
      setRadius(100);
      setSelectedLocation(null);
      setPolygonPoints([]);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update geofence',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGeofence = async (id: string) => {
    if (!confirm('Are you sure you want to delete this geofence?')) return;
    try {
      await geofencesApi.delete(id);
      toast({ title: 'Success', description: 'Geofence deleted successfully' });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete geofence',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await geofencesApi.update(id, { isActive: enabled });
      setGeofences((prev) =>
        prev.map((g) => (g.id === id ? { ...g, isActive: enabled } : g))
      );
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update geofence',
        variant: 'destructive',
      });
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (geofenceType === 'circle') {
      setSelectedLocation({ lat, lng });
      setPolygonPoints([]);
    } else if (geofenceType === 'polygon') {
      setPolygonPoints([...polygonPoints, [lat, lng]]);
    }
  };

  const openDialog = (geofence?: GeofenceItem) => {
    if (geofence) {
      setEditingGeofence(geofence);
      setZoneName(geofence.name);
      setRadius(geofence.radius);
      setGeofenceType(geofence.type);
      setSelectedPet(geofence.petId || '');
      if (geofence.centerLatitude && geofence.centerLongitude) {
        setSelectedLocation({ lat: geofence.centerLatitude, lng: geofence.centerLongitude });
      } else {
        setSelectedLocation(null);
      }
      if (geofence.polygonCoordinates && geofence.polygonCoordinates.length > 0) {
        setPolygonPoints(geofence.polygonCoordinates);
      } else {
        setPolygonPoints([]);
      }
    } else {
      setEditingGeofence(null);
      setZoneName('');
      setRadius(100);
      setGeofenceType('circle');
      setSelectedPet('');
      // Default center so user can create without clicking the map (click to change)
      setSelectedLocation({ lat: 27.7172, lng: 85.324 });
      setPolygonPoints([]);
    }
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground">Geofence</h1>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Geofence
            </Button>
          </div>

          {/* Main Content */}
          <div className="bg-card rounded-lg border border-border">
            <div className="flex items-center gap-2 p-4 border-b border-border">
              <Plus className="w-4 h-4" />
              <h3 className="font-medium text-foreground">Geofence List</h3>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground mb-4">
                <span>Name</span>
                <span>Pet</span>
                <span>Type</span>
                <span>Radius</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {geofences.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No geofences found. Create one to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {geofences.map((fence) => (
                    <div key={fence.id} className="grid grid-cols-6 gap-4 items-center">
                      <div className="text-sm text-foreground">{fence.name}</div>
                      <div className="text-sm text-muted-foreground">{fence.petName || '—'}</div>
                      <div className="text-sm text-muted-foreground capitalize">{fence.type}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground w-12">{fence.radius}m</span>
                      </div>
                      <Switch
                        checked={fence.isActive}
                        onCheckedChange={(checked) => handleToggle(fence.id, checked)}
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openDialog(fence)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteGeofence(fence.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Geofence Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setDeviceLocation(null);
          }}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{editingGeofence ? 'Edit Geofence' : 'Create New Geofence'}</DialogTitle>
              <DialogDescription>
                {editingGeofence ? 'Update geofence information' : 'Enter geofence details below'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6 py-4">
              {/* Left side - Form fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="zone-name">Zone Name *</Label>
                  <Input
                    id="zone-name"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    placeholder="Zone name"
                  />
                </div>
                {!editingGeofence && (
                  <>
                    <div>
                      <Label htmlFor="pet-select">Pet *</Label>
                      <Select value={selectedPet} onValueChange={setSelectedPet}>
                        <SelectTrigger>
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
                    </div>
                    <div>
                      <Label>Type</Label>
                      <RadioGroup 
                        value={geofenceType} 
                        onValueChange={(value) => {
                          setGeofenceType(value);
                          setSelectedLocation(null);
                          setPolygonPoints([]);
                        }} 
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="circle" id="circle" />
                          <Label htmlFor="circle" className="font-normal cursor-pointer">Circle</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="polygon" id="polygon" />
                          <Label htmlFor="polygon" className="font-normal cursor-pointer">Polygon</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {geofenceType === 'polygon' && polygonPoints.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPolygonPoints([])}
                        className="w-full"
                      >
                        Clear Polygon Points
                      </Button>
                    )}
                  </>
                )}
                <div>
                  <Label htmlFor="radius">Radius (meters): {radius}m</Label>
                  <Slider
                    value={[radius]}
                    onValueChange={(values) => setRadius(values[0])}
                    max={1000}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </div>
              {/* Right side - Map - only mount when dialog is open to avoid Leaflet _leaflet_pos errors when container is hidden */}
              <div style={{ minHeight: 400 }}>
                {geofenceType === 'circle' && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Click on the map to set the geofence center, or use the default location.
                  </p>
                )}
                {dialogOpen && (
                <LeafletMapComponent
                  active={true}
                  markers={[
                    ...(deviceLocation ? [{
                      id: 'device-location',
                      name: 'GPS device location',
                      lat: deviceLocation.lat,
                      lng: deviceLocation.lng,
                      color: '#2563EB',
                    }] : []),
                    ...(selectedLocation ? [{
                      id: 'preview-marker',
                      name: zoneName || 'Selected Location',
                      lat: selectedLocation.lat,
                      lng: selectedLocation.lng,
                      color: '#9333EA',
                    }] : []),
                  ]}
                  geofences={(() => {
                    const previewGeofence: any = {
                      id: 'preview-geofence',
                      name: zoneName || 'Preview',
                      isActive: true,
                      color: '#9333EA',
                      type: geofenceType,
                    };

                    if (geofenceType === 'circle' && selectedLocation) {
                      previewGeofence.centerLatitude = selectedLocation.lat;
                      previewGeofence.centerLongitude = selectedLocation.lng;
                      previewGeofence.radiusMeters = radius;
                    } else if (geofenceType === 'polygon' && polygonPoints.length > 0) {
                      previewGeofence.polygonCoordinates = polygonPoints;
                    } else {
                      return [];
                    }

                    return [previewGeofence];
                  })()}
                  height="400px"
                  zoom={13}
                  onMapClick={handleMapClick}
                  interactive={true}
                />
                )}
                {geofenceType === 'polygon' && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Click on the map to add polygon points. {polygonPoints.length} point(s) added.
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={editingGeofence ? handleUpdateGeofence : handleCreateGeofence}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}

