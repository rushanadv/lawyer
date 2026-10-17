import * as THREE from 'three';

// Utility to generate high-resolution photorealistic PBR textures at runtime
// Guarantees zero loading latency, zero 404s, and physically accurate wood/brass relief

export interface WoodPBRMaps {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

export function createMahoganyWoodPBR(): WoodPBRMaps {
  const width = 2048;
  const height = 1024;

  // 1. Color Map
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const colorCtx = colorCanvas.getContext('2d')!;

  // Base rich dark mahogany gradient
  const grad = colorCtx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#2b140c');
  grad.addColorStop(0.3, '#3d1d12');
  grad.addColorStop(0.6, '#26110a');
  grad.addColorStop(1, '#35170e');
  colorCtx.fillStyle = grad;
  colorCtx.fillRect(0, 0, width, height);

  // Longitudinal wood grain fibers
  const imgData = colorCtx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Create organic wood grain variation using frequency noise
  for (let y = 0; y < height; y++) {
    // Large grain wavelength
    const wave1 = Math.sin(y * 0.04) * 15;
    const wave2 = Math.sin(y * 0.12 + Math.cos(y * 0.02)) * 8;
    const wave3 = Math.sin(y * 0.3) * 3;
    const grainPos = y + wave1 + wave2 + wave3;

    // Growth ring banding
    const ring = Math.sin(grainPos * 0.08) * 0.5 + 0.5;
    const ringSharp = Math.pow(ring, 3) * 35;

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Micro fiber noise along x axis
      const fiberNoise = (Math.sin(x * 0.8 + y * 4) * 0.5 + 0.5) * 8;
      const subtleRay = (Math.sin(x * 0.02) * Math.cos(y * 0.03)) * 12;

      // Darken rings and add warm highlights
      const shift = ringSharp + fiberNoise + subtleRay - 20;

      data[idx] = Math.min(255, Math.max(20, data[idx] + shift * 0.8));       // R
      data[idx + 1] = Math.min(255, Math.max(10, data[idx + 1] + shift * 0.45)); // G
      data[idx + 2] = Math.min(255, Math.max(5, data[idx + 2] + shift * 0.25));  // B
    }
  }
  colorCtx.putImageData(imgData, 0, 0);

  // Add subtle dark pores/flecking
  colorCtx.fillStyle = 'rgba(15, 6, 3, 0.4)';
  for (let i = 0; i < 4000; i++) {
    const px = Math.random() * width;
    const py = Math.random() * height;
    const pLen = Math.random() * 8 + 3;
    colorCtx.fillRect(px, py, pLen, 0.8);
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  // 2. Roughness Map (varnished areas vs grain pores)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const roughCtx = roughCanvas.getContext('2d')!;
  roughCtx.fillStyle = '#424242'; // base medium polish (0.26 roughness)
  roughCtx.fillRect(0, 0, width, height);

  const roughImgData = roughCtx.getImageData(0, 0, width, height);
  const rData = roughImgData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Invert lightness slightly for roughness: darker grain pores are rougher
    const luma = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const rVal = 70 + (255 - luma) * 0.4;
    rData[i] = rVal;
    rData[i + 1] = rVal;
    rData[i + 2] = rVal;
  }
  roughCtx.putImageData(roughImgData, 0, 0);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  // 3. Bump / Micro-Relief Map
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bumpCtx = bumpCanvas.getContext('2d')!;
  bumpCtx.drawImage(colorCanvas, 0, 0);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, roughnessMap, bumpMap };
}

export function createBrushedBrassPBR(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm antique gold / oxidized brass gradient
  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, '#d8aa58');
  grad.addColorStop(0.5, '#f5d48e');
  grad.addColorStop(1, '#c29443');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Brushed metal micro-scratches along horizontal lathe direction
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let i = 0; i < 2500; i++) {
    const y = Math.random() * size;
    ctx.fillRect(0, y, size, Math.random() * 1.5);
  }
  ctx.fillStyle = 'rgba(60, 40, 10, 0.07)';
  for (let i = 0; i < 2500; i++) {
    const y = Math.random() * size;
    ctx.fillRect(0, y, size, Math.random() * 1.5);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  // Roughness map (smooth brushed brass ~ 0.22 - 0.32)
  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#484848';
  rCtx.fillRect(0, 0, size, size);

  const roughnessMap = new THREE.CanvasTexture(rCanvas);

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

  // Deep English Oak / Courtroom wainscot tone
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#1c100a');
  grad.addColorStop(0.5, '#28170f');
  grad.addColorStop(1, '#180d08');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Wide longitudinal planking lines
  const plankHeight = height / 4;
  ctx.strokeStyle = 'rgba(10, 5, 2, 0.7)';
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
  rCtx.fillStyle = '#555555'; // 0.35 roughness
  rCtx.fillRect(0, 0, width, height);
  const roughnessMap = new THREE.CanvasTexture(rCanvas);

  return { map, roughnessMap, bumpMap: map };
}
