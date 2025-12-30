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
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 100,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div style={{ width: '320px', textAlign: 'center' }}>
            <h2 style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '30px', fontWeight: '400' }}>
              Rendering High-Fidelity
            </h2>
            <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.1)', marginBottom: '40px', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${exportProgress}%` }} style={{ height: '100%', background: '#fff' }} />
            </div>
            <button
              onClick={cancelExport}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', padding: '12px 30px', borderRadius: '50px',
                fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.3s'
              }}
              onMouseOver={(e) => { e.target.style.borderColor = 'white'; e.target.style.background = 'white'; e.target.style.color = 'black'; }}
              onMouseOut={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.background = 'transparent'; e.target.style.color = 'white'; }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
