#!/usr/bin/env node

/**
 * extract-translations.js  — JSXText-aware version
 *
 * Usage:
 *   node extract-translations.js [options]
 *
 * Options:
 *   --input  <file>     Path to saved ESLint JSON file (recommended)
 *   --dir    <path>     Root dir to lint when no --input given (default: "src")
 *   --rule   <n>        ESLint rule to filter (default: auto-detect)
 *   --prefix <prefix>   Key prefix override (default: derived from file path)
 *   --output <file>     JSON mapping output (default: "translations-extracted.json")
 *   --dry-run           Print what would change, don't write files
 *
 * Recommended workflow:
 *   npx eslint src --format json 2>/dev/null > lint.json
 *   node extract-translations.js --input lint.json --prefix app --dry-run
 *   node extract-translations.js --input lint.json --prefix app
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Colors ──────────────────────────────────────────────────────────────────
const c = {
  red: s => `\x1b[31m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  green: s => `\x1b[32m${s}\x1b[0m`,
  cyan: s => `\x1b[36m${s}\x1b[0m`,
  bold: s => `\x1b[1m${s}\x1b[0m`,
  dim: s => `\x1b[2m${s}\x1b[0m`,
};

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : fallback;
};

const INPUT_FILE = getArg('--input', null);
const TARGET_DIR = getArg('--dir', 'src');
const RULE_FILTER = getArg('--rule', null);
const KEY_PREFIX = getArg('--prefix', '');
const OUTPUT_FILE = getArg('--output', 'translations-extracted.json');
const DRY_RUN = args.includes('--dry-run');

// ─── Key overrides ───────────────────────────────────────────────────────────
//
// When the auto-generated key is too long or not descriptive enough, add an
// entry here. You can match by either:
//
//   • The original text (exactly as it appears in JSX):
//       'Necesitamos acceso a tu cámara para escanear códigos de barras' : 'nutrition.cameraPermission'
//
//   • The auto-generated key (useful if the same text appears in multiple files
//     and you only want to rename one namespace):
//       'nutrition.necesitamosAccesoATuCamaraParaEscanearCodigosDe' : 'nutrition.cameraPermission'
//
// The value must be a full namespaced key, e.g. 'auth.signInTitle'.
// Overrides are applied before deduplication, so the short key will be reused
// across files if the same text appears more than once.

const KEY_OVERRIDES = {
  // 'Original text or auto-generated key': 'namespace.shortKey',
  // Examples:
  // 'Necesitamos acceso a tu cámara para escanear códigos de barras': 'nutrition.cameraPermission',
  // 'nutrition.necesitamosAccesoATuCamaraParaEscanear': 'nutrition.cameraPermission',
  // --- NUTRITION ---
  'nutrition.filtros': 'nutrition.filters',

  // --- HEALTH ---
  'health.sm2890255Peso0175Cadera0038Edad0118Altura': 'health.formulaBodyComposition',

  // --- AUTH ---
  'auth.alRegistrarteAceptasNuestros': 'auth.termsAcceptanceLabel',
  'auth.digitosA': 'auth.digitsPlaceholder',
  'auth.hemosEnviadoUnCodigoDe': 'auth.verificationSentMessage',

  // --- HOME ---
  'home.registrado': 'home.logged',

  // --- ONBOARDING ---
  'onboarding.yLa': 'onboarding.andThe',
  'onboarding.aceptoLos': 'onboarding.iAccept',

  // --- SETTINGS ---
  'settings.cambiarContrasenaEstaraDisponiblePronto': 'settings.changePasswordComingSoon',
  'settings.black': 'settings.themeBlack',
  'settings.porRitmoMinKm': 'settings.paceUnitRunning',
  'settings.porVelocidadKmH': 'settings.speedUnitKmH',
  'settings.tiempoObjetivo': 'settings.targetTime',
  'settings.velocidadMedia': 'settings.averageSpeed',
  'settings.confirmacionFinal': 'settings.finalConfirmation',
  'settings.noHayVueltaAtrasRealmenteQuieresBorrarTodo': 'settings.irreversibleActionWarning',
  'settings.ultimaAdvertencia': 'settings.lastWarning',
  'settings.tuCuentaDejaraDeExistirInmediatamenteDespuesDeConf': 'settings.accountDeletionImmediateEffect',
  'settings.female': 'settings.genderFemale',
  'settings.hombre': 'settings.genderMale',
  'settings.mujer': 'settings.genderFemaleAlt',
  'settings.otro': 'settings.genderOther',
  'settings.preferNotToSay_2': 'settings.genderPrivate',

  // --- TRAINING ---
  'training.editarSesion': 'training.editSession',
  'training.editarPlantilla': 'training.editTemplate',
  'training.laEjecucionDeEsteEjercicioEsMedianteTiempoMantenLa': 'training.timeBasedExecutionDesc',
  'training.grupoMuscular': 'training.muscleGroup',
  'training.esEs': 'training.langEsRegion',
  'nutrition.buscarIngredienteEjPolloArroz': 'nutrition.searchPlaceholder',
  'nutrition.ml': 'nutrition.unitMl',
  'nutrition.g': 'nutrition.unitG',
  'nutrition.todas': 'nutrition.all',
  'nutrition.fats': 'nutrition.fats',
  'nutrition.carboh': 'nutrition.carbs',
  'nutrition.proteinCaps': 'nutrition.protein',
  'nutrition.kcal': 'nutrition.calories',
  'nutrition.noDisponible': 'nutrition.unavailable',
  'nutrition.ingredientSingular': 'nutrition.ingredient',
  'nutrition.precocinado': 'nutrition.preCooked',
  'nutrition.receta': 'nutrition.recipe',
  'nutrition.buscarAlimento': 'nutrition.searchFood',
  'nutrition.anadirSnack': 'nutrition.addSnack',
  'nutrition.anadirComida': 'nutrition.addMeal',
  'nutrition.kj': 'nutrition.unitKj',
  'nutrition.cantidadEnGramos': 'nutrition.weightGrams',
  'nutrition.nombreDelIngrediente': 'nutrition.ingredientName',
  'nutrition.nombreDeLaComida': 'nutrition.mealName',
  'nutrition.comida': 'nutrition.meal',
  'nutrition.edit': 'nutrition.edit',
  'nutrition.registrar': 'nutrition.log',
  'nutrition.muestraSoloElNombreYCaloriasTotales': 'nutrition.summaryHint',
  'nutrition.comidasResumidas': 'nutrition.summaryView',
  'nutrition.muestraLosIngredientesDesglosadosDeCadaComida': 'nutrition.detailedHint',
  'nutrition.comidasDetalladas': 'nutrition.detailedView',
  'nutrition.muestraLosSnacksDeFormaMasDiscreta': 'nutrition.minimizeSnacksHint',
  'nutrition.minimizarSnacks': 'nutrition.minimizeSnacks',
  'nutrition.activarSnacks': 'nutrition.enableSnacks',

  // --- ALZAN ---
  'alzan.actividad': 'alzan.activity',
  'alzan.tuPulse': 'alzan.pulse',
  'alzan.bici': 'alzan.bike',
  'alzan.gym': 'alzan.gym',
  'alzan.running': 'alzan.run',
  'alzan.todos': 'alzan.all',

  // --- STATS ---
  'stats.none': 'stats.empty',

  // --- CONSTANTS ---
  'constants.padel': 'constants.padel',
  'constants.other': 'constants.other',
  'constants.tennis': 'constants.tennis',
  'constants.basketball': 'constants.basketball',
  'constants.football': 'constants.football',
  'constants.hiking': 'constants.hiking',
  'constants.swimming': 'constants.swimming',
  'constants.cycling': 'constants.cycling',
  'constants.running': 'constants.running',

  // --- HEALTH ---
  'health.muscleMass': 'health.muscleMass',
  'health.bodyFat': 'health.bodyFat',
  'health.sm3950665Peso0185Abdomen0418Cadera008Edad': 'health.bodyFormula',
  'health.estimacion': 'health.estimation',
  'health.desconocido': 'health.unknown',
  'health.sinDatos': 'health.noData',
  'health.unitKg': 'health.unitKg',
  'health.': 'health.emptyValue',
  'health.guardando': 'health.saving',
  'health.guardarRegistro': 'health.saveLog',
  'health.meDesperte': 'health.wakeUp',
  'health.meDormi': 'health.fellAsleep',
  'health.ultimas12Semanas': 'health.last12Weeks',

  // --- NAVIGATION ---
  'navigation.verificarEmail': 'navigation.verifyEmail',
  'navigation.registrarse': 'navigation.signUp',
  'navigation.eliminarCuenta': 'navigation.deleteAccount',
  'navigation.exportarDatos': 'navigation.exportData',
  'navigation.ajustesDeNutricion': 'navigation.nutritionSettings',
  'navigation.ajustesDeEntreno': 'navigation.workoutSettings',
  'navigation.legal': 'navigation.legal',
  'navigation.soporte': 'navigation.support',
  'navigation.apariencia': 'navigation.appearance',
  'navigation.privacidadYDatos': 'navigation.privacyData',
  'navigation.integraciones': 'navigation.integrations',
  'navigation.notificaciones': 'navigation.notifications',
  'navigation.objetivos': 'navigation.goals',
  'navigation.perfil': 'navigation.profile',
  'navigation.ajustes': 'navigation.settings',

  // --- AUTH ---
  'auth.error': 'auth.error',
  'auth.errorDesconocido': 'auth.unknownError',
  'auth.continuarConApple': 'auth.appleSignIn',
  'auth.continuarConGoogle': 'auth.googleSignIn',
  'auth.contrasena': 'auth.password',
  'auth.usuarioOCorreoElectronico': 'auth.userOrEmail',
  'auth.enviarEnlace': 'auth.sendLink',
  'auth.holaEjemploCom': 'auth.emailPlaceholder',
  'auth.guardarContrasena': 'auth.savePassword',
  'auth.indicaTuNuevaContrasena': 'auth.setNewPassword',
  'auth.siguiente': 'auth.next',
  'auth.correoElectronico': 'auth.email',
  'auth.privacyPolicy': 'auth.privacyPolicy',
  'auth.terminosDelServicio': 'auth.terms',
  'auth.registrarte': 'auth.register',
  'auth.unSimbolo': 'auth.reqSymbol',
  'auth.unNumero09': 'auth.reqNumber',
  'auth.unaMayusculaAZ': 'auth.reqUpper',
  'auth.minimo8Caracteres': 'auth.reqMinLength',
  'auth.noRecibisteElCodigoReenviar': 'auth.resendCode',
  'auth.verificar': 'auth.verify',
  'auth.codigoDeVerificacion': 'auth.verificationCode',

  // --- HOME ---
  'home.buenTrabajoHoy': 'home.goodJob',
  'home.noHayNadaPendiente': 'home.nothingPending',
  'home.entrenamientoProgramado': 'home.scheduledWorkout',

  // --- ONBOARDING ---
  'onboarding.continuar': 'onboarding.continue',
  'onboarding.irAInicio': 'onboarding.goHome',
  'onboarding.crearCuenta': 'onboarding.createAccount',
  'onboarding.autorizoElTratamientoDeMisDatosDeSaludParaProporci': 'onboarding.healthConsent',
  'onboarding.masTarde': 'onboarding.later',
  'onboarding.ejAlzanHealth': 'onboarding.userPlaceholder',
  'onboarding.ejAlzanHealth_2': 'onboarding.namePlaceholder',
  'onboarding.ej70': 'onboarding.weightPlaceholder',
  'onboarding.ej175': 'onboarding.heightPlaceholder',
  'onboarding.es': 'onboarding.langEs',
  'onboarding.seleccionaTuFechaDeNacimiento': 'onboarding.selectBirthdate',
  'onboarding.mi': 'onboarding.unitMi',
  'onboarding.km': 'onboarding.unitKm',
  'onboarding.lb': 'onboarding.unitLb',

  // --- SETTINGS ---
  'settings.comingSoonCaps': 'settings.comingSoon',
  'settings.desconectar': 'settings.disconnect',
  'settings.conectar': 'settings.connect',
  'settings.conectado': 'settings.connected',
  'settings.noConectado': 'settings.disconnected',
  'settings.eliminar': 'settings.delete',
  'settings.ejCorrer10kEnMenosDe50Mins': 'settings.goalPlaceholder',
  'settings.licenciasDeCodigoAbierto': 'settings.openSource',
  'settings.licencias': 'settings.licenses',
  'settings.politicaDePrivacidad': 'settings.privacyPolicy',
  'settings.terminosDelServicio': 'settings.terms',
  'settings.legalDocs': 'settings.legal',
  'settings.sugerenciasBasadasEnTuActividad': 'settings.activitySuggestions',
  'settings.recordatoriosInteligentes': 'settings.smartReminders',
  'settings.actualizacionesYNuevasFunciones': 'settings.appUpdates',
  'settings.novedades': 'settings.whatsNew',
  'settings.notificacionesGenerales': 'settings.generalNotifications',
  'settings.aplicacion': 'settings.app',
  'settings.recordatorioParaRegistrarSueno': 'settings.sleepReminder',
  'settings.sueno': 'settings.sleep',
  'settings.eligeLosDiasParaElRecordatorio': 'settings.reminderDays',
  'settings.recordatorioDePeso': 'settings.weightReminder',
  'settings.salud': 'settings.health',
  'settings.recordarSiNoEntrenasEnVariosDias': 'settings.inactivityReminder',
  'settings.avisoDeInactividad': 'settings.inactivityAlert',
  'settings.teNotificaraSiHoyTienesEntrenosDisponibles': 'settings.workoutAlertHint',
  'settings.recordatorioDeEntrenamiento': 'settings.workoutReminder',
  'settings.entrenamiento': 'settings.workout',
  'settings.cena': 'settings.dinner',
  'settings.merienda': 'settings.snack',
  'settings.almuerzo': 'settings.lunch',
  'settings.desayuno': 'settings.breakfast',
  'settings.comidas': 'settings.meals',
  'settings.objetivosNutricionales': 'settings.nutritionGoals',
  'settings.natacion': 'settings.swimming',
  'settings.ciclismo': 'settings.cycling',
  'settings.objetivosDeportivos': 'settings.sportGoals',
  'settings.objetivoPrincipal': 'settings.mainGoal',
  'settings.kmH': 'settings.unitKmH',
  'settings.100m': 'settings.unit100m',
  'settings.km': 'settings.unitKm',
  'settings.ritmoObjetivo': 'settings.targetPace',
  'settings.porRitmoMin100m': 'settings.paceSwimming',
  'settings.english': 'settings.langEn',
  'settings.espanol': 'settings.langEs',
  'settings.eliminarDefinitivamente': 'settings.permanentlyDelete',
  'settings.cancelar': 'settings.cancel',
  'settings.estasAPuntoDeEliminarTuCuentaPermanentementePerder': 'settings.deleteAccountWarning',
  'settings.deleteAccount': 'settings.deleteAccount',
  'settings.borrarAhora': 'settings.deleteNow',
  'settings.borrarDatos': 'settings.clearData',
  'settings.estaAccionEliminaraPermanentementeTodoTuHistorialD': 'settings.clearDataWarning',
  'settings.estasSeguro': 'settings.areYouSure',
  'settings.borrarTodosLosDatos': 'settings.deleteAllData',
  'settings.dangerZone': 'settings.dangerZone',
  'settings.borrarCacheLocal': 'settings.clearCache',
  'settings.exportarMisDatos': 'settings.exportData',
  'settings.dataManagement': 'settings.dataManagement',
  'settings.privacidadSocial': 'settings.socialPrivacy',
  'settings.consentimiento': 'settings.consent',
  'settings.consentimientoDeSalud': 'settings.healthConsent',
  'settings.terminosYCondiciones': 'settings.termsConditions',
  'settings.prefieroNoDecir': 'settings.preferNotToSay',
  'settings.male': 'settings.male',
  'settings.tuNombre': 'settings.yourName',
  'settings.competitivoDoblesSesiones7SesionesSemana': 'settings.athleteDesc',
  'settings.atletaAltoRendimiento': 'settings.proAthlete',
  'settings.athlete': 'settings.athlete',
  'settings.parteFundamentalDeMiRutina46DiasSemana': 'settings.frequentDesc',
  'settings.frecuente': 'settings.frequent',
  'settings.frequent': 'settings.frequentTag',
  'settings.algunasVecesPorSemana13DiasSemana': 'settings.occasionalDesc',
  'settings.ocasional': 'settings.occasional',
  'settings.occasional': 'settings.occasionalTag',
  'settings.noEntrenoOMuyEsporadico0DiasSemana': 'settings.sedentaryDesc',
  'settings.pocoONada': 'settings.noneOrLittle',
  'settings.tusEntrenamientos': 'settings.yourWorkouts',
  'settings.movimientoConstanteCargarPesoConstruccionLogistica': 'settings.physicalJobDesc',
  'settings.fisicoExigente': 'settings.physicalExigent',
  'settings.physical': 'settings.physicalTag',
  'settings.granParteDelDiaDePieOCaminandoProfesoresSanidad': 'settings.activeJobDesc',
  'settings.dePieActivo': 'settings.activeStanding',
  'settings.active': 'settings.activeTag',
  'settings.pasoLaMayorParteDelTiempoSentadoOficinaEstudiarCon': 'settings.sedentaryJobDesc',
  'settings.sedentario': 'settings.sedentary',
  'settings.sedentary': 'settings.sedentaryTag',
  'settings.tuDiaADia': 'settings.dailyLife',
  'settings.idiomaDeLaAplicacion': 'settings.appLanguage',
  'settings.idiomaLanguage': 'settings.language',
  'settings.distancia': 'settings.distance',
  'settings.peso': 'settings.weight',
  'settings.unidadesYMetricas': 'settings.unitsMetrics',
  'settings.usuario': 'settings.usernamePlaceholder',
  'settings.repiteLaContrasena': 'settings.repeatPassword',
  'settings.nutricion': 'settings.nutrition',
  'settings.notificacionesYRecordatorios': 'settings.notificationsReminders',
  'settings.ayudaADiagnosticarProblemas': 'settings.diagnosticSubtitle',
  'settings.enviarRegistrosAlDesarrollador': 'settings.sendLogs',
  'settings.diagnostico': 'settings.diagnostics',
  'settings.ayudanosAMejorar': 'settings.improveApp',
  'settings.informarDeUnError': 'settings.reportBug',
  'settings.sugierenosNuevasFuncionalidades': 'settings.suggestFeatures',
  'settings.solicitarUnaFuncion': 'settings.requestFeature',
  'settings.feedback': 'settings.feedback',
  'settings.respuestasADudasComunes': 'settings.faqSubtitle',
  'settings.preguntasFrecuentes': 'settings.faq',
  'settings.aprendeAUsarLaAplicacion': 'settings.guideSubtitle',
  'settings.guiaDeInicio': 'settings.onboardingGuide',
  'settings.ayuda': 'settings.help',

  // --- TRAINING ---
  'training.ejercicio': 'training.exercise',
  'training.time': 'training.time',
  'training.repsColon': 'training.reps',
  'training.repeticion': 'training.repCaps',
  'training.ej5': 'training.repsPlaceholder',
  'training.finalizarEntrenamiento': 'training.finishWorkout',
  'training.registerActivity': 'training.logActivity',
  'training.omitir': 'training.skip',
  'training.entrenamientoDeFuerza': 'training.strengthWorkout',
  'training.ultimos3Meses': 'training.last3Months',
  'training.ultimoMes': 'training.lastMonth',
  'training.ultimaSemana': 'training.lastWeek',
  'training.todas': 'training.all',
  'training.ejSeries10x400': 'training.intervalsExample',
  'training.ciclismo': 'training.cycling',
  'training.natacion': 'training.swimming',
  'training.senderismo': 'training.hiking',
  'training.padel': 'training.padel',
  'training.tenis': 'training.tennis',
  'training.baloncesto': 'training.basketball',
  'training.futbol': 'training.football',
  'training.guardar': 'training.save',
  'training.guardarPlantilla': 'training.saveTemplate',
  'training.disenarSesion': 'training.designSession',
  'training.lapButton': 'training.lapButton',
  'training.repeticion_2': 'training.repetition',
  'training.laEjecucionDeEsteEjercicioEsMedianteRepeticionesRe': 'training.repsExecutionDesc',
  'training.nA': 'training.notAvailable',
  'training.bodyweight': 'training.bodyweight',
  'training.general': 'training.general',
  'training.todosMusculos': 'training.allMuscles',
  'training.todoEquipamiento': 'training.allEquipment',
  'training.strava': 'training.strava',
  'training.suunto': 'training.suunto',
  'training.listo': 'training.done',
  'training.opcional': 'training.optional',
  'training.ejPushA': 'training.routinePlaceholder',
  'training.editarRutina': 'training.editRoutine',
  'training.nuevaRutina': 'training.newRoutine',
  'training.sinDescripcion': 'training.noDescription',
  'training.seleccionarRutina': 'training.selectRoutine',
  'training.rutinas': 'training.routines',
  'training.cerrar': 'training.close',
  'training.sinObjetivo': 'training.noGoal',
  'training.seleccionarPlantilla': 'training.selectTemplate',
  'training.misPlantillas': 'training.myTemplates',
  'training.atras': 'training.back',
  'training.iniciando': 'training.starting',
  'training.start': 'training.start',
  'training.anadirMas': 'training.addMore',
  'training.asignarRutina': 'training.assignRoutine',
  'training.vibraAlIniciarYFinalizarElDescanso': 'training.restVibrateDesc',
  'training.vibracion': 'training.vibration',
  'training.reproduceUnBeepAlIniciarYFinalizarActivaElVolumenD': 'training.soundAlertDesc',
  'training.sonido': 'training.sound',
  'training.iniciaElDescansoAlCompletarUnaSerie': 'training.autoRestDesc',
  'training.temporizadorAutomatico': 'training.autoTimer',
  'training.metros': 'training.unitMetres',
  'training.editarPaso': 'training.editStep',
  'training.nuevoPaso': 'training.newStep',
  'training.seleccionarNumero': 'training.selectNumber',
  'training.repeticiones': 'training.repetitions',

  // --- COMMON ---
  'common.saltar': 'common.skip',
  'common.10s': 'common.add10s',
  'common.ejecucion': 'common.execution',
  'common.30s': 'common.add30s',
  'common.descanso': 'common.rest',
  'common.entendido': 'common.gotIt',
  'common.paraAnadirOtroPesoHoyEliminaElAnteriorDesdeElHisto': 'common.overwriteWeightWarning',
  'common.yaExisteUnRegistro': 'common.recordExists',
  'common.guardarPeso': 'common.saveWeight',
  'common.nuevoPeso': 'common.newWeightTitle',

  // --- NUTRITION ---
  'nutrition.pruebaConTerminosGenericos': 'nutrition.tryGenericTerms',
  'nutrition.noEncontrado': 'nutrition.notFound',
  'nutrition.kcal100g': 'nutrition.kcalPer100g',
  'nutrition.anadir': 'nutrition.add',
  'nutrition.atras': 'nutrition.back',
  'nutrition.kcal': 'nutrition.kcal',
  'nutrition.cuanto': 'nutrition.howMuchQuestion',
  'nutrition.objetivo': 'nutrition.goal',
  'nutrition.apuntaAlCodigoDeBarrasDelProducto': 'nutrition.scanBarcodeInstruction',
  'nutrition.permitirCamara': 'nutrition.allowCamera',
  'nutrition.necesitamosAccesoATuCamaraParaEscanearCodigosDeBar': 'nutrition.cameraPermissionRequest',
  'nutrition.permisoDeCamara': 'nutrition.cameraPermissionTitle',
  'nutrition.anadirALaComida': 'nutrition.addToMeal',
  'nutrition.actualizado': 'nutrition.updatedLabel',
  'nutrition.origen': 'nutrition.source',
  'nutrition.notas': 'nutrition.notes',
  'nutrition.sal': 'nutrition.salt',
  'nutrition.mg': 'nutrition.mg',
  'nutrition.sodio': 'nutrition.sodium',
  'nutrition.azucares': 'nutrition.sugars',
  'nutrition.fibra': 'nutrition.fiber',
  'nutrition.grasas': 'nutrition.fats',
  'nutrition.carbohidratos': 'nutrition.carbs',
  'nutrition.proteinas': 'nutrition.proteins',
  'nutrition.energia': 'nutrition.energy',
  'nutrition.informacionNutricionalPor100g': 'nutrition.nutritionInfo100g',
  'nutrition.puntuacionDeCalidad': 'nutrition.qualityScore',
  'nutrition.kcalP': 'nutrition.kcalProtein',
  'nutrition.gC': 'nutrition.gramsCarbs',
  'nutrition.gG': 'nutrition.gramsFat',
  'nutrition.noSeEncontraronResultados': 'nutrition.noResultsFound',
  'nutrition.letraInicial': 'nutrition.initialLetter',
  'nutrition.categoria': 'nutrition.category',
  'nutrition.limpiar': 'nutrition.clear',
  'nutrition.irAManualParaCrearlo': 'nutrition.goToManualCreate',
  'nutrition.pruebaConOtrosFiltrosOCrealoManualmente': 'nutrition.tryFiltersOrCreate',
  'nutrition.noSeEncontraronAlimentos': 'nutrition.noFoodsFound',
  'nutrition.escribeEnLaBarraDeBusquedaOUsaLosFiltros': 'nutrition.searchBarHint',
  'nutrition.buscaUnAlimento': 'nutrition.searchFood',
  'nutrition.algunosDatosPuedenEstarIncompletos': 'nutrition.incompleteDataWarning',
  'nutrition.proteina': 'nutrition.proteinCaps',
  'nutrition.comidaCon': 'nutrition.mealWith',
  'nutrition.ingrediente': 'nutrition.ingredientSingular',
  'nutrition.confirmarCambios': 'nutrition.confirmChanges',
  'nutrition.250ml': 'nutrition.approx250ml',
  'nutrition.ajustar': 'nutrition.adjust',
  'nutrition.ml': 'nutrition.ml',
  'nutrition.hidratacion': 'nutrition.hydration',
  'nutrition.paraConocerLosIngredientesConsultaLaWebOficialDelP': 'nutrition.checkOfficialSiteForIngredients',
  'nutrition.soloMacrosDisponibles': 'nutrition.onlyMacrosWarning',
  'nutrition.noSeEncontraronIngredientes': 'nutrition.noIngredientsFound',
  'nutrition.informacionNutricionalPor100g_2': 'nutrition.nutritionInfo100gTitle',
  'nutrition.puntuacionDeCalidad_2': 'nutrition.qualityScoreTitle',
  'nutrition.laPuntuacionNutriScoreMostradaEsUnValorCalculadoCo': 'nutrition.nutriScoreDisclaimer',
  'nutrition.anadirIngrediente': 'nutrition.addIngredient',
  'nutrition.carbos': 'nutrition.carbsShort',
  'nutrition.proteina_2': 'nutrition.proteinShort',
  'nutrition.informacionNutricionalPor100g_3': 'nutrition.nutritionInfo100gSubtitle',
  'nutrition.elValorMaximoAIntroducirEs1kg': 'nutrition.maxInputLimit1kg',
  'nutrition.abrirEscanerDeCodigoDeBarras': 'nutrition.openBarcodeScanner',
  'nutrition.manual': 'nutrition.manual',
  'nutrition.escanear': 'nutrition.scan',
  'nutrition.buscar': 'nutrition.search',
  'nutrition.editar': 'nutrition.edit',
  'nutrition.maximo1kg': 'nutrition.max1kgLabel',
  'nutrition.ingredientes': 'nutrition.ingredientsTitleParen',
  'nutrition.resultados': 'nutrition.resultsTitleParen',
  'nutrition.nutricion': 'nutrition.nutritionTitle',
  'nutrition.idealParaVariarLaDietaCiclosAB': 'nutrition.cyclicPlanDesc',
  'nutrition.semana1PlanASemana2PlanBSemana3PlanASemana4PlanB': 'nutrition.cyclicPlanLogic',
  'nutrition.resultadoVisual': 'nutrition.visualResultLabel',
  'nutrition.alActivarUsaSemanaAnteriorPlanAYActualPlanB': 'nutrition.cyclicPlanActivation',
  'nutrition.mantenDosPlanesDiferentesAYBQueSeAlternanCadaSeman': 'nutrition.cyclicPlanExplanation',
  'nutrition.copiaAlterna': 'nutrition.copyAlternate',
  'nutrition.idealParaRutinasQueSeMantienenIguales': 'nutrition.linearPlanDesc',
  'nutrition.funcionaEnCadenaSemana1Semana2Semana3Semana4': 'nutrition.linearPlanLogic',
  'nutrition.alActivarCopiaEstaSemanaALas4Siguientes': 'nutrition.linearPlanActivation',
  'nutrition.cadaNuevaSemanaRecibeAutomaticamenteLaDietaDeLaSem': 'nutrition.linearPlanExplanation',
  'nutrition.copiaSemanal': 'nutrition.copyWeekly',
  'nutrition.borrarDatosFuturos': 'nutrition.deleteFutureData',
  'nutrition.losDatosDeHoyYLosDiasAnterioresNoSeVeranAfectados': 'nutrition.pastDataSafeNote',
  'nutrition.estaAccionEliminaraTodasLasComidasYPlanificaciones': 'nutrition.deleteFutureDataWarning',
  'nutrition.borrarDatosFuturos_2': 'nutrition.deleteFutureDataConfirm',
  'nutrition.mantenerDietasFuturas': 'nutrition.keepFutureDiets',
  'nutrition.borrarDietasFuturas': 'nutrition.deleteFutureDiets',
  'nutrition.queDeseasHacerConLasDietasFuturasYaCreadas': 'nutrition.futureDietsActionQuery',
  'nutrition.tienesDietasCreadasParaLasProximasSemanasSiDesacti': 'nutrition.autoPlanDisableWarning',
  'nutrition.desactivarPlanificacionAutomatica': 'nutrition.disableAutoPlanConfirm',
  'nutrition.sobrescribir': 'nutrition.overwrite',
  'nutrition.deseasSobrescribirLosDatosFuturos': 'nutrition.overwriteFutureDataQuery',
  'nutrition.lasSemanasFuturasYaTienenComidasRegistradasSiActiv': 'nutrition.overwriteFutureDataWarning',
  'nutrition.datosExistentesDetectados': 'nutrition.existingDataDetected',
  'nutrition.eliminarTodo': 'nutrition.deleteAll',
  'nutrition.volver': 'nutrition.backButton',
  'nutrition.estaAccionEliminaraTodosTusRegistrosDeNutricionDeF': 'nutrition.deleteAllNutritionWarning',
  'nutrition.confirmarEliminacionTotal': 'nutrition.confirmTotalDeletion',
  'nutrition.eliminarRangoDeFechas': 'nutrition.deleteDateRange',
  'nutrition.eliminarUltimos7Dias': 'nutrition.deleteLast7Days',
  'nutrition.eliminarHoy': 'nutrition.deleteToday',
  'nutrition.seleccionaQueRegistrosEliminar': 'nutrition.selectRecordsToDelete',
  'nutrition.eliminarRegistros': 'nutrition.deleteRecords',
  'nutrition.eliminar': 'nutrition.delete',
  'nutrition.fechaFin': 'nutrition.endDate',
  'nutrition.fechaInicio': 'nutrition.startDate',
  'nutrition.seleccionaElRangoDeFechasAEliminar': 'nutrition.selectDateRangeDelete',
  'nutrition.eliminarRangoDeFechas_2': 'nutrition.deleteDateRangeTitle',
  'nutrition.listo': 'nutrition.done',
  'nutrition.exportar': 'nutrition.export',
  'nutrition.exportarHistorial': 'nutrition.exportHistory',
  'nutrition.eliminarRegistros_2': 'nutrition.deleteRecordsTitle',
  'nutrition.exportarHistorialDeDieta': 'nutrition.exportDietHistory',
  'nutrition.sinPlanificacionAutomatica': 'nutrition.noAutoPlanning',
  'nutrition.semanasParesEImparesIndependientes': 'nutrition.evenOddWeeksIndependent',
  'nutrition.copiaAlterna_2': 'nutrition.copyAlternateTitle',
  'nutrition.cadaNuevaSemanaRecibeLaAnterior': 'nutrition.copyWeeklyShortDesc',
  'nutrition.copiaSemanal_2': 'nutrition.copyWeeklyTitle',
  'nutrition.planificacionAutomatica': 'nutrition.autoPlanningTitle',
  'nutrition.visualizacion': 'nutrition.visualizationTitle',
  'nutrition.comidasDelDia': 'nutrition.dailyMealsTitle',

  // --- ALZAN ---
  'alzan.seguir': 'alzan.follow',
  'alzan.crear': 'alzan.create',
  'alzan.global': 'alzan.global',
  'alzan.siguiendo': 'alzan.following',
  'alzan.records': 'alzan.records',
  'alzan.medallas': 'alzan.medals',
  'alzan.proximamente': 'alzan.comingSoon',
  'alzan.ex': 'alzan.previousRecordAbbr',
  'alzan.carreraMasLarga': 'alzan.longestRun',
  'alzan.km': 'alzan.perKm',
  'alzan.ritmoMedio': 'alzan.avgPace',
  'alzan.tiempo': 'alzan.time',
  'alzan.km_2': 'alzan.unitKm',
  'alzan.acts': 'alzan.activitiesAbbr',
  'alzan.resumenSemanal': 'alzan.weeklySummary',
  'alzan.estaSemana': 'alzan.thisWeek',
  'alzan.followers': 'alzan.followers',
  'alzan.following': 'alzan.followingCount',
  'alzan.alzan': 'alzan.brandName',
  'alzan.comparteTusMejoresMomentos': 'alzan.shareMomentsTitle',
  'alzan.enFormatoCorto': 'alzan.shortFormatDesc',
  'alzan.clips': 'alzan.clips',
  'alzan.mensajes': 'alzan.messages',

  // --- HEALTH ---
  'health.calculo': 'health.calculationLabel',
  'health.paraMayorPrecisionRegistraMedidasCorporales': 'health.registerMeasurementsHint',
  'health.kg': 'health.unitKg',
  'health.masaMagra': 'health.leanMass',
  'health.grasaCorporal': 'health.bodyFat',
  'health.composicionCorporal': 'health.bodyComposition',
  'health.historial': 'health.history',
  'health.progreso': 'health.progress',
  'health.ultimos7Dias': 'health.last7Days',
  'health.ultimos30Dias': 'health.last30Days',
  'health.lasEstimacionesDeDeGrasaYDeMusculoSonAproximacione': 'health.compositionEstimatesDisclaimer',
  'health.resto': 'health.remainder',
  'health.grasa': 'health.fat',
  'health.musculo': 'health.muscle',
  'health.distribucionDePeso': 'health.weightDistribution',
  'health.recalcularComposicion': 'health.recalculateComposition',
  'health.paraActivarElAlgoritmoAlGindanMri': 'health.activateMriAlgHint',
  'health.abdomenYCadera': 'health.abdomenAndHip',
  'health.paraMayorPrecision': 'health.forBetterPrecision',
  'health.abdomen': 'health.abdomen',
  'health.anadeMedidasCorporalesParaDesbloquearMetricasDeMay': 'health.addMeasurementsPrompt',
  'health.composicion': 'health.composition',
  'health.tipsRecomendaciones': 'health.tipsAndRecs',
  'health.laProteina1622gKgDiaYElEntrenamientoDeFuerzaSonCla': 'health.proteinAdvice',
  'health.actualizaPechoBrazoYMusloCada24SemanasParaSeguirTu': 'health.measurementsUpdateAdvice',
  'health.precisionOptima': 'health.optimalPrecision',
  'health.mejoraLaPrecision': 'health.improvePrecision',
  'health.porcentaje': 'health.percentage',
  'health.masaMuscular': 'health.muscleMass',
  'health.esteValorFueCalculadoCuandoRegistrasteTuPesoElMeto': 'health.compositionCalculationLegacyNote',
  'health.valorGuardado': 'health.savedValue',
  'health.metodoAvanzadoValidadoPorMriUsaAbdomenYCaderaParaD': 'health.methodMriDescription',
  'health.formulaAlGindanEtAlMri': 'health.formulaAlGindanMri',
  'health.estimacionBasicaUsandoSoloPesoYAlturaTieneUnMargen': 'health.methodBasicDescription',
  'health.sm0244Peso78Altura0098Edad': 'health.formulaMuscleMass',
  'health.formulaLeeEtAl2000': 'health.formulaLee2000',
  'health.mideteSiempreEnAyunasYALaMismaHoraParaEvitarFluctu': 'health.measurementBestPractices',
  'health.mantenTusMedidasDeAbdomenActualizadas': 'health.keepAbdomenUpdated',
  'health.paraActivarElAlgoritmoRfmMasPreciso': 'health.activateRfmAlgHint',
  'health.resultado': 'health.resultLabel',
  'health.deGrasaCorporal': 'health.bodyFatPercentage',
  'health.calculoEstimadoBasadoEnTusDatosDisponibles': 'health.estimatedCalcNote',
  'health.metodo': 'health.methodLabel',
  'health.esteValorFueCalculadoCuandoRegistrasteTuPesoElMeto_2': 'health.compositionCalculationGenericNote',
  'health.valorObtenidoDeBasculaInteligenteOCalibrador': 'health.smartScaleSource',
  'health.medicionDirecta': 'health.directMeasurement',
  'health.ajustadoPorAlturaEImcParaMayorPrecision': 'health.adjustedByBmiNote',
  'health.usaAbdomenCaderaPechoBrazoMuslo': 'health.measurementsUsedList',
  'health.antropometriaCompletaNavyAdaptado': 'health.fullAnthropometryMethod',
  'health.2WhtrAbdomenAlturaRangoDeGrasa': 'health.whtrMethodStep',
  'health.1BaiCaderaAltura1518': 'health.baiMethodStep',
  'health.algoritmoCombinado': 'health.combinedAlgorithm',
  'health.convertidoAGrasaUsandoRangosPorSexo': 'health.fatConversionNote',
  'health.whtrAbdomenCmAlturaCm': 'health.whtrFormula',
  'health.icaIndiceAbdomenAltura': 'health.icaIndexTitle',
  'health.calculaElPorcentajeDeGrasaUsandoTuContornoDeCadera': 'health.calcFatFromHip',
  'health.grasaCaderaAltura1518': 'health.fatFormulaHip',
  'health.baiIndiceDeAdiposidadCorporal': 'health.baiIndexTitle',
  'health.abdomenYAlturaNoUtilizaTuPeso': 'health.abdomenHeightMethodNote',
  'health.exclusivamenteEnTusMedidas': 'health.exclusivelyMeasurements',
  'health.grasa_2': 'health.fatFormulaPrefix',
  'health.20AlturaAbdomen': 'health.fatFormulaSuffix',
  'health.rfmRelativeFatMass': 'health.rfmTitle',
  'health.usadaSoloCuandoOtrosMetodosNoSonPosibles': 'health.fallbackMethodNote',
  'health.estimacionBasicaFallback': 'health.basicEstimationFallback',
  'health.formulaDeDeurenberg': 'health.formulaDeurenberg',
  'health.consideradaLaEstimacionMasPrecisaCuandoNoHayMedida': 'health.mostAccurateFallbackNote',
  'health.basadaEnImcEdadYSexo': 'health.basedOnBmiAgeSex',
  'health.formulaCunBaeNavarra': 'health.formulaCunBae',
  'health.combinaloConDeGrasaCorporalParaUnaVisionMasComplet': 'health.combineWithFatPercAdvice',
  'health.anadeMedidasCorporalesParaDesbloquearMetricasAvanz': 'health.unlockAdvancedMetricsPrompt',
  'health.tuAltura': 'health.yourHeight',
  'health.tuPeso': 'health.yourWeight',
  'health.imcPesoKgAlturaM': 'health.bmiFormula',
  'health.formula': 'health.formulaLabel',
  'health.losDatosDeComposicionCorporalSeCalculanAutomaticam': 'health.autoCompCalcDisclaimer',
  'health.tocaParaAnadirTuPrimeraNoche': 'health.addFirstSleepRecord',
  'health.sinRegistrosDeSueno': 'health.noSleepRecords',
  'health.media': 'health.averageLabel',
  'health.calidad': 'health.quality',
  'health.ultimaNoche': 'health.lastNight',
  'health.sueno': 'health.sleep.name',
  'health.registrarMedidas': 'health.registerMeasurements',
  'health.medidas': 'health.measurements',
  'health.vs': 'health.vs',
  'health.pesoActual': 'health.currentWeight',
  'health.peso': 'health.weight.name',
  'health.resumen': 'health.summary',
  'health.estadisticasAvanzadas': 'health.advancedStats',
  'health.paraAnadirOtraMedidaDe': 'health.overwriteMeasureStart',
  'health.esteDiaEliminaLaAnteriorDesdeElHistorial': 'health.overwriteMeasureEnd',
  'health.guardar': 'health.save',
  'health.cancelar': 'health.cancel',
  'health.hoy': 'health.today',
  'health.ayer': 'health.yesterday',
  'health.fechaDelRegistro': 'health.recordDate',
  'health.cm': 'health.cm',
  'health.medida': 'health.measure',
  'health.tipoDeMedida': 'health.measureType',
  'health.registrarMedida': 'health.registerMeasureTitle',
  'health.progreso30Dias': 'health.progress30Days',
  'health.registrarBpm': 'health.registerBpm',
  'health.frecuenciaCardiaca': 'health.heartRate',
  'health.bpm': 'health.unitBpm',
  'health.calidadDelSueno': 'health.sleepQuality',
  'health.duracionTotal': 'health.totalDuration',
  'health.horario': 'health.schedule',
  'health.registrarSueno': 'health.registerSleep',
  'health.tocaElBotonParaAnadirTuPrimeraNoche': 'health.addFirstSleepRecordBtn',
  'health.lt6h': 'health.lessThan6h',
  'health.67h': 'health.between6And7h',
  'health.7h': 'health.moreThan7h',
  'health.tendencia': 'health.trend',
  'health.media_2': 'health.averageShort',
  'health.paraAnadirOtroPesoEsteDiaEliminaElAnteriorDesdeElH': 'health.overwriteWeightDayWarning',
  'health.registrarPeso': 'health.registerWeight',
  'health.noHayRegistrosDe': 'health.noRecordsOf',

  // --- AUTH ---
  'auth.alzanHealth': 'auth.appName',
  'auth.crearCuentaNueva': 'auth.createAccount',
  'auth.hasOlvidadoLaContrasena': 'auth.forgotPassword',
  'auth.introduceTuCorreoElectronicoYTeEnviaremosUnEnlaceP': 'auth.resetPasswordInstructions',
  'auth.recuperarContrasena': 'auth.recoverPassword',
  'auth.nuevaContrasena': 'auth.newPassword',
  'auth.introduceElCorreoElectronicoDeContactoNadieVeraEst': 'auth.contactEmailInstructions',
  'auth.cualEsTuCorreoElectronico': 'auth.whatIsYourEmail',
  'auth.politicaDePrivacidad': 'auth.privacyPolicy',
  'auth.terminos': 'auth.terms',
  'auth.paraProtegerTusDatosDeSaludNecesitamosUnaContrasen': 'auth.securePasswordReason',
  'auth.creaUnaContrasenaSegura': 'auth.createSecurePassword',
  'auth.verificaTuEmail': 'auth.verifyEmail',

  // --- HOME ---
  'home.entrenamiento': 'home.training',
  'home.programadoParaHoyTocaParaEmpezar': 'home.scheduledTodayAction',
  'home.siguienteComida': 'home.nextMeal',
  'home.agendaDeHoy': 'home.todaysAgenda',
  'home.completados': 'home.completed',
  'home.entrenos': 'home.workouts',
  'home.resumenDeHoy': 'home.todaysSummary',

  // --- ONBOARDING ---
  'onboarding.atras': 'onboarding.back',
  'onboarding.cuantosDiasALaSemanaRealizasEjercicioDedicado': 'onboarding.daysTrainingQuestion',
  'onboarding.tusEntrenamientos': 'onboarding.yourWorkouts',
  'onboarding.comoDescribiriasTuActividadDiariaHabitualSinContar': 'onboarding.activityLevelQuestion',
  'onboarding.tuDiaADia': 'onboarding.yourDayToDay',
  'onboarding.tuPerfilEstaConfiguradoHemosCalculadoTusObjetivosN': 'onboarding.profileSetupSuccess',
  'onboarding.todoListo': 'onboarding.allSet',
  'onboarding.tusDatosEstanProtegidosYNuncaSeranCompartidosConTe': 'onboarding.dataPrivacyNotice',
  'onboarding.politicaDePrivacidad': 'onboarding.privacyPolicy',
  'onboarding.terminosDeUso': 'onboarding.termsOfUse',
  'onboarding.porFavorRevisaYAceptaNuestrosTerminosParaContinuar': 'onboarding.acceptTermsPrompt',
  'onboarding.terminosYPrivacidad': 'onboarding.termsAndPrivacy',
  'onboarding.cualEsTuObjetivoPrincipalEstoNosAyudaraAPersonaliz': 'onboarding.mainGoalQuestion',
  'onboarding.tuObjetivo': 'onboarding.yourGoal',
  'onboarding.integraciones': 'onboarding.integrations',
  'onboarding.sincronizaTusDatosDeSaludParaUnaExperienciaMasComp': 'onboarding.healthSyncPrompt',
  'onboarding.saludDelSistema': 'onboarding.systemHealth',
  'onboarding.esteSeraTuIdentificadorPublicoYNoPodraCambiarse': 'onboarding.publicIdWarning',
  'onboarding.username': 'onboarding.username',
  'onboarding.minimo2Caracteres': 'onboarding.min2Chars',
  'onboarding.nombreVisible': 'onboarding.displayName',
  'onboarding.eligeComoQuieresQueTeConozcanEnAlzan': 'onboarding.displayNamePrompt',
  'onboarding.tuIdentidad': 'onboarding.yourIdentity',
  'onboarding.puedesActualizarEstosDatosCuandoQuierasDesdeTuPerf': 'onboarding.updateProfileLaterNote',
  'onboarding.pesoActualKg': 'onboarding.currentWeightKg',
  'onboarding.alturaCm': 'onboarding.heightCm',
  'onboarding.necesitamosEstosDatosParaCalcularTusMetricasDeSalu': 'onboarding.bodyDataReason',
  'onboarding.datosCorporales': 'onboarding.bodyData',
  'onboarding.sexo': 'onboarding.sex',
  'onboarding.fechaDeNacimiento': 'onboarding.birthDate',
  'onboarding.estaInformacionNosAyudaAPersonalizarTusCalculosDeS': 'onboarding.bioProfileReason',
  'onboarding.perfilBiologico': 'onboarding.biologicalProfile',
  'onboarding.omitir': 'onboarding.skip',
  'onboarding.distancia': 'onboarding.distance',
  'onboarding.seleccionaTusUnidadesDeMedidaPreferidasPuedesCambi': 'onboarding.unitPreferencePrompt',
  'onboarding.unidades': 'onboarding.units',

  // --- SETTINGS ---
  'settings.eliminarCuenta': 'settings.deleteAccount',
  'settings.zonaDePeligro': 'settings.dangerZone',
  'settings.cerrarSesion': 'settings.logout',
  'settings.cambiarContrasena': 'settings.changePassword',
  'settings.sesionYSeguridad': 'settings.sessionAndSecurity',
  'settings.opcionesDeAccesibilidadProximamente': 'settings.accessibilityComingSoon',
  'settings.sistema': 'settings.system',
  'settings.oscuro': 'settings.dark',
  'settings.claro': 'settings.light',
  'settings.conectaTusAplicacionesDeSaludYDeporteFavoritasPara': 'settings.syncAppsDescription',
  'settings.archivoGeneradoCorrectamente': 'settings.fileGeneratedSuccess',
  'settings.descargarMisDatos': 'settings.downloadMyData',
  'settings.deAcuerdoConElGdprTienesDerechoAObtenerUnaCopiaDeT': 'settings.gdprRightsInfo',
  'settings.alPulsarElBotonGeneraremosUnArchivoJsonConTuPerfil': 'settings.jsonExportInfo',
  'settings.portabilidadDeDatos': 'settings.dataPortability',
  'settings.eliminarMiCuentaPermanentemente': 'settings.deleteAccountPermanent',
  'settings.escribeEliminarParaConfirmar': 'settings.typeDeleteToConfirm',
  'settings.escribeTuEmailParaConfirmar': 'settings.typeEmailToConfirm',
  'settings.eliminarTuCuentaImplicaElBorradoPermanenteDeTuPerf': 'settings.deleteAccountConsequences',
  'settings.noPodrasRecuperarEstaInformacion': 'settings.cannotRecoverInfo',
  'settings.guardarMeta': 'settings.saveGoal',
  'settings.descripcion': 'settings.description',
  'settings.tipoDeMeta': 'settings.goalType',
  'settings.aLas': 'settings.atTime',
  'settings.caloriasDiarias': 'settings.dailyCalories',
  'settings.tiempoEstimado': 'settings.estimatedTime',
  'settings.porTiempo': 'settings.byTime',
  'settings.anadirObjetivo': 'settings.addGoal',
  'settings.objetivo': 'settings.goal',
  'settings.detectadaAutomaticamente': 'settings.autoDetected',
  'settings.zonaHoraria': 'settings.timezone',
  'settings.idioma': 'settings.language',
  'settings.muyProntoPodrasCompartirTusLogrosSeguirAAmigosYCon': 'settings.socialFeaturesComingSoon',
  'settings.redSocialEnCamino': 'settings.socialNetworkComing',
  'settings.proximamente': 'settings.comingSoonCaps',
  'settings.gestionDeDatos': 'settings.dataManagement',
  'settings.documentacionLegal': 'settings.legalDocs',
  'settings.guardarCambios': 'settings.saveChanges',
  'settings.miembroDesde': 'settings.memberSince',
  'settings.fechaDeNacimientoYyyyMmDd': 'settings.birthDateFmt',
  'settings.emailSoloLectura': 'settings.emailReadOnly',
  'settings.nombreVisible': 'settings.displayName',
  'settings.comoDescribiriasTuActividadDiariaHabitual': 'settings.activityLevelQuery',
  'settings.datosPersonales': 'settings.personalData',
  'settings.emailSoloLectura_2': 'settings.emailReadOnlyLabel',
  'settings.nombreDeUsuario': 'settings.username',
  'settings.cambiarFoto': 'settings.changePhoto',
  'settings.actualizar': 'settings.update',
  'settings.usaAlMenos8CaracteresConMayusculasYNumerosParaMayo': 'settings.passwordRequirements',
  'settings.confirmarContrasena': 'settings.confirmPassword',
  'settings.nuevaContrasena': 'settings.newPassword',
  'settings.cerrarSesion_2': 'settings.logoutTitle',
  'settings.configuracion': 'settings.configurationTitle',
  'settings.comunicacion': 'settings.communicationTitle',
  'settings.ajustes': 'settings.adjustments',

  // --- TRAINING ---
  'training.pulsaElCheckParaCompletarLaSerie': 'training.completeSetInstruction',
  'training.tocaElNumeroDeSetParaMarcarComoCalentamientoNoDisp': 'training.warmupSetInstruction',
  'training.elObjetivoDeRepeticionesOTiempo': 'training.repsOrTimeGoal',
  'training.reps': 'training.repsColon',
  'training.cargaLevantadaEnEsteEjercicio': 'training.weightLiftedLabel',
  'training.muestraTuRecordPersonalSiHaSidoRegistradoPreviamen': 'training.prIndicatorDesc',
  'training.pr': 'training.prColon',
  'training.indicaElNumeroDeLaSerie': 'training.setNumberIndicator',
  'training.set': 'training.setColon',
  'training.ayudaDeTabla': 'training.tableHelp',
  'training.eliminarEjercicio': 'training.deleteExercise',
  'training.eliminarSerie': 'training.deleteSet',
  'training.moverAbajo': 'training.moveDown',
  'training.moverArriba': 'training.moveUp',
  'training.verInformacion': 'training.viewInfo',
  'training.opcionesDeEjercicio': 'training.exerciseOptions',
  'training.completarTodo': 'training.completeAll',
  'training.anadirEjercicio': 'training.addExercise',
  'training.completarTodas': 'training.completeAllSets',
  'training.anadirSerie': 'training.addSet',
  'training.set_2': 'training.setLabel',
  'training.terminar': 'training.finish',
  'training.queVasAEntrenarHoy': 'training.whatTrainingToday',
  'training.eligeDeporte': 'training.chooseSport',
  'training.ritmo': 'training.pace',
  'training.vueltas': 'training.laps',
  'training.reps_2': 'training.repsX',
  'training.serie': 'training.seriesSingular',
  'training.ejercicios': 'training.exercises',
  'training.entrenoProgramado': 'training.scheduledWorkout',
  'training.tiempo': 'training.time',
  'training.esfuerzo': 'training.effort',
  'training.ejercicios_2': 'training.exercisesLower',
  'training.detalle': 'training.detail',
  'training.segundos': 'training.seconds',
  'training.minutos': 'training.minutes',
  'training.horas': 'training.hours',
  'training.hora': 'training.hour',
  'training.fecha': 'training.date',
  'training.esfuerzoRpe110': 'training.effortRpe',
  'training.fcMediaBpm': 'training.avgHeartRate',
  'training.caloriasKcal': 'training.caloriesKcal',
  'training.desnivelM': 'training.elevationM',
  'training.min': 'training.minutesColon',
  'training.duracion': 'training.duration',
  'training.distancia': 'training.distanceParen',
  'training.nombre': 'training.name',
  'training.deporte': 'training.sport',
  'training.tuEntrenamientoHaSidoGuardadoPuedesOmitirEstaVenta': 'training.saveSuccessMessage',
  'training.esfuerzoPercibidoRpe110': 'training.perceivedEffortRpe',
  'training.volumen': 'training.volume',
  'training.series': 'training.sets',
  'training.resumenDeSesion': 'training.sessionSummary',
  'training.enCurso': 'training.inProgress',
  'training.registraTuPrimeraActividad': 'training.registerFirstActivity',
  'training.sinActividades': 'training.noActivities',
  'training.aplicar': 'training.apply',
  'training.rangoPersonalizado': 'training.customRange',
  'training.filtrarPorFecha': 'training.filterByDate',
  'training.historialDeActividad': 'training.activityHistory',
  'training.programarParaDiaDeLaSemana': 'training.scheduleForWeekday',
  'training.soloInformativoParaPlanificarTuDia': 'training.planningInfoOnly',
  'training.duracionEstimadaMin': 'training.estimatedDurationMin',
  'training.objetivoPrincipal': 'training.mainGoal',
  'training.nombreDeLaPlantilla': 'training.templateName',
  'training.tiempoTotal': 'training.totalTime',
  'training.anadirPaso': 'training.addStep',
  'training.anadeIntervalosCalentamientoOPeriodosDeRecuperacio': 'training.addIntervalsHint',
  'training.empiezaTuRutina': 'training.startRoutine',
  'training.siguiente': 'training.next',
  'training.configuraLosDetallesGenerales': 'training.configureGeneralDetails',
  'training.sesionDe': 'training.sessionOf',
  'training.queEntrenoQuieresPlanificar': 'training.planWorkoutQuery',
  'training.anadirAlBloque': 'training.addToBlock',
  'training.xRepeticiones': 'training.xRepetitions',
  'training.instrucciones': 'training.instructions',
  'training.tipoDeEjercicio': 'training.exerciseType',
  'training.secundario': 'training.secondary',
  'training.primario': 'training.primary',
  'training.musculosImplicados': 'training.musclesInvolved',
  'training.equipamiento': 'training.equipment',
  'training.dificultad': 'training.difficulty',
  'training.noSeEncontraronEjercicios': 'training.noExercisesFound',
  'training.seleccionarEjercicio': 'training.selectExercise',
  'training.comparteTusActividades': 'training.shareActivities',
  'training.strava': 'training.strava',
  'training.sincronizaCarrerasYRutas': 'training.syncRuns',
  'training.suunto': 'training.suunto',
  'training.conectaTusServiciosFavoritosParaSincronizarTusEntr': 'training.syncServicesDescription',
  'training.integraciones': 'training.integrations',
  'training.volverAlInicio': 'training.backToHome',
  'training.granTrabajoTuSesionHaSidoGuardada': 'training.sessionSavedSuccess',
  'training.entrenamientoCompletado': 'training.workoutCompleted',
  'training.restS': 'training.restSeconds',
  'training.pr_2': 'training.prParen',
  'training.repsMax': 'training.repsMax',
  'training.repsMin': 'training.repsMin',
  'training.tiempoS': 'training.timeSeconds',
  'training.sets': 'training.setsLabel',
  'training.ejercicios_3': 'training.exercisesParen',
  'training.programarDia': 'training.scheduleDay',
  'training.confirmarYAnadir': 'training.confirmAndAdd',
  'training.siSeleccionasUnDiaLaRutinaSeProgramaraAutomaticame': 'training.routineScheduleNote',
  'training.queDiaDeLaSemanaQuieresRealizar': 'training.whichDayForRoutine',
  'training.configurarRutina': 'training.configureRoutine',
  'training.anadirAMisRutinas': 'training.addToMyRoutines',
  'training.nota': 'training.note',
  'training.seriesX': 'training.setsTimes',
  'training.reps_3': 'training.repsSingular',
  'training.usaPiernaGluteoSiBuscasMasEstetica': 'training.legGluteSuggestion',
  'training.pushPullPiernaTorso': 'training.splitPushPullLegsTorso',
  'training.4Dias': 'training.frequency4Days',
  'training.pushPullPierna': 'training.splitPushPullLegs',
  'training.3Dias': 'training.frequency3Days',
  'training.fullBodyAFullBodyB': 'training.splitFullBodyAB',
  'training.2Dias': 'training.frequency2Days',
  'training.alternaConFullBodyBCadaSemana': 'training.fullBodyAltSuggestion',
  'training.fullBodyA': 'training.splitFullBodyA',
  'training.1Dia': 'training.frequency1Day',
  'training.recomendacionesSegunTuFrecuencia': 'training.recommendationsByFreq',
  'training.cuantosDiasEntrenas': 'training.howManyDaysTrain',
  'training.ver': 'training.view',
  'training.iniciar': 'training.start',
  'training.anadirAl': 'training.addTo',
  'training.crearRutina': 'training.createRoutine',
  'training.creaTuPrimeraRutinaDeFuerzaParaEmpezarAEntrenar': 'training.createFirstRoutinePrompt',
  'training.noTienesRutinas': 'training.noRoutines',
  'training.plantillas': 'training.templates',
  'training.misRutinas': 'training.myRoutines',
  'training.registrar': 'training.register',
  'training.crearPlantilla': 'training.createTemplate',
  'training.creaTuPrimeraPlantillaDeEntrenamientoParaDeportesC': 'training.createFirstTemplatePrompt',
  'training.noTienesPlantillas': 'training.noTemplates',
  'training.seleccionarFecha': 'training.selectDate',
  'training.series_2': 'training.setsBullet',
  'training.vistaPrevia': 'training.preview',
  'training.gimnasio': 'training.gym',
  'training.queQuieresProgramarParaEl': 'training.whatToScheduleForDate',
  'training.anadirAlCalendario': 'training.addToCalendar',
  'training.historialActividades': 'training.activityHistoryTitle',
  'training.registrarActividad': 'training.registerActivity',
  'training.rutinasGym': 'training.gymRoutines',
  'training.plantillaDeportes': 'training.sportsTemplate',
  'training.herramientas': 'training.tools',
  'training.noHayNadaPlaneadoParaEsteDia': 'training.nothingPlannedForDate',
  'training.hasta': 'training.until',
  'training.desde': 'training.from',
  'training.eliminarTodos': 'training.deleteAll',
  'training.eliminarPorRangoDeFechas': 'training.deleteByDateRange',
  'training.estoEliminaraLosEntrenamientosPlanificadosDelCalen': 'training.deleteScheduledWorkoutsWarning',
  'training.eliminarEntrenamientos': 'training.deleteWorkouts',
  'training.exportarPdf': 'training.exportPdf',
  'training.generaUnPdfConTuHistorial': 'training.generatePdfHistory',
  'training.exportarEntrenos': 'training.exportWorkouts',
  'training.eliminarEntrenamientosDelCalendario': 'training.deleteWorkoutsFromCalendar',
  'training.zonaDePeligro': 'training.dangerZoneCaps',
  'training.exportarHistorialDeEntrenos': 'training.exportWorkoutHistory',
  'training.planificadorSemanal': 'training.weeklyPlanner',
  'training.reanudar': 'training.resume',
  'training.seleccionaLaZonaDeEntrenamiento': 'training.selectTrainingZone',
  'training.velocidad': 'training.speed',
  'training.seleccionaLaVelocidadObjetivo': 'training.selectTargetSpeed',
  'training.ritmo_2': 'training.paceLabel',
  'training.zonaFc': 'training.hrZone',
  'training.velocidad_2': 'training.speedShort',
  'training.ninguno': 'training.none',
  'training.tiempoHorasMinutosSegundos': 'training.timeHmsFormat',
  'training.tipoDeFase': 'training.phaseType',
  'training.confirmar': 'training.confirm',
};

// ─── Key helpers ─────────────────────────────────────────────────────────────

/**
 * Derive the translation namespace from the file path, matching the existing
 * translation file structure:
 *
 *   screens/auth/...            → auth
 *   screens/training/...        → training
 *   screens/nutrition/...       → nutrition
 *   screens/settings/...        → settings
 *   screens/onboarding/...      → onboarding
 *   screens/home/...            → home
 *   screens/alzan/...           → alzan
 *   modules/health/...          → health
 *   modules/nutrition/...       → nutrition
 *   components/nutrition/...    → nutrition
 *   components/social/...       → alzan
 *   components/ (root)          → common
 */
