import * as THREE from 'three';
import {
  createPetitionBriefTexture,
  createRedactedSettlementTexture,
  createEvidenceDocketTexture,
  createStampedAffidavitTexture,
  type LegalPaperPBR
} from './legalPaperTextures';

export interface FloatingPaper3D {
  mesh: THREE.Mesh;
  glowOutline?: THREE.LineSegments;
  basePosition: THREE.Vector3;
  baseRotation: THREE.Euler;
  driftVelocity: THREE.Vector3;
  tumbleVelocity: THREE.Vector3;
  flutterPhase: number;
  flutterSpeed: number;
  isHero: boolean;
  type: string;
}

export interface LegalPapersSceneData {
  scene: THREE.Scene;
  papers: FloatingPaper3D[];
  cameraSpline: THREE.CatmullRomCurve3;
  heroSpotlight: THREE.SpotLight;
  ambientLight: THREE.AmbientLight;
  rimLight: THREE.DirectionalLight;
  goldFillLight: THREE.PointLight;
  updatePapers: (scrollProgress: number, timeDelta: number) => void;
  dispose: () => void;
}

// Generate organic curved paper geometry with natural curl and corner bends
function createCurvedPaperGeometry(
  width = 3.6,
  height = 5.1,
  curlType: 'CYLINDER' | 'S_WAVE' | 'CORNER_FOLD' | 'GENTLE' = 'GENTLE'
): THREE.PlaneGeometry {
  const segX = 20;
  const segY = 24;
  const geo = new THREE.PlaneGeometry(width, height, segX, segY);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const normX = x / (width * 0.5);   // -1 to 1
    const normY = y / (height * 0.5);  // -1 to 1

    let zOffset = 0;

    if (curlType === 'CYLINDER') {
      // Cylindrical curl along vertical axis
      zOffset = Math.sin(normX * Math.PI * 0.6) * 0.35 + (normY * normY) * 0.12;
    } else if (curlType === 'S_WAVE') {
      // Aerodynamic S-wave billow
      zOffset = Math.sin(normY * Math.PI * 1.2) * 0.28 + Math.cos(normX * Math.PI * 0.8) * 0.18;
    } else if (curlType === 'CORNER_FOLD') {
      // Prominent top-right dog-ear fold + gentle body curve
      if (normX > 0.4 && normY > 0.4) {
        const foldDist = (normX - 0.4) + (normY - 0.4);
        zOffset = foldDist * 0.45;
      } else {
        zOffset = Math.sin(normX * Math.PI * 0.4) * 0.15;
      }
    } else {
      // Gentle natural bowing
      zOffset = (1.0 - (normX * normX)) * 0.18 + Math.sin(normY * Math.PI * 0.5) * 0.15;
    }

    pos.setZ(i, zOffset);
  }

  geo.computeVertexNormals();
  return geo;
}

