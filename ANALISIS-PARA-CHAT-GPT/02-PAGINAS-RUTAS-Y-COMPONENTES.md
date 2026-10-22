# 02 — Páginas, Rutas y Componentes de la Interfaz

> **Archivo:** `ANALISIS-PARA-CHAT-GPT/02-PAGINAS-RUTAS-Y-COMPONENTES.md`  
> **Clasificación general:** CONFIRMADO EN CÓDIGO (Inspección estática de `index.html`, `app.js` y `style.css`)

---

## 1. Inventario de Páginas y Rutas

El proyecto está diseñado como una **Single Page Application (SPA) sin enrutador** (no existe enrutamiento por rutas tipo `/catalogo`, `/admin` ni hash routing `#/carrito`). Toda la experiencia visual y funcional se aloja en un único archivo HTML (`index.html`), alternando vistas, cajones y modales mediante clases CSS (`.is-active`, `.is-collapsed`, `.is-hidden`).

| Ruta / URL | Archivo Fuente | Componente / Vista | Autenticación Requerida | Propósito Funcional |
| :--- | :--- | :--- | :--- | :--- |
| `/` o `./index.html` | `index.html` | Catálogo Mayorista | Ninguna (Público) | Vista principal: búsqueda, filtros, grilla de productos y acceso al pedido |
| *(Modal)* `#modal-carrito` | `index.html` | Cajón / Modal de Pedido | Ninguna (Público) | Desglose de items agregados, subtotales, validación de 6 unidades y botón WhatsApp |
| *(Modal)* `#modal-confirmar-vaciar`| `index.html` | Diálogo de Confirmación | Ninguna (Público) | Confirmación antes de limpiar el carrito de compras |
| *(Rutas Administrativas)* | **No existen** | No aplica | No aplica | No existe panel de administración en código; la gestión se hace en Google Sheets |

---

## 2. Inventario Detallado de Secciones y Componentes del DOM

A continuación se inventarían todos los bloques estructurales presentes en `index.html` y los componentes creados dinámicamente desde `app.js`:

### 2.1. Splash Screen de Bienvenida (`#app-splash-screen`)
- **Ubicación en código:** `index.html:35-46`
- **Estilos:** `style.css:113-210`
- **Elementos Visibles:**
  - Contenedor con fondo oscuro y animación de salida (`splashFadeOut`).
  - Imagen de logo: `./logosDP/logoGL.jpeg` (`.splash-logo-img`).
  - Título de marca: "GL EXPRESS" (`.splash-brand-title`).
  - Subtítulo: "CATÁLOGO MAYORISTA" (`.splash-brand-subtitle`).
  - Barra de progreso animada (`.splash-loader-bar`, `.splash-loader-fill`).
- **Comportamiento:** Se oculta automáticamente mediante animación CSS transcurridos aproximadamente 0.7s de carga.

### 2.2. Cabecera Principal (`.app-header`)
- **Ubicación en código:** `index.html:50-72`
- **Estilos:** `style.css:215-350`
- **Elementos Visibles:**
  - Grupo de marca: Logotipo `./logosDP/logoGL.jpeg`, Título `GL EXPRESS` (`.brand-title`) y lema `Catálogo Mayorista 🇵🇪` (`.brand-tagline`).
  - Botón de Carrito en Header (`#header-cart-btn`): Icono `🛒` y badge de conteo `#header-cart-count`.
  - Indicador de Conexión (`#pwa-status`): Punto dinámico `#status-dot-mini` (verde para online, dorado para offline) y texto `#status-text-mini`.
- **Acciones y Destinos:**
  - Clic en `#header-cart-btn`: Invoca `abrirModalCarrito()` en `app.js:1334`.

