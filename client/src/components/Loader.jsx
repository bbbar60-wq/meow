import React from 'react';
import { Html, useProgress } from '@react-three/drei';

export default function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{
        color: 'var(--text-primary)',
        fontFamily: '"SF Pro Display", "Inter", sans-serif',
        fontSize: '12px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        opacity: 0.8
      }}>
        Loading {progress.toFixed(0)}%
      </div>
    </Html>
  );
}
