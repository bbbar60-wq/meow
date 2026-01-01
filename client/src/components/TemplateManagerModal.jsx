import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit3, Plus, Trash2 } from 'lucide-react';

const templateManagerStyles = `
.template-scroll {
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding-right: 6px;
}
.template-scroll::-webkit-scrollbar {
  width: 6px;
}
.template-scroll::-webkit-scrollbar-track {
  background: color-mix(in srgb, var(--panel-2), transparent 50%);
  border-radius: 999px;
}
.template-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent-2), transparent 40%));
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--panel), transparent 60%);
}
.template-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent), white 10%), color-mix(in srgb, var(--accent-2), transparent 20%));
}
.template-scroll {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--accent), transparent 20%) color-mix(in srgb, var(--panel-2), transparent 50%);
}
`;

const MotionDiv = motion.div;

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
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
          <MotionDiv
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              width: '820px',
              maxWidth: '92vw',
              background: 'var(--panel)',
              borderRadius: '24px',
              border: '1px solid var(--border)',
              padding: '22px',
              boxShadow: 'var(--shadow)',
              color: 'var(--text-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <style>{templateManagerStyles}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', letterSpacing: '2px', color: 'var(--text-muted)' }}>TEMPLATES</div>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
            <div className="template-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px' }}>
              {sortedTemplates.map((template) => (
                <div
                  key={template.id}
                  onMouseEnter={() => setHoveredId(template.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    background: 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSelectTemplate?.(template)}
                >
                  <div
                    style={{
                      width: '110px',
                      height: '70px',
                      borderRadius: '12px',
                      background: 'var(--panel-3)',
                      backgroundImage: template.previewUrl ? `url(${template.previewUrl})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid var(--border)'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{template.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Updated {formatDate(template.updatedAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSelectTemplate?.(template);
                      }}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        borderRadius: '10px',
                        padding: '6px 10px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRequestDelete?.(template.id);
                      }}
                      style={{
                        background: hoveredId === template.id ? 'rgba(255, 107, 107, 0.15)' : 'transparent',
                        border: '1px solid var(--border)',
                        color: hoveredId === template.id ? '#ff6b6b' : 'var(--text-secondary)',
                        borderRadius: '10px',
                        padding: '6px 10px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleRequestUpload}
              style={{
                marginTop: '10px',
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                border: 'none',
                color: '#0c0d14',
                padding: '10px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Plus size={16} />
              New Template
            </button>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}
