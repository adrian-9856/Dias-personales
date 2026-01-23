# Estructura del Formulario de KoboToolbox

Esta guía te ayudará a crear o adaptar tu formulario en KoboToolbox para que funcione correctamente con el sistema.

## 📋 Campos Requeridos

El sistema busca automáticamente estos campos. Puedes usar cualquiera de los nombres sugeridos:

### 1. Nombre del Empleado
- **Nombres posibles**: `nombre`, `name`, `empleado`, `employee`, `nombre_empleado`
- **Tipo**: Text
- **Requerido**: ✅ Sí
- **Ejemplo**: "Juan Pérez"

### 2. Equipo o Departamento
- **Nombres posibles**: `equipo`, `team`, `departamento`, `department`, `area`
- **Tipo**: Text o Select One
- **Requerido**: ✅ Sí
- **Ejemplo**: "Ventas", "Marketing", "IT", "Recursos Humanos"

### 3. Director o Supervisor
- **Nombres posibles**: `director`, `supervisor`, `jefe`, `manager`, `lider`
- **Tipo**: Text o Select One
- **Requerido**: ✅ Sí
- **Ejemplo**: "María González", "Pedro Martínez"

### 4. Correo del Director
- **Nombres posibles**: `correo_director`, `email_director`, `director_email`, `supervisor_email`
- **Tipo**: Text
- **Requerido**: ✅ Sí (para enviar correos)
- **Ejemplo**: "maria.gonzalez@empresa.com"
- **⚠️ Importante**: Debe ser un correo válido

### 5. Días Tomados
- **Nombres posibles**: `dias_tomados`, `dias`, `days_taken`, `dias_usados`, `cantidad_dias`
- **Tipo**: Integer (número entero) o Decimal
- **Requerido**: ✅ Sí
- **Ejemplo**: 5, 3.5, 10

### 6. Fecha (Opcional)
- **Nombres posibles**: `fecha`, `date`, `fecha_inicio`, `start_date`, `fecha_solicitud`
- **Tipo**: Date
- **Requerido**: ⚠️ Opcional
- **Ejemplo**: 2026-01-15

---

## 🎨 Ejemplo de Formulario Básico

### Versión Simple (XLSForm)

```csv
type,name,label,required,hint
text,nombre_empleado,Nombre del empleado,yes,Ingresa el nombre completo
select_one equipos,equipo,Equipo o Departamento,yes,Selecciona tu equipo
text,director,Nombre del director,yes,Nombre de tu supervisor directo
text,correo_director,Correo del director,yes,ejemplo@empresa.com
integer,dias_tomados,Días personales tomados,yes,¿Cuántos días has tomado?
date,fecha_inicio,Fecha de inicio,no,Fecha del primer día
```

### Choices para equipos

```csv
list_name,name,label
equipos,ventas,Ventas
equipos,marketing,Marketing
equipos,it,Tecnología (IT)
equipos,rrhh,Recursos Humanos
equipos,finanzas,Finanzas
equipos,operaciones,Operaciones
```

---

## 🔧 Ejemplo de Formulario Avanzado

Para un formulario más completo, puedes agregar:

### Campos Adicionales

```csv
type,name,label,required,hint,relevant
text,nombre_empleado,Nombre del empleado,yes,Ingresa el nombre completo,
text,cedula,Cédula o ID,no,Número de identificación,
select_one equipos,equipo,Equipo o Departamento,yes,Selecciona tu equipo,
text,director,Nombre del director,yes,Nombre de tu supervisor directo,
text,correo_director,Correo del director,yes,Correo electrónico del director,
integer,dias_tomados,Días personales tomados,yes,¿Cuántos días has tomado?,
date,fecha_inicio,Fecha de inicio,yes,Primer día del permiso,
date,fecha_fin,Fecha de fin,yes,Último día del permiso,
select_one motivo,motivo,Motivo del permiso,no,¿Por qué solicitas días personales?,
text,observaciones,Observaciones,no,Comentarios adicionales,
calculate,dias_calculados,"",,"int(date-diff(${fecha_fin},${fecha_inicio}))+1",
note,nota_dias,"Días solicitados: ${dias_calculados}",,,
```

### Choices adicionales

```csv
list_name,name,label
motivo,personal,Asuntos personales
motivo,familiar,Asuntos familiares
motivo,salud,Salud
motivo,tramites,Trámites
motivo,otro,Otro
```

---

