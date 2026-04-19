var App = window.App || (window.App = {});

App.PRODUCTOS_DEMO = [
  { codigo: 'P001', cod_producto_sunat: '43211503', descripcion: 'LAPTOP HP PAVILION 15 i7 16GB 512GB SSD', unidad: 'NIU', precio_unitario: 2950.00, tip_afe_igv: '10', categoria: 'Tecnología' },
  { codigo: 'P002', cod_producto_sunat: '43211708', descripcion: 'MOUSE LOGITECH M170 INALAMBRICO', unidad: 'NIU', precio_unitario: 59.00, tip_afe_igv: '10', categoria: 'Tecnología' },
  { codigo: 'P003', cod_producto_sunat: '43211706', descripcion: 'TECLADO MECANICO REDRAGON K552 RGB', unidad: 'NIU', precio_unitario: 189.00, tip_afe_igv: '10', categoria: 'Tecnología' },
  { codigo: 'P004', cod_producto_sunat: '43211902', descripcion: 'MONITOR LG 24" IPS FULL HD', unidad: 'NIU', precio_unitario: 749.00, tip_afe_igv: '10', categoria: 'Tecnología' },
  { codigo: 'S001', cod_producto_sunat: '81111501', descripcion: 'SERVICIO DE CONSULTORIA EN TI (HORA)', unidad: 'HUR', precio_unitario: 150.00, tip_afe_igv: '10', categoria: 'Servicios' },
  { codigo: 'S002', cod_producto_sunat: '81112005', descripcion: 'SERVICIO DE SOPORTE TECNICO MENSUAL', unidad: 'MON', precio_unitario: 450.00, tip_afe_igv: '10', categoria: 'Servicios' },
  { codigo: 'P005', cod_producto_sunat: '55101500', descripcion: 'LIBRO "CLEAN CODE" — ROBERT MARTIN', unidad: 'NIU', precio_unitario: 89.00, tip_afe_igv: '20', categoria: 'Libros (exonerado)' },
  { codigo: 'P006', cod_producto_sunat: '24112003', descripcion: 'BOLSA PLASTICA BIODEGRADABLE', unidad: 'BG', precio_unitario: 0.50, tip_afe_igv: '10', categoria: 'Empaque', icbper: 0.50, factor_icbper: 0.50 },
  { codigo: 'P007', cod_producto_sunat: '43202010', descripcion: 'IMPRESORA EPSON L3250 MULTIFUNCIONAL', unidad: 'NIU', precio_unitario: 899.00, tip_afe_igv: '10', categoria: 'Tecnología' },
  { codigo: 'P008', cod_producto_sunat: '44103105', descripcion: 'CARTUCHO DE TINTA NEGRO 664 BK', unidad: 'NIU', precio_unitario: 45.00, tip_afe_igv: '10', categoria: 'Tecnología' },
  { codigo: 'S003', cod_producto_sunat: '81111811', descripcion: 'DESARROLLO DE PAGINA WEB (PROYECTO)', unidad: 'ZZ', precio_unitario: 3500.00, tip_afe_igv: '10', categoria: 'Servicios' },
  { codigo: 'S004', cod_producto_sunat: '80101604', descripcion: 'CAPACITACION CORPORATIVA (8 HRS)', unidad: 'DAY', precio_unitario: 1200.00, tip_afe_igv: '10', categoria: 'Servicios' },
];

App.CLIENTES_DEMO = [
  { tipo_doc: '6', num_doc: '20555666777', razon_social: 'ACME CORPORATION SAC', direccion: 'AV. LARCO 1234 - MIRAFLORES', email: 'facturas@acme.com' },
  { tipo_doc: '6', num_doc: '20111222333', razon_social: 'DISTRIBUIDORA LIMA EIRL', direccion: 'JR. COMERCIO 456 - LIMA', email: 'compras@distribuidoralima.pe' },
  { tipo_doc: '1', num_doc: '12345678', razon_social: 'JUAN CARLOS PEREZ LOPEZ', direccion: 'CALLE LAS FLORES 123', email: 'juan.perez@gmail.com' },
  { tipo_doc: '1', num_doc: '87654321', razon_social: 'MARIA ROSA GOMEZ VEGA', direccion: 'AV. UNIVERSITARIA 5678', email: 'maria.gomez@hotmail.com' },
  { tipo_doc: '6', num_doc: '20999888111', razon_social: 'TECNOLOGIAS INTEGRADAS SAC', direccion: 'AV. JAVIER PRADO 1100 - SAN ISIDRO', email: 'admin@tecnointegradas.com' },
];
