# eduhamuy-web

Interfaz web de EduHamuy. Permite explorar el corpus académico disponible,
buscar documentos PDF y consultar una vista previa controlada de cada resultado.
La rama `dev` es la rama principal de integración.

## Funcionalidad

La ruta [`/buscar`](src/app/buscar/page.tsx) es pública y ofrece:

- catálogo paginado de los documentos del índice activo;
- búsqueda híbrida y resultados ordenados por relevancia estimada;
- vista previa del PDF elegido, sin exponer una URL ni un SAS de Azure;
- mensajes para consultas vacías y para errores de carga;
- inicio y cierre de sesión con Keycloak, regresando a la misma ruta.

Después de iniciar sesión, la página muestra un panel de gestión para la
demostración con las opciones de subir PDF, reindexar, editar metadatos y
eliminar PDF. Esas opciones son visuales: no modifican el corpus ni el índice.

El navegador nunca se conecta directamente a Azure Blob Storage. Las rutas
Next.js envían el catálogo, la búsqueda y la vista previa al backend
`eduhamuy-ai`, que valida el documento contra el índice activo y lee el PDF
desde el almacenamiento privado.

## Datos y acceso externo

El corpus, la suite de evaluación y los artefactos del índice viven en Azure
Blob Storage, separados por contenedores y versiones. Azure no se expone a
usuarios externos. Para material de referencia del proyecto puede consultarse
la [carpeta compartida de Google Drive](https://drive.google.com/drive/folders/1OPa6n57k_e7YeXuRJWVDL779GUC747dJ?usp=sharing).
Su contenido sirve para revisión externa y no sustituye los datos auditables ni
los artefactos publicados en Azure.

## Desarrollo local

Requiere Node.js 24 y npm 11, conforme a [`.nvmrc`](.nvmrc) y
[`package.json`](package.json).

```bash
npm ci
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`. Las variables de
entorno se documentan en el código de autenticación y deben incluir, según el
escenario, la URL interna del backend AI y la configuración de Keycloak. No
subir secretos ni archivos `.env` al repositorio.

Comprobaciones locales:

```bash
npm run lint
npm run format:check
npm run build
```

## Entrega a DEV

GitHub Actions construye la imagen en GHCR. El workflow de promoción abre un
Pull Request en `eduhamuy-gitops` con el SHA de la imagen y Argo CD reconcilia
el manifiesto aprobado en Kubernetes. El despliegue no selecciona el índice:
esa versión se declara separadamente en GitOps mediante `ARTIFACT_PREFIX`.
