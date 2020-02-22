#!/usr/bin/env bash
cd "$(dirname "$0")"
cd ../

mkdir -p cert

openssl req -x509 -nodes -days 7300 -newkey rsa:2048 -keyout cert/key.pem -out cert/cert.pem -subj "/C=PE/ST=Lima/L=Lima/O=Acme Inc. /OU=IT Department/CN=acme.com"