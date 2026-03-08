import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { FarmProvider } from "./user/store/FarmContext";
import "./user/user.css";
import App from "@/App";
import DevNodeSwitcher from "./user/components/dev/DevNodeSwitcher";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");
createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <FarmProvider>
        <App />
        <DevNodeSwitcher />
      </FarmProvider>
    </BrowserRouter>
  </React.StrictMode>
);
