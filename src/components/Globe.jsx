import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html, CameraControls, useTexture, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import useStore from '../store/useStore';

const atmosphereVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 1.5;
  }
`;

// We convert lat/lon to 3D Cartesian coordinates
function latLongToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));

  return new THREE.Vector3(x, y, z);
}

// Animal Emoji Map (can be expanded)
const emojiMap = {
  lion: '🦁',
  panda: '🐼',
  elephant: '🐘',
  tiger: '🐅',
  koala: '🐨',
  kangaroo: '🦘',
  penguin: '🐧',
  default: '🐾'
};

const AnimalMarker = ({ animal, position, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const markerRef = useRef();
  const ringRef = useRef();
  const pedestalRef = useRef();

  const isDiscovered = useStore(state => state.discoveredAnimals.includes(animal.id));

  // Make the marker face outwards from the globe center
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), // Base aligns to Y axis for cylinder
    position.clone().normalize()
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Animate the main marker (emoji container)
    if (markerRef.current) {
      // Bouncing effect along the normal
      const normal = position.clone().normalize();
      const bounceHeight = isDiscovered ? 0.02 : 0.04;
      const speed = isDiscovered ? 2 : 5;
      const bounce = Math.abs(Math.sin(t * speed + position.x)) * bounceHeight;
      const newPos = position.clone().add(normal.multiplyScalar(bounce + 0.05)); // Offset above pedestal
      markerRef.current.position.copy(newPos);

      // Smooth scaling on hover
      const targetScale = hovered ? 1.4 : 1;
      markerRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, 0.2);
    }

    if (pedestalRef.current) {
      pedestalRef.current.position.copy(position);
      pedestalRef.current.quaternion.copy(quaternion);
    }

    // Animate radar ring if not discovered
    if (ringRef.current) {
      ringRef.current.position.copy(position);

      // Ring needs to face out (Z-axis based for ring geometry)
      const ringQuat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        position.clone().normalize()
      );
      ringRef.current.quaternion.copy(ringQuat);

      if (!isDiscovered) {
        let scale = (t * 2.0 + position.x) % 2;
        ringRef.current.scale.set(scale, scale, scale);
        ringRef.current.material.opacity = (1.0 - scale / 2) * 0.8;
      } else {
        ringRef.current.material.opacity = 0;
      }
    }
  });

  const emoji = emojiMap[animal.id] || emojiMap.default;

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect(animal);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Radar Ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.06, 0.08, 32]} />
        <meshBasicMaterial color="#4deeea" transparent opacity={0.6} side={THREE.DoubleSide} depthTest={false} />
      </mesh>

      {/* 3D Pedestal */}
      <mesh ref={pedestalRef}>
        <cylinderGeometry args={[0.04, 0.06, 0.02, 32]} />
        <meshStandardMaterial
          color={isDiscovered ? "#ffd700" : "#ffffff"}
          metalness={0.8}
          roughness={0.2}
          emissive={isDiscovered ? "#ffd700" : "#ffffff"}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Floating Emoji Marker via HTML */}
      <group ref={markerRef}>
        <Html distanceFactor={12} center zIndexRange={[100, 0]}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: hovered ? 'scale(1.2)' : 'scale(1)',
            filter: isDiscovered ? 'none' : 'grayscale(100%) brightness(0.7)',
            cursor: 'pointer'
          }}>
            {/* The Figurine Emoji */}
            <div style={{
              fontSize: '40px',
              textShadow: '0 4px 8px rgba(0,0,0,0.4)',
              animation: hovered ? 'wiggle 1s ease-in-out infinite' : 'none',
              transformOrigin: 'bottom center',
            }}>
              {emoji}
            </div>

            {/* Name Tooltip (Only on Hover or Discovered) */}
            {(hovered || isDiscovered) && (
              <div style={{
                background: isDiscovered ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                color: '#333',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '900',
                marginTop: '4px',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: isDiscovered ? '2px solid #b8860b' : '2px solid #ccc',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {isDiscovered ? animal.name : '? ? ?'}
              </div>
            )}

            <style>
              {`
                @keyframes wiggle {
                  0%, 100% { transform: rotate(-5deg); }
                  50% { transform: rotate(5deg); }
                }
              `}
            </style>
          </div>
        </Html>
      </group>
    </group>
  );
};

export default function Globe() {
  const globeRef = useRef();
  const cameraControlsRef = useRef();
  const radius = 2; // Globe radius

  const cloudsRef = useRef();

  // Load textures
  const [colorMap, bumpMap, specularMap, cloudsMap] = useTexture([
    '/assets/textures/earth-blue-marble.jpg',
    '/assets/textures/earth-topology.png',
    '/assets/textures/earth-water.png',
    '/assets/textures/earth-clouds.png'
  ]);

  const setSelectedAnimal = useStore(state => state.setSelectedAnimal);
  const selectedAnimal = useStore(state => state.selectedAnimal);
  const addDiscoveredAnimal = useStore(state => state.addDiscoveredAnimal);

  const [animalsData, setAnimalsData] = useState(null);

  useEffect(() => {
    fetch('/data/animals.json')
      .then(res => res.json())
      .then(data => setAnimalsData(data))
      .catch(err => console.error("Could not load animals data:", err));
  }, []);

  const markers = useMemo(() => {
    if (!animalsData) return [];
    let allMarkers = [];
    Object.keys(animalsData).forEach(continent => {
      animalsData[continent].forEach(animal => {
        const position = latLongToVector3(animal.lat, animal.lon, radius);
        allMarkers.push({ ...animal, position });
      });
    });
    return allMarkers;
  }, [animalsData]);

  // Camera fly-to logic
  useEffect(() => {
    if (cameraControlsRef.current) {
      if (selectedAnimal) {
        // Find position of selected animal
        const position = latLongToVector3(selectedAnimal.lat, selectedAnimal.lon, radius);
        // Move camera slightly away from the marker for a good view
        const distance = 3;
        const camPos = position.clone().normalize().multiplyScalar(distance);
        cameraControlsRef.current.setLookAt(camPos.x, camPos.y, camPos.z, position.x, position.y, position.z, true);
      } else {
        // Reset view or maybe just let the user free roam, but optionally we can zoom out
        cameraControlsRef.current.dollyTo(5, true);
      }
    }
  }, [selectedAnimal, radius]);

  useFrame((state, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0005; // slowly rotate the clouds
    }
    // Auto rotate globe if no animal selected
    if (cameraControlsRef.current && !selectedAnimal) {
       cameraControlsRef.current.azimuthAngle -= 0.1 * delta; // slow rotation
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[10, 5, 5]}
        intensity={3.5}
        castShadow
        color="#fffcee"
      />
      {/* Subtle rim light for the dark side */}
      <directionalLight
        position={[-10, -5, -10]}
        intensity={0.5}
        color="#4a7cff"
      />

      <Stars
        radius={100}
        depth={50}
        count={7000}
        factor={6}
        saturation={0}
        fade
        speed={1.5}
      />

      <group ref={globeRef}>
        {/* The Earth Sphere */}
        <Sphere args={[radius, 64, 64]}>
          <meshStandardMaterial
            map={colorMap}
            bumpMap={bumpMap}
            bumpScale={0.02}
            roughnessMap={specularMap}
            roughness={0.6}
            metalnessMap={specularMap}
            metalness={0.1}
          />
        </Sphere>

        {/* Cloud Layer */}
        <Sphere args={[radius + 0.02, 64, 64]} ref={cloudsRef}>
          <meshStandardMaterial
            map={cloudsMap}
            transparent={true}
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </Sphere>

        {/* Atmosphere Halo */}
        <Sphere args={[radius * 1.15, 64, 64]}>
          <shaderMaterial
            vertexShader={atmosphereVertexShader}
            fragmentShader={atmosphereFragmentShader}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
            transparent={true}
          />
        </Sphere>

        {/* The Animal Markers */}
        {markers.map((marker, index) => (
          <AnimalMarker
            key={index}
            animal={marker}
            position={marker.position}
            onSelect={(animal) => {
              setSelectedAnimal(animal);
              addDiscoveredAnimal(animal.id);
            }}
          />
        ))}
      </group>

      <CameraControls
        ref={cameraControlsRef}
        minDistance={2.5}
        maxDistance={8}
        mouseButtons={{
          left: 1, // ACTION.ROTATE
          middle: 8, // ACTION.DOLLY
          right: 0, // ACTION.NONE
          wheel: 8, // ACTION.DOLLY
        }}
      />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.2} />
      </EffectComposer>
    </>
  );
}
