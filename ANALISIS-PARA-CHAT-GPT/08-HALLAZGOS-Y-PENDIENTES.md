# 08 — Hallazgos, Inconsistencias y Pendientes Técnicos

> **Archivo:** `ANALISIS-PARA-CHAT-GPT/08-HALLAZGOS-Y-PENDIENTES.md`  
> **Clasificación general:** HALLAZGOS TÉCNICOS DETECTADOS (Sin modificaciones realizadas)

---

## 1. Errores y Defectos Confirmados en Código

### Hallazgo 1: Elemento `#input-cliente-nombre` ausente en el DOM
- **Descripción:** El script `app.js` tiene lógica implementada para capturar, almacenar y formatear el nombre del cliente mayorista, pero el campo de entrada `<input id="input-cliente-nombre">` **no existe en el archivo `index.html`**.
- **Evidencia concreta:**
  - `app.js:188`: `inputClienteNombre: document.getElementById('input-cliente-nombre')` (obtiene `null`).
  - `app.js:252-254`: Intenta restaurar el nombre guardado en `elements.inputClienteNombre.value`.
  - `app.js:675`: `const nombreCliente = elements.inputClienteNombre ? elements.inputClienteNombre.value.trim() : '';` (siempre resulta en cadena vacía `""`).
  - `app.js:685`: `mensaje += 'Cliente: ' + nombreCliente + '\n\n';` (imprime `Cliente: \n\n` en el mensaje de WhatsApp).
  - `app.js:1400-1406`: `if (elements.inputClienteNombre) elements.inputClienteNombre.addEventListener(...)` (nunca se ejecuta el listener).
  - Búsqueda en `index.html`: Cero coincidencias para `input-cliente-nombre` o campos de texto de cliente.
- **Impacto:** En todos los pedidos enviados por WhatsApp, el encabezado muestra el texto `"Cliente: "` sin el nombre del comprador, obligando al vendedor a preguntar manualmente quién está escribiendo.
- **Prioridad:** **ALTA**. Afecta la experiencia operativa del pedido.
- **Grado de certeza:** **CONFIRMADO EN CÓDIGO**.
- **Verificación pendiente:** Comprobar si en el diseño original se planificó un campo de texto en el modal del carrito o en el header.
- **Recomendación futura:** Agregar el campo `<input id="input-cliente-nombre" type="text" placeholder="Tu nombre o negocio...">` en el modal `#modal-carrito` dentro de `index.html`.

---

### Hallazgo 2: Error de archivo faltante en `scripts/generate_icons.py`
- **Descripción:** El script de generación de iconos fallará inmediatamente con `FileNotFoundError` si se ejecuta mediante Python.
- **Evidencia concreta:**
  - `scripts/generate_icons.py:5`: `src_path = os.path.join('logosDP', 'logocotizador.jpeg')`.
  - Contenido real de la carpeta `logosDP/`: Solo contiene el archivo `logoGL.jpeg` (77,452 bytes). El archivo `logocotizador.jpeg` no existe.
- **Impacto:** Cualquier intento de regenerar favicons o iconos PWA desde el script fallará.
- **Prioridad:** **MEDIA**. No afecta a los usuarios en producción porque los iconos ya están generados en `assets/`, pero bloquea la automatización interna.
- **Grado de certeza:** **CONFIRMADO EN CÓDIGO / SISTEMA DE ARCHIVOS**.
- **Verificación pendiente:** Ninguna. La ruta y archivo faltante están constatados.
- **Recomendación futura:** Actualizar `src_path` en `scripts/generate_icons.py` para apuntar a `logosDP/logoGL.jpeg` (o al nuevo logo que se decida utilizar).

---

### Hallazgo 3: Código muerto masivo en `style.css` (~2000 líneas huérfanas)
- **Descripción:** Más del 60% del archivo `style.css` corresponde a estilos de la antigua calculadora minorista de importación que ya no tienen ningún elemento correspondiente en `index.html`.
- **Evidencia concreta:**
  - `style.css:410-1475`: Estilos para `#seccion-cotizador`, `.form-card`, `.input-container`, `.costo-breakdown`, `.hero-card`, `#historial-lista`, `.badge-ganancia`, `.modal-detalle`, `#modal-configuracion`.
  - Ninguno de estos identificadores existe en el actual `index.html`.
  - El tamaño de `style.css` es de 78.6 KB (3556 líneas), cuando los estilos activos del catálogo y carrito ocupan aproximadamente 1100 líneas.
- **Impacto:** Sobrecarga innecesaria en la descarga inicial de red (~40 KB de CSS no utilizado) y dificultad para que otro desarrollador o IA mantenga los estilos.
- **Prioridad:** **BAJA**. No genera errores visuales, solo peso muerto.
- **Grado de certeza:** **CONFIRMADO EN CÓDIGO**.
- **Verificación pendiente:** Ninguna.
- **Recomendación futura:** Limpiar las reglas no utilizadas en una fase posterior de refactorización controlada.

---

### Hallazgo 4: Archivo JavaScript huérfano (`js/calculator.js`)
- **Descripción:** El archivo `js/calculator.js` (97 líneas) contiene la función `calculateDunesQuotation()` del cotizador previo y no tiene ningún punto de consumo en la aplicación actual.
- **Evidencia concreta:**
  - `index.html:293`: Solo importa `<script src="./app.js?v=3.0"></script>`.
  - `app.js`: No importa ni referencia a `calculateDunesQuotation`.
