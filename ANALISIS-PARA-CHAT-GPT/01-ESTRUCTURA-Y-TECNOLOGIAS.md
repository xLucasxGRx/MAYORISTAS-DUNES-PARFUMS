# 01 — Estructura y Tecnologías del Proyecto

> **Archivo:** `ANALISIS-PARA-CHAT-GPT/01-ESTRUCTURA-Y-TECNOLOGIAS.md`  
> **Clasificación general:** CONFIRMADO EN CÓDIGO

---

## 1. Árbol Comentado del Proyecto

A continuación se detalla la totalidad de carpetas y archivos presentes en la raíz de `c:\Users\Lucas\Desktop\MAYORISTAS-DUNES-PARFUMS`:

```text
MAYORISTAS-DUNES-PARFUMS/
│
├── .git/                                   # Directorio interno de control de versiones Git
├── .gitignore                              # Reglas de exclusión (node_modules, .env, cachés, etc.)
├── README.md                               # Documentación comercial y técnica (titulada GL EXPRESS)
│
├── index.html                              # [PUNTO DE ENTRADA] Estructura HTML semántica, PWA metas y modales
├── style.css                               # Hoja de estilos principal (3556 líneas: paleta luxury, grid, modal, carrito)
├── app.js                                  # [LÓGICA PRINCIPAL] Sincronización Google Sheets, catálogo, carrito y WhatsApp
├── service-worker.js                       # Service Worker PWA (Caché offline 'glexpress-mayorista-v3.1')
├── sw.js                                   # Proxy script que importa './service-worker.js'
├── manifest.json                           # Manifiesto PWA para instalación móvil (GL EXPRESS MAYORISTA)
├── favicon.ico                             # Favicon raíz de la aplicación
│
├── assets/                                 # Activos gráficos para favicon e iconos PWA
│   ├── apple-touch-icon.png                # Icono para dispositivos iOS (180x180)
│   ├── favicon-16x16.png                   # Favicon en resolución 16x16
│   ├── favicon-32x32.png                   # Favicon en resolución 32x32
│   ├── favicon-48x48.png                   # Favicon en resolución 48x48
│   ├── favicon.ico                         # Favicon ICO empaquetado en assets
│   ├── icon-192.png                        # Icono estándar PWA 192x192
│   ├── icon-512.png                        # Icono estándar PWA 512x512
│   ├── icon-maskable-192.png               # Icono maskable con margen seguro 192x192
│   ├── icon-maskable-512.png               # Icono maskable con margen seguro 512x512
│   ├── logocotizador.png                   # [LEGACY] Logo previo del cotizador Dunes Parfums
│   └── logohorizontaldunesparfums.webp     # [LEGACY] Logo horizontal previo de Dunes Parfums
│
├── icons/                                  # Carpeta alternativa de iconos PWA generados
│   ├── apple-touch-icon.png
│   ├── favicon-32x32.png
│   ├── favicon.ico
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-192.png
│   └── icon-maskable-512.png
│
├── logosDP/                                # Carpeta de logotipos principales (nombre alude a 'Dunes Parfums')
│   └── logoGL.jpeg                         # Logotipo oficial activo en la interfaz (GL EXPRESS con marco dorado)
│
├── js/                                     # Módulos JavaScript auxiliares
│   └── calculator.js                       # [LEGACY] Motor de cálculo Excel de importación (Dunes Parfums)
│
├── scripts/                                # Scripts de automatización y utilitarios
│   └── generate_icons.py                   # Script en Python para generar favicons e iconos desde un archivo fuente
│
├── tests/                                  # Banco de pruebas automatizadas en Node.js
│   ├── mayorista-cart.test.js              # Pruebas unitarias de parsing CSV mayorista, carrito y WhatsApp
│   ├── validate-mayorista-app.js           # Verificación de integridad de reglas GL EXPRESS y endpoint sheets
│   ├── catalog-filters.test.js             # Pruebas de filtros (categoría, género, estado)
│   ├── calculator.test.js                  # [LEGACY] Tests unitarios del cotizador retail original
│   ├── sheets.test.js                      # [LEGACY] Tests del formato original de sheets A-K
│   ├── validate-app.js                     # [LEGACY] Verificación del HTML/DOM anterior de Dunes Parfums
│   ├── verify-card-agotado.js              # Test E2E headless (Edge) del banner y botón de productos agotados
│   ├── verify-cart-min.js                  # Test E2E headless (Edge) de la regla de mínimo 6 unidades
│   ├── verify-cart-scroll.js               # Test E2E headless (Edge) de las 3 zonas de scroll del modal
│   ├── verify-favicon.js                   # Test E2E headless (Edge) de presencia de favicons
│   ├── verify-logo.js                      # Test E2E headless (Edge) de renderizado del logo GL
│   └── cdp-desktop-test.js                 # Script auxiliar de automatización vía Chrome DevTools Protocol
│
└── docs/                                   # Documentación técnica interna y planes de desarrollo
    └── superpowers/
        ├── plans/
        │   ├── 2026-09-05-dunes-parfums-app.md     # Plan original del cotizador Dunes Parfums
        │   └── 2026-09-12-gl-express-mayorista.md  # Plan de transformación a catálogo mayorista GL EXPRESS
        └── specs/
            └── 2026-09-05-dunes-parfums-design.md # Especificación visual inicial de la marca
```

