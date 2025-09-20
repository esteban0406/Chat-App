import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getFriendInvites,
  getServerInvites,
  acceptFriendInvite,
  rejectFriendInvite,
} from "../../services/api";

// 🔹 Fetch all invites (friends + servers)
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

// 🔹 Respond to an invite
export const respondInvite = createAsyncThunk(
  "invites/respondInvite",
  async ({ id, status, type }) => {
    if (type === "friend") {
      if (status === "accepted") {
        await acceptFriendInvite(id);
      } else {
        await rejectFriendInvite(id);
      }
    } 
    return { id, status, type };
  }
);

const inviteSlice = createSlice({
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
      // fetchInvites
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

      // respondInvite
      .addCase(respondInvite.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i._id !== action.payload.id);
      });
  },
});

export const { clearInvites } = inviteSlice.actions;
export default inviteSlice.reducer;
