# 🎯 Sistema de Gestión de Días Personales - Elige tu Versión

Hay **DOS versiones** del sistema. Elige la que mejor se adapte a tus necesidades:

---

## 📦 Versión 1: SIMPLE (Recomendada) ⭐

### ✅ Úsala si:
- No quieres complicaciones técnicas
- Prefieres tener control manual
- No tienes o no quieres usar el token de KoboToolbox
- Quieres algo que funcione YA sin configuraciones

### 🎯 Características:
- ✅ **NO requiere token de autenticación**
- ✅ Descarga manual desde KoboToolbox
- ✅ Copiar y pegar datos
- ✅ Procesar con un click
- ✅ Todas las funcionalidades de cálculo
- ✅ Reportes con código de colores
- ✅ Detección de duplicados

### 📁 Archivos:
- **`Code-Simple.gs`** - Código principal
- **`GUIA_SUPER_SIMPLE.md`** - Guía de instalación y uso

### ⏱️ Tiempo de configuración:
**5 minutos**

### 🚀 Inicio Rápido:
1. Copia el código de `Code-Simple.gs` en Apps Script
2. Ejecuta "Crear Configuración" y "Crear Hoja Datos Importados"
3. Descarga CSV de KoboToolbox
4. Pega en la hoja "Datos Importados"
5. Ejecuta "Procesar Datos"
6. ¡Listo!

[👉 Ver Guía Completa - GUIA_SUPER_SIMPLE.md](GUIA_SUPER_SIMPLE.md)

---

## 🤖 Versión 2: AUTOMÁTICA

### ✅ Úsala si:
- Quieres que todo se actualice automáticamente
- Tienes el token de KoboToolbox y sabes configurarlo
- Quieres recibir notificaciones en tiempo real
- No te importa configurar triggers y APIs

### 🎯 Características:
- ✅ Conexión automática a KoboToolbox API
- ✅ Ejecución automática cada 15 minutos
- ✅ Notificaciones por correo automáticas
- ✅ Detección de nuevos registros en tiempo real
- ✅ Todas las funcionalidades de la versión simple
- ⚠️ **REQUIERE token de autenticación**
- ⚠️ Requiere configuración de API

### 📁 Archivos:
- **`Code.gs`** - Código principal
- **`INICIO_RAPIDO.md`** - Guía de configuración
- **`CAMPOS_FALTANTES.md`** - Requisitos del formulario

### ⏱️ Tiempo de configuración:
**10-15 minutos** (incluye obtener token, configurar URL de API, etc.)

### 🚀 Inicio Rápido:
1. Obtén tu token de KoboToolbox
2. Copia el código de `Code.gs` en Apps Script
3. Configura token y URL de API
4. Configura trigger automático
5. El sistema se ejecuta solo cada 15 minutos

[👉 Ver Guía Completa - INICIO_RAPIDO.md](INICIO_RAPIDO.md)

---

## 🆚 Comparación Directa

| Característica | Versión SIMPLE | Versión AUTOMÁTICA |
|----------------|----------------|-------------------|
| **Token requerido** | ❌ NO | ✅ SÍ |
| **Descarga de datos** | 📥 Manual (copiar/pegar) | 🤖 Automática |
| **Actualización** | 👆 Manual (cuando quieras) | ⏰ Cada 15 minutos |
| **Configuración inicial** | 😊 5 minutos | 🤔 10-15 minutos |
| **Dificultad técnica** | 🟢 Muy fácil | 🟡 Media |
| **Cálculo de días** | ✅ Automático | ✅ Automático |
| **Detección duplicados** | ✅ Sí | ✅ Sí |
| **Reportes con colores** | ✅ Sí | ✅ Sí |
| **Mapeo de directores** | ✅ Sí | ✅ Sí |
| **Correos automáticos** | ⚠️ Opcional | ✅ Sí |
| **Notificaciones** | ⚠️ Opcional | ✅ Tiempo real |
| **Control manual** | ✅ Total | ⚠️ Limitado |
| **Dependencia de API** | ❌ No | ✅ Sí |

---

## 💡 ¿Cuál elegir?

### Elige la **VERSIÓN SIMPLE** si:
- ✅ Eres nuevo en Google Apps Script
- ✅ No tienes experiencia con APIs
- ✅ Prefieres simplicidad sobre automatización
- ✅ Quieres empezar YA sin complicaciones
- ✅ Actualizas datos una o dos veces por semana
- ✅ No te importa hacer la actualización manualmente
- ✅ No quieres depender del token de KoboToolbox

