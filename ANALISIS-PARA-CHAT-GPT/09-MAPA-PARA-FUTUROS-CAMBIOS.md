# 09 — Mapa de Ruta para Futuros Cambios con ChatGPT

> **Archivo:** `ANALISIS-PARA-CHAT-GPT/09-MAPA-PARA-FUTUROS-CAMBIOS.md`  
> **Finalidad:** Proporcionar a ChatGPT y al desarrollador la ubicación exacta, riesgos y validaciones para realizar modificaciones puntuales sin romper el funcionamiento actual.

---

## 1. Matriz de Cambios Frecuentes

| Cambio Solicitado | Archivos y Símbolos Implicados | Dependencias / Activos | Riesgos Concretos | Validación Necesaria |
| :--- | :--- | :--- | :--- | :--- |
| **1. Cambiar Nombre de Marca** | • `index.html`: `<title>` (l.23), `<meta>` (l.7, 12), `.splash-brand-title` (l.40), `.brand-title` (l.56), `.app-footer` (l.167)<br>• `manifest.json`: `"name"` (l.2), `"short_name"` (l.3)<br>• `app.js`: Encabezado WhatsApp (l.684)<br>• `service-worker.js`: `CACHE_NAME` (l.7) | Ninguna | Si se olvida cambiar `app.js:684`, los pedidos seguirán enviándose con el nombre antiguo. Si no se cambia `CACHE_NAME`, clientes recurrentes no verán el cambio de inmediato. | Inspeccionar títulos en navegador, probar instalación PWA y verificar el texto inicial en WhatsApp. |
| **2. Cambiar Logotipo Principal** | • Archivo físico: `logosDP/logoGL.jpeg` (o nueva imagen)<br>• `index.html`: `src="./logosDP/logoGL.jpeg"` en Splash (l.38) y Header (l.53)<br>• `service-worker.js`: `STATIC_ASSETS` (l.17) | Formato JPG/PNG/WEBP con fondo transparente o negro | Si la nueva imagen es muy pesada (>200 KB), ralentizará el splash inicial. Si se cambia la ruta y no se actualiza `service-worker.js`, fallará la precaché offline. | Recargar con caché limpia (`Ctrl+F5`) y verificar proporciones en móvil (110x110px splash, 52x52px header). |
| **3. Cambiar Favicon e Iconos PWA** | • `assets/`: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-*.png`<br>• `index.html`: Enlaces `<link rel="icon">` (l.13-21)<br>• `service-worker.js`: `STATIC_ASSETS` (l.18-26) | Tamaños exactos para cada archivo PNG/ICO | Inconsistencia visual al anclar a pantalla de inicio en Android o iPhone si falta algún tamaño. | Comprobar pestaña de navegador y auditar con Lighthouse PWA. |
| **4. Cambiar Número de WhatsApp** | • `app.js`: Constante `WHATSAPP_NUMERO = '51910487554'` (l.133) | Formato internacional: Código país sin '+' (ej. Perú: `51` + 9 dígitos) | Si se ingresan espacios, guiones o el signo `+`, la URL de WhatsApp devolverá error de número inválido. | Armar un pedido de prueba y verificar que se abra el chat con el número correcto. |
| **5. Cambiar Regla de Pedido Mínimo (ej. de 6 a 12 unidades)** | • `app.js`: Constante `MIN_UNIDADES_MAYORISTA = 6` (l.132)<br>• `index.html`: Textos de advertencia en `#cart-min-warning` (l.243)<br>• `tests/mayorista-cart.test.js`: Modificar asserts de prueba | Ninguna | Si solo se cambia en `index.html`, la lógica en JS seguirá exigiendo 6. Si solo se cambia en JS, el texto de alerta mostrará un número discordante. | Probar agregar 1, 5 y la nueva cantidad meta para comprobar desbloqueo del botón. |
| **6. Cambiar Hoja de Google Sheets (Separar BD)** | • `app.js`: Constante `DEFAULT_SHEETS_CSV_URL` (l.26)<br>• `localStorage`: Limpiar clave `glexpress_catalogo_cache_v1` si hay datos viejos | Hoja de Google Spreadsheets publicada en la web con columnas A-L idénticas | Si el nuevo enlace no tiene `output=csv` o el `gid` correcto, el parser fallará y se activará el catálogo de respaldo de 9 perfumes. | Abrir consola (`F12`), pulsar "Actualizar" y verificar que cargue la cantidad de filas esperada sin errores de red. |
| **7. Activar Campo Nombre de Cliente** | • `index.html`: Agregar bloque `<div class="cart-client-group"><input type="text" id="input-cliente-nombre" placeholder="Tu nombre o negocio..."></div>` dentro de `#modal-carrito`<br>• `style.css`: Estilos de input de lujo | Ninguna (la lógica ya existe en `app.js:188, 252, 675, 1400`) | Ninguno; actualmente el código ya espera este ID. | Escribir un nombre en el carrito, enviar pedido y verificar que en WhatsApp aparezca: `Cliente: Juan Pérez`. |
| **8. Ajustar Colores de la Marca** | • `style.css`: Variables en `:root` (l.10-53)<br>  - `--bg-noir` (fondo)<br>  - `--gold-primary` (dorado)<br>  - `--gold-gradient` (degradado)<br>  - `--emerald-profit` (verde) | Ninguna | Alterar variables clave puede desbalancear el contraste de legibilidad WCAG. | Inspeccionar en modo claro/oscuro de pantalla y verificar textos en tarjetas. |
| **9. Modificar o Añadir Filtros** | • `index.html`: Grupo de botones en `#catalog-filters-collapsible` (l.119-150)<br>• `app.js`: Función `filtrarCatalogo()` (l.1092-1154) y listeners (l.1287-1313) | Valores de columna Categoria (D) o Genero (E) en el Sheet | Si se agrega un valor en HTML que no está contemplado en la función normalizadora de JS, filtrará 0 resultados. | Pulsar cada filtro nuevo y comprobar el contador dinámico de resultados. |
| **10. Desplegar en Nuevo Dominio o Hosting** | • `manifest.json`: `"start_url": "./index.html"` y `"scope": "./"`<br>• `service-worker.js`: Verificar que todas las rutas sigan siendo relativas (`./`) | Servidor HTTPS (requerido para Service Worker) | En servidores sin HTTPS, el Service Worker no se registrará y la PWA no se podrá instalar en móviles. | Abrir en móvil vía HTTPS y comprobar aviso de instalación en pantalla de inicio. |

