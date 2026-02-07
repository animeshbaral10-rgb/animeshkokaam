import React from 'react';
import { PetPawIcon } from '@/components/icons/PetIcon';

interface Alert {
  id: string;
  petName: string;
  type: string;
  time: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="font-medium text-foreground mb-4">Recent Alerts</h3>
      <div className="flex gap-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-2">
              <PetPawIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-foreground font-medium">{alert.petName}</span>
            <span className="text-xs text-muted-foreground">{alert.type}</span>
            <span className="text-xs text-muted-foreground">{alert.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
