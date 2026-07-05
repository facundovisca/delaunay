// ==========================================================================
// 1. VARIABLES GLOBALES Y CONFIGURACIÓN
// ==========================================================================

// Estructuras de la obra artística
let obra;
let texturas = [];
let texturaElegida;

let ultimaPaletaDibujada = -1; // Guarda la memoria de la paleta previa para no saturar el DOM

// Audios para el feedback de la interfaz
let sndOk, sndBack, sndSave;

// Variables para transiciones de animación (suavizado)
let cantidadSuave = 0;
let secundariasSuave = 0;
let fondoSuave = 0;
let tramasSuave = 0;

// Estado de los pinceles en la obra actual (Base en 0)
let valoresPerformaticos = {
  paleta: 0,
  fondo: 0,
  cantidad: 0,
  escala: 0,
  secundarias: 0,
  sinusoide: 0,
  tramas: 0,
  offset: 0,
};

// Referencias a los sliders del DOM HTML
let sPaleta, sFondo, sCantidad, sEscala, sSecundarias;
let sTramasFondo, sSinusoide, sOffset, sSensibilidad, sUmbral;

// Configuración y calibración de audio base
let mic;
let audioIniciado = false;
let amp = 0;
let intensidad = 0;
let intensidadSuaveAudio = 0;
let intensidadVu = 0;
let gestorAmp;
let micActivo = true; // Controla si escuchamos o ignoramos el audio
let btnToggleMic; // Referencia para el botón del DOM

let AMP_MIN = 0.04;
let AMP_MAX = 0.25;
let umbralRuido = 0.18; // sensibilidad moderada para detección de palmas
let umbralDuracionSonido = 300; // Duración (ms) para considerar una palma (relajado para compatibilidad)
let ventanaDoblePalma = 400; // Ventana para detectar doble palma
let tiempoMinimoEntrePalmas = 120; // Anti-rebote: mínima separación entre palmas válidas
let marcaUltimaPalmaValida = 0; //Registro de tiempo para el anti-rebote
let esperandoSegundaPalma = false; // Estado para saber si estamos en la ventana de espera
let marcaPrimerPalma = 0; // Cuándo ocurrió el primer impacto
let palmaPendiente = false; // Bandera para avisarle al draw que hay un avance retenido

// Variables de estado del entorno sónico
let haySonido = false;
let antesHabiaSonido = false;
let empezoElSonido = false;
let terminoElSonido = false;

let marcaInicioSonido = 0;
let durSonido = 0;
// Onset threshold: requiere un aumento rápido de intensidad para considerar un inicio de sonido
let onsetDeltaThreshold = 0.04;
// Atenuador físico virtual para reducir la entrada del micrófono (0.0 - 1.0)
let micAttenuation = 0.9;
// Estabilidad temporal para evitar bombeo del VU (ms)
let detectionStableMs = 20;
let overThresholdDuration = 0;
let underThresholdDuration = 0;
// Seguimiento de pico y detección de voz dentro de un tramo de sonido
let maxAmpDuringSound = 0;
let huboPitchDuranteSonido = false;

// Configuración del modelo Pitch (CREPE via ml5.js)
let pitch;
let gestorFrec;
const NOTA_MIN = 38;
const NOTA_MAX = 72;
const model_url =
  "https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/";

// Variables analíticas del detector de Pitch
let frec = 0;
let notaMidi = 0;
let hayPitch = false;
let timeoutSinPitch = 300;
let notaAnterior = null;
let direccionMelodica = 0; // 1 = subiendo, -1 = bajando
let marcaUltimoPitch = 0;
let ultimaNotaFrase = null;
let primeraNotaNuevaFrase = false;
let bloqueoPitch = 0;
let pitchActivo = true;
// Polling y throttling para optimización
let pitchPollMs = 40; // adaptative polling interval for pitch detection
let monitorIntervalMs = 33; // ~30 FPS for monitor updates
let ultimaActualizacionMonitor = 0;
// Cachés para evitar construir strings cada frame
let monitor_cached_intensidad = "";
let monitor_cached_msgModo = "";

