import * as THREE from 'three';
import type {
  CameraViewPreset,
  Colony,
  Environment,
  PredatorSpecies,
  Species,
  Threat,
} from '../../lib/types';
import { CAMERA_PRESETS } from '../../lib/cameraPresets';

export interface EngineInitOptions {
  canvas: HTMLCanvasElement;
  onFpsUpdate?: (fps: number) => void;
  onTapGlass?: () => void;
}

export class ApiariumEngine {
  private canvas: HTMLCanvasElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private animationFrameId: number | null = null;
  private onFpsUpdate?: (fps: number) => void;
  private onTapGlass?: () => void;

  // Frame timing & FPS
  private lastTime: number = performance.now();
  private frameCount: number = 0;
  private fpsTimer: number = 0;

  // Lighting
  private dirLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private uvLight!: THREE.PointLight;
  private irLight!: THREE.PointLight;

  // Materials for spectrum adaptation
  private glassMaterial!: THREE.Material;
  private flowerMaterials: THREE.MeshStandardMaterial[] = [];
  private nectarGuideMaterials: THREE.MeshStandardMaterial[] = [];
  private beeMaterial!: THREE.MeshStandardMaterial;
  private queenMaterial!: THREE.MeshStandardMaterial;

  // Meshes & Hierarchies
  private hiveGroup!: THREE.Group;
  private combGroup!: THREE.Group;
  private gardenGroup!: THREE.Group;
  private beesGroup!: THREE.Group;
  private threatGroup!: THREE.Group;
  private smokeGroup!: THREE.Group;
  private glassRippleGroup!: THREE.Group;

  // Instanced Meshes
  private workerInstancedMesh!: THREE.InstancedMesh;
  private workerPositions: {
    pos: THREE.Vector3;
    targetPos: THREE.Vector3;
    rot: THREE.Euler;
    targetRot: THREE.Euler;
    caste: 'forager' | 'builder' | 'nurse' | 'guard' | 'fanner';
    dancePhase: number;
    wingPhase: number;
    speed: number;
  }[] = [];

  // Queen & Drones
  private queenMesh!: THREE.Group;
  private droneMeshes: THREE.Group[] = [];
  private retinueBees: THREE.Group[] = [];

  // Predator Wasp
  private waspMesh!: THREE.Group;
  private waspActiveSpecies: PredatorSpecies = 'V. mandarinia';

  // Camera animation
  private targetCameraPos = new THREE.Vector3(0, 0.35, 4.3);
  private currentCameraPos = new THREE.Vector3(0, 0.35, 4.3);
  private targetCameraLookAt = new THREE.Vector3(0, 0.3, 0);
  private currentCameraLookAt = new THREE.Vector3(0, 0.3, 0);

  // Interactive controls
  private isDragging: boolean = false;
  private previousMousePosition = { x: 0, y: 0 };
  private orbitEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private baseDistance: number = 4.3;

