import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const SplitText = ({
  text,
  className = '',
  delay = 100,
  duration = 0.6,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  textAlign = 'center',
  onLetterAnimationComplete,
  style = {}
}) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    const elements = containerRef.current.querySelectorAll('.split-item');
    
    gsap.fromTo(
      elements,
      from,
      {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        onComplete: () => {
          if (onLetterAnimationComplete) {
            onLetterAnimationComplete();
          }
        }
      }
    );
  }, [isVisible, delay, duration, ease, from, to, onLetterAnimationComplete]);

  const splitTextIntoElements = () => {
    if (splitType === 'chars') {
      return text.split('').map((char, index) => (
        <span key={index} className="split-item inline-block" style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ));
    } else if (splitType === 'words') {
      return text.split(' ').map((word, index) => (
        <span key={index} className="split-item inline-block mr-2">
          {word}
        </span>
      ));
    }
  };

  return (
    <div ref={containerRef} className={className} style={{ textAlign, ...style }}>
      {splitTextIntoElements()}
    </div>
  );
};

export default SplitText;