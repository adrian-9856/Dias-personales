# Sistema de Gestión de Días Personales - KoboToolbox Integration

Sistema automatizado para gestionar y reportar días personales de empleados, integrado con KoboToolbox y Google Sheets.

## 📋 Características

- ✅ **Conexión automática a KoboToolbox**: Obtiene datos directamente desde la API
- ✅ **Cálculo automático**: Calcula días tomados y días restantes (de 15 días totales)
- ✅ **Reportes visuales**: Genera reportes detallados con código de colores
- ✅ **Correos automáticos**: Envía reportes personalizados a cada director
- ✅ **Análisis por equipos**: Identifica equipos con mayor uso de días personales
- ✅ **Resumen general**: Vista global de todas las personas y estadísticas

## 🚀 Instalación

### Paso 1: Crear una nueva Google Sheet

1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea una nueva hoja de cálculo
3. Nómbrala "Gestión de Días Personales" (o el nombre que prefieras)

### Paso 2: Agregar el script

1. En tu Google Sheet, ve a **Extensiones** → **Apps Script**
2. Borra el código existente en `Code.gs`
3. Copia todo el contenido del archivo `Code.gs` de este repositorio
4. Pega el código en el editor de Apps Script
5. Guarda el proyecto (Ctrl+S o ⌘+S)
6. Dale un nombre al proyecto (ej: "Sistema Días Personales")

### Paso 3: Obtener token de KoboToolbox

