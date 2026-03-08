import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NodeIdProvider } from "@/context/NodeIdContext";
import Homepage from "@/pages/Homepage";
import MyFarmPage from "@/pages/MyFarmPage";
import MyFoodPage from "@/pages/MyFoodPage";

export default function App() {
  return (
    <NodeIdProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/myfarm" element={<MyFarmPage />} />
          <Route path="/myfood" element={<MyFoodPage />} />
        </Routes>
      </BrowserRouter>
    </NodeIdProvider>
  );
}
