import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment } from '@react-three/drei';

function RicePlant({ position }) {
  return (
    <group position={position}>
      {/* Simple stalk */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.05, 1, 8]} />
        <meshStandardMaterial color="#32a852" />
      </mesh>
      {/* Small leaves */}
      <mesh position={[0.1, 0.7, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.05, 0.4, 0.02]} />
        <meshStandardMaterial color="#4ade80" />
      </mesh>
      <mesh position={[-0.1, 0.4, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.05, 0.4, 0.02]} />
        <meshStandardMaterial color="#4ade80" />
      </mesh>
    </group>
  );
}

function PotatoPlant({ position }) {
  return (
    <group position={position}>
      {/* Ground mound */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>
      {/* Leafy top */}
      <mesh position={[0, 0.3, 0]}>
        <dodecahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
      <mesh position={[0.15, 0.25, -0.1]}>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <mesh position={[-0.15, 0.25, 0.1]}>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#15803d" />
      </mesh>
    </group>
  );
}

function WheatPlant({ position }) {
  return (
    <group position={position}>
      {/* Tall thin stalk */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.015, 0.03, 1.2, 8]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>
      {/* Wheat head */}
      <mesh position={[0, 1.2, 0]}>
        <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
        <meshStandardMaterial color="#fef08a" />
      </mesh>
    </group>
  );
}

function FarmScene({ acres, cropType }) {
  // Convert acres to grid size (just a simulation scaling proxy).
  // E.g., 1 acre = 5x5 grid, max 30x30 to keep performance okay.
  const size = useMemo(() => {
    let s = Math.ceil(Math.sqrt(acres * 10));
    // Clamp limits so the browser doesn't freeze (min 2, max 25)
    return Math.max(2, Math.min(s, 25));
  }, [acres]);

  const spacing = 1.2;
  const off_x = (size * spacing) / 2;
  const off_z = (size * spacing) / 2;

  const plants = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const position = [i * spacing - off_x, 0, j * spacing - off_z];
      plants.push(
        <group key={`${i}-${j}`}>
          {cropType === 'Rice' && <RicePlant position={position} />}
          {cropType === 'Potato' && <PotatoPlant position={position} />}
          {cropType === 'Wheat' && <WheatPlant position={position} />}
        </group>
      );
    }
  }

  return (
    <group>
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.2} 
        castShadow 
      />
      
      {/* Dirt Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[size * spacing * 1.5, size * spacing * 1.5]} />
        <meshStandardMaterial color="#3E2723" roughness={1} />
      </mesh>

      {/* Grid of crops */}
      {plants}
    </group>
  );
}

export default function FarmMap() {
  const [acres, setAcres] = useState(5);
  const [cropType, setCropType] = useState('Rice');

  const handleAcresChange = (e) => {
    const val = parseFloat(e.target.value);
    setAcres(val > 0 ? val : 1);
  };

  return (
    <div className="flex flex-col h-[85vh] dashboard-card overflow-hidden">
      {/* Control Panel */}
      <div className="bg-white dark:bg-slate-800 border-b border-neutral-200 dark:border-slate-700 p-6 z-10 shadow-sm relative">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">3D Farm Simulator</h2>
        
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-bold text-neutral-600 dark:text-neutral-400 mb-2 uppercase tracking-wider">
              Farm Size (Acres)
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="1" max="50" step="1" 
                value={acres} 
                onChange={handleAcresChange}
                className="w-full accent-emerald-600"
              />
              <input 
                type="number"
                min="1" max="1000"
                value={acres}
                onChange={handleAcresChange}
                className="w-24 p-2 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-lg text-emerald-800 dark:text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-xs text-neutral-500 mt-2">Adjust slider to see farm scale changes</p>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-bold text-neutral-600 dark:text-neutral-400 mb-2 uppercase tracking-wider">
              Crop Selection
            </label>
            <select 
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full p-2.5 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-lg text-neutral-800 dark:text-neutral-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Rice">Rice (Paddy)</option>
              <option value="Potato">Potato</option>
              <option value="Wheat">Wheat</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div className="flex-1 bg-sky-50 dark:bg-slate-950 relative w-full cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: [0, 5, 10], fov: 50 }} shadows>
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2 - 0.05} // Don't let camera go below ground
          />
          <FarmScene acres={acres} cropType={cropType} />
        </Canvas>
        
        {/* Interaction overlay hint */}
        <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
          <span className="inline-block bg-black/40 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-medium tracking-wide">
            Left Click: Rotate • Scroll: Zoom • Right Click: Pan
          </span>
        </div>
      </div>
    </div>
  );
}
