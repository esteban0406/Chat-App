import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getInvites, respondToInvite } from "./invite.service";

export const fetchInvites = createAsyncThunk(
  "invites/fetchInvites",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getInvites();
      if (Array.isArray(res)) return res;
      return [];
    } catch (err) {
      return rejectWithValue(err.message || "Error al cargar invitaciones");
    }
  }
);

export const respondInvite = createAsyncThunk(
  "invites/respondInvite",
  async ({ id, status, type }, { rejectWithValue }) => {
    try {
      const res = await respondToInvite(id, status, type);
      return { id, status, type, res };
    } catch (err) {
      return rejectWithValue(err.message || "Error al responder invitación");
    }
  }
);

const invitesSlice = createSlice({
  name: "invites",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvites.pending, (state) => {
        state.loading = true;
        state.error = null; 
      })
      .addCase(fetchInvites.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInvites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(respondInvite.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i._id !== action.payload.id);
      })
      .addCase(respondInvite.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default invitesSlice.reducer;
