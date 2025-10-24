# ARET3 – Certificación Webpay Plus (REST v1.2)

**Producto:** Webpay Plus (Transacción Normal)  
**Arquitectura:** Next.js (App Router) + API REST propia (sin plugin)  
**Dominio:** https://app.aret3.cl

## URLs autorizadas
- **Return/Commit:** `https://app.aret3.cl/api/webpay/plus/commit`
- **Final/Thanks:**  `https://app.aret3.cl/billing/success`

## Flujo técnico
1. `POST /rswebpaytransaction/api/webpay/v1.2/transactions` (init)  
   - `buy_order` (≤ 26 chars): prefijo `P200…` o `ADD30…`  
   - `session_id`: `userId` del comprador  
   - `amount`: desde configuración segura (ENV) según producto  
   - `return_url`: `https://app.aret3.cl/api/webpay/plus/commit`
2. Webpay muestra formulario y redirige por **POST** con `token_ws`.
3. `PUT /rswebpaytransaction/api/webpay/v1.2/transactions/{token_ws}` (commit)  
   - Requerimos `response_code = 0` (**AUTHORIZED**).  
   - Validamos **monto esperado** (`P200=5000`, `A30=30000`).  
   - Idempotencia por transacción: `requestId = tbk:<token_ws>:(P200|A30)`  
   - En éxito redirigimos a `/billing/success?status=approved&product=(P200|A30)`;  
     en rechazo: `status=rejected`; en cancelación: `status=cancelled`.

## Seguridad/controles
- `buy_order` con prefijo de producto y longitud ≤ 26.
- `session_id` = `userId` (trazabilidad).
- **Validación de montos**: el commit compara `amount` TBK con el mapeo server-side.
- **Idempotencia**: otorgamiento atómico con `UsageEvent(requestId)`.
- **Logs** mínimos (sin secretos): `init` y `commit` con contexto (userId, producto, monto, orden).

## Evidencias adjuntas en este ZIP
- `/screenshots`: Aprobada (P200), Aprobada (A30), Rechazada, Cancelada.
- `/commit-json`: Respuesta **autorizada** y **rechazada** de `commit`.
- `/logs`: recortes de logs de `init/commit` (Vercel), sin API keys.
- `/config`: URLs y montos.

## Contacto
- Nombre: Victor Hurtado
- Email: grupohurtado.victor@gmail.com
- Teléfono: +569 64965511

> **Nota:** El ZIP no contiene códigos de comercio ni llaves.  
> `GRANT_IN_INTEGRATION` solo se usa en QA; en producción el otorgamiento se habilita por `TBK_ENV=production`.
