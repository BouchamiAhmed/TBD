import React from 'react';
import TiltedCard from './TiltedCard';

interface TechLogoProps {
  name: string;
  url: string;
}

export const TechLogo: React.FC<TechLogoProps> = ({ name, url }) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-full overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 p-5 hover:bg-white/10 transition-all">
        <TiltedCard
          imageSrc={url}
          altText={name}
          captionText={name}
          containerHeight="110px"
          containerWidth="110px"
          imageHeight="110px"
          imageWidth="110px"
          scaleOnHover={1.1}
          rotateAmplitude={12}
          showMobileWarning={false}
          showTooltip={false}
        />
      </div>
      <p className="text-white text-xs font-medium text-center">{name}</p>
    </div>
  );
};