pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'develop', url: 'https://github.com/abakar-oumar-abdallah/T-DEV-700'
            }
        }

        stage('Build') {
            steps {
                echo "Construction des images Docker"
                sh "docker compose -f ${DOCKER_COMPOSE_FILE} build"
            }
        }

        stage('Tests') {
            steps {
                echo "Exécution des tests sur le backend"
                sh "docker compose -f ${DOCKER_COMPOSE_FILE} run backend npm test"
            }
        }

        stage('Deploy (Préproduction)') {
            steps {
                echo "Déploiement automatique de la branche develop"
                sh "docker compose -f ${DOCKER_COMPOSE_FILE} up -d"
            }
        }
    }

    post {
        always {
            echo "Pipeline terminé pour la branche develop"
        }
        success {
            echo "Pipeline a été exécutée avec succès"
        }
        failure {
            echo "Pipeline a été echoué"
        }
    }
}
