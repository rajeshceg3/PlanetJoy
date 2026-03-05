import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html, CameraControls, useTexture, Stars, Sparkles, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import useStore from '../store/useStore';
import { playHoverSound, playDiscoverSound, playSwooshSound } from '../utils/soundEffects';

const innerAtmosphereVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const innerAtmosphereFragmentShader = `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 1.5;
  }
`;

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
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 2.0;
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
  giraffe: '🦒',
  zebra: '🦓',
  hippo: '🦛',
  tiger: '🐅',
  orangutan: '🦧',
  snow_leopard: '🐆',
  camel: '🐪',
  bald_eagle: '🦅',
  grizzly_bear: '🐻',
  moose: '🦌',
  wolf: '🐺',
  raccoon: '🦝',
  jaguar: '🐆',
  sloth: '🦥',
  toucan: '🦜',
  llama: '🦙',
  capybara: '🐹',
  brown_bear: '🐻',
  reindeer: '🦌',
  fox: '🦊',
  lynx: '🐱',
  koala: '🐨',
  kangaroo: '🦘',
  platypus: '🦆',
  emu: '🦤',
  tasmanian_devil: '😈',
  penguin: '🐧',
  seal: '🦭',
  walrus: '🦭',
  polar_bear: '🐻‍❄️',
  default: '🐾'
};

