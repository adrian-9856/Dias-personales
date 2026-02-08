/**
 * Sistema de Gestión de Días Personales - VERSIÓN SIMPLE (Sin Token)
 * Versión 3.0 - Sin necesidad de autenticación
 *
 * Este script procesa datos de días personales desde una hoja de Google Sheets.
 * NO REQUIERE token ni conexión a KoboToolbox API.
 *
 * INSTRUCCIONES:
 * 1. Descarga el CSV desde KoboToolbox manualmente
 * 2. Copia y pega los datos en la hoja "Datos Importados"
 * 3. Ejecuta "Procesar Datos" desde el menú
 * 4. ¡Listo!
 */

// ============================================================================
// CONFIGURACIÓN SIMPLE
// ============================================================================

const CONFIG = {
  DIAS_TOTALES: 15, // Días personales totales por persona
  SHEET_NAME_IMPORTADOS: 'Datos Importados', // Aquí pegas los datos de KoboToolbox
  SHEET_NAME_RESUMEN: 'Resumen',
  SHEET_NAME_CONFIG: 'Configuración',
  SHEET_NAME_HISTORIAL: 'Historial de Solicitudes',
  SHEET_NAME_DIRECTORES: 'Directores',

  // Equipos disponibles
  EQUIPOS: [
    'Apoyo emocional',
    'Operaciones',
    'mi-eelo',
    'Gestión de Impacto',
    'Educación',
    'Centro de cuidado infantil',
    'Administración',
    'Inclusión Laboral'
  ]
};

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Función principal - Procesa los datos que ya están en la hoja
 */
function procesarDatosSimple() {
  try {
    Logger.log('Iniciando procesamiento de datos...');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetImportados = ss.getSheetByName(CONFIG.SHEET_NAME_IMPORTADOS);

    if (!sheetImportados) {
      mostrarError('No existe la hoja "Datos Importados".\n\nPor favor:\n1. Crea una hoja llamada "Datos Importados"\n2. Pega ahí los datos de KoboToolbox\n3. Ejecuta este proceso nuevamente');
      return;
    }

    if (sheetImportados.getLastRow() === 0) {
      mostrarError('La hoja "Datos Importados" está vacía.\n\nPor favor:\n1. Descarga el CSV desde KoboToolbox\n2. Copia todos los datos (Ctrl+A, Ctrl+C)\n3. Pega en la hoja "Datos Importados" (Ctrl+V)\n4. Ejecuta este proceso nuevamente');
      return;
    }

    // Obtener datos de la hoja
    const datosCSV = sheetImportados.getDataRange().getValues();

    if (datosCSV.length <= 1) {
      mostrarError('La hoja "Datos Importados" solo tiene encabezados.\n\nAsegúrate de pegar los datos completos desde KoboToolbox.');
      return;
    }

    // Detectar nuevos registros
    const registrosNuevos = detectarRegistrosNuevos(datosCSV);

    // Procesar todos los datos
    const datosProcessados = procesarDatos(datosCSV);

    if (datosProcessados.length === 0) {
      mostrarError('No se pudo procesar ningún dato.\n\nVerifica que:\n1. Los datos tienen un campo "nombre" o "nombre_empleado"\n2. Los datos tienen fechas de inicio y fin\n3. El formato es correcto');
      return;
    }

    // Agregar al historial
    if (registrosNuevos.length > 0) {
      agregarAlHistorial(registrosNuevos);
    }

    // Generar resumen
    const resumen = generarResumen(datosProcessados);

    // Escribir resumen
    escribirResumen(resumen);

    // Enviar notificaciones si está configurado
    if (registrosNuevos.length > 0) {
      enviarNotificacionNuevoRegistro(registrosNuevos);
    }

    Logger.log('Procesamiento completado exitosamente');

    const mensaje = registrosNuevos.length > 0
      ? `✅ ${registrosNuevos.length} nuevo(s) registro(s) procesado(s)\n\nRevisa la hoja "Resumen" para ver los resultados.`
      : '✅ Datos actualizados correctamente\n\nNo hay registros nuevos.\n\nRevisa la hoja "Resumen" para ver los resultados.';

    SpreadsheetApp.getUi().alert('Procesamiento Completado', mensaje, SpreadsheetApp.getUi().ButtonSet.OK);

  } catch (error) {
    Logger.log('Error en procesarDatosSimple: ' + error.message);
    mostrarError('Error al procesar los datos:\n\n' + error.message + '\n\nRevisa los logs en Apps Script para más detalles.');
    throw error;
  }
}

