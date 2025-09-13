import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [], // lista de mensajes
};

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.items.push(action.payload);
    },
    setMessages: (state, action) => {
      state.items = action.payload; // reemplaza mensajes (cuando cargas de la API)
    },
    clearMessages: (state) => {
      state.items = [];
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { addMessage, setMessages, clearMessages } = messagesSlice.actions;

export default messagesSlice.reducer;
