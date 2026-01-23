# Preguntas Frecuentes (FAQ)

## 🔧 Instalación y Configuración

### ¿Necesito instalar algo en mi computadora?
No. Todo funciona en la nube:
- Google Sheets (gratis)
- Google Apps Script (incluido con Google Sheets)
- KoboToolbox (gratis)

### ¿Es gratis?
Sí, completamente gratis:
- Google Sheets: Gratis (incluido con cuenta de Google)
- KoboToolbox: Gratis para uso humanitario y de investigación
- Envío de correos: Gratis hasta 100 correos/día con Google Apps Script

### ¿Funciona con Excel o LibreOffice?
No. Este sistema está diseñado específicamente para Google Sheets porque usa Google Apps Script.

### ¿Puedo usar otro proveedor de formularios en lugar de KoboToolbox?
El sistema está diseñado para KoboToolbox, pero con modificaciones puede adaptarse a otras fuentes de datos como:
- Google Forms
- TypeForm
- SurveyMonkey
- Archivos CSV subidos manualmente

---

## 🔐 Seguridad y Privacidad

### ¿Es seguro poner mi token de KoboToolbox en Google Sheets?
El token queda en una hoja privada de tu Google Sheet. Solo tú y las personas con acceso a tu hoja pueden verlo.

**Recomendaciones de seguridad:**
1. No compartas el enlace de tu Google Sheet públicamente
2. Solo da acceso a personas de confianza
3. Puedes usar las propiedades de script para ocultar el token (avanzado)

### ¿Quién puede ver los datos?
Solo las personas que tengan acceso a tu Google Sheet. Puedes controlar los permisos desde:
- **Compartir** → Configurar permisos (Viewer, Editor, etc.)

### ¿Los datos quedan en Google o en KoboToolbox?
Los datos originales están en KoboToolbox. El sistema solo los copia temporalmente a Google Sheets para generar reportes.

---

## 📧 Correos Electrónicos

### ¿Cuántos correos puedo enviar?
Google Apps Script permite:
- **100 correos por día** (cuenta personal gratuita)
- **1,500 correos por día** (Google Workspace)

### ¿Puedo personalizar el diseño del correo?
Sí. Edita la función `crearCuerpoCorreo()` en `Code.gs`:
- Cambia colores en la sección `<style>`
- Modifica el contenido HTML
- Agrega tu logo (usando URL de imagen)

### ¿Se envían correos duplicados si ejecuto varias veces?
Sí, cada vez que ejecutas el sistema se envían los correos. Para evitarlo:
1. Usa "Actualizar Datos" solo cuando sea necesario
2. O modifica el código para llevar un registro de correos enviados

### ¿Puedo enviar correos en copia (CC) o copia oculta (BCC)?
Sí, modifica la función de envío:
```javascript
MailApp.sendEmail({
  to: director.correo,
  cc: 'rrhh@empresa.com',
  bcc: 'backup@empresa.com',
  subject: asunto,
  htmlBody: cuerpo
});
```

### ¿Los directores pueden responder al correo?
Sí, los correos se envían desde tu cuenta de Google, así que las respuestas llegarán a tu correo.

---

## 📊 Datos y Reportes

### ¿Los datos se actualizan automáticamente?
No. Debes ejecutar manualmente "Actualizar Datos" o configurar un trigger automático.

### ¿Puedo ver datos históricos?
El sistema muestra solo el estado actual. Para historial:
1. Guarda copias de la hoja "Resumen" con fechas
2. O modifica el código para agregar una columna de fecha/hora

### ¿Qué pasa si alguien ha tomado más de 15 días?
El sistema calculará días restantes negativos. Por ejemplo:
- Días tomados: 18
- Días restantes: -3
- Porcentaje usado: 120%

### ¿Puedo cambiar el total de días personales?
Sí, en la hoja "Configuración", celda B3, cambia el número 15 por el que necesites.

### ¿Puedo tener diferentes límites por persona?
No directamente. El sistema usa un límite global. Para implementar límites personalizados necesitarías modificar el código.

### ¿Cómo se manejan los medios días?
Usa decimales en el campo de días tomados:
- 0.5 = medio día
- 1.5 = día y medio
- 2.5 = dos días y medio

---

## 🔄 Automatización

### ¿Cómo programo ejecuciones automáticas?
1. Apps Script → Triggers (⏰)
2. + Agregar trigger
3. Función: `ejecutarAutomatico`
4. Evento: Basado en tiempo
5. Configura la frecuencia deseada

### ¿Puedo recibir una notificación cuando se ejecute automáticamente?
Sí, agrega al final de la función `ejecutarAutomatico()`:
```javascript
MailApp.sendEmail({
  to: 'tu@correo.com',
  subject: 'Sistema ejecutado exitosamente',
  body: 'Los datos se han actualizado a las ' + new Date()
});
```

### ¿Se ejecutará aunque mi computadora esté apagada?
Sí. Los triggers de Apps Script se ejecutan en los servidores de Google, no en tu computadora.

---

## 🐛 Errores y Solución de Problemas

### Error: "No se ha configurado el token de KoboToolbox"
**Causa:** El token está vacío.
**Solución:** Ve a la hoja "Configuración" y pega tu token en B1.

### Error: "Error al conectar con KoboToolbox. Código: 401"
**Causa:** Token inválido o expirado.
**Solución:**
1. Ve a KoboToolbox → Account Settings → Security
2. Regenera tu token
3. Actualiza el token en la celda B1