  // Smoke particles
  private smokeParticles: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
  }[] = [];

  // Glass shockwaves
  private glassRipples: {
    ring: THREE.Mesh;
    scale: number;
    alpha: number;
  }[] = [];

  // State caches
  private currentSpecies!: Species;
  private currentColony!: Colony;

  constructor(options: EngineInitOptions) {
    this.canvas = options.canvas;
    this.onFpsUpdate = options.onFpsUpdate;
    this.onTapGlass = options.onTapGlass;

    this.detectHardware();
    this.initScene();
    this.initHiveStructure();
    this.initHexagonalComb();
    this.initUpperGarden();
    this.initBees();
    this.initPredatorWasp();
    this.initParticleSystems();
    this.setupInteraction();
    this.startLoop();
  }

  private detectHardware(): void {
    try {
      const gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const rendererStr = (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '').toLowerCase();
          if (
            rendererStr.includes('swiftshader') ||
            rendererStr.includes('llvmpipe') ||
            rendererStr.includes('software') ||
            rendererStr.includes('mesa')
          ) {
            this.isSoftwareGl = true;
          }
        }
      }
    } catch {
      this.isSoftwareGl = true;
    }
  }

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0e14);
    this.scene.fog = new THREE.FogExp2(0x0c0e14, 0.08);

    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 50);
    this.camera.position.set(0, 0.35, 4.3);
    this.camera.lookAt(0, 0.3, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 0.75 : Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
    }

    // Studio Lights
    this.ambientLight = new THREE.AmbientLight(0xfff6e6, 0.75);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    this.dirLight.position.set(4, 8, 5);
    this.dirLight.castShadow = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.dirLight.shadow.camera.near = 1;
      this.dirLight.shadow.camera.far = 20;
      this.dirLight.shadow.bias = -0.001;
    }
    this.scene.add(this.dirLight);

    // Subtle blue rim light from rear
    const rimLight = new THREE.DirectionalLight(0x88aaff, 0.45);
    rimLight.position.set(-4, -2, -4);
    this.scene.add(rimLight);

    // UV Point Light (for UV Bee Vision)
    this.uvLight = new THREE.PointLight(0x7b2cbf, 0, 10);
    this.uvLight.position.set(0, 2, 2);
    this.scene.add(this.uvLight);

    // IR Point Light (for Infrared Mode)
    this.irLight = new THREE.PointLight(0xff0033, 0, 10);
    this.irLight.position.set(0, 0.5, 3);
    this.scene.add(this.irLight);

    // Floor platform / stand
    const standGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.25, 32);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x1f242e,
      roughness: 0.8,
      metalness: 0.1,
    });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.y = -1.2;
    stand.receiveShadow = !this.isSoftwareGl;
    this.scene.add(stand);
  }

  private initHiveStructure(): void {
    this.hiveGroup = new THREE.Group();
    this.scene.add(this.hiveGroup);

    // Wooden Frames (Dark polished walnut / mahogany)
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x3d2314,
      roughness: 0.6,
      metalness: 0.05,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.85,
    });

    // Hive dimensions: width 2.4, height 1.8, depth 0.22
    const frameThickness = 0.08;
    const hiveW = 2.4;
    const hiveH = 1.8;
    const hiveD = 0.22;

    // Outer wooden frame bars
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(hiveW + 0.1, frameThickness, hiveD + 0.04), woodMat);
    topBar.position.set(0, hiveH / 2, 0);
    topBar.castShadow = !this.isSoftwareGl;
    this.hiveGroup.add(topBar);

    const bottomBar = new THREE.Mesh(new THREE.BoxGeometry(hiveW + 0.1, frameThickness + 0.04, hiveD + 0.12), woodMat);
    bottomBar.position.set(0, -hiveH / 2, 0);
    bottomBar.castShadow = !this.isSoftwareGl;
    this.hiveGroup.add(bottomBar);

    const leftBar = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, hiveH, hiveD + 0.04), woodMat);
    leftBar.position.set(-hiveW / 2, 0, 0);
    leftBar.castShadow = !this.isSoftwareGl;
    this.hiveGroup.add(leftBar);

    const rightBar = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, hiveH, hiveD + 0.04), woodMat);
    rightBar.position.set(hiveW / 2, 0, 0);
    rightBar.castShadow = !this.isSoftwareGl;
    this.hiveGroup.add(rightBar);

    // Internal observation comb wooden frame (suspended inside glass)
    const combFrameW = 2.1;
    const combFrameH = 1.5;
    const combFrameThick = 0.035;

    const innerFrameTop = new THREE.Mesh(new THREE.BoxGeometry(combFrameW, combFrameThick, 0.06), woodMat);
    innerFrameTop.position.set(0, combFrameH / 2, 0);
    this.hiveGroup.add(innerFrameTop);

    const innerFrameBottom = new THREE.Mesh(new THREE.BoxGeometry(combFrameW, combFrameThick, 0.06), woodMat);
    innerFrameBottom.position.set(0, -combFrameH / 2, 0);
    this.hiveGroup.add(innerFrameBottom);

    // Flight Board & Entrance Nozzle at bottom
    const flightBoard = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.03, 0.35), woodMat);
    flightBoard.position.set(0, -hiveH / 2 - 0.02, 0.22);
    flightBoard.receiveShadow = !this.isSoftwareGl;
    this.hiveGroup.add(flightBoard);

    // Entrance Slot
    const entranceFrame = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.05), brassMat);
    entranceFrame.position.set(0, -hiveH / 2 + 0.04, 0.12);
    this.hiveGroup.add(entranceFrame);

    // Brass corner brackets & decorative hinges
    const cornerPositions = [
      [-hiveW / 2, hiveH / 2],
      [hiveW / 2, hiveH / 2],
      [-hiveW / 2, -hiveH / 2],
      [hiveW / 2, -hiveH / 2],
    ];

    cornerPositions.forEach(([x, y]) => {
      const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, hiveD + 0.06), brassMat);
      hinge.position.set(x, y, 0);
      this.hiveGroup.add(hinge);
    });

    // Museum Glass Panes (Front and Back)
    if (this.isSoftwareGl) {
      this.glassMaterial = new THREE.MeshStandardMaterial({
        color: 0x90caf9,
        transparent: true,
        opacity: 0.28,
        roughness: 0.1,
        metalness: 0.1,
        emissive: new THREE.Color(0x0f1c29),
        emissiveIntensity: 0.2,
      });
    } else {
      this.glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.04,
        transmission: 0.93,
        thickness: 0.05,
        ior: 1.52,
        specularIntensity: 1.0,
        specularColor: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 1.0,
      });
    }

    const glassFront = new THREE.Mesh(new THREE.PlaneGeometry(hiveW - 0.02, hiveH - 0.02), this.glassMaterial);
    glassFront.position.set(0, 0, hiveD / 2);
    this.hiveGroup.add(glassFront);

    const glassBack = new THREE.Mesh(new THREE.PlaneGeometry(hiveW - 0.02, hiveH - 0.02), this.glassMaterial);
    glassBack.position.set(0, 0, -hiveD / 2);
    glassBack.rotation.y = Math.PI;
    this.hiveGroup.add(glassBack);
  }

  private initHexagonalComb(): void {
    this.combGroup = new THREE.Group();
    this.hiveGroup.add(this.combGroup);

    const cellRadius = 0.052;
    const hexGeometry = new THREE.CylinderGeometry(cellRadius, cellRadius, 0.06, 6);
    hexGeometry.rotateX(Math.PI / 2);

    const honeyCellMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });

    const cappedWaxMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.65,
      metalness: 0.05,
    });

    const broodCellMat = new THREE.MeshStandardMaterial({
      color: 0x5a371c,
      roughness: 0.7,
      metalness: 0.0,
    });

    const pollenCellMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.85,
    });

    // Larva geometry (crescent shape in open brood nest)
    const larvaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.022, -0.015, 0),
      new THREE.Vector3(-0.015, 0.018, 0),
      new THREE.Vector3(0.012, 0.015, 0),
      new THREE.Vector3(0.02, -0.01, 0),
    ]);
    const larvaGeo = new THREE.TubeGeometry(larvaCurve, 12, 0.008, 6, false);
    const larvaMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.05,
    });

    const larvaInstancedMesh = new THREE.InstancedMesh(larvaGeo, larvaMat, 60);
    larvaInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.combGroup.add(larvaInstancedMesh);
    let larvaIndex = 0;

    const rows = 14;
    const cols = 20;
    const dx = 0.095;
    const dy = 0.082;
    const startX = -((cols - 1) * dx) / 2;
    const startY = -((rows - 1) * dy) / 2;

    const dummy = new THREE.Object3D();

    const maxCells = rows * cols;
    const honeyMesh = new THREE.InstancedMesh(hexGeometry, honeyCellMat, maxCells);
    const cappedMesh = new THREE.InstancedMesh(hexGeometry, cappedWaxMat, maxCells);
    const broodMesh = new THREE.InstancedMesh(hexGeometry, broodCellMat, maxCells);
    const pollenMesh = new THREE.InstancedMesh(hexGeometry, pollenCellMat, maxCells);

    let honeyCount = 0;
    let cappedCount = 0;
    let broodCount = 0;
    let pollenCount = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * dx + (r % 2 === 1 ? dx / 2 : 0);
        const y = startY + r * dy;
        const distFromCenter = Math.sqrt(x * x + y * y);

        dummy.position.set(x, y, 0);
        dummy.rotation.set(0, 0, Math.PI / 6);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();

        if (distFromCenter < 0.42) {
          if ((r + c) % 3 === 0) {
            cappedMesh.setMatrixAt(cappedCount++, dummy.matrix);
          } else {
            broodMesh.setMatrixAt(broodCount++, dummy.matrix);
            if (larvaIndex < 60) {
              const larvaDummy = new THREE.Object3D();
              larvaDummy.position.set(x, y, 0.01);
              larvaDummy.rotation.set(0, 0, Math.sin(r + c) * 0.8);
              larvaDummy.updateMatrix();
              larvaInstancedMesh.setMatrixAt(larvaIndex++, larvaDummy.matrix);
            }
          }
        } else if (distFromCenter < 0.68) {
          if ((r + c) % 2 === 0) {
            pollenMesh.setMatrixAt(pollenCount++, dummy.matrix);
          } else {
            honeyMesh.setMatrixAt(honeyCount++, dummy.matrix);
          }
        } else {
          if (Math.random() > 0.35) {
            cappedMesh.setMatrixAt(cappedCount++, dummy.matrix);
          } else {
            honeyMesh.setMatrixAt(honeyCount++, dummy.matrix);
          }
        }
      }
    }

    honeyMesh.count = honeyCount;
    cappedMesh.count = cappedCount;
    broodMesh.count = broodCount;
    pollenMesh.count = pollenCount;
    larvaInstancedMesh.count = larvaIndex;

    honeyMesh.instanceMatrix.needsUpdate = true;
    cappedMesh.instanceMatrix.needsUpdate = true;
    broodMesh.instanceMatrix.needsUpdate = true;
    pollenMesh.instanceMatrix.needsUpdate = true;
    larvaInstancedMesh.instanceMatrix.needsUpdate = true;

    this.combGroup.add(honeyMesh);
    this.combGroup.add(cappedMesh);
    this.combGroup.add(broodMesh);
    this.combGroup.add(pollenMesh);
  }

  private initUpperGarden(): void {
    this.gardenGroup = new THREE.Group();
    this.gardenGroup.position.set(0, 1.25, 0);
    this.scene.add(this.gardenGroup);

    const planterMat = new THREE.MeshStandardMaterial({
      color: 0x271910,
      roughness: 0.8,
    });
    const planter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.16, 0.45), planterMat);
    planter.position.y = -0.15;
    this.gardenGroup.add(planter);

    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x1a120b,
      roughness: 0.95,
    });
    const soil = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.05, 0.4), soilMat);
    soil.position.y = -0.06;
    this.gardenGroup.add(soil);

    this.createSunflower(-0.7, 0, -0.05);
    this.createSunflower(-0.35, 0, 0.05);
    this.createLavenderPatch(0.15, 0, 0);
    this.createCloverPatch(0.55, 0, 0.05);

    const feederMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.6,
    });
    const feeder = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.04, 24), feederMat);
    feeder.position.set(0.9, -0.03, 0);
    this.gardenGroup.add(feeder);

    const syrupMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const syrup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 24), syrupMat);
    syrup.position.set(0.9, -0.02, 0);
    this.gardenGroup.add(syrup);
  }

  private createSunflower(x: number, y: number, z: number): void {
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.65, 8), stemMat);
    stem.position.set(x, y + 0.28, z);
    this.gardenGroup.add(stem);

    const head = new THREE.Group();
    head.position.set(x, y + 0.6, z);
    head.rotation.x = 0.35;

    const discMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.9,
    });
    this.flowerMaterials.push(discMat);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 20), discMat);
    disc.rotateX(Math.PI / 2);
    head.add(disc);

    const uvGuideMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0,
      roughness: 0.4,
    });
    this.nectarGuideMaterials.push(uvGuideMat);
    const uvRing = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.082, 20), uvGuideMat);
    uvRing.position.z = 0.012;
    head.add(uvRing);

    const petalGeo = new THREE.ConeGeometry(0.035, 0.14, 4);
    petalGeo.scale(1, 0.3, 1);
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.5,
    });
    this.flowerMaterials.push(petalMat);

    const petalCount = 18;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(Math.cos(angle) * 0.13, Math.sin(angle) * 0.13, 0);
      petal.rotation.z = angle - Math.PI / 2;
      head.add(petal);
    }

    this.gardenGroup.add(head);
  }

  private createLavenderPatch(x: number, y: number, z: number): void {
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.7 });
    const lavenderFlowerMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      roughness: 0.6,
    });
    this.flowerMaterials.push(lavenderFlowerMat);

    const offsets = [
      [0, 0],
      [0.05, 0.04],
      [-0.05, 0.02],
      [0.02, -0.04],
      [-0.04, -0.03],
    ];

    offsets.forEach(([ox, oz], idx) => {
      const h = 0.45 + (idx % 3) * 0.05;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, h, 6), stemMat);
      stem.position.set(x + ox, y + h / 2, z + oz);
      this.gardenGroup.add(stem);

      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.18, 7), lavenderFlowerMat);
      spike.position.set(x + ox, y + h + 0.05, z + oz);
      this.gardenGroup.add(spike);
    });
  }

  private createCloverPatch(x: number, y: number, z: number): void {
    const cloverMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.5,
    });
    this.flowerMaterials.push(cloverMat);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.035, 1), cloverMat);
      head.position.set(x + Math.cos(angle) * 0.07, y + 0.18 + (i % 2) * 0.04, z + Math.sin(angle) * 0.07);
      this.gardenGroup.add(head);
    }
  }

  private initBees(): void {
    this.beesGroup = new THREE.Group();
    this.hiveGroup.add(this.beesGroup);

    const abdomenMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.5,
      metalness: 0.1,
    });
    this.beeMaterial = abdomenMat;

    const totalWorkers = 60;
    const combinedBeeGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.07, 7);
    combinedBeeGeo.rotateX(Math.PI / 2);

    this.workerInstancedMesh = new THREE.InstancedMesh(combinedBeeGeo, abdomenMat, totalWorkers);
    this.workerInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.workerInstancedMesh.castShadow = !this.isSoftwareGl;
    this.beesGroup.add(this.workerInstancedMesh);

    const castes: ('forager' | 'builder' | 'nurse' | 'guard' | 'fanner')[] = [
      'forager', 'builder', 'nurse', 'guard', 'fanner'
    ];

    for (let i = 0; i < totalWorkers; i++) {
      const caste = castes[i % castes.length];
      const p = new THREE.Vector3();

      if (caste === 'forager') {
        p.set((Math.random() - 0.5) * 1.6, 0.4 + Math.random() * 0.4, 0.035);
      } else if (caste === 'builder') {
        p.set(0.85 + (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 1.0, 0.035);
      } else if (caste === 'nurse') {
        p.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, 0.035);
      } else if (caste === 'guard') {
        p.set((Math.random() - 0.5) * 0.5, -0.75, 0.14);
      } else {
        p.set((Math.random() - 0.5) * 1.2, -0.6 + Math.random() * 0.3, 0.035);
      }

      this.workerPositions.push({
        pos: p.clone(),
        targetPos: p.clone(),
        rot: new THREE.Euler(0, 0, Math.random() * Math.PI * 2),
        targetRot: new THREE.Euler(0, 0, Math.random() * Math.PI * 2),
        caste,
        dancePhase: Math.random() * Math.PI * 2,
        wingPhase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
      });
    }

    // Queen Mother
    this.queenMesh = new THREE.Group();
    this.queenMaterial = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.35,
      metalness: 0.2,
    });

    const qAbdomen = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.12, 10), this.queenMaterial);
    qAbdomen.rotateX(Math.PI / 2);
    qAbdomen.position.y = -0.06;
    this.queenMesh.add(qAbdomen);

    const qThorax = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), this.queenMaterial);
    this.queenMesh.add(qThorax);

    const qHead = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), this.queenMaterial);
    qHead.position.y = 0.045;
    this.queenMesh.add(qHead);

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
    });
    const qWingL = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.035), wingMat);
    qWingL.position.set(-0.045, -0.01, 0.02);
    qWingL.rotation.z = 0.3;
    this.queenMesh.add(qWingL);

    const qWingR = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.035), wingMat);
    qWingR.position.set(0.045, -0.01, 0.02);
    qWingR.rotation.z = -0.3;
    this.queenMesh.add(qWingR);

    this.queenMesh.position.set(-0.05, 0.15, 0.04);
    this.beesGroup.add(this.queenMesh);

    // Queen Retinue
    const retinueCount = 10;
    const retinueRadius = 0.16;
    for (let i = 0; i < retinueCount; i++) {
      const angle = (i / retinueCount) * Math.PI * 2;
      const attendant = new THREE.Group();

      const attMesh = new THREE.Mesh(combinedBeeGeo, abdomenMat);
      attendant.add(attMesh);

      attendant.position.set(
        this.queenMesh.position.x + Math.cos(angle) * retinueRadius,
        this.queenMesh.position.y + Math.sin(angle) * retinueRadius,
        0.04
      );
      attendant.rotation.z = angle + Math.PI / 2;
      this.retinueBees.push(attendant);
      this.beesGroup.add(attendant);
    }

    // Drones
    const droneMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.6,
    });
    for (let i = 0; i < 4; i++) {
      const drone = new THREE.Group();
      const dBody = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.025, 0.09, 8), droneMat);
      dBody.rotateX(Math.PI / 2);
      drone.add(dBody);

      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2 });
      const dEyes = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), eyeMat);
      dEyes.position.y = 0.04;
      drone.add(dEyes);

      drone.position.set(
        -0.7 + i * 0.45,
        -0.2 + (i % 2) * 0.35,
        0.04
      );
      this.droneMeshes.push(drone);
      this.beesGroup.add(drone);
    }
  }

  private initPredatorWasp(): void {
    this.threatGroup = new THREE.Group();
    this.scene.add(this.threatGroup);

    this.waspMesh = new THREE.Group();

    const waspHeadGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const waspThoraxGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.12, 8);
    const waspAbdomenGeo = new THREE.ConeGeometry(0.05, 0.18, 8);
    waspAbdomenGeo.rotateX(Math.PI / 2);

    const waspHeadMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const waspThoraxMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
    const waspAbdomenMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 });

    const head = new THREE.Mesh(waspHeadGeo, waspHeadMat);
    head.position.y = 0.08;
    this.waspMesh.add(head);

    const thorax = new THREE.Mesh(waspThoraxGeo, waspThoraxMat);
    thorax.rotateX(Math.PI / 2);
    this.waspMesh.add(thorax);

    const abdomen = new THREE.Mesh(waspAbdomenGeo, waspAbdomenMat);
    abdomen.position.y = -0.12;
    this.waspMesh.add(abdomen);

    const waspWingMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.5,
      roughness: 0.2,
    });
    const waspWingL = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.04), waspWingMat);
    waspWingL.position.set(-0.08, 0.02, 0.04);
    waspWingL.rotation.z = 0.4;
    this.waspMesh.add(waspWingL);

    const waspWingR = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.04), waspWingMat);
    waspWingR.position.set(0.08, 0.02, 0.04);
    waspWingR.rotation.z = -0.4;
    this.waspMesh.add(waspWingR);

    this.waspMesh.position.set(0, -0.65, 0.55);
    this.waspMesh.visible = false;
    this.threatGroup.add(this.waspMesh);
  }

  private initParticleSystems(): void {
    this.smokeGroup = new THREE.Group();
    this.scene.add(this.smokeGroup);

    this.glassRippleGroup = new THREE.Group();
    this.scene.add(this.glassRippleGroup);
  }

  public triggerSmokePuff(): void {
    const smokeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      transparent: true,
      opacity: 0.45,
      roughness: 0.9,
    });

    const particleCount = this.isSoftwareGl ? 12 : 28;
    for (let i = 0; i < particleCount; i++) {
      const radius = 0.06 + Math.random() * 0.09;
      const geo = new THREE.DodecahedronGeometry(radius, 1);
      const mesh = new THREE.Mesh(geo, smokeMat.clone());

      mesh.position.set(
        -0.8 + (Math.random() - 0.5) * 0.3,
        -0.65 + (Math.random() - 0.5) * 0.2,
        0.05 + (Math.random() - 0.5) * 0.08
      );

      this.smokeGroup.add(mesh);

      this.smokeParticles.push({
        mesh,
        velocity: new THREE.Vector3(
          0.3 + Math.random() * 0.5,
          0.2 + Math.random() * 0.4,
          (Math.random() - 0.5) * 0.1
        ),
        life: 0,
        maxLife: 3.5 + Math.random() * 1.5,
      });
    }
  }

  public triggerGlassTap(): void {
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    const ringGeo = new THREE.RingGeometry(0.02, 0.035, 32);
    const ring = new THREE.Mesh(ringGeo, ringMat);

    ring.position.set(0, 0.1, 0.112);
    this.glassRippleGroup.add(ring);

    this.glassRipples.push({
      ring,
      scale: 1.0,
      alpha: 0.85,
    });
  }

  private setupInteraction(): void {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.orbitEuler.y -= deltaX * 0.005;
      this.orbitEuler.x = Math.max(-0.6, Math.min(0.6, this.orbitEuler.x - deltaY * 0.005));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.baseDistance = Math.max(1.0, Math.min(7.5, this.baseDistance + e.deltaY * 0.003));
    }, { passive: false });

    this.canvas.addEventListener('dblclick', () => {
      if (this.onTapGlass) {
        this.onTapGlass();
      }
    });

    let touchDist = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
        const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

        this.orbitEuler.y -= deltaX * 0.006;
        this.orbitEuler.x = Math.max(-0.6, Math.min(0.6, this.orbitEuler.x - deltaY * 0.006));

        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const curDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = (touchDist - curDist) * 0.005;
        this.baseDistance = Math.max(1.0, Math.min(7.5, this.baseDistance + factor));
        touchDist = curDist;
      }
    });

    this.canvas.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    window.addEventListener('resize', this.onWindowResize);
  }

  private onWindowResize = (): void => {
    const width = this.canvas.parentElement?.clientWidth || window.innerWidth;
    const height = this.canvas.parentElement?.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public setCameraPreset(presetId: CameraViewPreset): void {
    const preset = CAMERA_PRESETS[presetId];
    if (!preset) return;
    this.targetCameraPos.set(...preset.position);
    this.targetCameraLookAt.set(...preset.target);
    this.baseDistance = this.targetCameraPos.length();
    this.camera.fov = preset.fov;
    this.camera.updateProjectionMatrix();
    this.orbitEuler.set(0, 0, 0);
  }

  public updateSpecies(species: Species): void {
    this.currentSpecies = species;

    if (this.beeMaterial) {
      this.beeMaterial.color.set(species.chitinColor);
      this.beeMaterial.roughness = 0.7 - species.hairDensity * 0.3;
    }

    if (this.queenMaterial) {
      this.queenMaterial.color.set(species.chitinColor);
    }
  }

  public updateEnvironment(env: Environment): void {
    switch (env.lightMode) {
      case 'uv':
        this.ambientLight.color.set(0x1e1b4b);
        this.ambientLight.intensity = 0.4;
        this.dirLight.color.set(0x4338ca);
        this.dirLight.intensity = 0.8;
        this.uvLight.intensity = 4.5;
        this.irLight.intensity = 0;

        this.nectarGuideMaterials.forEach((m) => {
          m.emissive.set(0x38bdf8);
          m.emissiveIntensity = 2.0;
        });
        break;

      case 'ir':
        this.ambientLight.color.set(0x450a0a);
        this.ambientLight.intensity = 0.5;
        this.dirLight.color.set(0xb91c1c);
        this.dirLight.intensity = 1.0;
        this.uvLight.intensity = 0;
        this.irLight.intensity = 4.0;

        this.nectarGuideMaterials.forEach((m) => {
          m.emissive.set(0x000000);
          m.emissiveIntensity = 0;
        });
        break;

      case 'sunset':
        this.ambientLight.color.set(0x78350f);
        this.ambientLight.intensity = 0.8;
        this.dirLight.color.set(0xf97316);
        this.dirLight.intensity = 2.2;
        this.uvLight.intensity = 0;
        this.irLight.intensity = 0;

        this.nectarGuideMaterials.forEach((m) => {
          m.emissive.set(0x000000);
          m.emissiveIntensity = 0;
        });
        break;

      case 'custom': {
        const color = new THREE.Color().setHSL(env.customHueDeg / 360, 0.75, 0.55);
        this.ambientLight.color.set(color);
        this.ambientLight.intensity = 0.7;
        this.dirLight.color.set(color);
        this.dirLight.intensity = 1.8;
        this.uvLight.intensity = 0;
        this.irLight.intensity = 0;
        break;
      }

      case 'daylight':
      default:
        this.ambientLight.color.set(0xfff6e6);
        this.ambientLight.intensity = 0.75;
        this.dirLight.color.set(0xfffaed);
        this.dirLight.intensity = 2.0;
        this.uvLight.intensity = 0;
        this.irLight.intensity = 0;

        this.nectarGuideMaterials.forEach((m) => {
          m.emissive.set(0x000000);
          m.emissiveIntensity = 0;
        });
        break;
    }
  }

  public updateColony(colony: Colony, threat: Threat): void {
    this.currentColony = colony;

    if (threat.active && !threat.repelled) {
      this.waspMesh.visible = true;
      this.waspActiveSpecies = threat.species;
      const t = performance.now() * 0.003;
      this.waspMesh.position.set(
        Math.sin(t * 1.5) * 0.3,
        -0.65 + Math.cos(t * 2) * 0.1,
        0.35 + Math.sin(t) * 0.15
      );
    } else {
      this.waspMesh.visible = false;
    }
  }

  private startLoop(): void {
    this.renderer.setAnimationLoop((time) => {
      const rawDelta = (time - this.lastTime) * 0.001;
      const delta = Math.min(0.033, rawDelta);
      this.lastTime = time;

      this.frameCount++;
      this.fpsTimer += delta;
      if (this.fpsTimer >= 0.5) {
        const fps = Math.round((this.frameCount / this.fpsTimer));
        if (this.onFpsUpdate) this.onFpsUpdate(fps);
        this.frameCount = 0;
        this.fpsTimer = 0;
      }

      this.updateAnimations(delta, time * 0.001);
      this.render();
    });
  }

  private updateAnimations(delta: number, timeSec: number): void {
    this.currentCameraLookAt.lerp(this.targetCameraLookAt, delta * 3.5);

    const offset = new THREE.Vector3(0, 0, this.baseDistance);
    offset.applyEuler(this.orbitEuler);

    const desiredPos = this.targetCameraPos.clone().add(offset).sub(new THREE.Vector3(0, 0, this.baseDistance));
    this.currentCameraPos.lerp(desiredPos, delta * 3.5);

    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentCameraLookAt);

    if (this.queenMesh) {
      const qPulse = 1.0 + Math.sin(timeSec * 3.5) * 0.04;
      this.queenMesh.scale.set(qPulse, qPulse, 1.0);
    }

    this.retinueBees.forEach((att, idx) => {
      const sway = Math.sin(timeSec * 4 + idx) * 0.05;
      att.rotation.z += sway * delta;
    });

    if (this.workerInstancedMesh && this.workerPositions.length > 0) {
      const dummy = new THREE.Object3D();
      const isDefending = this.currentColony?.state === 'defending';
      const isClustering = this.currentColony?.state === 'clustering';
      const isCerana = this.currentSpecies?.id === 'cerana';

      const visibleBeesLimit = this.currentColony?.visualBees ?? 60;
      this.workerInstancedMesh.count = visibleBeesLimit;

      for (let i = 0; i < visibleBeesLimit; i++) {
        const wp = this.workerPositions[i];

        if (isDefending && this.waspMesh.visible) {
          if (isCerana && this.waspActiveSpecies === 'V. mandarinia') {
            const ballRadius = 0.12 + Math.sin(timeSec * 6 + i) * 0.02;
            const phi = (i / visibleBeesLimit) * Math.PI;
            const theta = ((i * 1.618) % 1) * Math.PI * 2 + timeSec * 2;

            wp.targetPos.set(
              this.waspMesh.position.x + ballRadius * Math.sin(phi) * Math.cos(theta),
              this.waspMesh.position.y + ballRadius * Math.sin(phi) * Math.sin(theta),
              this.waspMesh.position.z + ballRadius * Math.cos(phi)
            );
          } else {
            wp.targetPos.set(
              this.waspMesh.position.x + (Math.sin(timeSec * 8 + i) * 0.18),
              this.waspMesh.position.y + (Math.cos(timeSec * 8 + i) * 0.18),
              this.waspMesh.position.z + (Math.sin(timeSec * 5 + i) * 0.1)
            );
          }
        } else if (isClustering) {
          const clusterRadius = 0.35 * (1.0 - (this.currentColony?.clusterDensity ?? 0.5) * 0.5);
          const angle = (i / visibleBeesLimit) * Math.PI * 2 + Math.sin(i) * 0.5;
          const r = Math.sqrt((i + 1) / visibleBeesLimit) * clusterRadius;
          wp.targetPos.set(
            this.queenMesh.position.x + Math.cos(angle) * r,
            this.queenMesh.position.y + Math.sin(angle) * r,
            0.035 + (i % 2) * 0.015
          );
        } else {
          if (wp.caste === 'forager') {
            wp.dancePhase += delta * 2.5;
            const figure8X = Math.sin(wp.dancePhase) * 0.12;
            const figure8Y = Math.sin(wp.dancePhase * 2) * 0.06;
            wp.pos.x += (figure8X * 0.3);
            wp.pos.y += (figure8Y * 0.3);
          } else if (wp.caste === 'fanner') {
            wp.wingPhase += delta * 50;
          } else if (wp.caste === 'guard') {
            wp.pos.x = Math.sin(timeSec * 2 + i) * 0.35;
          }
        }

        wp.pos.lerp(wp.targetPos, delta * 3.0);

        dummy.position.copy(wp.pos);
        dummy.rotation.set(0, 0, wp.rot.z + Math.sin(timeSec * 3 + i) * 0.15);

        const scaleMult = this.currentSpecies?.sizeMultiplier ?? 1.0;
        dummy.scale.set(scaleMult, scaleMult, scaleMult);
        dummy.updateMatrix();

        this.workerInstancedMesh.setMatrixAt(i, dummy.matrix);
      }

      this.workerInstancedMesh.instanceMatrix.needsUpdate = true;
    }

    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.life += delta;
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.mesh.scale.multiplyScalar(1.0 + delta * 0.3);

      const mat = p.mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, 0.45 * (1 - p.life / p.maxLife));

      if (p.life >= p.maxLife) {
        this.smokeGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        mat.dispose();
        this.smokeParticles.splice(i, 1);
      }
    }

    for (let i = this.glassRipples.length - 1; i >= 0; i--) {
      const rip = this.glassRipples[i];
      rip.scale += delta * 4.5;
      rip.alpha -= delta * 1.8;
      rip.ring.scale.set(rip.scale, rip.scale, 1);

      const mat = rip.ring.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, rip.alpha);

      if (rip.alpha <= 0) {
        this.glassRippleGroup.remove(rip.ring);
        rip.ring.geometry.dispose();
        mat.dispose();
        this.glassRipples.splice(i, 1);
      }
    }
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer.setAnimationLoop(null);
    window.removeEventListener('resize', this.onWindowResize);

    try {
      this.renderer.dispose();
    } catch {
      // ignore
    }
  }
}
