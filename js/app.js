/**
 * OVA Marketing Digital — app.js
 * SCORM 1.2 Single-Page Application Controller
 * Universidad Simón Bolívar
 */

'use strict';

/* =========================================================
   MODULES DEFINITION
   ========================================================= */
const MODULES = [
  { id: 'mod-welcome', title: 'Módulo 0: Bienvenida',           activities: ['act1', 'act2'] },
  { id: 'mod-4ps',    title: 'Módulo 1.1: Las 4Ps del Marketing', activities: ['act3', 'act4'] },
  { id: 'mod-buyer',  title: 'Módulo 1.2: Buyer Persona',        activities: ['act5', 'act6'] },
  { id: 'mod-funnel', title: 'Módulo 1.3: Embudo de Ventas',     activities: ['act7', 'act8'] },
  { id: 'mod-eval',   title: 'Módulo 1.4: Evaluación Final',     activities: ['quiz', 'appPractical'] },
];

/* =========================================================
   STATE
   ========================================================= */
let currentModuleIndex = 0;

const moduleProgress = {
  visited:   {},   // moduleId → true
  completed: {},   // activityId → true
};

// Drag-and-drop state
let draggedItem = null;

// Activity 2 (fill blanks) state
const blanksState = { 0: '', 1: '', 2: '' };

// Activity 3 drag-drop state
const dnd3State = {};   // zone → [items]

// Activity 4 matching state
const match4State = {};  // left → right selected

// Activity 7 drag-drop state
const dnd7State = {};

// Activity 8 quiz state
const act8Answers = {};

// Final quiz state
let quizQuestions = [];
const quizAnswers  = {};
let quizSubmitted  = false;

/* =========================================================
   SCORM INTERFACE (guard against missing API)
   ========================================================= */
window.SCORM = window.SCORM || {
  setScore: function(score) {
    console.log('[SCORM stub] setScore:', score);
  },
  setCompletion: function(status) {
    console.log('[SCORM stub] setCompletion:', status);
  },
};

/* =========================================================
   BOOT
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {
  initSidebar();
  updateProgress();
  renderActivity1();
  renderActivity2();
  renderActivity3();
  renderActivity4();
  renderActivity5();
  renderActivity6();
  renderActivity7();
  renderActivity8();
  renderFinalQuiz();
  renderAppPractical();
  showScreen('screen-welcome');
});

/* =========================================================
   SCREEN MANAGEMENT
   ========================================================= */
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(function (s) {
    s.classList.remove('active');
  });
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

/* =========================================================
   ENTRY POINT — "Comenzar" button on welcome screen
   ========================================================= */
function startCourse() {
  showScreen('screen-main');
  showModule('mod-welcome');
}

/* =========================================================
   MODULE NAVIGATION
   ========================================================= */
function showModule(moduleId) {
  // Hide all module panels
  document.querySelectorAll('.module-panel').forEach(function (p) {
    p.classList.remove('active');
  });

  // Show target module
  const panel = document.getElementById(moduleId);
  if (panel) panel.classList.add('active');

  // Update current index
  const idx = MODULES.findIndex(function (m) { return m.id === moduleId; });
  if (idx !== -1) currentModuleIndex = idx;

  // Mark visited
  moduleProgress.visited[moduleId] = true;

  updateSidebar();
  updateProgress();
  updateNavButtons();

  // Scroll to top
  const contentArea = document.getElementById('content-area');
  if (contentArea) contentArea.scrollTop = 0;
}

function nextModule() {
  if (currentModuleIndex < MODULES.length - 1) {
    currentModuleIndex++;
    showModule(MODULES[currentModuleIndex].id);
  }
}

function prevModule() {
  if (currentModuleIndex > 0) {
    currentModuleIndex--;
    showModule(MODULES[currentModuleIndex].id);
  }
}

function updateNavButtons() {
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  if (btnPrev) btnPrev.disabled = currentModuleIndex === 0;
  if (btnNext) btnNext.disabled = currentModuleIndex === MODULES.length - 1;
}

/* =========================================================
   PROGRESS
   ========================================================= */
function updateProgress() {
  const totalActivities = MODULES.reduce(function (sum, m) {
    return sum + m.activities.length;
  }, 0);

  const completedCount = Object.keys(moduleProgress.completed).length;
  const percentage = totalActivities > 0
    ? Math.round((completedCount / totalActivities) * 100)
    : 0;

  // Progress bar
  const bar = document.getElementById('progress-bar');
  if (bar) {
    bar.style.width = percentage + '%';
    bar.setAttribute('aria-valuenow', percentage);
  }

  // Progress label
  const label = document.getElementById('progress-label');
  if (label) label.textContent = percentage + '%';

  // SCORM completion if 100%
  if (percentage === 100) {
    window.SCORM.setCompletion('completed');
  }
}

function markActivityComplete(activityId) {
  if (!moduleProgress.completed[activityId]) {
    moduleProgress.completed[activityId] = true;
    updateProgress();
    updateSidebar();
  }
}

/* =========================================================
   SIDEBAR
   ========================================================= */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  let html = '<nav class="sidebar-nav"><ul>';
  MODULES.forEach(function (mod) {
    html += '<li class="sidebar-module" data-module="' + mod.id + '">'
          + '<button class="sidebar-module-btn" onclick="showModule(\'' + mod.id + '\')">'
          + '<span class="sidebar-title">' + mod.title + '</span>'
          + '</button>'
          + '<ul class="sidebar-activities">';
    mod.activities.forEach(function (actId) {
      html += '<li class="sidebar-activity" id="sidebar-' + actId + '">'
            + '<span class="activity-icon">○</span>'
            + '<span class="activity-label">' + getActivityLabel(actId) + '</span>'
            + '</li>';
    });
    html += '</ul></li>';
  });
  html += '</ul></nav>';
  sidebar.innerHTML = html;
}

function updateSidebar() {
  // Update active module
  document.querySelectorAll('.sidebar-module').forEach(function (li) {
    li.classList.remove('active');
  });
  const activeModuleId = MODULES[currentModuleIndex].id;
  const activeLi = document.querySelector('.sidebar-module[data-module="' + activeModuleId + '"]');
  if (activeLi) activeLi.classList.add('active');

  // Update activity checkmarks
  MODULES.forEach(function (mod) {
    mod.activities.forEach(function (actId) {
      const el = document.getElementById('sidebar-' + actId);
      if (!el) return;
      const icon = el.querySelector('.activity-icon');
      if (moduleProgress.completed[actId]) {
        if (icon) icon.textContent = '✓';
        el.classList.add('completed');
      } else {
        if (icon) icon.textContent = '○';
        el.classList.remove('completed');
      }
    });
  });
}

function getActivityLabel(actId) {
  const labels = {
    act1: 'Actividad 1: Opción múltiple',
    act2: 'Actividad 2: Completa los blancos',
    act3: 'Actividad 3: Clasifica las 4Ps',
    act4: 'Actividad 4: Relaciona conceptos',
    act5: 'Actividad 5: Necesidad o Deseo',
    act6: 'Actividad 6: Tu Buyer Persona',
    act7: 'Actividad 7: Clasifica el Embudo',
    act8: 'Actividad 8: Caso de Estudio',
    quiz: 'Quiz Final',
    appPractical: 'Aplicación Práctica',
  };
  return labels[actId] || actId;
}

/* =========================================================
   ACTIVITY 1 — Multiple Choice: ¿Qué es el Marketing Digital?
   ========================================================= */
