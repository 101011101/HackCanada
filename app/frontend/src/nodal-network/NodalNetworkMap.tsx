"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  farms as initialFarms,
  buildNetworkEdges,
  type FarmNode,
} from "./data";
import NetworkMapCore, { type NetworkCallbacks } from "./NetworkMapCore";
import { Legend } from "./Legend";
import { FarmPanel, EMPTY_FORM, farmToForm, type PanelMode, type FarmForm } from "./FarmPanel";

/**
 * Backwards-compatible wrapper that composes NetworkMapCore + Legend + FarmPanel
 * into a single self-contained component (the original monolith API).
 * New code should use AdminDashboard instead.
 */
export default function NodalNetworkMap() {
  const [farmList, setFarmList] = useState<FarmNode[]>(() => [...initialFarms]);
  const [panelMode, setPanelMode] = useState<PanelMode>("closed");
  const [form, setForm] = useState<FarmForm>({ ...EMPTY_FORM });
  const [editFarmId, setEditFarmId] = useState<number | null>(null);
  const nextId = useRef(Math.max(...initialFarms.map(f => f.id)) + 1);

  const edges = useMemo(() => buildNetworkEdges(farmList), [farmList]);

  const parseOrNull = (v: string): number | null => {
    if (v.trim() === "") return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  const callbacks = useRef<NetworkCallbacks>({
    onEditFarm: () => {},
    onDeleteFarm: () => {},
  });

  callbacks.current.onEditFarm = useCallback((id: number) => {
    const farm = farmList.find(f => f.id === id);
    if (!farm) return;
    setEditFarmId(id);
    setForm(farmToForm(farm));
    setPanelMode("edit");
  }, [farmList]);

  callbacks.current.onDeleteFarm = useCallback((id: number) => {
    if (!confirm(`Delete this farm?`)) return;
    setFarmList(prev => prev.filter(f => f.id !== id));
    setPanelMode("closed");
    setEditFarmId(null);
    setForm({ ...EMPTY_FORM });
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (panelMode !== "add-pinpoint") return;
    setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
  }, [panelMode]);

  const handleRightClick = useCallback((lat: number, lng: number) => {
    setForm({ ...EMPTY_FORM, lat: lat.toFixed(6), lng: lng.toFixed(6) });
    setPanelMode("add-pinpoint");
  }, []);

  const handleSubmit = useCallback(() => {
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || isNaN(lng) || !form.name.trim()) return;

    if (panelMode === "edit" && editFarmId != null) {
      setFarmList(prev => prev.map(f => {
        if (f.id !== editFarmId) return f;
        return {
          ...f,
          name: form.name.trim(),
          plot_size_sqft: parseOrNull(form.plot_size_sqft),
          plot_type: (form.plot_type || null) as FarmNode["plot_type"],
          tools: (form.tools || null) as FarmNode["tools"],
          budget: (form.budget || null) as FarmNode["budget"],
          pH: parseOrNull(form.pH),
          moisture: parseOrNull(form.moisture),
          temperature: parseOrNull(form.temperature),
          humidity: parseOrNull(form.humidity),
        };
      }));
    } else {
      const newFarm: FarmNode = {
        id: nextId.current++,
        name: form.name.trim(),
        lat, lng,
        plot_size_sqft: parseOrNull(form.plot_size_sqft),
        plot_type: (form.plot_type || null) as FarmNode["plot_type"],
        tools: (form.tools || null) as FarmNode["tools"],
        budget: (form.budget || null) as FarmNode["budget"],
        pH: parseOrNull(form.pH),
        moisture: parseOrNull(form.moisture),
        temperature: parseOrNull(form.temperature),
        humidity: parseOrNull(form.humidity),
        status: "new",
        current_crop_id: null,
        cycle_end_date: null,
      };
      setFarmList(prev => [...prev, newFarm]);
    }

    setForm({ ...EMPTY_FORM });
    setPanelMode("closed");
    setEditFarmId(null);
  }, [form, panelMode, editFarmId]);

  const handleDeleteFromPanel = useCallback(() => {
    if (editFarmId == null) return;
    callbacks.current.onDeleteFarm(editFarmId);
  }, [editFarmId]);

  const handleCancel = useCallback(() => {
    setForm({ ...EMPTY_FORM });
    setPanelMode("closed");
    setEditFarmId(null);
  }, []);

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <NetworkMapCore
        farmList={farmList}
        edges={edges}
        callbacks={callbacks}
        panelMode={panelMode}
        onMapClick={handleMapClick}
        onRightClick={handleRightClick}
      />

      <Legend
        farmList={farmList}
        edges={edges}
        style={{ position: "absolute", bottom: 16, left: 16, zIndex: 10 }}
      />

      <FarmPanel
        mode={panelMode}
        form={form}
        onFormChange={setForm}
        onModeChange={setPanelMode}
        onSubmit={handleSubmit}
        onDelete={panelMode === "edit" ? handleDeleteFromPanel : undefined}
        onCancel={handleCancel}
        style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}
      />
    </div>
  );
}
