import React from 'react';

interface PetIconProps {
  className?: string;
}

export const PetIcon: React.FC<PetIconProps> = ({ className = "w-12 h-12" }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="8"
        y="8"
        width="48"
        height="48"
        rx="8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="24" cy="28" r="4" fill="currentColor" />
      <circle cx="40" cy="28" r="4" fill="currentColor" />
      <ellipse cx="32" cy="38" rx="6" ry="4" fill="currentColor" />
      <circle cx="20" cy="14" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="44" cy="14" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
};

export const PetPawIcon: React.FC<PetIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <ellipse cx="12" cy="17" rx="5" ry="4" fill="currentColor" />
      <circle cx="7" cy="10" r="2.5" fill="currentColor" />
      <circle cx="17" cy="10" r="2.5" fill="currentColor" />
      <circle cx="10" cy="6" r="2" fill="currentColor" />
      <circle cx="14" cy="6" r="2" fill="currentColor" />
    </svg>
  );
};
