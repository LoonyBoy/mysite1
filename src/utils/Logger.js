class Logger {
  constructor() {
    this.logs = []
    this.isEnabled = true
    this.maxLogs = 100
  }

  log(category, action, data = {}) {
    if (!this.isEnabled) return

    const logEntry = {
      timestamp: new Date().toISOString(),
      category,
      action,
      data,
      id: Date.now() + Math.random()
    }

    this.logs.unshift(logEntry)
    
    // Ограничиваем количество логов
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Выводим в консоль с цветами
    const colors = {
      NAVIGATION: '#4CAF50',
      PARTICLES: '#2196F3', 
      ANIMATION: '#FF9800',
      TOUCH: '#E91E63',
      PERFORMANCE: '#9C27B0',
      ERROR: '#F44336'
    }

    console.log(
      `%c[${category}] %c${action}`,
      `color: ${colors[category] || '#666'}; font-weight: bold`,
      'color: #333',
      data
    )

    return logEntry
  }

  // Специализированные методы логирования
  navigation(action, data) {
    return this.log('NAVIGATION', action, data)
  }

  particles(action, data) {
    return this.log('PARTICLES', action, data)
  }

  animation(action, data) {
    return this.log('ANIMATION', action, data)
  }

  touch(action, data) {
    return this.log('TOUCH', action, data)
  }

  performance(action, data) {
    return this.log('PERFORMANCE', action, data)
  }

  error(action, data) {
    return this.log('ERROR', action, data)
  }

  // Получение логов
  getLogs(category = null, limit = 20) {
    let filteredLogs = category 
      ? this.logs.filter(log => log.category === category)
      : this.logs
    
    return filteredLogs.slice(0, limit)
  }

  // Очистка логов
  clear() {
    this.logs = []
    console.clear()
    this.log('SYSTEM', 'Logs cleared')
  }

  // Включение/выключение логирования
  toggle(enabled = !this.isEnabled) {
    this.isEnabled = enabled
    console.log(`Logging ${enabled ? 'enabled' : 'disabled'}`)
  }

  // Экспорт логов
  export() {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Создаем глобальный экземпляр
const logger = new Logger()

// Добавляем в window для отладки
if (typeof window !== 'undefined') {
  window.logger = logger
}

export default logger 