import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useStore from '../store';

export default function ExportOverlay() {
  const { isExporting, exportProgress, cancelExport } = useStore();
  return (
    <AnimatePresence>
      {isExporting && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'color-mix(in srgb, var(--panel), transparent 10%)', backdropFilter: 'blur(24px)', zIndex: 100,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div style={{ width: '320px', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text-primary)', fontFamily: 'sans-serif', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '30px', fontWeight: '500' }}>
              Rendering High-Fidelity
            </h2>
            <div style={{ width: '100%', height: '4px', background: 'color-mix(in srgb, var(--panel-2), transparent 30%)', marginBottom: '40px', overflow: 'hidden', borderRadius: '999px' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${exportProgress}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />
            </div>
            <button
              onClick={cancelExport}
              style={{
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text-primary)', padding: '12px 30px', borderRadius: '50px',
                fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.3s'
              }}
              onMouseOver={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'var(--accent)'; e.target.style.color = '#0c0d14'; }}
              onMouseOut={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-primary)'; }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
