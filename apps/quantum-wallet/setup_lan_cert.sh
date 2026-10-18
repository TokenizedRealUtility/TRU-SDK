#!/usr/bin/env bash
# Generate a dedicated non-CA HTTPS certificate for the LAN Quantum Wallet.
# This is a SERVER TLS certificate, not a TRU wallet key.
set -euo pipefail
IP="${1:-}"
if [[ ! "$IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo 'Usage: bash apps/quantum-wallet/setup_lan_cert.sh 192.168.1.209' >&2
  exit 2
fi
DIR="$HOME/.tru-quantum-ui/tls"
CRT="$DIR/lan.crt"
KEY="$DIR/lan.key"
if [[ -e "$CRT" || -e "$KEY" ]]; then
  echo "Refusing to overwrite existing certificate/key in $DIR" >&2
  echo 'For renewal, make a verified backup and relocate BOTH files before rerunning.' >&2
  exit 1
fi
command -v openssl >/dev/null || { echo 'OpenSSL is required.' >&2; exit 1; }
umask 077
mkdir -p "$DIR"
chmod 700 "$DIR"
openssl req -x509 -newkey rsa:3072 -sha256 -nodes -days 365 \
  -keyout "$KEY" -out "$CRT" \
  -subj '/CN=TRU Quantum Wallet LAN' \
  -addext "subjectAltName=IP:$IP" \
  -addext 'basicConstraints=critical,CA:FALSE' \
  -addext 'keyUsage=critical,digitalSignature,keyEncipherment' \
  -addext 'extendedKeyUsage=serverAuth'
chmod 600 "$KEY" "$CRT"
echo "Server cert: $CRT"
echo "Server private key: $KEY (KEEP PRIVATE — NEVER COPY TO YOUR MAC)"
openssl x509 -in "$CRT" -noout -dates -ext subjectAltName -fingerprint -sha256