### 2.3. Módulo Central: Catálogo Mayorista (`#seccion-catalogo`)
- **Ubicación en código:** `index.html:76-162`
- **Estilos:** `style.css:2550-2900`
- **Elementos y Controles:**
  1. **Título Principal:** "CATÁLOGO MAYORISTA" (`.catalog-main-title`).
  2. **Contador de Inventario Comercial (`#catalogo-contador`):**
     - Muestra: `🟢 X DISPONIBLES • 🔴 Y AGOTADOS`.
     - Origen: Calculado en `app.js:876-897` sobre el array de productos cargados.
  3. **Barra de Sincronización:**
     - Indicador `#catalogo-sync-dot` y texto `#catalogo-sync-text` ("Sincronizado (HH:mm)").
     - Botón `#btn-sincronizar-catalogo`: Invoca `cargarCatalogo(true)` forzando recarga desde red con animación de giro (`.is-spinning`).
  4. **Barra de Búsqueda y Botón de Filtros:**
     - Input `#catalogo-busqueda`: Búsqueda en vivo (evento `input`).
     - Botón `#catalogo-btn-limpiar-busqueda`: Botón `✕` para resetear el campo de búsqueda.
     - Botón `#btn-toggle-filtros`: Despliega/colapsa el panel de filtros con flecha `▼`/`▲` e indicador `#toggle-filtros-dot` si hay filtros activos.
  5. **Contador Dinámico de Resultados (`#catalogo-contador-resultados`):**
     - Muestra: "X perfumes encontrados" o "1 perfume encontrado".
  6. **Panel Desplegable de Filtros (`#catalog-filters-collapsible`):**
     - **Categoría:** Botones "Todos" (`data-value="todos"`), "Diseñador" (`data-value="diseñador"`), "Árabes" (`data-value="árabes"`).
     - **Género:** Botones "Todos", "Hombre", "Mujer" (Nota: Los perfumes catalogados como "Unisex" se muestran tanto en Hombre como en Mujer según `app.js:1130-1142`).
     - **Estado:** Botones "Todos", "Disponibles", "Agotados".
  7. **Grilla Dinámica de Tarjetas (`#catalogo-lista`):**
     - Contenedor con clase `.catalogo-mayorista-grid` donde se inyectan las tarjetas creadas por `app.js:930-995`.
  8. **Estado Vacío (`#catalogo-empty`):**
     - Contenedor con icono `🧴`, título `#catalogo-empty-title` y descripción `#catalogo-empty-desc` para búsquedas sin coincidencia.

### 2.4. Tarjeta Individual de Perfume (`.wholesale-card`)
- **Ubicación en código:** Generada en `app.js:930-995`
- **Estilos:** `style.css:2582-2780`
- **Estructura Interna:**
  - Si está agotado: Banner superior destacado `🚫 AGOTADO` (`.card-agotado-banner`).
  - Imagen del producto (`.wholesale-img`): Utiliza `data-src` para carga perezosa (*Lazy Loading* mediante `IntersectionObserver`), con animación de resplandor (*shimmer*) de espera y fallback de icono `🧴` si falla la URL.
  - Título (`.wholesale-title`): Nombre del perfume sanitizado.
  - Bloque de Precio Mayorista:
    - Etiqueta fija: `PUESTO EN PERÚ`.
    - Monto formateado: `S/ XX.XX` (extraído de la columna J de Google Sheets).
    - **Privacidad estricta:** No renderiza el precio USA (`precioUSA`), ni peso, ni flete, ni cantidades internas del almacén.
  - Fila de Acciones:
    - Selector Stepper `[-] 1 [+]` (`.wholesale-stepper`): Botón `-` (`.btn-card-minus`), valor central (`.stepper-val`), botón `+` (`.btn-card-plus`). Deshabilitado si el producto está agotado.
    - Botón de Acción:
      - Si disponible: Botón "🛒 Agregar" (`.btn-card-add`). Al presionar, suma la cantidad al carrito.
      - Si agotado: Botón rojo "🚫 AGOTADO" (`.btn-card-agotado`), con atributo `disabled`.

