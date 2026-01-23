/*
This file contains the API calls for the frontend
*/



export const rejectResponse = async (approvalId) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reject-response`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            approval_id: approvalId
        })
    });
    return response;
};

export const getApprovalQueue = async ( route = 'AI_AGENT') => {


    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/approval-queue?route=${encodeURIComponent(route)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return response;
};

export const fetchPendingEmails = async (instance, accounts, routeFilter = 'all') => {

    /* This is the endpoint to fetch the triage emails */
    const graphScopes = ['https://graph.microsoft.com/Mail.Read'];

    const tokenResponse = await instance.acquireTokenSilent({
        scopes: graphScopes,
        account: accounts[0]
    });
    
    const accessToken = tokenResponse.accessToken;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/fetch-user-emails`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });

    return response;
};

export const approveResponse = async (approvalId, staffEdits = '', instance, accounts) => {
    const graphScopes = ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.Send'];
    if (!accounts.length) {
        throw new Error('No accounts found');
    }

    let tokenResponse;
    try {
        tokenResponse = await instance.acquireTokenSilent({
            scopes: graphScopes,
            account: accounts[0]
        });
    } catch (error) {
        // Fall back to popup if silent fails (e.g., consent required)
        tokenResponse = await instance.acquireTokenPopup({
            scopes: graphScopes,
            account: accounts[0]
        });
    }

    const accessToken = tokenResponse.accessToken;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/approve-response`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            approval_id: approvalId,
            staff_edits: staffEdits,
        }),
    });
    return response;
};

export const fetchTriageEmails = async (instance, accounts) => {
    const graphScopes = ['https://graph.microsoft.com/Mail.Read'];
    if (!accounts.length) {
        throw new Error('No accounts found');
    }

    const tokenResponse = await instance.acquireTokenSilent({
        scopes: graphScopes,
        account: accounts[0]
    });
    
    const accessToken = tokenResponse.accessToken;
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/fetch-triage-emails`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });

    return response;
};

export const getEmailHistory = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/email-history`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return response;
};

export const deleteApproval = async (approvalId) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/delete-approval/${approvalId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response;
};

export const deleteEmailHistory = async (emailHistoryId) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/delete-email-history/${emailHistoryId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response;
};
export const redirectEmail = async (instance, accounts, approvalId, redirectDepartmentEmail, comment) => {
    const graphScopes = ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.Send'];
    if (!accounts.length) {
        throw new Error('No accounts found');
    }

    const tokenResponse = await instance.acquireTokenSilent({
        scopes: graphScopes,
        account: accounts[0]
    });

    const accessToken = tokenResponse.accessToken;
    
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/redirect-email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            approval_id: approvalId,
            redirect_department_email: redirectDepartmentEmail,
            comment: comment
        }),
    });
    return response;
};


/**
 * SSE streaming endpoint for triage with real-time progress
 * @param {object} instance - MSAL instance
 * @param {array} accounts - MSAL accounts
 * @param {function} onProgress - Callback for progress updates: (data) => void
 * @returns {Promise} Resolves when stream completes
 */
export const fetchTriageEmailsStream = async (instance, accounts, onProgress) => {
    const graphScopes = ['https://graph.microsoft.com/Mail.Read'];
    if (!accounts.length) {
        throw new Error('No accounts found');
    }

    const tokenResponse = await instance.acquireTokenSilent({
        scopes: graphScopes,
        account: accounts[0]
    });
    
    const accessToken = tokenResponse.accessToken;
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/fetch-triage-stream`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'text/event-stream'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
            try {
                const data = JSON.parse(line.replace('data: ', ''));
                onProgress(data);
            } catch (e) {
                console.error('Failed to parse SSE data:', e);
            }
        }
    }
};