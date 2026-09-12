import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { isAuthEnabled } from "@/lib/auth-enabled";
import { keycloakLogoutUrl } from "@/lib/keycloak-session";

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
        const logoutUrl = keycloakLogoutUrl();
        await signOut({ redirect: false, redirectTo: "/" });
        redirect(logoutUrl);
      }}>
        <button type="submit">Cerrar sesión</button>
      </form>
      <p>Confirma el cierre en Keycloak para cerrar también tu sesión de acceso.</p>
      <Link href="/">Volver al inicio</Link>
    </main>
  );
}