## 💡 Consejos para el Formulario

### 1. Uso de Select One vs Text
- **Select One**: Mejor para equipos y directores (evita errores de tipeo)
- **Text**: Más flexible pero puede tener inconsistencias

### 2. Validación de Correos
Agrega una restricción para validar correos:
```
constraint: regex(., '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
constraint_message: Ingresa un correo válido
```

### 3. Validación de Días
Agrega límites para los días:
```
constraint: . >= 0 and . <= 15
constraint_message: Debes ingresar entre 0 y 15 días
```

### 4. Cálculo Automático de Días Restantes
Puedes agregar un campo calculado:
```csv
type,name,label,calculation
calculate,dias_restantes,Días restantes,15 - ${dias_tomados}
note,nota_restantes,"Te quedan ${dias_restantes} días disponibles",,
```

---

## 🔄 Migrar Formulario Existente

Si ya tienes un formulario, puedes adaptarlo:

### Opción 1: Agregar campos faltantes
1. Edita tu formulario en KoboToolbox
2. Agrega los campos requeridos (correo_director, dias_tomados, etc.)
3. Actualiza las respuestas existentes si es necesario

### Opción 2: Renombrar campos existentes
1. Descarga tu formulario como XLS
2. Renombra las columnas `name` a los nombres sugeridos arriba
3. Vuelve a subir el formulario (¡cuidado, esto puede borrar datos!)

### Opción 3: Modificar el código del sistema
Si tus campos tienen nombres muy específicos, edita la función `encontrarColumna()` en `Code.gs`:

```javascript
const colNombre = encontrarColumna(headers, ['nombre', 'name', 'TU_NOMBRE_ESPECIFICO']);
```

---

## 📊 Ejemplo de Datos CSV Resultantes

Así se verían los datos exportados:

```csv
nombre_empleado,equipo,director,correo_director,dias_tomados,fecha_inicio
Juan Pérez,Ventas,María González,maria@empresa.com,5,2026-01-10
Ana López,Marketing,María González,maria@empresa.com,3,2026-01-15
Carlos Ruiz,IT,Pedro Martínez,pedro@empresa.com,8,2025-12-20
Laura Torres,Ventas,María González,maria@empresa.com,2,2026-01-05
```

---

## 🧪 Probar el Formulario

### Checklist antes de usar el sistema

- [ ] Formulario creado en KoboToolbox
- [ ] Todos los campos requeridos están presentes
- [ ] El campo de correo del director tiene formato válido
- [ ] El campo de días tomados acepta números
- [ ] Al menos 5 registros de prueba ingresados
- [ ] Formulario desplegado (Deploy)
- [ ] URL de exportación CSV obtenida
- [ ] Datos de prueba visibles en la vista de datos de KoboToolbox

---

## 📥 Descargar Plantilla

### Plantilla XLSForm

Crea un archivo Excel con estas hojas:

**Hoja 1: survey**
| type | name | label | required | hint |
|------|------|-------|----------|------|
| text | nombre_empleado | Nombre del empleado | yes | Nombre completo |
| select_one equipos | equipo | Equipo | yes | Tu equipo o departamento |
| text | director | Director | yes | Nombre de tu director |
| text | correo_director | Correo del director | yes | Correo válido |
| integer | dias_tomados | Días tomados | yes | Número de días |
| date | fecha_inicio | Fecha de inicio | no | Primer día |

**Hoja 2: choices**
| list_name | name | label |
|-----------|------|-------|
| equipos | ventas | Ventas |
| equipos | marketing | Marketing |
| equipos | it | IT |
| equipos | rrhh | RRHH |

**Hoja 3: settings**
| form_title | form_id |
|------------|---------|
| Registro de Días Personales | dias_personales_v1 |

Guarda como `.xlsx` y súbelo a KoboToolbox.

---

## 🆘 Problemas Comunes

### El sistema no encuentra los campos
- **Solución**: Verifica que los nombres de tus campos coincidan con los sugeridos
- **Alternativa**: Modifica la función `encontrarColumna()` en el código

### Los correos no se envían
- **Causa**: Campo de correo del director vacío o inválido
- **Solución**: Verifica que todos los registros tengan un correo válido

### Los días no se calculan bien
- **Causa**: Campo de días tomados no es numérico
- **Solución**: Cambia el tipo de campo a Integer o Decimal

---

¡Con esta estructura, tu formulario estará listo para funcionar con el sistema! 🎉