const ACT1_OPTIONS = [
  { id: 'a', text: 'Vender productos físicos únicamente', correct: false },
  { id: 'b', text: 'Conectar marcas con audiencias a través de canales digitales', correct: true },
  { id: 'c', text: 'Reemplazar el marketing tradicional por completo', correct: false },
  { id: 'd', text: 'Crear sitios web corporativos', correct: false },
];

function renderActivity1() {
  const container = document.getElementById('act1-container');
  if (!container) return;

  let html = '<div class="activity-card">'
    + '<h3 class="activity-title">Actividad 1: ¿Qué es el Marketing Digital?</h3>'
    + '<p class="activity-question"><strong>Según el video de bienvenida, ¿cuál es el principal objetivo del Marketing Digital?</strong></p>'
    + '<div class="options-list">';

  ACT1_OPTIONS.forEach(function (opt) {
    html += '<div class="option-item">'
      + '<input type="radio" name="act1" id="act1-' + opt.id + '" value="' + opt.id + '">'
      + '<label for="act1-' + opt.id + '">'
      + '<span class="option-letter">' + opt.id.toUpperCase() + ')</span> '
      + opt.text
      + '</label>'
      + '</div>';
  });

  html += '</div>'
    + '<button class="btn btn-primary" onclick="submitActivity1()">Verificar respuesta</button>'
    + '<div id="act1-feedback" class="feedback-box hidden"></div>'
    + '</div>';

  container.innerHTML = html;
}

function submitActivity1() {
  const selected = document.querySelector('input[name="act1"]:checked');
  const feedback = document.getElementById('act1-feedback');
  if (!selected) {
    showFeedback('act1-feedback', 'warning', 'Por favor selecciona una opción antes de continuar.');
    return;
  }

  const opt = ACT1_OPTIONS.find(function (o) { return o.id === selected.value; });
  if (opt.correct) {
    showFeedback('act1-feedback', 'correct',
      '¡Correcto! El Marketing Digital busca conectar marcas con sus audiencias usando canales digitales como redes sociales, SEO, email y más.');
    markActivityComplete('act1');
  } else {
    showFeedback('act1-feedback', 'incorrect',
      'Incorrecto. El Marketing Digital no se limita a ventas físicas ni a reemplazar lo tradicional; su esencia es la conexión digital entre marca y audiencia.');
  }

  // Disable options after answer
  document.querySelectorAll('input[name="act1"]').forEach(function (inp) {
    inp.disabled = true;
  });
}

/* =========================================================
   ACTIVITY 2 — Fill in the Blanks
   ========================================================= */
const ACT2_BLANKS = [
  { key: 'SEO',           acceptList: ['seo', 'optimización de motores de búsqueda', 'search engine optimization'] },
  { key: 'redes sociales',acceptList: ['redes sociales', 'social media', 'rrss'] },
  { key: 'email marketing',acceptList: ['email marketing', 'email', 'e-mail marketing', 'correo electrónico', 'e-mail'] },
];

function renderActivity2() {
  const container = document.getElementById('act2-container');
  if (!container) return;

  let html = '<div class="activity-card">'
    + '<h3 class="activity-title">Actividad 2: Completa los espacios en blanco</h3>'
    + '<p class="activity-instruction">Escribe la palabra o frase correcta en cada espacio.</p>'
    + '<p class="activity-sentence">'
    + '"El Marketing Digital utiliza canales como el '
    + '<input type="text" class="blank-input" id="blank-0" placeholder="___" oninput="blanksState[0]=this.value">, '
    + 'las <input type="text" class="blank-input" id="blank-1" placeholder="___" oninput="blanksState[1]=this.value"> '
    + 'y el <input type="text" class="blank-input" id="blank-2" placeholder="___" oninput="blanksState[2]=this.value"> '
    + 'para llegar a su audiencia."'
    + '</p>'
    + '<button class="btn btn-primary" onclick="submitActivity2()">Verificar</button>'
    + '<div id="act2-feedback" class="feedback-box hidden"></div>'
    + '</div>';

  container.innerHTML = html;
}

function submitActivity2() {
  let allCorrect = true;
  let feedbackParts = [];

  ACT2_BLANKS.forEach(function (blank, i) {
    const val = (document.getElementById('blank-' + i) ? document.getElementById('blank-' + i).value : '').trim().toLowerCase();
    const normalizedAccept = blank.acceptList.map(function (a) { return a.toLowerCase(); });
    const isCorrect = normalizedAccept.some(function (accepted) {
      return val.includes(accepted) || accepted.includes(val) && val.length >= 3;
    });

    if (isCorrect) {
      feedbackParts.push('<span class="text-correct">✓ Espacio ' + (i + 1) + ': Correcto ("' + blank.key + '")</span>');
    } else {
      allCorrect = false;
      feedbackParts.push('<span class="text-incorrect">✗ Espacio ' + (i + 1) + ': La respuesta esperada era "' + blank.key + '"</span>');
    }
  });

  const feedbackHtml = feedbackParts.join('<br>');
  const type = allCorrect ? 'correct' : (feedbackParts.some(function (f) { return f.includes('Correcto'); }) ? 'partial' : 'incorrect');
  showFeedback('act2-feedback', type, feedbackHtml);

  if (allCorrect) {
    markActivityComplete('act2');
    document.querySelectorAll('.blank-input').forEach(function (inp) { inp.disabled = true; });
  }
}

/* =========================================================
   ACTIVITY 3 — Drag and Drop: Clasifica los elementos del Marketing Mix
   ========================================================= */
const ACT3_ITEMS = [
  'Precio de lanzamiento $0.99',
  'Canal App Store',
  'Campaña en Instagram',
  'App de edición de video',
  'Estrategia freemium',
  'Distribución en Play Store',
  'Publicidad en YouTube',
  'Versión premium $9.99',
];

const ACT3_ZONES = {
  Producto:   ['App de edición de video'],
  Precio:     ['Precio de lanzamiento $0.99', 'Estrategia freemium', 'Versión premium $9.99'],
  Plaza:      ['Canal App Store', 'Distribución en Play Store'],
  Promoción:  ['Campaña en Instagram', 'Publicidad en YouTube'],
};

function renderActivity3() {
  const container = document.getElementById('act3-container');
  if (!container) return;

  // Init state
  Object.keys(ACT3_ZONES).forEach(function (z) { dnd3State[z] = []; });

  let html = '<div class="activity-card">'
    + '<h3 class="activity-title">Actividad 3: Clasifica los elementos del Marketing Mix</h3>'
    + '<p class="activity-instruction">Arrastra cada elemento a la categoría correcta de las 4Ps.</p>'
    + '<div class="dnd-workspace">'
    + '<div class="dnd-items-pool" id="act3-pool">';

  ACT3_ITEMS.forEach(function (item) {
    html += createDraggable(item, 'act3');
  });

  html += '</div><div class="dnd-zones">';

  Object.keys(ACT3_ZONES).forEach(function (zone) {
    html += '<div class="dnd-zone" id="act3-zone-' + zone + '" '
          + 'ondragover="onDragOver(event)" '
          + 'ondrop="onDrop(event, \'act3\', \'' + zone + '\')" '
          + 'ondragleave="onDragLeave(event)">'
          + '<div class="zone-label">' + zone + '</div>'
          + '<div class="zone-items" id="act3-zone-items-' + zone + '"></div>'
          + '</div>';
  });

  html += '</div></div>'
    + '<div class="dnd-actions">'
    + '<button class="btn btn-secondary" onclick="resetActivity3()">Reiniciar</button>'
    + '<button class="btn btn-primary" onclick="submitActivity3()">Verificar</button>'
    + '</div>'
    + '<div id="act3-feedback" class="feedback-box hidden"></div>'
    + '</div>';

  container.innerHTML = html;
  setupDndPool('act3-pool', 'act3');
}

