import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createDarkWalnutPBR, createSoundBlockWalnutPBR, createBrushedBrassPBR } from './proceduralTextures';

export interface LoadedGavelAssembly {
  gavelPivot: THREE.Group;
  gavelHeadMesh: THREE.Mesh;
  gavelHandleMesh: THREE.Mesh;
  brassBandMesh: THREE.Mesh;
  soundBlockGroup: THREE.Group;
  soundBlockMesh: THREE.Mesh;
  courtroomBench: THREE.Group;
  pivotPosition: THREE.Vector3;
  exactContactAngle: number; // 0.0 rad (physical contact on block at Y = -1.34)
  suspendedAngle: number;    // +0.244 rad (+14 deg)
  raisedAngle: number;       // +0.488 rad (+28 deg)
}

// Compute UV mapping aligned with each component's longitudinal lathe axis
function generateLongitudinalUVs(geometry: THREE.BufferGeometry, axis: 'X' | 'Y' | 'PLANAR') {
  const pos = geometry.attributes.position;
  const count = pos.count;
  const uvs = new Float32Array(count * 2);

  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const min = box.min;
  const max = box.max;
  const lenX = Math.max(0.001, max.x - min.x);
  const lenY = Math.max(0.001, max.y - min.y);
  const lenZ = Math.max(0.001, max.z - min.z);

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    if (axis === 'Y') {
      // Lathe along Y (Gavel Head & Brass Band):
      // U = circumference around Y axis in XZ plane
      // V = height along Y (grain runs longitudinally along head)
      const theta = Math.atan2(z, x);
      uvs[i * 2]     = (theta + Math.PI) / (2 * Math.PI) * 2.0;
      uvs[i * 2 + 1] = (y - min.y) / lenY * 2.5;
    } else if (axis === 'X') {
      // Lathe along X (Gavel Handle):
      // U = circumference around X axis in YZ plane
      // V = length along X (grain runs longitudinally along handle from grip to head)
      const theta = Math.atan2(z, y);
      uvs[i * 2]     = (theta + Math.PI) / (2 * Math.PI) * 2.0;
      uvs[i * 2 + 1] = (x - min.x) / lenX * 3.5;
    } else {
      // Horizontal Planar / Radial (Sound Block):
      // Centered circular coordinates in XZ plane for growth rings
      const cx = (min.x + max.x) * 0.5;
      const cz = (min.z + max.z) * 0.5;
      uvs[i * 2]     = (x - cx) / lenX + 0.5;
      uvs[i * 2 + 1] = (z - cz) / lenZ + 0.5;
    }
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

export async function loadModularGavelSTL(scene: THREE.Scene): Promise<LoadedGavelAssembly> {
  const loader = new STLLoader();

  // Load the 4 modular STL components from public assets
  const loadWithFallback = async (name: string) => {
    try {
      return await loader.loadAsync(`/stl_assets/${name}`);
    } catch {
      return await loader.loadAsync(`/stl/${name}`);
    }
  };

  const [rawHead, rawBand, rawHandle, rawBlock] = await Promise.all([
    loadWithFallback('part_gavel_head.stl'),
    loadWithFallback('part_brass_band.stl'),
    loadWithFallback('part_gavel_handle.stl'),
    loadWithFallback('part_sound_block.stl')
  ]);

  // STEP 2: Three.js BufferGeometryUtils Creased Normals (Math.PI / 4 = 45 deg)
  // Preserves crisp striking faces, bevels, and brass lips while smoothing curved turned lathe surfaces
  const headGeo   = BufferGeometryUtils.toCreasedNormals(rawHead, Math.PI / 4);
  const bandGeo   = BufferGeometryUtils.toCreasedNormals(rawBand, Math.PI / 4);
  const handleGeo = BufferGeometryUtils.toCreasedNormals(rawHandle, Math.PI / 4);
  const blockGeo  = BufferGeometryUtils.toCreasedNormals(rawBlock, Math.PI / 4);

  // STEP 3: Generate proper UV coordinates aligned with longitudinal axes
  generateLongitudinalUVs(headGeo, 'Y');
  generateLongitudinalUVs(bandGeo, 'Y');
  generateLongitudinalUVs(handleGeo, 'X');
  generateLongitudinalUVs(blockGeo, 'PLANAR');

  // STEP 3: Realistic Dark Natural Walnut PBR & Restrained Brushed Antique Brass
  const walnutPBR     = createDarkWalnutPBR();
  const soundBlockPBR = createSoundBlockWalnutPBR();
  const brassPBR      = createBrushedBrassPBR();

  // Dark Walnut Material for Gavel Head & Handle
  const woodMaterial = new THREE.MeshStandardMaterial({
    map: walnutPBR.map,
    roughnessMap: walnutPBR.roughnessMap,
    bumpMap: walnutPBR.bumpMap,
    bumpScale: 0.0012,
    roughness: 0.65,
    metalness: 0.0,
    color: 0xffffff
  });

  // Dedicated Sound Block Material (smooth, non-rippled end-grain)
  const soundBlockMaterial = new THREE.MeshStandardMaterial({
    map: soundBlockPBR.map,
    roughnessMap: soundBlockPBR.roughnessMap,
    bumpMap: soundBlockPBR.bumpMap,
    bumpScale: 0.0004,
    roughness: 0.64,
    metalness: 0.0,
    color: 0xffffff
  });

  // Brushed Antique Brass Material (understated warm patina, brushed matte metal)
  const brassMaterial = new THREE.MeshStandardMaterial({
    map: brassPBR.map,
    roughnessMap: brassPBR.roughnessMap,
    bumpMap: brassPBR.bumpMap,
    bumpScale: 0.0012,
    roughness: 0.44,
    metalness: 0.76,
    color: 0xd8d0c0
  });

  // Create Meshes with Shadows
  const gavelHeadMesh = new THREE.Mesh(headGeo, woodMaterial);
  gavelHeadMesh.castShadow = true;
  gavelHeadMesh.receiveShadow = true;

  const brassBandMesh = new THREE.Mesh(bandGeo, brassMaterial);
  brassBandMesh.castShadow = true;
  brassBandMesh.receiveShadow = true;

  const gavelHandleMesh = new THREE.Mesh(handleGeo, woodMaterial);
  gavelHandleMesh.castShadow = true;
  gavelHandleMesh.receiveShadow = true;

  // Sound Block Mesh & Group (horizontal plinth, top face at Y = -1.34)
  const soundBlockMesh = new THREE.Mesh(blockGeo, soundBlockMaterial);
  soundBlockMesh.castShadow = true;
  soundBlockMesh.receiveShadow = true;

  const soundBlockGroup = new THREE.Group();
  soundBlockGroup.add(soundBlockMesh);
  soundBlockGroup.position.set(0, 0, 0);
  scene.add(soundBlockGroup);

  // STEP 4: Assemble Single Pivot-Controlled Gavel Assembly
  // Coordinate system baked into STLs:
  // - Head: vertical along Y (striking face at bottom Y = -1.34)
  // - Handle: horizontal along -X (connects to head at (0, 0, 0), extends to X = -5.08)
  // - Brass band: seated flush on head at (0, 0, 0)
  // - Zero individual rotations needed!
  gavelHeadMesh.position.set(0, 0, 0);
  gavelHeadMesh.rotation.set(0, 0, 0);

  brassBandMesh.position.set(0, 0, 0);
  brassBandMesh.rotation.set(0, 0, 0);

  gavelHandleMesh.position.set(0, 0, 0);
  gavelHandleMesh.rotation.set(0, 0, 0);

  // Assembly parts group
  const gavelPartsGroup = new THREE.Group();
  gavelPartsGroup.add(gavelHeadMesh);
  gavelPartsGroup.add(brassBandMesh);
  gavelPartsGroup.add(gavelHandleMesh);

  // Pivot at handle grip: X = -4.6, Y = 0.0, Z = 0.0
  const pivotX = -4.6;
  const pivotY = 0.0;
  const pivotPosition = new THREE.Vector3(pivotX, pivotY, 0.0);

  const gavelPivot = new THREE.Group();
  gavelPivot.position.copy(pivotPosition);

  // Offset parts group so (0,0,0) is at head and pivot is at -4.6
  gavelPartsGroup.position.set(-pivotX, -pivotY, 0.0);
  gavelPivot.add(gavelPartsGroup);

  scene.add(gavelPivot);

  // Kinematic Strike Reference Angles (around Z-axis):
  // rotation.z = 0.0 rad -> EXACT physical contact (bottom of head at Y = -1.34 touches sound block at Y = -1.34)
  // rotation.z = +0.22 rad (+12.6 deg) -> Suspended poise
  // rotation.z = +0.40 rad (+23.0 deg) -> Fully raised preparation pose
  const exactContactAngle = 0.0;
  const suspendedAngle = 0.22;
  const raisedAngle = 0.40;

  // Initial suspended pose
  gavelPivot.rotation.z = suspendedAngle;

  const courtroomBench = new THREE.Group();

  return {
    gavelPivot,
    gavelHeadMesh,
    gavelHandleMesh,
    brassBandMesh,
    soundBlockGroup,
    soundBlockMesh,
    courtroomBench,
    pivotPosition,
    exactContactAngle,
    suspendedAngle,
    raisedAngle
  };
}
