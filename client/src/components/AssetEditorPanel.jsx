import React, { memo, useCallback, useMemo } from 'react';
import ControlRow from './ControlRow';

const AssetEditorPanel = memo(function AssetEditorPanel({ image, onClose, onChange, title, showCornerRadius = false, scaleLabel }) {
  const position = useMemo(() => image.position ?? { x: 0, y: 0, z: 0 }, [image.position]);
  const rotation = useMemo(() => image.rotation ?? { x: 0, y: 0, z: 0 }, [image.rotation]);
  const scale = Number.isFinite(image.scale) ? image.scale : 1;
  const cornerRadius = Number.isFinite(image.cornerRadius) ? image.cornerRadius : 0;

  const handlePositionChange = useCallback((axis, value) => {
    onChange({ position: { ...position, [axis]: value } });
  }, [onChange, position]);

  const handleRotationChange = useCallback((axis, value) => {
    onChange({ rotation: { ...rotation, [axis]: value } });
  }, [onChange, rotation]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '120px',
        right: '80px',
        zIndex: 120,
        width: '280px',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '14px',
        color: 'var(--text-secondary)',
        fontFamily: '"Inter", sans-serif',
        boxShadow: 'var(--shadow)',
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'var(--text-muted)' }}>{title}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {image.name}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            borderRadius: '8px',
            padding: '4px 8px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>

      <ControlRow
        label="X coordinates"
        value={position.x}
        min={-10}
        max={10}
        step={0.001}
        onChange={(value) => handlePositionChange('x', value)}
      />
      <ControlRow
        label="Y coordinates"
        value={position.y}
        min={-10}
        max={10}
        step={0.001}
        onChange={(value) => handlePositionChange('y', value)}
      />
      <ControlRow
        label="Z coordinates"
        value={position.z}
        min={-10}
        max={10}
        step={0.001}
        onChange={(value) => handlePositionChange('z', value)}
      />
      <ControlRow
        label="X rotation"
        value={rotation.x}
        min={-180}
        max={180}
        step={0.001}
        onChange={(value) => handleRotationChange('x', value)}
      />
      <ControlRow
        label="Y rotation"
        value={rotation.y}
        min={-180}
        max={180}
        step={0.001}
        onChange={(value) => handleRotationChange('y', value)}
      />
      <ControlRow
        label="Z rotation"
        value={rotation.z}
        min={-180}
        max={180}
        step={0.001}
        onChange={(value) => handleRotationChange('z', value)}
      />
      <ControlRow
        label={scaleLabel}
        value={scale}
        min={-10}
        max={10}
        step={0.001}
        onChange={(value) => onChange({ scale: value })}
      />
      {showCornerRadius && (
        <ControlRow
          label="Corner radius"
          value={cornerRadius}
          min={0}
          max={50}
          step={1}
          allowNegative={false}
          onChange={(value) => onChange({ cornerRadius: value })}
        />
      )}
    </div>
  );
});

export default AssetEditorPanel;
