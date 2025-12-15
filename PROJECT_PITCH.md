# UNC Cashier's Office Email Triage System
## Project Pitch


## The Problem

The UNC Cashier's Office receives hundreds of student billing emails every week. Staff members spend countless hours:
- Reading through every email manually
- Answering the same questions repeatedly (balance inquiries, payment methods, deadlines)
- Identifying which emails need immediate attention
- Composing responses from scratch for common questions

**This manual process is time-consuming, prone to delays, and prevents staff from focusing on complex cases that truly need human expertise.**

---

## The Solution

An intelligent email management system that automatically:
1. **Reads incoming emails** from the Cashier's Office inbox
2. **Understands what students are asking** using artificial intelligence
3. **Prioritizes urgent requests** so time-sensitive issues get immediate attention
4. **Generates accurate responses** for common questions using UNC's official policies
5. **Presents everything to staff** in a simple dashboard for quick review and approval

**Think of it as a smart assistant that does the heavy lifting, while staff maintain full control over what gets sent to students.**

---

## Key Features

### 🤖 Intelligent Email Classification
- Automatically categorizes emails as FAQ, urgent, or complex
- Identifies keywords like "deadline," "urgent," or "payment due" to flag time-sensitive requests
- Routes simple questions to AI, complex issues to staff

### 💡 AI-Powered Response Generation
- Uses Microsoft's Azure AI with a custom knowledge base of UNC billing policies
- Generates professional, accurate responses for common questions:
  - "How do I check my balance?"
  - "What payment methods do you accept?"
  - "Why do I have a financial hold?"
- Always cites the official policy document used (transparency and accuracy)

### 📊 Staff Dashboard
- Clean, color-coded interface showing all pending emails
- **Green**: AI-generated response ready for quick approval
- **Red**: Urgent email needing immediate staff attention
- **Yellow**: Complex case requiring manual response
- One-click approval to send responses
- Easy editing if AI response needs adjustment

### ⏱️ Automated Monitoring
- Checks for new emails every 5 minutes
- No manual email checking required
- Processes emails 24/7, even outside office hours

### 📈 Efficiency Tracking
- Records which responses were helpful
- Learns from staff feedback to improve over time
- Provides metrics on email volume, response times, and AI accuracy

---

## Expected Impact

### Time Savings
- **Estimated 60-70% reduction** in time spent on routine email responses
- Staff can respond to 3-4x more emails in the same time
- Faster response times for students (minutes instead of hours/days)

### Improved Service Quality
- **Consistent, accurate responses** based on official UNC policies
- **No more missed urgent emails** - automatic prioritization ensures critical issues surface immediately
- **Reduced errors** - AI always uses current policy information

### Staff Empowerment
- Staff focus on complex cases requiring human judgment
- Less repetitive work, more meaningful student interactions
- Better work-life balance with reduced email backlog

### Student Experience
- Faster responses to common questions
- Consistent information regardless of which staff member responds
- 24/7 email processing means no delays during busy periods

---

## Security & Compliance

**We take student data protection seriously. This system is built with security at its core:**

### 🔒 Authentication & Access Control
- **UNC credentials only** - Staff must log in with their UNC email and password
- **Multi-factor authentication** required for access
- **No external access** - System restricted to authorized Cashier's Office personnel only

### 🛡️ Data Protection
- **All data stays within UNC's Azure environment** - No third-party cloud services
- **Encrypted communications** - All data transmitted using bank-level encryption (TLS 1.3)
- **Encrypted storage** - Student emails encrypted in database at rest
- **Automatic data retention** - Old emails automatically deleted after 90 days (approval queue) and 2 years (history)

### 📋 FERPA Compliance
- Student email content treated as protected education records
- **Complete audit trail** - Every email access logged with timestamp and staff member
- **No data sharing** - Student information never leaves UNC systems
- **Human oversight required** - All AI-generated responses reviewed by staff before sending

