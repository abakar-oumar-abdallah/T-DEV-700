# Documentation de Sécurité

Ce document décrit toutes les mesures de sécurité implémentées dans l'application pour protéger contre les attaques CSRF et XSS, ainsi que d'autres vulnérabilités courantes.

## Table des matières

1. [Protection CSRF](#protection-csrf)
2. [Protection XSS](#protection-xss)
3. [Gestion Sécurisée des Sessions](#gestion-sécurisée-des-sessions)
4. [Autres Protections](#autres-protections)
5. [Guide d'utilisation](#guide-dutilisation)

---

## Protection CSRF

### Description

La protection CSRF (Cross-Site Request Forgery) empêche les sites malveillants d'exécuter des actions non autorisées au nom d'utilisateurs authentifiés.

### Implémentation

**Pattern utilisé:** Double Submit Cookie

**Fichiers concernés:**
- `backend/src/middlewares/CsrfMiddleware.js`
- `backend/src/routes/auth/auth.js`

### Comment ça fonctionne

1. **Obtention du token:**
   ```javascript
   GET /csrf-token
   ```
   Cette route génère un token CSRF unique et le stocke dans un cookie `XSRF-TOKEN`.

2. **Utilisation du token:**
   Le client doit inclure le token CSRF dans le header `X-CSRF-Token` pour toutes les requêtes POST, PUT, DELETE, PATCH.

   ```javascript
   fetch('/login', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'X-CSRF-Token': getCsrfTokenFromCookie() // Token du cookie XSRF-TOKEN
     },
     credentials: 'include',
     body: JSON.stringify({ email, password })
   });
   ```

3. **Validation:**
   Le middleware `csrfProtection` compare le token du cookie avec celui du header. Si les tokens ne correspondent pas, la requête est rejetée avec un statut 403.

### Routes protégées

- `POST /login` - Connexion utilisateur
- `POST /logout` - Déconnexion utilisateur
- Toutes les autres routes POST/PUT/DELETE/PATCH peuvent être protégées en ajoutant le middleware `csrfProtection`

### Configuration

```javascript
// Dans vos routes
const { csrfProtection } = require('./middlewares/CsrfMiddleware');

router.post('/votre-route', csrfProtection, votreController);
```

---

## Protection XSS

### Description

La protection XSS (Cross-Site Scripting) empêche l'injection de scripts malveillants dans l'application.

### Implémentations multiples

#### 1. Helmet.js (Content Security Policy)

**Fichier:** `backend/src/server.js`

Helmet configure automatiquement plusieurs headers HTTP de sécurité, notamment:
- `Content-Security-Policy`: Restreint les sources de contenu autorisées
- `X-Content-Type-Options`: Empêche le MIME sniffing
- `X-Frame-Options`: Protection contre le clickjacking
- `X-XSS-Protection`: Active les protections XSS du navigateur

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

#### 2. Sanitization des inputs

**Fichier:** `backend/src/middlewares/InputSanitizer.js`

Tous les inputs utilisateur sont automatiquement sanitisés pour supprimer ou échapper les caractères dangereux.

**Fonctionnalités:**
- Suppression des tags HTML
- Échappement des caractères spéciaux (`<`, `>`, `"`, `'`, `&`, `/`)
- Validation et sanitization des emails
- Validation et sanitization des champs texte

**Exemple d'utilisation:**

```javascript
const { validateAndSanitizeEmail, validateAndSanitizeText } = require('./middlewares/InputSanitizer');

// Valider et nettoyer un email
const emailValidation = validateAndSanitizeEmail(userInput);
if (!emailValidation.valid) {
  return res.status(400).json({ error: emailValidation.error });
}
const cleanEmail = emailValidation.sanitized;

// Valider et nettoyer du texte
const textValidation = validateAndSanitizeText(userInput, {
  minLength: 3,
  maxLength: 100,
  allowHtml: false
});
```

#### 3. NoSQL Injection Protection

**Package:** `express-mongo-sanitize`

Empêche les injections NoSQL en supprimant les opérateurs MongoDB des inputs utilisateur.

```javascript
app.use(mongoSanitize());
```

---

## Gestion Sécurisée des Sessions

### JWT stockés dans des cookies httpOnly

**Fichiers concernés:**
- `backend/src/controllers/auth/AuthController.js` (lignes 80-85)
- `backend/src/middlewares/AuthMiddleware.js` (lignes 8-15)

### Configuration des cookies

Les tokens JWT sont stockés dans des cookies sécurisés avec les attributs suivants:

```javascript
res.cookie('jwt', token, {
  httpOnly: true,    // Le cookie ne peut pas être accédé par JavaScript
  secure: true,      // HTTPS uniquement (en production)
  sameSite: 'strict', // Protection CSRF supplémentaire
  maxAge: 24 * 60 * 60 * 1000 // 24 heures
});
```

### Avantages de cette approche

1. **Protection XSS:** Le cookie `httpOnly` ne peut pas être lu par JavaScript malveillant
2. **Protection CSRF:** L'attribut `sameSite: 'strict'` empêche l'envoi du cookie sur des requêtes cross-site
3. **HTTPS uniquement:** L'attribut `secure` garantit que le cookie n'est transmis que sur HTTPS en production
4. **Expiration automatique:** Le cookie expire après 24 heures

### Fonctionnement

1. **Login:**
   - Le serveur génère un JWT et le stocke dans un cookie sécurisé
   - Le token est aussi renvoyé dans le body pour compatibilité

2. **Authentification:**
   - Le middleware `AuthMiddleware` lit d'abord le cookie `jwt`
   - Si absent, il vérifie le header `Authorization` (fallback)

3. **Logout:**
   - Le cookie est supprimé côté serveur
   - Le client doit supprimer toute référence au token

---

## Autres Protections

### 1. Rate Limiting

**Fichier:** `backend/src/middlewares/RateLimiters.js`

Protection contre les attaques par force brute.

**Configuration:**
- Limite générale: 100 requêtes par IP toutes les 15 minutes
- Limite login: 5 tentatives de connexion toutes les 15 minutes

```javascript
// Appliqué sur toutes les routes
app.use('/api/', limiter);

// Appliqué spécifiquement sur /login
router.post('/login', authLimiter, ...);
```

### 2. HTTP Parameter Pollution (HPP)

**Package:** `hpp`

Empêche les attaques par pollution de paramètres HTTP.

```javascript
app.use(hpp());
```

### 3. Limitation de la taille des requêtes

```javascript
app.use(express.json({ limit: '10kb' }));
```

Limite la taille du body JSON à 10KB pour prévenir les attaques DoS.

### 4. CORS Configuration

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

Autorise uniquement le frontend configuré à accéder à l'API.

---

## Guide d'utilisation

### Pour le Frontend

#### 1. Obtenir un token CSRF

```javascript
// Au chargement de l'application ou avant un formulaire
async function getCsrfToken() {
  const response = await fetch('http://localhost:3001/csrf-token', {
    credentials: 'include'
  });
  const data = await response.json();
  return data.csrfToken;
}
```

#### 2. Utiliser le token CSRF dans les requêtes

```javascript
async function login(email, password) {
  // Récupérer le token CSRF du cookie
  const csrfToken = getCookie('XSRF-TOKEN');

  const response = await fetch('http://localhost:3001/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    credentials: 'include', // Important pour envoyer les cookies
    body: JSON.stringify({ email, password })
  });

  return response.json();
}

// Helper pour lire un cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
```

#### 3. Gérer l'authentification avec cookies

```javascript
// Le JWT est automatiquement envoyé dans les cookies
async function fetchProtectedData() {
  const csrfToken = getCookie('XSRF-TOKEN');

  const response = await fetch('http://localhost:3001/api/protected', {
    method: 'GET',
    headers: {
      'X-CSRF-Token': csrfToken // Si nécessaire
    },
    credentials: 'include' // Important pour envoyer les cookies JWT
  });

  return response.json();
}
```

### Pour le Backend

#### 1. Protéger une route avec CSRF

```javascript
const { csrfProtection } = require('./middlewares/CsrfMiddleware');

router.post('/votre-route', csrfProtection, votreController);
```

#### 2. Sanitiser les inputs manuellement

```javascript
const { validateAndSanitizeEmail, validateAndSanitizeText } = require('./middlewares/InputSanitizer');

// Dans votre contrôleur
const emailValidation = validateAndSanitizeEmail(req.body.email);
if (!emailValidation.valid) {
  return res.status(400).json({ error: emailValidation.error });
}

const cleanEmail = emailValidation.sanitized;
```

#### 3. Appliquer le rate limiting

```javascript
const { authLimiter } = require('./middlewares/RateLimiters');

router.post('/sensitive-route', authLimiter, votreController);
```

---

## Protection des Routes par Authentification

Toutes les routes de l'API sont maintenant protégées par des middlewares d'authentification et d'autorisation appropriés:

### Routes Publiques (sans authentification)
- `GET /csrf-token` - Obtenir un token CSRF
- `POST /login` - Connexion (protégée par CSRF)
- `POST /logout` - Déconnexion (protégée par CSRF)

### Routes Protégées par Authentification

#### Routes Superadmin uniquement
- `GET /users` - Liste de tous les utilisateurs
- `GET /teams` - Liste de toutes les équipes
- `GET /userteams` - Liste de toutes les associations user-team
- `GET /clocks` - Liste de tous les pointages

#### Routes Admin/Manager
- `POST /users` - Créer un utilisateur (admin)
- `GET /users/:id` - Obtenir un utilisateur (admin)
- `GET /users/email/:email` - Obtenir un utilisateur par email (admin)
- `PATCH /users/:id` - Modifier un utilisateur (admin)
- `DELETE /users/:id` - Supprimer un utilisateur (admin)
- `POST /teams` - Créer une équipe (admin)
- `PATCH /teams/:id` - Modifier une équipe (admin + manager de l'équipe)
- `DELETE /teams/:id` - Supprimer une équipe (admin + manager de l'équipe)
- `POST /clocks` - Créer un pointage (admin)
- `PATCH /clocks/:id` - Modifier un pointage (admin)
- `DELETE /clocks/:id` - Supprimer un pointage (admin)
- `GET /plannings` - Liste des plannings (admin)
- `POST /plannings` - Créer un planning (admin)
- `PATCH /plannings/:id` - Modifier un planning (admin)
- `DELETE /plannings/:id` - Supprimer un planning (admin)
- `GET /schedules` - Liste des horaires (admin)
- `PATCH /schedules/:id` - Modifier un horaire (admin)
- `DELETE /schedules/:id` - Supprimer un horaire (admin)

#### Routes Utilisateur Authentifié
Toutes les routes commençant par `/myTeam/`, `/myClocks`, `/myAssociation/` nécessitent une authentification et accèdent aux données de l'utilisateur connecté uniquement.

### Middlewares de Sécurité Utilisés

#### AuthMiddleware
- Vérifie la présence et la validité du JWT (cookie ou header)
- Ajoute `req.user` avec les informations de l'utilisateur
- Retourne 401 si non authentifié

#### PermissionMiddleware
- Vérifie le niveau de permission de l'utilisateur (superadmin, admin, employee)
- Doit être utilisé après AuthMiddleware
- Retourne 403 si permissions insuffisantes

#### TeamRoleMiddleware
- Vérifie le rôle de l'utilisateur dans une équipe spécifique (manager, employee)
- Peut être configuré en mode "useTokenUserId" pour vérifier l'équipe de l'utilisateur connecté
- Doit être utilisé après AuthMiddleware
- Retourne 403 si rôle insuffisant

#### CsrfMiddleware
- Protège toutes les routes POST/PUT/PATCH/DELETE
- Vérifie la correspondance entre le cookie XSRF-TOKEN et le header X-CSRF-Token
- Retourne 403 si tokens invalides

## Checklist de Sécurité

- [x] Protection CSRF avec tokens sur toutes les routes mutantes (POST/PUT/DELETE)
- [x] Protection XSS avec Helmet (CSP)
- [x] Sanitization automatique de tous les inputs
- [x] JWT stockés dans des cookies httpOnly
- [x] Cookies avec attributs secure et sameSite
- [x] Rate limiting sur les routes d'authentification
- [x] Rate limiting général sur toutes les routes API
- [x] Protection contre les injections NoSQL
- [x] Protection contre HTTP Parameter Pollution
- [x] Limitation de la taille des requêtes
- [x] Configuration CORS stricte
- [x] Validation et sanitization des emails
- [x] Validation des inputs avec longueur min/max
- [x] **Authentification obligatoire sur toutes les routes sensibles**
- [x] **Autorisation basée sur les rôles (RBAC) pour toutes les opérations**
- [x] **Isolation des données utilisateur (accès uniquement aux propres données)**

---

## Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)

---

## Contact

Pour toute question de sécurité, veuillez contacter l'équipe de développement.
