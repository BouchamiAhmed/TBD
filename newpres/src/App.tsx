import React from 'react';
import { Presentation } from './components/Presentation';
import { presentationSlides } from './data/slides';
import TargetCursor from './components/TargetCursor';

function App() {
  return (
    <div className="w-full h-screen">
        <TargetCursor
        spinDuration={2}
        hideDefaultCursor={true}
        parallaxOn={true}
      />
      <Presentation 
        slides={presentationSlides}
        autoAdvance={false}
        autoAdvanceTime={10000}
      />
    </div>
  );
}

export default App;