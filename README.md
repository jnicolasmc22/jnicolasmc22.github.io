# OVA: Marketing Digital 🚀

## Descripción

Objeto Virtual de Aprendizaje (OVA) desarrollado para la asignatura de **Marketing Digital** del programa de **Ingeniería Multimedia**. Presenta los fundamentos del marketing digital —Las 4Ps, el Buyer Persona y el Embudo de Ventas— mediante una experiencia interactiva, visualmente moderna y compatible con el estándar **SCORM 1.2**.

**Nivel académico:** Pregrado — Ingeniería Multimedia  
**Estándar:** SCORM 1.2  
**Tecnologías:** HTML5 · CSS3 · JavaScript (vanilla) · Google Fonts · YouTube Embed · HTML5 Audio  
**Puntaje mínimo de aprobación:** 60% (6 de 10 preguntas correctas)

---

## Autores

| Rol | Nombre |
|-----|--------|
| Experto Temático | Jhan Nicolas Mendez Camacho |
| Diseñador Instruccional | Raúl Rodríguez Ibáñez |

---

## Estructura de carpetas

```
OVA_Marketing_Digital/
├── index.html                        ← Punto de entrada SCORM (SCO principal)
├── estilos.css                       ← Estilos visuales completos
├── scorm_api.js                      ← Wrapper SCORM 1.2
├── imsmanifest.xml                   ← Manifiesto SCORM (debe estar en raíz del ZIP)
├── README.md                         ← Este archivo
├── js/
│   └── app.js                        ← Lógica de navegación, actividades y evaluación
├── media/
│   └── podcast-marketing-digital.mp3 ← Podcast "Onda Multimedia"
└── assets/
    ├── images/                        ← Imágenes decorativas (opcional)
    └── icons/                         ← Iconos SVG (opcional)
```

---

## Módulos y actividades

| Módulo | Título | Actividades |
|--------|--------|-------------|
| Módulo 0 | Bienvenida y Recursos Multimedia | Selección múltiple · Completar espacios |
| Módulo 1.1 | Las 4Ps del Marketing Mix | Arrastrar y soltar · Relacionar conceptos |
| Módulo 1.2 | Necesidades, Deseos y Buyer Persona | Selección múltiple · Construcción de perfil |
| Módulo 1.3 | El Embudo de Ventas (Sales Funnel) | Arrastrar y soltar · Caso práctico |
| Módulo 1.4 | Evaluación y Aplicación Práctica | Evaluación final (10 preguntas) · Mini-estrategia |

---

## Instrucciones: Instalar el podcast

El archivo de podcast ya está incluido en la carpeta `media/`:

```
media/podcast-marketing-digital.mp3
```

Si deseas reemplazarlo:
1. Copia tu archivo MP3 a la carpeta `media/`
2. Renómbralo exactamente como: `podcast-marketing-digital.mp3`
3. Formatos soportados por los navegadores modernos: **MP3**, **OGG**, **WAV**

> **Nota:** El archivo de audio actual proviene del proyecto "Onda Multimedia" generado en Audacity.

---

## Instrucciones: Ejecutar localmente (prueba en navegador)

> ⚠️ **No abras `index.html` directamente** con `file://` porque los navegadores bloquean el audio y el SCORM por restricciones CORS. Usa uno de estos métodos:

### Opción A — VS Code + Live Server (recomendado)
1. Instala la extensión **Live Server** en VS Code
2. Abre la carpeta `OVA_Marketing_Digital/` en VS Code
3. Clic derecho en `index.html` → "Open with Live Server"
4. Se abrirá en `http://127.0.0.1:5500/index.html`

### Opción B — Python (sin instalar nada extra)
```powershell
cd "d:\OneDrive - Universidad Simón Bolívar\Universidad\OVA\OVA_Marketing_Digital"
python -m http.server 8080
# Abre: http://localhost:8080
```

### Opción C — Node.js
```powershell
cd "d:\OneDrive - Universidad Simón Bolívar\Universidad\OVA\OVA_Marketing_Digital"
npx serve .
# Abre la URL que muestre en consola
```

---

## Instrucciones: Empaquetar en ZIP para SCORM

> ⚠️ **Regla crítica:** El archivo `imsmanifest.xml` debe estar en la **raíz del ZIP**, no dentro de una subcarpeta.

