// ==================== КОНФИГУРАЦИЯ ====================
const SHEET_ID = 'ВАШ_ID_ГУГЛ_ТАБЛИЦЫ'; // <-- ЗАМЕНИТЕ НА ID ВАШЕЙ ТАБЛИЦЫ
const QUESTIONS_SHEET = 'Questions';
const RESULTS_SHEET = 'Results';

// ==================== CORS ====================
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getQuestions') {
    return getQuestions();
  } else if (action === 'getResults') {
    return getResults();
  }

  return jsonResponse({error: 'Unknown action'});
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  if (data.action === 'saveResult') {
    return saveResult(data);
  }

  return jsonResponse({success: true});
}

function doOptions(e) {
  return jsonResponse({});
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== ЗАГРУЗКА ВОПРОСОВ ====================
function getQuestions() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(QUESTIONS_SHEET);
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      return jsonResponse([]);
    }

    const headers = data[0].map(h => String(h).toLowerCase().trim());
    const questions = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const question = {};

      headers.forEach((header, index) => {
        const value = row[index];
        question[header] = value !== undefined && value !== null ? String(value) : '';
      });

      // Проверяем минимальные поля
      if (question.question && question.question.trim() !== '') {
        questions.push(question);
      }
    }

    return jsonResponse(questions);
  } catch (error) {
    return jsonResponse({error: error.toString()});
  }
}

// ==================== СОХРАНЕНИЕ РЕЗУЛЬТАТА ====================
function saveResult(data) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(RESULTS_SHEET);

    // Если листа Results нет — создаём
    if (!sheet) {
      sheet = ss.insertSheet(RESULTS_SHEET);
      sheet.appendRow(['Timestamp', 'Name', 'Score', 'Total', 'Percent', 'TimeSpent', 'Answers', 'Questions']);
    }

    sheet.appendRow([
      new Date(),
      data.name || '',
      data.score || 0,
      data.total || 0,
      data.percent || 0,
      data.timeSpent || 0,
      JSON.stringify(data.answers || {}),
      JSON.stringify(data.questions || [])
    ]);

    return jsonResponse({success: true});
  } catch (error) {
    return jsonResponse({error: error.toString()});
  }
}

// ==================== ПОЛУЧЕНИЕ РЕЗУЛЬТАТОВ ====================
function getResults() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(RESULTS_SHEET);

    if (!sheet) {
      return jsonResponse([]);
    }

    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      return jsonResponse([]);
    }

    const headers = data[0].map(h => String(h).toLowerCase().trim());
    const results = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const result = {};

      headers.forEach((header, index) => {
        const value = row[index];
        if (value instanceof Date) {
          result[header] = value.toISOString();
        } else {
          result[header] = value !== undefined && value !== null ? String(value) : '';
        }
      });

      results.push(result);
    }

    return jsonResponse(results);
  } catch (error) {
    return jsonResponse({error: error.toString()});
  }
}