# CHECKLIST ESTRICTO — Webpay a Producción

## 0) Preparación
- [ ] Branch: `feat/webpay-prod-rollout`
- [ ] Revisar diffs en `lib/webpay.ts`, `app/api/webpay/plus/init/route.ts`, `app/api/webpay/plus/commit/route.ts`, `app/billing/page.tsx`.
- [ ] Confirmar helper `buildBuyOrder(...)` → **≤ 26** chars.

## 1) Transbank
- [ ] Obtener **Commerce Code (Webpay Plus)** PROD.
- [ ] Obtener **API Key Secret (REST)** PROD.
- [ ] Autorizar URLs:
  - [ ] Return/Commit: `https://app.aret3.cl/api/webpay/plus/commit`
  - [ ] Final/Thanks: `https://app.aret3.cl/billing/success`

## 2) Vercel (Production)
- [ ] `TBK_ENV=production`
- [ ] `TBK_COMMERCE_CODE=<...>`
- [ ] `TBK_API_KEY=<...>`
- [ ] `WEBPAY_RETURN_URL=https://app.aret3.cl/api/webpay/plus/commit`
- [ ] `WEBPAY_FINAL_URL=https://app.aret3.cl/billing/success`
- [ ] `PACK_200CRED_CLP=5000`
- [ ] `ADDON_SESSION_30M_CLP=30000`
- [ ] Redeploy Production ✔

## 3) Pruebas QA (staging o prod controlado)
### Caso A — pack-200
- [ ] Iniciar en `/billing` → pagar en Webpay.
- [ ] Vuelve a `/billing/success`.
- [ ] `CreditWallet` **+200** (ver vía `/api/billing/me` o DB).
- [ ] `UsageEvent.requestId = 'tbk:<token>:P200'`.
- [ ] Repetir **commit** con el mismo `token_ws` → **NO duplica**.

### Caso B — add-on sesión
- [ ] Iniciar y pagar.
- [ ] Saldo asesorías = **+1**.
- [ ] `UsageEvent.requestId = 'tbk:<token>:A30'`.

### Caso C — cancelación
- [ ] Cancelar en TPV → `/billing/cancel`.
- [ ] No hay otorgamientos.

### Caso D — monto alterado
- [ ] Forzar amount distinto (si es posible) → **rechaza** y va a `/billing/cancel`.

## 4) Monitoreo
- [ ] Logs `init/commit` con contexto mínimo (sin API Key).
- [ ] Alertas en Vercel (500s) y DB (constraint/idempotencia).

## 5) Cierre
- [ ] Merge `feat/webpay-prod-rollout` → `main`.
- [ ] Tag `vX.Y.0-webpay-prod`.
- [ ] Anotar `Commerce Code` y `API Key` en vault seguro.