const NAMESPACE_MAP = [
  // modules first (more specific)
  [/modules[\\/]health/, 'health'],
  [/modules[\\/]nutrition/, 'nutrition'],
  // screens
  [/screens[\\/]auth/, 'auth'],
  [/screens[\\/]training/, 'training'],
  [/screens[\\/]nutrition/, 'nutrition'],
  [/screens[\\/]settings/, 'settings'],
  [/screens[\\/]onboarding/, 'onboarding'],
  [/screens[\\/]home/, 'home'],
  [/screens[\\/]alzan/, 'alzan'],
  // components with subfolders
  [/components[\\/]nutrition/, 'nutrition'],
  [/components[\\/]social/, 'alzan'],
  [/components[\\/]training/, 'training'],
  [/components[\\/]health/, 'health'],
  // fallback for root components
  [/components[\\/][^/\\]+$/, 'common'],
];

function namespaceFromPath(filePath) {
  const normalised = filePath.replace(/\\/g, '/');
  for (const [pattern, ns] of NAMESPACE_MAP) {
    if (pattern.test(normalised)) return ns;
  }
  // Last-resort: use the immediate parent folder name
  const parts = normalised.split('/');
  const parent = parts[parts.length - 2] || 'common';
  return parent.toLowerCase();
}

/** "Guardar Cambios" → "guardarCambios" */
function toCamelCase(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9\s]/g, ' ') // non-alnum → space
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) => (i === 0 ? word : word[0].toUpperCase() + word.slice(1)))
    .join('')
    .slice(0, 50);
}

