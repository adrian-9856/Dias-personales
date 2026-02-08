# Guía de Personalización

Esta guía te ayudará a personalizar el sistema según tus necesidades específicas.

## 🎨 Personalizar Colores

### Cambiar colores de los encabezados

Edita la función `escribirResumen()` en `Code.gs`:

```javascript
// Encabezado principal - Azul
sheet.getRange('A1')
  .setBackground('#FF5722')  // Naranja
  .setFontColor('#ffffff');  // Blanco

// Sección de personas - Verde
sheet.getRange(row, 1)
  .setBackground('#9C27B0')  // Morado
  .setFontColor('#ffffff');

// Sección de equipos - Amarillo
sheet.getRange(row, 1)
  .setBackground('#00BCD4')  // Cian
  .setFontColor('#ffffff');
```

### Cambiar colores del formato condicional

En la función `escribirResumen()`, busca las reglas condicionales:

```javascript
// Alerta roja - menos de 3 días
const rule1 = SpreadsheetApp.newConditionalFormatRule()
  .whenNumberLessThan(3)
  .setBackground('#ffcdd2')  // Rojo claro (cambia este color)
  .setRanges([rangoRestantes])
  .build();

// Alerta amarilla - entre 3 y 7 días
const rule2 = SpreadsheetApp.newConditionalFormatRule()
  .whenNumberBetween(3, 7)
  .setBackground('#fff9c4')  // Amarillo claro
  .setRanges([rangoRestantes])
  .build();

// OK verde - más de 7 días
const rule3 = SpreadsheetApp.newConditionalFormatRule()
  .whenNumberGreaterThan(7)
  .setBackground('#c8e6c9')  // Verde claro
  .setRanges([rangoRestantes])
  .build();
```

### Paleta de colores sugerida

```javascript
// Colores de Google Material Design
const COLORES = {
  azul: '#4285f4',
  verde: '#34a853',
  amarillo: '#fbbc04',
  rojo: '#ea4335',
  morado: '#9c27b0',
  naranja: '#ff9800',
  cian: '#00bcd4',
  rosa: '#e91e63'
};
```

---

## 📧 Personalizar Correos Electrónicos

### Agregar logo de la empresa

En la función `crearCuerpoCorreo()`:

```javascript
const html = `
  <html>
    <head>
      <style>
        /* tus estilos */
      </style>
    </head>
    <body>
      <!-- Agregar logo -->
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://tu-sitio.com/logo.png" alt="Logo Empresa" style="max-width: 200px;">
      </div>

      <h2>Reporte de Días Personales - ${director.director}</h2>
      <!-- resto del contenido -->
    </body>
  </html>
`;
```

### Cambiar el asunto del correo

En la función `enviarCorreosDirectores()`:

```javascript
// Original
const asunto = `Reporte de Días Personales - Equipo de ${director.director}`;

// Personalizado
const asunto = `📊 [Reporte Semanal] Días Personales - ${director.director}`;
// O
const asunto = `Resumen de Ausencias del Equipo ${director.director}`;
```

### Agregar firma personalizada

En la función `crearCuerpoCorreo()`, modifica el footer:

```javascript
<div class="footer">
  <p>Este correo fue generado automáticamente por el Sistema de Gestión de Días Personales.</p>
  <p>Fecha de generación: ${new Date().toLocaleString('es-ES')}</p>

  <!-- Agregar firma -->
  <hr style="margin: 20px 0;">
  <p><strong>Recursos Humanos</strong></p>
  <p>Tu Empresa S.A.</p>
  <p>📞 +123 456 7890 | 📧 rrhh@tuempresa.com</p>
  <p>🌐 <a href="https://www.tuempresa.com">www.tuempresa.com</a></p>
</div>
```

### Enviar correo con datos adjuntos (CSV)

```javascript
function enviarCorreoConAdjunto(director) {
  // Crear CSV
  const csvContent = director.personas.map(p =>
    `${p.nombre},${p.diasTomados},${p.diasRestantes}`
  ).join('\n');

  const blob = Utilities.newBlob(csvContent, 'text/csv', 'reporte_dias.csv');

  MailApp.sendEmail({
    to: director.correo,
    subject: 'Reporte de Días Personales',
    htmlBody: crearCuerpoCorreo(director),
    attachments: [blob]
  });
}
```

---

## 📊 Personalizar Reportes

### Agregar gráficos automáticos

```javascript
function agregarGraficos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_RESUMEN);

  // Crear gráfico de barras
  const chart = sheet.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(sheet.getRange('A10:B20')) // Ajusta el rango
    .setPosition(5, 8, 0, 0) // Fila 5, Columna 8
    .setOption('title', 'Días Tomados por Equipo')
    .setOption('hAxis', {title: 'Días'})
    .setOption('vAxis', {title: 'Equipo'})
    .build();

  sheet.insertChart(chart);
}
```

### Agregar columna de porcentaje visual

En la función `escribirResumen()`:

```javascript
// Después de escribir los datos de personas
datosPersonas.forEach((persona, index) => {
  const fila = row + index;
  const porcentaje = parseFloat(persona[5]) / 100; // Columna del %

  // Crear barra de progreso visual
  const barraWidth = Math.floor(porcentaje * 10);
  const barra = '█'.repeat(barraWidth) + '░'.repeat(10 - barraWidth);

  sheet.getRange(fila, 7).setValue(barra); // Columna 7
});
```

### Agregar resumen ejecutivo al inicio

En la función `escribirResumen()`, antes de escribir el detalle:

```javascript
// Agregar resumen ejecutivo
row = 3;
sheet.getRange(row, 1).setValue('RESUMEN EJECUTIVO')
  .setFontWeight('bold')
  .setFontSize(14)
  .setBackground('#ff9800')
  .setFontColor('#ffffff');
sheet.getRange(row, 1, 1, 3).merge();

row++;
const personasConPocosTooltips = resumen.datosCompletos.filter(p => p.diasRestantes < 3).length;
const equipoConMasDias = resumen.porEquipo[0]; // Ya está ordenado

sheet.getRange(row, 1).setValue('⚠️ Personas con menos de 3 días restantes:');
sheet.getRange(row, 2).setValue(personasConPocosTooltips).setFontWeight('bold').setFontColor('#d93025');
row++;
sheet.getRange(row, 1).setValue('📊 Equipo con más días tomados:');
sheet.getRange(row, 2).setValue(equipoConMasDias.equipo).setFontWeight('bold');
row++;
sheet.getRange(row, 1).setValue('📈 Total de días tomados en toda la organización:');
sheet.getRange(row, 2).setValue(resumen.totalDiasTomados.toFixed(1)).setFontWeight('bold');
```

---

## 🔔 Agregar Notificaciones

### Notificar cuando alguien tiene pocos días restantes

```javascript
function verificarAlertas(resumen) {
  const personasConPocosTooltips = resumen.datosCompletos.filter(p => p.diasRestantes < 3);

  if (personasConPocosTooltips.length > 0) {
    const mensaje = `⚠️ ALERTA: ${personasConPocosTooltips.length} personas tienen menos de 3 días restantes.\n\n` +
      personasConPocosTooltips.map(p => `- ${p.nombre} (${p.equipo}): ${p.diasRestantes} días restantes`).join('\n');

    MailApp.sendEmail({
      to: 'rrhh@tuempresa.com',
      subject: '⚠️ Alerta: Empleados con pocos días personales restantes',
      body: mensaje
    });
  }
}

// Agregar al final de ejecutarSistema()
verificarAlertas(resumen);
```

### Notificación en Slack

```javascript
function enviarNotificacionSlack(mensaje) {
  const webhookUrl = 'https://hooks.slack.com/services/TU_WEBHOOK_URL';

  const payload = {
    text: mensaje,
    username: 'Sistema de Días Personales',
    icon_emoji: ':calendar:'
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };

  UrlFetchApp.fetch(webhookUrl, options);
}

// Uso:
enviarNotificacionSlack('✅ Datos actualizados exitosamente');
```

---

## 🔢 Personalizar Cálculos

### Días personales variables por antigüedad

```javascript
function calcularDiasSegunAntiguedad(persona) {
  const antiguedad = persona.antiguedad || 0; // En años

  if (antiguedad < 1) return 12;
  if (antiguedad < 3) return 15;
  if (antiguedad < 5) return 18;
  return 20;
}

// Modificar en procesarDatos()
const diasTotales = calcularDiasSegunAntiguedad(persona);
const diasRestantes = diasTotales - diasTomados;
```

### Acumulación proporcional por mes

```javascript
function calcularDiasAcumulados() {
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1; // 1-12
  const diasAcumulados = (CONFIG.DIAS_TOTALES / 12) * mesActual;

  return Math.floor(diasAcumulados);
}

// Modificar CONFIG
CONFIG.DIAS_DISPONIBLES = calcularDiasAcumulados();
```

### Descontar fines de semana

```javascript
function contarDiasHabiles(fechaInicio, fechaFin) {
  let dias = 0;
  let fecha = new Date(fechaInicio);

  while (fecha <= fechaFin) {
    const diaSemana = fecha.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) { // No domingo ni sábado
      dias++;
    }
    fecha.setDate(fecha.getDate() + 1);
  }

  return dias;
}
```

---

## 📋 Agregar Filtros y Vistas

### Filtrar por equipo

```javascript
function generarReportePorEquipo(nombreEquipo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DATOS);
  const datos = sheet.getDataRange().getValues();

  // Filtrar por equipo
  const datosFiltrados = datos.filter(fila =>
    fila[1].toLowerCase() === nombreEquipo.toLowerCase() // Columna del equipo
  );

  // Crear nueva hoja para el equipo
  let sheetEquipo = ss.getSheetByName(`Equipo_${nombreEquipo}`);
  if (!sheetEquipo) {
    sheetEquipo = ss.insertSheet(`Equipo_${nombreEquipo}`);
  }

  sheetEquipo.clear();
  sheetEquipo.getRange(1, 1, datosFiltrados.length, datosFiltrados[0].length)
    .setValues(datosFiltrados);
}
```

