import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import AnalyzePage from "./pages/AnalyzePage";
import HowItWorks from "./pages/HowItWorks";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AnalyzePage />} />
          <Route path="how-it-works" element={<HowItWorks />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
