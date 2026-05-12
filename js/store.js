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
    api_key: 'Wm1OcM4VnFPoVOQBVFE7g5pQH9LGLI3Qi6kH52e4KZzhmjGt9aPJrjs8HhDzp3K6',
    api_secret: '003e38010b68ed1a830bec83b4a4a2f593697d8c6295a807e89d2098e6c13daf',
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
