import React from 'react';
import useStore from '../store/useStore';

export default function Overlay() {
  const selectedAnimal = useStore((state) => state.selectedAnimal);
  const setSelectedAnimal = useStore((state) => state.setSelectedAnimal);
  const discoveredAnimals = useStore((state) => state.discoveredAnimals);

  return (
    <div style={overlayStyle}>
      <h1 style={{ margin: 0, paddingBottom: '10px' }}>PlanetJoy</h1>
      <p style={{ margin: 0, paddingBottom: '20px' }}>
        Discovered Animals: {discoveredAnimals.length}
      </p>

      {selectedAnimal && (
        <div style={cardStyle}>
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
  background: 'rgba(0, 0, 0, 0.8)',
  padding: '20px',
  borderRadius: '10px',
  maxWidth: '300px',
  marginTop: '20px',
  color: 'white',
  boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
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