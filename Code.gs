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
  DIAS_TOTALES: 15,     // Días personales totales por persona al año (default)
  DIAS_SEMESTRE_1: 7,   // Días del Semestre 1 (Ene–Jun) (default)
  DIAS_SEMESTRE_2: 8,   // Días del Semestre 2 (Jul–Dic) (default)
  // Equipos con días distintos al default (total, s1, s2)
  DIAS_POR_EQUIPO: {
    'Educación': { total: 7, s1: 3, s2: 4 }
  },
  SHEET_NAME_DATOS: 'Datos KoboToolbox',
  SHEET_NAME_RESUMEN: 'Resumen',
  SHEET_NAME_CONFIG: 'Configuración',
  SHEET_NAME_HISTORIAL: 'Historial de Solicitudes',
  SHEET_NAME_DIRECTORES: 'Directores',
  SHEET_NAME_PLANTILLA: 'Plantilla de Empleados',

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
    'Apoyo emocinal':            { nombre: 'Iris Melissa Payes Argueta',        correo: 'melissa@creamosguatemala.org' },
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
    // Gestión de Impacto
    'Eneko Arberas García':                       'eneko@creamosguatemala.org',
    'Gedaias Alexander Ajú Suquén':               'alexander@creamosguatemala.org',
    'Adrián Antonio Torres Flores':               'adrian@creamosguatemala.org',
    'Sebastian Stephen Villegas Strange':         'sebastian@creamosguatemala.org',
    // Apoyo emocional
    'Iris Melissa Payes Argueta':                 'melissa@creamosguatemala.org',
    'Diana Michelle Pérez Vaides':                'diana@creamosguatemala.org',
    'Gerber Josué Álvarez':                       'gerber@creamosguatemala.org',
    'Estela Karina Oscal Pixtun':                 'karina@creamosguatemala.org',
    // Operaciones
    'Alejandro Renato Valdéz Álvarez':            'renato@creamosguatemala.org',
    'Maritza Carolina Pérez López':               'maritza@creamosguatemala.org',
    'Yhenifer Yaneth Aguilar Rodríguez de Pérez': 'yhenifer@creamosguatemala.org',
    'Juan Josué Alvarado Caxaj':                  'josue@creamosguatemala.org',
    // mi-eelo
    'Stephany Tatiana Fuentes Rodríguez':         'stephany@creamosguatemala.org',
    'Jansel Abel Ojeda Posadas':                  'jansel@creamosguatemala.org',
    'Eustolia Beatriz González Gómez':            'beatriz@creamosguatemala.org',
    'Irma Jeaneth García':                        'irma@creamosguatemala.org',
    // Educación
    'Carmen Rossana Boche Noriega':               'rossana@creamosguatemala.org',
    'Mildred Alejandra Molina Valiente':          'mildred@creamosguatemala.org',
    'Yenifer Pamela Mejía de la Cruz':            'pamela@creamosguatemala.org',
    'Liliana Román':                              'lily@creamosguatemala.org',
    'Abraham Jose David Marcos Bámaca Nij':       'abraham@creamosguatemala.org',
    // Inclusión Laboral
    'Laura Alejandra Castañeda Leal':             'alejandra@creamosguatemala.org',
    'Eva Priscila López Xaper':                   'eva@creamosguatemala.org',
    'Sindy Lucero Sánchez Barrientos':            'sindy@creamosguatemala.org',
    'Paola Lisbeth Ortiz Ramírez':                'paola@creamosguatemala.org',
    // Centro de cuidado infantil
    'Jacqueline Paola Tello':                     'jacqueline@creamosguatemala.org',
    'Bruna España Bernal':                        'bruna@creamosguatemala.org',
    // Administración
    'Carmen Lucía Carías González de Zacher':     'carmen@creamosguatemala.org'
  }
};

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * WEBHOOK — KoboToolbox llama esta URL cada vez que alguien llena el formulario.
 *
 * Pasos para activarlo:
 *  1. En Apps Script: Implementar > Nueva implementación > Aplicación web
 *     - Ejecutar como: Yo (tu cuenta)
 *     - Quién tiene acceso: Cualquier persona
 *  2. Copia la URL que aparece (termina en /exec)
 *  3. En KoboToolbox: tu formulario > Configuración > REST Services > + Nuevo
 *     - Nombre: Google Sheets Días Personales
 *     - URL: [pega la URL del paso 2]
 *     - Método: POST
 *     - Guardar
 *
 * Cada nueva respuesta del formulario dispara este webhook en ~5 segundos.
 */
