import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html, OrbitControls, useTexture, Stars } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store/useStore';

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

  useFrame((state) => {
    if (markerRef.current) {
      // Gentle bounce effect
      const t = state.clock.getElapsedTime();
      markerRef.current.position.y = position.y + Math.sin(t * 5 + position.x) * 0.02;

      // Smooth scaling on hover
      const targetScale = hovered ? 1.5 : 1;
      markerRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, 0.1);
    }
  });

  return (
    <mesh
      ref={markerRef}
      position={position}
      onClick={() => onSelect(animal)}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      <sphereGeometry args={[0.04, 32, 32]} />
      <meshStandardMaterial
        color={hovered ? '#ffaa00' : '#ff4444'}
        emissive={hovered ? '#ffaa00' : '#220000'}
        emissiveIntensity={hovered ? 0.5 : 0}
        roughness={0.2}
      />
      {hovered && (
        <Html distanceFactor={10} position={[0, 0.1, 0]} center zIndexRange={[100, 0]}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            {animal.name}
          </div>
        </Html>
      )}
    </mesh>
  );
};

export default function Globe() {
  const globeRef = useRef();
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

  useFrame(() => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0005; // slowly rotate the clouds
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

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={2.5}
        maxDistance={8}
        autoRotate={true}
        autoRotateSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
}
