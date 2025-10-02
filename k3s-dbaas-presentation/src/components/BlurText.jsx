import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const BlurText = ({
  text,
  delay = 150,
  animateBy = 'words',
  direction = 'top',
  onAnimationComplete,
  className = ''
}) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    const elements = containerRef.current.querySelectorAll('.blur-item');
    
    let from = {
      opacity: 0,
      filter: 'blur(10px)'
    };

    switch (direction) {
      case 'top':
        from.y = -20;
        break;
      case 'bottom':
        from.y = 20;
        break;
      case 'left':
        from.x = -20;
        break;
      case 'right':
        from.x = 20;
        break;
      default:
        from.y = -20;
    }

    gsap.fromTo(
      elements,
      from,
      {
        opacity: 1,
        y: 0,
        x: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        stagger: delay / 1000,
        ease: 'power3.out',
        onComplete: () => {
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }
      }
    );
  }, [isVisible, delay, direction, onAnimationComplete]);

  const splitText = () => {
    if (animateBy === 'words') {
      return text.split(' ').map((word, index) => (
        <span key={index} className="blur-item inline-block mr-2">
          {word}
        </span>
      ));
    } else if (animateBy === 'characters') {
      return text.split('').map((char, index) => (
        <span key={index} className="blur-item inline-block" style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ));
    } else {
      // lines
      return text.split('\n').map((line, index) => (
        <div key={index} className="blur-item">
          {line}
        </div>
      ));
    }
  };

  return (
    <div ref={containerRef} className={className}>
      {splitText()}
    </div>
  );
};

export default BlurText;