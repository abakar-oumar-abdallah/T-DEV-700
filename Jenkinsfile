pipeline {
    
    agent any

    environment {
        DOCKERHUB_ACCOUNT = 'abakar98'
        FRONT_REPOSITORY = 'jenkins-frontend'
        BACK_REPOSITORY = 'jenkins-api'
        SERVER_USER = 'root'
        SERVER_IP = '5.135.83.169'
    }
    
    stages {
        stage('Build & Push') {
            parallel {

                stage('Frontend') {

                    stages {

                        stage('Checks Frontend') {
                            agent {
                                docker {
                                    image 'node:lts'
                                    reuseNode true
                                }
                            }
                            steps {
                                dir('frontend/2clock') {
                                    sh 'npm ci'
                                    sh 'npm run lint || true'
                                    sh 'npm audit || true'
                                }
                            }
                        }

                        stage('Build Frontend Image') {
                            steps {
                                script {
                                    dir('frontend/2clock') {
                                        dockerFrontendImage = docker.build(
                                            "${DOCKERHUB_ACCOUNT}/${FRONT_REPOSITORY}:latest",
                                            "--build-arg NEXT_PUBLIC_BACKENDURL=https://2clock-mar-8.fr/api ."
                                        )
                                    }
                                }
                            }
                        }

                        stage('Pousser sur Docker Hub Frontend') {
                            steps {
                                script {
                                    withDockerRegistry([credentialsId: 'JENKINS_DOCKERHUB_TOKEN']) {
                                        dockerFrontendImage.push()
                                    }
                                }
                            }
                        }

                    }
                }
                

                stage('Backend') {
                    
                    stages {

                        stage('Checks Backend') {
                            agent {
                                docker {
                                    image 'node:lts'
                                    reuseNode true
                                }
                            }
                            environment {
                                SUPABASE_URL = credentials('supabase-url')
                                SUPABASE_SERVICE_ROLE_KEY = credentials('supabase-service-key')
                                NODE_ENV = 'test'
                                JWT_SECRET = 'test-jwt-secret'
                                FRONTEND_URL = 'http://localhost:3000'
                            }
                            steps {
                                dir('backend') {
                                    sh 'npm ci'
                                    sh 'npm run lint || true'
                                    sh 'npm audit || true'
                                    sh 'npm run test:ci || true'
                                }
                            }
                        }

                        stage('Construire image Docker Backend') {
                            steps {
                                script {
                                    dir('backend') {
                                        dockerBackendImage = docker.build("${DOCKERHUB_ACCOUNT}/${BACK_REPOSITORY}:latest")
                                    }
                                }
                            }
                        }

                        stage('Pousser sur Docker Hub Backend') {
                            steps {
                                script {
                                    withDockerRegistry([credentialsId: 'JENKINS_DOCKERHUB_TOKEN']) {
                                        dockerBackendImage.push()
                                    }
                                }
                            }
                        }

                    }
                }

            }
        }

        stage('Déployer sur le serveur de production') {

            environment {
                DOCKER_HUB = credentials('JENKINS_DOCKERHUB_TOKEN')
            }

            steps {
                sshagent(credentials: ['ovh_prod_key']) {
                    sh '''
                        [ -d ~/.ssh ] || mkdir ~/.ssh && chmod 0700 ~/.ssh
                        ssh-keyscan -H $SERVER_IP >> ~/.ssh/known_hosts
                        scp docker-compose.prod.yml $SERVER_USER@$SERVER_IP:/var/www/docker-compose.prod.yml
                        scp nginx.conf $SERVER_USER@$SERVER_IP:/var/www/nginx.conf
                        ssh $SERVER_USER@$SERVER_IP "docker login -u $DOCKER_HUB_USR -p $DOCKER_HUB_PSW && cd /var/www && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d --force-recreate"
                    '''
                }
            }
        }
    }

    post {
        success {
            emailext(subject: '${DEFAULT_SUBJECT}', body: '${DEFAULT_CONTENT}', to: 'oumar-abdallah.abakar@epitech.eu')
        }

        failure {
            emailext(subject: '${DEFAULT_SUBJECT}', body: '${DEFAULT_CONTENT}', to: 'oumar-abdallah.abakar@epitech.eu')
        }

        always {
            echo "L'exécution du pipeline est terminée."
        }
    }
}

// pipeline {
//     agent any

//     triggers {
//         pollSCM('H */4 * * 1-5')
//     }

//     tools {
//         nodejs 'node20-11'
//     }

//     environment  {
//         BASE_URL = 'http://backend:3001' // URL du backend dans le réseau docker
//     }

//     stages {
//         stage('Checkout') {
//             steps {
//                 git branch: 'develop', url: 'https://github.com/abakar-oumar-abdallah/T-DEV-700'
//             }
//         }

//         stage('Installer les dépendances') {
//             steps {
//                 dir('backend') {
//                     sh 'node --version'
//                     sh 'npm --version'
//                     sh 'npm ci --cache .npm --prefer-offline' // On fait pas de npm i quand on est dans ci, on utilise ci. 
//                     // Permet de supprimer le node_module et réinstaller en lisant le package.json
//                     // Mettre en cache le dossier .npm toutes les librairies  à chaque push
//                 }
//             }
//         }


//         stage('Exécution des tests sur le backend') {
//             steps {
//                 dir('backend') {
//                     sh 'export BASE_URL=http://backend:3001'
//                     sh 'npm run test:coverage'
//                 }
//             }
//         }

//         stage('Vérifier les codes') {
//             steps {
//                 dir('backend') {
//                     sh 'npm run lint || true' // Permet de vérifier la syntaxe et la bonne pratique dans notre code.
//                 }
//             }
//         }

//         stage('Vérifier les dépendances') {
//             steps {
//                 dir('backend') {
//                     sh 'npm audit || true' // Permet les toutes vulnérabilités des dépendances.
//                 }
//             }
//         }

//         stage('Upload coverage vers Codecov') {
//             environment {
//                 CODECOV_TOKEN = credentials('codecov-token')
//             }
//             steps {
//                 dir('backend') {
//                     sh '''
//                         curl -Os https://uploader.codecov.io/latest/linux/codecov
//                         chmod +x codecov
//                         ./codecov -t ${CODECOV_TOKEN} -f coverage/lcov.info -F backend
//                     '''
//                 }
//             }
//         }
//     }
    
//     post {
//         always {
//             echo "Pipeline terminé"
//         }
//         success {
//             echo "Pipeline a été exécutée avec succès"
//         }
//         failure {
//             echo "Pipeline a été échoué"
//         }
//     }
// }