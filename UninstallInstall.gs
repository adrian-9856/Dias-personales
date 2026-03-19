/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FUNCIONES DE DESINSTALACIÓN E INSTALACIÓN COMPLETA
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * ❌ DESINSTALAR TODO EL SISTEMA
 * Borra TODAS las hojas del sistema (incluyendo Historial) y triggers
 */
function desinstalarTodoElSistema() {
  var ui = SpreadsheetApp.getUi();

  var confirmacion = ui.alert(
    '🚨 DESINSTALAR TODO EL SISTEMA',
    '⚠️ ADVERTENCIA: Esto eliminará PERMANENTEMENTE:\n\n' +
    '  ❌ Configuración\n' +
    '  ❌ Historial de Solicitudes\n' +
    '  ❌ Plantilla de Empleados\n' +
    '  ❌ Directores\n' +
    '  ❌ Datos KoboToolbox\n' +
    '  ❌ Resumen\n' +
    '  ❌ Todos los triggers automáticos\n' +
    '  ❌ Menú "Días Personales"\n\n' +
    '🔥 NO SE PUEDE DESHACER ESTA ACCIÓN\n\n' +
    '¿Estás SEGURO de que quieres BORRAR TODO?',
    ui.ButtonSet.YES_NO
  );

  if (confirmacion !== ui.Button.YES) {
    ui.alert('✅ Cancelado', 'No se eliminó nada.', ui.ButtonSet.OK);
    return;
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    Logger.log('═══════════════════════════════════════════════════════');
    Logger.log('🔥 INICIANDO DESINSTALACIÓN COMPLETA');
    Logger.log('═══════════════════════════════════════════════════════');

    // PASO 1: Eliminar todos los triggers
    toast('Eliminando triggers automáticos...', 3);
    var triggers = ScriptApp.getProjectTriggers();
    Logger.log('Triggers encontrados: ' + triggers.length);

    for (var i = 0; i < triggers.length; i++) {
      ScriptApp.deleteTrigger(triggers[i]);
      Logger.log('✅ Trigger eliminado: ' + triggers[i].getHandlerFunction());
    }

    toast('Triggers eliminados ✅', 2);
    Logger.log('✅ Todos los triggers eliminados');

    // PASO 2: Listar todas las hojas del sistema
    var hojasDelSistema = [
      CONFIG.SHEET_NAME_CONFIG,
      CONFIG.SHEET_NAME_HISTORIAL,
      CONFIG.SHEET_NAME_PLANTILLA,
      CONFIG.SHEET_NAME_DIRECTORES,
      CONFIG.SHEET_NAME_DATOS,
      CONFIG.SHEET_NAME_RESUMEN
    ];

    Logger.log('Hojas del sistema a eliminar: ' + hojasDelSistema.join(', '));

    // PASO 3: Verificar si quedará al menos una hoja después de borrar
    var todasLasHojas = ss.getSheets();
    var hojasQueSeMantienen = [];

    for (var i = 0; i < todasLasHojas.length; i++) {
      var nombreHoja = todasLasHojas[i].getName();
      if (hojasDelSistema.indexOf(nombreHoja) === -1) {
        hojasQueSeMantienen.push(todasLasHojas[i]);
      }
    }

    Logger.log('Hojas que NO son del sistema: ' + hojasQueSeMantienen.length);

    // PASO 4: Si todas las hojas son del sistema, crear una temporal
    var hojaTemporal = null;
    if (hojasQueSeMantienen.length === 0) {
      Logger.log('⚠️ Todas las hojas son del sistema. Creando hoja temporal...');
      toast('Creando hoja temporal...', 2);
      hojaTemporal = ss.insertSheet('_TEMP_');
      ss.setActiveSheet(hojaTemporal);
      Logger.log('✅ Hoja temporal creada: _TEMP_');
    } else {
      // Activar una hoja que NO sea del sistema
      ss.setActiveSheet(hojasQueSeMantienen[0]);
      Logger.log('✅ Hoja activa: ' + hojasQueSeMantienen[0].getName());
    }

    SpreadsheetApp.flush();

    // PASO 5: Eliminar todas las hojas del sistema
    toast('Eliminando hojas del sistema...', 3);
    var hojasEliminadas = 0;

    for (var i = 0; i < hojasDelSistema.length; i++) {
      var nombreHoja = hojasDelSistema[i];
      var hoja = ss.getSheetByName(nombreHoja);

      if (hoja) {
        try {
          ss.deleteSheet(hoja);
          Logger.log('✅ Hoja eliminada: ' + nombreHoja);
          hojasEliminadas++;
        } catch (e) {
          Logger.log('❌ Error al eliminar hoja "' + nombreHoja + '": ' + e.message);
        }
      } else {
        Logger.log('⚠️ Hoja no existe: ' + nombreHoja);
      }
    }

    SpreadsheetApp.flush();

    Logger.log('✅ Total de hojas eliminadas: ' + hojasEliminadas + '/' + hojasDelSistema.length);

    // PASO 6: Renombrar hoja temporal si existe
    if (hojaTemporal) {
      hojaTemporal.setName('Inicio');
      hojaTemporal.getRange('A1').setValue('✅ Sistema desinstalado correctamente');
      hojaTemporal.getRange('A1').setFontSize(14).setFontWeight('bold').setFontColor('#0f9d58');
      hojaTemporal.getRange('A3').setValue('Para reinstalar:');
      hojaTemporal.getRange('A4').setValue('1. Ve a Extensiones → Apps Script');
      hojaTemporal.getRange('A5').setValue('2. Ejecuta la función: instalarTodoDesdeAmbienteLimpio()');
      Logger.log('✅ Hoja temporal renombrada a "Inicio"');
    }

    // PASO 7: Limpiar propiedades del script
    try {
      var props = PropertiesService.getScriptProperties();
      props.deleteAllProperties();
      Logger.log('✅ Propiedades del script eliminadas');
    } catch (e) {
      Logger.log('⚠️ No se pudieron eliminar propiedades: ' + e.message);
    }

    Logger.log('═══════════════════════════════════════════════════════');
    Logger.log('✅ DESINSTALACIÓN COMPLETADA');
    Logger.log('═══════════════════════════════════════════════════════');

    // Mensaje final
    ui.alert(
      '✅ Desinstalación Completada',
      '🔥 El sistema ha sido ELIMINADO por completo:\n\n' +
      '  ✅ ' + hojasEliminadas + ' hojas eliminadas\n' +
      '  ✅ ' + triggers.length + ' triggers eliminados\n' +
      '  ✅ Propiedades borradas\n\n' +
      '📋 Para REINSTALAR el sistema:\n' +
      '  1. Extensiones → Apps Script\n' +
      '  2. Ejecuta: instalarTodoDesdeAmbienteLimpio()\n\n' +
      '✅ El sistema quedó completamente limpio.',
      ui.ButtonSet.OK
    );

  } catch (error) {
    Logger.log('❌ ERROR EN DESINSTALACIÓN: ' + error.message);
    Logger.log('Stack: ' + error.stack);

    ui.alert(
      '❌ Error',
      'Hubo un error durante la desinstalación:\n\n' +
      error.message + '\n\n' +
      'Revisa el log en Apps Script para más detalles.',
      ui.ButtonSet.OK
    );
  }
}


