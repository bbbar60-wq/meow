import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, useProgress, GizmoHelper, GizmoViewport, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, SSAO, ToneMapping } from '@react-three/postprocessing';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { CheckCircle2, Cloud } from 'lucide-react';

import useStore from './store';
import ModelViewer from './components/ModelViewer';
import Sidebar from './components/Sidebar';
import ExportEngine from './components/ExportEngine';
import TemplateManagerModal from './components/TemplateManagerModal';

// --- MINIMAL LOADER ---
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{
        color: 'white',
        fontFamily: '"SF Pro Display", "Inter", sans-serif',
        fontSize: '12px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        opacity: 0.8
      }}>
        Loading {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

// --- EXPORT OVERLAY ---
function ExportOverlay() {
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

function App() {
  const {
    modelUrl,
    setModelUrl,
    setUploading,
    setError,
    backgroundColor,
    interactionMode,
    setInteractionMode,
    setBackgroundColor
  } = useStore();
  const imageInputRef = useRef(null);
  const templateInputRef = useRef(null);
  const rendererRef = useRef(null);
  const [images, setImages] = useState([]);
  const [activeImageId, setActiveImageId] = useState(null);
  const [texts, setTexts] = useState([]);
  const [activeTextId, setActiveTextId] = useState(null);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);
  const [materialOverrides, setMaterialOverrides] = useState({});
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const saveTimeoutRef = useRef(null);
  const templateDataRef = useRef({});
  const api = useMemo(() => axios.create({ baseURL: 'http://localhost:5000' }), []);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await api.get('/templates');
        setTemplates(response.data);
      } catch (error) {
        console.error('Failed to load templates', error);
      }
    };
    loadTemplates();
  }, [api]);

  useEffect(() => {
    templateDataRef.current = {
      modelUrl,
      backgroundColor,
      images,
      texts,
      materialOverrides
    };
  }, [modelUrl, backgroundColor, images, texts, materialOverrides]);

  const uploadBlendFile = async (file) => {
    if (!file.name.endsWith('.blend')) {
      alert("Please upload a .blend file");
      return null;
    }
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.url;
    } catch (err) {
      console.error(err);
      alert("Failed to process file.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleRequestImageUpload = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    let objectUrl = null;
    try {
      objectUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Failed to read image file', error);
      event.target.value = '';
      return;
    }
    const newImage = {
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      url: objectUrl,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: -90, y: 0, z: 0 },
      scale: 1,
      cornerRadius: 0
    };
    setImages((prev) => [...prev, newImage]);
    setActiveImageId(null);
    event.target.value = '';
  };

  useEffect(() => {
    setActiveImageId(null);
    setActiveTextId(null);
  }, [interactionMode]);

  // --- BACKGROUND CLICK HANDLER ---
  const handleCanvasMiss = () => {
    if (interactionMode === 'color') {
      // User clicked background -> Exit color mode
      setInteractionMode('view');
    }
  };

  const handleSelectImage = (id) => {
    setActiveImageId(id);
    setActiveTextId(null);
  };

  const handleUpdateImage = (id, updates) => {
    setImages((prev) =>
      prev.map((image) => (image.id === id ? { ...image, ...updates } : image))
    );
  };

  const handleDeleteImage = (id) => {
    setImages((prev) => prev.filter((image) => image.id !== id));
    if (activeImageId === id) {
      setActiveImageId(null);
    }
  };

  const handleOpenTextModal = () => {
    setEditingTextId(null);
    setIsTextModalOpen(true);
  };

  const handleEditText = (id) => {
    setEditingTextId(id);
    setIsTextModalOpen(true);
  };

  const handleSaveText = (textData) => {
    if (editingTextId) {
      setTexts((prev) =>
        prev.map((text) => (text.id === editingTextId ? { ...text, ...textData } : text))
      );
      setActiveTextId(editingTextId);
    } else {
      const newText = {
        id: `${Date.now()}-text`,
        ...textData,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1
      };
      setTexts((prev) => [...prev, newText]);
      setActiveTextId(newText.id);
    }
    setIsTextModalOpen(false);
  };

  const handleDeleteText = (id) => {
    setTexts((prev) => prev.filter((text) => text.id !== id));
    if (activeTextId === id) {
      setActiveTextId(null);
    }
  };

  const handleSelectText = (id) => {
    setActiveTextId(id);
    setActiveImageId(null);
    handleEditText(id);
  };

  const handleUpdateText = (id, updates) => {
    setTexts((prev) =>
      prev.map((text) => (text.id === id ? { ...text, ...updates } : text))
    );
  };

  const handleMaterialColorChange = (meshKey, color) => {
    setMaterialOverrides((prev) => ({ ...prev, [meshKey]: color }));
  };

  const activeImage = images.find((image) => image.id === activeImageId);
  const activeText = texts.find((text) => text.id === activeTextId);

  const capturePreview = useCallback(() => {
    if (!rendererRef.current) return null;
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        try {
          resolve(rendererRef.current.domElement.toDataURL('image/png'));
        } catch (error) {
          console.warn('Preview capture failed', error);
          resolve(null);
        }
      });
    });
  }, []);

  const triggerSaveIndicator = useCallback(() => {
    setSaveState('saved');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => setSaveState('idle'), 5000);
  }, []);

  const saveTemplate = useCallback(async (templateId = activeTemplateId) => {
    if (!templateId) return;
    const previewUrl = await capturePreview();
    const data = templateDataRef.current;
    const existing = templates.find((template) => template.id === templateId);
    try {
      const response = await api.put(`/templates/${templateId}`, {
        name: existing?.name,
        ...data,
        previewUrl: previewUrl || existing?.previewUrl
      });
      setTemplates((prev) =>
        prev.map((template) => (template.id === templateId ? response.data : template))
      );
      triggerSaveIndicator();
    } catch (error) {
      console.error('Failed to save template', error);
    }
  }, [activeTemplateId, api, capturePreview, templates, triggerSaveIndicator]);

  const handleDeleteTemplate = useCallback(async (templateId) => {
    try {
      await api.delete(`/templates/${templateId}`);
      setTemplates((prev) => prev.filter((template) => template.id !== templateId));
      if (templateId === activeTemplateId) {
        setActiveTemplateId(null);
        setModelUrl(null);
        setImages([]);
        setTexts([]);
        setMaterialOverrides({});
        setBackgroundColor('#252525');
      }
    } catch (error) {
      console.error('Failed to delete template', error);
    }
  }, [activeTemplateId, api, setBackgroundColor, setModelUrl]);

  const handleOpenTemplate = (template) => {
    setModelUrl(template.modelUrl);
    setImages(template.images || []);
    setTexts(template.texts || []);
    setMaterialOverrides(template.materialOverrides || {});
    setBackgroundColor(template.backgroundColor || '#252525');
    setActiveTemplateId(template.id);
    setIsTemplateModalOpen(false);
  };

  const handleRequestTemplateUpload = () => {
    if (templateInputRef.current) {
      templateInputRef.current.click();
    }
  };

  const handleTemplateUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const url = await uploadBlendFile(file);
    if (!url) return;

    setModelUrl(url);
    setImages([]);
    setTexts([]);
    setMaterialOverrides({});
    setBackgroundColor('#252525');

    const templateName = file.name.replace(/\.[^/.]+$/, '');
    try {
      const response = await api.post('/templates', {
        name: templateName || 'Untitled Template',
        modelUrl: url,
        backgroundColor: '#252525',
        images: [],
        texts: [],
        materialOverrides: {},
        previewUrl: null
      });
      setTemplates((prev) => [response.data, ...prev]);
      setActiveTemplateId(response.data.id);
      setIsTemplateModalOpen(false);

      setTimeout(() => {
        saveTemplate(response.data.id);
      }, 600);
    } catch (error) {
      console.error('Failed to create template', error);
    }
  };

  useEffect(() => {
    if (!activeTemplateId) return undefined;
    const interval = setInterval(() => {
      saveTemplate(activeTemplateId);
    }, 60000);
    return () => clearInterval(interval);
  }, [activeTemplateId, saveTemplate]);

  useEffect(() => () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <Sidebar
        onOpenTemplateManager={() => setIsTemplateModalOpen(true)}
        onUploadImage={handleRequestImageUpload}
        images={images}
        onSelectImage={handleSelectImage}
        onDeleteImage={handleDeleteImage}
        texts={texts}
        onOpenTextModal={handleOpenTextModal}
        onSelectText={handleSelectText}
        onDeleteText={handleDeleteText}
        onSaveTemplate={() => saveTemplate(activeTemplateId)}
        onDeleteTemplate={() => setPendingDeleteId(activeTemplateId)}
        canManageTemplate={Boolean(activeTemplateId)}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={templateInputRef}
        type="file"
        accept=".blend"
        onChange={handleTemplateUpload}
        style={{ display: 'none' }}
      />
      <ExportOverlay />

      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.5, 5], fov: 40 }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          toneMapping: THREE.AgXToneMapping,
          toneMappingExposure: 1.15,
          physicallyCorrectLights: true
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          rendererRef.current = gl;
        }}
        // Detect clicks on the empty background
        onPointerMissed={handleCanvasMiss}
      >
        <color attach="background" args={[backgroundColor]} />

        <Environment resolution={512} background={false}>
          <Lightformer intensity={3} position={[6, 4, -2]} rotation-y={Math.PI / 2} scale={[4, 4, 1]} />
          <Lightformer intensity={2.2} position={[-6, 2.5, 3]} rotation-y={-Math.PI / 2} scale={[3, 3, 1]} />
          <Lightformer intensity={1.8} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
        </Environment>

        <directionalLight
          position={[6, 8, 6]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={30}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <directionalLight position={[-6, 4, -4]} intensity={0.8} color="#cfd4ff" />
        <ambientLight intensity={0.35} />

        <Suspense fallback={<Loader />}>
          {modelUrl ? (
            <group position={[0, -0.5, 0]}>
              <ModelViewer
                url={modelUrl}
                images={images}
                texts={texts}
                materialOverrides={materialOverrides}
                onMaterialColorChange={handleMaterialColorChange}
              />
              <ContactShadows resolution={1024} scale={20} blur={2.5} opacity={0.45} far={12} color="#000000" frames={1} />
            </group>
          ) : null}
        </Suspense>

        {/* UPDATED GIZMO SETTINGS:
            1. margin={[80, 80]} ensures it sits safely inside the screen limits.
            2. hideNegativeAxes={false} shows the full XYZ structure (-x, -y, -z).
        */}
        <GizmoHelper alignment="top-right" margin={[80, 80]} renderPriority={2}>
          <GizmoViewport
            axisColors={['#ff3b30', '#4cd964', '#007aff']}
            labelColor="white"
            hideNegativeAxes={false}
            style={{ opacity: 0.8 }}
          />
        </GizmoHelper>

        <EffectComposer disableNormalPass multisampling={0}>
          <SSAO intensity={18} radius={0.25} luminanceInfluence={0.6} color="black" />
          <Bloom luminanceThreshold={1.1} mipmapBlur intensity={0.35} radius={0.6} />
          <ToneMapping />
          <Vignette eskil={false} offset={0.05} darkness={0.4} />
        </EffectComposer>

        <ExportEngine />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.8}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.9}
        />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          bottom: '28px',
          right: '32px',
          zIndex: 35,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '999px',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#cfcfcf',
          fontSize: '11px',
          letterSpacing: '1px'
        }}
      >
        <AnimatePresence mode="wait">
          {saveState === 'saved' ? (
            <motion.div
              key="saved"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <CheckCircle2 size={16} color="#7dff9b" />
              <span>Saved</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Cloud size={16} color="#cfcfcf" />
              <span>Auto-save</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activeImage && (
        <AssetEditorPanel
          image={activeImage}
          onClose={() => setActiveImageId(null)}
          onChange={(updates) => handleUpdateImage(activeImage.id, updates)}
          title="IMAGE SETTINGS"
          showCornerRadius
          scaleLabel="Resize picture"
        />
      )}

      {activeText && !isTextModalOpen && (
        <AssetEditorPanel
          image={activeText}
          onClose={() => setActiveTextId(null)}
          onChange={(updates) => handleUpdateText(activeText.id, updates)}
          title="TEXT SETTINGS"
          scaleLabel="Resize text"
        />
      )}

      {isTextModalOpen && (
        <TextEditorModal
          initialText={texts.find((text) => text.id === editingTextId)}
          onCancel={() => setIsTextModalOpen(false)}
          onSubmit={handleSaveText}
        />
      )}

      <TemplateManagerModal
        isOpen={isTemplateModalOpen}
        templates={templates}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleOpenTemplate}
        onRequestUpload={handleRequestTemplateUpload}
        onRequestDelete={(templateId) => setPendingDeleteId(templateId)}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteId)}
        title="Delete this template?"
        description="This action will permanently remove the template and its saved scene data."
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          handleDeleteTemplate(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}

