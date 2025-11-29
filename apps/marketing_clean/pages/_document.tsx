// apps/marketing_clean/pages/_document.tsx
import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="es">
        <Head>
          {/* Iconos */}
          <link rel="icon" href="/icon.svg?v=5" type="image/svg+xml" />
          <link rel="alternate icon" href="/favicon.ico?v=2" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" />

          {/* Color de tema global */}
          <meta name="theme-color" content="#0b64fe" />

          {/* Fuentes */}
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600&family=Comic+Neue:wght@400;700&display=swap"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Gloria+Hallelujah&display=swap"
          />
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
