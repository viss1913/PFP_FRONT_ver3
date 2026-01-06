// Статические данные целей (пока заглушка)
const goalsData = [
    {
        id: 1,
        title: "Завершить проект",
        description: "Завершить разработку основного функционала приложения",
        status: "active",
        date: "2024-01-15"
    },
    {
        id: 2,
        title: "Провести тестирование",
        description: "Протестировать все основные функции и исправить найденные ошибки",
        status: "pending",
        date: "2024-01-20"
    },
    {
        id: 3,
        title: "Подготовить документацию",
        description: "Создать подробную документацию для пользователей и разработчиков",
        status: "pending",
        date: "2024-01-25"
    },
    {
        id: 4,
        title: "Запустить в продакшн",
        description: "Развернуть приложение на продакшн сервере и провести финальные проверки",
        status: "pending",
        date: "2024-02-01"
    }
];

// Функция для форматирования даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Функция для создания элемента цели
function createGoalElement(goal) {
    const goalElement = document.createElement('div');
    goalElement.className = 'goal-item';
    goalElement.innerHTML = `
        <h3>${goal.title}</h3>
        <p>${goal.description}</p>
        <div class="goal-meta">
            <span class="goal-status ${goal.status}">${getStatusText(goal.status)}</span>
            <span>${formatDate(goal.date)}</span>
        </div>
    `;
    return goalElement;
}

// Функция для получения текста статуса
function getStatusText(status) {
    const statusMap = {
        'active': 'В работе',
        'completed': 'Завершено',
        'pending': 'Ожидает'
    };
    return statusMap[status] || status;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const goalsList = document.getElementById('goalsList');
    
    // Добавляем цели в список
    goalsData.forEach(goal => {
        const goalElement = createGoalElement(goal);
        goalsList.appendChild(goalElement);
    });
});


