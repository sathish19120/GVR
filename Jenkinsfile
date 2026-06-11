pipeline {
    agent any

    environment {
        // SonarQube server name (configured in Jenkins → Manage Jenkins → Configure System)
        SONAR_SERVER     = 'SonarQubeLocal'
        // Artifactory container internal address (same Docker network)
        ARTIFACTORY_URL  = 'http://artifactory/artifacts'
        // Web portal container internal address
        PORTAL_CONTAINER = 'web-portal'
        // Build artifact name includes build number for versioning
        ARTIFACT_NAME    = "finance-${env.BUILD_NUMBER}.html"
    }

    triggers {
        // GitHub webhook triggers this automatically on push
        githubPush()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Checked out branch: ${env.GIT_BRANCH} | commit: ${env.GIT_COMMIT}"
            }
        }

        stage('Validate') {
            steps {
                // Basic HTML validation — install html-tidy if not present
                sh '''
                    if command -v tidy &>/dev/null; then
                        tidy -errors -quiet -utf8 finance.html || true
                        echo "HTML validation complete"
                    else
                        echo "tidy not installed, skipping HTML lint"
                    fi
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv("${SONAR_SERVER}") {
                    sh """
                        sonar-scanner \
                          -Dsonar.projectKey=finance-html \
                          -Dsonar.projectName="Finance HTML App" \
                          -Dsonar.sources=. \
                          -Dsonar.inclusions=finance.html \
                          -Dsonar.host.url=${SONAR_HOST_URL} \
                          -Dsonar.login=${SONAR_AUTH_TOKEN}
                    """
                }
            }
        }

        stage('Quality Gate') {
            steps {
                // Wait up to 5 min for SonarQube to finish analysis
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Package Artifact') {
            steps {
                sh """
                    cp finance.html ${ARTIFACT_NAME}
                    echo "Build: ${env.BUILD_NUMBER}" >> ${ARTIFACT_NAME}
                    echo "Commit: ${env.GIT_COMMIT}" >> ${ARTIFACT_NAME}
                """
                archiveArtifacts artifacts: "${ARTIFACT_NAME}", fingerprint: true
            }
        }

        stage('Publish to Artifactory') {
            steps {
                // Copy artifact into the artifactory Nginx container
                sh """
                    docker cp ${ARTIFACT_NAME} artifactory:/usr/share/nginx/html/artifacts/${ARTIFACT_NAME}
                    echo "Published ${ARTIFACT_NAME} to Artifactory at ${ARTIFACTORY_URL}/${ARTIFACT_NAME}"
                """
            }
        }

        stage('Deploy to Web Portal') {
            steps {
                sh """
                    # Copy the built artifact to the web-portal container as index/finance.html
                    docker cp ${ARTIFACT_NAME} ${PORTAL_CONTAINER}:/usr/share/nginx/html/finance.html
                    # Reload Nginx (graceful, zero downtime)
                    docker exec ${PORTAL_CONTAINER} nginx -s reload
                    echo "Deployed to web portal: http://localhost:8080/finance.html"
                """
            }
        }
    }

    post {
        success {
            echo """
            ✅ Pipeline succeeded!
            Artifact : ${ARTIFACTORY_URL}/${ARTIFACT_NAME}
            Live URL  : http://localhost:8080/finance.html
            """
        }
        failure {
            echo "❌ Pipeline failed at stage. Check logs above."
        }
        always {
            cleanWs()
        }
    }
}
