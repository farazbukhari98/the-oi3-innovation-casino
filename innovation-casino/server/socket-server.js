/* eslint-disable @typescript-eslint/no-require-imports */

const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a session room
    socket.on('join_session', (sessionId) => {
      socket.join(`session-${sessionId}`);
      console.log(`Socket ${socket.id} joined session ${sessionId}`);
    });

    // Leave a session room
    socket.on('leave_session', (sessionId) => {
      socket.leave(`session-${sessionId}`);
      console.log(`Socket ${socket.id} left session ${sessionId}`);
    });

    // Broadcast vote submission
    socket.on('submit_vote', ({ sessionId, participantId, totalChips }) => {
      io.to(`session-${sessionId}`).emit('new_vote', {
        participantId,
        totalChips,
        timestamp: Date.now(),
      });
    });

    // Broadcast session status update
    socket.on('session_updated', ({ sessionId, status, action }) => {
      io.to(`session-${sessionId}`).emit('session_updated', {
        status,
        action,
        timestamp: Date.now(),
      });
    });

    // Broadcast participant joined
    socket.on('participant_joined', ({ sessionId, participantCount }) => {
      io.to(`session-${sessionId}`).emit('participant_joined', {
        participantCount,
        timestamp: Date.now(),
      });
    });

    // Timer tick
    socket.on('timer_tick', ({ sessionId, secondsRemaining }) => {
      io.to(`session-${sessionId}`).emit('timer_tick', {
        secondsRemaining,
        timestamp: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.io server running`);
    });
});
