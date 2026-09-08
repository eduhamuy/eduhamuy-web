import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { isAuthEnabled } from "@/lib/auth-enabled";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!isAuthEnabled()) notFound();
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main>
      <h1>Mi cuenta</h1>
      <p>Hola, {session.user.name ?? "bienvenido"}.</p>
      {session.user.email && <p>{session.user.email}</p>}
      <p>Has iniciado sesión en EduHamuy.</p>
      <form action={async () => {
        "use server";
        if (!isAuthEnabled()) notFound();
        await signOut({ redirectTo: "/" });
      }}>
        <button type="submit">Cerrar sesión en EduHamuy</button>
      </form>
      <p>Tu sesión de Keycloak puede seguir abierta en este navegador.</p>
      <Link href="/">Volver al inicio</Link>
    </main>
  );
}
