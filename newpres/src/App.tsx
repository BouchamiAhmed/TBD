import React from 'react';
import { Presentation } from './components/Presentation';
import { presentationSlides } from './data/slides';

function App() {
  return (
    <div className="w-full h-screen">
      <Presentation 
        slides={presentationSlides}
        autoAdvance={false}
        autoAdvanceTime={10000}
      />
    </div>
  );
}

export default App;