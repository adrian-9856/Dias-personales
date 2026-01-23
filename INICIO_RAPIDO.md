# 🚀 Inicio Rápido - Sistema Automático v2.0

## ⏱️ Configuración en 10 Minutos

### Paso 1: Actualizar Formulario de KoboToolbox (3 minutos)

1. Ve a tu formulario en KoboToolbox
2. Edita el formulario
3. **AGREGA este campo al inicio:**

```
Tipo: Text
Nombre: nombre_empleado
Etiqueta: ¿Cuál es tu nombre completo?
Requerido: Sí
```

4. Guarda y vuelve a desplegar

Tu formulario ahora debe tener:
- ✅ Nombre del empleado (NUEVO)
- ✅ Conoces el reglamento
- ✅ Programa/Departamento
- ✅ Fecha de inicio
- ✅ Fecha de finalización
- ✅ Consentimiento del director

---

### Paso 2: Configurar Google Sheets (4 minutos)

#### 2.1 Crear hoja y script
1. Crea una nueva [Google Sheet](https://sheets.google.com)
2. **Extensiones** → **Apps Script**
3. Copia todo el contenido de `Code.gs` del repositorio
4. Pega en el editor
5. Guarda (Ctrl+S)

#### 2.2 Configurar credenciales
1. Cierra y vuelve a abrir Google Sheets
2. Verás el menú **"📅 Días Personales"**
3. Click en **"⚙️ Crear Configuración"**
4. Completa:

| Celda | Valor |
|-------|-------|
| B1 | Tu token de KoboToolbox |
| B2 | URL de exportación CSV |
| B3 | 15 |
| B4 | FALSE (por ahora) |
| B5 | tu@correo.com |

#### 2.3 Configurar directores
1. Click en **"👥 Configurar Directores"**
2. Completa para cada equipo:

| Equipo | Director | Correo |
|--------|----------|--------|
| Apoyo emocional | (nombre) | (correo) |
| Operaciones | (nombre) | (correo) |
| mi-eelo | (nombre) | (correo) |
| etc. | ... | ... |

---

### Paso 3: Activar Ejecución Automática (2 minutos)

1. Click en **"⏰ Configurar Trigger Automático"**
2. Acepta los permisos cuando se soliciten
3. Click en "Sí" para activar

🎉 **¡Listo!** El sistema ahora verificará nuevos registros cada 15 minutos.

---

### Paso 4: Probar el Sistema (1 minuto)

1. Envía un formulario de prueba en KoboToolbox
2. Espera máximo 15 minutos
3. Revisa tu correo (deberías recibir una notificación)
4. Revisa las hojas en Google Sheets:
   - **Datos KoboToolbox**: Datos crudos
   - **Resumen**: Reportes procesados
   - **Historial de Solicitudes**: Registro de procesados

---

## 🔍 Verificación

### ¿Todo funciona correctamente?

Verifica estos puntos:

✅ Menú "📅 Días Personales" visible
✅ Hoja "Configuración" creada con tus datos
✅ Hoja "Directores" completada
✅ Formulario de prueba enviado
✅ Correo de notificación recibido
✅ Datos visibles en hoja "Resumen"

---

## ⚙️ Cómo Funciona

### Flujo Automático:

```
1. Cada 15 minutos el sistema se ejecuta
2. Descarga datos de KoboToolbox
3. Compara con historial para detectar nuevos registros
4. Calcula días automáticamente (fecha_fin - fecha_inicio)
5. Agrupa solicitudes por empleado
6. Calcula días totales tomados y restantes
7. Actualiza hoja "Resumen"
8. Envía correo al administrador si hay nuevos registros
9. Guarda en "Historial de Solicitudes"
```

### Ejemplo de Cálculo:

```
Juan Pérez envía 3 solicitudes:
- Del 2026-01-10 al 2026-01-12 → 3 días
- Del 2026-02-05 al 2026-02-05 → 1 día
- Del 2026-03-15 al 2026-03-16 → 2 días

Total de Juan: 6 días tomados
Días restantes: 15 - 6 = 9 días
```

---

## 📧 Correos Automáticos

### Cuando hay un nuevo registro:

**Para:** tu@correo.com (administrador)
**Asunto:** 🔔 Nueva(s) solicitud(es) de días personales - 1 registro(s)
**Contenido:** Tabla con los nuevos registros

### Para activar correos a directores:

1. Ve a la hoja "Configuración"
2. Cambia B4 de `FALSE` a `TRUE`
3. Los directores recibirán reportes cuando ejecutes "Enviar Reporte a Directores"

---

## 📊 Hojas del Sistema

### 1. Configuración
Credenciales y parámetros del sistema

### 2. Directores
Mapeo de equipos a directores (nombre y correo)

### 3. Datos KoboToolbox
Datos crudos exportados de Kobo (se actualiza cada ejecución)

### 4. Resumen
Reportes procesados:
- Estadísticas generales
- Detalle por persona (con código de colores)
- Resumen por equipo (ordenado por días tomados)

### 5. Historial de Solicitudes
Registro de todos los formularios procesados (evita duplicados)

---

## 🎛️ Opciones del Menú

### 🔄 Actualizar Datos Manualmente
Ejecuta el sistema inmediatamente (sin esperar los 15 minutos)

### ⚙️ Crear Configuración
Crea/recrea la hoja de configuración

### 👥 Configurar Directores
Crea la hoja de mapeo de directores

### ⏰ Configurar Trigger Automático
Activa/desactiva la ejecución automática cada 15 minutos

### 📧 Enviar Reporte a Directores
Envía correo a todos los directores con el resumen de su equipo

### ℹ️ Ayuda
Muestra información del sistema

---

## ⚠️ Solución de Problemas Comunes

### Error: "No se ha configurado el token de KoboToolbox"
**Solución:** Ingresa tu token en la hoja "Configuración" celda B1

### No recibo correos
**Posibles causas:**
1. Correo no configurado en B5 → Ingrésalo
2. Correos desactivados (B4 = FALSE) → Cámbialo a TRUE si quieres correos
3. No hay registros nuevos → Envía un formulario de prueba

### No se detectan registros nuevos
**Solución:**
1. Verifica que el campo "nombre_empleado" exista en el formulario
2. Envía un nuevo formulario
3. Espera máximo 15 minutos
4. O ejecuta manualmente: "🔄 Actualizar Datos Manualmente"

### Los días no se calculan correctamente
**Verifica:**
- Que las fechas estén en formato yyyy-mm-dd
- Que fecha_fin >= fecha_inicio
- Que ambos campos estén completos

### El trigger no se ejecuta
**Solución:**
1. Ve a **Extensiones** → **Apps Script** → **Triggers** (⏰)
2. Verifica que exista un trigger para `ejecutarAutomatico`
3. Si no existe, ejecuta "⏰ Configurar Trigger Automático" nuevamente

---

## 📱 Notificaciones

### Recibirás correo cuando:

✅ Hay nuevos registros procesados
✅ Ocurre un error en el sistema

### Los directores reciben correo cuando:

✅ Ejecutas "Enviar Reporte a Directores"
✅ B4 está en TRUE (correos activados)
✅ El director tiene correo configurado en la hoja "Directores"

---

## 🔒 Seguridad y Privacidad

- ✅ Token de Kobo: Solo visible para ti (no compartir la hoja)
- ✅ Correos de directores: Solo visibles para ti
- ✅ Datos sensibles: Solo en tu Google Sheet privado
- ✅ API: Conexión segura con autenticación Token

---

## 📈 Estadísticas que Verás

### Resumen General:
- Total de personas
- Total de días tomados
- Total de días restantes
- Promedio por persona

### Por Persona:
- Nombre, equipo, director
- Días tomados, días restantes, % usado
- Número de solicitudes realizadas
- Código de colores según días restantes

### Por Equipo:
- Equipos ordenados por días tomados (mayor a menor)
- Total de personas por equipo
- Promedio de días por persona
- Identificar qué equipos usan más días

---

## 🎯 Próximos Pasos

Una vez que el sistema funcione:

1. **Monitorea durante una semana** para verificar que todo funcione
2. **Activa correos a directores** cambiando B4 a TRUE
3. **Personaliza** según tus necesidades (ver PERSONALIZACION.md)
4. **Programa reportes** semanales o mensuales a directores
5. **Ajusta el trigger** si 15 minutos es muy frecuente (puedes cambiar a cada hora)

---

## 📚 Documentación Adicional

- **README.md**: Documentación completa
- **CAMPOS_FALTANTES.md**: Qué campos agregar al formulario
- **FAQ.md**: Preguntas frecuentes
- **PERSONALIZACION.md**: Personalizar colores, correos, cálculos
- **ESTRUCTURA_FORMULARIO_KOBO.md**: Guía completa del formulario

---

## 💡 Tips

1. **Prueba primero** con correos desactivados (B4 = FALSE)
2. **Verifica** que el campo nombre_empleado sea obligatorio en Kobo
3. **Completa** toda la hoja de directores antes de activar correos
4. **Revisa** los logs en Apps Script si algo falla
5. **Espera** 15 minutos entre pruebas (o ejecuta manualmente)

---

¡Disfruta de tu sistema automático de gestión de días personales! 🎉

¿Preguntas? Revisa el FAQ.md o los logs en Apps Script → Ver → Registros
