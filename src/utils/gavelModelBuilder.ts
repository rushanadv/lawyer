import * as THREE from 'three';
import { createDarkWalnutPBR, createJudgeBenchWoodPBR } from './proceduralTextures';

export interface GavelSceneObjects {
  scene: THREE.Scene;
  gavelPivot: THREE.Group;
  gavelHead: THREE.Mesh;
  soundBlock: THREE.Group;
  courtroomBench: THREE.Group;
  keyLight: THREE.SpotLight;
  ambientLight: THREE.AmbientLight;
  rimLight: THREE.DirectionalLight;
  dustParticles: THREE.Points;
  triggerDustBurst: () => void;
  updateDust: (delta: number) => void;
}

export function buildCinematicCourtroomScene(): GavelSceneObjects {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060504);
  scene.fog = new THREE.FogExp2(0x060504, 0.025);

  // 1. Generate PBR Materials
  const woodPBR = createDarkWalnutPBR();
  const benchPBR = createJudgeBenchWoodPBR();

  const woodMaterial = new THREE.MeshStandardMaterial({
    map: woodPBR.map,
    roughnessMap: woodPBR.roughnessMap,
    bumpMap: woodPBR.bumpMap,
    bumpScale: 0.0015,
    roughness: 0.65,
    metalness: 0.0,
    color: 0xeeeeee,
  });

  const benchMaterial = new THREE.MeshStandardMaterial({
    map: benchPBR.map,
    roughnessMap: benchPBR.roughnessMap,
    bumpMap: benchPBR.bumpMap,
    bumpScale: 0.003,
    roughness: 0.75,
    metalness: 0.0,
    color: 0x110e0b,
  });

  const leatherMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.85,
    metalness: 0.0,
    color: 0x0c0a08,
  });

  // Temporary placeholder meshes (will be replaced by modular STLs in stlLoaderHelper)
  const dummyHeadGeo = new THREE.CylinderGeometry(0.68, 0.68, 2.68, 32);
  const dummyHeadMesh = new THREE.Mesh(dummyHeadGeo, woodMaterial);

  const dummyGavelGroup = new THREE.Group();
  dummyGavelGroup.add(dummyHeadMesh);

  const gavelPivot = new THREE.Group();
  gavelPivot.position.set(-4.6, 0.0, 0.0);
  dummyGavelGroup.position.set(4.6, 0.0, 0.0);
  gavelPivot.add(dummyGavelGroup);
  scene.add(gavelPivot);

  const soundBlock = new THREE.Group();
  const dummyBlockGeo = new THREE.CylinderGeometry(1.45, 2.10, 0.48, 48);
  const dummyBlockMesh = new THREE.Mesh(dummyBlockGeo, woodMaterial);
  dummyBlockMesh.position.y = -1.58;
  soundBlock.add(dummyBlockMesh);
  scene.add(soundBlock);

  // 2. Build Courtroom Bench Architecture (minimal, dark, zero reflective gold)
  const courtroomBench = new THREE.Group();

  // Dark matte leather desk blotter
  const blotterGeo = new THREE.BoxGeometry(9.0, 0.04, 6.0);
  const blotter = new THREE.Mesh(blotterGeo, leatherMaterial);
  blotter.position.set(-1.0, -1.84, 0.4);
  blotter.receiveShadow = true;
  courtroomBench.add(blotter);

  // Judge's bench desk top (deep matte ebony/smoked oak)
  const benchTopGeo = new THREE.BoxGeometry(22, 0.6, 14);
  const benchTop = new THREE.Mesh(benchTopGeo, benchMaterial);
  benchTop.position.set(0, -2.16, 0.8);
  benchTop.receiveShadow = true;
  courtroomBench.add(benchTop);

  // Subtle background wall paneling
  const wallGeo = new THREE.BoxGeometry(30, 18, 0.8);
  const wall = new THREE.Mesh(wallGeo, benchMaterial);
  wall.position.set(0, 4.5, -8.0);
  wall.receiveShadow = true;
  courtroomBench.add(wall);

  scene.add(courtroomBench);

  // 3. Cinematic Chiaroscuro Studio Lighting (Controlled warm raking key, soft ambient, antique rim)
  // Thin, controlled warm raking light revealing the rich dark walnut texture and silhouette
  const keyLight = new THREE.SpotLight(0xfffaec, 6.2);
  keyLight.position.set(2.8, 5.0, 4.0);
  keyLight.target.position.set(-0.3, -0.6, 0.0);
  keyLight.angle = Math.PI / 4.5;
  keyLight.penumbra = 0.55;
  keyLight.decay = 1.2;
  keyLight.distance = 30;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);
  scene.add(keyLight.target);

  // Soft, warm courtroom ambient base (reveals rich walnut wood grain without washing out deep contrast)
  const ambientLight = new THREE.AmbientLight(0x322820, 0.95);
  scene.add(ambientLight);

  // Warm antique rim light tracing the silhouette edge of the dark walnut and brass band
  const rimLight = new THREE.DirectionalLight(0xdeb880, 1.8);
  rimLight.position.set(-3.2, 3.8, -3.2);
  scene.add(rimLight);

  // Subtle warm under-bounce from the matte desk blotter
  const deskBounce = new THREE.DirectionalLight(0x503c28, 0.65);
  deskBounce.position.set(0.0, -2.5, 2.0);
  scene.add(deskBounce);

  const dummyDustGeo = new THREE.BufferGeometry();
  dummyDustGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
  const dummyDustMat = new THREE.PointsMaterial({ size: 0, visible: false });
  const dustParticles = new THREE.Points(dummyDustGeo, dummyDustMat);
  scene.add(dustParticles);

  const updateDust = () => {};
  const triggerDustBurst = () => {};

  return {
    scene,
    gavelPivot,
    gavelHead: dummyHeadMesh,
    soundBlock,
    courtroomBench,
    keyLight,
    ambientLight,
    rimLight,
    dustParticles,
    triggerDustBurst,
    updateDust
  };
}
