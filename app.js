// ===========================================
// ЛОГИКА ТЕСТА
// ===========================================

let ALL_QUESTIONS = [];
let quizQuestions = [];   // выбранные/перемешанные вопросы для текущей попытки
let userAnswers = [];     // индексы выбранных ответов (или null)
let currentIndex = 0;
let timerInterval = null;
let secondsLeft = 0;
let startTime = null;
let studentName = "";

const screenStart  = document.getElementById('screen-start');
const screenQuiz   = document.getElementById('screen-quiz');
const screenResult = document.getElementById('screen-result');

const startSub   = document.getElementById('start-sub');
const btnStart   = document.getElementById('btn-start');
const startError = document.getElementById('start-error');
const fioInput   = document.getElementById('fio');
const qcountSel  = document.getElementById('qcount');

const qPosition    = document.getElementById('q-position');
const timerEl      = document.getElementById('timer');
const progressFill = document.getElementById('progress-fill');
const qcard        = document.getElementById('qcard');
const qtext        = document.getElementById('qtext');
const optionsEl    = document.getElementById('options');
const btnPrev      = document.getElementById('btn-prev');
const btnNext      = document.getElementById('btn-next');

const scoreRing  = document.getElementById('score-ring');
const scoreNum   = document.getElementById('score-num');
const resultTitle = document.getElementById('result-title');
const resultSub  = document.getElementById('result-sub');

document.title = CONFIG.TEST_TITLE;
document.querySelector('h1').textContent = CONFIG.TEST_TITLE;
startSub.textContent = CONFIG.TEST_SUBTITLE;

// ---------- ЗАГРУЗКА БАЗЫ ВОПРОСОВ ----------
fetch('data/questions.json')
  .then(r => {
    if (!r.ok) throw new Error('Файл с вопросами не найден');
    return r.json();
  })
  .then(data => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('База вопросов пуста');
    }
    ALL_QUESTIONS = data;
    startSub.textContent = `В базе ${ALL_QUESTIONS.length} вопрос(ов). Заполните имя и начните тест.`;
    btnStart.disabled = false;
    btnStart.textContent = 'Начать тест';
  })
  .catch(err => {
    startError.textContent = 'Ошибка загрузки базы вопросов: ' + err.message;
    startError.classList.remove('hidden');
    btnStart.textContent = 'Недоступно';
  });

// ---------- ЗАЩИТА ОТ ПОВТОРНОГО ПРОХОЖДЕНИЯ ----------
function normalizeName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function hasAlreadyTaken(name) {
  const taken = JSON.parse(localStorage.getItem('quiz_taken_names') || '[]');
  return taken.includes(normalizeName(name));
}

function markAsTaken(name) {
  const taken = JSON.parse(localStorage.getItem('quiz_taken_names') || '[]');
  const norm = normalizeName(name);
  if (!taken.includes(norm)) {
    taken.push(norm);
    localStorage.setItem('quiz_taken_names', JSON.stringify(taken));
  }
}

// ---------- УТИЛИТЫ ----------
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ---------- СТАРТ ТЕСТА ----------
btnStart.addEventListener('click', () => {
  const name = fioInput.value.trim();
  startError.classList.add('hidden');

  if (!name) {
    showStartError('Пожалуйста, введите фамилию и имя.');
    return;
  }
  if (hasAlreadyTaken(name)) {
    showStartError('Вы уже проходили этот тест с этим именем на этом устройстве. Повторное прохождение запрещено.');
    return;
  }

  studentName = name;

  // выбор количества вопросов
  let pool = shuffle(ALL_QUESTIONS);
  let count;
  if (qcountSel.value === 'all') {
    count = pool.length;
  } else {
    count = Math.min(parseInt(qcountSel.value, 10) || CONFIG.DEFAULT_QUESTION_COUNT, pool.length);
  }
  pool = pool.slice(0, count);

  // перемешать вопросы и ответы внутри каждого вопроса
  quizQuestions = pool.map(q => {
    const optionIndices = shuffle(q.answers.map((_, i) => i));
    return {
      question: q.question,
      answers: optionIndices.map(i => q.answers[i]),
      correct: optionIndices.indexOf(q.correct)
    };
  });

  userAnswers = new Array(quizQuestions.length).fill(null);
  currentIndex = 0;
  secondsLeft = CONFIG.TIME_LIMIT_MINUTES * 60;
  startTime = new Date();

  screenStart.classList.add('hidden');
  screenQuiz.classList.remove('hidden');

  renderQuestion();
  startTimer();
});

