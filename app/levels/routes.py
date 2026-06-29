from flask import Blueprint, jsonify

from app.extensions import db
from app.models import Level, DifficultyPreset


levels_bp = Blueprint('levels', __name__, url_prefix='/api')


DEFAULT_LEVELS = [
    {
        "number": 1,
        "name": "Классика",
        "balls_count": 1,
        "layout": [
            "XXXXXXXXXX",
            "XXXXXXXXXX",
            "XXXXXXXXXX",
            "XXXXXXXXXX"
        ]
    },
    {
        "number": 2,
        "name": "Пирамида",
        "balls_count": 2,
        "layout": [
            "....XX....",
            "...XXXX...",
            "..XXXXXX..",
            ".XXXXXXXX.",
            "XXXXXXXXXX"
        ]
    },
    {
        "number": 3,
        "name": "Ромб",
        "balls_count": 3,
        "layout": [
            "....XX....",
            "...XXXX...",
            "..XXXXXX..",
            ".XXXXXXXX.",
            "..XXXXXX..",
            "...XXXX...",
            "....XX...."
        ]
    },
    {
        "number": 4,
        "name": "Башни",
        "balls_count": 3,
        "layout": [
            "XX......XX",
            "XX......XX",
            "XXXX..XXXX",
            "XXXX..XXXX",
            "XXXXXXXXXX"
        ]
    },
    {
        "number": 5,
        "name": "Волна",
        "balls_count": 4,
        "layout": [
            "XX..XX..XX",
            ".XX..XX..X",
            "..XX..XX..",
            "X..XX..XX.",
            "XX..XX..XX"
        ]
    }
]


DEFAULT_DIFFICULTIES = [
    {
        "slug": "easy",
        "name": "Лёгкая",
        "initial_lives": 5,
        "paddle_width": 170,
        "ball_speed": 4.0,
        "max_ball_speed": 7.0,
        "speedup_every": 8,
        "speedup_amount": 0.3
    },
    {
        "slug": "normal",
        "name": "Нормальная",
        "initial_lives": 3,
        "paddle_width": 140,
        "ball_speed": 5.0,
        "max_ball_speed": 9.0,
        "speedup_every": 5,
        "speedup_amount": 0.5
    },
    {
        "slug": "hard",
        "name": "Сложная",
        "initial_lives": 2,
        "paddle_width": 110,
        "ball_speed": 6.0,
        "max_ball_speed": 10.0,
        "speedup_every": 4,
        "speedup_amount": 0.6
    }
]


def seed_levels_if_empty():
    if Level.query.count() > 0:
        return

    for level_data in DEFAULT_LEVELS:
        level = Level(
            number=level_data['number'],
            name=level_data['name'],
            balls_count=level_data['balls_count'],
            layout=level_data['layout']
        )
        db.session.add(level)

    db.session.commit()


def seed_difficulties_if_empty():
    if DifficultyPreset.query.count() > 0:
        return

    for difficulty_data in DEFAULT_DIFFICULTIES:
        difficulty = DifficultyPreset(
            slug=difficulty_data['slug'],
            name=difficulty_data["name"],
            initial_lives=difficulty_data["initial_lives"],
            paddle_width=difficulty_data["paddle_width"],
            ball_speed=difficulty_data["ball_speed"],
            max_ball_speed=difficulty_data["max_ball_speed"],
            speedup_every=difficulty_data["speedup_every"],
            speedup_amount=difficulty_data["speedup_amount"]
        )
        db.session.add(difficulty)

    db.session.commit()


@levels_bp.get('/levels')
def get_levels():
    seed_levels_if_empty()

    levels = Level.query.order_by(Level.number.asc()).all()

    return jsonify({
        'levels': [level.to_dict() for level in levels]
    }), 200


@levels_bp.get('/difficulties')
def get_difficulties():
    seed_difficulties_if_empty()

    difficulties = DifficultyPreset.query.order_by(DifficultyPreset.id.asc()).all()

    return jsonify({
        'difficulties': [difficulty.to_dict() for difficulty in difficulties]
    }), 200


