import React, { useState } from 'react';
import useStore from '../store/useStore';

export default function Overlay() {
  const selectedAnimal = useStore((state) => state.selectedAnimal);
  const setSelectedAnimal = useStore((state) => state.setSelectedAnimal);
  const discoveredAnimals = useStore((state) => state.discoveredAnimals);
  const animalsData = useStore((state) => state.animalsData);

  const [showEncyclopedia, setShowEncyclopedia] = useState(false);

  // Calculate total animals
  let totalAnimals = 0;
  if (animalsData) {
    Object.keys(animalsData).forEach(continent => {
      totalAnimals += animalsData[continent].length;
    });
  }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, paddingBottom: '10px' }}>PlanetJoy</h1>
          <p style={{ margin: 0, paddingBottom: '10px' }}>
            Discovered Animals: {discoveredAnimals.length} / {totalAnimals || '?'}
          </p>
          {totalAnimals > 0 && (
            <div style={{ width: '200px', height: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '5px' }}>
              <div style={{
                width: `${(discoveredAnimals.length / totalAnimals) * 100}%`,
                height: '100%',
                background: '#4caf50',
                borderRadius: '5px',
                transition: 'width 0.3s ease-in-out'
              }} />
            </div>
          )}
        </div>

        <button
          style={{
            ...closeBtnStyle,
            background: '#2196F3',
            pointerEvents: 'auto',
            marginTop: 0
          }}
          onClick={() => setShowEncyclopedia(true)}
        >
          📖 Encyclopedia
        </button>
      </div>

      {selectedAnimal && !showEncyclopedia && (
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

      {showEncyclopedia && animalsData && (
        <div style={modalBackdropStyle}>
          <div className="glass-card" style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Animal Encyclopedia</h2>
              <button style={closeBtnStyle} onClick={() => setShowEncyclopedia(false)}>Close</button>
            </div>
            <div style={gridStyle}>
              {Object.keys(animalsData).map(continent => (
                animalsData[continent].map((animal) => {
                  const isDiscovered = discoveredAnimals.includes(animal.id);
                  return (
                    <div key={animal.id} style={isDiscovered ? discoveredItemStyle : undiscoveredItemStyle}>
                      <div style={{ fontSize: '40px', filter: isDiscovered ? 'none' : 'grayscale(100%) opacity(0.3)' }}>
                        {isDiscovered ? animal.emoji : '❓'}
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>
                        {isDiscovered ? animal.name : 'Unknown'}
                      </div>
                    </div>
                  );
                })
              ))}
            </div>
          </div>
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

const modalBackdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  pointerEvents: 'auto',
  zIndex: 1000,
};

const modalStyle = {
  background: 'rgba(20, 20, 40, 0.8)',
  backdropFilter: 'blur(15px)',
  WebkitBackdropFilter: 'blur(15px)',
  border: '1px solid rgba(255,255,255,0.2)',
  padding: '30px',
  borderRadius: '20px',
  width: '80%',
  maxWidth: '800px',
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  color: 'white',
  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.37)'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
  gap: '15px',
  overflowY: 'auto',
  paddingRight: '10px',
};

const itemStyleBase = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '15px 5px',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  transition: 'transform 0.2s',
};

const discoveredItemStyle = {
  ...itemStyleBase,
  background: 'rgba(255,255,255,0.15)',
  border: '1px solid rgba(255,255,255,0.3)',
};

const undiscoveredItemStyle = {
  ...itemStyleBase,
};