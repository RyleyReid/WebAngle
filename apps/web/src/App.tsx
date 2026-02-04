import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import Layout from "./Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import WebsitesPage from "./pages/WebsitesPage";
import AnalyzePage from "./pages/AnalyzePage";
import HowItWorks from "./pages/HowItWorks";

function RootRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>;
  return <Navigate to={isSignedIn ? "/websites" : "/sign-in"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<RootRedirect />} />
          <Route path="sign-in/*" element={<SignInPage />} />
          <Route path="sign-up/*" element={<SignUpPage />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route
            path="websites"
            element={
              <ProtectedRoute>
                <WebsitesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="analyze"
            element={
              <ProtectedRoute>
                <AnalyzePage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
