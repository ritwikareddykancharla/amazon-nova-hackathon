#!/bin/bash

echo "🚀 Setting up Amazon Nova Hackathon Project..."

# Backend setup
echo "\n📦 Setting up Backend..."
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# Frontend setup
echo "\n📦 Setting up Frontend..."
cd frontend
npm install
cd ..

# Agent setup (if venv doesn't exist)
echo "\n📦 Checking Agent setup..."
if [ ! -d "agent/.venv" ]; then
    echo "Agent venv not found. Please run 'agentcore create' or set up manually."
fi

echo "\n✅ Setup complete!"
echo "\nNext steps:"
echo "1. Deploy agent: cd agent && agentcore deploy"
echo "2. Start backend: cd backend && source .venv/bin/activate && cd src && python main.py"
echo "3. Start frontend: cd frontend && npm run dev"