1. Inicia sesión en [KoboToolbox](https://kf.kobotoolbox.org)
2. Ve a tu perfil → **Account Settings** → **Security**
3. En la sección **API Key**, genera o copia tu token
4. Guarda este token de manera segura

### Paso 4: Configurar el sistema

1. Cierra y vuelve a abrir tu Google Sheet (para que se cargue el menú)
2. Verás un nuevo menú **"📅 Días Personales"**
3. Haz clic en **📅 Días Personales** → **⚙️ Crear Configuración**
4. Se creará una hoja llamada "Configuración"
5. Completa los siguientes datos:

   | Campo | Descripción | Ejemplo |
   |-------|-------------|---------|
   | **Token KoboToolbox** (B1) | Tu token de API de KoboToolbox | abc123xyz456... |
   | **URL API KoboToolbox** (B2) | URL de exportación de datos CSV | https://kf.kobotoolbox.org/api/v2/assets/... |
   | **Días personales totales** (B3) | Días totales por persona al año | 15 |
   | **Enviar correos** (B4) | TRUE para activar, FALSE para desactivar | FALSE (inicialmente) |

## 🎯 Uso del Sistema

### Actualizar datos desde KoboToolbox

1. Ve al menú **📅 Días Personales** → **🔄 Actualizar Datos**
2. El sistema:
   - Descargará los datos más recientes de KoboToolbox
   - Procesará la información
   - Generará reportes en las hojas "Datos KoboToolbox" y "Resumen"
   - Enviará correos a los directores (si está activado en configuración)

### Enviar correos manualmente

1. Ve al menú **📅 Días Personales** → **📧 Enviar Correos Manualmente**
2. Utiliza los datos ya cargados en la hoja sin actualizar desde KoboToolbox
3. Útil para reenviar correos sin hacer una nueva consulta a la API

## 📊 Estructura de las Hojas

### Hoja "Configuración"
Contiene las credenciales y parámetros del sistema.

### Hoja "Datos KoboToolbox"
Datos crudos exportados desde KoboToolbox con todos los campos originales.

### Hoja "Resumen"
Reportes procesados con tres secciones:

1. **Estadísticas Generales**
   - Total de personas
   - Total de días tomados
   - Total de días restantes
   - Promedio por persona

2. **Detalle por Persona**
   - Nombre, equipo, director
   - Días tomados y restantes
   - Porcentaje usado
   - Código de colores:
     - 🔴 Rojo: Menos de 3 días restantes
     - 🟡 Amarillo: Entre 3-7 días restantes
     - 🟢 Verde: Más de 7 días restantes

3. **Resumen por Equipo**
   - Equipos ordenados por días tomados (de mayor a menor)
   - Total de personas por equipo
   - Promedio de días por persona

## 📧 Correos Automáticos

### Contenido del correo

Cada director recibe un correo HTML con:

- **Resumen del equipo**:
  - Total de personas
  - Días tomados y restantes
  - Promedio por persona

- **Detalle por persona**:
  - Tabla con nombre, días tomados, días restantes, porcentaje usado
  - Estado con alertas:
    - ⚠ Pocos días restantes (menos de 3)
    - ⚡ Considerar planificación (3-7 días)
    - ✓ OK (más de 7 días)

### Activar envío de correos

1. Ve a la hoja **"Configuración"**
2. En la celda **B4**, cambia el valor a **TRUE**
3. Asegúrate de que en tu formulario de KoboToolbox exista un campo con el correo del director

## 🔧 Configuración de KoboToolbox

### Campos requeridos en tu formulario

El sistema busca automáticamente estos campos (puedes usar cualquier nombre similar):

| Tipo de Campo | Nombres posibles | Requerido |
|---------------|------------------|-----------|
| Nombre del empleado | nombre, name, empleado, employee | ✅ |
| Equipo/Departamento | equipo, team, departamento, department | ✅ |
| Director/Supervisor | director, supervisor, jefe, manager | ✅ |
| Correo del director | correo_director, email_director, director_email | ✅ (para correos) |
| Días tomados | dias_tomados, dias, days_taken, dias_usados | ✅ |
| Fecha | fecha, date, fecha_inicio, start_date | ⚠️ Opcional |

### Obtener la URL de exportación

1. En KoboToolbox, ve a tu formulario
2. Haz clic en **DATOS** → **Descargas**
3. En **Exportar a CSV**, copia el enlace de descarga
4. Pega este enlace en la celda B2 de la hoja "Configuración"

**Ejemplo de URL:**
```
https://kf.kobotoolbox.org/api/v2/assets/aDmwMtoy4r65YTNSt4sURS/export-settings/esigRStULsbGhgCaayXsgHC/data.csv
```

## ⚡ Automatización (Opcional)

### Ejecutar automáticamente con triggers

Puedes configurar el sistema para que se ejecute automáticamente:

1. En Apps Script, ve a **Triggers** (icono de reloj ⏰)
2. Haz clic en **+ Agregar trigger**
3. Configura:
   - Función: `ejecutarAutomatico`
   - Tipo de evento: **Basado en tiempo**
   - Tipo de trigger temporal: **Temporizador por días**
   - Hora del día: Selecciona la hora preferida (ej: 8am - 9am)
4. Guarda

**Ejemplo**: Ejecutar todos los lunes a las 8am para enviar reportes semanales.

## 🔐 Permisos

La primera vez que ejecutes el sistema, Google te pedirá autorizar los siguientes permisos:

- ✅ Ver, editar, crear y eliminar todas tus hojas de cálculo de Google
- ✅ Conectarse a un servicio externo (KoboToolbox API)
- ✅ Enviar correos electrónicos en tu nombre

Estos permisos son necesarios para el funcionamiento del sistema.

## 🐛 Solución de Problemas

### Error: "No se ha configurado el token de KoboToolbox"
- **Solución**: Verifica que hayas ingresado tu token en la celda B1 de la hoja "Configuración"

### Error: "Error al conectar con KoboToolbox. Código: 401"
- **Solución**: Tu token es inválido o ha expirado. Genera un nuevo token en KoboToolbox

### Error: "Error al conectar con KoboToolbox. Código: 404"
- **Solución**: La URL de la API es incorrecta. Verifica que hayas copiado correctamente el enlace de exportación CSV

### No se envían correos
- **Solución 1**: Verifica que la celda B4 esté en TRUE
- **Solución 2**: Asegúrate de que tu formulario de KoboToolbox tenga un campo con el correo del director
- **Solución 3**: Revisa que los correos sean válidos

### Los datos no se procesan correctamente
- **Solución**: El sistema busca automáticamente los nombres de columnas. Si tus campos tienen nombres muy diferentes, edita la función `encontrarColumna()` en el código para agregar tus nombres específicos

## 📝 Ejemplo de Uso

### Escenario
Tienes un equipo de 10 personas, cada una con 15 días personales al año. Quieres:
1. Saber cuántos días ha tomado cada persona
2. Cuántos días les quedan
3. Enviar un reporte semanal a cada director

### Solución
1. Crea un formulario en KoboToolbox con campos: nombre, equipo, director, correo_director, dias_tomados
2. Las personas registran sus días tomados en el formulario
3. Configura este sistema en Google Sheets
4. Ejecuta "Actualizar Datos" cada lunes (o configura un trigger automático)
5. Los directores reciben un correo con el estado actual de su equipo

## 🔄 Actualizaciones Futuras

Ideas para mejorar el sistema:

- [ ] Dashboard con gráficos interactivos
- [ ] Notificaciones cuando alguien tenga menos de 3 días restantes
- [ ] Exportar reportes a PDF
- [ ] Integración con calendarios de Google
- [ ] Historial de días tomados por mes
- [ ] Comparativas entre equipos con gráficos

## 📞 Soporte

Si tienes preguntas o problemas:

1. Revisa la sección de **Solución de Problemas**
2. Ejecuta el menú **📅 Días Personales** → **ℹ️ Ayuda**
3. Revisa los logs en Apps Script: **Ver** → **Registros**

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso personal y comercial.

## 🙏 Créditos

Desarrollado para facilitar la gestión de días personales usando KoboToolbox y Google Sheets.

---

**Versión:** 1.0
**Última actualización:** Enero 2026