function resetActivity3() {
  Object.keys(ACT3_ZONES).forEach(function (z) { dnd3State[z] = []; });
  renderActivity3();
}

function submitActivity3() {
  let allCorrect = true;
  let feedbackParts = [];

  Object.keys(ACT3_ZONES).forEach(function (zone) {
    const correct = ACT3_ZONES[zone].slice().sort();
    const given   = (dnd3State[zone] || []).slice().sort();
    const isOk    = JSON.stringify(correct) === JSON.stringify(given);
    if (!isOk) allCorrect = false;
    feedbackParts.push('<strong>' + zone + ':</strong> '
      + (isOk ? '<span class="text-correct">✓ Correcto</span>' : '<span class="text-incorrect">✗ Incorrecto — esperado: ' + correct.join(', ') + '</span>'));
  });

  const type = allCorrect ? 'correct' : 'incorrect';
  const intro = allCorrect
    ? '¡Excelente! Clasificaste correctamente todos los elementos del Marketing Mix.'
    : 'Hay algunos errores. Revisa la clasificación:';
  showFeedback('act3-feedback', type, intro + '<br>' + feedbackParts.join('<br>'));

  if (allCorrect) markActivityComplete('act3');
}

/* =========================================================
   ACTIVITY 4 — Concept Matching: Relaciona 4Ps con sus definiciones
   ========================================================= */
const ACT4_PAIRS = {
  Producto:   'Conjunto de características y beneficios ofrecidos',
  Precio:     'Valor monetario asignado al producto o servicio',
  Plaza:      'Canales y puntos de distribución donde se adquiere',
  Promoción:  'Estrategias de comunicación para dar a conocer la oferta',
};

function renderActivity4() {
  const container = document.getElementById('act4-container');
  if (!container) return;

  const leftItems  = Object.keys(ACT4_PAIRS);
  const rightItems = shuffleArray(Object.values(ACT4_PAIRS).slice());

  let html = '<div class="activity-card">'
    + '<h3 class="activity-title">Actividad 4: Relaciona las 4Ps con sus definiciones</h3>'
    + '<p class="activity-instruction">Selecciona un elemento de la izquierda y luego su definición correcta en la derecha.</p>'
    + '<div class="matching-workspace">'
    + '<div class="matching-left">';

  leftItems.forEach(function (item) {
    html += '<div class="match-item left-item" id="left-' + item + '" onclick="selectLeft(\'' + item + '\')">'
          + item
          + '<span class="match-status" id="status-' + item + '"></span>'
          + '</div>';
  });

  html += '</div><div class="matching-right">';

  rightItems.forEach(function (def, i) {
    html += '<div class="match-item right-item" id="right-' + i + '" onclick="selectRight(\'' + escapeAttr(def) + '\', ' + i + ')">'
          + def
          + '</div>';
  });

  html += '</div></div>'
    + '<div class="match-pairs" id="act4-pairs"></div>'
    + '<div class="dnd-actions">'
    + '<button class="btn btn-secondary" onclick="resetActivity4()">Reiniciar</button>'
    + '<button class="btn btn-primary" onclick="submitActivity4()">Verificar</button>'
    + '</div>'
    + '<div id="act4-feedback" class="feedback-box hidden"></div>'
    + '</div>';

  container.innerHTML = html;
  window._act4SelectedLeft = null;
  window._act4RightItems   = rightItems;
  // Reset state
  Object.keys(match4State).forEach(function (k) { delete match4State[k]; });
}

function selectLeft(item) {
  // Deselect previously selected left
  document.querySelectorAll('.left-item').forEach(function (el) { el.classList.remove('selected'); });
  const el = document.getElementById('left-' + item);
  if (el) el.classList.add('selected');
  window._act4SelectedLeft = item;
}

function selectRight(def, idx) {
  if (!window._act4SelectedLeft) return;

  const leftKey = window._act4SelectedLeft;

  // If already matched, remove old match
  Object.keys(match4State).forEach(function (k) {
    if (match4State[k] === def) delete match4State[k];
  });

  match4State[leftKey] = def;

  // Visual update
  document.querySelectorAll('.left-item').forEach(function (el) { el.classList.remove('selected'); });
  document.querySelectorAll('.right-item').forEach(function (el) { el.classList.remove('matched'); });

  // Show current matches
  updateAct4Display();
  window._act4SelectedLeft = null;
}

function updateAct4Display() {
  // Update matched status on right items
  if (!window._act4RightItems) return;
  window._act4RightItems.forEach(function (def, i) {
    const el = document.getElementById('right-' + i);
    if (!el) return;
    const isMatched = Object.values(match4State).includes(def);
    if (isMatched) el.classList.add('matched'); else el.classList.remove('matched');
  });

  // Show pair list
  const pairsDiv = document.getElementById('act4-pairs');
  if (!pairsDiv) return;
  let html = '<div class="pairs-list"><strong>Pares seleccionados:</strong><ul>';
  Object.keys(match4State).forEach(function (k) {
    html += '<li><em>' + k + '</em> → ' + match4State[k] + '</li>';
  });
  html += '</ul></div>';
  pairsDiv.innerHTML = html;
}

function resetActivity4() {
  renderActivity4();
  document.getElementById('act4-feedback') && showFeedback('act4-feedback', '', '');
}

function submitActivity4() {
  if (Object.keys(match4State).length < 4) {
    showFeedback('act4-feedback', 'warning', 'Debes relacionar los 4 conceptos antes de verificar.');
    return;
  }

  let allCorrect = true;
  let feedbackParts = [];

  Object.keys(ACT4_PAIRS).forEach(function (key) {
    const isOk = match4State[key] === ACT4_PAIRS[key];
    if (!isOk) allCorrect = false;
    feedbackParts.push('<strong>' + key + '</strong>: '
      + (isOk
        ? '<span class="text-correct">✓ Correcto</span>'
        : '<span class="text-incorrect">✗ Incorrecto — correcto: "' + ACT4_PAIRS[key] + '"</span>'));
  });

  const intro = allCorrect
    ? '¡Perfecto! Has relacionado correctamente todos los conceptos.'
    : 'Algunas relaciones son incorrectas. Revisa:';
  showFeedback('act4-feedback', allCorrect ? 'correct' : 'incorrect', intro + '<br>' + feedbackParts.join('<br>'));

  if (allCorrect) markActivityComplete('act4');
}

/* =========================================================
   ACTIVITY 5 — Multiple Choice: ¿Necesidad o Deseo?
   ========================================================= */