/**
 * Muestra un mensaje de error al usuario
 */
function mostrarError(mensaje) {
  SpreadsheetApp.getUi().alert('⚠️ Error', mensaje, SpreadsheetApp.getUi().ButtonSet.OK);
  Logger.log('ERROR: ' + mensaje);
}

/**
 * Detecta registros nuevos comparando con el historial
 */
function detectarRegistrosNuevos(datosCSV) {
  try {
    if (!datosCSV || datosCSV.length <= 1) {
      return [];
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheetHistorial = ss.getSheetByName(CONFIG.SHEET_NAME_HISTORIAL);

    // Si no existe historial, todos son nuevos
    if (!sheetHistorial || sheetHistorial.getLastRow() === 0) {
      Logger.log('No existe historial previo. Todos los registros son nuevos.');
      return datosCSV.slice(1);
    }

    // Obtener datos del historial
    const historialData = sheetHistorial.getDataRange().getValues();
    const historialIds = new Set();

    // Crear set de IDs únicos (concatenar nombre + fecha inicio + fecha fin)
    historialData.slice(1).forEach(row => {
      const id = row[2] + '|' + row[4] + '|' + row[5]; // nombre|fecha_inicio|fecha_fin
      historialIds.add(id);
    });

    // Filtrar solo registros nuevos
    const headers = datosCSV[0];
    const colNombre = encontrarColumna(headers, ['nombre', 'name', 'empleado', 'employee', 'nombre_empleado', 'nombre_completo']);
    const colFechaInicio = encontrarColumna(headers, ['fecha_inicio', 'fecha_de_inicio', 'start_date', 'inicio']);
    const colFechaFin = encontrarColumna(headers, ['fecha_finalizacion', 'fecha_de_finalizacion', 'fecha_fin', 'end_date', 'fin']);

    const nuevos = datosCSV.slice(1).filter(row => {
      const id = row[colNombre] + '|' + row[colFechaInicio] + '|' + row[colFechaFin];
      return !historialIds.has(id);
    });

    Logger.log(`Encontrados ${nuevos.length} registros nuevos de ${datosCSV.length - 1} totales`);
    return nuevos;

  } catch (error) {
    Logger.log('Error en detectarRegistrosNuevos: ' + error.message);
    return datosCSV.slice(1);
  }
}

/**
 * Agrega nuevos registros al historial
 */
function agregarAlHistorial(registrosNuevos) {
  try {
    if (registrosNuevos.length === 0) return;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_HISTORIAL);

    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME_HISTORIAL);
      const headers = ['ID', 'Fecha Proceso', 'Nombre', 'Equipo', 'Fecha Inicio', 'Fecha Fin', 'Días Solicitados', 'Estado'];
      sheet.getRange(1, 1, 1, headers.length)
        .setValues([headers])
        .setFontWeight('bold')
        .setBackground('#4285f4')
        .setFontColor('#ffffff');
    }

    const ultimaFila = sheet.getLastRow() + 1;
    const fechaProceso = new Date();

    // Preparar datos para escribir
    const datosHistorial = registrosNuevos.map((registro, index) => {
      const nombre = registro[encontrarColumna(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_IMPORTADOS).getRange(1, 1, 1, registro.length).getValues()[0], ['nombre', 'nombre_empleado'])] || 'Sin nombre';
      const equipo = registro[encontrarColumna(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_IMPORTADOS).getRange(1, 1, 1, registro.length).getValues()[0], ['programa', 'departamento', 'equipo'])] || 'Sin equipo';
      const fechaInicio = registro[encontrarColumna(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_IMPORTADOS).getRange(1, 1, 1, registro.length).getValues()[0], ['fecha_inicio'])] || '';
      const fechaFin = registro[encontrarColumna(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_IMPORTADOS).getRange(1, 1, 1, registro.length).getValues()[0], ['fecha_fin', 'fecha_finalizacion'])] || '';
      const dias = calcularDiasEntreFechas(fechaInicio, fechaFin);

      return [
        ultimaFila + index,
        fechaProceso,
        nombre,
        equipo,
        fechaInicio,
        fechaFin,
        dias,
        'Procesado'
      ];
    });

    sheet.getRange(ultimaFila, 1, datosHistorial.length, 8).setValues(datosHistorial);
    Logger.log(`${datosHistorial.length} registros agregados al historial`);

  } catch (error) {
    Logger.log('Error en agregarAlHistorial: ' + error.message);
  }
}

