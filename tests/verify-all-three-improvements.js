const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert');

// Simple static HTTP server
function startServer(port) {
  const baseDir = path.resolve(__dirname, '..');
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(baseDir, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  const PORT = 8098;
  const server = await startServer(PORT);
  console.log(`Servidor local de prueba iniciado en http://localhost:${PORT}`);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProcess = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=375,812',
    `http://localhost:${PORT}/index.html`
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9228/json/version');
      const data = await res.json();
      wsUrl = data.webSocketDebuggerUrl;
      break;
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('No se pudo conectar a Edge CDP');
    edgeProcess.kill();
    server.close();
    process.exit(1);
  }

  const listRes = await fetch('http://127.0.0.1:9228/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes(String(PORT)) || p.type === 'page') || pages[0];

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const curId = msgId++;
      const handler = (msg) => {
        const parsed = JSON.parse(msg.data);
        if (parsed.id === curId) {
          ws.removeEventListener('message', handler);
          resolve(parsed.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  };

  const evalJs = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true });
    return res && res.result ? res.result.value : undefined;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
  await new Promise(r => setTimeout(r, 2500));

  const debugInfo = await evalJs(`({
    href: location.href,
    title: document.title,
    strip: !!document.getElementById('catalog-conditions-strip'),
    bodyChildren: Array.from(document.body.children).map(c => c.tagName + '.' + c.className)
  })`);
  console.log('Información de depuración de carga:', debugInfo);

  const artifactDir = 'C:\\Users\\Lucas\\.gemini\\antigravity-ide\\brain\\3c9b47be-2b96-4ad2-88d1-fdc736c08030';

  console.log('\n============================================================');
  console.log('VERIFICACIÓN 1: Franja Informativa de Condiciones de Compra');
  console.log('============================================================');
  const conditionsData = await evalJs(`
    (() => {
      const strip = document.getElementById('catalog-conditions-strip');
      const minCount = document.getElementById('conditions-min-count');
      const text = strip ? strip.innerText.replace(/\\s+/g, ' ').trim() : '';
      return {
        exists: !!strip,
        minText: minCount ? minCount.textContent.trim() : '',
        fullText: text
      };
    })()
  `);
  console.log('Datos de la franja:', conditionsData);
  assert.strictEqual(conditionsData.exists, true, 'La franja de condiciones debe existir');
  assert.strictEqual(conditionsData.minText, '6', 'El mínimo derivado debe ser 6');
  assert.ok(conditionsData.fullText.includes('Compra mínima: 6 unidades'), 'Debe contener "Compra mínima: 6 unidades"');
  assert.ok(conditionsData.fullText.includes('Importación por pedido · Llegada estimada: 3 semanas después del cierre de compra.'), 'Debe contener el plazo exacto de importación');
  console.log('✔ Verificación 1 superada: Franja muestra mínimo 6 y plazo exacto.');

  console.log('\n============================================================');
  console.log('VERIFICACIÓN 2: Comportamiento del Aviso en la Barra Flotante');
  console.log('============================================================');

  // Test Carrito Vacío
  await evalJs(`
    (() => {
      localStorage.removeItem('glexpress_carrito_v1');
      window.location.reload();
    })()
  `);
  await new Promise(r => setTimeout(r, 2000));

  const emptyCheck = await evalJs(`
    (() => {
      const bar = document.getElementById('floating-cart-bar');
      const status = document.getElementById('floating-cart-status');
      const hasHidden = bar ? bar.classList.contains('is-hidden') : false;
      const bodyHasClass = document.body.classList.contains('has-floating-cart');
      return { hasHidden, bodyHasClass, statusDisplay: status ? status.style.display : '' };
    })()
  `);
  console.log('Estado vacío:', emptyCheck);
  assert.strictEqual(emptyCheck.hasHidden, true, 'Con carrito vacío la barra debe estar oculta (is-hidden)');
  assert.strictEqual(emptyCheck.bodyHasClass, false, 'Body no debe tener has-floating-cart con carrito vacío');
  console.log('✔ Carrito vacío validado: barra oculta y body sin clase.');

  // Test 1, 2, 3, 4, 5 unidades (validación paso a paso de textos con producto real disponible)
  console.log('\n--- Probando textos de faltantes de 1 a 6 unidades ---');
  for (let u = 1; u <= 6; u++) {
    await evalJs(`
      (() => {
        const testItem = {
          id: 'gl-1',
          producto: '9 Am Dive 3.4 Oz Edp Unisex',
          precioUSA: 19.71,
          puestoPeru: 90.00,
          cantidad: ${u},
          subtotal: ${u * 90},
          imagen: ''
        };
        localStorage.setItem('glexpress_carrito_v1', JSON.stringify([testItem]));
        location.reload();
      })()
    `);
    await new Promise(r => setTimeout(r, 1800));

    const checkUnits = await evalJs(`
      (() => {
        const bar = document.getElementById('floating-cart-bar');
        const status = document.getElementById('floating-cart-status');
        const count = document.getElementById('floating-cart-count');
        const total = document.getElementById('floating-cart-total');
        return {
          barHidden: bar ? bar.classList.contains('is-hidden') : true,
          statusText: status ? status.textContent.trim() : '',
          statusDisplay: status ? status.style.display : '',
          countText: count ? count.textContent.trim() : '',
          totalText: total ? total.textContent.trim() : ''
        };
      })()
    `);

    console.log(`Unidades: ${u} ->`, checkUnits);
    assert.strictEqual(checkUnits.barHidden, false, `Barra debe ser visible con ${u} unidad(es)`);
    assert.strictEqual(checkUnits.countText, String(u), `Badge debe mostrar ${u}`);

    if (u === 1) {
      assert.strictEqual(checkUnits.statusText, 'Te faltan 5 unidades');
      assert.strictEqual(checkUnits.statusDisplay, 'block');
    } else if (u === 2) {
      assert.strictEqual(checkUnits.statusText, 'Te faltan 4 unidades');
    } else if (u === 3) {
      assert.strictEqual(checkUnits.statusText, 'Te faltan 3 unidades');
    } else if (u === 4) {
      assert.strictEqual(checkUnits.statusText, 'Te faltan 2 unidades');
    } else if (u === 5) {
      assert.strictEqual(checkUnits.statusText, 'Te falta 1 unidad', 'Debe usar singular para 1 unidad');
    } else if (u === 6) {
      assert.strictEqual(checkUnits.statusDisplay, 'none', 'Con 6 o más unidades el aviso debe estar oculto');
    }
  }
  console.log('✔ Textos de 1 a 6 unidades superados con singular y plural correctos.');

  // Captura 1: Móvil con menos de 6 unidades (ej. 4 unidades: "Te faltan 2 unidades")
  await evalJs(`
    (() => {
      const item = {
        id: 'gl-1',
        producto: '9 Am Dive 3.4 Oz Edp Unisex',
        precioUSA: 19.71,
        puestoPeru: 90.00,
        cantidad: 4,
        subtotal: 360,
        imagen: ''
      };
      localStorage.setItem('glexpress_carrito_v1', JSON.stringify([item]));
      location.reload();
    })()
  `);
  await new Promise(r => setTimeout(r, 2000));

  const screenshotLess6 = await send('Page.captureScreenshot', { format: 'png' });
  const less6Path = path.join(artifactDir, 'screenshot_menos_6_unidades.png');
  fs.writeFileSync(less6Path, Buffer.from(screenshotLess6.data, 'base64'));
  console.log('✔ Captura guardada: screenshot_menos_6_unidades.png');

  // Captura 2: Móvil con 6 o más unidades (aviso oculto)
  await evalJs(`
    (() => {
      const item = {
        id: 'gl-1',
        producto: '9 Am Dive 3.4 Oz Edp Unisex',
        precioUSA: 19.71,
        puestoPeru: 90.00,
        cantidad: 6,
        subtotal: 540,
        imagen: ''
      };
      localStorage.setItem('glexpress_carrito_v1', JSON.stringify([item]));
      location.reload();
    })()
  `);
  await new Promise(r => setTimeout(r, 2000));

  const screenshotMore6 = await send('Page.captureScreenshot', { format: 'png' });
  const more6Path = path.join(artifactDir, 'screenshot_6_o_mas_unidades.png');
  fs.writeFileSync(more6Path, Buffer.from(screenshotMore6.data, 'base64'));
  console.log('✔ Captura guardada: screenshot_6_o_mas_unidades.png');

  // Test: Reducir de 6 a 5 unidades mediante click en el modal
  console.log('\n--- Probando reducción de 6 a 5 unidades ---');
  const reduceTest = await evalJs(`
    (() => {
      // Abrir modal de carrito
      const btnAbrir = document.getElementById('btn-abrir-carrito-flotante');
      if (btnAbrir) btnAbrir.click();
      
      // Pulsar botón menos del item
      const btnMinus = document.querySelector('.btn-cart-minus');
      if (btnMinus) btnMinus.click();

      // Cerrar modal
      const btnCerrar = document.getElementById('btn-cerrar-carrito');
      if (btnCerrar) btnCerrar.click();

      const status = document.getElementById('floating-cart-status');
      const count = document.getElementById('floating-cart-count');
      return {
        count: count ? count.textContent.trim() : '',
        statusText: status ? status.textContent.trim() : '',
        statusDisplay: status ? status.style.display : ''
      };
    })()
  `);
  console.log('Resultado reducción a 5:', reduceTest);
  assert.strictEqual(reduceTest.count, '5');
  assert.strictEqual(reduceTest.statusText, 'Te falta 1 unidad');
  assert.strictEqual(reduceTest.statusDisplay, 'block');
  console.log('✔ Reducción de 6 a 5 unidades superada: aviso reaparece con singular "Te falta 1 unidad".');

  // Test: Producto agotado en carrito -> aviso prioritario "Revisa los productos agotados"
  console.log('\n--- Probando producto agotado en carrito ---');
  await evalJs(`
    (() => {
      const agotadoCard = document.querySelector('.wholesale-card.is-agotado');
      const agotadoTitle = agotadoCard ? agotadoCard.querySelector('.wholesale-title')?.textContent?.trim() : 'Vibes Get Comfy 3.4 Oz Edp Unisex';
      const agotadoId = agotadoCard ? agotadoCard.getAttribute('data-id') : 'prod-agotado';

      const itemValido = {
        id: 'gl-1',
        producto: '9 Am Dive 3.4 Oz Edp Unisex',
        precioUSA: 19.71,
        puestoPeru: 90.00,
        cantidad: 3,
        subtotal: 270,
        imagen: ''
      };
      const itemAgotado = {
        id: agotadoId,
        producto: agotadoTitle,
        precioUSA: 11.95,
        puestoPeru: 85,
        cantidad: 1,
        subtotal: 85,
        imagen: ''
      };
      localStorage.setItem('glexpress_carrito_v1', JSON.stringify([itemValido, itemAgotado]));
      location.reload();
    })()
  `);
  await new Promise(r => setTimeout(r, 2000));

  const agotadoCheck = await evalJs(`
    (() => {
      const bar = document.getElementById('floating-cart-bar');
      const status = document.getElementById('floating-cart-status');
      return {
        barHidden: bar ? bar.classList.contains('is-hidden') : true,
        statusText: status ? status.textContent.trim() : '',
        hasWarningClass: status ? status.classList.contains('is-warning') : false,
        statusDisplay: status ? status.style.display : ''
      };
    })()
  `);
  console.log('Resultado con producto agotado:', agotadoCheck);
  assert.strictEqual(agotadoCheck.barHidden, false, 'Barra debe permanecer visible');
  assert.strictEqual(agotadoCheck.statusText, 'Revisa los productos agotados');
  assert.strictEqual(agotadoCheck.hasWarningClass, true);
  assert.strictEqual(agotadoCheck.statusDisplay, 'block');
  console.log('✔ Prioridad de agotados superada: muestra "Revisa los productos agotados" con clase is-warning.');

  // Captura 3: Producto agotado en carrito
  const screenshotAgotado = await send('Page.captureScreenshot', { format: 'png' });
  const agotadoPath = path.join(artifactDir, 'screenshot_aviso_agotados.png');
  fs.writeFileSync(agotadoPath, Buffer.from(screenshotAgotado.data, 'base64'));
  console.log('✔ Captura guardada: screenshot_aviso_agotados.png');

  console.log('\n============================================================');
  console.log('VERIFICACIÓN 3: Espacio Inferior y Despeje de la Última Fila');
  console.log('============================================================');

  // Scroll instantáneo hasta abajo del todo con barra visible
  await evalJs(`document.documentElement.style.scrollBehavior = 'auto';`);
  await evalJs(`window.scrollTo(0, document.documentElement.scrollHeight);`);
  await new Promise(r => setTimeout(r, 800));

  const clearanceCheck = await evalJs(`
    (() => {
      const bar = document.getElementById('floating-cart-bar');
      const cards = document.querySelectorAll('.wholesale-card');
      const lastCard = cards[cards.length - 1];
      
      const barRect = bar ? bar.getBoundingClientRect() : null;
      const lastCardRect = lastCard ? lastCard.getBoundingClientRect() : null;
      
      const lastBtn = lastCard ? (lastCard.querySelector('.btn-add-wholesale') || lastCard.querySelector('.wholesale-btn-stepper')) : null;
      const lastBtnRect = lastBtn ? lastBtn.getBoundingClientRect() : null;

      return {
        scrollY: window.scrollY,
        maxScroll: document.documentElement.scrollHeight - window.innerHeight,
        barTop: barRect ? barRect.top : 0,
        barHeight: barRect ? barRect.height : 0,
        lastCardBottom: lastCardRect ? lastCardRect.bottom : 0,
        lastBtnBottom: lastBtnRect ? lastBtnRect.bottom : 0,
        clearanceBelowCard: barRect && lastCardRect ? (barRect.top - lastCardRect.bottom) : 0,
        clearanceBelowBtn: barRect && lastBtnRect ? (barRect.top - lastBtnRect.bottom) : 0
      };
    })()
  `);
  console.log('Medición de despeje al final de página:', clearanceCheck);
  assert.ok(clearanceCheck.clearanceBelowCard > 0, 'La última tarjeta debe quedar completamente por encima de la barra');
  assert.ok(clearanceCheck.clearanceBelowBtn > 0, 'Los botones de la última tarjeta deben quedar completamente por encima de la barra');
  console.log(`✔ Despeje validado: ${clearanceCheck.clearanceBelowCard.toFixed(1)}px entre la última tarjeta y la barra.`);

  console.log('\n============================================================');
  console.log('VERIFICACIÓN 4: Anchos Responsivos (320px, 375px, 430px, Desktop)');
  console.log('============================================================');

  const viewports = [
    { width: 320, height: 600, name: '320px (Móvil Ultra Estrecho)' },
    { width: 375, height: 667, name: '375px (iPhone SE)' },
    { width: 430, height: 932, name: '430px (iPhone 14 Pro Max)' },
    { width: 1024, height: 768, name: '1024px (Escritorio)' }
  ];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 768
    });
    await new Promise(r => setTimeout(r, 600));

    const checkOverflow = await evalJs(`
      (() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const status = document.getElementById('floating-cart-status');
        const statusRect = status ? status.getBoundingClientRect() : null;
        const bar = document.getElementById('btn-abrir-carrito-flotante');
        const barRect = bar ? bar.getBoundingClientRect() : null;
        return {
          hasHorizontalScroll: docWidth > winWidth,
          docWidth,
          winWidth,
          statusFitsInBar: statusRect && barRect ? statusRect.right <= (barRect.right + 1) : true
        };
      })()
    `);

    console.log(`Viewport ${vp.name}:`, checkOverflow);
    assert.strictEqual(checkOverflow.hasHorizontalScroll, false, `No debe haber scroll horizontal en ${vp.name}`);
    assert.strictEqual(checkOverflow.statusFitsInBar, true, `El texto debe caber dentro de la barra en ${vp.name}`);
    console.log(`✔ ${vp.name} validado sin desbordamientos.`);
  }

  // Limpiar localStorage de prueba al finalizar
  await evalJs(`localStorage.removeItem('glexpress_carrito_v1');`);

  console.log('\n============================================================');
  console.log('🎉 TODAS LAS VERIFICACIONES COMPLETADAS CON ÉXITO AL 100%');
  console.log('============================================================');

  edgeProcess.kill();
  server.close();
  process.exit(0);
}

run().catch(err => {
  console.error('Error durante la verificación:', err);
  process.exit(1);
});
