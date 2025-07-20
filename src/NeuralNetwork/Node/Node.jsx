import React from "react";
import styles from './Node.module.css';

// value: number between 0 and 1
const Node = ({ value, size }) => {
  // Clamp value between 0 and 1
  const clamped = Math.max(0, Math.min(1, value));
  // Calculate grayscale color
  const gray = Math.round(clamped * 255);
  const fillColor = `rgb(${gray}, ${gray}, ${gray})`;

  return (
    <svg width={size} height={size}>
      <circle
        className={styles.circle}
        cx={size/2}
        cy={size/2}
        r={(size-size/25)/2}
        fill={fillColor}
        stroke="white"
        strokeWidth={size/25}
      />
    </svg>
  );
};

export default Node;