import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./features/auth/AuthLayout";
import FriendsLayout, { FriendsSidebar } from "./features/user/FriendsLayout";
import FriendList from "./features/Friends/FriendList";
import InviteForm from "./features/Friends/InviteForm";
import InviteList from "./features/Friends/InviteList";
import ServerInviteList from "./features/servers/serverInvites/ServerInviteList";
import ServerLayout, {
  ServerSectionSidebar,
} from "./features/servers/ServerLayout";
import ChatSection from "./features/messages/ChatSection";
import RootLayout from "./features/layout/RootLayout";
import PrivateRoute from "./features/auth/PrivateRoute";
import OauthSuccess from "./features/auth/OauthSuccess";
import { jwtDecode } from "jwt-decode";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "./features/auth/authSlice";
import { useEffect } from "react";
import SectionShell from "./features/layout/SectionShell";

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
  }, [token, dispatch]);

  return (
    <div className="h-screen w-screen bg-gray-900 text-white">
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/auth" element={<AuthLayout />} />
          <Route path="/oauth-success" element={<OauthSuccess />} />

          {/* Layout raíz (Discord-style) */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <RootLayout />
              </PrivateRoute>
            }
          >
            {/* Redirigir /me a /friends */}
            <Route path="me" element={<Navigate to="/friends" replace />} />

            {/* Amigos */}
            <Route
              path="friends"
              element={<SectionShell sidebar={<FriendsSidebar />} />}
            >
              <Route element={<FriendsLayout />}>
                <Route index element={<FriendList />} />
                <Route path="add" element={<InviteForm />} />
                <Route path="requests" element={<InviteList />} />
                <Route path="server-requests" element={<ServerInviteList />} />
              </Route>
            </Route>

            {/* Servidores */}
            <Route
              path="servers/:serverId"
              element={<SectionShell sidebar={<ServerSectionSidebar />} />}
            >
              <Route element={<ServerLayout />}>
                <Route path="channels/:channelId" element={<ChatSection />} />
              </Route>
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
