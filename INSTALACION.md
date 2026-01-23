# Guía Rápida de Instalación

## 🚀 Instalación en 5 Minutos

### Paso 1: Google Sheets (1 minuto)
1. Crea una nueva [Google Sheet](https://sheets.google.com)
2. Nómbrala "Gestión de Días Personales"

### Paso 2: Apps Script (2 minutos)
1. En tu Google Sheet: **Extensiones** → **Apps Script**
2. Borra el código existente
3. Copia y pega todo el contenido de `Code.gs`
4. Guarda (Ctrl+S)

### Paso 3: Token de KoboToolbox (1 minuto)
1. Ve a [KoboToolbox](https://kf.kobotoolbox.org)
2. **Perfil** → **Account Settings** → **Security**
3. Copia tu **API Key**

### Paso 4: Configuración (1 minuto)
1. Cierra y abre tu Google Sheet
2. Menú **📅 Días Personales** → **⚙️ Crear Configuración**
3. En la hoja "Configuración":
   - **B1**: Pega tu token de KoboToolbox
   - **B2**: URL de exportación CSV de tu formulario
   - **B3**: 15 (días personales totales)
   - **B4**: FALSE (por ahora)

### Paso 5: Primera Prueba (30 segundos)
1. Menú **📅 Días Personales** → **🔄 Actualizar Datos**
2. Autoriza los permisos cuando se soliciten
3. ¡Listo! Revisa las hojas "Datos KoboToolbox" y "Resumen"

---

## 🔑 Obtener URL de Exportación de KoboToolbox

### Método 1: Desde la interfaz web
1. Abre tu proyecto en KoboToolbox
2. Ve a la pestaña **DATOS**
3. Haz clic en **Descargas** o **Downloads**
4. Busca la opción **CSV**
5. Copia el enlace de descarga (no descargues el archivo, solo copia el enlace)

### Método 2: Desde la API
La URL tiene este formato:
```
https://kf.kobotoolbox.org/api/v2/assets/{ASSET_ID}/export-settings/{EXPORT_ID}/data.csv
```

Reemplaza:
- `{ASSET_ID}`: ID de tu formulario
- `{EXPORT_ID}`: ID de configuración de exportación

---

## ⚙️ Configuración Inicial Recomendada

### Para pruebas (primera vez)
```
Token KoboToolbox: tu_token_aqui
URL API: tu_url_de_exportacion
Días personales totales: 15
Enviar correos: FALSE
```

### Para producción (después de probar)
```
Token KoboToolbox: tu_token_aqui
URL API: tu_url_de_exportacion
Días personales totales: 15
Enviar correos: TRUE
```

---

## 📋 Checklist de Instalación

- [ ] Google Sheet creada
- [ ] Código de `Code.gs` pegado en Apps Script
- [ ] Token de KoboToolbox obtenido
- [ ] URL de exportación CSV obtenida
- [ ] Hoja "Configuración" creada
- [ ] Token ingresado en B1
- [ ] URL ingresada en B2
- [ ] Primera ejecución exitosa
- [ ] Datos visibles en hojas "Datos KoboToolbox" y "Resumen"
- [ ] Correos de prueba enviados (opcional)

---

## 🆘 Ayuda Rápida

### No veo el menú "📅 Días Personales"
- Cierra y vuelve a abrir la Google Sheet
- Refresca la página (F5)
- Espera 30 segundos y vuelve a intentar

### Error de autorización
- Es normal la primera vez
- Haz clic en "Revisar permisos"
- Selecciona tu cuenta de Google
- Haz clic en "Permitir"

### Los datos no aparecen
- Verifica que tu token sea correcto
- Verifica que la URL sea correcta
- Revisa que tu formulario de KoboToolbox tenga datos
- Ve a **Extensiones** → **Apps Script** → **Ver** → **Registros** para ver errores

---

## 📧 Configurar Correos

### Antes de activar el envío de correos

1. **Prueba sin correos primero**: Deja B4 en FALSE
2. **Revisa los datos**: Verifica que los datos se procesen correctamente
3. **Verifica correos**: Asegúrate de que el campo de correo del director esté completo
4. **Prueba manual**: Usa "Enviar Correos Manualmente" para una prueba
5. **Activa automático**: Cambia B4 a TRUE

### Formato del correo del director en KoboToolbox

Tu formulario debe tener un campo como:
- Nombre del campo: `correo_director`, `email_director`, o `director_email`
- Tipo: Text
- Formato: correo@ejemplo.com

---

## 🔄 Automatización con Triggers

### Configurar ejecución automática

1. **Apps Script** → **Triggers** (⏰)
2. **+ Agregar trigger**
3. Configuración recomendada:
   - Función: `ejecutarAutomatico`
   - Evento: Basado en tiempo
   - Tipo: Temporizador por días
   - Hora: 8am - 9am
   - Día: Lunes

### Ejemplos de frecuencias

| Frecuencia | Configuración |
|------------|---------------|
| Diaria | Temporizador por días, todos los días, 8am-9am |
| Semanal | Temporizador por semana, Lunes, 8am-9am |
| Mensual | Temporizador por mes, Día 1, 8am-9am |

---

## ✅ Siguiente Paso

Una vez instalado, lee el [README.md](README.md) para entender todas las funcionalidades.

¡Disfruta de tu sistema de gestión de días personales! 🎉
