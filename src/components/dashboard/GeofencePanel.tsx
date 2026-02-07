import React from 'react';
import { Switch } from '@/components/ui/switch';

interface Geofence {
  id: string;
  name: string;
  isActive: boolean;
}

interface GeofencePanelProps {
  geofences: Geofence[];
  onToggle: (id: string, enabled: boolean) => void;
}

export const GeofencePanel: React.FC<GeofencePanelProps> = ({ geofences, onToggle }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="font-medium text-foreground mb-4">Active Geofences</h3>
      <div className="space-y-3">
        {geofences.map((fence) => (
          <div key={fence.id} className="flex items-center justify-between">
            <span className="text-sm text-foreground">{fence.name}</span>
            <Switch
              checked={fence.isActive}
              onCheckedChange={(checked) => onToggle(fence.id, checked)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
