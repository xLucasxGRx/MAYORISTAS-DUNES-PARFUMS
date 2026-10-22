# 06 — Configuración, Entorno y Despliegue

> **Archivo:** `ANALISIS-PARA-CHAT-GPT/06-CONFIGURACION-Y-DESPLIEGUE.md`  
> **Clasificación general:** CONFIRMADO EN CÓDIGO (Inspección estática)

---

## 1. Variables de Entorno y Configuración

### 1.1. Inexistencia de Archivos `.env` en Producción
El proyecto no utiliza un bundler ni un servidor Node.js en runtime, por lo que **no existe un archivo `.env` que el navegador consuma**. En el archivo `.gitignore` están declaradas las líneas:
```gitignore
.env
.env.local
```
Sin embargo, no existen archivos de plantilla (`.env.example` o `.env.dist`) en el repositorio.

### 1.2. Parámetros de Configuración Definidos en Código
Todos los parámetros operativos están definidos como **constantes de JavaScript** dentro de los archivos fuente:

| Parámetro / Constante | Archivo y Línea | Obligatoriedad | Finalidad Operativa | Valor Sanitizado / Observación |
| :--- | :--- | :--- | :--- | :--- |
| **`DEFAULT_SHEETS_CSV_URL`** | `app.js:26` | **Crítica** | Endpoint de descarga del catálogo | Google Sheets publicado (`gid=2013926010`) |
| **`MIN_UNIDADES_MAYORISTA`** | `app.js:132` | **Crítica** | Umbral mínimo para autorizar pedido | `6` (unidades enteras) |
| **`WHATSAPP_NUMERO`** | `app.js:133` | **Crítica** | Número receptor del pedido | `51910487554` (Perú +51) |
| **`CACHE_NAME`** | `service-worker.js:7`| **Importante**| Versión de la caché del Service Worker | `'glexpress-mayorista-v3.1'` |
| **`STATIC_ASSETS`** | `service-worker.js:10`| **Importante**| Lista de archivos precacheados offline | 16 rutas relativas (`./`, `./index.html`, etc.) |

---

## 2. Requisitos para Ejecución Local

Para levantar el proyecto en un entorno de desarrollo local se requiere:

1. **Servidor HTTP Local (Obligatorio para funcionalidad completa):**
   - No se debe abrir directamente haciendo doble clic sobre `index.html` (protocolo `file:///`), ya que el navegador bloqueará el registro del `service-worker.js` y las peticiones `fetch` a Google Sheets por políticas de seguridad de origen.
   - Cualquier servidor estático simple es suficiente:
     - VS Code: Extensión *Live Server* (ejecución con un clic).
     - Node.js: `npx serve .` (puerto por defecto 3000) o `npx http-server -p 8080`.
     - Python: `python -m http.server 8080`.
2. **Conexión a Internet (Para sincronización inicial):**
   - Requerida en el primer arranque para descargar las tipografías de Google Fonts y el CSV de Google Sheets. Una vez cargado, el Service Worker y el caché local permiten operar offline.
3. **Entorno Node.js (Opcional, solo para testing):**
   - Node.js versión 16 o superior si se desean ejecutar las pruebas automatizadas de la carpeta `tests/`.
4. **Entorno Python con Pillow (Opcional, solo para scripts):**
   - Python 3.8+ con biblioteca `Pillow` si se desea ejecutar `scripts/generate_icons.py`.

---

## 3. Comandos Definidos por el Proyecto

Los siguientes comandos fueron identificados en la documentación y scripts. **Durante este análisis solo fueron inspeccionados estáticamente; no fueron ejecutados para no alterar el entorno ni generar tráfico innecesario**:

| Comando | Intérprete | Finalidad según Definición | Estado en este Análisis |
| :--- | :--- | :--- | :--- |
| `node tests/mayorista-cart.test.js` | Node.js | Valida extracción CSV, carrito y WhatsApp | **INSPECCIONADO** |
| `node tests/validate-mayorista-app.js`| Node.js | Valida reglas mayoristas y fetch en vivo | **INSPECCIONADO** |
| `node tests/catalog-filters.test.js` | Node.js | Valida filtros en HTML y simulación JS | **INSPECCIONADO** |
| `python scripts/generate_icons.py` | Python 3 | Genera favicons e iconos desde logo fuente | **INSPECCIONADO** (fallaría sin logocotizador.jpeg) |
| `node tests/verify-*.js` | Node.js | Pruebas E2E headless con Microsoft Edge | **INSPECCIONADO** |

---

## 4. Configuraciones de Hosting y Despliegue

### 4.1. Plataformas de Alojamiento Compatibles
Al ser una aplicación 100% estática (HTML/CSS/JS), puede desplegarse en cualquier proveedor de hosting estático moderno:
- **GitHub Pages:**
  - El código utiliza rutas relativas (`./style.css`, `./app.js`, `./manifest.json`). Esto permite que funcione tanto en la raíz de un dominio (`https://midominio.com/`) como en un subdirectorio de repositorio (`https://usuario.github.io/MAYORISTAS-DUNES-PARFUMS/`).
  - El repositorio de origen en GitHub es: `https://github.com/xLucasxGRx/MAYORISTAS-DUNES-PARFUMS.git`.
- **Cloudflare Pages / Vercel / Netlify:**
  - Compatibilidad nativa sin necesidad de configuración de build (`Build command: none`, `Publish directory: .`).

### 4.2. Dominios, Rutas Base y Redirecciones
- **Ruta Base (`scope` / `start_url`):**
  - En `manifest.json`: `"start_url": "./index.html"` y `"scope": "./"`.
  - En `service-worker.js`: Cachea `./` e `./index.html`.
- **Redirección SPA en Servidores:**
  - En `service-worker.js:76-79` se implementa una regla fallback: si una petición con `request.mode === 'navigate'` falla por falta de conexión, entrega automáticamente `./index.html`.

### 4.3. CORS y Políticas de Red
- **Petición a Google Sheets:** El endpoint `/pub?output=csv` de Google Docs entrega por defecto la cabecera `Access-Control-Allow-Origin: *`, lo que permite que cualquier origen web pueda leer el catálogo vía JavaScript sin bloqueos de CORS.
- **WhatsApp Web:** No se invoca mediante fetch (lo que dispararía restricciones CORS), sino que se delega al navegador abriendo la ventana del sistema (`window.open`).

---

## 5. Automatizaciones de CI/CD y Tareas Programadas

- **GitHub Actions / Pipelines:** **No existen**. No se encontró la carpeta `.github/workflows` ni archivos de configuración para Travis, CircleCI o GitLab CI.
- **Tareas Programadas (Cron Jobs):** **No existen**. No hay sincronizadores en segundo plano. La sincronización se produce exclusivamente cuando un cliente abre la página o presiona manualmente el botón "Actualizar".

---

## 6. Configuraciones que Residen Fuera del Repositorio

Para que la aplicación funcione y se mantenga en el tiempo, existen dos componentes críticos que residen fuera del código fuente:
1. **El documento Google Sheets publicado:**
   - La hoja de cálculo donde se introducen perfumes, precios y disponibilidad. Si el propietario desmarca la opción *"Publicar en la web"* o cambia el nombre/estructura de la pestaña `MAYORISTA`, la aplicación dejará de recibir datos y quedará congelada en la última copia en caché.
2. **La línea telefónica de WhatsApp (`+51 910 487 554`):**
   - El dispositivo o número que atiende y recepciona los pedidos generados por la app.
