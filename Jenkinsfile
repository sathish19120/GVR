

@"
pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'gvr-app:latest'
        REGISTRY = 'docker.io'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                git branch: 'main', url: 'https://github.com/sathish19120/GVR.git'
                echo "Repository: \${GIT_URL}"
                echo "Branch: \${GIT_BRANCH}"
                echo "Commit: \${GIT_COMMIT}"
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                sh 'npm install'
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                echo 'Running SonarQube scan...'
                withSonarQubeEnv('SonarQubeLocal') {
                    sh 'sonar-scanner'
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                echo 'Checking quality gate...'
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        
        stage('Build Application') {
            steps {
                echo 'Building React application...'
                sh 'npm run build'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                sh 'docker build -t \${DOCKER_IMAGE} .'
            }
        }
        
        stage('Update Kubernetes Manifest') {
            steps {
                echo 'Updating k8s deployment with new image tag...'
                sh '''
                    timestamp=\$(date +%s)
                    sed -i "s|image: gvr-app:.*|image: gvr-app:\${timestamp}|g" k8s/deployment.yaml
                    cat k8s/deployment.yaml
                '''
                sh '''
                    git config user.email "jenkins@example.com"
                    git config user.name "Jenkins Bot"
                    git add k8s/deployment.yaml
                    git commit -m "Update image tag - Jenkins build \${BUILD_NUMBER}" || true
                    git push origin main || true
                '''
            }
        }
        
        stage('Deploy via ArgoCD') {
            steps {
                echo 'ArgoCD will auto-sync from GitHub...'
                echo 'Check http://localhost:8080 for deployment status'
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline completed'
        }
        success {
            echo '✓ Pipeline succeeded!'
        }
        failure {
            echo '✗ Pipeline failed!'
        }
    }
}
"@ | Out-File -Encoding utf8 -NoNewline Jenkinsfile
