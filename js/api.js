var App = window.App || (window.App = {});

(function () {
  // ─── API json.pe — consulta RUC / DNI ─────────────────
  async function buscarDocumentoExterno(tipo, numero) {
    var token = App.getConfig().jsonpe_token;
    if (!token) throw new Error('Falta configurar el Token de api.json.pe en Configuración.');

    var esRuc = tipo === '6';
    var url = 'https://api.json.pe/api/' + (esRuc ? 'ruc' : 'dni');
    var body = esRuc ? { ruc: numero } : { dni: numero };

    var res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    var json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'No se encontró el documento.');
    }

    var d = json.data;
    return {
      success: true,
      data: esRuc
        ? { tipo_doc: '6', num_doc: d.ruc, razon_social: d.nombre_o_razon_social, direccion: d.direccion_completa || d.direccion || '', fuente: 'SUNAT' }
        : { tipo_doc: '1', num_doc: d.numero, razon_social: d.nombre_completo, direccion: d.direccion_completa || d.direccion || '', fuente: 'RENIEC' },
    };
  }

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

    var raw = await response.json();

    var normalized = {
      success: raw.estado === 'exito' || raw.success === true,
      message: raw.mensaje != null ? raw.mensaje : raw.message,
      data: raw.datos != null ? raw.datos : raw.data,
      errors: raw.errores != null ? raw.errores : raw.errors,
    };

    if (!response.ok || !normalized.success) {
      var msg = normalized.message || ('Error ' + response.status);
      var err = new Error(msg);
      err.status = response.status;
      err.errors = normalized.errors;
      err.data = normalized;
      throw err;
    }

    return normalized;
  }

  App.api = {
    getEmpresa: function () { return request('GET', '/empresa'); },

    listSucursales: function () { return request('GET', '/sucursales'); },
    listSeries: function (params) { return request('GET', '/series' + (params || '')); },
    listClientes: function (buscar) { return request('GET', '/clientes?buscar=' + encodeURIComponent(buscar || '')); },

    buscarDocumento: function (tipo, numero) { return buscarDocumentoExterno(tipo, numero); },

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

    crearAnulacion: function (data) { return request('POST', '/anulaciones', data); },
    listarAnulaciones: function (query) { return request('GET', '/anulaciones' + (query || '')); },
    estadoAnulacion: function (id) { return request('GET', '/anulaciones/' + id + '/estado'); },
    enviarAnulacion: function (id) { return request('POST', '/anulaciones/' + id + '/enviar'); },

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
