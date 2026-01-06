/**
 * Script de test automatique pour les protections de sécurité
 *
 * Usage: node test-security.js
 *
 * Teste:
 * - Protection CSRF
 * - Protection XSS
 * - Cookies sécurisés
 * - Rate limiting
 * - Headers de sécurité
 */

const API_URL = 'http://localhost:3001';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Helper functions
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ ${message}`, 'cyan');
}

function logWarning(message) {
    log(`⚠ ${message}`, 'yellow');
}

function logSection(message) {
    console.log('');
    log('='.repeat(60), 'blue');
    log(message, 'blue');
    log('='.repeat(60), 'blue');
}

// Cookie storage
let cookieJar = {};

// Parse Set-Cookie header to extract cookie attributes
function parseCookies(setCookieHeaders) {
    if (!setCookieHeaders) return {};

    const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    const parsed = {};

    cookies.forEach(cookie => {
        const parts = cookie.split(';').map(p => p.trim());
        const [nameValue, ...attributes] = parts;
        const [name, value] = nameValue.split('=');

        parsed[name] = {
            value,
            attributes: {}
        };

        // Store in cookie jar
        cookieJar[name] = value;

        attributes.forEach(attr => {
            const [key, val] = attr.split('=');
            parsed[name].attributes[key.toLowerCase()] = val || true;
        });
    });

    return parsed;
}

// Get Cookie header string from jar
function getCookieHeader() {
    return Object.entries(cookieJar)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
}

// Test 1: CSRF Protection
async function testCsrfProtection() {
    logSection('Test 1: Protection CSRF');

    try {
        // 1.1: Get CSRF token
        logInfo('1.1: Obtention du token CSRF...');
        const csrfResponse = await fetch(`${API_URL}/csrf-token`);

        // Parse cookies from response
        const setCookie = csrfResponse.headers.get('set-cookie');
        if (setCookie) {
            parseCookies(setCookie);
        }

        const csrfData = await csrfResponse.json();

        if (csrfData.csrfToken) {
            logSuccess(`Token CSRF obtenu: ${csrfData.csrfToken.substring(0, 20)}...`);
            logInfo(`Cookie XSRF-TOKEN stocké: ${cookieJar['XSRF-TOKEN'] ? 'Oui' : 'Non'}`);
        } else {
            logError('Échec: Aucun token CSRF dans la réponse');
            return null;
        }

        const csrfToken = csrfData.csrfToken;

        // 1.2: Try login WITHOUT CSRF token (should fail)
        logInfo('1.2: Test login SANS token CSRF (doit échouer)...');
        const loginNoToken = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@test.com',
                password: 'test'
            })
        });

        if (loginNoToken.status === 403) {
            logSuccess('Protection CSRF active: requête rejetée (403)');
        } else {
            logError(`ATTENTION: La requête sans token CSRF n'a pas été rejetée (status: ${loginNoToken.status})`);
        }

        // 1.3: Try login WITH CSRF token (should work or return 401 for bad credentials)
        logInfo('1.3: Test login AVEC token CSRF...');
        const cookieHeader = getCookieHeader();
        logInfo(`Envoi des cookies: ${cookieHeader.substring(0, 50)}...`);

        const loginWithToken = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
                'Cookie': cookieHeader
            },
            body: JSON.stringify({
                email: 'test@test.com',
                password: 'test'
            })
        });

        if (loginWithToken.status === 200 || loginWithToken.status === 401) {
            logSuccess(`Requête avec token CSRF acceptée (status: ${loginWithToken.status})`);
        } else if (loginWithToken.status === 403) {
            logError('La requête avec token CSRF a été rejetée');
        }

        return csrfToken;

    } catch (error) {
        logError(`Erreur lors du test CSRF: ${error.message}`);
        return null;
    }
}

// Test 2: XSS Protection
async function testXssProtection(csrfToken) {
    logSection('Test 2: Protection XSS (Sanitization)');

    const xssPayloads = [
        '<script>alert("XSS")</script>test@test.com',
        '<img src=x onerror=alert(1)>@test.com',
        'javascript:alert(1)@test.com',
        '<svg/onload=alert(1)>@test.com'
    ];

    for (let i = 0; i < xssPayloads.length; i++) {
        const payload = xssPayloads[i];
        try {
            logInfo(`Test ${i + 1}/${xssPayloads.length}: ${payload.substring(0, 30)}...`);

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                    'Cookie': getCookieHeader()
                },
                body: JSON.stringify({
                    email: payload,
                    password: 'test'
                })
            });

            // Gérer le rate limiting
            if (response.status === 429) {
                logWarning('Rate limiting atteint, test arrêté');
                logInfo('Les payloads précédents ont été testés avec succès');
                break;
            }

            const data = await response.json();

            // Si l'email est invalide à cause de la sanitization, c'est bon
            if (response.status === 400 || data.message.includes('Invalid email')) {
                logSuccess('Payload XSS nettoyé ou rejeté');
            } else {
                logWarning(`Status inattendu: ${response.status}`);
            }

            // Petit délai pour éviter le rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
            logError(`Erreur: ${error.message}`);
        }
    }
}

