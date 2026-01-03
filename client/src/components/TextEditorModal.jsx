import React, { useMemo, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

const FONT_OPTIONS = [
  { label: 'Inter (English)', value: '"Inter", "Segoe UI", system-ui, sans-serif' },
  { label: 'Poppins (English)', value: '"Poppins", "Inter", system-ui, sans-serif' },
  { label: 'Montserrat (English)', value: '"Montserrat", "Inter", system-ui, sans-serif' },
  { label: 'Georgia (English)', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Times New Roman (English)', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New (English)', value: '"Courier New", Courier, monospace' },
  { label: 'Vazirmatn (Persian)', value: '"Vazirmatn", "Noto Sans Arabic", "Inter", sans-serif' },
  { label: 'Noto Sans Arabic (Persian)', value: '"Noto Sans Arabic", "Vazirmatn", sans-serif' },
  { label: 'Noto Naskh Arabic (Persian)', value: '"Noto Naskh Arabic", "Vazirmatn", serif' },
  { label: 'IRANSans (Persian)', value: '"IRANSans", "Vazirmatn", sans-serif' },
  { label: 'Yekan (Persian)', value: '"Yekan", "Vazirmatn", sans-serif' },
  { label: 'Sahel (Persian)', value: '"Sahel", "Vazirmatn", sans-serif' },
  { label: 'Shabnam (Persian)', value: '"Shabnam", "Vazirmatn", sans-serif' }
];

function normalizeHexInput(value) {
  const trimmed = value.trim();
  const match = trimmed.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return null;
  return `#${match[1].toUpperCase()}`;
}

export default function TextEditorModal({ initialText, onCancel, onSubmit }) {
  const defaultState = useMemo(
    () => ({
      name: 'Text Box',
      content: '',
      color: '#ffffff',
      fontSize: 32,
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      fontWeight: 500,
      isBold: false,
      isItalic: false,
      alignment: 'left',
      textDecoration: 'none',
      backgroundColor: 'transparent',
      textBackgroundColor: 'transparent',
      highlightColor: 'transparent',
      enableHighlight: false,
      lineHeight: 1.3,
      letterSpacing: 0,
      textShadowColor: '#000000',
      textShadowBlur: 0,
      textShadowOffsetX: 0,
      textShadowOffsetY: 0,
      textTransform: 'none',
      caseControl: 'none',
      padding: 16,
      maxWidth: 420,
      maxHeight: 220,
      allowResize: false,
      textOverflow: 'wrap',
      paragraphSpacing: 10,
      verticalAlign: 'top'
    }),
    []
  );

  const [form, setForm] = useState(() => {
    const next = { ...defaultState, ...(initialText || {}) };
    if (!FONT_OPTIONS.some((option) => option.value === next.fontFamily)) {
      next.fontFamily = FONT_OPTIONS[0].value;
    }
    if (!['left', 'right'].includes(next.alignment)) {
      next.alignment = 'left';
    }
    return next;
  });

  const [localColor, setLocalColor] = useState(form.color);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleColorChange = (value) => {
    setLocalColor(value);
    updateForm('color', value);
  };

  const handleColorInputChange = (event) => {
    const nextValue = event.target.value;
    setLocalColor(nextValue);
    const normalized = normalizeHexInput(nextValue);
    if (normalized) {
      updateForm('color', normalized);
    }
  };

  const handleColorInputBlur = () => {
    setLocalColor(form.color);
  };

  const handleSubmit = () => {
    if (!form.content.trim()) {
      onCancel();
      return;
    }
    onSubmit(form);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 140
      }}
    >
      <div
        className="text-editor-panel"
        style={{
          width: '780px',
          maxWidth: '90vw',
          background: 'var(--panel)',
          border: '1px solid color-mix(in srgb, var(--border), transparent 10%)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: 'var(--shadow)',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          backdropFilter: 'blur(14px)'
        }}
      >
        <style>{`
          .text-editor-panel select,
          .text-editor-panel input[type="text"],
          .text-editor-panel input[type="number"] {
            background: var(--panel-2);
            border: 1px solid var(--border);
            color: var(--text-primary);
            border-radius: 10px;
            padding: 8px 10px;
          }
          .text-editor-panel select {
            appearance: none;
            background-image: linear-gradient(45deg, transparent 50%, var(--text-muted) 50%),
              linear-gradient(135deg, var(--text-muted) 50%, transparent 50%);
            background-position: calc(100% - 16px) calc(1em + 2px), calc(100% - 12px) calc(1em + 2px);
            background-size: 4px 4px, 4px 4px;
            background-repeat: no-repeat;
            padding-right: 28px;
          }
          .text-editor-panel input[type="checkbox"] {
            accent-color: var(--accent);
          }
          .text-editor-panel .custom-picker .react-colorful {
            width: 100%;
            height: 140px;
          }
          .text-editor-panel .custom-picker .react-colorful__saturation {
            border-radius: 12px;
            border-bottom: none;
          }
          .text-editor-panel .custom-picker .react-colorful__hue {
            height: 14px;
            border-radius: 12px;
            margin-top: 10px;
          }
          .text-editor-panel .custom-picker .react-colorful__pointer {
            width: 18px;
            height: 18px;
            box-shadow: 0 6px 16px rgba(0,0,0,0.3);
          }
        `}</style>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--text-muted)' }}>IMPORT TEXT</div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '6px' }}>Minimal typography controls</div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
            Manage size, rotation, and coordinates from
            <br />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Text Settings</span>.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '12px' }}>TEXT PREVIEW</div>
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '18px',
                padding: form.padding,
                minHeight: '240px',
                background: 'linear-gradient(145deg, color-mix(in srgb, var(--panel-2), transparent 10%), var(--panel-2))',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <textarea
                value={form.content}
                onChange={(event) => updateForm('content', event.target.value)}
                placeholder="Type your text..."
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  background: 'transparent',
                  color: form.color,
                  fontSize: `${form.fontSize}px`,
                  fontFamily: form.fontFamily,
                  fontWeight: form.isBold ? 700 : form.fontWeight,
                  fontStyle: form.isItalic ? 'italic' : 'normal',
                  textAlign: form.alignment,
                  lineHeight: form.lineHeight,
                  letterSpacing: `${form.letterSpacing}px`,
                  textTransform: form.textTransform,
                  maxWidth: `${form.maxWidth}px`,
                  maxHeight: `${form.maxHeight}px`,
                  overflow: 'auto'
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'grid', gap: '10px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Text Color</label>
              <div style={{ padding: '12px', background: 'var(--panel-2)', borderRadius: '14px', border: '1px solid var(--border)' }}>
                <div className="custom-picker">
                  <HexColorPicker color={normalizeHexInput(localColor) ?? '#FFFFFF'} onChange={handleColorChange} />
                </div>
                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'var(--panel-3)',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: form.color, border: '1px solid var(--border)' }} />
                  <input
                    type="text"
                    value={localColor}
                    onChange={handleColorInputChange}
                    onBlur={handleColorInputBlur}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      width: '100%',
                      outline: 'none',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Font</label>
              <select value={form.fontFamily} onChange={(event) => updateForm('fontFamily', event.target.value)}>
                {FONT_OPTIONS.map((font) => (
                  <option key={font.label} value={font.value}>{font.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Alignment</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {['left', 'right'].map((alignment) => (
                  <button
                    key={alignment}
                    onClick={() => updateForm('alignment', alignment)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: `1px solid ${form.alignment === alignment ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.alignment === alignment ? 'color-mix(in srgb, var(--accent), transparent 75%)' : 'var(--panel-2)',
                      color: form.alignment === alignment ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.6px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {alignment}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Left aligns for English text. Right aligns for Persian text.
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              padding: '10px 28px',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              border: '1px solid transparent',
              color: '#0c0d14',
              padding: '10px 28px',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
}
