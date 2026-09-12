import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { isKeycloakSessionActive, keycloakConfig } from "@/lib/keycloak-session";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [Keycloak({ checks: ["pkce", "state"] })],
  session: { strategy: "jwt", maxAge: 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        const { issuer, clientId } = keycloakConfig();
        token.keycloakRefreshToken = account.refresh_token;
        token.keycloakIssuer = issuer;
        token.keycloakClient = clientId;
        token.authenticatedAt = Date.now();
      }
      // Tokens stay in the encrypted HttpOnly JWT, never in the public session.
      if (typeof token.authenticatedAt !== "number" || Date.now() - token.authenticatedAt >= 60 * 60 * 1000) return null;
      const active = await isKeycloakSessionActive(token.keycloakRefreshToken, token.keycloakIssuer, token.keycloakClient);
      return active ? token : null;
    },
  },
});
