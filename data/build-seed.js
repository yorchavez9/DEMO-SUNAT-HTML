/**
 * Genera data/seed.js a partir de los JSON de esta carpeta.
 *
 * Por qué existe: el navegador bloquea fetch() cuando la página se abre con
 * doble clic (file://), así que el sistema no puede leer los .json directamente.
 * Un <script src> sí funciona en file://, por eso los mismos datos se vuelcan a
 * data/seed.js y el sistema lee de ahí.
 *
 * Qué lleva la semilla: los rubros (solo para la identidad visual — nombre,
 * icono y color) y la ficha vacía de la empresa. NO lleva productos, clientes
 * ni ningún dato de ejemplo: el sistema se entrega en blanco y cada negocio
 * carga lo suyo.
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

function leer(ruta) {
  return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

const rubros = leer(path.join(DIR, 'rubros.json'));
const empresa = leer(path.join(DIR, 'empresa.json'));

// Comprobaciones mínimas: sin esto un rubro mal escrito rompe la marca en
// silencio (el sidebar se quedaría sin icono ni color).
const problemas = [];
const vistos = new Set();

rubros.forEach((r, i) => {
  ['id', 'nombre', 'icono', 'color'].forEach((campo) => {
    if (!r[campo]) problemas.push(`rubro #${i + 1}: falta "${campo}"`);
  });
  if (vistos.has(r.id)) problemas.push(`rubro "${r.id}" está repetido`);
  vistos.add(r.id);
});

if (!('rubro' in empresa)) problemas.push('empresa.json debe tener la clave "rubro"');

if (problemas.length) {
  console.error('ERROR:\n  - ' + problemas.join('\n  - '));
  process.exit(1);
}

const semilla = { rubros: rubros, empresa: empresa };

const cabecera = [
  '/* ARCHIVO GENERADO — no lo edites a mano.',
  ' *',
  ' * Fuente: data/rubros.json y data/empresa.json',
  ' * Regenerar:  node data/build-seed.js',
  ' *',
  ' * Se carga con <script src> para que el sistema funcione al abrir',
  ' * index.html con doble clic (file://), donde fetch() está bloqueado.',
  ' *',
  ' * Solo trae los rubros (identidad visual) y la ficha vacía de la empresa.',
  ' * El sistema arranca sin datos: nada de productos ni clientes de ejemplo.',
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
console.log('  rubros: ' + rubros.map((r) => r.id).join(', '));