export default App;

function AssetEditorPanel({ image, onClose, onChange, title, showCornerRadius = false, scaleLabel }) {
  const handlePositionChange = (axis, value) => {
    onChange({ position: { ...image.position, [axis]: value } });
  };

  const handleRotationChange = (axis, value) => {
    onChange({ rotation: { ...image.rotation, [axis]: value } });
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '120px',
        right: '80px',
        zIndex: 60,
        width: '280px',
        background: '#0f0f0f',
        border: '1px solid #222',
        borderRadius: '10px',
        padding: '14px',
        color: '#bbb',
        fontFamily: '"Inter", sans-serif',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '2px', color: '#555' }}>{title}</div>
          <div style={{ fontSize: '12px', color: '#eee', marginTop: '4px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {image.name}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid #222',
            color: '#777',
            borderRadius: '6px',
            padding: '4px 8px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>

      <ControlRow
        label="X coordinates"
        value={image.position.x}
        min={-10}
        max={10}
        step={0.001}
        onChange={(value) => handlePositionChange('x', value)}
      />
      <ControlRow
        label="Y coordinates"
        value={image.position.y}
        min={-10}
        max={10}
        step={0.001}
        onChange={(value) => handlePositionChange('y', value)}
      />
      <ControlRow
        label="Z coordinates"
        value={image.position.z}
        min={-10}
        max={10}
        step={0.001}
        onChange={(value) => handlePositionChange('z', value)}
      />
      <ControlRow
        label="X rotation"
        value={image.rotation.x}
        min={-180}
        max={180}
        step={0.001}
        onChange={(value) => handleRotationChange('x', value)}
      />
      <ControlRow
        label="Y rotation"
        value={image.rotation.y}
        min={-180}
        max={180}
        step={0.001}
        onChange={(value) => handleRotationChange('y', value)}
      />
      <ControlRow
        label="Z rotation"
        value={image.rotation.z}
        min={-180}
        max={180}
        step={0.001}
        onChange={(value) => handleRotationChange('z', value)}
      />
      <ControlRow
        label={scaleLabel}
        value={image.scale}
        min={-10}
        max={10}
        step={0.001}
        onChange={(value) => onChange({ scale: value })}
      />
      {showCornerRadius && (
        <ControlRow
          label="Corner radius"
          value={image.cornerRadius}
          min={0}
          max={50}
          step={1}
          allowNegative={false}
          onChange={(value) => onChange({ cornerRadius: value })}
        />
      )}
    </div>
  );
}

