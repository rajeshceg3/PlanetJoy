import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html, OrbitControls } from '@react-three/drei';
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

  return (
    <mesh
      position={position}
      onClick={() => onSelect(animal)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshStandardMaterial color={hovered ? 'orange' : 'red'} />
    </mesh>
  );
};

export default function Globe() {
  const globeRef = useRef();
  const radius = 2; // Globe radius

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

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} />

      <group ref={globeRef}>
        {/* The Earth Sphere */}
        <Sphere args={[radius, 64, 64]}>
          <meshStandardMaterial color="#2d882d" wireframe={true} />
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

      <OrbitControls enableZoom={true} enablePan={false} minDistance={2.5} maxDistance={6} />
    </>
  );
}
