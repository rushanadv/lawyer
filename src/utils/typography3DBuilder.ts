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
  cameraSpline: THREE.CatmullRomCurve3;
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
  scene.fog = new THREE.FogExp2('#080808', 0.016);

  // Continuous Master 3D Camera Spline
  const splinePoints = [
    new THREE.Vector3(0.0, -0.6, 2.0),     // t = 0.00: Match-cut entry from dark wood gavel surface
    new THREE.Vector3(0.0, 0.0, -10.0),    // t = 0.08: Prologue into darkness
    new THREE.Vector3(0.0, 0.0, -26.0),    // t = 0.14: JUSTICE readable hero moment
    new THREE.Vector3(0.0, 0.08, -52.0),   // t = 0.28: Canyon passage between S and T
    new THREE.Vector3(0.3, 0.0, -78.0),    // t = 0.36: Emerge into ACCESS space
    new THREE.Vector3(0.5, 0.0, -88.0),    // t = 0.42: ACCESS readable hero moment
    new THREE.Vector3(1.5, -0.06, -112.0), // t = 0.52: S-curve gateway between C2 and E
    new THREE.Vector3(0.2, 0.0, -136.0),   // t = 0.62: Emerge toward CLARITY
    new THREE.Vector3(0.0, 0.0, -148.0),   // t = 0.70: CLARITY readable hero moment
    new THREE.Vector3(0.0, 0.0, -174.0),   // t = 0.80: Flight between R and I
    new THREE.Vector3(0.0, 0.0, -196.0),   // t = 0.90: Deceleration into silence
    new THREE.Vector3(0.0, 0.0, -206.0)    // t = 1.00: Settle into editorial layout
  ];

  const cameraSpline = new THREE.CatmullRomCurve3(splinePoints, false, 'centripetal');

  // Station Group containers
  const justiceGroup = new THREE.Group();
  justiceGroup.position.set(0, 0, -48);
  scene.add(justiceGroup);

  const accessGroup = new THREE.Group();
  accessGroup.position.set(0, 0, -108);
  accessGroup.visible = false; // Initially hidden so it NEVER overlaps with JUSTICE!
  scene.add(accessGroup);

  const clarityGroup = new THREE.Group();
  clarityGroup.position.set(0, 0, -168);
  clarityGroup.visible = false; // Initially hidden so it NEVER overlaps with ACCESS!
  scene.add(clarityGroup);

  // Materials: Monumental Warm Ivory (#F0EAE0) with fine architectural roughness & subtle sheen
  const ivoryMaterial = new THREE.MeshStandardMaterial({
    color: 0xF0EAE0,
    roughness: 0.38,
    metalness: 0.04,
    bumpScale: 0.0015
  });

  // Lighting Setup: Dramatic, cinematic studio illumination
  const ambientLight = new THREE.AmbientLight(0x201c18, 1.2);
  scene.add(ambientLight);

  // Moving Key Spotlight that tracks with the camera
  const keyLight = new THREE.SpotLight(0xfffaec, 340, 150, Math.PI / 4, 0.45, 1.2);
  keyLight.position.set(10, 14, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);
  scene.add(keyLight.target);

  // Cool architectural fill
  const fillLight = new THREE.DirectionalLight(0xd0e0f0, 0.9);
  fillLight.position.set(-12, -6, -50);
  scene.add(fillLight);

  // Warm luxury rim backlight
  const rimLight = new THREE.PointLight(0xc89b53, 240, 130, 1.4);
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
  const justiceSize = 5.0;
  const justiceDepth = 1.2;

  // Base aligned kerning offsets (centered around X = 0, generous letter-spacing, zero glyph overlap)
  const justiceBaseX = [-10.8, -7.2, -3.6, 0.0, 3.0, 6.4, 10.0];

  // Displaced / separated offsets creating 9.2-unit opening between S (-4.6) and T (+4.6)
  // Letters flank camera view dramatically without disappearing outside the frustum
  const justiceDispX = [-14.0, -9.5, -4.6, 4.6, 8.5, 12.5, 16.5];
  const justiceDispY = [0.8, -0.6, 0.8, 0.8, -0.8, 0.6, -0.6];
  const justiceDispZ = [1.2, -1.2, 0.8, -1.2, 0.8, -1.0, 1.0];
  const justiceRotY = [-0.10, -0.05, -0.03, 0.05, 0.03, 0.06, 0.10];
  const justiceRotZ = [0.02, -0.02, 0.03, -0.02, 0.02, -0.02, 0.02];

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
  // Pristine classical serif kerning, zero letter overlap, expansive architectural gateway
  // ========================================================
  const accessChars = ['A', 'C', 'C', 'E', 'S', 'S'];
  const accessSize = 5.0;
  const accessDepth = 1.2;

  // Perfectly proportioned base positions (A, C, C, E, S, S with distinct, non-overlapping spacing)
  const accessBaseX = [-10.8, -6.4, -2.1, 2.2, 6.4, 10.4];

  // Expansive architectural gateway layout creating 9.0-unit passage between C2 (-4.5) and E (+4.5)
  const accessDispX = [-14.5, -9.5, -4.5, 4.5, 9.5, 14.5];
  const accessDispY = [0.4, -0.6, 0.5, 0.6, -0.8, 0.4];
  const accessDispZ = [-1.4, 1.0, -1.0, 1.2, -1.4, 0.8];
  const accessRotY = [0.10, 0.05, -0.06, 0.08, -0.06, 0.12];
  const accessRotZ = [-0.02, 0.02, -0.02, 0.03, -0.02, 0.02];

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
  // Starts subtly fragmented across depth planes, smoothly converges into
  // pristine readable alignment, then parts for camera passage
  // ========================================================
  const clarityChars = ['C', 'L', 'A', 'R', 'I', 'T', 'Y'];
  const claritySize = 5.0;
  const clarityDepth = 1.2;

  // Perfectly aligned readable coordinates with classical proportion
  const clarityBaseX = [-11.0, -7.4, -3.6, 0.4, 3.8, 7.0, 10.8];

  // Subtle fragmented initial coordinates
  const clarityFragX = [-12.0, -8.0, -3.8, 0.6, 4.0, 7.4, 11.4];
  const clarityFragY = [-1.0, 1.2, -0.6, 0.8, -1.0, 1.0, -0.6];
  const clarityFragZ = [3.5, -3.6, 3.0, -3.2, 3.6, -3.0, 3.2];
  const clarityFragRotX = [0.05, -0.04, 0.06, -0.05, 0.05, -0.05, 0.04];
  const clarityFragRotY = [-0.08, 0.10, -0.06, 0.08, -0.10, 0.06, -0.08];
  const clarityFragRotZ = [-0.02, 0.03, -0.02, 0.02, -0.03, 0.02, -0.02];

  // Exit separation (gateway between R (-3.8) and I (+3.8) = 7.6 units wide)
  const clarityDispX = [-15.0, -11.0, -7.2, -3.8, 3.8, 7.5, 12.0];
  const clarityDispY = [0.4, -0.5, 0.6, -0.6, 0.6, -0.5, 0.4];
  const clarityDispZ = [-0.6, 0.8, -1.0, 0.8, -1.0, 0.6, -0.6];
  const clarityDispRotY = [-0.06, -0.03, 0.02, -0.05, 0.06, 0.04, 0.08];

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
    cameraSpline,
    keyLight,
    fillLight,
    rimLight,
    ambientLight,
    dispose
  };
}
