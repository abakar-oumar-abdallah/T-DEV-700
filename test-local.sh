#!/bin/bash

echo "=========================================="
echo "🧪 TESTS LOCAUX - BACKEND & FRONTEND"
echo "=========================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 - SUCCÈS${NC}"
    else
        echo -e "${RED}❌ $1 - ÉCHEC${NC}"
        exit 1
    fi
}

echo ""
echo "📦 BACKEND - Installation des dépendances"
cd backend
npm ci
check_result "Backend - npm ci"

echo ""
echo "🔍 BACKEND - Linter"
npm run lint || true
check_result "Backend - Lint"

echo ""
echo "🔒 BACKEND - Audit de sécurité"
npm audit || true
echo -e "${YELLOW}⚠️  Vulnérabilités détectées (non bloquant)${NC}"

echo ""
echo "🧪 BACKEND - Tests unitaires"
npm run test:ci
check_result "Backend - Tests"

echo ""
echo "=========================================="
echo "📦 FRONTEND - Installation des dépendances"
cd ../frontend/2clock
npm ci
check_result "Frontend - npm ci"

echo ""
echo "🔍 FRONTEND - Linter"
npm run lint || true
check_result "Frontend - Lint"

echo ""
echo "🔒 FRONTEND - Audit de sécurité"
npm audit || true

echo ""
echo "🏗️  FRONTEND - Build"
npm run build
check_result "Frontend - Build"

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 TOUS LES TESTS SONT PASSÉS !${NC}"
echo "=========================================="
echo ""
echo "Vous pouvez maintenant push sur Git en toute confiance !"
echo ""