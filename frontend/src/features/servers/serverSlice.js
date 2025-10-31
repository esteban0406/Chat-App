import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getServers,
  deleteServer,
  createServer,
  removeMember as removeMemberApi,
} from "./server.service";

export const fetchServers = createAsyncThunk(
  "servers/fetchServers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getServers();
      return res?.servers ?? res;
    } catch (err) {
      console.error("❌ Error fetchServers:", err);
      return rejectWithValue(err.message || "Error cargando servidores");
    }
  }
);

export const addServer = createAsyncThunk(
  "servers/addServer",
  async (serverData, { rejectWithValue }) => {
    try {
      const res = await createServer(serverData);
      return res?.server ?? res;
    } catch (err) {
      console.error("❌ Error addServer:", err);
      return rejectWithValue(err.message || "Error creando servidor");
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
      console.error("❌ Error removeServer:", err);
      return rejectWithValue(err.message || "Error eliminando servidor");
    }
  }
);

export const removeMember = createAsyncThunk(
  "servers/removeMember",
  async ({ serverId, memberId }, { rejectWithValue }) => {
    try {
      const res = await removeMemberApi(serverId, memberId);
      return res?.server ?? res;
    } catch (err) {
      console.error("❌ Error removeMember:", err);
      return rejectWithValue(err.message || "Error eliminando miembro");
    }
  }
);

const normalizeServer = (server) => {
  if (!server) return server;
  const normalizedChannels = Array.isArray(server.channels)
    ? server.channels.map((channel) =>
        typeof channel === "object" && channel !== null
          ? { ...channel, _id: channel._id ?? channel.id }
          : { _id: channel, id: channel }
      )
    : server.channels;

  const normalizedMembers = Array.isArray(server.members)
    ? server.members.map((member) =>
        typeof member === "object" && member !== null
          ? { ...member, _id: member._id ?? member.id }
          : { _id: member, id: member }
      )
    : server.members;

  return {
    ...server,
    _id: server._id ?? server.id,
    channels: normalizedChannels,
    members: normalizedMembers,
  };
};

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
      state.activeServer = normalizeServer(action.payload);
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
        const servers = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.servers ?? [];
        state.list = servers.map(normalizeServer);
      })
      .addCase(fetchServers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addServer.fulfilled, (state, action) => {
        const server = normalizeServer(action.payload);
        if (server) {
          state.list.push(server);
        }
      })
      .addCase(removeServer.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s._id !== action.payload);
        if (state.activeServer?._id === action.payload) {
          state.activeServer = null;
        }
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        const updatedServer = normalizeServer(action.payload);
        const index = state.list.findIndex(
          (s) => s._id === updatedServer?._id
        );
        if (index !== -1) {
          state.list[index] = updatedServer;
        }
        if (state.activeServer?._id === updatedServer?._id) {
          state.activeServer = updatedServer;
        }
      });
  },
});

export const { setActiveServer } = serverSlice.actions;
export default serverSlice.reducer;

export const selectServers = (state) => state.servers.list;
export const selectActiveServer = (state) => state.servers.activeServer;
export const selectServersLoading = (state) => state.servers.loading;
export const selectServersError = (state) => state.servers.error;