### PowerShell (Windows)
```powershell
# Desde la carpeta padre del OVA
cd "d:\OneDrive - Universidad Simón Bolívar\Universidad\OVA"

# Comprimir el contenido (no la carpeta OVA_Marketing_Digital, sino su contenido)
Compress-Archive -Path "OVA_Marketing_Digital\*" -DestinationPath "OVA_Marketing_Digital_SCORM.zip" -Force

# Verificar que imsmanifest.xml está en la raíz del ZIP
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("OVA_Marketing_Digital_SCORM.zip")
$zip.Entries | Select-Object FullName | Where-Object { $_.FullName -like "*manifest*" }
$zip.Dispose()
```

El resultado esperado es: `imsmanifest.xml` (sin subcarpeta delante).

---

## Instrucciones: Cargar en Moodle (LMS SCORM 1.2)

1. Inicia sesión en tu Moodle como **Profesor** o **Administrador**
2. Ve al curso donde deseas publicar el OVA
3. Activa la edición: **"Activar edición"**
4. Haz clic en **"Añadir una actividad o un recurso"**
5. Selecciona **"SCORM"** y haz clic en **"Añadir"**
6. Configura:
   - **Nombre:** Marketing Digital
   - **Paquete:** sube el archivo `OVA_Marketing_Digital_SCORM.zip`
   - **Intentos permitidos:** Ilimitados
   - **Calificación mínima para aprobar:** 60
   - **Visualización:** Nueva ventana (recomendado)
7. Haz clic en **"Guardar cambios y mostrar"**
8. Prueba con una cuenta de estudiante

### Otros LMS compatibles
- **Blackboard:** Course Content → Build Content → Content Package (SCORM)
- **Canvas:** Módulos → Añadir elemento → Paquete de contenido externo
- **Chamilo:** Cursos → Crear → SCORM/AICC
- **TalentLMS:** Courses → Add Content → SCORM

---

## Comunicación SCORM

| Elemento CMI | Valor | Descripción |
|-------------|-------|-------------|
| `cmi.core.score.raw` | 0–100 | Calificación de la evaluación final |
| `cmi.core.score.min` | 0 | Calificación mínima |
| `cmi.core.score.max` | 100 | Calificación máxima |
| `cmi.core.lesson_status` | passed / failed / incomplete | Estado de completación |

**Lógica de estados:**
- `incomplete` → Mientras el estudiante navega sin completar la evaluación
- `passed` → Evaluación completada con ≥ 60%
- `failed` → Evaluación completada con < 60%

---

## Evaluación final — Detalles técnicos

- **Número de preguntas:** 10
- **Opciones por pregunta:** 4 (una correcta)
- **Puntaje por pregunta:** 10 puntos
- **Umbral de aprobación:** 60 puntos (6 correctas)
- **Intentos:** Ilimitados (sin penalización)
- **Retroalimentación:** Inmediata por pregunta + resumen final

---

## Requisitos del sistema

| Requisito | Especificación |
|-----------|---------------|
| Navegador | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |
| Internet | Requerido (video YouTube + Google Fonts) |
| Audio | Parlantes o auriculares (para podcast) |
| Pantalla | Mínimo 320px de ancho (diseño responsivo) |
| LMS | Compatible con SCORM 1.2 |

---

## Lista de verificación pre-entrega

- [ ] `imsmanifest.xml` presente en la raíz del proyecto y del ZIP
- [ ] `index.html` carga correctamente desde servidor local
- [ ] Video de YouTube se incrusta y reproduce
- [ ] Podcast `media/podcast-marketing-digital.mp3` se reproduce
- [ ] Todas las actividades responden al clic/arrastre
- [ ] Evaluación final calcula correctamente (60% umbral)
- [ ] Retroalimentación aparece tras responder actividades
- [ ] Botones de navegación funcionan en todos los módulos
- [ ] Diseño responsivo funciona en móvil (320px)
- [ ] SCORM envía calificación al LMS (probar con SCORM Cloud o Moodle)
- [ ] Intentos ilimitados en la evaluación final

---

## Notas técnicas

- **Sin frameworks externos:** JavaScript vanilla, sin jQuery, React ni Vue
- **Sin librerías de SCORM:** Implementación propia del wrapper SCORM 1.2
- **Google Fonts:** Se cargan desde CDN (requiere internet); el diseño degradará a fuentes del sistema sin conexión
- **YouTube embed:** Requiere internet; sin conexión aparece el mensaje del iframe de YouTube
- **Podcast:** Archivo local `media/podcast-marketing-digital.mp3` — funciona sin internet

---

*Generado con Antigravity — Diseñador Instruccional IA*
