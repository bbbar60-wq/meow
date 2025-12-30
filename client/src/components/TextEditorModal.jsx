import React, { useEffect, useMemo, useState } from 'react';
import ControlRow from './ControlRow';

export default function TextEditorModal({ initialText, onCancel, onSubmit }) {
  const defaultState = useMemo(
    () => ({
      name: 'Text Box',
      content: '',
      color: '#ffffff',
      fontSize: 32,
      fontFamily: 'Inter',
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

  const [form, setForm] = useState(initialText || defaultState);

  useEffect(() => {
    setForm(initialText || defaultState);
  }, [initialText, defaultState]);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
        position: 'absolute',
        inset: 0,
        background: 'var(--overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 80
      }}
    >
      <div
        className="text-editor-panel"
        style={{
          width: '880px',
          maxWidth: '90vw',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: 'var(--shadow)',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <style>{`
          .text-editor-panel select,
          .text-editor-panel input[type="color"],
          .text-editor-panel input[type="text"],
          .text-editor-panel input[type="number"] {
            background: var(--panel-2);
            border: 1px solid var(--border);
            color: var(--text-primary);
            border-radius: 8px;
            padding: 6px 8px;
          }
          .text-editor-panel input[type="checkbox"] {
            accent-color: var(--accent);
          }
        `}</style>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '12px' }}>TEXT BOX</div>
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: form.padding,
                minHeight: '220px',
                background: form.backgroundColor === 'transparent' ? 'var(--panel-2)' : form.backgroundColor,
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
                  resize: form.allowResize ? 'both' : 'none',
                  background: 'transparent',
                  color: form.color,
                  fontSize: `${form.fontSize}px`,
                  fontFamily: form.fontFamily,
                  fontWeight: form.isBold ? 700 : form.fontWeight,
                  fontStyle: form.isItalic ? 'italic' : 'normal',
                  textAlign: form.alignment,
                  textDecoration: form.textDecoration,
                  lineHeight: form.lineHeight,
                  letterSpacing: `${form.letterSpacing}px`,
                  textTransform: form.textTransform,
                  textShadow: `${form.textShadowOffsetX}px ${form.textShadowOffsetY}px ${form.textShadowBlur}px ${form.textShadowColor}`,
                  maxWidth: `${form.maxWidth}px`,
                  maxHeight: `${form.maxHeight}px`,
                  overflow: form.textOverflow === 'ellipsis' ? 'hidden' : 'auto'
                }}
              />
            </div>
          </div>

          <div
            style={{
              width: '240px',
              borderLeft: '1px solid var(--border)',
              paddingLeft: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '520px',
              overflow: 'auto'
            }}
          >
            <ControlRow label="Font Size" value={form.fontSize} min={8} max={200} step={1} onChange={(value) => updateForm('fontSize', value)} allowNegative={false} />
            <ControlRow label="Line Height" value={form.lineHeight} min={0.8} max={3} step={0.05} onChange={(value) => updateForm('lineHeight', value)} allowNegative={false} />
            <ControlRow label="Letter Spacing" value={form.letterSpacing} min={-5} max={20} step={0.1} onChange={(value) => updateForm('letterSpacing', value)} />
            <ControlRow label="Padding" value={form.padding} min={0} max={60} step={1} onChange={(value) => updateForm('padding', value)} allowNegative={false} />
            <ControlRow label="Max Width" value={form.maxWidth} min={120} max={800} step={1} onChange={(value) => updateForm('maxWidth', value)} allowNegative={false} />
            <ControlRow label="Max Height" value={form.maxHeight} min={80} max={500} step={1} onChange={(value) => updateForm('maxHeight', value)} allowNegative={false} />
            <ControlRow label="Paragraph Spacing" value={form.paragraphSpacing} min={0} max={60} step={1} onChange={(value) => updateForm('paragraphSpacing', value)} allowNegative={false} />

            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Text Color</label>
              <input type="color" value={form.color} onChange={(event) => updateForm('color', event.target.value)} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Background Color</label>
              <input type="color" value={form.backgroundColor} onChange={(event) => updateForm('backgroundColor', event.target.value)} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Text Background</label>
              <input type="color" value={form.textBackgroundColor} onChange={(event) => updateForm('textBackgroundColor', event.target.value)} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Highlight Color</label>
              <input type="color" value={form.highlightColor} onChange={(event) => updateForm('highlightColor', event.target.value)} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <input type="checkbox" checked={form.enableHighlight} onChange={(event) => updateForm('enableHighlight', event.target.checked)} />
                Enable Highlighting
              </label>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Font Family</label>
              <select value={form.fontFamily} onChange={(event) => updateForm('fontFamily', event.target.value)}>
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Font Weight</label>
              <select value={form.fontWeight} onChange={(event) => updateForm('fontWeight', Number(event.target.value))}>
                {[300, 400, 500, 600, 700, 800].map((weight) => (
                  <option key={weight} value={weight}>{weight}</option>
                ))}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <input type="checkbox" checked={form.isBold} onChange={(event) => updateForm('isBold', event.target.checked)} />
              Bold
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <input type="checkbox" checked={form.isItalic} onChange={(event) => updateForm('isItalic', event.target.checked)} />
              Italic
            </label>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Alignment</label>
              <select value={form.alignment} onChange={(event) => updateForm('alignment', event.target.value)}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Text Decoration</label>
              <select value={form.textDecoration} onChange={(event) => updateForm('textDecoration', event.target.value)}>
                <option value="none">None</option>
                <option value="underline">Underline</option>
                <option value="line-through">Strikethrough</option>
                <option value="overline">Overline</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Text Transform</label>
              <select value={form.textTransform} onChange={(event) => updateForm('textTransform', event.target.value)}>
                <option value="none">None</option>
                <option value="uppercase">Uppercase</option>
                <option value="lowercase">Lowercase</option>
                <option value="capitalize">Capitalize</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Letter Case Control</label>
              <select value={form.caseControl} onChange={(event) => updateForm('caseControl', event.target.value)}>
                <option value="none">None</option>
                <option value="uppercase">Uppercase</option>
                <option value="lowercase">Lowercase</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Text Overflow</label>
              <select value={form.textOverflow} onChange={(event) => updateForm('textOverflow', event.target.value)}>
                <option value="wrap">Wrap</option>
                <option value="ellipsis">Ellipsis</option>
                <option value="clip">Clip</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Vertical Align</label>
              <select value={form.verticalAlign} onChange={(event) => updateForm('verticalAlign', event.target.value)}>
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <input type="checkbox" checked={form.allowResize} onChange={(event) => updateForm('allowResize', event.target.checked)} />
              Resize Option
            </label>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Text Shadow</label>
              <input type="color" value={form.textShadowColor} onChange={(event) => updateForm('textShadowColor', event.target.value)} />
              <ControlRow label="Shadow Blur" value={form.textShadowBlur} min={0} max={40} step={1} onChange={(value) => updateForm('textShadowBlur', value)} allowNegative={false} />
              <ControlRow label="Shadow X" value={form.textShadowOffsetX} min={-20} max={20} step={1} onChange={(value) => updateForm('textShadowOffsetX', value)} />
              <ControlRow label="Shadow Y" value={form.textShadowOffsetY} min={-20} max={20} step={1} onChange={(value) => updateForm('textShadowOffsetY', value)} />
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
              padding: '10px 24px',
              borderRadius: '10px',
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
              padding: '10px 24px',
              borderRadius: '10px',
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
