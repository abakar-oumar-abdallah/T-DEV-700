require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
const server = http.createServer(app);

// Configuration Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Middleware CORS pour Express
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Import des routes
const userRoute = require('./routes/user/user.js');
const loginRoute = require('./routes/auth/auth.js');
const teamRoute = require('./routes/team/team.js');
const userTeamRoute = require('./routes/userTeam/userTeam.js');
const clockRoute = require('./routes/clock/clock.js');
const planningRoute = require('./routes/planning/planning.js');
const scheduleRoute = require('./routes/schedule/schedule.js');
const totpRoute = require('./routes/totp/totp.js');

// Import du contrôleur TOTP pour initialiser Socket.IO
const totpController = require('./controllers/totp/TotpController.js');

totpController.setSocketServer(io);

// Configuration des événements Socket.IO
io.on('connection', (socket) => {
  console.log('Nouveau client connecté:', socket.id);

  // Rejoindre une room spécifique à une équipe
  socket.on('join-team', (teamId) => {
    socket.join(`team:${teamId}`);
    console.log(`Client ${socket.id} a rejoint l'équipe ${teamId}`);
  });

  // Quitter une room d'équipe
  socket.on('leave-team', (teamId) => {
    socket.leave(`team:${teamId}`);
    console.log(`Client ${socket.id} a quitté l'équipe ${teamId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Routes
app.use('', teamRoute);
app.use('', clockRoute);
app.use('', userRoute);
app.use('', loginRoute);
app.use('', userTeamRoute);
app.use('', planningRoute);
app.use('', scheduleRoute);
app.use('', totpRoute);

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Serveur démarré et à l'écoute sur le port ${PORT}`);
  console.log(`Socket.IO est prêt sur le port ${PORT}`);
});