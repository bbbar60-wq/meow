import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';

const DEFAULT_STATE = {
  content: 'https://your-link.com',
  logoSize: 22,
  logoCornerRadius: 12,
  qrSize: 520
};

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function fetchQrImage(content, size, signal) {
  const url = new URL('https://api.qrserver.com/v1/create-qr-code/');
  url.searchParams.set('data', content || ' ');
  url.searchParams.set('size', `${size}x${size}`);
  url.searchParams.set('ecc', 'H');
  url.searchParams.set('margin', '2');
  url.searchParams.set('format', 'png');
  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    throw new Error('QR generation failed');
  }
  const blob = await response.blob();
  return createImageBitmap(blob);
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function QRGeneratorModal({ isOpen, onClose, onCreate }) {
  const [content, setContent] = useState(DEFAULT_STATE.content);
  const [logoImage, setLogoImage] = useState(null);
  const [logoSize, setLogoSize] = useState(DEFAULT_STATE.logoSize);
  const [logoCornerRadius, setLogoCornerRadius] = useState(DEFAULT_STATE.logoCornerRadius);
  const [qrSize, setQrSize] = useState(DEFAULT_STATE.qrSize);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);

  const normalizedContent = useMemo(() => content.trim(), [content]);

  useEffect(() => {
    if (!isOpen) return;
    setContent(DEFAULT_STATE.content);
    setLogoImage(null);
    setLogoSize(DEFAULT_STATE.logoSize);
    setLogoCornerRadius(DEFAULT_STATE.logoCornerRadius);
    setQrSize(DEFAULT_STATE.qrSize);
    setPreviewUrl(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        setIsGenerating(true);
        const qrBitmap = await fetchQrImage(normalizedContent, qrSize, controller.signal);
        const canvas = document.createElement('canvas');
        canvas.width = qrSize;
        canvas.height = qrSize;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, qrSize, qrSize);
        ctx.drawImage(qrBitmap, 0, 0, qrSize, qrSize);

        if (logoImage) {
          const logo = await loadImage(logoImage);
          if (logo) {
            const logoScale = logoSize / 100;
            const logoDim = qrSize * logoScale;
            const logoX = (qrSize - logoDim) / 2;
            const logoY = (qrSize - logoDim) / 2;
            const padding = logoDim * 0.08;

            ctx.save();
            ctx.fillStyle = '#ffffff';
            drawRoundedRect(ctx, logoX - padding, logoY - padding, logoDim + padding * 2, logoDim + padding * 2, logoCornerRadius);
            ctx.fill();

            ctx.beginPath();
            drawRoundedRect(ctx, logoX, logoY, logoDim, logoDim, logoCornerRadius);
            ctx.clip();
            ctx.drawImage(logo, logoX, logoY, logoDim, logoDim);
            ctx.restore();
          }
        }

        if (!cancelled) {
          setPreviewUrl(canvas.toDataURL('image/png'));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('QR preview failed', error);
          if (!cancelled) {
            setPreviewUrl(null);
          }
        }
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
        }
      }
    }, 120);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [normalizedContent, logoImage, logoCornerRadius, logoSize, qrSize, isOpen]);

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCreate = () => {
    if (!previewUrl) return;
    onCreate(previewUrl);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        backdropFilter: 'blur(10px)',
        zIndex: 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '920px',
          maxWidth: '96vw',
          background: 'var(--panel)',
          borderRadius: '22px',
          border: '1px solid var(--border)',
          padding: '24px',
          color: 'var(--text-primary)',
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: '24px',
          boxShadow: 'var(--shadow)'
        }}
      >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          <section style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', background: 'var(--panel-2)' }}>
            <div style={{ fontSize: '12px', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '10px' }}>CONTENT</div>
            <input
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Paste a URL or text"
              style={{
                width: '100%',
                background: 'var(--panel-3)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            />
          </section>

          <section style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', background: 'var(--panel-2)' }}>
            <div style={{ fontSize: '12px', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>CENTER LOGO</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: 'var(--panel-3)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                <Upload size={14} />
                Upload logo
              </button>
              {logoImage ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  <ImageIcon size={14} />
                  Logo ready
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>PNG / JPG / GIF</div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
              <ControlRow label={`Logo Size (${logoSize}%)`}>
                <input type="range" min="10" max="40" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} />
              </ControlRow>
              <ControlRow label={`Logo Corner Radius (${logoCornerRadius}px)`}>
                <input type="range" min="0" max="40" value={logoCornerRadius} onChange={(e) => setLogoCornerRadius(Number(e.target.value))} />
              </ControlRow>
              <ControlRow label={`QR Size (${qrSize}px)`}>
                <input type="range" min="220" max="1200" value={qrSize} onChange={(e) => setQrSize(Number(e.target.value))} />
              </ControlRow>
            </div>
          </section>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={onClose}
              style={{
                minWidth: '160px',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                borderRadius: '12px',
                padding: '12px 18px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              style={{
                minWidth: '160px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                border: '1px solid transparent',
                color: '#0c0d14',
                borderRadius: '12px',
                padding: '12px 18px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Create
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            ref={previewRef}
            style={{
              background: 'var(--panel-2)',
              borderRadius: '18px',
              border: '1px solid var(--border)',
              padding: '20px',
              minHeight: '420px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="QR preview" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px' }} />
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{isGenerating ? 'Generating...' : 'Preview unavailable'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '11px', letterSpacing: '1px', color: 'var(--text-muted)' }}>{label}</label>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>{children}</div>
    </div>
  );
}