/**
 * Procesa los datos desde la hoja de importados
 */
function procesarDatos(datosCSV) {
  try {
    Logger.log('Procesando datos...');

    if (!datosCSV || datosCSV.length === 0) {
      throw new Error('No hay datos para procesar');
    }

    const headers = datosCSV[0];
    const datos = datosCSV.slice(1);

    // Identificar columnas
    const colNombre = encontrarColumna(headers, ['nombre', 'name', 'empleado', 'employee', 'nombre_empleado', 'nombre_completo']);
    const colEquipo = encontrarColumna(headers, ['programa', 'departamento', 'equipo', 'team', 'programa_departamento']);
    const colFechaInicio = encontrarColumna(headers, ['fecha_inicio', 'fecha_de_inicio', 'start_date', 'inicio']);
    const colFechaFin = encontrarColumna(headers, ['fecha_finalizacion', 'fecha_de_finalizacion', 'fecha_fin', 'end_date', 'fin']);
    const colReglamento = encontrarColumna(headers, ['reglamento', 'conoces_reglamento', 'conoce_reglamento']);
    const colConsentimiento = encontrarColumna(headers, ['consentimiento', 'consentimiento_director', 'director_consent']);

    // Obtener mapeo de directores
    const mapeoDirectores = obtenerMapeoDirectores();

    // Agrupar solicitudes por empleado
    const empleadosMap = new Map();

    datos.forEach((fila) => {
      const nombre = fila[colNombre] || 'Sin nombre';
      const equipo = fila[colEquipo] || 'Sin equipo';
      const fechaInicio = fila[colFechaInicio] || '';
      const fechaFin = fila[colFechaFin] || '';
      const conoceReglamento = fila[colReglamento] || 'No especificado';
      const tieneConsentimiento = fila[colConsentimiento] || 'No especificado';

      // Obtener director
      const infoDirector = mapeoDirectores[equipo] || { nombre: 'Sin asignar', correo: '' };

      // Calcular días
      const diasSolicitados = calcularDiasEntreFechas(fechaInicio, fechaFin);

      // Agrupar por empleado
      if (!empleadosMap.has(nombre)) {
        empleadosMap.set(nombre, {
          nombre: nombre,
          equipo: equipo,
          director: infoDirector.nombre,
          correoDirector: infoDirector.correo,
          diasTomados: 0,
          solicitudes: []
        });
      }

      const empleado = empleadosMap.get(nombre);
      empleado.diasTomados += diasSolicitados;
      empleado.solicitudes.push({
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        dias: diasSolicitados,
        conoceReglamento: conoceReglamento,
        tieneConsentimiento: tieneConsentimiento
      });
    });

    // Convertir a array
    const datosProcessados = Array.from(empleadosMap.values()).map(empleado => {
      const diasRestantes = CONFIG.DIAS_TOTALES - empleado.diasTomados;
      return {
        nombre: empleado.nombre,
        equipo: empleado.equipo,
        director: empleado.director,
        correoDirector: empleado.correoDirector,
        diasTomados: empleado.diasTomados,
        diasRestantes: diasRestantes,
        porcentajeUsado: (empleado.diasTomados / CONFIG.DIAS_TOTALES * 100).toFixed(1),
        solicitudes: empleado.solicitudes,
        totalSolicitudes: empleado.solicitudes.length
      };
    });

    Logger.log('Datos procesados: ' + datosProcessados.length + ' empleados');
    return datosProcessados;

  } catch (error) {
    Logger.log('Error en procesarDatos: ' + error.message);
    throw error;
  }
}

