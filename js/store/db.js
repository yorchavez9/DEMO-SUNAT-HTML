var App = window.App || (window.App = {});

/**
 * Capa de datos del sistema.
 *
 * El sistema se entrega VACÍO: no hay productos, clientes ni ningún dato de
 * ejemplo. Cada negocio carga los suyos, y todo vive en el localStorage de su
 * navegador (el navegador no puede escribir en el disco).
 *
 * data/seed.js solo aporta los rubros —nombre, icono y color, para la
 * identidad visual— y la ficha vacía de la empresa. Se carga con <script src>
 * y no con fetch, para que el sistema funcione igual abriendo index.html con
 * doble clic (file://) que servido por HTTP.
 *
 * Los .json de data/ son la fuente editable; data/seed.js se genera a partir
 * de ellos con `node data/build-seed.js`.
 */
(function () {
  var PREFIX = 'sistema_v1_';
  var COLS = ['productos', 'categorias', 'clientes', 'proveedores', 'compras', 'inventario'];

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

  /**
   * Carga en memoria lo que el negocio ya tiene guardado. Una colección que
   * todavía no existe arranca vacía. Nunca se pisa lo que hay en localStorage.
   * Devuelve los nombres de las colecciones que no existían.
   */
  function cargarColecciones() {
    var nuevas = [];
    COLS.forEach(function (col) {
      var local = leerLocal(col);
      if (Array.isArray(local)) { cache[col] = local; return; }
      cache[col] = [];
      escribirLocal(col, cache[col]);
      nuevas.push(col);
    });
    return nuevas;
  }

  /**
   * El producto guarda el NOMBRE de su categoría, no un id. Esta función
   * levanta el catálogo de categorías a partir de los nombres que ya usan los
   * productos: sirve para los catálogos de ejemplo (que no traen categorías
   * sueltas) y para los negocios que venían de antes de que existiera el
   * módulo. Solo se llama cuando la colección aún no existía.
   */
  function derivarCategorias() {
    var vistas = {};
    var nuevas = [];
    (cache.productos || []).forEach(function (p) {
      var nombre = (p.categoria || '').trim();
      if (!nombre || vistas[nombre]) return;
      vistas[nombre] = true;
      nuevas.push(nombre);
    });

    cache.categorias = nuevas.sort().map(function (nombre, i) {
      return { id: i + 1, nombre: nombre, descripcion: '', activo: true };
    });
    escribirLocal('categorias', cache.categorias);
    return cache.categorias.length;
  }

  App.DB = {
    COLECCIONES: COLS,

    /**
     * Carga rubros, empresa y las colecciones desde localStorage.
     *
     * Regla que no se rompe: los datos del negocio mandan. Arrancar el sistema
     * jamás borra, reemplaza ni inventa nada. Lo que no existe todavía arranca
     * vacío, y punto.
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

        var nuevas = cargarColecciones();

        // Negocio que ya tenía productos antes de que existiera el módulo de
        // categorías: se le arma el catálogo con lo que ya usaba
        if (nuevas.indexOf('categorias') !== -1 && (cache.productos || []).length > 0) {
          derivarCategorias();
        }

        return Promise.resolve(true);
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

    /**
     * Fija el rubro del negocio. Solo afecta a la identidad visual (nombre,
     * icono y color del sistema): NO toca ni un dato. El sistema se entrega
     * vacío y cada negocio carga lo suyo.
     */
    elegirRubro: function (id) {
      try {
        if (!App.DB.rubro(id)) throw new Error('No existe el rubro "' + id + '".');
        App.DB.guardarEmpresa({ rubro: id });
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

    // ─── Categorías ───────────────────────────────────────────────
    /**
     * El producto guarda el nombre de la categoría, no su id. Es lo que ya
     * hacían los catálogos de ejemplo y las pantallas que la muestran, así que
     * el módulo administra ese catálogo y arrastra el nombre al renombrar.
     */
    categoriasActivas: function () {
      return App.DB.all('categorias')
        .filter(function (c) { return c.activo !== false; })
        .sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
    },

    categoriaPorNombre: function (nombre) {
      var buscado = (nombre || '').trim().toLowerCase();
      return App.DB.all('categorias').find(function (c) {
        return c.nombre.toLowerCase() === buscado;
      }) || null;
    },

    /** Cuántos productos usa cada categoría, indexado por nombre. */
    contarProductosPorCategoria: function () {
      var cuenta = {};
      App.DB.all('productos').forEach(function (p) {
        var n = (p.categoria || '').trim();
        if (n) cuenta[n] = (cuenta[n] || 0) + 1;
      });
      return cuenta;
    },

    /**
     * Alta o edición. Al renombrar hay que arrastrar el nombre nuevo a todos
     * los productos que la usaban, o se quedarían apuntando a una categoría
     * que ya no existe.
     */
    guardarCategoria: function (datos, id) {
      if (!id) return App.DB.insert('categorias', datos);

      var actual = App.DB.find('categorias', id);
      if (!actual) return null;
      var anterior = actual.nombre;

      var guardada = App.DB.update('categorias', id, datos);
      if (anterior !== guardada.nombre) {
        var tocados = 0;
        cache.productos.forEach(function (p) {
          if (p.categoria === anterior) { p.categoria = guardada.nombre; tocados++; }
        });
        if (tocados > 0) persistir('productos');
      }
      return guardada;
    },

    /** No se borra una categoría con productos dentro: se avisa cuántos son. */
    eliminarCategoria: function (id) {
      var cat = App.DB.find('categorias', id);
      if (!cat) return { ok: false, motivo: 'no-existe', productos: 0 };

      var enUso = App.DB.all('productos').filter(function (p) {
        return p.categoria === cat.nombre;
      }).length;
      if (enUso > 0) return { ok: false, motivo: 'en-uso', productos: enUso };

      App.DB.remove('categorias', id);
      return { ok: true, productos: 0 };
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

    // ─── Borrado ──────────────────────────────────────────────────
    /**
     * Deja el negocio en cero: vacía todas las colecciones y la ficha de la
     * empresa. No hay vuelta atrás; lo único recuperable es lo que se haya
     * exportado antes a JSON.
     *
     * No toca el usuario ni las credenciales SUNAT: viven bajo otro prefijo y
     * los gestiona js/store.js (ver App.borrarCuenta).
     *
     * Devuelve cuántos registros había en cada colección, para informarlo.
     */
    borrarDatos: function () {
      var borrado = {};

      COLS.forEach(function (col) {
        borrado[col] = (cache[col] || []).length;
        cache[col] = [];
        escribirLocal(col, cache[col]);
      });

      empresa = clonar(semilla().empresa);
      escribirLocal('empresa', empresa);

      COLS.forEach(emitir);
      emitir('empresa');
      return borrado;
    },
  };
})();
