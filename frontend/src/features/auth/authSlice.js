import { createSlice } from '@reduxjs/toolkit';

const stored = JSON.parse(localStorage.getItem('user')) || {};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: stored.user || null,
    token: stored.token || null,
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('user');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
