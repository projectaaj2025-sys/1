"""
Конвертер вопросов из Google Forms (CSV) в формат questions.json для теста.

КАК ПОЛУЧИТЬ CSV ИЗ GOOGLE FORMS:
Сам Google Forms не экспортирует список вопросов с правильными ответами напрямую
(только ответы респондентов). Поэтому проще всего вести базу вопросов в
Google Таблице (Google Sheets) в формате, показанном ниже, и экспортировать
её как CSV (Файл -> Скачать -> CSV).

ФОРМАТ ТАБЛИЦЫ (первая строка — заголовки):

question                  | answer1        | answer2        | answer3 | answer4 | correct
Сколько будет 2+2?        | 3              | 4              | 5       | 6       | 2
Столица Казахстана?       | Алматы         | Астана         | Шымкент | Караганда | 2

Столбец "correct" — номер правильного ответа (1, 2, 3 или 4), считая с 1.
Если вариантов ответа меньше 4 — оставьте пустые ячейки.

ИСПОЛЬЗОВАНИЕ:
    python convert_csv_to_json.py questions.csv data/questions.json

После этого новые вопросы появятся в базе теста — просто загрузите
обновлённый questions.json на GitHub.
"""

import csv
import json
import sys


def convert(csv_path, json_path):
    questions = []
    with open(csv_path, newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1):
            answers = []
            for key in ['answer1', 'answer2', 'answer3', 'answer4', 'answer5', 'answer6']:
                val = row.get(key, '')
                if val and val.strip():
                    answers.append(val.strip())

            if not answers:
                continue

            try:
                correct_index = int(row['correct'].strip()) - 1
            except (KeyError, ValueError):
                print(f"Строка {i}: не указан правильный ответ, пропускаю.")
                continue

            if correct_index < 0 or correct_index >= len(answers):
                print(f"Строка {i}: некорректный номер правильного ответа, пропускаю.")
                continue

            questions.append({
                "id": i,
                "question": row['question'].strip(),
                "answers": answers,
                "correct": correct_index
            })

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print(f"Готово! {len(questions)} вопрос(ов) записано в {json_path}")


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Использование: python convert_csv_to_json.py <входной.csv> <выходной.json>")
        sys.exit(1)
    convert(sys.argv[1], sys.argv[2])
