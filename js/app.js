// ESTADO GLOBAL DE LA APLICACIÓN
const AppState = {
    currentModule: null,
    questions: [],
    currentIndex: 0,
    score: 0,
    userAnswers: [],
    streak: 0,
    maxStreak: 0,
    startTime: null,
    endTime: null
};

// ============================================
// GESTIÓN DE NAVEGACIÓN ENTRE PANTALLAS
// ============================================
function showScreen(screenId) {
    document.querySelectorAll('section').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
    
    // Actualizar UI según la pantalla
    if (screenId === 'home-screen') loadProgress();
    if (screenId === 'quiz-screen') updateProgressBar();
}

function goHome() {
    saveProgress();
    showScreen('home-screen');
}

// ============================================
// INICIO DEL QUIZ POR MÓDULO
// ============================================
async function startQuiz(module) {
    AppState.currentModule = module;
    AppState.currentIndex = 0;
    AppState.score = 0;
    AppState.userAnswers = [];
    AppState.streak = 0;
    AppState.maxStreak = 0;
    AppState.startTime = new Date();
    
    try {
        // Cargar preguntas desde JSON
        await loadQuestions(module);
        
        // Renderizar primera pregunta
        renderQuestion();
        
        // Mostrar pantalla del quiz
        showScreen('quiz-screen');
    } catch (error) {
        console.error('Error cargando preguntas:', error);
        alert('No se pudieron cargar las preguntas. Verifica el archivo JSON.');
    }
}

