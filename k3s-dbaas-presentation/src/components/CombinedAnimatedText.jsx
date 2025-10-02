import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const CombinedAnimatedText = ({
  text,
  blurDirection = 'top',
  className = '',
  delay = 0
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chars = containerRef.current.querySelectorAll('.char');
    
    let from = {
      opacity: 0,
      filter: 'blur(10px)',
      scale: 0.8
    };

    switch (blurDirection) {
      case 'top':
        from.y = -30;
        break;
      case 'bottom':
        from.y = 30;
        break;
      case 'left':
        from.x = -30;
        break;
      case 'right':
        from.x = 30;
        break;
      default:
        from.y = -30;
    }

    // Animation GSAP unique pour tous les caractères
    gsap.fromTo(
      chars,
      from,
      {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.2,
        stagger: {
          amount: 0.8,
          from: 'start'
        },
        ease: 'power3.out',
        delay: delay
      }
    );
  }, [blurDirection, delay]);

  return (
    <span ref={containerRef} className={className} style={{ display: 'inline-block' }}>
      {text.split('').map((char, index) => (
        <span 
          key={index} 
          className="char inline-block"
          style={{ 
            whiteSpace: char === ' ' ? 'pre' : 'normal',
            transformOrigin: 'center'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

export default CombinedAnimatedText;