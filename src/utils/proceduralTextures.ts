import * as THREE from 'three';

// Procedural Photorealistic PBR Textures for LEX VERA Courtroom Materials
// Authentic American Black Walnut (deep umber/espresso tones, natural non-repeating grain, satiny oil finish)
// Muted antique brushed brass (restrained, non-reflective, warm patina)

export interface WoodPBRMaps {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

// Pseudo-random noise with fractional Brownian motion (fBm)
function pseudoNoise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;

  // Cubic Hermite curve
  const u = fx * fx * (3.0 - 2.0 * fx);
  const v = fy * fy * (3.0 - 2.0 * fy);

  const a = pseudoNoise2D(i, j);
  const b = pseudoNoise2D(i + 1, j);
  const c = pseudoNoise2D(i, j + 1);
  const d = pseudoNoise2D(i + 1, j + 1);

  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function fbm(x: number, y: number, octaves = 4): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let o = 0; o < octaves; o++) {
    val += smoothNoise(x * freq, y * freq) * amp;
    freq *= 2.05;
    amp *= 0.5;
  }
  return val;
}

export function createDarkWalnutPBR(): WoodPBRMaps {
  const width = 2048;
  const height = 1024;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d')!;

  // 1. Base Dark American Walnut Tone (natural umber, espresso, charcoal-brown)
  // Base Palette: Deep heartwood: #2e2218, Espresso mid: #3c2c20, Warm grain: #4c3828
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // Precompute wood grain flow
  for (let y = 0; y < height; y++) {
    const v = y / height;

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const idx = (y * width + x) * 4;

      // Natural wood grain along V (longitudinal axis of the turned lathe piece)
      // Multi-octave organic drift (simulates true tree growth irregularities without periodic repeating lines)
      const drift = fbm(u * 2.5, v * 1.2, 3) * 1.5 + fbm(u * 6.0, v * 3.0, 2) * 0.3;
      const grainPos = (u * 6.5 + drift) * Math.PI * 2.0;

      // Logarithmic growth ring distribution (natural tree rings are non-uniform in spacing)
      const ringNoise = fbm(u * 4.0, v * 0.8, 3) * 0.4;
      const rawRing = Math.sin(grainPos + ringNoise);
      // Asymmetric ring density: soft earlywood to latewood transition
      const ring = Math.pow(Math.abs(rawRing), 1.8);

      // Micro-grain fiber texture
      const microFiber = smoothNoise(u * 160.0 + drift * 10.0, v * 30.0) * 0.25;

      // Final tone modulation: dark espresso heartwood with subtle wood grain
      const tone = ring * 0.6 + microFiber;

      // Color mapping: strictly Dark American Walnut (rich umber/espresso, zero orange, zero yellow)
      // Dark pore: R: 46, G: 34, B: 24 (#2e2218)
      // Rich base: R: 60, G: 44, B: 31 (#3c2c1f)
      // Subtle growth ring: R: 76, G: 56, B: 40 (#4c3828)
      const r = Math.round(THREE.MathUtils.lerp(46, 76, tone));
      const g = Math.round(THREE.MathUtils.lerp(34, 56, tone));
      const b = Math.round(THREE.MathUtils.lerp(24, 40, tone));

      data[idx]     = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  // 2. Micro-pores and natural vessel elements (tiny elongated pores along the grain)
  ctx.putImageData(imgData, 0, 0);

  ctx.fillStyle = 'rgba(28, 20, 14, 0.45)';
  for (let i = 0; i < 3000; i++) {
    const px = Math.random() * width;
    const py = Math.random() * height;
    const pLength = Math.random() * 6 + 2;
    ctx.fillRect(px, py, 0.8, pLength);
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  // 3. Roughness Map: Satiny Hand-Rubbed Oil Polish (0.60 to 0.74 roughness)
  // Non-glossy, soft diffused sheen, authentic Danish oil rubbed finish
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;

  const rImgData = rCtx.createImageData(width, height);
  const rData = rImgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const colorVal = data[idx]; // 46 to 76

      // Darker grain lines and pores are slightly more matte (~0.72)
      // Dense wood fibers have soft satiny polish (~0.60)
      const norm = (colorVal - 46) / 30;
      const roughnessVal = Math.round(THREE.MathUtils.lerp(185, 152, norm)); // 152..185 / 255 = 0.60..0.72

      rData[idx]     = roughnessVal;
      rData[idx + 1] = roughnessVal;
      rData[idx + 2] = roughnessVal;
      rData[idx + 3] = 255;
    }
  }
  rCtx.putImageData(rImgData, 0, 0);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  // 4. Subtle Tactile Bump Map
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;

  const bImgData = bCtx.createImageData(width, height);
  const bData = bImgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const bumpVal = Math.round((data[i] - 46) * 1.8);
    bData[i]     = bumpVal;
    bData[i + 1] = bumpVal;
    bData[i + 2] = bumpVal;
    bData[i + 3] = 255;
  }
  bCtx.putImageData(bImgData, 0, 0);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, roughnessMap, bumpMap };
}