const ACT5_OPTIONS = [
  {
    id: 'a', correct: false,
    text: 'Necesidad: tener un smartphone último modelo; Deseo: usar WhatsApp',
    feedback: 'Incorrecto. Tener el último modelo de smartphone es un deseo (no imprescindible), y WhatsApp es un canal de comunicación (necesidad de comunicación). La lógica está invertida.',
  },
  {
    id: 'b', correct: true,
    text: 'Necesidad: comunicarse con su equipo; Deseo: hacerlo con el iPhone más reciente',
    feedback: '¡Correcto! La necesidad es funcional (comunicarse), el deseo es la forma particular y aspiracional (con el iPhone más reciente). Esta distinción es clave en el Buyer Persona.',
  },
  {
    id: 'c', correct: false,
    text: 'Necesidad: comprar datos móviles; Deseo: tener internet',
    feedback: 'Incorrecto. El internet (conectividad) es la necesidad; comprar datos es un medio para satisfacerla, no al revés.',
  },
  {
    id: 'd', correct: false,
    text: 'Necesidad y Deseo son lo mismo en contexto digital',
    feedback: 'Incorrecto. En marketing, siempre se diferencia entre necesidad (carencia básica) y deseo (forma cultural o personal de satisfacerla). Esta distinción es fundamental para segmentar.',
  },
];

function renderActivity5() {
  const container = document.getElementById('act5-container');
  if (!container) return;

  let html = '<div class="activity-card">'
    + '<h3 class="activity-title">Actividad 5: ¿Necesidad o Deseo?</h3>'
    + '<div class="scenario-box">'
    + '<p><strong>Escenario:</strong> Carlos, 22 años, estudiante de Ingeniería Multimedia, necesita comunicarse con sus compañeros de proyecto. ¿Cuál opción representa una NECESIDAD y cuál un DESEO?</p>'
    + '</div>'
    + '<div class="options-list">';

  ACT5_OPTIONS.forEach(function (opt) {
    html += '<div class="option-item">'
      + '<input type="radio" name="act5" id="act5-' + opt.id + '" value="' + opt.id + '">'
      + '<label for="act5-' + opt.id + '">'
      + '<span class="option-letter">' + opt.id.toUpperCase() + ')</span> '
      + opt.text
      + '</label>'
      + '</div>';
  });

  html += '</div>'
    + '<button class="btn btn-primary" onclick="submitActivity5()">Verificar respuesta</button>'
    + '<div id="act5-feedback" class="feedback-box hidden"></div>'
    + '</div>';

  container.innerHTML = html;
}

function submitActivity5() {
  const selected = document.querySelector('input[name="act5"]:checked');
  if (!selected) {
    showFeedback('act5-feedback', 'warning', 'Por favor selecciona una opción.');
    return;
  }

  const opt = ACT5_OPTIONS.find(function (o) { return o.id === selected.value; });
  showFeedback('act5-feedback', opt.correct ? 'correct' : 'incorrect', opt.feedback);
  document.querySelectorAll('input[name="act5"]').forEach(function (inp) { inp.disabled = true; });
  if (opt.correct) markActivityComplete('act5');
}

/* =========================================================
   ACTIVITY 6 — Build a Buyer Persona
   ========================================================= */
function renderActivity6() {
  const container = document.getElementById('act6-container');
  if (!container) return;

  const html = '<div class="activity-card">'
    + '<h3 class="activity-title">Actividad 6: Diseña tu Buyer Persona</h3>'
    + '<p class="activity-instruction">Crea un Buyer Persona para un producto o servicio digital de tu elección. Completa todos los campos.</p>'
    + '<form id="act6-form" class="persona-form" onsubmit="submitActivity6(event)">'
    + formField('act6-nombre', 'Nombre ficticio', 'text', 'Ej: María García')
    + formField('act6-edad', 'Edad', 'number', 'Ej: 25')
    + formField('act6-profesion', 'Profesión', 'text', 'Ej: Diseñadora UX')
    + formField('act6-reto', 'Reto principal', 'text', 'Ej: Encontrar clientes freelance')
    + formField('act6-canal', 'Canal digital favorito', 'text', 'Ej: Instagram, LinkedIn')
    + formField('act6-objetivo', 'Objetivo', 'text', 'Ej: Aumentar sus ingresos trabajando remotamente')
    + '<button type="submit" class="btn btn-primary">Crear mi Buyer Persona</button>'
    + '</form>'
    + '<div id="act6-result" class="hidden"></div>'
    + '</div>';

  container.innerHTML = html;
}

function formField(id, label, type, placeholder) {
  return '<div class="form-group">'
    + '<label for="' + id + '">' + label + '</label>'
    + '<input type="' + type + '" id="' + id + '" placeholder="' + placeholder + '" required>'
    + '</div>';
}

function submitActivity6(event) {
  event.preventDefault();

  const nombre   = document.getElementById('act6-nombre').value.trim();
  const edad     = document.getElementById('act6-edad').value.trim();
  const profesion= document.getElementById('act6-profesion').value.trim();
  const reto     = document.getElementById('act6-reto').value.trim();
  const canal    = document.getElementById('act6-canal').value.trim();
  const objetivo = document.getElementById('act6-objetivo').value.trim();

  const resultDiv = document.getElementById('act6-result');
  if (!resultDiv) return;

  let html = '<div class="persona-comparison">'
    + '<div class="persona-card your-persona">'
    + '<h4>🧑‍💻 Tu Buyer Persona</h4>'
    + '<ul>'
    + '<li><strong>Nombre:</strong> ' + nombre + '</li>'
    + '<li><strong>Edad:</strong> ' + edad + ' años</li>'
    + '<li><strong>Profesión:</strong> ' + profesion + '</li>'
    + '<li><strong>Reto:</strong> ' + reto + '</li>'
    + '<li><strong>Canal favorito:</strong> ' + canal + '</li>'
    + '<li><strong>Objetivo:</strong> ' + objetivo + '</li>'
    + '</ul>'
    + '</div>'
    + '<div class="persona-card model-persona">'
    + '<h4>📋 Persona Modelo</h4>'
    + '<ul>'
    + '<li><strong>Nombre:</strong> Andrea</li>'
    + '<li><strong>Edad:</strong> 23 años</li>'
    + '<li><strong>Profesión:</strong> Estudiante de Ingeniería Multimedia</li>'
    + '<li><strong>Reto:</strong> Diferenciarse en el mercado laboral</li>'
    + '<li><strong>Canal favorito:</strong> LinkedIn e Instagram</li>'
    + '<li><strong>Objetivo:</strong> Conseguir prácticas en empresa tech</li>'
    + '</ul>'
    + '</div>'
    + '</div>'
    + '<div class="rubric-box">'
    + '<h4>📝 Criterios de Evaluación</h4>'
    + '<ul class="rubric-list">'
    + '<li><input type="checkbox"> El nombre ficticio es creíble y representativo del segmento</li>'
    + '<li><input type="checkbox"> La edad corresponde al público objetivo del producto elegido</li>'
    + '<li><input type="checkbox"> El reto está directamente relacionado con un problema digital</li>'
    + '<li><input type="checkbox"> El canal digital es coherente con el perfil demográfico</li>'
    + '<li><input type="checkbox"> El objetivo es específico, medible y vinculado al producto</li>'
    + '</ul>'
    + '<p class="rubric-note">Marca cada criterio que hayas cumplido para auto-evaluar tu Buyer Persona.</p>'
    + '</div>';

  resultDiv.innerHTML = html;
  resultDiv.classList.remove('hidden');
  document.getElementById('act6-form').style.display = 'none';
  markActivityComplete('act6');
}

/* =========================================================
   ACTIVITY 7 — Drag and Drop: Clasifica estrategias en el Embudo
   ========================================================= */
