import React from 'react';
import useStore from '../store/useStore';

export default function Overlay() {
  const selectedAnimal = useStore((state) => state.selectedAnimal);
  const setSelectedAnimal = useStore((state) => state.setSelectedAnimal);
  const discoveredAnimals = useStore((state) => state.discoveredAnimals);

  return (
    <div style={overlayStyle}>
      <style>
        {`
          @keyframes slideUpFadeIn {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .glass-card {
            animation: slideUpFadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          }
        `}
      </style>
      <h1 style={{ margin: 0, paddingBottom: '10px' }}>PlanetJoy</h1>
      <p style={{ margin: 0, paddingBottom: '20px' }}>
        Discovered Animals: {discoveredAnimals.length}
      </p>

      {selectedAnimal && (
        <div className="glass-card" style={cardStyle}>
          <h2>{selectedAnimal.name}</h2>
          <p><strong>Fact:</strong> {selectedAnimal.funFact}</p>
          <p>{selectedAnimal.description}</p>

          <button
            style={closeBtnStyle}
            onClick={() => setSelectedAnimal(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

const overlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  padding: '20px',
  boxSizing: 'border-box',
  color: 'white',
  textShadow: '1px 1px 2px black',
  fontFamily: 'sans-serif'
};

const cardStyle = {
  pointerEvents: 'auto',
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.2)',
  padding: '20px',
  borderRadius: '15px',
  maxWidth: '300px',
  marginTop: '20px',
  color: 'white',
  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.37)'
};

const closeBtnStyle = {
  marginTop: '10px',
  padding: '8px 16px',
  background: '#ff4444',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
};