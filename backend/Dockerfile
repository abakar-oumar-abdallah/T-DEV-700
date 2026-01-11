# Étape 1 : Dépendances
FROM node:20-alpine AS deps
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer UNIQUEMENT les dépendances de production
RUN npm ci --omit=dev --prefer-offline

# Étape 2 : Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3001

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

# Copier les node_modules depuis l'étape deps
COPY --from=deps /app/node_modules ./node_modules

# Copier le code source
COPY --chown=nodeuser:nodejs . .

# Passer à l'utilisateur non-root
USER nodeuser

# Exposer le port
EXPOSE 3001

# Healthcheck (optionnel mais recommandé)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Commande de démarrage
CMD ["node", "src/server.js"]