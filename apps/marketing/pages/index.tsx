import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        {/* Solo texto dentro de <title> */}
        <title>Areté — Valida tu idea en minutos</title>
        <meta
          name="description"
          content="Inputs simples + IA + informe investor-friendly."
        />
      </Head>

      <main style={{ padding: "2rem", maxWidth: 960, margin: "0 auto" }}>
        <h1>Landing de Areté (pages/)</h1>
        <p>Si ves esto, el error del “React child object” ya se resolvió.</p>
        <p>
          <a href="https://app.aret3.cl/auth/sign-in">Acceso</a>
        </p>
      </main>
    </>
  );
}
