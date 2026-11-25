/**
 * scorm_api.js
 * Wrapper SCORM 1.2 para OVA "Marketing Digital"
 * Ingeniería Multimedia — Universidad Simón Bolívar
 *
 * Este módulo encapsula toda la comunicación con el LMS mediante
 * la API SCORM 1.2. Proporciona degradación elegante cuando no
 * se detecta un LMS (modo vista previa).
 */

(function (window) {
  'use strict';

  /* ============================================================
     SECCIÓN 1: CONSTANTES Y ESTADO INTERNO
     ============================================================ */

  /** Umbral de puntaje para aprobar el curso (porcentaje). */
  var PASS_THRESHOLD = 60;

  /** Referencia a la API SCORM encontrada en el árbol de frames. */
  var _api = null;

  /** Indica si la sesión SCORM fue inicializada correctamente. */
  var _initialized = false;

  /** Modo vista previa: true cuando no se encuentra API del LMS. */
  var _previewMode = false;

  /* ============================================================
     SECCIÓN 2: BÚSQUEDA DE LA API DEL LMS
     Recorre la jerarquía de ventanas/frames de forma segura para
     localizar el objeto "API" que expone el LMS (SCORM 1.2).
     ============================================================ */

  /**
   * Intenta obtener la API desde una ventana concreta.
   * @param {Window} win - Objeto window a inspeccionar.
   * @returns {Object|null} Referencia a la API o null.
   */
  function _getAPIFromWindow(win) {
    try {
      if (win && typeof win.API !== 'undefined' && win.API !== null) {
        return win.API;
      }
    } catch (e) {
      // Acceso cruzado denegado — continuar búsqueda
      console.warn('[SCORM] Acceso denegado al inspeccionar ventana:', e.message);
    }
    return null;
  }

  /**
   * Sube por la cadena de frames (hasta 7 niveles) buscando la API.
   * Recorre: ventana actual → parents → top → opener.
   * @returns {Object|null} API SCORM encontrada o null.
   */
  function _findAPI() {
    var maxLevels = 7;
    var api = null;

    // 1. Ventana actual
    api = _getAPIFromWindow(window);
    if (api) return api;

    // 2. Subir por window.parent
    try {
      var current = window.parent;
      var level = 0;
      while (current && level < maxLevels) {
        api = _getAPIFromWindow(current);
        if (api) return api;
        if (current === current.parent) break; // llegamos al tope
        current = current.parent;
        level++;
      }
    } catch (e) {
      console.warn('[SCORM] Error al recorrer parents:', e.message);
    }

    // 3. window.top directamente
    try {
      api = _getAPIFromWindow(window.top);
      if (api) return api;
    } catch (e) {
      console.warn('[SCORM] Error al acceder a window.top:', e.message);
    }

    // 4. window.opener (ventana que abrió esta)
    try {
      if (window.opener && window.opener !== window) {
        api = _getAPIFromWindow(window.opener);
        if (api) return api;

        // Subir también por los parents del opener
        var openerParent = window.opener.parent;
        var opLevel = 0;
        while (openerParent && opLevel < maxLevels) {
          api = _getAPIFromWindow(openerParent);
          if (api) return api;
          if (openerParent === openerParent.parent) break;
          openerParent = openerParent.parent;
          opLevel++;
        }
      }
    } catch (e) {
      console.warn('[SCORM] Error al acceder a window.opener:', e.message);
    }

    return null;
  }

  /* ============================================================
     SECCIÓN 3: INICIALIZACIÓN
     ============================================================ */

  /**
   * Inicializa la sesión SCORM con el LMS.
   * Llama a LMSInitialize("") y configura el estado inicial.
   * Si no encuentra API, activa el modo vista previa.
   * @returns {boolean} true si se inicializó correctamente.
   */
  function initSCORM() {
    try {
      _api = _findAPI();

      if (!_api) {
        // No hay LMS — activar modo vista previa
        _previewMode = true;
        _initialized = false;
        console.info('[SCORM] Modo vista previa: no se encontró API del LMS.');
        return false;
      }

      var result = _api.LMSInitialize('');

      if (result === 'true' || result === true) {
        _initialized = true;
        _previewMode = false;
        console.info('[SCORM] Sesión inicializada correctamente.');

        // Establecer valores iniciales obligatorios
        setSCORMValue('cmi.core.score.min', '0');
        setSCORMValue('cmi.core.score.max', '100');

        // Marcar como incompleto si aún no tiene estado
        var currentStatus = getSCORMValue('cmi.core.lesson_status');
        if (!currentStatus || currentStatus === 'not attempted' || currentStatus === '') {
          setSCORMValue('cmi.core.lesson_status', 'incomplete');
        }

        return true;
      } else {
        var errCode = _api.LMSGetLastError();
        console.error('[SCORM] LMSInitialize falló. Código de error:', errCode);
        _initialized = false;
        return false;
      }
    } catch (e) {
      console.error('[SCORM] Excepción durante initSCORM:', e.message);
      _previewMode = true;
      _initialized = false;
      return false;
    }
  }

  /* ============================================================
     SECCIÓN 4: LECTURA Y ESCRITURA DE VALORES CMI
     ============================================================ */

  /**
   * Obtiene un valor del modelo de datos CMI del LMS.
   * @param {string} element - Nombre del elemento CMI (ej. 'cmi.core.score.raw').
   * @returns {string} Valor obtenido, o cadena vacía en caso de error.
   */
  function getSCORMValue(element) {
    if (_previewMode || !_initialized || !_api) {
      console.info('[SCORM Preview] getValue:', element, '→ ""');
      return '';
    }

    try {
      var value = _api.LMSGetValue(element);
      var errCode = _api.LMSGetLastError();

      if (errCode !== '0' && errCode !== 0) {
        var errStr = _api.LMSGetErrorString(errCode);
        console.warn('[SCORM] Error al leer "' + element + '": ' + errStr + ' (código ' + errCode + ')');
        return '';
      }

      return value;
    } catch (e) {
      console.error('[SCORM] Excepción en getSCORMValue("' + element + '"):', e.message);
      return '';
    }
  }

  /**
   * Establece un valor en el modelo de datos CMI del LMS.
   * Llama automáticamente a LMSCommit("") tras cada escritura.
   * @param {string} element - Nombre del elemento CMI.
   * @param {string|number} value - Valor a asignar.
   * @returns {boolean} true si la operación fue exitosa.
   */
  function setSCORMValue(element, value) {
    if (_previewMode || !_initialized || !_api) {
      console.info('[SCORM Preview] setValue:', element, '=', value);
      return false;
    }

    try {
      var result = _api.LMSSetValue(element, String(value));
      var errCode = _api.LMSGetLastError();

      if (result !== 'true' && result !== true) {
        var errStr = _api.LMSGetErrorString(errCode);
        console.warn('[SCORM] Error al escribir "' + element + '" = "' + value + '": ' + errStr);
        return false;
      }

      // Confirmar inmediatamente para garantizar persistencia
      _commitSCORM();
      return true;
    } catch (e) {
      console.error('[SCORM] Excepción en setSCORMValue("' + element + '"):', e.message);
      return false;
    }
  }

  /* ============================================================
     SECCIÓN 5: COMMIT Y FINALIZACIÓN
     ============================================================ */

  /**
   * Envía (persiste) los datos en el LMS mediante LMSCommit("").
   * Uso interno; también puede llamarse externamente para forzar guardado.
   * @returns {boolean} true si el commit fue exitoso.
   */
  function _commitSCORM() {
    if (_previewMode || !_initialized || !_api) return false;

    try {
      var result = _api.LMSCommit('');
      if (result !== 'true' && result !== true) {
        var errCode = _api.LMSGetLastError();
        console.warn('[SCORM] LMSCommit falló. Código:', errCode);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[SCORM] Excepción en LMSCommit:', e.message);
      return false;
    }
  }

  /**
   * Alias público de _commitSCORM para guardar datos bajo demanda.
   * @returns {boolean}
   */
  function saveSCORM() {
    if (_previewMode) {
      console.info('[SCORM Preview] saveSCORM llamado.');
      return false;
    }
    return _commitSCORM();
  }

  /**
   * Finaliza la sesión SCORM.
   * Realiza un commit final y llama a LMSFinish("").
   * Debe invocarse al cerrar o salir del OVA.
   * @returns {boolean} true si la finalización fue exitosa.
   */
  function finishSCORM() {
    if (_previewMode || !_initialized || !_api) {
      console.info('[SCORM Preview] finishSCORM llamado.');
      return false;
    }

    try {
      // Commit antes de cerrar para no perder datos
      _commitSCORM();

      var result = _api.LMSFinish('');
      _initialized = false;

      if (result !== 'true' && result !== true) {
        var errCode = _api.LMSGetLastError();
        console.warn('[SCORM] LMSFinish falló. Código:', errCode);
        return false;
      }

      console.info('[SCORM] Sesión finalizada correctamente.');
      return true;
    } catch (e) {
      console.error('[SCORM] Excepción en finishSCORM:', e.message);
      return false;
    }
  }

  /* ============================================================
     SECCIÓN 6: LÓGICA DE PUNTAJE Y ESTADO
     ============================================================ */

  /**
   * Establece el puntaje del estudiante y determina automáticamente
   * el estado de aprobación (passed/failed) según el umbral definido.
   *
   * Elementos CMI afectados:
   *   - cmi.core.score.raw  → puntaje numérico (0-100)
   *   - cmi.core.lesson_status → "passed" o "failed"
   *
   * @param {number} score - Puntaje obtenido (0 a 100).
   * @returns {boolean} true si los valores se guardaron correctamente.
   */
  function setScore(score) {
    var numScore = Number(score);

    // Validar rango
    if (isNaN(numScore)) {
      console.warn('[SCORM] setScore: valor inválido recibido:', score);
      numScore = 0;
    }
    numScore = Math.max(0, Math.min(100, numScore));

    if (_previewMode) {
      var previewStatus = numScore >= PASS_THRESHOLD ? 'passed' : 'failed';
      console.info('[SCORM Preview] setScore:', numScore, '→ estado:', previewStatus);
      return false;
    }

    var scoreOk = setSCORMValue('cmi.core.score.raw', String(numScore));

    // Determinar estado según el umbral de aprobación
    var newStatus = numScore >= PASS_THRESHOLD ? 'passed' : 'failed';
    var statusOk  = setSCORMValue('cmi.core.lesson_status', newStatus);

    console.info('[SCORM] Puntaje registrado:', numScore, '| Estado:', newStatus);
    return scoreOk && statusOk;
  }

  /**
   * Establece manualmente el estado de la lección.
   * Valores SCORM 1.2 válidos:
   *   "passed" | "failed" | "completed" | "incomplete" |
   *   "not attempted" | "browsed"
   *
   * @param {string} status - Estado de la lección.
   * @returns {boolean} true si se guardó correctamente.
   */
  function setStatus(status) {
    var validStatuses = [
      'passed', 'failed', 'completed', 'incomplete',
      'not attempted', 'browsed'
    ];

    if (validStatuses.indexOf(status) === -1) {
      console.warn('[SCORM] setStatus: estado no reconocido:', status);
      return false;
    }

    if (_previewMode) {
      console.info('[SCORM Preview] setStatus:', status);
      return false;
    }

    return setSCORMValue('cmi.core.lesson_status', status);
  }

  /* ============================================================
     SECCIÓN 7: UTILIDADES PÚBLICAS
     ============================================================ */

  /**
   * Indica si la API SCORM está disponible y la sesión activa.
   * @returns {boolean}
   */
  function isAvailable() {
    return _initialized && !_previewMode && _api !== null;
  }

  /* ============================================================
     SECCIÓN 8: EVENTOS DE CICLO DE VIDA DE LA PÁGINA
     Inicializa SCORM al cargar y finaliza al salir.
     ============================================================ */

  /**
   * Handler para el evento 'load': inicializa la sesión SCORM.
   */
  function _onPageLoad() {
    initSCORM();
  }

  /**
   * Handler para el evento 'beforeunload': finaliza la sesión SCORM.
   * Se encarga de persistir datos antes de que el usuario abandone.
   */
  function _onPageUnload() {
    finishSCORM();
  }

  // Registrar handlers de ciclo de vida
  if (window.addEventListener) {
    window.addEventListener('load',         _onPageLoad,   false);
    window.addEventListener('beforeunload', _onPageUnload, false);
  } else if (window.attachEvent) {
    // Soporte IE8 (entornos LMS legacy)
    window.attachEvent('onload',         _onPageLoad);
    window.attachEvent('onbeforeunload', _onPageUnload);
  }

  /* ============================================================
     SECCIÓN 9: API PÚBLICA GLOBAL
     Expone el objeto window.SCORM con todos los métodos públicos.
     ============================================================ */

  /**
   * @namespace window.SCORM
   * @description API pública del wrapper SCORM 1.2.
   *
   * Uso típico:
   *   SCORM.init();                  // Inicializar (automático al cargar)
   *   SCORM.setScore(85);            // Puntaje 85 → estado "passed"
   *   SCORM.setStatus('incomplete'); // Marcar como incompleto
   *   SCORM.getValue('cmi.core.lesson_status');
   *   SCORM.setValue('cmi.core.score.raw', 72);
   *   SCORM.save();                  // Guardar sin cerrar sesión
   *   SCORM.finish();                // Cerrar sesión (automático al salir)
   *   SCORM.isAvailable();           // ¿Hay LMS activo?
   */
  window.SCORM = {
    /** Inicializa la sesión con el LMS. */
    init: initSCORM,

    /** Obtiene un valor CMI del LMS. */
    getValue: getSCORMValue,

    /** Establece un valor CMI en el LMS. */
    setValue: setSCORMValue,

    /** Fuerza un commit (guardado) de los datos en el LMS. */
    save: saveSCORM,

    /** Finaliza la sesión SCORM correctamente. */
    finish: finishSCORM,

    /** Registra el puntaje y actualiza el estado passed/failed. */
    setScore: setScore,

    /** Establece manualmente el estado de la lección. */
    setStatus: setStatus,

    /** Alias para compatibilidad con el controlador de la aplicación. */
    setCompletion: setStatus,

    /** Retorna true si la API SCORM está disponible y activa. */
    isAvailable: isAvailable
  };

  // Confirmación de carga del módulo
  console.info('[SCORM] scorm_api.js cargado. Umbral de aprobación:', PASS_THRESHOLD + '%');

}(window));
