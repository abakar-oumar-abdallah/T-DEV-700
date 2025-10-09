pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'develop', url: 'https://github.com/abakar-oumar-abdallah/T-DEV-700'
            }
        }

        stage('Build') {
            steps {
                echo "Construction du projet en cours ..."
            }
        }

        stage('Tests') {
            steps {
                echo "Exécution des tests sur le backend"
            }
        }

        stage('Deploy (Préproduction)') {
            steps {
                echo "Déploiement automatique de la branche develop"
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
