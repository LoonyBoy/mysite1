#!/bin/bash
# Server setup script for Ubuntu 24.04
# Run as root on the server

set -euo pipefail

echo "=== Starting server setup ==="

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git ufw nginx mysql-server

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Create application user
if ! id "appuser" &>/dev/null; then
    adduser --disabled-password --gecos "" appuser
    usermod -aG sudo appuser
    echo "appuser ALL=(ALL) NOPASSWD: /bin/systemctl restart portfolio, /bin/systemctl reload nginx, /bin/systemctl daemon-reload" >> /etc/sudoers.d/appuser
fi

# Setup firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Create swap if none exists
if [ $(swapon --show | wc -l) -eq 0 ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Setup MySQL
mysql_secure_installation <<EOF

y
StrongMySQLPassword123!
StrongMySQLPassword123!
y
y
y
y
EOF

# Create database and user
mysql -u root -pStrongMySQLPassword123! <<EOF
CREATE DATABASE IF NOT EXISTS space_invaders CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'portfolio'@'localhost' IDENTIFIED BY 'PortfolioDBPass2024!';
GRANT ALL PRIVILEGES ON space_invaders.* TO 'portfolio'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "=== Basic server setup completed ==="
echo "Next steps:"
echo "1. Switch to appuser: su - appuser"
echo "2. Clone repository"
echo "3. Setup environment and deploy"

echo "=== (Optional) Install provided GlobalSign certificate ==="
echo "If you have your certificate files locally (leaf cert + intermediate + key), you can paste them now."
read -p "Install custom GlobalSign certificate now? (y/N): " INST_CERT || true
if [[ "${INST_CERT}" =~ ^[Yy]$ ]]; then
    CERT_DIR=/etc/ssl/certs
    KEY_DIR=/etc/ssl/private
    mkdir -p "$CERT_DIR" "$KEY_DIR"
    chmod 700 "$KEY_DIR"

    echo "Paste LEAF certificate (BEGIN..END), then EOF (Ctrl+D):"
    LEAF_TMP=$(mktemp)
    cat > "$LEAF_TMP"
    if ! grep -q "BEGIN CERTIFICATE" "$LEAF_TMP"; then
        echo "No certificate block detected, skipping."; rm -f "$LEAF_TMP"; else
        mv "$LEAF_TMP" "$CERT_DIR/loonyboss-rsa.crt"
        echo "Saved leaf cert to $CERT_DIR/loonyboss-rsa.crt"
    fi

    echo "Paste INTERMEDIATE certificate (GlobalSign DV R3 2020), then EOF (Ctrl+D):"
    INT_TMP=$(mktemp)
    cat > "$INT_TMP"
    if ! grep -q "BEGIN CERTIFICATE" "$INT_TMP"; then
        echo "No intermediate block detected, skipping."; rm -f "$INT_TMP"; else
        mv "$INT_TMP" "$CERT_DIR/globalsign-dv-r3-2020.pem"
        echo "Saved intermediate to $CERT_DIR/globalsign-dv-r3-2020.pem"
    fi

    echo "Paste PRIVATE KEY (BEGIN RSA PRIVATE KEY), then EOF (Ctrl+D):"
    KEY_TMP=$(mktemp)
    cat > "$KEY_TMP"
    if ! grep -q "BEGIN RSA PRIVATE KEY" "$KEY_TMP"; then
        echo "No RSA private key detected, aborting key install."; rm -f "$KEY_TMP"; else
        mv "$KEY_TMP" "$KEY_DIR/loonyboss-rsa.key"
        chmod 600 "$KEY_DIR/loonyboss-rsa.key"
        echo "Saved key to $KEY_DIR/loonyboss-rsa.key"
    fi

    if [[ -f "$CERT_DIR/loonyboss-rsa.crt" && -f "$CERT_DIR/globalsign-dv-r3-2020.pem" ]]; then
        cat "$CERT_DIR/loonyboss-rsa.crt" "$CERT_DIR/globalsign-dv-r3-2020.pem" > "$CERT_DIR/loonyboss-rsa-fullchain.pem"
        chmod 644 "$CERT_DIR"/loonyboss-rsa*.pem "$CERT_DIR"/loonyboss-rsa.crt 2>/dev/null || true
        echo "Fullchain created at $CERT_DIR/loonyboss-rsa-fullchain.pem"
    fi

    # Quick modulus check if possible
    if command -v openssl >/dev/null 2>&1 && [[ -f "$CERT_DIR/loonyboss-rsa.crt" && -f "$KEY_DIR/loonyboss-rsa.key" ]]; then
        C1=$(openssl x509 -noout -modulus -in "$CERT_DIR/loonyboss-rsa.crt" 2>/dev/null | openssl md5 | awk '{print $2}')
        C2=$(openssl rsa  -noout -modulus -in "$KEY_DIR/loonyboss-rsa.key" 2>/dev/null | openssl md5 | awk '{print $2}')
        if [[ -n "$C1" && "$C1" == "$C2" ]]; then
            echo "Key matches certificate (modulus md5 $C1)"
        else
            echo "WARNING: Key and certificate modulus mismatch" >&2
        fi
    fi

    NCONF=/etc/nginx/sites-available/loonyboss.conf
    if [[ ! -f "$NCONF" ]]; then
        cat > "$NCONF" <<NGINX
server {
    listen 80;
    server_name loonyboss.com www.loonyboss.com;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name loonyboss.com www.loonyboss.com;

    ssl_certificate     $CERT_DIR/loonyboss-rsa-fullchain.pem;
    ssl_certificate_key $KEY_DIR/loonyboss-rsa.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 8.8.8.8 valid=300s;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";

    location / {
        proxy_pass http://127.0.0.1:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX
        ln -sf "$NCONF" /etc/nginx/sites-enabled/loonyboss.conf
    fi
    nginx -t && systemctl reload nginx || echo "Nginx reload failed" >&2
    echo "Custom certificate installation attempted. Verify with: openssl s_client -connect loonyboss.com:443 -servername loonyboss.com | openssl x509 -noout -subject -issuer" 
fi

echo "=== Optional certificate section finished ==="