// Test 3: Secure Cookies
async function testSecureCookies(csrfToken) {
    logSection('Test 3: Cookies Sécurisés');

    try {
        logInfo('Tentative de login pour obtenir le cookie JWT...');

        // Note: Vous devez avoir un compte valide pour ce test
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
                'Cookie': getCookieHeader()
            },
            body: JSON.stringify({
                email: 'test@example.com', // Remplacer par un compte valide
                password: 'password123'
            })
        });

        const setCookieHeader = response.headers.get('set-cookie');

        if (!setCookieHeader) {
            logWarning('Aucun cookie Set-Cookie dans la réponse (peut-être credentials invalides)');
            logInfo('Pour tester les cookies, utilisez des credentials valides');
            return;
        }

        const cookies = parseCookies(setCookieHeader);

        // Check JWT cookie
        if (cookies.jwt) {
            logInfo('Cookie JWT trouvé, vérification des attributs...');

            const jwtCookie = cookies.jwt;

            if (jwtCookie.attributes.httponly) {
                logSuccess('✓ HttpOnly: true (protection XSS)');
            } else {
                logError('✗ HttpOnly: false (vulnérable au vol via XSS)');
            }

            if (jwtCookie.attributes.samesite === 'strict') {
                logSuccess('✓ SameSite: strict (protection CSRF)');
            } else {
                logWarning(`⚠ SameSite: ${jwtCookie.attributes.samesite || 'non défini'}`);
            }

            if (process.env.NODE_ENV === 'production') {
                if (jwtCookie.attributes.secure) {
                    logSuccess('✓ Secure: true (HTTPS uniquement)');
                } else {
                    logError('✗ Secure: false en production');
                }
            } else {
                logInfo('ℹ Secure: non vérifié (développement)');
            }

        } else {
            logWarning('Cookie JWT non trouvé dans la réponse');
        }

        // Check CSRF cookie
        if (cookies['XSRF-TOKEN']) {
            logInfo('Cookie CSRF trouvé');
            if (!cookies['XSRF-TOKEN'].attributes.httponly) {
                logSuccess('✓ XSRF-TOKEN: httpOnly = false (correct, le client doit pouvoir le lire)');
            }
        }

    } catch (error) {
        logError(`Erreur: ${error.message}`);
    }
}

// Test 4: Rate Limiting
async function testRateLimiting(csrfToken) {
    logSection('Test 4: Rate Limiting');

    logInfo('Tentative de 7 requêtes de login (limite: 5)...');

    const attempts = 7;
    let rateLimitHit = false;

    for (let i = 1; i <= attempts; i++) {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                    'Cookie': getCookieHeader()
                },
                body: JSON.stringify({
                    email: 'test@test.com',
                    password: 'wrongpassword'
                })
            });

            if (response.status === 429) {
                logSuccess(`Tentative ${i}: Rate limit atteint (429)`);
                rateLimitHit = true;
            } else {
                logInfo(`Tentative ${i}: ${response.status}`);
            }

            // Petit délai entre les requêtes
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
            logError(`Tentative ${i}: Erreur - ${error.message}`);
        }
    }

    if (rateLimitHit) {
        logSuccess('Protection rate limiting active ✓');
    } else {
        logWarning('Aucun rate limit détecté après 7 tentatives');
    }
}

// Test 5: Security Headers
async function testSecurityHeaders() {
    logSection('Test 5: Headers de Sécurité (Helmet)');

    try {
        const response = await fetch(`${API_URL}/csrf-token`);

        const securityHeaders = {
            'X-Content-Type-Options': response.headers.get('x-content-type-options'),
            'X-Frame-Options': response.headers.get('x-frame-options'),
            'Content-Security-Policy': response.headers.get('content-security-policy'),
            'X-XSS-Protection': response.headers.get('x-xss-protection'),
            'Strict-Transport-Security': response.headers.get('strict-transport-security')
        };

        Object.entries(securityHeaders).forEach(([header, value]) => {
            if (value) {
                logSuccess(`✓ ${header}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
            } else {
                logWarning(`⚠ ${header}: Non défini`);
            }
        });

    } catch (error) {
        logError(`Erreur: ${error.message}`);
    }
}

// Main test runner
async function runAllTests() {
    log('\n🔒 TESTS DE SÉCURITÉ AUTOMATIQUES', 'cyan');
    log('='.repeat(60), 'cyan');

    try {
        // Test 1: CSRF
        const csrfToken = await testCsrfProtection();

        if (!csrfToken) {
            logError('Impossible de continuer sans token CSRF');
            return;
        }

        // Test 2: XSS
        await testXssProtection(csrfToken);

        // Test 3: Secure Cookies
        await testSecureCookies(csrfToken);

        // Test 4: Rate Limiting
        await testRateLimiting(csrfToken);

        // Test 5: Security Headers
        await testSecurityHeaders();

        // Summary
        logSection('Résumé des Tests');
        log('Tous les tests sont terminés. Consultez les résultats ci-dessus.', 'green');
        log('\nPour plus de détails, consultez:', 'cyan');
        log('  - backend/SECURITY.md - Documentation complète', 'cyan');
        log('  - backend/TESTING_SECURITY.md - Guide de test', 'cyan');
        log('  - backend/test-security.html - Interface de test interactive', 'cyan');

    } catch (error) {
        logError(`Erreur fatale: ${error.message}`);
    }
}

// Check if server is running
async function checkServerRunning() {
    try {
        const response = await fetch(`${API_URL}/csrf-token`);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Entry point
(async () => {
    logInfo('Vérification que le serveur est démarré...');

    const serverRunning = await checkServerRunning();

    if (!serverRunning) {
        logError(`Le serveur backend n'est pas accessible sur ${API_URL}`);
        logInfo('Démarrez le serveur avec: npm start');
        process.exit(1);
    }

    logSuccess('Serveur backend accessible ✓\n');

    await runAllTests();
})();
