from flask import Blueprint, jsonify, request, session
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import User
from app.auth.utils import get_current_user


auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.post('/register')
def register():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            'error': 'Не переданы данные'
        }), 400

    username = data.get('username', '').strip().lower()
    password = data.get('password', '')

    if not username:
        return jsonify({
            'error': 'Ник не может быть пустым'
        }), 400

    if len(username) < 3:
        return jsonify({
            'error': 'Ник должен содержать минимум 3 символа'
        }), 400

    if len(username) > 30:
        return jsonify({
            'error': 'ник должен содержать не более 30 символов'
        }), 400

    if not password:
        return jsonify({
            'error': 'Пароль не может быть пустым'
        }), 400

    if len(password) < 6:
        return jsonify({
            'error': 'пароль должен содержать минимум 6 символов'
        }), 400

    existing_user = User.query.filter_by(username=username).first()

    if existing_user:
        return jsonify({
            'error': 'Пользователь с таким ником уже существует'
        }), 409

    user = User(username=username)
    user.set_password(password)

    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError:
        return jsonify({
            'error': 'Пользователь с таким ником уже существует'
        }), 409

    session['user_id'] = user.id

    return jsonify({
        'message': 'Пользователь успешно зарегистрирован',
        'user_id': user.to_dict()
    }), 201


@auth_bp.post('/login')
def login():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            'error': 'Не переданы данные'
        }), 400

    username = data.get('username', '').strip().lower()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({
            'error': 'Нужно передать ник и пароль'
        }), 400

    user = User.query.filter_by(username=username).first()

    if user is None or not user.check_password(password):
        return jsonify({
            'error': 'Неверный ник или пароль'
        }), 401

    session['user_id'] = user.id

    return jsonify({
        'message': 'Вход выполнен',
        'user': user.to_dict()
    }), 200

@auth_bp.post('/logout')
def logout():
    session.pop('user_id', None)

    return jsonify({
        'message': 'Выход выполнен'
    }), 200


@auth_bp.get('/me')
def me():
    user = get_current_user()

    if user is None:
        return jsonify({
            'authenticated': False,
            'user': None
        }), 200

    return jsonify({
        'authenticated': True,
        'user': user.to_dict()
    }), 200


