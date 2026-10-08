import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { signOut } from '@/auth';
import { isAuthEnabled } from '@/lib/auth-enabled';
import { keycloakLogoutUrl } from '@/lib/keycloak-session';
import SearchClient from './search-client';

export const dynamic = 'force-dynamic';

export default async function SearchPage() {
  const session = isAuthEnabled() ? await auth() : null;
  const user = session?.user;

  async function signOutFromSearch() {
    'use server';
    if (!isAuthEnabled()) return;
    const logoutUrl = keycloakLogoutUrl('/buscar');
    await signOut({ redirect: false, redirectTo: '/' });
    redirect(logoutUrl);
  }

  return (
    <SearchClient
      account={user ? { name: user.name ?? 'Usuario', email: user.email ?? null } : null}
      signOutAction={signOutFromSearch}
    />
  );
}
