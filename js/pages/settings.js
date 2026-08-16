var App = window.App || (window.App = {});

/**
 * Configuración en tres pasos:
 *   1. Conexión  — credenciales de la API SUNAT (lo primero que hay que poner).
 *   2. Mi empresa — datos reales traídos de GET /empresa, editables con
 *      PUT /empresa, más logo (POST /empresa/logo) y certificado
 *      (POST /empresa/certificado).
 *   3. Sistema   — datos locales del demo: catálogo de ejemplo y respaldo.
 */
(function () {
  // Paleta sobria: superficies neutras y el primario solo donde es la marca
  // del sistema (pestaña activa y botón principal). El verde y el rojo se
  // reservan para el icono de los avisos, nunca para pintar bloques enteros.
  var PRIMARIO = 'rgb(37 99 235)';
  var SUPERFICIE = 'rgb(248 250 252)';
  var TEXTO = 'rgb(15 23 42)';
  var TEXTO2 = 'rgb(71 85 105)';
  var TENUE = 'rgb(148 163 184)';
  var OK = 'rgb(22 163 74)';
  var ERROR = 'rgb(190 40 40)';

  var TABS = [
    { id: 'conexion', label: 'Conexión', desc: 'Credenciales de la API' },
    { id: 'empresa', label: 'Mi empresa', desc: 'Datos, logo y certificado' },
    { id: 'sistema', label: 'Sistema', desc: 'Catálogo y respaldo' },
  ];

  var REGIMENES = {
    general: 'Régimen General (IGV 18%)',
    mype: 'Régimen MYPE',
    mype_restaurantes: 'MYPE Restaurantes (Ley 31556)',
    nrus: 'Nuevo RUS (solo boletas)',
    especial: 'Régimen Especial',
  };

  /** Une un valor que la API puede devolver como texto o como arreglo. */
  function unir(valor) {
    if (Array.isArray(valor)) return valor.filter(Boolean).join(', ');
    return valor == null ? '' : String(valor);
  }

  /** Separa "a, b" en ["a","b"] para los campos que la API espera como arreglo. */
  function partir(texto) {
    return String(texto || '')
      .split(',')
      .map(function (x) { return x.trim(); })
      .filter(Boolean);
  }

  function primero(obj, claves) {
    for (var i = 0; i < claves.length; i++) {
      var v = obj[claves[i]];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return '';
  }

  App.Settings = class Settings {
    constructor() {
      this.container = null;
      this.router = null;
      this.tab = 'conexion';

      // Conexión
      this.config = App.getConfig();
      this.saved = false;
      this.testing = false;
      this.testResult = null;

      // Empresa (API)
      this.empresa = null;
      this.cargandoEmpresa = false;
      this.errorEmpresa = null;
      this.guardandoEmpresa = false;
      this.msgEmpresa = null;
      this.subiendo = null; // 'logo' | 'certificado'

      // Sistema
      this.datosMsg = null;
      this.negocioMsg = null;
    }

    render(container, router) {
      this.container = container;
      this.router = router;
      this._renderHTML();
      this._bind();
      if (App.isConfigured()) this._cargarEmpresa();
    }

    _rerender() {
      this._renderHTML();
      this._bind();
    }

    // ═══ Estructura ═══════════════════════════════════════════
    _renderHTML() {
      var self = this;

      this.container.innerHTML = ''
        + '<div>'
          + '<h1 class="page-title" style="margin-bottom: 1.25rem;">'
            + '<i data-lucide="settings" class="w-7 h-7"></i> Configuración'
          + '</h1>'

          + this._navHTML()

          + '<div style="margin-top: 1.25rem;">'
            + (this.tab === 'conexion' ? this._tabConexionHTML()
              : this.tab === 'empresa' ? this._tabEmpresaHTML()
              : this._tabSistemaHTML())
          + '</div>'

          + this._estilosHTML()
        + '</div>';

      App.refreshIcons();
    }

    /** ¿Ese paso ya está resuelto? Se marca con un check en la navegación. */
    _completado(id) {
      if (id === 'conexion') return App.isConfigured();
      if (id === 'empresa') return !!this.empresa;
      return App.DB.all('productos').length > 0;
    }

    /**
     * Navegación en forma de pasos: número, título y subtítulo. El paso activo
     * se levanta sobre fondo blanco y el ya resuelto muestra un check. Sin
     * color: la jerarquía la dan el contraste y la sombra.
     */
    _navHTML() {
      var self = this;
      return '<nav class="cfg-nav" role="tablist" aria-label="Secciones de configuración">'
        + TABS.map(function (t, i) {
          var activa = self.tab === t.id;
          var hecho = self._completado(t.id);
          return '<button type="button" role="tab" aria-selected="' + activa + '"'
            + ' class="cfg-nav-item' + (activa ? ' is-active' : '') + (hecho ? ' is-done' : '') + '" data-tab="' + t.id + '">'
            + '<span class="cfg-nav-num" aria-hidden="true">'
              + (hecho && !activa
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="width: 0.75rem; height: 0.75rem;"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                : (i + 1))
            + '</span>'
            + '<span class="cfg-nav-txt">'
              + '<span class="cfg-nav-label">' + t.label + '</span>'
              + '<span class="cfg-nav-desc">' + t.desc + '</span>'
            + '</span>'
            + '</button>';
        }).join('')
        + '</nav>';
    }

    /**
     * Rejillas de la pantalla. Todo arranca en una columna (móvil) y va
     * abriéndose para aprovechar el ancho completo en pantallas grandes:
     * la página ya no lleva max-width propio, usa el del contenedor general.
     */
    _estilosHTML() {
      return '<style>'
        // ─── Navegación por pasos ─────────────────────────────
        // Sin bandeja de fondo: los pasos van directos sobre la página
        + '.cfg-nav { display: flex; gap: 0.5rem; overflow-x: auto; scrollbar-width: none; }'
        + '.cfg-nav::-webkit-scrollbar { display: none; }'
        + '.cfg-nav-item { display: flex; align-items: center; gap: 0.625rem; flex: 1 1 0; min-width: 0;'
          + ' padding: 0.7rem 0.875rem; text-align: left; background: transparent; border: none;'
          + ' border-radius: 0.75rem; cursor: pointer; transition: background-color 0.16s, box-shadow 0.16s; }'
        + '.cfg-nav-item:hover:not(.is-active) { background: rgb(241 245 249); }'
        + '.cfg-nav-item:focus-visible { outline: none; box-shadow: 0 0 0 3px rgb(59 130 246 / 0.25); }'
        + '.cfg-nav-item.is-active { background: white; box-shadow: 0 1px 2px rgb(15 23 42 / 0.05), 0 6px 16px -6px rgb(15 23 42 / 0.18); }'

        // Los círculos de paso llevan el primario del proyecto
        + '.cfg-nav-num { flex-shrink: 0; width: 1.75rem; height: 1.75rem; border-radius: 9999px;'
          + ' display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800;'
          + ' background: rgb(226 232 240); color: rgb(100 116 139); transition: background-color 0.16s, color 0.16s; }'
        + '.cfg-nav-item:hover:not(.is-active) .cfg-nav-num { background: rgb(203 213 225); }'
        + '.cfg-nav-item.is-done .cfg-nav-num { background: rgb(219 234 254); color: ' + PRIMARIO + '; }'
        + '.cfg-nav-item.is-active .cfg-nav-num { background: ' + PRIMARIO + '; color: white;'
          + ' box-shadow: 0 2px 8px -2px rgb(37 99 235 / 0.5); }'

        + '.cfg-nav-txt { min-width: 0; display: flex; flex-direction: column; }'
        + '.cfg-nav-label { font-size: 0.8125rem; font-weight: 700; color: rgb(100 116 139); white-space: nowrap;'
          + ' overflow: hidden; text-overflow: ellipsis; transition: color 0.16s; }'
        + '.cfg-nav-item.is-active .cfg-nav-label { color: rgb(15 23 42); }'
        + '.cfg-nav-desc { font-size: 11px; font-weight: 500; color: rgb(148 163 184); white-space: nowrap;'
          + ' overflow: hidden; text-overflow: ellipsis; margin-top: 0.05rem; }'
        + '@media (max-width: 720px) { .cfg-nav-desc { display: none; } .cfg-nav-item { padding: 0.6rem 0.75rem; } }'
        + '@media (prefers-reduced-motion: reduce) { .cfg-nav-item, .cfg-nav-num, .cfg-nav-label { transition: none; } }'

        // Dos tarjetas de igual peso
        + '.cfg-duo { display: grid; grid-template-columns: 1fr; gap: 1rem; align-items: start; }'
        // Campos dentro de una tarjeta
        + '.cfg-grid { display: grid; grid-template-columns: 1fr; gap: 0.875rem; }'
        + '.cfg-grid-4 { display: grid; grid-template-columns: 1fr; gap: 0.875rem; }'
        + '.cfg-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }'
        + '.cfg-conteos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }'
        + '.cfg-acciones { display: flex; gap: 0.5rem; flex-wrap: wrap; }'
        + '.cfg-perfil { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }'

        + '@media (min-width: 640px) {'
          + '.cfg-grid { grid-template-columns: repeat(2, 1fr); }'
          + '.cfg-grid-4 { grid-template-columns: repeat(2, 1fr); }'
          + '.cfg-stats { grid-template-columns: repeat(5, 1fr); }'
          + '.cfg-conteos { grid-template-columns: repeat(3, 1fr); }'
        + '}'
        + '@media (min-width: 1024px) {'
          + '.cfg-duo { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; }'
          + '.cfg-grid-4 { grid-template-columns: repeat(4, 1fr); }'
        + '}'
        + '</style>';
    }

    _msgHTML(msg) {
      if (!msg) return '';
      var ok = msg.tipo === 'ok';
      return '<div style="margin-top: 1rem; padding: 0.75rem 0.875rem; border-radius: 0.75rem; font-size: 0.8125rem; font-weight: 600;'
        + ' display: flex; align-items: center; gap: 0.5rem; background: ' + SUPERFICIE + '; color: ' + (ok ? TEXTO2 : ERROR) + ';">'
        + '<i data-lucide="' + (ok ? 'check-circle-2' : 'alert-circle') + '" class="w-4 h-4" style="color: ' + (ok ? OK : ERROR) + '; flex-shrink: 0;"></i> '
        + App.escapeHtml(msg.texto)
        + '</div>';
    }

    _campo(label, inputHTML, ayuda) {
      return '<div>'
        + '<label class="label">' + label + '</label>'
        + inputHTML
        + (ayuda ? '<p class="text-xs" style="color: rgb(100 116 139); margin-top: 0.25rem;">' + ayuda + '</p>' : '')
        + '</div>';
    }

    // ═══ 1. Conexión ══════════════════════════════════════════
    _tabConexionHTML() {
      var c = this.config;
      var listo = !!(c.api_key && c.api_secret);

      return ''
        + '<div class="card">'
          + '<h2 class="section-title"><i data-lucide="key-round" class="w-5 h-5"></i> Credenciales de la API</h2>'
          + '<p class="text-xs" style="color: rgb(71 85 105); line-height: 1.6; margin-bottom: 1.25rem;">'
            + 'Es lo primero que hay que configurar: sin esto el sistema no puede emitir ni leer los datos de tu empresa.'
          + '</p>'

          + this._campo('URL base de la API',
              '<input id="s-base-url" class="input" value="' + App.escapeHtml(c.base_url || '') + '" placeholder="https://apisunatv2.kodevo.es/api/v1" />',
              'Sin barra al final.')

          + '<div class="cfg-grid" style="margin-top: 0.875rem;">'
            + this._campo('X-Api-Key', '<input id="s-api-key" class="input font-mono" value="' + App.escapeHtml(c.api_key || '') + '" placeholder="Tu api_key de 64 caracteres" />')
            + this._campo('X-Api-Secret', '<input id="s-api-secret" type="password" class="input font-mono" value="' + App.escapeHtml(c.api_secret || '') + '" placeholder="Tu api_secret" />')
          + '</div>'

          + '<div style="margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid rgb(241 245 249);">'
            + this._campo('Token de api.json.pe <span style="color: rgb(148 163 184); font-weight: 400;">(consulta RUC / DNI)</span>',
                '<input id="s-jsonpe-token" type="password" class="input font-mono" value="' + App.escapeHtml(c.jsonpe_token || '') + '" placeholder="Bearer token de api.json.pe" />',
                'Se usa para autocompletar clientes y proveedores desde SUNAT y RENIEC.')
          + '</div>'

          + '<div class="cfg-acciones" style="margin-top: 1.25rem; align-items: center;">'
            + '<button id="s-save" class="btn-primary"><i data-lucide="save" class="w-4 h-4"></i> Guardar</button>'
            + '<button id="s-test" class="btn-secondary" ' + ((this.testing || !listo) ? 'disabled' : '') + '>'
              + (this.testing
                ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Probando...'
                : '<i data-lucide="plug" class="w-4 h-4"></i> Probar conexión')
            + '</button>'
            + (this.saved
              ? '<span style="font-size: 0.8125rem; font-weight: 600; color: rgb(22 163 74); display: inline-flex; align-items: center; gap: 0.25rem;">'
                + '<i data-lucide="check-circle-2" class="w-4 h-4"></i> Guardado</span>'
              : '')
          + '</div>'

          + this._testResultHTML()
        + '</div>';
    }

    _testResultHTML() {
      if (!this.testResult) return '';
      if (this.testResult.success) {
        var e = this.testResult.empresa || {};
        return ''
          + '<div style="margin-top: 1rem; padding: 1rem; border-radius: 0.875rem; background: ' + SUPERFICIE + ';">'
            + '<div style="font-weight: 700; color: ' + TEXTO + '; display: flex; align-items: center; gap: 0.5rem;">'
              + '<i data-lucide="check-circle-2" class="w-5 h-5" style="color: ' + OK + ';"></i> Conexión exitosa'
            + '</div>'
            + '<div style="margin-top: 0.625rem; font-size: 0.8125rem; color: ' + TEXTO2 + '; line-height: 1.7;">'
              + '<div><strong style="color: ' + TEXTO + ';">' + App.escapeHtml(primero(e, ['razon_social', 'nombre_comercial']) || '—') + '</strong></div>'
              + '<div>RUC ' + App.escapeHtml(e.ruc || '—') + ' · Plan ' + App.escapeHtml(unir(e.plan) || '—') + ' · Entorno ' + App.escapeHtml(e.entorno || '—') + '</div>'
            + '</div>'
            + '<div class="cfg-acciones" style="margin-top: 0.875rem;">'
              + '<button id="s-ir-empresa" class="btn-primary text-sm">Ver datos de mi empresa <i data-lucide="arrow-right" class="w-4 h-4"></i></button>'
              + '<button id="s-goto-dashboard" class="btn-secondary text-sm">Ir al inicio</button>'
            + '</div>'
          + '</div>';
      }
      return ''
        + '<div style="margin-top: 1rem; padding: 1rem; border-radius: 0.875rem; background: ' + SUPERFICIE + ';">'
          + '<div style="font-weight: 700; color: ' + TEXTO + '; display: flex; align-items: center; gap: 0.5rem;">'
            + '<i data-lucide="x-circle" class="w-5 h-5" style="color: ' + ERROR + ';"></i> No se pudo conectar'
          + '</div>'
          + '<div style="margin-top: 0.5rem; font-size: 0.8125rem; color: ' + ERROR + ';">' + App.escapeHtml(this.testResult.error) + '</div>'
        + '</div>';
    }

    // ═══ 2. Mi empresa ════════════════════════════════════════
    _tabEmpresaHTML() {
      if (!App.isConfigured()) {
        return this._avisoHTML('plug', 'Primero conecta la API',
          'Ingresa tu api_key y api_secret en la pestaña <strong>Conexión</strong>. Con eso el sistema podrá traer los datos de tu empresa.',
          'Ir a Conexión', 's-ir-conexion');
      }
      if (this.cargandoEmpresa) {
        return '<div class="card" style="text-align: center; padding: 3rem 1rem; color: rgb(100 116 139);">'
          + '<i data-lucide="loader-2" class="w-8 h-8 icon-spin" style="margin: 0 auto 0.75rem; display: block;"></i>'
          + 'Trayendo los datos de tu empresa...'
          + '</div>';
      }
      if (this.errorEmpresa) {
        return this._avisoHTML('alert-circle', 'No se pudieron traer los datos',
          App.escapeHtml(this.errorEmpresa), 'Reintentar', 's-recargar-empresa');
      }
      if (!this.empresa) return '';

      var e = this.empresa;
      return this._perfilHTML(e)
        + this._formEmpresaHTML(e)
        + '<div class="cfg-duo">' + this._logoHTML(e) + this._certificadoHTML(e) + '</div>';
    }

    _avisoHTML(icono, titulo, texto, botonTexto, botonId) {
      return '<div class="card" style="text-align: center; padding: 2.5rem 1.5rem;">'
        + '<span style="width: 3rem; height: 3rem; border-radius: 0.875rem; background: rgb(241 245 249); color: rgb(100 116 139); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 0.875rem;">'
          + '<i data-lucide="' + icono + '" class="w-6 h-6"></i>'
        + '</span>'
        + '<div style="font-weight: 700; color: rgb(15 23 42);">' + titulo + '</div>'
        + '<p class="text-xs" style="color: rgb(100 116 139); margin-top: 0.5rem; line-height: 1.6; max-width: 24rem; margin-left: auto; margin-right: auto;">' + texto + '</p>'
        + '<button id="' + botonId + '" class="btn-primary" style="margin-top: 1.25rem;">' + botonTexto + '</button>'
        + '</div>';
    }

    /** Cabecera con logo, identidad y los indicadores del plan/régimen. */
    _perfilHTML(e) {
      var logo = e._logo;
      var regimen = REGIMENES[e.tax_regime] || e.tax_regime || '—';
      var esProduccion = String(e.entorno).toLowerCase() === 'production';

      /** Etiqueta neutra; el estado se distingue por un punto, no por el fondo. */
      function chip(texto, colorPunto) {
        return '<span class="badge" style="background: ' + SUPERFICIE + '; color: ' + TEXTO2 + '; gap: 0.375rem;">'
          + (colorPunto
            ? '<span style="width: 0.4rem; height: 0.4rem; border-radius: 9999px; background: ' + colorPunto + ';"></span>'
            : '')
          + App.escapeHtml(texto)
          + '</span>';
      }

      function dato(label, valor) {
        return '<div style="padding: 0.5rem 0.75rem; background: ' + SUPERFICIE + '; border-radius: 0.625rem;">'
          + '<div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: ' + TENUE + ';">' + label + '</div>'
          + '<div style="font-weight: 700; font-size: 0.8125rem; margin-top: 0.125rem; color: ' + TEXTO + '; overflow: hidden; text-overflow: ellipsis;">' + App.escapeHtml(valor || '—') + '</div>'
          + '</div>';
      }

      return ''
        + '<div class="card" style="margin-bottom: 1rem;">'
          + '<div class="cfg-perfil">'
            + (logo
              ? '<img src="' + App.escapeHtml(logo) + '" alt="Logo" style="width: 4rem; height: 4rem; border-radius: 0.875rem; object-fit: contain; background: ' + SUPERFICIE + '; flex-shrink: 0;" />'
              : '<span style="width: 4rem; height: 4rem; border-radius: 0.875rem; background: ' + SUPERFICIE + '; color: ' + TENUE + '; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">'
                + '<i data-lucide="building-2" class="w-7 h-7"></i></span>')
            + '<div style="flex: 1; min-width: 12rem;">'
              + '<div style="font-weight: 800; font-size: 1.0625rem; color: ' + TEXTO + '; letter-spacing: -0.02em; line-height: 1.3;">'
                + App.escapeHtml(primero(e, ['razon_social', 'nombre_comercial']) || 'Mi empresa') + '</div>'
              + '<div class="font-mono text-xs" style="color: rgb(100 116 139); margin-top: 0.125rem;">RUC ' + App.escapeHtml(e.ruc || '—') + '</div>'
              + '<div style="display: flex; gap: 0.375rem; flex-wrap: wrap; margin-top: 0.5rem;">'
                + chip(esProduccion ? 'Producción' : 'Beta / pruebas', esProduccion ? OK : TENUE)
                + (e.plan ? chip('Plan ' + unir(e.plan), null) : '')
              + '</div>'
            + '</div>'
          + '</div>'
          + '<div class="cfg-stats" style="margin-top: 1rem;">'
            + dato('Régimen', regimen)
            + dato('IGV vigente', e.tasa_igv_vigente != null ? e.tasa_igv_vigente + '%' : '—')
            + dato('Ubigeo', e.ubigeo)
            + dato('Distrito', e.distrito)
            + dato('Entorno', e.entorno)
          + '</div>'
        + '</div>';
    }

    _formEmpresaHTML(e) {
      return ''
        + '<div class="card" style="margin-bottom: 1rem;">'
          + '<h2 class="section-title"><i data-lucide="pencil" class="w-5 h-5"></i> Datos de la empresa</h2>'
          + '<p class="text-xs" style="color: rgb(100 116 139); margin-bottom: 1.25rem;">'
            + 'Se guardan en tu cuenta de la API y salen impresos en los comprobantes.'
          + '</p>'

          + '<div class="cfg-grid">'
            + this._campo('RUC', '<input id="e-ruc" class="input font-mono" value="' + App.escapeHtml(e.ruc || '') + '" maxlength="11" />')
            + this._campo('Nombre comercial', '<input id="e-nombre-comercial" class="input" value="' + App.escapeHtml(e.nombre_comercial || '') + '" />')
          + '</div>'
          + '<div style="margin-top: 0.875rem;">'
            + this._campo('Razón social', '<input id="e-razon-social" class="input" value="' + App.escapeHtml(e.razon_social || '') + '" />')
          + '</div>'
          + '<div style="margin-top: 0.875rem;">'
            + this._campo('Dirección fiscal', '<input id="e-direccion" class="input" value="' + App.escapeHtml(e.direccion || '') + '" />')
          + '</div>'

          + '<div class="cfg-grid-4" style="margin-top: 0.875rem;">'
            + this._campo('Ubigeo', '<input id="e-ubigeo" class="input font-mono" value="' + App.escapeHtml(e.ubigeo || '') + '" maxlength="6" placeholder="150101" />')
            + this._campo('Departamento', '<input id="e-departamento" class="input" value="' + App.escapeHtml(e.departamento || '') + '" />')
            + this._campo('Provincia', '<input id="e-provincia" class="input" value="' + App.escapeHtml(e.provincia || '') + '" />')
            + this._campo('Distrito', '<input id="e-distrito" class="input" value="' + App.escapeHtml(e.distrito || '') + '" />')
          + '</div>'

          + '<div class="cfg-grid" style="margin-top: 0.875rem;">'
            + this._campo('Teléfonos', '<input id="e-telefonos" class="input" value="' + App.escapeHtml(unir(e.telefonos)) + '" placeholder="+51 999 888 777" />', 'Separa varios con comas.')
            + this._campo('Correos', '<input id="e-emails" class="input" value="' + App.escapeHtml(unir(e.emails)) + '" placeholder="ventas@miempresa.pe" />', 'Separa varios con comas.')
          + '</div>'

          + '<div style="margin-top: 0.875rem;">'
            + this._campo('Mensaje de agradecimiento', '<input id="e-mensaje" class="input" value="' + App.escapeHtml(e.mensaje_agradecimiento || '') + '" placeholder="Gracias por su compra" />', 'Se imprime al pie de los comprobantes.')
          + '</div>'
          + '<div class="cfg-grid" style="margin-top: 0.875rem;">'
            + this._campo('Webhook', '<input id="e-webhook" class="input" value="' + App.escapeHtml(e.webhook_url || '') + '" placeholder="https://miempresa.pe/sunat-webhook" />', 'La API avisa aquí los cambios de estado.')
            + this._campo('Entorno',
                '<select id="e-entorno" class="input js-select">'
                + '<option value="beta"' + (String(e.entorno) !== 'production' ? ' selected' : '') + '>Beta (pruebas)</option>'
                + '<option value="production"' + (String(e.entorno) === 'production' ? ' selected' : '') + '>Producción</option>'
                + '</select>',
                'En producción los comprobantes son reales ante SUNAT.')
          + '</div>'

          + this._msgHTML(this.msgEmpresa)

          + '<div class="cfg-acciones" style="margin-top: 1.25rem;">'
            + '<button id="e-guardar" class="btn-primary" ' + (this.guardandoEmpresa ? 'disabled' : '') + '>'
              + (this.guardandoEmpresa
                ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Guardando...'
                : '<i data-lucide="save" class="w-4 h-4"></i> Guardar cambios')
            + '</button>'
            + '<button id="e-recargar" class="btn-secondary"><i data-lucide="refresh-cw" class="w-4 h-4"></i> Descartar y recargar</button>'
          + '</div>'
        + '</div>';
    }

    _logoHTML(e) {
      var logo = e._logo;
      return ''
        + '<div class="card">'
          + '<h2 class="section-title"><i data-lucide="image" class="w-5 h-5"></i> Logo</h2>'
          + '<p class="text-xs" style="color: rgb(100 116 139); margin-bottom: 1rem;">Aparece en los PDF de tus comprobantes. PNG o JPG.</p>'
          + '<div class="cfg-perfil">'
            + (logo
              ? '<img src="' + App.escapeHtml(logo) + '" alt="Logo actual" style="width: 5.5rem; height: 5.5rem; border-radius: 0.875rem; object-fit: contain; background: rgb(248 250 252); flex-shrink: 0;" />'
              : '<span style="width: 5.5rem; height: 5.5rem; border-radius: 0.875rem; background: rgb(241 245 249); color: rgb(148 163 184); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; flex-shrink: 0; font-size: 10px; font-weight: 700;">'
                + '<i data-lucide="image-off" class="w-5 h-5"></i> Sin logo</span>')
            + '<div style="flex: 1; min-width: 12rem;">'
              + '<input id="e-logo-file" type="file" accept="image/png,image/jpeg" style="display: none;" />'
              + '<button id="e-logo-btn" class="btn-secondary" ' + (this.subiendo === 'logo' ? 'disabled' : '') + '>'
                + (this.subiendo === 'logo'
                  ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Subiendo...'
                  : '<i data-lucide="upload" class="w-4 h-4"></i> ' + (logo ? 'Cambiar logo' : 'Subir logo'))
              + '</button>'
              + '<p class="text-xs" style="color: rgb(148 163 184); margin-top: 0.5rem;">Recomendado: cuadrado, fondo transparente, máximo 1 MB.</p>'
            + '</div>'
          + '</div>'
        + '</div>';
    }

    _certificadoHTML(e) {
      var cert = e.certificado || {};
      var vence = primero(cert, ['vence_el', 'fecha_vencimiento', 'valid_to', 'expira']) || primero(e, ['certificado_vence']);
      var tiene = !!(vence || cert.nombre || e.tiene_certificado);

      return ''
        + '<div class="card">'
          + '<h2 class="section-title"><i data-lucide="file-badge" class="w-5 h-5"></i> Certificado digital</h2>'
          + '<div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: ' + SUPERFICIE + '; border-radius: 0.75rem; margin-bottom: 1rem;">'
            + '<i data-lucide="' + (tiene ? 'shield-check' : 'shield-alert') + '" class="w-5 h-5" style="color: ' + (tiene ? OK : TENUE) + '; flex-shrink: 0;"></i>'
            + '<div style="font-size: 0.8125rem; color: ' + TEXTO2 + ';">'
              + (tiene
                ? '<strong style="color: ' + TEXTO + ';">Certificado cargado</strong>' + (vence ? ' · vence el ' + App.escapeHtml(String(vence)) : '')
                : '<strong style="color: ' + TEXTO + ';">Sin certificado</strong> · súbelo para poder firmar comprobantes')
            + '</div>'
          + '</div>'

          + this._campo('Archivo .pfx', '<input id="e-cert-file" type="file" accept=".pfx,.p12" class="input" style="padding: 0.5rem 0.75rem;" />')
          + '<div style="margin-top: 0.875rem;">'
            + this._campo('Contraseña del certificado', '<input id="e-cert-pass" type="password" class="input" placeholder="Contraseña del .pfx" />')
          + '</div>'
          + '<div class="cfg-acciones" style="margin-top: 1rem;">'
            + '<button id="e-cert-btn" class="btn-secondary" ' + (this.subiendo === 'certificado' ? 'disabled' : '') + '>'
              + (this.subiendo === 'certificado'
                ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Subiendo...'
                : '<i data-lucide="upload" class="w-4 h-4"></i> Subir certificado')
            + '</button>'
          + '</div>'
          + '<p class="text-xs" style="color: rgb(100 116 139); margin-top: 0.75rem;">Úsalo también para renovar el certificado cuando venza.</p>'
        + '</div>';
    }

    // ═══ 3. Sistema ═══════════════════════════════════════════
    _tabSistemaHTML() {
      var actual = App.DB.rubro();
      var rubros = App.DB.rubros();

      return '<div class="cfg-duo">'
        + '<div class="card">'
          + '<h2 class="section-title"><i data-lucide="layout-grid" class="w-5 h-5"></i> Catálogo de ejemplo</h2>'
          + '<p class="text-xs" style="color: rgb(71 85 105); line-height: 1.6; margin-bottom: 1rem;">'
            + (actual
              ? 'Ahora mismo estás usando el catálogo de <strong>' + App.escapeHtml(actual.nombre) + '</strong>.'
              : 'El sistema arranca vacío. Si quieres partir de un catálogo de ejemplo, elige un rubro y cárgalo; luego lo editas todo desde Productos, Clientes y Proveedores.')
          + '</p>'
          + '<div class="cfg-acciones">'
            + '<select id="e-rubro" class="input js-select" data-search="true" data-placeholder="Elige un rubro" data-search-placeholder="Buscar rubro..." style="flex: 1; min-width: 14rem;">'
              + '<option value="">Elige un rubro</option>'
              + rubros.map(function (r) {
                return '<option value="' + r.id + '"' + (actual && r.id === actual.id ? ' selected' : '') + '>' + App.escapeHtml(r.nombre) + '</option>';
              }).join('')
            + '</select>'
            + '<button id="e-cargar-rubro" class="btn-secondary"><i data-lucide="download" class="w-4 h-4"></i> Cargar catálogo</button>'
          + '</div>'
          + (actual
            ? '<p class="text-xs" style="color: ' + TEXTO2 + '; margin-top: 0.5rem; display: flex; align-items: flex-start; gap: 0.375rem;">'
              + '<i data-lucide="alert-triangle" class="w-3 h-3" style="color: ' + ERROR + '; flex-shrink: 0; margin-top: 0.15rem;"></i>'
              + 'Cargar otro rubro reemplaza productos, clientes, proveedores, compras e inventario. Exporta antes si quieres conservarlos.</p>'
            : '')
          + this._msgHTML(this.negocioMsg)
        + '</div>'

        + '<div class="card">'
          + '<h2 class="section-title"><i data-lucide="database" class="w-5 h-5"></i> Respaldo de datos</h2>'
          + '<p class="text-xs" style="color: rgb(71 85 105); line-height: 1.6;">'
            + 'Productos, clientes, proveedores, compras e inventario viven en este navegador. '
            + 'Exporta un JSON para respaldarlos o llevarlos a otro equipo.'
          + '</p>'
          + '<div class="cfg-conteos" style="margin-top: 1rem;">'
            + App.DB.COLECCIONES.map(function (col) {
              return '<div style="padding: 0.5rem 0.75rem; background: rgb(248 250 252); border-radius: 0.625rem;">'
                + '<div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgb(148 163 184);">' + col + '</div>'
                + '<div style="font-weight: 800; font-size: 1.125rem;">' + App.DB.all(col).length + '</div>'
                + '</div>';
            }).join('')
          + '</div>'
          + this._msgHTML(this.datosMsg)
          + '<div class="cfg-acciones" style="margin-top: 1rem;">'
            + '<button id="s-exportar" class="btn-secondary"><i data-lucide="download" class="w-4 h-4"></i> Exportar JSON</button>'
            + '<button id="s-importar" class="btn-secondary"><i data-lucide="upload" class="w-4 h-4"></i> Importar JSON</button>'
            + '<button id="s-restaurar" class="btn-secondary" style="color: ' + ERROR + ';"><i data-lucide="rotate-ccw" class="w-4 h-4"></i> Restaurar ejemplo</button>'
            + '<input id="s-archivo" type="file" accept="application/json,.json" style="display: none;" />'
          + '</div>'
        + '</div>'
      + '</div>';
    }

    // ═══ Eventos ══════════════════════════════════════════════
    _bind() {
      var self = this;
      var c = this.container;

      c.querySelectorAll('[data-tab]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.tab = btn.dataset.tab;
          self._rerender();
          if (self.tab === 'empresa' && App.isConfigured() && !self.empresa && !self.cargandoEmpresa) {
            self._cargarEmpresa();
          }
        });
      });

      if (this.tab === 'conexion') this._bindConexion();
      if (this.tab === 'empresa') this._bindEmpresa();
      if (this.tab === 'sistema') this._bindSistema();
    }

    _bindConexion() {
      var self = this;
      var c = this.container;

      [['#s-base-url', 'base_url'], ['#s-api-key', 'api_key'],
       ['#s-api-secret', 'api_secret'], ['#s-jsonpe-token', 'jsonpe_token']].forEach(function (par) {
        var el = c.querySelector(par[0]);
        if (!el) return;
        el.addEventListener('input', function (e) {
          self.config[par[1]] = e.target.value;
          var test = c.querySelector('#s-test');
          if (test) test.disabled = self.testing || !self.config.api_key || !self.config.api_secret;
        });
      });

      c.querySelector('#s-save').addEventListener('click', function () { self._guardarConfig(); });
      c.querySelector('#s-test').addEventListener('click', function () { self._probar(); });

      var irEmpresa = c.querySelector('#s-ir-empresa');
      if (irEmpresa) irEmpresa.addEventListener('click', function () {
        self.tab = 'empresa';
        self._rerender();
        if (!self.empresa) self._cargarEmpresa();
      });

      var irInicio = c.querySelector('#s-goto-dashboard');
      if (irInicio) irInicio.addEventListener('click', function () { self.router.navigate('/'); });
    }

    _bindEmpresa() {
      var self = this;
      var c = this.container;

      var irConexion = c.querySelector('#s-ir-conexion');
      if (irConexion) irConexion.addEventListener('click', function () { self.tab = 'conexion'; self._rerender(); });

      var recargar = c.querySelector('#s-recargar-empresa') || c.querySelector('#e-recargar');
      if (recargar) recargar.addEventListener('click', function () { self._cargarEmpresa(); });

      var guardar = c.querySelector('#e-guardar');
      if (guardar) guardar.addEventListener('click', function () { self._guardarEmpresa(); });

      var logoBtn = c.querySelector('#e-logo-btn');
      var logoFile = c.querySelector('#e-logo-file');
      if (logoBtn && logoFile) {
        logoBtn.addEventListener('click', function () { logoFile.click(); });
        logoFile.addEventListener('change', function () {
          if (logoFile.files && logoFile.files[0]) self._subirLogo(logoFile.files[0]);
        });
      }

      var certBtn = c.querySelector('#e-cert-btn');
      if (certBtn) certBtn.addEventListener('click', function () { self._subirCertificado(); });
    }

    _bindSistema() {
      var self = this;
      var c = this.container;

      c.querySelector('#e-cargar-rubro').addEventListener('click', function () { self._cargarRubro(); });

      var archivo = c.querySelector('#s-archivo');

      c.querySelector('#s-exportar').addEventListener('click', function () {
        App.DB.descargarExport();
        self._msg('datosMsg', 'ok', 'Se descargó el respaldo con todos los datos.');
      });

      c.querySelector('#s-importar').addEventListener('click', function () { archivo.click(); });

      archivo.addEventListener('change', function () {
        var file = archivo.files && archivo.files[0];
        if (!file) return;
        var lector = new FileReader();
        lector.onload = function () {
          try {
            var cols = App.DB.importar(JSON.parse(lector.result));
            self._msg('datosMsg', 'ok', 'Se importaron: ' + cols.join(', ') + '.');
          } catch (e) {
            self._msg('datosMsg', 'error', 'No se pudo importar: ' + e.message);
          }
        };
        lector.readAsText(file);
        archivo.value = '';
      });

      c.querySelector('#s-restaurar').addEventListener('click', function () {
        if (!window.confirm('Se perderán los productos, clientes, compras e inventario que hayas creado y volverán los datos de ejemplo del rubro. ¿Continuar?')) return;
        App.DB.restaurarSemilla()
          .then(function () { self._msg('datosMsg', 'ok', 'Datos de ejemplo restaurados.'); })
          .catch(function (e) { self._msg('datosMsg', 'error', e.message); });
      });
    }

    _msg(campo, tipo, texto) {
      this[campo] = { tipo: tipo, texto: texto };
      this._rerender();
    }

    // ═══ Acciones: conexión ═══════════════════════════════════
    _guardarConfig() {
      var self = this;
      App.saveConfig(this.config);
      this.saved = true;
      this._rerender();
      setTimeout(function () {
        if (!self.container.isConnected) return;
        self.saved = false;
        self._rerender();
      }, 2000);
    }

    async _probar() {
      App.saveConfig(this.config);
      this.testing = true;
      this.testResult = null;
      this._rerender();

      try {
        var res = await App.api.getEmpresa();
        this.testResult = { success: true, empresa: res.data || {} };
        this._recibirEmpresa(res.data);
      } catch (e) {
        this.testResult = { success: false, error: e.message };
      } finally {
        this.testing = false;
        this._rerender();
      }
    }

    // ═══ Acciones: empresa ════════════════════════════════════
    /** Aplana la respuesta de la API a la forma que usan los formularios. */
    _normalizarEmpresa(data) {
      var d = data || {};
      var e = Object.assign({}, d);
      e._logo = primero(d, ['logo_url', 'logo', 'url_logo', 'logotipo']);
      if (e._logo && !/^(https?:|data:)/.test(e._logo)) {
        // Ruta relativa: se resuelve contra el host de la API
        var base = (App.getConfig().base_url || '').replace(/\/api\/v1\/?$/, '');
        e._logo = base.replace(/\/$/, '') + '/' + String(e._logo).replace(/^\//, '');
      }
      return e;
    }

    _recibirEmpresa(data) {
      if (!data) return;
      this.empresa = this._normalizarEmpresa(data);
      this.errorEmpresa = null;

      // El nombre del menú pasa a ser el real de la empresa
      App.DB.guardarEmpresa({
        nombre_comercial: this.empresa.nombre_comercial || this.empresa.razon_social || '',
        razon_social: this.empresa.razon_social || '',
        ruc: this.empresa.ruc || '',
        direccion: this.empresa.direccion || '',
        telefono: unir(this.empresa.telefonos),
        email: unir(this.empresa.emails),
      });
      App.aplicarTitulo();
      if (App.refrescarMarca) App.refrescarMarca();
    }

    async _cargarEmpresa() {
      this.cargandoEmpresa = true;
      this.errorEmpresa = null;
      this.msgEmpresa = null;
      if (this.tab === 'empresa') this._rerender();

      try {
        var res = await App.api.getEmpresa();
        this._recibirEmpresa(res.data);
      } catch (e) {
        this.errorEmpresa = e.message;
        this.empresa = null;
      } finally {
        this.cargandoEmpresa = false;
        this._rerender();
      }
    }

    _leerFormEmpresa() {
      var c = this.container;
      var val = function (sel) { var el = c.querySelector(sel); return el ? el.value.trim() : ''; };
      return {
        ruc: val('#e-ruc'),
        razon_social: val('#e-razon-social'),
        nombre_comercial: val('#e-nombre-comercial'),
        direccion: val('#e-direccion'),
        ubigeo: val('#e-ubigeo'),
        departamento: val('#e-departamento'),
        provincia: val('#e-provincia'),
        distrito: val('#e-distrito'),
        telefonos: partir(val('#e-telefonos')),
        emails: partir(val('#e-emails')),
        mensaje_agradecimiento: val('#e-mensaje'),
        webhook_url: val('#e-webhook'),
        entorno: c.querySelector('#e-entorno') ? c.querySelector('#e-entorno').value : 'beta',
      };
    }

    async _guardarEmpresa() {
      var datos = this._leerFormEmpresa();

      if (datos.ruc && !/^\d{11}$/.test(datos.ruc)) {
        this._msg('msgEmpresa', 'error', 'El RUC debe tener 11 dígitos.');
        return;
      }
      if (!datos.razon_social) {
        this._msg('msgEmpresa', 'error', 'La razón social es obligatoria.');
        return;
      }

      this.guardandoEmpresa = true;
      this.msgEmpresa = null;
      this._rerender();

      try {
        var res = await App.api.actualizarEmpresa(datos);
        this._recibirEmpresa(res.data || Object.assign({}, this.empresa, datos));
        this.msgEmpresa = { tipo: 'ok', texto: 'Datos de la empresa actualizados.' };
      } catch (e) {
        var detalle = e.errors ? ' ' + Object.values(e.errors).join(' ') : '';
        this.msgEmpresa = { tipo: 'error', texto: e.message + detalle };
      } finally {
        this.guardandoEmpresa = false;
        this._rerender();
      }
    }

    async _subirLogo(file) {
      this.subiendo = 'logo';
      this.msgEmpresa = null;
      this._rerender();

      try {
        await App.api.subirLogo(file);
        this.msgEmpresa = { tipo: 'ok', texto: 'Logo actualizado.' };
        this.subiendo = null;
        await this._cargarEmpresa();
        return;
      } catch (e) {
        this.msgEmpresa = { tipo: 'error', texto: 'No se pudo subir el logo: ' + e.message };
      } finally {
        this.subiendo = null;
        this._rerender();
      }
    }

    async _subirCertificado() {
      var c = this.container;
      var input = c.querySelector('#e-cert-file');
      var pass = c.querySelector('#e-cert-pass');
      var file = input && input.files ? input.files[0] : null;

      if (!file) {
        this._msg('msgEmpresa', 'error', 'Elige el archivo .pfx del certificado.');
        return;
      }
      if (!pass.value) {
        this._msg('msgEmpresa', 'error', 'Ingresa la contraseña del certificado.');
        return;
      }

      this.subiendo = 'certificado';
      this.msgEmpresa = null;
      this._rerender();

      try {
        await App.api.subirCertificado(file, pass.value);
        this.msgEmpresa = { tipo: 'ok', texto: 'Certificado actualizado.' };
        this.subiendo = null;
        await this._cargarEmpresa();
        return;
      } catch (e) {
        this.msgEmpresa = { tipo: 'error', texto: 'No se pudo subir el certificado: ' + e.message };
      } finally {
        this.subiendo = null;
        this._rerender();
      }
    }

    // ═══ Acciones: sistema ════════════════════════════════════
    _cargarRubro() {
      var self = this;
      var nuevo = this.container.querySelector('#e-rubro').value;
      var actual = App.DB.rubro();

      if (!nuevo) {
        this._msg('negocioMsg', 'error', 'Elige un rubro de la lista.');
        return;
      }
      if (actual && nuevo === actual.id) {
        this._msg('negocioMsg', 'error', 'Ya estás usando ese catálogo. Usa "Restaurar ejemplo" para recargarlo.');
        return;
      }

      var aviso = actual
        ? 'Se reemplazarán productos, clientes, proveedores, compras e inventario por los del nuevo rubro. ¿Continuar?'
        : 'Se cargará el catálogo de ejemplo de ese rubro. ¿Continuar?';
      if (!window.confirm(aviso)) return;

      App.DB.aplicarRubro(nuevo)
        .then(function () { self._msg('negocioMsg', 'ok', 'Catálogo cargado.'); })
        .catch(function (e) { self._msg('negocioMsg', 'error', 'No se pudo cargar: ' + e.message); });
    }
  };
})();
