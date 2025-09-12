// src/features/messages/messagesSlice.js
import { createSlice } from "@reduxjs/toolkit";

const messagesSlice = createSlice({
  name: "messages",
  initialState: {
    items: [], // array of message objects
    loading: false,
    error: null,
  },
  reducers: {
    addMessage: (state, action) => {
      state.items.push(action.payload);
    },
    updateMessage: (state, action) => {
      const { id, updatedFields } = action.payload;
      const index = state.items.findIndex(msg => msg.id === id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...updatedFields };
      }
    },
    deleteMessage: (state, action) => {
      state.items = state.items.filter(msg => msg.id !== action.payload);
    },
    clearMessages: (state) => {
      state.items = [];
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  addMessage,
  updateMessage,
  deleteMessage,
  clearMessages,
  setLoading,
  setError,
} = messagesSlice.actions;

export default messagesSlice.reducer;
