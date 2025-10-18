import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getFriendInvites,
  acceptFriendInvite,
  rejectFriendInvite,
} from "./friend.service";

export const fetchFriendInvites = createAsyncThunk(
  "friendInvites/fetchFriendInvites",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getFriendInvites();
      if (Array.isArray(res)) return res;
      return [];
    } catch (err) {
      return rejectWithValue(err.message || "Error al cargar invitaciones de amistad");
    }
  }
);

// ✅ Responder invitación
export const respondFriendInvite = createAsyncThunk(
  "friendInvites/respondFriendInvite",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res =
        status === "accepted"
          ? await acceptFriendInvite(id)
          : await rejectFriendInvite(id);

      return { id, status, res };
    } catch (err) {
      return rejectWithValue(err.message || "Error al responder invitación");
    }
  }
);

const friendInvitesSlice = createSlice({
  name: "friendInvites",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchFriendInvites
      .addCase(fetchFriendInvites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriendInvites.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFriendInvites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // respondFriendInvite
      .addCase(respondFriendInvite.fulfilled, (state, action) => {
        // Eliminar la invitación de la lista
        state.items = state.items.filter((i) => i._id !== action.payload.id);
      })
      .addCase(respondFriendInvite.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default friendInvitesSlice.reducer;
