// src/features/invites/invitesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getFriendInvites,
  getServerInvites,
  acceptFriendInvite,
  rejectFriendInvite,
  acceptServerInvite,
  rejectServerInvite,
} from "./invite.service";

// Fetch both friend + server invites
export const fetchInvites = createAsyncThunk("invites/fetchInvites", async () => {
  const [friendRes, serverRes] = await Promise.all([
    getFriendInvites(),
    getServerInvites(),
  ]);

  return [
    ...friendRes.data.map((i) => ({ ...i, type: "friend" })),
    ...serverRes.data.map((i) => ({ ...i, type: "server" })),
  ];
});

// Accept / Reject invite
export const respondInvite = createAsyncThunk(
  "invites/respondInvite",
  async ({ id, status, type }) => {
    if (type === "friend") {
      if (status === "accepted") await acceptFriendInvite(id);
      else await rejectFriendInvite(id);
    } else if (type === "server") {
      if (status === "accepted") await acceptServerInvite(id);
      else await rejectServerInvite(id);
    }
    return { id, status, type };
  }
);

const invitesSlice = createSlice({
  name: "invites",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearInvites: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvites.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInvites.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInvites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(respondInvite.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i._id !== action.payload.id);
      });
  },
});

export const { clearInvites } = invitesSlice.actions;
export default invitesSlice.reducer;
