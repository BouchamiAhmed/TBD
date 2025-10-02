import { useState, useEffect, useRef } from 'react';

const DecryptedText = ({
  text,
  speed = 30,
  maxIterations = 8,
  characters = 'ABCD1234!?',
  animateOn = 'view',
  revealDirection = 'start',
  className = '',
  parentClassName = '',
  encryptedClassName = ''
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef(null);
  const intervalRef = useRef(null);

  const getRandomChar = () => {
    return characters[Math.floor(Math.random() * characters.length)];
  };

  const animateText = () => {
    if (isAnimating || (animateOn === 'view' && hasAnimated)) return;
    
    setIsAnimating(true);
    let iteration = 0;
    const textArray = text.split('');
    const totalIterations = textArray.length * 3 + maxIterations; // Augmenté pour plus de durée
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setDisplayText(
        textArray
          .map((char, index) => {
            if (char === ' ') return ' ';
            
            let revealIndex;
            if (revealDirection === 'start') {
              revealIndex = index;
            } else if (revealDirection === 'end') {
              revealIndex = textArray.length - 1 - index;
            } else {
              // center
              const mid = Math.floor(textArray.length / 2);
              revealIndex = Math.abs(index - mid);
            }

            // Ralentir la révélation en multipliant par 4 au lieu de 2
            if (iteration > revealIndex * 4) {
              return char;
            }

            return getRandomChar();
          })
          .join('')
      );

      iteration++;

      if (iteration > totalIterations) {
        clearInterval(intervalRef.current);
        setDisplayText(text);
        setIsAnimating(false);
        if (animateOn === 'view') {
          setHasAnimated(true);
        }
      }
    }, speed);
  };

  useEffect(() => {
    if (animateOn === 'view') {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !hasAnimated) {
            animateText();
          }
        },
        { threshold: 0.5 }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => {
        if (elementRef.current) {
          observer.unobserve(elementRef.current);
        }
      };
    }
  }, [animateOn, hasAnimated]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (animateOn === 'hover') {
      animateText();
    }
  };

  return (
    <span
      ref={elementRef}
      onMouseEnter={handleMouseEnter}
      className={`${parentClassName} ${isAnimating ? encryptedClassName : className}`}
      style={{ fontFamily: 'monospace' }}
    >
      {displayText}
    </span>
  );
};

export default DecryptedText;