/**
 * Calcula días entre dos fechas
 */
function calcularDiasEntreFechas(fechaInicio, fechaFin) {
  try {
    if (!fechaInicio || !fechaFin) return 0;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return 0;

    const unDia = 24 * 60 * 60 * 1000;
    const diferencia = Math.abs(fin - inicio);
    const dias = Math.ceil(diferencia / unDia) + 1;

    return dias;

  } catch (error) {
    Logger.log('Error en calcularDiasEntreFechas: ' + error.message);
    return 0;
  }
}

/**
 * Obtiene el mapeo de directores
 */
function obtenerMapeoDirectores() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DIRECTORES);

    if (!sheet || sheet.getLastRow() <= 2) {
      Logger.log('No existe mapeo de directores.');
      return {};
    }

    const datos = sheet.getRange(3, 1, sheet.getLastRow() - 2, 3).getValues();
    const mapeo = {};

    datos.forEach(fila => {
      const equipo = fila[0];
      const nombreDirector = fila[1];
      const correoDirector = fila[2];

      if (equipo && nombreDirector) {
        mapeo[equipo] = {
          nombre: nombreDirector,
          correo: correoDirector || ''
        };
      }
    });

    return mapeo;

  } catch (error) {
    Logger.log('Error en obtenerMapeoDirectores: ' + error.message);
    return {};
  }
}

/**
 * Encuentra columna
 */
function encontrarColumna(headers, palabrasClave) {
  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i]).toLowerCase();
    for (let palabra of palabrasClave) {
      if (header.includes(palabra.toLowerCase())) {
        return i;
      }
    }
  }
  return 0;
}

/**
 * Genera resumen
 */
function generarResumen(datosProcessados) {
  try {
    const resumenPorDirector = {};
    const resumenPorEquipo = {};

    datosProcessados.forEach(persona => {
      const director = persona.director;
      const equipo = persona.equipo;

      if (!resumenPorDirector[director]) {
        resumenPorDirector[director] = {
          director: director,
          correo: persona.correoDirector,
          personas: [],
          totalDiasTomados: 0,
          totalDiasRestantes: 0,
          totalPersonas: 0
        };
      }

      resumenPorDirector[director].personas.push(persona);
      resumenPorDirector[director].totalDiasTomados += persona.diasTomados;
      resumenPorDirector[director].totalDiasRestantes += persona.diasRestantes;
      resumenPorDirector[director].totalPersonas++;

      if (!resumenPorEquipo[equipo]) {
        resumenPorEquipo[equipo] = {
          equipo: equipo,
          personas: [],
          totalDiasTomados: 0,
          totalDiasRestantes: 0,
          totalPersonas: 0
        };
      }

      resumenPorEquipo[equipo].personas.push(persona);
      resumenPorEquipo[equipo].totalDiasTomados += persona.diasTomados;
      resumenPorEquipo[equipo].totalDiasRestantes += persona.diasRestantes;
      resumenPorEquipo[equipo].totalPersonas++;
    });

    const resumen = {
      porDirector: Object.values(resumenPorDirector),
      porEquipo: Object.values(resumenPorEquipo),
      totalPersonas: datosProcessados.length,
      totalDiasTomados: datosProcessados.reduce((sum, p) => sum + p.diasTomados, 0),
      totalDiasRestantes: datosProcessados.reduce((sum, p) => sum + p.diasRestantes, 0),
      datosCompletos: datosProcessados
    };

    resumen.porEquipo.sort((a, b) => b.totalDiasTomados - a.totalDiasTomados);
    return resumen;

  } catch (error) {
    Logger.log('Error en generarResumen: ' + error.message);
    throw error;
  }
}

