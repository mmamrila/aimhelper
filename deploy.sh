#!/bin/bash

# AimHelper Pro - Production Deployment Script

set -e

echo "🚀 AimHelper Pro - Production Deployment"
echo "========================================"

# Check if required environment variables are set
check_env_vars() {
    local required_vars=(
        "DB_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "SESSION_SECRET"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
        "SMTP_PASS"
    )

    echo "🔍 Checking environment variables..."
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            echo "❌ Missing required environment variable: $var"
            exit 1
        fi
    done
    echo "✅ All required environment variables are set"
}

# Create necessary directories
setup_directories() {
    echo "📁 Setting up directories..."
    mkdir -p logs uploads ssl
    chmod 755 logs uploads
    echo "✅ Directories created"
}

# Generate SSL certificates (Let's Encrypt recommended for production)
setup_ssl() {
    echo "🔒 Setting up SSL certificates..."
    if [[ ! -f "ssl/cert.pem" ]] || [[ ! -f "ssl/key.pem" ]]; then
        echo "⚠️  SSL certificates not found in ssl/ directory"
        echo "🔧 For production, use Let's Encrypt:"
        echo "   certbot certonly --webroot -w /var/www/html -d aimhelper.pro -d www.aimhelper.pro"
        echo "   Then copy fullchain.pem to ssl/cert.pem and privkey.pem to ssl/key.pem"

        # Create self-signed certificates for testing
        echo "🧪 Creating self-signed certificates for testing..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=AimHelper/CN=aimhelper.pro"
        echo "⚠️  Using self-signed certificates - replace with Let's Encrypt in production!"
    else
        echo "✅ SSL certificates found"
    fi
}

# Deploy with Docker Compose
deploy() {
    echo "🐳 Deploying with Docker Compose..."

    # Stop existing containers
    docker compose down --remove-orphans || true

    # Pull latest images
    docker compose pull

    # Build application image
    docker compose build app

    # Start services
    docker compose up -d

    # Wait for database to be ready
    echo "⏳ Waiting for database to be ready..."
    sleep 10

    # Run database migrations
    echo "🗃️  Running database migrations..."
    docker compose exec -T app npx prisma migrate deploy

    # Verify deployment
    echo "🔍 Verifying deployment..."
    sleep 5

    if curl -f http://localhost:4000/health > /dev/null 2>&1; then
        echo "✅ Health check passed"
    else
        echo "❌ Health check failed"
        echo "🔧 Checking logs..."
        docker compose logs app --tail=20
        exit 1
    fi
}

# Main deployment process
main() {
    echo "Starting deployment process..."

    # Only check env vars if not in CI
    if [[ -z "$CI" ]]; then
        check_env_vars
    fi

    setup_directories
    setup_ssl
    deploy

    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Application is running at: http://localhost:4000"
    echo "🏥 Health check: http://localhost:4000/health"
    echo "📊 API status: http://localhost:4000/api/status"
    echo ""
    echo "🔧 Useful commands:"
    echo "   View logs: docker compose logs -f"
    echo "   Restart:   docker compose restart"
    echo "   Stop:      docker compose down"
    echo "   Cleanup:   docker compose down -v"
}

# Handle script arguments
case "${1:-deploy}" in
    "check")
        check_env_vars
        ;;
    "ssl")
        setup_ssl
        ;;
    "deploy"|"")
        main
        ;;
    *)
        echo "Usage: $0 [check|ssl|deploy]"
        echo "  check  - Check environment variables"
        echo "  ssl    - Setup SSL certificates"
        echo "  deploy - Full deployment (default)"
        exit 1
        ;;
esac