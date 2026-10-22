# 10 — Resumen Técnico Autocontenido para Compartir con ChatGPT

> **Instrucciones para el usuario:** Copia y pega el contenido íntegro de este archivo en ChatGPT como tu mensaje inicial. Le proporcionará todo el contexto técnico, la arquitectura y los puntos clave del proyecto para que pueda ayudarte a realizar cambios específicos con total precisión.

---

# Contexto Técnico del Proyecto: Catálogo Mayorista (PWA)

Hola ChatGPT. Este proyecto es un **catálogo online para revendedores y clientes mayoristas de perfumería de alta gama**, duplicado y adaptado a partir de un proyecto previo. Tu objetivo será ayudarme a realizar cambios puntuales sobre este repositorio respetando su arquitectura y sin romper su funcionamiento actual.

A continuación tienes la radiografía técnica completa del proyecto:

---

## 1. Qué Hace el Proyecto
- **Catálogo PWA Mobile-First:** Permite a clientes mayoristas explorar perfumes disponibles y agotados.
- **Precios Claros:** Cada producto muestra su precio final de compra por unidad puesto en Perú (`PUESTO EN PERÚ` en Soles `S/`). Oculta intencionalmente al cliente los costos internos de importación (fletes, pesos, tipo de cambio, margen y precio de compra en USA).
- **Armado de Pedidos:** Tarjetas con controles `[-] 1 [+]` para sumar unidades al carrito.
- **Validaciones Comerciales:**
  - **Pedido mínimo mayorista:** Exige un mínimo de **6 unidades** en total para poder ordenar.
  - **Bloqueo preventivo de stock:** Si un producto del carrito se agota en el catálogo, se bloquea el pedido hasta que el cliente lo elimine.
- **Checkout sin Pasarelas ni Registros:** Al confirmar el pedido, genera un mensaje preformateado y abre **WhatsApp** dirigido al número del vendedor con el detalle completo del pedido.

---

## 2. Stack Tecnológico y Arquitectura
- **Tipo:** Single Page Application (SPA) estática, sin frameworks reactivos ni transpiladores.
- **Frontend:**
  - **Estructura:** HTML5 Semántico en un único archivo (`index.html`).
  - **Estilos:** Vanilla CSS3 moderno con variables `:root`, glassmorphism y safe-areas para iOS (`style.css`).
  - **Lógica:** Vanilla JavaScript ES6+ modular en el cliente (`app.js`).
  - **PWA y Modo Offline:** `manifest.json`, `service-worker.js` (caché `glexpress-mayorista-v3.1`) y proxy `sw.js`.
- **Dependencias de Producción:** **Cero (0) paquetes npm**. No usa React, Vue, Vite, Webpack ni TailwindCSS. Solo fuentes CDN de Google Fonts (`Cinzel` y `Outfit`).
- **Testing Interno:** Scripts en Node.js puro (`tests/mayorista-cart.test.js`, etc.) y pruebas E2E con Edge headless.
- **Persistencia:** `localStorage` bajo claves con prefijo `glexpress_*`.

---

## 3. Origen de Datos, Conexiones y Servicios Externos

1. **Google Sheets (Fuente de Catálogo):**
   - Consume directamente un archivo CSV publicado en Google Docs mediante `fetch` GET:
     `https://docs.google.com/spreadsheets/d/e/2PACX-1vSMxWTEsUiAmYSnu8ra29ku79UTtObn2EnphEEabBODeDZDdXUVcHqI85RnXSvSHBuRthVUlbsWnCy_/pub?gid=2013926010&single=true&output=csv`
   - Pestaña: `MAYORISTA` (`gid=2013926010`).
   - Mapeo de columnas (A hasta L):
     - `Col A`: Producto
     - `Col B`: Precio USA ($) [Oculto]
     - `Col C`: Cantidad [Oculto]
     - `Col D`: Categoría (Filtro: Diseñador / Árabes)
     - `Col E`: Género (Filtro: Hombre / Mujer / Unisex)
     - `Col F-I`: Peso, Flete, Reempaque, Tipo de cambio [Ocultos]
     - `Col J`: "Costo Perú" -> Mapeado estrictamente en pantalla a **`PUESTO EN PERÚ` (S/)**
     - `Col K`: URL de imagen del perfume
     - `Col L`: Estado catálogo (si contiene "no" o "agotad", se marca como agotado)
   - Fallback offline: Caché en `localStorage` (`glexpress_catalogo_cache_v1`) y array estático de 9 perfumes (`CATALOGO_DEFAULT` en `app.js`).
2. **WhatsApp API (Canal de Checkout):**
   - Redirección externa vía `window.open` a:
     `https://api.whatsapp.com/send?phone=51910487554&text=[MENSAJE]`
   - Número configurado: `51910487554` (Perú).
