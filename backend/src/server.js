require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const userRoute = require('./routes/user/user.js');
const loginRoute = require('./routes/auth/auth.js');
const teamRoute = require('./routes/team/team.js');
const userTeamRoute = require('./routes/userTeam/userTeam.js');
const clockRoute = require('./routes/clock/clock.js');
const planningRoute = require('./routes/planning/planning.js');
const scheduleRoute = require('./routes/schedule/schedule.js');

app.use('', teamRoute);
app.use('', clockRoute);
app.use('', userRoute);
app.use('', loginRoute);
app.use('', userTeamRoute);
app.use('', planningRoute);
app.use('', scheduleRoute);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur démarré et à l'écoute sur le port ${PORT}`);
});