- **Impacto:** Código muerto en el repositorio.
- **Prioridad:** **BAJA**.
- **Grado de certeza:** **CONFIRMADO EN CÓDIGO**.
- **Recomendación futura:** Eliminar o archivar en una carpeta de respaldo si ya no se necesitarán cálculos de importación unitarios.

---

### Hallazgo 5: Banco de pruebas heterogéneo y tests fallidos en `tests/`
- **Descripción:** Dentro de la carpeta `tests/` conviven tests válidos para la versión mayorista actual con tests antiguos que arrojan errores de aserción.
- **Evidencia concreta:**
  - `tests/validate-app.js:50-65`: Exige la presencia de `id="producto"`, `id="cfg-peso"`, `id="modal-configuracion"`, los cuales fueron retirados en la versión mayorista. Si se ejecuta `node tests/validate-app.js`, fallará con múltiples `[FAIL]`.
  - `tests/sheets.test.js:71-83`: Valida un encabezado de 11 columnas (A-K) antiguo en lugar del esquema actual de 12 columnas (A-L).
- **Impacto:** Confusión al correr suites de testing automatizadas.
- **Prioridad:** **MEDIA**.
- **Grado de certeza:** **CONFIRMADO EN CÓDIGO**.
- **Recomendación futura:** Separar o actualizar los tests antiguos para que solo validen la funcionalidad mayorista vigente.

---

## 2. Riesgos y Sospechas de Dependencia Externa

### Riesgo 1: Acoplamiento a la Hoja de Google Sheets del Proyecto Original
- **Descripción:** La aplicación se alimenta de la pestaña `MAYORISTA` (`gid=2013926010`) alojada dentro del mismo documento Google Sheets del proyecto original DUNES APP.
- **Evidencia:** `app.js:26` y `README.md:11`.
- **Riesgo:** Si el administrador del proyecto original cambia de cuenta, elimina la hoja, restringe la publicación web o altera el orden de las columnas A-L, este catálogo mayorista dejará de recibir datos y quedará congelado en modo offline.
- **Grado de certeza:** **INFERIDO CON ALTA EVIDENCIA**.
- **Verificación pendiente:** Consultar con el propietario del proyecto si se creará una hoja de Google Sheets independiente o si se mantendrá la sincronización con la hoja actual.

---

### Riesgo 2: Discrepancia de Marca Comercial vs. Nombre de Repositorio
- **Descripción:** El repositorio se titula `MAYORISTAS-DUNES-PARFUMS`, pero la interfaz muestra al cliente `GL EXPRESS`. Además, en `assets/` hay logotipos con el texto "DUNES PARFUMS" y en `logosDP/` hay una imagen titulada `logoGL.jpeg`.
- **Evidencia:**
  - Carpeta raíz: `MAYORISTAS-DUNES-PARFUMS`
  - Remoto Git: `https://github.com/xLucasxGRx/MAYORISTAS-DUNES-PARFUMS.git`
  - Interfaz: `GL EXPRESS — Catálogo Mayorista`
- **Riesgo:** Inconsistencia de identidad visual si el cliente final esperaba ver "DUNES PARFUMS Mayorista" en lugar de "GL EXPRESS".
- **Grado de certeza:** **CONFIRMADO EN CÓDIGO**.
- **Verificación pendiente:** Solicitar al usuario que confirme cuál es la marca definitiva que debe mostrarse en la aplicación (ver informe 09).

---

### Riesgo 3: Validaciones Críticas Únicamente en Cliente
- **Descripción:** El pedido mínimo de 6 unidades y el cálculo de subtotales residen al 100% en el código JavaScript del navegador.
- **Evidencia:** `app.js:400-434` y `app.js:668-673`.
- **Riesgo:** Un usuario con conocimientos básicos de consola de navegador podría alterar las variables en memoria o armar un enlace de WhatsApp con cantidades menores a 6 o precios alterados.
- **Mitigación actual:** El pedido no se cobra en la web; se recibe por WhatsApp, donde un humano verifica el pedido antes de despachar.
- **Grado de certeza:** **CONFIRMADO EN CÓDIGO**.
- **Recomendación:** Mantener siempre el protocolo de validación humana del vendedor antes de confirmar la compra.

---

## 3. Matriz Resumen de Hallazgos y Prioridades

| # | Hallazgo | Tipo | Impacto | Prioridad |
| :-: | :--- | :--- | :--- | :-: |
| **1** | Falta `#input-cliente-nombre` en HTML | Bug funcional | Nombre de cliente vacío en WhatsApp | **ALTA** |
| **2** | `generate_icons.py` apunta a archivo inexistente | Error de script | Script de iconos roto | **MEDIA** |
| **3** | Tests antiguos (`validate-app.js`) fallan | Inconsistencia | Falsos positivos en pruebas | **MEDIA** |
| **4** | Google Sheet compartido con DUNES APP | Riesgo externo | Dependencia de infraestructura ajena | **ALTA** |
| **5** | Confusión de nombres de marca (GL vs Dunes) | Discrepancia marca | Inconsistencia de marca comercial | **MEDIA** |
| **6** | Código muerto en `style.css` (~2000 líneas) | Deuda técnica | Peso extra de hoja de estilos | **BAJA** |
| **7** | Archivo huérfano `js/calculator.js` | Deuda técnica | Archivo innecesario | **BAJA** |
