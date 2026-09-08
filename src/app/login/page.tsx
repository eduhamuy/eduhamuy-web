import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { isAuthEnabled } from "@/lib/auth-enabled";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isAuthEnabled()) notFound();
  const session = await auth();
  if (session?.user) redirect("/mi-cuenta");
  const { error } = await searchParams;

  return (
    <main>
      <h1>Iniciar sesión en EduHamuy</h1>
      {error && <p role="alert">No pudimos iniciar sesión. Inténtalo de nuevo.</p>}
      <form action={async () => {
        "use server";
        if (!isAuthEnabled()) notFound();
        await signIn("keycloak", { redirectTo: "/mi-cuenta" });
      }}>
        <button type="submit">Continuar con Keycloak</button>
      </form>
      <Link href="/">Volver al inicio</Link>
    </main>
  );
}
