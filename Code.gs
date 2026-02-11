/**
 * Sistema de Gestión de Días Personales - KoboToolbox Integration
 * Versión 2.1 - Ejecución automática con detección de nuevos registros
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
  KOBO_TOKEN_DEFAULT: '64cc018b88067397addd36b09288be8b6539cf39',
  ADMIN_EMAIL_DEFAULT: 'admin@creamosguatemala.org',
  DIAS_TOTALES: 15, // Días personales totales por persona
  SHEET_NAME_DATOS: 'Datos KoboToolbox',
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
  ],

  // Directores por equipo [nombre, correo]
  DIRECTORES_DEFAULT: {
    'Apoyo emocional':           { nombre: 'Iris Melissa Payes Argueta',        correo: 'melissa@creamosguatemala.org' },
    'Operaciones':               { nombre: 'Alejandro Renato Valdéz Álvarez',   correo: 'renato@creamosguatemala.org' },
    'mi-eelo':                   { nombre: 'Stephany Tatiana Fuentes Rodríguez',correo: 'stephany@creamosguatemala.org' },
    'Gestión de Impacto':        { nombre: 'Eneko Arberas García',              correo: 'eneko@creamosguatemala.org' },
    'Educación':                 { nombre: 'Carmen Rossana Boche Noriega',      correo: 'rossana@creamosguatemala.org' },
    'Centro de cuidado infantil':{ nombre: 'Carmen Lucía Carías González de Zacher', correo: 'carmen@creamosguatemala.org' },
    'Administración':            { nombre: 'Carmen Lucía Carías González de Zacher', correo: 'carmen@creamosguatemala.org' },
    'Inclusión Laboral':         { nombre: 'Laura Alejandra Castañeda Leal',    correo: 'alejandra@creamosguatemala.org' }
  },

  // Correos de empleados (nombre completo → correo)
  CORREOS_EMPLEADOS: {
    'Laura Alejandra Castañeda Leal':             'alejandra@creamosguatemala.org',
    'Eva Priscila López Xaper':                   'eva@creamosguatemala.org',
    'Paola Lisbeth Ortiz Ramírez':                'paola@creamosguatemala.org',
    'Sindy Lucero Sánchez Barrientos':            'sindy@creamosguatemala.org',
    'Jacqueline Paola Tello':                     'jacqueline@creamosguatemala.org',
    'Bruna España Bernal':                        'bruna@creamosguatemala.org',
    'Iris Melissa Payes Argueta':                 'melissa@creamosguatemala.org',
    'Diana Michelle Pérez Vaides':                'diana@creamosguatemala.org',
    'Estela Karina Oscal Pixtun':                 'karina@creamosguatemala.org',
    'Gerber Josué Álvarez':                       'gerber@creamosguatemala.org',
    'Alejandro Renato Valdéz Álvarez':            'renato@creamosguatemala.org',
    'Yhenifer Yaneth Aguilar Rodríguez de Pérez': 'yhenifer@creamosguatemala.org',
    'Maritza Carolina Pérez López':               'maritza@creamosguatemala.org',
    'Juan Josué Alvarado Caxaj':                  'josue@creamosguatemala.org',
    'Stephany Tatiana Fuentes Rodríguez':         'stephany@creamosguatemala.org',
    'Jansel Abel Ojeda Posadas':                  'jansel@creamosguatemala.org',
    'Irma Jeaneth García':                        'irma@creamosguatemala.org',
    'Eustolia Beatriz González Gómez':            'beatriz@creamosguatemala.org',
    'Eneko Arberas García':                       'eneko@creamosguatemala.org',
    'Gedaias Alexander Ajú Suquén':               'alexander@creamosguatemala.org',
    'Adrián Antonio Torres Flores':               'adrian@creamosguatemala.org',
    'Sebastian Stephen Villegas Strange':         'sebastian@creamosguatemala.org',
    'Carmen Rossana Boche Noriega':               'rossana@creamosguatemala.org',
    'Mildred Alejandra Molina Valiente':          'mildred@creamosguatemala.org',
    'Abraham Jose David Marcos Bámaca Nij':       'abraham@creamosguatemala.org',
    'Yenifer Pamela Mejía de la Cruz':            'pamela@creamosguatemala.org',
    'Carmen Lucía Carías González de Zacher':     'carmen@creamosguatemala.org'
  }
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

    if (!datosKobo || datosKobo.length <= 1) {
      Logger.log('No hay datos en KoboToolbox para procesar');
      SpreadsheetApp.getActiveSpreadsheet().toast('No hay datos disponibles', 'Info', 3);
      return;
    }

    // 2. Detectar y procesar solo registros nuevos
    const registrosNuevos = detectarRegistrosNuevos(datosKobo);

    if (registrosNuevos.length === 0) {
      Logger.log('No hay registros nuevos para procesar');
      SpreadsheetApp.getActiveSpreadsheet().toast('No hay registros nuevos', 'Info', 3);
      return;
    }

    Logger.log('Encontrados ' + registrosNuevos.length + ' registros nuevos');

    // 3. Procesar todos los datos (incluyendo históricos)
    const datosProcessados = procesarDatos(datosKobo);

    // 4. Agregar nuevos registros al historial
    agregarAlHistorial(registrosNuevos, datosKobo[0]);

    // 5. Generar resumen
    const resumen = generarResumen(datosProcessados);

    // 6. Escribir resumen en hoja
    escribirResumen(resumen);

    // 7. Enviar correos solo para los nuevos registros (si está activado)
    enviarNotificacionNuevoRegistro(registrosNuevos, datosKobo[0]);

    Logger.log('Sistema ejecutado exitosamente');
    SpreadsheetApp.getActiveSpreadsheet().toast(
      registrosNuevos.length + ' nuevo(s) registro(s) procesado(s)',
      'Éxito',
      5
    );

  } catch (error) {
    Logger.log('Error en ejecutarSistema: ' + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast('Error: ' + error.message, 'Error', 10);
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
 * Lee un valor de la hoja de configuración buscando la etiqueta en la columna A.
 * Más robusto que leer por celda fija, porque no depende de en qué fila está el dato.
 * @param {Sheet} sheet - Hoja de configuración
 * @param {string} etiqueta - Texto a buscar en columna A (ej: 'Token KoboToolbox:')
 * @param {*} valorDefecto - Valor a devolver si no se encuentra la etiqueta
 */
