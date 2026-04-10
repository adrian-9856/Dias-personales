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

/**
 * DIRECTORAS DE PROGRAMAS
 * Solo ESTAS 3 personas deben enviar copia a Stephany cuando tomen días personales.
 * Trabajadores normales NO envían copia a Stephany.
 */
const DIRECTORAS_DE_PROGRAMAS = [
  'Iris Melissa Payes Argueta',      // Apoyo emocional
  'Carmen Rossana Boche Noriega',    // Educación
  'Laura Alejandra Castañeda Leal'   // Inclusión Laboral
];

/**
 * MAPEO DE DIRECTORES A SUS SUPERVISORES
 * Cuando un director toma días personales, se envía copia a su supervisor.
 */
const SUPERVISORES = {
  // Supervisadas por Stephany (Directoras de Programas)
  'Iris Melissa Payes Argueta': 'stephany@creamosguatemala.org',
  'Carmen Rossana Boche Noriega': 'stephany@creamosguatemala.org',
  'Laura Alejandra Castañeda Leal': 'stephany@creamosguatemala.org',

  // Supervisado por Félix
  'Alejandro Renato Valdéz Álvarez': 'felix@creamosguatemala.org',

  // Supervisados por Hannah
  'Eneko Arberas García': 'hannah@creamosguatemala.org',
  'Carmen Lucía Carías González de Zacher': 'hannah@creamosguatemala.org',
  'Stephany Tatiana Fuentes Rodríguez': 'hannah@creamosguatemala.org'
};

const CONFIG = {
  KOBO_API_URL: 'https://kf.kobotoolbox.org/api/v2/assets/aDmwMtoy4r65YTNSt4sURS/export-settings/esZcQDf2L5CTmiFETsXyKYZ/data.csv',
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
  // NOTA: El correo es quien RECIBE las notificaciones (puede ser diferente del director del equipo)
  // Directores por equipo: A QUIÉN se envía el correo cuando alguien del equipo toma días
  // IMPORTANTE: El correo es del DIRECTOR del equipo (quien debe ser notificado)
  DIRECTORES_DEFAULT: {
    'Apoyo emocional':           { nombre: 'Iris Melissa Payes Argueta',               correo: 'melissa@creamosguatemala.org' },
    'Apoyo emocinal':            { nombre: 'Iris Melissa Payes Agueta',               correo: 'melissa@creamosguatemala.org' },
    'Operaciones':               { nombre: 'Alejandro Renato Valdéz Álvarez',          correo: 'renato@creamosguatemala.org' },
    'mi-eelo':                   { nombre: 'Stephany Tatiana Fuentes Rodríguez',       correo: 'stephany@creamosguatemala.org' },
    'Gestión de Impacto':        { nombre: 'Eneko Arberas García',                     correo: 'eneko@creamosguatemala.org' },
    'Educación':                 { nombre: 'Carmen Rossana Boche Noriega',             correo: 'rossana@creamosguatemala.org' },
    'Centro de cuidado infantil':{ nombre: 'Carmen Lucía Carías González de Zacher',   correo: 'carmen@creamosguatemala.org' },
    'Administración':            { nombre: 'Carmen Lucía Carías González de Zacher',   correo: 'carmen@creamosguatemala.org' },
    'Inclusión Laboral':         { nombre: 'Laura Alejandra Castañeda Leal',           correo: 'alejandra@creamosguatemala.org' }
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
    'Celeste Alejandra del Rosario García Cárdenas': 'celeste@creamosguatemala.org',
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
    'Sharon Pamela Samayoa Rodriguez':            'pamelasamayoa@creamosguatemala.org',
    // Centro de cuidado infantil
    'Jacqueline Paola Tello':                     'jacqueline@creamosguatemala.org',
    'Bruna España Bernal':                        'bruna@creamosguatemala.org',
    // Administración
    'Carmen Lucía Carías González de Zacher':     'carmen@creamosguatemala.org'
    // Nota: Hannah no aparece aquí porque es SUPERVISORA, no empleada
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
    // Solo enviar correo si es un error real (token, URL, etc.), NO por caídas temporales del servidor
    if (!error.esErrorServidor) {
      enviarCorreoError(error);
    }
  }
}

/**
 * Función de ejecución automática (se llama desde el trigger)
 */
function ejecutarAutomatico() {
  ejecutarSistema();
}

/**
 * EJECUTAR UNA VEZ: Limpia el historial eliminando entradas duplicadas.
 * Mantiene solo un registro por persona+fecha, priorizando los que tienen nombre real
 * (descarta los "Sin nombre") y los que tienen ID numérico.
 */
function LIMPIAR_HISTORIAL_DUPLICADOS() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_HISTORIAL);
  if (!sheet || sheet.getLastRow() <= 1) {
    ss.toast('Historial vacío, nada que limpiar.', 'Info', 5);
    return;
  }

  var lastRow = sheet.getLastRow();
  var datos = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  var vistos = {}; // clave: nombre+fechaInicio → fila ganadora
  var filasMantener = [];

  // Primera pasada: por cada combinación nombre+fechaInicio, quedarse con la mejor entrada
  // Preferencia: tiene nombre real > tiene ID numérico > cualquier otra
  datos.forEach(function(fila, idx) {
    var nombre = (fila[2] || '').toString().trim();
    var fechaInicio = (fila[4] || '').toString().trim();
    var id = (fila[0] || '').toString().trim();

    // Ignorar filas completamente vacías
    if (!nombre && !fechaInicio) return;

    var clave = nombre + '|' + fechaInicio;
    var tieneNombre = nombre !== '' && nombre !== 'Sin nombre';
    var esNumerico = /^\d+$/.test(id);

    if (!vistos[clave]) {
      vistos[clave] = { idx: idx, tieneNombre: tieneNombre, esNumerico: esNumerico };
    } else {
      var actual = vistos[clave];
      // Reemplazar si la nueva entrada es mejor (tiene nombre real o ID numérico)
      var nuevaMejor = (!actual.tieneNombre && tieneNombre) ||
                       (actual.tieneNombre === tieneNombre && !actual.esNumerico && esNumerico);
      if (nuevaMejor) {
        vistos[clave] = { idx: idx, tieneNombre: tieneNombre, esNumerico: esNumerico };
      }
    }
  });

  // Construir lista de índices a mantener
  var indicesMantener = {};
  Object.keys(vistos).forEach(function(clave) {
    indicesMantener[vistos[clave].idx] = true;
  });

  datos.forEach(function(fila, idx) {
    if (indicesMantener[idx]) filasMantener.push(fila);
  });

  var eliminados = datos.length - filasMantener.length;

  // Reescribir la hoja: borrar datos viejos y escribir los limpios
  sheet.getRange(2, 1, lastRow - 1, 8).clearContent().setBackground(null);

  if (filasMantener.length > 0) {
    sheet.getRange(2, 1, filasMantener.length, 8).setValues(filasMantener);
    // Colorear verde los que dicen "Correo Enviado"
    filasMantener.forEach(function(fila, i) {
      if ((fila[7] || '').toString() === 'Correo Enviado') {
        sheet.getRange(i + 2, 1, 1, 8).setBackground('#b7e1cd');
      }
    });
  }

  // Actualizar caché con los IDs limpios
  try {
    var idsLimpios = filasMantener.map(function(f) { return f[0].toString(); });
    PropertiesService.getScriptProperties().setProperty('IDS_PROCESADOS_CACHE', JSON.stringify(idsLimpios));
  } catch(e) {
    Logger.log('No se pudo actualizar caché: ' + e.message);
  }

  Logger.log('Historial limpiado: ' + eliminados + ' duplicados eliminados. Quedan ' + filasMantener.length + ' registros.');
  ss.toast('Listo: ' + eliminados + ' duplicados eliminados. Historial tiene ' + filasMantener.length + ' registros únicos.', 'LIMPIEZA COMPLETADA', 10);
}

/**
 * EJECUTAR UNA VEZ: Elimina triggers duplicados (deja exactamente 1 de ejecutarAutomatico)
 * y corrige la URL de KoboToolbox en la hoja de Configuracion.
 */
function REPARAR_SISTEMA() {
  // 1. Eliminar triggers duplicados — dejar exactamente 1
  var triggers = ScriptApp.getProjectTriggers();
  var encontrado = false;
  var eliminados = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'ejecutarAutomatico') {
      if (encontrado) {
        ScriptApp.deleteTrigger(triggers[i]);
        eliminados++;
      } else {
        encontrado = true;
      }
    }
  }
  Logger.log('Triggers duplicados eliminados: ' + eliminados + '. Quedó 1 trigger activo.');

  // 2. Corregir la URL en la hoja de Configuracion
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Configuracion') || ss.getSheetByName('Configuración');
  if (sheet) {
    var datos = sheet.getRange(1, 1, sheet.getLastRow(), 2).getValues();
    for (var j = 0; j < datos.length; j++) {
      var etiqueta = datos[j][0].toString().trim().toLowerCase();
      if (etiqueta.indexOf('url') >= 0 && etiqueta.indexOf('kobo') >= 0) {
        var urlActual = datos[j][1].toString().trim();
        if (urlActual.indexOf('esigRStULsbGhgCaayXsgHC') >= 0) {
          var urlCorrecta = urlActual.replace('esigRStULsbGhgCaayXsgHC', 'esZcQDf2L5CTmiFETsXyKYZ');
          sheet.getRange(j + 1, 2).setValue(urlCorrecta);
          Logger.log('URL corregida: ' + urlCorrecta);
        } else {
          Logger.log('URL actual ya es correcta: ' + urlActual);
        }
        break;
      }
    }
  }

  ss.toast('Sistema reparado: ' + eliminados + ' trigger(s) duplicado(s) eliminado(s) y URL corregida.', 'REPARADO', 10);
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

    // Reintentos automáticos para errores temporales (502, 503, 504)
    var response;
    var responseCode;
    var MAX_INTENTOS = 3;
    for (var intento = 1; intento <= MAX_INTENTOS; intento++) {
      response = UrlFetchApp.fetch(urlStr, options);
      responseCode = response.getResponseCode();
      if (responseCode !== 502 && responseCode !== 503 && responseCode !== 504) break;
      Logger.log('KoboToolbox devolvió ' + responseCode + ' (intento ' + intento + '/' + MAX_INTENTOS + '). Reintentando en 5 segundos...');
      if (intento < MAX_INTENTOS) Utilities.sleep(5000);
    }

    if (responseCode === 401) {
      throw new Error('Token de KoboToolbox inválido o expirado. Verifica el token en la hoja "Configuración".');
    }

    if (responseCode === 404) {
      throw new Error('URL de la API no encontrada. Verifica la URL en la hoja "Configuración".');
    }

    if (responseCode !== 200) {
      // Errores de servidor temporal (502, 503, 504): SIEMPRE marcar como error de servidor
      // Estos errores NO deben enviar correo porque son temporales de KoboToolbox
      var errConexion = new Error('KoboToolbox temporalmente no disponible (HTTP ' + responseCode + '). El sistema reintentará automáticamente.');
      errConexion.esErrorServidor = true; // SIEMPRE true para errores HTTP 5xx
      errConexion.codigoHTTP = responseCode;
      throw errConexion;
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

    // Leer IDs desde la caché de PropertiesService (hasta 1000 IDs)
    var historialIds = new Set();
    var cacheActiva = false;
    try {
      const cache = PropertiesService.getScriptProperties();
      const cachedIds = cache.getProperty('IDS_PROCESADOS_CACHE');
      if (cachedIds) {
        JSON.parse(cachedIds).forEach(function(id) { historialIds.add(id.toString()); });
        cacheActiva = historialIds.size > 0;
        Logger.log('💾 Caché cargada: ' + historialIds.size + ' IDs');
      }
    } catch (e) {
      Logger.log('⚠️ No se pudo leer caché: ' + e.message);
    }

    // Leer IDs del historial para complementar o reconstruir la caché.
    // CRÍTICO: Si la caché está vacía (fue borrada o es primera vez), leer TODAS las filas
    // para evitar detectar registros antiguos como "nuevos" y reenviar correos duplicados.
    const ultimaFilaHistorial = sheetHistorial.getLastRow();
    if (ultimaFilaHistorial > 1) {
      const numFilasLeer = cacheActiva
        ? Math.min(ultimaFilaHistorial - 1, 200)   // caché OK → solo últimas 200 de respaldo
        : (ultimaFilaHistorial - 1);                // caché vacía → leer TODO el historial

      const startRow = cacheActiva
        ? Math.max(2, ultimaFilaHistorial - numFilasLeer + 1)
        : 2;

      Logger.log('📖 Leyendo ' + numFilasLeer + ' filas del historial (caché ' +
        (cacheActiva ? 'activa → respaldo parcial' : 'vacía → lectura completa') + ')');

      const historialData = ejecutarConRetry(
        function() { return sheetHistorial.getRange(startRow, 1, numFilasLeer, 1).getValues(); },
        'lectura de historial',
        5
      );
      historialData.forEach(function(row) { historialIds.add(row[0].toString()); });

      // Si la caché estaba vacía, reconstruirla ahora con todos los IDs leídos del historial
      if (!cacheActiva && historialIds.size > 0) {
        try {
          const cache = PropertiesService.getScriptProperties();
          const todosIds = Array.from(historialIds);
          cache.setProperty('IDS_PROCESADOS_CACHE', JSON.stringify(todosIds.slice(-1000)));
          Logger.log('💾 Caché reconstruida con ' + todosIds.length + ' IDs del historial');
        } catch (e) {
          Logger.log('⚠️ No se pudo reconstruir caché: ' + e.message);
        }
      }
    }

    // Filtrar registros que no están en el historial
    const nuevos = datosKobo.slice(1).filter(function(row) {
      const id = row[idIndex] !== undefined && row[idIndex] !== '' ? row[idIndex].toString() : row.join('|||');
      return !historialIds.has(id);
    });

    Logger.log('IDs en historial: ' + historialIds.size + '. Registros nuevos: ' + nuevos.length);
    return nuevos;

  } catch (error) {
    Logger.log('Error en detectarRegistrosNuevos: ' + error.message + ' — devolviendo [] para evitar correos duplicados');
    // SEGURO: devolver vacío en caso de error para NO enviar correos por accidente
    return [];
  }
}

