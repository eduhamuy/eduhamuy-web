export const dynamic = "force-dynamic";

export default function HomePage() {
  const environment = process.env.EDUHAMUY_ENV ?? "PROD";

  const title =
    environment === "DEV"
      ? "Bienvenido a EduHamuy (DEV)"
      : environment === "TEST"
        ? "Bienvenido a EduHamuy (TEST)"
        : "Bienvenido a EduHamuy";

  return (
    <main>
      <h1>{title}</h1>

      <p>
        Plataforma educativa digital para Ciencias de la Educación y
        Humanidades — v0.1.1.
      </p>
    </main>
  );
}
