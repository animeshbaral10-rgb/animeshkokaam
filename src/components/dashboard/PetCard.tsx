import React from 'react';
import { Switch } from '@/components/ui/switch';

export interface Pet {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'inactive';
  lastSeen: string;
}

interface PetCardProps {
  pet: Pet;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const PetCard: React.FC<PetCardProps> = ({ pet, isEnabled, onToggle }) => {
  const statusColors = {
    online: 'bg-online',
    offline: 'bg-offline',
    inactive: 'bg-inactive',
  };

  const statusLabels = {
    online: 'Online',
    offline: 'Seen',
    inactive: 'Seen',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border animate-fade-in">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${statusColors[pet.status]}`} />
        <div>
          <p className="font-medium text-foreground">{pet.name}</p>
          <p className="text-xs text-muted-foreground">
            {statusLabels[pet.status]} — {pet.lastSeen}
          </p>
        </div>
      </div>
      <Switch checked={isEnabled} onCheckedChange={onToggle} />
    </div>
  );
};
