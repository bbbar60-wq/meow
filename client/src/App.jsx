import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, GizmoHelper, GizmoViewport, Lightformer } from '@react-three/drei';
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
import QRGeneratorModal from './components/QRGeneratorModal';
import Loader from './components/Loader';
import ExportOverlay from './components/ExportOverlay';
import AssetEditorPanel from './components/AssetEditorPanel';
import TextEditorModal from './components/TextEditorModal';
import ConfirmDialog from './components/ConfirmDialog';

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
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
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

  const handleCreateQrImage = (dataUrl) => {
    if (!dataUrl) return;
    const newImage = {
      id: `${Date.now()}-qr`,
      name: 'QR Code',
      url: dataUrl,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: -90, y: 0, z: 0 },
      scale: 1,
      cornerRadius: 0
    };
    setImages((prev) => [...prev, newImage]);
    setActiveImageId(newImage.id);
    setIsQrModalOpen(false);
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
        setBackgroundColor('#ded7cc');
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
    setBackgroundColor(template.backgroundColor || '#ded7cc');
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
    setBackgroundColor('#ded7cc');

    const templateName = file.name.replace(/\.[^/.]+$/, '');
    try {
      const response = await api.post('/templates', {
        name: templateName || 'Untitled Template',
        modelUrl: url,
        backgroundColor: '#ded7cc',
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
        onOpenQrGenerator={() => setIsQrModalOpen(true)}
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
        camera={{ position: [1.35, 1.3, 4.2], fov: 35 }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          toneMapping: THREE.AgXToneMapping,
          toneMappingExposure: 1.05,
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
          <Lightformer intensity={2.8} position={[4.5, 5.5, 3.5]} rotation-y={Math.PI / 2} scale={[5.5, 5.5, 1]} />
          <Lightformer intensity={1.4} position={[-6, 2.8, 1]} rotation-y={-Math.PI / 2} scale={[4, 4, 1]} />
          <Lightformer intensity={1.1} position={[0, 6.5, -3]} rotation-x={Math.PI / 2} scale={[7, 7, 1]} />
        </Environment>

        <directionalLight
          position={[5.5, 7, 4.5]}
          intensity={1.85}
          color="#fff3e2"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={28}
          shadow-camera-left={-6.5}
          shadow-camera-right={6.5}
          shadow-camera-top={6.5}
          shadow-camera-bottom={-6.5}
        />
        <directionalLight position={[-4.5, 3, -2.5]} intensity={0.35} color="#e9e2d8" />
        <hemisphereLight intensity={0.4} color="#f6efe5" groundColor="#bfb7ad" />

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
              <ContactShadows resolution={1024} scale={20} blur={2.4} opacity={0.48} far={12} color="#3b3631" frames={1} />
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
          <SSAO intensity={12} radius={0.2} luminanceInfluence={0.55} color="#2a2520" />
          <ToneMapping />
          <Vignette eskil={false} offset={0.12} darkness={0.2} />
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

      <QRGeneratorModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onCreate={handleCreateQrImage}
      />

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
