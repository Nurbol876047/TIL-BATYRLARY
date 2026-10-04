'use client';

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, SelectiveBloom, ChromaticAberration, Selection } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useSortWordsStore } from '@/store/sortWordsStore';
import { useSortController } from '@/hooks/sort-words/useSortController';
import type { HandTracking } from '@/hooks/hand/useMediaPipeHands';
import { HandCursor3D } from '@/components/hand/HandCursor3D';
import { ParticleBursts } from '@/components/hand/ParticleBurst3D';
import { SwipeTrail3D } from '@/components/sort-words/SwipeTrail3D';
import { Balbal3D } from './Balbal3D';
import { FlyingArrow3D } from './FlyingArrow3D';

interface Props {
  hand: Pick<HandTracking, 'subscribe'> | null;
  effects?: boolean;
}

/**
 * Сцена квеста «Желаяқ»: та же механика ввода, что в Sort the Words
 * (useSortController — пинч/свайп рукой или мышь), но степная сцена с
 * идолами-балбалами вместо корзин и стрелой-посланием вместо плитки.
 * Тёплый закатный свет вместо холодной неоновой подсветки.
 */
function SceneContent({ hand, effects }: { hand: Props['hand']; effects: boolean }) {
  useSortController(hand);
  const keyLight = useRef<THREE.DirectionalLight>(null);
  const fillLight = useRef<THREE.AmbientLight>(null);

  const baskets = useSortWordsStore((s) => s.baskets);
  const word = useSortWordsStore((s) => s.currentWord);
  const bursts = useSortWordsStore((s) => s.bursts);
  const removeBurst = useSortWordsStore((s) => s.removeBurst);

  return (
    <>
      <ambientLight ref={fillLight} intensity={0.55} color="#ffdca8" />
      <directionalLight ref={keyLight} position={[5, 7, 6]} intensity={1.5} color="#ffcf8a" />
      <pointLight position={[-6, -1, 4]} intensity={7} color="#f2c14e" />
      <pointLight position={[6, 1, 4]} intensity={6} color="#c97a3d" />

      {baskets.map((b) => (
        <Balbal3D key={b.index} basket={b} />
      ))}
      {word && <FlyingArrow3D key={word.id} word={word} />}
      <SwipeTrail3D />
      <ParticleBursts bursts={bursts} onDone={removeBurst} />
      <HandCursor3D
        read={() => {
          const st = useSortWordsStore.getState();
          return { ...st.cursor, grabbing: st.currentWord?.state === 'grabbed' };
        }}
      />

      {effects && (
        <EffectComposer multisampling={0}>
          <SelectiveBloom lights={[keyLight, fillLight]} mipmapBlur luminanceThreshold={0.15} luminanceSmoothing={0.3} intensity={1.3} radius={0.6} />
          <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.0006, 0.0006]} radialModulation modulationOffset={0.4} />
        </EffectComposer>
      )}
    </>
  );
}

export function ZhelayakScene({ hand, effects = true }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 1.4, 9], fov: 45, near: 0.1, far: 60 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true, premultipliedAlpha: false }}
      onCreated={({ scene, camera }) => {
        camera.lookAt(0, -0.6, 0);
        scene.fog = new THREE.FogExp2('#2a1d10', 0.028);
      }}
      className="touch-none"
    >
      <Suspense fallback={null}>
        <Selection>
          <SceneContent hand={hand} effects={effects} />
        </Selection>
      </Suspense>
    </Canvas>
  );
}
