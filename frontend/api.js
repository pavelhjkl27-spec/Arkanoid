const API_BASE = 'http://127.0.0.1:5000';

function getHeaders() {
    return {
        'Content-Type': 'application/json'
    };
}

// ========== АВТОРИЗАЦИЯ ==========

async function login(username, password) {
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });
        return await res.json();
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Ошибка соединения с backend' };
    }
}

async function register(username, password) {
    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });
        return await res.json();
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, message: 'Ошибка соединения с backend' };
    }
}

async function logoutUser() {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: getHeaders(),
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
}

async function getMe() {
    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            credentials: 'include'
        });
        if (res.ok) {
            return await res.json();
        }
        return { authenticated: false };
    } catch (error) {
        console.error('Get me error:', error);
        return { authenticated: false };
    }
}

// ========== УРОВНИ ==========

async function getLevels() {
    try {
        const res = await fetch(`${API_BASE}/api/levels`, {
            credentials: 'include'
        });
        if (res.ok) {
            return await res.json();
        }
        return { levels: [] };
    } catch (error) {
        console.error('Get levels error:', error);
        return { levels: [] };
    }
}

// ========== СЛОЖНОСТИ ==========

async function getDifficulties() {
    try {
        const res = await fetch(`${API_BASE}/api/difficulties`, {
            credentials: 'include'
        });
        if (res.ok) {
            return await res.json();
        }
        return { difficulties: [] };
    } catch (error) {
        console.error('Get difficulties error:', error);
        return { difficulties: [] };
    }
}

// ========== РЕЗУЛЬТАТЫ ==========

async function saveScore(resultData) {
    try {
        const res = await fetch(`${API_BASE}/api/results`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(resultData),
            credentials: 'include'
        });
        return await res.json();
    } catch (error) {
        console.error('Save score error:', error);
        return { success: false, message: 'Ошибка сохранения результата' };
    }
}

// ========== РЕЙТИНГ ==========

async function getLeaderboard(params = '') {
    try {
        const res = await fetch(`${API_BASE}/api/leaderboard${params ? `?${params}` : ''}`, {
            credentials: 'include'
        });
        if (res.ok) {
            return await res.json();
        }
        return { leaderboard: [] };
    } catch (error) {
        console.error('Get leaderboard error:', error);
        return { leaderboard: [] };
    }
}

// ========== ИСТОРИЯ ==========

async function getMyHistory() {
    try {
        const res = await fetch(`${API_BASE}/api/results/my`, {
            credentials: 'include'
        });
        if (res.ok) {
            return await res.json();
        }
        return { results: [] };
    } catch (error) {
        console.error('Get history error:', error);
        return { results: [] };
    }
}