3. **Google Fonts CDN:**
   - Carga de tipografías `Cinzel` y `Outfit`.

---

## 4. Estado de la Duplicación e Independencia de Marca

- **Nombre del repositorio:** `MAYORISTAS-DUNES-PARFUMS`.
- **Marca visible en pantalla:** `GL EXPRESS — Catálogo Mayorista`.
- **Logo actual en uso:** `./logosDP/logoGL.jpeg` (nombre del archivo `logoGL`, ubicado en carpeta `logosDP`).
- **Estado de independencia:**
  - **Código:** 100% independiente en local.
  - **Datos:** **Compartidos**. La hoja de cálculo maestra es la misma que la del cotizador minorista previo (`DUNES APP`), pero leyendo la pestaña específica `MAYORISTA` (`gid=2013926010`).
  - **Residuos del proyecto anterior:** Existen ~2000 líneas de CSS en `style.css` y archivos de prueba en `tests/` pertenecientes al cotizador original que ya no se usan.

---

## 5. Archivos Clave para Futuros Cambios

- `index.html`: Estructura del catálogo, cabecera, barra flotante, modales de carrito y confirmación.
- `app.js`: Constantes principales (`DEFAULT_SHEETS_CSV_URL`, `MIN_UNIDADES_MAYORISTA`, `WHATSAPP_NUMERO`), parser CSV, lógica del carrito y formateo de WhatsApp.
- `style.css`: Variables de color y tipografía en `:root` (líneas 6-54) y estilos mayoristas (líneas 2494-3556).
- `service-worker.js`: Versión de caché (`CACHE_NAME`) y lista de activos cacheados (`STATIC_ASSETS`).
- `manifest.json`: Nombre corto, nombre completo e iconos para la instalación PWA.

---

## 6. Hallazgos e Inconsistencias Técnicas Detectadas

1. **Falta el input de Nombre de Cliente en HTML:** `app.js` tiene la lógica para capturar `#input-cliente-nombre`, pero el campo `<input>` no fue colocado en `index.html`. Por eso, el mensaje de WhatsApp sale con `Cliente: ` en blanco.
2. **Script de iconos desactualizado:** `scripts/generate_icons.py` busca `logosDP/logocotizador.jpeg`, el cual no existe (solo existe `logosDP/logoGL.jpeg`).
3. **Código muerto en CSS:** `style.css` contiene más de 2000 líneas de la antigua calculadora de importación.
4. **Archivo huérfano:** `js/calculator.js` no se importa ni se utiliza en ninguna parte de la web activa.

---

## 7. Preguntas y Decisiones Pendientes

Antes de hacer cambios profundos, convendría definir:
1. **Marca definitiva:** ¿La aplicación continuará llamándose comercialmente `GL EXPRESS` o debe migrar a la marca `DUNES PARFUMS Mayorista`?
2. **Separación de la hoja de cálculo:** ¿Se creará una hoja de Google Sheets independiente o se mantendrá vinculada a la pestaña `MAYORISTA` de la hoja actual?
3. **Número de WhatsApp:** ¿El número `+51 910 487 554` es el definitivo para recepcionar los pedidos de esta tienda?
4. **Campo Nombre de Cliente:** ¿Deseas que agreguemos el campo de texto en el modal del carrito para que el cliente ingrese su nombre antes de enviar a WhatsApp?

---

## 8. Guía de Informes Detallados Disponibles en el Repositorio

Para profundizar en cualquier aspecto, consulta la carpeta `ANALISIS-PARA-CHAT-GPT/`:
- **`00-LEER-PRIMERO.md`**: Contexto general, Git y alcance del análisis.
- **`01-ESTRUCTURA-Y-TECNOLOGIAS.md`**: Árbol de carpetas, dependencias y scripts.
- **`02-PAGINAS-RUTAS-Y-COMPONENTES.md`**: Inventario exhaustivo del DOM, modales y tarjetas.
- **`03-FUNCIONAMIENTO-Y-FLUJOS.md`**: Paso a paso de sincronización, filtros, carrito y WhatsApp.
- **`04-CONEXIONES-API-Y-SERVICIOS.md`**: Especificación de Google Sheets, endpoints y WhatsApp.
- **`05-DATOS-Y-PERSISTENCIA.md`**: Claves de localStorage, modelos en memoria y esquema A-L.
- **`06-CONFIGURACION-Y-DESPLIEGUE.md`**: Constantes en código, requisitos locales y hosting.
- **`07-MARCA-Y-DEPENDENCIAS-DEL-PROYECTO-ORIGINAL.md`**: Auditoría de la duplicación y marcas.
- **`08-HALLAZGOS-Y-PENDIENTES.md`**: Lista detallada de bugs e inconsistencias detectadas.
- **`09-MAPA-PARA-FUTUROS-CAMBIOS.md`**: Matriz de archivos exactos a tocar para cada tipo de cambio.
