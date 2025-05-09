// sockets/ticket.socket.js
let io;

const handleSocketConnection = (serverIO) => {
  io = serverIO;

  io.on('connection', (socket) => {
    console.log('🟢 New client connected:', socket.id);

    // Join Rooms for Tickets (optional)
    socket.on('joinTicketRoom', (ticketId) => {
      socket.join(ticketId);
      console.log(`Socket ${socket.id} joined room: ${ticketId}`);
    });

    
    socket.on('disconnect', () => {
      console.log('🔴 Client disconnected:', socket.id);
    });
  });
};

// Emit function (for external use)
const emitTicketUpdate = (ticketId, updateData) => {
  if (io) {
    io.to(ticketId).emit('ticketUpdated', updateData);
  }
};

// Emit comment updates
const emitCommentUpdate = (ticketId, commentData) => {
  if (io) {
    io.to(ticketId).emit('newComment', commentData);
  }
};


module.exports = { handleSocketConnection, emitTicketUpdate, emitCommentUpdate };
