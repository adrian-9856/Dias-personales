# ⚠️ Campos Faltantes en tu Formulario de KoboToolbox

## 📋 Estado Actual de tu Formulario

Actualmente tu formulario tiene estos campos:

✅ **Conoces el reglamento de días Personales** (Si/No)
✅ **Programa/Departamento** (Select con 8 opciones)
✅ **Día personal solicitado**
✅ **Fecha de inicio**
✅ **Fecha de finalización**
✅ **Cuentas con el consentimiento del director** (Sí/No)

## ❌ Campos que NECESITAS Agregar

Para que el sistema funcione correctamente, necesitas agregar estos 3 campos esenciales:

### 1. **Nombre del Empleado** (CRÍTICO)
- **Tipo:** Text
- **Nombre del campo:** `nombre_empleado` o `nombre`
- **Requerido:** Sí
- **Por qué:** Para identificar quién está solicitando los días y agrupar todas las solicitudes por persona

### 2. **Nombre del Director** (OPCIONAL - si usas la hoja de directores)
- **Tipo:** Text o Select One
- **Nombre del campo:** `director` o `nombre_director`
- **Requerido:** No (el sistema lo puede tomar de la hoja "Directores")
- **Por qué:** Para saber quién es el responsable de cada equipo

### 3. **Correo del Director** (OPCIONAL - si usas la hoja de directores)
- **Tipo:** Text (con validación de correo)
- **Nombre del campo:** `correo_director` o `email_director`
- **Requerido:** No (el sistema lo puede tomar de la hoja "Directores")
- **Por qué:** Para enviar reportes automáticos a los directores

---

## 🎯 Solución Recomendada

### Opción 1: Agregar Campos al Formulario (Recomendado)

Edita tu formulario de KoboToolbox y agrega estos campos:

```xlsform
type,name,label,required,hint
text,nombre_empleado,Nombre del empleado,yes,Tu nombre completo
select_one equipos,programa_departamento,Programa/Departamento,yes,
date,fecha_inicio,Fecha de inicio,yes,
date,fecha_finalizacion,Fecha de finalización,yes,
select_one sino,conoces_reglamento,Conoces el reglamento de días Personales,yes,
select_one sino,consentimiento_director,Cuentas con el consentimiento del director,yes,
```

### Opción 2: Usar la Hoja "Directores" (Más simple)

Si no quieres modificar el formulario:

1. Solo agrega el campo **`nombre_empleado`** al formulario (es esencial)
2. Usa la hoja "Directores" en Google Sheets para mapear equipos a directores
3. El sistema automáticamente asignará el director según el equipo

---

## 📝 Ejemplo de Formulario Completo

Aquí está el formulario completo que deberías tener:

### Hoja: survey

| type | name | label | required |
|------|------|-------|----------|
| text | nombre_empleado | Nombre del empleado | yes |
| select_one sino | conoces_reglamento | Conoces el reglamento de días Personales | yes |
| select_one equipos | programa_departamento | Programa/Departamento | yes |
| date | fecha_inicio | Fecha de inicio | yes |
| date | fecha_finalizacion | Fecha de finalización | yes |
| select_one sino | consentimiento_director | Cuentas con el consentimiento del director | yes |
| note | nota_importante | Recuerda que cada persona tiene 15 días personales al año | |

### Hoja: choices

| list_name | name | label |
|-----------|------|-------|
| sino | Si | Sí |
| sino | No | No |
| equipos | apoyo_emocional | Apoyo emocional |
| equipos | operaciones | Operaciones |
| equipos | mi_eelo | mi-eelo |
| equipos | gestion_impacto | Gestión de Impacto |
| equipos | educacion | Educación |
| equipos | centro_cuidado | Centro de cuidado infantil |
| equipos | administracion | Administración |
| equipos | inclusion_laboral | Inclusión Laboral |

---

## 🔧 Cómo Usar la Hoja "Directores"

Si decides NO agregar los campos de director al formulario, sigue estos pasos:

### Paso 1: Crear la hoja de directores

1. En Google Sheets, ve al menú **"📅 Días Personales"** → **"👥 Configurar Directores"**
2. Se creará una hoja con todos los equipos

### Paso 2: Completar la información

Llena la hoja con esta información:

| Equipo/Programa | Nombre del Director | Correo del Director |
|-----------------|---------------------|---------------------|
| Apoyo emocional | María González | maria.gonzalez@org.com |
| Operaciones | Pedro Martínez | pedro.martinez@org.com |
| mi-eelo | Ana López | ana.lopez@org.com |
| Gestión de Impacto | Carlos Ruiz | carlos.ruiz@org.com |
| Educación | Laura Torres | laura.torres@org.com |
| Centro de cuidado infantil | Jorge Ramírez | jorge.ramirez@org.com |
| Administración | Sofía Mendoza | sofia.mendoza@org.com |
| Inclusión Laboral | Luis Fernández | luis.fernandez@org.com |

