'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polygon, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color?: string;
}

interface Geofence {
  id: string;
  name: string;
  centerLatitude?: number;
  centerLongitude?: number;
  radiusMeters?: number;
  polygonCoordinates?: number[][];
  type?: 'circle' | 'polygon';
  isActive: boolean;
  color?: string;
}

/** Optional path to draw as a line (e.g. history replay route) */
export interface MapPathPoint {
  lat: number;
  lng: number;
}

interface LeafletMapProps {
  markers?: MapMarker[];
  geofences?: Geofence[];
  /** Path points to draw as a polyline (e.g. history replay) */
  path?: MapPathPoint[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  onGeofenceClick?: (geofence: Geofence) => void;
  onMapClick?: (lat: number, lng: number) => void;
  interactive?: boolean;
  /** When true (e.g. dialog opened), invalidate map size so clicks and tiles work correctly */
  active?: boolean;
}

const defaultCenter = { lat: 27.7172, lng: 85.3240 }; // Default to Kathmandu, Nepal
const defaultZoom = 13;

// Component to handle map center updates. Uses current map zoom so user zoom is not reset (e.g. during history replay).
function MapCenter({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  const isFirst = React.useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      map.setView([center.lat, center.lng], zoom);
    } else {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [map, center, zoom]);
  return null;
}

// When map is shown inside a dialog, invalidate size so it receives clicks and renders correctly
function MapInvalidateSize({ active }: { active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => {
      try {
        const container = map.getContainer();
        if (container?.isConnected) {
          map.invalidateSize();
        }
      } catch (_) {
        // ignore when container is detached (e.g. dialog closed) to avoid _leaflet_pos errors
      }
    }, 150);
    return () => clearTimeout(id);
  }, [map, active]);
  return null;
}

// Component to handle map clicks
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Custom marker icon creator
const createCustomIcon = (color: string = '#10B981') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 16px;
      ">📍</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const LeafletMapComponent: React.FC<LeafletMapProps> = ({
  markers = [],
  geofences = [],
  path = [],
  center,
  zoom = defaultZoom,
  height = '400px',
  onMarkerClick,
  onGeofenceClick,
  onMapClick,
  interactive = true,
  active = true,
}) => {
  const mapCenter = center || (markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : defaultCenter);
  const mapZoom = markers.length > 0 ? 15 : zoom;
  const pathPositions = path.length > 0 ? path.map((p) => [p.lat, p.lng] as [number, number]) : [];

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapCenter center={mapCenter} zoom={mapZoom} />
        <MapInvalidateSize active={active} />
        
        {interactive && onMapClick && <MapClickHandler onMapClick={onMapClick} />}

        {/* Path (e.g. history replay route) */}
        {pathPositions.length > 1 && (
          <Polyline
            positions={pathPositions}
            pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.7 }}
          />
        )}

        {/* Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={createCustomIcon(marker.color || '#10B981')}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(marker);
                }
              },
            }}
          >
            <Popup>
              <div className="text-sm font-medium">{marker.name}</div>
            </Popup>
          </Marker>
        ))}

        {/* Geofences */}
        {geofences.map((geofence) => {
          const type = geofence.type || 'circle';
          
          if (type === 'polygon' && geofence.polygonCoordinates && geofence.polygonCoordinates.length > 0) {
            return (
              <Polygon
                key={geofence.id}
                positions={geofence.polygonCoordinates as [number, number][]}
                pathOptions={{
                  color: geofence.color || '#9333EA',
                  fillColor: geofence.color || '#9333EA',
                  fillOpacity: 0.2,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => {
                    if (onGeofenceClick) {
                      onGeofenceClick(geofence);
                    }
                  },
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-medium">{geofence.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">Polygon</div>
                  </div>
                </Popup>
              </Polygon>
            );
          }
          
          if (type === 'circle' && geofence.centerLatitude && geofence.centerLongitude && geofence.radiusMeters) {
            return (
              <Circle
                key={geofence.id}
                center={[geofence.centerLatitude, geofence.centerLongitude]}
                radius={geofence.radiusMeters}
                pathOptions={{
                  color: geofence.color || '#9333EA',
                  fillColor: geofence.color || '#9333EA',
                  fillOpacity: 0.2,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => {
                    if (onGeofenceClick) {
                      onGeofenceClick(geofence);
                    }
                  },
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-medium">{geofence.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Radius: {geofence.radiusMeters}m
                    </div>
                  </div>
                </Popup>
              </Circle>
            );
          }
          
          return null;
        })}
      </MapContainer>
    </div>
  );
};

