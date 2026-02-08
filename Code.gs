/**
 * Sistema de Gestión de Días Personales - KoboToolbox Integration
 * Versión 2.0 - Ejecución automática con detección de nuevos registros
 *
 * Este script se conecta a KoboToolbox, obtiene datos de días personales,
 * calcula días tomados y restantes, y envía reportes por correo electrónico.
 * Se ejecuta automáticamente cada vez que se configura un trigger.
 */

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
  KOBO_API_URL: 'https://kf.kobotoolbox.org/api/v2/assets/aDmwMtoy4r65YTNSt4sURS/export-settings/esigRStULsbGhgCaayXsgHC/data.csv',
  KOBO_TOKEN: '', // Token de autenticación de KoboToolbox
  DIAS_TOTALES: 15, // Días personales totales por persona
  SHEET_NAME_DATOS: 'Datos KoboToolbox',
  SHEET_NAME_RESUMEN: 'Resumen',
  SHEET_NAME_CONFIG: 'Configuración',
  SHEET_NAME_HISTORIAL: 'Historial de Solicitudes',
  SHEET_NAME_DIRECTORES: 'Directores', // Nueva hoja para mapear equipos a directores

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
 * Función principal que ejecuta todo el proceso
 * Esta función se puede llamar manualmente o mediante un trigger
 */
function ejecutarSistema() {
  try {
    Logger.log('Iniciando sistema de gestión de días personales...');

    // 1. Obtener datos de KoboToolbox
    const datosKobo = obtenerDatosKoboToolbox();

    // 2. Detectar y procesar solo registros nuevos
    const registrosNuevos = detectarRegistrosNuevos(datosKobo);

    if (registrosNuevos.length === 0) {
      Logger.log('No hay registros nuevos para procesar');
      SpreadsheetApp.getActiveSpreadsheet().toast('No hay registros nuevos', 'Info', 3);
      return;
    }

    Logger.log(`Encontrados ${registrosNuevos.length} registros nuevos`);

    // 3. Procesar todos los datos (incluyendo históricos)
    const datosProcessados = procesarDatos(datosKobo);

    // 4. Agregar nuevos registros al historial
    agregarAlHistorial(registrosNuevos);

    // 5. Generar resumen
    const resumen = generarResumen(datosProcessados);

    // 6. Escribir resumen en hoja
    escribirResumen(resumen);

    // 7. Enviar correos solo para los nuevos registros (si está activado)
    enviarNotificacionNuevoRegistro(registrosNuevos);

    Logger.log('Sistema ejecutado exitosamente');
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `✅ ${registrosNuevos.length} nuevos registro(s) procesado(s)`,
      'Éxito',
      5
    );

  } catch (error) {
    Logger.log('Error en ejecutarSistema: ' + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast('Error: ' + error.message, 'Error', 10);

    // Enviar correo de error al administrador
    enviarCorreoError(error);
  }
}

/**
 * Función de ejecución automática (se llama desde el trigger)
 */
function ejecutarAutomatico() {
  ejecutarSistema();
}

/**
 * Obtiene datos desde la API de KoboToolbox
 */
function obtenerDatosKoboToolbox() {
  try {
    Logger.log('Obteniendo datos de KoboToolbox...');

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_CONFIG);
    const token = sheet ? sheet.getRange('B1').getValue() : CONFIG.KOBO_TOKEN;
    const apiUrl = sheet ? sheet.getRange('B2').getValue() : CONFIG.KOBO_API_URL;

    if (!token) {
      throw new Error('No se ha configurado el token de KoboToolbox. Por favor, configúralo en la hoja "Configuración".');
    }

    const options = {
      method: 'get',
      headers: {
        'Authorization': 'Token ' + token
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      throw new Error('Error al conectar con KoboToolbox. Código: ' + responseCode + '. Verifica tu token y URL.');
    }

    const csvData = response.getContentText();
    const parsedData = Utilities.parseCsv(csvData);

    Logger.log('Datos obtenidos exitosamente: ' + parsedData.length + ' registros');
    return parsedData;

  } catch (error) {
    Logger.log('Error en obtenerDatosKoboToolbox: ' + error.message);
    throw error;
  }
}

/**
 * Detecta registros nuevos comparando con el historial
 */
