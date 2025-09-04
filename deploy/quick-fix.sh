#!/bin/bash
# Быстрый фикс для деплоя
# Запускать как root

set -euo pipefail

echo "=== Быстрое исправление деплоя ==="

# 1. Установка Node.js если его нет
if ! command -v node &> /dev/null; then
    echo "Устанавливаем Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# 2. Создание пользователя если его нет
if ! id "appuser" &>/dev/null; then
    echo "Создаем пользователя appuser..."
    adduser --disabled-password --gecos "" appuser
    usermod -aG sudo appuser
    echo "appuser ALL=(ALL) NOPASSWD: /bin/systemctl restart portfolio, /bin/systemctl reload nginx, /bin/systemctl daemon-reload" >> /etc/sudoers.d/appuser
fi

# 3. Клонирование приложения если его нет
if [ ! -d "/home/appuser/app" ]; then
    echo "Клонируем приложение..."
    su - appuser -c "git clone https://github.com/LoonyBoy/mysite1.git /home/appuser/app"
fi

# 4. Настройка базы данных
echo "Настраиваем MySQL..."
if ! mysql -u root -e "USE space_invaders;" 2>/dev/null; then
    mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS space_invaders CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'portfolio'@'localhost' IDENTIFIED BY 'PortfolioDBPass2024!';
GRANT ALL PRIVILEGES ON space_invaders.* TO 'portfolio'@'localhost';
FLUSH PRIVILEGES;
EOF
fi

# 5. Создание .env файла
echo "Создаем .env файл..."
su - appuser -c "cat > /home/appuser/app/.env <<EOF
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=portfolio
DB_PASSWORD=PortfolioDBPass2024!
DB_NAME=space_invaders
VITE_SCORES_API=http://83.166.247.169
TG_BOT_TOKEN=123456:YOUR_TELEGRAM_BOT_TOKEN
TG_CHAT_ID=123456789
EOF"

# 6. Сборка приложения
echo "Собираем приложение..."
su - appuser -c "cd /home/appuser/app && npm ci && npm run build"

# 7. Создание systemd сервиса
echo "Создаем systemd сервис..."
cat > /etc/systemd/system/portfolio.service <<EOF
[Unit]
Description=Portfolio React + API
After=network.target mysql.service
Wants=network-online.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/home/appuser/app
Environment=NODE_ENV=production
EnvironmentFile=/home/appuser/app/.env
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=5
KillSignal=SIGINT
TimeoutStartSec=30

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable portfolio
systemctl start portfolio

# 8. Настройка Nginx
echo "Настраиваем Nginx..."
cat > /etc/nginx/sites-available/portfolio <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
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

# Удаляем дефолтный сайт и активируем наш
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

echo "=== Проверка результата ==="
systemctl status portfolio --no-pager -l
echo ""
echo "Тестируем API:"
sleep 3
curl -f http://localhost:4000/api/health 2>/dev/null && echo "✅ API работает" || echo "❌ API не отвечает"

echo ""
echo "🎉 Деплой завершен!"
echo "Сайт должен быть доступен по адресу: http://83.166.247.169"