function ControlRow({ label, value, min, max, step, onChange, allowNegative = true }) {
  const [localValue, setLocalValue] = useState(value);
  const rafRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commitValue = (nextValue) => {
    if (Number.isNaN(nextValue)) {
      return;
    }
    if (!allowNegative && nextValue < 0) {
      nextValue = 0;
    }
    const clamped = Math.min(max, Math.max(min, nextValue));
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      onChange(clamped);
    });
  };

  const handleInputChange = (event) => {
    const nextValue = Number(event.target.value);
    setLocalValue(event.target.value === '' ? '' : nextValue);
    commitValue(nextValue);
  };

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', letterSpacing: '1px', color: '#666', marginBottom: '6px' }}>
        <span>{label}</span>
        <input
          type="number"
          value={localValue}
          min={min}
          max={max}
          step={step}
          onChange={handleInputChange}
          onFocus={(event) => event.target.select()}
          style={{
            width: '72px',
            background: '#111',
            border: '1px solid #222',
            borderRadius: '6px',
            color: '#ddd',
            fontSize: '11px',
            padding: '4px 6px'
          }}
        />
      </div>
      <input
        type="range"
        value={localValue}
        min={min}
        max={max}
        step={step}
        onInput={handleInputChange}
        style={{ width: '100%' }}
      />
    </div>
  );
}

