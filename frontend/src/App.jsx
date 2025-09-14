import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./features/auth/AuthLayout";
import ChatRoom from "./features/chat/ChatRoom";
import { useSelector } from "react-redux";
import "./App.css"

function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthLayout />} />
        <Route
          path="/chat"
          element={user ? <ChatRoom /> : <Navigate to="/auth" />}
        />
        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
