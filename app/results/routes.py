from flask import Blueprint, jsonify, request

from app.auth.utils import get_current_user
from app.extensions import db
from app.models import GameResult


results_bp = Blueprint('results', __name__, url_prefix='/api/results')


ALLOWED_DIFFICULTIES = {'easy', 'normal', 'hard'}
ALLOWED_RESULTS = {'win', 'lose'}


def validate_int_field(data, field_name, min_value=None):
    value = data.get(field_name)

    if value is None:
        return None, f'Поле \'{field_name}\' обязательно'

    if not isinstance(value, int):
        return None, f'Поле \'{field_name}\' должно быть целым числом'

    if min_value is not None and value < min_value:
        return None, f'Поле \'{field_name}\' должно быть не меньше {min_value}'

    return value, None


@results_bp.post('')
def save_result():
    user = get_current_user()

    if user is None:
        return jsonify({
            'error': 'Для сохранения результата необходимо войти в аккаунт'
        }), 401

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            'error': 'Не переданы данные результата'
        }), 400

    score, error = validate_int_field(data, 'score', min_value=0)
    if error:
        return jsonify({
            'error': error
        }), 400

    level_reached, error = validate_int_field(data, 'level_reached', min_value=1)
    if error:
        return jsonify({'error': error}), 400

    max_balls, error = validate_int_field(data, 'max_balls', min_value=1)
    if error:
        return jsonify({'error': error}), 400

    lives_left, error = validate_int_field(data, 'lives_left', min_value=0)
    if error:
        return jsonify({'error': error}), 400

    duration_seconds, error = validate_int_field(data, 'duration_seconds', min_value=0)
    if error:
        return jsonify({'error': error}), 400

    difficulty = data.get('difficulty')

    if difficulty not in ALLOWED_DIFFICULTIES:
        return jsonify({
            'error': 'Поле \'difficulty\' должно быть одним из значений: easy, normal, hard'
        }), 400

    result = data.get('result')

    if result not in ALLOWED_RESULTS:
        return jsonify({
            'error': 'Поле \'result\' должно быть одним из значений: win, lose'
        }), 400

    game_result = GameResult(
        user_id=user.id,
        score=score,
        difficulty=difficulty,
        level_reached=level_reached,
        max_balls=max_balls,
        lives_left=lives_left,
        duration_seconds=duration_seconds,
        result=result
    )

    db.session.add(game_result)
    db.session.commit()

    return jsonify({
        'message': 'Результат сохранён',
        'result': game_result.to_dict()
    }), 201


@results_bp.get('/my')
def get_my_results():
    user = get_current_user()

    if user is None:
        return jsonify({
            'error': 'Для просмотра результатов необходимо войти в аккаунт'
        }), 401

    results = (
        GameResult.query.filter_by(user_id=user.id).order_by(GameResult.created_at.desc()).all()
    )

    return jsonify({
        'results': [result.to_dict() for result in results]
    }), 200













