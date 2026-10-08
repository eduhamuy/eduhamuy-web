import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth, signIn } from '@/auth';
import { isAuthEnabled } from '@/lib/auth-enabled';

export const dynamic = 'force-dynamic';

function localReturnPath(value: string | undefined) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/mi-cuenta';
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  if (!isAuthEnabled()) notFound();
  const { error, callbackUrl } = await searchParams;
  const returnPath = localReturnPath(callbackUrl);
  const session = await auth();
  if (session?.user) redirect(returnPath);

  return (
    <main>
      <h1>Iniciar sesión en EduHamuy</h1>
      {error && <p role="alert">No pudimos iniciar sesión. Inténtalo de nuevo.</p>}
      <form
        action={async () => {
          'use server';
          if (!isAuthEnabled()) notFound();
          await signIn('keycloak', { redirectTo: returnPath });
        }}
      >
        <button type="submit">Continuar con Keycloak</button>
      </form>
      <Link href="/">Volver al inicio</Link>
    </main>
  );
}