function detectarRegistrosNuevos(datosKobo) {
  try {
    if (!datosKobo || datosKobo.length <= 1) {
      return [];
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheetHistorial = ss.getSheetByName(CONFIG.SHEET_NAME_HISTORIAL);

    // Si no existe historial, todos son nuevos
    if (!sheetHistorial || sheetHistorial.getLastRow() === 0) {
      Logger.log('No existe historial previo. Todos los registros son nuevos.');
      return datosKobo.slice(1); // Excluir encabezados
    }

    // Obtener IDs o identificadores únicos del historial
    const historialData = sheetHistorial.getDataRange().getValues();
    const historialIds = new Set(historialData.slice(1).map(row => row[0])); // Asumiendo que la primera columna es un ID único

    // Filtrar solo los registros que no están en el historial
    const headers = datosKobo[0];
    const idIndex = encontrarColumna(headers, ['_id', 'id', '_uuid', 'uuid', 'submission_id']);

    const nuevos = datosKobo.slice(1).filter(row => {
      const id = row[idIndex] || row.join('|'); // Usar ID único o concatenar toda la fila
      return !historialIds.has(id);
    });

    return nuevos;

  } catch (error) {
    Logger.log('Error en detectarRegistrosNuevos: ' + error.message);
    // Si hay error, procesar todos para no perder datos
    return datosKobo.slice(1);
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
      // Agregar encabezados
      const headers = ['ID', 'Fecha Proceso', 'Nombre', 'Equipo', 'Fecha Inicio', 'Fecha Fin', 'Días Solicitados', 'Estado'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    }

    const ultimaFila = sheet.getLastRow() + 1;
    const fechaProceso = new Date();

    // Preparar datos para escribir
    const datosHistorial = registrosNuevos.map(registro => [
      registro[0] || Utilities.getUuid(), // ID único
      fechaProceso,
      registro[1] || 'Sin nombre', // Nombre (si existe en el formulario)
      registro[2] || 'Sin equipo', // Equipo
      registro[3] || '', // Fecha inicio
      registro[4] || '', // Fecha fin
      registro[5] || 0, // Días solicitados
      'Procesado'
    ]);

    sheet.getRange(ultimaFila, 1, datosHistorial.length, 8).setValues(datosHistorial);
    Logger.log(`${datosHistorial.length} registros agregados al historial`);

  } catch (error) {
    Logger.log('Error en agregarAlHistorial: ' + error.message);
  }
}

/**
 * Procesa los datos CSV de KoboToolbox según la estructura real del formulario
 */
function procesarDatos(datosCSV) {
  try {
    Logger.log('Procesando datos...');

    if (!datosCSV || datosCSV.length === 0) {
      throw new Error('No hay datos para procesar');
    }

    // Obtener encabezados
    const headers = datosCSV[0];
    const datos = datosCSV.slice(1);

    // Escribir datos crudos en hoja
    escribirDatosKobo(datosCSV);

    // Identificar columnas según la estructura real del formulario
    const colNombre = encontrarColumna(headers, ['nombre', 'name', 'empleado', 'employee', 'nombre_completo']);
    const colEquipo = encontrarColumna(headers, ['programa', 'departamento', 'equipo', 'team', 'programa_departamento']);
    const colFechaInicio = encontrarColumna(headers, ['fecha_inicio', 'fecha_de_inicio', 'start_date', 'inicio']);
    const colFechaFin = encontrarColumna(headers, ['fecha_finalizacion', 'fecha_de_finalizacion', 'fecha_fin', 'end_date', 'fin']);
    const colReglamento = encontrarColumna(headers, ['reglamento', 'conoces_reglamento', 'conoce_reglamento']);
    const colConsentimiento = encontrarColumna(headers, ['consentimiento', 'consentimiento_director', 'director_consent']);
    const colDirector = encontrarColumna(headers, ['director', 'supervisor', 'nombre_director']);
    const colCorreoDirector = encontrarColumna(headers, ['correo_director', 'email_director']);

    // Obtener mapeo de equipos a directores
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

      // Obtener director y correo desde el mapeo
      const infoDirector = mapeoDirectores[equipo] || { nombre: 'Sin asignar', correo: '' };
      const director = fila[colDirector] || infoDirector.nombre;
      const correoDirector = fila[colCorreoDirector] || infoDirector.correo;

      // Calcular días entre fechas
      const diasSolicitados = calcularDiasEntreFechas(fechaInicio, fechaFin);

      // Agrupar por empleado
      if (!empleadosMap.has(nombre)) {
        empleadosMap.set(nombre, {
          nombre: nombre,
          equipo: equipo,
          director: director,
          correoDirector: correoDirector,
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

    // Convertir a array y calcular días restantes
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
 * Calcula los días hábiles entre dos fechas
 */
function calcularDiasEntreFechas(fechaInicio, fechaFin) {
  try {
    if (!fechaInicio || !fechaFin) return 0;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return 0;

    // Calcular días totales (incluyendo inicio y fin)
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
 * Calcula días hábiles (excluyendo fines de semana)
 * NOTA: Para usar esta función en lugar de calcularDiasEntreFechas,
 * reemplazar la llamada en procesarDatos()
 */
function calcularDiasHabiles(fechaInicio, fechaFin) {
  try {
    if (!fechaInicio || !fechaFin) return 0;

    let inicio = new Date(fechaInicio);
    let fin = new Date(fechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return 0;

    let dias = 0;
    let fecha = new Date(inicio);

    while (fecha <= fin) {
      const diaSemana = fecha.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) { // No domingo ni sábado
        dias++;
      }
      fecha.setDate(fecha.getDate() + 1);
    }

    return dias;

  } catch (error) {
    Logger.log('Error en calcularDiasHabiles: ' + error.message);
    return 0;
  }
}

/**
 * Obtiene el mapeo de equipos a directores desde la hoja de configuración
 */
function obtenerMapeoDirectores() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DIRECTORES);

    if (!sheet || sheet.getLastRow() <= 1) {
      Logger.log('No existe mapeo de directores. Usando valores por defecto.');
      return {};
    }

    const datos = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
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
 * Encuentra el índice de una columna basándose en palabras clave
 */
function encontrarColumna(headers, palabrasClave) {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase();
    for (let palabra of palabrasClave) {
      if (header.includes(palabra.toLowerCase())) {
        return i;
      }
    }
  }
  return 0; // Retorna la primera columna si no encuentra coincidencia
}

/**
 * Escribe los datos crudos de KoboToolbox en la hoja
 */
function escribirDatosKobo(datos) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DATOS);

    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME_DATOS);
    }

    sheet.clear();

    if (datos.length > 0) {
      sheet.getRange(1, 1, datos.length, datos[0].length).setValues(datos);
      sheet.getRange(1, 1, 1, datos[0].length)
        .setFontWeight('bold')
        .setBackground('#4285f4')
        .setFontColor('#ffffff');

      for (let i = 1; i <= datos[0].length; i++) {
        sheet.autoResizeColumn(i);
      }
    }

    Logger.log('Datos escritos en hoja: ' + CONFIG.SHEET_NAME_DATOS);

  } catch (error) {
    Logger.log('Error en escribirDatosKobo: ' + error.message);
    throw error;
  }
}

/**
 * Genera un resumen agrupado por equipos y directores
 */
function generarResumen(datosProcessados) {
  try {
    Logger.log('Generando resumen...');

    const resumenPorDirector = {};
    const resumenPorEquipo = {};

    datosProcessados.forEach(persona => {
      const director = persona.director;
      const equipo = persona.equipo;

      // Resumen por director
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

      // Resumen por equipo
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

    Logger.log('Resumen generado exitosamente');
    return resumen;

  } catch (error) {
    Logger.log('Error en generarResumen: ' + error.message);
    throw error;
  }
}

/**
 * Escribe el resumen en la hoja de cálculo
 */
function escribirResumen(resumen) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_RESUMEN);

    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME_RESUMEN);
    }

    sheet.clear();

    // Título y fecha
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

    // Resumen por persona
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
    sheet.getRange(row, 1).setValue('RESUMEN POR EQUIPO (Ordenado por días tomados)')
      .setFontWeight('bold')
      .setFontSize(12)
      .setBackground('#fbbc04')
      .setFontColor('#ffffff');
    sheet.getRange(row, 1, 1, 5).merge();

    row++;
    const headersPorEquipo = ['Equipo', 'Personas', 'Días Tomados', 'Días Restantes', 'Promedio por Persona'];
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

    // Auto-ajustar columnas
    for (let i = 1; i <= 7; i++) {
      sheet.autoResizeColumn(i);
    }

    Logger.log('Resumen escrito en hoja: ' + CONFIG.SHEET_NAME_RESUMEN);

  } catch (error) {
    Logger.log('Error en escribirResumen: ' + error.message);
    throw error;
  }
}

