import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
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

const TEXTURE_FIELDS = [
  'content',
  'color',
  'fontSize',
  'fontFamily',
  'fontWeight',
  'isBold',
  'isItalic',
  'alignment',
  'textDecoration',
  'backgroundColor',
  'textBackgroundColor',
  'highlightColor',
  'enableHighlight',
  'lineHeight',
  'letterSpacing',
  'textShadowColor',
  'textShadowBlur',
  'textShadowOffsetX',
  'textShadowOffsetY',
  'textTransform',
  'caseControl',
  'padding',
  'maxWidth',
  'maxHeight',
  'textOverflow',
  'paragraphSpacing',
  'verticalAlign'
];

function buildTextSignature(text) {
  const payload = TEXTURE_FIELDS.reduce((acc, key) => {
    acc[key] = text[key];
    return acc;
  }, {});
  return JSON.stringify(payload);
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

const DEFAULT_TEXT_CONFIG = {
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
  textOverflow: 'wrap',
  paragraphSpacing: 10,
  verticalAlign: 'top'
};

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

  const safeMaxWidth = Number.isFinite(maxWidth) ? maxWidth : DEFAULT_TEXT_CONFIG.maxWidth;
  const safeMaxHeight = Number.isFinite(maxHeight) ? maxHeight : DEFAULT_TEXT_CONFIG.maxHeight;
  const safePadding = Number.isFinite(padding) ? padding : DEFAULT_TEXT_CONFIG.padding;
  const safeFontSize = Number.isFinite(fontSize) ? fontSize : DEFAULT_TEXT_CONFIG.fontSize;
  const safeFontFamily = typeof fontFamily === 'string' ? fontFamily : DEFAULT_TEXT_CONFIG.fontFamily;
  const safeFontWeight = Number.isFinite(fontWeight) ? fontWeight : DEFAULT_TEXT_CONFIG.fontWeight;
  const safeIsBold = typeof isBold === 'boolean' ? isBold : DEFAULT_TEXT_CONFIG.isBold;
  const safeIsItalic = typeof isItalic === 'boolean' ? isItalic : DEFAULT_TEXT_CONFIG.isItalic;
  const safeAlignment = typeof alignment === 'string' ? alignment : DEFAULT_TEXT_CONFIG.alignment;
  const safeTextDecoration = typeof textDecoration === 'string' ? textDecoration : DEFAULT_TEXT_CONFIG.textDecoration;
  const safeBackgroundColor = typeof backgroundColor === 'string' ? backgroundColor : DEFAULT_TEXT_CONFIG.backgroundColor;
  const safeTextBackgroundColor = typeof textBackgroundColor === 'string' ? textBackgroundColor : DEFAULT_TEXT_CONFIG.textBackgroundColor;
  const safeHighlightColor = typeof highlightColor === 'string' ? highlightColor : DEFAULT_TEXT_CONFIG.highlightColor;
  const safeEnableHighlight = typeof enableHighlight === 'boolean' ? enableHighlight : DEFAULT_TEXT_CONFIG.enableHighlight;
  const safeLineHeight = Number.isFinite(lineHeight) ? lineHeight : DEFAULT_TEXT_CONFIG.lineHeight;
  const safeLetterSpacing = Number.isFinite(letterSpacing) ? letterSpacing : DEFAULT_TEXT_CONFIG.letterSpacing;
  const safeTextShadowColor = typeof textShadowColor === 'string' ? textShadowColor : DEFAULT_TEXT_CONFIG.textShadowColor;
  const safeTextShadowBlur = Number.isFinite(textShadowBlur) ? textShadowBlur : DEFAULT_TEXT_CONFIG.textShadowBlur;
  const safeTextShadowOffsetX = Number.isFinite(textShadowOffsetX) ? textShadowOffsetX : DEFAULT_TEXT_CONFIG.textShadowOffsetX;
  const safeTextShadowOffsetY = Number.isFinite(textShadowOffsetY) ? textShadowOffsetY : DEFAULT_TEXT_CONFIG.textShadowOffsetY;
  const safeTextTransform = typeof textTransform === 'string' ? textTransform : DEFAULT_TEXT_CONFIG.textTransform;
  const safeCaseControl = typeof caseControl === 'string' ? caseControl : DEFAULT_TEXT_CONFIG.caseControl;
  const safeTextOverflow = typeof textOverflow === 'string' ? textOverflow : DEFAULT_TEXT_CONFIG.textOverflow;
  const safeParagraphSpacing = Number.isFinite(paragraphSpacing) ? paragraphSpacing : DEFAULT_TEXT_CONFIG.paragraphSpacing;
  const safeVerticalAlign = typeof verticalAlign === 'string' ? verticalAlign : DEFAULT_TEXT_CONFIG.verticalAlign;
  const safeColor = typeof color === 'string' ? color : DEFAULT_TEXT_CONFIG.color;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const resolvedText = applyTextTransforms(content ?? '', safeTextTransform, safeCaseControl);
  const fontStyle = `${safeIsItalic ? 'italic' : 'normal'} ${safeIsBold ? 700 : safeFontWeight} ${safeFontSize}px ${safeFontFamily}`;
  ctx.font = fontStyle;
  ctx.textBaseline = 'top';

  const maxContentWidth = Math.max(1, safeMaxWidth - safePadding * 2);
  const words = resolvedText.split(/\s+/);
  const lines = [];
  let currentLine = '';
  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width + safeLetterSpacing * testLine.length > maxContentWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) lines.push(currentLine);

  const lineHeightPx = Math.max(1, safeFontSize * safeLineHeight);
  let totalHeight = lines.length * lineHeightPx + safePadding * 2;
  if (safeParagraphSpacing) {
    const paragraphs = resolvedText.split(/\n\s*\n/);
    totalHeight += Math.max(0, paragraphs.length - 1) * safeParagraphSpacing;
  }

  canvas.width = Math.max(1, safeMaxWidth);
  canvas.height = Math.max(1, Math.min(safeMaxHeight, totalHeight));

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = safeBackgroundColor === 'transparent' ? 'rgba(0,0,0,0)' : safeBackgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = fontStyle;
  ctx.fillStyle = safeColor;
  ctx.textBaseline = 'top';
  ctx.shadowColor = safeTextShadowColor;
  ctx.shadowBlur = safeTextShadowBlur;
  ctx.shadowOffsetX = safeTextShadowOffsetX;
  ctx.shadowOffsetY = safeTextShadowOffsetY;

  let y = safePadding;
  const contentHeight = lines.length * lineHeightPx;
  if (safeVerticalAlign === 'center') {
    y = (canvas.height - contentHeight) / 2;
  }
  if (safeVerticalAlign === 'bottom') {
    y = canvas.height - contentHeight - safePadding;
  }

  const drawLine = (line, yPos) => {
    let x = safePadding;
    const lineWidth = ctx.measureText(line).width + safeLetterSpacing * line.length;
    if (safeAlignment === 'center') x = (canvas.width - lineWidth) / 2;
    if (safeAlignment === 'right') x = canvas.width - lineWidth - safePadding;
    if (safeAlignment === 'justify' && line.includes(' ')) {
      const wordsInLine = line.split(' ');
      const gapCount = wordsInLine.length - 1;
      const totalWordWidth = wordsInLine.reduce((sum, word) => sum + ctx.measureText(word).width, 0);
      const gapSize = (maxContentWidth - totalWordWidth) / gapCount;
      let cursor = safePadding;
      wordsInLine.forEach((word) => {
        ctx.fillText(word, cursor, yPos);
        cursor += ctx.measureText(word).width + gapSize;
      });
      return;
    }

    if (safeTextBackgroundColor !== 'transparent') {
      ctx.fillStyle = safeTextBackgroundColor;
      ctx.fillRect(x - 4, yPos - 2, lineWidth + 8, lineHeightPx + 4);
      ctx.fillStyle = safeColor;
    }

    if (safeEnableHighlight && safeHighlightColor !== 'transparent') {
      ctx.fillStyle = safeHighlightColor;
      ctx.fillRect(x - 4, yPos - 2, lineWidth + 8, lineHeightPx + 4);
      ctx.fillStyle = safeColor;
    }

    ctx.fillText(line, x, yPos);

    if (safeTextDecoration !== 'none') {
      ctx.strokeStyle = safeColor;
      ctx.lineWidth = Math.max(1, safeFontSize / 14);
      let decorationY = yPos + lineHeightPx;
      if (safeTextDecoration === 'underline') decorationY = yPos + lineHeightPx - 4;
      if (safeTextDecoration === 'overline') decorationY = yPos + 2;
      if (safeTextDecoration === 'line-through') decorationY = yPos + lineHeightPx / 2;
      ctx.beginPath();
      ctx.moveTo(x, decorationY);
      ctx.lineTo(x + lineWidth, decorationY);
      ctx.stroke();
    }
  };

  const maxLines = Math.max(1, Math.floor((canvas.height - safePadding * 2) / lineHeightPx));
  const renderLines = lines.slice(0, maxLines);
  renderLines.forEach((line, index) => {
    const lineY = y + index * lineHeightPx;
    if (safeTextOverflow === 'ellipsis' && index === maxLines - 1 && lines.length > maxLines) {
      const ellipsis = `${line}…`;
      drawLine(ellipsis, lineY);
    } else if (safeTextOverflow === 'clip' && index === maxLines - 1 && lines.length > maxLines) {
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
  const interactionMode = useStore((state) => state.interactionMode);
  const setInteractionMode = useStore((state) => state.setInteractionMode);
  const [selectedMesh, setSelectedMesh] = useState(null);
  const [hexInput, setHexInput] = useState('#FFFFFF');
  const [rgbInput, setRgbInput] = useState('255, 255, 255');
  const initializedMaterialsRef = useRef(false);
  const pendingColorRef = useRef(null);
  const [fingerprintsTexture, scratchesTexture] = useTexture([
    '/textures/Fingerprints002_2K-JPG_Roughness.jpg',
    '/textures/Scratches003_2K-JPG_Color.jpg'
  ]);
  const imageUrls = useMemo(() => images.map((image) => image.url), [images]);
  const imageTextures = useTexture(imageUrls);
  const deferredTexts = useDeferredValue(texts);
  const [alphaTextures, setAlphaTextures] = useState([]);
  const [textTextureMap, setTextTextureMap] = useState(() => new Map());
  const alphaTextureCache = useRef(new Map());
  const textTextureCache = useRef(new Map());

  const refreshTextTextureMap = useCallback(() => {
    setTextTextureMap(new Map(textTextureCache.current));
  }, []);

  useEffect(() => {
    const nextTextures = images.map((image) => {
      const cached = alphaTextureCache.current.get(image.id);
      if (cached && cached.cornerRadius === image.cornerRadius) {
        return cached.texture;
      }
      if (cached?.texture) {
        cached.texture.dispose?.();
      }
      const radius = image.cornerRadius / 50;
      const texture = createRoundedAlphaTexture(radius);
      alphaTextureCache.current.set(image.id, { cornerRadius: image.cornerRadius, texture });
      return texture;
    });
    nextTextures.forEach((texture) => {
      if (texture) {
        texture.needsUpdate = true;
      }
    });
    setAlphaTextures(nextTextures);
  }, [images]);

  useEffect(() => {
    if (!deferredTexts.length) return;
    let didUpdate = false;
    deferredTexts.forEach((text) => {
      const signature = buildTextSignature(text);
      const cached = textTextureCache.current.get(text.id);
      if (cached && cached.signature === signature) {
        return;
      }
      const result = createTextTexture(text);
      const entry = { id: text.id, signature, ...result };
      textTextureCache.current.set(text.id, entry);
      didUpdate = true;
    });
    if (didUpdate) {
      refreshTextTextureMap();
    }
  }, [deferredTexts, refreshTextTextureMap]);

  useEffect(() => {
    const ids = new Set(images.map((image) => image.id));
    alphaTextureCache.current.forEach((entry, id) => {
      if (!ids.has(id)) {
        entry.texture.dispose?.();
        alphaTextureCache.current.delete(id);
      }
    });
  }, [images]);

  useEffect(() => {
    const ids = new Set(deferredTexts.map((text) => text.id));
    let didUpdate = false;
    textTextureCache.current.forEach((entry, id) => {
      if (!ids.has(id)) {
        entry.texture.dispose?.();
        textTextureCache.current.delete(id);
        didUpdate = true;
      }
    });
    if (didUpdate) {
      refreshTextTextureMap();
    }
  }, [deferredTexts, refreshTextTextureMap]);

  useEffect(() => {
    const alphaCache = alphaTextureCache.current;
    const textCache = textTextureCache.current;
    return () => {
      alphaCache.forEach((entry) => entry.texture.dispose?.());
      alphaCache.clear();
      textCache.forEach((entry) => entry.texture.dispose?.());
      textCache.clear();
    };
  }, []);

  useEffect(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    imageTextures.forEach((texture) => {
      if (!texture) return;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = maxAnisotropy;
      texture.needsUpdate = true;
    });
  }, [gl, imageTextures]);

  useEffect(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    textTextureMap.forEach((entry) => {
      if (!entry?.texture) return;
      entry.texture.colorSpace = THREE.SRGBColorSpace;
      entry.texture.anisotropy = maxAnisotropy;
      entry.texture.needsUpdate = true;
    });
  }, [gl, textTextureMap]);

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
      if (e.object?.material?.color) {
        const color = e.object.material.color;
        setHexInput(formatHex(color));
        setRgbInput(formatRgb(color));
      }
    }
  };

  const handleClosePopup = (e) => {
    e.stopPropagation();
    setInteractionMode('view');
    setSelectedMesh(null);
  };

  const handleColorChange = (newColor) => {
    if (selectedMesh?.material) {
      selectedMesh.material.color.set(newColor);
      const color = new THREE.Color(newColor);
      setHexInput(formatHex(color));
      setRgbInput(formatRgb(color));
      pendingColorRef.current = newColor;
    }
  };

  const handleCommitColor = useCallback(() => {
    if (!selectedMesh || !pendingColorRef.current || !onMaterialColorChange) return;
    onMaterialColorChange(selectedMesh.name || selectedMesh.uuid, pendingColorRef.current);
    pendingColorRef.current = null;
  }, [onMaterialColorChange, selectedMesh]);

  return (
    <group onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
      <Center top>
        <primitive object={scene} />
      </Center>
      {images.map((image, index) => {
      const texture = imageTextures[index];
      const alphaMap = alphaTextures[index];
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
        const textureData = textTextureMap.get(text.id);
        if (!textureData) return null;
        const { texture, width, height } = textureData;
        const position = text.position ?? { x: 0, y: 0, z: 0 };
        const rotation = text.rotation ?? { x: 0, y: 0, z: 0 };
        const scale = Number.isFinite(text.scale) ? text.scale : 1;

        const safeWidth = Number.isFinite(width) && width > 0 ? width : 1;
        const safeHeight = Number.isFinite(height) && height > 0 ? height : 1;
        const aspect = safeWidth / safeHeight;
        const planeWidth = 1.2;
        const planeHeight = planeWidth / aspect;

        return (
          <mesh
            key={text.id}
            position={[position.x, position.y, position.z]}
            rotation={[
              THREE.MathUtils.degToRad(rotation.x),
              THREE.MathUtils.degToRad(rotation.y),
              THREE.MathUtils.degToRad(rotation.z)
            ]}
            scale={[scale, scale, scale]}
            renderOrder={5}
          >
            <planeGeometry args={[planeWidth, planeHeight]} />
            <meshBasicMaterial
              map={texture}
              transparent
              alphaTest={0.01}
              depthTest={false}
              depthWrite={false}
              side={THREE.DoubleSide}
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
               onPointerUp={handleCommitColor}
               onMouseLeave={handleCommitColor}
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
