import React from 'react';
import { LeafletMapComponent } from '@/components/map/LeafletMapClient';

interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface LiveMapProps {
  markers: MapMarker[];
  geofences?: any[];
  className?: string;
}

export const LiveMap: React.FC<LiveMapProps> = ({ markers, geofences = [], className = '' }) => {
  const mapGeofences = geofences
    .filter((g) => g.isActive !== false)
    .map((g) => ({
      id: g.id,
      name: g.name || 'Unnamed Geofence',
      centerLatitude: g.centerLatitude != null ? Number(g.centerLatitude) : undefined,
      centerLongitude: g.centerLongitude != null ? Number(g.centerLongitude) : undefined,
      radiusMeters: g.radiusMeters != null ? Number(g.radiusMeters) : g.radius != null ? Number(g.radius) : undefined,
      type: g.type || 'circle',
      polygonCoordinates: g.polygonCoordinates,
      isActive: g.isActive,
      color: '#9333EA',
    }))
    .filter((g) => {
      if (g.type === 'polygon') return g.polygonCoordinates?.length >= 3;
      return g.centerLatitude != null && g.centerLongitude != null && g.radiusMeters != null && g.radiusMeters > 0;
    });

  const mapMarkers = markers.map((m) => ({
    ...m,
    color: '#10B981', // Green color for pet markers
  }));

  return (
    <div className={`overflow-hidden ${className}`.trim()}>
      <LeafletMapComponent
        markers={mapMarkers}
        geofences={mapGeofences}
        height="100%"
        zoom={markers.length > 0 ? 15 : 13}
      />
    </div>
  );
};