function showStartError(msg) {
  startError.textContent = msg;
  startError.classList.remove('hidden');
}

// ---------- ТАЙМЕР ----------
function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    secondsLeft--;
    updateTimerDisplay();
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      finishQuiz(true);
    }
  }, 1000);
}

function updateTimerDisplay() {
  timerEl.textContent = formatTime(Math.max(secondsLeft, 0));
  if (secondsLeft <= 60) {
    timerEl.classList.add('warning');
  } else {
    timerEl.classList.remove('warning');
  }
}

// ---------- РЕНДЕР ВОПРОСА ----------
function renderQuestion() {
  const q = quizQuestions[currentIndex];

  qPosition.textContent = `Вопрос ${currentIndex + 1} из ${quizQuestions.length}`;
  progressFill.style.width = `${((currentIndex) / quizQuestions.length) * 100}%`;

  qtext.textContent = q.question;
  optionsEl.innerHTML = '';

  const letters = ['А','Б','В','Г','Д','Е','Ж','З'];

  q.answers.forEach((answerText, idx) => {
    const opt = document.createElement('div');
    opt.className = 'option';
    if (userAnswers[currentIndex] === idx) opt.classList.add('selected');

    const letter = document.createElement('div');
    letter.className = 'letter';
    letter.textContent = letters[idx] || (idx + 1);

    const txt = document.createElement('div');
    txt.textContent = answerText;

    opt.appendChild(letter);
    opt.appendChild(txt);

    opt.addEventListener('click', () => {
      userAnswers[currentIndex] = idx;
      renderQuestion();
    });

    optionsEl.appendChild(opt);
  });

  // re-trigger animation
  qcard.style.animation = 'none';
  requestAnimationFrame(() => { qcard.style.animation = ''; });

  btnPrev.disabled = currentIndex === 0;
  btnNext.textContent = (currentIndex === quizQuestions.length - 1) ? 'Завершить тест' : 'Далее';
}

btnPrev.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
});

btnNext.addEventListener('click', () => {
  if (currentIndex < quizQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    finishQuiz(false);
  }
});

// ---------- ЗАВЕРШЕНИЕ ----------
function finishQuiz(timeUp) {
  clearInterval(timerInterval);
  progressFill.style.width = '100%';

  let correctCount = 0;
  quizQuestions.forEach((q, i) => {
    if (userAnswers[i] === q.correct) correctCount++;
  });

  const total = quizQuestions.length;
  const pct = Math.round((correctCount / total) * 100);
  const elapsedSeconds = Math.round((new Date() - startTime) / 1000);

  markAsTaken(studentName);

  screenQuiz.classList.add('hidden');
  screenResult.classList.remove('hidden');

  scoreRing.style.setProperty('--pct', pct);
  scoreNum.textContent = `${pct}%`;

  resultTitle.textContent = timeUp ? 'Время вышло!' : 'Тест завершён';
  resultSub.innerHTML =
    `Правильных ответов: <b>${correctCount} из ${total}</b><br>` +
    `Время выполнения: <b>${formatTime(elapsedSeconds)}</b><br>` +
    `Спасибо, <b>${escapeHtml(studentName)}</b>!`;

  if (pct >= 70) launchConfetti();

  sendResultToSheet({
    name: studentName,
    correct: correctCount,
    total: total,
    percent: pct,
    timeSeconds: elapsedSeconds,
    finishedAt: new Date().toISOString(),
    timeUp: timeUp
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- ОТПРАВКА РЕЗУЛЬТАТА УЧИТЕЛЮ (Google Sheets) ----------
function sendResultToSheet(result) {
  if (!CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL.includes('ВСТАВЬТЕ')) {
    console.warn('SCRIPT_URL не настроен — результат не отправлен.');
    return;
  }
  // используем no-cors, т.к. Apps Script не отдаёт CORS-заголовки для fetch с произвольных доменов
  fetch(CONFIG.SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(result)
  }).catch(err => console.warn('Не удалось отправить результат:', err));
}

// ---------- КОНФЕТТИ ----------
function launchConfetti() {
  const colors = ['#7c4dff', '#00e0c6', '#2ee6a8', '#ffd166', '#ff5d7a'];
  const container = document.getElementById('confetti');
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('span');
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (2 + Math.random() * 2) + 's';
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    piece.style.opacity = 0.6 + Math.random() * 0.4;
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 5000);
  }
}
