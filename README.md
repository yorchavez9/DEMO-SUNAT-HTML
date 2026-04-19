# Demo Cliente — HTML + JavaScript (abrir y usar)

Misma demo que `demo-cliente/` pero en HTML y JavaScript puros. **No requiere servidor.** Solo abre `index.html` con doble clic y funciona.

## Cómo usar

1. Abre `index.html` con doble clic — se abre en el navegador.
2. Te lleva automáticamente a **Configuración**.
3. Ingresa:
   - **URL Base**: `https://api.kodevo.es/sunat-api/api/v1` (producción) o tu dominio
   - **X-Api-Key** y **X-Api-Secret**
4. Click en **Probar conexión** → **Ir al Dashboard**.

> Nota: La API Laravel debe permitir CORS para `file://` (origen `null`) o ejecutarse en el mismo dominio. Si el navegador bloquea la conexión por CORS de API, sirve la carpeta por HTTP desde Laragon (`http://localhost/API-PRO/demo-cliente-html/`).

## Estructura

```
demo-cliente-html/
├── index.html              Shell SPA (Tailwind + Lucide CDN)
├── css/styles.css          Estilos
└── js/
    ├── data.js             PRODUCTOS_DEMO + CLIENTES_DEMO
    ├── utils.js            escapeHtml, fmtMoney, descargarBlob, estadoBadgeHTML
    ├── store.js            localStorage (base_url, api_key, api_secret)
    ├── api.js              Cliente HTTP
    ├── router.js           Hash router
    ├── app.js              Bootstrap
    ├── components/
    │   ├── sidebar.js
    │   ├── productPicker.js
    │   ├── clientPicker.js
    │   ├── clientSelector.js
    │   ├── itemsTable.js
    │   └── responseModal.js
    └── pages/
        ├── settings.js
        ├── dashboard.js
        ├── newInvoice.js
        ├── newBoleta.js          (2 botones: solo guardar / enviar a SUNAT)
        ├── newCreditNote.js
        ├── newDebitNote.js
        ├── newDispatchGuide.js
        ├── documentList.js
        └── summaries.js          (envío + anulación de resumen diario)
```

Todo vive en un namespace global `App` (ej: `App.api`, `App.Settings`, `App.ProductPicker`) — sin `import`/`export`, sin bundler, sin build.

## Qué incluye

- **Dashboard** — ventas hoy/semana/mes, crecimiento, documentos recientes.
- **Emitir** — Factura, Boleta, NC, ND, Guía de Remisión.
- **Resumen Diario** — envío y anulación de boletas en lote.
- **Consultar** — listado por tipo con filtros y descarga directa PDF/XML/CDR.
- **Modal de respuesta** — visor PDF embebido con 4 formatos (ticket 58/80, A4, A5).
