import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface Letter3D {
  mesh: THREE.Mesh;
  char: string;
  word: 'JUSTICE' | 'ACCESS' | 'CLARITY';
  index: number;
  basePos: THREE.Vector3;
  baseRot: THREE.Euler;
  displacedPos: THREE.Vector3;
  displacedRot: THREE.Euler;
  fragmentedPos?: THREE.Vector3;
  fragmentedRot?: THREE.Euler;
}

export interface ManifestoSceneData {
  scene: THREE.Scene;
  letters: Letter3D[];
  justiceGroup: THREE.Group;
  accessGroup: THREE.Group;
  clarityGroup: THREE.Group;
  keyLight: THREE.SpotLight;
  fillLight: THREE.DirectionalLight;
  rimLight: THREE.PointLight;
  ambientLight: THREE.AmbientLight;
  dispose: () => void;
}

let cachedFont: Font | null = null;

export async function loadCinzelFont(): Promise<Font> {
  if (cachedFont) return cachedFont;
  const res = await fetch('/fonts/cinzel.typeface.json');
  if (!res.ok) {
    throw new Error(`Failed to load Cinzel typeface JSON: ${res.statusText}`);
  }
  const json = await res.json();
  const loader = new FontLoader();
  cachedFont = loader.parse(json);
  return cachedFont;
}

