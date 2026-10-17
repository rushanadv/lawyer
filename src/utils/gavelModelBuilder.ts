import * as THREE from 'three';
import { createMahoganyWoodPBR, createBrushedBrassPBR, createJudgeBenchWoodPBR } from './proceduralTextures';

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
  scene.background = new THREE.Color(0x0c0b0a);
  scene.fog = new THREE.FogExp2(0x0c0b0a, 0.02);

  // 1. Generate PBR Materials
  const woodPBR = createMahoganyWoodPBR();
  const brassPBR = createBrushedBrassPBR();
  const benchPBR = createJudgeBenchWoodPBR();

  const woodMaterial = new THREE.MeshStandardMaterial({
    map: woodPBR.map,
    roughnessMap: woodPBR.roughnessMap,
    bumpMap: woodPBR.bumpMap,
    bumpScale: 0.02,
    roughness: 0.35,
    metalness: 0.04,
    color: 0xffffff,
  });

  const brassMaterial = new THREE.MeshStandardMaterial({
    map: brassPBR.map,
    roughnessMap: brassPBR.roughnessMap,
    bumpMap: brassPBR.bumpMap,
    bumpScale: 0.01,
    roughness: 0.18,
    metalness: 0.88,
    color: 0xffdb7d,
  });

  const benchMaterial = new THREE.MeshStandardMaterial({
    map: benchPBR.map,
    roughnessMap: benchPBR.roughnessMap,
    bumpMap: benchPBR.bumpMap,
    bumpScale: 0.012,
    roughness: 0.38,
    metalness: 0.04,
    color: 0x22130c,
  });

  const leatherMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.65,
    metalness: 0.1,
    color: 0x141210,
  });

  // 2. Build Gavel Head Geometry using Precision Turned Lathe
  // Profile points for the turned striking head (symmetric along Y, then rotated to align along X)
  const headPoints: THREE.Vector2[] = [];
  
  // Left strike face center to outer edge
  headPoints.push(new THREE.Vector2(0, 1.45));
  headPoints.push(new THREE.Vector2(0.48, 1.45));
  headPoints.push(new THREE.Vector2(0.55, 1.42)); // chamfer
  headPoints.push(new THREE.Vector2(0.58, 1.35)); // outer radius
  headPoints.push(new THREE.Vector2(0.54, 1.25)); // concave curve
  headPoints.push(new THREE.Vector2(0.48, 1.10)); // bell throat
  headPoints.push(new THREE.Vector2(0.49, 0.98)); // rise before brass band
  headPoints.push(new THREE.Vector2(0.53, 0.96)); // bead step
  headPoints.push(new THREE.Vector2(0.53, 0.72)); // under brass band
  headPoints.push(new THREE.Vector2(0.51, 0.70));
  headPoints.push(new THREE.Vector2(0.54, 0.35)); // center barrel swell
  headPoints.push(new THREE.Vector2(0.55, 0.00)); // midpoint
  // Mirror for lower half
  headPoints.push(new THREE.Vector2(0.54, -0.35));
  headPoints.push(new THREE.Vector2(0.51, -0.70));
  headPoints.push(new THREE.Vector2(0.53, -0.72));
  headPoints.push(new THREE.Vector2(0.53, -0.96));
  headPoints.push(new THREE.Vector2(0.49, -0.98));
  headPoints.push(new THREE.Vector2(0.48, -1.10));
  headPoints.push(new THREE.Vector2(0.54, -1.25));
  headPoints.push(new THREE.Vector2(0.58, -1.35));
  headPoints.push(new THREE.Vector2(0.55, -1.42));
  headPoints.push(new THREE.Vector2(0.48, -1.45));
  headPoints.push(new THREE.Vector2(0, -1.45));

  const headGeo = new THREE.LatheGeometry(headPoints, 96);
  headGeo.computeVertexNormals();

  const gavelHeadMesh = new THREE.Mesh(headGeo, woodMaterial);
  gavelHeadMesh.castShadow = true;
  gavelHeadMesh.receiveShadow = true;
  // Rotate head so it aligns horizontally along X axis
  gavelHeadMesh.rotation.z = Math.PI / 2;

  // Brass Inlay Bands for Gavel Head
  const brassBandGeo1 = new THREE.CylinderGeometry(0.535, 0.535, 0.22, 64);
  const brassBand1 = new THREE.Mesh(brassBandGeo1, brassMaterial);
  brassBand1.castShadow = true;
  brassBand1.position.x = 0.84;
  brassBand1.rotation.z = Math.PI / 2;

  const brassBand2 = new THREE.Mesh(brassBandGeo1, brassMaterial);
  brassBand2.castShadow = true;
  brassBand2.position.x = -0.84;
  brassBand2.rotation.z = Math.PI / 2;

  // 3. Build Gavel Handle Geometry using Turned Lathe
  const handlePoints: THREE.Vector2[] = [];
  handlePoints.push(new THREE.Vector2(0, 0.4)); // inside head
  handlePoints.push(new THREE.Vector2(0.13, 0.4));
  handlePoints.push(new THREE.Vector2(0.14, 0.0)); // exit head
  handlePoints.push(new THREE.Vector2(0.18, -0.04)); // brass collar top
  handlePoints.push(new THREE.Vector2(0.18, -0.16)); // brass collar bottom
  handlePoints.push(new THREE.Vector2(0.14, -0.22)); // throat neck
  handlePoints.push(new THREE.Vector2(0.13, -0.7)); // narrowest waist
  handlePoints.push(new THREE.Vector2(0.15, -1.4)); // gentle shaft swell
  handlePoints.push(new THREE.Vector2(0.17, -2.1)); // upper grip
  handlePoints.push(new THREE.Vector2(0.19, -2.4)); // ergonomic palm swell
  handlePoints.push(new THREE.Vector2(0.17, -2.8)); // pre-pommel taper
  handlePoints.push(new THREE.Vector2(0.24, -3.0)); // turned pommel sphere
  handlePoints.push(new THREE.Vector2(0.22, -3.15));
  handlePoints.push(new THREE.Vector2(0.12, -3.22)); // end finial bead
  handlePoints.push(new THREE.Vector2(0, -3.26));

  const handleGeo = new THREE.LatheGeometry(handlePoints, 64);
  handleGeo.computeVertexNormals();

  const handleMesh = new THREE.Mesh(handleGeo, woodMaterial);
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;

  // Brass Collar Ferrule on Handle
  const ferruleGeo = new THREE.CylinderGeometry(0.185, 0.185, 0.12, 48);
  const ferruleMesh = new THREE.Mesh(ferruleGeo, brassMaterial);
  ferruleMesh.position.y = -0.10;
  ferruleMesh.castShadow = true;

  // Assemble Gavel Group
  const gavelMeshGroup = new THREE.Group();
  gavelMeshGroup.add(gavelHeadMesh);
  gavelMeshGroup.add(brassBand1);
  gavelMeshGroup.add(brassBand2);
  gavelMeshGroup.add(handleMesh);
  gavelMeshGroup.add(ferruleMesh);

  // Orient gavel assembly: head on X, handle extends along +Z, belly faces -Y
  gavelMeshGroup.rotation.x = -Math.PI / 2;
  const armLength = 2.6;
  gavelMeshGroup.position.set(0, 0, -armLength);

  // Pivot Group that handles rotation during scroll strike
  const gavelPivot = new THREE.Group();
  gavelPivot.position.set(0, 1.07, 2.6);
  gavelPivot.rotation.x = 0.32; // Initial suspended pose
  gavelPivot.add(gavelMeshGroup);
  scene.add(gavelPivot);

  // 4. Build Wooden Sound Block (Stepped circular hardwood plinth)
  const soundBlock = new THREE.Group();
  const blockPoints: THREE.Vector2[] = [];
  blockPoints.push(new THREE.Vector2(0, 0)); // base center
  blockPoints.push(new THREE.Vector2(1.85, 0));
  blockPoints.push(new THREE.Vector2(1.85, 0.12));
  blockPoints.push(new THREE.Vector2(1.72, 0.18)); // lower chamfer step
  blockPoints.push(new THREE.Vector2(1.70, 0.32));
  blockPoints.push(new THREE.Vector2(1.58, 0.38)); // middle tier
  blockPoints.push(new THREE.Vector2(1.55, 0.52)); // upper wall
  blockPoints.push(new THREE.Vector2(1.48, 0.55)); // top beveled rim
  blockPoints.push(new THREE.Vector2(0.80, 0.55)); // strike face
  blockPoints.push(new THREE.Vector2(0, 0.52)); // subtle dished contact depression

  const blockGeo = new THREE.LatheGeometry(blockPoints, 96);
  blockGeo.computeVertexNormals();

  const blockMesh = new THREE.Mesh(blockGeo, woodMaterial);
  blockMesh.castShadow = true;
  blockMesh.receiveShadow = true;
  soundBlock.add(blockMesh);

  // Brass Ring Inlay on Sound Block
  const blockBrassRingGeo = new THREE.TorusGeometry(1.64, 0.03, 16, 96);
  const blockBrassRing = new THREE.Mesh(blockBrassRingGeo, brassMaterial);
  blockBrassRing.rotation.x = Math.PI / 2;
  blockBrassRing.position.y = 0.35;
  blockBrassRing.castShadow = true;
  soundBlock.add(blockBrassRing);

  soundBlock.position.set(0, 0, 0);
  scene.add(soundBlock);

  // 5. Build Courtroom Bench & Architecture
  const courtroomBench = new THREE.Group();

  // Judge's Bench Desk Top
  const benchTopGeo = new THREE.BoxGeometry(16, 0.6, 10);
  const benchTop = new THREE.Mesh(benchTopGeo, benchMaterial);
  benchTop.position.set(0, -0.3, 1);
  benchTop.receiveShadow = true;
  courtroomBench.add(benchTop);

  // Molded Bench Front Lip
  const lipGeo = new THREE.BoxGeometry(16.2, 0.25, 0.4);
  const benchLip = new THREE.Mesh(lipGeo, benchMaterial);
  benchLip.position.set(0, -0.15, 6);
  benchLip.receiveShadow = true;
  courtroomBench.add(benchLip);

  // Leather Desk Blotter
  const blotterGeo = new THREE.BoxGeometry(7.2, 0.04, 5.2);
  const blotter = new THREE.Mesh(blotterGeo, leatherMaterial);
  blotter.position.set(0, 0.02, 0.8);
  blotter.receiveShadow = true;
  courtroomBench.add(blotter);

  // Gold Tooling Border on Leather Blotter
  const goldBorderPoints = [
    new THREE.Vector3(-3.4, 0.045, -1.6),
    new THREE.Vector3(3.4, 0.045, -1.6),
    new THREE.Vector3(3.4, 0.045, 3.2),
    new THREE.Vector3(-3.4, 0.045, 3.2),
    new THREE.Vector3(-3.4, 0.045, -1.6)
  ];
  const goldBorderGeo = new THREE.BufferGeometry().setFromPoints(goldBorderPoints);
  const goldBorderMat = new THREE.LineBasicMaterial({ color: 0xc89b53, linewidth: 2 });
  const goldBorder = new THREE.Line(goldBorderGeo, goldBorderMat);
  courtroomBench.add(goldBorder);

  // Background Courtroom Wood Paneling Wall (at z = -6.5)
  const wallGeo = new THREE.BoxGeometry(24, 14, 0.8);
  const wallMesh = new THREE.Mesh(wallGeo, benchMaterial);
  wallMesh.position.set(0, 4, -6.5);
  wallMesh.receiveShadow = true;
  courtroomBench.add(wallMesh);

  // Decorative Wall Wainscoting Pilasters
  for (let i = -8; i <= 8; i += 4) {
    const pilasterGeo = new THREE.BoxGeometry(0.8, 12, 0.4);
    const pilaster = new THREE.Mesh(pilasterGeo, benchMaterial);
    pilaster.position.set(i, 4, -6.0);
    pilaster.receiveShadow = true;
    courtroomBench.add(pilaster);
  }

  scene.add(courtroomBench);

  // 6. Studio-grade Cinematic Courtroom Lighting (Bright, rich, fully illuminating the gavel)
  // Dominant warm key light (cathedral window shaft illuminating top & strike face)
  const keyLight = new THREE.SpotLight(0xfffaed, 8.5);
  keyLight.position.set(4.5, 8.0, 5.0);
  keyLight.target.position.set(0, 0.85, 0.5);
  keyLight.angle = Math.PI / 3.2;
  keyLight.penumbra = 0.45;
  keyLight.decay = 1.2;
  keyLight.distance = 30;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);
  scene.add(keyLight.target);

  // Soft Daylight Cool Fill (bounces from courtroom gallery, eliminates pitch-black shadows)
  const fillLight = new THREE.DirectionalLight(0xa8c4e0, 2.2);
  fillLight.position.set(-6, 5.0, 4.0);
  scene.add(fillLight);

  // Amber Rim / Hair Light (separates the gavel silhouette from the dark background)
  const rimLight = new THREE.DirectionalLight(0xffb84d, 4.5);
  rimLight.position.set(-1.5, 4.5, -4.0);
  scene.add(rimLight);

  // Warm Desk Bounce Light (reveals underside of gavel head and sound block tiers)
  const deskBounce = new THREE.DirectionalLight(0xe8a958, 1.8);
  deskBounce.position.set(0, -1.0, 3.0);
  scene.add(deskBounce);

  // Rich warm ambient base so the wood grain is always clearly visible
  const ambientLight = new THREE.AmbientLight(0xfff2e0, 1.4);
  scene.add(ambientLight);

  // 7. Atmospheric Micro Dust Particles in Light Beam
  const particleCount = 180;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(particleCount * 3);
  const dustVels = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 5 + 1.5;
    dustPos[i * 3 + 1] = Math.random() * 5 + 0.2;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 4 + 1.0;

    dustVels[i * 3] = (Math.random() - 0.5) * 0.002;
    dustVels[i * 3 + 1] = -Math.random() * 0.003 - 0.001;
    dustVels[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
  }

  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

  const dustMat = new THREE.PointsMaterial({
    color: 0xf5d48e,
    size: 0.035,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const dustParticles = new THREE.Points(dustGeo, dustMat);
  scene.add(dustParticles);

  const updateDust = (delta: number) => {
    const pos = dustGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 1] += dustVels[i * 3 + 1] * (delta * 60);
      pos[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.0008;

      if (pos[i * 3 + 1] < 0.1) {
        pos[i * 3 + 1] = 5.0;
      }
    }
    dustGeo.attributes.position.needsUpdate = true;
  };

  const triggerDustBurst = () => {
    const pos = dustGeo.attributes.position.array as Float32Array;
    // Disperse 40 particles outward from strike point (0, 0.55, 0)
    for (let i = 0; i < 50; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = 0.56 + Math.random() * 0.1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      dustVels[i * 3] = (Math.random() - 0.5) * 0.04;
      dustVels[i * 3 + 1] = Math.random() * 0.03 + 0.01;
      dustVels[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    }
    dustGeo.attributes.position.needsUpdate = true;
  };

  return {
    scene,
    gavelPivot,
    gavelHead: gavelHeadMesh,
    soundBlock,
    courtroomBench,
    keyLight,
    dustParticles,
    triggerDustBurst,
    updateDust
  };
}
