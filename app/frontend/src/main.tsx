import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { FarmProvider } from "./user/store/FarmContext";
import { NodeIdProvider } from "@/context/NodeIdContext";
import "@/index.css";
import "./user/user.css";
import App from "@/App";
import DevNodeSwitcher from "./user/components/dev/DevNodeSwitcher";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");
createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <FarmProvider>
        <NodeIdProvider>
          <App />
          <DevNodeSwitcher />
        </NodeIdProvider>
      </FarmProvider>
    </BrowserRouter>
  </React.StrictMode>
);
