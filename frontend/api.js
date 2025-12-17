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

export const fetchPendingEmails = async (routeFilter = 'all') => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/approval-queue?route_filter=${routeFilter}`);
    return response;
};

export const approveResponse = async (approvalId, staffEdits = '') => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/approve-response`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            approval_id: approvalId,
            staff_edits: staffEdits,
        }),
    });
    return response;
};

export const testTriageEmails = async (instance, accounts) => {
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