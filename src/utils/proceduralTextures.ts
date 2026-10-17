import * as THREE from 'three';

// Procedural PBR Textures for LEX VERA Courtroom Materials
// Authentic American Black Walnut (dark, fine longitudinal grain, satiny oil finish)
// Restrained brushed brass accents (non-copper, high metalness)

export interface WoodPBRMaps {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

export function createDarkWalnutPBR(_orientation: 'longitudinal' | 'radial' = 'longitudinal'): WoodPBRMaps {
  const width = 2048;
  const height = 1024;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d')!;

  // 1. Base Dark American Walnut Tone (natural espresso, umber, deep warm brown - NO orange/candy tones)
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#1f150e');
  grad.addColorStop(0.35, '#291c13');
  grad.addColorStop(0.7, '#24180f');
  grad.addColorStop(1, '#1b120c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 2. Fine longitudinal wood grain fibers
  // In our UV mapping, the V axis (height) is the longitudinal axis of the turned wood piece.
  // The grain lines run along V, with high-frequency organic variations along U (width).
  for (let y = 0; y < height; y++) {
    const vNorm = y / height;

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Organic grain flow along the length:
      // Subtle wandering of wood grain fibers
      const wander = Math.sin(vNorm * 8.0) * 12.0 + Math.sin(vNorm * 22.0) * 4.0;
      const fiberCoord = (x + wander) * 0.18;

      // Fine grain frequency & tracheid pores
      const fiber = Math.sin(fiberCoord) * 0.5 + 0.5;
      const fineNoise = Math.sin((x + wander * 0.5) * 1.4) * Math.cos(vNorm * 60.0);
      const ringDensity = Math.pow(fiber, 3.2) * 22.0;

      // Deep heartwood tone variations (darker umber pores, subtle caramel heartwood)
      const shift = ringDensity + fineNoise * 4.0 - 8.0;

      // Clamp within deep dark walnut gamut: R ~ 35..65, G ~ 24..45, B ~ 16..32
      data[idx]     = Math.min(68, Math.max(26, data[idx]     + shift * 0.55)); // R
      data[idx + 1] = Math.min(48, Math.max(18, data[idx + 1] + shift * 0.40)); // G
      data[idx + 2] = Math.min(35, Math.max(12, data[idx + 2] + shift * 0.28)); // B
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. Subtle micro-pores aligned with the grain (natural wood tracheid vessels)
  ctx.fillStyle = 'rgba(12, 8, 5, 0.45)';
  for (let i = 0; i < 5000; i++) {
    const px = Math.random() * width;
    const py = Math.random() * height;
    const pLength = Math.random() * 12 + 4; // Long thin vessels along grain
    ctx.fillRect(px, py, 0.9, pLength);
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  // 4. Roughness Map: Satiny Hand-Rubbed Oil Polish (0.38 - 0.48 roughness, non-glossy, non-metallic)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = '#686868'; // baseline 0.41 roughness
  rCtx.fillRect(0, 0, width, height);

  const rImgData = rCtx.getImageData(0, 0, width, height);
  const rData = rImgData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Darker pores are slightly rougher (less specular)
    const luma = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const val = 105 + (50 - luma) * 0.8;
    rData[i] = val;
    rData[i + 1] = val;
    rData[i + 2] = val;
  }
  rCtx.putImageData(rImgData, 0, 0);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  // 5. Bump Map: Fine micro-relief of grain
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.drawImage(colorCanvas, 0, 0);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, roughnessMap, bumpMap };
}

// Backward compatibility alias
export const createMahoganyWoodPBR = createDarkWalnutPBR;

export function createBrushedBrassPBR(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Restrained Pale Champagne / Antique Brass (not bright copper/orange)
  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, '#c6a258');
  grad.addColorStop(0.3, '#dfbf78');
  grad.addColorStop(0.7, '#c29d50');
  grad.addColorStop(1, '#b59247');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Fine circumferential micro-brushing
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 3000; i++) {
    const y = Math.random() * size;
    ctx.fillRect(0, y, size, Math.random() * 1.2);
  }
  ctx.fillStyle = 'rgba(40, 28, 12, 0.06)';
  for (let i = 0; i < 3000; i++) {
    const y = Math.random() * size;
    ctx.fillRect(0, y, size, Math.random() * 1.2);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  // Roughness Map: 0.26 - 0.32 brushed metal sheen
  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#4c4c4c'; // ~0.30 roughness
  rCtx.fillRect(0, 0, size, size);

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(canvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, roughnessMap, bumpMap };
}

export function createJudgeBenchWoodPBR(): WoodPBRMaps {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Deep Courtroom Wainscot Dark Oak
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#150e09');
  grad.addColorStop(0.5, '#1e140d');
  grad.addColorStop(1, '#130c08');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subdued architectural planking
  const plankHeight = height / 4;
  ctx.strokeStyle = 'rgba(8, 4, 2, 0.85)';
  ctx.lineWidth = 3;
  for (let p = 1; p < 4; p++) {
    ctx.beginPath();
    ctx.moveTo(0, p * plankHeight);
    ctx.lineTo(width, p * plankHeight);
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const rCanvas = document.createElement('canvas');
  rCanvas.width = width;
  rCanvas.height = height;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#5c5c5c'; // 0.36 roughness
  rCtx.fillRect(0, 0, width, height);
  const roughnessMap = new THREE.CanvasTexture(rCanvas);

  return { map, roughnessMap, bumpMap: map };
}
