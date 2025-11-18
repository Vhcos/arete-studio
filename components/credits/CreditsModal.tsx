// components/credits/CreditsModal.tsx
'use client'
import { useEffect, useState } from 'react'

type Detail = { source?: string; reason?: string; status?: number }

export default function CreditsModal() {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<Detail>({})

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent).detail as Detail
      setDetail(d || {})
      setOpen(true)
    }
    const onClose = () => setOpen(false)
    window.addEventListener('aret3:openCreditsModal', onOpen as EventListener)
    window.addEventListener('aret3:closeCreditsModal', onClose as EventListener)
    return () => {
      window.removeEventListener('aret3:openCreditsModal', onOpen as EventListener)
      window.removeEventListener('aret3:closeCreditsModal', onClose as EventListener)
    }
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-700 text-lg">⚠️</span>
          <h2 className="text-lg font-semibold text-gray-900">Créditos IA insuficientes</h2>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-gray-700 leading-relaxed">
            Para continuar necesitas <b>créditos IA</b>. Revisa los planes y recarga para seguir con tu estimación.
          </p>
          {detail?.source && (
            <p className="text-xs text-gray-500">
              Paso: <span className="font-medium">{detail.source}</span>
              {detail?.status ? ` · Código ${detail.status}` : null}
            </p>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <button
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            Cerrar
          </button>
          <a
            href="/planes" /* cambia a /precios si corresponde */
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Ver planes y recargar
          </a>
        </div>
      </div>
    </div>
  )
}