// Dedicated Sound Block PBR: Smooth end-grain and gentle radial concentric rings (no harsh moiré stripes)
export function createSoundBlockWalnutPBR(): WoodPBRMaps {
  const size = 1024;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  const cx = size * 0.5;
  const cy = size * 0.5;

  for (let y = 0; y < size; y++) {
    const ny = (y - cy) / (size * 0.5);

    for (let x = 0; x < size; x++) {
      const nx = (x - cx) / (size * 0.5);
      const idx = (y * size + x) * 4;

      const dist = Math.sqrt(nx * nx + ny * ny);
      // Gentle organic drift in rings
      const angle = Math.atan2(ny, nx);
      const wobble = fbm(nx * 1.5, ny * 1.5, 3) * 0.12 + Math.sin(angle * 3.0) * 0.03;
      const ringRadius = dist * 4.2 + wobble;

      const rawRing = Math.sin(ringRadius * Math.PI * 2.0);
      const ring = Math.pow(Math.abs(rawRing), 2.0);
      const microFibers = smoothNoise(x * 0.08, y * 0.08) * 0.2;
      const tone = ring * 0.5 + microFibers;

      const r = Math.round(THREE.MathUtils.lerp(44, 72, tone));
      const g = Math.round(THREE.MathUtils.lerp(32, 53, tone));
      const b = Math.round(THREE.MathUtils.lerp(22, 38, tone));

      data[idx]     = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  // Roughness: Satiny smooth striking surface
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = '#9e9e9e'; // ~0.62 satiny oil roughness
  rCtx.fillRect(0, 0, size, size);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);

  // Bump: Very subtle tactile variation
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;
  const bImgData = bCtx.createImageData(size, size);
  const bData = bImgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const bumpVal = Math.round((data[i] - 44) * 0.8);
    bData[i]     = bumpVal;
    bData[i + 1] = bumpVal;
    bData[i + 2] = bumpVal;
    bData[i + 3] = 255;
  }
  bCtx.putImageData(bImgData, 0, 0);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);

  return { map, roughnessMap, bumpMap };
}

// Muted Antique Brushed Brass (understated, warm bronze/brass patina, low specularity)
export function createBrushedBrassPBR(): WoodPBRMaps {
  const width = 1024;
  const height = 512;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d')!;

  // Understated warm antique bronze/brass base
  ctx.fillStyle = '#6e5836';
  ctx.fillRect(0, 0, width, height);

  // Hairline lathe turning marks
  ctx.fillStyle = 'rgba(135, 110, 70, 0.15)';
  for (let y = 0; y < height; y += 2) {
    ctx.fillRect(0, y, width, 1);
  }

  // Subtle directional micro-brushing
  ctx.fillStyle = 'rgba(75, 58, 34, 0.20)';
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.fillRect(x, y, Math.random() * 30 + 10, 1);
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  // Roughness: brushed matte metal (0.40 - 0.48)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = '#727272'; // ~0.45 roughness
  rCtx.fillRect(0, 0, width, height);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  // Bump: fine turned ring grooves
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, width, height);

  bCtx.fillStyle = '#656565';
  for (let y = 0; y < height; y += 4) {
    bCtx.fillRect(0, y, width, 1);
  }

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, roughnessMap, bumpMap };
}

// Smoked Charcoal Oak for Courtroom Architecture (matte, dark, zero distraction)
export function createJudgeBenchWoodPBR(): WoodPBRMaps {
  const width = 1024;
  const height = 512;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d')!;

  ctx.fillStyle = '#100d0a';
  ctx.fillRect(0, 0, width, height);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = '#b0b0b0'; // 0.69 matte
  rCtx.fillRect(0, 0, width, height);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  const bumpMap = roughnessMap;

  return { map, roughnessMap, bumpMap };
}
