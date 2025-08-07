import React, { useEffect, useState } from 'react';

export default function Edge({ node1Ref, node2Ref, containerRef, weight, sourceActivation, targetActivation }) {
  const [coordinates, setCoordinates] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });

  // Calculate color based on weight * activation
  const calculateColor = () => {
    // Use sourceActivation for the calculation (weight * activation)
    const weightActivationProduct = weight * sourceActivation;
    
    // Determine color based on sign
    const isPositive = weightActivationProduct >= 0;
    const baseColor = isPositive ? 'blue' : 'red';
    
    // Calculate transparency based on magnitude
    // Higher values = less transparent (more opaque)
    // Minimum transparency of 25% (maximum opacity of 75%)
    const magnitude = Math.abs(weightActivationProduct);
    const maxOpacity = 0.75; // 75% opacity maximum
    const minOpacity = 0.25; // 25% opacity minimum
    
    // Normalize magnitude to 0-1 range, then scale to opacity range
    // You might need to adjust this scaling based on your actual value ranges
    const normalizedMagnitude = Math.min(magnitude, 1); // Cap at 1 for now
    const opacity = minOpacity + (maxOpacity - minOpacity) * normalizedMagnitude;
    
    // Convert to rgba format for proper transparency
    if (isPositive) {
      return `rgba(66, 135, 245, ${opacity})`; // Blue
    } else {
      return `rgba(209, 75, 78, ${opacity})`; // Red
    }
  };

  useEffect(() => {
    const updateCoordinates = () => {
      console.log('Edge updateCoordinates called:', {
        node1Ref: node1Ref?.current,
        node2Ref: node2Ref?.current,
        containerRef: containerRef?.current
      });
      
      if (node1Ref?.current && node2Ref?.current && containerRef?.current) {
        const rect1 = node1Ref.current.getBoundingClientRect();
        const rect2 = node2Ref.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        const x1 = rect1.left - containerRect.left + rect1.width / 2;
        const y1 = rect1.top - containerRect.top + rect1.height / 2;
        const x2 = rect2.left - containerRect.left + rect2.width / 2;
        const y2 = rect2.top - containerRect.top + rect2.height / 2;

        console.log('Calculated coordinates:', { x1, y1, x2, y2 });
        setCoordinates({ x1, y1, x2, y2 });
      }
    };

    // Update coordinates immediately
    updateCoordinates();

    // Update coordinates on window resize
    const handleResize = () => updateCoordinates();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [node1Ref, node2Ref, containerRef]);

  return (
    <line 
      x1={coordinates.x1} 
      y1={coordinates.y1} 
      x2={coordinates.x2} 
      y2={coordinates.y2} 
      stroke={calculateColor()} 
      strokeWidth="1" 
    />
  );
}
