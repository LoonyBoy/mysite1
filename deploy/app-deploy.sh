#!/bin/bash
# Application deployment script
# Run as appuser on the server

set -euo pipefail

SERVER_IP="83.166.247.169"
DOMAIN="${DOMAIN:-portfolio.loonyboy.dev}"  # Change this to your actual domain

echo "=== Deploying application ==="

# Clone repository (you'll need to create GitHub repo first)
if [ ! -d "/home/appuser/app" ]; then
    echo "Cloning repository..."
    # Replace with your actual GitHub repo URL
    git clone https://github.com/LoonyBoy/mysite1.git /home/appuser/app
    cd /home/appuser/app
else
    echo "Repository exists, updating..."
    cd /home/appuser/app
    git pull origin main
fi

# Create .env file
cat > .env <<EOF
# Server (scores API)
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=portfolio
DB_PASSWORD=PortfolioDBPass2024!
DB_NAME=space_invaders

# Frontend
VITE_SCORES_API=https://$DOMAIN

# Lead submission (Telegram bot)
# TODO: Add your actual bot token and chat ID
TG_BOT_TOKEN=123456:YOUR_TELEGRAM_BOT_TOKEN
TG_CHAT_ID=123456789
EOF

echo "Created .env file. Please update TG_BOT_TOKEN and TG_CHAT_ID manually."

# Install dependencies and build
npm ci --omit=dev
npm run build

# Setup systemd service
sudo cp deploy/portfolio.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable portfolio
sudo systemctl start portfolio

# Setup Nginx
sudo tee /etc/nginx/sites-available/portfolio <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN $SERVER_IP;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Proxy to Node.js app
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo "=== Deployment completed ==="
echo "Application should be available at:"
echo "- http://$SERVER_IP"
echo "- http://$DOMAIN (if DNS is configured)"
echo ""
echo "Next steps:"
echo "1. Configure DNS to point to $SERVER_IP"
echo "2. Install SSL: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "3. Update Telegram bot credentials in .env"
echo "4. Test: curl http://$SERVER_IP/api/health"