### Error: "Error al conectar con KoboToolbox. Código: 404"
**Causa:** URL incorrecta.
**Solución:**
1. Verifica que la URL en B2 termine en `.csv`
2. Asegúrate de copiar el enlace completo de exportación
3. Prueba abrir la URL en tu navegador (te pedirá autenticación)

### Error: "No hay datos para procesar"
**Causa:** El formulario de KoboToolbox está vacío.
**Solución:** Agrega al menos un registro de prueba en tu formulario.

### Error: "Exception: Service invoked too many times"
**Causa:** Has alcanzado el límite de llamadas a la API.
**Solución:** Espera un momento y vuelve a intentar.

### Los datos no se procesan correctamente
**Causa:** Nombres de columnas no coinciden.
**Solución:**
1. Revisa la hoja "Datos KoboToolbox"
2. Verifica los nombres de las columnas
3. Modifica la función `encontrarColumna()` si es necesario

### El código de colores no funciona
**Causa:** Formato condicional no aplicado.
**Solución:** Ejecuta "Actualizar Datos" nuevamente.

---

## 🎨 Personalización

### ¿Puedo cambiar los colores del reporte?
Sí, edita los valores hexadecimales en la función `escribirResumen()`:
```javascript
.setBackground('#4285f4')  // Azul de Google
.setBackground('#34a853')  // Verde
.setBackground('#fbbc04')  // Amarillo
```

### ¿Puedo agregar más columnas al reporte?
Sí, modifica:
1. La estructura de datos en `procesarDatos()`
2. Los encabezados en `escribirResumen()`
3. Los datos que se escriben en las celdas

### ¿Puedo exportar a PDF automáticamente?
Sí, agrega esta función:
```javascript
function exportarPDF() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Resumen');
  const url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=pdf&gid=' + sheet.getSheetId();

  // Luego puedes enviar esta URL por correo o guardarla en Drive
}
```

---

## 📈 Uso Avanzado

### ¿Puedo conectar esto a un dashboard de Looker Studio (Data Studio)?
Sí. Looker Studio puede conectarse directamente a Google Sheets. Pasos:
1. Crea un reporte en [Looker Studio](https://lookerstudio.google.com)
2. Conecta tu Google Sheet como fuente de datos
3. Crea visualizaciones basadas en la hoja "Resumen"

### ¿Puedo usar esto para múltiples empresas/proyectos?
Sí, tienes dos opciones:
1. **Una Google Sheet por empresa**: Duplica la hoja completa
2. **Una sola Google Sheet**: Agrega una columna "Empresa" en KoboToolbox y filtra por empresa

### ¿Puedo rastrear otros tipos de ausencias (vacaciones, licencias, etc.)?
Sí. Modifica tu formulario de KoboToolbox para incluir un campo "Tipo de ausencia" y ajusta el código para procesar cada tipo por separado.

### ¿Funciona con miles de registros?
Sí, pero puede ser más lento. Google Sheets tiene un límite de:
- 5 millones de celdas por hoja
- Generalmente hasta 40,000 filas es manejable

---

## 💰 Costos

### ¿Hay algún costo oculto?
No. Todo es gratis mientras:
- Uses menos de 100 correos/día
- Tu Google Sheet tenga menos de 5 millones de celdas
- Uses KoboToolbox en su plan gratuito

### ¿Qué pasa si necesito enviar más de 100 correos al día?
Opciones:
1. Usa Google Workspace (1,500 correos/día)
2. Divide el envío en múltiples días
3. Usa un servicio de correo externo (SendGrid, Mailgun)

---

## 🔄 Mantenimiento

### ¿Necesita actualizaciones?
No requiere mantenimiento regular, pero es recomendable:
- Revisar que el token de KoboToolbox no expire
- Actualizar el código si hay nuevas funcionalidades

### ¿Qué pasa si KoboToolbox cambia su API?
El sistema podría dejar de funcionar. En ese caso:
1. Revisa la documentación de la nueva API de KoboToolbox
2. Actualiza la URL y los headers en la función `obtenerDatosKoboToolbox()`

### ¿Dónde veo los errores del sistema?
En Apps Script:
1. **Extensiones** → **Apps Script**
2. **Ver** → **Registros** (o presiona Ctrl+Enter)
3. O ve a **Ejecuciones** para ver el historial

---

## 📚 Recursos Adicionales

### ¿Dónde aprendo más sobre Google Apps Script?
- [Documentación oficial](https://developers.google.com/apps-script)
- [Guías de inicio rápido](https://developers.google.com/apps-script/quickstart/macros)

### ¿Dónde aprendo más sobre KoboToolbox?
- [Documentación de KoboToolbox](https://support.kobotoolbox.org/)
- [API Documentation](https://support.kobotoolbox.org/api.html)

### ¿Puedo contribuir al proyecto?
¡Sí! Si tienes mejoras o nuevas funcionalidades:
1. Haz un fork del repositorio
2. Agrega tus cambios
3. Crea un pull request

---

## 🆘 ¿Aún tienes problemas?

Si tu pregunta no está aquí:
1. Revisa el archivo [README.md](README.md)
2. Revisa [INSTALACION.md](INSTALACION.md)
3. Revisa los logs en Apps Script
4. Abre un issue en el repositorio del proyecto

---

**¿Falta algo en esta FAQ?** ¡Abre un issue para agregar más preguntas!
