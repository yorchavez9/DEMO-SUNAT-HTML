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
      ? '<div style="padding: 0.75rem; background: rgb(254 242 242); border-radius: 0.625rem; font-size: 0.875rem; color: rgb(185 28 28); display: flex; align-items: center; gap: 0.5rem;">'
          + '<i data-lucide="x-circle" style="width: 16px; height: 16px; flex-shrink: 0;"></i> ' + App.escapeHtml(this.error)
        + '</div>'
      : '';

    var btnContent = this.loading
      ? '<span style="display: inline-block; width: 1rem; height: 1rem; border-radius: 50%; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; animation: icon-spin 0.8s linear infinite;"></span> Verificando...'
      : '<i data-lucide="log-in" style="width: 16px; height: 16px;"></i> Ingresar al Sistema';

    var eyeIcon = this.showPass ? 'eye-off' : 'eye';

    this.container.innerHTML = ''
      + '<div style="min-height: 100vh; background: #001238; display: flex; align-items: center; justify-content: center; padding: 1.5rem; position: relative; overflow: hidden;">'

        // Blobs decorativos
        + '<div style="position: absolute; top: -15%; right: -10%; width: 50vw; height: 50vw; border-radius: 50%; background: rgba(0,48,135,0.35); pointer-events: none;"></div>'
        + '<div style="position: absolute; bottom: -15%; left: -10%; width: 40vw; height: 40vw; border-radius: 50%; background: rgba(204,0,1,0.1); pointer-events: none;"></div>'
        + '<div style="position: absolute; top: 40%; left: 30%; width: 25vw; height: 25vw; border-radius: 50%; background: rgba(0,32,96,0.2); pointer-events: none;"></div>'

        // Card
        + '<div style="background: white; border-radius: 1.25rem; max-width: 400px; width: 100%; box-shadow: 0 25px 60px rgba(0,0,0,0.5); overflow: hidden; position: relative;">'

          // Franja bandera peruana
          + '<div style="height: 6px; background: linear-gradient(to right, #CC0001 33.33%, white 33.33%, white 66.66%, #CC0001 66.66%);"></div>'

          // Cabecera
          + '<div style="padding: 2rem 2rem 1.25rem; text-align: center;">'
            // Badge / Sello
            + '<div style="width: 84px; height: 84px; border-radius: 50%; background: #002060; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; border: 3px solid #C8A000; box-shadow: 0 0 0 6px rgba(200,160,0,0.12), 0 8px 24px rgba(0,32,96,0.3);">'
              + '<i data-lucide="shield-check" style="width: 42px; height: 42px; color: #C8A000;"></i>'
            + '</div>'
            + '<div style="font-size: 1.375rem; font-weight: 800; color: #002060; letter-spacing: 0.08em;">SUNAT</div>'
            + '<div style="font-size: 0.8rem; font-weight: 600; color: #334155; margin-top: 0.25rem;">Facturación Electrónica</div>'
            + '<div style="font-size: 0.68rem; color: #94a3b8; margin-top: 0.2rem; line-height: 1.4;">Superintendencia Nacional de Aduanas<br>y de Administración Tributaria</div>'
          + '</div>'

          // Separador
          + '<div style="height: 1px; background: #e2e8f0; margin: 0 1.5rem;"></div>'

          // Formulario
          + '<div style="padding: 1.5rem 2rem 2rem;">'
            + '<h1 style="font-size: 1rem; font-weight: 700; color: #002060; text-align: center; margin-bottom: 1.25rem;">Iniciar Sesión</h1>'

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
              + '<button type="submit" id="login-btn" style="width: 100%; padding: 0.75rem 1rem; margin-top: 0.25rem; background: ' + (this.loading ? '#94a3b8' : '#002060') + '; color: white; border: none; border-radius: 0.625rem; font-weight: 700; font-size: 0.9375rem; cursor: ' + (this.loading ? 'not-allowed' : 'pointer') + '; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" ' + (this.loading ? 'disabled' : '') + '>'
                + btnContent
              + '</button>'
            + '</form>'

            // Credenciales demo
            + '<div style="margin-top: 1.25rem; padding: 0.875rem; border-radius: 0.625rem; background: #f0f4ff; border: 1px solid #dbeafe;">'
              + '<div style="display: flex; align-items: center; gap: 0.375rem; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #002060; margin-bottom: 0.5rem;">'
                + '<i data-lucide="info" style="width: 12px; height: 12px;"></i> Credenciales de acceso demo'
              + '</div>'
              + '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">'
                + '<div>'
                  + '<div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Usuario</div>'
                  + '<code style="display: block; margin-top: 0.125rem; padding: 0.25rem 0.5rem; background: white; border-radius: 0.375rem; font-family: monospace; font-weight: 700; color: #002060; font-size: 0.8125rem;">demo</code>'
                + '</div>'
                + '<div>'
                  + '<div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Contraseña</div>'
                  + '<code style="display: block; margin-top: 0.125rem; padding: 0.25rem 0.5rem; background: white; border-radius: 0.375rem; font-family: monospace; font-weight: 700; color: #002060; font-size: 0.8125rem;">demo123</code>'
                + '</div>'
              + '</div>'
            + '</div>'

            + '<div style="margin-top: 1.25rem; text-align: center; font-size: 0.6875rem; color: #94a3b8;">'
              + '© ' + new Date().getFullYear() + ' SUNAT Demo · Solo para pruebas'
            + '</div>'
          + '</div>'
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