### 🔐 Credential Management
- **Azure Key Vault** stores all passwords and API keys securely
- **No credentials in code** - All sensitive information stored separately
- **Managed identities** - System components authenticate without storing passwords

### 📊 Monitoring & Alerts
- **Real-time security monitoring** using Azure's enterprise tools
- **Automatic alerts** for suspicious activity or system issues
- **Regular security assessments** built into deployment process

---

## Technology Stack

**Built entirely on UNC's existing Microsoft Azure infrastructure:**

- **Microsoft Azure AI** - Enterprise-grade artificial intelligence (already licensed by UNC)
- **Microsoft Graph** - Connects to UNC Outlook email (already in use)
- **Azure SQL Database** - Secure, reliable data storage (UNC standard)
- **Azure Authentication** - Uses existing UNC login system (no new passwords)

**Benefits of using Azure:**
- Leverages UNC's existing Microsoft licenses (cost-effective)
- Meets UNC IT security standards out-of-the-box
- Supported by UNC's IT infrastructure team
- Complies with university data governance policies

---

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- Set up Azure resources and security
- Build email reading and classification system
- Configure AI with UNC billing policies

### Phase 2: Dashboard & Testing (Weeks 3-4)
- Build staff dashboard interface
- Test with sample emails
- Refine AI responses based on feedback

### Phase 3: Pilot Launch (Week 5)
- Deploy to 2-3 staff members for real-world testing
- Gather feedback and make adjustments
- Monitor system performance

### Phase 4: Full Rollout (Week 6+)
- Train all Cashier's Office staff
- Go live with full email volume
- Ongoing monitoring and improvements

**Total time to launch: 6-8 weeks**

---

## Cost Analysis

### One-Time Setup Costs
- Development: 6-8 weeks (can be student developer or IT staff)
- Azure resource setup: Minimal (uses existing UNC infrastructure)

### Monthly Operating Costs
- **Azure AI services**: $15-25/month (classification and AI responses)
- **Azure hosting**: $40-60/month (database and web hosting)
- **Total: $80-110/month** - Less than the cost of 4 hours of staff time

### Return on Investment
If the system saves just **10 hours per week** of staff time:
- Annual time savings: 520 hours
- At $30/hour: **$15,600 annual savings**
- **ROI: System pays for itself in the first week**

---

## Risk Mitigation

### "What if the AI makes a mistake?"
- **Human oversight required** - Every AI response reviewed by staff before sending
- Staff can edit any response before approval
- System learns from corrections to improve accuracy

### "What if the system goes down?"
- **Fallback to manual process** - Staff can always access Outlook directly
- **Monitoring and alerts** - IT notified immediately of any issues
- **99.9% uptime** guaranteed by Azure's enterprise infrastructure

### "What about student privacy?"
- **FERPA compliant by design** - Built following university data protection standards
- **Audit trail** - Complete record of who accessed what and when
- **Data minimization** - Only stores necessary information, auto-deletes old data

### "Will this replace staff jobs?"
- **No** - This is a productivity tool, not a replacement
- Staff remain essential for complex cases, policy decisions, and student interactions
- Frees staff to provide better service on cases that need human judgment

---

## Success Metrics

We'll measure success by tracking:

1. **Response Time**: Average time from email received to response sent
2. **Email Volume**: Number of emails processed per staff member per day
3. **AI Accuracy**: Percentage of AI responses approved without edits
4. **Staff Satisfaction**: Feedback from Cashier's Office team
5. **Student Satisfaction**: Reduced follow-up emails, faster resolutions

**Target: 60% of routine emails handled with minimal staff intervention within 3 months**

---

## Next Steps


### Pilot Program:
- Start with 2-3 volunteer staff members
- Process 1-2 weeks of emails
- Gather feedback and refine
- Expand to full team



---

## Contact

**Project Lead:** Om Shewale

**Email:** oshewale@unc.edu



**Ready to transform the Cashier's Office email workflow and give staff their time back.**

---

*This system represents a smart investment in staff productivity, student service, and operational efficiency - all while maintaining the highest standards of security and compliance.*
