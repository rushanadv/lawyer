import * as THREE from 'three';
import { createDarkWalnutPBR, createJudgeBenchWoodPBR } from './proceduralTextures';

export interface GavelSceneObjects {
  scene: THREE.Scene;
  gavelPivot: THREE.Group;
  gavelHead: THREE.Mesh;
  soundBlock: THREE.Group;
  courtroomBench: THREE.Group;
  keyLight: THREE.SpotLight;
  dustParticles: THREE.Points;
  triggerDustBurst: () => void;
  updateDust: (delta: number) => void;
}

export function buildCinematicCourtroomScene(): GavelSceneObjects {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0908);
  scene.fog = new THREE.FogExp2(0x0a0908, 0.015);

  // 1. Generate PBR Materials
  const woodPBR = createDarkWalnutPBR();
  const benchPBR = createJudgeBenchWoodPBR();

  const woodMaterial = new THREE.MeshStandardMaterial({
    map: woodPBR.map,
    roughnessMap: woodPBR.roughnessMap,
    bumpMap: woodPBR.bumpMap,
    bumpScale: 0.003,
    roughness: 0.42,
    metalness: 0.0,
    color: 0xffffff,
  });

  const benchMaterial = new THREE.MeshStandardMaterial({
    map: benchPBR.map,
    roughnessMap: benchPBR.roughnessMap,
    bumpMap: benchPBR.bumpMap,
    bumpScale: 0.006,
    roughness: 0.38,
    metalness: 0.02,
    color: 0xffffff,
  });

  const leatherMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.60,
    metalness: 0.05,
    color: 0x14110e,
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

  // 2. Build Courtroom Bench & Desk Architecture
  const courtroomBench = new THREE.Group();

  // Leather Desk Blotter (immediately below sound block base at Y = -1.82)
  const blotterGeo = new THREE.BoxGeometry(9.0, 0.04, 6.0);
  const blotter = new THREE.Mesh(blotterGeo, leatherMaterial);
  blotter.position.set(-1.0, -1.84, 0.4);
  blotter.receiveShadow = true;
  courtroomBench.add(blotter);

  // Gold Tooling Border on Leather Blotter
  const goldBorderPoints = [
    new THREE.Vector3(-5.2, -1.815, -2.4),
    new THREE.Vector3( 3.2, -1.815, -2.4),
    new THREE.Vector3( 3.2, -1.815,  3.2),
    new THREE.Vector3(-5.2, -1.815,  3.2),
    new THREE.Vector3(-5.2, -1.815, -2.4)
  ];
  const goldBorderGeo = new THREE.BufferGeometry().setFromPoints(goldBorderPoints);
  const goldBorderMat = new THREE.LineBasicMaterial({ color: 0xc89b53, linewidth: 2 });
  const goldBorder = new THREE.Line(goldBorderGeo, goldBorderMat);
  courtroomBench.add(goldBorder);

  // Judge's Bench Desk Top (thick solid oak slab)
  const benchTopGeo = new THREE.BoxGeometry(20, 0.6, 12);
  const benchTop = new THREE.Mesh(benchTopGeo, benchMaterial);
  benchTop.position.set(0, -2.16, 0.8);
  benchTop.receiveShadow = true;
  courtroomBench.add(benchTop);

  // Molded Bench Front Lip
  const lipGeo = new THREE.BoxGeometry(20.2, 0.3, 0.4);
  const benchLip = new THREE.Mesh(lipGeo, benchMaterial);
  benchLip.position.set(0, -1.95, 6.8);
  benchLip.receiveShadow = true;
  courtroomBench.add(benchLip);

  // Background Courtroom Wood Paneling Wall (at z = -7.5)
  const wallGeo = new THREE.BoxGeometry(28, 16, 0.8);
  const wall = new THREE.Mesh(wallGeo, benchMaterial);
  wall.position.set(0, 4.5, -7.5);
  wall.receiveShadow = true;
  courtroomBench.add(wall);

  // Architectural Wainscoting Pilasters
  for (let i = -10; i <= 10; i += 5) {
    const pilasterGeo = new THREE.BoxGeometry(0.9, 14, 0.4);
    const pilaster = new THREE.Mesh(pilasterGeo, benchMaterial);
    pilaster.position.set(i, 4.5, -7.0);
    pilaster.receiveShadow = true;
    courtroomBench.add(pilaster);
  }

  scene.add(courtroomBench);

  // 3. Studio-grade Cinematic Lighting (Key, Fill, Rim, Ambient)
  // Dominant warm key light (cathedral window shaft illuminating the vertical head and sound block)
  const keyLight = new THREE.SpotLight(0xfffaec, 8.0);
  keyLight.position.set(3.8, 6.5, 5.2);
  keyLight.target.position.set(-0.5, -0.5, 0.0);
  keyLight.angle = Math.PI / 3.4;
  keyLight.penumbra = 0.40;
  keyLight.decay = 1.1;
  keyLight.distance = 35;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);
  scene.add(keyLight.target);

  // Soft Daylight Cool Fill (bounces from courtroom gallery, reveals handle and shadow depth)
  const fillLight = new THREE.DirectionalLight(0xb0c8e0, 2.0);
  fillLight.position.set(-6.0, 4.5, 3.5);
  scene.add(fillLight);

  // Amber Rim Light (sharp silhouette rim separating dark walnut from the background)
  const rimLight = new THREE.DirectionalLight(0xe8b050, 4.0);
  rimLight.position.set(-2.0, 4.5, -4.5);
  scene.add(rimLight);

  // Desk Bounce Light (reveals underside of head, brass bands, and sound block tiers)
  const deskBounce = new THREE.DirectionalLight(0xdfa050, 1.4);
  deskBounce.position.set(0.5, -2.0, 3.0);
  scene.add(deskBounce);

  // Rich warm ambient base so wood grain is always clearly readable
  const ambientLight = new THREE.AmbientLight(0xfff5e6, 1.3);
  scene.add(ambientLight);

  // Clean empty points object to preserve interface without random floating pixels
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
    dustParticles,
    triggerDustBurst,
    updateDust
  };
}
