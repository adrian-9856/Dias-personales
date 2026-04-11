/**
 * SCRIPT DE DIAGNÓSTICO
 * Copia este código en Apps Script (como un archivo nuevo) y ejecútalo
 * para ver exactamente qué está detectando el sistema
 */

function diagnosticarSistema() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('═══════════════════════════════════════════════════════════');
  Logger.log('🔍 DIAGNÓSTICO DEL SISTEMA - ' + new Date().toLocaleString());
  Logger.log('═══════════════════════════════════════════════════════════');

  // 1. Verificar configuración
  Logger.log('\n📋 PASO 1: Verificando configuración...');
  var sheetConfig = ss.getSheetByName('Configuración');
  if (!sheetConfig) {
    Logger.log('❌ ERROR: No existe la hoja "Configuración"');
    return;
  }

  var token = leerConfiguracion('Token KoboToolbox');
  Logger.log('Token configurado: ' + (token ? 'SÍ (' + token.substring(0, 20) + '...)' : 'NO'));

  // 2. Obtener datos de KoboToolbox
  Logger.log('\n📡 PASO 2: Obteniendo datos de KoboToolbox...');
  var url = 'https://kobo.humanitarianresponse.info/api/v2/assets/aZHQs43GR4NkbkGa6uAn6s/data.csv';

  try {
    var response = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': 'Token ' + token },
      muteHttpExceptions: true
    });

    var code = response.getResponseCode();
    Logger.log('Código de respuesta: ' + code);

    if (code !== 200) {
      Logger.log('❌ ERROR: KoboToolbox respondió con código ' + code);
      return;
    }

    var csv = response.getContentText();
    Logger.log('✅ Datos recibidos: ' + csv.length + ' caracteres');

    // 3. Parsear CSV
    Logger.log('\n📊 PASO 3: Parseando CSV...');
    var lineas = csv.split('\n');
    Logger.log('Total de líneas: ' + lineas.length);

    if (lineas.length < 2) {
      Logger.log('❌ ERROR: CSV vacío o sin datos');
      return;
    }

    var headers = lineas[0].split(';');
    Logger.log('Total de columnas: ' + headers.length);

    // 4. Mostrar encabezados
    Logger.log('\n📋 PASO 4: ENCABEZADOS DEL CSV:');
    Logger.log('═══════════════════════════════════════════════════════════');
    for (var i = 0; i < headers.length; i++) {
      Logger.log('  [' + i + '] "' + headers[i] + '"');
    }
    Logger.log('═══════════════════════════════════════════════════════════');

    // 5. Detectar columnas importantes
    Logger.log('\n🎯 PASO 5: Detectando columnas importantes...');

    // Función auxiliar
    function encontrarCol(keywords) {
      for (var j = 0; j < keywords.length; j++) {
        var keyword = keywords[j].toLowerCase();
        for (var i = 0; i < headers.length; i++) {
          var header = headers[i].toString().toLowerCase().trim();
          if (header.includes(keyword)) {
            return { index: i, keyword: keyword, header: headers[i] };
          }
        }
      }
      return null;
    }

    var colDias = encontrarCol([
      'día personal solicitado',
      'dia personal solicitado',
      'numero de dias solicitados',
      'número de días solicitados',
      'personal solicitado',
      'dias_personal',
      'days_requested'
    ]);

    var colNombre = encontrarCol([
      'inclusión laboral', 'inclusion laboral',
      'centro de cuidado',
      'apoyo emocional', 'apoyo emocinal',
      'operaciones',
      'mi-eelo',
      'gestión de impacto', 'gestion de impacto',
      'educación', 'educacion',
      'administración', 'administracion'
    ]);

    var colEquipo = encontrarCol([
      'programa', 'departamento', 'equipo', 'team', 'programa_departamento'
    ]);

    var colFechaInicio = encontrarCol([
      'fecha_inicio', 'fecha_de_inicio', 'fecha de inicio', 'start_date', 'inicio'
    ]);

    Logger.log('═══════════════════════════════════════════════════════════');
    if (colDias) {
      Logger.log('✅ Columna DÍAS SOLICITADOS: [' + colDias.index + '] "' + colDias.header + '"');
      Logger.log('   (Detectada con keyword: "' + colDias.keyword + '")');
    } else {
      Logger.log('❌ Columna DÍAS SOLICITADOS: NO ENCONTRADA');
    }

    if (colEquipo) {
      Logger.log('✅ Columna EQUIPO: [' + colEquipo.index + '] "' + colEquipo.header + '"');
    } else {
      Logger.log('❌ Columna EQUIPO: NO ENCONTRADA');
    }

    if (colFechaInicio) {
      Logger.log('✅ Columna FECHA INICIO: [' + colFechaInicio.index + '] "' + colFechaInicio.header + '"');
    } else {
      Logger.log('❌ Columna FECHA INICIO: NO ENCONTRADA');
    }

    if (colNombre) {
      Logger.log('✅ Primera columna de NOMBRE (departamento): [' + colNombre.index + '] "' + colNombre.header + '"');
    } else {
      Logger.log('❌ Columnas de NOMBRE: NO ENCONTRADAS');
    }
    Logger.log('═══════════════════════════════════════════════════════════');

    // 6. Mostrar primeras 3 filas de datos
    Logger.log('\n📊 PASO 6: Primeras 3 filas de datos:');
    Logger.log('═══════════════════════════════════════════════════════════');
    for (var i = 1; i <= Math.min(3, lineas.length - 1); i++) {
      Logger.log('\n--- FILA ' + i + ' ---');
      var campos = lineas[i].split(';');

      if (colDias) {
        Logger.log('  Días solicitados [' + colDias.index + ']: "' + (campos[colDias.index] || '') + '"');
      }
      if (colEquipo) {
        Logger.log('  Equipo [' + colEquipo.index + ']: "' + (campos[colEquipo.index] || '') + '"');
      }
      if (colNombre) {
        Logger.log('  Nombre [' + colNombre.index + ']: "' + (campos[colNombre.index] || '') + '"');
      }
      if (colFechaInicio) {
        Logger.log('  Fecha Inicio [' + colFechaInicio.index + ']: "' + (campos[colFechaInicio.index] || '') + '"');
      }
    }
    Logger.log('═══════════════════════════════════════════════════════════');

    Logger.log('\n✅ DIAGNÓSTICO COMPLETADO');
    Logger.log('Revisa el log completo arriba para identificar problemas.');

  } catch (error) {
    Logger.log('❌ ERROR: ' + error.message);
    Logger.log('Stack trace: ' + error.stack);
  }
}

/**
 * Lee configuración (copiar la función del código principal si no existe)
 */
function leerConfiguracion(etiqueta) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Configuración');
    if (!sheet) return '';

    var data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().toLowerCase().includes(etiqueta.toLowerCase())) {
        return data[i][1] ? data[i][1].toString().trim() : '';
      }
    }
    return '';
  } catch (e) {
    return '';
  }
}
