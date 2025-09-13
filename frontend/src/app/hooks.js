// src/app/hooks.js
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
//import { store } from "./store";

// Tipado para TypeScript (opcional, si usas JS normal ignora)
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Ejemplo extra: un hook que obtiene el estado completo
export const useAppState = () => useSelector((state) => state);

// Ejemplo: hook para seleccionar mensajes
export const useMessages = () => useSelector((state) => state.messages.items);

// Ejemplo: hook para autenticación
export const useAuth = () => useSelector((state) => state.auth);

// Ejemplo: hook con lógica (más allá de leer Redux)
export const useSendMessage = () => {
  const dispatch = useDispatch();

  return useCallback(
    (msg) => {
      dispatch({ type: "messages/addMessage", payload: msg });
    },
    [dispatch]
  );
};