const ACT7_ITEMS = [
  'Post de blog SEO',
  'Webinar gratuito',
  'Email de seguimiento',
  'Demo gratuita del producto',
  'Oferta especial 20%',
  'Video viral en TikTok',
  'Comparativa de competidores',
  'Llamada de cierre',
];

const ACT7_ZONES = {
  'TOFU (Atracción)':       ['Post de blog SEO', 'Video viral en TikTok', 'Webinar gratuito'],
  'MOFU (Consideración)':   ['Email de seguimiento', 'Demo gratuita del producto', 'Comparativa de competidores'],
  'BOFU (Conversión)':      ['Oferta especial 20%', 'Llamada de cierre'],
};

function renderActivity7() {
  const container = document.getElementById('act7-container');
  if (!container) return;

  Object.keys(ACT7_ZONES).forEach(function (z) { dnd7State[z] = []; });

  let html = '<div class="activity-card">'
    + '<h3 class="activity-title">Actividad 7: Clasifica las estrategias en el Embudo de Ventas</h3>'
    + '<p class="activity-instruction">Arrastra cada estrategia a la etapa del embudo de ventas correspondiente.</p>'
    + '<div class="dnd-workspace">'
    + '<div class="dnd-items-pool" id="act7-pool">';

  ACT7_ITEMS.forEach(function (item) {
    html += createDraggable(item, 'act7');
  });

  html += '</div><div class="dnd-zones funnel-zones">';

  Object.keys(ACT7_ZONES).forEach(function (zone) {
    const zoneKey = zone.replace(/[^a-zA-Z0-9]/g, '_');
    html += '<div class="dnd-zone funnel-zone" id="act7-zone-' + zoneKey + '" '
          + 'ondragover="onDragOver(event)" '
          + 'ondrop="onDrop(event, \'act7\', \'' + escapeAttr(zone) + '\')" '
          + 'ondragleave="onDragLeave(event)">'
          + '<div class="zone-label">' + zone + '</div>'
          + '<div class="zone-items" id="act7-zone-items-' + zoneKey + '"></div>'
          + '</div>';
  });

  html += '</div></div>'
    + '<div class="dnd-actions">'
    + '<button class="btn btn-secondary" onclick="resetActivity7()">Reiniciar</button>'
    + '<button class="btn btn-primary" onclick="submitActivity7()">Verificar</button>'
    + '</div>'
    + '<div id="act7-feedback" class="feedback-box hidden"></div>'
    + '</div>';

  container.innerHTML = html;
}

function resetActivity7() {
  Object.keys(ACT7_ZONES).forEach(function (z) { dnd7State[z] = []; });
  renderActivity7();
}

function submitActivity7() {
  let allCorrect = true;
  let feedbackParts = [];

  Object.keys(ACT7_ZONES).forEach(function (zone) {
    const correct = ACT7_ZONES[zone].slice().sort();
    const given   = (dnd7State[zone] || []).slice().sort();
    const isOk    = JSON.stringify(correct) === JSON.stringify(given);
    if (!isOk) allCorrect = false;
    feedbackParts.push('<strong>' + zone + ':</strong> '
      + (isOk ? '<span class="text-correct">✓ Correcto</span>' : '<span class="text-incorrect">✗ Incorrecto — esperado: ' + correct.join(', ') + '</span>'));
  });

  const intro = allCorrect
    ? '¡Excelente! Clasificaste correctamente todas las estrategias en el embudo.'
    : 'Revisa la clasificación:';
  showFeedback('act7-feedback', allCorrect ? 'correct' : 'incorrect', intro + '<br>' + feedbackParts.join('<br>'));

  if (allCorrect) markActivityComplete('act7');
}

/* =========================================================
   ACTIVITY 8 — Case Study: Funnel Analysis (GameZone)
   ========================================================= */
const ACT8_QUESTIONS = [
  {
    id: 'q1',
    text: '¿Qué etapa del embudo representa los videos de TikTok?',
    options: ['TOFU (Atracción)', 'MOFU (Consideración)', 'BOFU (Conversión)', 'Post-venta'],
    correct: 'TOFU (Atracción)',
  },
  {
    id: 'q2',
    text: '¿Qué estrategia usaron en MOFU?',
    options: ['Videos virales en TikTok', 'Demo descargable por email', 'Descuento del 30%', 'Publicidad en Google Ads'],
    correct: 'Demo descargable por email',
  },
  {
    id: 'q3',
    text: '¿Cuál fue la estrategia BOFU?',
    options: ['Publicar en TikTok', 'Enviar newsletters', 'Descuento del 30% a leads calificados', 'Crear un blog de videojuegos'],
    correct: 'Descuento del 30% a leads calificados',
  },
];

function renderActivity8() {
  const container = document.getElementById('act8-container');
  if (!container) return;

  let html = '<div class="activity-card">'
    + '<h3 class="activity-title">Actividad 8: Caso de Estudio — GameZone</h3>'
    + '<div class="scenario-box">'
    + '<p><strong>Escenario:</strong> GameZone lanzó un videojuego indie.</p>'
    + '<ul>'
    + '<li>📱 <strong>Semana 1:</strong> Publicaron 3 videos en TikTok (50K views)</li>'
    + '<li>📧 <strong>Semana 2:</strong> Enviaron emails a suscriptores con demo descargable (2K descargas)</li>'
    + '<li>🎁 <strong>Semana 3:</strong> Ofrecieron descuento 30% a quienes descargaron la demo (500 compras)</li>'
    + '</ul>'
    + '</div>';

  ACT8_QUESTIONS.forEach(function (q, i) {
    html += '<div class="case-question">'
      + '<p class="question-text"><strong>' + (i + 1) + '. ' + q.text + '</strong></p>'
      + '<div class="options-list">';
    q.options.forEach(function (opt) {
      html += '<div class="option-item">'
        + '<input type="radio" name="act8-' + q.id + '" id="act8-' + q.id + '-' + opt.replace(/\s/g,'_') + '" value="' + escapeAttr(opt) + '">'
        + '<label for="act8-' + q.id + '-' + opt.replace(/\s/g,'_') + '">' + opt + '</label>'
        + '</div>';
    });
    html += '</div></div>';
  });

  html += '<button class="btn btn-primary" onclick="submitActivity8()">Verificar respuestas</button>'
    + '<div id="act8-feedback" class="feedback-box hidden"></div>'
    + '</div>';

  container.innerHTML = html;
}

function submitActivity8() {
  let score = 0;
  let feedbackParts = [];

  ACT8_QUESTIONS.forEach(function (q) {
    const sel = document.querySelector('input[name="act8-' + q.id + '"]:checked');
    const given = sel ? sel.value : null;
    const isOk = given === q.correct;
    if (isOk) score++;
    feedbackParts.push('<strong>Pregunta ' + (ACT8_QUESTIONS.indexOf(q) + 1) + ':</strong> '
      + (isOk
        ? '<span class="text-correct">✓ Correcto</span>'
        : '<span class="text-incorrect">✗ Incorrecto — Respuesta: ' + q.correct + '</span>'));
  });

  const pct = Math.round((score / ACT8_QUESTIONS.length) * 100);
  const type = pct === 100 ? 'correct' : (pct >= 67 ? 'partial' : 'incorrect');
  const intro = pct === 100
    ? '¡Perfecto! Analizaste correctamente todas las etapas del embudo de GameZone.'
    : 'Obtuviste ' + score + '/' + ACT8_QUESTIONS.length + ' (' + pct + '%). Revisa:';
  showFeedback('act8-feedback', type, intro + '<br>' + feedbackParts.join('<br>'));

  document.querySelectorAll('[name^="act8-"]').forEach(function (inp) { inp.disabled = true; });
  if (pct >= 67) markActivityComplete('act8');
}

