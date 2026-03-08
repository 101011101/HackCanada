import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NodeIdProvider } from "@/context/NodeIdContext";
import Homepage from "@/pages/Homepage";
import MyFarmPage from "@/pages/MyFarmPage";
import MyFoodPage from "@/pages/MyFoodPage";
import AdminDashboard from "@/AdminDashboard";

export default function App() {
  return (
    <NodeIdProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/myfarm" element={<MyFarmPage />} />
          <Route path="/myfood" element={<MyFoodPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </NodeIdProvider>
  );
}