### Paso 3: Listo

El sistema automáticamente asignará el director correcto basándose en el equipo seleccionado en el formulario.

---

## ⚡ Cómo Funciona el Sistema Automático

### Cuando llega un nuevo registro:

1. **Sistema detecta** un nuevo formulario enviado
2. **Sistema lee** el nombre del empleado y el equipo
3. **Sistema busca** el director en la hoja "Directores" (por equipo)
4. **Sistema calcula** los días entre fecha_inicio y fecha_finalizacion
5. **Sistema suma** todos los días tomados por ese empleado
6. **Sistema resta** de los 15 días totales
7. **Sistema envía** notificación al administrador
8. **Sistema actualiza** la hoja de "Resumen"

### Cada 15 minutos (automático):

- El sistema verifica si hay nuevos registros
- Solo procesa los que NO ha visto antes
- Evita duplicados usando el historial
- Envía correos solo para registros nuevos

---

## 🚀 Pasos para Implementar

### Paso 1: Editar tu formulario en KoboToolbox

```
1. Ve a tu proyecto en KoboToolbox
2. Click en "EDIT" (lápiz)
3. Agrega el campo "Nombre del empleado" al inicio
4. Guarda y vuelve a desplegar el formulario
```

### Paso 2: Configurar Google Sheets

```
1. Abre tu Google Sheet
2. Ve al menú "📅 Días Personales" → "⚙️ Crear Configuración"
3. Ingresa tu token de Kobo en B1
4. Ve al menú "📅 Días Personales" → "👥 Configurar Directores"
5. Completa los nombres y correos de los directores
6. Ingresa tu correo en la hoja "Configuración" celda B5
```

### Paso 3: Configurar ejecución automática

```
1. Ve al menú "📅 Días Personales" → "⏰ Configurar Trigger Automático"
2. Acepta la configuración
3. El sistema ahora revisará cada 15 minutos
```

### Paso 4: Probar

```
1. Envía un formulario de prueba en KoboToolbox
2. Espera máximo 15 minutos
3. Deberías recibir un correo con la notificación
4. Revisa la hoja "Resumen" y "Historial de Solicitudes"
```

---

## 📧 Notificaciones que Recibirás

### Cuando hay un nuevo registro:

```
🔔 Nueva(s) solicitud(es) de días personales - 1 registro(s)

Se ha(n) recibido 1 nueva(s) solicitud(es):

| # | Nombre        | Equipo      | Fecha Inicio | Fecha Fin  |
|---|---------------|-------------|--------------|------------|
| 1 | Juan Pérez    | Operaciones | 2026-02-01   | 2026-02-03 |

[Ver Resumen Completo]
```

### Si hay un error:

```
❌ Error en Sistema de Días Personales

Se ha producido un error en el sistema:

Error: No se ha configurado el token de KoboToolbox...
```

---

## ❓ Preguntas Frecuentes

### ¿Puedo usar el sistema sin agregar el nombre del empleado?

No. El campo **nombre del empleado** es absolutamente necesario para:
- Identificar quién solicita los días
- Agrupar múltiples solicitudes de la misma persona
- Calcular el total de días tomados por persona

### ¿Qué pasa si no completo la hoja de directores?

El sistema funcionará, pero:
- No se enviarán correos a los directores
- En los reportes aparecerá "Sin asignar" como director

### ¿Puedo tener diferentes directores para el mismo equipo?

No directamente con esta configuración. Cada equipo solo puede tener un director. Si necesitas subdividir, crea más equipos en el formulario (ej: "Operaciones - Área A", "Operaciones - Área B").

### ¿El sistema cuenta fines de semana?

Por defecto SÍ. El sistema cuenta todos los días (incluyendo sábados y domingos).

Si quieres contar solo días hábiles, en el archivo `Code.gs` cambia la línea 271:

```javascript
// Cambiar de:
const diasSolicitados = calcularDiasEntreFechas(fechaInicio, fechaFin);

// A:
const diasSolicitados = calcularDiasHabiles(fechaInicio, fechaFin);
```

---

## ✅ Checklist Final

Antes de activar el sistema automático, verifica:

- [ ] Campo "Nombre del empleado" agregado al formulario
- [ ] Formulario de KoboToolbox actualizado y desplegado
- [ ] Token de Kobo ingresado en Google Sheets (celda B1)
- [ ] URL de exportación CSV verificada (celda B2)
- [ ] Hoja "Directores" completada con nombres y correos
- [ ] Tu correo de administrador ingresado (celda B5)
- [ ] Trigger automático configurado
- [ ] Formulario de prueba enviado exitosamente
- [ ] Notificación de prueba recibida por correo

---

¿Necesitas ayuda? Revisa el README.md o el FAQ.md 🚀
