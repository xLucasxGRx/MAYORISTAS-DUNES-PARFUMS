# 04 — Conexiones, APIs y Servicios Externos

> **Archivo:** `ANALISIS-PARA-CHAT-GPT/04-CONEXIONES-API-Y-SERVICIOS.md`  
> **Clasificación general:** CONFIRMADO EN CÓDIGO

---

## 1. Mapa de Integraciones Externas

El proyecto cuenta con **tres (3) integraciones externas activas en código**:
1. **Google Sheets (Google Docs Export API):** Fuente remota para la lectura del catálogo mayorista.
2. **WhatsApp Web / Click to Chat API (Meta):** Canal de recepción del pedido final.
3. **Google Fonts CDN:** Distribución de las fuentes tipográficas `Cinzel` y `Outfit`.

No existe evidencia en el código de pasarelas de pago (Stripe, Culqi, MercadoPago, etc.), servicios de analítica (Google Analytics, Mixpanel), proveedores de correo electrónico (SendGrid, Mailgun) ni bases de datos en la nube (Firebase, Supabase, PostgreSQL).

```mermaid
flowchart LR
    subgraph App ["Frontend Vanilla (Cliente)"]
        UI[index.html / app.js]
    end

    subgraph Google ["Google Cloud / Google Docs"]
        GS["Google Sheets CSV (gid=2013926010)"]
        GF["Google Fonts CDN (CSS & WOFF2)"]
    end

    subgraph Meta ["Meta Platform"]
        WA["WhatsApp API (send?phone=51910487554)"]
    end

    UI -->|1. Fetch GET (Solo Lectura)| GS
    UI -->|2. window.open (Envío de Mensaje)| WA
    UI -->|3. link stylesheet (Tipografías)| GF
```

---

## 2. Detalle Técnico de Cada Conexión

### 2.1. Google Sheets (Publicación Web en formato CSV)

- **Proveedor:** Google LLC / Google Workspace.
- **Finalidad:** Base de datos externa del catálogo mayorista. Provee la lista de perfumes, precios en soles puestos en Perú, disponibilidad (activo/agotado), categorías, géneros y enlaces a imágenes.
- **Archivo y Funciones:**
  - Archivo: `app.js`
  - Funciones: `construirURLGoogleSheetCSV(input)` (`app.js:864-868`) y `cargarCatalogo(forzarRed)` (`app.js:1172-1260`).
- **Endpoint sanitizado:**
  `https://docs.google.com/spreadsheets/d/e/[ID_DOCUMENTO_PUBLICO]/pub?gid=2013926010&single=true&output=csv`
  - Parámetros clave:
    - `gid=2013926010`: Identificador numérico exclusivo de la pestaña `MAYORISTA`.
    - `single=true`: Limita la exportación a esa única hoja.
    - `output=csv`: Solicita la salida serializada en texto plano separado por comas RFC 4180.
    - `_t=[TIMESTAMP]`: Parámetro añadido dinámicamente por la app para invalidar cachés intermedias de proxy.
- **Método HTTP:** `GET` (Fetch API del navegador).
- **Variables de Entorno:** Ninguna. La URL está definida como constante en código:
  `const DEFAULT_SHEETS_CSV_URL = '...'` (`app.js:26`).
  Opcionalmente puede ser sobreescrita si existe un valor previo en `localStorage.getItem('glexpress_google_sheets_url_v1')`.
- **Tipo de Autenticación:** **Pública / Sin autenticación**. El documento de Google Sheets debe estar configurado como *"Publicar en la web"* (`File > Share > Publish to web`). No utiliza credenciales OAuth2, API Keys de Google Cloud ni cuentas de servicio.
- **Naturaleza de la Operación:** **Solo Lectura (Read-Only)**. El frontend no puede modificar, agregar ni borrar celdas en el Google Sheet.
- **Entorno de Ejecución:** Navegador del cliente.
- **Datos Enviados y Recibidos:**
  - *Enviados:* Cabeceras HTTP estándar de navegador (Accept, User-Agent) y parámetro `_t`.
  - *Recibidos:* Texto plano CSV. Estructura esperada de 12 columnas (A-L):
    `Producto, Precio USA ($), Cantidad, Categoria, Genero, Peso KG, Flete x KG, Reempaque, Precio Dolar (T.C), Costo Perú, imagen, Estado catálogo`
- **Tratamiento de Errores y Timeouts:**
  - Controlado por `AbortController` con límite de 10 segundos (`app.js:1205-1213`).
  - Bloque `try / catch`: Si la petición es abortada por timeout, falla la red (offline) o el servidor responde distinto de HTTP 200:
    1. Si existía un catálogo previo en `localStorage` (`glexpress_catalogo_cache_v1`), lo mantiene visible.
    2. Si no había caché, recurre al array hardcodeado `CATALOGO_DEFAULT` (9 perfumes) en `app.js:29-129`.
    3. Cambia el indicador visual `#catalogo-sync-dot` a clase `.is-offline` y el texto a `"Modo local (Sin conexión)"`.
