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

  function getAniosDisponibles() {
    var anioActual = new Date().getFullYear();
    var lista = [];
    for (var a = anioActual; a >= anioActual - 5; a--) lista.push(a);
    return lista;
  }

  function init() {
    var selectAnio = document.getElementById('ventas-anio-anio');
    var btnCargar = document.getElementById('ventas-anio-btn-cargar');
    if (!selectAnio || !btnCargar) return;

    getAniosDisponibles().forEach(function (anio) {
      var opt = document.createElement('option');
      opt.value = anio;
      opt.textContent = anio;
      selectAnio.appendChild(opt);
    });

    btnCargar.addEventListener('click', cargarVentasAnio);
  }

  function mostrarMensaje(texto, esError) {
    var msg = document.getElementById('ventas-anio-mensaje');
    if (!msg) return;
    msg.textContent = texto;
    msg.className = 'ventas-anio__mensaje' + (esError ? ' ventas-anio__mensaje--error' : '');
    msg.hidden = false;
  }

  function llamarVentaLeer(mes) {
    var payload = { accion: 'ventaLeer', hoja: mes };
    var body = 'data=' + encodeURIComponent(JSON.stringify(payload));
    var url = (CORS_PROXY && CORS_PROXY.length > 0)
      ? CORS_PROXY + encodeURIComponent(APP_SCRIPT_URL)
      : APP_SCRIPT_URL;

    return fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var ct = (res.headers.get('Content-Type') || '').toLowerCase();
      if (ct.indexOf('json') !== -1) return res.json();
      return res.text().then(function (t) {
        try { return JSON.parse(t); } catch (e) { return { ok: false, error: t }; };
      });
    });
  }

  function cargarVentasAnio() {
    var selectAnio = document.getElementById('ventas-anio-anio');
    var anio = selectAnio ? selectAnio.value : '';
    if (!anio) {
      mostrarMensaje('Seleccione un año.', true);
      return;
    }
    if (!APP_SCRIPT_URL) {
      mostrarMensaje('No está configurada la URL del Apps Script (APP_SCRIPT_URL).', true);
      return;
    }

    mostrarMensaje('Cargando ventas del año ' + anio + '…');
    var resumen = document.getElementById('ventas-anio-resumen');
    if (resumen) resumen.hidden = true;

    var promesas = NOMBRES_MESES.map(function (mes) {
      return llamarVentaLeer(mes).then(function (data) {
        return { mes: mes, data: data };
      });
    });

    Promise.all(promesas)
      .then(function (resultados) {
        var porMes = {};
        var totalAnio = 0;
        var totalVentasAnio = 0;

        resultados.forEach(function (r) {
          var datos = (r.data && r.data.ok && r.data.datos) ? r.data.datos : [];
          var montoMes = 0;
          var idsVenta = {};
          datos.forEach(function (fila) {
            montoMes += Number(fila.MONTO) || 0;
            var idVenta = fila['ID-VENTA'];
            if (idVenta != null && idVenta !== '') idsVenta[idVenta] = true;
          });
          porMes[r.mes] = { monto: montoMes, cantidadVentas: Object.keys(idsVenta).length };
          totalAnio += montoMes;
          totalVentasAnio += porMes[r.mes].cantidadVentas;
        });

        pintarResumenAnio(anio, porMes, totalAnio, totalVentasAnio);
        document.getElementById('ventas-anio-mensaje').hidden = true;
      })
      .catch(function (err) {
        var txt = err && err.message ? err.message : String(err);
        if (/failed to fetch|cors|blocked|access-control/i.test(txt)) {
          mostrarMensaje('No se pudo conectar con el servidor (CORS).', true);
        } else {
          mostrarMensaje('Error: ' + txt, true);
        }
      });
  }

  function pintarResumenAnio(anio, porMes, totalAnio, totalVentasAnio) {
    var resumen = document.getElementById('ventas-anio-resumen');
    var subtitulo = document.getElementById('ventas-anio-subtitulo');
    var totalEl = document.getElementById('ventas-anio-total');
    var cantidadVentasEl = document.getElementById('ventas-anio-cantidad-ventas');
    var thead = document.getElementById('ventas-anio-thead');
    var tbody = document.getElementById('ventas-anio-tbody');

    if (!resumen || !subtitulo) return;

    subtitulo.textContent = 'Resumen año ' + anio;
    if (totalEl) totalEl.textContent = totalAnio.toLocaleString('es-AR');
    if (cantidadVentasEl) cantidadVentasEl.textContent = totalVentasAnio.toLocaleString('es-AR');

    if (thead && tbody) {
      thead.innerHTML = '';
      tbody.innerHTML = '';
      var trHead = document.createElement('tr');
      ['MES', 'MONTO', 'CANT. VENTAS'].forEach(function (col) {
        var th = document.createElement('th');
        th.textContent = col;
        if (col !== 'MES') th.className = 'ventas-anio__th-num';
        trHead.appendChild(th);
      });
      thead.appendChild(trHead);

      NOMBRES_MESES.forEach(function (mes) {
        var o = porMes[mes] || { monto: 0, cantidadVentas: 0 };
        var tr = document.createElement('tr');
        [mes, o.monto.toLocaleString('es-AR'), o.cantidadVentas.toLocaleString('es-AR')].forEach(function (val, i) {
          var td = document.createElement('td');
          td.textContent = val;
          if (i > 0) td.className = 'ventas-anio__th-num';
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }

    resumen.hidden = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
