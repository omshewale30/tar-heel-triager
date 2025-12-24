import '../styles/globals.css';
import Head from "next/head";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../lib/authConfig";

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

export default function App({ Component, pageProps }) {
  return (
    <MsalProvider instance={msalInstance}>
      <Head>
        <link rel="icon" href="/icon.ico" sizes="any" />
      </Head>
      <Component {...pageProps} />
    </MsalProvider>
  );
}