- **Qué ocurriría si no estuviera configurada:** La aplicación levantaría únicamente con los 9 perfumes estáticos de `CATALOGO_DEFAULT` y mostraría permanentemente el aviso de modo local.

---

### 2.2. WhatsApp API (Click to Chat)

- **Proveedor:** WhatsApp Ireland Limited / Meta Platforms.
- **Finalidad:** Formalización y despacho del pedido mayorista generado en el carrito hacia el canal de atención comercial de la distribuidora.
- **Archivo y Funciones:**
  - Archivo: `app.js`
  - Función: `enviarPedidoWhatsApp()` (`app.js:651-698`).
- **Endpoint / Patrón URL:**
  `https://api.whatsapp.com/send?phone=[NUMERO_TELEFONO]&text=[MENSAJE_ENCODED]`
- **Configuración del Número:**
  - Constante en código: `const WHATSAPP_NUMERO = '51910487554';` (`app.js:133`).
  - Corresponde a Perú (prefijo país `51`) seguido del celular `910 487 554`.
- **Método:** Redirección en nueva pestaña del navegador (`window.open(urlWhatsApp, '_blank')`).
- **Variables de Entorno:** Ninguna.
- **Tipo de Autenticación:** Delegada íntegramente a la sesión activa del usuario en WhatsApp Web o la app móvil de WhatsApp.
- **Naturaleza de la Operación:** Envío de mensaje unidireccional estructurado (Hand-off).
- **Entorno de Ejecución:** Navegador del cliente.
- **Estructura del Mensaje Enviado:**
  Cadena de texto codificada mediante `encodeURIComponent()` con el siguiente esquema:
  ```text
  PEDIDO MAYORISTA GL EXPRESS

  Cliente: [nombre_cliente]

  [cant] x [nombre_producto]
  Precio: S/[precio_unitario_peru]
  Subtotal: S/[subtotal_producto]

  TOTAL UNIDADES: [total_unidades]
  TOTAL PEDIDO: S/[total_importe]
  ```
- **Tratamiento de Errores:**
  - Si el carrito está vacío: Bloquea y emite toast.
  - Si contiene productos agotados: Bloquea y emite toast de error (`app.js:659-663`).
  - Si tiene menos de 6 unidades: Bloquea y emite toast de pedido mínimo (`app.js:668-673`).
  - Si el navegador tiene bloqueador de pop-ups agresivo, la apertura de `window.open` podría ser bloqueada por la política del agente de usuario.
- **Qué ocurriría si no estuviera configurada:** Si el número estuviera en blanco o incorrecto, WhatsApp mostraría un error de "número de teléfono inválido" al abrir la URL externa.

---

### 2.3. Google Fonts CDN

- **Proveedor:** Google LLC.
- **Finalidad:** Carga de familias tipográficas oficiales:
  - `Cinzel` (pesos 500 a 800): Tipografía serif con acento clásico para encabezados y logotipos.
  - `Outfit` (pesos 300 a 800): Tipografía sans-serif geométrica legible para números, precios, botones y descripciones.
- **Archivo:** `index.html:26-28`.
- **URL solicitada:**
  `https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap`
  Preconectores a: `https://fonts.googleapis.com` y `https://fonts.gstatic.com`.
- **Método HTTP:** `GET` estático (`<link rel="stylesheet">`).
- **Naturaleza de la Operación:** Solo lectura de recursos estáticos.
- **Tratamiento de Errores / Offline:** `style.css:43-44` define fuentes del sistema de respaldo (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `serif`). Si no hay internet, la app renderiza con las fuentes nativas de iOS/Android/Windows sin romperse.

---

## 3. Tabla Resumen de Integraciones

| Funcionalidad | Archivo de Origen | Servicio o Destino | Operación | Configuración | Evidencia |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sincronización Catálogo** | `app.js:1208` | Google Sheets CSV | Lectura (GET) | `gid=2013926010` (Pestaña MAYORISTA) | CONFIRMADO EN CÓDIGO (`app.js:26`) |
| **Despacho de Pedidos** | `app.js:696` | WhatsApp API | Redirección externa | Teléfono `51910487554` | CONFIRMADO EN CÓDIGO (`app.js:133`) |
| **Tipografía de Marca** | `index.html:28`| Google Fonts | Descarga estilos | Familias `Cinzel` y `Outfit` | CONFIRMADO EN CÓDIGO (`index.html:28`) |
| **Imágenes de Perfumes** | `app.js:1066` | URLs remotas en Sheet | Descarga de imágenes | Columna K (`imagen`) | CONFIRMADO EN CÓDIGO (`app.js:798`) |

---

## 4. Servicios Descartados (No presentes en el proyecto)

A fin de evitar suposiciones en futuros desarrollos con ChatGPT, se confirma que:
- **No hay backend Node/Express, PHP o Python en producción.**
- **No hay base de datos SQL o NoSQL.**
- **No hay Webhooks ni Pasarelas de Pago automatizadas.**
- **No hay servicios de analítica de tráfico (Google Analytics, Pixel de Facebook).**
- **No hay dependencias de SDKs de terceros instaladas localmente.**
