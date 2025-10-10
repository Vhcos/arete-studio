# WEBPAY PLUS — RUNBOOK DE DESPLIEGUE (ARETE)

## Objetivo
Habilitar **Webpay Plus (REST v1.2)** en **producción** para vender:
- `pack-200` → CLP $5.000 → +200 créditos IA
- `addon_session_30m` → CLP $30.000 → +1 asesoría

Con **idempotencia**, validación de **montos**, y trazabilidad **token→requestId**.

## Alcance
- App Next.js (App Router) en Vercel: `app.aret3.cl`
- Rutas **YA** existentes:
  - `POST /api/webpay/plus/init` (crear transacción)
  - `GET /api/webpay/plus/commit` (confirmar y otorgar)
- Helpers existentes:
  - `lib/webpay.ts` (REST, headers, host)
  - `lib/credits.ts` (`grantCredits`, `incrementSessionEntitlement`, `UsageEvent`)
- UI: `/billing` (botones compra)

## Definiciones
- **buyOrder**: prefijo `'P200'|'ADD30'` + sufijo corto. **≤ 26** chars.
- **session_id**: `userId` autenticado.
- **requestId** (idempotencia): `tbk:<token_ws>:(P200|A30)`
- **Éxito TBK**: `response_code === 0` (y normalmente `status === "AUTHORIZED"`)

## Variables de Entorno (producción)
TBK_ENV=production
TBK_COMMERCE_CODE=<COMMERCE_CODE_PROD>
TBK_API_KEY=<API_KEY_SECRET_PROD>
WEBPAY_RETURN_URL=https://app.aret3.cl/api/webpay/plus/commit
WEBPAY_FINAL_URL=https://app.aret3.cl/billing/success
PACK_200CRED_CLP=5000
ADDON_SESSION_30M_CLP=30000

markdown
Copiar código
*(Mantener DB/AUTH/RESEND, etc.)*

## Hosts REST
- **Prod**: `https://webpay3g.transbank.cl`
- **QA**:   `https://webpay3gint.transbank.cl`
Ruta: `/rswebpaytransaction/api/webpay/v1.2/transactions`

## Flujo técnico
1) `init`: server-side → `POST /transactions` con `{ buy_order, session_id, amount, return_url }` → respuesta `{ token, url }`.
2) Front: crea `<form method="POST" action="{url}"> <input name="token_ws" value="{token}">` → `submit()`.
3) Webpay → `return_url` con `token_ws`.
4) `commit`: server-side → `PUT /transactions/{token_ws}`.
5) Validar:
   - `response_code === 0`
   - `amount` coincide con **producto** esperado
   - `buy_order` mapea a `pack-200` o `addon_session_30m`
6) Otorgar idempotente según `requestId`.
7) Redirigir: `WEBPAY_FINAL_URL` (ok) o `/billing/cancel` (fail).

## Criterios de éxito (checklist)
- [ ] `response_code === 0` y `status` correcto registrados en logs.
- [ ] `CreditWallet` incrementa **+200** en pack.
- [ ] Saldo de **asesorías +1** en add-on.
- [ ] `UsageEvent` con `requestId` correcto y **sin duplicados** al repetir commit.
- [ ] `/billing/cancel` sin otorgamientos.

## Riesgos y mitigaciones
- **Token expirado** (usuario demora): reiniciar flujo desde `/billing`.
- **Montos alterados**: bloquear en commit (comparar esperado vs recibido).
- **Duplicidad** (doble commit): `requestId` + `UsageEvent` → no duplica.
- **Credenciales mal cargadas**: branch `TBK_ENV !== 'production'` **no** otorga nada.
- **URLs no autorizadas** en TBK: validar antes del deploy.

## Rollback
1) `TBK_ENV=disabled` (o `mock`) en Vercel + **redeploy**.
2) Mostrar banner “Pagos en mantenimiento” en `/billing`.
3) Revisar logs de `init/commit` y `UsageEvent`.

## Auditoría/Conciliación
- Guardar logs (nivel `info`) de: `buyOrder`, `userId`, `product`, `amount`, `token`.
- Consultas rápidas (Neon):
  - Últimos otorgamientos:
    ```sql
    select created_at, user_id, kind, qty, request_id
    from "UsageEvent"
    where request_id like 'tbk:%'
    order by created_at desc limit 50;
    ```
  - Saldos de créditos por user:
    ```sql
    select user_id, balance
    from "CreditWallet"
    order by updated_at desc limit 50;
    ```