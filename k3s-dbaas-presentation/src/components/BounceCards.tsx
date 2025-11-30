import { useEffect, useState } from "react";
import { gsap } from "gsap";

interface BounceCardsProps {
  className?: string;
  images?: string[];
  names: string[];
  containerWidth?: number;
  containerHeight?: number;
  animationDelay?: number;
  animationStagger?: number;
  easeType?: string;
  transformStyles?: string[];
  enableHover?: boolean;
}

export default function BounceCards({
  className = "",
  images = [],
  names = [],
  containerWidth = 1200,
  containerHeight = 350,
  animationDelay = 0.5,
  animationStagger = 0.06,
  easeType = "elastic.out(1, 0.8)",
  transformStyles = [],
  enableHover = false,
}: BounceCardsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    gsap.fromTo(
      ".card-group",
      { scale: 0 },
      {
        scale: 1,
        stagger: animationStagger,
        ease: easeType,
        delay: animationDelay,
      }
    );
  }, [animationDelay, animationStagger, easeType]);

  const getNoRotationTransform = (transformStr: string): string => {
    const hasRotate = /rotate\([\s\S]*?\)/.test(transformStr);
    return hasRotate
      ? transformStr.replace(/rotate\([\s\S]*?\)/, "rotate(0deg)")
      : `${transformStr} rotate(0deg)`;
  };

  const getPushedTransform = (baseTransform: string, offsetX: number): string => {
    const translateRegex = /translate\(([-0-9.]+)px\)/;
    const match = baseTransform.match(translateRegex);
    if (match) {
      const currentX = parseFloat(match[1]);
      const newX = currentX + offsetX;
      return baseTransform.replace(translateRegex, `translate(${newX}px)`);
    }
    return baseTransform === "none"
      ? `translate(${offsetX}px)`
      : `${baseTransform} translate(${offsetX}px)`;
  };

  const pushSiblings = (hoveredIdx: number) => {
    if (!enableHover) return;
    setSelectedIndex(hoveredIdx);

    images.forEach((_, i) => {
      const cardGroupSelector = `.card-group-${i}`;
      const labelSelector = `.label-${i}`;
      const cardSelector = `.card-${i}`;
      const baseTransform = transformStyles[i] || "none";

      gsap.killTweensOf([cardGroupSelector, cardSelector, labelSelector]);

      if (i === hoveredIdx) {
        // Hovered card
        const noRotation = getNoRotationTransform(baseTransform);
        gsap.to(cardGroupSelector, {
          transform: noRotation,
          duration: 0.4,
          ease: "back.out(1.4)",
          overwrite: "auto",
        });
        gsap.to(labelSelector, {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(cardSelector, {
          backgroundColor: "#2A2A2A", // highlight color
          filter: "grayscale(0%) brightness(100%)",
          duration: 0.3,
        });
      } else {
        // Other cards
        const offsetX = i < hoveredIdx ? -160 : 160;
        const pushedTransform = getPushedTransform(baseTransform, offsetX);
        const delay = Math.abs(hoveredIdx - i) * 0.05;

        gsap.to(cardGroupSelector, {
          transform: pushedTransform,
          duration: 0.4,
          ease: "back.out(1.4)",
          delay,
          overwrite: "auto",
        });
        gsap.to(labelSelector, {
          opacity: 0,
          y: 10,
          duration: 0.2,
          ease: "power1.inOut",
        });
        gsap.to(cardSelector, {
          backgroundColor: "#111", // grayed out background
          filter: "grayscale(100%) brightness(60%)",
          duration: 0.3,
        });
      }
    });
  };

  const resetSiblings = () => {
    if (!enableHover) return;
    setSelectedIndex(null);

    images.forEach((_, i) => {
      const cardGroupSelector = `.card-group-${i}`;
      const labelSelector = `.label-${i}`;
      const cardSelector = `.card-${i}`;
      const baseTransform = transformStyles[i] || "none";

      gsap.killTweensOf([cardGroupSelector, cardSelector, labelSelector]);

      gsap.to(cardGroupSelector, {
        transform: baseTransform,
        duration: 0.4,
        ease: "back.out(1.4)",
        overwrite: "auto",
      });
      gsap.to(labelSelector, {
        opacity: 0,
        y: 10,
        duration: 0.2,
        ease: "power1.inOut",
      });
      gsap.to(cardSelector, {
        backgroundColor: "#1C1C1C", // default background
        filter: "grayscale(0%) brightness(100%)",
        duration: 0.3,
      });
    });
  };

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{
        width: containerWidth,
        height: containerHeight,
        overflow: "visible",
      }}
    >
      {images.map((src, idx) => (
        <div
          key={idx}
          className={`card-group card-group-${idx} absolute flex flex-col items-center pointer-events-none`}
          style={{
            transform: transformStyles[idx] || "none",
          }}
        >
          <div
            className={`card card-${idx} relative w-[200px] aspect-square border-8 border-white rounded-[30px] overflow-hidden cursor-pointer pointer-events-auto flex items-center justify-center`}
            onMouseEnter={() => pushSiblings(idx)}
            onMouseLeave={resetSiblings}
            style={{
              backgroundColor: "#1C1C1C", // default
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.25)",
              transition: "background-color 0.3s ease, filter 0.3s ease",
            }}
          >
            <img
              className="w-4/5 h-4/5 object-contain cursor-target"
              src={src}
              alt={`card-${idx}`}
            />
          </div>
          <span
            className={`label-${idx} text-white text-lg font-semibold opacity-0 translate-y-[12px] drop-shadow-md text-center w-[200px]`}
            style={{
              transition: "opacity 0.2s, transform 0.2s",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {names[idx]}
          </span>
        </div>
      ))}
    </div>
  );
}
