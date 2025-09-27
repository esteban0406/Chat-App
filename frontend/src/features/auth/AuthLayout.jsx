import React, { useState } from "react";
import Login from "./Login";
import SignUp from "./SignUp";
import "./AuthLayout.css";

export default function AuthLayout() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-layout">
      <div className="auth-box">
        {isLogin ? <Login /> : <SignUp />}

        <div className="auth-footer">
          {isLogin ? (
            <p>
              ¿No tienes cuenta?{" "}
              <button onClick={() => setIsLogin(false)}>Regístrate</button>
            </p>
          ) : (
            <p>
              ¿Ya tienes cuenta?{" "}
              <button onClick={() => setIsLogin(true)}>Inicia sesión</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