const AnimalMarker = ({ animal, position, onSelect, earthRef }) => {
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
      // More playful bounce when hovered or undiscovered
      const bounceHeight = isDiscovered ? (hovered ? 0.04 : 0.02) : 0.05;
      const speed = isDiscovered ? (hovered ? 6 : 2) : 5;

      // Combine two sine waves for a more organic "joyful" bounce
      const bouncePhase = t * speed + position.x;
      const bounce = (Math.sin(bouncePhase) + Math.sin(t * speed * 0.5)) * 0.5 * bounceHeight;
      const baseOffset = isDiscovered ? 0.05 : 0.08;

      const newPos = position.clone().add(normal.multiplyScalar(Math.abs(bounce) + baseOffset));
      markerRef.current.position.copy(newPos);

      // Squash and stretch based on the derivative (velocity) of the bounce
      const velocity = Math.cos(bouncePhase);
      const squash = 1.0 - Math.abs(velocity) * 0.2; // Squish when moving fast
      const stretch = 1.0 + Math.abs(velocity) * 0.2;

      // Smooth scaling on hover and a pop in when discovered
      let targetScaleX = squash;
      let targetScaleY = stretch;
      let targetScaleZ = squash;

      let baseScale = 1;
      if (hovered) {
        baseScale = 1.5;
      } else if (isDiscovered) {
        // slight pulsating if discovered but not hovered to keep it alive and fun
        baseScale = 1.0 + Math.sin(t * 3) * 0.05;
      }

      markerRef.current.scale.lerp({
        x: targetScaleX * baseScale,
        y: targetScaleY * baseScale,
        z: targetScaleZ * baseScale
      }, 0.2);
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
        if (!isDiscovered) playDiscoverSound();
        onSelect(animal);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (!hovered) playHoverSound();
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

      {/* Magical Sparkles around the marker */}
      {hovered && (
        <group position={position}>
          <Sparkles
            count={isDiscovered ? 20 : 30}
            scale={0.3}
            size={4}
            speed={0.4}
            opacity={0.8}
            color={isDiscovered ? "#ffd700" : "#4deeea"}
          />
        </group>
      )}

      {/* Floating Emoji Marker via HTML */}
      <group ref={markerRef}>
        <Html distanceFactor={12} center zIndexRange={[100, 0]} occlude={earthRef ? [earthRef] : undefined}>
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
  const earthRef = useRef();
  const cameraControlsRef = useRef();
  const radius = 2; // Globe radius

  const cloudsRef = useRef();
  const starsRef = useRef();

  // Load textures
  const [colorMap, bumpMap, specularMap, cloudsMap, nightMap] = useTexture([
    '/assets/textures/earth-blue-marble.jpg',
    '/assets/textures/earth-topology.png',
    '/assets/textures/earth-water.png',
    '/assets/textures/earth-clouds.png',
    '/assets/textures/earth-night.jpg'
  ]);

  // Create custom shader material for day/night blending
  const earthMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      map: colorMap,
      bumpMap: bumpMap,
      bumpScale: 0.03,
      roughnessMap: specularMap,
      roughness: 0.4,
      metalnessMap: specularMap,
      metalness: 0.4,
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.tNight = { value: nightMap };
      // Light direction from our directional light
      shader.uniforms.sunDirection = { value: new THREE.Vector3(20, 10, 10).normalize() };

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_pars_fragment>',
        `
        #include <map_pars_fragment>
        uniform sampler2D tNight;
        uniform vec3 sunDirection;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>

        // Calculate light intensity based on normal and sun direction
        // Transform sunDirection to view space
        vec3 viewSunDir = normalize((viewMatrix * vec4(sunDirection, 0.0)).xyz);
        float dotNL = dot(normalize(vNormal), viewSunDir);
        float nightIntensity = smoothstep(-0.2, 0.2, -dotNL); // Blend edge

        vec3 nightColor = texture2D(tNight, vMapUv).rgb;
        // Add night city lights only to the dark side's emissive radiance
        totalEmissiveRadiance += nightColor * nightIntensity * 2.0;
        `
      );
    };

    return material;
  }, [colorMap, bumpMap, specularMap, nightMap]);

  const setSelectedAnimal = useStore(state => state.setSelectedAnimal);
  const selectedAnimal = useStore(state => state.selectedAnimal);
  const addDiscoveredAnimal = useStore(state => state.addDiscoveredAnimal);
  const setTotalAnimals = useStore(state => state.setTotalAnimals);

  const [animalsData, setAnimalsData] = useState(null);

  useEffect(() => {
    fetch('/data/animals.json')
      .then(res => res.json())
      .then(data => {
        setAnimalsData(data);
        let count = 0;
        Object.keys(data).forEach(continent => {
          count += data[continent].length;
        });
        setTotalAnimals(count);
      })
      .catch(err => console.error("Could not load animals data:", err));
  }, [setTotalAnimals]);

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
        playSwooshSound();
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
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0001; // slowly rotate the stars
    }
    // Auto rotate globe if no animal selected
    if (cameraControlsRef.current && !selectedAnimal) {
       cameraControlsRef.current.azimuthAngle -= 0.1 * delta; // slow rotation
    }
  });

  return (
    <>
      <ambientLight intensity={0.05} />
      <directionalLight
        position={[20, 10, 10]}
        intensity={4.0}
        castShadow
        color="#ffead4" // warmer golden light
      />
      {/* Visible Sun mesh at directional light position */}
      <mesh position={[40, 20, 20]}>
        <sphereGeometry args={[2.0, 32, 32]} />
        <meshStandardMaterial
          color="#ffffee"
          emissive="#ffcc77"
          emissiveIntensity={10.0}
        />
      </mesh>

      {/* Subtle rim light for the dark side */}
      <directionalLight
        position={[-15, -5, -15]}
        intensity={0.8}
        color="#2244ff" // deeper blue for contrast
      />

      {/* Rotating Starfield */}
      <group ref={starsRef}>
        <Stars
          radius={100}
          depth={50}
          count={10000}
          factor={5}
          saturation={0}
          fade
          speed={1.5}
        />
      </group>

      <group ref={globeRef}>
        {/* Inner Atmosphere (Rayleigh scattering edge) */}
        <Sphere args={[radius * 1.005, 64, 64]}>
          <shaderMaterial
            vertexShader={innerAtmosphereVertexShader}
            fragmentShader={innerAtmosphereFragmentShader}
            blending={THREE.AdditiveBlending}
            transparent={true}
          />
        </Sphere>

        {/* The Earth Sphere */}
        <Sphere args={[radius, 64, 64]} ref={earthRef} material={earthMaterial} />

        {/* Cloud Layer */}
        <Sphere args={[radius + 0.02, 64, 64]} ref={cloudsRef}>
          <meshStandardMaterial
            map={cloudsMap}
            transparent={true}
            opacity={0.6}
            blending={THREE.NormalBlending}
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
            earthRef={earthRef}
            onSelect={(animal) => {
              setSelectedAnimal(animal);
              addDiscoveredAnimal(animal.id);
            }}
          />
        ))}
      </group>

      <Environment preset="night" />

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
        <DepthOfField
          focusDistance={0.01}
          focalLength={0.2}
          bokehScale={3}
          height={480}
        />
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          height={300}
          intensity={2.5}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
}
