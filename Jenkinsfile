pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'gvr-app:latest'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
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
        
        stage('Build Application') {
            steps {
                echo 'Building React application...'
                sh 'npm run build'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                sh 'docker build -t ${DOCKER_IMAGE} .'
            }
        }
        
        stage('Update Kubernetes Manifest') {
            steps {
                echo 'Updating k8s deployment...'
                sh '''
                    timestamp=$(date +%s)
                    sed -i "s|image: gvr-app:.*|image: gvr-app:${timestamp}|g" k8s/deployment.yaml
                '''
                sh '''
                    git config user.email "jenkins@example.com"
                    git config user.name "Jenkins Bot"
                    git add k8s/deployment.yaml
                    git commit -m "Update image tag - Jenkins build ${BUILD_NUMBER}" || true
                    git push origin main || true
                '''
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline completed'
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
