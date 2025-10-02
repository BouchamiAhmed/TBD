import React, { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  currentSlide: number;
  totalSlides: number;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  currentSlide, 
  totalSlides 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const fadeRef = useRef(1); // Track fade animation
  const previousSlideRef = useRef(currentSlide);

  // Color schemes - Blue, Indigo, Dark Pink, Turquoise progression
  const colorSchemes = [
    { primary: '#1e3a8a', secondary: '#3b82f6', tertiary: '#06b6d4' }, // Deep Blue → Blue → Turquoise
    { primary: '#3b82f6', secondary: '#6366f1', tertiary: '#14b8a6' }, // Blue → Indigo → Teal
    { primary: '#4f46e5', secondary: '#8b5cf6', tertiary: '#ec4899' }, // Indigo → Violet → Pink
    { primary: '#6366f1', secondary: '#a855f7', tertiary: '#f472b6' }, // Indigo → Purple → Light Pink
    { primary: '#06b6d4', secondary: '#8b5cf6', tertiary: '#ec4899' }, // Turquoise → Violet → Dark Pink
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const currentScheme = colorSchemes[currentSlide % colorSchemes.length];

    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const color1 = hexToRgb(currentScheme.primary);
    const color2 = hexToRgb(currentScheme.secondary);
    const color3 = hexToRgb(currentScheme.tertiary);

    let time = 0;

    const animate = () => {
      time += 0.002; // Slower movement (was 0.005)

      // Fade animation when slide changes
      if (previousSlideRef.current !== currentSlide) {
        fadeRef.current = 0.5; // Start from black
        previousSlideRef.current = currentSlide;
      }

      // Gradually fade in
      if (fadeRef.current < 1) {
        fadeRef.current += 0.015; // Smooth fade-in speed
      }

      // Clear canvas with slight trail for blur effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'; // Lighter fade for glow trails
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply darkness overlay during transition
      if (fadeRef.current < 1) {
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - fadeRef.current})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Progressive brightness based on slide
      const brightnessBoost = (currentSlide / totalSlides) * 40;

      // Create multiple wave layers with reduced blur
      const waves = [
        { speed: 0.3, amplitude: 180, frequency: 0.002, color: color1, opacity: 0.18, yOffset: 0.2, blur: 5, diagonal: 0.3 }, // CHANGE blur HERE (was 40)
        { speed: 0.25, amplitude: 150, frequency: 0.0025, color: color2, opacity: 0.22, yOffset: 0.4, blur: 2, diagonal: 0.5 }, // CHANGE blur HERE (was 35)
        { speed: 0.35, amplitude: 130, frequency: 0.003, color: color3, opacity: 0.2, yOffset: 0.6, blur: 1, diagonal: 0.7 }, // CHANGE blur HERE (was 30)
        { speed: 0.28, amplitude: 160, frequency: 0.0022, color: color1, opacity: 0.9, yOffset: 0.8, blur: 8, diagonal: 0.4 }, // CHANGE blur HERE (was 45)
      ];

      waves.forEach((wave, index) => {
        // Apply blur filter
        ctx.filter = `blur(${wave.blur}px)`;
        
        ctx.beginPath();
        
        for (let x = 0; x <= canvas.width; x += 3) {
          // Diagonal wave calculation
          const diagonalInfluence = (x / canvas.width) * wave.diagonal;
          
          // Multiple sine waves for complex movement with diagonal emphasis
          const y1 = Math.sin(x * wave.frequency + time * wave.speed + diagonalInfluence * 3) * wave.amplitude;
          const y2 = Math.sin(x * wave.frequency * 1.5 - time * wave.speed * 0.7 + diagonalInfluence * 2) * (wave.amplitude * 0.5);
          const y3 = Math.sin(x * wave.frequency * 0.8 + time * wave.speed * 1.3 - diagonalInfluence * 1.5) * (wave.amplitude * 0.3);
          
          // Add diagonal offset that increases from left to right
          const diagonalOffset = (x / canvas.width) * canvas.height * 0.15 * wave.diagonal;
          
          // Random variation for half-randomized effect
          const randomOffset = Math.sin(x * 0.01 + time + index) * 20 * wave.diagonal;
          
          const y = canvas.height * wave.yOffset + y1 + y2 + y3 + diagonalOffset + randomOffset;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Complete the shape
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();

        // Gradient fill with brightness adjustment and fade
        const gradient = ctx.createLinearGradient(0, canvas.height * wave.yOffset - wave.amplitude, canvas.width, canvas.height);
        
        // Animated hue shift (slower and more subtle)
        const hueShift = Math.sin(time * 0.3 + index) * 15;
        const r = Math.max(0, Math.min(255, wave.color.r + hueShift + brightnessBoost));
        const g = Math.max(0, Math.min(255, wave.color.g + hueShift + brightnessBoost));
        const b = Math.max(0, Math.min(255, wave.color.b + hueShift + brightnessBoost));

        // Apply fade to opacity
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${wave.opacity * fadeRef.current})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${wave.opacity * 0.6 * fadeRef.current})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Reset filter
        ctx.filter = 'none';
      });

      // Add floating orbs with reduced glow for depth
      for (let i = 0; i < 6; i++) {
        const orbX = canvas.width * (0.2 + Math.sin(time * 0.15 + i) * 0.3);
        const orbY = canvas.height * (0.3 + Math.cos(time * 0.2 + i * 1.5) * 0.4);
        const orbSize = 250 + Math.sin(time * 0.5 + i) * 70;

        // Apply lighter glow
        ctx.filter = 'blur(25px)'; // CHANGE blur HERE (was 50px)

        const orbGradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbSize);
        
        const orbColor = i % 3 === 0 ? color1 : i % 3 === 1 ? color2 : color3;
        const hueShift = Math.sin(time * 0.3 + i) * 20;
        const r = Math.max(0, Math.min(255, orbColor.r + hueShift + brightnessBoost));
        const g = Math.max(0, Math.min(255, orbColor.g + hueShift + brightnessBoost));
        const b = Math.max(0, Math.min(255, orbColor.b + hueShift + brightnessBoost));

        // Apply fade to orb opacity
        orbGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.12 * fadeRef.current})`);
        orbGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${0.06 * fadeRef.current})`);
        orbGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = orbGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.filter = 'none';
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentSlide]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};