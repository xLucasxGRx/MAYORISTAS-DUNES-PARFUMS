# 00 — LEER PRIMERO: Guía y Contexto del Análisis Técnico

> **Proyecto:** Catálogo Online Mayorista (PWA)  
> **Directorio analizado:** `c:\Users\Lucas\Desktop\MAYORISTAS-DUNES-PARFUMS`  
> **Fecha de análisis:** 21 de octubre de 2026  
> **Analista:** Antigravity (Auditoría Técnica Senior)  
> **Destinatario:** Usuario y ChatGPT (para soporte en cambios posteriores)

---

## 1. Identificación y Finalidad del Proyecto

El proyecto inspeccionado es una **Aplicación Web Progresiva (PWA) Mobile-First** orientada al comercio mayorista de perfumería de alta gama. Su objetivo operativo es permitir a revendedores y clientes mayoristas:
1. Explorar el catálogo de perfumes disponibles y agotados en tiempo real.
2. Consultar el precio final de compra por unidad puesto en Perú (`PUESTO EN PERÚ` en Soles `S/`).
3. Seleccionar cantidades por producto mediante un control interactivo `[-] 1 [+]`.
4. Armar un pedido en un carrito flotante con validación de un **pedido mínimo mayorista de 6 unidades** y bloqueo preventivo ante productos agotados.
5. Generar y transferir el pedido formateado hacia **WhatsApp** mediante un enlace directo sin requerir pasarelas de pago, bases de datos transaccionales ni autenticación previa.

El proyecto es un **catálogo duplicado/adaptado**: fue derivado inicialmente de una aplicación previa de cotización minorista de importación (*DUNES PARFUMS*), pasando a ser adaptado para operar bajo la marca comercial *GL EXPRESS* conectado a la pestaña `MAYORISTA` de una hoja de cálculo maestra de Google Sheets.

---

## 2. Estado de Git y Control de Versiones

- **Ruta del repositorio:** `c:\Users\Lucas\Desktop\MAYORISTAS-DUNES-PARFUMS`
- **Rama activa:** `main`
- **Commit actual:** `7092cdb` (*mensaje:* `zzz`)
- **Remoto configurado (`origin`):** `https://github.com/xLucasxGRx/MAYORISTAS-DUNES-PARFUMS.git`
- **Estado del árbol de trabajo (Working Tree):** `Clean` (limpio, sin archivos pendientes de commit ni modificaciones previas no guardadas).
- **Historial reciente de commits relevantes:**
  - `7092cdb` — `zzz`
  - `ac15c4d` — `feat: actualizar favicon multi-resolucion (16/32/48) e iconos PWA oficiales GL EXPRESS`
  - `ff20b49` — `docs: actualizar encabezado de reglas en app.js para reflejar precio USA oculto y carrito 95vh`
  - `ba0dd11` — `feat: mejora visual destacada de productos AGOTADOS en catálogo mayorista con banner y botón rojo`
  - `b988246` — `feat: integrar nuevo logo oficial GL EXPRESS con marco dorado e iconos PWA`

---

## 3. Stack Tecnológico Identificado

El proyecto utiliza una arquitectura **100% Vanilla (sin frameworks ni compiladores en frontend)**:

| Capa / Herramienta | Tecnología | Clasificación | Observaciones |
| :--- | :--- | :--- | :--- |
| **Estructura** | HTML5 Semántico | CONFIRMADO EN CÓDIGO | Archivo único `index.html` |
| **Estilos** | Vanilla CSS3 Moderno | CONFIRMADO EN CÓDIGO | Variables CSS, Glassmorphism, Safe Areas iOS (`style.css`) |
| **Lógica Cliente** | Vanilla JavaScript (ES6+) | CONFIRMADO EN CÓDIGO | DOM API, IntersectionObserver, Fetch API (`app.js`) |
| **PWA / Offline** | Web App Manifest + Service Worker | CONFIRMADO EN CÓDIGO | `manifest.json`, `service-worker.js`, `sw.js` |
| **Tipografía** | Google Fonts (`Cinzel` y `Outfit`) | CONFIRMADO EN CÓDIGO | Cargado vía CDN en `index.html` |
| **Fuente de Datos** | Google Sheets CSV público | CONFIRMADO EN CÓDIGO | Endpoint web de publicación (pestaña `MAYORISTA`, `gid=2013926010`) |
| **Checkout / Pedidos** | API WhatsApp Web | CONFIRMADO EN CÓDIGO | `https://api.whatsapp.com/send` |
| **Testing** | Node.js Test Runners | CONFIRMADO EN CÓDIGO | Scripts en carpeta `tests/` con asserts nativos y Edge CDP |
| **Generación de Iconos** | Python 3 + PIL/Pillow | CONFIRMADO EN CÓDIGO | Script `scripts/generate_icons.py` |

> **Nota:** No existe archivo `package.json` en la raíz ni en subdirectorios. No se utilizan gestores como npm, yarn o pnpm para el frontend, ni herramientas de empaquetado como Vite, Webpack o TailwindCSS.

---

## 4. Resumen de la Arquitectura y Funcionamiento

```mermaid
flowchart TD
    subgraph Cliente ["Navegador Web / PWA Móvil"]
        HTML[index.html] --> CSS[style.css]
        HTML --> JS[app.js]
        JS --> SW[service-worker.js (Caché Offline)]
        JS --> LS[(LocalStorage: Carrito y Caché)]
    end

    subgraph FuentesExternas ["Servicios Externos (Solo Lectura / Enlace)"]
        GS[Google Sheets CSV: Pestaña MAYORISTA] -->|Fetch GET sin auth| JS
        JS -->|window.open con texto codificado| WA[WhatsApp API: +51 910 487 554]
        GF[Google Fonts CDN] -->|Estilos web| HTML
    end
```

