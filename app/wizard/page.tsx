// app/wizard/page.tsx
import { redirect } from "next/navigation";

export default function WizardIndex() {
  // En build/SSR redirige de forma segura a Step-1
  redirect("/wizard/step-1");
}
