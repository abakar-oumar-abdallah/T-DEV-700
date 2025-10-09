pipeline {
    agent any

    tools {
        nodejs 'node20-11'
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
                    sh '''
                        node --node
                        npm --version
                        npm ci --cache .npm --prefer-offline'
                    '''
                }
            }
        }

        stage('Exécution des tests sur le backend') {
            steps {
                dir('backend') {
                    sh 'npm run test'
                }
            }
        }

        stage('Vérifier les codes') {
            steps {
                dir('backend') {
                    sh 'npm run lint'
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
            echo "Pipeline terminé pour la branche develop"
        }
        success {
            echo "Pipeline a été exécutée avec succès"
        }
        failure {
            echo "Pipeline a été échoué"
        }
    }
}