/**
 * Build a namespaced key like `training.guardarCambios`.
 * Same text always reuses the same key.
 * Collisions get a numeric suffix: `training.guardar_2`.
 */
function uniqueKey(text, keyMap, filePath) {
  // Reuse key if we've seen this exact text before
  const existing = Object.entries(keyMap).find(([, v]) => v === text);
  if (existing) return existing[0];

  // Check for a text-based override first
  if (KEY_OVERRIDES[text]) return KEY_OVERRIDES[text];

  const ns = KEY_PREFIX || namespaceFromPath(filePath);
  const leaf = toCamelCase(text);
  const base = `${ns}.${leaf}`;

  // Check for a generated-key-based override
  if (KEY_OVERRIDES[base]) return KEY_OVERRIDES[base];

  // Debug: Log generation
  // console.log(c.dim(`   [KeyGen] "${text}" -> Base "${base}"`));

  if (!keyMap[base]) return base;
  let i = 2;
  while (keyMap[`${base}_${i}`]) {
    // console.log(c.dim(`   [Key Collision] ${base}_${i} already exists for "${keyMap[`${base}_${i}`]}" vs new "${text}"`));
    i++;
  }
  return `${base}_${i}`;
}

/**
 * Finds the '?' and ':' that split the top-level ternary.
 * Returns object { q: index, c: index } or -1.
 */
