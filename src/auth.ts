import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [Keycloak({ checks: ["pkce", "state"] })],
  session: { strategy: "jwt", maxAge: 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
});
