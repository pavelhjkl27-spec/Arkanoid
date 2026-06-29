from flask import Flask, jsonify, request
from config import Config
from app.extensions import db, migrate, cors


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    cors.init_app(app, supports_credentials=True)

    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get("Origin")

        allowed_origins = {
            "http://127.0.0.1:8000",
            "http://localhost:8000",
            "http://127.0.0.1:5500",
            "http://localhost:5500",
        }

        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"

        return response

    @app.before_request
    def handle_options_requests():
        if request.method == "OPTIONS":
            response = jsonify({"status": "ok"})
            return response, 200

    from app import models

    from app.auth.routes import auth_bp
    from app.levels.routes import levels_bp
    from app.results.routes import results_bp
    from app.leaderboard.routes import leaderboard_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(levels_bp)
    app.register_blueprint(results_bp)
    app.register_blueprint(leaderboard_bp)

    @app.get("/")
    def index():
        return jsonify({
            "message": "Arkanoid backend main page",
            "hint": "Open /api/health to check API status"
        })

    @app.get("/api/health")
    def health_check():
        return jsonify({
            "status": "ok",
            "message": "Arkanoid backend is running"
        })

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "not_found",
            "message": "Маршрут не найден"
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "error": "method_not_allowed",
            "message": "Метод запроса не разрешён для этого маршрута"
        }), 405

    @app.errorhandler(500)
    def internal_server_error(error):
        db.session.rollback()
        return jsonify({
            "error": "internal_server_error",
            "message": "Внутренняя ошибка сервера"
        }), 500

    return app