import React, { useState } from "react";
import Login from "./Login";
import SignUp from "./SignUp";

export default function AuthLayout() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#2c2f33",
        color: "white",
      }}
    >
      <div
        style={{
          background: "#23272a",
          padding: "2rem",
          borderRadius: "8px",
          width: "350px",
        }}
      >
        {isLogin ? <Login /> : <SignUp />}

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          {isLogin ? (
            <p>
              ¿No tienes cuenta?{" "}
              <button
                onClick={() => setIsLogin(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#7289da",
                  cursor: "pointer",
                }}
              >
                Regístrate
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => setIsLogin(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#7289da",
                  cursor: "pointer",
                }}
              >
                Inicia sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
