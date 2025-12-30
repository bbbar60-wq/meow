import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ConfirmDialog({ isOpen, title, description, confirmLabel, onCancel, onConfirm }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              width: '380px',
              maxWidth: '90vw',
              background: '#111',
              borderRadius: '14px',
              border: '1px solid #222',
              padding: '20px',
              color: '#eee',
              boxShadow: '0 30px 90px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ fontSize: '13px', letterSpacing: '1px', marginBottom: '8px' }}>{title}</div>
            <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.5 }}>{description}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={onCancel}
                style={{
                  background: 'transparent',
                  border: '1px solid #333',
                  color: '#aaa',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                style={{
                  background: '#ff5c5c',
                  border: '1px solid #ff5c5c',
                  color: '#111',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
