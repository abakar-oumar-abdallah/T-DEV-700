# Etape 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tous les fichiers
COPY . .

# Variables d'environnement pour le build
ENV NEXT_SKIP_NATIVE_SWC_BINARY=1

# Utiliser la config de production
RUN cp next.config.prod.ts next.config.ts

# Build de l'application en mode statique
RUN npm run build

# Etape 2: Production avec Nginx
FROM nginx:stable-alpine

# Copier les fichiers statiques générés
COPY --from=build /app/out /usr/share/nginx/html

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]