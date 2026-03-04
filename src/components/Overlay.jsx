import React, { useEffect, useRef, useState } from 'react';
import useStore from '../store/useStore';
import confetti from 'canvas-confetti';
import { BookOpen, Trophy, X } from 'lucide-react';

export default function Overlay() {
  const selectedAnimal = useStore((state) => state.selectedAnimal);
  const setSelectedAnimal = useStore((state) => state.setSelectedAnimal);
  const discoveredAnimals = useStore((state) => state.discoveredAnimals);
  const totalAnimals = useStore((state) => state.totalAnimals);
  const prevDiscoveredLength = useRef(discoveredAnimals.length);

  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    if (discoveredAnimals.length > prevDiscoveredLength.current) {
      // Fire confetti when a new animal is discovered
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffcc00', '#ff6699', '#66ccff']
      });
      prevDiscoveredLength.current = discoveredAnimals.length;
    }
  }, [discoveredAnimals.length]);

  return (
    <div style={overlayStyle}>
      <style>
        {`
          @keyframes slideUpFadeInCard {
            0% { opacity: 0; transform: translate(-50%, 20px); }
            100% { opacity: 1; transform: translate(-50%, 0); }
          }
          @keyframes slideUpFadeInGallery {
            0% { opacity: 0; transform: translate(-50%, calc(-50% + 20px)); }
            100% { opacity: 1; transform: translate(-50%, -50%); }
          }
          .glass-card-animal {
            animation: slideUpFadeInCard 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          }
          .glass-card-gallery {
            animation: slideUpFadeInGallery 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          }
          .btn-hover {
            transition: all 0.2s;
          }
          .btn-hover:hover {
            transform: scale(1.05);
            background: rgba(255,255,255,0.3) !important;
          }
        `}
      </style>

      {/* Top Bar */}
      <div style={topBarStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🌍 PlanetJoy
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#e0e0e0', fontWeight: 'bold' }}>
            Explore the World!
          </p>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={pillStyle}>
            <Trophy size={18} color="#ffd700" />
            <span>{discoveredAnimals.length} / {totalAnimals > 0 ? totalAnimals : '?'} Discovered</span>
          </div>

          <button
            className="btn-hover"
            style={galleryBtnStyle}
            onClick={() => setShowGallery(!showGallery)}
          >
            <BookOpen size={18} />
            Encyclopedia
          </button>
        </div>
      </div>

      {/* Selected Animal Info Card */}
      {selectedAnimal && !showGallery && (
        <div className="glass-card-animal" style={cardStyle}>
          <button style={closeIconStyle} onClick={() => setSelectedAnimal(null)}>
            <X size={20} />
          </button>

          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
             {/* If we had an image, we could put it here */}
             <div style={{ fontSize: '50px', marginBottom: '-10px' }}>✨</div>
             <h2 style={{ margin: '10px 0 0 0', color: '#fff' }}>{selectedAnimal.name}</h2>
          </div>

          <div style={factBoxStyle}>
            <strong>Fun Fact:</strong> {selectedAnimal.funFact}
          </div>

          <p style={{ lineHeight: '1.5', fontSize: '15px' }}>{selectedAnimal.description}</p>
        </div>
      )}

      {/* Encyclopedia Gallery View (Basic implementation) */}
      {showGallery && (
        <div className="glass-card-gallery" style={galleryOverlayStyle}>
          <button style={closeIconStyle} onClick={() => setShowGallery(false)}>
            <X size={24} />
          </button>
          <h2>My Encyclopedia</h2>
          <p>Animals you have found so far:</p>
          <div style={galleryGridStyle}>
            {discoveredAnimals.map(id => (
              <div key={id} style={galleryItemStyle}>
                <span style={{ fontSize: '30px' }}>✔️</span>
                <span style={{ marginTop: '10px', fontWeight: 'bold' }}>{id.toUpperCase()}</span>
              </div>
            ))}
            {discoveredAnimals.length === 0 && <p>No animals discovered yet. Keep exploring!</p>}
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
  fontFamily: '"Nunito", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  zIndex: 1000
};

const topBarStyle = {
  pointerEvents: 'auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
};

const pillStyle = {
  background: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(5px)',
  border: '1px solid rgba(255,255,255,0.2)',
  padding: '10px 15px',
  borderRadius: '25px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: 'bold',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
};

const galleryBtnStyle = {
  pointerEvents: 'auto',
  background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(5px)',
  border: '1px solid rgba(255,255,255,0.3)',
  padding: '10px 15px',
  borderRadius: '25px',
  color: 'white',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
};

const cardStyle = {
  pointerEvents: 'auto',
  position: 'absolute',
  bottom: '40px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(20, 30, 50, 0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.2)',
  padding: '25px',
  borderRadius: '20px',
  width: '90%',
  maxWidth: '350px',
  color: 'white',
  boxShadow: '0 15px 35px 0 rgba(0,0,0,0.5)'
};

const factBoxStyle = {
  background: 'rgba(255, 215, 0, 0.2)',
  borderLeft: '4px solid #ffd700',
  padding: '10px',
  borderRadius: '4px',
  marginBottom: '15px',
  fontSize: '14px'
};

const closeIconStyle = {
  position: 'absolute',
  top: '15px',
  right: '15px',
  background: 'none',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  opacity: 0.7
};

const galleryOverlayStyle = {
  pointerEvents: 'auto',
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: 'rgba(20, 30, 50, 0.85)',
  backdropFilter: 'blur(15px)',
  border: '1px solid rgba(255,255,255,0.3)',
  padding: '30px',
  borderRadius: '20px',
  width: '90%',
  maxWidth: '600px',
  maxHeight: '80vh',
  overflowY: 'auto',
  color: 'white',
  boxShadow: '0 20px 50px 0 rgba(0,0,0,0.7)'
};

const galleryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: '15px',
  marginTop: '20px'
};

const galleryItemStyle = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: '20px',
  padding: '25px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
};