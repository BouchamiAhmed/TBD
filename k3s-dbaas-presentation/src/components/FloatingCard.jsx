import React from 'react';

export default function FloatingCard({ title, children }) {
  return (
    <div className="floating-card">
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
