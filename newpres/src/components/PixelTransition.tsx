import React, { useRef, useEffect, useState, CSSProperties } from 'react';
import { gsap } from 'gsap';

interface PixelTransitionProps {
  firstContent: React.ReactNode | string;
  secondContent: React.ReactNode | string;
  gridSize?: number;
  pixelColor?: string;
  animationStepDuration?: number;
  once?: boolean;
  className?: string;
  style?: CSSProperties;
  aspectRatio?: string;
}

const PixelTransition: React.FC<PixelTransitionProps> = ({
  firstContent,
  secondContent,
  gridSize = 20,
  pixelColor = 'currentColor',
  animationStepDuration = 0.6,
  once = false,
  aspectRatio = '100%',
  className = '',
  style = {textAlign: 'center'}
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pixelGridRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);
  const delayedCallRef = useRef<gsap.core.Tween | null>(null);

  const [isActive, setIsActive] = useState<boolean>(false);

  const isTouchDevice =
    'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;

  useEffect(() => {
    const pixelGridEl = pixelGridRef.current;
    if (!pixelGridEl) return;

    pixelGridEl.innerHTML = '';

    // Generate vertical gradient from purple to white (epilepsy-safe)
    const generateVerticalGradient = (row: number): string => {
      // row 0 = top (purple), row max = bottom (white)
      const progress = row / (gridSize - 1); // 0 to 1 from top to bottom

      // Purple at top: hsl(270, 70%, 50%)
      // White at bottom: hsl(270, 0%, 100%)
      const hue = 270; // Purple hue
      const saturation = 70 * (1 - progress); // Decreases from 70% to 0%
      const lightness = 50 + (50 * progress); // Increases from 50% to 100%

      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const pixel = document.createElement('div');
        pixel.classList.add('pixelated-image-card__pixel');
        pixel.classList.add('absolute', 'hidden');

        // Apply vertical gradient color (same color for entire row)
        pixel.style.backgroundColor = generateVerticalGradient(row);
        pixel.style.boxShadow = '0 0 1px rgba(255, 255, 255, 0.2)';
        pixel.style.opacity = '0.95'; // Slightly transparent for softer effect

        const size = 100 / gridSize;
        pixel.style.width = `${size}%`;
        pixel.style.height = `${size}%`;
        pixel.style.left = `${col * size}%`;
        pixel.style.top = `${row * size}%`;

        pixelGridEl.appendChild(pixel);
      }
    }
  }, [gridSize, pixelColor]);

  const animatePixels = (activate: boolean): void => {
    setIsActive(activate);

    const pixelGridEl = pixelGridRef.current;
    const activeEl = activeRef.current;
    if (!pixelGridEl || !activeEl) return;

    const pixels = pixelGridEl.querySelectorAll<HTMLDivElement>('.pixelated-image-card__pixel');
    if (!pixels.length) return;

    gsap.killTweensOf(pixels);
    if (delayedCallRef.current) {
      delayedCallRef.current.kill();
    }

    gsap.set(pixels, { display: 'none', scale: 0, opacity: 0 });

    const totalPixels = pixels.length;
    const staggerDuration = animationStepDuration / totalPixels;

    // Epilepsy-safe animation: smoother with opacity fade
    // Animate pixels appearing with gentle elastic bounce
    gsap.to(pixels, {
      display: 'block',
      scale: 1,
      opacity: 0.95,
      duration: 0.65, // Slightly faster but still safe
      ease: 'elastic.out(1, 0.5)', // Gentler elastic bounce
      stagger: {
        each: staggerDuration,
        from: 'random'
      }
    });

    delayedCallRef.current = gsap.delayedCall(animationStepDuration, () => {
      activeEl.style.display = activate ? 'block' : 'none';
      activeEl.style.pointerEvents = activate ? 'none' : '';
    });

    // Animate pixels disappearing with smooth fade and scale
    gsap.to(pixels, {
      scale: 0,
      opacity: 1,
      duration: 0.55, // Slightly faster exit
      ease: 'power2.in', // Smooth easing instead of elastic for fade out
      delay: animationStepDuration,
      stagger: {
        each: staggerDuration,
        from: 'start'
      },
      onComplete: () => {
        gsap.set(pixels, { display: 'none' });
      }
    });
  };

  const handleEnter = (): void => {
    if (!isActive) animatePixels(true);
  };
  const handleLeave = (): void => {
    if (isActive && !once) animatePixels(false);
  };
  const handleClick = (): void => {
    if (!isActive) animatePixels(true);
    else if (isActive) animatePixels(false);
  };
  return (
    <div
      ref={containerRef}
      className={`
        ${className}
        text-white
        rounded-[15px]
        w-[500px]
        max-w-full
        relative
        overflow-hidden
      `}
      style={style}
 
      onClick={handleClick }

      tabIndex={0}
    >
      <div style={{ paddingTop: aspectRatio }} />

      <div className="absolute inset-0 w-full h-full" aria-hidden={isActive} style={{display: isActive? 'none' : 'block'}}>
        {firstContent}
      </div>

      <div
        ref={activeRef}
        className="absolute inset-0 w-full h-full z-[2]"
        style={{ display: 'none' }}
        aria-hidden={!isActive}
      >
        {secondContent}
      </div>

      <div ref={pixelGridRef} className="absolute inset-0 w-full h-full pointer-events-none z-[3]" />
    </div>
  );
};

export default PixelTransition;