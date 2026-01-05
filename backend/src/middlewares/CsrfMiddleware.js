const crypto = require('crypto');

/**
 * Middleware de protection CSRF utilisant le pattern "Double Submit Cookie"
 *
 * Fonctionnement:
 * 1. Un token CSRF est généré et envoyé dans un cookie
 * 2. Le client doit renvoyer ce token dans le header X-CSRF-Token
 * 3. Le serveur compare les deux tokens pour valider la requête
 *
 * Protection contre:
 * - Les attaques CSRF où un site malveillant tente d'exécuter des actions
 *   au nom de l'utilisateur connecté
 */

// Génère un token CSRF aléatoire
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware pour générer et envoyer un token CSRF
 * À utiliser sur les routes GET qui affichent des formulaires
 */
function csrfTokenGenerator(req, res, next) {
  // Génère un nouveau token CSRF
  const csrfToken = generateCsrfToken();

  // Stocke le token dans un cookie sécurisé
  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false, // Le client doit pouvoir lire ce cookie
    secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en production
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 3600000 // 1 heure
  });

  // Ajoute le token à la réponse pour que le client puisse l'utiliser
  res.locals.csrfToken = csrfToken;

  next();
}

/**
 * Middleware pour vérifier le token CSRF
 * À utiliser sur toutes les routes POST, PUT, DELETE, PATCH
 */
function csrfProtection(req, res, next) {
  // Les méthodes GET, HEAD, OPTIONS ne nécessitent pas de protection CSRF
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Récupère le token du cookie
  const cookieToken = req.cookies['XSRF-TOKEN'];

  // Récupère le token du header (envoyé par le client)
  const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

  // Vérifie que les deux tokens existent
  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing',
      error: 'CSRF_TOKEN_MISSING'
    });
  }

  // Vérifie que les tokens correspondent
  if (cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
      error: 'CSRF_TOKEN_INVALID'
    });
  }

  // Token valide, continue
  next();
}

/**
 * Route pour obtenir un token CSRF
 * Le frontend peut appeler cette route pour obtenir un token
 */
function getCsrfToken(req, res) {
  const csrfToken = generateCsrfToken();

  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 3600000
  });

  res.json({
    success: true,
    csrfToken: csrfToken
  });
}

module.exports = {
  csrfTokenGenerator,
  csrfProtection,
  getCsrfToken
};
