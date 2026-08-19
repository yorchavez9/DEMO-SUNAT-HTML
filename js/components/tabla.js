var App = window.App || (window.App = {});

/**
 * Tablas de registros con DataTables (buscador, orden por columna, paginación
 * y "mostrando X de Y"), sin tocar cada pantalla a mano.
 *
 * Cómo se usa:
 *   <table class="table-std js-dt" data-dt-key="productos">
 *
 * La tabla se inicializa sola: este archivo se engancha a App.refreshIcons(),
 * que todas las pantallas del proyecto llaman al terminar su render. No hay
 * que llamar a nada más.
 *
 * Atributos de la <table>:
 *   data-dt-key      Nombre para recordar búsqueda, orden y página entre
 *                    re-renders (al guardar o borrar un registro no se pierde
 *                    lo que el usuario estaba mirando).
 *   data-dt-length   Registros por página. Por defecto 10.
 *   data-dt-order    Orden inicial, "1:desc". Por defecto respeta el orden en
 *                    que la pantalla generó las filas.
 *   data-dt-buscar   Placeholder del buscador.
 *   data-dt-nosort   Índices de columna que no se ordenan, "3,5".
 *
 * En los <th>: data-nosort hace lo mismo para esa columna. Las columnas sin
 * título (las de botones) se marcan solas.
 *
 * Ordenar por número y no por texto: las celdas de importes, cantidades y
 * fechas llevan data-order con el valor crudo. DataTables lo detecta mirando
 * la primera fila, así que el atributo debe ir en todas las filas de esa
 * columna, no solo en algunas.
 */
