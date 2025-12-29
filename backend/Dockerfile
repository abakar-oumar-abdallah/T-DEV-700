FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances (production uniquement)
RUN npm ci --only=production

# Copier le code source
COPY . .

# Variables d'environnement
ENV NODE_ENV=production

# Exposer le port
EXPOSE 3001

# Commande de démarrage
CMD ["node", "src/server.js"]