const UMBRAL_CAMBIO = 1.4; // Semitonos mínimos para registrar un gesto tonal
let diferenciaPitch = 0; // Monitor y cálculo analítico

// Memoria de dirección del slider (1 = Incrementa automático / -1 = Decrementa automático)
let direccionSlider = 1;

// Secuenciador de la performance interactiva
let pasoActual = 1;
const TOTAL_PASOS = 8;
const nombresEstados = [
  "1. Cantidad de núcleos",
  "2. Escala General",
  "3. Figuras Intermedias",
  "4. Paleta Cromática",
  "5. Estructura de Fondo",
  "6. Amplitud Sinusoide (S)",
  "7. Tramas de Fondo",
  "8. Offset Eje (Asimetría)",
];

const textosInstrucciones = [
  // 1. Cantidad de núcleos
  "Canta agudo para agregar más núcleos centrales, canta grave para quitarlos.\nAplaudí para pasar al siguiente estado.",

  // 2. Escala General
  "Modula el tamaño de la escala general con tu voz (Agudo amplía / Grave reduce).\nUna palma avanza, dos palmas regresan.",

  // 3. Figuras Intermedias
  "Cambia la cantidad de figuras intermedias con tu entonación (Agudo suma / Grave resta).\nUna palma avanza, dos regresan.",

  // 4. Paleta Cromática
  "Recorre las paletas cromáticas con la dirección de tu voz (Agudo avanza / Grave retrocede).\nUna palma avanza, dos regresan.",

  // 5. Estructura de Fondo
  "Modifica la densidad de la estructura de fondo controlando el flujo con quiebres tonales (Agudo suma / Grave quita).\nUna palma avanza, dos regresan.",

  // 6. Amplitud Sinusoide (S)
  "Controla la expansión o contracción de la amplitud sinusoide con la dirección de tu voz (Agudo estira / Grave achica).\nUna palma avanza, dos regresan.",

  // 7. Tramas de Fondo
  "Incrementa o decrementa las tramas del fondo alternando gestos agudos y graves.\nUna palma avanza, dos regresan.",

  // 8. Offset Eje (Asimetría)
  "Altera el offset del eje para generar asimetría usando la memoria de dirección de tu voz (Agudo avanza / Grave retrocede).\nUna palma finaliza, dos regresan.",
];
// Estado del renderizado y capturas
let flagFeedback = 0;
let exportandoPNG = false;
let marcaInicioSilencio = 0;
let yaSeGuardoPorSilencio = false;
let flagGatillarCaptura = false;
// Controla si el contador/guardado por silencio está activo (solo tras presionar "Comenzar")
let contadorSilencioActivo = false;

// ==========================================================================
// 2. CICLO DE VIDA PRINCIPAL (P5.JS)
// ==========================================================================

function preload() {
  for (let i = 1; i <= 6; i++) {
    texturas.push(loadImage("img/textura" + i + ".png"));
  }
  sndOk = loadSound("sound/ok.wav");
  sndBack = loadSound("sound/back.wav");
  sndSave = loadSound("sound/save.wav");
}

