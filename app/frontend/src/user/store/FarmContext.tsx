import React, { createContext, useContext, useState } from 'react';

interface FarmContextValue {
  farmId: number | null;
  farmLat: number | null;
  farmLng: number | null;
  joined: boolean;
  join: (farmId: number, lat: number, lng: number) => void;
  leave: () => void;
}

const FarmContext = createContext<FarmContextValue | null>(null);

function readNum(key: string): number | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const [farmId, setFarmId] = useState<number | null>(() =>
    readNum('mycelium:farm_id')
  );
  const [farmLat, setFarmLat] = useState<number | null>(() =>
    readNum('mycelium:farm_lat')
  );
  const [farmLng, setFarmLng] = useState<number | null>(() =>
    readNum('mycelium:farm_lng')
  );

  const joined = farmId !== null;

  const join = (id: number, lat: number, lng: number) => {
    localStorage.setItem('mycelium:farm_id', String(id));
    localStorage.setItem('mycelium:farm_lat', String(lat));
    localStorage.setItem('mycelium:farm_lng', String(lng));
    setFarmId(id);
    setFarmLat(lat);
    setFarmLng(lng);
  };

  const leave = () => {
    localStorage.removeItem('mycelium:farm_id');
    localStorage.removeItem('mycelium:farm_lat');
    localStorage.removeItem('mycelium:farm_lng');
    setFarmId(null);
    setFarmLat(null);
    setFarmLng(null);
  };

  return (
    <FarmContext.Provider value={{ farmId, farmLat, farmLng, joined, join, leave }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm(): FarmContextValue {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error('useFarm must be used within FarmProvider');
  return ctx;
}
