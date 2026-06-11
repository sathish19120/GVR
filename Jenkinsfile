pipeline {
    agent any

    environment {
        PATH = "/usr/local/bin:/opt/node-v18.20.4-linux-x64/bin:/usr/bin:/bin:${env.PATH}"
        VITE_SUPABASE_URL = credentials('supabase-url')
        VITE_SUPABASE_ANON_KEY = credentials('supabase-anon-key')
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Install Dependencies') {
            steps { sh 'npm install' }
        }
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQubeLocal') {
                    sh '/opt/sonar-scanner/bin/sonar-scanner -Dsonar.projectKey=GVR -Dsonar.sources=src -Dsonar.host.url=http://sonarqube:9000'
                }
            }
        }
        stage('Build Application') {
            steps {
                sh '''
                    echo "VITE_SUPABASE_URL=$VITE_SUPABASE_URL" > .env
                    echo "VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY" >> .env
                    npm run build
                '''
            }
        }
        stage('Build Docker Image') {
            steps { sh 'docker build -t gvr-app:latest .' }
        }
    }

    post {
        success { echo 'Pipeline succeeded!' }
        failure { echo 'Pipeline failed!' }
    }
}
