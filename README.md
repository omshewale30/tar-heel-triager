# UNC Cashier Email Triage System

An AI-powered email triage and response system for the UNC Cashier's Office, leveraging Azure AI Foundry Agent with Knowledge Base.

## Overview

This system automatically classifies student billing emails, routes them appropriately, and uses an Azure AI Foundry Agent to generate FAQ responses. Staff review and approve all responses before they're sent.

### Key Features

- 🤖 **AI-Powered Classification**: Automatically categorizes emails (FAQ-eligible, complex, urgent)
- 🎯 **Priority Scoring**: Identifies urgent emails based on keywords and sender type
- 💬 **FAQ Agent**: Uses Azure AI Foundry Agent with knowledge base for automatic response generation
- ✅ **Human-in-the-Loop**: All responses require staff approval before sending
- 📊 **Dashboard**: Clean UI for reviewing and editing responses
- 📧 **Microsoft Graph Integration**: Fetches and sends emails via Office 365

## Project Structure

```
tar-heel-triager/
├── backend/                  # FastAPI backend
│   ├── main.py              # Main API endpoints
│   ├── email_reader.py      # Microsoft Graph email fetching
│   ├── classifier.py        # Email classification with OpenAI
│   ├── priority_scorer.py   # Priority scoring system
│   ├── agent_handler.py     # Azure AI Foundry Agent integration
-domain├── scheduler.py        # Background email polling
│   ├── models.py            # Database models
│   ├── requirements.txt     # Python dependencies
│   └── env.template         # Environment variables template
├── frontend/                # Next.js dashboard
│   ├── pages/
│   │   ├── index.js        # Redirects to dashboard
│   │   └── dashboard.js    # Main dashboard page
│   ├── components/
│   │   └── ApprovalPanel.js # Response approval UI
│   ├── styles/
│   │   └── globals.css     # Tailwind CSS
│   └── package.json
├── faq_database.json        # FAQ knowledge base (upload to Azure)
└── Updated-MVP-Plan.md      # Detailed implementation plan
```

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Azure AI Foundry account with project created
- OpenAI API key
- Microsoft 365 account (UNC email)
- Azure CLI installed and configured

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   cp env.template .env
   ```
   
   Edit `.env` with your credentials:
   ```
   AZURE_AI_PROJECT_ENDPOINT=https://your-project.api.aip.azure.com
   AZURE_AI_FOUNDRY_AGENT_ID=agent-xxxx
   OPENAI_API_KEY=sk-your-key
   ```

5. **Initialize database**:
   ```bash
   python -c "from models import init_db; init_db()"
   ```

6. **Start FastAPI server**:
   ```bash
   python main.py
   # Or with uvicorn directly:
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

7. **Start email scheduler** (in separate terminal):
   ```bash
   python scheduler.py
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**: Navigate to `http://localhost:3000`

### Azure AI Foundry Agent Setup

1. **Prepare FAQ database**:
   - Review and customize `faq_database.json` with your FAQs
   - Add source document references

2. **Upload to Azure AI Foundry**:
   - Log into `ai.azure.com`
   - Go to your project → "Files"
   - Upload `faq_database.json`

3. **Create Agent**:
   - Go to "Agents" → "+ New Agent"
   - Name: "Cashier FAQ Agent"
   - Add Knowledge tool: Select your uploaded FAQ file
   - Set system prompt (see plan document)
   - Test in Playground

4. **Get Agent ID**:
   - Copy the agent ID from the portal
   - Add to backend `.env` file

## Usage

### Email Triage Flow

1. **Email arrives** → Scheduler picks it up
2. **Classification** → OpenAI categorizes the email
3. **Priority scoring** → System calculates urgency
4. **Routing decision**:
   - **Priority 7+** → Urgent queue (manual review)
   - **FAQ-eligible** → Azure AI Foundry Agent generates response
   - **Complex** → Manual queue (staff composes response)
5. **Staff review** → Dashboard displays all pending emails
6. **Approval** → Staff edits (if needed) and approves
7. **Email sent** → System sends via Microsoft Graph

### Dashboard Features

- **Filter by route**: View auto-FAQ, manual, or urgent emails
- **Email preview**: See original email content
- **Edit responses**: Modify AI-generated responses before sending
- **Compose responses**: Write responses for complex cases
- **Feedback**: Provide feedback on AI performance

## API Endpoints

### Backend API (FastAPI)

- `GET /` - Service status
- `GET /health` - Health check
- `POST /triage-email` - Triage an email
- `POST /approve-response` - Approve and send a response
- `GET /approval-queue` - Get pending emails

### Example API Request

```bash
curl -X POST "http://localhost:8000/triage-email" \
  -H "Content-Type: application/json" \
  -d '{
    "email_id": "msg-123",
    "subject": "Account Balance Question",
    "body": "How do I check my balance?",
    "sender": "银秀",
    "sender_email": "student@unc.edu",
    "received_at": "2025-01-15T10:00:00Z"
  }'
```

## Configuration

### Environment Variables

See `backend/env.template` for all configuration options.

**Required**:
- `AZURE_AI_FOUNDRY_AGENT_ID`: Agent ID from Azure portal
- `OPENAI_API_KEY`: OpenAI API key for classification

**Optional**:
- `DATABASE_URL`: Database connection (defaults to SQLite)
- `POLL_INTERVAL_MINUTES`: How often to check emails (default: 5)
- `BACKEND_URL`: FastAPI server URL

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend linting
cd frontend
npm run lint
```

### Database Migrations

SQLite database is created automatically. For PostgreSQL:

1. Update `DATABASE_URL` in `.env`
2. Create database manually
3. Run `models.py` to create tables

## Troubleshooting

### Agent returns mock responses
- Check `AZURE_AI_FOUNDRY_AGENT_ID` in `.env`
- Verify Azure credentials are configured
- Install `azure-ai-projects` SDK

### Emails not being fetched
- Verify Microsoft Graph authentication
- Check `MAILBOX_FOLDER` setting
- Ensure scheduler is running

### Dashboard not loading
- Check backend is running on port 8000
- Update API URL in `dashboard.js` if needed
- Check browser console for errors

## Cost Estimates

| Component | Monthly Cost |
|-----------|-------------|
| Azure AI Foundry Agent | $0 (included) |
| OpenAI API (classification) | $15-25 |
| Microsoft Graph | $0 (included) |
| Hosting (FastAPI) | $0-10 |
| Database | $0-15 |
| Frontend hosting (Vercel) | $0 |
| **Total** | **$15-50/month** |

## Deployment

### Backend Deployment

Options:
- Azure Container Instances
- AWS Lambda + API Gateway
- Heroku
- Digital Ocean

### Frontend Deployment

- **Recommended**: Vercel (free tier)
- Alternative: Netlify, AWS Amplify

## Roadmap

- [ ] Multi-language support
- [ ] Email templates
- [ ] Analytics dashboard
- [ ] Integration with ticketing systems
- [ ] Multi-agent orchestration
- [ ] Advanced routing rules

## Contributing

This is an internal project for UNC Cashier's Office.

## License

Internal use only - UNC Chapel Hill

## Support

For issues or questions, contact the development team.

## References

- [Azure AI Foundry Documentation](https://learn.microsoft.com/en-us/azure/ai-studio/)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