/**
 * Calcula el número de días entre dos fechas (incluye el día de inicio)
 * @param {string} fechaIniStr - Fecha de inicio (YYYY-MM-DD, DD/MM/YYYY, etc.)
 * @param {string} fechaFinStr - Fecha de fin (YYYY-MM-DD, DD/MM/YYYY, etc.)
 * @return {number} Número de días (0 si hay error)
 */
function calcularDiasEntreFechas(fechaIniStr, fechaFinStr) {
  if (!fechaIniStr || !fechaFinStr) return 0;

  try {
    const fechaInicio = new Date(fechaIniStr);
    const fechaFin = new Date(fechaFinStr);

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      return 0;
    }

    const milisegundosPorDia = 1000 * 60 * 60 * 24;
    const diferenciaDias = Math.round((fechaFin - fechaInicio) / milisegundosPorDia);
    return diferenciaDias + 1; // +1 para incluir el día de inicio
  } catch (e) {
    Logger.log('⚠️ Error al calcular días entre fechas: ' + e.message);
    return 0;
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

    // OPTIMIZACIÓN: Usar retry al abrir documento
    const ss = obtenerSpreadsheetConRetry();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_HISTORIAL);

    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME_HISTORIAL);
      Utilities.sleep(300);
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
    const colEquipo = encontrarColumna(headers, ['programa', 'departamento', 'equipo', 'team', 'programa_departamento', 'programa/', 'departamento/']);
    const colFechaInicio = encontrarColumna(headers, [
      'fecha_inicio', 'fecha_de_inicio', 'fecha de inicio',  // ← Con espacios
      'start_date', 'inicio', 'fecha inicio'
    ]);
    const colFechaFin = encontrarColumna(headers, [
      'fecha_finalizacion', 'fecha_de_finalizacion', 'fecha_fin',
      'fecha de finalizacion', 'fecha de finalización',  // ← Con espacios y tilde
      'end_date', 'fin', 'fecha fin'
    ]);
    const colDiasSolicitados = encontrarColumna(headers, [
      'día personal solicitado', 'dia personal solicitado',
      'día personal solicitado_uuid', 'dia personal solicitado_uuid',  // ← Con _uuid
      'numero de dias solicitados', 'número de días solicitados',
      'personal solicitado', 'dias_personal', 'days_requested',
      'd_as_personal', 'dia_personal', 'dias_de_personal',
      'numero_de_dias', 'cuantos_dias', 'd_as_de_personal',
      'dias solicitados', 'cuantos dias', 'cantidad de dias',
      'numero dias', 'dias a tomar', 'personal_solicitado'
    ]);

    const ultimaFila = sheet.getLastRow() + 1;
    const fechaProceso = new Date();

    const datosHistorial = registrosNuevos.map(function(registro) {
      const idRegistro = (idIndex >= 0 && registro[idIndex] !== undefined && registro[idIndex] !== '')
        ? registro[idIndex].toString()
        : registro.join('|||');

      const fechaIni = colFechaInicio >= 0 ? (registro[colFechaInicio] || '') : '';
      const fechaFi  = colFechaFin    >= 0 ? (registro[colFechaFin]    || '') : '';
      // 1. PRIMERO: Intentar usar el número que el empleado escribió en "días solicitados"
      let diasSolicitados = 0;
      if (colDiasSolicitados >= 0) {
        const valDias = parseInt((registro[colDiasSolicitados] || '0').toString().trim(), 10);
        if (valDias > 0) diasSolicitados = valDias;
      }

      // 2. FALLBACK: Si no existe el campo o está vacío, CALCULAR desde las fechas
      if (diasSolicitados === 0) {
        diasSolicitados = calcularDiasEntreFechas(fechaIni, fechaFi);
        if (diasSolicitados > 0) {
          Logger.log('✅ Días calculados desde fechas: ' + diasSolicitados + ' (del ' + fechaIni + ' al ' + fechaFi + ')');
        }
      }

      if (diasSolicitados === 0) {
        Logger.log('ADVERTENCIA: Días solicitados = 0 para registro (campo no encontrado y fechas inválidas). Nombre: ' + (extraerNombreDeFila(headers, registro) || 'Sin nombre'));
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

    // OPTIMIZACIÓN CRÍTICA: Escribir todos los registros con retry
    ejecutarConRetry(
      function() {
        sheet.getRange(ultimaFila, 1, datosHistorial.length, 8).setValues(datosHistorial);
      },
      'escribir registros en historial',
      5
    );
    Utilities.sleep(800); // AUMENTADO: Más tiempo después de escritura masiva
    Logger.log(datosHistorial.length + ' registros agregados al historial');

    // OPTIMIZACIÓN: Actualizar caché de IDs procesados sin tener que releer todo el historial
    try {
      const cache = PropertiesService.getScriptProperties();
      const cachedIds = cache.getProperty('IDS_PROCESADOS_CACHE');
      const nuevosIDs = datosHistorial.map(function(fila) { return fila[0]; });

      const idsActuales = cachedIds ? JSON.parse(cachedIds) : [];
      const idsActualizados = idsActuales.concat(nuevosIDs);
      // Mantener solo los últimos 1000 IDs para no exceder límite de propiedades
      const idsLimitados = idsActualizados.slice(-1000);
      cache.setProperty('IDS_PROCESADOS_CACHE', JSON.stringify(idsLimitados));
      Logger.log('💾 Caché actualizado con ' + nuevosIDs.length + ' nuevos IDs (total: ' + idsLimitados.length + ')');
    } catch (e) {
      Logger.log('⚠️ No se pudo actualizar caché: ' + e.message);
    }

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

    const colEquipo        = encontrarColumna(headers, ['programa', 'departamento', 'equipo', 'team', 'programa_departamento', 'programa/', 'departamento/']);
    const colFechaInicio   = encontrarColumna(headers, [
      'fecha_inicio', 'fecha_de_inicio', 'fecha de inicio',
      'start_date', 'inicio', 'fecha inicio'
    ]);
    const colFechaFin      = encontrarColumna(headers, [
      'fecha_finalizacion', 'fecha_de_finalizacion', 'fecha_fin',
      'fecha de finalizacion', 'fecha de finalización',
      'end_date', 'fin', 'fecha fin'
    ]);
    const colReglamento    = encontrarColumna(headers, ['reglamento', 'conoces_reglamento', 'conoce_reglamento', 'conoces el reglamento']);
    const colConsentimiento= encontrarColumna(headers, ['consentimiento', 'consentimiento_director', 'director_consent', 'cuentas con el consentimiento']);
    const colDiasSolicitados = encontrarColumna(headers, [
      // ✅ Nombres EXACTOS de KoboToolbox (más específicos primero)
      'día personal solicitado',        // Nombre exacto del formulario (con tilde)
      'dia personal solicitado',        // Sin tilde
      'día personal solicitado_uuid',   // Con _uuid (Kobo a veces agrega esto)
      'dia personal solicitado_uuid',   // Sin tilde con _uuid
      'numero de dias solicitados',     // Alternativa
      'número de días solicitados',     // Con tildes
      'personal solicitado',            // Parcial específico
      'dias_personal',
      'days_requested',
      'd_as_personal',
      'dia_personal',
      'dias_de_personal',
      'numero_de_dias',
      'cuantos_dias',
      'd_as_de_personal',
      'dias solicitados',
      'cuantos dias',
      'cantidad de dias',
      'numero dias',
      'dias a tomar',
      'personal_solicitado'
      // NOTA: NO incluir 'dias' solo, porque coincide con "reglamento de días Personales"
    ]);

    Logger.log('═══════════════════════════════════');
    Logger.log('📋 ENCABEZADOS CSV COMPLETOS:');
    headers.forEach(function(h, i) {
      Logger.log('  [' + i + '] ' + h);
    });
    Logger.log('═══════════════════════════════════');
    Logger.log('Columnas detectadas:');
    Logger.log('  • Equipo: ' + (colEquipo >= 0 ? colEquipo + ' ("' + headers[colEquipo] + '")' : 'NO ENCONTRADA'));
    Logger.log('  • FechaInicio: ' + (colFechaInicio >= 0 ? colFechaInicio + ' ("' + headers[colFechaInicio] + '")' : 'NO ENCONTRADA'));
    Logger.log('  • FechaFin: ' + (colFechaFin >= 0 ? colFechaFin + ' ("' + headers[colFechaFin] + '")' : 'NO ENCONTRADA'));
    Logger.log('  • DiasSolicitados: ' + (colDiasSolicitados >= 0 ? colDiasSolicitados + ' ("' + headers[colDiasSolicitados] + '")' : '⚠️ NO ENCONTRADA'));
    Logger.log('═══════════════════════════════════');

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

      // ═══════════════════════════════════════════════════════════════
      // ⚠️ IMPORTANTE:
      // 1. PRIMERO usar el número que el empleado escribió
      // 2. FALLBACK: Si no existe, calcular desde fechas
      // ═══════════════════════════════════════════════════════════════
      let diasSolicitados = 0;
      if (colDiasSolicitados >= 0) {
        const valDias = parseInt((fila[colDiasSolicitados] || '0').toString().trim(), 10);
        if (valDias > 0) {
          diasSolicitados = valDias;
          Logger.log('✅ ' + nombre + ': ' + diasSolicitados + ' día(s) solicitado(s) (del campo "' + headers[colDiasSolicitados] + '")');
        }
      }

      // FALLBACK: Si el campo no existe o está vacío, CALCULAR desde fechas
      if (diasSolicitados === 0) {
        diasSolicitados = calcularDiasEntreFechas(fechaInicio, fechaFin);
        if (diasSolicitados > 0) {
          Logger.log('✅ ' + nombre + ': ' + diasSolicitados + ' día(s) CALCULADOS desde fechas (' + fechaInicio + ' al ' + fechaFin + ')');
        }
      }

      if (diasSolicitados === 0) {
        if (colDiasSolicitados < 0) {
          Logger.log('❌ ERROR: NO se encontró la columna de "días solicitados" y las fechas son inválidas para ' + nombre);
          Logger.log('   Nombres buscados: personal solicitado, dias_personal, dias solicitados, etc.');
          Logger.log('   Verifica que el formulario de KoboToolbox tenga este campo o fechas válidas.');
        } else {
          Logger.log('⚠️ ADVERTENCIA: ' + nombre + ' - Campo "días solicitados" vacío y fechas inválidas');
        }
      }

      // Buscar el empleado en el map usando nombre normalizado (evita duplicados por acentos/mayúsculas)
      var claveEncontrada = null;
      if (empleadosMap.has(nombre)) {
        claveEncontrada = nombre;
      } else {
        var nombNorm = normalizarTexto(nombre);
        empleadosMap.forEach(function(v, k) {
          if (!claveEncontrada && normalizarTexto(k) === nombNorm) {
            claveEncontrada = k;
          }
        });
      }

      // Si el empleado no está en la plantilla, agregarlo igualmente
      if (!claveEncontrada) {
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
        claveEncontrada = nombre;
      }

      const emp = empleadosMap.get(claveEncontrada);
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
 * Parsea una fecha en múltiples formatos.
 * SOLO se usa para determinar el semestre (1=Ene-Jun, 2=Jul-Dic).
 * NO se usa para calcular días (se usa el número del formulario).
 *
 * Formatos soportados:
 *  - YYYY-MM-DD  (ISO — más común en KoboToolbox)
 *  - DD/MM/YYYY  (formato guatemalteco)
 *  - DD-MM-YYYY
 * Retorna un objeto Date o null si no puede parsear.
 */
function parsearFecha(fechaStr) {
  if (!fechaStr || fechaStr.toString().trim() === '') return null;
  var str = fechaStr.toString().trim();

  // 1. Intentar ISO / formato nativo de JS (YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS)
  var partes = str.split('-');
  if (partes.length === 3 && partes[0].length === 4) {
    // YYYY-MM-DD[Thh:mm:ss]
    var anio = parseInt(partes[0], 10);
    var mes  = parseInt(partes[1], 10) - 1;
    var dia  = parseInt(partes[2].substring(0, 2), 10);
    var d = new Date(anio, mes, dia);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. DD/MM/YYYY
  partes = str.split('/');
  if (partes.length === 3) {
    var d = new Date(parseInt(partes[2], 10), parseInt(partes[1], 10) - 1, parseInt(partes[0], 10));
    if (!isNaN(d.getTime())) return d;
  }

  // 3. DD-MM-YYYY (día primero con guión)
  partes = str.split('-');
  if (partes.length === 3 && partes[0].length <= 2) {
    var d = new Date(parseInt(partes[2], 10), parseInt(partes[1], 10) - 1, parseInt(partes[0], 10));
    if (!isNaN(d.getTime())) return d;
  }

  Logger.log('No se pudo parsear la fecha: ' + str);
  return null;
}

/**
 * NOTA: Las fechas en el formulario son solo informativas.
 * El sistema usa únicamente el número que el empleado escribe en "días solicitados".
 * Las funciones de cálculo de días desde fechas fueron eliminadas (no se usaban).
 */

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
  var d = parsearFecha(fechaStr);
  if (!d) return 1;
  return d.getMonth() < 6 ? 1 : 2;
}

/**
 * Crea/actualiza la hoja "Plantilla de Empleados" con la nómina completa.
 * El usuario puede editar equipos y correos directamente en esa hoja.
 */
function crearHojaPlantillaEmpleados() {
  var ss = obtenerSpreadsheetConRetry(); // OPTIMIZACIÓN: Usar retry al abrir documento
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_PLANTILLA);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME_PLANTILLA);
  }

  // OPTIMIZACIÓN: sheet.clear() puede causar timeout, usar retry
  ejecutarConRetry(
    function() { sheet.clear(); },
    'limpiar hoja Plantilla Empleados',
    5
  );

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
    // mi-eelo (5)
    ['Stephany Tatiana Fuentes Rodríguez',         'mi-eelo',                   'stephany@creamosguatemala.org'],
    ['Jansel Abel Ojeda Posadas',                  'mi-eelo',                   'jansel@creamosguatemala.org'],
    ['Eustolia Beatriz González Gómez',            'mi-eelo',                   'beatriz@creamosguatemala.org'],
    ['Irma Jeaneth García',                        'mi-eelo',                   'irma@creamosguatemala.org'],
    ['Celeste Alejandra del Rosario García Cárdenas', 'mi-eelo',                'celeste@creamosguatemala.org'],
    // Educación (5)
    ['Carmen Rossana Boche Noriega',               'Educación',                 'rossana@creamosguatemala.org'],
    ['Mildred Alejandra Molina Valiente',          'Educación',                 'mildred@creamosguatemala.org'],
    ['Yenifer Pamela Mejía de la Cruz',            'Educación',                 'pamela@creamosguatemala.org'],
    ['Liliana Román',                              'Educación',                 'lily@creamosguatemala.org'],
    ['Abraham Jose David Marcos Bámaca Nij',       'Educación',                 'abraham@creamosguatemala.org'],
    // Inclusión Laboral (5)
    ['Laura Alejandra Castañeda Leal',             'Inclusión Laboral',         'alejandra@creamosguatemala.org'],
    ['Eva Priscila López Xaper',                   'Inclusión Laboral',         'eva@creamosguatemala.org'],
    ['Sindy Lucero Sánchez Barrientos',            'Inclusión Laboral',         'sindy@creamosguatemala.org'],
    ['Paola Lisbeth Ortiz Ramírez',                'Inclusión Laboral',         'paola@creamosguatemala.org'],
    ['Sharon Pamela Samayoa Rodriguez',            'Inclusión Laboral',         'pamelasamayoa@creamosguatemala.org'],
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
  // Iterar keywords primero (por prioridad), luego headers
  // Así el keyword más específico se busca en TODOS los headers antes de probar keywords genéricos
  for (let j = 0; j < palabrasClave.length; j++) {
    var keyword = palabrasClave[j].toLowerCase();
    for (let i = 0; i < headers.length; i++) {
      var header = headers[i].toString().toLowerCase().trim();
      if (header.includes(keyword)) {
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
 * Detecta si un empleado es director de algún equipo.
 * @param {string} nombreEmpleado - Nombre del empleado
 * @param {Object} mapeoDirectores - Mapeo de equipos a directores
 * @return {boolean} true si es director, false si no
 */
function esEmpleadoUnDirector(nombreEmpleado, mapeoDirectores) {
  if (!nombreEmpleado) return false;
  var nombreNorm = normalizarTexto(nombreEmpleado);

  // Buscar en el mapeo de directores
  for (var equipo in mapeoDirectores) {
    var director = mapeoDirectores[equipo];
    if (director && director.nombre && normalizarTexto(director.nombre) === nombreNorm) {
      return true;
    }
  }

  // Buscar en CONFIG.DIRECTORES_DEFAULT como respaldo
  for (var equipoDefault in CONFIG.DIRECTORES_DEFAULT) {
    var directorDefault = CONFIG.DIRECTORES_DEFAULT[equipoDefault];
    if (directorDefault && directorDefault.nombre && normalizarTexto(directorDefault.nombre) === nombreNorm) {
      return true;
    }
  }

  return false;
}

/**
 * Limpia el caché de IDs procesados
 * Útil si el historial se ha modificado manualmente o para forzar recarga
 */
function limpiarCacheIDs() {
  try {
    PropertiesService.getScriptProperties().deleteProperty('IDS_PROCESADOS_CACHE');
    Logger.log('🗑️ Caché de IDs limpiado correctamente');
    SpreadsheetApp.getActiveSpreadsheet().toast('Caché de IDs limpiado. Próxima ejecución recargará desde historial.', 'Caché', 4);
  } catch (e) {
    Logger.log('❌ Error limpiando caché: ' + e.message);
  }
}

/**
 * DIAGNÓSTICO: Muestra información del documento para identificar problemas de performance
 */
function diagnosticarDocumento() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojas = ss.getSheets();
    var diagnostico = [];

    diagnostico.push('═══════════════════════════════════════════════════════');
    diagnostico.push('📊 DIAGNÓSTICO DEL DOCUMENTO');
    diagnostico.push('═══════════════════════════════════════════════════════');
    diagnostico.push('');
    diagnostico.push('📄 Nombre: ' + ss.getName());
    diagnostico.push('🆔 ID: ' + ss.getId());
    diagnostico.push('📑 Total de hojas: ' + hojas.length);
    diagnostico.push('');
    diagnostico.push('═══════════════════════════════════════════════════════');
    diagnostico.push('📋 DETALLE POR HOJA:');
    diagnostico.push('═══════════════════════════════════════════════════════');

    var totalFilas = 0;
    var totalColumnas = 0;

    hojas.forEach(function(hoja) {
      var nombre = hoja.getName();
      var filas = hoja.getLastRow();
      var columnas = hoja.getLastColumn();
      var celdas = filas * columnas;

      totalFilas += filas;
      totalColumnas += columnas;

      var estado = '';
      if (filas > 5000) {
        estado = ' ⚠️ MUY GRANDE - PUEDE CAUSAR TIMEOUT';
      } else if (filas > 2000) {
        estado = ' ⚠️ Grande';
      } else if (filas > 500) {
        estado = ' ℹ️ Normal';
      } else {
        estado = ' ✅ Pequeña';
      }

      diagnostico.push('');
      diagnostico.push('📄 ' + nombre + estado);
      diagnostico.push('   Filas: ' + filas.toLocaleString());
      diagnostico.push('   Columnas: ' + columnas);
      diagnostico.push('   Celdas: ' + celdas.toLocaleString());
    });

    diagnostico.push('');
    diagnostico.push('═══════════════════════════════════════════════════════');
    diagnostico.push('📈 RESUMEN:');
    diagnostico.push('═══════════════════════════════════════════════════════');
    diagnostico.push('Total de filas: ' + totalFilas.toLocaleString());
    diagnostico.push('Total de columnas: ' + totalColumnas.toLocaleString());

    // Verificar caché
    var cache = PropertiesService.getScriptProperties();
    var cachedIds = cache.getProperty('IDS_PROCESADOS_CACHE');
    if (cachedIds) {
      var ids = JSON.parse(cachedIds);
      diagnostico.push('Caché activo: ' + ids.length + ' IDs');
    } else {
      diagnostico.push('Caché: NO ACTIVO');
    }

    diagnostico.push('');
    diagnostico.push('═══════════════════════════════════════════════════════');
    diagnostico.push('💡 RECOMENDACIONES:');
    diagnostico.push('═══════════════════════════════════════════════════════');

    var hayProblema = false;
    hojas.forEach(function(hoja) {
      if (hoja.getLastRow() > 5000) {
        diagnostico.push('⚠️ La hoja "' + hoja.getName() + '" tiene ' + hoja.getLastRow() + ' filas');
        diagnostico.push('   → RECOMENDACIÓN: Archivar registros antiguos (más de 6 meses)');
        hayProblema = true;
      }
    });

    if (!hayProblema) {
      diagnostico.push('✅ El documento está en buen estado');
      diagnostico.push('✅ No se detectaron problemas de tamaño');
    }

    diagnostico.push('');
    diagnostico.push('═══════════════════════════════════════════════════════');

    var mensaje = diagnostico.join('\n');
    Logger.log(mensaje);

    // Mostrar en UI
    SpreadsheetApp.getUi().alert(
      '📊 Diagnóstico del Documento',
      mensaje,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (e) {
    Logger.log('❌ Error en diagnóstico: ' + e.message);
    SpreadsheetApp.getActiveSpreadsheet().toast('Error en diagnóstico: ' + e.message, 'Error', 10);
  }
}

/**
 * OPTIMIZACIÓN: Ejecuta una operación con retry automático en caso de timeout
 * Útil para operaciones que pueden fallar por sobrecarga temporal de Google Sheets
 */
function ejecutarConRetry(operacion, nombreOperacion, maxReintentos) {
  maxReintentos = maxReintentos || 3;
  var reintentos = 0;
  var delay = 2000; // AUMENTADO: Empezar con 2 segundos (antes 1s)

  while (reintentos < maxReintentos) {
    try {
      return operacion();
    } catch (e) {
      reintentos++;
      var esTimeout = e.message.indexOf('agotó el tiempo') !== -1 ||
                      e.message.indexOf('timeout') !== -1 ||
                      e.message.indexOf('Service error') !== -1 ||
                      e.message.indexOf('timed out') !== -1;

      if (esTimeout && reintentos < maxReintentos) {
        Logger.log('⏳ Timeout en ' + nombreOperacion + ' (intento ' + reintentos + '/' + maxReintentos + '). Reintentando en ' + (delay/1000) + 's...');
        try {
          SpreadsheetApp.getActiveSpreadsheet().toast(
            'Timeout detectado. Reintentando (' + reintentos + '/' + maxReintentos + ')...',
            '⏳ Procesando',
            3
          );
        } catch (toastError) {
          // Si toast falla, continuar sin él
        }
        Utilities.sleep(delay);
        delay *= 2; // Backoff exponencial: 2s, 4s, 8s, 16s, 32s
      } else {
        Logger.log('❌ Error en ' + nombreOperacion + ': ' + e.message);
        throw e; // Si no es timeout o ya se agotaron los reintentos, lanzar error
      }
    }
  }
}

/**
 * OPTIMIZACIÓN CRÍTICA: Obtiene el spreadsheet activo con retry automático
 * El problema más común es que SpreadsheetApp.getActiveSpreadsheet() causa timeout en documentos grandes
 */
function obtenerSpreadsheetConRetry() {
  return ejecutarConRetry(
    function() { return SpreadsheetApp.getActiveSpreadsheet(); },
    'abrir documento',
    5  // 5 reintentos para operación crítica
  );
}

/**
 * Detecta si el empleado es una DIRECTORA DE PROGRAMA
 * Solo las directoras de programas (Melissa, Rossana, Alejandra) envían copia a Stephany.
 * Trabajadores normales NO envían copia a Stephany.
 */
function esDirectoraDePrograma(nombreEmpleado) {
  if (!nombreEmpleado) return false;
  var nombreNorm = normalizarTexto(nombreEmpleado);

  for (var i = 0; i < DIRECTORAS_DE_PROGRAMAS.length; i++) {
    if (normalizarTexto(DIRECTORAS_DE_PROGRAMAS[i]) === nombreNorm) {
      return true;
    }
  }

  return false;
}

/**
 * Busca el SUPERVISOR de un director
 * Cuando un director toma días, se envía copia a su supervisor.
 * Retorna el correo del supervisor o null si no tiene.
 */
function buscarSupervisor(nombreEmpleado) {
  if (!nombreEmpleado) return null;

  // Búsqueda exacta
  if (SUPERVISORES[nombreEmpleado]) {
    return SUPERVISORES[nombreEmpleado];
  }

  // Búsqueda normalizada (sin acentos/mayúsculas)
  var nombreNorm = normalizarTexto(nombreEmpleado);
  for (var nombre in SUPERVISORES) {
    if (normalizarTexto(nombre) === nombreNorm) {
      return SUPERVISORES[nombre];
    }
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
    // OPTIMIZACIÓN: Usar retry al abrir documento
    const ss = obtenerSpreadsheetConRetry();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DATOS);

    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME_DATOS);
      Utilities.sleep(300); // PAUSA: Después de crear hoja nueva
    }

    // OPTIMIZACIÓN CRÍTICA: sheet.clear() con retry (causa timeout frecuente)
    ejecutarConRetry(
      function() { sheet.clear(); },
      'limpiar hoja Datos KoboToolbox',
      5  // 5 reintentos
    );
    Utilities.sleep(800); // AUMENTADO: Más tiempo después de clear()

    if (datos.length > 0) {
      // OPTIMIZACIÓN CRÍTICA: setValues con retry (operación pesada)
      ejecutarConRetry(
        function() {
          sheet.getRange(1, 1, datos.length, datos[0].length).setValues(datos);
        },
        'escribir datos de KoboToolbox',
        5  // 5 reintentos
      );
      Utilities.sleep(800); // AUMENTADO: Más tiempo después de escritura masiva

      // Formatear encabezados con retry
      ejecutarConRetry(
        function() {
          sheet.getRange(1, 1, 1, datos[0].length)
            .setFontWeight('bold')
            .setBackground('#4285f4')
            .setFontColor('#ffffff');
        },
        'formatear encabezados',
        3
      );
      Utilities.sleep(300);

      // OPTIMIZACIÓN: autoResize en lotes pequeños para evitar timeout
      const numColumnas = datos[0].length;
      const batchSize = 5; // Resize 5 columnas a la vez
      for (let i = 1; i <= numColumnas; i += batchSize) {
        const endCol = Math.min(i + batchSize - 1, numColumnas);
        ejecutarConRetry(
          function() {
            for (let col = i; col <= endCol; col++) {
              sheet.autoResizeColumn(col);
            }
          },
          'autoResize columnas ' + i + '-' + endCol,
          3
        );
        Utilities.sleep(200); // Pausa entre lotes
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
    // OPTIMIZACIÓN: Usar retry al abrir documento
    const ss = obtenerSpreadsheetConRetry();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_RESUMEN);

    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME_RESUMEN);
      Utilities.sleep(300);
    }

    // OPTIMIZACIÓN CRÍTICA: sheet.clear() con retry
    ejecutarConRetry(
      function() { sheet.clear(); },
      'limpiar hoja Resumen',
      5
    );
    Utilities.sleep(800); // AUMENTADO: Más tiempo después de clear()

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
      // OPTIMIZACIÓN CRÍTICA: setValues con retry (operación pesada)
      ejecutarConRetry(
        function() {
          sheet.getRange(row, 1, datosPersonas.length, headersPorPersona.length).setValues(datosPersonas);
        },
        'escribir datos de personas en Resumen',
        5
      );
      Utilities.sleep(800); // AUMENTADO: Más tiempo después de escritura masiva

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
      Utilities.sleep(300); // PAUSA: Aplicación de formato condicional
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
      // OPTIMIZACIÓN: setValues con retry
      ejecutarConRetry(
        function() {
          sheet.getRange(row, 1, datosEquipos.length, headersPorEquipo.length).setValues(datosEquipos);
        },
        'escribir datos de equipos en Resumen',
        3
      );
      Utilities.sleep(500);
    }

    // OPTIMIZACIÓN: autoResize en lotes para evitar timeout
    const batchSize = 5;
    for (let i = 1; i <= 10; i += batchSize) {
      const endCol = Math.min(i + batchSize - 1, 10);
      ejecutarConRetry(
        function() {
          for (let col = i; col <= endCol; col++) {
            sheet.autoResizeColumn(col);
          }
        },
        'autoResize columnas ' + i + '-' + endCol,
        3
      );
      Utilities.sleep(200);
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

    // Construir mapa de saldos para búsqueda rápida (con clave normalizada para mayor tolerancia)
    const saldoMap = {};
    const saldoMapNorm = {};
    if (datosProcessados) {
      datosProcessados.forEach(function(p) {
        saldoMap[p.nombre] = p;
        saldoMapNorm[normalizarTexto(p.nombre)] = p;
      });
    }

    // Busca el correo de un empleado tolerando diferencias de acentos/mayúsculas
    function buscarCorreoEmpleado(nombre) {
      // 1. Saldo del procesamiento actual
      var s = saldoMap[nombre] || saldoMapNorm[normalizarTexto(nombre)];
      if (s && s.correoEmpleado) return s.correoEmpleado;
      // 2. CONFIG directo
      if (CONFIG.CORREOS_EMPLEADOS[nombre]) return CONFIG.CORREOS_EMPLEADOS[nombre];
      // 3. CONFIG con nombre normalizado
      var nombNorm = normalizarTexto(nombre);
      var encontrado = '';
      Object.keys(CONFIG.CORREOS_EMPLEADOS).forEach(function(k) {
        if (!encontrado && normalizarTexto(k) === nombNorm) encontrado = CONFIG.CORREOS_EMPLEADOS[k];
      });
      return encontrado;
    }

    const colFechaInicio   = encontrarColumna(headers, [
      'fecha_inicio', 'fecha_de_inicio', 'fecha de inicio',
      'start_date', 'inicio', 'fecha inicio'
    ]);
    const colFechaFin      = encontrarColumna(headers, [
      'fecha_finalizacion', 'fecha_de_finalizacion', 'fecha_fin',
      'fecha de finalizacion', 'fecha de finalización',
      'end_date', 'fin', 'fecha fin'
    ]);
    const colDiasSolicitados = encontrarColumna(headers, [
      'día personal solicitado', 'dia personal solicitado',
      'día personal solicitado_uuid', 'dia personal solicitado_uuid',
      'numero de dias solicitados', 'número de días solicitados',
      'personal solicitado', 'dias_personal', 'days_requested',
      'd_as_personal', 'dia_personal', 'dias_de_personal',
      'numero_de_dias', 'cuantos_dias', 'd_as_de_personal',
      'dias solicitados', 'cuantos dias', 'cantidad de dias',
      'numero dias', 'dias a tomar', 'personal_solicitado'
    ]);
    const colEquipo        = encontrarColumna(headers, ['programa', 'departamento', 'equipo', 'team', 'programa_departamento', 'programa/', 'departamento/']);
    const mapeoDirectores  = obtenerMapeoDirectores();

    // Agrupar registros por empleado → un solo correo por persona aunque tenga varios registros nuevos
    var gruposPorEmpleado = {};
    registrosNuevos.forEach(function(reg) {
      var nombre = extraerNombreDeFila(headers, reg) || 'Sin nombre';
      if (!gruposPorEmpleado[nombre]) gruposPorEmpleado[nombre] = [];
      gruposPorEmpleado[nombre].push(reg);
    });

    Object.keys(gruposPorEmpleado).forEach(function(nombreEmpleado) {
      var regs = gruposPorEmpleado[nombreEmpleado];
      // Usar el último registro para equipo y fechas del correo
      var reg = regs[regs.length - 1];

      var equipoEmpleado = (colEquipo >= 0 ? (reg[colEquipo] || '') : '').toString().trim() || 'Sin equipo';
      var fechaInicio    = colFechaInicio >= 0 ? (reg[colFechaInicio] || 'No especificada') : 'No especificada';
      var fechaFin       = colFechaFin    >= 0 ? (reg[colFechaFin]    || 'No especificada') : 'No especificada';

      // DEBUG: Mostrar equipo detectado (para diagnosticar problemas de correo)
      Logger.log('🔍 DEBUG → Empleado: ' + nombreEmpleado + ' | Equipo detectado: "' + equipoEmpleado + '"');

      // Sumar días de TODOS los registros nuevos del empleado
      // SOLO usar el número del campo "días solicitados" (NO calcular desde fechas)
      var diasEstaSolicitud = regs.reduce(function(sum, r) {
        var d = 0;
        if (colDiasSolicitados >= 0) {
          d = parseInt((r[colDiasSolicitados] || '0').toString().trim(), 10) || 0;
        }
        if (d === 0) {
          // Fallback: calcular días entre fechas
          var fi = colFechaInicio >= 0 ? r[colFechaInicio] : '';
          var ff = colFechaFin >= 0 ? r[colFechaFin] : '';
          if (fi && ff) {
            try {
              var dInicio = new Date(fi);
              var dFin = new Date(ff);
              if (!isNaN(dInicio.getTime()) && !isNaN(dFin.getTime())) {
                d = Math.round((dFin - dInicio) / (1000 * 60 * 60 * 24)) + 1;
                if (d < 1) d = 1;
              }
            } catch(e) { d = 1; }
          }
          if (d === 0) d = 1;
          Logger.log('ADVERTENCIA: Días solicitados no numérico para ' + nombreEmpleado + ', usando cálculo: ' + d);
        }
        return sum + d;
      }, 0);

      var saldo        = saldoMap[nombreEmpleado] || saldoMapNorm[normalizarTexto(nombreEmpleado)] || null;
      var infoDirector = buscarDirectorPorEquipo(mapeoDirectores, equipoEmpleado) || { nombre: 'Sin asignar', correo: '' };
      var correoDir    = infoDirector.correo;
      var correoEmp    = buscarCorreoEmpleado(nombreEmpleado);

      // DEBUG: Verificar que se encontró el director correcto
      if (!correoDir || correoDir === '') {
        Logger.log('⚠️ ADVERTENCIA: No se encontró director para equipo "' + equipoEmpleado + '"');
        Logger.log('   Verifica que el equipo esté en la hoja Directores o en CONFIG.DIRECTORES_DEFAULT');
      } else {
        Logger.log('✅ Director encontrado: ' + infoDirector.nombre + ' → ' + correoDir);
      }

      // Buscar si el empleado tiene supervisor (es un director)
      var correoSupervisor = buscarSupervisor(nombreEmpleado);
      var esDirector = correoSupervisor !== null;

      if (esDirector) {
        Logger.log('👔 ' + nombreEmpleado + ' ES DIRECTOR → supervisor: ' + correoSupervisor);
      }

      Logger.log('📧 Notificación → empleado: ' + nombreEmpleado + ' | equipo: ' + equipoEmpleado + ' | correoEmp: ' + correoEmp + ' | correoDir: ' + correoDir + ' | esDirector: ' + esDirector);

      // ── Correo al DIRECTOR ────────────────────────────────────────────────
      if (correoDir && correoDir.trim() !== '') {
        try {
          var companeros = datosProcessados
            ? datosProcessados.filter(function(p) {
                return normalizarTexto(p.equipo) === normalizarTexto(equipoEmpleado);
              })
            : [];

          var asuntoDir = '[Días Personales] ' + nombreEmpleado + ' tomó ' + diasEstaSolicitud + ' día(s) — ' + equipoEmpleado;
          var cuerpoDir = construirCorreoDirector(nombreEmpleado, equipoEmpleado, fechaInicio, fechaFin, diasEstaSolicitud, saldo, companeros);

          // Si el empleado ES un DIRECTOR → enviar copia a su supervisor
          var destinatarios = correoDir.trim();
          if (esDirector && correoSupervisor) {
            // Evitar duplicados: si el director ya es el supervisor, no agregar copia
            if (correoDir.trim().toLowerCase() !== correoSupervisor.toLowerCase()) {
              destinatarios = correoDir.trim() + ',' + correoSupervisor;
              Logger.log('⭐ ' + nombreEmpleado + ' es DIRECTOR → agregando copia a supervisor: ' + correoSupervisor);
            }
          } else {
            Logger.log('👤 ' + nombreEmpleado + ' es trabajador normal → correo SOLO al director');
          }

          MailApp.sendEmail({ to: destinatarios, subject: asuntoDir, htmlBody: cuerpoDir });
          Logger.log('✅ Correo DIRECTOR enviado a: ' + destinatarios + ' (para ' + nombreEmpleado + ' — ' + equipoEmpleado + ')' + (esDirector ? ' [con copia a supervisor]' : ''));
        } catch (errDir) {
          Logger.log('Error enviando correo al director de ' + equipoEmpleado + ': ' + errDir.message);
        }
      } else {
        Logger.log('Director sin correo configurado para equipo: ' + equipoEmpleado);
      }

      // ── Correo al EMPLEADO ────────────────────────────────────────────────
      if (correoEmp && correoEmp.trim() !== '') {
        try {
          var asuntoEmp = '[Días Personales] Tu solicitud fue registrada — quedan ' +
            (saldo ? saldo.diasRestantes : '?') + ' día(s)';
          var cuerpoEmp = construirCorreoEmpleado(nombreEmpleado, fechaInicio, fechaFin, diasEstaSolicitud, saldo);

          MailApp.sendEmail({ to: correoEmp.trim(), subject: asuntoEmp, htmlBody: cuerpoEmp });
          Logger.log('Correo enviado al empleado: ' + correoEmp);
        } catch (errEmp) {
          Logger.log('Error enviando correo al empleado ' + nombreEmpleado + ': ' + errEmp.message);
        }
      } else {
        Logger.log('Sin correo configurado para empleado: ' + nombreEmpleado);
      }
    });

    // Marcar en verde las filas del historial donde se enviaron correos
    marcarCorreoEnviadoEnHistorial(Object.keys(gruposPorEmpleado));

  } catch (error) {
    Logger.log('Error en enviarNotificacionNuevoRegistro: ' + error.message);
  }
}

