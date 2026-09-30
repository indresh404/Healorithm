// Admin/src/components/body/Interactive3DBody.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Bot, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AILoader } from '../ui/ai-loader';

interface Interactive3DBodyProps {
  selectedSystem?: string;
  onSystemSelect?: (system: string) => void;
  activeSymptoms?: string[];
  patientName?: string;
  patientVitals?: {
    spo2?: number;
    bp?: string;
    pulse?: number;
    temp?: number;
  };
}

interface AnatomicalHotspot {
  id: string;
  name: string;
  system: string;
  position: [number, number, number];
  color: number;
  description: string;
  affectedSymptoms: string[];
  riskCategory: 'Emergency' | 'Urgent' | 'Routine';
}

const HOTSPOTS: AnatomicalHotspot[] = [
  {
    id: 'brain',
    name: 'Cerebral & Central Nervous System',
    system: 'Nervous',
    position: [0, 2.7, 0],
    color: 0x8b5cf6, // Violet
    description: 'Neurological regulation, cognitive state, cranial nerves, severe headache triage.',
    affectedSymptoms: ['Severe Headache', 'Dizziness', 'Altered Mental Status', 'Vision Blur'],
    riskCategory: 'Urgent'
  },
  {
    id: 'lungs',
    name: 'Bilateral Pulmonary & Bronchial Tree',
    system: 'Respiratory',
    position: [0, 1.8, 0.2],
    color: 0x06b6d4, // Cyan
    description: 'Gas exchange, SpO2 saturation, wheezing detection, and respiratory distress monitoring.',
    affectedSymptoms: ['Severe Breathlessness', 'Wheezing', 'Dry Cough', 'Chest Congestion'],
    riskCategory: 'Emergency'
  },
  {
    id: 'heart',
    name: 'Cardiovascular / Myocardium',
    system: 'Cardiovascular',
    position: [-0.15, 1.7, 0.3],
    color: 0xef4444, // Red
    description: 'Hemodynamic perfusion, acute coronary syndrome triage, BP & pulse monitoring.',
    affectedSymptoms: ['Chest Pain with Breathlessness', 'Palpitations', 'High BP > 180/110'],
    riskCategory: 'Emergency'
  },
  {
    id: 'abdomen',
    name: 'Gastrointestinal & Hepatic Organs',
    system: 'Digestive',
    position: [0, 0.9, 0.25],
    color: 0xf59e0b, // Amber
    description: 'Upper/Lower GI tract, acute abdominal rigidity, gastroenteritis and dehydration signs.',
    affectedSymptoms: ['Severe Vomiting', 'Abdominal Pain', 'Acute Diarrhea', 'Dehydration'],
    riskCategory: 'Urgent'
  },
  {
    id: 'spine',
    name: 'Musculoskeletal & Spinal Column',
    system: 'Musculoskeletal',
    position: [0, 1.2, -0.2],
    color: 0x10b981, // Emerald
    description: 'Locomotor alignment, lumbar pain, joint swelling, fracture assessment.',
    affectedSymptoms: ['Severe Joint Pain', 'Lower Back Pain', 'Limb Swelling'],
    riskCategory: 'Routine'
  }
];

