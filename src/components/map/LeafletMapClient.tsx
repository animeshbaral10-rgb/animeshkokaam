'use client';

import dynamic from 'next/dynamic';

/**
 * Client-only Leaflet map. Use this instead of LeafletMap to avoid
 * "Cannot read properties of undefined (reading 'call')" and SSR issues.
 */
export const LeafletMapComponent = dynamic(
  () => import('./LeafletMap').then((mod) => mod.LeafletMapComponent),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-muted/30 rounded-lg" style={{ minHeight: 400 }}>
        <span className="text-sm text-muted-foreground">Loading map...</span>
      </div>
    ),
  }
);

export type { MapPathPoint } from './LeafletMap';