/* =========================================================
   FINAL QUIZ — Módulo 1.4
   ========================================================= */
const QUIZ_ALL_QUESTIONS = [
  {
    id: 'q1',
    text: '¿Cuál de las siguientes es la definición más completa de Marketing Digital?',
    options: [
      { id: 'a', text: 'Publicidad en televisión e internet', correct: false },
      { id: 'b', text: 'Conjunto de estrategias para promover productos/servicios en canales digitales', correct: true },
      { id: 'c', text: 'Diseño de páginas web para empresas', correct: false },
      { id: 'd', text: 'Gestión de redes sociales únicamente', correct: false },
    ],
  },
  {
    id: 'q2',
    text: 'En las 4Ps, la "Plaza" se refiere a:',
    options: [
      { id: 'a', text: 'El lugar físico de la tienda', correct: false },
      { id: 'b', text: 'La ubicación del consumidor', correct: false },
      { id: 'c', text: 'Los canales y puntos de distribución donde se ofrece el producto', correct: true },
      { id: 'd', text: 'El espacio publicitario comprado', correct: false },
    ],
  },
  {
    id: 'q3',
    text: '¿Qué diferencia principal existe entre una necesidad y un deseo?',
    options: [
      { id: 'a', text: 'Son sinónimos en marketing', correct: false },
      { id: 'b', text: 'La necesidad es básica e innata; el deseo es moldeado por la cultura y personalidad', correct: true },
      { id: 'c', text: 'Los deseos son más importantes que las necesidades', correct: false },
      { id: 'd', text: 'Solo los niños tienen necesidades; los adultos tienen deseos', correct: false },
    ],
  },
  {
    id: 'q4',
    text: 'El Buyer Persona es:',
    options: [
      { id: 'a', text: 'El cliente que más compra en una tienda', correct: false },
      { id: 'b', text: 'El CEO de la empresa objetivo', correct: false },
      { id: 'c', text: 'Una representación semi-ficticia del cliente ideal basada en datos reales', correct: true },
      { id: 'd', text: 'Un software de gestión de clientes', correct: false },
    ],
  },
  {
    id: 'q5',
    text: 'TOFU en el embudo de ventas significa:',
    options: [
      { id: 'a', text: 'Top Of Funnel: etapa de atracción y conciencia', correct: true },
      { id: 'b', text: 'Total Output Funnel: métricas de conversión', correct: false },
      { id: 'c', text: 'Type Of Funnel: clasificación del embudo', correct: false },
      { id: 'd', text: 'Time Of Funnel: duración del proceso de venta', correct: false },
    ],
  },
  {
    id: 'q6',
    text: '¿Cuál estrategia pertenece a la etapa BOFU?',
    options: [
      { id: 'a', text: 'Post de blog informativo sobre tendencias', correct: false },
      { id: 'b', text: 'Video tutorial gratuito en YouTube', correct: false },
      { id: 'c', text: 'Webinar de demostración del producto', correct: false },
      { id: 'd', text: 'Oferta exclusiva con descuento para leads que ya evaluaron el producto', correct: true },
    ],
  },
  {
    id: 'q7',
    text: 'Un videojuego indie fija su precio en $4.99 durante el lanzamiento y luego sube a $14.99. ¿Qué estrategia de precio aplica?',
    options: [
      { id: 'a', text: 'Precio de penetración', correct: true },
      { id: 'b', text: 'Precio premium', correct: false },
      { id: 'c', text: 'Precio psicológico', correct: false },
      { id: 'd', text: 'Precio de paquete', correct: false },
    ],
  },
  {
    id: 'q8',
    text: '¿Cuál de estos canales es más efectivo en la etapa MOFU?',
    options: [
      { id: 'a', text: 'Anuncio en TikTok a audiencia fría', correct: false },
      { id: 'b', text: 'SEO en blog de tendencias', correct: false },
      { id: 'c', text: 'Email marketing con contenido educativo personalizado', correct: true },
      { id: 'd', text: 'Cartelería en vía pública', correct: false },
    ],
  },
  {
    id: 'q9',
    text: 'Una app de diseño gráfico ofrece versión gratuita con funciones básicas y versión de pago con funciones avanzadas. ¿Qué modelo de negocio usa?',
    options: [
      { id: 'a', text: 'Suscripción mensual', correct: false },
      { id: 'b', text: 'Freemium', correct: true },
      { id: 'c', text: 'Precio único', correct: false },
      { id: 'd', text: 'Pay-per-use', correct: false },
    ],
  },
  {
    id: 'q10',
    text: 'El Customer Journey se refiere a:',
    options: [
      { id: 'a', text: 'El viaje del CEO a visitar clientes', correct: false },
      { id: 'b', text: 'La ruta completa que recorre el cliente desde que conoce la marca hasta que compra (y después)', correct: true },
      { id: 'c', text: 'El mapa de distribución de los productos', correct: false },
      { id: 'd', text: 'El recorrido del equipo de ventas por diferentes regiones', correct: false },
    ],
  },
];

function renderFinalQuiz() {
  const container = document.getElementById('quiz-container');
  if (!container) return;

  container.innerHTML = '<div class="activity-card quiz-intro">'
    + '<h3 class="activity-title">Quiz Final: Marketing Digital</h3>'
    + '<p>Este quiz consta de <strong>10 preguntas</strong> sobre todos los temas del curso.</p>'
    + '<p>Cada pregunta correcta vale <strong>10 puntos</strong>. Necesitas al menos <strong>60 puntos</strong> para aprobar.</p>'
    + '<button class="btn btn-primary btn-large" onclick="startQuiz()">Iniciar Quiz</button>'
    + '</div>';
}

function startQuiz() {
  quizSubmitted = false;
  Object.keys(quizAnswers).forEach(function (k) { delete quizAnswers[k]; });

  quizQuestions = shuffleArray(QUIZ_ALL_QUESTIONS.slice());

  const container = document.getElementById('quiz-container');
  if (!container) return;

  let html = '<div class="quiz-wrapper">'
    + '<h3 class="activity-title">Quiz Final</h3>';

  quizQuestions.forEach(function (q, i) {
    html += '<div class="quiz-question" id="quiz-q-' + i + '">'
      + '<p class="question-text"><strong>' + (i + 1) + '. ' + q.text + '</strong></p>'
      + '<div class="options-list">';
    q.options.forEach(function (opt) {
      html += '<div class="option-item">'
        + '<input type="radio" name="quiz-' + i + '" id="quiz-' + i + '-' + opt.id + '" value="' + opt.id + '" onchange="quizAnswers[' + i + ']=\'' + opt.id + '\'">'
        + '<label for="quiz-' + i + '-' + opt.id + '">'
        + '<span class="option-letter">' + opt.id.toUpperCase() + ')</span> '
        + opt.text
        + '</label>'
        + '</div>';
    });
    html += '</div></div>';
  });

  html += '<div class="quiz-actions">'
    + '<button class="btn btn-primary btn-large" onclick="submitQuiz()">Entregar Quiz</button>'
    + '</div>'
    + '</div>';

  container.innerHTML = html;
}

