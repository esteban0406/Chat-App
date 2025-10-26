import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMessages, sendMessage } from "./message.service";

// 🔹 Thunks
export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async (channelId, { rejectWithValue }) => {
    try {
      return await getMessages(channelId);
    } catch (err) {
      return rejectWithValue(err.message || "Error cargando mensajes");
    }
  }
);

export const postMessage = createAsyncThunk(
  "messages/postMessage",
  async (data, { rejectWithValue }) => {
    try {
      return await sendMessage(data);
    } catch (err) {
      return rejectWithValue(err.message || "Error enviando mensaje");
    }
  }
);

// 🔹 Slice
const messagesSlice = createSlice({
  name: "messages",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    addMessage: (state, action) => {
      const exists = state.items.some((m) => m._id === action.payload._id);
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    clearMessages: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMessages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(postMessage.fulfilled, (state, action) => {
        const exists = state.items.some((m) => m._id === action.payload._id);
        if (!exists) {
          state.items.push(action.payload);
        }
      });
  },
});

export const { addMessage, clearMessages } = messagesSlice.actions;
export default messagesSlice.reducer;
