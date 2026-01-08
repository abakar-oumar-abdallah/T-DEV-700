# 2Clock - Gestion du Temps et Pointage

[![codecov](https://codecov.io/gh/abakar-oumar-abdallah/T-DEV-700/graph/badge.svg?token=88DAOq6gXf)](https://codecov.io/gh/abakar-oumar-abdallah/T-DEV-700)

![2Clock Logo](./frontend/2clock/public/2clocktitle.svg)

## Table des matières

1. [À propos de 2Clock](#à-propos-de-2clock)
2. [Fonctionnalités principales](#fonctionnalités-principales)
3. [Prérequis](#prérequis)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Démarrage de l'application](#démarrage-de-lapplication)
7. [Guide d'utilisation](#guide-dutilisation)
8. [Rôles et permissions](#rôles-et-permissions)
9. [Dépannage](#dépannage)
10. [Support](#support)

---

## À propos de 2Clock

**2Clock** est une solution complète de gestion du temps et de pointage pour les entreprises. L'application permet de :

- **Suivre les heures de travail** de vos employés avec un système de pointage sécurisé
- **Gérer plusieurs équipes** avec des horaires et plannings personnalisés
- **Analyser les performances** avec des tableaux de bord et indicateurs (KPI)
- **Sécuriser les pointages** avec un système de code TOTP (code à usage unique)
- **Gérer les retards** et calculer automatiquement les heures supplémentaires

2Clock est conçu pour être simple d'utilisation, même si vous n'avez aucune expérience technique.

---

## Fonctionnalités principales

### Pour les employés
- ✅ **Pointage simple** : Entrez un code à 6 chiffres pour pointer votre arrivée/départ
- ⏰ **Historique en temps réel** : Visualisez tous vos pointages du jour
- 📊 **Statistiques personnelles** : Consultez vos retards, heures supplémentaires, etc.
- 🌍 **Multi-fuseaux horaires** : Pointez correctement même en télétravail

### Pour les managers
- 👥 **Gestion d'équipe** : Créez et gérez plusieurs équipes
- 📅 **Plannings flexibles** : Définissez des horaires de travail personnalisés
- 📈 **Tableaux de bord** : Suivez les performances en temps réel
- 🔔 **Alertes automatiques** : Recevez des notifications pour les retards
- 📊 **Rapports détaillés** : Exportez les données pour l'analyse

### Pour les administrateurs
- 🔐 **Gestion des utilisateurs** : Créez, modifiez et supprimez des comptes
- 🏢 **Multi-entreprises** : Gérez plusieurs organisations
- 🔒 **Sécurité avancée** : Protection CSRF, rate limiting, authentification JWT
- 📝 **Audit complet** : Historique de toutes les actions

---

## Prérequis

Avant d'installer 2Clock, assurez-vous d'avoir les éléments suivants installés sur votre ordinateur :

### Obligatoires :
- **Node.js** (version 18 ou supérieure) - [Télécharger ici](https://nodejs.org/)
- **npm** (installé automatiquement avec Node.js)
- **Un compte Supabase** (gratuit) - [Créer un compte ici](https://supabase.com/)

### Vérifier votre installation :
Ouvrez un terminal et tapez ces commandes :

```bash
node --version
# Devrait afficher v18.0.0 ou supérieur

npm --version
# Devrait afficher 9.0.0 ou supérieur
```

---

## Installation

### Étape 1 : Télécharger l'application

1. Téléchargez le dossier complet de 2Clock
2. Décompressez-le dans un emplacement de votre choix (ex: `Documents/2Clock`)
3. Ouvrez un terminal dans ce dossier

**Sur Windows** : Faites un clic droit dans le dossier → "Ouvrir dans le terminal"
**Sur Mac** : Faites un clic droit → "Services" → "Nouveau terminal à cet emplacement"

### Étape 2 : Installer les dépendances

#### Installation du Backend

```bash
# Allez dans le dossier backend
cd backend

# Installez les dépendances
npm install

# Attendez que l'installation se termine (peut prendre 2-3 minutes)
```

#### Installation du Frontend

```bash
# Retournez à la racine du projet
cd ..

# Allez dans le dossier frontend
cd frontend/2clock

# Installez les dépendances
npm install

# Attendez que l'installation se termine (peut prendre 2-3 minutes)
```

---

## Configuration

### Étape 1 : Configuration de Supabase

1. **Créer un projet Supabase** :
   - Allez sur [supabase.com](https://supabase.com)
   - Cliquez sur "New Project"
   - Donnez un nom à votre projet (ex: "2Clock-Production")
   - Choisissez un mot de passe sécurisé pour la base de données
   - Sélectionnez la région la plus proche de vous

2. **Récupérer vos clés API** :
   - Dans votre projet Supabase, allez dans "Settings" → "API"
   - Notez les valeurs suivantes :
     - **URL** (Project URL)
     - **anon public** (Service Role Key - cliquez sur "Reveal" pour voir)

### Étape 2 : Configuration du Backend

1. Dans le dossier `backend`, ouvrez le fichier `.env`
2. Modifiez les valeurs suivantes :

```env
# Port du serveur (laissez 3001 par défaut)
PORT=3001

# Environnement (laissez "production" pour utilisation réelle)
NODE_ENV=production

# Remplacez avec votre URL Supabase
SUPABASE_URL=https://votre-projet.supabase.co

# Remplacez avec votre Service Role Key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici

# Clé secrète pour JWT (générez une clé aléatoire sécurisée)
# Vous pouvez utiliser ce site : https://randomkeygen.com/
JWT_SECRET=votre_cle_secrete_tres_longue_et_aleatoire

# URL du frontend (modifiez si vous utilisez un autre port)
FRONTEND_URL=http://localhost:3000
```

### Étape 3 : Configuration du Frontend

1. Dans le dossier `frontend/2clock`, créez un fichier `.env.local`
2. Ajoutez cette ligne :

```env
NEXT_PUBLIC_BACKENDURL=http://localhost:3001
```

### Étape 4 : Initialiser la base de données

2Clock a besoin de tables dans Supabase. Voici comment les créer :

1. Allez dans votre projet Supabase
2. Cliquez sur "SQL Editor"
3. Créez les tables nécessaires (contactez le support pour obtenir le script SQL complet)

> **Note** : Un script d'initialisation automatique sera fourni avec votre licence complète.

---

## Démarrage de l'application

### Démarrage en mode développement

Vous aurez besoin de **deux terminaux** ouverts :

#### Terminal 1 - Backend

```bash
# Depuis la racine du projet
cd backend

# Démarrer le serveur backend
npm run dev
```

Vous devriez voir :
```
✓ Server is running on port 3001
✓ Connected to Supabase
```

#### Terminal 2 - Frontend

```bash
# Depuis la racine du projet
cd frontend/2clock

# Démarrer l'application frontend
npm run dev
```

Vous devriez voir :
```
✓ Ready on http://localhost:3000
```

### Accéder à l'application

1. Ouvrez votre navigateur web (Chrome, Firefox, Safari, etc.)
2. Allez à l'adresse : **http://localhost:3000**
3. Vous devriez voir la page d'accueil de 2Clock

---

## Guide d'utilisation

### Première connexion

#### 1. Créer votre premier compte administrateur

Lors de la première installation, vous devrez créer un compte administrateur :

```bash
# Dans le dossier backend
npm run seed
```

Cela créera un compte admin par défaut :
- **Email** : admin@2clock.com
- **Mot de passe** : Admin123!

> ⚠️ **Important** : Changez ce mot de passe immédiatement après la première connexion !

#### 2. Se connecter

1. Sur la page d'accueil, cliquez sur "Se connecter"
2. Entrez vos identifiants
3. Vous serez redirigé vers le tableau de bord

### Pour les administrateurs

#### Créer une nouvelle équipe

1. Depuis le tableau de bord, cliquez sur "Équipes"
2. Cliquez sur "Créer une équipe"
3. Remplissez les informations :
   - **Nom de l'équipe** (ex: "Équipe Marketing")
   - **Description** (optionnel)
   - **Fuseau horaire** (sélectionnez celui de votre région)
   - **Limite de retard** (en minutes)
4. Cliquez sur "Créer"

#### Ajouter des employés

1. Allez dans "Utilisateurs" → "Ajouter un utilisateur"
2. Remplissez le formulaire :
   - Prénom et nom
   - Email professionnel
   - Numéro de téléphone
   - Rôle (Employee, Manager, Admin)
3. Assignez l'utilisateur à une ou plusieurs équipes
4. L'employé recevra un email avec ses identifiants

#### Créer un planning

1. Allez dans "Plannings" → "Nouveau planning"
2. Définissez les horaires de travail :
   - **Lundi à Vendredi** : 09:00 - 17:00
   - **Samedi/Dimanche** : Jour de repos
3. Assignez le planning à une équipe
4. Sauvegardez

### Pour les managers

#### Voir les statistiques de l'équipe

1. Sélectionnez votre équipe dans le menu
2. Allez dans "Tableau de bord"
3. Vous verrez :
   - 📊 Nombre d'employés présents
   - ⏰ Taux de ponctualité
   - 📈 Heures supplémentaires
   - 🔔 Alertes de retards

#### Générer un rapport

1. Allez dans "Rapports"
2. Sélectionnez la période (jour, semaine, mois)
3. Choisissez les employés
4. Cliquez sur "Générer"
5. Exportez en PDF ou Excel

### Pour les employés

#### Pointer votre arrivée

1. Connectez-vous à 2Clock
2. Si vous n'avez qu'une équipe, vous serez automatiquement redirigé vers la page de pointage
3. Entrez le **code TOTP à 6 chiffres** affiché sur l'écran de l'entreprise
4. Cliquez sur "Pointer Arrivée"
5. Vous verrez une confirmation et votre heure d'arrivée

#### Pointer votre départ

1. Retournez sur la page de pointage
2. Entrez le code TOTP actuel
3. Cliquez sur "Pointer Départ"
4. Vous verrez un récapitulatif de votre journée

#### Consulter votre historique

- Sur la droite de la page de pointage, vous voyez tous vos pointages du jour
- Les retards sont indiqués en orange avec le nombre de minutes
- Les heures supplémentaires sont indiquées en violet

---

## Rôles et permissions

### 👤 Employee (Employé)
- ✅ Pointer son arrivée/départ
- ✅ Consulter son historique personnel
- ❌ Ne peut pas gérer d'autres utilisateurs

### 👨‍💼 Manager
- ✅ Toutes les permissions d'un employé
- ✅ Voir les statistiques de son équipe
- ✅ Générer des rapports
- ✅ Gérer les plannings de son équipe
- ❌ Ne peut pas créer d'autres managers

### 🔐 Admin
- ✅ Toutes les permissions d'un manager
- ✅ Créer et gérer des équipes
- ✅ Ajouter/supprimer des utilisateurs
- ✅ Modifier les permissions
- ✅ Accès aux paramètres globaux

### 👑 SuperAdmin
- ✅ Tous les droits sur l'application
- ✅ Gérer plusieurs organisations
- ✅ Accès aux logs système
- ✅ Configuration avancée

---

## Dépannage

### Problème : "Cannot connect to backend"

**Solution** :
1. Vérifiez que le backend est bien démarré (terminal 1)
2. Vérifiez que l'URL dans `.env.local` est correcte
3. Vérifiez votre pare-feu (ports 3000 et 3001 doivent être ouverts)

### Problème : "Invalid TOTP code"

**Solution** :
1. Le code TOTP change toutes les 30 secondes, réessayez avec un code frais
2. Vérifiez que l'heure de votre ordinateur est correcte
3. Contactez votre manager pour régénérer un code

### Problème : "Session expired"

**Solution** :
1. Déconnectez-vous complètement
2. Videz le cache de votre navigateur (Ctrl+Shift+Delete)
3. Reconnectez-vous

### Problème : L'application est lente

**Solution** :
1. Fermez les onglets inutiles dans votre navigateur
2. Vérifiez votre connexion internet
3. Redémarrez le backend et le frontend

### Problème : "Database connection error"

**Solution** :
1. Vérifiez vos identifiants Supabase dans le fichier `.env`
2. Vérifiez que votre projet Supabase est actif
3. Vérifiez votre connexion internet

---

## Support

### Besoin d'aide ?

- 📧 **Email** : support@2clock.com

### Signaler un bug

Si vous rencontrez un problème :
1. Notez le message d'erreur exact
2. Notez ce que vous faisiez au moment de l'erreur
3. Faites une capture d'écran si possible
4. Contactez le support avec ces informations

### Demander une nouvelle fonctionnalité

Nous sommes à l'écoute de vos besoins ! Envoyez vos suggestions à : features@2clock.com

---

## Mises à jour

2Clock est régulièrement mis à jour avec de nouvelles fonctionnalités et corrections de bugs.

### Comment mettre à jour ?

1. Sauvegardez vos fichiers `.env` et `.env.local`
2. Téléchargez la nouvelle version
3. Remplacez les fichiers (sauf `.env` et `.env.local`)
4. Dans chaque dossier (backend et frontend), lancez :
```bash
npm install
```
5. Redémarrez l'application

---

## Licence

2Clock est un logiciel propriétaire. Tous droits réservés.

**Version** : 1.0.0
**Dernière mise à jour** : Janvier 2026

---

## Technologies utilisées

- **Frontend** : Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend** : Node.js, Express.js
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : JWT, TOTP (Speakeasy)
- **Sécurité** : CSRF Protection, Rate Limiting, Helmet

---

**Merci d'avoir choisi 2Clock pour la gestion du temps de votre entreprise !** 🎉

Pour toute question, n'hésitez pas à nous contacter. Notre équipe est là pour vous aider à tirer le meilleur parti de 2Clock.