export default function Interactive3DBody({
  selectedSystem = 'All',
  onSystemSelect,
  activeSymptoms = [],
  patientName = 'Patient',
  patientVitals = { spo2: 96, bp: '130/85', pulse: 78, temp: 98.6 }
}: Interactive3DBodyProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeHotspot, setActiveHotspot] = useState<AnatomicalHotspot | null>(HOTSPOTS[1]);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [viewAngle, setViewAngle] = useState<'front' | 'back' | 'side'>('front');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysisSummary, setAiAnalysisSummary] = useState<string>(
    `Clinical AI Summary: Patient ${patientName} presents with SpO2 at ${patientVitals.spo2}%, Blood Pressure ${patientVitals.bp} mmHg. Pulmonary and cardiac regions flagged for priority tele-triage.`
  );

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bodyGroupRef = useRef<THREE.Group | null>(null);
  const hotspotMeshesRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0f1d); // Deep clinical slate/navy

    // 2. Camera Setup
    const width = currentMount.clientWidth || 400;
    const height = currentMount.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 7.5);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    keyLight.position.set(5, 10, 7);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x3b82f6, 1.5);
    rimLight.position.set(-5, -5, -5);
    scene.add(rimLight);

    // 5. Build Procedural Anatomical 3D Human Body Model
    const bodyGroup = new THREE.Group();
    bodyGroupRef.current = bodyGroup;
    scene.add(bodyGroup);

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.2,
      wireframe: wireframeMode,
      transparent: true,
      opacity: 0.85
    });

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });

    // Head
    const headGeom = new THREE.SphereGeometry(0.55, 32, 32);
    const head = new THREE.Mesh(headGeom, bodyMaterial);
    head.position.y = 2.7;
    bodyGroup.add(head);

    // Neck
    const neckGeom = new THREE.CylinderGeometry(0.2, 0.25, 0.4, 16);
    const neck = new THREE.Mesh(neckGeom, bodyMaterial);
    neck.position.y = 2.2;
    bodyGroup.add(neck);

    // Chest / Thorax
    const chestGeom = new THREE.CylinderGeometry(0.65, 0.55, 1.2, 24);
    const chest = new THREE.Mesh(chestGeom, bodyMaterial);
    chest.position.y = 1.6;
    bodyGroup.add(chest);

    // Abdomen & Pelvis
    const abdomenGeom = new THREE.CylinderGeometry(0.55, 0.6, 1.0, 24);
    const abdomen = new THREE.Mesh(abdomenGeom, bodyMaterial);
    abdomen.position.y = 0.6;
    bodyGroup.add(abdomen);

    // Arms (Left & Right)
    const armGeom = new THREE.CylinderGeometry(0.16, 0.13, 1.8, 16);
    
    const leftArm = new THREE.Mesh(armGeom, bodyMaterial);
    leftArm.position.set(-0.95, 1.3, 0);
    leftArm.rotation.z = 0.15;
    bodyGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeom, bodyMaterial);
    rightArm.position.set(0.95, 1.3, 0);
    rightArm.rotation.z = -0.15;
    bodyGroup.add(rightArm);

    // Legs (Left & Right)
    const legGeom = new THREE.CylinderGeometry(0.22, 0.15, 2.2, 16);

    const leftLeg = new THREE.Mesh(legGeom, bodyMaterial);
    leftLeg.position.set(-0.35, -0.95, 0);
    bodyGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeom, bodyMaterial);
    rightLeg.position.set(0.35, -0.95, 0);
    bodyGroup.add(rightLeg);

    // Outer Anatomical Wireframe Aura
    const auraGeom = new THREE.CapsuleGeometry(0.8, 3.2, 16, 32);
    const aura = new THREE.Mesh(auraGeom, glowMaterial);
    aura.position.y = 1.0;
    bodyGroup.add(aura);

    // 6. Add Pulsating Anatomical Hotspots
    const hotspotMeshes: THREE.Mesh[] = [];
    HOTSPOTS.forEach((spot) => {
      const spotGeom = new THREE.SphereGeometry(0.14, 16, 16);
      const spotMat = new THREE.MeshStandardMaterial({
        color: spot.color,
        emissive: spot.color,
        emissiveIntensity: 0.8,
        roughness: 0.2
      });
      const spotMesh = new THREE.Mesh(spotGeom, spotMat);
      spotMesh.position.set(...spot.position);
      spotMesh.userData = spot;
      bodyGroup.add(spotMesh);
      hotspotMeshes.push(spotMesh);

      // Pulse Ring
      const ringGeom = new THREE.RingGeometry(0.18, 0.22, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: spot.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(spot.position[0], spot.position[1], spot.position[2] + 0.05);
      bodyGroup.add(ring);
    });
    hotspotMeshesRef.current = hotspotMeshes;

    // 7. Mouse Orbit Interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !bodyGroupRef.current) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      bodyGroupRef.current.rotation.y += deltaX * 0.01;
      bodyGroupRef.current.rotation.x += deltaY * 0.005;
      // Clamp vertical rotation
      bodyGroupRef.current.rotation.x = Math.max(-0.4, Math.min(0.4, bodyGroupRef.current.rotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.z = Math.max(4.5, Math.min(11, cameraRef.current.position.z + e.deltaY * 0.005));
    };

    const handleClick = (e: MouseEvent) => {
      if (!cameraRef.current || !sceneRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(hotspotMeshesRef.current);

      if (intersects.length > 0) {
        const clickedSpot = intersects[0].object.userData as AnatomicalHotspot;
        setActiveHotspot(clickedSpot);
        if (onSystemSelect) {
          onSystemSelect(clickedSpot.system);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('click', handleClick);

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle continuous ambient oscillation
      if (bodyGroupRef.current && !isDragging) {
        bodyGroupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.05;
      }

      // Hotspot glow pulse
      hotspotMeshesRef.current.forEach((mesh, idx) => {
        const scale = 1 + Math.sin(elapsedTime * 3 + idx) * 0.15;
        mesh.scale.set(scale, scale, scale);
      });

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!currentMount || !cameraRef.current || !rendererRef.current) return;
      const newWidth = currentMount.clientWidth;
      const newHeight = currentMount.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      if (currentMount.contains(domElement)) {
        currentMount.removeChild(domElement);
      }
      renderer.dispose();
    };
  }, [wireframeMode]);

  // Handle Rotation Controls
  const rotateTo = (angle: 'front' | 'back' | 'side') => {
    setViewAngle(angle);
    if (!bodyGroupRef.current) return;
    if (angle === 'front') {
      bodyGroupRef.current.rotation.set(0, 0, 0);
    } else if (angle === 'back') {
      bodyGroupRef.current.rotation.set(0, Math.PI, 0);
    } else {
      bodyGroupRef.current.rotation.set(0, Math.PI / 2, 0);
    }
  };

  const zoomIn = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.max(4.5, cameraRef.current.position.z - 0.8);
  };

  const zoomOut = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.min(10.5, cameraRef.current.position.z + 0.8);
  };

  // AI Voice Narration Simulation
  const handleVoiceNarration = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utteranceText = activeHotspot 
      ? `Anatomical system: ${activeHotspot.name}. Triage risk category: ${activeHotspot.riskCategory}. Key symptoms: ${activeHotspot.affectedSymptoms.join(', ')}. ${aiAnalysisSummary}`
      : aiAnalysisSummary;

    const utterance = new SpeechSynthesisUtterance(utteranceText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const triggerAiDifferential = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAiAnalysisSummary(
        `AI Differential Assessment for ${patientName}: Vital correlation indicates SpO2 at ${patientVitals.spo2}% with respiratory rate elevation. Deterministic emergency rule: Low SpO2 (<90%) triggers immediate oxygen therapy referral. Priority confirmed.`
      );
    }, 1200);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col xl:flex-row min-h-[520px]">
      {/* 3D Canvas Viewport */}
      <div className="relative flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center min-h-[420px]">
        {/* Three.js DOM Container */}
        <div ref={mountRef} className="w-full h-full min-h-[420px] cursor-grab active:cursor-grabbing" />

        {/* Viewport Floating Controls */}
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
          <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-[11px] font-bold text-slate-200 flex items-center gap-2 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span>Interactive 3D Anatomical Atlas</span>
          </div>

          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
              wireframeMode 
                ? 'bg-blue-600 border-blue-400 text-white' 
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{wireframeMode ? 'Solid Mode' : 'Wireframe'}</span>
          </button>
        </div>

        {/* Rotation & Zoom Toolbar */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/60 shadow-lg z-10">
          <button
            onClick={() => rotateTo('front')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              viewAngle === 'front' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => rotateTo('side')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              viewAngle === 'side' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => rotateTo('back')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              viewAngle === 'back' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dorsal
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          <button
            onClick={zoomIn}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Hotspot Guide Hint */}
        <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-[10px] text-slate-400 flex items-center gap-1.5 pointer-events-none">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>Click glowing nodes or drag to rotate 360°</span>
        </div>
      </div>

      {/* AI Clinical Agent & Anatomical Inspector Sidebar */}
      <div className="w-full xl:w-96 bg-slate-950 border-t xl:border-t-0 xl:border-l border-slate-800 p-5 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Clinical AI Agent</h3>
                <p className="text-[10px] text-slate-400">Deterministic Triage & Audio Engine</p>
              </div>
            </div>

            <button
              onClick={handleVoiceNarration}
              className={`p-2 rounded-xl border transition-all ${
                isSpeaking 
                  ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title={isSpeaking ? 'Mute AI Voice' : 'Play Clinical Audio Narration'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Active Hotspot System Details */}
          {activeHotspot ? (
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">
                  Target Organ System
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeHotspot.riskCategory === 'Emergency' 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : activeHotspot.riskCategory === 'Urgent'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {activeHotspot.riskCategory} Priority
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white leading-snug">{activeHotspot.name}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{activeHotspot.description}</p>
              </div>

              {/* Symptom Tags */}
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Associated Danger Signs</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeHotspot.affectedSymptoms.map((symp, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-300"
                    >
                      {symp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800 text-center py-6 text-slate-400 text-xs">
              Select an anatomical node on the 3D model to inspect specific organ status.
            </div>
          )}

          {/* AI Clinical Summary Speech Bubble */}
          <div className="bg-blue-950/40 rounded-2xl p-4 border border-blue-900/40 space-y-2 relative">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Doctor Handoff Briefing</span>
            </div>
            <p className="text-xs text-blue-100/90 leading-relaxed font-normal">
              {aiAnalysisSummary}
            </p>
          </div>
        </div>

        {/* AI Action Trigger Button */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={triggerAiDifferential}
            disabled={isAnalyzing}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Deterministic Analysis...</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Recalculate Clinical Prioritization</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fullscreen Overlay Loader when analyzing */}
      {isAnalyzing && (
        <AILoader size={180} text="PRIORITIZING" fullscreen={true} />
      )}
    </div>
  );
}