// Generate back of legal paper (faint docket endorsement and bleed-through)
function createDocketBackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 724;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#EBE5D8';
  ctx.fillRect(0, 0, 512, 724);

  // Faint docket endorsement block
  ctx.strokeStyle = 'rgba(40, 32, 24, 0.25)';
  ctx.lineWidth = 1.0;
  ctx.strokeRect(60, 60, 392, 220);

  ctx.fillStyle = 'rgba(25, 20, 15, 0.45)';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('UNITED STATES DISTRICT COURT', 256, 95);
  ctx.fillText('SOUTHERN DISTRICT OF NEW YORK', 256, 115);
  ctx.fillText('LEX VERA LITIGATION DOCKET', 256, 140);
  ctx.fillText('CASE: 26-CV-88219 (LVP)', 256, 165);
  ctx.fillText('RECORD OF FILING & SERVICE', 256, 190);

  // Faint lines representing text bleed-through from front
  ctx.fillStyle = 'rgba(20, 16, 12, 0.08)';
  for (let y = 320; y < 660; y += 14) {
    ctx.fillRect(70, y, Math.random() * 260 + 100, 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Build molten golden edge contour lines for hero documents
function createMoltenEdgeLines(geometry: THREE.BufferGeometry): THREE.LineSegments {
  const edges = new THREE.EdgesGeometry(geometry, 15);
  const material = new THREE.LineBasicMaterial({
    color: 0xE2B873,
    linewidth: 2,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending
  });

  const lineSegments = new THREE.LineSegments(edges, material);
  lineSegments.scale.set(1.002, 1.002, 1.002);
  return lineSegments;
}

export function buildFloatingLegalPapersScene(): LegalPapersSceneData {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#060505');
  // Atmospheric deep dark fog with subtle warm amber undertone
  scene.fog = new THREE.FogExp2('#060505', 0.018);

  // 1. Preload / Generate Procedural Legal Document Textures
  const texturePBRs: LegalPaperPBR[] = [
    createPetitionBriefTexture(),
    createRedactedSettlementTexture(),
    createEvidenceDocketTexture(),
    createStampedAffidavitTexture()
  ];

  const backTexture = createDocketBackTexture();
  const backMaterial = new THREE.MeshStandardMaterial({
    map: backTexture,
    roughness: 0.85,
    metalness: 0.0,
    color: 0xeeeeee,
    side: THREE.BackSide
  });

  // 2. Continuous 3D Camera Spline through the Floating Papers
  // Camera travels from the dark gavel exit down into the document field,
  // weaving between foreground legal files and arriving at the manifesto portal.
  const splinePoints = [
    new THREE.Vector3(0.0, 0.0, 4.0),     // t = 0.00: Exit from dark gavel strike
    new THREE.Vector3(0.0, 0.2, -8.0),    // t = 0.15: Emergence into floating documents
    new THREE.Vector3(0.8, -0.1, -22.0),  // t = 0.30: Hero Petition Brief reveals in raking light
    new THREE.Vector3(-1.2, 0.3, -42.0),  // t = 0.48: S-curve through Redacted Settlement field
    new THREE.Vector3(1.0, -0.2, -64.0),  // t = 0.65: Gliding between floating Evidence Dockets
    new THREE.Vector3(0.2, 0.1, -86.0),   // t = 0.80: Entering golden illuminated core
    new THREE.Vector3(0.0, 0.0, -106.0),  // t = 0.92: Approaching climax gateway
    new THREE.Vector3(0.0, 0.0, -118.0)   // t = 1.00: Settle into manifesto reveal
  ];

  const cameraSpline = new THREE.CatmullRomCurve3(splinePoints, false, 'centripetal');

  // 3. Cinematic Chiaroscuro Lighting for Paper Field
  const ambientLight = new THREE.AmbientLight(0x201c18, 0.75);
  scene.add(ambientLight);

  // Tracking Hero Spotlight
  const heroSpotlight = new THREE.SpotLight(0xfffaea, 4.5, 65, Math.PI / 4.5, 0.55, 1.2);
  heroSpotlight.position.set(4, 10, -10);
  heroSpotlight.castShadow = true;
  heroSpotlight.shadow.mapSize.width = 2048;
  heroSpotlight.shadow.mapSize.height = 2048;
  heroSpotlight.shadow.bias = -0.0001;
  scene.add(heroSpotlight);
  scene.add(heroSpotlight.target);

  // Cool rim light to trace paper edges against darkness
  const rimLight = new THREE.DirectionalLight(0x7890a8, 1.2);
  rimLight.position.set(-8, 6, -30);
  scene.add(rimLight);

  // Warm golden fill from below
  const goldFillLight = new THREE.PointLight(0xc89b53, 2.8, 80, 1.4);
  goldFillLight.position.set(0, -6, -50);
  scene.add(goldFillLight);

  // 4. Spawn 30 Authentic Floating Legal Papers
  const papers: FloatingPaper3D[] = [];

  // Configured spatial distributions:
  // Layer 1: Foreground Hero Papers (Z: -12 to -35)
  // Layer 2: Midground Swarm (Z: -35 to -75)
  // Layer 3: Deep Background (Z: -75 to -115)
  const paperConfigs = [
    // --- LAYER 1: FOREGROUND HERO PAPERS (Pass intimately close to lens) ---
    {
      pos: new THREE.Vector3(1.6, 0.4, -18.0),
      rot: new THREE.Euler(0.2, -0.35, 0.12),
      scale: 1.0,
      pbrIdx: 0, // Petition Brief
      curl: 'CYLINDER' as const,
      isHero: true
    },
    {
      pos: new THREE.Vector3(-1.8, -0.3, -28.0),
      rot: new THREE.Euler(-0.25, 0.4, -0.15),
      scale: 1.05,
      pbrIdx: 1, // Redacted Settlement
      curl: 'S_WAVE' as const,
      isHero: true
    },
    {
      pos: new THREE.Vector3(2.2, 0.8, -36.0),
      rot: new THREE.Euler(0.15, -0.45, 0.22),
      scale: 0.95,
      pbrIdx: 3, // Stamped Affidavit
      curl: 'CORNER_FOLD' as const,
      isHero: true
    },
    {
      pos: new THREE.Vector3(-2.4, -0.6, -45.0),
      rot: new THREE.Euler(-0.18, 0.32, -0.28),
      scale: 1.0,
      pbrIdx: 2, // Evidence Docket
      curl: 'GENTLE' as const,
      isHero: true
    },

    // --- LAYER 2: MIDGROUND CORRIDOR (Z: -30 to -75) ---
    { pos: new THREE.Vector3(-4.2, 2.5, -32.0), rot: new THREE.Euler(0.4, 0.6, -0.2), scale: 0.85, pbrIdx: 0, curl: 'GENTLE' as const, isHero: false },
    { pos: new THREE.Vector3(4.5, -2.2, -38.0), rot: new THREE.Euler(-0.3, -0.5, 0.3), scale: 0.90, pbrIdx: 1, curl: 'CYLINDER' as const, isHero: false },
    { pos: new THREE.Vector3(-3.8, -1.8, -48.0), rot: new THREE.Euler(0.25, 0.35, -0.15), scale: 0.80, pbrIdx: 2, curl: 'S_WAVE' as const, isHero: false },
    { pos: new THREE.Vector3(3.5, 3.0, -52.0), rot: new THREE.Euler(-0.4, -0.3, 0.25), scale: 0.88, pbrIdx: 3, curl: 'CORNER_FOLD' as const, isHero: true },
    { pos: new THREE.Vector3(0.0, 3.2, -56.0), rot: new THREE.Euler(0.6, 0.1, -0.1), scale: 0.82, pbrIdx: 0, curl: 'GENTLE' as const, isHero: false },
    { pos: new THREE.Vector3(-2.8, -2.8, -60.0), rot: new THREE.Euler(-0.35, 0.45, -0.3), scale: 0.92, pbrIdx: 1, curl: 'CYLINDER' as const, isHero: false },
    { pos: new THREE.Vector3(4.0, 1.2, -65.0), rot: new THREE.Euler(0.2, -0.6, 0.18), scale: 0.85, pbrIdx: 2, curl: 'S_WAVE' as const, isHero: false },
    { pos: new THREE.Vector3(-3.5, 1.8, -70.0), rot: new THREE.Euler(-0.25, 0.3, -0.22), scale: 0.78, pbrIdx: 3, curl: 'GENTLE' as const, isHero: false },
    { pos: new THREE.Vector3(2.6, -2.5, -74.0), rot: new THREE.Euler(0.4, -0.2, 0.35), scale: 0.84, pbrIdx: 0, curl: 'CORNER_FOLD' as const, isHero: false },
    { pos: new THREE.Vector3(-1.8, 3.4, -78.0), rot: new THREE.Euler(-0.5, 0.25, -0.18), scale: 0.80, pbrIdx: 1, curl: 'CYLINDER' as const, isHero: false },

    // --- LAYER 3: DEEP BACKGROUND PARALLAX SWARM (Z: -60 to -115) ---
    { pos: new THREE.Vector3(-6.5, 4.0, -50.0), rot: new THREE.Euler(0.5, 0.8, -0.4), scale: 0.65, pbrIdx: 2, curl: 'GENTLE' as const, isHero: false },
    { pos: new THREE.Vector3(7.0, -3.5, -55.0), rot: new THREE.Euler(-0.4, -0.7, 0.5), scale: 0.70, pbrIdx: 3, curl: 'GENTLE' as const, isHero: false },
    { pos: new THREE.Vector3(-5.8, -4.2, -68.0), rot: new THREE.Euler(0.3, 0.5, -0.3), scale: 0.60, pbrIdx: 0, curl: 'GENTLE' as const, isHero: false },
    { pos: new THREE.Vector3(6.2, 4.5, -72.0), rot: new THREE.Euler(-0.6, -0.4, 0.2), scale: 0.68, pbrIdx: 1, curl: 'GENTLE' as const, isHero: false },
    { pos: new THREE.Vector3(-7.2, 1.0, -82.0), rot: new THREE.Euler(0.2, 0.9, -0.5), scale: 0.58, pbrIdx: 2, curl: 'GENTLE' as const, isHero: false },
    { pos: new THREE.Vector3(6.8, -1.5, -88.0), rot: new THREE.Euler(-0.3, -0.8, 0.4), scale: 0.62, pbrIdx: 3, curl: 'GENTLE' as const, isHero: false },
    { pos: new THREE.Vector3(-5.0, 5.2, -92.0), rot: new THREE.Euler(0.7, 0.3, -0.2), scale: 0.55, pbrIdx: 0, curl: 'GENTLE' as const, isHero: false },
    { pos: new THREE.Vector3(5.5, -4.8, -96.0), rot: new THREE.Euler(-0.5, -0.6, 0.3), scale: 0.58, pbrIdx: 1, curl: 'GENTLE' as const, isHero: false },
    { pos: new THREE.Vector3(-4.5, -3.8, -104.0), rot: new THREE.Euler(0.4, 0.4, -0.4), scale: 0.52, pbrIdx: 2, curl: 'GENTLE' as const, isHero: false },
    { pos: new THREE.Vector3(4.8, 4.0, -108.0), rot: new THREE.Euler(-0.4, -0.5, 0.3), scale: 0.56, pbrIdx: 3, curl: 'GENTLE' as const, isHero: false },
    { pos: new THREE.Vector3(-3.2, 2.8, -114.0), rot: new THREE.Euler(0.3, 0.6, -0.2), scale: 0.50, pbrIdx: 0, curl: 'GENTLE' as const, isHero: false },
    { pos: new THREE.Vector3(3.0, -3.0, -116.0), rot: new THREE.Euler(-0.2, -0.5, 0.25), scale: 0.48, pbrIdx: 1, curl: 'GENTLE' as const, isHero: false }
  ];

  paperConfigs.forEach((cfg) => {
    const pbr = texturePBRs[cfg.pbrIdx];
    const geo = createCurvedPaperGeometry(3.6 * cfg.scale, 5.1 * cfg.scale, cfg.curl);

    // Front material with legal document texture
    const frontMaterial = new THREE.MeshStandardMaterial({
      map: pbr.map,
      roughnessMap: pbr.roughnessMap,
      bumpMap: pbr.bumpMap,
      bumpScale: 0.002,
      roughness: 0.82,
      metalness: 0.0,
      color: 0xffffff,
      side: THREE.FrontSide
    });

    // Create double-sided dual material mesh
    const frontMesh = new THREE.Mesh(geo, frontMaterial);
    const backMesh = new THREE.Mesh(geo, backMaterial);
    frontMesh.castShadow = true;
    frontMesh.receiveShadow = true;

    const paperGroup = new THREE.Group();
    paperGroup.add(frontMesh);
    paperGroup.add(backMesh);

    paperGroup.position.copy(cfg.pos);
    paperGroup.rotation.copy(cfg.rot);

    // If hero paper, attach glowing molten gold contour lines
    let glowOutline: THREE.LineSegments | undefined;
    if (cfg.isHero) {
      glowOutline = createMoltenEdgeLines(geo);
      paperGroup.add(glowOutline);
    }

    scene.add(paperGroup);

    // Aerodynamic drift velocity and subtle tumbling
    const driftVelocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.15,
      (Math.random() - 0.5) * 0.12,
      (Math.random() - 0.5) * 0.20
    );

    const tumbleVelocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.08,
      (Math.random() - 0.5) * 0.06,
      (Math.random() - 0.5) * 0.05
    );

    papers.push({
      mesh: paperGroup as any,
      glowOutline,
      basePosition: cfg.pos.clone(),
      baseRotation: cfg.rot.clone(),
      driftVelocity,
      tumbleVelocity,
      flutterPhase: Math.random() * Math.PI * 2,
      flutterSpeed: 0.8 + Math.random() * 0.6,
      isHero: cfg.isHero,
      type: pbr.type
    });
  });

  // 5. Continuous Scroll Animation Function
  let elapsedTime = 0;

  const updatePapers = (scrollProgress: number, timeDelta: number) => {
    elapsedTime += timeDelta;

    papers.forEach((p, idx) => {
      // Continuous aerodynamic flutter & floating oscillation
      const flutter = Math.sin(elapsedTime * p.flutterSpeed + p.flutterPhase) * 0.08;
      const wobble = Math.cos(elapsedTime * (p.flutterSpeed * 0.7) + p.flutterPhase) * 0.06;

      // Scroll-driven forward drift + parallax displacement
      // As user scrolls, papers drift smoothly along streamlines
      const scrollDrift = scrollProgress * 14.0;

      p.mesh.position.x = p.basePosition.x + p.driftVelocity.x * scrollDrift + Math.sin(elapsedTime * 0.5 + idx) * 0.12;
      p.mesh.position.y = p.basePosition.y + flutter + p.driftVelocity.y * scrollDrift;
      p.mesh.position.z = p.basePosition.z + scrollDrift * 0.8;

      // Tumbling rotation around local axes
      p.mesh.rotation.x = p.baseRotation.x + scrollProgress * p.tumbleVelocity.x * 2.5 + wobble * 0.2;
      p.mesh.rotation.y = p.baseRotation.y + scrollProgress * p.tumbleVelocity.y * 3.0 + flutter * 0.15;
      p.mesh.rotation.z = p.baseRotation.z + scrollProgress * p.tumbleVelocity.z * 1.5;

      // Pulse hero glowing edge contours with molten gold energy
      if (p.glowOutline) {
        const mat = p.glowOutline.material as THREE.LineBasicMaterial;
        const pulse = 0.65 + Math.sin(elapsedTime * 2.5 + p.flutterPhase) * 0.35;
        mat.opacity = pulse;
      }
    });

    // Tracking hero spotlight position follows the camera progress
    const camPt = cameraSpline.getPointAt(scrollProgress);
    heroSpotlight.position.set(camPt.x + 3.5, camPt.y + 6.0, camPt.z + 5.0);
    heroSpotlight.target.position.set(camPt.x, camPt.y - 0.5, camPt.z - 12.0);
    heroSpotlight.target.updateMatrixWorld();
  };

  const dispose = () => {
    papers.forEach((p) => {
      scene.remove(p.mesh);
    });
  };

  return {
    scene,
    papers,
    cameraSpline,
    heroSpotlight,
    ambientLight,
    rimLight,
    goldFillLight,
    updatePapers,
    dispose
  };
}
