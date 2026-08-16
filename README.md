# Sistema de facturación electrónica — Demo HTML + JavaScript

Sistema demo **multi-rubro**: el negocio elige a qué se dedica y arranca con el catálogo de productos, clientes y proveedores de ese rubro. Emite comprobantes electrónicos contra la API SUNAT y además gestiona catálogo, clientes, proveedores, compras e inventario.

HTML y JavaScript puros: sin `import`/`export`, sin bundler, sin build. Todo vive en el namespace global `App`.

## Rubros incluidos

| Rubro | Qué trae |
|---|---|
| Ferretería y construcción | Cemento, fierro, herramientas, gasfitería, seguridad industrial |
| Bodega y minimarket | Abarrotes, bebidas, snacks, limpieza, cuidado personal |
| Restaurante y pollería | Platos a la carta, pollos a la brasa, bebidas, postres, delivery |
| Farmacia y botica | Medicamentos, insumos de curación, vitaminas, servicios de salud |
| Ropa y calzado | Prendas de dama, caballero y niños, calzado, accesorios |
| Librería y útiles | Papelería, útiles escolares, libros, fotocopiado |
| Tecnología y cómputo | Laptops, componentes, periféricos, redes, soporte técnico |
| Repuestos y autopartes | Lubricantes, filtros, frenos, suspensión, llantas, taller |
| Agroveterinaria | Fertilizantes, agroquímicos, semillas, alimento pecuario, veterinaria |
| Servicios profesionales | Contabilidad, auditoría, legal, RR.HH., tecnología, consultoría |

Cada rubro trae 25–34 productos con su código SUNAT, unidad de medida del catálogo 06 y afectación al IGV correcta (gravado, exonerado, inafecto e ICBPER donde corresponde), más clientes, proveedores, compras e inventario coherentes entre sí.

Agregar un rubro nuevo es crear `data/catalogos/<id>.json` y una fila en `data/rubros.json` — no hay que tocar código.

## Cómo usar

**Necesita servirse por HTTP** (los datos se cargan con `fetch` desde `data/`, y `fetch` está bloqueado en `file://`). Con Laragon:

```
http://localhost/DEMO-SUNAT-API/demo-sunat-html/
```

O con cualquier servidor estático desde esta carpeta, por ejemplo `python -m http.server 8765`.

1. Entra con las credenciales de prueba: usuario `demo`, contraseña `demo123`.
2. **Elige tu rubro** y pon el nombre de tu negocio → se carga su catálogo.
3. En **Configuración** ingresa URL base, `X-Api-Key` y `X-Api-Secret`.
4. **Probar conexión** → **Ir al Dashboard**.

El nombre, el ícono y el color del sistema salen del negocio y su rubro: se ven en el menú, en el encabezado móvil, en el login y en el título de la pestaña.

## Dónde viven los datos

La semilla está en `data/` (es la fuente de verdad del repo). Al elegir rubro se copia a `localStorage` y a partir de ahí **todos los cambios se guardan en el navegador**: el navegador no puede escribir en el disco por sí solo.

Para dejar tus cambios fijos en el proyecto: **Configuración → Datos del sistema → Exportar JSON** y reemplaza con eso el catálogo correspondiente. Ahí mismo están **Importar JSON** y **Restaurar datos de ejemplo**.

## Estructura

```
demo-sunat-html/
├── index.html              Shell SPA (Tailwind + Lucide + Chart.js por CDN)
├── css/styles.css          Estilos
├── data/                   Semilla de datos (JSON)
│   ├── rubros.json         Los 10 rubros: nombre, descripción, ícono y color
│   ├── empresa.json        Datos del negocio y rubro elegido
│   └── catalogos/          Un archivo por rubro con productos, clientes,
│       ├── ferreteria.json   proveedores, compras e inventario de ejemplo
│       ├── bodega.json
│       └── ...
└── js/
    ├── utils.js            escapeHtml, fmtMoney, branding, descargarBlob
    ├── store.js            localStorage de credenciales y sesión
    ├── store/db.js         App.DB — rubros, empresa, CRUD, stock y respaldo
    ├── api.js              Cliente HTTP
    ├── router.js           Hash router
    ├── app.js              Bootstrap (espera a App.DB.init antes de renderizar)
    ├── components/
    │   ├── sidebar.js
    │   ├── modal.js             App.modalHTML / bindModal / confirmarHTML
    │   ├── productPicker.js     lee de App.DB
    │   ├── clientPicker.js      lee de App.DB
    │   ├── clientSelector.js
    │   ├── itemsTable.js        catálogo de unidades SUNAT
    │   └── responseModal.js
    └── pages/
        ├── login.js
        ├── bienvenida.js        Onboarding: elección de rubro
        ├── settings.js          Mi negocio, rubro, API y respaldo de datos
        ├── dashboard.js
        ├── productos.js         CRUD del catálogo
        ├── contactos.js         CRUD de clientes y proveedores (misma clase)
        ├── compras.js           Compras a proveedores → suman stock
        ├── inventario.js        Stock, alertas, ajustes e historial
        ├── newInvoice.js        Al emitir descuenta stock
        ├── newBoleta.js         Al emitir descuenta stock
        ├── newCreditNote.js
        ├── newDebitNote.js
        ├── newDispatchGuide.js
        ├── documentList.js
        ├── summaries.js
        └── anulaciones.js
```

## Qué incluye

### Facturación electrónica
- **Dashboard** — ventas hoy/semana/mes, crecimiento, documentos recientes.
- **Emitir** — Factura, Boleta, NC, ND, Guía de Remisión.
- **Resumen Diario** — envío y anulación de boletas en lote.
- **Anulaciones** — comunicación de baja.
- **Consultar** — listado por tipo con filtros y descarga directa PDF/XML/CDR.
- **Modal de respuesta** — visor PDF embebido con 4 formatos (ticket 58/80, A4, A5).

### Gestión del negocio
- **Productos** — alta, edición y baja del catálogo: código interno y SUNAT, unidad de medida, precio, costo, afectación al IGV, ICBPER y control de stock.
- **Inventario** — stock por producto, alertas de stock mínimo y sin stock, valor del inventario, ajustes manuales e historial de movimientos.
- **Compras** — registro de facturas de proveedor; cada compra suma stock y actualiza el costo del producto. Eliminar una compra revierte el stock.
- **Clientes** y **Proveedores** — CRUD con consulta de RUC/DNI a SUNAT/RENIEC vía api.json.pe.
- **Mi negocio** — nombre comercial, razón social, RUC, dirección y contacto; y cambio de rubro.

El inventario se mueve solo: una **compra** genera entradas, una **factura o boleta emitida** genera salidas, y los ajustes manuales quedan registrados con su motivo.

## Agregar un rubro nuevo

1. Crea `data/catalogos/mi-rubro.json` con las claves `productos`, `clientes`, `proveedores`, `compras` e `inventario`.
2. Agrega una fila en `data/rubros.json` con `id`, `nombre`, `descripcion`, `icono` (nombre de un ícono de Lucide) y `color` (hex).

Aparece solo en la pantalla de bienvenida y en el selector de Configuración. Las unidades de medida de los productos tienen que existir en `App.SUNAT_UNITS` (`js/components/itemsTable.js`) y `tip_afe_igv` debe ser `10`, `20`, `30` o `40`.
