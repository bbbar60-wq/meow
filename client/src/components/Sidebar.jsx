import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';
import {
  Menu, Image as ImageIcon, Upload, Download, ChevronDown,
  ImagePlus, Palette, Type, Save, Trash2, QrCode, Moon, Sun
} from 'lucide-react';
import useStore from '../store';

const sidebarStyles = `
.custom-picker .react-colorful { width: 100%; height: 120px; }
.custom-picker .react-colorful__saturation { border-radius: 6px; border-bottom: none; }
.custom-picker .react-colorful__hue { height: 12px; border-radius: 6px; margin-top: 8px; }
.custom-picker .react-colorful__pointer { width: 16px; height: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
.sidebar-scroll {
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding-right: 6px;
}
.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}
.sidebar-scroll::-webkit-scrollbar-track {
  background: color-mix(in srgb, var(--panel-2), transparent 50%);
  border-radius: 999px;
}
.sidebar-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent-2), transparent 40%));
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--panel), transparent 60%);
}
.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent), white 10%), color-mix(in srgb, var(--accent-2), transparent 20%));
}
.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--accent), transparent 20%) color-mix(in srgb, var(--panel-2), transparent 50%);
}
`;

export default function Sidebar({
  onOpenTemplateManager,
  onUploadImage,
  onImportIcon,
  images,
  onSelectImage,
  onDeleteImage,
  texts,
  onOpenTextModal,
  onSelectText,
  onDeleteText,
  onSaveTemplate,
  onDeleteTemplate,
  canManageTemplate,
  onOpenQrGenerator
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  const {
    isUploading,
    backgroundColor,
    setBackgroundColor,
    startExport,
    setInteractionMode,
    theme,
    toggleTheme
  } = useStore();

  const toggleSection = (section) => setActiveSection(activeSection === section ? null : section);
  const handleUploadClick = () => {
    setIsOpen(false);
    onOpenTemplateManager();
  };
  const handleExportClick = () => { setIsOpen(false); startExport(); };
  const handleChangeColorClick = () => {
    if (!canManageTemplate) return;
    setInteractionMode('color');
    setIsOpen(false);
  };
  const handleImageUploadClick = () => {
    if (!canManageTemplate) return;
    setIsOpen(false);
    onUploadImage();
  };
  const handleOpenTextClick = () => {
    if (!canManageTemplate) return;
    setIsOpen(false);
    onOpenTextModal();
  };
  const handleOpenQrClick = () => {
    setIsOpen(false);
    onOpenQrGenerator();
  };
  const handleImportIconClick = (icon) => {
    if (!canManageTemplate) return;
    const confirmed = window.confirm(`Import ${icon.label}?`);
    if (!confirmed) return;
    onImportIcon(icon);
    setIsOpen(false);
  };

  // --- OPTIMIZED VARIANTS (Snappy, Premium Feel) ---
  const sidebarVariants = {
    closed: { x: "-100%", transition: { type: "spring", stiffness: 400, damping: 40 } },
    open: { x: 0, transition: { type: "spring", stiffness: 400, damping: 40 } }
  };

  const iconVariants = {
    closed: { rotate: 0 },
    open: { rotate: 90 }
  };

  const iconSections = [
    {
      title: 'Instagram',
      items: ['instagram-colored', 'instagram-black', 'instagram-white']
    },
    {
      title: 'Telegram',
      items: ['telegram-colored', 'telegram-black', 'telegram-white']
    },
    {
      title: 'Whatsapp',
      items: ['whatsapp-colored', 'whatsapp-black', 'whatsapp-white']
    },
    {
      title: 'Linkedin',
      items: ['linkedin-colored', 'linkedin-black', 'linkedin-white']
    },
    {
      title: 'Rubika',
      items: ['rubika-colored', 'rubika-black', 'rubika-white']
    },
    {
      title: 'Website',
      items: ['globe-black', 'globe-white']
    },
    {
      title: 'Catalog',
      items: ['catalog-black', 'catalog-white']
    },
    {
      title: 'Phone',
      items: ['phone-colored', 'phone-black', 'phone-white']
    },
    {
      title: 'Bank Card',
      items: ['bankcard-colored', 'bankcard-black', 'bankcard-white']
    }
  ];

  return (
    <>
      <style>{sidebarStyles}</style>

      {/* 1. MINIMAL TOGGLE */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute', top: '24px', left: '24px',
          zIndex: 50, background: 'transparent',
          border: 'none', padding: 0, cursor: 'pointer',
          color: 'var(--text-primary)', opacity: 0.8, outline: 'none'
        }}
        whileHover={{ opacity: 1, scale: 1.1 }}
      >
        <motion.div variants={iconVariants} animate={isOpen ? "open" : "closed"}>
          <Menu size={20} strokeWidth={1.5} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'var(--overlay)', backdropFilter: 'blur(6px)', zIndex: 40
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial="closed" animate={isOpen ? "open" : "closed"} variants={sidebarVariants}
        style={{
          position: 'fixed', top: 0, left: 0, width: '280px', height: '100vh',
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--panel), transparent 4%), var(--panel))',
          borderRight: '1px solid var(--border)',
          zIndex: 45, padding: '80px 24px 20px 24px',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow)'
        }}
      >
        <motion.button
          onClick={toggleTheme}
          whileHover={{ scale: 1.08, opacity: 0.9 }}
          whileTap={{ scale: 0.96 }}
          style={{
            position: 'absolute',
            top: '24px',
            right: '20px',
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            boxShadow: 'none',
            outline: 'none'
          }}
          aria-label="Toggle theme"
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </motion.div>
        </motion.button>
        <div className="sidebar-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SectionHeader>EDITOR</SectionHeader>
            <SidebarButton
              icon={<ImagePlus size={14} />}
              label="Upload Image"
              onClick={handleImageUploadClick}
              small
              disabled={!canManageTemplate}
              hasArrow={images.length > 0}
              isActive={activeSection === 'images'}
              onArrowClick={images.length > 0 ? () => toggleSection('images') : undefined}
            />
            <AnimatePresence>
              {activeSection === 'images' && images.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px 0 2px 28px' }}>
                    {images.map((image) => (
                      <div
                        key={image.id}
                        onClick={() => { setIsOpen(false); onSelectImage(image.id); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'var(--panel-2)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '6px',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          fontSize: '11px',
                          textAlign: 'left'
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            setIsOpen(false);
                            onSelectImage(image.id);
                          }
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '4px',
                            backgroundImage: `url(${image.url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                          {image.name}
                        </span>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteImage(image.id);
                          }}
                          style={{
                            marginLeft: 'auto',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <SidebarButton icon={<Palette size={14} />} label="Change Color" onClick={handleChangeColorClick} small disabled={!canManageTemplate} />
            <SidebarButton
              icon={<Type size={14} />}
              label="Import Text"
              onClick={handleOpenTextClick}
              small
              disabled={!canManageTemplate}
              hasArrow={texts.length > 0}
              isActive={activeSection === 'texts'}
              onArrowClick={texts.length > 0 ? () => toggleSection('texts') : undefined}
            />
            <AnimatePresence>
              {activeSection === 'texts' && texts.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px 0 2px 28px' }}>
                    {texts.map((text) => (
                      <div
                        key={text.id}
                        onClick={() => { setIsOpen(false); onSelectText(text.id); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'var(--panel-2)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '6px',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          fontSize: '11px',
                          textAlign: 'left'
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            setIsOpen(false);
                            onSelectText(text.id);
                          }
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '4px',
                            background: 'var(--panel-3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: 'var(--text-muted)'
                          }}
                        >
                          T
                        </div>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                          {text.name}
                        </span>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteText(text.id);
                          }}
                          style={{
                            marginLeft: 'auto',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <SidebarButton icon={<ImageIcon size={16} />} label="Environment" onClick={() => toggleSection('background')} isActive={activeSection === 'background'} hasArrow />
            <AnimatePresence>
              {activeSection === 'background' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '12px', background: 'var(--panel-2)', borderRadius: '10px', border: '1px solid var(--border)', marginTop: '4px' }}>
                    <div className="custom-picker"><HexColorPicker color={backgroundColor} onChange={setBackgroundColor} /></div>
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--panel-3)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: backgroundColor, border: '1px solid var(--border)' }} />
                      <input type="text" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '11px', width: '100%', outline: 'none', textTransform: 'uppercase' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <SidebarButton icon={<QrCode size={16} />} label="QR generator" onClick={handleOpenQrClick} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <SidebarButton
              icon={<ImageIcon size={16} />}
              label="Import Icon"
              onClick={() => toggleSection('icons')}
              isActive={activeSection === 'icons'}
              hasArrow
              disabled={!canManageTemplate}
            />
            <AnimatePresence>
              {activeSection === 'icons' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0 6px 14px', borderLeft: '1px solid var(--border)', marginLeft: '12px' }}>
                    {iconSections.map((section) => (
                      <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                          {section.title}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {section.items.map((iconName) => (
                            <motion.button
                              key={iconName}
                              type="button"
                              onClick={() => handleImportIconClick({ label: iconName, url: `/Icon/${iconName}.png` })}
                              whileHover={canManageTemplate ? { scale: 1.03, borderColor: 'var(--accent)', backgroundColor: 'var(--panel-3)' } : {}}
                              whileTap={canManageTemplate ? { scale: 0.98 } : {}}
                              style={{
                                width: '100%',
                                aspectRatio: '1 / 1',
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                background: 'var(--panel-2)',
                                padding: '6px',
                                cursor: canManageTemplate ? 'pointer' : 'not-allowed',
                                opacity: canManageTemplate ? 1 : 0.5,
                                transition: 'transform 0.12s ease, border-color 0.12s ease, background 0.12s ease'
                              }}
                            >
                              <img
                                src={`/Icon/${iconName}.png`}
                                alt={iconName}
                                style={{ width: '82%', height: '82%', objectFit: 'contain', margin: 'auto', display: 'block' }}
                              />
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SectionHeader>SCENE</SectionHeader>
            <SidebarButton
              icon={<Save size={16} />}
              label="SAVE"
              onClick={() => { setIsOpen(false); onSaveTemplate(); }}
              disabled={!canManageTemplate}
            />
            <SidebarButton
              icon={<Trash2 size={16} />}
              label="DELETE"
              onClick={() => { setIsOpen(false); onDeleteTemplate(); }}
              disabled={!canManageTemplate}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SectionHeader>ACTIONS</SectionHeader>
            <SidebarButton
              icon={isUploading ? <LoadingSpinner /> : <Upload size={16} />}
              label={isUploading ? "PROCESSING..." : "IMPORT MODEL"}
              onClick={handleUploadClick}
              primary
              disabled={isUploading}
            />
            <SidebarButton icon={<Download size={16} />} label="EXPORT RENDER" onClick={handleExportClick} />
          </div>
        </div>
      </motion.div>
    </>
  );
}

function SectionHeader({ children }) {
  return <h3 style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '2px', fontWeight: '600', marginBottom: '8px', marginTop: '16px' }}>{children}</h3>;
}

function LoadingSpinner() {
  return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Upload size={16} /></motion.div>;
}

function SidebarButton({ icon, label, onClick, primary = false, disabled = false, isActive = false, hasArrow = false, small = false, onArrowClick }) {
  return (
      <motion.button
        whileHover={!disabled ? { x: 4, backgroundColor: primary ? 'var(--accent)' : 'var(--panel-2)' } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        onClick={onClick} disabled={disabled}
        style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
        padding: small ? '10px 12px' : '14px 16px',
        background: isActive ? 'var(--panel-2)' : (primary ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'transparent'),
        border: primary ? '1px solid transparent' : '1px solid transparent',
        borderRadius: '10px',
        color: primary ? '#0c0d14' : (isActive ? 'var(--text-primary)' : 'var(--text-secondary)'),
        fontSize: small ? '12px' : '13px',
        fontFamily: '"Inter", sans-serif',
        fontWeight: primary ? '600' : '500',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.15s ease',
        textAlign: 'left', letterSpacing: '0.4px',
        outline: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{icon}<span>{label}</span></div>
      {hasArrow && (
        <motion.button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onArrowClick?.();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            boxShadow: 'none',
            outline: 'none'
          }}
        >
          <motion.div animate={{ rotate: isActive ? 180 : 0 }}>
            <ChevronDown size={14} color={isActive ? "var(--text-primary)" : "var(--text-muted)"} />
          </motion.div>
        </motion.button>
      )}
    </motion.button>
  );
}