/**
 * Marca en verde las filas del historial para los empleados que recibieron correo.
 * Columna 8 (Estado) cambia a "Correo Enviado" y la fila se colorea verde.
 */
function marcarCorreoEnviadoEnHistorial(nombresEmpleados) {
  try {
    if (!nombresEmpleados || nombresEmpleados.length === 0) return;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_HISTORIAL);
    if (!sheet || sheet.getLastRow() <= 1) return;

    var lastRow = sheet.getLastRow();
    var startRow = Math.max(2, lastRow - 200); // revisar últimas 200 filas
    var numRows = lastRow - startRow + 1;
    var data = sheet.getRange(startRow, 1, numRows, 8).getValues();

    var nombresNorm = nombresEmpleados.map(normalizarTexto);

    for (var i = 0; i < data.length; i++) {
      var nombreFila = normalizarTexto((data[i][2] || '').toString());
      var estadoFila = (data[i][7] || '').toString();
      if (nombresNorm.indexOf(nombreFila) >= 0 && estadoFila === 'Procesado') {
        var fila = startRow + i;
        sheet.getRange(fila, 8).setValue('Correo Enviado');
        sheet.getRange(fila, 1, 1, 8).setBackground('#b7e1cd'); // verde
      }
    }
    Logger.log('Historial marcado en verde para ' + nombresEmpleados.length + ' empleado(s)');
  } catch (e) {
    Logger.log('Error en marcarCorreoEnviadoEnHistorial: ' + e.message);
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
 * Envía correo de error al administrador.
 * Rate limit: máximo 1 correo de error cada 24 horas para evitar inundación.
 * Los errores temporales de servidor (5xx) NO envían correo.
 */
function enviarCorreoError(error) {
  try {
    // ── Rate limiting: un correo de error máximo cada 24 horas ────────────────
    var props = PropertiesService.getScriptProperties();
    var ultimoEnvio = parseInt(props.getProperty('ULTIMO_CORREO_ERROR') || '0', 10);
    var ahora = Date.now();
    var COOLDOWN = 86400000; // 24 horas en milisegundos
    if (ahora - ultimoEnvio < COOLDOWN) {
      Logger.log('Correo de error omitido (cooldown 24h activo). Error: ' + error.message);
      return;
    }
    props.setProperty('ULTIMO_CORREO_ERROR', String(ahora));

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_CONFIG);

    if (!sheet) return;

    const correoAdmin = leerConfigPorEtiqueta(sheet, 'Correo del administrador: (*)', null)
      || leerConfigPorEtiqueta(sheet, 'Correo del administrador:', null);

    if (!correoAdmin || correoAdmin.toString().trim() === '') return;

    // Determinar tipo de error para dar contexto
    var tipoError = '⚠️ Error del Sistema';
    var solucion = 'Verifica la configuración del sistema.';

    if (error.message.indexOf('Token') >= 0) {
      tipoError = '🔑 Error de Token';
      solucion = 'Solución: Ve a la hoja "Configuración" y verifica que el Token de KoboToolbox sea válido.';
    } else if (error.message.indexOf('URL') >= 0) {
      tipoError = '🔗 Error de URL';
      solucion = 'Solución: Ve a la hoja "Configuración" y verifica que la URL de la API sea correcta.';
    } else if (error.codigoHTTP) {
      tipoError = '🌐 Error HTTP ' + error.codigoHTTP;
      if (error.codigoHTTP >= 500) {
        solucion = 'Este es un error temporal de KoboToolbox. El sistema reintentará automáticamente.';
      }
    }

    MailApp.sendEmail({
      to: correoAdmin.toString().trim(),
      subject: 'Error en Sistema de Días Personales - ' + tipoError,
      body: 'Se ha producido un error en el sistema:\n\n' +
        '═══════════════════════════════════\n' +
        'TIPO: ' + tipoError + '\n' +
        '═══════════════════════════════════\n\n' +
        'Error: ' + error.message +
        '\n\nStack: ' + (error.stack || 'No disponible') +
        '\n\nFecha: ' + new Date().toLocaleString('es-ES') +
        '\n\n' + solucion +
        '\n\n═══════════════════════════════════\n' +
        'NOTA: Los errores repetidos se agrupan y solo recibirás 1 correo cada 24 horas.\n' +
        'Si el problema persiste, contacta al administrador del sistema.\n' +
        '═══════════════════════════════════'
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
  const ss = obtenerSpreadsheetConRetry(); // OPTIMIZACIÓN: Usar retry al abrir documento
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

  // OPTIMIZACIÓN: sheet.clear() puede causar timeout, usar retry
  ejecutarConRetry(
    function() { sheet.clear(); },
    'limpiar hoja Configuración',
    5
  );
  Utilities.sleep(800); // PAUSA después de clear

  // Título con retry
  ejecutarConRetry(
    function() {
      sheet.getRange('A1').setValue('CONFIGURACIÓN DEL SISTEMA')
        .setFontSize(14).setFontWeight('bold')
        .setBackground('#4285f4').setFontColor('#ffffff');
      sheet.getRange('A1:B1').merge();
    },
    'crear título de configuración',
    3
  );
  Utilities.sleep(300);

  // Subtítulo
  sheet.getRange('A2').setValue('Completa los campos marcados con (*). Los demás tienen valores por defecto.')
    .setFontStyle('italic').setFontColor('#666666');
  sheet.getRange('A2:B2').merge();
  Utilities.sleep(200);

  // Campos de configuración — SIEMPRE en filas 3-7
  const configData = [
    ['Token KoboToolbox: (*)',          tokenExistente],
    ['URL API KoboToolbox:',            urlExistente],
    ['Días personales totales:',        diasExistentes],
    ['Enviar correos (TRUE/FALSE):',    correosActivoExistente],
    ['Correo del administrador: (*)',   correoExistente]
  ];

  ejecutarConRetry(
    function() {
      sheet.getRange(3, 1, configData.length, 2).setValues(configData);
      sheet.getRange(3, 1, configData.length, 1).setFontWeight('bold');
    },
    'escribir datos de configuración',
    3
  );
  Utilities.sleep(300);

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
  const ss = obtenerSpreadsheetConRetry(); // OPTIMIZACIÓN: Usar retry al abrir documento
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DIRECTORES);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME_DIRECTORES);
  }

  // OPTIMIZACIÓN: sheet.clear() puede causar timeout, usar retry
  ejecutarConRetry(
    function() { sheet.clear(); },
    'limpiar hoja Directores',
    5
  );

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
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Días Personales')
      .addItem('🆕 Buscar Nuevos Registros', 'buscarNuevosRegistros')
      .addItem('🔃 Actualizar Todo', 'actualizarTodo')
      .addSeparator()
      .addItem('📧 Reenviar Correo Individual', 'reenviarCorreoIndividual')
      .addItem('📬 Reenviar Correos a TODOS', 'reenviarTodosLosCorreos')
      .addItem('📊 Enviar Reporte a Directores', 'enviarReporteManualaDirectores')
      .addSeparator()
      .addItem('⚙ Configuración', 'crearHojaConfiguracion')
      .addItem('👥 Directores', 'crearHojaDirectores')
      .addItem('👤 Plantilla Empleados', 'crearHojaPlantillaEmpleados')
      .addItem('➕ Agregar Empleado', 'agregarNuevoEmpleado')
      .addItem('🔄 Actualizar Empleados', 'actualizarEmpleados')
      .addSeparator()
      .addItem('🔧 Reinstalar Paso 1 (Limpiar)', 'reinstalar_paso1_limpiar')
      .addItem('🔧 Reinstalar Paso 2 (Configurar)', 'reinstalar_paso2_configurar')
      .addItem('🔧 Reinstalar Paso 3 (Activar)', 'reinstalar_paso3_activar')
      .addItem('🛑 Desactivar Triggers', 'desactivarTriggersAutomaticos')
      .addSeparator()
      .addItem('🗑️ Limpiar Caché', 'limpiarCacheIDs')
      .addItem('📊 Diagnosticar Documento', 'diagnosticarDocumento')
      .addItem('🔍 Ver Estructura Kobo', 'diagnosticarEstructuraKobo')
      .addItem('ℹ Ayuda', 'mostrarAyuda')
      .addToUi();
  } catch (e) {
    Logger.log('onOpen: sin contexto de UI (' + e.message + ')');
  }
}

