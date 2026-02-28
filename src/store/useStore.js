import { create } from 'zustand'

const useStore = create((set) => ({
  visitedContinents: JSON.parse(localStorage.getItem('visitedContinents')) || [],
  discoveredAnimals: JSON.parse(localStorage.getItem('discoveredAnimals')) || [],
  selectedAnimal: null,

  addVisitedContinent: (continent) => set((state) => {
    if (!state.visitedContinents.includes(continent)) {
      const newContinents = [...state.visitedContinents, continent];
      localStorage.setItem('visitedContinents', JSON.stringify(newContinents));
      return { visitedContinents: newContinents };
    }
    return state;
  }),

  addDiscoveredAnimal: (animalId) => set((state) => {
    if (!state.discoveredAnimals.includes(animalId)) {
      const newAnimals = [...state.discoveredAnimals, animalId];
      localStorage.setItem('discoveredAnimals', JSON.stringify(newAnimals));
      return { discoveredAnimals: newAnimals };
    }
    return state;
  }),

  setSelectedAnimal: (animal) => set({ selectedAnimal: animal }),
}));

export default useStore;