### 2.5. Barra Flotante Inferior de Pedido (`#floating-cart-bar`)
- **Ubicación en código:** `index.html:172-184`
- **Estilos:** `style.css:2800-2860`
- **Elementos Visibles:**
  - Botón `#btn-abrir-carrito-flotante`:
    - Izquierda: Icono `🛒`, etiqueta "Ver pedido", badge con cantidad de unidades `#floating-cart-count`.
    - Derecha: Monto total en soles `#floating-cart-total` y flecha `›`.
- **Comportamiento:** Se mantiene oculta (`.is-hidden`) cuando el carrito tiene 0 unidades y se hace visible en cuanto se agrega al menos un perfume (`app.js:350-355`). Al hacer clic, abre `#modal-carrito`.

### 2.6. Modal / Cajón de Pedido Mayorista (`#modal-carrito`)
- **Ubicación en código:** `index.html:187-263`
- **Estilos:** `style.css:2900-3350`
- **Estructura de 3 Zonas (Diseño 95vh con Scroll Independiente):**
  1. **Header Fijo Superior (`.modal-carrito-header`):**
     - Etiqueta "Carrito Mayorista", título "🛒 Tu Pedido", subtítulo explicativo y botón de cierre `✕` (`#btn-cerrar-carrito`).
  2. **Cuerpo Central con Scroll Independiente (`.modal-carrito-body`):**
     - Lista `#carrito-lista-items`: Contenedor donde se renderizan las filas de productos (`.cart-item-row`).
     - Cada fila de producto disponible contiene: thumbnail, nombre, precio unitario ("Puesto en Perú: S/ XX.XX"), stepper de modificación `[-] cant [+]`, subtotal calculado (`S/ XX.XX`) y botón individual de eliminación `🗑️` (`.cart-item-delete`).
     - Cada fila de producto agotado (`.is-item-agotado`): Borde rojizo, aviso "Este producto ya no está disponible", indicador `🔴`, y botón directo `🗑️ Eliminar`.
     - Estado Vacío `#carrito-vacio`: Icono `🛍️`, mensaje "Tu pedido está vacío".
  3. **Footer Fijo Inferior (`.modal-carrito-footer`):**
     - Caja de Totales `#carrito-resumen-box`:
       - Fila `TOTAL UNIDADES:` (`#cart-total-unidades`).
       - Fila `TOTAL PEDIDO:` (`#cart-total-soles`).
     - Alerta de Stock `#cart-stock-warning` (`style="display: none;"`): Se activa si hay productos agotados dentro del carrito, bloqueando el avance.
     - Alerta de Pedido Mínimo `#cart-min-warning` (`style="display: none;"`): Se activa si el total de unidades es menor a 6. Muestra el texto dinámico `#cart-min-remaining-text` ("Te faltan X unidades para confirmar.").
     - Botón Principal WhatsApp (`#btn-enviar-whatsapp`):
       - Estado habilitado: `📲 ENVIAR PEDIDO POR WHATSAPP`.
       - Estado bloqueado por unidades: `🔒 PEDIDO MÍNIMO: 6 UNIDADES`.
       - Estado bloqueado por agotados: `🔒 ACTUALIZA TU PEDIDO`.
     - Botones Secundarios:
       - `#btn-vaciar-carrito`: "🗑️ Vaciar pedido" (abre el modal de confirmación).
       - `#btn-seguir-comprando`: "Continuar viendo" (cierra el modal).

### 2.7. Modal de Confirmación: Vaciar Pedido (`#modal-confirmar-vaciar`)
- **Ubicación en código:** `index.html:266-287`
- **Elementos Visibles:** Título de advertencia "⚠️ ¿Vaciar pedido?", texto de aviso "Esta acción no se puede deshacer", botón "Cancelar" (`#btn-cancelar-vaciar`) y botón de acción destructiva "🗑️ Vaciar carrito" (`#btn-confirmar-vaciar`).
- **Acciones:**
  - Cancelar: Cierra el diálogo sin tocar el carrito.
  - Confirmar: Vacía el array en memoria, actualiza `localStorage`, re-renderiza el modal y emite toast.