/**
 * Escribe resumen
 */
function escribirResumen(resumen) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_RESUMEN);

    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME_RESUMEN);
    }

    sheet.clear();

    // Título
    sheet.getRange('A1').setValue('RESUMEN DE DÍAS PERSONALES')
      .setFontSize(14)
      .setFontWeight('bold')
      .setBackground('#4285f4')
      .setFontColor('#ffffff');
    sheet.getRange('A1:F1').merge();

    sheet.getRange('A2').setValue('Última actualización: ' + new Date().toLocaleString('es-ES'))
      .setFontStyle('italic')
      .setFontColor('#666666');
    sheet.getRange('A2:F2').merge();

    // Estadísticas generales
    let row = 4;
    sheet.getRange(row, 1).setValue('Estadísticas Generales').setFontWeight('bold').setFontSize(12);
    row++;
    sheet.getRange(row, 1).setValue('Total de Personas:');
    sheet.getRange(row, 2).setValue(resumen.totalPersonas);
    row++;
    sheet.getRange(row, 1).setValue('Total Días Tomados:');
    sheet.getRange(row, 2).setValue(resumen.totalDiasTomados.toFixed(1));
    row++;
    sheet.getRange(row, 1).setValue('Total Días Restantes:');
    sheet.getRange(row, 2).setValue(resumen.totalDiasRestantes.toFixed(1));
    row++;
    sheet.getRange(row, 1).setValue('Promedio Días Tomados por Persona:');
    sheet.getRange(row, 2).setValue((resumen.totalDiasTomados / resumen.totalPersonas).toFixed(1));

    // Detalle por persona
    row += 2;
    sheet.getRange(row, 1).setValue('DETALLE POR PERSONA')
      .setFontWeight('bold')
      .setFontSize(12)
      .setBackground('#34a853')
      .setFontColor('#ffffff');
    sheet.getRange(row, 1, 1, 7).merge();

    row++;
    const headersPorPersona = ['Nombre', 'Equipo', 'Director', 'Días Tomados', 'Días Restantes', '% Usado', '# Solicitudes'];
    sheet.getRange(row, 1, 1, headersPorPersona.length)
      .setValues([headersPorPersona])
      .setFontWeight('bold')
      .setBackground('#e8f0fe');

    row++;
    const datosPersonas = resumen.datosCompletos
      .sort((a, b) => b.diasTomados - a.diasTomados)
      .map(p => [
        p.nombre,
        p.equipo,
        p.director,
        p.diasTomados,
        p.diasRestantes,
        p.porcentajeUsado + '%',
        p.totalSolicitudes
      ]);

    if (datosPersonas.length > 0) {
      sheet.getRange(row, 1, datosPersonas.length, headersPorPersona.length).setValues(datosPersonas);

      // Formato condicional
      const rangoRestantes = sheet.getRange(row, 5, datosPersonas.length, 1);
      const rules = [
        SpreadsheetApp.newConditionalFormatRule()
          .whenNumberLessThan(3)
          .setBackground('#f4c7c3')
          .setRanges([rangoRestantes])
          .build(),
        SpreadsheetApp.newConditionalFormatRule()
          .whenNumberBetween(3, 7)
          .setBackground('#fce8b2')
          .setRanges([rangoRestantes])
          .build(),
        SpreadsheetApp.newConditionalFormatRule()
          .whenNumberGreaterThan(7)
          .setBackground('#b7e1cd')
          .setRanges([rangoRestantes])
          .build()
      ];
      sheet.setConditionalFormatRules(rules);
    }

    row += datosPersonas.length + 2;

    // Resumen por equipo
    sheet.getRange(row, 1).setValue('RESUMEN POR EQUIPO')
      .setFontWeight('bold')
      .setFontSize(12)
      .setBackground('#fbbc04')
      .setFontColor('#ffffff');
    sheet.getRange(row, 1, 1, 5).merge();

    row++;
    const headersPorEquipo = ['Equipo', 'Personas', 'Días Tomados', 'Días Restantes', 'Promedio'];
    sheet.getRange(row, 1, 1, headersPorEquipo.length)
      .setValues([headersPorEquipo])
      .setFontWeight('bold')
      .setBackground('#e8f0fe');

    row++;
    const datosEquipos = resumen.porEquipo.map(e => [
      e.equipo,
      e.totalPersonas,
      e.totalDiasTomados.toFixed(1),
      e.totalDiasRestantes.toFixed(1),
      (e.totalDiasTomados / e.totalPersonas).toFixed(1)
    ]);

    if (datosEquipos.length > 0) {
      sheet.getRange(row, 1, datosEquipos.length, headersPorEquipo.length).setValues(datosEquipos);
    }

    // Auto-ajustar
    for (let i = 1; i <= 7; i++) {
      sheet.autoResizeColumn(i);
    }

    Logger.log('Resumen escrito');

  } catch (error) {
    Logger.log('Error en escribirResumen: ' + error.message);
    throw error;
  }
}

