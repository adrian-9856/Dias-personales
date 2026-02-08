/**
 * Archivo de Ejemplo de Configuración
 *
 * INSTRUCCIONES:
 * 1. NO edites este archivo directamente
 * 2. Los valores de configuración se ingresan en la hoja "Configuración" de Google Sheets
 * 3. Este archivo es solo de referencia para mostrar la estructura
 */

// Configuración de ejemplo
const CONFIG_EJEMPLO = {
  // Token de autenticación de KoboToolbox
  // Obtener en: https://kf.kobotoolbox.org -> Account Settings -> Security -> API Key
  KOBO_TOKEN: 'tu_token_aqui_ejemplo_abc123xyz456',

  // URL de exportación CSV de KoboToolbox
  // Formato: https://kf.kobotoolbox.org/api/v2/assets/{ASSET_ID}/export-settings/{EXPORT_ID}/data.csv
  KOBO_API_URL: 'https://kf.kobotoolbox.org/api/v2/assets/aDmwMtoy4r65YTNSt4sURS/export-settings/esigRStULsbGhgCaayXsgHC/data.csv',

  // Días personales totales por empleado (por defecto: 15)
  DIAS_TOTALES: 15,

  // Nombres de las hojas en Google Sheets
  SHEET_NAME_DATOS: 'Datos KoboToolbox',
  SHEET_NAME_RESUMEN: 'Resumen',
  SHEET_NAME_CONFIG: 'Configuración'
};

/**
 * EJEMPLO DE CONFIGURACIÓN EN GOOGLE SHEETS
 *
 * Hoja: "Configuración"
 *
 * +---------------------------+--------------------------------------------------+
 * | A                         | B                                                |
 * +---------------------------+--------------------------------------------------+
 * | Token KoboToolbox:        | abc123xyz456... (tu token real)                  |
 * | URL API KoboToolbox:      | https://kf.kobotoolbox.org/api/v2/assets/...     |
 * | Días personales totales:  | 15                                               |
 * | Enviar correos:           | FALSE (cambiar a TRUE cuando esté listo)         |
 * +---------------------------+--------------------------------------------------+
 */

/**
 * EJEMPLO DE DATOS DE KOBO TOOLBOX
 *
 * Tu formulario de KoboToolbox debe exportar datos con esta estructura:
 *
 * +------------------+----------+-----------+---------------------------+---------------+
 * | nombre_empleado  | equipo   | director  | correo_director           | dias_tomados  |
 * +------------------+----------+-----------+---------------------------+---------------+
 * | Juan Pérez       | Ventas   | María     | maria.gonzalez@email.com  | 5             |
 * | Ana López        | Marketing| María     | maria.gonzalez@email.com  | 3             |
 * | Carlos Ruiz      | IT       | Pedro     | pedro.martinez@email.com  | 8             |
 * +------------------+----------+-----------+---------------------------+---------------+
 */

/**
 * VALORES PERMITIDOS PARA CONFIGURACIÓN
 */
const VALORES_PERMITIDOS = {
  // Enviar correos
  enviarCorreos: [true, false, 'TRUE', 'FALSE', 'true', 'false'],

  // Días totales (típicamente entre 10 y 30)
  diasTotales: {
    min: 1,
    max: 365,
    recomendado: [10, 12, 15, 20, 25, 30]
  }
};

/**
 * CONFIGURACIÓN AVANZADA (OPCIONAL)
 *
 * Estas configuraciones se hacen directamente en el código Code.gs
 */
const CONFIG_AVANZADA = {
  // Formato de fecha para los correos
  FORMATO_FECHA: 'es-ES',

  // Zona horaria
  TIMEZONE: 'America/Bogota', // Ajustar según tu ubicación

  // Límites de alerta
  ALERTA_CRITICA: 3,  // Días restantes para alerta roja
  ALERTA_MEDIA: 7,    // Días restantes para alerta amarilla

  // Opciones de correo
  CORREO_OPCIONES: {
    incluirCSV: false,      // Adjuntar CSV en el correo
    incluirGraficos: false, // Incluir gráficos (requiere más código)
    copiaOculta: '',        // BCC para todos los correos (ej: 'rrhh@empresa.com')
  },

  // Campos personalizados del formulario
  // Si tus campos tienen nombres diferentes, agrégalos aquí
  CAMPOS_CUSTOM: {
    nombre: ['nombre_completo', 'full_name'],
    equipo: ['departamento', 'area', 'division'],
    diasTomados: ['dias_ausencia', 'days_off']
  }
};

/**
 * EJEMPLOS DE USO
 */

// Ejemplo 1: Configuración básica
// - 15 días personales por empleado
// - Correos desactivados
// - Actualización manual

// Ejemplo 2: Configuración con correos automáticos
// - 20 días personales por empleado
// - Correos activados
// - Trigger para ejecutar todos los lunes a las 8am

// Ejemplo 3: Configuración multi-equipo
// - Diferentes límites por equipo (requiere personalización)
// - Múltiples directores
// - Reportes por departamento

/**
 * NOTAS IMPORTANTES:
 *
 * 1. NUNCA compartas tu token de KoboToolbox públicamente
 * 2. Mantén tu Google Sheet privado o con acceso limitado
 * 3. Prueba primero con correos desactivados (FALSE)
 * 4. Verifica que todos los correos de directores sean válidos
 * 5. Revisa los logs en Apps Script para detectar errores
 */

/**
 * SOLUCIÓN DE PROBLEMAS
 */

// Si el sistema no encuentra tus campos:
// 1. Abre la hoja "Datos KoboToolbox" después de ejecutar
// 2. Verifica los nombres exactos de las columnas
// 3. Agrega esos nombres a CAMPOS_CUSTOM arriba
// 4. O modifica la función encontrarColumna() en Code.gs

// Si los correos no se envían:
// 1. Verifica que B4 en "Configuración" esté en TRUE
// 2. Verifica que todos los registros tengan correo del director
// 3. Verifica que los correos sean válidos
// 4. Revisa que no hayas excedido el límite de 100 correos/día

/**
 * RECURSOS ADICIONALES
 *
 * - Documentación de KoboToolbox: https://support.kobotoolbox.org/
 * - Documentación de Google Apps Script: https://developers.google.com/apps-script
 * - Guía de instalación: Ver INSTALACION.md
 * - Preguntas frecuentes: Ver FAQ.md
 * - Personalización: Ver PERSONALIZACION.md
 */
