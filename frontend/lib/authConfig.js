/**
 * Azure AD MSAL Configuration
 * Authentication setup for UNC Cashier Email Triage Dashboard
 */

export const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID,
    // Use 'common' to support both work/school accounts AND personal Microsoft accounts
    authority: "https://login.microsoftonline.com/common",
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

// Scopes for delegated API access (no admin consent required)
// MUST use full Microsoft Graph scope URIs for proper token audience
export const loginRequest = {
  scopes: [
    "https://graph.microsoft.com/User.Read",
    "https://graph.microsoft.com/Mail.Read",
    "https://graph.microsoft.com/Mail.Send",
    "https://graph.microsoft.com/Mail.ReadWrite"
  ]
};
