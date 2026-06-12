/**
 * GOOGLE APPS SCRIPT — приём результатов теста и сохранение в Google Sheet
 *
 * УСТАНОВКА:
 * 1. Создайте новую Google Таблицу (sheets.google.com).
 * 2. В таблице: Расширения -> Apps Script.
 * 3. Удалите весь код в редакторе и вставьте этот файл целиком.
 * 4. Нажмите "Развернуть" (Deploy) -> "Новое развертывание" (New deployment).
 *    - Тип: "Веб-приложение" (Web app)
 *    - Кто имеет доступ: "Все" (Anyone)
 * 5. Скопируйте полученный URL веб-приложения.
 * 6. Вставьте этот URL в файл config.js -> SCRIPT_URL.
 *
 * Результаты будут появляться на листе "Результаты" автоматически.
 */

const SHEET_NAME = 'Результаты';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    sheet.appendRow([
      new Date(),                 // время получения сервером
      data.name || '',
      data.correct,
      data.total,
      data.percent + '%',
      formatSeconds(data.timeSeconds),
      data.timeUp ? 'Да (по таймеру)' : 'Нет',
      data.finishedAt || ''
    ]);

    return ContentService.createTextOutput(JSON.stringify({status: 'ok'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // позволяет посмотреть результаты в формате JSON, открыв URL веб-приложения в браузере
  const sheet = getOrCreateSheet();
  const rows = sheet.getDataRange().getValues();
  const header = rows.shift();
  const result = rows.map(r => {
    const obj = {};
    header.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify(result, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Время получения', 'Ученик', 'Правильных', 'Из',
      'Процент', 'Время выполнения', 'Вышел по таймеру', 'Завершено (ISO)'
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function formatSeconds(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m} мин ${s} сек`;
}
