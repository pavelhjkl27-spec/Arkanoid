from flask import Blueprint, jsonify, request

from app.models import GameResult


leaderboard_bp = Blueprint('leaderboard', __name__, url_prefix='/api/leaderboard')


ALLOWED_DIFFICULTIES = {'easy', 'normal', 'hard'}


def is_better_result(new_result, current_best):
    if current_best is None:
        return True

    if new_result.score != current_best.score:
        return new_result.score > current_best.score

    if new_result.level_reached != current_best.level_reached:
        return new_result.level_reached > current_best.level_reached

    if new_result.duration_seconds != current_best.duration_seconds:
        return new_result.duration_seconds < current_best.duration_seconds

    return new_result.created_at > current_best.created_at


@leaderboard_bp.get('')
def get_leaderboard():
    difficulty = request.args.get('difficulty')
    limit = request.args.get('limit', '10')

    if difficulty and difficulty not in ALLOWED_DIFFICULTIES:
        return jsonify({
            'error': 'Параметр \'difficulty\' должен быть одним из значений: easy, normal, hard'
        }), 400

    try:
        limit = int(limit)
    except ValueError:
        return jsonify({
            'error': 'Параметр \'limit\' должен быть целым числом'
        }), 400

    if limit < 1:
        return jsonify({
            'error': 'Параметр \'limit\' должен быть больше 0'
        }), 400

    if limit > 100:
        limit = 100

    query = GameResult.query

    if difficulty:
        query = query.filter_by(difficulty=difficulty)

    results = query.order_by(
        GameResult.score.desc(),
        GameResult.level_reached.desc(),
        GameResult.duration_seconds.asc(),
        GameResult.created_at.desc()
    ).all()

    best_results_by_user = {}

    for result in results:
        user_id = result.user_id
        current_best = best_results_by_user.get(user_id)

        if is_better_result(result, current_best):
            best_results_by_user[user_id] = result

    best_results = list(best_results_by_user.values())

    best_results.sort(
        key=lambda result: (
            -result.score,
            -result.level_reached,
            result.duration_seconds,
            -result.created_at.timestamp()
        )
    )

    best_results = best_results[:limit]

    leaderboard = []

    for index, result in enumerate(best_results, start=1):
        leaderboard.append({
            "place": index,
            "username": result.user.username if result.user else None,
            "score": result.score,
            "difficulty": result.difficulty,
            "level_reached": result.level_reached,
            "max_balls": result.max_balls,
            "lives_left": result.lives_left,
            "duration_seconds": result.duration_seconds,
            "result": result.result,
            "created_at": result.created_at.isoformat() if result.created_at else None
        })

    return jsonify({
        'leaderboard': leaderboard
    }), 200