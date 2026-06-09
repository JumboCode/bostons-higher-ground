/**
 * Salesforce client built on top of the OAuth 2.0 Client Credentials flow.
 *
 * The Client Credentials grant isn't directly exposed by jsforce 3's
 * Connection.authorize() helper, so we hit `/services/oauth2/token` ourselves
 * to obtain an access token + instance URL, then hand them to a jsforce
 * Connection for SOQL/describe convenience.
 *
 * Connected App must have:
 *   - "Enable Client Credentials Flow" turned on
 *   - A "Run As" user with read access to the target SObject(s)
 */

import jsforce, { type Connection } from "jsforce";
import {
    readSalesforceCredentials,
    type SalesforceCredentials,
} from "./config";

type TokenResponse = {
    access_token: string;
    instance_url: string;
    token_type: string;
    issued_at: string;
};

async function fetchAccessToken(
    creds: SalesforceCredentials
): Promise<TokenResponse> {
    const tokenUrl = `${creds.loginUrl.replace(/\/$/, "")}/services/oauth2/token`;
    const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
    });

    const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        // Salesforce token endpoint is fast; bound the call.
        signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Salesforce token request failed (${res.status}): ${text || res.statusText}`
        );
    }

    const data = (await res.json()) as Partial<TokenResponse> & {
        error?: string;
        error_description?: string;
    };

    if (!data.access_token || !data.instance_url) {
        throw new Error(
            `Salesforce token response missing fields: ${data.error_description ?? data.error ?? "unknown error"}`
        );
    }

    return data as TokenResponse;
}

/**
 * Authenticate with Salesforce and return a ready-to-use jsforce Connection.
 * Throws on credential / network / Salesforce errors.
 */
export async function getSalesforceConnection(): Promise<Connection> {
    const creds = readSalesforceCredentials();
    const token = await fetchAccessToken(creds);

    const conn = new jsforce.Connection({
        instanceUrl: token.instance_url,
        accessToken: token.access_token,
        // Pin to a stable API version. Bump as needed.
        version: "60.0",
    });

    return conn;
}