export function buildTypographicManifestoScene(font: Font): ManifestoSceneData {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#080808');
  // Atmospheric depth fog to seamlessly swallow distant geometry and dissolve courtroom
  scene.fog = new THREE.FogExp2('#080808', 0.013);

  // Station Group containers
  const justiceGroup = new THREE.Group();
  justiceGroup.position.set(0, 0, -48);
  scene.add(justiceGroup);

  const accessGroup = new THREE.Group();
  accessGroup.position.set(0, 0, -108);
  scene.add(accessGroup);

  const clarityGroup = new THREE.Group();
  clarityGroup.position.set(0, 0, -168);
  scene.add(clarityGroup);

  // Materials: Monumental Warm Ivory (#F0EAE0) with fine architectural roughness & subtle sheen
  const ivoryMaterial = new THREE.MeshStandardMaterial({
    color: 0xF0EAE0,
    roughness: 0.36,
    metalness: 0.05,
    bumpScale: 0.002
  });

  // Lighting Setup: Dramatic, cinematic studio illumination
  const ambientLight = new THREE.AmbientLight(0x221f1c, 1.4);
  scene.add(ambientLight);

  // Moving Key Spotlight that tracks with the camera
  const keyLight = new THREE.SpotLight(0xfffaec, 380, 160, Math.PI / 4, 0.40, 1.2);
  keyLight.position.set(10, 15, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);
  scene.add(keyLight.target);

  // Cool architectural fill
  const fillLight = new THREE.DirectionalLight(0xd4e4f5, 1.0);
  fillLight.position.set(-14, -6, -50);
  scene.add(fillLight);

  // Warm luxury rim backlight
  const rimLight = new THREE.PointLight(0xc89b53, 260, 140, 1.4);
  rimLight.position.set(-4, 6, -110);
  scene.add(rimLight);

  const letters: Letter3D[] = [];

  const createLetterMesh = (char: string, size: number, depth: number) => {
    const rawGeo = new TextGeometry(char, {
      font,
      size,
      depth,
      curveSegments: 5,
      bevelEnabled: true,
      bevelThickness: 0.10,
      bevelSize: 0.05,
      bevelSegments: 2
    });
    // Center geometry so all rotations/pivots occur around letter centroid
    rawGeo.center();
    const creasedGeo = BufferGeometryUtils.toCreasedNormals(rawGeo, Math.PI / 4);
    rawGeo.dispose();

    const mesh = new THREE.Mesh(creasedGeo, ivoryMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // ========================================================
  // 1. WORD: JUSTICE (Station at Z = -48)
  // Perfectly readable initially, then separates for flight between S and T
  // ========================================================
  const justiceChars = ['J', 'U', 'S', 'T', 'I', 'C', 'E'];
  const justiceSize = 5.2;
  const justiceDepth = 1.2;

  // Base aligned kerning offsets (centered around X = 0)
  const justiceBaseX = [-8.8, -5.8, -2.8, 0.0, 2.4, 5.2, 8.4];

  // Displaced / separated offsets creating generous 11-unit opening between S and T
  const justiceDispX = [-14.5, -10.2, -5.8, 5.4, 8.8, 12.2, 16.5];
  const justiceDispY = [1.6, -1.4, 1.8, 1.8, -1.8, 1.2, -1.5];
  const justiceDispZ = [2.2, -2.0, 1.5, -2.8, 1.4, -2.0, 1.8];
  const justiceRotY = [-0.16, -0.07, -0.05, 0.10, 0.05, 0.12, 0.18];
  const justiceRotZ = [0.03, -0.04, 0.06, -0.05, 0.05, -0.03, 0.04];

  justiceChars.forEach((char, i) => {
    const mesh = createLetterMesh(char, justiceSize, justiceDepth);
    const basePos = new THREE.Vector3(justiceBaseX[i], 0, 0);
    const baseRot = new THREE.Euler(0, 0, 0);

    const displacedPos = new THREE.Vector3(
      justiceDispX[i],
      justiceDispY[i],
      justiceDispZ[i]
    );
    const displacedRot = new THREE.Euler(0, justiceRotY[i], justiceRotZ[i]);

    mesh.position.copy(basePos);
    mesh.rotation.copy(baseRot);
    justiceGroup.add(mesh);

    letters.push({
      mesh,
      char,
      word: 'JUSTICE',
      index: i,
      basePos,
      baseRot,
      displacedPos,
      displacedRot
    });
  });

  // ========================================================
  // 2. WORD: ACCESS (Station at Z = -108)
  // Monolithic tight cluster initially, expands outward with vertical rotations
  // ========================================================
  const accessChars = ['A', 'C', 'C', 'E', 'S', 'S'];
  const accessSize = 5.2;
  const accessDepth = 1.2;

  // Compressed base positions
  const accessBaseX = [-6.2, -3.5, -1.1, 1.4, 3.8, 6.2];

  // Expansive architectural layout creating S-curve gateway between C2 and E
  const accessDispX = [-11.5, -6.8, -2.2, 5.5, 9.8, 14.2];
  const accessDispY = [0.5, -1.2, 1.0, 1.2, -1.4, 0.6];
  const accessDispZ = [-2.5, 2.0, -2.0, 2.2, -2.6, 1.5];
  const accessRotY = [0.18, 0.10, -0.14, 0.16, -0.12, 0.22];
  const accessRotZ = [-0.03, 0.04, -0.05, 0.06, -0.04, 0.05];

  accessChars.forEach((char, i) => {
    const mesh = createLetterMesh(char, accessSize, accessDepth);
    const basePos = new THREE.Vector3(accessBaseX[i], 0, 0);
    const baseRot = new THREE.Euler(0, 0, 0);

    const displacedPos = new THREE.Vector3(
      accessDispX[i],
      accessDispY[i],
      accessDispZ[i]
    );
    const displacedRot = new THREE.Euler(0, accessRotY[i], accessRotZ[i]);

    mesh.position.copy(basePos);
    mesh.rotation.copy(baseRot);
    accessGroup.add(mesh);

    letters.push({
      mesh,
      char,
      word: 'ACCESS',
      index: i,
      basePos,
      baseRot,
      displacedPos,
      displacedRot
    });
  });

  // ========================================================
  // 3. WORD: CLARITY (Station at Z = -168)
  // Starts fragmented across depth planes, smoothly converges into
  // pristine readable alignment, then parts for camera passage
  // ========================================================
  const clarityChars = ['C', 'L', 'A', 'R', 'I', 'T', 'Y'];
  const claritySize = 5.2;
  const clarityDepth = 1.2;

  // Perfectly aligned readable coordinates
  const clarityBaseX = [-8.8, -5.6, -2.5, 0.8, 3.2, 5.8, 9.0];

  // Fragmented initial coordinates
  const clarityFragX = [-10.2, -6.4, -2.8, 1.0, 3.6, 6.2, 9.8];
  const clarityFragY = [-2.0, 2.2, -1.5, 1.6, -1.8, 1.9, -1.2];
  const clarityFragZ = [6.5, -6.8, 5.4, -6.2, 7.0, -5.8, 6.0];
  const clarityFragRotX = [0.12, -0.10, 0.14, -0.12, 0.12, -0.12, 0.10];
  const clarityFragRotY = [-0.18, 0.20, -0.15, 0.18, -0.20, 0.15, -0.16];
  const clarityFragRotZ = [-0.06, 0.08, -0.05, 0.06, -0.07, 0.05, -0.05];

  // Exit separation (gateway between R and I)
  const clarityDispX = [-13.5, -9.5, -5.8, -2.2, 3.8, 7.5, 12.0];
  const clarityDispY = [0.6, -1.0, 1.1, -1.2, 1.3, -1.0, 0.7];
  const clarityDispZ = [-1.2, 1.6, -1.8, 1.4, -1.6, 1.2, -1.1];
  const clarityDispRotY = [-0.12, -0.06, 0.05, -0.10, 0.12, 0.07, 0.16];

  clarityChars.forEach((char, i) => {
    const mesh = createLetterMesh(char, claritySize, clarityDepth);
    const basePos = new THREE.Vector3(clarityBaseX[i], 0, 0);
    const baseRot = new THREE.Euler(0, 0, 0);

    const fragmentedPos = new THREE.Vector3(
      clarityFragX[i],
      clarityFragY[i],
      clarityFragZ[i]
    );
    const fragmentedRot = new THREE.Euler(
      clarityFragRotX[i],
      clarityFragRotY[i],
      clarityFragRotZ[i]
    );

    const displacedPos = new THREE.Vector3(
      clarityDispX[i],
      clarityDispY[i],
      clarityDispZ[i]
    );
    const displacedRot = new THREE.Euler(0, clarityDispRotY[i], 0);

    mesh.position.copy(fragmentedPos);
    mesh.rotation.copy(fragmentedRot);
    clarityGroup.add(mesh);

    letters.push({
      mesh,
      char,
      word: 'CLARITY',
      index: i,
      basePos,
      baseRot,
      displacedPos,
      displacedRot,
      fragmentedPos,
      fragmentedRot
    });
  });

  const dispose = () => {
    letters.forEach(({ mesh }) => {
      mesh.geometry.dispose();
    });
    ivoryMaterial.dispose();
  };

  return {
    scene,
    letters,
    justiceGroup,
    accessGroup,
    clarityGroup,
    keyLight,
    fillLight,
    rimLight,
    ambientLight,
    dispose
  };
}
