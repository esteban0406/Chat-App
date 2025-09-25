import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getChannels, deleteChannel, createChannel } from "../../services/api";

// --- THUNKS ---
export const fetchChannels = createAsyncThunk(
  "channels/fetchChannels",
  async (serverId, { rejectWithValue }) => {
    try {
      const res = await getChannels(serverId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error cargando canales");
    }
  }
);

export const addChannel = createAsyncThunk(
  "channels/addChannel",
  async ({ name, type, serverId }, { rejectWithValue }) => {
    try {
      // 👈 ahora enviamos el body como lo espera el backend
      const res = await createChannel({ name, type, serverId });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error creando canal");
    }
  }
);

export const removeChannel = createAsyncThunk(
  "channels/removeChannel",
  async (channelId, { rejectWithValue }) => {
    try {
      await deleteChannel(channelId);
      return channelId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error eliminando canal");
    }
  }
);

// --- SLICE ---
const channelSlice = createSlice({
  name: "channels",
  initialState: {
    list: [],
    activeChannel: null,
    loading: false,
    error: null,
  },
  reducers: {
    setActiveChannel: (state, action) => {
      state.activeChannel = action.payload;
    },
    clearChannels: (state) => {
      state.list = [];
      state.activeChannel = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChannels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        state.activeChannel = action.payload.length > 0 ? action.payload[0] : null;
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addChannel.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(removeChannel.fulfilled, (state, action) => {
        state.list = state.list.filter((ch) => ch._id !== action.payload);
        if (state.activeChannel?._id === action.payload) {
          state.activeChannel = null;
        }
      });
  },
});

export const { setActiveChannel, clearChannels } = channelSlice.actions;
export default channelSlice.reducer;

// --- SELECTORS ---
export const selectChannels = (state) => state.channels.list;
export const selectActiveChannel = (state) => state.channels.activeChannel;
export const selectChannelsLoading = (state) => state.channels.loading;
export const selectChannelsError = (state) => state.channels.error;