function setup() {
  let canvas = createCanvas(600, 800);
  canvas.parent("canvas-holder");

  // Vinculación de nodos DOM HTML con referencias p5
  sPaleta = select("#htmlSliderPaleta");
  sFondo = select("#htmlSliderFondo");
  sCantidad = select("#htmlSliderCantidad");
  sEscala = select("#htmlSliderEscala");
  sSecundarias = select("#htmlSliderSecundarias");
  sTramasFondo = select("#htmlSliderTramasFondo");
  sSinusoide = select("#htmlSliderSinusoide");
  sOffset = select("#htmlSliderOffset");
  sSensibilidad = select("#htmlSliderSensibilidad");
  sUmbral = select("#htmlSliderUmbral");

  // Inicialización del entorno de entrada de audio y análisis de señal
  mic = new p5.AudioIn();
  gestorAmp = new GestorSenial(AMP_MIN, AMP_MAX);
  gestorAmp.f = 0.75;

  gestorFrec = new GestorSenial(NOTA_MIN, NOTA_MAX);
  gestorFrec.f = 0.4;
  gestorFrec.amplificadorDerivada = 25.0;

  // Configuración de disparadores de eventos del DOM
  btnToggleMic = document.getElementById("btnToggleMic");
  if (btnToggleMic) {
    btnToggleMic.onclick = toggleMicrofono;
  }
  let btnG = document.getElementById("btnGenerar");
  if (btnG) btnG.onclick = () => generarNuevaObra();

  let btnD = document.getElementById("btnDescargar");
  if (btnD) btnD.onclick = () => prepararCapturaLimpia();

  let btnComenzar = document.getElementById("btnComenzarPerfo");
  if (btnComenzar) {
    btnComenzar.onclick = () => {
      iniciarEntornoAudio();
      marcaInicioSilencio = millis();
      yaSeGuardoPorSilencio = false;
      contadorSilencioActivo = true;

      let screen = document.getElementById("welcome-screen");
      if (screen) screen.classList.add("hidden");
    };
  }

  generarNuevaObra();
  loop();
}

