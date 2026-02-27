import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Globe from './components/Globe';
import Overlay from './components/Overlay';
import './App.css';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000010' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <Suspense fallback={null}>
          <Globe />
        </Suspense>
      </Canvas>
      <Overlay />
    </div>
  );
}

export default App;