// components/credits/CreditsCallout.tsx
'use client'
type Props = { visible: boolean; onClick?: () => void }

export default function CreditsCallout({ visible, onClick }: Props) {
  if (!visible) return null
  return (
    <div className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="text-2xl leading-none">🚫</div>
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-red-800">
            IA: Créditos insuficientes
          </h3>
          <p className="mt-1 text-sm sm:text-base text-red-900/90">
            Para usar la estimación con IA en este paso necesitas recargar. Puedes seguir en modo manual o{' '}
            <button
              onClick={onClick}
              className="ml-1 underline decoration-2 underline-offset-2 hover:opacity-90"
            >
              ver planes y recargar
            </button>.
          </p>
        </div>
      </div>
    </div>
  )
}