function leerConfigPorEtiqueta(sheet, etiqueta, valorDefecto) {
  try {
    const ultimaFila = sheet.getLastRow();
    if (ultimaFila < 1) return valorDefecto;

    const datos = sheet.getRange(1, 1, ultimaFila, 2).getValues();
    for (let i = 0; i < datos.length; i++) {
      if (datos[i][0].toString().trim().toLowerCase() === etiqueta.toLowerCase()) {
        const val = datos[i][1];
        if (val !== null && val !== undefined && val.toString().trim() !== '') {
          return val;
        }
        return valorDefecto;
      }
    }
    return valorDefecto;
  } catch (e) {
    return valorDefecto;
  }
}

/**
 * Obtiene datos desde la API de KoboToolbox
 */
function obtenerDatosKoboToolbox() {
  try {
    Logger.log('Obteniendo datos de KoboToolbox...');

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_CONFIG);

    if (!sheet) {
      throw new Error('No existe la hoja "' + CONFIG.SHEET_NAME_CONFIG + '". Ve al menú > "Crear/Actualizar Configuración" primero.');
    }

    // Leer por etiqueta para no depender de la posición exacta de la celda
    const token = leerConfigPorEtiqueta(sheet, 'Token KoboToolbox:', null);
    const apiUrl = leerConfigPorEtiqueta(sheet, 'URL API KoboToolbox:', CONFIG.KOBO_API_URL);

    if (!token || token.toString().trim() === '') {
      throw new Error(
        'Token de KoboToolbox no configurado.\n' +
        '1. Ve al menú > "Crear/Actualizar Configuración"\n' +
        '2. En la hoja "Configuración", escribe tu token en la columna B junto a la etiqueta "Token KoboToolbox:"'
      );
    }

    // Validar que la URL sea realmente una URL antes de hacer el fetch
    const urlStr = apiUrl.toString().trim();
    if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
      throw new Error(
        'La URL de la API no es válida: "' + urlStr + '".\n' +
        'Ve al menú > "Crear/Actualizar Configuración" para restaurar la URL correcta en la hoja "Configuración".'
      );
    }

    const options = {
      method: 'get',
      headers: {
        'Authorization': 'Token ' + token.toString().trim()
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(urlStr, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 401) {
      throw new Error('Token de KoboToolbox inválido o expirado. Verifica el token en la hoja "Configuración".');
    }

    if (responseCode === 404) {
      throw new Error('URL de la API no encontrada. Verifica la URL en la hoja "Configuración".');
    }

    if (responseCode !== 200) {
      throw new Error('Error al conectar con KoboToolbox. Código HTTP: ' + responseCode + '. Verifica tu token y URL.');
    }

    const csvData = response.getContentText();

    if (!csvData || csvData.trim() === '') {
      throw new Error('KoboToolbox devolvió datos vacíos. Verifica que el formulario tenga respuestas.');
    }

    const parsedData = Utilities.parseCsv(csvData);

    Logger.log('Datos obtenidos exitosamente: ' + parsedData.length + ' filas (incluyendo encabezados)');
    return parsedData;

  } catch (error) {
    Logger.log('Error en obtenerDatosKoboToolbox: ' + error.message);
    throw error;
  }
}

/**
 * Detecta registros nuevos comparando con el historial usando el ID de KoboToolbox
 */
function detectarRegistrosNuevos(datosKobo) {
  try {
    if (!datosKobo || datosKobo.length <= 1) {
      return [];
    }

    const headers = datosKobo[0];
    const idIndex = encontrarColumna(headers, ['_id', '_uuid', 'uuid', 'submission_id', 'id']);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetHistorial = ss.getSheetByName(CONFIG.SHEET_NAME_HISTORIAL);

    // Si no existe historial o está vacío, todos son nuevos
    if (!sheetHistorial || sheetHistorial.getLastRow() <= 1) {
      Logger.log('No existe historial previo. Todos los registros son nuevos.');
      return datosKobo.slice(1);
    }

    // Obtener IDs ya procesados del historial (columna A desde fila 2)
    const ultimaFilaHistorial = sheetHistorial.getLastRow();
    const historialData = sheetHistorial.getRange(2, 1, ultimaFilaHistorial - 1, 1).getValues();
    const historialIds = new Set(historialData.map(function(row) { return row[0].toString(); }));

    // Filtrar registros que no están en el historial
    const nuevos = datosKobo.slice(1).filter(function(row) {
      const id = row[idIndex] !== undefined && row[idIndex] !== '' ? row[idIndex].toString() : row.join('|||');
      return !historialIds.has(id);
    });

    Logger.log('IDs en historial: ' + historialIds.size + '. Registros nuevos: ' + nuevos.length);
    return nuevos;

  } catch (error) {
    Logger.log('Error en detectarRegistrosNuevos: ' + error.message);
    // Si hay error, procesar todos para no perder datos
    return datosKobo.slice(1);
  }
}

/**
 * Agrega nuevos registros al historial con sus datos reales de columnas
 * @param {Array} registrosNuevos - Filas de datos nuevos
 * @param {Array} headers - Encabezados del CSV para identificar columnas
 */