---

## 2. Puntos de Entrada de la Aplicación

1. **`index.html` (Punto de entrada de usuario):**
   - Carga las hojas de estilo (`style.css`), fuentes tipográficas externas y metadatos PWA.
   - Presenta el contenedor de splash screen, la cabecera, la grilla del catálogo, los modales y el script principal.
2. **`app.js` (Punto de entrada de lógica):**
   - Ejecuta su código tras el evento `DOMContentLoaded`.
   - Lee el almacenamiento local, orquesta la conexión a Google Sheets, gestiona el carrito e intercepta los eventos de usuario.
3. **`service-worker.js` / `sw.js` (Punto de entrada offline / PWA):**
   - Intercepta todas las peticiones `fetch` del navegador para habilitar la navegación sin conexión mediante la API `CacheStorage`.

---

## 3. Frameworks, Lenguajes y Versiones

| Entorno / Capa | Lenguaje / Estándar | Versión Declarada | Versión Resuelta |
| :--- | :--- | :--- | :--- |
| **Navegador** | HTML5 Semántico | N/A (Estándar W3C) | Navegadores modernos (Chrome, Safari, Edge, Firefox) |
| **Navegador** | CSS3 | N/A (Estándar W3C) | CSS Variables, Flexbox, CSS Grid, Safe Areas |
| **Navegador** | JavaScript | ECMAScript 2020+ (ES6+) | Vanilla JS (async/await, IntersectionObserver, Fetch) |
| **Testing** | Node.js (CommonJS) | No declarada en package.json | Compatible con Node 16+ / 18+ / 20+ |
| **Scripts** | Python 3 | No declarada | Requiere Python 3.8+ y biblioteca Pillow (`PIL`) |

> **Diferencia entre versiones declaradas y resueltas:** No aplica. Al no existir archivo `package.json` ni lockfile (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`), no existen versiones fijadas por un gestor de dependencias.

---

## 4. Gestor de Paquetes y Dependencias

- **Gestor de paquetes:** **Ninguno**. El proyecto prescinde por completo de `npm`, `yarn`, `pnpm` o `composer`.
- **Dependencias de Producción (Runtime Navegador):** **0 dependencias externas instaladas localmente**.
  - No requiere `react`, `vue`, `tailwind`, `bootstrap`, `axios` ni `lodash`.
  - Recurso externo consumido por CDN:
    - Google Fonts: `https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap`
- **Dependencias de Desarrollo y Pruebas:**
  - Los scripts de prueba en `tests/` utilizan módulos integrados nativos de Node.js: `assert`, `fs`, `path`, `https`, `http`, `child_process`.
  - Pruebas E2E (`verify-*.js`): Invocan el binario de Microsoft Edge instalado en el sistema operativo del usuario (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`) en modo `--headless=new` mediante sockets CDP nativos.
  - Script `scripts/generate_icons.py`: Depende de la librería Python `Pillow` (`from PIL import Image`).

---

## 5. Scripts Disponibles y su Definición

Al no haber `package.json`, los scripts no se ejecutan vía `npm run <nombre>`, sino invocando directamente el intérprete respectivo:

### A. Scripts de Validación Mayorista (Vigentes)
1. **`node tests/mayorista-cart.test.js`**:
   - *Finalidad:* Valida el parser CSV compatible con RFC 4180, el mapeo de columnas A-L de la pestaña `MAYORISTA`, la lógica de agregar/modificar/eliminar items del carrito, la regla de 6 unidades mínimas y el formato de mensaje a WhatsApp.