function doPost(e) {
  try {
    Logger.log('Webhook recibido desde KoboToolbox — procesando...');
    ejecutarSistema();
    Logger.log('Webhook procesado correctamente');
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', procesado: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error en webhook doPost: ' + error.message);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', mensaje: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Verificación del webhook — abre la URL en el navegador para confirmar que está activo.
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      mensaje: 'Webhook de Días Personales activo',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

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

    // 2. Detectar si es la primera ejecución (historial vacío)
    //    En ese caso se pobla el historial con los datos existentes pero NO se envían correos,
    //    para evitar notificar sobre solicitudes que ya son antiguas.
    const ss0 = SpreadsheetApp.getActiveSpreadsheet();
    const sheetHistorial0 = ss0.getSheetByName(CONFIG.SHEET_NAME_HISTORIAL);
    const primerEjecucion = !sheetHistorial0 || sheetHistorial0.getLastRow() <= 1;

    const registrosNuevos = detectarRegistrosNuevos(datosKobo);

    Logger.log('Registros nuevos detectados: ' + registrosNuevos.length + (primerEjecucion ? ' (primera ejecución — sin correos)' : ''));

    // 3. Procesar TODOS los datos (incluyendo históricos) → siempre actualiza el Resumen
    const datosProcessados = procesarDatos(datosKobo);

    // 4. Generar resumen y escribirlo siempre (independiente de si hay nuevos registros)
    const resumen = generarResumen(datosProcessados);
    escribirResumen(resumen);

    if (registrosNuevos.length === 0) {
      Logger.log('No hay registros nuevos — Resumen actualizado sin cambios en historial');
      SpreadsheetApp.getActiveSpreadsheet().toast('Resumen actualizado (sin registros nuevos)', 'Info', 4);
      return;
    }

    // 5. Agregar al historial solo los registros nuevos
    agregarAlHistorial(registrosNuevos, datosKobo[0]);

    // 6. Enviar correos solo para registros verdaderamente nuevos (no en la primera ejecución)
    if (!primerEjecucion) {
      enviarNotificacionNuevoRegistro(registrosNuevos, datosKobo[0], datosProcessados);
    }

    Logger.log('Sistema ejecutado exitosamente');
    SpreadsheetApp.getActiveSpreadsheet().toast(
      registrosNuevos.length + ' nuevo(s) registro(s) procesado(s) — Resumen actualizado',
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

    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_CONFIG);

    // Si no existe la hoja de Configuración, crearla automáticamente con los defaults
    if (!sheet) {
      Logger.log('Hoja de configuración no encontrada. Creándola automáticamente...');
      crearHojaConfiguracion();
      sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_CONFIG);
    }

    // Leer token; si está vacío en la hoja usar el token por defecto del CONFIG
    const tokenHoja = leerConfigPorEtiqueta(sheet, 'Token KoboToolbox:', null);
    const token = (tokenHoja && tokenHoja.toString().trim() !== '')
      ? tokenHoja.toString().trim()
      : CONFIG.KOBO_TOKEN_DEFAULT;

    const apiUrl = leerConfigPorEtiqueta(sheet, 'URL API KoboToolbox:', CONFIG.KOBO_API_URL);

    if (!token || token.trim() === '') {
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

    // Forzar UTF-8 y eliminar BOM (\uFEFF) que rompe Utilities.parseCsv
    const csvData = response.getContentText('UTF-8').replace(/^\uFEFF/, '');

    if (!csvData || csvData.trim() === '') {
      throw new Error('KoboToolbox devolvió datos vacíos. Verifica que el formulario tenga respuestas.');
    }

    // Log de diagnóstico: primeros 300 caracteres de la respuesta
    Logger.log('Respuesta KoboToolbox (primeros 300 chars): ' + csvData.substring(0, 300));

    // Detectar si la respuesta es HTML o JSON en lugar de CSV
    const inicio = csvData.trim().substring(0, 5).toLowerCase();
    if (inicio.startsWith('<!doc') || inicio.startsWith('<html')) {
      throw new Error('KoboToolbox devolvió una página HTML en lugar de CSV. Verifica que la URL sea correcta y el token tenga acceso a esta exportación.');
    }
    if (inicio.startsWith('{') || inicio.startsWith('[')) {
      throw new Error('KoboToolbox devolvió JSON en lugar de CSV. Verifica que la URL apunte a una exportación CSV (termina en data.csv).');
    }

    // KoboToolbox exporta con punto y coma como separador
    const parsedData = Utilities.parseCsv(csvData, ';');

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
    const colEquipo = encontrarColumna(headers, ['programa', 'departamento', 'equipo', 'team', 'programa_departamento']);
    const colFechaInicio = encontrarColumna(headers, ['fecha_inicio', 'fecha_de_inicio', 'start_date', 'inicio']);
    const colFechaFin = encontrarColumna(headers, ['fecha_finalizacion', 'fecha_de_finalizacion', 'fecha_fin', 'end_date', 'fin']);
    const colDiasSolicitados = encontrarColumna(headers, ['personal solicitado', 'dias_personal', 'days_requested']);

    const ultimaFila = sheet.getLastRow() + 1;
    const fechaProceso = new Date();

    const datosHistorial = registrosNuevos.map(function(registro) {
      const idRegistro = (idIndex >= 0 && registro[idIndex] !== undefined && registro[idIndex] !== '')
        ? registro[idIndex].toString()
        : registro.join('|||');

      const fechaIni = colFechaInicio >= 0 ? (registro[colFechaInicio] || '') : '';
      const fechaFi  = colFechaFin    >= 0 ? (registro[colFechaFin]    || '') : '';
      // Prioridad: campo "Día personal solicitado" (lo que escribió el empleado)
      // Respaldo: calcular por diferencia de fechas si el campo está vacío o es 0
      let diasSolicitados = 0;
      if (colDiasSolicitados >= 0) {
        const valDias = parseInt((registro[colDiasSolicitados] || '0').toString().trim(), 10);
        if (valDias > 0) diasSolicitados = valDias;
      }
      if (diasSolicitados === 0) {
        diasSolicitados = calcularDiasEntreFechas(fechaIni, fechaFi);
      }

      return [
        idRegistro,
        fechaProceso,
        extraerNombreDeFila(headers, registro) || 'Sin nombre',
        colEquipo >= 0 ? (registro[colEquipo] || 'Sin equipo') : 'Sin equipo',
        fechaIni,
        fechaFi,
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
 * Procesa los datos CSV de KoboToolbox según la estructura real del formulario.
 * Incluye TODOS los empleados de la plantilla (aunque no hayan tomado días)
 * y separa los días por semestre (S1: Ene–Jun = 7 días, S2: Jul–Dic = 8 días).
 */

/**
 * Devuelve los días máximos (total, s1, s2) para un equipo dado.
 * Si el equipo tiene una configuración especial en DIAS_POR_EQUIPO la usa;
 * de lo contrario devuelve los valores globales de CONFIG.
 */
function getDiasEquipo(equipo) {
  const equipoNorm = (equipo || '').toString().trim().toLowerCase();
  const especial = Object.keys(CONFIG.DIAS_POR_EQUIPO).find(function(k) {
    return k.toLowerCase() === equipoNorm;
  });
  if (especial) return CONFIG.DIAS_POR_EQUIPO[especial];
  return { total: CONFIG.DIAS_TOTALES, s1: CONFIG.DIAS_SEMESTRE_1, s2: CONFIG.DIAS_SEMESTRE_2 };
}

function procesarDatos(datosCSV) {
  try {
    Logger.log('Procesando datos...');

    if (!datosCSV || datosCSV.length === 0) {
      throw new Error('No hay datos para procesar');
    }

    const headers = datosCSV[0];
    const datos = datosCSV.slice(1);

    escribirDatosKobo(datosCSV);

    const colEquipo        = encontrarColumna(headers, ['programa', 'departamento', 'equipo', 'team', 'programa_departamento']);
    const colFechaInicio   = encontrarColumna(headers, ['fecha_inicio', 'fecha_de_inicio', 'start_date', 'inicio']);
    const colFechaFin      = encontrarColumna(headers, ['fecha_finalizacion', 'fecha_de_finalizacion', 'fecha_fin', 'end_date', 'fin']);
    const colReglamento    = encontrarColumna(headers, ['reglamento', 'conoces_reglamento', 'conoce_reglamento']);
    const colConsentimiento= encontrarColumna(headers, ['consentimiento', 'consentimiento_director', 'director_consent']);
    const colDiasSolicitados = encontrarColumna(headers, ['personal solicitado', 'dias_personal', 'days_requested']);

    Logger.log('Columnas - Equipo:' + colEquipo + ' FechaInicio:' + colFechaInicio + ' FechaFin:' + colFechaFin);

    const mapeoDirectores = obtenerMapeoDirectores();
    const plantilla       = obtenerPlantillaEmpleados();

    // Inicializar mapa con TODOS los empleados de la plantilla (días en 0)
    const empleadosMap = new Map();
    plantilla.forEach(function(emp) {
      const infoDir = buscarDirectorPorEquipo(mapeoDirectores, emp.equipo) || { nombre: 'Sin asignar', correo: '' };
      empleadosMap.set(emp.nombre, {
        nombre:         emp.nombre,
        equipo:         emp.equipo,
        director:       infoDir.nombre,
        correoDirector: infoDir.correo,
        correoEmpleado: emp.correo || CONFIG.CORREOS_EMPLEADOS[emp.nombre] || '',
        diasTomadosS1:  0,
        diasTomadosS2:  0,
        solicitudes:    []
      });
    });

    // Acumular solicitudes del CSV
    datos.forEach(function(fila) {
      if (!fila || fila.every(function(c) { return c === '' || c === null || c === undefined; })) return;

      const nombre        = extraerNombreDeFila(headers, fila) || 'Sin nombre';
      const equipo        = (colEquipo >= 0 ? (fila[colEquipo] || '') : '').toString().trim() || 'Sin equipo';
      const fechaInicio   = (colFechaInicio >= 0 ? (fila[colFechaInicio] || '') : '').toString().trim();
      const fechaFin      = (colFechaFin    >= 0 ? (fila[colFechaFin]    || '') : '').toString().trim();
      const conoceReglamento    = (colReglamento     >= 0 ? (fila[colReglamento]     || 'No especificado') : 'No especificado').toString().trim();
      const tieneConsentimiento = (colConsentimiento >= 0 ? (fila[colConsentimiento] || 'No especificado') : 'No especificado').toString().trim();

      // Prioridad: campo "Día personal solicitado" (lo que escribió el empleado)
      // Respaldo: calcular por diferencia de fechas si el campo está vacío o es 0
      let diasSolicitados = 0;
      if (colDiasSolicitados >= 0) {
        const valDias = parseInt((fila[colDiasSolicitados] || '0').toString().trim(), 10);
        if (valDias > 0) diasSolicitados = valDias;
      }
      if (diasSolicitados === 0) {
        diasSolicitados = calcularDiasEntreFechas(fechaInicio, fechaFin);
      }

      // Si el empleado no está en la plantilla, agregarlo igualmente
      if (!empleadosMap.has(nombre)) {
        const infoDir = buscarDirectorPorEquipo(mapeoDirectores, equipo) || { nombre: 'Sin asignar', correo: '' };
        empleadosMap.set(nombre, {
          nombre:         nombre,
          equipo:         equipo,
          director:       infoDir.nombre,
          correoDirector: infoDir.correo,
          correoEmpleado: CONFIG.CORREOS_EMPLEADOS[nombre] || '',
          diasTomadosS1:  0,
          diasTomadosS2:  0,
          solicitudes:    []
        });
      }

      const emp = empleadosMap.get(nombre);
      const semestre = getSemestre(fechaInicio);
      if (semestre === 1) {
        emp.diasTomadosS1 += diasSolicitados;
      } else {
        emp.diasTomadosS2 += diasSolicitados;
      }
      // Si el CSV tiene el equipo real y la plantilla lo dejó vacío, actualizarlo
      if (!emp.equipo || emp.equipo === '') {
        emp.equipo = equipo;
        const infoDir = buscarDirectorPorEquipo(mapeoDirectores, equipo) || { nombre: 'Sin asignar', correo: '' };
        emp.director       = infoDir.nombre;
        emp.correoDirector = infoDir.correo;
      }
      emp.solicitudes.push({
        fechaInicio:         fechaInicio,
        fechaFin:            fechaFin,
        dias:                diasSolicitados,
        semestre:            semestre,
        conoceReglamento:    conoceReglamento,
        tieneConsentimiento: tieneConsentimiento
      });
    });

    // Calcular totales y días restantes
    const datosProcessados = Array.from(empleadosMap.values()).map(function(emp) {
      const diasTomadosTotal = emp.diasTomadosS1 + emp.diasTomadosS2;
      const maxDias = getDiasEquipo(emp.equipo);
      return {
        nombre:          emp.nombre,
        equipo:          emp.equipo,
        director:        emp.director,
        correoDirector:  emp.correoDirector,
        correoEmpleado:  emp.correoEmpleado,
        diasTomadosS1:   emp.diasTomadosS1,
        diasTomadosS2:   emp.diasTomadosS2,
        diasTomados:     diasTomadosTotal,
        diasRestantesS1: Math.max(0, maxDias.s1 - emp.diasTomadosS1),
        diasRestantesS2: Math.max(0, maxDias.s2 - emp.diasTomadosS2),
        diasRestantes:   Math.max(0, maxDias.total - diasTomadosTotal),
        diasMaximos:     maxDias.total,
        porcentajeUsado: (diasTomadosTotal / maxDias.total * 100).toFixed(1),
        solicitudes:     emp.solicitudes,
        totalSolicitudes: emp.solicitudes.length
      };
    });

    Logger.log('Datos procesados: ' + datosProcessados.length + ' empleados (plantilla completa)');
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
 * Devuelve 1 (Ene–Jun) o 2 (Jul–Dic) según la fecha de inicio
 */
function getSemestre(fechaStr) {
  if (!fechaStr || fechaStr.toString().trim() === '') return 1;
  var d = new Date(fechaStr);
  if (isNaN(d.getTime())) return 1;
  return d.getMonth() < 6 ? 1 : 2;
}

/**
 * Crea/actualiza la hoja "Plantilla de Empleados" con la nómina completa.
 * El usuario puede editar equipos y correos directamente en esa hoja.
 */
function crearHojaPlantillaEmpleados() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_PLANTILLA);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME_PLANTILLA);
  }

  sheet.clear();

  sheet.getRange('A1').setValue('PLANTILLA DE EMPLEADOS')
    .setFontSize(14).setFontWeight('bold')
    .setBackground('#0f9d58').setFontColor('#ffffff');
  sheet.getRange('A1:C1').merge();

  sheet.getRange('A2').setValue('Completa la columna "Equipo" para cada empleado. El sistema la usa para el Resumen y correos.')
    .setFontStyle('italic').setFontColor('#555555');
  sheet.getRange('A2:C2').merge();

  var headers = ['Nombre Completo', 'Equipo / Programa', 'Correo'];
  sheet.getRange(3, 1, 1, 3)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#e8f0fe');

  // Lista completa de empleados con equipos conocidos pre-cargados
  var empleadosConocidos = [
    // Gestión de Impacto (4)
    ['Eneko Arberas García',                       'Gestión de Impacto',        'eneko@creamosguatemala.org'],
    ['Gedaias Alexander Ajú Suquén',               'Gestión de Impacto',        'alexander@creamosguatemala.org'],
    ['Adrián Antonio Torres Flores',               'Gestión de Impacto',        'adrian@creamosguatemala.org'],
    ['Sebastian Stephen Villegas Strange',         'Gestión de Impacto',        'sebastian@creamosguatemala.org'],
    // Apoyo emocional (4)
    ['Iris Melissa Payes Argueta',                 'Apoyo emocional',           'melissa@creamosguatemala.org'],
    ['Diana Michelle Pérez Vaides',                'Apoyo emocional',           'diana@creamosguatemala.org'],
    ['Gerber Josué Álvarez',                       'Apoyo emocional',           'gerber@creamosguatemala.org'],
    ['Estela Karina Oscal Pixtun',                 'Apoyo emocional',           'karina@creamosguatemala.org'],
    // Operaciones (4)
    ['Alejandro Renato Valdéz Álvarez',            'Operaciones',               'renato@creamosguatemala.org'],
    ['Maritza Carolina Pérez López',               'Operaciones',               'maritza@creamosguatemala.org'],
    ['Yhenifer Yaneth Aguilar Rodríguez de Pérez', 'Operaciones',               'yhenifer@creamosguatemala.org'],
    ['Juan Josué Alvarado Caxaj',                  'Operaciones',               'josue@creamosguatemala.org'],
    // mi-eelo (4)
    ['Stephany Tatiana Fuentes Rodríguez',         'mi-eelo',                   'stephany@creamosguatemala.org'],
    ['Jansel Abel Ojeda Posadas',                  'mi-eelo',                   'jansel@creamosguatemala.org'],
    ['Eustolia Beatriz González Gómez',            'mi-eelo',                   'beatriz@creamosguatemala.org'],
    ['Irma Jeaneth García',                        'mi-eelo',                   'irma@creamosguatemala.org'],
    // Educación (5)
    ['Carmen Rossana Boche Noriega',               'Educación',                 'rossana@creamosguatemala.org'],
    ['Mildred Alejandra Molina Valiente',          'Educación',                 'mildred@creamosguatemala.org'],
    ['Yenifer Pamela Mejía de la Cruz',            'Educación',                 'pamela@creamosguatemala.org'],
    ['Liliana Román',                              'Educación',                 'lily@creamosguatemala.org'],
    ['Abraham Jose David Marcos Bámaca Nij',       'Educación',                 'abraham@creamosguatemala.org'],
    // Inclusión Laboral (4)
    ['Laura Alejandra Castañeda Leal',             'Inclusión Laboral',         'alejandra@creamosguatemala.org'],
    ['Eva Priscila López Xaper',                   'Inclusión Laboral',         'eva@creamosguatemala.org'],
    ['Sindy Lucero Sánchez Barrientos',            'Inclusión Laboral',         'sindy@creamosguatemala.org'],
    ['Paola Lisbeth Ortiz Ramírez',                'Inclusión Laboral',         'paola@creamosguatemala.org'],
    // Centro de cuidado infantil (2)
    ['Jacqueline Paola Tello',                     'Centro de cuidado infantil','jacqueline@creamosguatemala.org'],
    ['Bruna España Bernal',                        'Centro de cuidado infantil','bruna@creamosguatemala.org'],
    // Administración (1)
    ['Carmen Lucía Carías González de Zacher',     'Administración',            'carmen@creamosguatemala.org']
  ];

  var filasDatos = empleadosConocidos;

  sheet.getRange(4, 1, filasDatos.length, 3).setValues(filasDatos);

  // Resaltar filas sin equipo asignado
  for (var i = 0; i < filasDatos.length; i++) {
    if (!filasDatos[i][1] || filasDatos[i][1].toString().trim() === '') {
      sheet.getRange(4 + i, 1, 1, 3).setBackground('#fff3cd');
    }
  }

  for (var j = 1; j <= 3; j++) sheet.autoResizeColumn(j);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Plantilla creada. Verifica que todos los equipos sean correctos.',
    'Plantilla de Empleados', 7
  );
  Logger.log('Hoja Plantilla de Empleados creada/actualizada');
}

/**
 * Lee la hoja "Plantilla de Empleados" y retorna array de {nombre, equipo, correo}
 */
function obtenerPlantillaEmpleados() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_PLANTILLA);

    if (!sheet || sheet.getLastRow() <= 3) {
      Logger.log('Plantilla de empleados vacía o no existe. Creándola...');
      crearHojaPlantillaEmpleados();
      sheet = ss.getSheetByName(CONFIG.SHEET_NAME_PLANTILLA);
    }

    var ultimaFila = sheet.getLastRow();
    if (ultimaFila <= 3) return [];

    var datos = sheet.getRange(4, 1, ultimaFila - 3, 3).getValues();
    var lista = [];
    datos.forEach(function(fila) {
      var nombre = fila[0] ? fila[0].toString().trim() : '';
      if (nombre === '') return;
      lista.push({
        nombre: nombre,
        equipo: fila[1] ? fila[1].toString().trim() : '',
        correo: fila[2] ? fila[2].toString().trim() : ''
      });
    });

    Logger.log('Plantilla cargada: ' + lista.length + ' empleados');
    return lista;

  } catch (e) {
    Logger.log('Error en obtenerPlantillaEmpleados: ' + e.message);
    return [];
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
  Logger.log('Columna no encontrada para: ' + palabrasClave.join(', ') + '. Retornando -1 (no disponible).');
  return -1;
}

