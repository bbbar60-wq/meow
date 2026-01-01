import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

const ControlRow = memo(function ControlRow({ label, value, min, max, step, onChange, allowNegative = true }) {
  const [localValue, setLocalValue] = useState(value);
  const rafRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commitValue = useCallback((nextValue) => {
    if (Number.isNaN(nextValue) || nextValue === '') {
      return;
    }
    if (!allowNegative && nextValue < 0) {
      nextValue = 0;
    }
    const clamped = Math.min(max, Math.max(min, nextValue));
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      onChange(clamped);
    });
  }, [allowNegative, max, min, onChange]);

  const handleInputChange = useCallback((event) => {
    const nextValue = Number(event.target.value);
    setLocalValue(event.target.value === '' ? '' : nextValue);
  }, []);

  const handleCommit = useCallback(() => {
    commitValue(typeof localValue === 'string' ? Number(localValue) : localValue);
  }, [commitValue, localValue]);

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px' }}>
        <span>{label}</span>
        <input
          type="number"
          value={localValue}
          min={min}
          max={max}
          step={step}
          onChange={handleInputChange}
          onBlur={handleCommit}
          onFocus={(event) => event.target.select()}
          style={{
            width: '72px',
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '11px',
            padding: '4px 6px'
          }}
        />
      </div>
      <input
        type="range"
        value={localValue}
        min={min}
        max={max}
        step={step}
        onInput={handleInputChange}
        onPointerUp={handleCommit}
        onMouseLeave={handleCommit}
        style={{ width: '100%' }}
      />
    </div>
  );
});

export default ControlRow;