/**
 * Permite agregar un nuevo empleado de manera interactiva (sin modificar el código).
 * Agrega el empleado a la hoja "Plantilla de Empleados" y actualiza el sistema.
 */
function agregarNuevoEmpleado() {
  try {
    const ui = SpreadsheetApp.getUi();

    // Solicitar nombre completo
    const respuestaNombre = ui.prompt(
      'Agregar Nuevo Empleado - Paso 1/3',
      'Ingresa el NOMBRE COMPLETO del empleado:\n\n(Ejemplo: María José González López)',
      ui.ButtonSet.OK_CANCEL
    );

    if (respuestaNombre.getSelectedButton() !== ui.Button.OK) {
      ui.alert('Operación cancelada');
      return;
    }

    const nombreEmpleado = respuestaNombre.getResponseText().trim();
    if (!nombreEmpleado) {
      ui.alert('❌ Error', 'Debes ingresar un nombre válido', ui.ButtonSet.OK);
      return;
    }

    // Solicitar equipo
    const equiposDisponibles = CONFIG.EQUIPOS.join('\n- ');
    const respuestaEquipo = ui.prompt(
      'Agregar Nuevo Empleado - Paso 2/3',
      'Selecciona el EQUIPO del empleado:\n\n' +
      'Equipos disponibles:\n- ' + equiposDisponibles + '\n\n' +
      'Ingresa el nombre del equipo (copia y pega para mayor precisión):',
      ui.ButtonSet.OK_CANCEL
    );

    if (respuestaEquipo.getSelectedButton() !== ui.Button.OK) {
      ui.alert('Operación cancelada');
      return;
    }

    const equipoEmpleado = respuestaEquipo.getResponseText().trim();
    if (!equipoEmpleado) {
      ui.alert('❌ Error', 'Debes ingresar un equipo válido', ui.ButtonSet.OK);
      return;
    }

    // Validar que el equipo exista
    const equipoNormalizado = normalizarTexto(equipoEmpleado);
    const equipoValido = CONFIG.EQUIPOS.some(function(e) {
      return normalizarTexto(e) === equipoNormalizado;
    });

    if (!equipoValido) {
      ui.alert(
        '❌ Error',
        'El equipo "' + equipoEmpleado + '" no es válido.\n\n' +
        'Equipos disponibles:\n- ' + equiposDisponibles,
        ui.ButtonSet.OK
      );
      return;
    }

    // Solicitar correo
    const respuestaCorreo = ui.prompt(
      'Agregar Nuevo Empleado - Paso 3/3',
      'Ingresa el CORREO ELECTRÓNICO del empleado:\n\n' +
      '(Ejemplo: ' + nombreEmpleado.split(' ')[0].toLowerCase() + '@creamosguatemala.org)',
      ui.ButtonSet.OK_CANCEL
    );

    if (respuestaCorreo.getSelectedButton() !== ui.Button.OK) {
      ui.alert('Operación cancelada');
      return;
    }

    const correoEmpleado = respuestaCorreo.getResponseText().trim();
    if (!correoEmpleado) {
      ui.alert('❌ Error', 'Debes ingresar un correo válido', ui.ButtonSet.OK);
      return;
    }

    // Validar formato de correo
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(correoEmpleado)) {
      ui.alert('❌ Error', 'El correo "' + correoEmpleado + '" no tiene un formato válido', ui.ButtonSet.OK);
      return;
    }

    // Confirmar antes de agregar
    const confirmacion = ui.alert(
      'Confirmar Nuevo Empleado',
      '¿Deseas agregar el siguiente empleado?\n\n' +
      '• Nombre: ' + nombreEmpleado + '\n' +
      '• Equipo: ' + equipoEmpleado + '\n' +
      '• Correo: ' + correoEmpleado,
      ui.ButtonSet.YES_NO
    );

    if (confirmacion !== ui.Button.YES) {
      ui.alert('Operación cancelada');
      return;
    }

    // Agregar empleado a la hoja "Plantilla de Empleados"
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_PLANTILLA);

    // Si no existe la hoja, crearla primero
    if (!sheet) {
      crearHojaPlantillaEmpleados();
      sheet = ss.getSheetByName(CONFIG.SHEET_NAME_PLANTILLA);
    }

    if (!sheet) {
      ui.alert('❌ Error', 'No se pudo crear la hoja de plantilla de empleados', ui.ButtonSet.OK);
      return;
    }

    // Verificar que el empleado no exista ya
    const ultimaFila = sheet.getLastRow();
    if (ultimaFila > 2) {
      const datosExistentes = sheet.getRange(3, 1, ultimaFila - 2, 3).getValues();
      const yaExiste = datosExistentes.some(function(fila) {
        return normalizarTexto(fila[0]) === normalizarTexto(nombreEmpleado);
      });

      if (yaExiste) {
        ui.alert(
          '⚠ Advertencia',
          'El empleado "' + nombreEmpleado + '" ya existe en la plantilla.\n\n' +
          'Si quieres modificar sus datos, edita la hoja "' + CONFIG.SHEET_NAME_PLANTILLA + '" directamente.',
          ui.ButtonSet.OK
        );
        return;
      }
    }

    // Agregar nueva fila
    const nuevaFila = ultimaFila + 1;
    sheet.getRange(nuevaFila, 1, 1, 3).setValues([[nombreEmpleado, equipoEmpleado, correoEmpleado]]);

    // Formatear la nueva fila
    sheet.getRange(nuevaFila, 1, 1, 3).setBorder(true, true, true, true, true, true);

    Logger.log('Nuevo empleado agregado: ' + nombreEmpleado + ' | ' + equipoEmpleado + ' | ' + correoEmpleado);

    ui.alert(
      '✅ Empleado Agregado',
      'El empleado "' + nombreEmpleado + '" fue agregado exitosamente.\n\n' +
      '• Equipo: ' + equipoEmpleado + '\n' +
      '• Correo: ' + correoEmpleado + '\n\n' +
      'El sistema ya puede enviarle notificaciones cuando solicite días personales.',
      ui.ButtonSet.OK
    );

  } catch (error) {
    Logger.log('Error en agregarNuevoEmpleado: ' + error.message);
    SpreadsheetApp.getUi().alert(
      '❌ Error',
      'Ocurrió un error al agregar el empleado:\n\n' + error.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
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
 * Busca SOLO registros nuevos en KoboToolbox (los que no están en el Historial),
 * actualiza el Resumen, agrega al Historial y envía correos si aplica.
 * NO borra ni modifica ninguna hoja existente.
 */
function buscarNuevosRegistros() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var fechaAhora = new Date().toLocaleString('es-ES');
  ss.toast('Buscando registros nuevos en KoboToolbox...', 'Buscando...', 5);
  try {
    var datosKobo = obtenerDatosKoboToolbox();
    if (!datosKobo || datosKobo.length <= 1) {
      ss.toast('Sin datos disponibles en KoboToolbox.', 'Sin datos', 5);
      return;
    }
    var nuevos = detectarRegistrosNuevos(datosKobo);
    if (nuevos.length === 0) {
      ss.toast('✅ Sin registros nuevos. Última revisión: ' + fechaAhora, 'Al día', 7);
      return;
    }
    // Hay registros nuevos → ejecutar el sistema completo
    ejecutarSistema();
    ss.toast('✅ ' + nuevos.length + ' registro(s) nuevo(s) procesado(s) — ' + fechaAhora, 'Nuevos registros', 8);
  } catch (e) {
    ss.toast('Error: ' + e.message, 'Error', 10);
    Logger.log('Error en buscarNuevosRegistros: ' + e.message);
  }
}

/**
 * Sincroniza datos de KoboToolbox y actualiza el Resumen SIN borrar ni recrear
 * ninguna hoja existente (plantilla, historial, directores, configuración intactos).
 */
function actualizarTodo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var fechaAhora = new Date().toLocaleString('es-ES');
  ss.toast('Sincronizando datos con KoboToolbox...', 'Actualizar Todo', 8);
  ejecutarSistema();
  // Guardar fecha de última actualización
  PropertiesService.getScriptProperties().setProperty('ULTIMA_ACTUALIZACION', fechaAhora);
  ss.toast('✅ Datos actualizados el ' + fechaAhora, 'Última actualización', 8);
}

