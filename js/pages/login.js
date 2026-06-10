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
    var errorHTML = this.error
      ? '<div style="padding: 0.75rem; background: rgb(254 242 242); border: 1px solid #fecaca; border-radius: 0.5rem; font-size: 0.875rem; color: rgb(185 28 28); display: flex; align-items: center; gap: 0.5rem;">'
          + '<i data-lucide="x-circle" style="width: 16px; height: 16px; flex-shrink: 0;"></i> ' + App.escapeHtml(this.error)
        + '</div>'
      : '';

    var btnContent = this.loading
      ? '<span style="display: inline-block; width: 1rem; height: 1rem; border-radius: 50%; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; animation: icon-spin 0.8s linear infinite;"></span> Verificando...'
      : '<i data-lucide="log-in" style="width: 16px; height: 16px;"></i> Ingresar';

    var eyeIcon = this.showPass ? 'eye-off' : 'eye';

    this.container.innerHTML = ''
      + '<div style="min-height: 100vh; background: #e8ecf0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem;">'

        // Card
        + '<div style="width: 100%; max-width: 400px; border-radius: 0.75rem; overflow: hidden; border: 1px solid #d0d5dd; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">'

          // Cabecera navy
          + '<div style="background: #002060; padding: 2rem; text-align: center;">'
            + '<div style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">'
              + '<i data-lucide="shield-check" style="width: 32px; height: 32px; color: white;"></i>'
            + '</div>'
            + '<div style="color: white; font-weight: 800; font-size: 1.25rem; letter-spacing: 0.06em;">SUNAT</div>'
            + '<div style="color: rgba(255,255,255,0.65); font-size: 0.75rem; margin-top: 0.3rem; line-height: 1.5;">Superintendencia Nacional de Aduanas<br>y de Administración Tributaria</div>'
          + '</div>'

          // Cuerpo
          + '<div style="background: white; padding: 2rem;">'
            + '<h1 style="font-size: 1rem; font-weight: 700; color: #1e293b; text-align: center; margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem;">Acceso al Sistema de Facturación</h1>'

            + '<form id="login-form" style="display: flex; flex-direction: column; gap: 1rem;">'
              + '<div>'
                + '<label class="label">Usuario</label>'
                + '<input id="login-user" class="input" value="' + App.escapeHtml(this.usuario) + '" placeholder="Ingrese su usuario" required autofocus />'
              + '</div>'
              + '<div>'
                + '<label class="label">Contraseña</label>'
                + '<div style="position: relative;">'
                  + '<input id="login-pass" type="' + (this.showPass ? 'text' : 'password') + '" class="input" style="padding-right: 2.75rem;" value="' + App.escapeHtml(this.password) + '" placeholder="Ingrese su contraseña" required />'
                  + '<button type="button" id="login-eye" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0; display: flex; align-items: center;">'
                    + '<i data-lucide="' + eyeIcon + '" style="width: 16px; height: 16px;"></i>'
                  + '</button>'
                + '</div>'
              + '</div>'
              + errorHTML
              + '<button type="submit" id="login-btn" style="width: 100%; padding: 0.7rem 1rem; margin-top: 0.25rem; background: ' + (this.loading ? '#94a3b8' : '#002060') + '; color: white; border: none; border-radius: 0.5rem; font-weight: 700; font-size: 0.9375rem; cursor: ' + (this.loading ? 'not-allowed' : 'pointer') + '; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" ' + (this.loading ? 'disabled' : '') + '>'
                + btnContent
              + '</button>'
            + '</form>'

            // Credenciales demo
            + '<div style="margin-top: 1.25rem; padding: 0.875rem; border-radius: 0.5rem; background: #f8fafc; border: 1px solid #e2e8f0;">'
              + '<div style="display: flex; align-items: center; gap: 0.375rem; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; margin-bottom: 0.5rem;">'
                + '<i data-lucide="info" style="width: 12px; height: 12px;"></i> Credenciales de prueba'
              + '</div>'
              + '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">'
                + '<div>'
                  + '<div style="font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Usuario</div>'
                  + '<code style="display: block; margin-top: 0.125rem; padding: 0.25rem 0.5rem; background: white; border: 1px solid #e2e8f0; border-radius: 0.375rem; font-family: monospace; font-weight: 700; color: #1e293b; font-size: 0.8rem;">demo</code>'
                + '</div>'
                + '<div>'
                  + '<div style="font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Contraseña</div>'
                  + '<code style="display: block; margin-top: 0.125rem; padding: 0.25rem 0.5rem; background: white; border: 1px solid #e2e8f0; border-radius: 0.375rem; font-family: monospace; font-weight: 700; color: #1e293b; font-size: 0.8rem;">demo123</code>'
                + '</div>'
              + '</div>'
            + '</div>'
          + '</div>'
        + '</div>'

        // Footer
        + '<div style="margin-top: 1.5rem; font-size: 0.6875rem; color: #94a3b8; text-align: center;">'
          + '© ' + new Date().getFullYear() + ' SUNAT Demo · Solo para pruebas'
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
