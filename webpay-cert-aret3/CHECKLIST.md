# Checklist de validación – ARET3

## Casos de prueba (integración)
- [ ] **Aprobada (P200)**  
  Evidencias:  
  - `screenshots/approved_P200_1_form.png` (formulario Webpay)  
  - `screenshots/approved_P200_2_success.png` (URL con `status=approved`)  
  - `commit-json/commit_approved_P200.json` (response_code=0, status=AUTHORIZED, amount=5000, buy_order=P200…, session_id=<userId>)
  - `logs/init_approved_P200.txt`, `logs/commit_approved_P200.txt`

- [ ] **Aprobada (A30)**  
  Evidencias análogas a las de P200, con `amount=30000` y `buy_order=ADD30…`.

- [ ] **Rechazada** (ej. Mastercard 5186 0595 5959 0568)  
  Evidencias:  
  - `screenshots/rejected_1_webpay.png`  
  - `screenshots/rejected_2_success.png` (`status=rejected`)  
  - `commit-json/commit_rejected.json` (response_code≠0 o status!=AUTHORIZED)  
  - `logs/commit_rejected.txt`

- [ ] **Cancelada** (Anular compra y volver)  
  Evidencias:  
  - `screenshots/cancelled_1_webpay.png`  
  - `screenshots/cancelled_2_success.png` (`status=cancelled`)

- [ ] **Idempotencia**  
  - Repetir `GET /api/webpay/plus/commit?token_ws=<mismo token>` y verificar que **no** duplica otorgamientos.  
  - `logs/commit_idempotent.txt` con aviso de idempotencia.

## Configuración declarada
- [ ] URLs (return/final) coinciden con las usadas.
- [ ] Mapeo de montos: P200=5000, A30=30000.
- [ ] `buy_order` ≤ 26; `session_id = userId`.
- [ ] Validación de montos activa en commit.
- [ ] Idempotencia por `requestId = tbk:<token_ws>:(P200|A30)`.