// ============================================================
// REINSTALACIÓN RÁPIDA - Dividida en 3 pasos (NO causa timeout)
// Ejecutar desde Apps Script en orden: paso1, paso2, paso3
// ============================================================

/**
 * PASO 1: Limpiar hojas y eliminar triggers (rápido, ~5 segundos)
 * Ejecuta esto PRIMERO
 */
function reinstalar_paso1_limpiar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Eliminar triggers viejos
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'ejecutarAutomatico') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  Logger.log('Triggers eliminados');

  // Limpiar contenido de hojas (NO borrarlas - eso causa timeout)
  var hojasALimpiar = [
    CONFIG.SHEET_NAME_DATOS, CONFIG.SHEET_NAME_RESUMEN, CONFIG.SHEET_NAME_HISTORIAL,
    CONFIG.SHEET_NAME_CONFIG, CONFIG.SHEET_NAME_DIRECTORES, CONFIG.SHEET_NAME_PLANTILLA
  ];
  for (var i = 0; i < hojasALimpiar.length; i++) {
    var hoja = ss.getSheetByName(hojasALimpiar[i]);
    if (hoja) {
      hoja.clear();
      Logger.log('Limpiada: ' + hojasALimpiar[i]);
    }
  }

  // Limpiar cache de IDs procesados
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty('PROCESADOS_IDS');
  props.deleteProperty('ULTIMO_ID_PROCESADO');
  props.deleteProperty('IDS_PROCESADOS_CACHE');
  Logger.log('Cache de IDs limpiada');

  SpreadsheetApp.flush();
  ss.toast('PASO 1 completado. Ahora ejecuta reinstalar_paso2_configurar()', 'Paso 1 OK', 10);
  Logger.log('=== PASO 1 COMPLETADO === Ahora ejecuta reinstalar_paso2_configurar()');
}

