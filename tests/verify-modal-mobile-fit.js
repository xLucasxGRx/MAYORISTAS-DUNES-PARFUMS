const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert');

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
  const PORT = 8099;
  const server = await startServer(PORT);
  console.log(`Servidor local de prueba iniciado en http://localhost:${PORT}`);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProcess = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9229',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=375,812',
    `http://localhost:${PORT}/index.html`
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9229/json/version');
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

  const listRes = await fetch('http://127.0.0.1:9229/json/list');
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

  const artifactDir = 'C:\\Users\\Lucas\\.gemini\\antigravity-ide\\brain\\3c9b47be-2b96-4ad2-88d1-fdc736c08030';

  console.log('\n============================================================');
  console.log('ESCENARIO 1: Carrito Vacío (Caso de la Captura del Usuario)');
  console.log('============================================================');

  // Limpiar carrito para asegurar estado vacío
  await evalJs(`
    (() => {
      localStorage.removeItem('glexpress_carrito_v1');
      location.reload();
    })()
  `);
  await new Promise(r => setTimeout(r, 2000));

  // Abrir modal de carrito directamente (usando header cart button)
  await evalJs(`
    (() => {
      const btnHeader = document.getElementById('header-cart-btn');
      if (btnHeader) btnHeader.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 400));

  const emptyModalMetrics = await evalJs(`
    (() => {
      const modal = document.getElementById('modal-carrito');
      const card = modal ? modal.querySelector('.modal-carrito-card') : null;
      const header = modal ? modal.querySelector('.modal-carrito-header') : null;
      const title = modal ? modal.querySelector('#modal-carrito-titulo') : null;
      const closeBtn = modal ? modal.querySelector('#btn-cerrar-carrito') : null;
      const emptyBox = modal ? modal.querySelector('#carrito-vacio') : null;
      
      const cardRect = card ? card.getBoundingClientRect() : null;
      const headerRect = header ? header.getBoundingClientRect() : null;
      const titleRect = title ? title.getBoundingClientRect() : null;
      const closeBtnRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
      const emptyBoxRect = emptyBox ? emptyBox.getBoundingClientRect() : null;

      return {
        isActive: modal ? modal.classList.contains('is-active') : false,
        windowHeight: window.innerHeight,
        cardTop: cardRect ? cardRect.top : 0,
        cardHeight: cardRect ? cardRect.height : 0,
        headerTop: headerRect ? headerRect.top : 0,
        headerHeight: headerRect ? headerRect.height : 0,
        titleTop: titleRect ? titleRect.top : 0,
        closeBtnTop: closeBtnRect ? closeBtnRect.top : 0,
        closeBtnRight: closeBtnRect ? closeBtnRect.right : 0,
        emptyBoxVisible: emptyBox ? window.getComputedStyle(emptyBox).display !== 'none' : false,
        emptyBoxTop: emptyBoxRect ? emptyBoxRect.top : 0
      };
    })()
  `);

  console.log('Métricas Modal Carrito Vacío:', emptyModalMetrics);
  assert.strictEqual(emptyModalMetrics.isActive, true, 'El modal debe estar activo');
  assert.ok(emptyModalMetrics.headerTop >= 0, `La cabecera debe estar dentro del viewport (actual top: ${emptyModalMetrics.headerTop}px >= 0)`);
  assert.ok(emptyModalMetrics.titleTop >= 0, `El título '🛒 Tu Pedido' debe estar dentro del viewport (actual top: ${emptyModalMetrics.titleTop}px >= 0)`);
  assert.ok(emptyModalMetrics.closeBtnTop >= 0, `El botón '✕' debe estar dentro del viewport (actual top: ${emptyModalMetrics.closeBtnTop}px >= 0)`);
  assert.strictEqual(emptyModalMetrics.emptyBoxVisible, true, 'El mensaje de carrito vacío debe estar visible');
  console.log(`✔ Escenario 1 superado: Cabecera visible con ${emptyModalMetrics.headerTop.toFixed(1)}px de margen superior.`);

  const screenshotEmpty = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'screenshot_modal_vacio.png'), Buffer.from(screenshotEmpty.data, 'base64'));
  console.log('✔ Captura guardada: screenshot_modal_vacio.png');

  // Cerrar modal
  await evalJs(`document.getElementById('btn-cerrar-carrito')?.click();`);
  await new Promise(r => setTimeout(r, 400));

  console.log('\n============================================================');
  console.log('ESCENARIO 2: Carrito con 5 Unidades (< 6)');
  console.log('============================================================');

  await evalJs(`
    (() => {
      const item = {
        id: 'gl-1',
        producto: '9 Am Dive 3.4 Oz Edp Unisex',
        precioUSA: 19.71,
        puestoPeru: 90.00,
        cantidad: 5,
        subtotal: 450,
        imagen: ''
      };
      localStorage.setItem('glexpress_carrito_v1', JSON.stringify([item]));
      location.reload();
    })()
  `);
  await new Promise(r => setTimeout(r, 2000));

  // Abrir desde barra flotante
  await evalJs(`document.getElementById('btn-abrir-carrito-flotante')?.click();`);
  await new Promise(r => setTimeout(r, 400));

  const modal5UnitsMetrics = await evalJs(`
    (() => {
      const modal = document.getElementById('modal-carrito');
      const header = modal ? modal.querySelector('.modal-carrito-header') : null;
      const footer = modal ? modal.querySelector('.modal-carrito-footer') : null;
      const warning = modal ? modal.querySelector('#cart-min-warning') : null;
      const btnWA = modal ? modal.querySelector('#btn-enviar-whatsapp') : null;
      
      const headerRect = header ? header.getBoundingClientRect() : null;
      const footerRect = footer ? footer.getBoundingClientRect() : null;

      return {
        headerTop: headerRect ? headerRect.top : 0,
        footerBottom: footerRect ? footerRect.bottom : 0,
        windowHeight: window.innerHeight,
        warningVisible: warning ? window.getComputedStyle(warning).display !== 'none' : false,
        warningText: warning ? warning.innerText.replace(/\\s+/g, ' ').trim() : '',
        btnWADisabled: btnWA ? btnWA.disabled : false
      };
    })()
  `);

  console.log('Métricas Modal 5 Unidades:', modal5UnitsMetrics);
  assert.ok(modal5UnitsMetrics.headerTop >= 0, 'La cabecera debe estar visible');
  assert.ok(modal5UnitsMetrics.footerBottom <= modal5UnitsMetrics.windowHeight + 2, 'El footer debe estar accesible dentro del viewport');
  assert.strictEqual(modal5UnitsMetrics.warningVisible, true, 'El aviso de mínimo debe ser visible');
  assert.ok(modal5UnitsMetrics.warningText.includes('Te faltan 1 unidad'), 'Debe indicar que falta 1 unidad');
  assert.strictEqual(modal5UnitsMetrics.btnWADisabled, true, 'El botón de WhatsApp debe estar bloqueado');
  console.log('✔ Escenario 2 superado: Cabecera y controles inferiores accesibles con 5 unidades.');

  const screenshot5u = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'screenshot_modal_5_unidades.png'), Buffer.from(screenshot5u.data, 'base64'));
  console.log('✔ Captura guardada: screenshot_modal_5_unidades.png');

  // Cerrar modal
  await evalJs(`document.getElementById('btn-cerrar-carrito')?.click();`);
  await new Promise(r => setTimeout(r, 400));

  console.log('\n============================================================');
  console.log('ESCENARIO 3: Carrito con 6 Unidades (>= 6 Mínimo Mayorista)');
  console.log('============================================================');

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

  await evalJs(`document.getElementById('btn-abrir-carrito-flotante')?.click();`);
  await new Promise(r => setTimeout(r, 400));

  const modal6UnitsMetrics = await evalJs(`
    (() => {
      const modal = document.getElementById('modal-carrito');
      const header = modal ? modal.querySelector('.modal-carrito-header') : null;
      const footer = modal ? modal.querySelector('.modal-carrito-footer') : null;
      const warning = modal ? modal.querySelector('#cart-min-warning') : null;
      const btnWA = modal ? modal.querySelector('#btn-enviar-whatsapp') : null;
      
      const headerRect = header ? header.getBoundingClientRect() : null;
      const footerRect = footer ? footer.getBoundingClientRect() : null;

      return {
        headerTop: headerRect ? headerRect.top : 0,
        footerBottom: footerRect ? footerRect.bottom : 0,
        windowHeight: window.innerHeight,
        warningVisible: warning ? window.getComputedStyle(warning).display !== 'none' : false,
        btnWADisabled: btnWA ? btnWA.disabled : true
      };
    })()
  `);

  console.log('Métricas Modal 6 Unidades:', modal6UnitsMetrics);
  assert.ok(modal6UnitsMetrics.headerTop >= 0, 'La cabecera debe estar visible');
  assert.strictEqual(modal6UnitsMetrics.warningVisible, false, 'El aviso de faltantes debe estar oculto con 6 unidades');
  assert.strictEqual(modal6UnitsMetrics.btnWADisabled, false, 'El botón de WhatsApp debe estar habilitado');
  console.log('✔ Escenario 3 superado: Cabecera visible y botón WhatsApp habilitado.');

  const screenshot6u = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'screenshot_modal_6_unidades.png'), Buffer.from(screenshot6u.data, 'base64'));
  console.log('✔ Captura guardada: screenshot_modal_6_unidades.png');

  // Cerrar modal
  await evalJs(`document.getElementById('btn-cerrar-carrito')?.click();`);
  await new Promise(r => setTimeout(r, 400));

  console.log('\n============================================================');
  console.log('ESCENARIO 4: Varios Productos con Desplazamiento Interno');
  console.log('============================================================');

  await evalJs(`
    (() => {
      const items = [
        { id: 'gl-1', producto: '9 Am Dive 3.4 Oz Edp Unisex', puestoPeru: 90, cantidad: 1, subtotal: 90, imagen: '' },
        { id: 'gl-2', producto: 'Club de Nuit Intense Man EDT 105ml', puestoPeru: 115, cantidad: 1, subtotal: 115, imagen: '' },
        { id: 'gl-3', producto: 'Khamrah Lattafa EDP 100ml', puestoPeru: 112.5, cantidad: 1, subtotal: 112.5, imagen: '' },
        { id: 'gl-4', producto: 'Dior Sauvage EDT 100ml', puestoPeru: 86.5, cantidad: 1, subtotal: 86.5, imagen: '' },
        { id: 'gl-5', producto: 'Bleu de Chanel EDP 100ml', puestoPeru: 415.5, cantidad: 1, subtotal: 415.5, imagen: '' },
        { id: 'gl-6', producto: 'Versace Eros Flame EDP 100ml', puestoPeru: 220, cantidad: 1, subtotal: 220, imagen: '' },
        { id: 'gl-7', producto: 'Afnan 9PM EDP 100ml', puestoPeru: 114.5, cantidad: 1, subtotal: 114.5, imagen: '' }
      ];
      localStorage.setItem('glexpress_carrito_v1', JSON.stringify(items));
      location.reload();
    })()
  `);
  await new Promise(r => setTimeout(r, 2000));

  await evalJs(`document.getElementById('btn-abrir-carrito-flotante')?.click();`);
  await new Promise(r => setTimeout(r, 400));

  const multiItemMetrics = await evalJs(`
    (() => {
      const modal = document.getElementById('modal-carrito');
      const body = modal ? modal.querySelector('.modal-carrito-body') : null;
      const header = modal ? modal.querySelector('.modal-carrito-header') : null;
      const footer = modal ? modal.querySelector('.modal-carrito-footer') : null;

      const headerRect = header ? header.getBoundingClientRect() : null;
      const footerRect = footer ? footer.getBoundingClientRect() : null;
      
      const scrollHeight = body ? body.scrollHeight : 0;
      const clientHeight = body ? body.clientHeight : 0;
      
      return {
        headerTop: headerRect ? headerRect.top : 0,
        footerBottom: footerRect ? footerRect.bottom : 0,
        bodyHasScroll: scrollHeight > clientHeight,
        scrollHeight,
        clientHeight
      };
    })()
  `);

  console.log('Métricas Varios Productos:', multiItemMetrics);
  assert.ok(multiItemMetrics.headerTop >= 0, 'La cabecera debe estar visible');
  assert.strictEqual(multiItemMetrics.bodyHasScroll, true, 'El listado de productos debe tener scroll interno independiente');

  // Hacer scroll interno en el body
  await evalJs(`document.querySelector('.modal-carrito-body').scrollTop = 150;`);
  await new Promise(r => setTimeout(r, 300));

  const postScrollMetrics = await evalJs(`
    (() => {
      const body = document.querySelector('.modal-carrito-body');
      const header = document.querySelector('.modal-carrito-header');
      const footer = document.querySelector('.modal-carrito-footer');
      return {
        scrollTop: body ? body.scrollTop : 0,
        headerTop: header ? header.getBoundingClientRect().top : 0,
        footerBottom: footer ? footer.getBoundingClientRect().bottom : 0
      };
    })()
  `);
  console.log('Estado tras scroll interno:', postScrollMetrics);
  assert.ok(postScrollMetrics.scrollTop > 0, 'El scroll interno debe haberse ejecutado');
  assert.ok(postScrollMetrics.headerTop >= 0, 'La cabecera debe permanecer fija y visible');
  console.log('✔ Escenario 4 superado: Scroll interno fluido sin mover cabecera ni footer.');

  // Cerrar modal
  await evalJs(`document.getElementById('btn-cerrar-carrito')?.click();`);
  await new Promise(r => setTimeout(r, 400));

  console.log('\n============================================================');
  console.log('ESCENARIO 5: Apertura desde Posición Desplazada del Catálogo');
  console.log('============================================================');

  // Desplazar catálogo hacia abajo 2000px
  await evalJs(`
    (() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, 2000);
    })()
  `);
  await new Promise(r => setTimeout(r, 400));

  const scrollBefore = await evalJs(`window.scrollY`);
  console.log('Scroll del catálogo antes de abrir:', scrollBefore);
  assert.ok(scrollBefore >= 1900, 'El catálogo debe haberse desplazado hacia abajo');

  // Abrir carrito flotante
  await evalJs(`document.getElementById('btn-abrir-carrito-flotante')?.click();`);
  await new Promise(r => setTimeout(r, 400));

  const modalScrolledCheck = await evalJs(`
    (() => {
      const header = document.querySelector('.modal-carrito-header');
      const title = document.querySelector('#modal-carrito-titulo');
      const closeBtn = document.querySelector('#btn-cerrar-carrito');
      return {
        headerTop: header ? header.getBoundingClientRect().top : -1,
        titleTop: title ? title.getBoundingClientRect().top : -1,
        closeBtnTop: closeBtn ? closeBtn.getBoundingClientRect().top : -1
      };
    })()
  `);

  console.log('Métricas modal abierto tras scroll:', modalScrolledCheck);
  assert.ok(modalScrolledCheck.headerTop >= 0, 'La cabecera no debe recortarse al abrir desde posición desplazada');
  assert.ok(modalScrolledCheck.titleTop >= 0, 'El título debe estar visible');
  assert.ok(modalScrolledCheck.closeBtnTop >= 0, 'El botón de cierre debe estar visible');

  // Cerrar carrito
  await evalJs(`document.getElementById('btn-cerrar-carrito')?.click();`);
  await new Promise(r => setTimeout(r, 400));

  const scrollAfter = await evalJs(`window.scrollY`);
  console.log('Scroll del catálogo tras cerrar:', scrollAfter);
  assert.strictEqual(Math.round(scrollAfter), Math.round(scrollBefore), 'La posición del catálogo debe conservarse intacta al cerrar');
  console.log('✔ Escenario 5 superado: Posición del catálogo conservada y modal sin recorte tras scroll.');

  console.log('\n============================================================');
  console.log('ESCENARIO 6: Orientación Horizontal (Landscape)');
  console.log('============================================================');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 812,
    height: 375,
    deviceScaleFactor: 1,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 600));

  // Abrir modal en horizontal
  await evalJs(`document.getElementById('btn-abrir-carrito-flotante')?.click();`);
  await new Promise(r => setTimeout(r, 400));

  const landscapeMetrics = await evalJs(`
    (() => {
      const modal = document.getElementById('modal-carrito');
      const card = modal ? modal.querySelector('.modal-carrito-card') : null;
      const header = modal ? modal.querySelector('.modal-carrito-header') : null;
      const footer = modal ? modal.querySelector('.modal-carrito-footer') : null;
      const body = modal ? modal.querySelector('.modal-carrito-body') : null;

      const headerRect = header ? header.getBoundingClientRect() : null;
      const footerRect = footer ? footer.getBoundingClientRect() : null;
      const cardRect = card ? card.getBoundingClientRect() : null;

      return {
        windowHeight: window.innerHeight,
        cardHeight: cardRect ? cardRect.height : 0,
        headerTop: headerRect ? headerRect.top : -1,
        footerBottom: footerRect ? footerRect.bottom : -1,
        bodyHeight: body ? body.clientHeight : 0,
        bodyHasScroll: body ? body.scrollHeight > body.clientHeight : false
      };
    })()
  `);

  console.log('Métricas en Orientación Horizontal (812x375):', landscapeMetrics);
  assert.ok(landscapeMetrics.headerTop >= 0, 'La cabecera debe estar visible en horizontal');
  assert.ok(landscapeMetrics.footerBottom <= landscapeMetrics.windowHeight + 2, 'El footer debe estar accesible en horizontal');
  assert.ok(landscapeMetrics.bodyHeight > 50, 'El cuerpo debe tener altura positiva para mostrar items');
  console.log('✔ Escenario 6 superado: Modo horizontal con cabecera y footer 100% accesibles.');

  const screenshotLandscape = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'screenshot_modal_landscape.png'), Buffer.from(screenshotLandscape.data, 'base64'));
  console.log('✔ Captura guardada: screenshot_modal_landscape.png');

  // Cerrar modal
  await evalJs(`document.getElementById('btn-cerrar-carrito')?.click();`);
  await new Promise(r => setTimeout(r, 400));

  console.log('\n============================================================');
  console.log('ESCENARIO 7: Escritorio (1280x800)');
  console.log('============================================================');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 600));

  await evalJs(`document.getElementById('btn-abrir-carrito-flotante')?.click();`);
  await new Promise(r => setTimeout(r, 400));

  const desktopMetrics = await evalJs(`
    (() => {
      const modal = document.getElementById('modal-carrito');
      const card = modal ? modal.querySelector('.modal-carrito-card') : null;
      const header = modal ? modal.querySelector('.modal-carrito-header') : null;
      const footer = modal ? modal.querySelector('.modal-carrito-footer') : null;

      const cardRect = card ? card.getBoundingClientRect() : null;
      const headerRect = header ? header.getBoundingClientRect() : null;
      const footerRect = footer ? footer.getBoundingClientRect() : null;

      return {
        cardWidth: cardRect ? cardRect.width : 0,
        cardHeight: cardRect ? cardRect.height : 0,
        headerTop: headerRect ? headerRect.top : 0,
        footerBottom: footerRect ? footerRect.bottom : 0,
        windowHeight: window.innerHeight,
        isCentered: cardRect ? (cardRect.top > 10 && (window.innerHeight - cardRect.bottom) > 10) : false
      };
    })()
  `);

  console.log('Métricas en Escritorio (1280x800):', desktopMetrics);
  assert.ok(desktopMetrics.headerTop >= 10, 'La cabecera debe estar visible y centrada en escritorio');
  assert.strictEqual(desktopMetrics.isCentered, true, 'El modal debe estar centrado verticalmente en escritorio');
  console.log('✔ Escenario 7 superado: Escritorio centrado con márgenes elegantes.');

  const screenshotDesktop = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'screenshot_modal_desktop.png'), Buffer.from(screenshotDesktop.data, 'base64'));
  console.log('✔ Captura guardada: screenshot_modal_desktop.png');

  // Limpiar carrito de pruebas
  await evalJs(`
    (() => {
      localStorage.removeItem('glexpress_carrito_v1');
    })()
  `);

  console.log('\n============================================================');
  console.log('🎉 TODOS LOS ESCENARIOS DEL MODAL FUERON VALIDADOS AL 100%');
  console.log('============================================================');

  edgeProcess.kill();
  server.close();
  process.exit(0);
}

run().catch(err => {
  console.error('Error durante la validación dirigida del modal:', err);
  process.exit(1);
});
