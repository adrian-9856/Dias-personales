# 🚨 SOLUCIÓN RÁPIDA - ARREGLAR TODO AHORA

## PASO 1: Ver qué columnas tienes en KoboToolbox

1. **Abre Apps Script** (Extensiones → Apps Script)

2. **Crea un archivo nuevo:**
   - Click en **+** junto a "Archivos"
   - Nombre: `VerColumnas`

3. **Copia este código:**

```javascript
function verColumnasKobo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var token = leerConfiguracion('Token KoboToolbox');

  if (!token) {
    Logger.log('❌ ERROR: No hay token configurado');
    return;
  }

  var url = 'https://kobo.humanitarianresponse.info/api/v2/assets/aZHQs43GR4NkbkGa6uAn6s/data.csv';

  try {
    var response = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': 'Token ' + token },
      muteHttpExceptions: true
    });

    var csv = response.getContentText();
    var lineas = csv.split('\n');
    var headers = lineas[0].split(';');

    Logger.log('═══════════════════════════════════════════');
    Logger.log('📋 COLUMNAS DEL CSV DE KOBO:');
    Logger.log('═══════════════════════════════════════════');

    for (var i = 0; i < headers.length; i++) {
      Logger.log('[' + i + '] ' + headers[i]);
    }

    Logger.log('═══════════════════════════════════════════');
    Logger.log('\n📊 PRIMERA FILA DE DATOS:');

    if (lineas.length > 1) {
      var datos = lineas[1].split(';');
      for (var i = 0; i < Math.min(headers.length, datos.length); i++) {
        Logger.log('[' + i + '] ' + headers[i] + ' = "' + datos[i] + '"');
      }
    }

    Logger.log('═══════════════════════════════════════════');
    Logger.log('✅ BUSCA el número [X] de la columna de DÍAS SOLICITADOS');
    Logger.log('   Y anótalo para el siguiente paso.');

  } catch (e) {
    Logger.log('❌ ERROR: ' + e.message);
  }
}

function leerConfiguracion(etiqueta) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Configuración');
    if (!sheet) return '';

    var data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().toLowerCase().includes(etiqueta.toLowerCase())) {
        return data[i][1] ? data[i][1].toString().trim() : '';
      }
    }
    return '';
  } catch (e) {
    return '';
  }
}
```

4. **Ejecuta la función:**
   - Selecciona `verColumnasKobo` en el dropdown
   - Click en **▶️ Ejecutar**

5. **Mira el log** (ícono de lista a la izquierda)

6. **Busca la columna que tiene los DÍAS** (ej: "Día personal solicitado")

7. **Anota el número** [X] de esa columna

---

## PASO 2: Copiar y pegar este número

**Dime qué número [X] viste en el log** y yo arreglaré el código para que use ESE número exacto.

Por ejemplo, si viste:
```
[13] Día personal solicitado
```

Dime: **"Es el número 13"**

---

## ⚡ ALTERNATIVA MÁS RÁPIDA

Si no quieres hacer eso, **responde estas preguntas:**

1. ¿Ya copiaste el código nuevo de GitHub a tu `Code.gs` en Apps Script?
2. ¿Ejecutaste "Días Personales → Reinstalar Sistema Completo"?
3. Después de ejecutar "Buscar Nuevos Registros", ¿qué dice el LOG? (Apps Script → ícono de reloj ⏱️ → última ejecución)

**Copia y pega TODO el log aquí** y yo veré exactamente qué está mal.

---

## 🆘 SI NADA FUNCIONA: REINSTALAR TODO

1. **Abre Apps Script**
2. **Borra TODO** el código de `Code.gs`
3. **Copia este código nuevo:** https://raw.githubusercontent.com/adrian-9856/Dias-personales/main/Code.gs
4. **Guarda** (Ctrl+S)
5. En Google Sheet: **Días Personales → Reinstalar Sistema Completo**
6. Ejecuta **Días Personales → Buscar Nuevos Registros**

---

**¿Qué prefieres hacer? Dime y te guío paso a paso.** 🚀
