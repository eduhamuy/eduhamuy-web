import Link from 'next/link';
import { isAuthEnabled } from '@/lib/auth-enabled';
import { evaluateBooleanFlag } from '@/lib/launchdarkly';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const environment = process.env.EDUHAMUY_ENV ?? 'PROD';

  const title =
    environment === 'DEV'
      ? 'Bienvenido a EduHamuy (DEV)'
      : environment === 'TEST'
        ? 'Bienvenido a EduHamuy (TEST)'
        : 'Bienvenido a EduHamuy';

  const showNewHome = await evaluateBooleanFlag(
    'edu-hamuy-new-home',
    {
      kind: 'user',
      key: 'anonymous-user',
    },
    false
  );

  return (
    <main>
      <h1>{title}</h1>

      <p>Plataforma educativa digital para Ciencias de la Educación y Humanidades — v0.1.1.</p>

      {isAuthEnabled() && (
        <p>
          <Link href="/mi-cuenta">Acceder a mi cuenta</Link>
        </p>
      )}

      {process.env.AI_API_URL && (
        <p>
          <Link href="/buscar">Buscar documentos</Link>
        </p>
      )}

      {showNewHome && (
        <section>
          <h2>Nueva experiencia de EduHamuy</h2>
          <p>Esta sección está controlada mediante LaunchDarkly.</p>
        </section>
      )}
    </main>
  );
}