// ============================================
// CARGA DE PREGUNTAS DESDE JSON
// ============================================
async function loadQuestions(module) {
    const response = await fetch(`data/${module}.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    AppState.questions = data[module] || [];

    // Mezclar preguntas aleatoriamente sin repetir
    AppState.questions = shuffleArray(questions);
    
    // Actualizar contador de preguntas
    document.getElementById('total-questions').textContent = AppState.questions.length;
}

// ============================================
// RENDERIZADO DE PREGUNTA
// ============================================
function renderQuestion() {
    const question = AppState.questions[AppState.currentIndex];
    
    // Actualizar números de pregunta
    document.getElementById('current-question').textContent = AppState.currentIndex + 1;
    
    // Actualizar texto de la pregunta
    document.getElementById('question-text').textContent = question.question;

    // Mezclar opciones de respuesta (opcional)
    const shuffledOptions = shuffleArray([...question.options]);
    
    // Renderizar opciones dinámicamente
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    question.options.forEach(option => {
        const label = document.createElement('label');
        label.className = 'flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition';
        label.innerHTML = `
            <input type="radio" name="answer" value="${option.id}" class="w-5 h-5 mr-4">
            <span class="text-lg">${option.id}) ${option.text}</span>
        `;
        optionsContainer.appendChild(label);
    });
    
    // Resetear selección previa
    document.querySelectorAll('input[name="answer"]').forEach(radio => {
        radio.checked = false;
    });
    
    // Actualizar barra de progreso
    updateProgressBar();
}

// ============================================
// BARRA DE PROGRESO
// ============================================
function updateProgressBar() {
    const progress = ((AppState.currentIndex) / AppState.questions.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
}

// ============================================
// VALIDAR RESPUESTA Y MOSTRAR FEEDBACK
// ============================================
function showFeedback() {
    const selectedOption = document.querySelector('input[name="answer"]:checked');
    
    if (!selectedOption) {
        alert('Por favor selecciona una respuesta');
        return;
    }
    
    const question = AppState.questions[AppState.currentIndex];
    const userAnswer = selectedOption.value;
    const isCorrect = userAnswer === question.correctAnswer;
    
    // Registrar respuesta del usuario
    AppState.userAnswers.push({
        questionId: question.id,
        userAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect
    });
    
    // Actualizar puntuación y racha
    if (isCorrect) {
        AppState.score += 100;
        AppState.streak++;
        AppState.maxStreak = Math.max(AppState.maxStreak, AppState.streak);
        document.getElementById('feedback-title').textContent = '✅ CORRECTO';
        document.getElementById('feedback-title').className = 'text-3xl font-semibold mb-12 text-green-400';
    } else {
        AppState.streak = 0;
        document.getElementById('feedback-title').textContent = '❌ INCORRECTO';
        document.getElementById('feedback-title').className = 'text-3xl font-semibold mb-12 text-red-400';
    }
    
    // Mostrar explicación
    document.getElementById('explanation-text').textContent = question.explanation;
    
    // Mostrar pantalla de feedback
    showScreen('feedback-screen');
}

// ============================================
// SIGUIENTE PREGUNTA O FINALIZAR
// ============================================
function nextQuestion() {
    AppState.currentIndex++;
    
    if (AppState.currentIndex < AppState.questions.length) {
        // Hay más preguntas
        renderQuestion();
        showScreen('quiz-screen');
    } else {
        // Quiz completado
        finishQuiz();
    }
}

// ============================================
// FINALIZAR QUIZ - MOSTRAR RESULTADOS
// ============================================
function finishQuiz() {
    AppState.endTime = new Date();
    
    // Calcular estadísticas
    const correctAnswers = AppState.userAnswers.filter(a => a.isCorrect).length;
    const totalTime = formatTime(AppState.endTime - AppState.startTime);
    
    // Actualizar UI de resultados
    document.getElementById('final-score').textContent = `${AppState.score} PUNTOS`;
    document.getElementById('stats-correct').textContent = `${correctAnswers}/${AppState.questions.length}`;
    document.getElementById('stats-time').textContent = totalTime;
    document.getElementById('stats-streak').textContent = AppState.maxStreak;
    
    // Guardar progreso en LocalStorage
    saveProgress();
    
    // Mostrar pantalla de completado
    showScreen('completed-screen');
}

// ============================================
// FORMATO DE TIEMPO (mm:ss)
// ============================================
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ============================================
// PERSISTENCIA CON LOCALSTORAGE
// ============================================
function saveProgress() {
    // Obtener progreso existente
    const existingPoints = parseInt(localStorage.getItem('tcs_points')) || 0;
    const existingCompleted = JSON.parse(localStorage.getItem('tcs_completed_modules')) || [];
    
    // Actualizar puntos totales
    const newPoints = existingPoints + AppState.score;
    localStorage.setItem('tcs_points', newPoints);
    
    // Registrar módulo completado si no está ya
    if (!existingCompleted.includes(AppState.currentModule)) {
        existingCompleted.push(AppState.currentModule);
        localStorage.setItem('tcs_completed_modules', JSON.stringify(existingCompleted));
    }
    
    // Guardar mejor puntuación por módulo
    const moduleScores = JSON.parse(localStorage.getItem('tcs_module_scores')) || {};
    if (!moduleScores[AppState.currentModule] || AppState.score > moduleScores[AppState.currentModule]) {
        moduleScores[AppState.currentModule] = AppState.score;
        localStorage.setItem('tcs_module_scores', JSON.stringify(moduleScores));
    }
}

function loadProgress() {
    const points = localStorage.getItem('tcs_points') || 0;
    const completed = JSON.parse(localStorage.getItem('tcs_completed_modules')) || [];
    
    document.getElementById('total-points').textContent = points;
    document.getElementById('completed-modules').textContent = `${completed.length}/3`;
}

// ============================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Cargar progreso inicial
    loadProgress();
    
    // Registrar Service Worker si está disponible
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registrado:', reg.scope))
            .catch(err => console.log('SW error:', err));
    }
    
    // Manejar instalación PWA
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        // Aquí podrías mostrar un botón personalizado de instalación
        console.log('PWA lista para instalar');
    });
});

// ============================================
// UTILIDADES ADICIONALES
// ============================================

// Obtener respuesta seleccionada (para uso externo si es necesario)
function getSelectedAnswer() {
    const selected = document.querySelector('input[name="answer"]:checked');
    return selected ? selected.value : null;
}

// Reiniciar quiz actual
function restartQuiz() {
    AppState.currentIndex = 0;
    AppState.score = 0;
    AppState.userAnswers = [];
    AppState.streak = 0;
    renderQuestion();
    showScreen('quiz-screen');
}

// Manejar instalación de PWA
let deferredPrompt;
const installButton = document.getElementById('install-button');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installButton.classList.remove('hidden');
});

installButton.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuario ${outcome} la instalación`);
    deferredPrompt = null;
    installButton.classList.add('hidden');
  }
});

window.addEventListener('appinstalled', () => {
  console.log('PWA instalada exitosamente');
  installButton.classList.add('hidden');
});

// ============================================
// UTILIDAD: MEZCLAR ARRAY (Fisher-Yates Shuffle)
// ============================================
function shuffleArray(array) {
    // Crear una copia para no modificar el original
    const shuffled = [...array];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // Intercambiar elementos
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
}

// Exportar funciones para uso global
window.startQuiz = startQuiz;
window.showFeedback = showFeedback;
window.nextQuestion = nextQuestion;
window.goHome = goHome;
window.restartQuiz = restartQuiz;