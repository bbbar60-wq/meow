import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF, Center, Html, useTexture } from '@react-three/drei';
import { HexColorPicker } from 'react-colorful';
import useStore from '../store';
import { X } from 'lucide-react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

const ROUNDED_TEXTURE_SIZE = 256;

function formatHex(color) {
  return `#${color.getHexString()}`.toUpperCase();
}

function formatRgb(color) {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `${r}, ${g}, ${b}`;
}

function normalizeHexInput(value) {
  const trimmed = value.trim();
  const match = trimmed.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return null;
  return `#${match[1]}`;
}

function normalizeRgbInput(value) {
  const matches = value.match(/\d{1,3}/g);
  if (!matches || matches.length < 3) return null;
  const [r, g, b] = matches.slice(0, 3).map((entry) => Number(entry));
  if ([r, g, b].some((channel) => Number.isNaN(channel) || channel < 0 || channel > 255)) {
    return null;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function isSecondarySurface(name = '') {
  const label = name.toLowerCase();
  return label.includes('base') || label.includes('back') || label.includes('plate') || label.includes('stand');
}

function buildAcrylicMaterial(source, isSecondary, fingerprintsTexture, scratchesTexture) {
  const isTranslucent = !isSecondary && (source.transparent || source.opacity < 1);
  const detailTexture = isSecondary ? scratchesTexture : fingerprintsTexture;
  let roughnessDetail = null;
  if (detailTexture) {
    roughnessDetail = detailTexture.clone();
    roughnessDetail.wrapS = THREE.RepeatWrapping;
    roughnessDetail.wrapT = THREE.RepeatWrapping;
    const repeatValue = isSecondary ? 8 : 12;
    roughnessDetail.repeat.set(repeatValue, repeatValue);
    roughnessDetail.needsUpdate = true;
  }
  const nextMaterial = new THREE.MeshPhysicalMaterial({
    name: source.name,
    color: source.color?.clone?.() ?? new THREE.Color('#ffffff'),
    map: source.map ?? null,
    normalMap: source.normalMap ?? null,
    roughnessMap: roughnessDetail ?? source.roughnessMap ?? null,
    metalnessMap: source.metalnessMap ?? null,
    aoMap: source.aoMap ?? null,
    emissiveMap: source.emissiveMap ?? null,
    alphaMap: source.alphaMap ?? null,
    envMap: source.envMap ?? null,
    transparent: source.transparent ?? false,
    opacity: source.opacity ?? 1,
    side: source.side ?? THREE.FrontSide,
    depthTest: source.depthTest ?? true,
    depthWrite: source.depthWrite ?? true,
    emissive: source.emissive?.clone?.() ?? new THREE.Color('#000000'),
    emissiveIntensity: source.emissiveIntensity ?? 1,
    clearcoat: isSecondary ? 0.0 : 1.0,
    clearcoatRoughness: isSecondary ? 0.2 : 0.04,
    roughness: isSecondary ? 0.35 : 0.06,
    metalness: 0.0,
    ior: 1.49,
    reflectivity: 1.0,
    specularIntensity: 1.15,
    specularColor: new THREE.Color('#ffffff'),
    transmission: isSecondary ? 0.0 : (isTranslucent ? 0.95 : 0),
    thickness: isTranslucent ? 0.6 : 0,
    attenuationDistance: isTranslucent ? 0.8 : 0,
    attenuationColor: isTranslucent ? source.color?.clone?.() ?? new THREE.Color('#ffffff') : new THREE.Color('#ffffff')
  });

  nextMaterial.normalScale = source.normalScale ?? new THREE.Vector2(1, 1);
  nextMaterial.aoMapIntensity = source.aoMapIntensity ?? 1;
  nextMaterial.envMapIntensity = isSecondary ? 1.0 : 1.2;
  nextMaterial.needsUpdate = true;
  return nextMaterial;
}

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
  const [hexInput, setHexInput] = useState('#FFFFFF');
  const [rgbInput, setRgbInput] = useState('255, 255, 255');
  const initializedMaterialsRef = useRef(false);
  const [fingerprintsTexture, scratchesTexture] = useTexture([
    '/textures/Fingerprints002_2K-JPG_Roughness.jpg',
    '/textures/Scratches003_2K-JPG_Color.jpg'
  ]);
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

  useEffect(() => {
    if (selectedMesh?.material?.color) {
      const color = selectedMesh.material.color;
      setHexInput(formatHex(color));
      setRgbInput(formatRgb(color));
    }
  }, [selectedMesh]);

  useEffect(() => {
    if (!scene || initializedMaterialsRef.current) return;
    scene.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const materialArray = Array.isArray(child.material) ? child.material : [child.material];
      const updatedMaterials = materialArray.map((material) => {
        if (material.userData?.isAcrylicMaterial) return material;
        const isSecondary = isSecondarySurface(child.name) || material.userData?.surface === 'secondary';
        const nextMaterial = buildAcrylicMaterial(material, isSecondary, fingerprintsTexture, scratchesTexture);
        nextMaterial.userData = { ...material.userData, isAcrylicMaterial: true };
        return nextMaterial;
      });
      child.material = Array.isArray(child.material) ? updatedMaterials : updatedMaterials[0];
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.geometry) {
        child.geometry.computeVertexNormals();
      }
    });
    initializedMaterialsRef.current = true;
  }, [scene, fingerprintsTexture, scratchesTexture]);

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
      const color = new THREE.Color(newColor);
      setHexInput(formatHex(color));
      setRgbInput(formatRgb(color));
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
              roughness={0.32}
              metalness={0.0}
              polygonOffset
              polygonOffsetFactor={-1}
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
              roughness={0.38}
              metalness={0.0}
              polygonOffset
              polygonOffsetFactor={-2}
            />
          </mesh>
        );
      })}

      {selectedMesh && interactionMode === 'color' && (
        <Html position={[0,0,0]} style={{ pointerEvents: 'none', zIndex: 140 }}>
           <div style={{ position: 'absolute', left: '20px', top: '20px', pointerEvents: 'auto' }}>
             <div
               style={{
                 width: '200px', background: 'var(--panel)',
                 borderRadius: '12px', padding: '12px', border: '1px solid var(--border)',
                 boxShadow: 'var(--shadow)'
               }}
               onPointerDown={(e) => e.stopPropagation()}
               onClick={(e) => e.stopPropagation()}
             >
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                 <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '1px', fontWeight: '600' }}>COLOR</span>
                 <button onClick={handleClosePopup} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                   <X size={14}/>
                 </button>
               </div>
               <div className="custom-picker" style={{ height: '100px' }}>
                 <HexColorPicker color={'#' + selectedMesh.material.color.getHexString()} onChange={handleColorChange} />
               </div>
               <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
                 <div style={{ display: 'grid', gap: '6px' }}>
                   <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '1px' }}>HEX</span>
                   <input
                     value={hexInput}
                     onChange={(event) => {
                       const nextValue = event.target.value;
                       setHexInput(nextValue);
                       const normalized = normalizeHexInput(nextValue);
                       if (normalized) {
                         handleColorChange(normalized);
                       }
                     }}
                     placeholder="#FFFFFF"
                     style={{
                       width: '100%',
                       background: 'var(--panel-3)',
                       border: '1px solid var(--border)',
                       borderRadius: '8px',
                       padding: '6px 8px',
                       color: 'var(--text-primary)',
                       fontSize: '11px',
                       fontFamily: 'monospace'
                     }}
                   />
                 </div>
                 <div style={{ display: 'grid', gap: '6px' }}>
                   <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '1px' }}>RGB</span>
                   <input
                     value={rgbInput}
                     onChange={(event) => {
                       const nextValue = event.target.value;
                       setRgbInput(nextValue);
                       const normalized = normalizeRgbInput(nextValue);
                       if (normalized) {
                         handleColorChange(normalized);
                       }
                     }}
                     placeholder="255, 255, 255"
                     style={{
                       width: '100%',
                       background: 'var(--panel-3)',
                       border: '1px solid var(--border)',
                       borderRadius: '8px',
                       padding: '6px 8px',
                       color: 'var(--text-primary)',
                       fontSize: '11px',
                       fontFamily: 'monospace'
                     }}
                   />
                 </div>
               </div>
             </div>
           </div>
        </Html>
      )}
    </group>
  );
}