function agregarAlHistorial(registrosNuevos, headers) {
  try {
    if (!registrosNuevos || registrosNuevos.length === 0) return;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_HISTORIAL);

    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME_HISTORIAL);
    }

    // Crear encabezados si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      const cabeceras = ['ID Registro', 'Fecha Proceso', 'Nombre', 'Equipo', 'Fecha Inicio', 'Fecha Fin', 'Días Solicitados', 'Estado'];
      sheet.getRange(1, 1, 1, cabeceras.length)
        .setValues([cabeceras])
        .setFontWeight('bold')
        .setBackground('#4285f4')
        .setFontColor('#ffffff');
    }

    // Identificar columnas relevantes del formulario
    const idIndex = encontrarColumna(headers, ['_id', '_uuid', 'uuid', 'submission_id', 'id']);
    const colNombre = encontrarColumna(headers, ['nombre', 'name', 'empleado', 'employee', 'nombre_completo']);
    const colEquipo = encontrarColumna(headers, ['programa', 'departamento', 'equipo', 'team', 'programa_departamento']);
    const colFechaInicio = encontrarColumna(headers, ['fecha_inicio', 'fecha_de_inicio', 'start_date', 'inicio']);
    const colFechaFin = encontrarColumna(headers, ['fecha_finalizacion', 'fecha_de_finalizacion', 'fecha_fin', 'end_date', 'fin']);

    const ultimaFila = sheet.getLastRow() + 1;
    const fechaProceso = new Date();

    const datosHistorial = registrosNuevos.map(function(registro) {
      const idRegistro = (registro[idIndex] !== undefined && registro[idIndex] !== '')
        ? registro[idIndex].toString()
        : registro.join('|||');

      const diasSolicitados = calcularDiasEntreFechas(registro[colFechaInicio], registro[colFechaFin]);

      return [
        idRegistro,
        fechaProceso,
        registro[colNombre] || 'Sin nombre',
        registro[colEquipo] || 'Sin equipo',
        registro[colFechaInicio] || '',
        registro[colFechaFin] || '',
        diasSolicitados,
        'Procesado'
      ];
    });

    sheet.getRange(ultimaFila, 1, datosHistorial.length, 8).setValues(datosHistorial);
    Logger.log(datosHistorial.length + ' registros agregados al historial');

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

    // Identificar columnas con valor por defecto -1 para detectar columnas no encontradas
    const colNombre = encontrarColumna(headers, ['nombre', 'name', 'empleado', 'employee', 'nombre_completo']);
    const colEquipo = encontrarColumna(headers, ['programa', 'departamento', 'equipo', 'team', 'programa_departamento']);
    const colFechaInicio = encontrarColumna(headers, ['fecha_inicio', 'fecha_de_inicio', 'start_date', 'inicio']);
    const colFechaFin = encontrarColumna(headers, ['fecha_finalizacion', 'fecha_de_finalizacion', 'fecha_fin', 'end_date', 'fin']);
    const colReglamento = encontrarColumna(headers, ['reglamento', 'conoces_reglamento', 'conoce_reglamento']);
    const colConsentimiento = encontrarColumna(headers, ['consentimiento', 'consentimiento_director', 'director_consent']);
    const colDirector = encontrarColumna(headers, ['director', 'supervisor', 'nombre_director']);
    const colCorreoDirector = encontrarColumna(headers, ['correo_director', 'email_director', 'correo_del_director']);

    Logger.log('Columnas identificadas - Nombre:' + colNombre + ' Equipo:' + colEquipo +
      ' FechaInicio:' + colFechaInicio + ' FechaFin:' + colFechaFin);

    // Obtener mapeo de equipos a directores
    const mapeoDirectores = obtenerMapeoDirectores();

    // Agrupar solicitudes por empleado
    const empleadosMap = new Map();

    datos.forEach(function(fila) {
      if (!fila || fila.every(function(c) { return c === '' || c === null || c === undefined; })) {
        return; // Saltar filas vacías
      }

      const nombre = (fila[colNombre] || '').toString().trim() || 'Sin nombre';
      const equipo = (fila[colEquipo] || '').toString().trim() || 'Sin equipo';
      const fechaInicio = (fila[colFechaInicio] || '').toString().trim();
      const fechaFin = (fila[colFechaFin] || '').toString().trim();
      const conoceReglamento = (fila[colReglamento] || 'No especificado').toString().trim();
      const tieneConsentimiento = (fila[colConsentimiento] || 'No especificado').toString().trim();

      // Obtener director y correo: primero del formulario, luego del mapeo
      const infoDirector = mapeoDirectores[equipo] || { nombre: 'Sin asignar', correo: '' };
      const director = ((fila[colDirector] || '').toString().trim()) || infoDirector.nombre;
      const correoDirector = ((fila[colCorreoDirector] || '').toString().trim()) || infoDirector.correo;

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
    const datosProcessados = Array.from(empleadosMap.values()).map(function(empleado) {
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
 * Calcula los días totales entre dos fechas (incluyendo inicio y fin)
 * Retorna 1 si inicio = fin (un solo día)
 */
function calcularDiasEntreFechas(fechaInicio, fechaFin) {
  try {
    if (!fechaInicio || !fechaFin ||
        fechaInicio.toString().trim() === '' ||
        fechaFin.toString().trim() === '') {
      return 0;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      Logger.log('Fechas inválidas: inicio=' + fechaInicio + ', fin=' + fechaFin);
      return 0;
    }

    // Normalizar a medianoche para evitar problemas con horas
    const inicioNorm = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    const finNorm = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());

    if (finNorm < inicioNorm) {
      Logger.log('Fecha fin anterior a fecha inicio: inicio=' + fechaInicio + ', fin=' + fechaFin);
      return 0;
    }

    const unDia = 24 * 60 * 60 * 1000;
    const dias = Math.round((finNorm - inicioNorm) / unDia) + 1;

    return dias;

  } catch (error) {
    Logger.log('Error en calcularDiasEntreFechas: ' + error.message);
    return 0;
  }
}

/**
 * Calcula días hábiles (excluyendo fines de semana)
 */
function calcularDiasHabiles(fechaInicio, fechaFin) {
  try {
    if (!fechaInicio || !fechaFin ||
        fechaInicio.toString().trim() === '' ||
        fechaFin.toString().trim() === '') {
      return 0;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return 0;

    // Normalizar a medianoche
    const inicioNorm = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    const finNorm = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());

    if (finNorm < inicioNorm) return 0;

    let dias = 0;
    const fecha = new Date(inicioNorm);

    while (fecha <= finNorm) {
      const diaSemana = fecha.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) { // 0=domingo, 6=sábado
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
 * Obtiene el mapeo de equipos a directores desde la hoja de directores
 */
function obtenerMapeoDirectores() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DIRECTORES);

    if (!sheet || sheet.getLastRow() <= 2) {
      Logger.log('No existe mapeo de directores o está vacío. Usando directores por defecto del CONFIG.');
      return CONFIG.DIRECTORES_DEFAULT;
    }

    const ultimaFila = sheet.getLastRow();
    const datos = sheet.getRange(3, 1, ultimaFila - 2, 3).getValues();
    const mapeo = {};

    datos.forEach(function(fila) {
      const equipo = fila[0] ? fila[0].toString().trim() : '';
      const nombreDirector = fila[1] ? fila[1].toString().trim() : '';
      const correoDirector = fila[2] ? fila[2].toString().trim() : '';

      if (equipo && nombreDirector) {
        mapeo[equipo] = {
          nombre: nombreDirector,
          correo: correoDirector
        };
      }
    });

    Logger.log('Mapeo de directores cargado: ' + Object.keys(mapeo).length + ' equipos');
    return mapeo;

  } catch (error) {
    Logger.log('Error en obtenerMapeoDirectores: ' + error.message);
    return {};
  }
}

/**
 * Encuentra el índice de una columna basándose en palabras clave (búsqueda parcial)
 * Retorna 0 si no encuentra coincidencia (primera columna como fallback)
 */
function encontrarColumna(headers, palabrasClave) {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toString().toLowerCase().trim();
    for (let j = 0; j < palabrasClave.length; j++) {
      if (header.includes(palabrasClave[j].toLowerCase())) {
        return i;
      }
    }
  }
  Logger.log('Columna no encontrada para: ' + palabrasClave.join(', ') + '. Usando columna 0 como fallback.');
  return 0;
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

    if (!datosProcessados || datosProcessados.length === 0) {
      return {
        porDirector: [],
        porEquipo: [],
        totalPersonas: 0,
        totalDiasTomados: 0,
        totalDiasRestantes: 0,
        datosCompletos: []
      };
    }

    const resumenPorDirector = {};
    const resumenPorEquipo = {};

    datosProcessados.forEach(function(persona) {
      const director = persona.director || 'Sin asignar';
      const equipo = persona.equipo || 'Sin equipo';

      // Resumen por director
      if (!resumenPorDirector[director]) {
        resumenPorDirector[director] = {
          director: director,
          correo: persona.correoDirector || '',
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

    const totalDiasTomados = datosProcessados.reduce(function(sum, p) { return sum + p.diasTomados; }, 0);
    const totalDiasRestantes = datosProcessados.reduce(function(sum, p) { return sum + p.diasRestantes; }, 0);

    const resumen = {
      porDirector: Object.values(resumenPorDirector),
      porEquipo: Object.values(resumenPorEquipo),
      totalPersonas: datosProcessados.length,
      totalDiasTomados: totalDiasTomados,
      totalDiasRestantes: totalDiasRestantes,
      datosCompletos: datosProcessados
    };

    // Ordenar equipos por días tomados (mayor a menor)
    resumen.porEquipo.sort(function(a, b) { return b.totalDiasTomados - a.totalDiasTomados; });

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
    sheet.getRange('A1:G1').merge();

    sheet.getRange('A2').setValue('Última actualización: ' + new Date().toLocaleString('es-ES'))
      .setFontStyle('italic')
      .setFontColor('#666666');
    sheet.getRange('A2:G2').merge();

    // Estadísticas generales
    let row = 4;
    sheet.getRange(row, 1).setValue('Estadísticas Generales').setFontWeight('bold').setFontSize(12);
    row++;
    sheet.getRange(row, 1).setValue('Total de Personas:');
    sheet.getRange(row, 2).setValue(resumen.totalPersonas);
    row++;
    sheet.getRange(row, 1).setValue('Total Días Tomados:');
    sheet.getRange(row, 2).setValue(resumen.totalDiasTomados);
    row++;
    sheet.getRange(row, 1).setValue('Total Días Restantes:');
    sheet.getRange(row, 2).setValue(resumen.totalDiasRestantes);
    row++;

    if (resumen.totalPersonas > 0) {
      sheet.getRange(row, 1).setValue('Promedio Días Tomados por Persona:');
      sheet.getRange(row, 2).setValue(parseFloat((resumen.totalDiasTomados / resumen.totalPersonas).toFixed(1)));
    }

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
    const startRowPersonas = row;
    const datosPersonas = resumen.datosCompletos
      .sort(function(a, b) { return b.diasTomados - a.diasTomados; })
      .map(function(p) {
        return [
          p.nombre,
          p.equipo,
          p.director,
          p.diasTomados,
          p.diasRestantes,
          parseFloat(p.porcentajeUsado) + '%',
          p.totalSolicitudes
        ];
      });

    if (datosPersonas.length > 0) {
      sheet.getRange(row, 1, datosPersonas.length, headersPorPersona.length).setValues(datosPersonas);

      // Formato condicional en columna "Días Restantes" (columna 5)
      const rangoRestantes = sheet.getRange(startRowPersonas, 5, datosPersonas.length, 1);
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
    const datosEquipos = resumen.porEquipo.map(function(e) {
      return [
        e.equipo,
        e.totalPersonas,
        e.totalDiasTomados,
        e.totalDiasRestantes,
        parseFloat((e.totalDiasTomados / e.totalPersonas).toFixed(1))
      ];
    });

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
 * @param {Array} registrosNuevos - Filas de registros nuevos
 * @param {Array} headers - Encabezados del CSV
 */
function enviarNotificacionNuevoRegistro(registrosNuevos, headers) {
  try {
    if (!registrosNuevos || registrosNuevos.length === 0) return;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_CONFIG);

    if (!sheet) {
      Logger.log('No existe hoja de configuración. Correo no enviado.');
      return;
    }

    const enviarCorreos = leerConfigPorEtiqueta(sheet, 'Enviar correos (TRUE/FALSE):', false);

    if (!enviarCorreos || enviarCorreos.toString().toLowerCase() !== 'true') {
      Logger.log('Envío de correos deshabilitado');
      return;
    }

    const correoAdmin = leerConfigPorEtiqueta(sheet, 'Correo del administrador: (*)', null)
      || leerConfigPorEtiqueta(sheet, 'Correo del administrador:', null);

    if (!correoAdmin || correoAdmin.toString().trim() === '') {
      Logger.log('No se ha configurado correo del administrador');
      return;
    }

    // Identificar columnas para construir el correo con datos reales
    const colNombre = encontrarColumna(headers, ['nombre', 'name', 'empleado', 'employee', 'nombre_completo']);
    const colEquipo = encontrarColumna(headers, ['programa', 'departamento', 'equipo', 'team', 'programa_departamento']);
    const colFechaInicio = encontrarColumna(headers, ['fecha_inicio', 'fecha_de_inicio', 'start_date', 'inicio']);
    const colFechaFin = encontrarColumna(headers, ['fecha_finalizacion', 'fecha_de_finalizacion', 'fecha_fin', 'end_date', 'fin']);

    const asunto = 'Nueva(s) solicitud(es) de días personales - ' + registrosNuevos.length + ' registro(s)';
    const cuerpo = crearCorreoNuevoRegistro(registrosNuevos, colNombre, colEquipo, colFechaInicio, colFechaFin);

    MailApp.sendEmail({
      to: correoAdmin.toString().trim(),
      subject: asunto,
      htmlBody: cuerpo
    });

    Logger.log('Notificación enviada al administrador: ' + correoAdmin);

    // Enviar confirmación a cada empleado cuya solicitud fue procesada
    registrosNuevos.forEach(function(reg) {
      const nombreEmpleado = (reg[colNombre] || '').toString().trim();
      const correoEmpleado = CONFIG.CORREOS_EMPLEADOS[nombreEmpleado];
      if (!correoEmpleado) {
        Logger.log('No se encontró correo para: ' + nombreEmpleado);
        return;
      }
      try {
        const fechaInicio = reg[colFechaInicio] || 'No especificada';
        const fechaFin    = reg[colFechaFin]    || 'No especificada';
        const cuerpoEmp =
          '<p>Hola <strong>' + nombreEmpleado + '</strong>,</p>' +
          '<p>Tu solicitud de días personales ha sido registrada correctamente:</p>' +
          '<ul>' +
          '<li><strong>Fecha inicio:</strong> ' + fechaInicio + '</li>' +
          '<li><strong>Fecha fin:</strong> '    + fechaFin    + '</li>' +
          '</ul>' +
          '<p>Para consultas, responde este correo o contacta a tu director.</p>' +
          '<p style="color:#888;font-size:12px;">Correo generado automáticamente — Sistema de Gestión de Días Personales, Creamos Guatemala.</p>';
        MailApp.sendEmail({
          to: correoEmpleado,
          subject: 'Confirmación de solicitud de días personales',
          htmlBody: cuerpoEmp
        });
        Logger.log('Confirmación enviada a empleado: ' + correoEmpleado);
      } catch (errEmp) {
        Logger.log('Error enviando correo a ' + nombreEmpleado + ': ' + errEmp.message);
      }
    });

  } catch (error) {
    Logger.log('Error en enviarNotificacionNuevoRegistro: ' + error.message);
  }
}

/**
 * Crea el cuerpo del correo para nuevos registros
 */
function crearCorreoNuevoRegistro(registros, colNombre, colEquipo, colFechaInicio, colFechaFin) {
  const items = registros.map(function(reg, index) {
    return '<tr>' +
      '<td>' + (index + 1) + '</td>' +
      '<td>' + (reg[colNombre] || 'Sin nombre') + '</td>' +
      '<td>' + (reg[colEquipo] || 'Sin equipo') + '</td>' +
      '<td>' + (reg[colFechaInicio] || 'No especificada') + '</td>' +
      '<td>' + (reg[colFechaFin] || 'No especificada') + '</td>' +
      '</tr>';
  }).join('');

  return '<html>' +
    '<body style="font-family: Arial, sans-serif;">' +
    '<h2>Nueva(s) Solicitud(es) de Días Personales</h2>' +
    '<p>Se ha(n) recibido <strong>' + registros.length + '</strong> nueva(s) solicitud(es):</p>' +
    '<table border="1" cellpadding="10" style="border-collapse: collapse;">' +
    '<thead>' +
    '<tr style="background-color: #4285f4; color: white;">' +
    '<th>#</th>' +
    '<th>Nombre</th>' +
    '<th>Equipo</th>' +
    '<th>Fecha Inicio</th>' +
    '<th>Fecha Fin</th>' +
    '</tr>' +
    '</thead>' +
    '<tbody>' + items + '</tbody>' +
    '</table>' +
    '<p style="margin-top: 20px;">' +
    '<a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '" ' +
    'style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">' +
    'Ver Resumen Completo</a>' +
    '</p>' +
    '<p style="color: #666; font-size: 12px; margin-top: 30px;">' +
    'Notificación automática - ' + new Date().toLocaleString('es-ES') +
    '</p>' +
    '</body>' +
    '</html>';
}

/**
 * Envía correo de error al administrador
 */
function enviarCorreoError(error) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_CONFIG);

    if (!sheet) return;

    const correoAdmin = leerConfigPorEtiqueta(sheet, 'Correo del administrador: (*)', null)
      || leerConfigPorEtiqueta(sheet, 'Correo del administrador:', null);

    if (!correoAdmin || correoAdmin.toString().trim() === '') return;

    MailApp.sendEmail({
      to: correoAdmin.toString().trim(),
      subject: 'Error en Sistema de Días Personales',
      body: 'Se ha producido un error en el sistema:\n\nError: ' + error.message +
        '\n\nStack: ' + (error.stack || 'No disponible') +
        '\n\nFecha: ' + new Date().toLocaleString('es-ES')
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

    if (!sheet) {
      Logger.log('No existe hoja de configuración. Correos a directores no enviados.');
      return;
    }

    const enviarCorreos = leerConfigPorEtiqueta(sheet, 'Enviar correos (TRUE/FALSE):', false);

    if (!enviarCorreos || enviarCorreos.toString().toLowerCase() !== 'true') {
      Logger.log('Envío de correos a directores deshabilitado');
      return;
    }

    let correosEnviados = 0;

    resumen.porDirector.forEach(function(director) {
      if (director.correo && director.correo.trim() !== '') {
        try {
          const asunto = 'Reporte de Días Personales - Equipo de ' + director.director;
          const cuerpo = crearCuerpoCorreoDirector(director);

          MailApp.sendEmail({
            to: director.correo.trim(),
            subject: asunto,
            htmlBody: cuerpo
          });

          correosEnviados++;
          Logger.log('Correo enviado a: ' + director.correo);

        } catch (err) {
          Logger.log('Error al enviar correo a ' + director.correo + ': ' + err.message);
        }
      } else {
        Logger.log('Director sin correo configurado: ' + director.director);
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
  const filas = director.personas.map(function(persona) {
    let claseEstado = 'ok';
    let estado = 'OK';

    if (persona.diasRestantes < 3) {
      claseEstado = 'alerta-baja';
      estado = 'Pocos días restantes';
    } else if (persona.diasRestantes < 7) {
      claseEstado = 'alerta-media';
      estado = 'Considerar planificación';
    }

    return '<tr>' +
      '<td>' + persona.nombre + '</td>' +
      '<td>' + persona.diasTomados + '</td>' +
      '<td class="' + claseEstado + '">' + persona.diasRestantes + '</td>' +
      '<td>' + persona.porcentajeUsado + '%</td>' +
      '<td>' + persona.totalSolicitudes + '</td>' +
      '<td class="' + claseEstado + '">' + estado + '</td>' +
      '</tr>';
  }).join('');

  const promedio = director.totalPersonas > 0
    ? (director.totalDiasTomados / director.totalPersonas).toFixed(1)
    : '0.0';

  return '<html>' +
    '<head><style>' +
    'body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }' +
    'h2 { color: #4285f4; }' +
    'h3 { color: #34a853; }' +
    'table { border-collapse: collapse; width: 100%; margin: 20px 0; }' +
    'th { background-color: #4285f4; color: white; padding: 12px; text-align: left; }' +
    'td { padding: 10px; border-bottom: 1px solid #ddd; }' +
    'tr:hover { background-color: #f5f5f5; }' +
    '.resumen { background-color: #e8f0fe; padding: 15px; border-radius: 5px; margin: 20px 0; }' +
    '.alerta-baja { color: #d93025; font-weight: bold; }' +
    '.alerta-media { color: #f9ab00; font-weight: bold; }' +
    '.ok { color: #34a853; }' +
    '.footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #666; }' +
    '</style></head>' +
    '<body>' +
    '<h2>Reporte de Días Personales - ' + director.director + '</h2>' +
    '<div class="resumen">' +
    '<h3>Resumen del Equipo</h3>' +
    '<p><strong>Total de personas:</strong> ' + director.totalPersonas + '</p>' +
    '<p><strong>Total de días tomados:</strong> ' + director.totalDiasTomados + ' días</p>' +
    '<p><strong>Total de días restantes:</strong> ' + director.totalDiasRestantes + ' días</p>' +
    '<p><strong>Promedio de días tomados:</strong> ' + promedio + ' días por persona</p>' +
    '</div>' +
    '<h3>Detalle por Persona</h3>' +
    '<table>' +
    '<thead><tr>' +
    '<th>Nombre</th><th>Días Tomados</th><th>Días Restantes</th>' +
    '<th>% Usado</th><th># Solicitudes</th><th>Estado</th>' +
    '</tr></thead>' +
    '<tbody>' + filas + '</tbody>' +
    '</table>' +
    '<div class="footer">' +
    '<p>Este correo fue generado automáticamente por el Sistema de Gestión de Días Personales.</p>' +
    '<p>Fecha de generación: ' + new Date().toLocaleString('es-ES') + '</p>' +
    '<p><strong>Nota:</strong> Cada persona tiene un total de ' + CONFIG.DIAS_TOTALES + ' días personales al año.</p>' +
    '</div>' +
    '</body></html>';
}

// ============================================================================
// FUNCIONES DE CONFIGURACIÓN E INICIALIZACIÓN
// ============================================================================

/**
 * Crea la hoja de configuración
 * Estructura de celdas:
 *   A1:B1 - Título
 *   A3:B3 - Token KoboToolbox (B3)
 *   A4:B4 - URL API (B4)
 *   A5:B5 - Días personales totales (B5)
 *   A6:B6 - Enviar correos TRUE/FALSE (B6)
 *   A7:B7 - Correo del administrador (B7)
 */
function crearHojaConfiguracion() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_CONFIG);
  const esNueva = !sheet;

  if (esNueva) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME_CONFIG);
  }

  // Preservar valores que el usuario ya haya ingresado; si es hoja nueva usar defaults
  const tokenExistente = esNueva
    ? CONFIG.KOBO_TOKEN_DEFAULT
    : (leerConfigPorEtiqueta(sheet, 'Token KoboToolbox:', '') || CONFIG.KOBO_TOKEN_DEFAULT);
  const correoExistente = esNueva
    ? CONFIG.ADMIN_EMAIL_DEFAULT
    : (leerConfigPorEtiqueta(sheet, 'Correo del administrador:', '') || CONFIG.ADMIN_EMAIL_DEFAULT);
  const urlExistente = esNueva ? CONFIG.KOBO_API_URL : leerConfigPorEtiqueta(sheet, 'URL API KoboToolbox:', CONFIG.KOBO_API_URL);
  const diasExistentes = esNueva ? CONFIG.DIAS_TOTALES : leerConfigPorEtiqueta(sheet, 'Días personales totales:', CONFIG.DIAS_TOTALES);
  const correosActivoExistente = esNueva ? false : leerConfigPorEtiqueta(sheet, 'Enviar correos (TRUE/FALSE):', false);

  sheet.clear();

  // Título
  sheet.getRange('A1').setValue('CONFIGURACIÓN DEL SISTEMA')
    .setFontSize(14).setFontWeight('bold')
    .setBackground('#4285f4').setFontColor('#ffffff');
  sheet.getRange('A1:B1').merge();

  // Subtítulo
  sheet.getRange('A2').setValue('Completa los campos marcados con (*). Los demás tienen valores por defecto.')
    .setFontStyle('italic').setFontColor('#666666');
  sheet.getRange('A2:B2').merge();

  // Campos de configuración — SIEMPRE en filas 3-7
  const configData = [
    ['Token KoboToolbox: (*)',          tokenExistente],
    ['URL API KoboToolbox:',            urlExistente],
    ['Días personales totales:',        diasExistentes],
    ['Enviar correos (TRUE/FALSE):',    correosActivoExistente],
    ['Correo del administrador: (*)',   correoExistente]
  ];

  sheet.getRange(3, 1, configData.length, 2).setValues(configData);
  sheet.getRange(3, 1, configData.length, 1).setFontWeight('bold');

  // Resaltar filas obligatorias
  sheet.getRange('A3:B3').setBackground('#fff3cd'); // Token - amarillo
  sheet.getRange('A7:B7').setBackground('#fff3cd'); // Correo - amarillo

  // Instrucciones
  const instrucciones = [
    ['INSTRUCCIONES:', ''],
    ['1. (*) Ingresa tu token de KoboToolbox en la columna B de la fila "Token KoboToolbox"', ''],
    ['2. La URL de la API ya está pre-cargada. Solo cámbiala si usas otra exportación de KoboToolbox', ''],
    ['3. Ajusta los días personales si es necesario (por defecto: 15 = 7 en S1 + 8 en S2)', ''],
    ['4. Escribe TRUE en "Enviar correos" para activar notificaciones por correo', ''],
    ['5. (*) Ingresa tu correo en "Correo del administrador" para recibir notificaciones', ''],
    ['6. Menú > "Configurar Directores" para asignar directores a cada equipo', ''],
    ['7. Menú > "Configurar Trigger Automático" para ejecutar el sistema cada 15 minutos', ''],
    ['', ''],
    ['NOTA: Las celdas amarillas son obligatorias para que el sistema funcione.', '']
  ];

  const startRow = 3 + configData.length + 1;
  sheet.getRange(startRow, 1, instrucciones.length, 2).setValues(instrucciones);
  sheet.getRange(startRow, 1).setFontWeight('bold');

  sheet.autoResizeColumn(1);
  sheet.setColumnWidth(2, 500);

  Logger.log('Hoja de configuración creada/actualizada (token y correo previos preservados)');

  const msg = tokenExistente
    ? 'Configuración actualizada. Tu token y correo se conservaron.'
    : 'Hoja de configuración lista. Completa el token (fila amarilla) y tu correo.';
  SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'Configuración', 7);
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

  // Agregar fila por cada equipo con director y correo pre-cargados
  const equipos = CONFIG.EQUIPOS.map(function(equipo) {
    const dir = CONFIG.DIRECTORES_DEFAULT[equipo] || { nombre: '', correo: '' };
    return [equipo, dir.nombre, dir.correo];
  });
  sheet.getRange(3, 1, equipos.length, 3).setValues(equipos);

  sheet.autoResizeColumn(1);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 280);

  // Instrucciones
  const startRow = 3 + equipos.length + 2;
  sheet.getRange(startRow, 1).setValue('INSTRUCCIONES:').setFontWeight('bold');
  sheet.getRange(startRow + 1, 1).setValue('1. Completa el nombre del director de cada equipo en la columna B');
  sheet.getRange(startRow + 2, 1).setValue('2. Completa el correo del director en la columna C (requerido para enviar reportes)');
  sheet.getRange(startRow + 3, 1).setValue('3. Los correos se enviarán automáticamente a estos directores cuando uses "Enviar Reporte a Directores"');
  sheet.getRange(startRow + 4, 1).setValue('4. Si el formulario de KoboToolbox ya incluye el campo "director", ese valor tendrá prioridad');

  Logger.log('Hoja de directores creada/actualizada con datos pre-cargados');
  SpreadsheetApp.getActiveSpreadsheet().toast('Hoja de directores lista con directores pre-cargados. Verifica y ajusta si es necesario.', 'Directores', 7);
}

/**
 * Crea el menú personalizado al abrir la hoja
 */
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('Días Personales')
      .addItem('▶ Actualizar Datos Manualmente', 'ejecutarSistema')
      .addSeparator()
      .addItem('⚙ Crear/Actualizar Configuración', 'crearHojaConfiguracion')
      .addItem('👥 Configurar Directores', 'crearHojaDirectores')
      .addItem('⏰ Configurar Trigger Automático', 'configurarTriggerAutomatico')
      .addSeparator()
      .addItem('📧 Enviar Reporte a Directores', 'enviarReporteManualaDirectores')
      .addSeparator()
      .addItem('🔁 Reinstalar Sistema Completo', 'reinstalarSistema')
      .addItem('ℹ Ayuda', 'mostrarAyuda')
      .addToUi();
  } catch (e) {
    // onOpen fue llamada fuera del contexto del spreadsheet (ej: editor de Apps Script).
    // No hay nada que hacer; el menú solo existe cuando se abre el Sheet.
    Logger.log('onOpen: sin contexto de UI (' + e.message + ')');
  }
}

/**
 * Reinstala el sistema completo:
 * 1. Elimina todas las hojas del sistema
 * 2. Recrea hojas de Configuración y Directores desde cero
 * 3. Elimina triggers anteriores
 * 4. Configura trigger automático
 * 5. Guía al usuario para completar el token
 */
function reinstalarSistema() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Confirmación con advertencia clara
  const confirmacion = ui.alert(
    '⚠ Reinstalar Sistema Completo',
    'Esto eliminará y recreará las siguientes hojas:\n\n' +
    '  • ' + CONFIG.SHEET_NAME_CONFIG + '\n' +
    '  • ' + CONFIG.SHEET_NAME_DIRECTORES + '\n' +
    '  • ' + CONFIG.SHEET_NAME_DATOS + '\n' +
    '  • ' + CONFIG.SHEET_NAME_RESUMEN + '\n' +
    '  • ' + CONFIG.SHEET_NAME_HISTORIAL + '\n\n' +
    '⚠ ATENCIÓN: Se perderán todos los datos históricos y la configuración actual.\n\n' +
    '¿Deseas continuar?',
    ui.ButtonSet.YES_NO
  );

  if (confirmacion !== ui.Button.YES) {
    ui.alert('Reinstalación cancelada.', '', ui.ButtonSet.OK);
    return;
  }

  const ss2 = SpreadsheetApp.getActiveSpreadsheet();

  try {
    // ── PASO 1: Eliminar hojas del sistema ────────────────────────────────────
    const hojasASistema = [
      CONFIG.SHEET_NAME_CONFIG,
      CONFIG.SHEET_NAME_DIRECTORES,
      CONFIG.SHEET_NAME_DATOS,
      CONFIG.SHEET_NAME_RESUMEN,
      CONFIG.SHEET_NAME_HISTORIAL
    ];

    // Asegurarse de que quede al menos una hoja activa en el spreadsheet
    // antes de borrar (Google Sheets requiere mínimo una hoja)
    const todasLasHojas = ss2.getSheets();
    const hojasQueQuedan = todasLasHojas.filter(function(h) {
      return hojasASistema.indexOf(h.getName()) === -1;
    });

    // Si todas las hojas son del sistema, crear una hoja temporal primero
    let hojaTemporal = null;
    if (hojasQueQuedan.length === 0) {
      hojaTemporal = ss2.insertSheet('_temporal_');
    }

    // Eliminar hojas del sistema
    hojasASistema.forEach(function(nombre) {
      const hoja = ss2.getSheetByName(nombre);
      if (hoja) {
        ss2.deleteSheet(hoja);
        Logger.log('Hoja eliminada: ' + nombre);
      }
    });

    // ── PASO 2: Eliminar triggers anteriores ─────────────────────────────────
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'ejecutarAutomatico') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    Logger.log('Triggers eliminados');

    // ── PASO 3: Recrear hoja de Configuración ────────────────────────────────
    crearHojaConfiguracion();

    // ── PASO 4: Recrear hoja de Directores ───────────────────────────────────
    crearHojaDirectores();

    // ── PASO 5: Crear hojas vacías para Datos, Resumen e Historial ───────────
    [CONFIG.SHEET_NAME_DATOS, CONFIG.SHEET_NAME_RESUMEN, CONFIG.SHEET_NAME_HISTORIAL].forEach(function(nombre) {
      if (!ss2.getSheetByName(nombre)) {
        ss2.insertSheet(nombre);
        Logger.log('Hoja creada vacía: ' + nombre);
      }
    });

    // ── PASO 6: Eliminar hoja temporal si se creó ─────────────────────────────
    if (hojaTemporal) {
      ss2.deleteSheet(hojaTemporal);
    }

    // ── PASO 7: Configurar trigger automático ─────────────────────────────────
    ScriptApp.newTrigger('ejecutarAutomatico')
      .timeBased()
      .everyMinutes(15)
      .create();
    Logger.log('Trigger automático configurado (cada 15 minutos)');

    // ── PASO 8: Activar hoja de Configuración para que el usuario la vea ─────
    const hojaConfig = ss2.getSheetByName(CONFIG.SHEET_NAME_CONFIG);
    if (hojaConfig) {
      ss2.setActiveSheet(hojaConfig);
    }

    // Mensaje final con instrucciones
    ui.alert(
      '✅ Sistema reinstalado correctamente',
      'Todo está listo. Ahora debes completar 2 pasos:\n\n' +
      '1. En la hoja "Configuración" (ya abierta):\n' +
      '   → Escribe tu token de KoboToolbox en la celda amarilla "Token KoboToolbox: (*)"\n' +
      '   → Escribe tu correo en la celda amarilla "Correo del administrador: (*)"\n\n' +
      '2. En la hoja "Directores":\n' +
      '   → Completa el nombre y correo de cada director\n\n' +
      '3. Cuando termines, ve al menú > "▶ Actualizar Datos Manualmente" para probar.\n\n' +
      'El trigger automático ya está activo (cada 15 minutos).',
      ui.ButtonSet.OK
    );

    Logger.log('Reinstalación completada exitosamente');

  } catch (error) {
    Logger.log('Error en reinstalarSistema: ' + error.message);
    ui.alert(
      'Error durante la reinstalación',
      'Ocurrió un error: ' + error.message + '\n\nRevisa el log en Extensiones > Apps Script > Registros.',
      ui.ButtonSet.OK
    );
  }
}

