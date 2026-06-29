from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import JSONB
from werkzeug.security import generate_password_hash, check_password_hash

from app.extensions import db


def current_time():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=current_time, nullable=False)
    results = db.relationship('GameResult',
                              back_populates='user',
                              cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(
            password,
            method="pbkdf2:sha256:600000"
        )

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class GameResult(db.Model):
    __tablename__ = 'game_results'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer,
                        db.ForeignKey('users.id', ondelete='CASCADE'),
                        nullable=False,
                        index=True)
    score = db.Column(db.Integer, nullable=False)
    difficulty = db.Column(db.String(20), nullable=False, index=True)
    level_reached = db.Column(db.Integer, nullable=False)
    max_balls = db.Column(db.Integer, nullable=False)
    lives_left = db.Column(db.Integer, nullable=False)
    duration_seconds = db.Column(db.Integer, nullable=False)
    result = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=current_time, nullable=False)
    user = db.relationship('User', back_populates='results')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'score': self.score,
            'difficulty': self.difficulty,
            'level_reached': self.level_reached,
            'max_balls': self.max_balls,
            'lives_left': self.lives_left,
            'duration_seconds': self.duration_seconds,
            'result': self.result,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Level(db.Model):
    __tablename__ = 'levels'

    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.Integer, unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    balls_count = db.Column(db.Integer, nullable=False, default=1)
    layout = db.Column(JSONB, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=current_time, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'number': self.number,
            'name': self.name,
            'balls_count': self.balls_count,
            'layout': self.layout,
        }


class DifficultyPreset(db.Model):
    __tablename__ = "difficulty_presets"

    id = db.Column(db.Integer, primary_key=True)

    slug = db.Column(db.String(20), unique=True, nullable=False, index=True)

    name = db.Column(db.String(50), nullable=False)

    initial_lives = db.Column(db.Integer, nullable=False)

    paddle_width = db.Column(db.Integer, nullable=False)

    ball_speed = db.Column(db.Float, nullable=False)

    max_ball_speed = db.Column(db.Float, nullable=False)

    speedup_every = db.Column(db.Integer, nullable=False)

    speedup_amount = db.Column(db.Float, nullable=False)

    created_at = db.Column(db.DateTime(timezone=True), default=current_time, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "slug": self.slug,
            "name": self.name,
            "initial_lives": self.initial_lives,
            "paddle_width": self.paddle_width,
            "ball_speed": self.ball_speed,
            "max_ball_speed": self.max_ball_speed,
            "speedup_every": self.speedup_every,
            "speedup_amount": self.speedup_amount
        }






















