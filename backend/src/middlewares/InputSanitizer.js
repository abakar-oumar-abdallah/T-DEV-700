/**
 * Middleware de sanitization des inputs pour la protection XSS
 *
 * Ce middleware nettoie les inputs utilisateur pour prévenir les attaques XSS
 * en supprimant ou échappant les caractères dangereux dans les données entrantes.
 *
 * Protection contre:
 * - Injections de scripts malveillants (XSS)
 * - HTML non sécurisé
 * - Caractères spéciaux dangereux
 */

/**
 * Échappe les caractères HTML dangereux
 * @param {string} str - La chaîne à échapper
 * @returns {string} - La chaîne échappée
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str;

  const htmlEscapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return str.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Supprime les tags HTML et scripts
 * @param {string} str - La chaîne à nettoyer
 * @returns {string} - La chaîne nettoyée
 */
function stripHtmlTags(str) {
  if (typeof str !== 'string') return str;

  // Supprime tous les tags HTML
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitise récursivement un objet en nettoyant toutes les chaînes de caractères
 * @param {*} obj - L'objet à sanitiser
 * @param {boolean} strict - Si true, supprime les tags HTML, sinon les échappe seulement
 * @returns {*} - L'objet sanitisé
 */
function sanitizeObject(obj, strict = false) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return strict ? stripHtmlTags(obj) : escapeHtml(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, strict));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key], strict);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Middleware pour sanitiser les inputs des requêtes
 * @param {boolean} options.strict - Si true, supprime les tags HTML, sinon les échappe
 */
function sanitizeInput(options = {}) {
  const { strict = false } = options;

  return (req, res, next) => {
    // Sanitise le body de la requête
    if (req.body) {
      req.body = sanitizeObject(req.body, strict);
    }

    // Sanitise les query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query, strict);
    }

    // Sanitise les params de l'URL
    if (req.params) {
      req.params = sanitizeObject(req.params, strict);
    }

    next();
  };
}

/**
 * Validation et sanitization pour les champs email
 * @param {string} email - L'email à valider
 * @returns {object} - { valid: boolean, sanitized: string, error: string }
 */
function validateAndSanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, sanitized: '', error: 'Email is required' };
  }

  // Nettoie l'email
  const sanitized = email.trim().toLowerCase();

  // Validation du format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return { valid: false, sanitized, error: 'Invalid email format' };
  }

  // Vérifie la longueur
  if (sanitized.length > 255) {
    return { valid: false, sanitized, error: 'Email too long' };
  }

  return { valid: true, sanitized, error: null };
}

/**
 * Validation et sanitization pour les champs texte
 * @param {string} text - Le texte à valider
 * @param {object} options - Options de validation
 * @returns {object} - { valid: boolean, sanitized: string, error: string }
 */
function validateAndSanitizeText(text, options = {}) {
  const {
    minLength = 0,
    maxLength = 1000,
    required = true,
    allowHtml = false
  } = options;

  if (!text || typeof text !== 'string') {
    if (required) {
      return { valid: false, sanitized: '', error: 'Text is required' };
    }
    return { valid: true, sanitized: '', error: null };
  }

  // Nettoie le texte
  let sanitized = text.trim();

  if (!allowHtml) {
    sanitized = stripHtmlTags(sanitized);
  }

  // Vérifie la longueur
  if (sanitized.length < minLength) {
    return {
      valid: false,
      sanitized,
      error: `Text must be at least ${minLength} characters`
    };
  }

  if (sanitized.length > maxLength) {
    return {
      valid: false,
      sanitized,
      error: `Text must be at most ${maxLength} characters`
    };
  }

  return { valid: true, sanitized, error: null };
}

module.exports = {
  sanitizeInput,
  sanitizeObject,
  escapeHtml,
  stripHtmlTags,
  validateAndSanitizeEmail,
  validateAndSanitizeText
};
