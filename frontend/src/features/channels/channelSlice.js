import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
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
    preferredChannelId: null,
    loadedServerIds: [],
  },
  reducers: {
    setActiveChannel: (state, action) => {
      state.activeChannel = action.payload;
    },
    setPreferredChannelId: (state, action) => {
      state.preferredChannelId = action.payload || null;
    },
    clearChannels: (state) => {
      state.list = [];
      state.activeChannel = null;
      state.preferredChannelId = null;
      state.loadedServerIds = [];
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
        const serverId = action.meta.arg;
        state.list = [
          ...state.list.filter((channel) => channel.server !== serverId),
          ...action.payload,
        ];

        const findChannel = (id) =>
          state.list.find((channel) => channel._id === id) || null;

        let nextActive = null;

        if (state.preferredChannelId) {
          nextActive = findChannel(state.preferredChannelId);
        }

        if (
          !nextActive &&
          state.activeChannel &&
          state.activeChannel.server === serverId
        ) {
          nextActive = findChannel(state.activeChannel._id);
        }

        if (!nextActive && action.payload.length > 0) {
          nextActive = action.payload[0];
        }

        state.activeChannel = nextActive;
        if (!state.loadedServerIds.includes(serverId)) {
          state.loadedServerIds.push(serverId);
        }
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
        if (state.preferredChannelId === action.payload) {
          state.preferredChannelId = null;
        }
      });
  },
});

export const {
  setActiveChannel,
  setPreferredChannelId,
  clearChannels,
} = channelSlice.actions;
export default channelSlice.reducer;

// --- SELECTORS ---
export const selectChannels = (state) => state.channels.list;
export const selectActiveChannel = (state) => state.channels.activeChannel;
export const selectChannelsLoading = (state) => state.channels.loading;
export const selectChannelsError = (state) => state.channels.error;
export const selectLoadedServerIds = (state) => state.channels.loadedServerIds;
export const selectChannelsByServer = createSelector(
  // Input selectors
  (state) => state.channels.list,
  (_, serverId) => serverId,
  // Output
  (channels, serverId) => channels.filter((ch) => ch.server === serverId)
);
