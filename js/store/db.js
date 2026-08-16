var App = window.App || (window.App = {});

/**
 * Capa de datos del sistema. Sirve para cualquier rubro: el catálogo de
 * productos, clientes y proveedores sale del rubro que el negocio elige.
 *
 * Cómo funciona:
 *   1. data/seed.js define App.SEED con los rubros, la empresa y el catálogo
 *      de ejemplo de cada rubro. Se carga con <script src>, así que el sistema
 *      funciona igual abriendo index.html con doble clic (file://) que servido
 *      por HTTP. No se usa fetch para los datos.
 *   2. Al elegir rubro se copia su catálogo a localStorage; desde ahí se lee
 *      y escribe todo (el navegador no puede escribir en el disco).
 *   3. Para dejar los cambios fijos en el proyecto: Configuración → Exportar
 *      JSON, reemplazar los archivos de data/ y ejecutar `node data/build-seed.js`.
 *
 * Los .json de data/ siguen siendo la fuente editable; data/seed.js se genera
 * a partir de ellos.
 */
(function () {
  var PREFIX = 'sistema_v1_';
  var COLS = ['productos', 'clientes', 'proveedores', 'compras', 'inventario'];

  var cache = {};
  var empresa = null;
  var rubros = [];
  var listeners = [];

  function key(nombre) { return PREFIX + nombre; }

  function leerLocal(nombre) {
    try {
      var raw = localStorage.getItem(key(nombre));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function escribirLocal(nombre, valor) {
    localStorage.setItem(key(nombre), JSON.stringify(valor));
  }

  /** Copia profunda: la semilla nunca debe mutarse, se reutiliza al restaurar. */
  function clonar(valor) {
    return JSON.parse(JSON.stringify(valor));
  }

  function semilla() {
    if (!App.SEED) {
      throw new Error('No se encontró data/seed.js. Regenéralo con: node data/build-seed.js');
    }
    return App.SEED;
  }

  function emitir(nombre) {
    listeners.forEach(function (cb) {
      try { cb(nombre); } catch (e) { /* un listener roto no debe tumbar el guardado */ }
    });
  }

  function persistir(col) {
    escribirLocal(col, cache[col]);
    emitir(col);
  }

  function siguienteId(col) {
    return cache[col].reduce(function (max, r) { return Math.max(max, Number(r.id) || 0); }, 0) + 1;
  }

  function hoyISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function vaciarColecciones() {
    COLS.forEach(function (col) { cache[col] = []; escribirLocal(col, []); });
  }

  App.DB = {
    COLECCIONES: COLS,

    /**
     * Carga rubros, empresa y las 5 colecciones. Si el negocio todavía no
     * eligió rubro, las colecciones arrancan vacías: el negocio carga sus
     * propios datos o un catálogo de ejemplo desde Configuración.
     */
    init: function () {
      try {
        var datos = semilla();
        rubros = datos.rubros;

        empresa = leerLocal('empresa');
        if (!empresa) {
          empresa = clonar(datos.empresa);
          escribirLocal('empresa', empresa);
        }

        if (!empresa.rubro) {
          vaciarColecciones();
          return Promise.resolve(true);
        }

        var faltantes = COLS.filter(function (col) {
          var local = leerLocal(col);
          if (Array.isArray(local)) { cache[col] = local; return false; }
          return true;
        });
        if (faltantes.length === 0) return Promise.resolve(true);

        // Primera vez con este rubro: se copia su catálogo de ejemplo
        return App.DB.aplicarRubro(empresa.rubro);
      } catch (e) {
        return Promise.reject(e);
      }
    },

    onChange: function (cb) { listeners.push(cb); },

    // ─── Empresa y rubro ──────────────────────────────────────────
    empresa: function () { return empresa || {}; },

    guardarEmpresa: function (datos) {
      empresa = Object.assign({}, empresa, datos);
      escribirLocal('empresa', empresa);
      emitir('empresa');
      return empresa;
    },

    rubros: function () { return rubros; },

    rubro: function (id) {
      return rubros.find(function (r) { return r.id === (id || (empresa && empresa.rubro)); }) || null;
    },

    /** Copia el catálogo de ejemplo del rubro y lo deja como datos del negocio. */
    aplicarRubro: function (id) {
      try {
        var cat = semilla().catalogos[id];
        if (!cat) throw new Error('No existe el catálogo del rubro "' + id + '".');

        COLS.forEach(function (col) {
          // Se clona para no dejar que la edición del negocio toque la semilla
          cache[col] = Array.isArray(cat[col]) ? clonar(cat[col]) : [];
          escribirLocal(col, cache[col]);
        });
        App.DB.guardarEmpresa({ rubro: id });
        COLS.forEach(emitir);
        return Promise.resolve(true);
      } catch (e) {
        return Promise.reject(e);
      }
    },

    // ─── CRUD genérico ────────────────────────────────────────────
    all: function (col) { return cache[col] || []; },

    find: function (col, id) {
      return (cache[col] || []).find(function (r) { return String(r.id) === String(id); }) || null;
    },

    insert: function (col, registro) {
      var nuevo = Object.assign({}, registro, { id: siguienteId(col) });
      cache[col].push(nuevo);
      persistir(col);
      return nuevo;
    },

    update: function (col, id, cambios) {
      var actual = App.DB.find(col, id);
      if (!actual) return null;
      Object.assign(actual, cambios, { id: actual.id });
      persistir(col);
      return actual;
    },

    remove: function (col, id) {
      var idx = cache[col].findIndex(function (r) { return String(r.id) === String(id); });
      if (idx === -1) return false;
      cache[col].splice(idx, 1);
      persistir(col);
      return true;
    },

    // ─── Atajos de dominio ────────────────────────────────────────
    productosActivos: function () {
      return App.DB.all('productos').filter(function (p) { return p.activo !== false; });
    },

    clientesActivos: function () {
      return App.DB.all('clientes').filter(function (c) { return c.activo !== false; });
    },

    proveedoresActivos: function () {
      return App.DB.all('proveedores').filter(function (p) { return p.activo !== false; });
    },

    productoPorCodigo: function (codigo) {
      return App.DB.all('productos').find(function (p) { return p.codigo === codigo; }) || null;
    },

    categorias: function () {
      var vistas = {};
      App.DB.all('productos').forEach(function (p) { if (p.categoria) vistas[p.categoria] = true; });
      return Object.keys(vistas).sort();
    },

    // ─── Inventario ───────────────────────────────────────────────
    /**
     * Registra un movimiento y ajusta el stock del producto.
     * `cantidad` va con signo: positiva suma, negativa resta.
     */
    movimiento: function (mov) {
      var prod = mov.producto_id != null
        ? App.DB.find('productos', mov.producto_id)
        : App.DB.productoPorCodigo(mov.codigo);
      if (!prod || prod.controla_stock === false) return null;

      var registro = App.DB.insert('inventario', {
        fecha: mov.fecha || hoyISO(),
        tipo: mov.tipo,
        producto_id: prod.id,
        codigo: prod.codigo,
        descripcion: prod.descripcion,
        cantidad: Number(mov.cantidad),
        costo_unitario: mov.costo_unitario != null ? Number(mov.costo_unitario) : prod.costo_unitario,
        motivo: mov.motivo || '',
        ref: mov.ref || null,
      });

      App.DB.update('productos', prod.id, {
        stock: Math.max(0, Number(prod.stock || 0) + Number(mov.cantidad)),
      });
      return registro;
    },

    /** Guarda una compra, suma stock y actualiza el costo de cada producto. */
    registrarCompra: function (compra) {
      var guardada = App.DB.insert('compras', compra);
      guardada.items.forEach(function (it) {
        App.DB.movimiento({
          fecha: guardada.fecha,
          tipo: 'entrada',
          producto_id: it.producto_id,
          codigo: it.codigo,
          cantidad: Number(it.cantidad),
          costo_unitario: Number(it.costo_unitario),
          motivo: 'Compra ' + guardada.serie + '-' + guardada.numero + ' · ' + guardada.proveedor,
          ref: 'compra:' + guardada.id,
        });
        // El último costo de compra pasa a ser el costo del producto
        App.DB.update('productos', it.producto_id, { costo_unitario: Number(it.costo_unitario) });
      });
      return guardada;
    },

    /** Elimina una compra y revierte el stock que había sumado. */
    eliminarCompra: function (id) {
      var compra = App.DB.find('compras', id);
      if (!compra) return false;
      compra.items.forEach(function (it) {
        App.DB.movimiento({
          tipo: 'ajuste',
          producto_id: it.producto_id,
          codigo: it.codigo,
          cantidad: -Number(it.cantidad),
          costo_unitario: Number(it.costo_unitario),
          motivo: 'Reversión de compra ' + compra.serie + '-' + compra.numero,
          ref: 'compra-anulada:' + compra.id,
        });
      });
      return App.DB.remove('compras', id);
    },

    /**
     * Descuenta stock por una venta emitida. `items` son las líneas del
     * comprobante; las que no existan en el catálogo se ignoran.
     */
    registrarVenta: function (items, referencia) {
      (items || []).forEach(function (it) {
        var prod = App.DB.productoPorCodigo(it.codigo);
        if (!prod || prod.controla_stock === false) return;
        App.DB.movimiento({
          tipo: 'salida',
          producto_id: prod.id,
          cantidad: -Math.abs(Number(it.cantidad) || 0),
          motivo: referencia || 'Venta',
          ref: null,
        });
      });
    },

    movimientosDe: function (codigo) {
      return App.DB.all('inventario').filter(function (m) { return m.codigo === codigo; });
    },

    bajoStock: function () {
      return App.DB.all('productos').filter(function (p) {
        return p.controla_stock !== false && Number(p.stock || 0) <= Number(p.stock_min || 0);
      });
    },

    valorInventario: function () {
      return App.DB.all('productos').reduce(function (s, p) {
        if (p.controla_stock === false) return s;
        return s + Number(p.stock || 0) * Number(p.costo_unitario || 0);
      }, 0);
    },

    // ─── Respaldo ─────────────────────────────────────────────────
    exportar: function () {
      var salida = { _version: 1, _exportado_en: new Date().toISOString(), empresa: empresa };
      COLS.forEach(function (col) { salida[col] = cache[col]; });
      return salida;
    },

    descargarExport: function () {
      var nombre = (empresa && empresa.rubro) || 'sistema';
      var blob = new Blob([JSON.stringify(App.DB.exportar(), null, 2)], { type: 'application/json' });
      App.descargarBlob(blob, nombre + '-datos-' + hoyISO() + '.json');
    },

    importar: function (objeto) {
      var encontradas = COLS.filter(function (col) { return Array.isArray(objeto[col]); });
      if (encontradas.length === 0 && !objeto.empresa) {
        throw new Error('El archivo no contiene ninguna colección válida.');
      }
      encontradas.forEach(function (col) {
        cache[col] = objeto[col];
        escribirLocal(col, cache[col]);
        emitir(col);
      });
      if (objeto.empresa) {
        empresa = objeto.empresa;
        escribirLocal('empresa', empresa);
        emitir('empresa');
        encontradas.push('empresa');
      }
      return encontradas;
    },

    /** Vuelve a copiar el catálogo de ejemplo del rubro actual. */
    restaurarSemilla: function () {
      if (!empresa || !empresa.rubro) return Promise.reject(new Error('Todavía no eliges un rubro.'));
      return App.DB.aplicarRubro(empresa.rubro);
    },
  };
})();
