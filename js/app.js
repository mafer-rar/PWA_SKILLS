// Navegación entre pantallas
    function showScreen(screenId) {
        document.querySelectorAll('section').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }

    function startQuiz(module) {
        showScreen('quiz-screen');
    }

    function showFeedback() {
        showScreen('feedback-screen');
    }

    function nextQuestion() {
        // Aquí iría la lógica para cargar la siguiente pregunta
        showScreen('quiz-screen');
    }

    function goHome() {
        showScreen('home-screen');
    }

// Cargar progreso desde LocalStorage
    function loadProgress() {
        const points = localStorage.getItem('tcs_points') || 0;
        const completed = localStorage.getItem('tcs_completed') || 0;
        document.getElementById('total-points').textContent = points;
        document.getElementById('completed-modules').textContent = `${completed}/3`;
    }

// Inicializar
    loadProgress();