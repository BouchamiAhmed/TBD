import React, { useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const MIN_SCALE = 1;
  const MAX_SCALE = 5;
  const ZOOM_STEP = 0.2;

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newScale = Math.min(Math.max(scale + delta, MIN_SCALE), MAX_SCALE);

    if (newScale !== scale) {
      // Zoom towards mouse position
      const scaleChange = newScale / scale;
      const newX = mouseX - (mouseX - position.x) * scaleChange;
      const newY = mouseY - (mouseY - position.y) * scaleChange;

      setScale(newScale);
      setPosition({ x: newX, y: newY });
    }
  };

  // Mouse down - start drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  // Mouse move - drag
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  // Mouse up - end drag
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom in button
  const zoomIn = () => {
    const newScale = Math.min(scale + ZOOM_STEP, MAX_SCALE);
    setScale(newScale);
  };

  // Zoom out button
  const zoomOut = () => {
    const newScale = Math.max(scale - ZOOM_STEP, MIN_SCALE);
    setScale(newScale);
    
    // Reset position when fully zoomed out
    if (newScale === MIN_SCALE) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Reset button
  const reset = () => {
    setScale(MIN_SCALE);
    setPosition({ x: 0, y: 0 });
  };

  // Get cursor style
  const getCursor = () => {
    if (isDragging) return 'grabbing';
    if (scale > 1) return 'grab';
    return 'zoom-in';
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: getCursor() }}
    >
      {/* Image */}
      <img
        src={src}
        alt={alt}
        className="max-w-full h-auto rounded-2xl shadow-2xl border border-white/20 select-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
        draggable={false}
      />

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-black/60 backdrop-blur-md rounded-lg p-2 border border-white/20">
        {/* Zoom In */}
        <button
          onClick={zoomIn}
          disabled={scale >= MAX_SCALE}
          className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
          title="Zoom In (Scroll Up)"
        >
          <ZoomIn className="w-5 h-5 text-white" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={zoomOut}
          disabled={scale <= MIN_SCALE}
          className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
          title="Zoom Out (Scroll Down)"
        >
          <ZoomOut className="w-5 h-5 text-white" />
        </button>

        {/* Reset */}
        <button
          onClick={reset}
          disabled={scale === MIN_SCALE}
          className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
          title="Reset Zoom"
        >
          <Maximize2 className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Zoom Level Indicator */}
      {scale > 1 && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20">
          <span className="text-white text-sm font-semibold">
            {Math.round(scale * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};