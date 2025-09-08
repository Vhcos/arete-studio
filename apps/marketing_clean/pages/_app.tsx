// apps/marketing_clean/pages/_app.tsx
import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Areté · Evalúa tu idea con IA</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
