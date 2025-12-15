import '../styles/globals.css'
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../lib/authConfig";

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

export default function App({ Component, pageProps }) {
  return (
    <MsalProvider instance={msalInstance}>
      <Component {...pageProps} />
    </MsalProvider>
  );
}