/**
 * Envía notificación por correo cuando hay nuevos registros
 */
function enviarNotificacionNuevoRegistro(registrosNuevos) {
  try {
    if (registrosNuevos.length === 0) return;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_CONFIG);
    const enviarCorreos = sheet ? sheet.getRange('B4').getValue() : false;

    if (!enviarCorreos) {
      Logger.log('Envío de correos deshabilitado');
      return;
    }

    const correoAdmin = sheet ? sheet.getRange('B5').getValue() : '';

    if (!correoAdmin) {
      Logger.log('No se ha configurado correo del administrador');
      return;
    }

    const asunto = `🔔 Nueva(s) solicitud(es) de días personales - ${registrosNuevos.length} registro(s)`;
    const cuerpo = crearCorreoNuevoRegistro(registrosNuevos);

    MailApp.sendEmail({
      to: correoAdmin,
      subject: asunto,
      htmlBody: cuerpo
    });

    Logger.log('Notificación enviada al administrador');

  } catch (error) {
    Logger.log('Error en enviarNotificacionNuevoRegistro: ' + error.message);
  }
}

/**
 * Crea el cuerpo del correo para nuevos registros
 */
function crearCorreoNuevoRegistro(registros) {
  const items = registros.map((reg, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${reg[1] || 'Sin nombre'}</td>
      <td>${reg[2] || 'Sin equipo'}</td>
      <td>${reg[3] || ''}</td>
      <td>${reg[4] || ''}</td>
    </tr>
  `).join('');

  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Nueva(s) Solicitud(es) de Días Personales</h2>
        <p>Se ha(n) recibido <strong>${registros.length}</strong> nueva(s) solicitud(es):</p>
        <table border="1" cellpadding="10" style="border-collapse: collapse;">
          <thead>
            <tr style="background-color: #4285f4; color: white;">
              <th>#</th>
              <th>Nombre</th>
              <th>Equipo</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
            </tr>
          </thead>
          <tbody>
            ${items}
          </tbody>
        </table>
        <p style="margin-top: 20px;">
          <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}"
             style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Ver Resumen Completo
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Notificación automática - ${new Date().toLocaleString('es-ES')}
        </p>
      </body>
    </html>
  `;
}

/**
 * Envía correo de error al administrador
 */
function enviarCorreoError(error) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_CONFIG);
    const correoAdmin = sheet ? sheet.getRange('B5').getValue() : '';

    if (!correoAdmin) return;

    MailApp.sendEmail({
      to: correoAdmin,
      subject: '❌ Error en Sistema de Días Personales',
      body: `Se ha producido un error en el sistema:\n\nError: ${error.message}\n\nStack: ${error.stack}\n\nFecha: ${new Date()}`
    });

  } catch (e) {
    Logger.log('No se pudo enviar correo de error: ' + e.message);
  }
}

