# 🎯 Guía Super Simple - SIN TOKEN

## ✅ Versión sin complicaciones - Solo copiar y pegar

### 📥 Paso 1: Preparar Google Sheets (2 minutos)

1. Crea una nueva [Google Sheet](https://sheets.google.com)
2. **Extensiones** → **Apps Script**
3. Borra todo el código que está ahí
4. Copia COMPLETO el archivo **`Code-Simple.gs`** de este repositorio
5. Pega en el editor
6. Guarda (Ctrl+S)
7. Cierra y vuelve a abrir Google Sheets

### ⚙️ Paso 2: Configuración Inicial (1 minuto)

1. Verás un nuevo menú **"📅 Días Personales"**
2. Click en **"📅 Días Personales"** → **"⚙️ Crear Configuración"**
3. Click en **"📅 Días Personales"** → **"📋 Crear Hoja Datos Importados"**
4. Click en **"📅 Días Personales"** → **"👥 Configurar Directores"**
5. Completa los nombres y correos de los directores en la hoja que se creó

### 📊 Paso 3: Importar Datos de KoboToolbox (1 minuto)

#### Desde KoboToolbox:
1. Ve a tu formulario en KoboToolbox
2. Click en **DATOS** → **Descargas**
3. Click en **CSV** (descarga el archivo)
4. Abre el archivo CSV con Excel o Google Sheets

#### Copiar a Google Sheets:
5. Selecciona **TODO** (Ctrl+A o ⌘+A)
6. Copia (Ctrl+C o ⌘+C)
7. Ve a tu Google Sheet
8. Abre la hoja **"Datos Importados"**
9. Click en la celda **A1**
10. Pega (Ctrl+V o ⌘+V)

### ▶️ Paso 4: Procesar (10 segundos)

1. Click en **"📅 Días Personales"** → **"🔄 Procesar Datos"**
2. Espera unos segundos
3. ¡Listo! ✅

### 📈 Paso 5: Ver Resultados

Abre la hoja **"Resumen"** y verás:
- Estadísticas generales
- Detalle por persona con código de colores
- Resumen por equipo

---

## 🔄 ¿Cómo actualizar con nuevos datos?

Cada vez que haya nuevas solicitudes:

1. Descarga el CSV desde KoboToolbox
2. Copia todo
3. Pega en la hoja "Datos Importados" (reemplaza todo)
4. Ejecuta "🔄 Procesar Datos"
5. ¡Listo!

El sistema detectará automáticamente cuáles son registros nuevos y cuáles ya procesó.

---

## ✨ Características

### ✅ Lo que SÍ hace:
- Calcula automáticamente los días entre fecha inicio y fin
- Agrupa todas las solicitudes de cada persona
- Suma días totales tomados
- Calcula días restantes (de 15 totales)
- Muestra código de colores según días restantes
- Identifica equipos con más días tomados
- Detecta registros nuevos (evita duplicados)
- Mantiene historial de todo lo procesado

### ❌ Lo que NO necesitas:
- Token de autenticación
- Configurar URL de API
- Conexión automática a KoboToolbox
- Triggers automáticos
- Programación de horarios

---

## 📋 Campos Necesarios en tu Formulario

Tu formulario de KoboToolbox DEBE tener:

| Campo | Nombre en Kobo | Requerido |
|-------|----------------|-----------|
| Nombre del empleado | `nombre` o `nombre_empleado` | ✅ MUY IMPORTANTE |
| Equipo/Programa | `programa_departamento` o `equipo` | ✅ Sí |
| Fecha de inicio | `fecha_inicio` | ✅ Sí |
| Fecha de finalización | `fecha_finalizacion` o `fecha_fin` | ✅ Sí |

Campos opcionales:
- Conoces el reglamento
- Consentimiento del director

---

## 🎨 Código de Colores en el Resumen

| Color | Días Restantes | Estado |
|-------|----------------|--------|
| 🟢 Verde | Más de 7 días | ✓ OK |
| 🟡 Amarillo | Entre 3-7 días | ⚡ Considerar planificación |
| 🔴 Rojo | Menos de 3 días | ⚠ Pocos días restantes |

---

## 📧 Activar Correos (Opcional)

Si quieres recibir un correo cada vez que proceses datos:

1. Ve a la hoja **"Configuración"**
2. En la celda **B2**, cambia `FALSE` a `TRUE`
3. En la celda **B3**, pon tu correo
4. La próxima vez que ejecutes "Procesar Datos" recibirás un correo

---

## 🔍 Ejemplo Completo

### Datos en KoboToolbox:

| nombre_empleado | programa_departamento | fecha_inicio | fecha_finalizacion |
|-----------------|----------------------|--------------|-------------------|
| Juan Pérez | Operaciones | 2026-01-10 | 2026-01-12 |
| Juan Pérez | Operaciones | 2026-02-05 | 2026-02-05 |
| Ana López | Educación | 2026-01-15 | 2026-01-17 |

### Resultado en "Resumen":

| Nombre | Equipo | Días Tomados | Días Restantes | % Usado | # Solicitudes |
|--------|--------|--------------|----------------|---------|---------------|
| Juan Pérez | Operaciones | 4 | 11 | 26.7% | 2 |
| Ana López | Educación | 3 | 12 | 20.0% | 1 |

---

## ⚠️ Solución de Problemas

### Error: "La hoja Datos Importados está vacía"
**Solución:** Pega los datos de KoboToolbox en la hoja "Datos Importados"

### Error: "No se pudo procesar ningún dato"
**Causas:**
1. Falta el campo "nombre" en el formulario
2. Faltan las fechas
3. Los datos no están en el formato correcto

**Solución:** Verifica que tu formulario tenga todos los campos necesarios

### Los días no se calculan bien
**Verifica:**
- Que las fechas estén en formato: `2026-01-15` (yyyy-mm-dd)
- Que fecha_finalizacion sea mayor o igual a fecha_inicio
- Que ambos campos tengan valores

### No veo la hoja "Resumen"
**Solución:** Ejecuta "🔄 Procesar Datos" primero. La hoja se crea automáticamente.

---

## 💡 Tips

### Tip 1: Actualización rápida
No necesitas abrir el CSV descargado. Puedes:
1. Descargar el CSV
2. Arrastrarlo directamente a Google Drive
3. Abrirlo con Google Sheets
4. Copiar todo
5. Pegar en "Datos Importados"

### Tip 2: Verificar antes de procesar
Antes de ejecutar "Procesar Datos", verifica en "Datos Importados" que:
- La primera fila tenga los nombres de las columnas
- Haya datos debajo
- Las fechas estén completas

### Tip 3: Mantener historial
La hoja "Historial de Solicitudes" guarda todo lo procesado. No la borres, así el sistema evita duplicados.

### Tip 4: Directores por equipo
Si no completas la hoja "Directores", el sistema funcionará igual, pero en los reportes aparecerá "Sin asignar" como director.

---

## 📊 Hojas del Sistema

### 1. **Configuración**
Parámetros básicos del sistema

### 2. **Datos Importados**
Aquí pegas los datos de KoboToolbox (se actualiza cada vez que pegas)

### 3. **Resumen**
Reportes procesados con estadísticas y código de colores

### 4. **Directores**
Mapeo de equipos a directores (solo necesitas completarlo una vez)

### 5. **Historial de Solicitudes**
Registro de todo lo procesado (evita duplicados automáticamente)

---

## ✅ Checklist

Antes de procesar por primera vez:

- [ ] Código `Code-Simple.gs` pegado en Apps Script
- [ ] Menú "📅 Días Personales" visible
- [ ] Hoja "Configuración" creada
- [ ] Hoja "Datos Importados" creada
- [ ] Hoja "Directores" creada y completada
- [ ] Formulario de Kobo tiene campo "nombre" o "nombre_empleado"
- [ ] Datos CSV descargados y pegados en "Datos Importados"
- [ ] Ejecutado "Procesar Datos"
- [ ] Hoja "Resumen" generada correctamente

---

## 🎯 Ventajas de esta Versión

✅ **Sin complicaciones técnicas**
- No necesitas token
- No necesitas URL de API
- No necesitas configurar triggers

✅ **Control total**
- Tú decides cuándo actualizar
- Ves exactamente qué datos se procesan
- Puedes revisar antes de procesar

✅ **Funciona igual de bien**
- Todas las funcionalidades de cálculo
- Todos los reportes
- Detección de duplicados
- Código de colores

✅ **Fácil de usar**
- Solo copiar y pegar
- Un click para procesar
- Resultados inmediatos

---

## 🆚 Diferencia con la Versión Automática

| Característica | Versión Simple | Versión Automática |
|----------------|----------------|-------------------|
| Token requerido | ❌ No | ✅ Sí |
| Descarga automática | ❌ No | ✅ Sí |
| Actualización manual | ✅ Sí | ❌ No |
| Ejecución automática | ❌ No | ✅ Sí (cada 15 min) |
| Cálculo de días | ✅ Sí | ✅ Sí |
| Detección duplicados | ✅ Sí | ✅ Sí |
| Reportes con colores | ✅ Sí | ✅ Sí |
| Mapeo directores | ✅ Sí | ✅ Sí |
| Dificultad | 😊 Muy fácil | 🤔 Media |

---

## 🚀 ¿Listo para empezar?

Sigue los **5 pasos** del inicio de esta guía y en 5 minutos tendrás tu sistema funcionando.

¿Preguntas? Revisa la sección de **Solución de Problemas** más arriba.

---

**¡Disfruta de tu sistema simple de gestión de días personales!** 🎉
