import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "./authSlice";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const { loading, error, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  // ✅ Redirigir si ya hay usuario logueado
  useEffect(() => {
    if (user) {
      navigate("/me", { replace: true }); // 👈 antes "/chat"
    }
  }, [user, navigate]);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col max-w-sm mx-auto mt-20 p-6 bg-gray-800 rounded-lg shadow-md text-white space-y-4"
    >
      <h2 className="text-xl font-semibold text-center">Login</h2>

      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="p-2 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="p-2 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <button
        type="submit"
        disabled={loading}
        className="p-2 bg-indigo-600 rounded hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Login"}
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
}
