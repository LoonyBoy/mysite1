#!/usr/bin/env bash
set -euo pipefail
# Non-interactive GlobalSign certificate installer for loonyboss.com
# Requires three local files placed in the same directory before execution:
#  - leaf.crt (CN=www.loonyboss.com)
#  - intermediate.pem (GlobalSign GGC R3 DV TLS CA 2020)
#  - private.key (RSA private key)
# Usage:
#   scp leaf.crt intermediate.pem private.key root@SERVER:/root/
#   scp deploy/install-globalsign-cert.sh root@SERVER:/root/
#   ssh root@SERVER "bash /root/install-globalsign-cert.sh"

CERT_DIR=/etc/ssl/certs
KEY_DIR=/etc/ssl/private
NCONF=/etc/nginx/sites-available/loonyboss.conf
DOMAIN_BASE=loonyboss.com
LEAF_SRC=${LEAF_SRC:-leaf.crt}
INT_SRC=${INT_SRC:-intermediate.pem}
KEY_SRC=${KEY_SRC:-private.key}

err() { echo "[cert] ERROR: $*" >&2; exit 1; }

[[ -f $LEAF_SRC ]] || err "Leaf certificate $LEAF_SRC not found"
[[ -f $INT_SRC ]] || err "Intermediate $INT_SRC not found"
[[ -f $KEY_SRC ]] || err "Key $KEY_SRC not found"

echo "[cert] Installing certificates to $CERT_DIR and $KEY_DIR"
mkdir -p "$CERT_DIR" "$KEY_DIR"
chmod 700 "$KEY_DIR"
cp "$LEAF_SRC" "$CERT_DIR/loonyboss-rsa.crt"
cp "$INT_SRC" "$CERT_DIR/globalsign-dv-r3-2020.pem"
cp "$KEY_SRC" "$KEY_DIR/loonyboss-rsa.key"
chmod 600 "$KEY_DIR/loonyboss-rsa.key"
chmod 644 "$CERT_DIR/loonyboss-rsa.crt" "$CERT_DIR/globalsign-dv-r3-2020.pem"

cat "$CERT_DIR/loonyboss-rsa.crt" "$CERT_DIR/globalsign-dv-r3-2020.pem" > "$CERT_DIR/loonyboss-rsa-fullchain.pem"
chmod 644 "$CERT_DIR/loonyboss-rsa-fullchain.pem"

echo "[cert] Verifying key matches certificate"
if command -v openssl >/dev/null 2>&1; then
  C1=$(openssl x509 -noout -modulus -in "$CERT_DIR/loonyboss-rsa.crt" | openssl md5 | awk '{print $2}')
  C2=$(openssl rsa -noout -modulus -in "$KEY_DIR/loonyboss-rsa.key" | openssl md5 | awk '{print $2}')
  if [[ "$C1" != "$C2" ]]; then
    err "Modulus mismatch between cert and key"
  else
    echo "[cert] Modulus OK ($C1)"
  fi
else
  echo "[cert] openssl not found, skipping modulus check"
fi

echo "[cert] Writing nginx config $NCONF"
cat > "$NCONF" <<NGINX
server {
  listen 80;
  server_name $DOMAIN_BASE www.$DOMAIN_BASE;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name $DOMAIN_BASE www.$DOMAIN_BASE;

  ssl_certificate     $CERT_DIR/loonyboss-rsa-fullchain.pem;
  ssl_certificate_key $KEY_DIR/loonyboss-rsa.key;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_session_timeout 1d;
  ssl_session_cache shared:SSL:10m;
  ssl_session_tickets off;
  ssl_stapling on;
  ssl_stapling_verify on;
  resolver 1.1.1.1 8.8.8.8 valid=300s;
  resolver_timeout 5s;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options DENY;
  add_header Referrer-Policy strict-origin-when-cross-origin;
  add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";

  location / {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
NGINX

ln -sf "$NCONF" /etc/nginx/sites-enabled/loonyboss.conf

# Remove default if exists
if [[ -f /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default
fi

nginx -t && systemctl reload nginx

echo "[cert] Deployed. Test: openssl s_client -connect $DOMAIN_BASE:443 -servername $DOMAIN_BASE | openssl x509 -noout -subject -issuer -dates"
echo "[cert] curl -I https://$DOMAIN_BASE"