/**
 * ✅ INSTALAR TODO EL SISTEMA DESDE CERO
 * Crea TODAS las hojas, configuración y triggers automáticamente
 */
function instalarTodoDesdeAmbienteLimpio() {
  var ui = SpreadsheetApp.getUi();

  var confirmacion = ui.alert(
    '✅ INSTALAR SISTEMA COMPLETO',
    '🚀 Esto creará TODO el sistema desde CERO:\n\n' +
    '  ✅ Configuración (con token de Kobo)\n' +
    '  ✅ Plantilla de Empleados\n' +
    '  ✅ Directores\n' +
    '  ✅ Hojas de Datos, Resumen e Historial\n' +
    '  ✅ Trigger automático (sincronización cada 1 min)\n' +
    '  ✅ Menú "Días Personales"\n\n' +
    '¿Deseas continuar?',
    ui.ButtonSet.YES_NO
  );

  if (confirmacion !== ui.Button.YES) {
    ui.alert('✅ Cancelado', 'No se instaló nada.', ui.ButtonSet.OK);
    return;
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    Logger.log('═══════════════════════════════════════════════════════');
    Logger.log('🚀 INICIANDO INSTALACIÓN COMPLETA');
    Logger.log('═══════════════════════════════════════════════════════');

    // PASO 1: Eliminar triggers antiguos si existen
    toast('Paso 1/7 — Limpiando triggers antiguos...', 2);
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
    Logger.log('✅ Triggers antiguos eliminados: ' + triggers.length);

    // PASO 2: Eliminar hojas del sistema si existen (para reinstalar limpio)
    toast('Paso 2/7 — Limpiando hojas antiguas...', 2);
    var hojasDelSistema = [
      CONFIG.SHEET_NAME_CONFIG,
      CONFIG.SHEET_NAME_HISTORIAL,
      CONFIG.SHEET_NAME_PLANTILLA,
      CONFIG.SHEET_NAME_DIRECTORES,
      CONFIG.SHEET_NAME_DATOS,
      CONFIG.SHEET_NAME_RESUMEN
    ];

    var todasLasHojas = ss.getSheets();
    var hojasExternas = [];

    for (var i = 0; i < todasLasHojas.length; i++) {
      var nombreHoja = todasLasHojas[i].getName();
      if (hojasDelSistema.indexOf(nombreHoja) === -1 && nombreHoja !== '_TEMP_' && nombreHoja !== 'Inicio') {
        hojasExternas.push(todasLasHojas[i]);
      }
    }

    // Si no hay hojas externas, crear una temporal
    if (hojasExternas.length === 0 && todasLasHojas.length <= hojasDelSistema.length + 2) {
      var hojaTemporal = ss.getSheetByName('_TEMP_') || ss.getSheetByName('Inicio') || ss.insertSheet('_TEMP_');
      ss.setActiveSheet(hojaTemporal);
    } else if (hojasExternas.length > 0) {
      ss.setActiveSheet(hojasExternas[0]);
    }

    SpreadsheetApp.flush();

    // Borrar hojas del sistema
    for (var i = 0; i < hojasDelSistema.length; i++) {
      var hoja = ss.getSheetByName(hojasDelSistema[i]);
      if (hoja) {
        ss.deleteSheet(hoja);
        Logger.log('✅ Hoja antigua eliminada: ' + hojasDelSistema[i]);
      }
    }

    // Borrar hoja temporal si existe
    var hojaTemp = ss.getSheetByName('_TEMP_');
    if (hojaTemp && ss.getSheets().length > 1) {
      ss.deleteSheet(hojaTemp);
      Logger.log('✅ Hoja _TEMP_ eliminada');
    }

    var hojaInicio = ss.getSheetByName('Inicio');
    if (hojaInicio && ss.getSheets().length > 1) {
      ss.deleteSheet(hojaInicio);
      Logger.log('✅ Hoja Inicio eliminada');
    }

    SpreadsheetApp.flush();

    // PASO 3: Crear hoja de Configuración
    toast('Paso 3/7 — Creando Configuración...', 2);
    crearHojaConfiguracion();
    SpreadsheetApp.flush();
    Logger.log('✅ Hoja de Configuración creada');

    // Asegurar que el token esté configurado
    var sheetConfig = ss.getSheetByName(CONFIG.SHEET_NAME_CONFIG);
    if (sheetConfig) {
      sheetConfig.getRange('B3').setValue(CONFIG.KOBO_TOKEN_DEFAULT);
      Logger.log('✅ Token de KoboToolbox configurado');
    }

    // PASO 4: Crear hoja de Directores
    toast('Paso 4/7 — Creando Directores...', 2);
    crearHojaDirectores();
    SpreadsheetApp.flush();
    Logger.log('✅ Hoja de Directores creada');

    // PASO 5: Crear hoja de Plantilla de Empleados
    toast('Paso 5/7 — Creando Plantilla de Empleados...', 2);
    crearHojaPlantillaEmpleados();
    SpreadsheetApp.flush();
    Logger.log('✅ Hoja de Plantilla de Empleados creada');

    // PASO 6: Crear hojas vacías para Datos, Resumen e Historial
    toast('Paso 6/7 — Creando hojas de datos...', 2);
    [CONFIG.SHEET_NAME_DATOS, CONFIG.SHEET_NAME_RESUMEN, CONFIG.SHEET_NAME_HISTORIAL].forEach(function(nombre) {
      if (!ss.getSheetByName(nombre)) {
        ss.insertSheet(nombre);
        Logger.log('✅ Hoja creada: ' + nombre);
      }
    });
    SpreadsheetApp.flush();

    // PASO 7: Crear trigger automático
    toast('Paso 7/7 — Configurando sincronización automática...', 2);
    ScriptApp.newTrigger('sincronizarAutomatico')
      .timeBased()
      .everyMinutes(1)
      .create();
    Logger.log('✅ Trigger automático creado (cada 1 minuto)');

    // PASO 8: Activar hoja de Configuración
    var hojaConfig = ss.getSheetByName(CONFIG.SHEET_NAME_CONFIG);
    if (hojaConfig) {
      ss.setActiveSheet(hojaConfig);
      Logger.log('✅ Hoja de Configuración activada');
    }

    Logger.log('═══════════════════════════════════════════════════════');
    Logger.log('✅ INSTALACIÓN COMPLETADA');
    Logger.log('═══════════════════════════════════════════════════════');

    toast('✅ Instalación completada', 2);

    // Mensaje final
    ui.alert(
      '✅ Instalación Completada',
      '🚀 El sistema ha sido INSTALADO correctamente:\n\n' +
      '  ✅ Configuración creada con token de Kobo\n' +
      '  ✅ Plantilla de Empleados con ' + Object.keys(CONFIG.CORREOS_EMPLEADOS).length + ' empleados\n' +
      '  ✅ Directores configurados\n' +
      '  ✅ Trigger automático activado\n' +
      '  ✅ Menú "Días Personales" disponible\n\n' +
      '📋 PRÓXIMOS PASOS:\n' +
      '  1. Verifica el token en la hoja Configuración\n' +
      '  2. Ejecuta: Días Personales → 🔄 Buscar Nuevos Registros\n' +
      '  3. Revisa que los datos se importen correctamente\n\n' +
      '✅ ¡Listo para usar!',
      ui.ButtonSet.OK
    );

  } catch (error) {
    Logger.log('❌ ERROR EN INSTALACIÓN: ' + error.message);
    Logger.log('Stack: ' + error.stack);

    ui.alert(
      '❌ Error',
      'Hubo un error durante la instalación:\n\n' +
      error.message + '\n\n' +
      'Revisa el log en Apps Script para más detalles.',
      ui.ButtonSet.OK
    );
  }
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
