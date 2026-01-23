/**
 * Sistema de Gestión de Días Personales - KoboToolbox Integration
 *
 * Este script se conecta a KoboToolbox, obtiene datos de días personales,
 * calcula días tomados y restantes, y envía reportes por correo electrónico.
 */

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

/**
 * Configuración de la API de KoboToolbox
 * IMPORTANTE: Reemplaza estos valores con tus credenciales
 */
const CONFIG = {
  KOBO_API_URL: 'https://kf.kobotoolbox.org/api/v2/assets/aDmwMtoy4r65YTNSt4sURS/export-settings/esigRStULsbGhgCaayXsgHC/data.csv',
  KOBO_TOKEN: '', // Token de autenticación de KoboToolbox
  DIAS_TOTALES: 15, // Días personales totales por persona
  SHEET_NAME_DATOS: 'Datos KoboToolbox',
  SHEET_NAME_RESUMEN: 'Resumen',
  SHEET_NAME_CONFIG: 'Configuración'
};

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Función principal que ejecuta todo el proceso
 */
function ejecutarSistema() {
  try {
    Logger.log('Iniciando sistema de gestión de días personales...');

    // 1. Obtener datos de KoboToolbox
    const datosKobo = obtenerDatosKoboToolbox();

    // 2. Procesar datos y escribir en la hoja
    const datosProcessados = procesarDatos(datosKobo);

    // 3. Generar resumen
    const resumen = generarResumen(datosProcessados);

    // 4. Escribir resumen en hoja
    escribirResumen(resumen);

    // 5. Enviar correos a directores
    enviarCorreosDirectores(resumen);

    Logger.log('Sistema ejecutado exitosamente');
    SpreadsheetApp.getActiveSpreadsheet().toast('¡Datos actualizados y correos enviados!', 'Éxito', 5);

  } catch (error) {
    Logger.log('Error en ejecutarSistema: ' + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast('Error: ' + error.message, 'Error', 10);
    throw error;
  }
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
 * Procesa los datos CSV de KoboToolbox
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

    // Identificar columnas relevantes (buscar por palabras clave)
    const colNombre = encontrarColumna(headers, ['nombre', 'name', 'empleado', 'employee']);
    const colEquipo = encontrarColumna(headers, ['equipo', 'team', 'departamento', 'department', 'director']);
    const colDirector = encontrarColumna(headers, ['director', 'supervisor', 'jefe', 'manager']);
    const colCorreoDirector = encontrarColumna(headers, ['correo_director', 'email_director', 'director_email']);
    const colDiasTomados = encontrarColumna(headers, ['dias_tomados', 'dias', 'days_taken', 'dias_usados']);
    const colFecha = encontrarColumna(headers, ['fecha', 'date', 'fecha_inicio', 'start_date']);

    // Procesar cada registro
    const datosProcessados = datos.map((fila, index) => {
      const nombre = fila[colNombre] || 'Sin nombre';
      const equipo = fila[colEquipo] || 'Sin equipo';
      const director = fila[colDirector] || 'Sin director';
      const correoDirector = fila[colCorreoDirector] || '';
      const diasTomados = parseFloat(fila[colDiasTomados]) || 0;
      const fecha = fila[colFecha] || '';
      const diasRestantes = CONFIG.DIAS_TOTALES - diasTomados;

      return {
        nombre: nombre,
        equipo: equipo,
        director: director,
        correoDirector: correoDirector,
        diasTomados: diasTomados,
        diasRestantes: diasRestantes,
        fecha: fecha,
        porcentajeUsado: (diasTomados / CONFIG.DIAS_TOTALES * 100).toFixed(1)
      };
    });

    Logger.log('Datos procesados: ' + datosProcessados.length + ' registros');
    return datosProcessados;

  } catch (error) {
    Logger.log('Error en procesarDatos: ' + error.message);
    throw error;
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

    // Crear hoja si no existe
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME_DATOS);
    }

    // Limpiar hoja
    sheet.clear();

    // Escribir datos
    if (datos.length > 0) {
      sheet.getRange(1, 1, datos.length, datos[0].length).setValues(datos);

      // Formatear encabezados
      sheet.getRange(1, 1, 1, datos[0].length)
        .setFontWeight('bold')
        .setBackground('#4285f4')
        .setFontColor('#ffffff');

      // Auto-ajustar columnas
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

    // Agrupar por director y equipo
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

    // Ordenar equipos por días tomados (descendente)
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

    // Crear hoja si no existe
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME_RESUMEN);
    }

    // Limpiar hoja
    sheet.clear();

    // Escribir título
    sheet.getRange('A1').setValue('RESUMEN DE DÍAS PERSONALES')
      .setFontSize(14)
      .setFontWeight('bold')
      .setBackground('#4285f4')
      .setFontColor('#ffffff');
    sheet.getRange('A1:F1').merge();

    // Estadísticas generales
    let row = 3;
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
    sheet.getRange(row, 1, 1, 6).merge();

    row++;
    const headersPorPersona = ['Nombre', 'Equipo', 'Director', 'Días Tomados', 'Días Restantes', '% Usado'];
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
        p.porcentajeUsado + '%'
      ]);

    if (datosPersonas.length > 0) {
      sheet.getRange(row, 1, datosPersonas.length, headersPorPersona.length).setValues(datosPersonas);

      // Formato condicional para días restantes
      const rangoRestantes = sheet.getRange(row, 5, datosPersonas.length, 1);
      const rule1 = SpreadsheetApp.newConditionalFormatRule()
        .whenNumberLessThan(3)
        .setBackground('#f4c7c3')
        .setRanges([rangoRestantes])
        .build();
      const rule2 = SpreadsheetApp.newConditionalFormatRule()
        .whenNumberBetween(3, 7)
        .setBackground('#fce8b2')
        .setRanges([rangoRestantes])
        .build();
      const rule3 = SpreadsheetApp.newConditionalFormatRule()
        .whenNumberGreaterThan(7)
        .setBackground('#b7e1cd')
        .setRanges([rangoRestantes])
        .build();
      sheet.setConditionalFormatRules([rule1, rule2, rule3]);
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
    for (let i = 1; i <= 6; i++) {
      sheet.autoResizeColumn(i);
    }

    Logger.log('Resumen escrito en hoja: ' + CONFIG.SHEET_NAME_RESUMEN);

  } catch (error) {
    Logger.log('Error en escribirResumen: ' + error.message);
    throw error;
  }
}

