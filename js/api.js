var App = window.App || (window.App = {});

(function () {
  async function request(method, path, body) {
    var cfg = App.getConfig();

    if (!cfg.api_key || !cfg.api_secret) {
      throw new Error('Falta configurar api_key y api_secret en Configuración.');
    }

    var url = cfg.base_url.replace(/\/$/, '') + path;

    var options = {
      method: method,
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': cfg.api_key,
        'X-Api-Secret': cfg.api_secret,
      },
    };

    if (body !== undefined) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    var response = await fetch(url, options);
    var contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      if (!response.ok) throw new Error('Error ' + response.status + ': ' + response.statusText);
      return await response.blob();
    }

    var data = await response.json();

    if (!response.ok) {
      var msg = data.message || ('Error ' + response.status);
      var err = new Error(msg);
      err.status = response.status;
      err.errors = data.errors;
      err.data = data;
      throw err;
    }

    return data;
  }

  App.api = {
    getEmpresa: function () { return request('GET', '/empresa'); },

    listSucursales: function () { return request('GET', '/sucursales'); },
    listSeries: function (params) { return request('GET', '/series' + (params || '')); },
    listClientes: function (buscar) { return request('GET', '/clientes?buscar=' + encodeURIComponent(buscar || '')); },

    buscarDocumento: function (tipo, numero) { return request('GET', '/buscar-documento?tipo=' + tipo + '&numero=' + numero); },

    crearFactura: function (data) { return request('POST', '/facturas', data); },
    listarFacturas: function (query) { return request('GET', '/facturas' + (query || '')); },
    verFactura: function (id) { return request('GET', '/facturas/' + id); },

    crearBoleta: function (data) { return request('POST', '/boletas', data); },
    listarBoletas: function (query) { return request('GET', '/boletas' + (query || '')); },
    verBoleta: function (id) { return request('GET', '/boletas/' + id); },

    crearNotaCredito: function (data) { return request('POST', '/notas-credito', data); },
    listarNotasCredito: function (query) { return request('GET', '/notas-credito' + (query || '')); },

    crearNotaDebito: function (data) { return request('POST', '/notas-debito', data); },
    listarNotasDebito: function (query) { return request('GET', '/notas-debito' + (query || '')); },

    crearGuia: function (data) { return request('POST', '/guias-remision', data); },
    listarGuias: function (query) { return request('GET', '/guias-remision' + (query || '')); },

    crearResumen: function (data) { return request('POST', '/resumenes', data); },
    listarResumenes: function (query) { return request('GET', '/resumenes' + (query || '')); },
    estadoResumen: function (id) { return request('GET', '/resumenes/' + id + '/estado'); },

    descargarPdf: function (tipo, id, format) { return request('GET', '/' + tipo + '/' + id + '/pdf?format=' + (format || 'a4')); },
    descargarXml: function (tipo, id) { return request('GET', '/' + tipo + '/' + id + '/xml'); },
    descargarCdr: function (tipo, id) { return request('GET', '/' + tipo + '/' + id + '/cdr'); },

    panelIndicadores: function () { return request('GET', '/panel/indicadores'); },
    panelDocumentosRecientes: function () { return request('GET', '/panel/documentos-recientes'); },
    panelVentasMensuales: function () { return request('GET', '/panel/ventas-mensuales'); },
    panelEstadoSunat: function () { return request('GET', '/panel/estado-sunat'); },
    panelPorMoneda: function () { return request('GET', '/panel/por-moneda'); },
  };
})();
