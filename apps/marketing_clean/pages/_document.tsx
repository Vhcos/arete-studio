// apps/marketing_clean/pages/_document.tsx
import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="es">
        <Head>
          <link rel="icon" href="/icon.svg" />
          <meta name="theme-color" content="#0b64fe" />
          <meta name="description" content="Completa 5 pasos y recibe un informe claro para evaluar tu idea de negocio con IA." />
          <meta property="og:title" content="Areté · Evalúa tu idea con IA" />
          <meta property="og:description" content="Completa 5 pasos y recibe un informe claro para decidir." />
          <meta property="og:type" content="website" />
          <link rel="canonical" href="https://www.aret3.cl/" />
          <link rel="icon" href="/icon.svg?v=5" type="image/svg+xml" />
          <link rel="alternate icon" href="/favicon.ico?v=2" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" />
          <meta name="theme-color" content="#0b64fe" />
        </Head>
        <body>
          {/* GTM noscript */}
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-WN7QD875"
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>

          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
export default MyDocument;

