'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { PetCard, Pet } from '@/components/dashboard/PetCard';
import { LiveMap } from '@/components/dashboard/LiveMap';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { petsApi, geofencesApi, alertsApi, locationsApi, devicesApi } from '@/lib/api';

export default function DashboardPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [petStates, setPetStates] = useState<Record<string, boolean>>({});
  const [geofences, setGeofences] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [petsData, geofencesData, alertsData] = await Promise.all([
        petsApi.getAll().catch(() => []),
        geofencesApi.getAll().catch(() => []),
        alertsApi.getAll().catch(() => []),
      ]);

      setPets(petsData.map((pet: any) => ({
        id: pet.id,
        name: pet.name || 'Unnamed Pet',
        status: getPetStatus(pet),
        lastSeen: formatLastSeen(pet),
      })));

      setPetStates(
        petsData.reduce((acc: Record<string, boolean>, pet: any) => {
          acc[pet.id] = true;
          return acc;
        }, {})
      );

      setGeofences(geofencesData.map((g: any) => ({
        id: g.id,
        name: g.name || 'Unnamed Geofence',
        isActive: g.isActive !== false,
        centerLatitude: g.centerLatitude != null ? Number(g.centerLatitude) : undefined,
        centerLongitude: g.centerLongitude != null ? Number(g.centerLongitude) : undefined,
        radiusMeters: g.radiusMeters != null ? Number(g.radiusMeters) : undefined,
        type: g.type || 'circle',
        polygonCoordinates: g.polygonCoordinates,
      })));

      setRecentAlerts(alertsData.slice(0, 3).map((alert: any) => ({
        id: alert.id,
        petName: alert.pet?.name || 'Unknown Pet',
        type: alert.alertType || 'Alert',
        time: formatAlertTime(alert.createdAt),
      })));

      // Load locations for map markers
      await loadMapMarkers(petsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMapMarkers = async (petsData: any[]) => {
    try {
      const devicesData = await devicesApi.getAll().catch(() => []);
      const markers: any[] = [];

      for (const pet of petsData) {
        // Find linked device for pet
        const deviceLink = devicesData.find((d: any) => 
          d.petLinks?.some((link: any) => link.petId === pet.id && link.isActive)
        );
        
        if (deviceLink) {
          try {
            const location = await locationsApi.getLatestByDevice(deviceLink.id);
            if (location && location.latitude && location.longitude) {
              markers.push({
                id: pet.id,
                name: pet.name || 'Unnamed Pet',
                lat: parseFloat(location.latitude),
                lng: parseFloat(location.longitude),
              });
            }
          } catch (error) {
            // No location data for this device
          }
        }
      }

      setMapMarkers(markers);
    } catch (error) {
      console.error('Failed to load map markers:', error);
    }
  };

  const getPetStatus = (pet: any): 'online' | 'offline' | 'inactive' => {
    // This would need device data to determine actual status
    // For now, default to offline
    return 'offline';
  };

  const formatLastSeen = (pet: any): string => {
    if (pet.updatedAt) {
      const date = new Date(pet.updatedAt);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return 'Never';
  };

  const formatAlertTime = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handlePetToggle = (id: string, enabled: boolean) => {
    setPetStates((prev) => ({ ...prev, [id]: enabled }));
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        {/* Map fills area between header and footer; panels overlay on top */}
        <div className="relative -m-4 md:-m-6 flex-1 min-h-0">
          <div className="absolute inset-0">
            <LiveMap
              markers={mapMarkers}
              geofences={geofences}
              className="h-full w-full"
            />
          </div>
          {/* Floating panels above map (z-index above Leaflet's 400–1000 but below dropdowns/popovers) */}
          <div className="absolute inset-0 z-[1050] grid grid-cols-12 gap-6 p-4 md:p-6 pointer-events-none">
            <div className="col-span-3 flex flex-col pointer-events-auto">
              <div className="bg-card rounded-xl border border-border p-4 shadow-xl">
                <h3 className="font-medium text-foreground mb-4">My Pets</h3>
                <div className="space-y-3">
                  {pets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No pets found. Add a pet to get started.
                    </p>
                  ) : (
                    pets.map((pet) => (
                      <PetCard
                        key={pet.id}
                        pet={pet}
                        isEnabled={petStates[pet.id] ?? true}
                        onToggle={(enabled) => handlePetToggle(pet.id, enabled)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-6" />
            <div className="col-span-3 flex flex-col pointer-events-auto">
              <div className="rounded-xl shadow-xl overflow-hidden">
                <AlertsPanel alerts={recentAlerts} />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

