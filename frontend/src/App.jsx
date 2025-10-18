import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./features/auth/AuthLayout";
import FriendsPage from "./features/user/FriendsPage";
import ServerLayout from "./features/servers/ServerLayout";
import ChatSection from "./features/messages/ChatSection";
import { jwtDecode } from "jwt-decode";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "./features/auth/authSlice";
import { useEffect } from "react";
import PrivateRoute from "./features/auth/PrivateRoute";
import RootLayout from "./features/layout/RootLayout"; // 👈 nuevo layout

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          dispatch(logout());
        }
      } catch {
        dispatch(logout());
      }
    }
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-900 text-white">
      <BrowserRouter>
        <Routes>
          {/* Login */}
          <Route path="/auth" element={<AuthLayout />} />

          {/* Layout raíz con sidebar de servidores */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <RootLayout />
              </PrivateRoute>
            }
          >
            {/* Perfil de usuario */}
            <Route path="me/*" element={<FriendsPage />} />

            {/* Servidores */}
            <Route path="servers/:serverId/*" element={<ServerLayout />}>
              <Route path="channels/:channelId" element={<ChatSection />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
