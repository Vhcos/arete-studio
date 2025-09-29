export default function BillingSuccess() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">¡Listo! Pago procesado ✅</h1>
      <p className="mt-2 text-gray-600">
        Si tu pago fue aprobado, tus créditos ya fueron asignados a tu cuenta.
      </p>
      <a
        href="/"
        className="mt-6 inline-block rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
      >
        Volver a ARETE
      </a>
    </div>
  );
}
