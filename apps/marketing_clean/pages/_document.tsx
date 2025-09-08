// apps/marketing_clean/pages/_document.tsx
import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="es">
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <meta name="theme-color" content="#0b64fe" />
          <meta name="description" content="Completa 5 pasos y recibe un informe claro para evaluar tu idea de negocio con IA." />
          <meta property="og:title" content="Areté · Evalúa tu idea con IA" />
          <meta property="og:description" content="Completa 5 pasos y recibe un informe claro para decidir." />
          <meta property="og:type" content="website" />
          <link rel="canonical" href="https://www.aret3.cl/" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
export default MyDocument;