/**
 * Envía correos a directores con resumen semanal/mensual
 */
function enviarCorreosDirectores(resumen) {
  try {
    Logger.log('Enviando correos a directores...');

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_CONFIG);
    const enviarCorreos = sheet ? sheet.getRange('B4').getValue() : false;

    if (!enviarCorreos) {
      Logger.log('Envío de correos a directores deshabilitado');
      return;
    }

    let correosEnviados = 0;

    resumen.porDirector.forEach(director => {
      if (director.correo && director.correo.trim() !== '') {
        try {
          const asunto = `Reporte de Días Personales - Equipo de ${director.director}`;
          const cuerpo = crearCuerpoCorreoDirector(director);

          MailApp.sendEmail({
            to: director.correo,
            subject: asunto,
            htmlBody: cuerpo
          });

          correosEnviados++;
          Logger.log('Correo enviado a: ' + director.correo);

        } catch (error) {
          Logger.log('Error al enviar correo a ' + director.correo + ': ' + error.message);
        }
      }
    });

    Logger.log('Correos enviados exitosamente: ' + correosEnviados);

  } catch (error) {
    Logger.log('Error en enviarCorreosDirectores: ' + error.message);
  }
}

/**
 * Crea el cuerpo HTML del correo para directores
 */
function crearCuerpoCorreoDirector(director) {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          h2 { color: #4285f4; }
          h3 { color: #34a853; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th { background-color: #4285f4; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:hover { background-color: #f5f5f5; }
          .resumen { background-color: #e8f0fe; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .alerta-baja { color: #d93025; font-weight: bold; }
          .alerta-media { color: #f9ab00; font-weight: bold; }
          .ok { color: #34a853; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h2>Reporte de Días Personales - ${director.director}</h2>

        <div class="resumen">
          <h3>Resumen del Equipo</h3>
          <p><strong>Total de personas:</strong> ${director.totalPersonas}</p>
          <p><strong>Total de días tomados:</strong> ${director.totalDiasTomados.toFixed(1)} días</p>
          <p><strong>Total de días restantes:</strong> ${director.totalDiasRestantes.toFixed(1)} días</p>
          <p><strong>Promedio de días tomados:</strong> ${(director.totalDiasTomados / director.totalPersonas).toFixed(1)} días por persona</p>
        </div>

        <h3>Detalle por Persona</h3>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Días Tomados</th>
              <th>Días Restantes</th>
              <th>% Usado</th>
              <th># Solicitudes</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${director.personas.map(persona => {
              let claseEstado = 'ok';
              let estado = '✓ OK';

              if (persona.diasRestantes < 3) {
                claseEstado = 'alerta-baja';
                estado = '⚠ Pocos días restantes';
              } else if (persona.diasRestantes < 7) {
                claseEstado = 'alerta-media';
                estado = '⚡ Considerar planificación';
              }

              return `
                <tr>
                  <td>${persona.nombre}</td>
                  <td>${persona.diasTomados}</td>
                  <td class="${claseEstado}">${persona.diasRestantes}</td>
                  <td>${persona.porcentajeUsado}%</td>
                  <td>${persona.totalSolicitudes}</td>
                  <td class="${claseEstado}">${estado}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Este correo fue generado automáticamente por el Sistema de Gestión de Días Personales.</p>
          <p>Fecha de generación: ${new Date().toLocaleString('es-ES')}</p>
          <p><strong>Nota:</strong> Cada persona tiene un total de ${CONFIG.DIAS_TOTALES} días personales al año.</p>
        </div>
      </body>
    </html>
  `;

  return html;
}

// ============================================================================
// FUNCIONES DE CONFIGURACIÓN E INICIALIZACIÓN
// ============================================================================

/**
 * Crea la hoja de configuración si no existe
 */
function crearHojaConfiguracion() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_CONFIG);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME_CONFIG);
  }

  sheet.clear();

  sheet.getRange('A1').setValue('CONFIGURACIÓN DEL SISTEMA')
    .setFontSize(14)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');
  sheet.getRange('A1:B1').merge();

  const config = [
    ['Token KoboToolbox:', ''],
    ['URL API KoboToolbox:', CONFIG.KOBO_API_URL],
    ['Días personales totales:', CONFIG.DIAS_TOTALES],
    ['Enviar correos (TRUE/FALSE):', false],
    ['Correo del administrador:', ''],
    ['', ''],
    ['INSTRUCCIONES:', ''],
    ['1. Ingresa tu token de KoboToolbox en B1', ''],
    ['2. Verifica la URL de la API en B2', ''],
    ['3. Ajusta los días personales totales en B3', ''],
    ['4. Activa el envío de correos en B4 (TRUE) cuando estés listo', ''],
    ['5. Ingresa tu correo en B5 para recibir notificaciones', ''],
    ['6. Ve al menú "Días Personales" > "Configurar Trigger Automático"', ''],
    ['7. El sistema verificará nuevos registros automáticamente', '']
  ];

  sheet.getRange(3, 1, config.length, 2).setValues(config);
  sheet.getRange('A3:A6').setFontWeight('bold');
  sheet.autoResizeColumn(1);
  sheet.setColumnWidth(2, 500);

  Logger.log('Hoja de configuración creada');
}

/**
 * Crea la hoja de mapeo de directores
 */
function crearHojaDirectores() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DIRECTORES);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME_DIRECTORES);
  }

  sheet.clear();

  sheet.getRange('A1').setValue('MAPEO DE EQUIPOS A DIRECTORES')
    .setFontSize(14)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');
  sheet.getRange('A1:C1').merge();

  const headers = ['Equipo/Programa', 'Nombre del Director', 'Correo del Director'];
  sheet.getRange(2, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#e8f0fe');

  // Agregar filas para cada equipo
  const equipos = CONFIG.EQUIPOS.map(equipo => [equipo, '', '']);
  sheet.getRange(3, 1, equipos.length, 3).setValues(equipos);

  // Formato
  sheet.autoResizeColumn(1);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 250);

  // Agregar instrucciones
  const row = 3 + equipos.length + 2;
  sheet.getRange(row, 1).setValue('INSTRUCCIONES:').setFontWeight('bold');
  sheet.getRange(row + 1, 1).setValue('1. Completa el nombre del director de cada equipo en la columna B');
  sheet.getRange(row + 2, 1).setValue('2. Completa el correo del director en la columna C');
  sheet.getRange(row + 3, 1).setValue('3. Los correos se enviarán automáticamente a estos directores');

  Logger.log('Hoja de directores creada');
}