/**
 * PASO 2: Recrear Configuración + Directores + Plantilla (~10 segundos)
 * Ejecuta esto DESPUÉS del paso 1
 */
function reinstalar_paso2_configurar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- HOJA CONFIGURACIÓN ---
  var sheetConfig = ss.getSheetByName(CONFIG.SHEET_NAME_CONFIG);
  if (!sheetConfig) sheetConfig = ss.insertSheet(CONFIG.SHEET_NAME_CONFIG);

  sheetConfig.getRange('A1').setValue('CONFIGURACIÓN DEL SISTEMA').setFontSize(14).setFontWeight('bold');
  sheetConfig.getRange('A2').setValue('Completa los campos marcados con (*)').setFontStyle('italic');

  var configData = [
    ['Token KoboToolbox: (*)',       CONFIG.KOBO_TOKEN_DEFAULT],
    ['URL API KoboToolbox:',         CONFIG.KOBO_API_URL],
    ['Días personales totales:',     CONFIG.DIAS_TOTALES],
    ['Enviar correos (TRUE/FALSE):', 'TRUE'],
    ['Correo del administrador: (*)', CONFIG.ADMIN_EMAIL_DEFAULT]
  ];
  sheetConfig.getRange(3, 1, configData.length, 2).setValues(configData);
  sheetConfig.getRange(3, 1, configData.length, 1).setFontWeight('bold');
  sheetConfig.getRange('A3:B3').setBackground('#fff3cd');
  sheetConfig.getRange('A7:B7').setBackground('#fff3cd');
  sheetConfig.setColumnWidth(1, 300);
  sheetConfig.setColumnWidth(2, 500);
  Logger.log('Configuración creada con correos activados (TRUE)');

  // --- HOJA DIRECTORES ---
  var sheetDir = ss.getSheetByName(CONFIG.SHEET_NAME_DIRECTORES);
  if (!sheetDir) sheetDir = ss.insertSheet(CONFIG.SHEET_NAME_DIRECTORES);

  sheetDir.getRange('A1').setValue('MAPEO DE EQUIPOS A DIRECTORES').setFontSize(14).setFontWeight('bold');
  sheetDir.getRange(2, 1, 1, 3).setValues([['Equipo/Programa', 'Nombre del Director', 'Correo del Director']]).setFontWeight('bold');

  var directores = CONFIG.EQUIPOS.map(function(equipo) {
    var dir = CONFIG.DIRECTORES_DEFAULT[equipo] || { nombre: '', correo: '' };
    return [equipo, dir.nombre, dir.correo];
  });
  sheetDir.getRange(3, 1, directores.length, 3).setValues(directores);
  sheetDir.setColumnWidth(1, 220);
  sheetDir.setColumnWidth(2, 300);
  sheetDir.setColumnWidth(3, 280);
  Logger.log('Directores creados');

  // --- HOJA PLANTILLA DE EMPLEADOS ---
  crearHojaPlantillaEmpleados();
  Logger.log('Plantilla creada');

  // Crear hojas vacías si no existen
  if (!ss.getSheetByName(CONFIG.SHEET_NAME_DATOS)) ss.insertSheet(CONFIG.SHEET_NAME_DATOS);
  if (!ss.getSheetByName(CONFIG.SHEET_NAME_RESUMEN)) ss.insertSheet(CONFIG.SHEET_NAME_RESUMEN);
  if (!ss.getSheetByName(CONFIG.SHEET_NAME_HISTORIAL)) ss.insertSheet(CONFIG.SHEET_NAME_HISTORIAL);

  SpreadsheetApp.flush();
  ss.toast('PASO 2 completado. Ahora ejecuta reinstalar_paso3_activar()', 'Paso 2 OK', 10);
  Logger.log('=== PASO 2 COMPLETADO === Ahora ejecuta reinstalar_paso3_activar()');
}

