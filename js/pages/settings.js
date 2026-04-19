var App = window.App || (window.App = {});

App.Settings = class Settings {
  constructor() {
    this.config = App.getConfig();
    this.saved = false;
    this.testing = false;
    this.testResult = null;
    this.router = null;
    this.container = null;
  }

  render(container, router) {
    this.container = container;
    this.router = router;
    this._renderHTML();
    this._bind();
  }

  _renderHTML() {
    var savedTag = this.saved
      ? '<span style="font-size: 0.875rem; color: rgb(22 163 74); display: flex; align-items: center; gap: 0.25rem;">'
        + '<i data-lucide="check-circle-2" class="w-4 h-4"></i> Guardado</span>'
      : '';

    this.container.innerHTML = ''
      + '<div style="max-width: 42rem;">'
        + '<h1 class="page-title" style="margin-bottom: 0.5rem;">'
          + '<i data-lucide="settings" class="w-7 h-7"></i> Configuración de la API'
        + '</h1>'
        + '<p style="color: rgb(71 85 105); margin-bottom: 1.5rem;">'
          + 'Ingresa las credenciales de tu empresa para conectarte con la API SUNAT. '
          + 'Si aún no tienes, regístrate primero con <code style="background: rgb(241 245 249); padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem;">POST /v1/registro</code>.'
        + '</p>'
        + '<div class="card" style="display: flex; flex-direction: column; gap: 1rem;">'
          + '<div>'
            + '<label class="label">URL Base de la API</label>'
            + '<input id="s-base-url" class="input" value="' + App.escapeHtml(this.config.base_url) + '" placeholder="https://api.kodevo.es/sunat-api/api/v1" />'
            + '<p class="text-xs" style="color: rgb(100 116 139); margin-top: 0.25rem;">Ejemplo: https://api.kodevo.es/sunat-api/api/v1 o tu URL propia</p>'
          + '</div>'
          + '<div>'
            + '<label class="label">X-Api-Key</label>'
            + '<input id="s-api-key" class="input font-mono" value="' + App.escapeHtml(this.config.api_key) + '" placeholder="Tu api_key de 64 caracteres" />'
          + '</div>'
          + '<div>'
            + '<label class="label">X-Api-Secret</label>'
            + '<input id="s-api-secret" type="password" class="input font-mono" value="' + App.escapeHtml(this.config.api_secret) + '" placeholder="Tu api_secret" />'
            + '<p class="text-xs flex items-center gap-1" style="color: rgb(100 116 139); margin-top: 0.25rem;">'
              + '<i data-lucide="alert-triangle" class="w-3 h-3"></i> Se guarda en localStorage de tu navegador.'
            + '</p>'
          + '</div>'
          + '<div style="display: flex; gap: 0.5rem; align-items: center; padding-top: 1rem;">'
            + '<button id="s-save" class="btn-primary"><i data-lucide="save" class="w-4 h-4"></i> Guardar</button>'
            + '<button id="s-test" class="btn-secondary" ' + ((this.testing || !this.config.api_key || !this.config.api_secret) ? 'disabled' : '') + '>'
              + (this.testing
                ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Probando...'
                : '<i data-lucide="plug" class="w-4 h-4"></i> Probar conexión')
            + '</button>'
            + savedTag
          + '</div>'
          + this._testResultHTML()
        + '</div>'
        + '<div style="margin-top: 1.5rem; padding: 1rem; background: rgb(239 246 255); border-radius: 0.5rem; font-size: 0.875rem;">'
          + '<div style="font-weight: 600; color: rgb(30 58 138); margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem;">'
            + '<i data-lucide="lightbulb" class="w-4 h-4"></i> ¿Cómo obtener mis credenciales?'
          + '</div>'
          + '<ol style="list-style: decimal; list-style-position: inside; color: rgb(30 64 175); display: flex; flex-direction: column; gap: 0.25rem;">'
            + '<li>Registra tu empresa con <code style="background: white; padding: 0.125rem 0.375rem; border-radius: 0.25rem;">POST /api/v1/registro</code></li>'
            + '<li>La respuesta incluye <code style="background: white; padding: 0.125rem 0.375rem; border-radius: 0.25rem;">api_key</code> y <code style="background: white; padding: 0.125rem 0.375rem; border-radius: 0.25rem;">api_secret</code></li>'
            + '<li>Guárdalos aquí para empezar a emitir documentos</li>'
          + '</ol>'
        + '</div>'
      + '</div>';

    App.refreshIcons();
  }

  _testResultHTML() {
    if (!this.testResult) return '';
    if (this.testResult.success) {
      var e = this.testResult.empresa;
      return ''
        + '<div style="padding: 1rem; border-radius: 0.5rem; background: rgb(240 253 244);">'
          + '<div style="font-weight: 600; color: rgb(21 128 61); display: flex; align-items: center; gap: 0.5rem;">'
            + '<i data-lucide="check-circle-2" class="w-5 h-5"></i> Conexión exitosa'
          + '</div>'
          + '<div style="margin-top: 0.5rem; font-size: 0.875rem; display: flex; flex-direction: column; gap: 0.25rem;">'
            + '<div><strong>Empresa:</strong> ' + App.escapeHtml(e.razon_social) + '</div>'
            + '<div><strong>RUC:</strong> ' + App.escapeHtml(e.ruc) + '</div>'
            + '<div><strong>Plan:</strong> ' + App.escapeHtml(e.plan) + '</div>'
            + '<div><strong>Entorno:</strong> ' + App.escapeHtml(e.entorno) + '</div>'
          + '</div>'
          + '<button id="s-goto-dashboard" class="btn-primary text-sm" style="margin-top: 0.75rem;">'
            + 'Ir al Dashboard <i data-lucide="arrow-right" class="w-4 h-4"></i>'
          + '</button>'
        + '</div>';
    }
    return ''
      + '<div style="padding: 1rem; border-radius: 0.5rem; background: rgb(254 242 242);">'
        + '<div style="font-weight: 600; color: rgb(153 27 27); display: flex; align-items: center; gap: 0.5rem;">'
          + '<i data-lucide="x-circle" class="w-5 h-5"></i> Error de conexión'
        + '</div>'
        + '<div style="margin-top: 0.5rem; font-size: 0.875rem; color: rgb(185 28 28);">' + App.escapeHtml(this.testResult.error) + '</div>'
      + '</div>';
  }

  _bind() {
    var self = this;
    this.container.querySelector('#s-base-url').addEventListener('input', function (e) { self.config.base_url = e.target.value; });
    this.container.querySelector('#s-api-key').addEventListener('input', function (e) {
      self.config.api_key = e.target.value;
      self._refreshButtons();
    });
    this.container.querySelector('#s-api-secret').addEventListener('input', function (e) {
      self.config.api_secret = e.target.value;
      self._refreshButtons();
    });

    this.container.querySelector('#s-save').addEventListener('click', function () { self._save(); });
    this.container.querySelector('#s-test').addEventListener('click', function () { self._test(); });

    var gotoBtn = this.container.querySelector('#s-goto-dashboard');
    if (gotoBtn) gotoBtn.addEventListener('click', function () { self.router.navigate('/'); });
  }

  _refreshButtons() {
    var testBtn = this.container.querySelector('#s-test');
    if (!testBtn) return;
    testBtn.disabled = this.testing || !this.config.api_key || !this.config.api_secret;
  }

  _save() {
    var self = this;
    App.saveConfig(this.config);
    this.saved = true;
    this._renderHTML();
    this._bind();
    setTimeout(function () {
      self.saved = false;
      if (self.container.isConnected) {
        self._renderHTML();
        self._bind();
      }
    }, 2000);
  }

  async _test() {
    App.saveConfig(this.config);
    this.testing = true;
    this.testResult = null;
    this._renderHTML();
    this._bind();

    try {
      var res = await App.api.getEmpresa();
      this.testResult = { success: true, empresa: res.data };
    } catch (e) {
      this.testResult = { success: false, error: e.message };
    } finally {
      this.testing = false;
      this._renderHTML();
      this._bind();
    }
  }
};
