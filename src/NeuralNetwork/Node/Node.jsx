import React from "react";
import styles from './Node.module.css';

// value: number between 0 and 1
const Node = ({ value }) => {
  // Clamp value between 0 and 1
  const clamped = Math.max(0, Math.min(1, value));
  // Calculate grayscale color
  const gray = Math.round(clamped * 255);
  const fillColor = `rgb(${gray}, ${gray}, ${gray})`;

  return (
    <svg width="50" height="50">
      <circle
        cx="25"
        cy="25"
        r="24"
        fill={fillColor}
        stroke="white"
        strokeWidth="2"
      />
    </svg>
  );
};

export default Node;