let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join user channel
    socket.on('join', ({ userId, perfil }) => {
      if (userId) socket.join(`user_${userId}`);
      if (perfil) socket.join(`role_${perfil}`);
      // Central room for operators and supervisors
      if (['operador', 'supervisor', 'administrador'].includes(perfil)) {
        socket.join('central_dispatch');
      }
    });

    socket.on('join_occurrence', (occurrenceId) => {
      socket.join(`occurrence_${occurrenceId}`);
    });

    socket.on('leave_occurrence', (occurrenceId) => {
      socket.leave(`occurrence_${occurrenceId}`);
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  return ioInstance;
};

const emitToAll = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};

const emitToCentral = (event, data) => {
  if (ioInstance) {
    ioInstance.to('central_dispatch').emit(event, data);
  }
};

const emitToOccurrence = (occurrenceId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`occurrence_${occurrenceId}`).emit(event, data);
    ioInstance.to('central_dispatch').emit(event, data);
  }
};

const emitToRole = (role, event, data) => {
  if (ioInstance) {
    ioInstance.to(`role_${role}`).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToAll,
  emitToCentral,
  emitToOccurrence,
  emitToRole,
  emitToUser,
};
