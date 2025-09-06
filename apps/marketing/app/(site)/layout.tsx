import type { Metadata } from "next";
import Nav from "../../components/Nav";

export const metadata: Metadata = {
  title: "Areté — Valida tu idea en minutos",
  description:
    "Inputs simples + IA + informe friendly para inversores, con plan de acción, mapa competitivo y checklist regulatorio.",
  // Si quieres, puedes dejar metadataBase/alternates aquí también:
  // metadataBase: new URL("https://www.aret3.cl"),
  // alternates: { canonical: "/" },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {children}
    </>
  );
}
