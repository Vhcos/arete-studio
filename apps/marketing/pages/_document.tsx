import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="es">
      {/* OJO: no pongas <title> aquí. Úsalo en cada página con next/head */}
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
