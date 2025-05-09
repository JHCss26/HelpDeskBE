// src/features/notifications/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axiosInstance';

// Fetch all notifications for current user
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (_, thunkAPI) => {
    const response = await axios.get('/api/notifications');
    return response.data; // array of { _id, message, link, isRead, createdAt, user }
  }
);

// Mark a single notification read
export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, thunkAPI) => {
    console.log('markNotificationRead', id);
    await axios.put(`/api/notifications/${id}/read`);
    return id;
  }
);

// Mark all notifications read
export const markAllRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, thunkAPI) => {
    await axios.put(`/api/notifications/mark-all-read`);
    return;
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],       // full list
    unreadCount: 0,  // number of items where isRead === false
    status: 'idle',  // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    // Add a new notification from socket
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.unreadCount = action.payload.filter(n => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const id = action.payload;
        const note = state.items.find(n => n._id === id);
        if (note && !note.isRead) {
          note.isRead = true;
          state.unreadCount -= 1;
        }
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.items.forEach(n => n.isRead = true);
        state.unreadCount = 0;
      });
  }
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
