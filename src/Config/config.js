/**
 * Configuración centralizada de la aplicación.
 *
 * ÚNICO ORIGEN DE DATOS: APP_SCRIPT_URL (Web App de Google Apps Script).
 * - Productos → productoLeer → hoja PRODUCTOS
 * - Clientes  → clienteLeer  → hoja CLIENTES
 * - Ventas   → ventaLeer / guardarVenta → hojas ENERO..DICIEMBRE
 * El Sheet usado está definido en appscript/Code.gs (SPREADSHEET_ID). Debe coincidir con SPREADSHEET_ID de abajo.
 */
(function (global) {
  'use strict';

  var Config = {
    /**
     * ID del Google Sheet. DEBE SER EL MISMO que en appscript/Code.gs (variable SPREADSHEET_ID).
     * Se obtiene de la URL de edición: .../spreadsheets/d/ESTE_ID/edit
     */
    SPREADSHEET_ID: '1FOjy3jePjs0u76-tVf7QdRiufVWGbdHZVtHJH9beePU',

    /**
     * URL del Web App de Google Apps Script (despliegue). ÚNICA fuente de datos de la app.
     * Copiar aquí la URL que da "Implementar" > "Aplicación web" en el proyecto Apps Script vinculado al Sheet anterior.
     */
    APP_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxz_ssweLSfSIXhzIBXWKHM7Qaj7lauqiaCpPUdt0gohUUXXvSBOzV4GEIyIONW5vFkbw/exec',

    /** Nombres de las hojas (igual que en Code.gs y tables.js). */
    HOJA_PRODUCTOS: 'PRODUCTOS',
    HOJA_CLIENTES: 'CLIENTES',

    /** Valor para la columna USUARIO (OPERACIONES-GENERALES, ventas ENERO..DICIEMBRE, etc.). */
    USUARIO: 'USR-SILVINA',

    /**
     * Cómo se muestra cada código de usuario en pantalla (etiqueta y color de identificación).
     * Clave = valor guardado en el Sheet (columna USUARIO).
     * Valor = { etiqueta: 'Nombre', color: '#hex' }.
     */
    USUARIO_ETIQUETAS: {
      'USR-SILVINA': { etiqueta: 'Silvina', color: '#c0392b' },
      'USR-MATIAS': { etiqueta: 'Matias', color: '#2980b9' },
      'USR-MILY': { etiqueta: 'Mily', color: '#27ae60' },
      'USR-VICKY': { etiqueta: 'Vicky', color: '#8e44ad' }
    },

    /**
     * Devuelve el nombre a mostrar para un código de usuario.
     * @param {string} codigo - Valor de la columna USUARIO (ej. USR-SILVINA).
     * @returns {string} Etiqueta configurada (ej. Silvina) o el mismo código si no está en USUARIO_ETIQUETAS.
     */
    getUsuarioEtiqueta: function (codigo) {
      var c = (codigo === undefined || codigo === null) ? '' : String(codigo).trim();
      var entry = this.USUARIO_ETIQUETAS && this.USUARIO_ETIQUETAS[c];
      if (entry === undefined) return c;
      return typeof entry === 'object' && entry && entry.etiqueta !== undefined ? entry.etiqueta : String(entry);
    },

    /**
     * Devuelve el color de identificación para un código de usuario.
     * @param {string} codigo - Valor de la columna USUARIO (ej. USR-SILVINA).
     * @returns {string} Color en hex (ej. #c0392b) o '' si no está configurado.
     */
    getUsuarioColor: function (codigo) {
      var c = (codigo === undefined || codigo === null) ? '' : String(codigo).trim();
      var entry = this.USUARIO_ETIQUETAS && this.USUARIO_ETIQUETAS[c];
      if (entry && typeof entry === 'object' && entry.color) return entry.color;
      return '';
    },

    /**
     * Categorías para el filtro en Nueva venta. Mismo orden que en la hoja PRODUCTOS (columna CATEGORIA).
     */
    CATEGORIAS: [
      'ALFAJOR',
      'BUDINES',
      'ROSCAS',
      'HOJALDRE',
      'GALLETAS',
      'PANADERIA',
      'ESPECIALIDADES',
      'VARIOS'
    ],

    /** Proxy CORS. Dejar '' para usar directo APP_SCRIPT_URL. */
    CORS_PROXY: ''
  };

  global.APP_CONFIG = Config;
})(typeof window !== 'undefined' ? window : this);
