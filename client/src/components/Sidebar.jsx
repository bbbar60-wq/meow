import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';
import {
  Menu, Image as ImageIcon, Upload, Download, Edit3, ChevronDown,
  ImagePlus, Palette, Type
} from 'lucide-react';
import useStore from '../store';

const pickerStyles = `
.custom-picker .react-colorful { width: 100%; height: 120px; }
.custom-picker .react-colorful__saturation { border-radius: 4px; border-bottom: none; }
.custom-picker .react-colorful__hue { height: 12px; border-radius: 4px; margin-top: 8px; }
.custom-picker .react-colorful__pointer { width: 16px; height: 16px; }
`;

export default function Sidebar({ onUpload }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const fileInputRef = useRef(null);

  const { isUploading, backgroundColor, setBackgroundColor, startExport, setInteractionMode } = useStore();

  const toggleSection = (section) => setActiveSection(activeSection === section ? null : section);
  const handleUploadClick = () => fileInputRef.current.click();
  const handleExportClick = () => { setIsOpen(false); startExport(); };
  const handleChangeColorClick = () => { setInteractionMode('color'); setIsOpen(false); };

  // --- OPTIMIZED VARIANTS (Snappy, Premium Feel) ---
  const sidebarVariants = {
    closed: { x: "-100%", transition: { type: "spring", stiffness: 400, damping: 40 } },
    open: { x: 0, transition: { type: "spring", stiffness: 400, damping: 40 } }
  };

  const iconVariants = {
    closed: { rotate: 0 },
    open: { rotate: 90 }
  };

  return (
    <>
      <style>{pickerStyles}</style>

      {/* 1. MINIMAL TOGGLE */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute', top: '24px', left: '24px',
          zIndex: 50, background: 'transparent',
          border: 'none', padding: 0, cursor: 'pointer',
          color: 'white', opacity: 0.8, outline: 'none'
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
              background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)', zIndex: 40
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial="closed" animate={isOpen ? "open" : "closed"} variants={sidebarVariants}
        style={{
          position: 'fixed', top: 0, left: 0, width: '280px', height: '100vh',
          boxSizing: 'border-box',
          background: '#0f0f0f', // Solid dark for better performance than blur
          borderRight: '1px solid #222',
          zIndex: 45, padding: '80px 24px 30px 24px',
          display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SectionHeader>EDITOR</SectionHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <SidebarButton icon={<Edit3 size={16} />} label="Edit Template" onClick={() => toggleSection('template')} isActive={activeSection === 'template'} hasArrow />

            <AnimatePresence>
              {activeSection === 'template' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '12px', marginBottom: '8px', borderLeft: '1px solid #333', marginLeft: '12px' }}>
                    <SidebarButton icon={<ImagePlus size={14} />} label="Upload Image" onClick={() => {}} small />
                    <SidebarButton icon={<Palette size={14} />} label="Change Color" onClick={handleChangeColorClick} small />
                    <SidebarButton icon={<Type size={14} />} label="Import Text" onClick={() => {}} small />
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
                  <div style={{ padding: '12px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333', marginTop: '4px' }}>
                    <div className="custom-picker"><HexColorPicker color={backgroundColor} onChange={setBackgroundColor} /></div>
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: '#000', padding: '6px 10px', borderRadius: '4px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: backgroundColor, border: '1px solid #333' }} />
                      <input type="text" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#888', fontFamily: 'monospace', fontSize: '11px', width: '100%', outline: 'none', textTransform: 'uppercase' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SectionHeader>ACTIONS</SectionHeader>
          <input type="file" ref={fileInputRef} onChange={onUpload} accept=".blend" style={{ display: 'none' }} />
          <SidebarButton icon={isUploading ? <LoadingSpinner /> : <Upload size={16} />} label={isUploading ? "PROCESSING..." : "IMPORT MODEL"} onClick={handleUploadClick} primary disabled={isUploading} />
          <SidebarButton icon={<Download size={16} />} label="EXPORT RENDER" onClick={handleExportClick} />
        </div>
      </motion.div>
    </>
  );
}

function SectionHeader({ children }) {
  return <h3 style={{ color: '#555', fontSize: '10px', letterSpacing: '2px', fontWeight: '500', marginBottom: '8px', marginTop: '16px' }}>{children}</h3>;
}

function LoadingSpinner() {
  return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Upload size={16} /></motion.div>;
}

function SidebarButton({ icon, label, onClick, primary = false, disabled = false, isActive = false, hasArrow = false, small = false }) {
  return (
    <motion.button
      whileHover={!disabled ? { x: 4, backgroundColor: primary ? '#fff' : '#1a1a1a' } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick} disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
        padding: small ? '10px 12px' : '14px 16px',
        background: isActive ? '#1a1a1a' : (primary ? '#fff' : 'transparent'),
        border: '1px solid transparent',
        borderRadius: '6px',
        color: primary ? '#000' : (isActive ? '#fff' : '#888'),
        fontSize: small ? '12px' : '13px',
        fontFamily: '"Inter", sans-serif',
        fontWeight: primary ? '600' : '400',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.1s ease',
        textAlign: 'left', letterSpacing: '0.5px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{icon}<span>{label}</span></div>
      {hasArrow && <motion.div animate={{ rotate: isActive ? 180 : 0 }}><ChevronDown size={14} color={isActive ? "#fff" : "#555"} /></motion.div>}
    </motion.button>
  );
}