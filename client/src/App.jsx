import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, useProgress, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

import useStore from './store';
import ModelViewer from './components/ModelViewer';
import Sidebar from './components/Sidebar';
import ExportEngine from './components/ExportEngine';

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
  const { modelUrl, setModelUrl, setUploading, setError, backgroundColor, interactionMode, setInteractionMode } = useStore();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.blend')) {
      alert("Please upload a .blend file");
      return;
    }
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setModelUrl(response.data.url);
    } catch (err) {
      console.error(err);
      alert("Failed to process file.");
    } finally {
      setUploading(false);
    }
  };

  // --- BACKGROUND CLICK HANDLER ---
  const handleCanvasMiss = () => {
    if (interactionMode === 'color') {
      // User clicked background -> Exit color mode
      setInteractionMode('view');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <Sidebar onUpload={handleFileUpload} />
      <ExportOverlay />

      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.5, 5], fov: 40 }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          toneMapping: THREE.AgXToneMapping,
          toneMappingExposure: 1.1
        }}
        // Detect clicks on the empty background
        onPointerMissed={handleCanvasMiss}
      >
        <color attach="background" args={[backgroundColor]} />

        <Environment preset="city" blur={1} background={false} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow shadow-bias={-0.0001} />
        <pointLight position={[-10, -5, -10]} intensity={1} />

        <Suspense fallback={<Loader />}>
          {modelUrl ? (
            <group position={[0, -0.5, 0]}>
              <ModelViewer url={modelUrl} />
              <ContactShadows resolution={512} scale={20} blur={2} opacity={0.5} far={10} color="#000000" frames={1} />
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
          <Bloom luminanceThreshold={1.2} mipmapBlur intensity={0.4} radius={0.6} />
          <Vignette eskil={false} offset={0.05} darkness={0.4} />
          <Noise opacity={0.02} />
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
    </div>
  );
}

export default App;