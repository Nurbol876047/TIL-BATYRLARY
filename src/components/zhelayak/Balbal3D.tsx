'use client';

import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Select } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useSortWordsStore, type Basket } from '@/store/sortWordsStore';
import { ZHELAYAK_THEME } from './theme';

interface Props {
  basket: Basket;
}

/**
 * Мишень-балбал: вместо корзины — каменный степной идол (как настоящие
 * балбалы в казахской степи). Три идола = три исхода вопроса, у каждого
 * свой амулет на груди: вихрь (про Желаяка), грань-щит (про другого
 * батыра) или треснувший осколок (неправда). Стрела со словом летит и
 * вонзается в постамент нужного идола.
 */
export function Balbal3D({ basket }: Props) {
  const hovered = useSortWordsStore((s) => s.hoverBasket === basket.index);
  const aimed = useSortWordsStore((s) => s.aimBasket === basket.index);
  const active = hovered || aimed;
  const theme = ZHELAYAK_THEME[basket.index % ZHELAYAK_THEME.length];

  const group = useRef<THREE.Group>(null);
  const gem = useRef<THREE.Mesh>(null);
  const gemLight = useRef<THREE.PointLight>(null);
  const lastCount = useRef(basket.count);
  const pulseStart = useRef<number | null>(null);

  const accent = useMemo(() => new THREE.Color(theme.accent), [theme.accent]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const k = 1 - Math.exp(-dt * 10);

    if (basket.count !== lastCount.current) {
      lastCount.current = basket.count;
      pulseStart.current = state.clock.elapsedTime;
    }
    let pulse = 0;
    if (pulseStart.current !== null) {
      const t = state.clock.elapsedTime - pulseStart.current;
      pulse = t < 0.45 ? Math.sin((t / 0.45) * Math.PI) * 0.22 : 0;
    }
    const targetScale = (active ? 1.08 : 1) + pulse;
    g.scale.setScalar(g.scale.x + (targetScale - g.scale.x) * k);

    if (gem.current) {
      gem.current.rotation.y += dt * (theme.gem === 'swirl' ? 1.6 : 0.5);
      if (theme.gem === 'swirl') gem.current.rotation.z += dt * 0.8;
      const m = gem.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity += ((active ? 1.8 : 0.7) + pulse * 5 - m.emissiveIntensity) * k;
    }
    if (gemLight.current) {
      gemLight.current.intensity += ((active ? 3.2 : 1.1) + pulse * 8 - gemLight.current.intensity) * k;
    }
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const st = useSortWordsStore.getState();
    if (st.currentWord?.state === 'waiting') st.sortWord(basket.index);
  };

  const gemGeometry =
    theme.gem === 'swirl' ? (
      <torusGeometry args={[0.16, 0.055, 10, 24]} />
    ) : theme.gem === 'shield' ? (
      <octahedronGeometry args={[0.22]} />
    ) : (
      <tetrahedronGeometry args={[0.26]} />
    );

  return (
    <group position={basket.position}>
      <group ref={group} onClick={onClick}>
        {/* постамент */}
        <mesh position={[0, -1.5, 0]}>
          <cylinderGeometry args={[0.55, 0.68, 0.32, 8]} />
          <meshStandardMaterial color="#2e2318" roughness={0.95} />
        </mesh>
        {/* туловище — слегка сужающаяся каменная плита */}
        <mesh position={[0, -0.65, 0]}>
          <cylinderGeometry args={[0.3, 0.44, 1.1, 6]} />
          <meshStandardMaterial color={theme.stone} roughness={0.85} metalness={0.05} />
        </mesh>
        {/* голова */}
        <mesh position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.32, 12, 10]} />
          <meshStandardMaterial color={theme.stone} roughness={0.85} metalness={0.05} />
        </mesh>
        {/* амулет на груди — сюда прилетает стрела */}
        <Select enabled={active}>
          <mesh ref={gem} position={[0, -0.15, 0.3]}>
            {gemGeometry}
            <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={0.7} roughness={0.3} metalness={0.4} />
          </mesh>
        </Select>
        <pointLight ref={gemLight} position={[0, -0.15, 0.45]} color={accent} intensity={1.1} distance={2.6} />
      </group>

      <Text position={[0, 0.65, 0]} fontSize={0.28} color={theme.accent} anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#140d08">
        {basket.label}
      </Text>
      <Text position={[0, -1.55, 0.3]} fontSize={0.22} color="#f1e7d6" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#140d08">
        {String(basket.count)}
      </Text>
    </group>
  );
}