/**
 * Normaliza texto para comparación: minúsculas, sin acentos, sin espacios extras.
 */
function normalizarTexto(texto) {
  return texto.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim();
}

/**
 * Busca el director de un equipo usando comparación normalizada (ignora acentos y mayúsculas).
 * Necesario porque el CSV puede tener "Gestion de Impacto" mientras el config tiene "Gestión de Impacto".
 */
function buscarDirectorPorEquipo(mapeoDirectores, equipo) {
  if (!equipo) return null;
  if (mapeoDirectores[equipo]) return mapeoDirectores[equipo];
  var equipoNorm = normalizarTexto(equipo);
  for (var key in mapeoDirectores) {
    if (normalizarTexto(key) === equipoNorm) return mapeoDirectores[key];
  }
  return null;
}

/**
 * Extrae el nombre del empleado de las columnas de departamento del formulario.
 * El formulario KoboToolbox tiene una columna por cada equipo; el nombre del empleado
 * aparece en la columna de su equipo (el resto quedan vacías).
 * Como respaldo usa _submitted_by (username de KoboToolbox).
 */
function extraerNombreDeFila(headers, fila) {
  var clavesEquipos = [
    'inclusión laboral', 'inclusion laboral',
    'centro de cuidado',
    'apoyo emocional', 'apoyo emocinal',
    'operaciones',
    'mi-eelo',
    'gestión de impacto', 'gestion de impacto',
    'educación', 'educacion',
    'administración', 'administracion'
  ];
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i].toString().toLowerCase().trim();
    for (var j = 0; j < clavesEquipos.length; j++) {
      if (header.includes(clavesEquipos[j])) {
        var val = (fila[i] || '').toString().trim();
        if (val !== '') return val;
        break; // columna encontrada pero vacía, pasar a la siguiente
      }
    }
  }
  // Respaldo: _submitted_by de KoboToolbox
  var idxUser = encontrarColumna(headers, ['_submitted_by', 'submitted_by', 'username']);
  if (idxUser >= 0) {
    var valUser = (fila[idxUser] || '').toString().trim();
    if (valUser !== '') return valUser;
  }
  return '';
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
    // 10 columnas: Nombre, Equipo, Director, S1 Tomados, S1 Restantes, S2 Tomados, S2 Restantes, Total Tomados, Total Restantes, % Usado
    const headersPorPersona = [
      'Nombre', 'Equipo', 'Director',
      'S1 Tomados\n(de 7)', 'S1 Restantes', 'S2 Tomados\n(de 8)', 'S2 Restantes',
      'Total Tomados\n(de 15)', 'Total Restantes', '% Usado'
    ];
    sheet.getRange(row, 1, 1, headersPorPersona.length)
      .setValues([headersPorPersona])
      .setFontWeight('bold')
      .setBackground('#e8f0fe')
      .setWrap(true);
    sheet.setRowHeight(row, 40);

    row++;
    const startRowPersonas = row;
    const datosPersonas = resumen.datosCompletos
      .sort(function(a, b) {
        // Ordenar por equipo, luego por días tomados desc
        if (a.equipo < b.equipo) return -1;
        if (a.equipo > b.equipo) return 1;
        return b.diasTomados - a.diasTomados;
      })
      .map(function(p) {
        return [
          p.nombre,
          p.equipo || '',
          p.director || '',
          p.diasTomadosS1  || 0,
          p.diasRestantesS1 != null ? p.diasRestantesS1 : CONFIG.DIAS_SEMESTRE_1,
          p.diasTomadosS2  || 0,
          p.diasRestantesS2 != null ? p.diasRestantesS2 : CONFIG.DIAS_SEMESTRE_2,
          p.diasTomados    || 0,
          p.diasRestantes  != null ? p.diasRestantes  : CONFIG.DIAS_TOTALES,
          parseFloat(p.porcentajeUsado || 0) + '%'
        ];
      });

    if (datosPersonas.length > 0) {
      sheet.getRange(row, 1, datosPersonas.length, headersPorPersona.length).setValues(datosPersonas);

      // Formato condicional en "Total Restantes" (columna 9)
      const rangoRestantes = sheet.getRange(startRowPersonas, 9, datosPersonas.length, 1);
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
    sheet.getRange(row, 1, 1, 7).merge();

    row++;
    const headersPorEquipo = ['Equipo', 'Personas', 'S1 Tomados', 'S1 Restantes', 'S2 Tomados', 'S2 Restantes', 'Total Tomados'];
    sheet.getRange(row, 1, 1, headersPorEquipo.length)
      .setValues([headersPorEquipo])
      .setFontWeight('bold')
      .setBackground('#e8f0fe');

    row++;
    const datosEquipos = resumen.porEquipo.map(function(e) {
      const totalS1Tom = e.personas.reduce(function(s,p) { return s + (p.diasTomadosS1 || 0); }, 0);
      const totalS1Res = e.personas.reduce(function(s,p) { return s + (p.diasRestantesS1 != null ? p.diasRestantesS1 : CONFIG.DIAS_SEMESTRE_1); }, 0);
      const totalS2Tom = e.personas.reduce(function(s,p) { return s + (p.diasTomadosS2 || 0); }, 0);
      const totalS2Res = e.personas.reduce(function(s,p) { return s + (p.diasRestantesS2 != null ? p.diasRestantesS2 : CONFIG.DIAS_SEMESTRE_2); }, 0);
      return [
        e.equipo,
        e.totalPersonas,
        totalS1Tom,
        totalS1Res,
        totalS2Tom,
        totalS2Res,
        e.totalDiasTomados
      ];
    });

    if (datosEquipos.length > 0) {
      sheet.getRange(row, 1, datosEquipos.length, headersPorEquipo.length).setValues(datosEquipos);
    }

    // Auto-ajustar columnas
    for (let i = 1; i <= 10; i++) {
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
 * @param {Array} registrosNuevos  - Filas de registros nuevos
 * @param {Array} headers          - Encabezados del CSV
 * @param {Array} datosProcessados - Resultado de procesarDatos() con saldos actualizados
 */
function enviarNotificacionNuevoRegistro(registrosNuevos, headers, datosProcessados) {
  try {
    if (!registrosNuevos || registrosNuevos.length === 0) return;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_CONFIG);
    if (!sheet) { Logger.log('No existe hoja de configuración. Correo no enviado.'); return; }

    const enviarCorreos = leerConfigPorEtiqueta(sheet, 'Enviar correos (TRUE/FALSE):', false);
    if (!enviarCorreos || enviarCorreos.toString().toLowerCase() !== 'true') {
      Logger.log('Envío de correos deshabilitado');
      return;
    }

    // Construir mapa de saldos para búsqueda rápida
    const saldoMap = {};
    if (datosProcessados) {
      datosProcessados.forEach(function(p) { saldoMap[p.nombre] = p; });
    }

    const colFechaInicio   = encontrarColumna(headers, ['fecha_inicio', 'fecha_de_inicio', 'start_date', 'inicio']);
    const colFechaFin      = encontrarColumna(headers, ['fecha_finalizacion', 'fecha_de_finalizacion', 'fecha_fin', 'end_date', 'fin']);
    const colDiasSolicitados = encontrarColumna(headers, ['personal solicitado', 'dias_personal', 'days_requested']);
    const colEquipo        = encontrarColumna(headers, ['programa', 'departamento', 'equipo', 'team', 'programa_departamento']);
    const mapeoDirectores  = obtenerMapeoDirectores();

    // Procesar cada nuevo registro
    registrosNuevos.forEach(function(reg) {
      const nombreEmpleado = extraerNombreDeFila(headers, reg) || 'Sin nombre';
      const equipoEmpleado = (colEquipo >= 0 ? (reg[colEquipo] || '') : '').toString().trim() || 'Sin equipo';
      const fechaInicio    = colFechaInicio >= 0 ? (reg[colFechaInicio] || 'No especificada') : 'No especificada';
      const fechaFin       = colFechaFin    >= 0 ? (reg[colFechaFin]    || 'No especificada') : 'No especificada';

      // Prioridad: campo "Día personal solicitado"; respaldo: cálculo por fechas
      let diasEstaSolicitud = 0;
      if (colDiasSolicitados >= 0) {
        const v = parseInt((reg[colDiasSolicitados] || '0').toString().trim(), 10);
        if (v > 0) diasEstaSolicitud = v;
      }
      if (diasEstaSolicitud === 0) {
        diasEstaSolicitud = calcularDiasEntreFechas(fechaInicio, fechaFin);
      }

      const saldo        = saldoMap[nombreEmpleado] || null;
      const infoDirector = buscarDirectorPorEquipo(mapeoDirectores, equipoEmpleado) || { nombre: 'Sin asignar', correo: '' };
      const correoDir    = infoDirector.correo;
      const correoEmp    = (saldo && saldo.correoEmpleado) ? saldo.correoEmpleado : (CONFIG.CORREOS_EMPLEADOS[nombreEmpleado] || '');

      // ── Correo al DIRECTOR ────────────────────────────────────────────────
      if (correoDir && correoDir.trim() !== '') {
        try {
          // Compañeros de equipo para el resumen
          const companeros = datosProcessados
            ? datosProcessados.filter(function(p) {
                return normalizarTexto(p.equipo) === normalizarTexto(equipoEmpleado);
              })
            : [];

          const asuntoDir = '[Días Personales] ' + nombreEmpleado + ' tomó ' + diasEstaSolicitud + ' día(s) — ' + equipoEmpleado;
          const cuerpoDir = construirCorreoDirector(nombreEmpleado, equipoEmpleado, fechaInicio, fechaFin, diasEstaSolicitud, saldo, companeros);

          MailApp.sendEmail({ to: correoDir.trim(), subject: asuntoDir, htmlBody: cuerpoDir });
          Logger.log('Correo enviado al director ' + infoDirector.nombre + ' (' + correoDir + ')');
        } catch (errDir) {
          Logger.log('Error enviando correo al director de ' + equipoEmpleado + ': ' + errDir.message);
        }
      } else {
        Logger.log('Director sin correo configurado para equipo: ' + equipoEmpleado);
      }

      // ── Correo al EMPLEADO ────────────────────────────────────────────────
      if (correoEmp && correoEmp.trim() !== '') {
        try {
          const asuntoEmp = '[Días Personales] Tu solicitud fue registrada — quedan ' +
            (saldo ? saldo.diasRestantes : '?') + ' día(s)';
          const cuerpoEmp = construirCorreoEmpleado(nombreEmpleado, fechaInicio, fechaFin, diasEstaSolicitud, saldo);

          MailApp.sendEmail({ to: correoEmp.trim(), subject: asuntoEmp, htmlBody: cuerpoEmp });
          Logger.log('Correo enviado al empleado: ' + correoEmp);
        } catch (errEmp) {
          Logger.log('Error enviando correo al empleado ' + nombreEmpleado + ': ' + errEmp.message);
        }
      } else {
        Logger.log('Sin correo configurado para empleado: ' + nombreEmpleado);
      }
    });

  } catch (error) {
    Logger.log('Error en enviarNotificacionNuevoRegistro: ' + error.message);
  }
}

/**
 * Construye el HTML del correo al DIRECTOR con el detalle del empleado y resumen del equipo.
 */
function construirCorreoDirector(nombre, equipo, fechaIni, fechaFin, diasSolicitud, saldo, companeros) {
  var maxDias = getDiasEquipo(equipo);
  var s1Tom = saldo ? (saldo.diasTomadosS1 || 0) : 0;
  var s1Res = saldo ? (saldo.diasRestantesS1 != null ? saldo.diasRestantesS1 : maxDias.s1) : maxDias.s1;
  var s2Tom = saldo ? (saldo.diasTomadosS2 || 0) : 0;
  var s2Res = saldo ? (saldo.diasRestantesS2 != null ? saldo.diasRestantesS2 : maxDias.s2) : maxDias.s2;
  var totTom = saldo ? (saldo.diasTomados || 0) : diasSolicitud;
  var totRes = saldo ? (saldo.diasRestantes != null ? saldo.diasRestantes : maxDias.total) : maxDias.total;

  // Tabla resumen del equipo
  var filasEquipo = companeros.map(function(p) {
    var resColor = p.diasRestantes < 3 ? '#f4c7c3' : (p.diasRestantes < 7 ? '#fce8b2' : '#b7e1cd');
    return '<tr>' +
      '<td style="padding:6px 10px;">' + p.nombre + (p.nombre === nombre ? ' <b>(esta solicitud)</b>' : '') + '</td>' +
      '<td style="padding:6px 10px;text-align:center;">' + (p.diasRestantesS1 != null ? p.diasRestantesS1 : CONFIG.DIAS_SEMESTRE_1) + '</td>' +
      '<td style="padding:6px 10px;text-align:center;">' + (p.diasRestantesS2 != null ? p.diasRestantesS2 : CONFIG.DIAS_SEMESTRE_2) + '</td>' +
      '<td style="padding:6px 10px;text-align:center;background:' + resColor + ';">' + (p.diasRestantes != null ? p.diasRestantes : CONFIG.DIAS_TOTALES) + '</td>' +
      '</tr>';
  }).join('');

  return '<html><body style="font-family:Arial,sans-serif;color:#333;">' +
    '<div style="background:#0f9d58;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;">' +
    '<h2 style="margin:0;">📅 Nueva solicitud de día personal</h2>' +
    '<p style="margin:4px 0 0;">' + new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) + '</p>' +
    '</div>' +
    '<div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px;">' +

    '<h3 style="color:#0f9d58;">Detalle de la solicitud</h3>' +
    '<table style="border-collapse:collapse;width:100%;max-width:480px;">' +
    '<tr><td style="padding:5px 10px;font-weight:bold;">Empleado:</td><td style="padding:5px 10px;">' + nombre + '</td></tr>' +
    '<tr style="background:#f5f5f5;"><td style="padding:5px 10px;font-weight:bold;">Equipo:</td><td style="padding:5px 10px;">' + equipo + '</td></tr>' +
    '<tr><td style="padding:5px 10px;font-weight:bold;">Fecha inicio:</td><td style="padding:5px 10px;">' + fechaIni + '</td></tr>' +
    '<tr style="background:#f5f5f5;"><td style="padding:5px 10px;font-weight:bold;">Fecha fin:</td><td style="padding:5px 10px;">' + fechaFin + '</td></tr>' +
    '<tr><td style="padding:5px 10px;font-weight:bold;">Días de esta solicitud:</td><td style="padding:5px 10px;"><strong>' + diasSolicitud + '</strong></td></tr>' +
    '</table>' +

    '<h3 style="color:#0f9d58;margin-top:20px;">Saldo actual de ' + nombre + '</h3>' +
    '<table style="border-collapse:collapse;width:100%;max-width:480px;">' +
    '<thead><tr style="background:#0f9d58;color:#fff;">' +
    '<th style="padding:8px 12px;text-align:left;">Período</th>' +
    '<th style="padding:8px 12px;text-align:center;">Asignados</th>' +
    '<th style="padding:8px 12px;text-align:center;">Tomados</th>' +
    '<th style="padding:8px 12px;text-align:center;">Restantes</th>' +
    '</tr></thead><tbody>' +
    '<tr><td style="padding:6px 12px;">Semestre 1 (Ene–Jun)</td>' +
    '<td style="padding:6px 12px;text-align:center;">' + maxDias.s1 + '</td>' +
    '<td style="padding:6px 12px;text-align:center;">' + s1Tom + '</td>' +
    '<td style="padding:6px 12px;text-align:center;background:' + (s1Res < 2 ? '#f4c7c3' : '#b7e1cd') + ';">' + s1Res + '</td></tr>' +
    '<tr style="background:#f5f5f5;"><td style="padding:6px 12px;">Semestre 2 (Jul–Dic)</td>' +
    '<td style="padding:6px 12px;text-align:center;">' + maxDias.s2 + '</td>' +
    '<td style="padding:6px 12px;text-align:center;">' + s2Tom + '</td>' +
    '<td style="padding:6px 12px;text-align:center;background:' + (s2Res < 2 ? '#f4c7c3' : '#b7e1cd') + ';">' + s2Res + '</td></tr>' +
    '<tr style="font-weight:bold;border-top:2px solid #ddd;"><td style="padding:6px 12px;">Total anual</td>' +
    '<td style="padding:6px 12px;text-align:center;">' + maxDias.total + '</td>' +
    '<td style="padding:6px 12px;text-align:center;">' + totTom + '</td>' +
    '<td style="padding:6px 12px;text-align:center;background:' + (totRes < 3 ? '#f4c7c3' : (totRes < 7 ? '#fce8b2' : '#b7e1cd')) + ';">' + totRes + '</td></tr>' +
    '</tbody></table>' +

    (companeros.length > 0 ?
      '<h3 style="color:#0f9d58;margin-top:20px;">Resumen del equipo — ' + equipo + '</h3>' +
      '<table style="border-collapse:collapse;width:100%;max-width:560px;">' +
      '<thead><tr style="background:#0f9d58;color:#fff;">' +
      '<th style="padding:8px 12px;text-align:left;">Nombre</th>' +
      '<th style="padding:8px 12px;text-align:center;">S1 Rest.</th>' +
      '<th style="padding:8px 12px;text-align:center;">S2 Rest.</th>' +
      '<th style="padding:8px 12px;text-align:center;">Total Rest.</th>' +
      '</tr></thead><tbody>' + filasEquipo + '</tbody></table>'
    : '') +

    '<p style="margin-top:24px;">' +
    '<a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '" ' +
    'style="background:#0f9d58;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;">Ver Resumen Completo</a>' +
    '</p>' +
    '<p style="color:#999;font-size:11px;margin-top:24px;">Correo automático — Sistema de Días Personales · Creamos Guatemala · ' + new Date().toLocaleString('es-ES') + '</p>' +
    '</div></body></html>';
}

