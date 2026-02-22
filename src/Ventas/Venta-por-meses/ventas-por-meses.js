(function () {
  'use strict';

  var APP_CONFIG = window.APP_CONFIG;
  var APP_TABLES = window.APP_TABLES;
  var APP_SCRIPT_URL = APP_CONFIG && APP_CONFIG.APP_SCRIPT_URL;
  var CORS_PROXY = APP_CONFIG && APP_CONFIG.CORS_PROXY;
  var NOMBRES_MESES = (APP_TABLES && APP_TABLES.NOMBRES_HOJAS_MES) || [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  /** Orden de columnas: nombre del mes + columnas de la tabla del mes. */
  var columnasTabla = [
    'MES',
    'FECHA_OPERATIVA',
    'HORA',
    'ID-VENTA',
    'ID-PRODUCTO',
    'CATEGORIA',
    'PRODUCTO',
    'CANTIDAD',
    'PRECIO',
    'MONTO'
  ];

  /** Columnas que no se muestran en la tabla. */
  var columnasOcultas = ['MES', 'ID-VENTA', 'ID-PRODUCTO'];

  var allData = [];
  var filteredData = [];
  var currentColumnas = [];
  var currentNombreMes = '';

  function fmtMoney(n) {
    return '$\u00a0' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  /** Formatea fecha a dd-MM-YYYY (ej: 22-02-2026). Acepta ISO con hora (2026-02-22T03:00:00.000Z) o solo fecha. */
  function fmtFecha(val) {
    if (val === undefined || val === null || val === '') return '';
    var s = String(val).trim();
    if (!s) return '';
    if (s.indexOf('T') !== -1) s = s.substring(0, s.indexOf('T'));
    var parts = s.split(/[-/]/);
    if (parts.length === 3 && parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
      var dd = ('0' + parts[2]).slice(-2);
      var mm = ('0' + parts[1]).slice(-2);
      var yyyy = parts[0];
      return dd + '-' + mm + '-' + yyyy;
    }
    var d = new Date(val);
    if (isNaN(d.getTime())) return s;
    var dd = ('0' + d.getDate()).slice(-2);
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    var yyyy = d.getFullYear();
    return dd + '-' + mm + '-' + yyyy;
  }

  /** Formatea hora a HH:mm (24h). Acepta ISO (1899-12-30T14:35:48.000Z) o solo hora; usa hora local. */
  function fmtHora(val) {
    if (val === undefined || val === null || val === '') return '';
    var s = String(val).trim();
    if (!s) return '';
    var d = new Date(val);
    if (isNaN(d.getTime())) return s;
    var h = d.getHours();
    var m = d.getMinutes();
    return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
  }

  function getMesActual() {
    if (!NOMBRES_MESES || !NOMBRES_MESES.length) return '';
    var idx = new Date().getMonth();
    return NOMBRES_MESES[idx] || NOMBRES_MESES[0];
  }

  function init() {
    var selectMes = document.getElementById('ventas-meses-mes');
    var btnCargar = document.getElementById('ventas-meses-btn-cargar');
    if (!selectMes || !btnCargar) return;

    if (NOMBRES_MESES && NOMBRES_MESES.length) {
      NOMBRES_MESES.forEach(function (nombre) {
        var opt = document.createElement('option');
        opt.value = nombre;
        opt.textContent = nombre;
        selectMes.appendChild(opt);
      });
      selectMes.value = getMesActual();
      cargarVentasDelMes();
    }

    btnCargar.addEventListener('click', cargarVentasDelMes);

    var tableSearch = document.getElementById('table-search');
    if (tableSearch) {
      tableSearch.addEventListener('input', function () {
        renderTable(this.value);
      });
    }
  }

  function mostrarMensaje(texto, esError) {
    var msg = document.getElementById('ventas-meses-mensaje');
    if (!msg) return;
    msg.textContent = texto;
    msg.className = 'ventas-meses__mensaje' + (esError ? ' ventas-meses__mensaje--error' : '');
  }

  function cargarVentasDelMes() {
    var selectMes = document.getElementById('ventas-meses-mes');
    var mes = selectMes ? selectMes.value : '';
    if (!mes) {
      mostrarMensaje('Seleccione un mes.', true);
      return;
    }
    if (!APP_SCRIPT_URL) {
      mostrarMensaje('No está configurada la URL del Apps Script (APP_SCRIPT_URL).', true);
      return;
    }

    mostrarMensaje('Cargando ventas de ' + mes + '…');
    var payload = { accion: 'ventaLeer', hoja: mes };
    var body = 'data=' + encodeURIComponent(JSON.stringify(payload));
    var url = (CORS_PROXY && CORS_PROXY.length > 0)
      ? CORS_PROXY + encodeURIComponent(APP_SCRIPT_URL)
      : APP_SCRIPT_URL;

    fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var ct = (res.headers.get('Content-Type') || '').toLowerCase();
        if (ct.indexOf('json') !== -1) return res.json();
        return res.text().then(function (t) {
          try { return JSON.parse(t); } catch (e) { return { ok: false, error: t }; };
        });
      })
      .then(function (data) {
        if (data && data.ok && Array.isArray(data.datos)) {
          pintarTabla(mes, data.datos);
          mostrarMensaje('Se cargaron ' + data.datos.length + ' registro(s) de ' + mes + '.');
        } else {
          mostrarMensaje(data && (data.error || data.mensaje) || 'No se recibieron datos.', true);
          ocultarTabla();
        }
      })
      .catch(function (err) {
        var txt = err && err.message ? err.message : String(err);
        if (/failed to fetch|cors|blocked|access-control/i.test(txt)) {
          mostrarMensaje('No se pudo conectar con el servidor (CORS). Compruebe APP_SCRIPT_URL y despliegue.', true);
        } else {
          mostrarMensaje('Error: ' + txt, true);
        }
        ocultarTabla();
      });
  }

  function pintarTabla(nombreMes, datos) {
    var wrapper = document.getElementById('ventas-meses-tabla-wrapper');
    var subtitulo = document.getElementById('ventas-meses-subtitulo');
    var thead = document.getElementById('ventas-meses-thead');
    var tbody = document.getElementById('ventas-meses-tbody');
    if (!wrapper || !thead || !tbody) return;

    allData = datos;
    currentNombreMes = nombreMes;
    subtitulo.textContent = 'Ventas de ' + nombreMes;
    var tableSearch = document.getElementById('table-search');
    if (tableSearch) tableSearch.value = '';

    var columnas = columnasTabla;
    if (datos.length > 0) {
      var clavesFila = Object.keys(datos[0]);
      columnas = ['MES'].concat(clavesFila.filter(function (k) { return k !== 'MES'; }));
    }
    columnas = columnas.filter(function (c) { return columnasOcultas.indexOf(c) === -1; });
    currentColumnas = columnas;

    thead.innerHTML = '';
    var trHead = document.createElement('tr');
    columnas.forEach(function (col) {
      var th = document.createElement('th');
      th.textContent = col === 'FECHA_OPERATIVA' ? 'FECHA' : col;
      if (['CANTIDAD', 'PRECIO', 'MONTO'].indexOf(col) !== -1) th.className = 'th-num';
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    renderTable('', currentNombreMes, currentColumnas);
    wrapper.hidden = false;
  }

  function renderTable(searchTerm, nombreMes, columnas) {
    var tbody = document.getElementById('ventas-meses-tbody');
    var footer = document.getElementById('table-footer');
    if (!tbody || !footer) return;

    var s = (searchTerm || '').toLowerCase().trim();
    filteredData = s
      ? allData.filter(function (r) {
          return Object.values(r).some(function (v) {
            return String(v).toLowerCase().indexOf(s) !== -1;
          });
        })
      : allData;

    if (!columnas) columnas = currentColumnas.length ? currentColumnas : columnasTabla;
    if (!nombreMes) nombreMes = currentNombreMes;

    tbody.innerHTML = '';
    filteredData.forEach(function (fila) {
      var tr = document.createElement('tr');
      columnas.forEach(function (col) {
        var td = document.createElement('td');
        var val = fila[col];
        if (val === undefined || val === null) val = '';
        if (col === 'MES') val = nombreMes;
        if (col === 'FECHA_OPERATIVA') val = fmtFecha(val);
        if (col === 'HORA') val = fmtHora(val);
        if (col === 'ID-VENTA') {
          td.className = 'id-venta';
          td.textContent = val;
        } else if (col === 'CATEGORIA') {
          var cat = String(val).toLowerCase();
          var badgeClass = 'badge-cat';
          if (cat.indexOf('promo') !== -1) badgeClass += ' badge-cat--promos';
          else if (cat.indexOf('bebida') !== -1) badgeClass += ' badge-cat--bebida';
          else if (cat.indexOf('empanada') !== -1) badgeClass += ' badge-cat--empanada';
          else if (cat.indexOf('postre') !== -1) badgeClass += ' badge-cat--postre';
          td.innerHTML = '<span class="' + badgeClass + '">' + (val || '') + '</span>';
        } else if (col === 'MONTO' && typeof val === 'number') {
          td.className = 'td-num td-monto';
          td.textContent = fmtMoney(val);
        } else if (['CANTIDAD', 'PRECIO'].indexOf(col) !== -1 && typeof val === 'number') {
          td.className = 'td-num';
          td.textContent = Number(val).toLocaleString('es-AR');
        } else {
          td.textContent = val;
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    var totalFilt = filteredData.reduce(function (s, r) {
      return s + (parseFloat(r.MONTO) || 0);
    }, 0);
    footer.innerHTML =
      '<span>Mostrando <strong>' + filteredData.length + '</strong> de ' + allData.length + ' registros</span>' +
      '<span>Subtotal filtrado: <strong>' + fmtMoney(totalFilt) + '</strong></span>';
  }

  function ocultarTabla() {
    var wrapper = document.getElementById('ventas-meses-tabla-wrapper');
    if (wrapper) wrapper.hidden = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
