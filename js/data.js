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
  // --- Muebles y Oficina ---
  { codigo: 'P009', cod_producto_sunat: '56101504', descripcion: 'SILLA DE OFICINA ERGONOMICA CON SOPORTE LUMBAR', unidad: 'NIU', precio_unitario: 450.00, tip_afe_igv: '10', categoria: 'Muebles' },
  { codigo: 'P010', cod_producto_sunat: '56101503', descripcion: 'ESCRITORIO EJECUTIVO MELAMINA 1.50M', unidad: 'NIU', precio_unitario: 890.00, tip_afe_igv: '10', categoria: 'Muebles' },
  // --- Papelería ---
  { codigo: 'P011', cod_producto_sunat: '14111507', descripcion: 'PAPEL BOND A4 75G (RESMA 500 HOJAS)', unidad: 'PK', precio_unitario: 22.00, tip_afe_igv: '10', categoria: 'Papelería' },
  { codigo: 'P012', cod_producto_sunat: '44121701', descripcion: 'LAPICERO PILOT RETRACTABLE AZUL (CAJA x12)', unidad: 'BX', precio_unitario: 18.50, tip_afe_igv: '10', categoria: 'Papelería' },
  { codigo: 'P013', cod_producto_sunat: '44122004', descripcion: 'FOLDER MANILA A4 (PAQUETE x25 UNID)', unidad: 'PK', precio_unitario: 8.50, tip_afe_igv: '10', categoria: 'Papelería' },
  { codigo: 'P014', cod_producto_sunat: '31201501', descripcion: 'CINTA ADHESIVA TRANSPARENTE 24MM x 65M', unidad: 'NIU', precio_unitario: 4.50, tip_afe_igv: '10', categoria: 'Papelería' },
  // --- Alimentos y Bebidas ---
  { codigo: 'P015', cod_producto_sunat: '50202302', descripcion: 'AGUA DE MESA SAN LUIS 625ML', unidad: 'BO', precio_unitario: 1.50, tip_afe_igv: '10', categoria: 'Alimentos y Bebidas' },
  { codigo: 'P016', cod_producto_sunat: '50161502', descripcion: 'CAFE ALTOMAYO GOURMET MOLIDO 500G', unidad: 'NIU', precio_unitario: 28.00, tip_afe_igv: '10', categoria: 'Alimentos y Bebidas' },
  { codigo: 'P017', cod_producto_sunat: '50231706', descripcion: 'ARROZ SUPERIOR COSTEÑO 5KG', unidad: 'BG', precio_unitario: 24.50, tip_afe_igv: '20', categoria: 'Alimentos y Bebidas (exonerado)' },
  { codigo: 'P018', cod_producto_sunat: '50291505', descripcion: 'ACEITE VEGETAL PRIMOR 1 LITRO', unidad: 'BO', precio_unitario: 9.80, tip_afe_igv: '10', categoria: 'Alimentos y Bebidas' },
  // --- Construcción y Materiales ---
  { codigo: 'P019', cod_producto_sunat: '31211601', descripcion: 'PINTURA LATEX INTERIOR BLANCA 4 GALONES', unidad: 'NIU', precio_unitario: 185.00, tip_afe_igv: '10', categoria: 'Construcción' },
  { codigo: 'P020', cod_producto_sunat: '30111601', descripcion: 'CEMENTO PORTLAND TIPO I PACASMAYO 42.5KG', unidad: 'BG', precio_unitario: 32.00, tip_afe_igv: '10', categoria: 'Construcción' },
  { codigo: 'P021', cod_producto_sunat: '26121613', descripcion: 'CABLE ELECTRICO NYY 2.5MM ROLLO 100M', unidad: 'ROL', precio_unitario: 420.00, tip_afe_igv: '10', categoria: 'Materiales Eléctricos' },
  // --- Ropa y Calzado ---
  { codigo: 'P022', cod_producto_sunat: '53101700', descripcion: 'POLO DE ALGODON UNISEX TALLA M', unidad: 'NIU', precio_unitario: 18.00, tip_afe_igv: '10', categoria: 'Ropa y Calzado' },
  { codigo: 'P023', cod_producto_sunat: '53111602', descripcion: 'ZAPATILLA DEPORTIVA ADIDAS TALLA 42', unidad: 'PAR', precio_unitario: 280.00, tip_afe_igv: '10', categoria: 'Ropa y Calzado' },
  // --- Limpieza ---
  { codigo: 'P024', cod_producto_sunat: '47131503', descripcion: 'LEJIA CLOROX DESINFECTANTE 1 LITRO', unidad: 'BO', precio_unitario: 5.50, tip_afe_igv: '10', categoria: 'Limpieza' },
  { codigo: 'P025', cod_producto_sunat: '47131812', descripcion: 'DETERGENTE ARIEL MULTIACTION 4KG', unidad: 'NIU', precio_unitario: 52.00, tip_afe_igv: '10', categoria: 'Limpieza' },
  // --- Servicios adicionales ---
  { codigo: 'S005', cod_producto_sunat: '82141501', descripcion: 'SERVICIO DE DISEÑO GRAFICO (HORA)', unidad: 'HUR', precio_unitario: 80.00, tip_afe_igv: '10', categoria: 'Servicios' },
  { codigo: 'S006', cod_producto_sunat: '81111812', descripcion: 'HOSTING WEB + DOMINIO .PE (ANUAL)', unidad: 'ZZ', precio_unitario: 350.00, tip_afe_igv: '10', categoria: 'Servicios' },
  { codigo: 'S007', cod_producto_sunat: '76111501', descripcion: 'SERVICIO DE LIMPIEZA DE OFICINA (DIARIO)', unidad: 'DAY', precio_unitario: 120.00, tip_afe_igv: '10', categoria: 'Servicios' },
  { codigo: 'S008', cod_producto_sunat: '84111504', descripcion: 'AUDITORIA Y ASESORIA CONTABLE (SERVICIO)', unidad: 'ZZ', precio_unitario: 2800.00, tip_afe_igv: '10', categoria: 'Servicios' },
];

App.CLIENTES_DEMO = [
  { tipo_doc: '6', num_doc: '20555666777', razon_social: 'ACME CORPORATION SAC', direccion: 'AV. LARCO 1234 - MIRAFLORES', email: 'facturas@acme.com' },
  { tipo_doc: '6', num_doc: '20111222333', razon_social: 'DISTRIBUIDORA LIMA EIRL', direccion: 'JR. COMERCIO 456 - LIMA', email: 'compras@distribuidoralima.pe' },
  { tipo_doc: '1', num_doc: '12345678', razon_social: 'JUAN CARLOS PEREZ LOPEZ', direccion: 'CALLE LAS FLORES 123', email: 'juan.perez@gmail.com' },
  { tipo_doc: '1', num_doc: '87654321', razon_social: 'MARIA ROSA GOMEZ VEGA', direccion: 'AV. UNIVERSITARIA 5678', email: 'maria.gomez@hotmail.com' },
  { tipo_doc: '6', num_doc: '20999888111', razon_social: 'TECNOLOGIAS INTEGRADAS SAC', direccion: 'AV. JAVIER PRADO 1100 - SAN ISIDRO', email: 'admin@tecnointegradas.com' },
];
