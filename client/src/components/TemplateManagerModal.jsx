import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit3, Plus, Trash2 } from 'lucide-react';

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default function TemplateManagerModal({
  isOpen,
  templates,
  onClose,
  onSelectTemplate,
  onRequestUpload,
  onRequestDelete,
  onOpenTemplate,
  onUploadTemplate,
  onDeleteTemplate
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const handleSelectTemplate = onSelectTemplate ?? onOpenTemplate;
  const handleRequestUpload = onRequestUpload ?? onUploadTemplate;
  const handleRequestDelete = onRequestDelete ?? onDeleteTemplate;

  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [templates]
  );

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
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(10px)',
            zIndex: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              width: '720px',
              maxWidth: '92vw',
              background: '#0d0d0d',
              border: '1px solid #222',
              borderRadius: '18px',
              padding: '24px',
              color: '#eee',
              boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#666' }}>TEMPLATE LIBRARY</div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '6px' }}>Pick a saved template</div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid #222',
                  color: '#777',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflow: 'auto' }}>
              {sortedTemplates.length === 0 && (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px dashed #333',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '12px'
                  }}
                >
                  No templates yet. Upload your first blend file to begin.
                </div>
              )}
              {sortedTemplates.map((template) => (
                <div
                  key={template.id}
                  onMouseEnter={() => setHoveredId(template.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleSelectTemplate?.(template)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSelectTemplate?.(template);
                    }
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '72px 1fr 140px 140px',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #1f1f1f',
                    background: hoveredId === template.id ? '#141414' : '#0f0f0f',
                    transition: 'background 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      width: '72px',
                      height: '56px',
                      borderRadius: '10px',
                      background: '#1b1b1b',
                      border: '1px solid #222',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#555',
                      fontSize: '10px'
                    }}
                  >
                    {template.previewUrl ? (
                      <img src={template.previewUrl} alt={template.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      'Preview'
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#e5e5e5' }}>{template.name}</div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Last edited {formatDate(template.updatedAt)}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#777', textAlign: 'right' }}>
                    {formatDate(template.createdAt)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', opacity: hoveredId === template.id ? 1 : 0.9, transition: 'opacity 0.2s' }}>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSelectTemplate?.(template);
                      }}
                      style={{
                        border: '1px solid #333',
                        background: '#111',
                        color: '#ddd',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px'
                      }}
                    >
                      <Edit3 size={12} />
                      Edit
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRequestDelete?.(template.id);
                      }}
                      style={{
                        border: '1px solid #332222',
                        background: '#160d0d',
                        color: '#ff8c8c',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px'
                      }}
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  handleRequestUpload?.();
                  onClose();
                }}
                style={{
                  background: '#fff',
                  color: '#111',
                  border: '1px solid #fff',
                  borderRadius: '999px',
                  padding: '10px 18px',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                Upload New Template
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
