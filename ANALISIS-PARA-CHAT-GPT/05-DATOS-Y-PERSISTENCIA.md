# 05 — Datos, Persistencia y Almacenamiento

> **Archivo:** `ANALISIS-PARA-CHAT-GPT/05-DATOS-Y-PERSISTENCIA.md`  
> **Clasificación general:** CONFIRMADO EN CÓDIGO

---

## 1. Mecanismos de Persistencia

El proyecto no cuenta con un motor de base de datos relacional (RDBMS) ni orientado a documentos. Emplea un modelo híbrido de **persistencia local en el cliente** complementado por una **fuente remota distribuida en hoja de cálculo**:

1. **Persistencia Local del Cliente:**
   - **`localStorage` (Web Storage API):** Guarda el estado del carrito, caché del catálogo, marca de tiempo de sincronización y nombre del cliente.
   - **`CacheStorage` API (Service Worker):** Almacena el shell de la aplicación (HTML, CSS, JS, favicons, logos) para disponibilidad offline completa.
2. **Fuente de Datos Maestra (Remota):**
   - **Google Sheets (Pestaña `MAYORISTA`):** Archivo remoto publicado donde el administrador edita productos, disponibilidad y precios.
3. **Estado Volátil en Memoria (`app.js`):**
   - Arrays `catalogoProductos`, `carrito` y objeto `localCardQuantities`.

> **Aclaración sobre `sessionStorage`, `Cookies` e `IndexedDB`:** No se detectó en ninguna parte del código el uso de `sessionStorage`, `document.cookie` ni `indexedDB`.

---

## 2. Almacenamiento Local (`localStorage`)

Todas las claves utilizadas por la aplicación actual están aisladas con el prefijo `glexpress_` para evitar colisiones con el proyecto original:

| Clave de Storage | Tipo de Dato | Función / Propósito | Dónde se Escribe | Dónde se Lee |
| :--- | :--- | :--- | :--- | :--- |
| **`glexpress_carrito_v1`** | JSON String (Array) | Lista de items agregados al pedido | `app.js:264` (`guardarCarrito`) | `app.js:238` (`cargarCarrito`) |
| **`glexpress_catalogo_cache_v1`** | JSON String (Array) | Copia de respaldo del último catálogo sincronizado | `app.js:1224` (`cargarCatalogo`) | `app.js:1183` (`cargarCatalogo`) |
| **`glexpress_catalogo_last_sync_v1`**| String (`HH:mm`) | Hora de la última sincronización exitosa | `app.js:1226` (`cargarCatalogo`) | `app.js:1189` (`cargarCatalogo`) |
| **`glexpress_cliente_nombre_v1`** | String | Nombre del cliente mayorista | `app.js:680, 1403` | `app.js:251` (`cargarCarrito`) |
| **`glexpress_google_sheets_url_v1`**| String (URL) | URL personalizada de Sheets (override manual) | *Sin setter en UI* | `app.js:1200` (`cargarCatalogo`) |

> **Nota sobre claves obsoletas:** En la especificación original (`docs/superpowers/specs/2026-09-05-dunes-parfums-design.md`) se mencionaba la clave `dunes_cotizaciones_v1`. Dicha clave **no se utiliza en el código de producción actual** (`app.js`), confirmando el aislamiento de datos respecto al cotizador previo.

---

## 3. Modelo de Datos en Memoria

### 3.1. Objeto de Producto del Catálogo (`catalogoProductos`)

Cada producto parseado desde la hoja de Google Sheets se estructura en memoria como:

```javascript
{
  id: "gl-1",                  // String: ID generado correlativo ("gl-" + index)
  producto: "9 Am Dive...",   // String: Nombre comercial del perfume (Columna A)
  precioUSA: 19.71,           // Number: Costo de compra USA (Columna B) [Oculto en UI]
  puestoPeru: 90.00,          // Number: Precio mayorista en Soles (Columna J "Costo Perú")
  categoria: "Árabes",        // String: "Diseñador", "Árabes", etc. (Columna D)
  genero: "Unisex",           // String: "Hombre", "Mujer", "Unisex" (Columna E)
  imagen: "https://...",      // String: URL pública de la imagen (Columna K)
  estadoCatalogo: "Disponible",// String: "Disponible", "No disponible", etc. (Columna L)
  esAgotado: false            // Boolean: true si incluye "no" o "agotad" en Columna L
}
```

### 3.2. Objeto de Item en Carrito (`carrito`)

Los items guardados en el array del pedido mayorista tienen la siguiente estructura:

```javascript
{
  id: "gl-1",                  // String: Referencia al ID del producto
  producto: "9 Am Dive...",   // String: Nombre del perfume
  precioUSA: 19.71,           // Number: Precio USA original de referencia
  puestoPeru: 90.00,          // Number: Precio unitario mayorista en Soles
  imagen: "https://...",      // String: URL de miniatura
  cantidad: 2,                // Number: Cantidad seleccionada (mínimo 1)
  subtotal: 180.00            // Number: cantidad * puestoPeru (redondeado a 2 decimales)
}
```

