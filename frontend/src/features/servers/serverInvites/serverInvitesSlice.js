import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getServerInvites,
  acceptServerInvite,
  rejectServerInvite,
} from "./serverInvite.service";
import { fetchServers } from "../serverSlice";

export const fetchServerInvites = createAsyncThunk(
  "serverInvites/fetchServerInvites",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getServerInvites();
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.invites)) return res.invites;
      return [];
    } catch (err) {
      return rejectWithValue(err.message || "Error al cargar invitaciones de servidor");
    }
  }
);

export const respondServerInvite = createAsyncThunk(
  "serverInvites/respondServerInvite",
  async ({ id, status }, { rejectWithValue, dispatch }) => {
    try {
      const res =
        status === "accepted"
          ? await acceptServerInvite(id)
          : await rejectServerInvite(id);

      if (status === "accepted") {
        dispatch(fetchServers());
      }

      return { id, status, res };
    } catch (err) {
      return rejectWithValue(err.message || "Error al responder invitación de servidor");
    }
  }
);

const serverInvitesSlice = createSlice({
  name: "serverInvites",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServerInvites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServerInvites.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchServerInvites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(respondServerInvite.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (invite) => (invite.id || invite._id) !== action.payload.id
        );
      })
      .addCase(respondServerInvite.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default serverInvitesSlice.reducer;
