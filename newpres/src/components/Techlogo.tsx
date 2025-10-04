import React from 'react';
import { TiltedCard } from './TiltedCard';

interface TechLogoProps {
  name: string;
  url: string;
}

export const TechLogo: React.FC<TechLogoProps> = ({ name, url }) => {
  return (
    <TiltedCard>
      <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all h-full">
        <div className="flex flex-col items-center justify-center space-y-4 h-full">
          {/* Logo */}
          <div className="w-16 h-16 flex items-center justify-center">
            <img 
              src={url} 
              alt={name}
              className="w-full h-full object-contain"
            />
          </div>
          {/* Name */}
          <p className="text-white text-sm font-semibold text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
            {name}
          </p>
        </div>
      </div>
    </TiltedCard>
  );
};