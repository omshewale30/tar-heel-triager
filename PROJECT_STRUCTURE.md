# Project Structure

Complete file tree and descriptions for the UNC Cashier Email Triage System.

```
tar-heel-triager/
│
├── backend/                          # FastAPI Backend
│   ├── agent_handler.py             # Azure AI Foundry Agent integration
│   ├── classifier.py                # Email classification using OpenAI
│   ├── email_reader.py              # Microsoft Graph email fetching
│   ├── env.template                 # Environment variables template
│   ├── init_db.py                   # Database initialization script
│   ├── main.py                      # FastAPI app with triage endpoints
│   ├── models.py                    # SQLAlchemy database models
│   ├── priority_scorer.py           # Priority scoring system
│   ├── requirements.txt             # Python dependencies
│   ├── scheduler.py                 # Background email polling
│   └── test_api.py                  # API testing script
│
├── frontend/                         # Next.js Frontend
│   ├── components/
│   │   └── ApprovalPanel.js        # Response approval UI component
│   ├── pages/
|   |   |-- landing.js              #User lands on this page (from here user can login, use Azure MSAL auth to let users sign)
│   │   ├── _app.js                 # Next.js app wrapper
│   │   ├── dashboard.js            # Main dashboard page
│   │   └── index.js                # Redirect to dashboard
│   ├── styles/
│   │   └── globals.css             # Global Tailwind CSS styles
│   ├── .eslintrc.json              # ESLint configuration
│   ├── next.config.js              # Next.js configuration
│   ├── package.json                # Node.js dependencies
│   ├── postcss.config.js           # PostCSS configuration
│   └── tailwind.config.js          # Tailwind CSS configuration
│
├── faq_database.json                # FAQ knowledge base for Azure
├── Updated-MVP-Plan.md              # Detailed implementation plan
├── README.md                        # Project documentation
├── QUICKSTART.md                    # Quick start guide
├── PROJECT_STRUCTURE.md             # This file
├── setup.sh                         # Automated setup script
└── .gitignore                       # Git ignore rules
```

## Backend Files

### Core Files

- **main.py**: FastAPI application with triage endpoints
  - `/triage-email` - Main email triage endpoint
  - `/approve-response` - Approve and send responses
  - `/approval-queue` - Get pending emails
  - Health and status endpoints

- **email_reader.py**: Microsoft Graph integration
  - Fetch unread emails from mailbox
  - Mark emails as read
  - Send email responses
  - Uses DefaultAzureCredential for auth

- **classifier.py**: Email classification with OpenAI
  - Categorizes emails (FAQ, complex, urgent, non-billing)
  - Determines FAQ eligibility
  - Returns confidence scores

- **priority_scorer.py**: Priority scoring system
  - Keyword-based urgency detection
  - Sender type analysis
  - Sentiment analysis
  - Returns priority level (1-10)

- **agent_handler.py**: Azure AI Foundry Agent integration
  - Queries FAQ agent with email content
  - Extracts response and citations
  - Falls back to mock responses if not configured

- **scheduler.py**: Background email processing
  - Polls for new emails every 5 minutes
  - Sends to triage endpoint
  - Marks emails as read after processing

- **models.py**: Database models
  - `ApprovalQueue` - Pending email approvals
  - `EmailHistory` - Processed email log
  - Uses SQLAlchemy ORM

### Utility Files

- **init_db.py**: Database initialization script
- **test_api.py**: API testing script
- **env.template**: Environment variables template
- **requirements.txt**: Python dependencies

## Frontend Files

### Pages

- **index.js**: Redirects to dashboard
- **dashboard.js**: Main triage dashboard
  - Email list with route indicators
  - Email preview
  - Filter by route (FAQ, manual, urgent)
  - Click to select emails

- **ApprovalPanel.js**: Response approval component
  - Route-specific UI indicators
  - Edit AI-generated responses
  - Compose responses for complex cases
  - Staff feedback input
  - Approve/reject actions

### Configuration

- **package.json**: Node.js dependencies
- **tailwind.config.js**: Tailwind CSS configuration
- **next.config.js**: Next.js configuration
- **postcss.config.js**: PostCSS configuration
- **globals.css**: Global styles with Tailwind

## Data Files

- **faq_database.json**: FAQ knowledge base
  - Q&A pairs for Azure AI Foundry
  - Categories and keywords
  - Source document references
  - Upload to Azure portal

## Documentation

- **README.md**: Complete project documentation
- **QUICKSTART.md**: 10-minute setup guide
- **Updated-MVP-Plan.md**: Detailed implementation plan
- **PROJECT_STRUCTURE.md**: This file

## Configuration

- **setup.sh**: Automated setup script
- **.gitignore**: Git ignore patterns
- **backend/env.template**: Environment variables template

## How It All Connects

```
Email arrives (Microsoft Graph)
    ↓
Scheduler polls every 5 minutes
    ↓
EmailReader fetches unread emails
    ↓
Main API receives triage request
    ↓
Classifier categorizes email
    ↓
PriorityScorer calculates urgency
    ↓
Routing decision:
    ├─ High priority → Urgent queue (manual)
    ├─ FAQ eligible → AgentHandler → Azure AI Foundry Agent
    └─ Complex → Manual queue
    ↓
Stored in ApprovalQueue database
    ↓
Dashboard displays pending emails
    ↓
Staff approves/edits response
    ↓
EmailReader sends response
    ↓
Logged in EmailHistory
```

## Next Steps After Setup

1. Configure `.env` with API keys
2. Set up Azure AI Foundry Agent
3. Test with sample emails
4. Configure production deployment
5. Train staff on dashboard usage
