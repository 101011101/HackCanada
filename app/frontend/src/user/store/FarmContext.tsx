import React, { createContext, useContext, useState } from 'react';

export interface FarmEntry {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

interface FarmContextValue {
  farmId: number | null;
  farmLat: number | null;
  farmLng: number | null;
  allFarms: FarmEntry[];
  joined: boolean;
  join: (farmId: number, lat: number, lng: number, name?: string) => void;
  switchFarm: (farmId: number) => void;
  leave: () => void;
}

const FarmContext = createContext<FarmContextValue | null>(null);

function readNum(key: string): number | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

function readFarms(): FarmEntry[] {
  try {
    const raw = localStorage.getItem('mycelium:farms');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFarms(farms: FarmEntry[]) {
  localStorage.setItem('mycelium:farms', JSON.stringify(farms));
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
  const [allFarms, setAllFarms] = useState<FarmEntry[]>(() => {
    const stored = readFarms();
    // Migrate: if we have a farm_id but no farms list, seed it
    if (stored.length === 0) {
      const active = readNum('mycelium:farm_id');
      if (active !== null) {
        const lat = readNum('mycelium:farm_lat') ?? 0;
        const lng = readNum('mycelium:farm_lng') ?? 0;
        return [{ id: active, name: `Plot #${active}`, lat, lng }];
      }
    }
    return stored;
  });

  const joined = farmId !== null;

  const join = (id: number, lat: number, lng: number, name?: string) => {
    localStorage.setItem('mycelium:farm_id', String(id));
    localStorage.setItem('mycelium:farm_lat', String(lat));
    localStorage.setItem('mycelium:farm_lng', String(lng));
    setFarmId(id);
    setFarmLat(lat);
    setFarmLng(lng);
    setAllFarms(prev => {
      if (prev.some(f => f.id === id)) {
        const next = prev.map(f => f.id === id ? { ...f, lat, lng } : f);
        saveFarms(next);
        return next;
      }
      const next = [...prev, { id, name: name ?? `Plot #${id}`, lat, lng }];
      saveFarms(next);
      return next;
    });
  };

  const switchFarm = (id: number) => {
    localStorage.setItem('mycelium:farm_id', String(id));
    setFarmId(id);
    const farm = allFarms.find(f => f.id === id);
    if (farm) {
      localStorage.setItem('mycelium:farm_lat', String(farm.lat));
      localStorage.setItem('mycelium:farm_lng', String(farm.lng));
      setFarmLat(farm.lat);
      setFarmLng(farm.lng);
    }
  };

  const leave = () => {
    localStorage.removeItem('mycelium:farm_id');
    localStorage.removeItem('mycelium:farm_lat');
    localStorage.removeItem('mycelium:farm_lng');
    localStorage.removeItem('mycelium:farms');
    setFarmId(null);
    setFarmLat(null);
    setFarmLng(null);
    setAllFarms([]);
  };

  return (
    <FarmContext.Provider value={{ farmId, farmLat, farmLng, allFarms, joined, join, switchFarm, leave }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm(): FarmContextValue {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error('useFarm must be used within FarmProvider');
  return ctx;
}