---

## 4. Esquema de la Pestaña Google Sheets `MAYORISTA`

El sistema espera que la pestaña con `gid=2013926010` mantenga el siguiente esquema de **12 columnas (A hasta L)**:

| Col. | Nombre Encabezado Esperado | Clave Interna | Visibilidad en UI | Tratamiento en Código |
| :---: | :--- | :--- | :--- | :--- |
| **A** | `Producto` / `Perfume` / `Nombre` | `producto` | **VISIBLE** | Título principal de la tarjeta |
| **B** | `Precio USA ($)` | `precioUSA` | **OCULTO** | Leído como float; no se dibuja en la tarjeta |
| **C** | `Cantidad` | `cantidad` | **OCULTO** | Cantidad de inventario del almacén (privado) |
| **D** | `Categoria` | `categoria` | **FILTRO** | Utilizado para filtrar (Diseñador / Árabes) |
| **E** | `Genero` | `genero` | **FILTRO** | Utilizado para filtrar (Hombre / Mujer / Unisex)|
| **F** | `Peso KG` | `pesoKg` | **OCULTO** | Costo interno operativo (privado) |
| **G** | `Flete x KG` | `fleteKg` | **OCULTO** | Costo interno operativo (privado) |
| **H** | `Reempaque` | `reempaque` | **OCULTO** | Costo interno operativo (privado) |
| **I** | `Precio Dolar (T.C)` | `precioDolarTC` | **OCULTO** | Tipo de cambio interno (privado) |
| **J** | `Costo Perú` | `costoPeru` -> `puestoPeru` | **VISIBLE** | **Precio de venta mayorista oficial (S/)** |
| **K** | `imagen` | `imagen` | **VISIBLE** | URL para el tag `<img>` con lazy loading |
| **L** | `Estado catálogo` | `estadoCatalogo` | **EVALUADO** | Determina si `esAgotado = true` |

> ⚠️ **Mapeo crítico Columna J:** La columna J se llama originalmente en el Excel administrativo *"Costo Perú"*. En la interfaz pública de GL EXPRESS, el código **prohíbe estrictamente** mostrar la palabra "Costo" y la mapea a la etiqueta comercial: **`PUESTO EN PERÚ`** (`app.js:8-9, 713, 968`).

---

## 5. Ciclo de Vida de los Datos (CRUD)

| Operación | Entidad | Dónde se ejecuta | Detalle técnico |
| :--- | :--- | :--- | :--- |
| **Create** | Item en Carrito | `app.js:443-469` | `carrito.push(...)` si no existía previamente |
| **Read** | Catálogo | `app.js:1208` | `fetch` HTTP GET hacia Google Sheets |
| **Read** | Carrito y Caché | `app.js:236, 1182` | `localStorage.getItem(...)` |
| **Update** | Cantidad en Carrito | `app.js:472-484` | Modifica `item.cantidad` y recalcula `subtotal` |
| **Update** | Catálogo en Caché | `app.js:1224` | Sobreescribe el JSON completo en `localStorage` |
| **Delete** | Item del Carrito | `app.js:486-491` | `carrito = carrito.filter(i => i.id !== id)` |
| **Delete** | Vaciar Todo el Pedido| `app.js:510-517` | `carrito = []` y sincroniza en storage |

---

## 6. Origen de Imágenes y Disponibilidad de Stock

1. **Imágenes de Perfumes:**
   - No se almacenan en el repositorio local.
   - Provienen de URLs públicas (HTTP/HTTPS) cargadas en la **columna K** de la hoja de Google Sheets.
   - En caso de URL rota o vacía: El atributo `onerror` en la imagen (`app.js:955`) oculta el elemento roto y activa el icono de respaldo de botella `🧴` (`.card-thumb-fallback-icon`).
2. **Disponibilidad y Stock:**
   - No hay control numérico de stock en el cliente.
   - La disponibilidad depende exclusivamente de la cadena de texto en la **columna L**:
     - Si contiene `"no"` o `"agotad"`: La app lo marca como `esAgotado = true`.
     - Si contiene `"disponib"`: La app lo marca como `esAgotado = false`.
3. **Datos de Demostración (Hardcoded Fallback):**
   - Definidos en `app.js:29-129` (`CATALOGO_DEFAULT`).
   - Contiene 9 perfumes de respaldo con precios puestos en Perú entre S/ 86.50 y S/ 415.50 (8 disponibles y 1 agotado: Good Girl Carolina Herrera).
   - Se activan si la sincronización remota falla y el usuario nunca antes había abierto la aplicación.

---

## 7. Acceso a la Hoja Real de Producción

En esta etapa de análisis estático se inspeccionó la URL y estructura declarada en el código local. **No se realizaron peticiones de mutación ni se abrió la hoja de cálculo con credenciales privadas**. Se constató que el acceso declarado es por lectura pública vía CSV.
