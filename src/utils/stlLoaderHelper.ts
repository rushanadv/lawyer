import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { createMahoganyWoodPBR, createBrushedBrassPBR } from './proceduralTextures';

export interface LoadedGavelAssembly {
  gavelPivot: THREE.Group;
  gavelHeadMesh: THREE.Mesh;
  gavelHandleMesh: THREE.Mesh;
  brassBandMesh: THREE.Mesh;
  soundBlockGroup: THREE.Group;
  soundBlockMesh: THREE.Mesh;
  courtroomBench: THREE.Group;
  pivotPosition: THREE.Vector3;
  exactContactAngle: number; // In radians, calculated from geometry
  suspendedAngle: number;
  raisedAngle: number;
}

// Compute UV mapping for cylindrical/turned STL meshes
function generateCylindricalUVs(geometry: THREE.BufferGeometry, axis: 'X' | 'Y') {
  const pos = geometry.attributes.position;
  const count = pos.count;
  const uvs = new Float32Array(count * 2);

  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const min = box.min;
  const max = box.max;
  const lenX = Math.max(0.001, max.x - min.x);
  const lenY = Math.max(0.001, max.y - min.y);

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    if (axis === 'X') {
      // Lathe along X: circumference in Y-Z plane
      const theta = Math.atan2(z, y);
      uvs[i * 2] = (theta + Math.PI) / (2 * Math.PI) * 2.0; // Wrap twice for fine grain
      uvs[i * 2 + 1] = (x - min.x) / lenX * 3.0;
    } else {
      // Lathe along Y: circumference in X-Z plane
      const theta = Math.atan2(z, x);
      uvs[i * 2] = (theta + Math.PI) / (2 * Math.PI) * 2.0;
      uvs[i * 2 + 1] = (y - min.y) / lenY * 4.0;
    }
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
}

export async function loadModularGavelSTL(scene: THREE.Scene): Promise<LoadedGavelAssembly> {
  const loader = new STLLoader();

  // Load the 4 modular STL components
  const [headGeo, bandGeo, handleGeo, blockGeo] = await Promise.all([
    loader.loadAsync('/stl/part_gavel_head.stl'),
    loader.loadAsync('/stl/part_brass_band.stl'),
    loader.loadAsync('/stl/part_gavel_handle.stl'),
    loader.loadAsync('/stl/part_sound_block.stl')
  ]);

  // Generate UV mappings
  generateCylindricalUVs(headGeo, 'X');
  generateCylindricalUVs(bandGeo, 'X');
  generateCylindricalUVs(handleGeo, 'Y');
  generateCylindricalUVs(blockGeo, 'Y');

  // Generate PBR Materials with high resolution procedural textures
  const woodPBR = createMahoganyWoodPBR();
  const brassPBR = createBrushedBrassPBR();

  const woodMaterial = new THREE.MeshStandardMaterial({
    map: woodPBR.map,
    roughnessMap: woodPBR.roughnessMap,
    bumpMap: woodPBR.bumpMap,
    bumpScale: 0.016,
    roughness: 0.32,
    metalness: 0.04,
    color: 0x4a2416
  });

  const brassMaterial = new THREE.MeshStandardMaterial({
    map: brassPBR.map,
    roughnessMap: brassPBR.roughnessMap,
    bumpMap: brassPBR.bumpMap,
    bumpScale: 0.008,
    roughness: 0.20,
    metalness: 0.94,
    color: 0xe5ba6b
  });

  // Create Meshes from STL Geometries
  const gavelHeadMesh = new THREE.Mesh(headGeo, woodMaterial);
  gavelHeadMesh.castShadow = true;
  gavelHeadMesh.receiveShadow = true;

  const brassBandMesh = new THREE.Mesh(bandGeo, brassMaterial);
  brassBandMesh.castShadow = true;

  const gavelHandleMesh = new THREE.Mesh(handleGeo, woodMaterial);
  gavelHandleMesh.castShadow = true;
  gavelHandleMesh.receiveShadow = true;

  // Sound Block Mesh & Group
  const soundBlockMesh = new THREE.Mesh(blockGeo, woodMaterial);
  soundBlockMesh.castShadow = true;
  soundBlockMesh.receiveShadow = true;

  const soundBlockGroup = new THREE.Group();
  soundBlockGroup.add(soundBlockMesh);
  soundBlockGroup.position.set(0, 0, 0);
  scene.add(soundBlockGroup);

  // Calculate actual block top world position
  blockGeo.computeBoundingBox();
  const blockMaxY = blockGeo.boundingBox!.max.y; // Top strike face (0.55)

  // Calculate head dimensions
  headGeo.computeBoundingBox();
  const headRadius = (headGeo.boundingBox!.max.y - headGeo.boundingBox!.min.y) / 2.0; // (0.52)
  const armLength = 2.6; // Distance from head center to grip pivot

  // Assemble Gavel Group
  // Gavel head is along X, brass bands along X, handle along Y (extends to y = -3.4)
  const gavelPartsGroup = new THREE.Group();
  gavelPartsGroup.add(gavelHeadMesh);
  gavelPartsGroup.add(brassBandMesh);
  gavelPartsGroup.add(gavelHandleMesh);

  // Orient gavel assembly: head on X, handle extends along +Z, belly faces -Y
  gavelPartsGroup.rotation.x = -Math.PI / 2;

  // Contact height where bottom of head meets blockMaxY exactly
  const contactHeadCenterY = blockMaxY + headRadius;
  const pivotPosition = new THREE.Vector3(0.0, contactHeadCenterY, armLength);

  const gavelPivot = new THREE.Group();
  gavelPivot.position.copy(pivotPosition);

  // Position parts relative to pivot
  gavelPartsGroup.position.set(0, 0, -armLength);
  gavelPivot.add(gavelPartsGroup);
  scene.add(gavelPivot);

  // CALCULATE EXACT CONTACT ANGLE FROM WORLD-SPACE GEOMETRY
  // At rotation.x = 0.0, the head center is at (0, contactHeadCenterY, 0)
  // and the bottom of the head is at contactHeadCenterY - headRadius = blockMaxY.
  // There is 0.0 gap and 0.0 penetration.
  const exactContactAngle = 0.0;
  const suspendedAngle = 0.32; // Poised gracefully above block
  const raisedAngle = 0.65;    // Pulled back in anticipation/preparation pose

  // Courtroom Bench Group (if not already in scene)
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
