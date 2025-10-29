import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "./authSlice";
import { useNavigate } from "react-router-dom";

import { loginWithGoogle, loginWithMicrosoft } from "./auth.service";

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

  useEffect(() => {
    if (user) {
      navigate("/me", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col max-w-sm mx-auto mt-20 p-6 bg-gray-800 rounded-lg shadow-md text-white space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold text-center">Login</h2>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-indigo-600 rounded hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Login"}
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>

      {/* 🔹 Separador */}
      <div className="flex items-center my-4">
        <hr className="flex-grow border-gray-600" />
        <span className="px-2 text-gray-400">o</span>
        <hr className="flex-grow border-gray-600" />
      </div>

      {/* 🔹 Botones OAuth */}
      <div className="flex flex-col gap-3">
        <button
          onClick={loginWithGoogle}
          className="w-full bg-red-500 hover:bg-red-600 py-2 rounded text-white font-semibold"
        >
          Continuar con Google
        </button>
        <button
          onClick={loginWithMicrosoft}
          className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded text-white font-semibold"
        >
          Continuar con Microsoft
        </button>
      </div>
    </div>
  );
}