### 2.8. Contenedor de Notificaciones Toast (`#toast-container`)
- **Ubicación en código:** `index.html:290`, función `showToast()` en `app.js:216-228`.
- **Estilos:** `style.css:3400-3480`
- **Comportamiento:** Genera avisos flotantes temporales con auto-cierre a los 2.8 segundos (éxito con `✅`, error con `❌`, información con `ℹ️`).

---

## 3. Matriz de Componentes, Estado y Acciones

| Componente | Elemento DOM | Origen de Datos | Estado Persistente | Permisos | Destino / Acción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Buscador** | `#catalogo-busqueda` | Entrada usuario | En memoria (`app.js`) | Ninguno | Filtra productos en tiempo real |
| **Sincronización**| `#btn-sincronizar-catalogo` | Google Sheets CSV | `glexpress_catalogo_cache_v1` | Ninguno | Fuerza descarga HTTP de la hoja |
| **Filtros** | `.catalog-filter-btn` | Clic usuario | En memoria | Ninguno | Re-evalúa visibilidad en grilla |
| **Tarjeta Catálogo**| `.wholesale-card` | Array de productos | En memoria | Ninguno | Stepper altera `localCardQuantities` |
| **Botón Agregar** | `.btn-card-add` | Tarjeta + Stepper | `glexpress_carrito_v1` | Ninguno | Agrega al carrito y guarda en storage |
| **Barra Flotante**| `#floating-cart-bar` | Carrito en memoria | `glexpress_carrito_v1` | Ninguno | Abre `#modal-carrito` |
| **Stepper Carrito**| `.btn-cart-minus/plus` | Carrito en memoria | `glexpress_carrito_v1` | Ninguno | Incrementa/reduce unidades del pedido |
| **Eliminar Item** | `.btn-cart-delete` | Carrito en memoria | `glexpress_carrito_v1` | Ninguno | Quita el producto del array y storage |
| **Vaciar Pedido** | `#btn-confirmar-vaciar`| Carrito en memoria | `glexpress_carrito_v1` | Ninguno | `carrito = []` y limpia storage |
| **Enviar WhatsApp**| `#btn-enviar-whatsapp` | Carrito + Validación | Abre URL externa | Ninguno (req. >=6 uds) | Redirige a `api.whatsapp.com` |

---

## 4. Estados de Carga, Vacío y Error

| Escenario | Elemento Visible | Mensaje / Apariencia | Desencadenante |
| :--- | :--- | :--- | :--- |
| **Carga inicial** | `#app-splash-screen` | Logo animado y barra dorada | Apertura de la página (dura ~0.7s) |
| **Sincronizando hoja**| `#catalogo-sync-dot` | Punto con pulso y spinner en botón | Invocación de `cargarCatalogo()` |
| **Fallo de conexión**| `#catalogo-sync-dot` | Punto ámbar: "Modo local (Sin conexión)" | Fallo de petición `fetch` a Google |
| **Búsqueda sin éxito**| `#catalogo-empty` | "No se encontraron perfumes para '...'" | Búsqueda sin coincidencias |
| **Filtros sin éxito** | `#catalogo-empty` | "No hay perfumes con los filtros seleccionados" | Combinación de filtros sin productos |
| **Catálogo vacío** | `#catalogo-empty` | "Catálogo vacío" | Google Sheets sin filas válidas |
| **Carrito sin items**| `#carrito-vacio` | "Tu pedido está vacío" (icono `🛍️`) | `carrito.length === 0` |
| **Pedido < 6 unidades**| `#cart-min-warning` | "Pedido mínimo mayorista: 6 unidades" | Carrito con entre 1 y 5 unidades |
| **Producto agotado** | `#cart-stock-warning` | "Algunos productos ya no están disponibles" | Item en carrito marcado como agotado |