/**
 * PASO 3: Activar trigger + primera carga de datos (~15 segundos)
 * Ejecuta esto DESPUÉS del paso 2
 */
function reinstalar_paso3_activar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Configurar trigger automático cada 1 minuto
  ScriptApp.newTrigger('ejecutarAutomatico')
    .timeBased()
    .everyMinutes(1)
    .create();
  Logger.log('Trigger configurado (cada 1 minuto)');

  // Ejecutar el sistema por primera vez
  ss.toast('Cargando datos de KoboToolbox...', 'Procesando', 30);
  ejecutarSistema();

  ss.toast('Sistema reinstalado y funcionando. Para reenviar correos: reenviarTodosLosCorreos()', 'LISTO', 15);
  Logger.log('=== PASO 3 COMPLETADO === Sistema reinstalado exitosamente');
  Logger.log('Para reenviar correos a TODOS, ejecuta: reenviarTodosLosCorreos()');
}

/**
 * Reenviar correos a TODOS los empleados que ya pidieron días personales.
 * Ejecutar DESPUÉS del paso 3 si quieres que todos reciban su notificación.
 */
function reenviarTodosLosCorreos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  // Verificar que correos estén activados
  var sheetConfig = ss.getSheetByName(CONFIG.SHEET_NAME_CONFIG);
  var enviarCorreos = leerConfigPorEtiqueta(sheetConfig, 'Enviar correos (TRUE/FALSE):', 'FALSE');
  if (enviarCorreos.toString().toUpperCase() !== 'TRUE') {
    ui.alert('Los correos están desactivados. Cambia "Enviar correos" a TRUE en la hoja Configuración.');
    return;
  }

  var confirmacion = ui.alert(
    'Reenviar correos a TODOS',
    'Esto enviará correos de notificación a TODOS los empleados que tienen solicitudes.\n\n' +
    '• Cada empleado recibirá un correo con su saldo actual\n' +
    '• Cada director recibirá las notificaciones de su equipo\n\n' +
    '¿Deseas continuar?',
    ui.ButtonSet.YES_NO
  );

  if (confirmacion !== ui.Button.YES) return;

  ss.toast('Obteniendo datos de KoboToolbox...', 'Procesando', 30);

  var datosKobo = obtenerDatosKoboToolbox();
  if (!datosKobo || datosKobo.length <= 1) {
    ui.alert('No hay datos en KoboToolbox');
    return;
  }

  var headers = datosKobo[0];
  var registros = datosKobo.slice(1);
  var datosProcessados = procesarDatos(datosKobo);

  ss.toast('Enviando correos... (' + registros.length + ' registros)', 'Procesando', 60);

  enviarNotificacionNuevoRegistro(registros, headers, datosProcessados);

  var totalEmpleados = {};
  for (var i = 0; i < registros.length; i++) {
    var nombre = extraerNombreDeFila(headers, registros[i]);
    totalEmpleados[nombre] = true;
  }

  ui.alert(
    'Correos enviados',
    'Se procesaron ' + registros.length + ' solicitudes de ' + Object.keys(totalEmpleados).length + ' empleados.\n\n' +
    'Revisa los logs para ver el detalle.',
    ui.ButtonSet.OK
  );
  Logger.log('=== REENVÍO COMPLETADO === ' + registros.length + ' registros, ' + Object.keys(totalEmpleados).length + ' empleados');
}

/**
 * Desactivar todos los triggers automáticos
 */
function desactivarTriggersAutomaticos() {
  var triggers = ScriptApp.getProjectTriggers();
  var eliminados = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'ejecutarAutomatico') {
      ScriptApp.deleteTrigger(triggers[i]);
      eliminados++;
    }
  }
  Logger.log('Triggers eliminados: ' + eliminados);
  SpreadsheetApp.getActiveSpreadsheet().toast(eliminados + ' trigger(s) eliminado(s)', 'Triggers', 5);
}

/**
 * 📧 Reenviar correo a un empleado específico (individual)
 * Útil cuando un empleado no recibió su correo o se necesita reenviar
 */
