# Sesiones y logout en AIO

## Desarrollo local existente

El entorno local usa Keycloak y PostgreSQL en Docker, y el frontend puede
ejecutarse en el host con `npm run dev`. Su configuración es
AUTH_URL=http://localhost:3000, AUTH_KEYCLOAK_ISSUER=http://localhost:8080/realms/eduhamuy
y AUTH_KEYCLOAK_ID=eduhamuy-web-local. Conservar las credenciales locales existentes.
Se permite HTTP exclusivamente para localhost, 127.0.0.1 y [::1]; los demás
hosts requieren HTTPS. El cliente local debe permitir el callback
http://localhost:3000/api/auth/callback/keycloak y el retorno de logout
http://localhost:3000/. Las pruebas no requieren modificar el cliente AIO.

Los contenedores existentes se llaman eduhamuy-local-identity-postgres-1 y
eduhamuy-local-identity-keycloak-1. Docker registra el archivo
eduhamuy-gitops/environments/local/identity/compose.yaml, ausente del checkout
revisado el 2026-09-10. Recuperar ese archivo antes de intentar recrear el stack
con Compose; se pueden iniciar los contenedores existentes sin reconstruirlos.

## Comportamiento del cierre y revocación

El logout se inicia mediante Server Action (POST): elimina la cookie local y
redirige al endpoint OIDC de Keycloak con client_id y post_logout_redirect_uri.
Keycloak puede pedir confirmación porque no enviamos id_token_hint. Cancelar esa
confirmación conserva el SSO, aunque la sesión local ya está cerrada. Esto cierra
la sesión SSO actual, no todos los dispositivos del usuario.

En el cliente eduhamuy-web debe estar permitido exactamente
`https://aio.eduhamuy.com/` como Valid post logout redirect URI.

Cada consulta de sesión Auth.js realiza introspección del refresh token con el
cliente confidencial, sin caché y con timeout de cinco segundos. La cookie JWT
está cifrada y es HttpOnly; el refresh token no se incluye en la sesión pública.
Un resultado inactivo, credenciales incorrectas, error de red o respuesta inválida
deniega la sesión. Las rutas y acciones futuras deben llamar a auth() antes de
leer o modificar datos protegidos.

La revocación se detecta en la siguiente petición que comprueba sesión, no borra
información ya mostrada en otra pestaña. No hay endpoint back-channel: no configurar
uno en Keycloak. Esta alternativa evita necesitar un almacén compartido de
sesiones revocadas, a costa de una consulta a Keycloak por comprobación.

No solicitamos offline_access ni renovamos refresh tokens en esta versión. La
sesión termina al expirar ese token o a la hora del login, lo que ocurra primero;
la navegación no prolonga la sesión SSO. Para continuar, se inicia login de nuevo.
Las cookies creadas antes de este cambio exigirán un nuevo login.

## Publicación y prueba

1. Ejecutar `node --test tests/keycloak-session.test.mjs`, `npm run lint` y
   `npm run build`. Publicar por el flujo habitual de CI y obtener el SHA real.
2. Promover esa imagen únicamente al overlay AIO y sincronizar Argo CD.
   No requiere Secrets nuevos: usa AUTH_KEYCLOAK_SECRET y configuración existente.
3. Abrir una ventana privada y comprobar login y /mi-cuenta. Revisar que
   /api/auth/session no contiene tokens ni secretos.
4. Cerrar sesión, confirmar en Keycloak y comprobar regreso a la home. Volver
   a iniciar login: debe pedir credenciales, salvo otro IdP externo con SSO propio.
5. Iniciar sesión de nuevo. Desde otro navegador administrativo, ir a
   eduhamuy → Users → usuario de prueba → Sessions y cerrar esa sesión concreta.
   Recargar /mi-cuenta: debe redirigir a /login; /api/auth/session debe ser null.
6. Comprobar también que cancelar la confirmación global deja la sesión local
   cerrada, y que un usuario deshabilitado no obtiene acceso protegido.

Las comprobaciones con mocks no validan la configuración real de Keycloak.
El logout y la revocación en AIO siguen pendientes hasta ejecutar estos pasos.

Referencia: https://www.keycloak.org/securing-apps/oidc-layers
