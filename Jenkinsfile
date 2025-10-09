pipeline {
    agent any

    tools {
        nodejs 'node20-11'
    }

    environment  {
        BASE_URL = 'http://backend:3001' // URL du backend dans le réseau docker
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'develop', url: 'https://github.com/abakar-oumar-abdallah/T-DEV-700'
            }
        }

        stage('Installer les dépendances') {
            steps {
                dir('backend') {
                    sh 'node --version'
                    sh 'npm --version'
                    sh 'npm ci --cache .npm --prefer-offline'
                }
            }
        }


        stage('Exécution des tests sur le backend') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'export BASE_URL=http://backend:3001'
                    sh 'npm run test'
                }
            }
        }

        stage('Vérifier les codes') {
            steps {
                dir('backend') {
                    sh 'npm run lint || true'
                }
            }
        }

        stage('Vérifier les dépendances') {
            steps {
                dir('backend') {
                    sh 'npm audit || true'
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline terminé"
        }
        success {
            echo "Pipeline a été exécutée avec succès"
        }
        failure {
            echo "Pipeline a été échoué"
        }
    }
}