/**
 * Envía notificación
 */
function enviarNotificacionNuevoRegistro(registrosNuevos) {
  try {
    if (registrosNuevos.length === 0) return;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_CONFIG);
    if (!sheet) return;

    const enviarCorreos = sheet.getRange('B2').getValue();
    if (!enviarCorreos) return;

    const correoAdmin = sheet.getRange('B3').getValue();
    if (!correoAdmin) return;

    const asunto = `🔔 ${registrosNuevos.length} nueva(s) solicitud(es) de días personales`;
    const cuerpo = `Se han procesado ${registrosNuevos.length} nuevas solicitudes de días personales.\n\nRevisa la hoja "Resumen" para más detalles.`;

    MailApp.sendEmail(correoAdmin, asunto, cuerpo);
    Logger.log('Notificación enviada');

  } catch (error) {
    Logger.log('Error en enviarNotificacionNuevoRegistro: ' + error.message);
  }
}

// ============================================================================
// FUNCIONES DE CONFIGURACIÓN
// ============================================================================

/**
 * Crea hoja de configuración
 */
function crearHojaConfiguracion() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_CONFIG);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME_CONFIG);
  }

  sheet.clear();

  sheet.getRange('A1').setValue('CONFIGURACIÓN SIMPLE')
    .setFontSize(14)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');
  sheet.getRange('A1:B1').merge();

  const config = [
    ['Días personales totales:', CONFIG.DIAS_TOTALES],
    ['Enviar correos (TRUE/FALSE):', false],
    ['Tu correo:', ''],
    ['', ''],
    ['INSTRUCCIONES:', ''],
    ['1. Descarga el CSV desde KoboToolbox', ''],
    ['2. Copia todos los datos (Ctrl+A, Ctrl+C)', ''],
    ['3. Pega en la hoja "Datos Importados" (Ctrl+V)', ''],
    ['4. Ve al menú "Días Personales" > "Procesar Datos"', ''],
    ['5. ¡Listo! Revisa la hoja "Resumen"', '']
  ];

  sheet.getRange(3, 1, config.length, 2).setValues(config);
  sheet.getRange('A3:A5').setFontWeight('bold');
  sheet.autoResizeColumn(1);
  sheet.setColumnWidth(2, 400);

  SpreadsheetApp.getUi().alert(
    'Configuración Creada',
    'Ahora:\n\n1. Crea una hoja llamada "Datos Importados"\n2. Descarga el CSV de KoboToolbox\n3. Pega los datos ahí\n4. Ejecuta "Procesar Datos"',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Crea hoja de directores
 */
function crearHojaDirectores() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DIRECTORES);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME_DIRECTORES);
  }

  sheet.clear();

  sheet.getRange('A1').setValue('DIRECTORES POR EQUIPO')
    .setFontSize(14)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');
  sheet.getRange('A1:C1').merge();

  const headers = ['Equipo', 'Nombre del Director', 'Correo'];
  sheet.getRange(2, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#e8f0fe');

  const equipos = CONFIG.EQUIPOS.map(equipo => [equipo, '', '']);
  sheet.getRange(3, 1, equipos.length, 3).setValues(equipos);

  sheet.autoResizeColumn(1);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 250);

  SpreadsheetApp.getUi().alert(
    'Hoja Creada',
    'Completa los nombres y correos de los directores de cada equipo.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Crea hoja de datos importados
 */
function crearHojaDatosImportados() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_IMPORTADOS);

  if (sheet) {
    const respuesta = SpreadsheetApp.getUi().alert(
      'Hoja ya existe',
      'La hoja "Datos Importados" ya existe.\n\n¿Quieres limpiarla?',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );

    if (respuesta === SpreadsheetApp.getUi().Button.YES) {
      sheet.clear();
    }
  } else {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME_IMPORTADOS);
  }

  sheet.getRange('A1').setValue('PEGA AQUÍ LOS DATOS DE KOBO TOOLBOX')
    .setFontSize(12)
    .setFontWeight('bold')
    .setBackground('#fbbc04');
  sheet.getRange('A1:E1').merge();

  sheet.getRange('A3').setValue('Instrucciones:');
  sheet.getRange('A4').setValue('1. Ve a KoboToolbox y descarga el CSV');
  sheet.getRange('A5').setValue('2. Abre el CSV y copia todo (Ctrl+A, Ctrl+C)');
  sheet.getRange('A6').setValue('3. Vuelve aquí y pega desde A1 (Ctrl+V)');
  sheet.getRange('A7').setValue('4. Los datos reemplazarán estas instrucciones');
  sheet.getRange('A8').setValue('5. Luego ejecuta "Procesar Datos" desde el menú');

  SpreadsheetApp.getUi().alert(
    'Hoja Creada',
    'Ahora pega aquí los datos de KoboToolbox y ejecuta "Procesar Datos".',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Menú personalizado
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📅 Días Personales')
    .addItem('🔄 Procesar Datos', 'procesarDatosSimple')
    .addSeparator()
    .addItem('⚙️ Crear Configuración', 'crearHojaConfiguracion')
    .addItem('📋 Crear Hoja "Datos Importados"', 'crearHojaDatosImportados')
    .addItem('👥 Configurar Directores', 'crearHojaDirectores')
    .addSeparator()
    .addItem('ℹ️ Ayuda', 'mostrarAyudaSimple')
    .addToUi();
}

/**
 * Muestra ayuda
 */
function mostrarAyudaSimple() {
  const html = `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Sistema Simple - Sin Token</h2>
      <h3>Pasos:</h3>
      <ol>
        <li>Descarga el CSV desde KoboToolbox</li>
        <li>Copia todos los datos</li>
        <li>Pega en la hoja "Datos Importados"</li>
        <li>Ejecuta "Procesar Datos"</li>
      </ol>
      <h3>Características:</h3>
      <ul>
        <li>✅ NO requiere token</li>
        <li>✅ Cálculo automático de días</li>
        <li>✅ Reportes con código de colores</li>
        <li>✅ Detección de registros nuevos</li>
        <li>✅ Mapeo de directores por equipo</li>
      </ul>
    </div>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(500).setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Ayuda');
}
