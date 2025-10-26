import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login as loginAction } from "./authSlice";

export default function OauthSuccess() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");
    const username = params.get("username");
    const email = params.get("email");
    const avatar = params.get("avatar");
    const provider = params.get("provider");

    if (token && email) {
      const user = { username, email, avatar, provider };

      // Guardar en Redux
      dispatch(
        loginAction.fulfilled({ token, user }, "oauth", undefined)
      );

      // Guardar en localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/friends"); // o "/me"
    } else {
      navigate("/auth");
    }
  }, [navigate, dispatch]);

  return <p>Autenticando con {window.location.search.includes("google") ? "Google" : "Microsoft"}...</p>;
}