function findTernaryPivot(text) {
  let depth = 0;
  let questionIndex = -1;
  let colonIndex = -1;

  let inQuote = null;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuote) {
      if (char === inQuote && text[i - 1] !== '\\') inQuote = null;
      continue;
    }
    if (char === "'" || char === '"') {
      inQuote = char;
      continue;
    }

    if (char === '?') {
      if (depth === 0) questionIndex = i;
      depth++;
    } else if (char === ':') {
      depth--;
      if (depth === 0) {
        colonIndex = i;
        break; // Found the matching colon for the first question mark
      }
    }
  }

  if (questionIndex !== -1 && colonIndex !== -1) {
    return { q: questionIndex, c: colonIndex };
  }
  return -1;
}

/**
 * Recursively parses text to handle nested ternary expressions.
 * Returns the fully replaced string (with t('key') calls) or the original text if no actionable content found.
 */
function parseRecursive(text, keyMap, filePath) {
  const t = text.trim();

  // 1. Check for Ternary
  const pivot = findTernaryPivot(t);
  if (pivot !== -1) {
    const condition = t.slice(0, pivot.q).trim();
    const trueValue = t.slice(pivot.q + 1, pivot.c).trim();
    const falseValue = t.slice(pivot.c + 1).trim();

    // Recursively process both branches
    const processedTrue = parseRecursive(trueValue, keyMap, filePath);
    const processedFalse = parseRecursive(falseValue, keyMap, filePath);

    // Only return processed version if something actually changed (optimization)
    // But actually, we just return the rebuilt string
    return `${condition} ? ${processedTrue} : ${processedFalse}`;
  }

  // 2. Check for Literal (Leaf node)
  const literalMatch = /^['"]([^'"]+)['"]$/.exec(t);
  if (literalMatch) {
    const val = literalMatch[1];

    // Exclude basic symbols/numbers to avoid over-translating things like '/'
    if (/^[+\-×÷=<>\\/\\\\.\\s•·*#@!?(),;:]+$/.test(val) || /^\d+$/.test(val)) {
      return t;
    }

    // Skip if it looks like a hex color or CSS keyword (though shouldSkip handles this too)
    if (/^#[0-9A-Fa-f]{3,8}$/.test(val)) return t;

    const key = uniqueKey(val, keyMap, filePath);
    keyMap[key] = val;
    return `t('${key}')`;
  }

  // 3. Fallback: Return as-is
  return t;
}

function shouldSkip(text, keyMap, filePath) {
  const t = text.trim();
  if (!t) return { skip: true, reason: 'Empty' };

  // --- RECURSIVE CHECK (Ternary / Literals) ---
  if (keyMap && filePath) {
    const replaced = parseRecursive(t, keyMap, filePath);
    // If the result is different and contains "t(", it means we translated something inside
    if (replaced !== t && replaced.includes("t('")) {
      return { skip: false, replacement: replaced };
    }
  }

  // Existing checks
  if (/^\d+[\d.,\s%]*$/.test(t)) return { skip: true, reason: 'Pure number/unit' };
  if (/^[+\-×÷=<>\\/\\\\.\\s•·*#@!?(),;:]+$/.test(t)) return { skip: true, reason: 'Symbols/punctuation only' };

  // NEW: Skip hex colors
  if (/^#[0-9A-Fa-f]{3,8}$/.test(t)) return { skip: true, reason: 'Hex color' };

  // NEW: Skip CSS color keywords
  const cssColors = ['transparent', 'inherit', 'currentColor', 'black', 'white'];
  if (cssColors.includes(t.toLowerCase())) return { skip: true, reason: 'CSS color keyword' };

  // NEW: Skip CSS color functions (rgba, rgb, hsla, hsl)
  if (/^rgba?\(/.test(t) || /^hsla?\(/.test(t)) return { skip: true, reason: 'CSS color function' };

  // NEW: Skip locale strings (e.g., es-ES, en-US, pt-BR)
  if (/^[a-z]{2}-[A-Z]{2}$/.test(t)) return { skip: true, reason: 'Locale string' };

  // NEW: Skip SVG path commands (M, L, C, Q, etc.)
  if (/^[MLHVCSQTAZmlhvcsqtaz\d\s,.\-]+$/.test(t) && /[MLHVCSQTAZmlhvcsqtaz]/.test(t)) {
    return { skip: true, reason: 'SVG path data' };
  }

  // NEW: Check for Logical OR expressions (value || 'default')
  // Match: leftSide || rightSide
  const logicalOrMatch = t.match(/^(.+?)\s*\|\|\s*(.+)$/);
  if (logicalOrMatch) {
    const [, left, right] = logicalOrMatch;
    const leftTrimmed = left.trim();
    const rightTrimmed = right.trim();

    const leftLiteralMatch = /^['"]([^'"]+)['"]$/.exec(leftTrimmed);
    const rightLiteralMatch = /^['"]([^'"]+)['"]$/.exec(rightTrimmed);

    if (leftLiteralMatch || rightLiteralMatch) {
      return {
        skip: false,
        logicalOr: {
          leftRaw: leftTrimmed,
          rightRaw: rightTrimmed,
          leftValue: leftLiteralMatch ? leftLiteralMatch[1] : null,
          rightValue: rightLiteralMatch ? rightLiteralMatch[1] : null,
        },
      };
    }
  }

  // NEW: Skip strings with JavaScript operators (but ternary/recursive was checked above)
  if (/[=<>!]+[=]|&&|===|!==|=>/.test(t)) return { skip: true, reason: 'Contains JS operators' };

  // NEW: Skip template literals
  if (t.includes('`') || t.includes('${')) return { skip: true, reason: 'Template literal' };

  // NEW: Skip strings starting with assignment operators
  if (/^[=<>!]/.test(t)) return { skip: true, reason: 'Starts with operator' };

  // Strip leading/trailing punctuation to get the "real" text length
  // e.g. ", bienvenido a " → "bienvenido a" (translatable)
  //      ", "             → ""             (skip)
  const stripped = t.replace(/^[^a-zA-ZÀ-ÿ0-9]+|[^a-zA-ZÀ-ÿ0-9]+$/g, '');
  if (!stripped || stripped.length <= 1) return { skip: true, reason: 'Too short (≤1 char)' };

  // Mixed content: has JSX expressions but also has real translatable text around them
  if (/{[^}]+}/.test(t)) return { skip: false, mixed: true };

  return { skip: false };
}

/**
 * Split a mixed string into alternating text/expression segments.
 * "Actualizado: {expr} y {expr2} más" →
 * [
 *   { type: 'text', value: 'Actualizado: ' },
 *   { type: 'expr', value: '{expr}' },
 *   { type: 'text', value: ' y ' },
 *   { type: 'expr', value: '{expr2}' },
 *   { type: 'text', value: ' más' },
 * ]
 * Segments with only whitespace are preserved as-is (no translation needed).
 */
function splitMixedContent(text) {
  const segments = [];
  // Match {expr} including expressions with nested parens/calls but not nested braces.
  // We use a simple greedy match from { to the next } — this handles all common
  // JSX expression patterns like {name}, {count}, {new Date().toLocaleDateString()}.
  const re = /\{[^}]*\}/g;
  let last = 0,
    match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', value: text.slice(last, match.index) });
    }
    segments.push({ type: 'expr', value: match[0] });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    segments.push({ type: 'text', value: text.slice(last) });
  }
  return segments;
}

// ─── Extract human-readable text from the ESLint message string ──────────────
//
// The message looks like:
//   disallow literal string: <Text style={...}>The actual text here</Text>
//
// For multiline messages:
//   disallow literal string: <Text ...>\n              Para añadir...\n            </Text>
//
// Strategy: find the content between the LAST '>' before a '</' closing tag.
function extractTextFromMessage(msg) {
  const raw = msg.message;

  // NEW: Check for JSX attribute pattern first
  // Pattern: "Hardcoded string detected - use i18n translation: label="text""
  // or: "Hardcoded string detected - use i18n translation: description="text""
  const attrMatch = raw.match(/:\s*(\w+)="([^"]+)"\s*$/);
  if (attrMatch) {
    const [, attrName, attrValue] = attrMatch;
    return { text: attrValue, attributeName: attrName }; // Return both attribute name and value
  }

  // NEW: Check for ternary expression pattern
  // Pattern: "Hardcoded string detected - use i18n translation: condition ? 'text1' : 'text2'"
  // Extract everything after the last colon in the prefix
  const ternaryMatch = raw.match(/:\s*(.+)$/);
  if (ternaryMatch) {
    const potentialTernary = ternaryMatch[1].trim();
    // Check if it looks like a ternary (has ? and :) OR logical OR (has ||) with quotes
    if ((/\?.*:/.test(potentialTernary) || potentialTernary.includes('||')) && /['"]/.test(potentialTernary)) {
      return { text: potentialTernary, attributeName: null };
    }
  }

  // NEW: Check for simple quoted string (function args)
  // Pattern: "Hardcoded string detected: 'My String'"
  const quoteMatch = raw.match(/:\s*(['"])(.+)\1\s*$/);
  if (quoteMatch) {
    return { text: quoteMatch[2], attributeName: null };
  }

  // EXISTING: Handle JSXText (text between tags)
  // Find the last closing tag  </Something>
  const closingTagMatch = raw.match(/<\/[A-Za-z]+>\s*$/);
  if (!closingTagMatch) {
    // No closing tag — try simple >content match
    const simpleMatch = raw.match(/>([^<]+)$/);
    if (simpleMatch) {
      return { text: simpleMatch[1].replace(/\s+/g, ' ').trim(), attributeName: null };
    }

    // FINAL FALLBACK: Check for any quoted string in the message suffix (e.g. function args, Alert.alert)
    const suffixMatch = raw.match(/:\s*([^:]+)$/);
    if (suffixMatch) {
      const content = suffixMatch[1];
      const stringMatch = content.match(/(['"])(.+?)\1/);
      if (stringMatch) {
        return { text: stringMatch[2], attributeName: null };
      }
    }

    return null;
  }

  const closingTagStart = raw.lastIndexOf('</', raw.length);
  const textBeforeClose = raw.slice(0, closingTagStart);

  // Find the last '>' before the closing tag
  const lastGt = textBeforeClose.lastIndexOf('>');
  if (lastGt === -1) return null;

  const extracted = raw.slice(lastGt + 1, closingTagStart);

  // NEW: Check if content is a JSX expression {ternary}
  const jsxExprMatch = extracted.match(/^\s*\{(.+)\}\s*$/);
  if (jsxExprMatch) {
    return { text: jsxExprMatch[1].trim(), attributeName: null };
  }

  const text = extracted.replace(/\s+/g, ' ').trim();
  if (text) return { text, attributeName: null };

  return null;
}

// ─── Inject useTranslation hook + import ─────────────────────────────────────
//
// For each modified file we:
//  1. Add `import { useTranslation } from 'react-i18next';` if not present
//  2. Find the first React component body and insert `const { t } = useTranslation();`
//
// Component detection covers the most common React Native patterns:
//   const Foo = () => {          ← arrow function component
//   const Foo: React.FC = () => {
//   export default function Foo( ← function declaration
//   function Foo(                ← function declaration (no export)
//   export const Foo = () => {
//
// We find the opening `{` of the function body and insert after it.

const IMPORT_LINE = "import { useTranslation } from 'react-i18next';";
const HOOK_LINE = '  const { t } = useTranslation();';

// Patterns that identify a component function signature line.
// All we need to match is the opening line — the body `{` may come several
// lines later (multiline props, generic type params, etc.).
const COMPONENT_PATTERNS = [
  // const Foo = (...)  or  export const Foo = (
  // const Foo: React.FC<Props> = (
  // export const Foo = React.memo((
  /^\s*(?:export\s+)?const\s+[A-Z][A-Za-z0-9]*/,
  // export default function Foo(  or  function Foo(
  /^\s*(?:export\s+(?:default\s+)?)?function\s+[A-Z][A-Za-z0-9]*/,
];

function injectHook(lines) {
  // ── 1. Find the component opening line ───────────────────────────────────
  let componentLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (COMPONENT_PATTERNS.some(re => re.test(lines[i]))) {
      componentLineIdx = i;
      break;
    }
  }

  if (componentLineIdx === -1) return { injected: false, reason: 'No component signature found' };

  // ── 2. Find the opening `{` of its body ──────────────────────────────────
  // Scan forward tracking paren depth. The body `{` is the first `{` we find
  // after parens are balanced (depth back to 0) AND after we've seen either
  // `=>` or `) {` — this filters out object/StyleSheet consts.
  let bodyBraceLineIdx = -1;
  let parenDepth = 0;
  let sawArrow = false; // saw `=>`
  let sawCloseParen = false; // saw `)` at depth 0 (function params closed)

  outer: for (let i = componentLineIdx; i < Math.min(componentLineIdx + 20, lines.length); i++) {
    const line = lines[i];
    // Check for arrow on this line
    if (line.includes('=>')) sawArrow = true;

    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === '(') parenDepth++;
      else if (ch === ')') {
        parenDepth--;
        if (parenDepth === 0) sawCloseParen = true;
      } else if (ch === '{' && parenDepth === 0) {
        // Only treat as a function body if we've seen => or closed parens
        if (sawArrow || sawCloseParen) {
          bodyBraceLineIdx = i;
          break outer;
        }
      }
    }
  }

  if (bodyBraceLineIdx === -1) return { injected: false, reason: 'Could not find function body {' };

  // ── 3. Check hook isn't already present in this component ────────────────
  // Look in the next 10 lines after the `{`
  const lookAhead = lines.slice(bodyBraceLineIdx + 1, bodyBraceLineIdx + 10).join('\n');
  if (lookAhead.includes('useTranslation()')) {
    return { injected: false, reason: 'Hook already present' };
  }

  // ── 4. Insert hook on the line after `{` ─────────────────────────────────
  lines.splice(bodyBraceLineIdx + 1, 0, HOOK_LINE);
  return { injected: true };
}

function injectImport(lines) {
  // Already imported? Check for an actual import line, not just any occurrence
  // (the hook line `const { t } = useTranslation()` would otherwise fool this check)
  if (lines.some(l => /import.*useTranslation/.test(l))) return false;

  // Find the last import line and insert after it
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s/.test(lines[i])) lastImportIdx = i;
  }

  const insertAt = lastImportIdx !== -1 ? lastImportIdx + 1 : 0;
  lines.splice(insertAt, 0, IMPORT_LINE);
  return true;
}

// ─── Core replacement ─────────────────────────────────────────────────────────
//
// ESLint JSXText nodes: line/column mark the START of the text node,
// endLine/endColumn mark the END (exclusive column).
// All values are 1-indexed from ESLint.
//
// We mutate the lines array in-place. To avoid offset shifting we process
// violations bottom-to-top within each file.

function performReplacement(
  lines,
  startLine0,
  startCol0,
  endLine0,
  endCol0,
  keyOrReplacement,
  rawReplacement = false,
  attributeName = null,
) {
  let replacement;

  if (rawReplacement) {
    replacement = keyOrReplacement;
  } else if (attributeName) {
    // For attributes: attributeName={t('key')}
    replacement = `${attributeName}={t('${keyOrReplacement}')}`;
  } else {
    // For JSXText: {t('key')}
    replacement = `{t('${keyOrReplacement}')}`;
  }

  if (startLine0 === endLine0) {
    const line = lines[startLine0];
    lines[startLine0] = line.slice(0, startCol0) + replacement + line.slice(endCol0);
  } else {
    // Multiline: collapse all affected lines
    const before = lines[startLine0].slice(0, startCol0);
    const after = lines[endLine0].slice(endCol0);
    lines[startLine0] = before + replacement + after;
    lines.splice(startLine0 + 1, endLine0 - startLine0);
  }
}

// ─── Load ESLint results ──────────────────────────────────────────────────────

let eslintResults;

if (INPUT_FILE) {
  console.log(c.cyan(`\n📂  Reading ESLint output from: ${INPUT_FILE}\n`));
  eslintResults = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
} else {
  console.log(c.cyan(`\n🔍  Running ESLint on ${TARGET_DIR}...\n`));
  let raw = '';
  try {
    raw = execSync(`npx eslint "${TARGET_DIR}" --format json 2>/dev/null`, {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch (e) {
    raw = e.stdout || '';
  }
  if (!raw.trim()) {
    console.error(c.red('❌  No ESLint output. Check your ESLint config.'));
    process.exit(1);
  }
  eslintResults = JSON.parse(raw);
}

// ─── Collect violations ───────────────────────────────────────────────────────

let detectedRule = RULE_FILTER;
const fileViolations = {};

for (const result of eslintResults) {
  const messages = result.messages.filter(m => {
    if (!m.ruleId) return false;
    if (RULE_FILTER) return m.ruleId === RULE_FILTER;
    if (!detectedRule) {
      const r = m.ruleId.toLowerCase();
      if (r.includes('literal') || r.includes('i18n') || r.includes('no-literal')) {
        detectedRule = m.ruleId;
        console.log(c.cyan(`📌  Auto-detected rule: ${detectedRule}\n`));
      }
    }
    return m.ruleId === detectedRule;
  });
  if (messages.length) fileViolations[result.filePath] = messages;
}

const totalViolations = Object.values(fileViolations).reduce((s, ms) => s + ms.length, 0);
if (totalViolations === 0) {
  console.log(c.green('✅  No violations found.'));
  process.exit(0);
}
console.log(c.bold(`Found ${totalViolations} violations across ${Object.keys(fileViolations).length} files.\n`));

// ─── Process files ────────────────────────────────────────────────────────────

const keyMap = {};
const skipped = [];
const hookResults = []; // [{file, imported, injected, reason}]
let replacedCount = 0;

for (const [filePath, messages] of Object.entries(fileViolations)) {
  const source = fs.readFileSync(filePath, 'utf8');
  const lines = source.split('\n');

  // Deduplicate by exact position — ESLint can report the same node multiple
  // times when it's nested (e.g. text appears in both parent and child message)
  const seen = new Set();
  const deduped = messages.filter(m => {
    const k = `${m.line}:${m.column}:${m.endLine}:${m.endColumn}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // ─── 1. Identify Candidates ──────────────────────────────────────────────
  // We first collect all potential replacements without applying them.
  // This allows us to detect overlapping regions (e.g. a ternary that contains strings).

  const candidates = [];

  // Helper to extract text from source lines
  function getTextFromRange(lines, startLine, startCol, endLine, endCol) {
    if (startLine === endLine) {
      return lines[startLine].slice(startCol, endCol);
    }
    const chunks = [];
    chunks.push(lines[startLine].slice(startCol));
    for (let i = startLine + 1; i < endLine; i++) {
      chunks.push(lines[i]);
    }
    chunks.push(lines[endLine].slice(0, endCol));
    return chunks.join('\n');
  }

  for (const msg of deduped) {
    // If suppressed or fatal error, skip
    if (msg.message.includes('Parsing error')) continue;
    // Convert to 0-indexed
    const startLine0 = msg.line - 1;
    const startCol0 = msg.column - 1;
    const endLine0 = msg.endLine - 1;
    const endCol0 = msg.endColumn - 1; // exclusive if endColumn is 1-based exclusive

    // Extract text from source (most reliable)
    // ESLint 'endColumn' is usually 1-based exclusive index
    let extracted = getTextFromRange(lines, startLine0, startCol0, endLine0, endCol0);

    // Get attribute name if possible from message (fallback to null)
    let attributeName = null;
    const extractResult = extractTextFromMessage(msg);
    if (extractResult && extractResult.attributeName) {
      attributeName = extractResult.attributeName;
    }

    if (!extracted) {
      skipped.push({
        file: filePath,
        line: msg.line,
        reason: 'Could not extract text',
        raw: msg.message.slice(0, 100),
      });
      continue;
    }

    // Adjust start position filters for attributes if needed?
    // If we extracted from range, we have the exact value.
    // If attributeName is present, we might want to check if extracting `attr="val"` vs `"val"`.
    // Usually i18next rule points to "val".

    let adjustedStartCol0 = startCol0;

    // Source-Based Attribute Detection
    // Always check source backwards first, as it's more reliable for attribute assignment.

    // Check if 'line' BEFORE startCol0 ends with "=" (Violation is just value)
    if (startLine0 === endLine0) {
      const line = lines[startLine0];
      let prefix = line.slice(0, startCol0).trimEnd();

      // If prefix ends with quote, remove it (it's the opening quote of the value)
      if (/['"]$/.test(prefix)) {
        prefix = prefix.slice(0, -1).trimEnd();
      }

      if (prefix.endsWith('=')) {
        // It is likely an attribute assignment. Find the attribute name.
        const beforeEqual = prefix.slice(0, prefix.length - 1).trimEnd();
        const nameMatch = beforeEqual.match(/([a-zA-Z0-9_\-]+)$/);
        if (nameMatch) {
          attributeName = nameMatch[1];
          // Adjust startCol0 back to start of attribute name
          // We can find the index of this match in the original line
          // search backwards from startCol0
          const nameIndex = line.lastIndexOf(attributeName, startCol0);
          if (nameIndex !== -1) {
            adjustedStartCol0 = nameIndex;
          }
        }
      }
    }

    // Fallback: Check if 'extracted' itself starts with "attr=" (Violation included attribute)
    if (!attributeName) {
      const attrMatch = extracted.match(/^([a-zA-Z0-9_\-]+)=/);
      if (attrMatch) {
        attributeName = attrMatch[1];
      }
    }

    const normalizedExtracted = extracted
      .replace(/\{['"]\s+['"]\}/g, ' ') // Turn {' '} into space immediately
      .replace(/\s+/g, ' ') // Collapse all whitespace
      .trim(); // Trim edges

    // Check if we should skip or if we have a replacement (recursive/ternary)
    const check = shouldSkip(normalizedExtracted, keyMap, filePath);

    if (check.skip) {
      skipped.push({ file: filePath, line: msg.line, reason: check.reason, text: extracted });
      continue;
    }

    candidates.push({
      msg,
      startLine0,
      startCol0: adjustedStartCol0, // Use adjusted col for replacement start if it's an attribute
      endLine0,
      endCol0,
      extracted,
      normalizedExtracted,
      attributeName,
      replacement: check.replacement,
      activeTernary: check.ternary,
      logicalOr: check.logicalOr,
      mixed: check.mixed,
    });
  }

  // ─── 2. Filter Overlaps ──────────────────────────────────────────────────
  // If Candidate A contains Candidate B, we usually want to keep Candidate A
  // if A is a "complex" replacement (ternary) and B is just a literal inside it.

  const finalCandidates = candidates.filter(inner => {
    // Check if any OTHER candidate contains this one
    const isContained = candidates.some(outer => {
      if (inner === outer) return false;

      // Strict containment check
      const startsAfter =
        outer.startLine0 < inner.startLine0 ||
        (outer.startLine0 === inner.startLine0 && outer.startCol0 <= inner.startCol0);

      const endsBefore =
        outer.endLine0 > inner.endLine0 || (outer.endLine0 === inner.endLine0 && outer.endCol0 >= inner.endCol0);

      const contains = startsAfter && endsBefore;

      // If the outer candidate has a computed replacement (like a ternary),
      // it supersedes the inner literal.
      if (contains && outer.replacement) {
        return true;
      }

      // If both are just literals? ESLint shouldn't usually report overlapping literals
      // unless one is a child node. We prefer the outer one usually.
      if (contains) {
        // If outer is mixed content and inner is a part of it?
        // Prefer outer coverage.
        return true;
      }

      return false;
    });

    return !isContained;
  });

  // ─── 3. Sort Bottom-to-Top ───────────────────────────────────────────────
  // Crucial for modifying file content without shifting indices of upcoming replacements
  finalCandidates.sort((a, b) => {
    if (a.startLine0 !== b.startLine0) return b.startLine0 - a.startLine0;
    return b.startCol0 - a.startCol0;
  });

  // ─── 4. Apply Replacements ───────────────────────────────────────────────
  for (const item of finalCandidates) {
    const {
      startLine0,
      startCol0,
      endLine0,
      endCol0,
      normalizedExtracted,
      replacement: existingReplacement, // Rename to allow mutable 'replacement' var later
      mixed,
      attributeName,
      logicalOr,
    } = item;

    // Use a mutable variable for the final string we apply
    let replacement = existingReplacement;

    // Case A: Recursive replacement (Ternaries, already fully formed)
    if (replacement) {
      if (attributeName) {
        // If we found an attribute (e.g. placeholder="..."), wrap the replacement
        // replacement is already "t('key')" or similar.
        replacement = `${attributeName}={${replacement}}`;
      }
      performReplacement(lines, startLine0, startCol0, endLine0, endCol0, replacement, /* rawReplacement */ true);
      replacedCount++;
      continue;
    }

    // Case B: Logical OR (handled in main loop if shouldSkip didn't return full replacement,
    // but typically parseRecursive handles simple cases. If shouldSkip detected it explicitly:
    if (logicalOr) {
      let leftRep = logicalOr.leftValue
        ? `t('${uniqueKey(logicalOr.leftValue, keyMap, filePath)}')`
        : logicalOr.leftRaw;
      let rightRep = logicalOr.rightValue
        ? `t('${uniqueKey(logicalOr.rightValue, keyMap, filePath)}')`
        : logicalOr.rightRaw;

      // Add to keyMap if literals
      if (logicalOr.leftValue) keyMap[uniqueKey(logicalOr.leftValue, keyMap, filePath)] = logicalOr.leftValue;
      if (logicalOr.rightValue) keyMap[uniqueKey(logicalOr.rightValue, keyMap, filePath)] = logicalOr.rightValue;

      performReplacement(lines, startLine0, startCol0, endLine0, endCol0, `${leftRep} || ${rightRep}`, true);
      replacedCount++;
      continue;
    }

    // Case C: Mixed content ({expr} text {expr})
    if (mixed) {
      const segments = splitMixedContent(normalizedExtracted);
      const hasTranslatableText = segments.some(s => {
        if (s.type !== 'text') return false;
        const { skip: skipSeg } = shouldSkip(s.value);
        return !skipSeg;
      });

      if (!hasTranslatableText) {
        skipped.push({
          file: filePath,
          line: item.msg.line,
          reason: 'Mixed content — no translatable text segments',
          text: normalizedExtracted,
        });
        continue;
      }

      const mixedReplacement = segments
        .map(seg => {
          if (seg.type === 'expr') return seg.value;
          const { skip: skipSeg } = shouldSkip(seg.value);
          if (skipSeg) return seg.value;
          const k = uniqueKey(seg.value.trim(), keyMap, filePath);
          keyMap[k] = seg.value.trim();
          return `{t('${k}')}`;
        })
        .join('');

      // If we are in an attribute, we need to be careful?
      // Mixed content usually implies JSX text children.
      // If it was an attribute, extractTextFromMessage would likely not return mixed content
      // in a way that needs this handling, or it would be a template literal (skipped).

      if (attributeName) {
        // This path is rare for clean code, but possible.
        // `someProp="Hello {name}"` is not valid JSX. `someProp={"Hello " + name}` is.
        // `splitMixedContent` is designed for JSX children.
        // Fallback for attributes: assume it's just a string, but if mixed detected,
        // it might be a false positive or complex case.
        // Just accept it for now.
      }

      performReplacement(lines, startLine0, startCol0, endLine0, endCol0, mixedReplacement, true);
      replacedCount++;
      continue;
    }

    // Case D: Standard Literal
    const k = uniqueKey(normalizedExtracted, keyMap, filePath);
    keyMap[k] = normalizedExtracted;

    // Determine replacement format to avoid syntax errors in existing expressions
    if (attributeName) {
      // Attribute: prop="value" -> prop={t('key')}
      replacement = `${attributeName}={t('${k}')}`;
    } else {
      // Check if the original source was a quoted string literal (e.g. inside ternary or logic)
      // If it is quoted, we should NOT add braces around t().
      const sourceSlice = lines[startLine0].slice(startCol0, endCol0).trim();
      const isQuoted = /^['"`]/.test(sourceSlice);

      if (isQuoted) {
        replacement = `t('${k}')`;
      } else {
        // If it's JSX Text (unquoted), we must wrap in braces: {t('key')}
        replacement = `{t('${k}')}`;
      }
    }

    // Perform replacement (always raw=true now that we handle braces manually)
    performReplacement(lines, startLine0, startCol0, endLine0, endCol0, replacement, /* rawReplacement */ true);
    replacedCount++;
  }

  // ── Inject hook + import into modified files ──────────────────────────────
  if (replacedCount > 0 || lines.join('\n') !== source) {
    const hookResult = injectHook(lines);
    const imported = injectImport(lines);
    hookResults.push({
      file: filePath,
      imported,
      injected: hookResult.injected,
      reason: hookResult.reason,
    });
  }

  const newSource = lines.join('\n');
  if (!DRY_RUN) {
    fs.writeFileSync(filePath, newSource, 'utf8');
  } else {
    const rel = path.relative(process.cwd(), filePath);
    console.log(c.dim(`  [dry-run] Would update: ${rel} (${finalCandidates.length} violations matched)`));
  }
}

// ─── Output ───────────────────────────────────────────────────────────────────

/**
 * Convert flat dot-key map → nested object, e.g.:
 *   { "training.guardarCambios": "Guardar cambios" }
 *   → { training: { guardarCambios: "Guardar cambios" } }
 */
function toNestedObject(flatMap) {
  const out = {};
  for (const [dotKey, value] of Object.entries(flatMap)) {
    const parts = dotKey.split('.');
    let node = out;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]] || typeof node[parts[i]] === 'string') {
        node[parts[i]] = {};
      }
      node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = value;
  }
  return out;
}

const nested = toNestedObject(keyMap);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(nested, null, 2), 'utf8');
if (!DRY_RUN) {
  console.log(c.green(`\n✅  Done!`));
  console.log(c.green(`   • ${replacedCount} strings replaced`));
  console.log(c.green(`   • ${Object.keys(keyMap).length} unique keys generated`));
  console.log(c.green(`   • Mapping saved to: ${OUTPUT_FILE}`));

  // Hook injection summary
  const injectedOk = hookResults.filter(r => r.injected);
  const injectedFail = hookResults.filter(r => !r.injected && r.reason !== 'Hook already present');
  const alreadyHad = hookResults.filter(r => r.reason === 'Hook already present');

  if (injectedOk.length) console.log(c.green(`   • useTranslation() hook injected into ${injectedOk.length} file(s)`));
  if (alreadyHad.length) console.log(c.dim(`   • ${alreadyHad.length} file(s) already had the hook`));
  if (injectedFail.length) {
    console.log(c.red(`\n⚠️   Could not inject hook into ${injectedFail.length} file(s) — add manually:`));
    injectedFail.forEach(r => {
      const rel = path.relative(process.cwd(), r.file);
      console.log(c.red(`   ${rel}`) + c.dim(` — ${r.reason}`));
    });
  }
} else {
  const nested = toNestedObject(keyMap);
  console.log(c.dim(`\n[dry-run] Would write ${Object.keys(keyMap).length} keys to ${OUTPUT_FILE}`));
  console.log(JSON.stringify(nested, null, 2));
}

if (skipped.length > 0) {
  console.log(c.red(`\n⚠️   Skipped ${skipped.length} items — manual fix needed:`));
  skipped.slice(0, 40).forEach(s => {
    const rel = path.relative(process.cwd(), s.file);
    console.log(
      c.red(`   ${rel}:${s.line}`) + c.dim(` — ${s.reason}`) + (s.text ? c.yellow(` ("${s.text.slice(0, 70)}")`) : ''),
    );
  });
  if (skipped.length > 40) console.log(`   … and ${skipped.length - 40} more`);
  fs.writeFileSync('translations-skipped.json', JSON.stringify(skipped, null, 2), 'utf8');
  console.log(c.yellow(`\n   Full skip list → translations-skipped.json`));
}
