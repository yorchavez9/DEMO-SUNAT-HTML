/**
 * Genera data/seed.js a partir de los JSON de esta carpeta.
 *
 * Por qué existe: el navegador bloquea fetch() cuando la página se abre con
 * doble clic (file://), así que el sistema no puede leer los .json directamente.
 * Un <script src> sí funciona en file://, por eso los mismos datos se vuelcan a
 * data/seed.js y el sistema lee de ahí.
 *
 * Los .json siguen siendo la fuente editable. Después de tocarlos, ejecuta:
 *
 *     node data/build-seed.js
 *
 * desde la carpeta demo-sunat-html.
 */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const DIR_CATALOGOS = path.join(DIR, 'catalogos');

function leer(ruta) {
  return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

const semilla = {
  rubros: leer(path.join(DIR, 'rubros.json')),
  empresa: leer(path.join(DIR, 'empresa.json')),
  catalogos: {},
};

fs.readdirSync(DIR_CATALOGOS)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .forEach((f) => {
    semilla.catalogos[path.basename(f, '.json')] = leer(path.join(DIR_CATALOGOS, f));
  });

// Comprobación: cada rubro declarado debe tener su catálogo y viceversa
const declarados = semilla.rubros.map((r) => r.id);
const conCatalogo = Object.keys(semilla.catalogos);
const sinCatalogo = declarados.filter((id) => !conCatalogo.includes(id));
const huerfanos = conCatalogo.filter((id) => !declarados.includes(id));

if (sinCatalogo.length) {
  console.error('ERROR: rubros sin catálogo -> ' + sinCatalogo.join(', '));
  process.exit(1);
}
if (huerfanos.length) {
  console.warn('AVISO: catálogos sin rubro declarado en rubros.json -> ' + huerfanos.join(', '));
}

const cabecera = [
  '/* ARCHIVO GENERADO — no lo edites a mano.',
  ' *',
  ' * Fuente: data/rubros.json, data/empresa.json y data/catalogos/*.json',
  ' * Regenerar:  node data/build-seed.js',
  ' *',
  ' * Se carga con <script src> para que el sistema funcione al abrir',
  ' * index.html con doble clic (file://), donde fetch() está bloqueado.',
  ' */',
  'var App = window.App || (window.App = {});',
  '',
  'App.SEED = ',
].join('\n');

fs.writeFileSync(
  path.join(DIR, 'seed.js'),
  cabecera + JSON.stringify(semilla) + ';\n'
);

const kb = (fs.statSync(path.join(DIR, 'seed.js')).size / 1024).toFixed(1);
console.log('data/seed.js generado — ' + kb + ' KB');
console.log('  rubros:    ' + declarados.length);
console.log('  catálogos: ' + conCatalogo.join(', '));