function draw() {
  // Configuración dinámica del fondo en base a la paleta interactiva
  let paletaIndex = valoresPerformaticos.paleta;
  let pCorte = constrain(floor(paletaIndex), 0, 3);

  if (obra && obra.paletas && obra.paletas[pCorte]) {
    let coloresPaleta = obra.paletas[pCorte];
    background(coloresPaleta.fondos[0]);
  } else {
    background(255);
  }

  // Protector de pantalla en espera del click de inicio
  if (!audioIniciado) {
    background(20);
    return;
  }

  // ------------------------------------------------------------------------
  // ANÁLISIS SÓNICO EN TIEMPO REAL
  // ------------------------------------------------------------------------
  if (micActivo) {
    amp = mic.getLevel() * micAttenuation; // Solo lee el hardware si el mic está activo
  } else {
    amp = 0; // Si está apagado, fuerza el cero absoluto en cada frame
  }

  gestorAmp.actualizar(amp); // El gestor ahora sí procesa el cero real

  intensidad = gestorAmp.filtrada;
  intensidadSuaveAudio = lerp(intensidadSuaveAudio, intensidad, 0.04);
  // VU Peak-hold: sube inmediatamente al pico, pero decae lentamente
  // Esto evita que el indicador baje bruscamente durante notas sostenidas
  if (intensidad > intensidadVu) {
    intensidadVu = intensidad;
  } else {
    // decay por frame (0.98 por ~16.7ms) -> ajustable
    let decay = Math.pow(0.94, deltaTime / 16.6667);
    intensidadVu = max(intensidad, intensidadVu * decay);
  }

  // Onset filter: require a rapid rise above the smoothed signal to count as a new sound
  let deltaOnset = intensidad - intensidadSuaveAudio;
  let isOver = intensidad > umbralRuido;

  if (isOver) {
    overThresholdDuration += deltaTime;
    underThresholdDuration = 0;
  } else {
    underThresholdDuration += deltaTime;
    overThresholdDuration = 0;
  }

  let newHaySonido = haySonido;
  if (!haySonido && overThresholdDuration >= detectionStableMs) {
    newHaySonido = true;
  } else if (haySonido && underThresholdDuration >= detectionStableMs) {
    newHaySonido = false;
  }

  empezoElSonido =
    !haySonido && newHaySonido && deltaOnset > onsetDeltaThreshold;
  terminoElSonido = haySonido && !newHaySonido;
  haySonido = newHaySonido;

  if (empezoElSonido) {
    marcaInicioSonido = millis();
    maxAmpDuringSound = intensidad;
    huboPitchDuranteSonido = hayPitch;
  }

  // Sincronización bidireccional física-virtual en momentos de silencio
  if (!haySonido) {
    if (sPaleta) valoresPerformaticos.paleta = float(sPaleta.value());
    if (sFondo) valoresPerformaticos.fondo = float(sFondo.value());
    if (sCantidad) valoresPerformaticos.cantidad = float(sCantidad.value());
    if (sEscala) valoresPerformaticos.escala = float(sEscala.value());
    if (sSecundarias)
      valoresPerformaticos.secundarias = float(sSecundarias.value());
    if (sSinusoide) valoresPerformaticos.sinusoide = float(sSinusoide.value());
    if (sTramasFondo) valoresPerformaticos.tramas = float(sTramasFondo.value());
    if (sOffset) valoresPerformaticos.offset = float(sOffset.value());
  }

  // Escalamiento reactivo de calibración según interfaz HTML
  if (sSensibilidad) {
    let valorSlider = float(sSensibilidad.value());
    AMP_MAX = map(valorSlider, 1, 20, 0.35, 0.03);
    gestorAmp.maximo = AMP_MAX;
  }
  if (sUmbral) {
    umbralRuido = float(sUmbral.value());
  }

  // Lógica de Modulación Activa o Autoguardado por Silencio Prolongado
  if (haySonido) {
    if (contadorSilencioActivo) {
      marcaInicioSilencio = millis();
      yaSeGuardoPorSilencio = false;
    }

    durSonido = millis() - marcaInicioSonido;
    maxAmpDuringSound = max(maxAmpDuringSound, intensidad);
    if (hayPitch) huboPitchDuranteSonido = true;

    if (durSonido >= umbralDuracionSonido) {
      let velocidadFija = 0.07;
      let empujeDireccional = velocidadFija * direccionSlider;

      modularConPitchYVolumen(empujeDireccional);
      inyectarValoresAHtml();
    }
  } else {
    let tiempoEnSilencio = millis() - marcaInicioSilencio;
    if (
      contadorSilencioActivo &&
      tiempoEnSilencio >= 10000 &&
      !yaSeGuardoPorSilencio &&
      !flagGatillarCaptura
    ) {
      prepararCapturaLimpia();
      yaSeGuardoPorSilencio = true;
    }
  }

  // ==========================================================================
  // REGISTRADOR DE IMPACTOS (PALMAS)
  // ==========================================================================
  if (terminoElSonido) {
    primeraNotaNuevaFrase = true;
    notaAnterior = null;
    direccionMelodica = 0;

    let duracionFinalTramo = millis() - marcaInicioSonido;
    let tiempoDesdeUltimoGolpe = millis() - marcaUltimaPalmaValida;

    if (
      duracionFinalTramo < umbralDuracionSonido &&
      tiempoDesdeUltimoGolpe > tiempoMinimoEntrePalmas
    ) {
      if (!esperandoSegundaPalma) {
        esperandoSegundaPalma = true;
        marcaPrimerPalma = millis();
        palmaPendiente = true;
      } else {
        retrocederPasoCircular();
        esperandoSegundaPalma = false;
        palmaPendiente = false;
      }

      marcaUltimaPalmaValida = millis();
    }
    durSonido = 0;
  }

  // ------------------------------------------------------------------------
  // RENDERIZADO GRÁFICO (REPRESENTACIÓN VISUAL)
  // ------------------------------------------------------------------------
  let fondoValor = valoresPerformaticos.fondo;
  let cantidadValor = valoresPerformaticos.cantidad;
  let sinusoideValor = valoresPerformaticos.sinusoide;
  let offsetValor = valoresPerformaticos.offset;

  cantidadSuave = lerp(cantidadSuave, cantidadValor, 0.65);
  secundariasSuave = lerp(
    secundariasSuave,
    valoresPerformaticos.secundarias,
    0.7,
  );
  fondoSuave = lerp(fondoSuave, fondoValor, 0.25);
  tramasSuave = lerp(tramasSuave, valoresPerformaticos.tramas, 0.5);

  if (obra) {
    push();
    beginClip();
    rect(0, 0, width / 2, height);
    endClip();
    translate(0, -offsetValor / 2);
    obra.dibujar(
      pCorte,
      fondoSuave,
      constrain(floor(cantidadValor), 0, 5),
      cantidadSuave,
      valoresPerformaticos.escala,
      secundariasSuave,
      tramasSuave,
      sinusoideValor,
    );
    pop();

    push();
    beginClip();
    rect(width / 2, 0, width / 2, height);
    endClip();
    translate(0, offsetValor / 2);
    obra.dibujar(
      pCorte,
      fondoSuave,
      constrain(floor(cantidadValor), 0, 5),
      cantidadSuave,
      valoresPerformaticos.escala,
      secundariasSuave,
      tramasSuave,
      sinusoideValor,
    );
    pop();

    if (pCorte !== ultimaPaletaDibujada) {
      actualizarPreviewPaletaDOM(obra.paletas[pCorte], pCorte, paletaIndex);
      ultimaPaletaDibujada = pCorte;
    }
  }

  if (
    texturaElegida &&
    (floor(fondoValor) > 0 ||
      floor(cantidadValor) > 0 ||
      valoresPerformaticos.tramas > 0)
  ) {
    blendMode(MULTIPLY);
    tint(255, 145);
    image(texturaElegida, 0, 0, width, height);
    tint(255, 255);
    blendMode(BLEND);
  }

  if (flagFeedback > 0) {
    push();
    fill(255, 255, 255, 140);
    noStroke();
    rect(0, 0, width, height);
    pop();
    flagFeedback--;
  }

  if (!exportandoPNG) {
    dibujarMonitorDatos();
  }

  if (flagGatillarCaptura) {
    if (sndSave && sndSave.isLoaded()) {
      sndSave.play();
    }
    let timestamp =
      year() +
      nf(month(), 2) +
      nf(day(), 2) +
      "-" +
      nf(hour(), 2) +
      nf(minute(), 2) +
      nf(second(), 2);
    saveCanvas("sonia-delaunay-generator-" + timestamp, "png");
    flagGatillarCaptura = false;
    exportandoPNG = false;
  }

  antesHabiaSonido = haySonido;

  if (esperandoSegundaPalma) {
    let tiempoTranscurrido = millis() - marcaPrimerPalma;

    if (tiempoTranscurrido > ventanaDoblePalma) {
      if (palmaPendiente) {
        avanzarPasoCircular();
      }
      esperandoSegundaPalma = false;
      palmaPendiente = false;
    }
  }
}