/**
 * Construye el HTML del correo al EMPLEADO con su saldo por semestre.
 */
function construirCorreoEmpleado(nombre, fechaIni, fechaFin, diasSolicitud, saldo) {
  var maxDias = getDiasEquipo(saldo ? saldo.equipo : '');
  var s1Tom = saldo ? (saldo.diasTomadosS1 || 0) : 0;
  var s1Res = saldo ? (saldo.diasRestantesS1 != null ? saldo.diasRestantesS1 : maxDias.s1) : maxDias.s1;
  var s2Tom = saldo ? (saldo.diasTomadosS2 || 0) : 0;
  var s2Res = saldo ? (saldo.diasRestantesS2 != null ? saldo.diasRestantesS2 : maxDias.s2) : maxDias.s2;
  var totTom = saldo ? (saldo.diasTomados || 0) : diasSolicitud;
  var totRes = saldo ? (saldo.diasRestantes != null ? saldo.diasRestantes : maxDias.total) : maxDias.total;

  return '<html><body style="font-family:Arial,sans-serif;color:#333;">' +
    '<div style="background:#4285f4;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;">' +
    '<h2 style="margin:0;">📅 Tus días personales — Creamos Guatemala</h2>' +
    '</div>' +
    '<div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px;">' +
    '<p>Hola <strong>' + nombre + '</strong>,</p>' +
    '<p>Tu solicitud de días personales ha sido <strong>registrada correctamente</strong>.</p>' +

    '<table style="border-collapse:collapse;width:100%;max-width:400px;margin-bottom:20px;">' +
    '<tr><td style="padding:5px 10px;font-weight:bold;">Fecha inicio:</td><td style="padding:5px 10px;">' + fechaIni + '</td></tr>' +
    '<tr style="background:#f5f5f5;"><td style="padding:5px 10px;font-weight:bold;">Fecha fin:</td><td style="padding:5px 10px;">' + fechaFin + '</td></tr>' +
    '<tr><td style="padding:5px 10px;font-weight:bold;">Días de esta solicitud:</td><td style="padding:5px 10px;"><strong>' + diasSolicitud + '</strong></td></tr>' +
    '</table>' +

    '<h3 style="color:#4285f4;">Tu saldo de días personales</h3>' +
    '<table style="border-collapse:collapse;width:100%;max-width:480px;">' +
    '<thead><tr style="background:#4285f4;color:#fff;">' +
    '<th style="padding:8px 12px;text-align:left;">Período</th>' +
    '<th style="padding:8px 12px;text-align:center;">Asignados</th>' +
    '<th style="padding:8px 12px;text-align:center;">Tomados</th>' +
    '<th style="padding:8px 12px;text-align:center;">Restantes</th>' +
    '</tr></thead><tbody>' +
    '<tr><td style="padding:6px 12px;">Semestre 1 (Ene–Jun)</td>' +
    '<td style="padding:6px 12px;text-align:center;">' + maxDias.s1 + '</td>' +
    '<td style="padding:6px 12px;text-align:center;">' + s1Tom + '</td>' +
    '<td style="padding:6px 12px;text-align:center;background:' + (s1Res < 2 ? '#f4c7c3' : '#b7e1cd') + ';">' + s1Res + '</td></tr>' +
    '<tr style="background:#f5f5f5;"><td style="padding:6px 12px;">Semestre 2 (Jul–Dic)</td>' +
    '<td style="padding:6px 12px;text-align:center;">' + maxDias.s2 + '</td>' +
    '<td style="padding:6px 12px;text-align:center;">' + s2Tom + '</td>' +
    '<td style="padding:6px 12px;text-align:center;background:' + (s2Res < 2 ? '#f4c7c3' : '#b7e1cd') + ';">' + s2Res + '</td></tr>' +
    '<tr style="font-weight:bold;border-top:2px solid #ddd;"><td style="padding:6px 12px;">Total anual</td>' +
    '<td style="padding:6px 12px;text-align:center;">' + maxDias.total + '</td>' +
    '<td style="padding:6px 12px;text-align:center;">' + totTom + '</td>' +
    '<td style="padding:6px 12px;text-align:center;background:' + (totRes < 3 ? '#f4c7c3' : (totRes < 7 ? '#fce8b2' : '#b7e1cd')) + ';">' + totRes + '</td></tr>' +
    '</tbody></table>' +

    '<p style="margin-top:16px;">Para cualquier consulta, responde este correo o contacta a tu director directo.</p>' +
    '<p style="color:#999;font-size:11px;margin-top:24px;">Correo automático — Sistema de Días Personales · Creamos Guatemala · ' + new Date().toLocaleString('es-ES') + '</p>' +
    '</div></body></html>';
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
    ['7. Menú > "Configurar Trigger Automático" para ejecutar el sistema cada 1 minuto', ''],
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
      .addItem('🚀 Instalar Todo (1 clic)', 'instalarTodo')
      .addSeparator()
      .addItem('▶ Actualizar Datos Manualmente', 'ejecutarSistema')
      .addItem('🔄 Actualizar Lista de Empleados', 'actualizarEmpleados')
      .addSeparator()
      .addItem('⚙ Crear/Actualizar Configuración', 'crearHojaConfiguracion')
      .addItem('👥 Configurar Directores', 'crearHojaDirectores')
      .addItem('👤 Configurar Plantilla de Empleados', 'crearHojaPlantillaEmpleados')
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
 * Actualiza únicamente la lista de empleados (nombre, equipo, correo)
 * sin tocar ninguna otra hoja ni configuración del sistema.
 */
function actualizarEmpleados() {
  crearHojaPlantillaEmpleados();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    '✅ Lista de empleados actualizada correctamente.',
    'Actualizar Empleados', 5
  );
}