function submitQuiz() {
  if (quizSubmitted) return;

  // Check all answered
  const answeredCount = Object.keys(quizAnswers).length;
  if (answeredCount < quizQuestions.length) {
    alert('Por favor responde todas las preguntas antes de entregar. Te faltan ' + (quizQuestions.length - answeredCount) + ' pregunta(s).');
    return;
  }

  quizSubmitted = true;

  let correctCount = 0;
  const breakdown = [];

  quizQuestions.forEach(function (q, i) {
    const givenId  = quizAnswers[i];
    const givenOpt = q.options.find(function (o) { return o.id === givenId; });
    const correct  = q.options.find(function (o) { return o.correct; });
    const isOk = givenOpt && givenOpt.correct;
    if (isOk) correctCount++;
    breakdown.push({ q: q, given: givenOpt, correct: correct, isOk: isOk, num: i + 1 });
  });

  const score   = correctCount * 10;
  const pct     = score;
  const passed  = pct >= 60;

  window.SCORM.setScore(score);
  if (passed) markActivityComplete('quiz');

  // Build result screen
  const container = document.getElementById('quiz-container');
  if (!container) return;

  let html = '<div class="quiz-result">'
    + '<div class="result-header ' + (passed ? 'result-pass' : 'result-fail') + '">'
    + '<div class="result-score">' + score + ' / 100</div>'
    + '<div class="result-status">' + (passed ? '✅ ¡Aprobado!' : '❌ No aprobado') + '</div>'
    + '<p>' + (passed
        ? '¡Felicitaciones! Demostraste dominio de los conceptos de Marketing Digital.'
        : 'No alcanzaste el puntaje mínimo (60). Puedes volver a intentarlo.') + '</p>'
    + '<div class="result-bar"><div class="result-bar-fill" style="width:' + pct + '%"></div></div>'
    + '<p class="result-note">' + correctCount + ' de ' + quizQuestions.length + ' preguntas correctas</p>'
    + '</div>'
    + '<div class="result-breakdown"><h4>Desglose de respuestas:</h4>';

  breakdown.forEach(function (item) {
    html += '<div class="breakdown-item ' + (item.isOk ? 'correct-item' : 'incorrect-item') + '">'
      + '<span class="bi-num">' + item.num + '.</span>'
      + '<span class="bi-q">' + item.q.text + '</span>'
      + '<span class="bi-answer">'
      + (item.isOk
        ? '✓ ' + (item.given ? item.given.text : '')
        : '✗ Tu respuesta: ' + (item.given ? item.given.text : 'Sin respuesta') + ' | Correcta: ' + item.correct.text)
      + '</span>'
      + '</div>';
  });

  html += '</div>'
    + '<div class="quiz-actions">'
    + '<button class="btn btn-secondary" onclick="retakeQuiz()">🔄 Volver a intentar</button>'
    + '</div>'
    + '</div>';

  container.innerHTML = html;
}

function retakeQuiz() {
  startQuiz();
}

/* =========================================================
   APPLICATION PRACTICAL — Módulo 1.4
   ========================================================= */
function renderAppPractical() {
  const container = document.getElementById('app-practical-container');
  if (!container) return;

  const html = '<div class="activity-card">'
    + '<h3 class="activity-title">Aplicación Práctica: Mini-Estrategia de Marketing Digital</h3>'
    + '<div class="scenario-box">'
    + '<p><strong>Escenario:</strong> Eres el responsable de marketing de <em>PixelCraft Studio</em>, '
    + 'un estudio indie que lanzará su primer videojuego mobile en 3 meses. '
    + 'Diseña su estrategia de Marketing Digital aplicando todos los conceptos del curso.</p>'
    + '</div>'
    + '<form id="practical-form" onsubmit="submitAppPractical(event)">'

    // 4Ps
    + '<fieldset class="form-fieldset">'
    + '<legend>Las 4Ps del Marketing</legend>'
    + practicalTextarea('practical-producto',  'Producto', 'Describe el videojuego: género, mecánicas, propuesta de valor única...')
    + practicalTextarea('practical-precio',    'Precio',   'Estrategia de precios: modelo freemium, precio de lanzamiento, in-app purchases...')
    + practicalTextarea('practical-plaza',     'Plaza',    'Canales de distribución: App Store, Google Play, plataformas de streaming...')
    + practicalTextarea('practical-promocion', 'Promoción','Estrategias de comunicación: redes sociales, influencers, comunidades gamer...')
    + '</fieldset>'

    // Buyer Persona
    + '<fieldset class="form-fieldset">'
    + '<legend>Buyer Persona de PixelCraft</legend>'
    + formField('bp-nombre',   'Nombre', 'text',   'Nombre ficticio del buyer persona')
    + formField('bp-edad',     'Edad',   'number', 'Edad aproximada')
    + formField('bp-profesion','Profesión', 'text','Ocupación o perfil')
    + formField('bp-reto',     'Reto principal', 'text', '¿Qué problema busca resolver con el juego?')
    + formField('bp-canal',    'Canal digital favorito', 'text', 'TikTok, Twitch, YouTube...')
    + '</fieldset>'

    // Funnel strategy
    + '<fieldset class="form-fieldset">'
    + '<legend>Estrategia por Etapa del Embudo</legend>'
    + practicalTextarea('funnel-tofu', 'TOFU — Atracción', 'Acciones para generar awareness: contenidos, videos, SEO...')
    + practicalTextarea('funnel-mofu', 'MOFU — Consideración', 'Acciones para nutrir leads: demos, emails, comparativas...')
    + practicalTextarea('funnel-bofu', 'BOFU — Conversión', 'Acciones para convertir: descuentos, ofertas limitadas, llamadas a la acción...')
    + '</fieldset>'

    + '<button type="submit" class="btn btn-primary btn-large">Entregar mi Estrategia</button>'
    + '</form>'
    + '<div id="practical-result" class="hidden"></div>'
    + '</div>';

  container.innerHTML = html;
}

function practicalTextarea(id, label, placeholder) {
  return '<div class="form-group">'
    + '<label for="' + id + '">' + label + '</label>'
    + '<textarea id="' + id + '" rows="4" placeholder="' + placeholder + '" required></textarea>'
    + '</div>';
}

