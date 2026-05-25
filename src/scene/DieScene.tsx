import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useAppStore, selectedSpecIds } from '../store/useAppStore';
import { GPU_MAP } from '../data/gpus';
import { DieMesh } from './DieMesh';
import { DIE_SIZE } from '../lib/dieLayout';

const CARD_GAP = 6;

export function DieScene() {
  const { selectedCards, workload, activeBlockId, setActiveBlock } = useAppStore();
  const specs = selectedSpecIds(selectedCards).map((id) => GPU_MAP[id]).filter(Boolean);

  const stepX = DIE_SIZE + CARD_GAP;
  const originX = -((specs.length - 1) * stepX) / 2;

  return (
    <Canvas camera={{ position: [0, 26, 26], fov: 42 }} className="bg-bg">
      <ambientLight intensity={0.55} />
      <directionalLight position={[10, 20, 10]} intensity={0.7} />
      <directionalLight position={[-10, 15, -5]} intensity={0.25} />
      {specs.map((spec, i) => (
        <group key={spec.id} position={[originX + i * stepX, 0, 0]}>
          <DieMesh spec={spec} workload={workload} activeBlockId={activeBlockId} onSelect={setActiveBlock} />
        </group>
      ))}
      <OrbitControls makeDefault enablePan target={[0, 0, 0]} minDistance={12} maxDistance={70} />
    </Canvas>
  );
}
