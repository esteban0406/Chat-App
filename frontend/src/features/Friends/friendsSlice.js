import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getFriends } from "./friend.service";

export const fetchFriends = createAsyncThunk(
  "friends/fetchFriends",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getFriends();
      if (Array.isArray(res)) return res;
      return [];
    } catch (err) {
      return rejectWithValue(err.message || "Error al cargar amigos");
    }
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
        state.error = action.payload;
      });
  },
});

export default friendsSlice.reducer;
