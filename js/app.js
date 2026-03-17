// app.js
document.addEventListener('DOMContentLoaded', () => {
    // ---------- CONFIG ----------
    const ROUND_COUNTDOWN = 3; // cuenta regresiva breve (segundos)
    const LETTER_TIMEOUT = 15; // 15 segundos por letra
    const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split(''); // sin ñ

    // Referencias DOM
    const startBtn = document.getElementById('startBtn');
    const nextBtn = document.getElementById('nextBtn');
    const exitBtn = document.getElementById('exitBtn');
    const questionText = document.getElementById('questionText');
    const countdownEl = document.getElementById('countdown');
    const timeLeftEl = document.getElementById('timeLeft');
    const timerBar = document.getElementById('timerBar');
    const alphabetContainer = document.getElementById('alphabetContainer');
    const statusMessage = document.getElementById('statusMessage');

    // Audios (pon tus archivos en assets/audio con estos nombres)
    const audioStart = document.getElementById('audio-start');
    const audioBeep = document.getElementById('audio-beep');
    const audioError = document.getElementById('audio-error');
    const audioKey = document.getElementById('audio-key');
    const audioSuccess = document.getElementById('audio-success');

    // Preguntas (30) — cosas del súper / categorías donde se usan todas las letras
    const QUESTIONS = [
        "Cosas que compras en el supermercado",
        "Nombres de hombres",
        "Nombres de mujeres",
        "Ciudades del mundo",
        "Cosas que encuentras en la casa",
        "Palabras relacionadas con la iglesia",
        "Palabras relacionadas con la escuela"
    ];

    // Estado del juego
    let shuffledQuestions = [];
    let currentIndex = -1;
    let roundActive = false; // true cuando el alfabeto está activo
    let letterTimer = null;
    let timeLeft = LETTER_TIMEOUT;
    let usedLetters = new Set();

    // ---------- UTIL ----------

    // Barrita visual
    function updateTimerBar() {
        const percent = (timeLeft / LETTER_TIMEOUT) * 100;
        timerBar.style.width = percent + '%';
        timeLeftEl.textContent = timeLeft;
    }

    // Shuffle (Fisher-Yates)
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ---------- PREGUNTAS ----------

    function prepareQuestions() {
        shuffledQuestions = shuffle(QUESTIONS).slice(0, 30); // asegurar 30 aleatorias si hay más
        currentIndex = -1;
    }

    function nextQuestion() {
        currentIndex++;
        if (currentIndex >= shuffledQuestions.length) {
            // Terminar juego
            questionText.textContent = "Se terminaron las preguntas. ¡Gracias por jugar!";
            statusMessage.textContent = "Pulsa 'Iniciar' para reiniciar.";
            roundActive = false;
            return;
        }
        const q = shuffledQuestions[currentIndex];
        questionText.textContent = q;
        statusMessage.textContent = `Pregunta ${currentIndex + 1} / ${shuffledQuestions.length}`;
        resetAlphabet();
        beginRoundCountdown();
    }

    // ---------- ALFABETO ----------

    function buildAlphabet() {
        alphabetContainer.innerHTML = '';
        ALPHABET.forEach(letter => {
            const box = document.createElement('div');
            box.className = 'alpha-box';
            box.dataset.letter = letter;
            box.textContent = letter.toUpperCase();
            box.title = `Presiona "${letter}" en tu teclado`;
            box.addEventListener('click', () => handleLetter(letter));
            alphabetContainer.appendChild(box);
        });
    }

    function markLetterUsed(letter, pressed = true) {
        const node = alphabetContainer.querySelector(`[data-letter="${letter}"]`);
        if (!node) return;
        node.classList.add('used');
        if (pressed) node.classList.add('pressed');
        node.removeEventListener('click', () => handleLetter(letter));
        // visual
    }

    function resetAlphabet() {
        usedLetters.clear();
        const nodes = alphabetContainer.querySelectorAll('.alpha-box');
        nodes.forEach(n => {
            n.className = 'alpha-box';
            n.style.pointerEvents = 'auto';
        });
        // reset timer display
        timeLeft = LETTER_TIMEOUT;
        updateTimerBar();
    }

    // ---------- TIMER LETTER ----------

    function startLetterTimer() {
        clearInterval(letterTimer);
        timeLeft = LETTER_TIMEOUT;
        updateTimerBar();
        letterTimer = setInterval(() => {
            timeLeft--;
            updateTimerBar();
            if (timeLeft <= 0) {
                clearInterval(letterTimer);
                // sonar error
                if (audioError) {
                    try {
                        audioError.currentTime = 0;
                        audioError.play();
                    } catch (e) {}
                }
                // mostrar aviso breve
                statusMessage.textContent = "Tiempo! presiona cualquier letra para continuar (se reinicia el temporizador).";
                // no inactivamos el juego: el jugador puede seguir presionando letras
            }
        }, 1000);
    }

    function resetLetterTimer() {
        timeLeft = LETTER_TIMEOUT;
        updateTimerBar();
    }

    // ---------- EVENTOS DE TECLADO ----------

    function handleLetter(key) {
        if (!roundActive) return;
        if (!key) return;
        key = key.toLowerCase();
        if (!ALPHABET.includes(key)) return;
        if (usedLetters.has(key)) return;

        // marcar usada
        usedLetters.add(key);
        markLetterUsed(key, true);

        // reproducir sonido tecla
        if (audioKey) {
            try {
                audioKey.currentTime = 0;
                audioKey.play();
            } catch (e) {}
        }

        // reiniciar temporizador
        resetLetterTimer();

        // comprobar final de ronda
        if (usedLetters.size === ALPHABET.length) {
            // ganado/completado
            roundActive = false;
            clearInterval(letterTimer);
            statusMessage.textContent = "Ronda completada: presiona ➡️ para siguiente pregunta";
            if (audioSuccess) {
                try {
                    audioSuccess.currentTime = 0;
                    audioSuccess.play();
                } catch (e) {}
            }
        } else {
            statusMessage.textContent = `Presionaste "${key.toUpperCase()}". Letras usadas: ${usedLetters.size}/${ALPHABET.length}`;
        }
    }

    // teclado
    document.addEventListener('keydown', (ev) => {
        if (!roundActive && ev.key.toLowerCase() === 'q') {
            // Q for next (como atajo)
            nextBtn.click();
            return;
        }
        const k = ev.key.toLowerCase();
        // solo letras a-z
        if (ALPHABET.includes(k)) {
            handleLetter(k);
        } else if (k === 'x') {
            // X comportamiento: marcar "incorrecta" -> sólo reproducir sonido de error y rotar mensaje
            if (audioError) {
                try {
                    audioError.currentTime = 0;
                    audioError.play();
                } catch (e) {}
            }
            statusMessage.textContent = "Marca de error (tecla X). Continúa eligiendo letras.";
            resetLetterTimer();
        } else if (k === 'o') {
            // O as toggle: skip/disable? en este juego lo usamos para 'activar/desactivar' modo (no implementado)
            // simplemente reinicia el timer
            resetLetterTimer();
            statusMessage.textContent = "Temporizador reiniciado (tecla O).";
        }
    });

    // ---------- RONDA: cuenta regresiva antes del inicio ----------

    function beginRoundCountdown() {
        // mostrar cuenta regresiva
        let n = ROUND_COUNTDOWN;
        countdownEl.textContent = n;
        countdownEl.classList.remove('hidden');
        if (audioBeep) {
            try {
                audioBeep.currentTime = 0;
                audioBeep.play();
            } catch (e) {}
        }
        const cd = setInterval(() => {
            n--;
            if (n <= 0) {
                clearInterval(cd);
                countdownEl.classList.add('hidden');
                // sonido de inicio
                if (audioStart) {
                    try {
                        audioStart.currentTime = 0;
                        audioStart.play();
                    } catch (e) {}
                }
                // activar fase de juego
                roundActive = true;
                statusMessage.textContent = "Ronda iniciada: presiona letras (15s por inactividad).";
                startLetterTimer();
            } else {
                countdownEl.textContent = n;
                if (audioBeep) {
                    try {
                        audioBeep.currentTime = 0;
                        audioBeep.play();
                    } catch (e) {}
                }
            }
        }, 1000);
    }

    // ---------- BOTONES ----------

    startBtn.addEventListener('click', () => {
        // si no hay preguntas preparadas, preparar
        if (!shuffledQuestions.length) prepareQuestions();
        // si el juego ya empezó y hay ronda activa, ignorar
        if (roundActive) {
            statusMessage.textContent = "Ronda en curso.";
            return;
        }
        // si no hay pregunta cargada, cargar siguiente
        if (currentIndex === -1 || currentIndex >= shuffledQuestions.length) {
            nextQuestion();
        } else {
            // si ya hay pregunta, simplemente iniciar la cuenta regresiva del round actual
            beginRoundCountdown();
        }
    });

    nextBtn.addEventListener('click', () => {
        // pasar a siguiente pregunta
        clearInterval(letterTimer);
        roundActive = false;
        nextQuestion();
    });

    exitBtn.addEventListener('click', () => {
        // finalizar (aquí recarga la página o navega)
        if (confirm("¿Deseas salir del juego?")) {
            location.reload();
        }
    });

    // ---------- INICIALIZAR UI ----------
    buildAlphabet();
    prepareQuestions();
    questionText.textContent = 'Pulsa Iniciar para comenzar la primera ronda';
    statusMessage.textContent = 'Juego listo — 30 preguntas aleatorias.';
    updateTimerBar();
});