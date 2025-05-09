import Notification from "../models/Notification.js";

export const sendNotification = async (userId, message, link, io) => {
  // Save notification in database
  const notification = await Notification.create({
    user: userId,
    message,
    link,
  });

  // Emit real-time notification to specific user via Socket.IO
  io.to(`user_${userId}`).emit("newNotification", notification);
};

export const handleNotificationSockets = async (io) => {
  io.on("connection", (socket) => {
    socket.on("joinNotifications", (userId) => {
      console.log('🟢 socket joining room user_' + userId);
      socket.join(`user_${userId}`);
    });
  });
};