### Crear vista de empleados críticos

```javascript
function crearVistaEmpleadosCriticos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Empleados Críticos');

  if (!sheet) {
    sheet = ss.insertSheet('Empleados Críticos');
  }

  // Obtener datos procesados
  const datosCSV = /* obtener datos */;
  const datosProcessados = procesarDatos(datosCSV);

  // Filtrar empleados con menos de 3 días
  const criticos = datosProcessados.filter(p => p.diasRestantes < 3);

  // Escribir en hoja
  const headers = ['Nombre', 'Equipo', 'Director', 'Días Restantes', 'Estado'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

  const datos = criticos.map(p => [
    p.nombre,
    p.equipo,
    p.director,
    p.diasRestantes,
    '⚠️ CRÍTICO'
  ]);

  if (datos.length > 0) {
    sheet.getRange(2, 1, datos.length, headers.length).setValues(datos);
    sheet.getRange(2, 1, datos.length, headers.length).setBackground('#ffcdd2');
  }
}
```

---

## 🌐 Integrar con Otras Herramientas

### Guardar datos en Google Drive

```javascript
function guardarBackupEnDrive() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const folder = DriveApp.getFolderById('ID_DE_TU_CARPETA');

  // Crear copia
  const fecha = Utilities.formatDate(new Date(), 'GMT-5', 'yyyy-MM-dd_HHmm');
  const nombre = `Backup_Dias_Personales_${fecha}`;

  ss.copy(nombre);

  // Mover a carpeta
  const archivos = DriveApp.getFilesByName(nombre);
  if (archivos.hasNext()) {
    const archivo = archivos.next();
    archivo.moveTo(folder);
  }
}
```

### Exportar a BigQuery (avanzado)

```javascript
function exportarABigQuery(datos) {
  // Requiere habilitar la API de BigQuery
  const projectId = 'tu-proyecto-id';
  const datasetId = 'tu-dataset';
  const tableId = 'dias_personales';

  // Preparar datos
  const rows = datos.map(d => ({
    json: {
      nombre: d.nombre,
      equipo: d.equipo,
      dias_tomados: d.diasTomados,
      dias_restantes: d.diasRestantes,
      fecha: new Date().toISOString()
    }
  }));

  // Insertar en BigQuery
  BigQuery.Tabledata.insertAll({rows: rows}, projectId, datasetId, tableId);
}
```

---

## ⚙️ Configuración Avanzada

### Configuración multi-idioma

```javascript
const IDIOMAS = {
  es: {
    titulo: 'Reporte de Días Personales',
    diasTomados: 'Días Tomados',
    diasRestantes: 'Días Restantes'
  },
  en: {
    titulo: 'Personal Days Report',
    diasTomados: 'Days Taken',
    diasRestantes: 'Days Remaining'
  }
};

const CONFIG = {
  IDIOMA: 'es', // Cambiar a 'en' para inglés
  // ...
};

// Uso:
const t = IDIOMAS[CONFIG.IDIOMA];
sheet.getRange('A1').setValue(t.titulo);
```

### Configuración por propiedades de script (más seguro)

```javascript
// Guardar token de forma segura
function guardarTokenSeguro(token) {
  PropertiesService.getScriptProperties().setProperty('KOBO_TOKEN', token);
}

// Leer token
function obtenerTokenSeguro() {
  return PropertiesService.getScriptProperties().getProperty('KOBO_TOKEN');
}

// Modificar en obtenerDatosKoboToolbox()
const token = obtenerTokenSeguro() || CONFIG.KOBO_TOKEN;
```

---

## 🧪 Testing y Debug

### Modo debug

```javascript
const DEBUG = true; // Cambiar a false en producción

function log(mensaje) {
  if (DEBUG) {
    Logger.log('[DEBUG] ' + mensaje);
  }
}

// Uso:
log('Procesando datos de: ' + persona.nombre);
```

### Función de prueba

```javascript
function probarConDatosDePrueba() {
  const datosPrueba = [
    ['nombre', 'equipo', 'director', 'correo_director', 'dias_tomados'],
    ['Juan Pérez', 'Ventas', 'María', 'maria@test.com', 5],
    ['Ana López', 'Marketing', 'Pedro', 'pedro@test.com', 10]
  ];

  const datosProcessados = procesarDatos(datosPrueba);
  Logger.log(datosProcessados);
}
```

---

## 📚 Más Ideas de Personalización

1. **Dashboard con Google Data Studio**: Conecta tu hoja como fuente de datos
2. **Alertas por SMS**: Usa Twilio API para enviar SMS
3. **Bot de Telegram**: Crea un bot que consulte días restantes
4. **Integración con RRHH**: Exporta a sistemas de nómina
5. **Historial de cambios**: Guarda snapshot mensual de datos
6. **Predicción de uso**: Usa tendencias para predecir cuándo se agotarán los días

---

¿Tienes una personalización interesante? ¡Compártela!