### Elige la **VERSIÓN AUTOMÁTICA** si:
- ✅ Necesitas actualizaciones en tiempo real
- ✅ Tienes el token de KoboToolbox
- ✅ Sabes configurar APIs
- ✅ Quieres notificaciones automáticas
- ✅ Recibes muchas solicitudes diarias
- ✅ No quieres estar pendiente de actualizar manualmente
- ✅ Te sientes cómodo con configuraciones técnicas

---

## 📚 Documentación Común (Ambas Versiones)

Estos documentos aplican para ambas versiones:

- **README.md** - Documentación general
- **FAQ.md** - Preguntas frecuentes
- **PERSONALIZACION.md** - Personalizar colores, cálculos, etc.
- **LICENSE** - Licencia del proyecto

---

## 🔄 ¿Puedo cambiar de versión después?

**Sí**, puedes cambiar cuando quieras:

### De Simple a Automática:
1. Guarda tu hoja "Directores" y "Configuración"
2. Reemplaza el código con `Code.gs`
3. Configura token y URL de API
4. Configura trigger automático

### De Automática a Simple:
1. Guarda tu hoja "Directores" y "Configuración"
2. Reemplaza el código con `Code-Simple.gs`
3. Descarga datos manualmente
4. Pega en "Datos Importados"

Las hojas de datos y configuración son compatibles entre versiones.

---

## 🎓 Tutoriales por Versión

### Para Versión SIMPLE:
1. [GUIA_SUPER_SIMPLE.md](GUIA_SUPER_SIMPLE.md) - Inicio en 5 minutos
2. [FAQ.md](FAQ.md) - Preguntas frecuentes
3. [PERSONALIZACION.md](PERSONALIZACION.md) - Personalizar

### Para Versión AUTOMÁTICA:
1. [INICIO_RAPIDO.md](INICIO_RAPIDO.md) - Configuración en 10 minutos
2. [CAMPOS_FALTANTES.md](CAMPOS_FALTANTES.md) - Requisitos del formulario
3. [FAQ.md](FAQ.md) - Preguntas frecuentes
4. [PERSONALIZACION.md](PERSONALIZACION.md) - Personalizar

---

## 🆘 Ayuda

### Si elegiste la Versión SIMPLE:
- Lee [GUIA_SUPER_SIMPLE.md](GUIA_SUPER_SIMPLE.md)
- Sección "Solución de Problemas" en la guía
- [FAQ.md](FAQ.md) sección "Versión Simple"

### Si elegiste la Versión AUTOMÁTICA:
- Lee [INICIO_RAPIDO.md](INICIO_RAPIDO.md)
- Lee [CAMPOS_FALTANTES.md](CAMPOS_FALTANTES.md)
- [FAQ.md](FAQ.md) sección "Versión Automática"
- Revisa los logs en Apps Script

---

## ⭐ Recomendación

**Si tienes dudas, empieza con la VERSIÓN SIMPLE.**

Es más fácil, más rápida de configurar, y tiene todas las funcionalidades principales. Siempre puedes cambiar a la automática después si lo necesitas.

---

## 📊 Funcionalidades Comunes (Ambas Versiones)

Ambas versiones incluyen:

✅ Cálculo automático de días entre fechas
✅ Suma de días tomados por persona
✅ Cálculo de días restantes (de 15 totales)
✅ Porcentaje de días usados
✅ Reportes con código de colores:
  - 🔴 Rojo: Menos de 3 días restantes
  - 🟡 Amarillo: 3-7 días restantes
  - 🟢 Verde: Más de 7 días restantes
✅ Resumen por equipo (ordenado por días tomados)
✅ Mapeo de directores por equipo
✅ Historial de solicitudes procesadas
✅ Detección de duplicados
✅ Estadísticas generales
✅ Número de solicitudes por persona

---

## 🎯 Empieza Ahora

### Versión SIMPLE (Recomendada):
👉 Abre **[GUIA_SUPER_SIMPLE.md](GUIA_SUPER_SIMPLE.md)** y sigue los 5 pasos

### Versión AUTOMÁTICA:
👉 Abre **[INICIO_RAPIDO.md](INICIO_RAPIDO.md)** y sigue la guía de 10 minutos

---

**¡Éxito con tu sistema de gestión de días personales!** 🎉
