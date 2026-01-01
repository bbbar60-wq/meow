const ROUNDED_MAX = 1;

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

function createTextBitmap(textConfig) {
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

  const canvas = new OffscreenCanvas(maxWidth, maxHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { bitmap: null, width: maxWidth, height: maxHeight };
  }

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

  const clampedHeight = Math.min(maxHeight, totalHeight);
  canvas.height = clampedHeight;

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
  const renderLines = lines.slice(0, Math.max(ROUNDED_MAX, maxLines));
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

  return { canvas, width: canvas.width, height: canvas.height };
}

self.onmessage = async (event) => {
  const { id, signature, config } = event.data || {};
  if (!id || !config) return;
  const { canvas, width, height } = createTextBitmap(config);
  if (!canvas) return;
  const bitmap = await createImageBitmap(canvas);
  self.postMessage({ id, signature, width, height, bitmap }, [bitmap]);
};
