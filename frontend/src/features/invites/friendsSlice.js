import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getFriends } from "./invite.service";

export const fetchFriends = createAsyncThunk(
  "friends/fetchFriends",
  async () => {
    const res = await getFriends();
    if (Array.isArray(res)) return res;
    return [];
  }
);

const friendsSlice = createSlice({
  name: "friends",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFriends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default friendsSlice.reducer;
