import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../auth/authSlice";
import { useNavigate } from "react-router-dom";
import "./UserMenu.css"

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="user-menu">
      <div
        className="user-menu-avatar"
        onClick={() => setOpen(!open)}
      >
        {user?.username?.charAt(0).toUpperCase() || "U"}
      </div>

      {open && (
        <ul className="user-menu-dropdown">
          <li onClick={() => navigate("/profile")}>Editar perfil</li>
          <li className="logout" onClick={handleLogout}>Cerrar sesión</li>
        </ul>
      )}
    </div>
  );
}