/**
 * Envía correos electrónicos a los directores con el resumen de su equipo
 */
function enviarCorreosDirectores(resumen) {
  try {
    Logger.log('Enviando correos a directores...');

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_CONFIG);
    const enviarCorreos = sheet ? sheet.getRange('B4').getValue() : false;

    if (!enviarCorreos) {
      Logger.log('Envío de correos deshabilitado en configuración');
      SpreadsheetApp.getActiveSpreadsheet().toast('Envío de correos deshabilitado. Actívalo en la hoja Configuración.', 'Info', 5);
      return;
    }

    let correosEnviados = 0;

    resumen.porDirector.forEach(director => {
      if (director.correo && director.correo.trim() !== '') {
        try {
          const asunto = `Reporte de Días Personales - Equipo de ${director.director}`;
          const cuerpo = crearCuerpoCorreo(director);

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
    SpreadsheetApp.getActiveSpreadsheet().toast('Correos enviados: ' + correosEnviados, 'Éxito', 5);

  } catch (error) {
    Logger.log('Error en enviarCorreosDirectores: ' + error.message);
    throw error;
  }
}

/**
 * Crea el cuerpo HTML del correo electrónico
 */
function crearCuerpoCorreo(director) {
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

  // Limpiar hoja
  sheet.clear();

  // Título
  sheet.getRange('A1').setValue('CONFIGURACIÓN DEL SISTEMA')
    .setFontSize(14)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');
  sheet.getRange('A1:B1').merge();

  // Configuración
  const config = [
    ['Token KoboToolbox:', ''],
    ['URL API KoboToolbox:', CONFIG.KOBO_API_URL],
    ['Días personales totales:', CONFIG.DIAS_TOTALES],
    ['Enviar correos (TRUE/FALSE):', false],
    ['', ''],
    ['INSTRUCCIONES:', ''],
    ['1. Ingresa tu token de KoboToolbox en B1', ''],
    ['2. Verifica la URL de la API en B2', ''],
    ['3. Ajusta los días personales totales en B3 si es necesario', ''],
    ['4. Activa el envío de correos en B4 (TRUE) cuando estés listo', ''],
    ['5. Ejecuta el sistema desde el menú "Días Personales" > "Actualizar Datos"', '']
  ];

  sheet.getRange(3, 1, config.length, 2).setValues(config);

  // Formato
  sheet.getRange('A3:A5').setFontWeight('bold');
  sheet.getRange('A7').setFontWeight('bold').setFontSize(12);
  sheet.getRange('A8:A12').setFontStyle('italic').setFontColor('#666666');

  // Auto-ajustar columnas
  sheet.autoResizeColumn(1);
  sheet.setColumnWidth(2, 500);

  Logger.log('Hoja de configuración creada');
}

/**
 * Crea el menú personalizado en la hoja de cálculo
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📅 Días Personales')
    .addItem('🔄 Actualizar Datos', 'ejecutarSistema')
    .addSeparator()
    .addItem('⚙️ Crear Configuración', 'crearHojaConfiguracion')
    .addItem('📧 Enviar Correos Manualmente', 'enviarCorreosManuales')
    .addSeparator()
    .addItem('ℹ️ Ayuda', 'mostrarAyuda')
    .addToUi();

  Logger.log('Menú creado exitosamente');
}

/**
 * Envía correos manualmente (sin actualizar datos)
 */
function enviarCorreosManuales() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_DATOS);

    if (!sheet || sheet.getLastRow() === 0) {
      SpreadsheetApp.getActiveSpreadsheet().toast('No hay datos para procesar. Ejecuta "Actualizar Datos" primero.', 'Error', 5);
      return;
    }

    // Obtener datos de la hoja y procesar
    const datosCSV = sheet.getDataRange().getValues();
    const datosProcessados = procesarDatos(datosCSV);
    const resumen = generarResumen(datosProcessados);

    // Enviar correos
    enviarCorreosDirectores(resumen);

  } catch (error) {
    Logger.log('Error en enviarCorreosManuales: ' + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast('Error: ' + error.message, 'Error', 10);
  }
}

/**
 * Muestra un cuadro de diálogo con ayuda
 */
function mostrarAyuda() {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Sistema de Gestión de Días Personales</h2>

      <h3>Configuración Inicial</h3>
      <ol>
        <li>Ejecuta "Crear Configuración" desde el menú</li>
        <li>Ingresa tu token de KoboToolbox en la celda B1 de la hoja "Configuración"</li>
        <li>Verifica que la URL de la API sea correcta en B2</li>
        <li>Ajusta los días personales totales en B3 si es necesario (default: 15)</li>
      </ol>

      <h3>Uso del Sistema</h3>
      <ul>
        <li><strong>Actualizar Datos:</strong> Obtiene los datos más recientes de KoboToolbox, procesa la información y envía correos</li>
        <li><strong>Enviar Correos Manualmente:</strong> Envía correos con los datos actuales sin actualizar desde KoboToolbox</li>
      </ul>

      <h3>Características</h3>
      <ul>
        <li>✅ Conexión automática a KoboToolbox</li>
        <li>✅ Cálculo automático de días tomados y restantes</li>
        <li>✅ Reportes visuales con código de colores</li>
        <li>✅ Envío automático de correos a directores</li>
        <li>✅ Análisis por equipos</li>
      </ul>

      <h3>¿Necesitas Ayuda?</h3>
      <p>Consulta el archivo README.md en el repositorio del proyecto.</p>
    </div>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(500)
    .setHeight(600);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Ayuda - Sistema de Días Personales');
}

/**
 * Función para ejecutar automáticamente (puede configurarse con triggers)
 */
function ejecutarAutomatico() {
  ejecutarSistema();
}
