import { auth } from '@/auth';
import { isAuthEnabled } from '@/lib/auth-enabled';
import SearchClient from './search-client';

export const dynamic = 'force-dynamic';

export default async function SearchPage() {
  const session = isAuthEnabled() ? await auth() : null;
  return <SearchClient isAuthenticated={Boolean(session?.user)} />;
}
