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
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
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

const AnimalMarker = ({ animal, position, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const markerRef = useRef();
  const ringRef = useRef();
  const discoveredAnimals = useStore((state) => state.discoveredAnimals);
  const isDiscovered = discoveredAnimals.includes(animal.id);

  // Make the marker face outwards from the globe center
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    position.clone().normalize()
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (markerRef.current) {
      // Gentle bounce effect along the normal
      const normal = position.clone().normalize();
      const bounce = Math.sin(t * 5 + position.x) * 0.015;
      const newPos = position.clone().add(normal.multiplyScalar(bounce));
      markerRef.current.position.copy(newPos);

      // Smooth scaling on hover
      const targetScale = hovered ? 1.5 : 1;
      markerRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, 0.1);
    }

    if (ringRef.current) {
      ringRef.current.position.copy(position); // Ring stays at base
      ringRef.current.quaternion.copy(quaternion); // Ring aligns to normal

      // Radar ping effect
      let scale = (t * 1.5 + position.x) % 2;
      ringRef.current.scale.set(scale, scale, scale);
      ringRef.current.material.opacity = 1.0 - scale / 2; // Fade out as it gets larger
    }
  });

  return (
    <group>
      {/* Radar Ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.05, 0.06, 32]} />
        <meshBasicMaterial color="#ffcc00" transparent opacity={0.5} side={THREE.DoubleSide} depthTest={false} />
      </mesh>

      <group
        ref={markerRef}
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(animal);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        {/* The 3D Base of the figurine */}
        <mesh quaternion={quaternion}>
          <cylinderGeometry args={[0.04, 0.04, 0.01, 32]} />
          <meshStandardMaterial
            color={hovered ? '#ffff00' : (isDiscovered ? '#33ff33' : '#aaaaaa')}
            emissive={hovered ? '#ffffaa' : (isDiscovered ? '#115511' : '#333333')}
            emissiveIntensity={hovered ? 2.5 : 1.0}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {/* The 3D Figurine Avatar */}
        <Html distanceFactor={10} position={[0, 0, 0]} center zIndexRange={[100, 0]}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
            transform: 'translateY(-20px)'
          }}>
            <div style={{
              fontSize: '24px',
              textShadow: '0px 2px 4px rgba(0,0,0,0.8), 0px -1px 2px rgba(255,255,255,0.4)',
              transform: hovered ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.2s',
              filter: isDiscovered ? 'none' : 'grayscale(100%) contrast(0%) brightness(150%)',
            }}>
              {isDiscovered ? animal.emoji : '❓'}
            </div>
            {hovered && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)',
                marginTop: '4px'
              }}>
                {isDiscovered ? animal.name : 'Unknown Animal'}
              </div>
            )}
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

  const setStoreAnimalsData = useStore(state => state.setAnimalsData);

  useEffect(() => {
    fetch('/data/animals.json')
      .then(res => res.json())
      .then(data => {
        setAnimalsData(data);
        setStoreAnimalsData(data);
      })
      .catch(err => console.error("Could not load animals data:", err));
  }, [setStoreAnimalsData]);

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
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[10, 5, 10]}
        intensity={2.5}
        castShadow
        color="#fffcee"
      />
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      <group ref={globeRef}>
        {/* The Earth Sphere */}
        <Sphere args={[radius, 64, 64]}>
          <meshStandardMaterial
            map={colorMap}
            bumpMap={bumpMap}
            bumpScale={0.015}
            roughnessMap={specularMap}
            roughness={0.8}
            metalnessMap={specularMap}
            metalness={0.5}
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
        <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} intensity={1.5} />
      </EffectComposer>
    </>
  );
}
