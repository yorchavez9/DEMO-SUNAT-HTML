var App = window.App || (window.App = {});

App.Login = class Login {
  constructor() {
    this.usuario = '';
    this.password = '';
    this.error = null;
    this.loading = false;
    this.showPass = false;
    this.container = null;
    this.router = null;
  }

  render(container, router) {
    this.container = container;
    this.router = router;
    this._renderHTML();
    this._bind();
  }

  _renderHTML() {
    // Color primario del sistema (el mismo de .btn-primary)
    var PRIMARIO = 'rgb(37 99 235)';

    var errorHTML = this.error
      ? '<div style="padding: 0.75rem 0.875rem; background: rgb(254 242 242); border-radius: 0.75rem; font-size: 0.8125rem; font-weight: 600; color: rgb(185 28 28); display: flex; align-items: center; gap: 0.5rem;">'
          + '<i data-lucide="x-circle" style="width: 16px; height: 16px; flex-shrink: 0;"></i> ' + App.escapeHtml(this.error)
        + '</div>'
      : '';

    var btnContent = this.loading
      ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Verificando...'
      : '<i data-lucide="log-in" class="w-4 h-4"></i> Ingresar';

    var eyeIcon = this.showPass ? 'eye-off' : 'eye';

    // Antes de elegir rubro no hay marca todavía: se muestra genérico
    var tieneRubro = !!App.DB.rubro();
    var marca = App.branding();
    var titulo = tieneRubro ? marca.nombre : 'Facturación Electrónica';
    var subtitulo = tieneRubro ? marca.rubro : 'Comprobantes SUNAT para cualquier rubro';

    var sesionPrevia = App.usuarios()[0];

    this.container.innerHTML = ''
      + '<div style="min-height: 100vh; background: rgb(241 245 249); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem;">'

        // Marca sobre la tarjeta
        + '<div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.75rem;">'
          + '<span style="width: 2.75rem; height: 2.75rem; border-radius: 0.875rem; background: ' + PRIMARIO + '; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 8px 20px -6px rgb(37 99 235 / 0.55);">'
            + '<i data-lucide="' + marca.icono + '" style="width: 22px; height: 22px; color: white;"></i>'
          + '</span>'
          + '<div>'
            + '<div style="font-weight: 800; font-size: 1.0625rem; color: rgb(15 23 42); letter-spacing: -0.02em; line-height: 1.2;">' + App.escapeHtml(titulo) + '</div>'
            + '<div style="font-size: 0.75rem; color: rgb(100 116 139); margin-top: 0.125rem;">' + App.escapeHtml(subtitulo) + '</div>'
          + '</div>'
        + '</div>'

        // Tarjeta
        + '<div style="width: 100%; max-width: 25rem; background: white; border-radius: 1.25rem; padding: 2rem 1.75rem; box-shadow: 0 1px 2px rgb(15 23 42 / 0.04), 0 16px 40px -12px rgb(15 23 42 / 0.16);">'

          + '<h1 style="font-size: 1.25rem; font-weight: 800; color: rgb(15 23 42); letter-spacing: -0.02em;">Iniciar sesión</h1>'
          + '<p style="font-size: 0.8125rem; color: rgb(100 116 139); margin-top: 0.25rem; margin-bottom: 1.5rem;">Ingresa tus credenciales para continuar.</p>'

          + '<form id="login-form" style="display: flex; flex-direction: column; gap: 1rem;">'
            + '<div>'
              + '<label class="label">Usuario</label>'
              + '<input id="login-user" class="input" value="' + App.escapeHtml(this.usuario) + '" placeholder="Ingresa tu usuario" required autofocus />'
            + '</div>'
            + '<div>'
              + '<label class="label">Contraseña</label>'
              + '<div style="position: relative;">'
                + '<input id="login-pass" type="' + (this.showPass ? 'text' : 'password') + '" class="input" style="padding-right: 2.75rem;" value="' + App.escapeHtml(this.password) + '" placeholder="Ingresa tu contraseña" required />'
                + '<button type="button" id="login-eye" title="Mostrar u ocultar" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgb(148 163 184); padding: 0; display: flex; align-items: center;">'
                  + '<i data-lucide="' + eyeIcon + '" style="width: 16px; height: 16px;"></i>'
                + '</button>'
              + '</div>'
            + '</div>'
            + errorHTML
            + '<button type="submit" id="login-btn" class="btn-primary" style="width: 100%; padding: 0.75rem 1rem; margin-top: 0.25rem; font-size: 0.9375rem; border-radius: 0.75rem;" ' + (this.loading ? 'disabled' : '') + '>'
              + btnContent
            + '</button>'
          + '</form>'

          + (sesionPrevia
            ? '<p style="margin-top: 1.5rem; text-align: center; font-size: 0.75rem; color: rgb(148 163 184);">'
              + 'Cuenta registrada: <strong style="color: rgb(71 85 105);">' + App.escapeHtml(sesionPrevia.usuario) + '</strong>'
              + '</p>'
            : '')

        + '</div>'

        + '<div style="margin-top: 1.75rem; font-size: 0.6875rem; color: rgb(148 163 184); text-align: center;">'
          + '© ' + new Date().getFullYear() + ' ' + App.escapeHtml(titulo) + ' · Demo de facturación electrónica'
        + '</div>'
      + '</div>';

    App.refreshIcons();
  }

  _bind() {
    var self = this;
    var user = this.container.querySelector('#login-user');
    var pass = this.container.querySelector('#login-pass');
    var eye  = this.container.querySelector('#login-eye');
    var form = this.container.querySelector('#login-form');

    user.addEventListener('input', function (e) {
      self.usuario = e.target.value;
      if (self.error) { self.error = null; self._renderHTML(); self._bind(); }
    });
    pass.addEventListener('input', function (e) {
      self.password = e.target.value;
      if (self.error) { self.error = null; self._renderHTML(); self._bind(); }
    });
    eye.addEventListener('click', function () {
      self.showPass = !self.showPass;
      self._renderHTML();
      self._bind();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      self._submit();
    });
  }

  _submit() {
    var self = this;
    this.loading = true;
    this._renderHTML();
    this._bind();

    setTimeout(function () {
      var ok = App.login(self.usuario, self.password);
      if (!ok) {
        self.error = 'Usuario o contraseña incorrectos';
        self.loading = false;
        self._renderHTML();
        self._bind();
        return;
      }
      self.router.navigate('/');
    }, 250);
  }
};
