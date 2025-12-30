import React from 'react';
import ControlRow from './ControlRow';

export default function AssetEditorPanel({ image, onClose, onChange, title, showCornerRadius = false, scaleLabel }) {
  const handlePositionChange = (axis, value) => {
    onChange({ position: { ...image.position, [axis]: value } });
  };

  const handleRotationChange = (axis, value) => {
    onChange({ rotation: { ...image.rotation, [axis]: value } });
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '120px',
        right: '80px',
        zIndex: 60,
        width: '280px',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '14px',
        color: 'var(--text-secondary)',
        fontFamily: '"Inter", sans-serif',
        boxShadow: 'var(--shadow)'
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
        value={image.position.x}
        min={-10}
        max={10}
        step={0.001}
        onChange={(value) => handlePositionChange('x', value)}
      />
      <ControlRow
        label="Y coordinates"
        value={image.position.y}
        min={-10}
        max={10}
        step={0.001}
        onChange={(value) => handlePositionChange('y', value)}
      />
      <ControlRow
        label="Z coordinates"
        value={image.position.z}
        min={-10}
        max={10}
        step={0.001}
        onChange={(value) => handlePositionChange('z', value)}
      />
      <ControlRow
        label="X rotation"
        value={image.rotation.x}
        min={-180}
        max={180}
        step={0.001}
        onChange={(value) => handleRotationChange('x', value)}
      />
      <ControlRow
        label="Y rotation"
        value={image.rotation.y}
        min={-180}
        max={180}
        step={0.001}
        onChange={(value) => handleRotationChange('y', value)}
      />
      <ControlRow
        label="Z rotation"
        value={image.rotation.z}
        min={-180}
        max={180}
        step={0.001}
        onChange={(value) => handleRotationChange('z', value)}
      />
      <ControlRow
        label={scaleLabel}
        value={image.scale}
        min={-10}
        max={10}
        step={0.001}
        onChange={(value) => onChange({ scale: value })}
      />
      {showCornerRadius && (
        <ControlRow
          label="Corner radius"
          value={image.cornerRadius}
          min={0}
          max={50}
          step={1}
          allowNegative={false}
          onChange={(value) => onChange({ cornerRadius: value })}
        />
      )}
    </div>
  );
}