function submitAppPractical(event) {
  event.preventDefault();

  const resultDiv = document.getElementById('practical-result');
  if (!resultDiv) return;

  let html = '<div class="model-solution">'
    + '<h4>📌 Solución Modelo — PixelCraft Studio</h4>'

    + '<div class="solution-section">'
    + '<h5>Las 4Ps</h5>'
    + '<ul>'
    + '<li><strong>Producto:</strong> Videojuego de acción y puzles 2D con pixel art, modos de historia y endless. Propuesta única: narrativa ramificada y personalización del personaje.</li>'
    + '<li><strong>Precio:</strong> Modelo freemium — descarga gratuita con in-app purchases cosméticos. Precio de lanzamiento premium $2.99 las primeras 2 semanas para early adopters.</li>'
    + '<li><strong>Plaza:</strong> App Store (iOS) y Google Play (Android) como canales principales. Secundario: itch.io para versión PC y comunidades indie. Estrategia ASO para posicionamiento orgánico.</li>'
    + '<li><strong>Promoción:</strong> TikTok y YouTube para gameplay clips virales. Partnership con micro-influencers gamers (10K–100K seguidores). Beta abierta 1 mes antes del lanzamiento. Email marketing a suscriptores de beta.</li>'
    + '</ul>'
    + '</div>'

    + '<div class="solution-section">'
    + '<h5>Buyer Persona Modelo</h5>'
    + '<p><strong>Gamer Casual Pro:</strong> Alejandro, 20 años, estudiante universitario. Reto: busca entretenimiento de calidad en móvil sin pagar mucho. Canal favorito: TikTok y Twitch. Objetivo: descubrir juegos indie antes que el mainstream.</p>'
    + '</div>'

    + '<div class="solution-section">'
    + '<h5>Estrategia de Embudo</h5>'
    + '<ul>'
    + '<li><strong>TOFU:</strong> 3 videos TikTok/semana de gameplay, blog de desarrollo en Medium con SEO, participación en r/indiegaming y comunidades Discord.</li>'
    + '<li><strong>MOFU:</strong> Beta abierta gratuita, emails con dev diary a suscritos, trailers comparativos con competidores, demo jugable en web.</li>'
    + '<li><strong>BOFU:</strong> Descuento 40% primer lanzamiento (primeras 48h), bundle con OST digital, retargeting a quienes completaron la demo, notificación push en día de lanzamiento.</li>'
    + '</ul>'
    + '</div>'

    + '<div class="rubric-box">'
    + '<h4>📝 Rúbrica de Evaluación</h4>'
    + '<table class="rubric-table">'
    + '<thead><tr><th>Criterio</th><th>Descripción</th></tr></thead>'
    + '<tbody>'
    + '<tr><td>Coherencia de las 4Ps</td><td>Los 4 elementos se alinean entre sí y reflejan una estrategia integrada y consistente.</td></tr>'
    + '<tr><td>Especificidad del Buyer Persona</td><td>El perfil es detallado, basado en datos plausibles y va más allá de generalidades.</td></tr>'
    + '<tr><td>Aplicación correcta del Embudo</td><td>Las acciones de cada etapa corresponden correctamente a TOFU, MOFU o BOFU.</td></tr>'
    + '<tr><td>Creatividad y originalidad</td><td>Las estrategias propuestas son innovadoras y adaptadas al contexto de un juego indie mobile.</td></tr>'
    + '<tr><td>Viabilidad y realismo</td><td>Las acciones propuestas son realizables con recursos limitados propios de un estudio indie.</td></tr>'
    + '</tbody>'
    + '</table>'
    + '</div>'
    + '</div>';

  resultDiv.innerHTML = html;
  resultDiv.classList.remove('hidden');
  document.getElementById('practical-form').style.display = 'none';
  markActivityComplete('appPractical');
}

/* =========================================================
   DRAG AND DROP — Generic Helpers
   ========================================================= */
function createDraggable(text, actId) {
  const id = actId + '-item-' + sanitizeId(text);
  return '<div class="draggable-item" id="' + id + '" draggable="true" '
    + 'ondragstart="onDragStart(event, \'' + escapeAttr(text) + '\', \'' + actId + '\')" '
    + 'ondragend="onDragEnd(event)">'
    + text
    + '</div>';
}

function setupDndPool(poolId) {
  // Items are already rendered; nothing extra needed in this implementation.
}

function onDragStart(event, text, actId) {
  draggedItem = { text: text, actId: actId };
  event.dataTransfer.setData('text/plain', text);
  event.dataTransfer.effectAllowed = 'move';
  event.target.classList.add('dragging');
}

function onDragEnd(event) {
  event.target.classList.remove('dragging');
}

function onDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  event.currentTarget.classList.add('drag-over');
}

function onDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

function onDrop(event, actId, zone) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');

  if (!draggedItem || draggedItem.actId !== actId) return;

  const text = draggedItem.text;
  const stateObj = actId === 'act3' ? dnd3State : dnd7State;
  const zonesObj = actId === 'act3' ? ACT3_ZONES : ACT7_ZONES;

  // Remove from previous zone if present
  Object.keys(stateObj).forEach(function (z) {
    stateObj[z] = stateObj[z].filter(function (i) { return i !== text; });
  });

  // Add to new zone
  if (!stateObj[zone]) stateObj[zone] = [];
  stateObj[zone].push(text);

  // Re-render the zones content
  refreshDndZones(actId, stateObj, zonesObj);

  // Remove from pool if present
  const poolItem = document.getElementById(actId + '-item-' + sanitizeId(text));
  if (poolItem) poolItem.style.display = 'none';

  draggedItem = null;
}

function refreshDndZones(actId, stateObj, zonesObj) {
  Object.keys(zonesObj).forEach(function (zone) {
    const zoneKey = zone.replace(/[^a-zA-Z0-9]/g, '_');
    const itemsContainer = document.getElementById(actId + '-zone-items-' + zoneKey);
    if (!itemsContainer) return;

    itemsContainer.innerHTML = '';
    const items = stateObj[zone] || [];
    items.forEach(function (item) {
      const div = document.createElement('div');
      div.className = 'zone-dropped-item';
      div.textContent = item;
      div.setAttribute('draggable', 'true');
      div.addEventListener('dragstart', function (e) { onDragStart(e, item, actId); });
      div.addEventListener('dragend', onDragEnd);
      // Click to return to pool
      div.addEventListener('dblclick', function () {
        returnToPool(actId, item, zone, stateObj);
      });
      itemsContainer.appendChild(div);
    });
  });
}

function returnToPool(actId, text, zone, stateObj) {
  stateObj[zone] = stateObj[zone].filter(function (i) { return i !== text; });
  const poolItem = document.getElementById(actId + '-item-' + sanitizeId(text));
  if (poolItem) poolItem.style.display = '';
  const zoneKey = zone.replace(/[^a-zA-Z0-9]/g, '_');
  const itemsContainer = document.getElementById(actId + '-zone-items-' + zoneKey);
  if (itemsContainer) {
    itemsContainer.querySelectorAll('.zone-dropped-item').forEach(function (el) {
      if (el.textContent === text) el.remove();
    });
  }
}

/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */
function showFeedback(elementId, type, html) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = 'feedback-box';
  if (type) el.classList.add('feedback-' + type);
  el.innerHTML = html;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function sanitizeId(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_');
}

function escapeAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* =========================================================
   EXPOSE GLOBALS needed by inline onclick handlers
   ========================================================= */
window.startCourse         = startCourse;
window.showModule          = showModule;
window.nextModule          = nextModule;
window.prevModule          = prevModule;
window.submitActivity1     = submitActivity1;
window.submitActivity2     = submitActivity2;
window.resetActivity3      = resetActivity3;
window.submitActivity3     = submitActivity3;
window.selectLeft          = selectLeft;
window.selectRight         = selectRight;
window.resetActivity4      = resetActivity4;
window.submitActivity4     = submitActivity4;
window.submitActivity5     = submitActivity5;
window.submitActivity6     = submitActivity6;
window.resetActivity7      = resetActivity7;
window.submitActivity7     = submitActivity7;
window.submitActivity8     = submitActivity8;
window.startQuiz           = startQuiz;
window.submitQuiz          = submitQuiz;
window.retakeQuiz          = retakeQuiz;
window.submitAppPractical  = submitAppPractical;
window.onDragStart         = onDragStart;
window.onDragEnd           = onDragEnd;
window.onDragOver          = onDragOver;
window.onDragLeave         = onDragLeave;
window.onDrop              = onDrop;
window.blanksState         = blanksState;
window.quizAnswers         = quizAnswers;
window.dnd3State           = dnd3State;
window.dnd7State           = dnd7State;
window.match4State         = match4State;
