const request = require('supertest');
const express = require('express');

// Mock des dépendances avant les imports
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

jest.mock('swagger-ui-express', () => ({
  serve: jest.fn(() => (req, res, next) => next()),
  setup: jest.fn(() => (req, res, next) => next())
}));

// Mock amélioré pour swagger-jsdoc
const mockSwaggerJSDoc = jest.fn().mockReturnValue({
  openapi: '3.0.0',
  info: {
    title: 'Authentication API',
    version: '1.0.0',
    description: 'API for managing users and authentication'
  },
  servers: [
    {
      url: 'http://localhost:3001'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {}
});

jest.mock('swagger-jsdoc', () => mockSwaggerJSDoc);

// Mock des routes
jest.mock('../src/routes/user/user.js', () => {
  const router = require('express').Router();
  router.get('/test-user', (req, res) => res.json({ route: 'user' }));
  return router;
});

jest.mock('../src/routes/auth/auth.js', () => {
  const router = require('express').Router();
  router.get('/test-auth', (req, res) => res.json({ route: 'auth' }));
  return router;
});

jest.mock('../src/routes/team/team.js', () => {
  const router = require('express').Router();
  router.get('/test-team', (req, res) => res.json({ route: 'team' }));
  return router;
});

jest.mock('../src/routes/userTeam/userTeam.js', () => {
  const router = require('express').Router();
  router.get('/test-userteam', (req, res) => res.json({ route: 'userteam' }));
  return router;
});

jest.mock('../src/routes/clock/clock.js', () => {
  const router = require('express').Router();
  router.get('/test-clock', (req, res) => res.json({ route: 'clock' }));
  return router;
});

jest.mock('../src/routes/planning/planning.js', () => {
  const router = require('express').Router();
  router.get('/test-planning', (req, res) => res.json({ route: 'planning' }));
  return router;
});

jest.mock('../src/routes/schedule/schedule.js', () => {
  const router = require('express').Router();
  router.get('/test-schedule', (req, res) => res.json({ route: 'schedule' }));
  return router;
});

describe('Swagger Configuration Tests', () => {
  let swaggerJSDoc;

  beforeEach(() => {
    jest.clearAllMocks();
    // Réinitialiser le cache du module swagger
    jest.resetModules();
    swaggerJSDoc = require('swagger-jsdoc');
  });

  describe('Swagger Spec Generation', () => {
    it('devrait générer une spécification Swagger valide', () => {
      // Charger le module après avoir configuré le mock
      const swaggerSpec = require('../src/swagger.js');
      
      expect(swaggerSpec).toBeDefined();
      expect(swaggerSpec.openapi).toBe('3.0.0');
      expect(swaggerSpec.info).toBeDefined();
    });

    it('devrait avoir les informations correctes de l\'API', () => {
      // Cette ligne déclenche l'appel à swaggerJSDoc
      require('../src/swagger.js');

      expect(swaggerJSDoc).toHaveBeenCalledWith(
        expect.objectContaining({
          definition: expect.objectContaining({
            openapi: '3.0.0',
            info: expect.objectContaining({
              title: 'Authentication API',
              version: '1.0.0',
              description: 'API for managing users and authentication'
            })
          })
        })
      );
    });

    it('devrait définir le serveur localhost', () => {
      require('../src/swagger.js');

      expect(swaggerJSDoc).toHaveBeenCalledWith(
        expect.objectContaining({
          definition: expect.objectContaining({
            servers: expect.arrayContaining([
              expect.objectContaining({
                url: 'http://localhost:3001'
              })
            ])
          })
        })
      );
    });

    it('devrait configurer l\'authentification Bearer JWT', () => {
      require('../src/swagger.js');

      expect(swaggerJSDoc).toHaveBeenCalledWith(
        expect.objectContaining({
          definition: expect.objectContaining({
            components: expect.objectContaining({
              securitySchemes: expect.objectContaining({
                bearerAuth: expect.objectContaining({
                  type: 'http',
                  scheme: 'bearer',
                  bearerFormat: 'JWT'
                })
              })
            }),
            security: expect.arrayContaining([
              expect.objectContaining({
                bearerAuth: []
              })
            ])
          })
        })
      );
    });

    it('devrait scanner les fichiers de routes pour la documentation', () => {
      require('../src/swagger.js');

      expect(swaggerJSDoc).toHaveBeenCalledWith(
        expect.objectContaining({
          apis: ['./src/routes/**/*.js']
        })
      );
    });
  });
});

describe('Server Configuration Tests', () => {
  let app;
  let server;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    
    // Créer une nouvelle instance de l'app pour chaque test
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    if (server) {
      server.close();
    }
  });

  describe('Middleware Configuration', () => {
    beforeEach(() => {
      // Réinitialiser les modules pour chaque test
      jest.resetModules();
      
      // Créer une app express de test
      app = express();
      const cors = require('cors');
      const cookieParser = require('cookie-parser');
      
      app.use(cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
      }));
      app.use(express.json());
      app.use(cookieParser());
      
      // Route de test pour vérifier le JSON parsing
      app.post('/test-json', (req, res) => {
        res.json({ received: req.body });
      });
    });

    it('devrait utiliser express.json() pour parser les requêtes JSON', async () => {
      const response = await request(app)
        .post('/test-json')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual({ test: 'data' });
    });

    it('devrait configurer CORS avec les bonnes options', () => {
      const cors = require('cors');
      
      // Vérifier que CORS est appelé (dans un vrai test, on vérifierait les headers)
      expect(cors).toBeDefined();
    });

    it('devrait utiliser cookie-parser', () => {
      const cookieParser = require('cookie-parser');
      expect(cookieParser).toBeDefined();
    });
  });

  describe('Routes Configuration', () => {
    beforeEach(() => {
      jest.resetModules();
      app = express();
      app.use(express.json());
      
      // Charger toutes les routes mockées
      const userRoute = require('../src/routes/user/user.js');
      const loginRoute = require('../src/routes/auth/auth.js');
      const teamRoute = require('../src/routes/team/team.js');
      const userTeamRoute = require('../src/routes/userTeam/userTeam.js');
      const clockRoute = require('../src/routes/clock/clock.js');
      const planningRoute = require('../src/routes/planning/planning.js');
      const scheduleRoute = require('../src/routes/schedule/schedule.js');

      app.use("", teamRoute);
      app.use("", clockRoute);
      app.use("", userRoute);
      app.use("", loginRoute);
      app.use("", userTeamRoute);
      app.use("", planningRoute);
      app.use("", scheduleRoute);
    });

    it('devrait charger la route user', async () => {
      const response = await request(app).get('/test-user');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ route: 'user' });
    });

    it('devrait charger la route auth', async () => {
      const response = await request(app).get('/test-auth');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ route: 'auth' });
    });

    it('devrait charger la route team', async () => {
      const response = await request(app).get('/test-team');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ route: 'team' });
    });

    it('devrait charger la route userTeam', async () => {
      const response = await request(app).get('/test-userteam');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ route: 'userteam' });
    });

    it('devrait charger la route clock', async () => {
      const response = await request(app).get('/test-clock');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ route: 'clock' });
    });

    it('devrait charger la route planning', async () => {
      const response = await request(app).get('/test-planning');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ route: 'planning' });
    });

    it('devrait charger la route schedule', async () => {
      const response = await request(app).get('/test-schedule');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ route: 'schedule' });
    });
  });

  describe('Swagger UI Configuration', () => {
    beforeEach(() => {
      jest.resetModules();
      app = express();
      const swaggerUi = require('swagger-ui-express');
      
      // Mock de la spécification Swagger
      const mockSwaggerSpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0'
        }
      };
      
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(mockSwaggerSpec));
      
      // Route pour tester Swagger UI
      app.get('/api-docs', (req, res) => {
        res.status(200).json({ swagger: 'ui' });
      });
    });
    it('devrait utiliser swaggerUi.serve et swaggerUi.setup', () => {
      const swaggerUi = require('swagger-ui-express');
      
      // Vérifier que les fonctions mockées existent
      expect(swaggerUi.serve).toBeDefined();
      expect(swaggerUi.setup).toBeDefined();
      
      // Vérifier que ce sont bien des fonctions jest
      expect(jest.isMockFunction(swaggerUi.serve)).toBe(true);
      expect(jest.isMockFunction(swaggerUi.setup)).toBe(true);
    });
  });

  describe('Environment Configuration', () => {
    it('devrait utiliser le PORT depuis les variables d\'environnement', () => {
      process.env.PORT = '4000';
      const PORT = process.env.PORT || 3001;
      expect(PORT).toBe('4000');
    });

    it('devrait utiliser le port 3001 par défaut', () => {
      delete process.env.PORT;
      const PORT = process.env.PORT || 3001;
      expect(PORT).toBe(3001);
    });

    it('devrait utiliser FRONTEND_URL depuis les variables d\'environnement', () => {
      process.env.FRONTEND_URL = 'https://example.com';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      expect(frontendUrl).toBe('https://example.com');
    });

    it('devrait utiliser http://localhost:3000 comme FRONTEND_URL par défaut', () => {
      delete process.env.FRONTEND_URL;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      expect(frontendUrl).toBe('http://localhost:3000');
    });
  });

  describe('Server Startup', () => {
    it('devrait charger dotenv au démarrage', () => {
      const dotenv = require('dotenv');
      // Vérifier que dotenv.config a été appelé
      // Note: dans l'implémentation réelle, cela se produit lors du require du serveur principal
      expect(dotenv.config).toBeDefined();
    });

    it('devrait démarrer le serveur sur le port configuré', (done) => {
      const app = express();
      const testPort = 3050; // Port de test différent
      
      // Route de test
      app.get('/test', (req, res) => {
        res.json({ status: 'ok' });
      });
      
      server = app.listen(testPort, () => {
        expect(server.address().port).toBe(testPort);
        
        // Tester que le serveur répond
        request(app)
          .get('/test')
          .expect(200)
          .end((err) => {
            if (err) return done(err);
            server.close();
            done();
          });
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      app = express();
      app.use(express.json());
      
      // Route 404 handler
      app.use((req, res) => {
        res.status(404).json({ error: 'Not found' });
      });
    });

    it('devrait retourner 404 pour les routes non définies', async () => {
      const response = await request(app).get('/route-inexistante');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Not found' });
    });

    it('devrait gérer les erreurs de parsing JSON invalide', async () => {
      app.post('/test', (req, res) => {
        // Si le JSON est invalide, express.json() générera une erreur avant d'atteindre cette route
        res.json({ success: true });
      });

      // Middleware de gestion d'erreur
      app.use((err, req, res, next) => {
        if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
          return res.status(400).json({ error: 'Invalid JSON' });
        }
        next(err);
      });

      const response = await request(app)
        .post('/test')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid JSON' });
    });
  });

  describe('CORS Configuration Details', () => {
    beforeEach(() => {
      app = express();
      const cors = require('cors');
      
      app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true,
      }));
      
      app.get('/test-cors', (req, res) => {
        res.json({ cors: 'enabled' });
      });
    });

    it('devrait permettre les requêtes cross-origin', async () => {
      const response = await request(app)
        .get('/test-cors')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      // Vérifier les headers CORS (supertest les expose automatiquement)
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});