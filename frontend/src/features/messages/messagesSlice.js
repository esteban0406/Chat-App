import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMessages, sendMessage } from "./message.service";

// 🔹 Thunks
export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async (channelId, { rejectWithValue }) => {
    try {
      const res = await getMessages(channelId);
      return res?.messages ?? res;
    } catch (err) {
      return rejectWithValue(err.message || "Error cargando mensajes");
    }
  }
);

export const postMessage = createAsyncThunk(
  "messages/postMessage",
  async (data, { rejectWithValue }) => {
    try {
      const res = await sendMessage(data);
      return res?.message ?? res;
    } catch (err) {
      return rejectWithValue(err.message || "Error enviando mensaje");
    }
  }
);

const normalizeMessage = (message) => {
  if (!message) return message;
  const sender =
    typeof message.sender === "object" && message.sender !== null
      ? {
          ...message.sender,
          _id: message.sender._id ?? message.sender.id,
        }
      : message.sender;

  return {
    ...message,
    _id: message._id ?? message.id,
    sender,
  };
};

// 🔹 Slice
const messagesSlice = createSlice({
  name: "messages",
  initialState: {
    items: [],
    loading: false,
    error: null,
    currentChannelId: null,
  },
  reducers: {
    addMessage: (state, action) => {
      const message = normalizeMessage(action.payload);
      if (!message) return;
      const exists = state.items.some((m) => m._id === message._id);
      if (!exists) {
        state.items.push(message);
      }
    },
    clearMessages: (state) => {
      state.items = [];
      state.currentChannelId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMessages
      .addCase(fetchMessages.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentChannelId = action.meta.arg;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        if (state.currentChannelId !== action.meta.arg) {
          return;
        }
        state.loading = false;
        const messages = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.messages ?? [];
        state.items = messages.map(normalizeMessage);
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        if (state.currentChannelId !== action.meta.arg) {
          return;
        }
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(postMessage.fulfilled, (state, action) => {
        const message = normalizeMessage(action.payload);
        const exists = state.items.some((m) => m._id === message?._id);
        if (!exists) {
          state.items.push(message);
        }
      });
  },
});

export const { addMessage, clearMessages } = messagesSlice.actions;
export default messagesSlice.reducer;
