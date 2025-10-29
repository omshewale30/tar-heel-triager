#!/bin/bash

echo "🚀 Setting up Tar-Heel Triager..."
echo ""

# Backend setup
echo "📦 Backend setup..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp env.template .env
    echo "⚠️  Please edit backend/.env with your credentials"
fi

# Initialize database
echo "Initializing database..."
python init_db.py

cd ..

# Frontend setup
echo ""
echo "🎨 Frontend setup..."
cd frontend

# Install dependencies
echo "Installing Node dependencies..."
npm install

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your API keys"
echo "2. Start backend: cd backend && source venv/bin/activate && python main.py"
echo "3. Start scheduler: cd backend && source venv/bin/activate && python scheduler.py"
echo "4. Start frontend: cd frontend && npm run dev"
echo ""
echo "📖 See QUICKSTART.md for more details"
