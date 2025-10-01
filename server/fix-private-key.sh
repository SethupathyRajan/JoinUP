#!/bin/bash

echo "🔧 Fixing Firebase private key format..."

# Backup original .env
cp .env .env.backup

# Ask user to paste the private key properly
echo "Please follow these steps:"
echo "1. Open your Firebase service account JSON file"
echo "2. Copy the private_key value (the long string between quotes)"
echo "3. Paste it below when prompted"
echo ""
echo "The key should start with: -----BEGIN PRIVATE KEY-----"
echo "The key should end with: -----END PRIVATE KEY-----"
echo ""

read -p "Paste your private key here: " PRIVATE_KEY

# Clean and format the private key
CLEAN_KEY=$(echo "$PRIVATE_KEY" | tr -d '"' | sed 's/\\n/\n/g')

# Update .env file
sed -i '/FIREBASE_PRIVATE_KEY=/d' .env
echo "FIREBASE_PRIVATE_KEY=\"$CLEAN_KEY\"" >> .env

echo "✅ Private key updated in .env file"
echo "🔄 Try starting the server now with: npm run dev"
