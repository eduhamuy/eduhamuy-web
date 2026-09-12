type Environment = Record<string, string | undefined>;

export function keycloakConfig(env: Environment = process.env) {
  const issuer = new URL(env.AUTH_KEYCLOAK_ISSUER ?? "");
  const app = new URL(env.AUTH_URL ?? "");
  if ([issuer, app].some(url => {
    const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    return (!localHttp && url.protocol !== "https:") || url.username || url.password || url.search || url.hash;
  })) {
    throw new Error("Auth URLs must use HTTPS or HTTP on loopback only");
  }
  const clientId = env.AUTH_KEYCLOAK_ID;
  if (!clientId) throw new Error("Missing Keycloak client ID");
  return { issuer: issuer.href.replace(/\/$/, ""), clientId, home: new URL("/", app).href };
}

export function keycloakLogoutUrl(env: Environment = process.env) {
  const { issuer, clientId, home } = keycloakConfig(env);
  const url = new URL(`${issuer}/protocol/openid-connect/logout`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("post_logout_redirect_uri", home);
  // Without an ID token hint Keycloak asks the user to confirm logout.
  return url.href;
}

export async function isKeycloakSessionActive(
  refreshToken: unknown,
  sessionIssuer: unknown,
  sessionClient: unknown,
  env: Environment = process.env,
  request: typeof fetch = fetch,
): Promise<boolean> {
  if (typeof refreshToken !== "string" || !refreshToken) return false;
  try {
    const { issuer, clientId } = keycloakConfig(env);
    if (issuer !== sessionIssuer || clientId !== sessionClient || !env.AUTH_KEYCLOAK_SECRET) return false;
    const response = await request(`${issuer}/protocol/openid-connect/token/introspect`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: env.AUTH_KEYCLOAK_SECRET, token: refreshToken, token_type_hint: "refresh_token" }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result?.active === true;
  } catch {
    // Deny access on timeout, malformed responses or provider failure. Never log tokens.
    return false;
  }
}