function TextEditorModal({ initialText, onCancel, onSubmit }) {
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
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 80
      }}
    >
      <div
        style={{
          width: '880px',
          maxWidth: '90vw',
          background: '#0f0f0f',
          border: '1px solid #222',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
          color: '#eaeaea',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#666', marginBottom: '12px' }}>TEXT BOX</div>
            <div
              style={{
                border: '1px solid #222',
                borderRadius: '10px',
                padding: form.padding,
                minHeight: '220px',
                background: form.backgroundColor,
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
              borderLeft: '1px solid #1f1f1f',
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
              <label style={{ fontSize: '11px', color: '#888' }}>Text Color</label>
              <input type="color" value={form.color} onChange={(event) => updateForm('color', event.target.value)} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: '#888' }}>Background Color</label>
              <input type="color" value={form.backgroundColor} onChange={(event) => updateForm('backgroundColor', event.target.value)} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: '#888' }}>Text Background</label>
              <input type="color" value={form.textBackgroundColor} onChange={(event) => updateForm('textBackgroundColor', event.target.value)} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: '#888' }}>Highlight Color</label>
              <input type="color" value={form.highlightColor} onChange={(event) => updateForm('highlightColor', event.target.value)} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#888' }}>
                <input type="checkbox" checked={form.enableHighlight} onChange={(event) => updateForm('enableHighlight', event.target.checked)} />
                Enable Highlighting
              </label>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: '#888' }}>Font Family</label>
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
              <label style={{ fontSize: '11px', color: '#888' }}>Font Weight</label>
              <select value={form.fontWeight} onChange={(event) => updateForm('fontWeight', Number(event.target.value))}>
                {[300, 400, 500, 600, 700, 800].map((weight) => (
                  <option key={weight} value={weight}>{weight}</option>
                ))}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#888' }}>
              <input type="checkbox" checked={form.isBold} onChange={(event) => updateForm('isBold', event.target.checked)} />
              Bold
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#888' }}>
              <input type="checkbox" checked={form.isItalic} onChange={(event) => updateForm('isItalic', event.target.checked)} />
              Italic
            </label>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: '#888' }}>Alignment</label>
              <select value={form.alignment} onChange={(event) => updateForm('alignment', event.target.value)}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: '#888' }}>Text Decoration</label>
              <select value={form.textDecoration} onChange={(event) => updateForm('textDecoration', event.target.value)}>
                <option value="none">None</option>
                <option value="underline">Underline</option>
                <option value="line-through">Strikethrough</option>
                <option value="overline">Overline</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: '#888' }}>Text Transform</label>
              <select value={form.textTransform} onChange={(event) => updateForm('textTransform', event.target.value)}>
                <option value="none">None</option>
                <option value="uppercase">Uppercase</option>
                <option value="lowercase">Lowercase</option>
                <option value="capitalize">Capitalize</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: '#888' }}>Letter Case Control</label>
              <select value={form.caseControl} onChange={(event) => updateForm('caseControl', event.target.value)}>
                <option value="none">None</option>
                <option value="uppercase">Uppercase</option>
                <option value="lowercase">Lowercase</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: '#888' }}>Text Overflow</label>
              <select value={form.textOverflow} onChange={(event) => updateForm('textOverflow', event.target.value)}>
                <option value="wrap">Wrap</option>
                <option value="ellipsis">Ellipsis</option>
                <option value="clip">Clip</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: '#888' }}>Vertical Align</label>
              <select value={form.verticalAlign} onChange={(event) => updateForm('verticalAlign', event.target.value)}>
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#888' }}>
              <input type="checkbox" checked={form.allowResize} onChange={(event) => updateForm('allowResize', event.target.checked)} />
              Resize Option
            </label>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: '#888' }}>Text Shadow</label>
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
              border: '1px solid #333',
              color: '#999',
              padding: '10px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              background: '#fff',
              border: '1px solid #fff',
              color: '#000',
              padding: '10px 24px',
              borderRadius: '8px',
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

function ConfirmDialog({ isOpen, title, description, confirmLabel, onCancel, onConfirm }) {
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
