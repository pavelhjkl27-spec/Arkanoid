# Арканоид

Учебный проект по Python: браузерная версия игры «Арканоид» с серверной частью на Flask, базой данных PostgreSQL, авторизацией пользователей, уровнями сложности и таблицей рекордов.

## Возможности проекта

- регистрация и вход пользователей;
- хранение пользователей в базе данных;
- сохранение результатов игры;
- таблица рекордов;
- несколько уровней игры;
- несколько уровней сложности;
- изменение параметров игры в зависимости от сложности;
- клиентская часть на HTML, CSS и JavaScript;
- серверная часть на Flask;
- база данных PostgreSQL.

## Технологии

### Серверная часть

- Python
- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- PostgreSQL
- Flask-CORS

### Клиентская часть

- HTML
- CSS
- JavaScript
- Canvas

## Структура проекта

```text
Project_for_Python_Arkanoid/
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   ├── leaderboard/
│   │   ├── levels/
│   │   ├── results/
│   │   ├── __init__.py
│   │   ├── extensions.py
│   │   └── models.py
│   ├── migrations/
│   ├── .env.example
│   ├── config.py
│   ├── requirements.txt
│   └── run.py
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── api.js
│   ├── game.js
│   └── favicon.ico
│
├── .gitignore
└── README.md