let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join a negotiation room
    socket.on('join_negotiation', (negotiationId) => {
      socket.join(`negotiation_${negotiationId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined room negotiation_${negotiationId}`);
    });

    // Leave a negotiation room
    socket.on('leave_negotiation', (negotiationId) => {
      socket.leave(`negotiation_${negotiationId}`);
      console.log(`[Socket.IO] Socket ${socket.id} left room negotiation_${negotiationId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

export const getIO = () => ioInstance;

export const emitToNegotiation = (negotiationId, eventName, data) => {
  if (ioInstance) {
    ioInstance.to(`negotiation_${negotiationId}`).emit(eventName, data);
  }
};