1. **Arranque:** Al cargar `index.html`, `app.js` recupera de `localStorage` el carrito (`glexpress_carrito_v1`) y la última copia en caché del catálogo (`glexpress_catalogo_cache_v1`). Esto permite renderizado instantáneo sin pantalla en blanco.
2. **Sincronización:** En paralelo, `app.js` realiza una petición `fetch` GET hacia el endpoint CSV publicado de Google Sheets (`gid=2013926010`). Si tiene éxito, actualiza la memoria y el caché local. Si falla (sin internet), mantiene los datos en caché o usa un catálogo de respaldo hardcodeado de 9 perfumes (`CATALOGO_DEFAULT`).
3. **Exploración y Filtrado:** El cliente puede buscar por texto libre y filtrar por Categoría (*Diseñador* / *Árabes*), Género (*Hombre* / *Mujer* / *Unisex*) y Disponibilidad (*Disponibles* / *Agotados*).
4. **Armado de Pedido:** Cada tarjeta permite incrementar o decrementar unidades. Al presionar "Agregar", se suma al carrito.
5. **Validación de Pedido:** El carrito bloquea la confirmación si hay productos agotados (`cart-stock-warning`) o si el total acumulado de unidades disponibles es menor a 6 (`cart-min-warning`).
6. **Checkout:** Al presionar "Enviar Pedido por WhatsApp", se construye una cadena de texto preformateada y se abre la API de WhatsApp dirigida al número celular configurado (`51910487554`).

---

## 5. Índice de Informes y Orden Recomendado de Lectura

Para que ChatGPT y el equipo técnico comprendan el proyecto en profundidad, se recomienda consultar los documentos en este orden:

1. **`00-LEER-PRIMERO.md`** *(este archivo)*: Contexto general, estado de Git y resumen ejecutivo.
2. **`01-ESTRUCTURA-Y-TECNOLOGIAS.md`**: Árbol de archivos, scripts, dependencias y ciclo de vida.
3. **`02-PAGINAS-RUTAS-Y-COMPONENTES.md`**: Inventario de la interfaz, elementos del DOM, modales y tarjetas dinámicas.
4. **`03-FUNCIONAMIENTO-Y-FLUJOS.md`**: Paso a paso de los flujos de usuario, cálculos y reglas comerciales.
5. **`04-CONEXIONES-API-Y-SERVICIOS.md`**: Detalle técnico de Google Sheets, WhatsApp y fuentes externas.
6. **`05-DATOS-Y-PERSISTENCIA.md`**: Estructuras en memoria, esquemas de Google Sheets, claves de `localStorage` y caché.
7. **`06-CONFIGURACION-Y-DESPLIEGUE.md`**: Parámetros configurables, constantes en código, hosting y ejecución local.
8. **`07-MARCA-Y-DEPENDENCIAS-DEL-PROYECTO-ORIGINAL.md`**: Análisis de la duplicación: coexistencia entre *GL EXPRESS* y *DUNES PARFUMS*.
9. **`08-HALLAZGOS-Y-PENDIENTES.md`**: Errores confirmados, código huérfano, advertencias y riesgos detectados.
10. **`09-MAPA-PARA-FUTUROS-CAMBIOS.md`**: Guía técnica con archivos exactos para realizar modificaciones paso a paso.
11. **`10-RESUMEN-PARA-CHAT-GPT.md`**: Documento de síntesis compacto preparado para ser copiado y pegado en ChatGPT como prompt de contexto.

---

## 6. Instrucciones y Skills Utilizadas

- **Reglas del Entorno:** Se observaron estrictamente las reglas de no modificar archivos existentes, no ejecutar scripts que muten datos, no realizar commits ni alterar la configuración.
- **Skills invocadas:**
  - `using-superpowers`: Verificación de reglas operativas al inicio de la sesión.
  - `writing-plans`: Inspeccionada para criterios de estructuración de tareas y mapas de cambio.
- **Modo de análisis:** Inspección estática profunda del código fuente (`index.html`, `app.js`, `style.css`, `service-worker.js`, `manifest.json`, `js/calculator.js`, `scripts/generate_icons.py`, `tests/*`, `docs/*`).

---

## 7. Alcance, Exclusiones y Limitaciones

- **Alcance cumplido:** Análisis estático completo de todos los archivos del repositorio, rastreo de variables, referencias cruzadas de identificadores y mapa de dependencias del proyecto original.
- **Exclusiones realizadas por diseño:** No se abrió el navegador en vivo para interactuar visualmente, no se envió ningún mensaje real a WhatsApp y no se ejecutó ningún script que modifique archivos o instale paquetes.
- **Qué se verificó:**
  - Código fuente completo y congruencia entre identificadores de `index.html` y `app.js`.
  - Rutas relativas de archivos de activos (`assets/`, `icons/`, `logosDP/`).
  - Lógica de cálculo, mapeo CSV y formato de mensajes.
- **Qué NO se verificó (Pendiente de verificación en ejecución):**
  - No se comprobó en tiempo real si la URL de Google Sheets sigue respondiendo activamente desde los servidores de Google o si los datos actuales de la hoja han cambiado respecto a las pruebas históricas.
  - No se verificó el registro real del Service Worker en navegadores reales bajo protocolo HTTPS o localhost.