// ==========================================================================
// 3. SISTEMA DE ENTRADA DE USUARIO (TECLADO Y MOUSE)
// ==========================================================================

function keyPressed() {
  if (key === " ") avanzarPasoCircular();
  else if (key.toLowerCase() === "b") retrocederPasoCircular();
  else if (key.toLowerCase() === "r") generarNuevaObra();
}

function mousePressed() {
  if (!audioIniciado) {
    iniciarEntornoAudio();
  }
}

// ==========================================================================
// 4. LÓGICA DE CONTROL PERFORMÁTICO Y CONTEXTO VIRTUAL
// ==========================================================================

function modularConPitchYVolumen(factorCambio) {
  switch (pasoActual) {
    case 1:
      valoresPerformaticos.cantidad = constrain(
        valoresPerformaticos.cantidad + factorCambio * 0.25,
        0,
        5,
      );
      break;
    case 2:
      valoresPerformaticos.escala = constrain(
        valoresPerformaticos.escala + factorCambio * 14,
        100,
        400,
      );
      break;
    case 3:
      valoresPerformaticos.secundarias = constrain(
        valoresPerformaticos.secundarias + factorCambio * 0.4,
        0,
        6,
      );
      break;
    case 4:
      valoresPerformaticos.paleta = constrain(
        valoresPerformaticos.paleta + factorCambio * 0.2,
        0,
        3,
      );
      break;
    case 5:
      valoresPerformaticos.fondo = constrain(
        valoresPerformaticos.fondo + factorCambio * 0.2,
        0,
        5,
      );
      break;
    case 6:
      valoresPerformaticos.sinusoide = constrain(
        valoresPerformaticos.sinusoide + factorCambio * 2.5,
        0,
        100,
      );
      break;
    case 7:
      valoresPerformaticos.tramas = constrain(
        valoresPerformaticos.tramas + factorCambio * 1,
        0,
        35,
      );
      break;
    case 8:
      valoresPerformaticos.offset = constrain(
        valoresPerformaticos.offset + factorCambio * 1.8,
        0,
        150,
      );
      break;
  }
}