/**
 * Configura el trigger automático para ejecutar el sistema cada 15 minutos
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
    // Eliminar triggers existentes de esta función para evitar duplicados
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
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
      'El sistema verificará nuevos registros cada 15 minutos automáticamente.\n\n' +
      'Puedes ver y gestionar los triggers en: Extensiones > Apps Script > Triggers (ícono del reloj)',
      ui.ButtonSet.OK
    );
  }
}

/**
 * Envía reporte manual a todos los directores con correo configurado
 */
function enviarReporteManualaDirectores() {
  try {
    const datosKobo = obtenerDatosKoboToolbox();
    const datosProcessados = procesarDatos(datosKobo);
    const resumen = generarResumen(datosProcessados);
    enviarCorreosDirectores(resumen);

    SpreadsheetApp.getActiveSpreadsheet().toast('Correos enviados a directores', 'Éxito', 5);
  } catch (error) {
    Logger.log('Error en enviarReporteManualaDirectores: ' + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast('Error: ' + error.message, 'Error', 10);
  }
}

/**
 * Muestra la ventana de ayuda
 */
function mostrarAyuda() {
  const html = '<div style="font-family: Arial; padding: 20px;">' +
    '<h2>Sistema de Gestión de Días Personales v2.1</h2>' +

    '<h3>Configuración Inicial (primera vez)</h3>' +
    '<ol>' +
    '<li>Menú > <strong>Crear/Actualizar Configuración</strong> (crea la hoja con los campos a completar)</li>' +
    '<li>En la hoja "Configuración": ingresa el <strong>token de KoboToolbox en B3</strong> y tu <strong>correo en B7</strong></li>' +
    '<li>Menú > <strong>Configurar Directores</strong> y completa nombres y correos de directores</li>' +
    '<li>Menú > <strong>Configurar Trigger Automático</strong> para activar la ejecución cada 15 minutos</li>' +
    '</ol>' +

    '<h3>Estructura de la Hoja de Configuración</h3>' +
    '<ul>' +
    '<li><strong>B3</strong> - Token de KoboToolbox</li>' +
    '<li><strong>B4</strong> - URL de la API</li>' +
    '<li><strong>B5</strong> - Días personales totales por persona (default: 15)</li>' +
    '<li><strong>B6</strong> - TRUE para activar envío de correos</li>' +
    '<li><strong>B7</strong> - Correo del administrador</li>' +
    '</ul>' +

    '<h3>Características del Sistema</h3>' +
    '<ul>' +
    '<li>Detección automática de registros nuevos (no reprocesa los ya vistos)</li>' +
    '<li>Cálculo de días entre fechas de inicio y fin</li>' +
    '<li>Ejecución automática cada 15 minutos</li>' +
    '<li>Notificación al administrador cuando llegan nuevas solicitudes</li>' +
    '<li>Reporte completo a directores de cada equipo</li>' +
    '<li>Historial de todas las solicitudes procesadas</li>' +
    '</ul>' +

    '<h3>Nombres de Columnas Soportados en el Formulario</h3>' +
    '<ul>' +
    '<li><strong>Nombre:</strong> nombre, name, empleado, employee, nombre_completo</li>' +
    '<li><strong>Equipo:</strong> programa, departamento, equipo, team, programa_departamento</li>' +
    '<li><strong>Fecha inicio:</strong> fecha_inicio, fecha_de_inicio, start_date, inicio</li>' +
    '<li><strong>Fecha fin:</strong> fecha_finalizacion, fecha_de_finalizacion, fecha_fin, end_date, fin</li>' +
    '</ul>' +

    '<p style="color:#666;font-size:12px;">Si los campos de tu formulario tienen otros nombres, debes actualizarlos en la función encontrarColumna() del script.</p>' +
    '</div>';

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(620).setHeight(550);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Ayuda - Sistema de Días Personales');
}
