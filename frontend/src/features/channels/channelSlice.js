import { createSlice, createAsyncThunk,createSelector  } from "@reduxjs/toolkit";
import { getChannels, deleteChannel, createChannel } from "./channel.service";

// --- THUNKS ---
export const fetchChannels = createAsyncThunk(
  "channels/fetchChannels",
  async (serverId, { rejectWithValue }) => {
    try {
      const res = await getChannels(serverId); // res = canales directamente
      return res;
    } catch (err) {
      console.error("❌ Error fetchChannels:", err);
      return rejectWithValue(err.message || "Error cargando canales");
    }
  }
);

export const addChannel = createAsyncThunk(
  "channels/addChannel",
  async ({ name, type, serverId }, { rejectWithValue }) => {
    try {
      const res = await createChannel({ name, type, serverId }); // res = canal creado
      return res;
    } catch (err) {
      console.error("❌ Error addChannel:", err);
      return rejectWithValue(err.message || "Error creando canal");
    }
  }
);

export const removeChannel = createAsyncThunk(
  "channels/removeChannel",
  async (channelId, { rejectWithValue }) => {
    try {
      await deleteChannel(channelId); // no devuelve nada
      return channelId;
    } catch (err) {
      console.error("❌ Error removeChannel:", err);
      return rejectWithValue(err.message || "Error eliminando canal");
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
export const selectChannelsByServer = createSelector(
  // Input selectors
  (state) => state.channels.list,
  (_, serverId) => serverId,
  // Output
  (channels, serverId) => channels.filter((ch) => ch.server === serverId)
);

