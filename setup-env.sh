#!/bin/bash

echo "====================================="
echo "Setting up BharatTrip AI Environment"
echo "====================================="
echo ""

cd backend

if [ -f .env ]; then
    echo ".env file already exists!"
    echo ""
    read -p "Do you want to overwrite it? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

echo "Creating .env file from env.config..."
cp env.config .env

if [ -f .env ]; then
    echo "✓ .env file created successfully!"
    echo ""
    echo "Your API keys have been configured:"
    echo "- OpenAI API: Configured"
    echo "- Weather API: Configured"
    echo "- Google Maps API: Configured"
    echo ""
    echo "IMPORTANT SECURITY NOTES:"
    echo "1. Never share or commit your .env file"
    echo "2. Keep your API keys secret"
    echo "3. Consider regenerating API keys after development"
    echo ""
else
    echo "✗ Failed to create .env file"
    echo "Please manually rename env.config to .env"
fi

cd ..
echo ""
