import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginUser, registerUser } from "./auth.service";

export const login = createAsyncThunk("auth/login", async (data, thunkAPI) => {
  try {
    const res = await loginUser(data); 
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));
    return res; 
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Login failed");
  }
});

export const signup = createAsyncThunk("auth/signup", async (data, thunkAPI) => {
  try {
    const res = await registerUser(data); 
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Signup failed");
  }
});


// 🔹 Estado inicial
const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,
};

// 🔹 Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // SIGNUP
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