function reenviarCorreoIndividual() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    // PASO 1: Pedir nombre del empleado
    var respuestaNombre = ui.prompt(
      '📧 Reenviar Correo Individual',
      'Ingresa el NOMBRE COMPLETO del empleado:\n\n' +
      '(Ejemplo: Laura Alejandra Castañeda Leal)\n\n' +
      'El sistema buscará sus solicitudes y reenviará el correo.',
      ui.ButtonSet.OK_CANCEL
    );

    if (respuestaNombre.getSelectedButton() !== ui.Button.OK) {
      ui.alert('Operación cancelada');
      return;
    }

    var nombreEmpleado = respuestaNombre.getResponseText().trim();

    if (!nombreEmpleado || nombreEmpleado === '') {
      ui.alert('❌ Error', 'Debes ingresar un nombre válido.', ui.ButtonSet.OK);
      return;
    }

    Logger.log('═══════════════════════════════════════════════════════');
    Logger.log('📧 REENVÍO DE CORREO INDIVIDUAL');
    Logger.log('Empleado: ' + nombreEmpleado);
    Logger.log('═══════════════════════════════════════════════════════');

    // PASO 2: Verificar que el envío de correos esté activado
    var sheetConfig = ss.getSheetByName(CONFIG.SHEET_NAME_CONFIG);
    if (!sheetConfig) {
      ui.alert('❌ Error', 'No existe la hoja de Configuración.', ui.ButtonSet.OK);
      return;
    }

    var enviarCorreos = leerConfigPorEtiqueta(sheetConfig, 'Enviar correos (TRUE/FALSE):', false);
    if (!enviarCorreos || enviarCorreos.toString().toLowerCase() !== 'true') {
      var confirmar = ui.alert(
        '⚠️ Correos Desactivados',
        'El envío de correos está DESACTIVADO en la configuración.\n\n' +
        '¿Deseas activarlo y continuar?',
        ui.ButtonSet.YES_NO
      );

      if (confirmar === ui.Button.YES) {
        sheetConfig.getRange('B6').setValue('TRUE');
        Logger.log('✅ Envío de correos activado');
      } else {
        ui.alert('Operación cancelada');
        return;
      }
    }

    ss.toast('Buscando solicitudes de ' + nombreEmpleado + '...', 'Procesando', 5);

    // PASO 3: Obtener datos de Kobo y procesar
    var datosKobo = obtenerDatosKoboToolbox();
    if (!datosKobo || datosKobo.length <= 1) {
      ui.alert('❌ Error', 'No hay datos disponibles en KoboToolbox.', ui.ButtonSet.OK);
      return;
    }

    var headers = datosKobo[0];
    var datosProcessados = procesarDatos(datosKobo);

    // PASO 4: Buscar solicitudes del empleado
    var solicitudesEmpleado = [];
    var colEquipo = encontrarColumna(headers, ['programa', 'departamento', 'equipo', 'team', 'programa_departamento', 'programa/', 'departamento/']);

    for (var i = 1; i < datosKobo.length; i++) {
      var fila = datosKobo[i];
      var nombre = extraerNombreDeFila(headers, fila);

      if (normalizarTexto(nombre) === normalizarTexto(nombreEmpleado)) {
        solicitudesEmpleado.push(fila);
      }
    }

    if (solicitudesEmpleado.length === 0) {
      ui.alert(
        '⚠️ Sin Solicitudes',
        'No se encontraron solicitudes para: ' + nombreEmpleado + '\n\n' +
        'Verifica que el nombre sea EXACTO (con tildes y mayúsculas).',
        ui.ButtonSet.OK
      );
      Logger.log('❌ No se encontraron solicitudes para: ' + nombreEmpleado);
      return;
    }

    Logger.log('✅ Encontradas ' + solicitudesEmpleado.length + ' solicitud(es) de ' + nombreEmpleado);

    // PASO 5: Enviar correo usando la misma lógica que enviarNotificacionNuevoRegistro
    var reg = solicitudesEmpleado[solicitudesEmpleado.length - 1]; // Última solicitud
    var colFechaInicio = encontrarColumna(headers, ['fecha_inicio', 'fecha_de_inicio', 'fecha de inicio', 'start_date', 'inicio', 'fecha inicio']);
    var colFechaFin = encontrarColumna(headers, ['fecha_finalizacion', 'fecha_de_finalizacion', 'fecha_fin', 'fecha de finalizacion', 'fecha de finalización', 'end_date', 'fin', 'fecha fin']);
    var colDiasSolicitados = encontrarColumna(headers, ['día personal solicitado', 'dia personal solicitado', 'día personal solicitado_uuid', 'dia personal solicitado_uuid', 'numero de dias solicitados', 'número de días solicitados', 'personal solicitado', 'dias_personal', 'days_requested']);

    var equipoEmpleado = (colEquipo >= 0 ? (reg[colEquipo] || '') : '').toString().trim() || 'Sin equipo';
    var fechaInicio = colFechaInicio >= 0 ? (reg[colFechaInicio] || 'No especificada') : 'No especificada';
    var fechaFin = colFechaFin >= 0 ? (reg[colFechaFin] || 'No especificada') : 'No especificada';

    // Calcular días totales de TODAS las solicitudes
    var diasTotales = 0;
    for (var i = 0; i < solicitudesEmpleado.length; i++) {
      var d = 0;
      if (colDiasSolicitados >= 0) {
        d = parseInt((solicitudesEmpleado[i][colDiasSolicitados] || '0').toString().trim(), 10);
      }
      if (d === 0) {
        // Calcular desde fechas si no está el campo
        var fIni = colFechaInicio >= 0 ? solicitudesEmpleado[i][colFechaInicio] : '';
        var fFin = colFechaFin >= 0 ? solicitudesEmpleado[i][colFechaFin] : '';
        d = calcularDiasEntreFechas(fIni, fFin);
      }
      diasTotales += d;
    }

    Logger.log('Días totales: ' + diasTotales + ' (de ' + solicitudesEmpleado.length + ' solicitud(es))');

    // Buscar datos procesados del empleado
    var saldo = null;
    for (var i = 0; i < datosProcessados.length; i++) {
      if (normalizarTexto(datosProcessados[i].nombre) === normalizarTexto(nombreEmpleado)) {
        saldo = datosProcessados[i];
        break;
      }
    }

    // Obtener correos
    var mapeoDirectores = obtenerMapeoDirectores();
    var infoDirector = buscarDirectorPorEquipo(mapeoDirectores, equipoEmpleado) || { nombre: 'Sin asignar', correo: '' };
    var correoDir = infoDirector.correo;
    var correoEmp = CONFIG.CORREOS_EMPLEADOS[nombreEmpleado] || (saldo ? saldo.correoEmpleado : '');

    if (!correoEmp || correoEmp.trim() === '') {
      ui.alert(
        '⚠️ Sin Correo Configurado',
        'No hay correo configurado para: ' + nombreEmpleado + '\n\n' +
        'Agrega el correo en el CONFIG y vuelve a intentar.',
        ui.ButtonSet.OK
      );
      Logger.log('❌ Sin correo para empleado: ' + nombreEmpleado);
      return;
    }

    var correoSupervisor = buscarSupervisor(nombreEmpleado);
    var esDirector = correoSupervisor !== null;

    Logger.log('Correo empleado: ' + correoEmp);
    Logger.log('Correo director: ' + correoDir);
    Logger.log('Es director: ' + esDirector + (esDirector ? ' → supervisor: ' + correoSupervisor : ''));

    var correosEnviados = 0;

    // ENVIAR CORREO AL DIRECTOR
    if (correoDir && correoDir.trim() !== '') {
      try {
        var companeros = datosProcessados.filter(function(p) {
          return normalizarTexto(p.equipo) === normalizarTexto(equipoEmpleado);
        });

        var asuntoDir = '[Días Personales] ' + nombreEmpleado + ' tomó ' + diasTotales + ' día(s) — ' + equipoEmpleado;
        var cuerpoDir = construirCorreoDirector(nombreEmpleado, equipoEmpleado, fechaInicio, fechaFin, diasTotales, saldo, companeros);

        // Si el empleado ES un DIRECTOR → enviar copia a su supervisor
        var destinatarios = correoDir.trim();
        if (esDirector && correoSupervisor) {
          if (correoDir.trim().toLowerCase() !== correoSupervisor.toLowerCase()) {
            destinatarios = correoDir.trim() + ',' + correoSupervisor;
            Logger.log('⭐ ' + nombreEmpleado + ' es DIRECTOR → agregando copia a supervisor: ' + correoSupervisor);
          }
        }

        MailApp.sendEmail({ to: destinatarios, subject: asuntoDir, htmlBody: cuerpoDir });
        Logger.log('✅ Correo enviado al director: ' + destinatarios);
        correosEnviados++;
      } catch (e) {
        Logger.log('❌ Error enviando correo al director: ' + e.message);
      }
    }

    // ENVIAR CORREO AL EMPLEADO
    try {
      var asuntoEmp = '[Días Personales] Tu solicitud fue registrada — quedan ' +
        (saldo ? saldo.diasRestantes : '?') + ' día(s)';
      var cuerpoEmp = construirCorreoEmpleado(nombreEmpleado, fechaInicio, fechaFin, diasTotales, saldo);

      MailApp.sendEmail({ to: correoEmp.trim(), subject: asuntoEmp, htmlBody: cuerpoEmp });
      Logger.log('✅ Correo enviado al empleado: ' + correoEmp);
      correosEnviados++;
    } catch (e) {
      Logger.log('❌ Error enviando correo al empleado: ' + e.message);
    }

    Logger.log('═══════════════════════════════════════════════════════');
    Logger.log('✅ REENVÍO COMPLETADO - ' + correosEnviados + ' correo(s) enviado(s)');
    Logger.log('═══════════════════════════════════════════════════════');

    ui.alert(
      '✅ Correo Reenviado',
      '📧 Correo(s) enviado(s) exitosamente:\n\n' +
      '  → Empleado: ' + nombreEmpleado + '\n' +
      '  → Correo: ' + correoEmp + '\n' +
      '  → Días: ' + diasTotales + '\n' +
      '  → Solicitudes: ' + solicitudesEmpleado.length + '\n\n' +
      (correoDir ? '  → Director notificado: ' + correoDir : '') + '\n\n' +
      '✅ Total de correos enviados: ' + correosEnviados,
      ui.ButtonSet.OK
    );

  } catch (error) {
    Logger.log('❌ ERROR EN REENVÍO: ' + error.message);
    Logger.log('Stack: ' + error.stack);

    ui.alert(
      '❌ Error',
      'Error al reenviar correo:\n\n' + error.message,
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

/**
 * Función auxiliar para mostrar mensajes toast
 */
function toast(mensaje, duracion) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(mensaje, '⚙️ Sistema', duracion || 3);
  } catch (e) {
    Logger.log(mensaje);
  }
}


/**
 * 🔍 DIAGNÓSTICO COMPLETO: Ver estructura de datos de Kobo
 * Muestra TODOS los encabezados y primeras 5 filas para debuggear
 */
function diagnosticarEstructuraKobo() {
  var ui = SpreadsheetApp.getUi();

  ui.alert(
    '🔍 Diagnóstico de Estructura',
    'Esta función mostrará:\n\n' +
    '1. TODOS los encabezados del CSV de Kobo\n' +
    '2. Las primeras 5 filas de datos\n' +
    '3. Qué columnas usa para extraer nombres\n\n' +
    'Los resultados aparecerán en el LOG.\n' +
    'Ve a: Extensiones → Apps Script → Ejecuciones\n\n' +
    'Presiona OK para continuar.',
    ui.ButtonSet.OK
  );

  try {
    Logger.log('═══════════════════════════════════════════════════════════');
    Logger.log('🔍 DIAGNÓSTICO DE ESTRUCTURA DE DATOS KOBO');
    Logger.log('═══════════════════════════════════════════════════════════');

    var datosKobo = obtenerDatosKoboToolbox();

    if (!datosKobo || datosKobo.length === 0) {
      Logger.log('❌ ERROR: No hay datos en KoboToolbox');
      ui.alert('❌ Error', 'No hay datos disponibles en KoboToolbox.', ui.ButtonSet.OK);
      return;
    }

    var headers = datosKobo[0];

    Logger.log('\n📋 ENCABEZADOS COMPLETOS (' + headers.length + ' columnas):');
    Logger.log('─────────────────────────────────────────────────────────────');
    for (var i = 0; i < headers.length; i++) {
      Logger.log('[' + i + '] "' + headers[i] + '"');
    }

    Logger.log('\n📊 PRIMERAS 5 FILAS DE DATOS:');
    Logger.log('─────────────────────────────────────────────────────────────');
    var numFilas = Math.min(5, datosKobo.length - 1);
    for (var i = 1; i <= numFilas; i++) {
      Logger.log('\nFILA ' + i + ':');
      var fila = datosKobo[i];
      for (var j = 0; j < fila.length; j++) {
        if (fila[j] && fila[j].toString().trim() !== '') {
          Logger.log('  [' + j + '] ' + headers[j] + ' = "' + fila[j] + '"');
        }
      }
    }

    Logger.log('\n🔎 ANÁLISIS DE EXTRACCIÓN DE NOMBRES:');
    Logger.log('─────────────────────────────────────────────────────────────');
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

    Logger.log('Columnas de equipo encontradas:');
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i].toString().toLowerCase().trim();
      for (var j = 0; j < clavesEquipos.length; j++) {
        if (header.includes(clavesEquipos[j])) {
          Logger.log('  ✅ [' + i + '] "' + headers[i] + '" → coincide con "' + clavesEquipos[j] + '"');
        }
      }
    }

    Logger.log('\nNombres extraídos de cada fila:');
    for (var i = 1; i <= numFilas; i++) {
      var fila = datosKobo[i];
      var nombre = extraerNombreDeFila(headers, fila);
      Logger.log('  FILA ' + i + ': "' + nombre + '"' + (nombre === '' ? ' ❌ VACÍO!' : ' ✅'));
    }

    Logger.log('\n═══════════════════════════════════════════════════════════');
    Logger.log('✅ DIAGNÓSTICO COMPLETADO');
    Logger.log('═══════════════════════════════════════════════════════════');

    ui.alert(
      '✅ Diagnóstico Completado',
      'Los resultados están en el LOG.\n\n' +
      'Para verlos:\n' +
      '1. Extensiones → Apps Script\n' +
      '2. Haz clic en "Ejecuciones" (ícono de reloj)\n' +
      '3. Busca la ejecución de "diagnosticarEstructuraKobo"\n' +
      '4. Revisa los encabezados y datos\n\n' +
      'Busca las filas donde el nombre está VACÍO.',
      ui.ButtonSet.OK
    );

  } catch (error) {
    Logger.log('❌ ERROR EN DIAGNÓSTICO: ' + error.message);
    Logger.log('Stack: ' + error.stack);

    ui.alert(
      '❌ Error',
      'Error durante el diagnóstico:\n\n' + error.message,
      ui.ButtonSet.OK
    );
  }
}

/**
 * EJECUTAR UNA VEZ: Crea el trigger automático del sistema.
 * Después de ejecutar esta función, el sistema correrá solo cada 10 minutos.
 */
function CREAR_TRIGGER() {
  // Primero eliminar cualquier trigger existente para no duplicar
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'ejecutarAutomatico') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  // Crear trigger nuevo cada 10 minutos
  ScriptApp.newTrigger('ejecutarAutomatico')
    .timeBased()
    .everyMinutes(10)
    .create();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Trigger creado: ejecutarAutomatico cada 10 minutos',
    'LISTO', 10
  );
}
