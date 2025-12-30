import React, { useEffect, useMemo, useState } from 'react';
import { useGLTF, Center, Html, useTexture } from '@react-three/drei';
import { HexColorPicker } from 'react-colorful';
import useStore from '../store';
import { X } from 'lucide-react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

const ROUNDED_TEXTURE_SIZE = 256;

function createRoundedAlphaTexture(radiusValue) {
  const canvas = document.createElement('canvas');
  canvas.width = ROUNDED_TEXTURE_SIZE;
  canvas.height = ROUNDED_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  const radius = Math.max(0, Math.min(1, radiusValue));
  const cornerRadius = radius * (ROUNDED_TEXTURE_SIZE / 2);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  const width = canvas.width;
  const height = canvas.height;
  const r = cornerRadius;
  ctx.moveTo(r, 0);
  ctx.lineTo(width - r, 0);
  ctx.quadraticCurveTo(width, 0, width, r);
  ctx.lineTo(width, height - r);
  ctx.quadraticCurveTo(width, height, width - r, height);
  ctx.lineTo(r, height);
  ctx.quadraticCurveTo(0, height, 0, height - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function applyTextTransforms(text, transform, caseControl) {
  let transformed = text;
  if (transform === 'uppercase') transformed = transformed.toUpperCase();
  if (transform === 'lowercase') transformed = transformed.toLowerCase();
  if (transform === 'capitalize') {
    transformed = transformed.replace(/\b\w/g, (char) => char.toUpperCase());
  }
  if (caseControl === 'uppercase') transformed = transformed.toUpperCase();
  if (caseControl === 'lowercase') transformed = transformed.toLowerCase();
  return transformed;
}

function createTextTexture(textConfig) {
  const {
    content,
    color,
    fontSize,
    fontFamily,
    fontWeight,
    isBold,
    isItalic,
    alignment,
    textDecoration,
    backgroundColor,
    textBackgroundColor,
    highlightColor,
    enableHighlight,
    lineHeight,
    letterSpacing,
    textShadowColor,
    textShadowBlur,
    textShadowOffsetX,
    textShadowOffsetY,
    textTransform,
    caseControl,
    padding,
    maxWidth,
    maxHeight,
    textOverflow,
    paragraphSpacing,
    verticalAlign
  } = textConfig;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const resolvedText = applyTextTransforms(content, textTransform, caseControl);
  const fontStyle = `${isItalic ? 'italic' : 'normal'} ${isBold ? 700 : fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.font = fontStyle;
  ctx.textBaseline = 'top';

  const maxContentWidth = maxWidth - padding * 2;
  const words = resolvedText.split(/\s+/);
  const lines = [];
  let currentLine = '';
  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width + letterSpacing * testLine.length > maxContentWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) lines.push(currentLine);

  const lineHeightPx = fontSize * lineHeight;
  let totalHeight = lines.length * lineHeightPx + padding * 2;
  if (paragraphSpacing) {
    const paragraphs = resolvedText.split(/\n\s*\n/);
    totalHeight += Math.max(0, paragraphs.length - 1) * paragraphSpacing;
  }

  canvas.width = maxWidth;
  canvas.height = Math.min(maxHeight, totalHeight);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = backgroundColor === 'transparent' ? 'rgba(0,0,0,0)' : backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = fontStyle;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.shadowColor = textShadowColor;
  ctx.shadowBlur = textShadowBlur;
  ctx.shadowOffsetX = textShadowOffsetX;
  ctx.shadowOffsetY = textShadowOffsetY;

  let y = padding;
  const contentHeight = lines.length * lineHeightPx;
  if (verticalAlign === 'center') {
    y = (canvas.height - contentHeight) / 2;
  }
  if (verticalAlign === 'bottom') {
    y = canvas.height - contentHeight - padding;
  }

  const drawLine = (line, yPos) => {
    let x = padding;
    const lineWidth = ctx.measureText(line).width + letterSpacing * line.length;
    if (alignment === 'center') x = (canvas.width - lineWidth) / 2;
    if (alignment === 'right') x = canvas.width - lineWidth - padding;
    if (alignment === 'justify' && line.includes(' ')) {
      const wordsInLine = line.split(' ');
      const gapCount = wordsInLine.length - 1;
      const totalWordWidth = wordsInLine.reduce((sum, word) => sum + ctx.measureText(word).width, 0);
      const gapSize = (maxContentWidth - totalWordWidth) / gapCount;
      let cursor = padding;
      wordsInLine.forEach((word) => {
        ctx.fillText(word, cursor, yPos);
        cursor += ctx.measureText(word).width + gapSize;
      });
      return;
    }

    if (textBackgroundColor !== 'transparent') {
      ctx.fillStyle = textBackgroundColor;
      ctx.fillRect(x - 4, yPos - 2, lineWidth + 8, lineHeightPx + 4);
      ctx.fillStyle = color;
    }

    if (enableHighlight && highlightColor !== 'transparent') {
      ctx.fillStyle = highlightColor;
      ctx.fillRect(x - 4, yPos - 2, lineWidth + 8, lineHeightPx + 4);
      ctx.fillStyle = color;
    }

    ctx.fillText(line, x, yPos);

    if (textDecoration !== 'none') {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, fontSize / 14);
      let decorationY = yPos + lineHeightPx;
      if (textDecoration === 'underline') decorationY = yPos + lineHeightPx - 4;
      if (textDecoration === 'overline') decorationY = yPos + 2;
      if (textDecoration === 'line-through') decorationY = yPos + lineHeightPx / 2;
      ctx.beginPath();
      ctx.moveTo(x, decorationY);
      ctx.lineTo(x + lineWidth, decorationY);
      ctx.stroke();
    }
  };

  const maxLines = Math.floor((canvas.height - padding * 2) / lineHeightPx);
  const renderLines = lines.slice(0, maxLines);
  renderLines.forEach((line, index) => {
    const lineY = y + index * lineHeightPx;
    if (textOverflow === 'ellipsis' && index === maxLines - 1 && lines.length > maxLines) {
      const ellipsis = `${line}…`;
      drawLine(ellipsis, lineY);
    } else if (textOverflow === 'clip' && index === maxLines - 1 && lines.length > maxLines) {
      drawLine(line, lineY);
    } else {
      drawLine(line, lineY);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return { texture, width: canvas.width, height: canvas.height };
}

export default function ModelViewer({ url, images, texts, materialOverrides = {}, onMaterialColorChange }) {
  const { scene } = useGLTF(url);
  const { gl } = useThree(); // Access the renderer to get max anisotropy
  const { interactionMode, setInteractionMode } = useStore();
  const [selectedMesh, setSelectedMesh] = useState(null);
  const imageTextures = useTexture(images.map((image) => image.url));
  const alphaTextures = useMemo(
    () =>
      images.map((image) => {
        const radius = image.cornerRadius / 50;
        return createRoundedAlphaTexture(radius);
      }),
    [images]
  );
  const textTextures = useMemo(
    () =>
      texts.map((text) => {
        const result = createTextTexture(text);
        return { id: text.id, ...result };
      }),
    [texts]
  );

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
          if (child.geometry) {
            child.geometry.computeVertexNormals();
          }

          // 1. Shadows
          child.castShadow = true;
          child.receiveShadow = true;

          // 2. Material Realism
          if (child.material) {
             // Clone to allow individual editing
             if (!child.userData.isOptimized) {
               child.material = child.material.clone();

               // REALISM: Softer reflections for a studio matte finish
               child.material.envMapIntensity = 0.65;

               // REALISM: Push surfaces toward a gentle matte look
               child.material.roughness = Math.max(0.45, child.material.roughness ?? 0.65);

               if (child.material.isMeshStandardMaterial) {
                 child.material.metalness = Math.min(0.08, child.material.metalness ?? 0.03);
                 child.material.clearcoat = 0.04;
                 child.material.clearcoatRoughness = 0.65;
                 child.material.flatShading = false;
               }

               // Remove texture maps for a clean, premium material look
               child.material.map = null;
               child.material.normalMap = null;
               child.material.roughnessMap = null;
               child.material.metalnessMap = null;
               child.material.aoMap = null;

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

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const materialKey = child.name || child.uuid;
        const savedColor = materialOverrides[materialKey];
        if (savedColor) {
          child.material.color.set(savedColor);
          child.material.needsUpdate = true;
        }
      }
    });
  }, [scene, materialOverrides]);

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
    if (selectedMesh?.material) {
      selectedMesh.material.color.set(newColor);
      if (onMaterialColorChange) {
        onMaterialColorChange(selectedMesh.name || selectedMesh.uuid, newColor);
      }
    }
  };

  return (
    <group onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
      <Center top>
        <primitive object={scene} />
      </Center>
      {images.map((image, index) => {
        const texture = imageTextures[index];
        const alphaMap = alphaTextures[index];
        if (texture) {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = gl.capabilities.getMaxAnisotropy();
          texture.needsUpdate = true;
        }
        if (alphaMap) {
          alphaMap.needsUpdate = true;
        }
        return (
          <mesh
            key={image.id}
            position={[image.position.x, image.position.y, image.position.z]}
            rotation={[
              THREE.MathUtils.degToRad(image.rotation.x),
              THREE.MathUtils.degToRad(image.rotation.y),
              THREE.MathUtils.degToRad(image.rotation.z)
            ]}
            scale={[image.scale, image.scale, image.scale]}
          >
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial
              map={texture}
              alphaMap={alphaMap}
              transparent
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );
      })}

      {texts.map((text) => {
        const textureData = textTextures.find((entry) => entry.id === text.id);
        if (!textureData) return null;
        const { texture, width, height } = textureData;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = gl.capabilities.getMaxAnisotropy();
        texture.needsUpdate = true;

        const aspect = width / height;
        const planeWidth = 1.2;
        const planeHeight = planeWidth / aspect;

        return (
          <mesh
            key={text.id}
            position={[text.position.x, text.position.y, text.position.z]}
            rotation={[
              THREE.MathUtils.degToRad(text.rotation.x),
              THREE.MathUtils.degToRad(text.rotation.y),
              THREE.MathUtils.degToRad(text.rotation.z)
            ]}
            scale={[text.scale, text.scale, text.scale]}
            renderOrder={5}
          >
            <planeGeometry args={[planeWidth, planeHeight]} />
            <meshStandardMaterial
              map={texture}
              transparent
              depthTest={false}
              depthWrite={false}
              side={THREE.DoubleSide}
              roughness={0.4}
              metalness={0.05}
            />
          </mesh>
        );
      })}

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
