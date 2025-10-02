
import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

const AnimatedHeading = ({ text }) => {
  const headingRef = useRef(null);

  useEffect(() => {
    const el = headingRef.current;
    // Split into letters or words
    const split = new SplitType(el, { types: "words, chars", tagName: "span" });
    // Now each char is wrapped in a span

    gsap.from(split.chars, {
      y: 50,
      opacity: 0,
      stagger: 0.03,
      duration: 0.6,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 80%",  // when heading top hits 80% down viewport
        end: "bottom 20%",
        toggleActions: "play none none reverse",
      },
    });

    // Cleanup: kill split & scrolltrigger when component unmounts
    return () => {
      split.revert();
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <h2
      ref={headingRef}
      style={{ overflow: "hidden", display: "inline-block" }}
    >
      {text}
    </h2>
  );
};

export default AnimatedHeading;
