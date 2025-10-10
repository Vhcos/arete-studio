---
name: "Rollout Webpay Plus a Producción"
about: Checklist de despliegue controlado
title: "WEBPAY PROD ROLLOUT — YYYY-MM-DD"
labels: ["billing","critical","prod"]
---

## Objetivo
Habilitar Webpay Plus (REST) en producción con idempotencia y validación de montos.

## Tareas
- [ ] Credenciales TBK (Commerce Code + API Key Secret) listas
- [ ] URLs Return/Final autorizadas en TBK
- [ ] Variables Vercel actualizadas y redeploy
- [ ] QA Caso A pack-200 OK
- [ ] QA Caso B add-on sesión OK
- [ ] QA Caso C cancelación OK
- [ ] QA Caso D monto alterado OK
- [ ] Monitoreo/logs verificados
- [ ] Plan de Rollback documentado
- [ ] Merge a `main` + tag

## Evidencias
Adjuntar capturas de `/api/billing/me`, `UsageEvent`, logs `init/commit` y `DB`.

