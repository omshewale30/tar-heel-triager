"""
Simple test script to verify API is working
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health check: {response.status_code} - {response.json()}")

def test_triage_email():
    """Test triage endpoint with sample email"""
    sample_email = {
        "email_id": "test-msg-123",
        "subject": "How do I check my account balance?",
        "body": "Hello, I would like to know how to check my student account balance. Thank you!",
        "sender": "Test Student",
        "sender_email": "student@unc.edu",
        "received_at": "2025-01-15T10:00:00Z"
    }
    
    response = requests.post(
        f"{BASE_URL}/triage-email",
        json=sample_email
    )
    
    print(f"\nTriage response: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(json.dumps(result, indent=2))
        return result
    else:
        print(f"Error: {response.text}")
        return None

def test_approval_queue():
    """Test approval queue endpoint"""
    response = requests.get(f"{BASE_URL}/approval-queue")
    print(f"\nApproval queue: {response.status_code}")
    if response.status_code == 200:
        emails = response.json()
        print(f"Found {len(emails)} pending emails")
        for email in emails:
            print(f"  - {email['subject'][:50]}... ({email['route']})")

if __name__ == "__main__":
    print("Testing API endpoints...\n")
    
    try:
        test_health()
        test_triage_email()
        test_approval_queue()
        
        print("\n✓ All tests completed!")
    except requests.exceptions.ConnectionError:
        print("\n✗ Could not connect to API. Make sure the server is running on port 8000")
    except Exception as e:
        print(f"\n✗ Error: {e}")
