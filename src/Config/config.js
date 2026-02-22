/**
 * Configuración centralizada de la aplicación.
 * Origen de datos: Google Sheet vía Apps Script (APP_SCRIPT_URL).
 * El documento y las hojas están definidos en appscript/Code.gs (SPREADSHEET_ID y TABLAS).
 */
(function (global) {
  'use strict';

  var Config = {
    /**
     * ID del Google Sheet (debe coincidir con SPREADSHEET_ID en appscript/Code.gs).
     * Todas las lecturas/escrituras usan este documento y las hojas definidas en Code.gs.
     */
    SPREADSHEET_ID: '1R05n3t2cgmzX-z58b9Sgx4He9k9Y9NAm9myQXbEwv3Q',

    /**
     * URL del Web App de Google Apps Script.
     * De aquí se consumen los datos: productoLeer → hoja PRODUCTOS, clienteLeer → hoja CLIENTES, ventaAlta/ventaLeer → hojas ENERO..DICIEMBRE.
     * Las hojas exactas están en appscript/Code.gs (TABLAS).
     */
    APP_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxSYy8d7pkdhmV2yYV_iS0m4sBG7p_lbQPW1-ND4BQdCsQIi2fsRYPEbg83KdCx1h8f/exec',

    /**
     * Nombres de las hojas del Sheet que consume la app (deben coincidir con Code.gs y tables.js).
     * Productos → hoja PRODUCTOS. Clientes → hoja CLIENTES. Ventas → ENERO, FEBRERO, ... DICIEMBRE.
     */
    HOJA_PRODUCTOS: 'PRODUCTOS',
    HOJA_CLIENTES: 'CLIENTES',

    /**
     * Proxy CORS (dejar vacío para enviar directo al Apps Script).
     * Sin proxy: la venta se guarda; el navegador puede bloquear la respuesta por CORS y se muestra mensaje de confirmación igual.
     */
    CORS_PROXY: ''
  };

  global.APP_CONFIG = Config;
})(typeof window !== 'undefined' ? window : this);