/**
 * Crea el menú personalizado
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📅 Días Personales')
    .addItem('🔄 Actualizar Datos Manualmente', 'ejecutarSistema')
    .addSeparator()
    .addItem('⚙️ Crear Configuración', 'crearHojaConfiguracion')
    .addItem('👥 Configurar Directores', 'crearHojaDirectores')
    .addItem('⏰ Configurar Trigger Automático', 'configurarTriggerAutomatico')
    .addSeparator()
    .addItem('📧 Enviar Reporte a Directores', 'enviarReporteManualaDirectores')
    .addItem('ℹ️ Ayuda', 'mostrarAyuda')
    .addToUi();
}

/**
 * Configura el trigger automático
 */
function configurarTriggerAutomatico() {
  const ui = SpreadsheetApp.getUi();

  const respuesta = ui.alert(
    'Configurar Ejecución Automática',
    '¿Deseas que el sistema verifique nuevos registros automáticamente cada 15 minutos?\n\n' +
    'Esto permitirá detectar y procesar nuevas solicitudes de días personales en tiempo real.',
    ui.ButtonSet.YES_NO
  );

  if (respuesta === ui.Button.YES) {
    // Eliminar triggers existentes para evitar duplicados
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'ejecutarAutomatico') {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    // Crear nuevo trigger cada 15 minutos
    ScriptApp.newTrigger('ejecutarAutomatico')
      .timeBased()
      .everyMinutes(15)
      .create();

    ui.alert(
      'Trigger Configurado',
      'El sistema ahora verificará nuevos registros cada 15 minutos automáticamente.\n\n' +
      'Puedes cambiar esta configuración en Extensiones > Apps Script > Triggers',
      ui.ButtonSet.OK
    );
  }
}

