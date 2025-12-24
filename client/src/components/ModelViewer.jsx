import React, { useEffect, useRef, useState } from 'react';
import { useGLTF, Center, Html } from '@react-three/drei';
import { HexColorPicker } from 'react-colorful';
import useStore from '../store';
import { X } from 'lucide-react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

export default function ModelViewer({ url }) {
  const { scene } = useGLTF(url);
  const { gl } = useThree(); // Access the renderer to get max anisotropy
  const { interactionMode, setInteractionMode } = useStore();
  const [selectedMesh, setSelectedMesh] = useState(null);

  // --- LOGIC: SYNC STATE ---
  useEffect(() => {
    if (interactionMode !== 'color') {
      setSelectedMesh(null);
    }
  }, [interactionMode]);

  // --- MATERIAL & TEXTURE OPTIMIZATION ---
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          // 1. Shadows
          child.castShadow = true;
          child.receiveShadow = true;

          // 2. Material Realism
          if (child.material) {
             // Clone to allow individual editing
             if (!child.userData.isOptimized) {
               child.material = child.material.clone();

               // REALISM: Boost environmental reflections slightly
               child.material.envMapIntensity = 1.0;

               // REALISM: Ensure materials aren't perfectly smooth (which looks fake)
               // We clamp roughness to a minimum of 0.05 so nothing is infinitely sharp
               child.material.roughness = Math.max(0.05, child.material.roughness);

               // Fix z-fighting or rendering order issues
               child.material.side = THREE.DoubleSide;

               // 3. Texture Anisotropy (Crisp textures at angles)
               if (child.material.map) child.material.map.anisotropy = gl.capabilities.getMaxAnisotropy();
               if (child.material.normalMap) child.material.normalMap.anisotropy = gl.capabilities.getMaxAnisotropy();
               if (child.material.roughnessMap) child.material.roughnessMap.anisotropy = gl.capabilities.getMaxAnisotropy();
               if (child.material.metalnessMap) child.material.metalnessMap.anisotropy = gl.capabilities.getMaxAnisotropy();

               child.material.needsUpdate = true;
               child.userData.isOptimized = true;
            }
          }
        }
      });
    }
  }, [scene, gl]);

  // --- HANDLERS ---
  const handlePointerOver = (e) => {
    if (interactionMode === 'color') {
      e.stopPropagation();
      document.body.style.cursor = 'crosshair';
    }
  };

  const handlePointerOut = () => {
    if (interactionMode === 'color') {
      document.body.style.cursor = 'auto';
    }
  };

  const handleClick = (e) => {
    if (interactionMode === 'color') {
      e.stopPropagation();
      setSelectedMesh(e.object);
    }
  };

  const handleClosePopup = (e) => {
    e.stopPropagation();
    setInteractionMode('view');
  };

  const handleColorChange = (newColor) => {
    if (selectedMesh?.material) selectedMesh.material.color.set(newColor);
  };

  return (
    <group onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
      <Center top>
        <primitive object={scene} />
      </Center>

      {selectedMesh && interactionMode === 'color' && (
        <Html position={[0,0,0]} style={{ pointerEvents: 'none', zIndex: 10 }}>
           <div style={{ position: 'absolute', left: '20px', top: '20px', pointerEvents: 'auto' }}>
             <div
               style={{
                 width: '200px', background: '#0f0f0f',
                 borderRadius: '8px', padding: '12px', border: '1px solid #333',
                 boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
               }}
               onPointerDown={(e) => e.stopPropagation()}
               onClick={(e) => e.stopPropagation()}
             >
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                 <span style={{ color: '#888', fontSize: '10px', letterSpacing: '1px', fontWeight: '600' }}>COLOR</span>
                 <button onClick={handleClosePopup} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 0 }}>
                   <X size={14}/>
                 </button>
               </div>
               <div className="custom-picker" style={{ height: '100px' }}>
                 <HexColorPicker color={'#' + selectedMesh.material.color.getHexString()} onChange={handleColorChange} />
               </div>
             </div>
           </div>
        </Html>
      )}
    </group>
  );
}