function inyectarValoresAHtml() {
  if (sCantidad && pasoActual === 1)
    sCantidad.value(valoresPerformaticos.cantidad);
  if (sEscala && pasoActual === 2) sEscala.value(valoresPerformaticos.escala);
  if (sSecundarias && pasoActual === 3)
    sSecundarias.value(valoresPerformaticos.secundarias);
  if (sPaleta && pasoActual === 4) sPaleta.value(valoresPerformaticos.paleta);
  if (sFondo && pasoActual === 5) sFondo.value(valoresPerformaticos.fondo);
  if (sSinusoide && pasoActual === 6)
    sSinusoide.value(valoresPerformaticos.sinusoide);
  if (sTramasFondo && pasoActual === 7)
    sTramasFondo.value(valoresPerformaticos.tramas);
  if (sOffset && pasoActual === 8) sOffset.value(valoresPerformaticos.offset);
}

function avanzarPasoCircular() {
  pasoActual = (pasoActual % TOTAL_PASOS) + 1;
  if (sndOk && sndOk.isLoaded()) sndOk.play();
  resetContextoVoz();
  actualizarCartelInterfaz();
  flagFeedback = 5;
}

function retrocederPasoCircular() {
  pasoActual = pasoActual - 1 < 1 ? TOTAL_PASOS : pasoActual - 1;
  if (sndBack && sndBack.isLoaded()) sndBack.play();
  resetContextoVoz();
  actualizarCartelInterfaz();
  flagFeedback = 5;
}

function actualizarCartelInterfaz() {
  let cartel = select("#estado-perfo");
  if (cartel) cartel.html("Estado Actual: " + nombresEstados[pasoActual - 1]);

  let parrafoInstruccion = select("#htmlTextoInstruccion");
  if (parrafoInstruccion)
    parrafoInstruccion.html(textosInstrucciones[pasoActual - 1]);
}

function generarNuevaObra() {
  resetContextoVoz();
  valoresPerformaticos = {
    paleta: 0,
    fondo: 0,
    cantidad: 0,
    escala: 0,
    secundarias: 0,
    sinusoide: 0,
    tramas: 0,
    offset: 0,
  };
  pasoActual = 1;

  cantidadSuave = 0;
  secundariasSuave = 0;
  fondoSuave = 0;
  tramasSuave = 0;
  intensidadSuaveAudio = 0;

  let inputs = [
    sCantidad,
    sEscala,
    sSecundarias,
    sPaleta,
    sFondo,
    sSinusoide,
    sTramasFondo,
    sOffset,
  ];
  inputs.forEach((input) => {
    if (input) input.value(0);
  });

  actualizarCartelInterfaz();

  if (texturas.length > 0) {
    let indiceAzar = floor(random(0, texturas.length));
    texturaElegida = texturas[indiceAzar];
  }
  obra = new FamiliaAzar();
  ultimaPaletaDibujada = -1; // 🔥 Reseteamos la memoria de la paleta para obligar al DOM a dibujarla de entrada
}

