import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface TimelineProps {
  value: number;
  onChange: (value: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ value, onChange }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-foreground">Timeline</span>
        <div className="flex-1">
          <Slider
            value={[value]}
            onValueChange={(values) => onChange(values[0])}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
        <Button variant="outline" size="icon">
          <Play className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