(function () {
  var LARGO_POR_DEFECTO = 10;
  var MENU_LARGO = [10, 25, 50, 100];

  var instancias = [];   // { tabla, api, clave }
  var memoria = {};      // estado por data-dt-key

  function disponible() {
    return !!(window.jQuery && window.DataTable);
  }

  function enteros(texto) {
    return String(texto || '').split(',')
      .map(function (n) { return parseInt(n, 10); })
      .filter(function (n) { return !isNaN(n); });
  }

  /** Columnas que no se deben poder ordenar: las marcadas y las sin título. */
  function noOrdenables(tabla) {
    var cols = enteros(tabla.dataset.dtNosort);
    tabla.querySelectorAll('thead th').forEach(function (th, i) {
      if (th.hasAttribute('data-nosort') || th.textContent.trim() === '') cols.push(i);
    });
    return cols;
  }

  function ordenInicial(tabla) {
    var crudo = tabla.dataset.dtOrder;
    if (!crudo) return [];   // se respeta el orden con el que vino el HTML
    return crudo.split(',').map(function (par) {
      var p = par.split(':');
      return [parseInt(p[0], 10) || 0, (p[1] || 'asc').trim()];
    });
  }

  function iniciar(tabla) {
    if (tabla.dataset.dtListo === '1') return;

    var filas = tabla.querySelectorAll('tbody > tr').length;
    var largo = parseInt(tabla.dataset.dtLength, 10) || LARGO_POR_DEFECTO;
    // Con pocos registros el paginador y el selector de tamaño sobran
    var corta = filas <= largo;

    // Textos más cortos que los de la traducción oficial: el encabezado de la
    // tabla ya dice qué se está listando, no hace falta repetir "registros".
    var idioma = Object.assign({}, window.DT_ES || {}, {
      search: '',
      searchPlaceholder: tabla.dataset.dtBuscar || 'Buscar...',
      lengthMenu: '_MENU_ por página',
      info: 'Mostrando <strong>_START_–_END_</strong> de <strong>_TOTAL_</strong>',
      infoEmpty: 'Sin registros',
      // DataTables ya mete un espacio antes de este texto al concatenarlo
      infoFiltered: '· filtrado de _MAX_',
      zeroRecords: 'No se encontraron resultados',
      emptyTable: 'No hay registros',
    });

    var api = new window.DataTable(tabla, {
      language: idioma,
      autoWidth: false,
      pageLength: largo,
      lengthMenu: MENU_LARGO,
      // Anterior · números · Siguiente. "Primero/Último" sobran y ensucian.
      pagingType: 'simple_numbers',
      order: ordenInicial(tabla),
      columnDefs: [{ targets: noOrdenables(tabla), orderable: false }],
      layout: {
        topStart: corta ? null : 'pageLength',
        topEnd: 'search',
        bottomStart: 'info',
        bottomEnd: corta ? null : 'paging',
      },
    });

    tabla.dataset.dtListo = '1';

    var clave = tabla.dataset.dtKey || null;
    if (clave && memoria[clave]) restaurar(api, memoria[clave]);

    instancias.push({ tabla: tabla, api: api, clave: clave });
  }

  function restaurar(api, est) {
    if (est.largo) api.page.len(est.largo);
    if (est.orden && est.orden.length) api.order(est.orden);
    if (est.busqueda) api.search(est.busqueda);
    api.draw(false);

    // La página guardada puede quedar fuera de rango si se borraron registros
    var info = api.page.info();
    if (est.pagina > 0 && est.pagina <= info.pages - 1) api.page(est.pagina).draw(false);
  }

  function recordar(inst) {
    if (!inst.clave) return;
    try {
      var info = inst.api.page.info();
      memoria[inst.clave] = {
        busqueda: inst.api.search(),
        orden: inst.api.order(),
        largo: info.length,
        pagina: info.page,
      };
    } catch (e) {
      // La tabla ya no existe: no hay estado que guardar
    }
  }

  /** Suelta las instancias cuya tabla ya salió del DOM por un re-render. */
  function purgar() {
    instancias = instancias.filter(function (inst) {
      if (inst.tabla.isConnected) return true;
      recordar(inst);
      try { inst.api.destroy(); } catch (e) { /* ya estaba desmontada */ }
      return false;
    });
  }

  /** Inicializa las .js-dt que falten dentro de `raiz` (o de todo el documento). */
  App.initTablas = function (raiz) {
    if (!disponible()) return;
    purgar();
    (raiz || document).querySelectorAll('table.js-dt').forEach(iniciar);
  };

  /** Devuelve la API de DataTables de una tabla ya inicializada. */
  App.getTabla = function (tabla) {
    var inst = instancias.find(function (i) { return i.tabla === tabla; });
    return inst ? inst.api : null;
  };

  /** Olvida el estado recordado de una tabla (búsqueda, orden, página). */
  App.olvidarTabla = function (clave) { delete memoria[clave]; };

  /**
   * Clic delegado sobre un contenedor que se re-renderiza.
   *
   * Hace falta por la paginación: querySelectorAll('[data-editar]') solo
   * encuentra las filas visibles, y DataTables mantiene el resto fuera del
   * DOM, así que esos botones se quedaban sin listener. Delegando, el botón
   * responde esté en la página que esté.
   *
   * Registra un solo listener por selector y contenedor, de modo que volver a
   * llamarlo tras cada render no acumula manejadores duplicados.
   */
  App.delegarClick = function (contenedor, selector, manejador) {
    var registro = contenedor.__delegados || (contenedor.__delegados = {});
    if (registro[selector]) contenedor.removeEventListener('click', registro[selector]);

    var fn = function (e) {
      var el = e.target && e.target.closest ? e.target.closest(selector) : null;
      if (el && contenedor.contains(el)) manejador(el, e);
    };
    registro[selector] = fn;
    contenedor.addEventListener('click', fn);
  };

  // Todas las pantallas terminan su render llamando a App.refreshIcons(),
  // así que ese es el punto donde se montan las tablas nuevas.
  var refreshIconsPrevio = App.refreshIcons;
  App.refreshIcons = function () {
    if (refreshIconsPrevio) refreshIconsPrevio.apply(this, arguments);
    App.initTablas();
  };
})();
