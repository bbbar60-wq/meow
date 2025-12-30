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
            background: 'var(--overlay)',
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
              background: 'var(--panel)',
              borderRadius: '18px',
              border: '1px solid var(--border)',
              padding: '20px',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div style={{ fontSize: '13px', letterSpacing: '1px', marginBottom: '8px' }}>{title}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={onCancel}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                style={{
                  background: 'linear-gradient(135deg, #ff6b6b, #ffb86b)',
                  border: '1px solid transparent',
                  color: '#0c0d14',
                  padding: '8px 16px',
                  borderRadius: '10px',
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
