'use client';

import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { Select } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useSortWordsStore, WAIT_POINT, type ActiveWord } from '@/store/sortWordsStore';
import { ZHELAYAK_THEME } from './theme';
import { KAZAKH_FONT } from '@/lib/fonts';

interface Props {
  word: ActiveWord;
}

const SPAWN_Z = -12;
const INCOMING_S = 0.6;
const FLIGHT_S = 0.4;
const SHAFT_LEN = 1.5;

const C_FLAG = new THREE.Color('#2a1d10');
const C_FLAG_GRABBED = new THREE.Color('#3d2a16');
const C_FLAG_ERROR = new THREE.Color('#4a1b22');
const E_NONE = new THREE.Color('#000000');
const E_GRABBED = new THREE.Color('#f2c14e');
const E_ERROR = new THREE.Color('#ef4444');

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInQuad = (t: number) => t * t;

/**
 * Стрела-послание: наконечник + оперение + привязанный к древку свиток с
 * текстом утверждения. Та же физика состояний, что и у обычной плашки
 * (incoming/waiting/grabbed/flying/rejected) — меняется только то, что
 * игрок видит и держит: не плитка, а боевая стрела батыра.
 */
export function FlyingArrow3D({ word }: Props) {
  const group = useRef<THREE.Group>(null);
  const flagMat = useRef<THREE.MeshStandardMaterial>(null);
  const phaseStart = useRef<number | null>(null);
  const phase = useRef<ActiveWord['state'] | null>(null);
  const flightFrom = useRef(new THREE.Vector3());
  const flagWidth = Math.min(3.4, Math.max(1.7, 0.09 * word.text.length + 0.5));

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const st = useSortWordsStore.getState();
    const now = state.clock.elapsedTime;

    if (phase.current !== word.state) {
      phase.current = word.state;
      phaseStart.current = now;
      if (word.state === 'flying') flightFrom.current.copy(g.position);
      if (word.state === 'incoming') g.position.set(WAIT_POINT[0], WAIT_POINT[1], SPAWN_Z);
    }
    const t = now - (phaseStart.current ?? now);
    const k = 1 - Math.exp(-dt * 14);

    switch (word.state) {
      case 'incoming': {
        const u = easeOutCubic(Math.min(1, t / INCOMING_S));
        g.position.set(WAIT_POINT[0], WAIT_POINT[1], SPAWN_Z + (0 - SPAWN_Z) * u);
        g.rotation.z = 0;
        if (u >= 1) st.onArrive();
        break;
      }
      case 'waiting': {
        g.position.x += (WAIT_POINT[0] - g.position.x) * k;
        g.position.y += (WAIT_POINT[1] + Math.sin(now * 2) * 0.08 - g.position.y) * k;
        g.position.z += (0 - g.position.z) * k;
        g.rotation.z = Math.sin(now * 1.3) * 0.05;
        break;
      }
      case 'grabbed': {
        g.position.x += (st.cursor.x - g.position.x) * k;
        g.position.y += (st.cursor.y - g.position.y) * k;
        g.position.z += (0.5 - g.position.z) * k;
        g.rotation.z += (Math.sin(now * 3) * 0.08 - g.rotation.z) * k;
        break;
      }
      case 'flying': {
        const basket = word.targetBasket !== null ? st.baskets[word.targetBasket] : null;
        if (!basket) break;
        const u = easeInQuad(Math.min(1, t / FLIGHT_S));
        const p0 = flightFrom.current;
        const p1x = basket.position[0];
        const p1y = 1.5;
        const p2x = basket.position[0];
        const p2y = basket.position[1];
        const a = (1 - u) * (1 - u);
        const b = 2 * (1 - u) * u;
        const c = u * u;
        g.position.x = a * p0.x + b * p1x + c * p2x;
        g.position.y = a * p0.y + b * p1y + c * p2y;
        g.position.z = a * p0.z;
        // стрела летит остриём по направлению движения
        const dx = p2x - p0.x;
        g.rotation.z += ((dx >= 0 ? -0.5 : 0.5) - g.rotation.z) * k;
        const s = 1 - u * 0.5;
        g.scale.setScalar(s);
        if (u >= 1) st.onFlightEnd();
        break;
      }
      case 'rejected': {
        g.position.x = WAIT_POINT[0] + Math.sin(t * 45) * 0.1 * Math.max(0, 1 - t * 1.8);
        g.position.y += (WAIT_POINT[1] - g.position.y) * k;
        break;
      }
    }

    if (word.state !== 'flying') {
      const target = word.state === 'grabbed' ? 1.15 : 1;
      g.scale.setScalar(g.scale.x + (target - g.scale.x) * (1 - Math.exp(-dt * 12)));
    }

    if (flagMat.current) {
      const isErr = word.state === 'rejected' || word.flewWrong;
      const isGrab = word.state === 'grabbed';
      flagMat.current.color.lerp(isErr ? C_FLAG_ERROR : isGrab ? C_FLAG_GRABBED : C_FLAG, k);
      flagMat.current.emissive.lerp(isErr ? E_ERROR : isGrab ? E_GRABBED : E_NONE, k);
      const ei = isErr ? 1.1 : isGrab ? 0.8 : 0;
      flagMat.current.emissiveIntensity += (ei - flagMat.current.emissiveIntensity) * k;
    }
  });

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    const st = useSortWordsStore.getState();
    if (st.controlMode !== 'pinch') return;
    e.stopPropagation();
    if (st.grabWord('pointer')) st.setCursor({ x: e.point.x, y: e.point.y, z: 0, visible: true });
  };

  const targetTheme =
    word.state === 'flying' && word.targetBasket !== null && !word.flewWrong
      ? ZHELAYAK_THEME[word.targetBasket % ZHELAYAK_THEME.length]
      : undefined;
  const glowColor = targetTheme?.accent;

  return (
    <group ref={group} position={[WAIT_POINT[0], WAIT_POINT[1], SPAWN_Z]}>
      <Select enabled={word.state === 'grabbed' || word.state === 'rejected' || word.state === 'flying'}>
        <group>
          {/* древко */}
          <mesh rotation={[0, 0, Math.PI / 2]} onPointerDown={onPointerDown}>
            <cylinderGeometry args={[0.035, 0.04, SHAFT_LEN, 8]} />
            <meshStandardMaterial color="#8b5a2b" roughness={0.6} emissive={glowColor ?? '#000000'} emissiveIntensity={glowColor ? 0.6 : 0} />
          </mesh>
          {/* наконечник */}
          <mesh position={[SHAFT_LEN / 2 + 0.14, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.1, 0.3, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.25} />
          </mesh>
          {/* оперение — два пера крест-накрест у хвоста */}
          <mesh position={[-SHAFT_LEN / 2 - 0.02, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
            <coneGeometry args={[0.16, 0.26, 4]} />
            <meshStandardMaterial color="#b45309" roughness={0.7} />
          </mesh>
          <mesh position={[-SHAFT_LEN / 2 - 0.02, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <coneGeometry args={[0.16, 0.26, 4]} />
            <meshStandardMaterial color="#b45309" roughness={0.7} />
          </mesh>
        </group>
      </Select>

      {/* увеличенная невидимая зона захвата — древко и наконечник слишком
          тонкие для точного клика мышью/тачем, щипок рукой работает по
          радиусу вокруг WAIT_POINT и в этой зоне не нуждается */}
      <mesh
        position={[-flagWidth / 4 - 0.2, -0.25, 0.02]}
        onPointerDown={onPointerDown}
        onPointerOver={() => {
          if (word.state === 'waiting') document.body.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <planeGeometry args={[SHAFT_LEN + flagWidth + 1.2, 1.3]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* лента, привязывающая свиток к хвосту древка */}
      {(() => {
        const tailX = -SHAFT_LEN / 2 - 0.05;
        const flagX = -SHAFT_LEN / 2 - flagWidth / 2 - 0.3;
        const flagTopY = -0.08;
        const dx = flagX - tailX;
        const dy = flagTopY - 0;
        const strapLen = Math.hypot(dx, dy);
        const strapAngle = Math.atan2(dy, dx);
        return (
          <mesh position={[tailX + dx / 2, dy / 2, 0.01]} rotation={[0, 0, strapAngle]}>
            <planeGeometry args={[strapLen, 0.035]} />
            <meshBasicMaterial color="#d6b36a" />
          </mesh>
        );
      })()}

      {/* свиток с утверждением */}
      <group position={[-SHAFT_LEN / 2 - flagWidth / 2 - 0.3, -0.5, 0]}>
        <RoundedBox args={[flagWidth, 0.78, 0.08]} radius={0.08} smoothness={3} onPointerDown={onPointerDown}>
          <meshStandardMaterial ref={flagMat} color={C_FLAG} roughness={0.5} metalness={0.1} />
        </RoundedBox>
        <Text
          font={KAZAKH_FONT}
          position={[0, 0, 0.05]}
          fontSize={0.2}
          lineHeight={1.15}
          color="#f3e6c8"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.006}
          outlineColor="#140d08"
          maxWidth={flagWidth - 0.3}
          textAlign="center"
        >
          {word.text}
        </Text>
      </group>
    </group>
  );
}