function prepararCapturaLimpia() {
  exportandoPNG = true;
  flagGatillarCaptura = true;
  resetContextoVoz();
}

// ==========================================================================
// 5. SUBSISTEMA DE AUDIO INTEGRADO Y DETECCIÓN DE PITCH (CREPE)
// ==========================================================================

async function iniciarEntornoAudio() {
  if (audioIniciado) return;
  try {
    await userStartAudio();
    mic.start(() => {
      audioIniciado = true;
      marcaUltimoPitch = millis();
      startPitchDetection();
    });
  } catch (error) {}
}

function startPitchDetection() {
  pitch = ml5.pitchDetection(
    model_url,
    getAudioContext(),
    mic.stream,
    modelLoaded,
  );
}

function modelLoaded() {
  hayPitch = false;
  getPitchTrack();
}

function getPitchTrack() {
  if (
    !audioIniciado ||
    !pitch ||
    !pitchActivo ||
    !micActivo ||
    millis() < bloqueoPitch
  ) {
    setTimeout(getPitchTrack, 40);
    return;
  }

  pitch.getPitch(function (err, frequency) {
    if (err) {
      console.error(err);
      setTimeout(getPitchTrack, 100);
      return;
    }

    if (frequency && frequency > 0) {
      frec = frequency;
      notaMidi = freqToMidi(frequency);

      if (notaMidi >= NOTA_MIN && notaMidi <= NOTA_MAX) {
        hayPitch = true;
        marcaUltimoPitch = millis();
        gestorFrec.actualizar(notaMidi);

        if (notaAnterior === null) {
          if (primeraNotaNuevaFrase && ultimaNotaFrase !== null) {
            let diferenciaInicio = notaMidi - ultimaNotaFrase;
            if (abs(diferenciaInicio) > UMBRAL_CAMBIO) {
              direccionSlider = diferenciaInicio > 0 ? 1 : -1;
              direccionMelodica = direccionSlider;
            }
          }
          primeraNotaNuevaFrase = false;
          notaAnterior = notaMidi;
        } else {
          let diferencia = notaMidi - notaAnterior;
          // diferenciaPitch removed from per-frame monitor; keep internal logic only

          if (abs(diferencia) > UMBRAL_CAMBIO) {
            let nuevaDireccion = diferencia > 0 ? 1 : -1;
            if (nuevaDireccion !== direccionMelodica) {
              direccionMelodica = nuevaDireccion;
              direccionSlider = nuevaDireccion;
            }
          }
          notaAnterior = notaMidi;
        }
        ultimaNotaFrase = notaMidi;
      }
    } else {
      if (millis() - marcaUltimoPitch > timeoutSinPitch) {
        hayPitch = false;
        frec = 0;
      }
    }
    // adapt polling: if we have a valid pitch, poll faster; otherwise back off
    pitchPollMs = frequency && frequency > 0 ? 20 : 60;
    setTimeout(getPitchTrack, pitchPollMs);
  });
}

function resetContextoVoz() {
  pitchActivo = false;
  setTimeout(() => {
    pitchActivo = true;
  }, 300);

  notaAnterior = null;
  ultimaNotaFrase = null;
  primeraNotaNuevaFrase = true;
  direccionMelodica = 0;
  direccionSlider = 1;
  diferenciaPitch = 0;
  bloqueoPitch = millis() + 300;
}

// ==========================================================================
// 6. MONITORES Y RENDERIZADO DE INTERFAZ DE USUARIO (UI)
// ==========================================================================