/**
 * Envía reporte manual a directores
 */
function enviarReporteManualaDirectores() {
  try {
    const datosKobo = obtenerDatosKoboToolbox();
    const datosProcessados = procesarDatos(datosKobo);
    const resumen = generarResumen(datosProcessados);
    enviarCorreosDirectores(resumen);

    SpreadsheetApp.getActiveSpreadsheet().toast('Correos enviados a directores', 'Éxito', 5);
  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Error: ' + error.message, 'Error', 10);
  }
}

/**
 * Muestra ayuda
 */
function mostrarAyuda() {
  const html = `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Sistema de Gestión de Días Personales v2.0</h2>
      <h3>Configuración Inicial</h3>
      <ol>
        <li>Ejecuta "Crear Configuración"</li>
        <li>Ejecuta "Configurar Directores" y completa los datos</li>
        <li>Ingresa tu token de Kobo y correo en la hoja Configuración</li>
        <li>Ejecuta "Configurar Trigger Automático"</li>
      </ol>
      <h3>Características Nuevas</h3>
      <ul>
        <li>✅ Detección automática de nuevos registros</li>
        <li>✅ Cálculo automático de días entre fechas</li>
        <li>✅ Ejecución automática cada 15 minutos</li>
        <li>✅ Notificaciones por correo al administrador</li>
        <li>✅ Historial de solicitudes procesadas</li>
      </ul>
      <p><strong>Nota:</strong> Para que el sistema funcione correctamente, tu formulario de KoboToolbox debe incluir los campos: nombre, equipo, fecha_inicio, fecha_fin</p>
    </div>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(600).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Ayuda - Sistema de Días Personales');
}
