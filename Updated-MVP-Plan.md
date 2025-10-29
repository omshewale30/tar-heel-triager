# Updated Email Triage MVP Plan: Using Azure AI Foundry Agent with Knowledge Base

## Major Simplification: What Changes

**Old Plan:** Build RAG pipeline from scratch with vector DB, embeddings, LangChain orchestration
- ~Days 8-11: Setup Pinecone/Chroma, create embeddings, implement RAG pipeline

**New Plan:** Leverage Azure AI Foundry Agent Service with Knowledge Base
- ~Days 5-6: Create knowledge base, configure agent in portal (mostly GUI)
- **Complexity Reduction:** 60-70% less code for RAG component

---

## Updated 4-Week Timeline

### Phase 1: Planning & Data Prep (Days 1-3) - **UNCHANGED**

**1.1 Gather Historical Email Data**
- Collect 50-100 historical student billing emails
- Categorize by type (FAQ, complex, urgent, non-billing)
- Deliverable: CSV with email content, category, priority

**1.2 Create FAQ Knowledge Base**
- Document 15-25 core FAQ questions + answers
- Include policy sources for citations
- **Deliverable:** `faq_database.json` with Q&A pairs and source documents

**1.3 Set Up Development Environment**
```bash
pip install fastapi uvicorn python-multipart
pip install azure-identity azure-ai-projects
pip install openai langchain
pip install python-dotenv pytest
```

---

## Phase 2: Email Ingestion & Classification (Days 4-7) - **SLIGHTLY MODIFIED**

### 2.1 Build Microsoft Graph Email Reader
**File: `backend/email_reader.py`**

- Fetch unread emails from your UNC inbox (unchanged)
- Mark emails as read after processing (unchanged)
- Same async implementation as before

### 2.2 Build Email Classification Model
**File: `backend/classifier.py`**

```python
import openai

class EmailClassifier:
    def __init__(self, api_key):
        openai.api_key = api_key
    
    async def classify_email(self, subject: str, body: str):
        """
        Returns: {
            'category': 'faq_eligible' | 'complex' | 'urgent' | 'non_billing',
            'priority': 1-10,
            'faq_eligible': True/False,  # NEW: Can this be handled by FAQ agent?
            'confidence': 0.92,
            'reason': 'Student asking about balance'
        }
        """
        prompt = f"""
        Classify this student billing email:
        Subject: {subject}
        Body: {body}
        
        Return JSON with: category, priority, faq_eligible, confidence, reason
        
        KEY: 'faq_eligible' should be True if this email asks about common policies:
        - Account balance/charges
        - Payment methods
        - Processing times
        - Fee structure
        - Payment plans
        - Financial holds
        
        Set to False for: disputes, special cases, edge cases requiring human judgment
        """
        response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        return json.loads(response.choices[0].message.content)
```

**Key Change:** Classifier now outputs `faq_eligible` flag to determine if email should go to Foundry Agent vs. manual review.

### 2.3 Priority Scoring System
**File: `backend/priority_scorer.py`**

Same as before - identify urgent keywords, sender type, sentiment. No changes needed.

---

## Phase 3: Azure AI Foundry Agent Setup (Days 5-6) - **NEW & SIMPLIFIED**

### 3.1 Create Knowledge Base in Azure AI Foundry Portal

**Step 1: Upload FAQs**
1. Log into `ai.azure.com` (your existing Azure AI Foundry instance)
2. Go to your project → "Files"
3. Create document from your `faq_database.json`:
   ```json
   {
     "faqs": [
       {
         "question": "How do I check my student account balance?",
         "answer": "Log into Student Accounting Portal at [UNC link] or email cashier@unc.edu",
         "category": "balance_inquiry",
         "sources": ["billing_policy_2025.pdf"]
       }
     ]
   }
   ```
4. Azure AI Search automatically creates embeddings and indexes (no manual work)

**Step 2: Create Agent with Knowledge Base**
1. Go to "Agents" → "+ New Agent"
2. Name it: "Cashier FAQ Agent"
3. Add Knowledge tool:
   - Type: "File search" (for your FAQ documents)
   - Upload your `faq_database.json`
4. Azure AI Foundry handles vectorization automatically ✓
5. Set system prompt:
   ```
   You are a helpful UNC Cashier's Office AI assistant. 
   Answer questions about student billing, payments, and account management.
   Always cite which policy document your answer comes from.
   If unsure, recommend contacting cashier@unc.edu.
   Keep responses professional and concise.
   ```
