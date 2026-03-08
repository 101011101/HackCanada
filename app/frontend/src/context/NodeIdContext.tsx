import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "myfood:node_id";

type NodeIdContextValue = {
  nodeId: number | null;
  setNodeId: (id: number | null) => void;
  isReady: boolean;
};

const NodeIdContext = createContext<NodeIdContextValue | null>(null);

export function NodeIdProvider({ children }: { children: ReactNode }) {
  const [nodeId, setNodeIdState] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? null : n;
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const setNodeId = useCallback((id: number | null) => {
    setNodeIdState(id);
    if (id === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(id));
    }
  }, []);

  const value: NodeIdContextValue = { nodeId, setNodeId, isReady };

  return (
    <NodeIdContext.Provider value={value}>{children}</NodeIdContext.Provider>
  );
}

export function useNodeId(): NodeIdContextValue {
  const ctx = useContext(NodeIdContext);
  if (!ctx) {
    throw new Error("useNodeId must be used within NodeIdProvider");
  }
  return ctx;
}