2. **`node tests/validate-mayorista-app.js`**:
   - *Finalidad:* Inspecciona estáticamente que `index.html` y `app.js` cumplan con las reglas de negocio (etiqueta "PUESTO EN PERÚ", ocultamiento de precios internos, prefijo `glexpress_*`, gid `2013926010`) y realiza una llamada HTTP directa para comprobar conectividad con Google Sheets.
3. **`node tests/catalog-filters.test.js`**:
   - *Finalidad:* Comprueba la presencia de botones de filtro en el DOM de `index.html` y simula la lógica de filtrado por categoría, género y disponibilidad.

### B. Scripts de Pruebas E2E Headless (Vigentes)
- **`node tests/verify-card-agotado.js`**: Lanza servidor HTTP en puerto 8094 y Edge headless para comprobar que las tarjetas con estado agotado muestren el banner `AGOTADO` y el botón deshabilitado.
- **`node tests/verify-cart-min.js`**: Lanza servidor HTTP y Edge headless para comprobar visualmente la alerta de pedido mínimo y el bloqueo del botón de WhatsApp.
- **`node tests/verify-cart-scroll.js`**: Verifica que el modal de carrito tenga header fijo, footer fijo y zona central con scroll independiente.
- **`node tests/verify-favicon.js`**: Verifica la carga y respuesta HTTP 200 de los favicons.
- **`node tests/verify-logo.js`**: Verifica que `logoGL.jpeg` se renderice adecuadamente en el header y splash screen.

### C. Scripts Legacy / Desactualizados (No congruentes con la versión actual)
- **`node tests/calculator.test.js`**: Ejecuta tests sobre `js/calculator.js` (fórmulas del cotizador retail original).
- **`node tests/validate-app.js`**: Falla si se ejecuta actualmente, porque busca IDs del antiguo cotizador retail (`cfg-peso`, `modal-configuracion`, `historial-lista`) que fueron eliminados de `index.html`.
- **`node tests/sheets.test.js`**: Prueba un esquema de 11 columnas (A-K) de la versión minorista que difiere del esquema actual de 12 columnas (A-L).

### D. Utilitarios
- **`python scripts/generate_icons.py`**:
  - *Definición:* Intenta generar los favicons e iconos en `assets/` e `icons/` redimensionando `logosDP/logocotizador.jpeg`.
  - *Estado actual:* **Inoperable sin ajuste**, ya que el archivo `logosDP/logocotizador.jpeg` no existe en el repositorio (solo existe `logosDP/logoGL.jpeg`).

---

## 6. Configuración de Compilación y Ejecución

- **Compilación:** **No requiere compilación**. El código que se escribe es exactamente el que se ejecuta en el navegador.
- **Ejecución Local:**
  - Requiere ser servido mediante un servidor web local para que las APIs de red (`fetch` a Google Sheets y registro del `service-worker.js`) funcionen correctamente por restricciones de seguridad (CORS y política de orígenes seguros).
  - Ejemplos de servidores compatibles:
    - Extensión *Live Server* de VS Code.
    - `npx serve .` o `npx http-server .`
    - `python -m http.server 8080`
- **Separación Frontend / Backend:**
  - El proyecto es una arquitectura puramente **Client-Side (Front-Only)**.
  - No existe servidor Node/Express, Python/Django, PHP ni base de datos MySQL/Postgres.
  - La persistencia de datos relacionales o inventario se delega externamente a Google Sheets (en modo lectura pública).
  - La transacción comercial se delega externamente a la aplicación WhatsApp.

---

## 7. Archivos Fuente vs. Archivos Generados

- **Archivos Fuente (Código mantenible por desarrolladores):**
  - `index.html`: Marcado semántico.
  - `style.css`: Estilos visuales.
  - `app.js`: Comportamiento interactivo.
  - `service-worker.js` / `sw.js`: Comportamiento de caché PWA.
  - `manifest.json`: Configuración de metadatos de instalación web.
- **Archivos Generados / Binarios:**
  - `favicon.ico`, `assets/*.png`, `icons/*.png`: Iconos rasterizados generados previamente a partir de imágenes fuente.
  - `logosDP/logoGL.jpeg`: Imagen provista externamente para la identidad gráfica.