6. Test in "Playground" (built-in chat interface)
7. Save agent and **copy the Agent ID** (you'll need this)

**Result:** Agent with RAG built-in, zero code written. ✓

### 3.2 Get Agent Credentials

**File: `backend/.env`**

```
# Azure AI Foundry
AZURE_AI_PROJECT_ENDPOINT=https://your-project.api.aip.azure.com
AZURE_AI_PROJECT_CREDENTIAL=your_credential_string
AZURE_AI_FOUNDRY_AGENT_ID=agent-xxxx  # From step 3.1
```

**How to get credentials:**
1. In Azure AI Foundry portal, go to "Project settings"
2. Copy "Project endpoint"
3. Copy "Project connection string" (or authenticate with DefaultAzureCredential)

---

## Phase 4: FastAPI Backend with Agent Integration (Days 7-14) - **GREATLY SIMPLIFIED**

### 4.1 FastAPI Endpoint for Agent Calls

**File: `backend/agent_handler.py`**

```python
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import MessageContentPart
import asyncio

class AzureAIFoundryAgent:
    def __init__(self, project_endpoint: str, agent_id: str):
        self.client = AIProjectClient.from_connection_string(
            conn_str=project_endpoint,
            credential=DefaultAzureCredential()
        )
        self.agent_id = agent_id
    
    async def query_faq_agent(self, email_body: str) -> dict:
        """
        Send email to Azure AI Foundry agent for FAQ response
        Agent handles: vectorization, retrieval, generation, citations
        
        Returns:
        {
            'response': 'The student accounting portal...',
            'sources': ['billing_policy_2025.pdf'],
            'confidence': 0.95
        }
        """
        try:
            # Create a thread (conversation)
            thread = self.client.agents.create_thread()
            
            # Create message in thread
            message = self.client.agents.create_message(
                thread_id=thread.id,
                role="user",
                content=email_body
            )
            
            # Run agent (it will search knowledge base, generate response)
            run = self.client.agents.create_run(
                thread_id=thread.id,
                assistant_id=self.agent_id
            )
            
            # Wait for completion
            max_retries = 30
            while run.status != "completed" and max_retries > 0:
                await asyncio.sleep(1)
                run = self.client.agents.get_run(thread_id=thread.id, run_id=run.id)
                max_retries -= 1
            
            if run.status != "completed":
                raise TimeoutError("Agent response timeout")
            
            # Get response messages
            messages = self.client.agents.list_messages(thread_id=thread.id)
            
            # Extract response (last message from agent)
            response_text = ""
            sources = []
            
            for msg in messages.data:
                if msg.role == "assistant":
                    for content in msg.content:
                        if isinstance(content, MessageContentPart):
                            response_text = content.text
                            # Extract citations from response
                            # Azure automatically adds [doc_name] citations
                            import re
                            sources = re.findall(r'\[(.*?)\]', response_text)
            
            # Clean up thread
            self.client.agents.delete_thread(thread.id)
            
            return {
                'response': response_text,
                'sources': list(set(sources)),  # Unique sources
                'confidence': 0.95 if response_text else 0.0,
                'agent_used': True
            }
        
        except Exception as e:
            return {
                'response': None,
                'error': str(e),
                'agent_used': False
            }

# Initialize agent (done once)
agent = AzureAIFoundryAgent(
    project_endpoint=os.getenv('AZURE_AI_PROJECT_ENDPOINT'),
    agent_id=os.getenv('AZURE_AI_FOUNDRY_AGENT_ID')
)
```

### 4.2 Main Triage Endpoint

**File: `backend/main.py`**

```python
from fastapi import FastAPI, HTTPException
from azure.identity import DefaultAzureCredential
import json

app = FastAPI(title="UNC Cashier Email Triage API")

class EmailTriageRequest(BaseModel):
    email_id: str
    subject: str
    body: str
    sender: str
    received_at: str

class TriageResponse(BaseModel):
    email_id: str
    category: str
    priority: int
    suggested_response: Optional[str]
    confidence: float
    requires_approval: bool
    route: str  # 'auto_faq' | 'manual' | 'urgent'

@app.post("/triage-email", response_model=TriageResponse)
async def triage_email(request: EmailTriageRequest):
    """
    Main endpoint: classify → decide route → generate response if FAQ
    
    Routing logic:
    - HIGH priority (7+): → manual (urgent_queue)
    - Classified as FAQ + eligible: → agent (auto-generates response)
    - Complex/unsure: → manual (complex_queue)
    """
    try:
        # Step 1: Classify email
        classification = await classifier.classify_email(
            request.subject, 
            request.body
        )
        
        # Step 2: Score priority
        priority_data = await priority_scorer.score({
            'subject': request.subject,
            'body': request.body,
            'sender_type': request.sender
        })
        priority = priority_data['priority_level']
        
        # Step 3: Routing decision
        if priority >= 7:
            # URGENT: Send to manual review
            route = 'urgent'
            suggested_response = None
            confidence = 0.0
            
        elif classification['faq_eligible'] and classification['confidence'] > 0.85:
            # FAQ ELIGIBLE: Use Azure AI Foundry Agent
            route = 'auto_faq'
            agent_result = await agent.query_faq_agent(request.body)
            
            if agent_result['agent_used']:
                suggested_response = agent_result['response']
                confidence = agent_result['confidence']
            else:
                # Fallback: agent failed
                route = 'manual'
                suggested_response = None
                confidence = 0.0
        
        else:
            # Complex case: Send to manual review
            route = 'manual'
            suggested_response = None
            confidence = 0.0
        
        # Step 4: Store in approval queue
        approval_record = ApprovalQueue(
            email_id=request.email_id,
            subject=request.subject,
            body=request.body,
            classification=classification['category'],
            priority=priority,
            generated_response=suggested_response,
            route=route,
            confidence=confidence,
            requires_approval=True,
            created_at=datetime.now()
        )
        db.session.add(approval_record)
        db.session.commit()
        
        return TriageResponse(
            email_id=request.email_id,
            category=classification['category'],
            priority=priority,
            suggested_response=suggested_response,
            confidence=confidence,
            requires_approval=True,
            route=route
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/approve-response")
async def approve_response(approval_id: str, staff_edits: str = ""):
    """
    Staff reviews and approves/edits response
    """
    approval = db.session.query(ApprovalQueue).filter_by(id=approval_id).first()
    
    if not approval:
        raise HTTPException(status_code=404, detail="Not found")
    
    # Use staff edits if provided, otherwise use AI-generated response
    final_response = staff_edits if staff_edits else approval.generated_response
    
    # Send via Microsoft Graph
    email = await email_reader.get_email(approval.email_id)
    await email_reader.send_email(
        to=email.sender,
        subject=f"Re: {email.subject}",
        body=final_response,
        in_reply_to=approval.email_id
    )
    
    approval.approved = True
    approval.approved_at = datetime.now()
    approval.final_response = final_response
    db.session.commit()
    
    return {"status": "sent"}

@app.get("/approval-queue")
async def get_approval_queue(route_filter: str = "all"):
    """
    Get pending emails grouped by route
    """
    query = db.session.query(ApprovalQueue).filter_by(approved=False)
    
    if route_filter != "all":
        query = query.filter_by(route=route_filter)
    
    return query.order_by(ApprovalQueue.priority.desc()).all()
```

### 4.3 Background Scheduler

**File: `backend/scheduler.py`**

Same as before - polls emails every 5 minutes, sends to `/triage-email` endpoint.

---

## Phase 5: Next.js Frontend Dashboard (Days 15-20) - **MINOR CHANGES**

### Updated Dashboard Layout

**File: `frontend/pages/dashboard.tsx`**

```typescript
export default function Dashboard() {
  const [pendingEmails, setPendingEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filterRoute, setFilterRoute] = useState('all');  // NEW: filter by route

  useEffect(() => {
    fetch(`/api/approval-queue?route_filter=${filterRoute}`)
      .then(res => res.json())
      .then(data => setPendingEmails(data))
  }, [filterRoute])

  return (
    <div className="grid grid-cols-3 gap-4 p-6">
      {/* Left: Email List with Route Indicators */}
      <div className="col-span-1">
        <div className="mb-4">
          <select value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)}>
            <option value="all">All Emails</option>
            <option value="auto_faq">✓ Auto-FAQ (Ready to Send)</option>
            <option value="manual">⚠ Manual Review Required</option>
            <option value="urgent">🔴 URGENT</option>
          </select>
        </div>
        
        {pendingEmails.map(email => (
          <div 
            key={email.id}
            onClick={() => setSelectedEmail(email)}
            className={`p-3 border rounded mb-2 cursor-pointer ${
              email.route === 'auto_faq' ? 'bg-green-50' :
              email.route === 'urgent' ? 'bg-red-50' :
              'bg-yellow-50'
            }`}
          >
            <div className="text-sm font-semibold">{email.subject}</div>
            <div className="text-xs text-gray-600 mt-1">
              {email.route === 'auto_faq' && '✓ AI-Generated'}
              {email.route === 'manual' && '⚠ Needs Review'}
              {email.route === 'urgent' && '🔴 URGENT'}
            </div>
          </div>
        ))}
      </div>

      {/* Middle: Email & Response Preview */}
      <div className="col-span-1 border-l border-r pl-4 pr-4">
        {selectedEmail && (
          <>
            <EmailPreview email={selectedEmail} />
            
            {/* Route Indicator */}
            <div className={`mt-4 p-3 rounded ${
              selectedEmail.route === 'auto_faq' ? 'bg-green-100 border border-green-400' :
              selectedEmail.route === 'urgent' ? 'bg-red-100 border border-red-400' :
              'bg-yellow-100 border border-yellow-400'
            }`}>
              <p className="text-sm font-bold">
                {selectedEmail.route === 'auto_faq' && '✓ AI-Generated from FAQ Agent'}
                {selectedEmail.route === 'manual' && '⚠ Requires Manual Response'}
                {selectedEmail.route === 'urgent' && '🔴 URGENT - Needs Immediate Attention'}
              </p>
              {selectedEmail.route === 'auto_faq' && (
                <p className="text-xs text-gray-700 mt-1">
                  Confidence: {(selectedEmail.confidence * 100).toFixed(0)}%
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right: Approval Panel */}
      <div className="col-span-1">
        {selectedEmail && (
          <ApprovalPanel 
            email={selectedEmail}
            route={selectedEmail.route}
            onApprove={() => {/* Handle approval */}}
            onReject={() => {/* Handle rejection */}}
          />
        )}
      </div>
    </div>
  )
}
```

### 5.1 Updated ApprovalPanel Component

**File: `frontend/components/ApprovalPanel.tsx`**

```typescript
export default function ApprovalPanel({ email, route, onApprove, onReject }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponse, setEditedResponse] = useState(email.suggested_response);
  const [feedback, setFeedback] = useState("");

  return (
    <div className="bg-white rounded shadow p-6">
      {/* Route-specific UI */}
      {route === 'auto_faq' && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm font-semibold text-green-900">
            ✓ Azure AI Foundry FAQ Agent Response
          </p>
          <p className="text-xs text-green-700 mt-1">
            This response was generated using your FAQ knowledge base.
            You can edit or approve as-is.
          </p>
        </div>
      )}

      {route === 'urgent' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm font-semibold text-red-900">
            🔴 URGENT EMAIL
          </p>
          <p className="text-xs text-red-700 mt-1">
            Please respond to this student/parent as soon as possible.
          </p>
        </div>
      )}

      {route === 'manual' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm font-semibold text-yellow-900">
            ⚠ Manual Response Required
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            This email requires human judgment. Please compose a response.
          </p>
        </div>
      )}

      {/* Suggested Response (if available) */}
      {editedResponse && (
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">
            {route === 'auto_faq' ? 'AI-Generated Response' : 'Suggested Response'}:
          </label>
          {isEditing ? (
            <textarea
              value={editedResponse}
              onChange={(e) => setEditedResponse(e.target.value)}
              className="w-full h-40 p-2 border rounded font-mono text-sm"
            />
          ) : (
            <div className="w-full h-40 p-2 border rounded bg-gray-50 overflow-y-auto text-sm whitespace-pre-wrap">
              {editedResponse}
            </div>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            {isEditing ? 'Done Editing' : 'Edit Response'}
          </button>
        </div>
      )}

      {/* Manual input for complex cases */}
      {route === 'manual' && !editedResponse && (
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Compose Response:</label>
          <textarea
            value={editedResponse}
            onChange={(e) => setEditedResponse(e.target.value)}
            placeholder="Type your response here..."
            className="w-full h-40 p-2 border rounded text-sm"
          />
        </div>
      )}

      {/* Feedback */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Staff Feedback:</label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Was the AI response helpful? Any notes for improvement?"
          className="w-full h-20 p-2 border rounded text-sm"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {(route === 'auto_faq' || route === 'manual') && (
          <button
            onClick={() => handleApprove(editedResponse, feedback)}
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            ✓ Approve & Send
          </button>
        )}
        <button
          onClick={() => onReject()}
          className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
        >
          {route === 'urgent' ? 'Escalate' : 'Flag for Review'}
        </button>
      </div>
    </div>
  );
}
```

---

## Phase 6: Testing & Iteration (Days 21-24) - **SAME**

Same unit tests, integration tests, personal email testing as before.

---

## Updated Database Schema

**Key changes:**
- Add `route` column (auto_faq | manual | urgent)
- Add `agent_used` column (boolean)

```sql
CREATE TABLE approval_queue (
    id UUID PRIMARY KEY,
    email_id VARCHAR(255),
    subject TEXT,
    sender_email VARCHAR(255),
    body TEXT,
    category VARCHAR(50),
    priority_level INT,
    generated_response TEXT,
    final_response TEXT,
    
    -- NEW COLUMNS
    route VARCHAR(20),  -- 'auto_faq' | 'manual' | 'urgent'
    agent_used BOOLEAN DEFAULT FALSE,
    
    approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP,
    rejected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Cost Comparison: Updated Plan

| Component | Cost | Notes |
|-----------|------|-------|
| **Azure AI Foundry Agent** | $0 | Included with your existing instance |
| **Azure AI Search** | $0 | Free tier, handles vectorization |
| **OpenAI API (classification)** | $15-25/mo | GPT-3.5-turbo for email categorization |
| **Microsoft Graph** | $0 | Included with UNC Microsoft 365 |
| **FastAPI hosting** | $0-10/mo | AWS free tier or Azure Container Instances |
| **PostgreSQL DB** | $0-15/mo | AWS RDS free tier or managed |
| **Next.js frontend** | $0 | Vercel free tier |
| **TOTAL** | **$15-50/month** | Down from $30-65 in original plan |

**Key Savings:**
- No vector DB setup costs (Azure AI Foundry handles it)
- No manual embedding generation (Foundry does it)
- No RAG orchestration code (Foundry agent handles it)

---

## Code Architecture: Simplified Flow

```
Email arrives
    ↓
[Email Reader] → fetches from Outlook
    ↓
[Classifier] → categorizes & scores priority
    ↓
Routing Decision:
    ├─ Priority ≥ 7 → [Urgent Queue] → Manual
    ├─ FAQ eligible → [Azure AI Foundry Agent] → Auto-generates response
    └─ Complex → [Manual Queue] → Manual
    ↓
[Approval Queue] → Staff reviews
    ↓
Staff approves/edits
    ↓
[Email Sender] → sends via Microsoft Graph
```

**Vs. Original Plan:**
- Original: Email → Classifier → Priority → FAQ Search (Pinecone) → LangChain RAG → Response Gen → Approval
- **Updated: Email → Classifier → Priority → [Foundry Agent does FAQ Search + Response Gen] → Approval**

---

## Implementation Priority: Updated

### Week 1 (Days 1-7)
- ✓ Data gathering (Days 1-3)
- ✓ Email reader (Days 4-5)
- ✓ Classifier (Days 5-7)

### Week 2 (Days 8-14)
- ✓ Create Foundry Agent + KB (Days 8-9, mostly GUI)
- ✓ FastAPI agent handler + triage endpoint (Days 10-12)
- ✓ Scheduler + approval endpoints (Days 13-14)

### Week 3 (Days 15-20)
- ✓ Next.js dashboard (Days 15-20)

### Week 4 (Days 21-24)
- ✓ Testing + refinement (Days 21-24)

---

## Key Benefits of Updated Plan

**1. Drastically Less Code**
- No RAG implementation needed (~500 lines saved)
- No vector DB management (~300 lines saved)
- Foundry Agent handles knowledge base retrieval, embedding, generation

**2. Production Ready Immediately**
- Foundry Agent is enterprise-grade (GA since May 2025)
- Handles memory, thread management, tool calling
- Integrated monitoring and debugging

**3. Easy Knowledge Base Updates**
- Upload new FAQ documents to Foundry portal
- Agent automatically re-indexes (no code changes)
- Staff can add FAQs without dev team involvement

**4. Better Compliance**
- Azure AI Foundry in your UNC subscription = data sovereignty
- All processing stays within UNC's Azure tenant
- Audit trail built-in

**5. Faster Development**
- Week 1-2: Core system working (not weeks 1-3)
- More time for testing and refinement
- Less technical debt

---

## Migration Path if You Scale

**Today:** Small-scale FAQ agent in Foundry

**Month 2-3:** Add action tools (update payment plans, create billing inquiries)
```python
# Example: Connect email-to-ticket action
@app.post("/foundry-action/create-support-ticket")
async def create_ticket(email_data):
    # Foundry calls your FastAPI endpoint
    # You create ticket in your system
    return {"ticket_id": "..."}
```

**Month 4+:** Multi-agent system
- Email Triage Agent (FAQ handling)
- Billing Disputes Agent (policy research)
- Financial Aid Agent (coordination)
- All orchestrated by Foundry

---

## FAQ Knowledge Base Template

**File: `faq_database.json`** (to upload to Foundry)

```json
{
  "faqs": [
    {
      "id": "balance_inquiry",
      "question": "How do I check my student account balance?",
      "answer": "You can check your balance in three ways:\n1. Log into the Student Accounting Portal at [link]\n2. Call the Cashier's Office at [phone]\n3. Email cashier@unc.edu with your student ID\nYour balance updates daily.",
      "category": "account_management",
      "keywords": ["balance", "owe", "charges", "total"],
      "source": "billing_procedures_2025.pdf"
    },
    {
      "id": "payment_methods",
      "question": "What payment methods do you accept?",
      "answer": "We accept:\n- Credit/Debit cards (Visa, Mastercard, Discover, Amex)\n- Bank transfers (ACH)\n- Wire transfers\n- Checks (mail to [address])\nAll methods process within 2-3 business days.",
      "category": "payments",
      "keywords": ["payment method", "accept", "credit card"],
      "source": "payment_policy_2025.pdf"
    },
    {
      "id": "financial_hold",
      "question": "Why do I have a financial hold on my account?",
      "answer": "Common reasons for holds:\n- Outstanding balance (payment due)\n- Overdue library fines\n- Parking violations\n\nTo resolve: Contact cashier@unc.edu or visit the Cashier's Office in [location]",
      "category": "holds",
      "keywords": ["hold", "blocked", "cannot register"],
      "source": "financial_policy_2025.pdf"
    }
  ]
}
```

---

## Next Steps

1. **Prepare FAQ Database** (Day 1-3)
   - Collect all Q&As and source docs
   - Format as `faq_database.json`

2. **Set Up Foundry Agent** (Day 5-6)
   - Upload FAQ document to Azure AI Foundry Files
   - Create agent with File search tool
   - Test in Playground

3. **Get Agent ID** (Day 6)
   - Copy agent ID from Foundry portal
   - Add to `.env` file

4. **Build FastAPI Integration** (Day 7-12)
   - Implement `agent_handler.py` with agent queries
   - Update `main.py` triage endpoint with routing
   - Test end-to-end

5. **Dashboard & Testing** (Day 13-24)
   - Build Next.js dashboard
   - Test with personal email
   - Deploy to cashier's office

---

## Comparison: What Actually Changed

| Task | Original Plan | Updated Plan | Savings |
|------|---------------|--------------|---------|
| RAG Setup | 4 days | 1 day | 3 days |
| Vector DB | Pinecone/Chroma config | None (Foundry handles) | 2 days |
| Embeddings | Manual implementation | None (Foundry handles) | 1 day |
| Knowledge Search | LangChain + custom code | Foundry agent (built-in) | 2 days |
| Response Generation | OpenAI + templates | Foundry agent (built-in) | 1 day |
| **Total Development** | 24 days | ~20 days | 4 days faster |

---

## Deployment Checklist (Updated)

### Week 1
- [ ] FAQ database created
- [ ] Email reader working
- [ ] Classifier accurate (>85%)
- [ ] .env configured with Foundry Agent ID

### Week 2
- [ ] Foundry Agent created and tested in Playground
- [ ] `agent_handler.py` calling agent successfully
- [ ] Triage endpoint routing correctly
- [ ] Approval queue storing records

### Week 3
- [ ] Dashboard displaying emails and responses
- [ ] Staff can edit/approve responses
- [ ] Emails sending via Microsoft Graph
- [ ] All tests passing

### Week 4
- [ ] Personal email testing (1 week)
- [ ] Cashier's office pilot (ready)
- [ ] Documentation complete
- [ ] Staff training completed