import React from "react";
import { createRoot } from "react-dom/client";
import Intro from "@/nodal-network/Intro";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");
createRoot(root).render(
  <React.StrictMode>
    <Intro />
  </React.StrictMode>
);
