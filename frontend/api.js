/*
This file contains the API calls for the frontend
*/



export const fetchUserEmails = async (instance, accounts) => {
    const graphScopes = ['https://graph.microsoft.com/Mail.Read'];
    if (!accounts.length) {
        throw new Error('No accounts found');
    }

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

export const getApprovalQueue = async (instance, accounts) => {
    const graphScopes = ['https://graph.microsoft.com/Mail.Read'];
    if (!accounts.length) {
        throw new Error('No accounts found');
    }

    const tokenResponse = await instance.acquireTokenSilent({
        scopes: graphScopes,
        account: accounts[0]
    });

    const accessToken = tokenResponse.accessToken;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/approval-queue`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
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