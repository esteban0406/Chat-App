import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getServers, deleteServer, createServer } from "../../services/api";

// --- THUNKS ---
export const fetchServers = createAsyncThunk(
  "servers/fetchServers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getServers();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error cargando servidores");
    }
  }
);

export const addServer = createAsyncThunk(
  "servers/addServer",
  async (serverData, { rejectWithValue }) => {
    try {
      const res = await createServer(serverData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error creando servidor");
    }
  }
);


export const removeServer = createAsyncThunk(
  "servers/removeServer",
  async (serverId, { rejectWithValue }) => {
    try {
      await deleteServer(serverId);
      return serverId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error eliminando servidor");
    }
  }
);

// --- SLICE ---
const serverSlice = createSlice({
  name: "servers",
  initialState: {
    list: [],
    activeServer: null,
    loading: false,
    error: null,
  },
  reducers: {
    setActiveServer: (state, action) => {
      state.activeServer = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchServers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addServer.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(removeServer.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s._id !== action.payload);
        if (state.activeServer?._id === action.payload) {
          state.activeServer = null;
        }
      });
  },
});

export const { setActiveServer } = serverSlice.actions;
export default serverSlice.reducer;

// --- SELECTORS ---
export const selectServers = (state) => state.servers.list;
export const selectActiveServer = (state) => state.servers.activeServer;
export const selectServersLoading = (state) => state.servers.loading;
export const selectServersError = (state) => state.servers.error;
