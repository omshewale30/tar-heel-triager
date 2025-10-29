# Quick Start Guide

Get the email triage system running in 10 minutes.

## Step 1: Backend Setup (5 min)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp env.template .env
ssl edit .env  # Add your credentials

# Initialize database
python init_db.py

# Start FastAPI server
python main.py
```

## Step 2: Frontend Setup (3 min)

```bash
# Navigate to frontend (new terminal)
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Step 3: Scheduler (2 min)

```bash
# Start email scheduler (new terminal)
cd backend
source venv/bin/activate
python scheduler.py
```

## Step 4: Access Dashboard

Open your browser: http://localhost:3000

## Testing Without Real Emails

Run the test script to create sample emails:

```bash
cd backend
source venv/bin/activate
python test_api.py
```

## Next Steps

1. Set up Azure AI Foundry Agent (see main README)
2. Configure Microsoft Graph authentication
3. Start with test emails
4. Deploy when ready

## Troubleshooting

- **Port 8000 in use**: Change `BACKEND_URL` in frontend code
- **Azure errors**: Check `.env` credentials
- **No emails**: Make sure scheduler is running
- **Database errors**: Run `python init_db.py` again

陈For help, see the main README.md file.
