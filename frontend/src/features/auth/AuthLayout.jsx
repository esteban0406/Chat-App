import React, { useState } from "react";
import Login from "./Login";
import SignUp from "./SignUp";

export default function AuthLayout() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex justify-center items-center h-screen bg-[#2c2f33] text-white">
      <div className="bg-[#23272a] p-8 rounded-lg w-[350px]">
        {isLogin ? <Login /> : <SignUp />}

        <div className="mt-4 text-center">
          {isLogin ? (
            <p>
              ¿No tienes cuenta?{" "}
              <button
                onClick={() => setIsLogin(false)}
                className="text-[#7289da] hover:underline focus:outline-none"
              >
                Regístrate
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => setIsLogin(true)}
                className="text-[#7289da] hover:underline focus:outline-none"
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
