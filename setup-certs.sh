#!/bin/bash
set -e

CERTS_DIR="$(cd "$(dirname "$0")" && pwd)/certs"
mkdir -p "$CERTS_DIR"

echo "Generating root CA..."
openssl req -x509 -new -nodes -newkey rsa:2048 \
  -keyout "$CERTS_DIR/ca.key" \
  -out "$CERTS_DIR/ca.crt" \
  -days 365 \
  -subj "/CN=Claude Proxy CA" 2>/dev/null

echo "Generating server certificate..."
openssl genrsa -out "$CERTS_DIR/server.key" 2048 2>/dev/null

cat > "$CERTS_DIR/san.cnf" << 'EOF'
[req]
default_bits = 2048
prompt = no
distinguished_name = dn
req_extensions = v3_req

[dn]
CN = claude.ai

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = claude.ai
DNS.2 = *.claude.ai
DNS.3 = anthropic.com
DNS.4 = *.anthropic.com
EOF

openssl req -new \
  -key "$CERTS_DIR/server.key" \
  -out "$CERTS_DIR/server.csr" \
  -config "$CERTS_DIR/san.cnf" 2>/dev/null

openssl x509 -req \
  -in "$CERTS_DIR/server.csr" \
  -CA "$CERTS_DIR/ca.crt" \
  -CAkey "$CERTS_DIR/ca.key" \
  -CAcreateserial \
  -out "$CERTS_DIR/server.crt" \
  -days 365 \
  -extfile "$CERTS_DIR/san.cnf" \
  -extensions v3_req 2>/dev/null

echo ""
echo "Certificates generated in $CERTS_DIR/"
echo ""
echo "Now trust the CA in macOS Keychain (requires sudo):"
echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERTS_DIR/ca.crt"
