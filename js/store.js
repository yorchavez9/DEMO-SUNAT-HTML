var App = window.App || (window.App = {});

(function () {
  var STORAGE_KEY = 'api_sunat_config';
  var AUTH_KEY = 'api_sunat_session';

  // Credenciales demo (hardcoded, solo para este ejemplo)
  App.DEMO_CREDENTIALS = {
    usuario: 'demo',
    password: 'demo123',
    nombre: 'Usuario Demo',
  };

  App.login = function (usuario, password) {
    if (usuario === App.DEMO_CREDENTIALS.usuario && password === App.DEMO_CREDENTIALS.password) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({
        usuario: App.DEMO_CREDENTIALS.usuario,
        nombre: App.DEMO_CREDENTIALS.nombre,
        loggedInAt: new Date().toISOString(),
      }));
      return true;
    }
    return false;
  };

  App.logout = function () {
    localStorage.removeItem(AUTH_KEY);
  };

  App.getSession = function () {
    try {
      var raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  App.isLoggedIn = function () {
    return !!App.getSession();
  };

  var DEFAULT_CONFIG = {
    base_url: 'https://apisunatv2.kodevo.es/api/v1',
    api_key: 'H5jdBH0YfhjTBzmwn1zP6PjDxruytaTixX6O4gRJiuyp1IqIbNE1TwU2lmcFL2d7',
    api_secret: 'e4fb0d4e7f1bd2cab916c58d47748916ab9ce1cd7c79ee6f5c63752f4eee0612',
  };

  App.getConfig = function () {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : Object.assign({}, DEFAULT_CONFIG);
    } catch (e) {
      return Object.assign({}, DEFAULT_CONFIG);
    }
  };

  App.saveConfig = function (config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  };

  App.isConfigured = function () {
    var c = App.getConfig();
    return Boolean(c.api_key && c.api_secret);
  };
})();
