# AGENTS

## Alcance
- `src/app`: páginas, layouts y componentes de la experiencia cliente y del panel admin.
- `src/services`: consumo API, sesión, carrito y servicios por dominio.
- `tests/e2e`: flujos E2E y helpers reutilizables.

## Reglas de trabajo
- Antes de editar, revisar el flujo completo afectado y el contrato API correspondiente.
- Mantener validaciones compartidas en `src/app/lib` o `src/lib`; no duplicar reglas entre pantallas.
- No exponer mensajes técnicos al usuario final. Usar manejo amigable y centralizado de errores.
- Para formularios, validar escritura, pegado, blur, estado válido, estado vacío y mensajes de error.
- Si el cambio toca login, checkout, pagos o panel admin, validar también la navegación protegida y los estados de carga/error.

## Estructura recomendada
- Priorizar separación por dominio en `src/app/features`, `src/app/pages`, `src/services` y `src/app/lib`.
- Mantener componentes de presentación separados de hooks o lógica de negocio cuando el flujo crezca.
- Reutilizar helpers E2E en `tests/e2e/helpers` y evitar selectores ambiguos.

## Comandos base
- Lint: `npm run lint`
- Unit tests: `npm test`
- Build: `npm run build`
- E2E: `npm run test:e2e`

## Validación mínima antes de cerrar
- `npm run build`
- Si el cambio toca flujos críticos, validar login, checkout y al menos un flujo admin de punta a punta.

## Checklist de cierre
- Confirmar que la app resuelve la API correctamente tanto en `localhost` como en `127.0.0.1`.
- Confirmar que los mensajes de error al usuario siguen siendo amigables y homogéneos.
- Confirmar que la suite E2E no depende de datos frágiles o credenciales no determinísticas.