---

## 2. Instrucciones Específicas para Guiar a ChatGPT

Cuando le pidas a ChatGPT que te ayude a modificar este código, **copia y pega la siguiente directiva**:

> *"ChatGPT, estamos trabajando sobre el proyecto 'MAYORISTAS-DUNES-PARFUMS'. Es una PWA Vanilla (HTML, CSS y JS puro sin frameworks ni package.json) conectada a Google Sheets por CSV. Por favor:*
> *1. No propongas instalar paquetes con npm ni convertir el proyecto a React, Vite o Tailwind.*
> *2. Proporciona modificaciones quirúrgicas indicando el archivo exacto y el bloque a reemplazar.*
> *3. Respeta las reglas de negocio: el precio de la columna J es estrictamente 'PUESTO EN PERÚ' y los datos de costos de importación y precio USA deben permanecer ocultos al cliente.*
> *4. Si modificas archivos estáticos, recuerda incrementar la versión del caché en `service-worker.js` (`CACHE_NAME`)."*

---

## 3. Checklist Previo a Cualquier Cambio en Código

Antes de aplicar cualquier modificación:
- [ ] Realizar un backup o commit en Git del estado actual limpio (`7092cdb`).
- [ ] Verificar que el servidor local de prueba esté corriendo en un puerto HTTP.
- [ ] Mantener la consola de desarrollo abierta (`F12`) para advertir errores de sintaxis o referencias nulas.
- [ ] Probar en modo incógnito para evitar que la versión previa del Service Worker oculte los cambios.