/**
 * Instala y configura el sistema completo en un solo clic, sin ningún paso manual.
 *
 * Pasos que realiza automáticamente:
 *   1. Recrea todas las hojas del sistema
 *   2. Rellena el token de KoboToolbox y el correo de administrador desde CONFIG
 *   3. Activa el envío de correos
 *   4. Carga los directores y la plantilla de empleados
 *   5. Configura el trigger automático (cada 1 minuto)
 *   6. Ejecuta la primera sincronización de datos
 */
function instalarTodo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const toast = function(msg) { ss.toast(msg, 'Instalación', 10); };

  try {
    toast('Paso 1/6 — Preparando hojas...');

    // ── 1. Crear hoja temporal si todas las hojas son del sistema ────────────
    // El Historial NO se borra para evitar reenviar correos de solicitudes antiguas
    const hojasABorrar = [
      CONFIG.SHEET_NAME_CONFIG, CONFIG.SHEET_NAME_DIRECTORES,
      CONFIG.SHEET_NAME_PLANTILLA, CONFIG.SHEET_NAME_DATOS,
      CONFIG.SHEET_NAME_RESUMEN
    ];
    const hojasDelSistema = hojasABorrar.concat([CONFIG.SHEET_NAME_HISTORIAL]);
    const todasLasHojas = ss.getSheets();
    const hojasExternas = todasLasHojas.filter(function(h) {
      return hojasDelSistema.indexOf(h.getName()) === -1;
    });
    let hojaTemporal = null;
    if (hojasExternas.length === 0) {
      hojaTemporal = ss.insertSheet('_temporal_');
    }

    // Eliminar hojas del sistema para empezar limpio (excepto Historial)
    hojasABorrar.forEach(function(nombre) {
      const hoja = ss.getSheetByName(nombre);
      if (hoja) ss.deleteSheet(hoja);
    });

    // ── 2. Eliminar triggers anteriores ──────────────────────────────────────
    ScriptApp.getProjectTriggers().forEach(function(t) {
      if (t.getHandlerFunction() === 'ejecutarAutomatico') ScriptApp.deleteTrigger(t);
    });

    // ── 3. Crear hoja de Configuración y rellenar valores automáticamente ────
    toast('Paso 2/6 — Creando configuración...');
    crearHojaConfiguracion();

    const sheetConfig = ss.getSheetByName(CONFIG.SHEET_NAME_CONFIG);
    if (sheetConfig) {
      // Fila 3: Token KoboToolbox
      sheetConfig.getRange('B3').setValue(CONFIG.KOBO_TOKEN_DEFAULT);
      // Fila 6: Activar envío de correos
      sheetConfig.getRange('B6').setValue('TRUE');
      // Fila 7: Correo del administrador
      sheetConfig.getRange('B7').setValue(CONFIG.ADMIN_EMAIL_DEFAULT);
    }

    // ── 4. Crear hojas de Directores y Plantilla de Empleados ────────────────
    toast('Paso 3/6 — Configurando directores y empleados...');
    crearHojaDirectores();
    crearHojaPlantillaEmpleados();

    // ── 5. Crear hojas vacías para Datos, Resumen e Historial ────────────────
    [CONFIG.SHEET_NAME_DATOS, CONFIG.SHEET_NAME_RESUMEN, CONFIG.SHEET_NAME_HISTORIAL].forEach(function(nombre) {
      if (!ss.getSheetByName(nombre)) ss.insertSheet(nombre);
    });

    // Eliminar hoja temporal si se creó
    if (hojaTemporal) ss.deleteSheet(hojaTemporal);

    // ── 6. Configurar trigger automático (cada 1 minuto) ─────────────────────
    toast('Paso 4/6 — Activando trigger automático...');
    ScriptApp.newTrigger('ejecutarAutomatico')
      .timeBased()
      .everyMinutes(1)
      .create();

    // ── 7. Primera sincronización de datos ───────────────────────────────────
    toast('Paso 5/6 — Sincronizando datos con KoboToolbox...');
    ejecutarSistema();

    // ── 8. Activar la hoja Resumen para que el usuario la vea ────────────────
    toast('Paso 6/6 — Listo.');
    const hojaResumen = ss.getSheetByName(CONFIG.SHEET_NAME_RESUMEN);
    if (hojaResumen) ss.setActiveSheet(hojaResumen);

    Logger.log('instalarTodo completado exitosamente');
    ss.toast('Sistema instalado y funcionando. El trigger revisa datos cada 1 minuto.', '✅ Instalación completa', 15);

  } catch (error) {
    Logger.log('Error en instalarTodo: ' + error.message);
    SpreadsheetApp.getUi().alert(
      'Error durante la instalación',
      'Ocurrió un error: ' + error.message + '\n\nRevisa el log en Extensiones > Apps Script > Registros.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
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
    '  • ' + CONFIG.SHEET_NAME_RESUMEN + '\n\n' +
    '✅ El Historial de correos enviados se conservará para no reenviar notificaciones.\n\n' +
    '¿Deseas continuar?',
    '¿Deseas continuar?',
    ui.ButtonSet.YES_NO
  );

  if (confirmacion !== ui.Button.YES) {
    ui.alert('Reinstalación cancelada.', '', ui.ButtonSet.OK);
    return;
  }

  const ss2 = SpreadsheetApp.getActiveSpreadsheet();

  try {
    // ── PASO 1: Eliminar hojas del sistema (excepto Historial para no reenviar correos) ────
    const hojasASistema = [
      CONFIG.SHEET_NAME_CONFIG,
      CONFIG.SHEET_NAME_DIRECTORES,
      CONFIG.SHEET_NAME_PLANTILLA,
      CONFIG.SHEET_NAME_DATOS,
      CONFIG.SHEET_NAME_RESUMEN
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

    // ── PASO 4: Recrear hoja de Directores y Plantilla de Empleados ──────────
    crearHojaDirectores();
    crearHojaPlantillaEmpleados();

    // ── PASO 5: Crear hojas vacías para Datos y Resumen (Historial se conserva) ─────────
    [CONFIG.SHEET_NAME_DATOS, CONFIG.SHEET_NAME_RESUMEN].forEach(function(nombre) {
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
      .everyMinutes(1)
      .create();
    Logger.log('Trigger automático configurado (cada 1 minuto)');

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
      'El trigger automático ya está activo (cada 1 minuto).',
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
 * Configura el trigger automático para ejecutar el sistema cada 1 minuto
 */
function configurarTriggerAutomatico() {
  const ui = SpreadsheetApp.getUi();

  const respuesta = ui.alert(
    'Configurar Ejecución Automática',
    '¿Deseas que el sistema verifique nuevos registros automáticamente cada 1 minuto?\n\n' +
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

    // Crear nuevo trigger cada 1 minuto
    ScriptApp.newTrigger('ejecutarAutomatico')
      .timeBased()
      .everyMinutes(1)
      .create();

    ui.alert(
      'Trigger Configurado',
      'El sistema verificará nuevos registros cada 1 minuto automáticamente.\n\n' +
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
    '<li>Menú > <strong>Configurar Trigger Automático</strong> para activar la ejecución cada 1 minuto</li>' +
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
    '<li>Ejecución automática cada 1 minuto</li>' +
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