function actualizarPreviewPaletaDOM(palElegida, pCorte, paletaIndex) {
  let bloquePreview = select("#palette-preview-block");
  let contenedorBarra = select("#palette-bar-container");

  if (bloquePreview && contenedorBarra) {
    if (floor(paletaIndex) >= 0 && palElegida) {
      bloquePreview.style("display", "block");
      contenedorBarra.html("");
      let todosLosColores = palElegida.fondos.concat(palElegida.acentos);
      todosLosColores.forEach((col) => {
        let muestra = createDiv("");
        muestra.addClass("color-swatch");
        muestra.style("background-color", col);
        muestra.parent(contenedorBarra);
      });
    } else {
      bloquePreview.style("display", "none");
    }
  }
}

function dibujarMonitorDatos() {
  push();
  fill(15, 15, 15, 235);
  stroke(45);
  strokeWeight(1);
  rect(15, 15, 210, 65, 5);
  noStroke();
  fill(200);
  textSize(9);
  textAlign(LEFT, TOP);
  // Actualiza cachés de texto a baja frecuencia para evitar reconstrucción por frame
  if (millis() - ultimaActualizacionMonitor >= monitorIntervalMs) {
    monitor_cached_intensidad =
      "INTENSIDAD: " +
      intensidad.toFixed(3) +
      " (UMB: " +
      umbralRuido.toFixed(2) +
      ")";

    let esVozLarga = durSonido >= umbralDuracionSonido;
    let msgModo = ""; // no icono de silencio
    if (haySonido) {
      let txtDir = direccionSlider === 1 ? " 🔼 (AVANZA)" : " 🔽 (RETROCEDE)";
      // Mostrar 'PINCEL' para sonidos cortos o gestos largos con dirección
      msgModo = esVozLarga ? "PINCEL" + txtDir : "PINCEL";
    } else {
      let sRestantes = max(0, 10 - (millis() - marcaInicioSilencio) / 1000);
      if (!yaSeGuardoPorSilencio)
        msgModo = "⏱️ GUARDAR OBRA EN: " + sRestantes.toFixed(1) + "s";
      else msgModo = "💾 CAPTURA OK";
    }

    monitor_cached_msgModo = "MODO: " + msgModo;
    ultimaActualizacionMonitor = millis();
  }

  // Dibuja textos usando cachés (cálculos ligeros por frame)
  text(monitor_cached_intensidad, 25, 23);
  // coloreamos según voz larga, pero no recalculamos el string cada frame
  let esVozLarga_now = durSonido >= umbralDuracionSonido;
  fill(esVozLarga_now ? "#c4a85a" : "#fe3f2c");
  textStyle(BOLD);
  text(monitor_cached_msgModo, 25, 56);

  // VU meter: dibujarlo justo debajo de la línea de intensidad para aprovechar el espacio
  let vuX = 25;
  let vuY = 40; // debajo de la intensidad (separación aumentada)
  let vuW = 150; // ancho del vumetro
  fill(50);
  noStroke();
  rect(vuX, vuY, vuW, 6, 3);
  fill(0, 255, 0);
  let vuFill = map(intensidadVu, 0, 0.4, 0, vuW, true);
  rect(vuX, vuY, vuFill, 6, 3);

  // línea roja de umbral
  stroke(255, 0, 0);
  let posLineaRoja = map(umbralRuido, 0, 0.4, 0, vuW, true);
  line(vuX + posLineaRoja, vuY - 2, vuX + posLineaRoja, vuY + 8);

  pop();
}

//Mutea/Desmutea el análisis de audio de la performance
function toggleMicrofono() {
  if (!audioIniciado) return;

  micActivo = !micActivo;

  if (micActivo) {
    btnToggleMic.innerHTML = "🎙️ MIC: ENCENDIDO";
    btnToggleMic.className = "mic-active";
  } else {
    btnToggleMic.innerHTML = "🔇 MIC: MUTEADO";
    btnToggleMic.className = "mic-muted";

    haySonido = false;
    amp = 0;
    intensidad = 0;
  }
}
