// Rostech Chat Widget — исходник; при сборке подставляется ROSTECH_API_BASE_URL
;(function () {
  const WIDGET_ID = 'rostech-chat-root'
  const STYLE_ID = 'rostech-chat-styles'
  const API_BASE_URL = '__ROSTECH_API_BASE_URL__'
  const STREAM_PATH = '/api/pfp/constructor/site-chat/stream'

  const CLASSIFIER_QUICK_REPLIES = {
    '/vozrast': [
      'Достойная пенсия',
      'Просто посчитать',
    ],
    '/sex': ['Мужской', 'Женский'],
  }

  const START_MESSAGE = 'Старт'

  function triggerPdfDownload(url, buttonEl) {
    const orig = buttonEl ? buttonEl.textContent : ''
    const setBusy = (busy) => {
      if (!buttonEl) return
      buttonEl.disabled = busy
      buttonEl.textContent = busy ? 'Загрузка…' : orig
    }
    setBusy(true)

    const saveBlob = (blob) => {
      const m = url.match(/\/([^/?#]+\.pdf)/i)
      const name = m ? m[1] : 'otchet-pensiya.pdf'
      const o = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = o
      a.download = name
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(o), 4000)
      setBusy(false)
    }

    const tryFetch = (cred) =>
      fetch(url, { mode: 'cors', credentials: cred }).then((r) => {
        if (!r.ok) throw new Error('pdf http ' + r.status)
        return r.blob()
      })

    tryFetch('omit')
      .then(saveBlob)
      .catch(() =>
        tryFetch('include')
          .then(saveBlob)
          .catch(() => {
            setBusy(false)
            window.open(url, '_blank', 'noopener,noreferrer')
          })
      )
  }

  function resolveAssetBaseUrl(explicit) {
    if (explicit && typeof explicit === 'string') {
      return explicit.replace(/\/?$/, '/') 
    }
    const scripts = document.getElementsByTagName('script')
    for (let i = scripts.length - 1; i >= 0; i--) {
      const s = scripts[i]
      if (!s.src) continue
      if (/widget\.js([?#]|$)/i.test(s.src)) {
        return s.src.replace(/[^/]+$/, '')
      }
    }
    return ''
  }

  const THEMES = {
    reni: {
      id: 'reni',
      brand: '#38056C',
      brandHover: '#4A0A8A',
      brandRgb: '56, 5, 108',
      chipHoverBg: '#F2FFF0',
      startBorder: '#e7ddf3',
      startGrad: 'linear-gradient(180deg, #ffffff 0%, #faf7ff 100%)',
      mute: '#6d6780',
      title: 'AI Реня',
      subtitle: 'Цифровой финансовый консультант',
      startBadge: 'AI Ренессанс',
      startTitle: 'Привет! Я AI Реня - твоя финансовый консультант.',
      startDesc: 'Нажми кнопку начать и я с радостью тебе помогу.',
    },
    rostech: {
      id: 'rostech',
      brand: '#722257',
      brandHover: '#8a2a68',
      brandRgb: '114, 34, 87',
      chipHoverBg: '#fafafa',
      startBorder: '#dbdbdb',
      startGrad: 'linear-gradient(180deg, #ffffff 0%, #f7f7f8 100%)',
      mute: '#6d6780',
      title: 'AI Ростех',
      subtitle: 'Цифровой финансовый консультант',
      startBadge: 'AI Ростех',
      startTitle: 'Привет! Я AI Ростех, твой финансовый консультант.',
      startDesc: 'Нажми «Начать» — отвечу в режиме живого диалога.',
    },
  }

  function resolveTheme(themeId) {
    if (themeId === 'rostech' || themeId === 'rostec') return THEMES.rostech
    return THEMES.reni
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      .rtw-chat-page {
        --rtw-brand: #38056C;
        --rtw-brand-hover: #4A0A8A;
        --rtw-brand-rgb: 56, 5, 108;
        --rtw-chip-hover-bg: #F2FFF0;
        --rtw-start-border: #e7ddf3;
        --rtw-start-grad: linear-gradient(180deg, #ffffff 0%, #faf7ff 100%);
        --rtw-mute: #6d6780;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 16px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        height: min(100vh, 100%);
        max-height: min(100vh, 100%);
        width: 100%;
        background: #f3f3f4;
        color: #060606;
      }

      .rtw-chat-page.rtw-theme-rostech {
        --rtw-brand: #722257;
        --rtw-brand-hover: #8a2a68;
        --rtw-brand-rgb: 114, 34, 87;
        --rtw-chip-hover-bg: #fafafa;
        --rtw-start-border: #dbdbdb;
        --rtw-start-grad: linear-gradient(180deg, #ffffff 0%, #f7f7f8 100%);
      }

      .rtw-chat-page *, .rtw-chat-page *::before, .rtw-chat-page *::after {
        box-sizing: border-box;
      }

      .rtw-chat-header {
        padding: 0 20px;
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-shrink: 0;
        background: var(--rtw-brand);
        border-bottom: none;
      }

      .rtw-chat-header-left {
        display: flex;
        align-items: center;
        gap: 16px;
        min-width: 0;
      }

      .rtw-new-chat-btn {
        flex-shrink: 0;
        padding: 8px 14px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.45);
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.15s, border-color 0.15s, opacity 0.15s;
      }

      .rtw-new-chat-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.22);
        border-color: rgba(255, 255, 255, 0.65);
      }

      .rtw-new-chat-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .rtw-chat-header-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .rtw-close-chat-btn {
        flex-shrink: 0;
        padding: 8px 14px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.45);
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.15s, border-color 0.15s, opacity 0.15s;
      }

      .rtw-close-chat-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.22);
        border-color: rgba(255, 255, 255, 0.65);
      }

      .rtw-close-chat-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .rtw-chat-header-avatar {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        flex-shrink: 0;
        object-fit: cover;
        border: 2px solid rgba(255, 255, 255, 0.35);
        background: rgba(255, 255, 255, 0.15);
      }

      .rtw-chat-header-title {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .rtw-chat-header-title-main {
        font-size: 22px;
        font-weight: 600;
        color: #ffffff;
        letter-spacing: -0.02em;
      }

      .rtw-chat-header-title-sub {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.75);
      }

      .rtw-messages-wrap {
        flex: 1;
        min-height: 0;
        position: relative;
        display: flex;
        flex-direction: column;
        background: #ffffff;
      }

      .rtw-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px 16px 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: #ffffff;
      }

      .rtw-start-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        padding: 24px;
        background: #ffffff;
        z-index: 3;
      }

      .rtw-start-card {
        width: min(500px, 100%);
        border: 1px solid var(--rtw-start-border);
        border-radius: 16px;
        background: var(--rtw-start-grad);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-shadow: 0 8px 30px rgba(var(--rtw-brand-rgb), 0.12);
      }

      .rtw-start-badge {
        display: inline-flex;
        align-self: flex-start;
        border-radius: 999px;
        padding: 6px 12px;
        background: rgba(var(--rtw-brand-rgb), 0.1);
        color: var(--rtw-brand);
        font-size: 13px;
        font-weight: 600;
      }

      .rtw-start-overlay.rtw-hidden {
        display: none !important;
      }

      .rtw-start-title {
        font-size: 22px;
        font-weight: 600;
        color: #060606;
        line-height: 1.25;
      }

      .rtw-start-desc {
        font-size: 15px;
        line-height: 1.45;
        color: #4b4b58;
      }

      .rtw-start-btn {
        margin-top: 10px;
        padding: 14px 22px;
        width: 100%;
        border: none;
        border-radius: 8px;
        background: var(--rtw-brand);
        color: #ffffff;
        font-size: 17px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(var(--rtw-brand-rgb), 0.28);
        transition: filter 0.15s, transform 0.08s;
      }

      .rtw-start-btn:hover:not(:disabled) {
        filter: brightness(1.06);
      }

      .rtw-start-btn:active:not(:disabled) {
        transform: scale(0.98);
      }

      .rtw-start-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .rtw-message-row {
        display: flex;
        width: 100%;
        align-items: flex-start;
      }

      .rtw-message-row-user {
        justify-content: flex-end;
      }

      .rtw-message-row-bot {
        justify-content: flex-start;
        gap: 12px;
      }

      .rtw-bot-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        margin-top: 6px;
        background: #f3f3f4;
      }

      .rtw-bot-column {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        max-width: min(720px, 100%);
      }

      .rtw-message-bubble {
        max-width: 100%;
        padding: 0;
        border-radius: 0;
        font-size: 17px;
        line-height: 1.55;
        word-wrap: break-word;
        white-space: pre-wrap;
      }

      .rtw-message-bubble-user {
        max-width: min(480px, 85%);
        padding: 12px 16px;
        border-radius: 8px;
        background: var(--rtw-brand);
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(var(--rtw-brand-rgb), 0.2);
        white-space: normal;
      }

      .rtw-message-bubble-bot {
        background: transparent;
        color: #060606;
        border: none;
        box-shadow: none;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        white-space: normal;
        padding: 0;
      }

      .rtw-message-text {
        white-space: pre-wrap;
        word-wrap: break-word;
        width: 100%;
      }

      .rtw-md-bold {
        font-weight: 700;
      }

      .rtw-message-bubble-bot .rtw-md-bold {
        color: #060606;
      }

      .rtw-message-bubble-user .rtw-md-bold {
        color: inherit;
      }

      .rtw-quick-replies {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 12px;
        align-items: flex-start;
        width: 100%;
      }

      .rtw-quick-reply-btn {
        border: 1px solid #dbdbdb;
        background: #ffffff;
        color: #060606;
        font-size: 15px;
        font-weight: 400;
        font-family: inherit;
        padding: 10px 18px;
        border-radius: 8px;
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
        text-align: center;
        line-height: 1.3;
        max-width: 100%;
      }

      .rtw-quick-reply-btn:hover:not(:disabled) {
        border-color: var(--rtw-brand);
        background: var(--rtw-chip-hover-bg);
      }

      .rtw-quick-reply-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      @media (max-width: 767px) {
        .rtw-quick-replies {
          flex-direction: column;
          align-items: stretch;
          gap: 8px;
        }
        .rtw-quick-reply-btn {
          font-size: 14px;
          padding: 8px 14px;
          width: 100%;
        }
      }

      .rtw-pdf-report-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 10px 18px;
        border-radius: 8px;
        background: var(--rtw-brand);
        color: #ffffff;
        font-size: 14px;
        font-weight: 600;
        font-family: inherit;
        border: none;
        cursor: pointer;
        flex-shrink: 0;
        transition: filter 0.15s;
      }

      .rtw-pdf-report-btn:hover {
        filter: brightness(1.08);
      }

      .rtw-pdf-report-btn:focus-visible {
        outline: 2px solid var(--rtw-brand);
        outline-offset: 2px;
      }

      .rtw-chat-footer {
        border-top: 1px solid #dbdbdb;
        padding: 12px 16px 16px;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .rtw-input-row {
        display: flex;
        gap: 10px;
        align-items: stretch;
      }

      .rtw-input-wrap {
        flex: 1;
        display: flex;
        border: 1px solid #dbdbdb;
        border-radius: 8px;
        background: #ffffff;
        min-height: 52px;
        align-items: stretch;
      }

      .rtw-input-textarea {
        flex: 1;
        min-height: 48px;
        max-height: 120px;
        resize: none;
        padding: 14px 16px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: #060606;
        font-family: inherit;
        font-size: 17px;
        line-height: 1.35;
        outline: none;
      }

      .rtw-input-textarea::placeholder {
        color: #9a9a9a;
      }

      .rtw-send-button {
        border-radius: 50%;
        border: none;
        background: var(--rtw-brand);
        color: #ffffff;
        width: 52px;
        min-width: 52px;
        height: 52px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-family: inherit;
        transition: opacity 0.1s, filter 0.1s, transform 0.12s ease;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(var(--rtw-brand-rgb), 0.35);
      }

      .rtw-send-button svg {
        display: block;
        width: 22px;
        height: 22px;
        margin-left: 2px;
        margin-bottom: 1px;
        transform: rotate(-28deg);
      }

      .rtw-send-button:not(:disabled):hover {
        background: var(--rtw-brand-hover);
      }

      .rtw-send-button:not(:disabled):active {
        transform: scale(0.94);
      }

      .rtw-send-button:disabled {
        opacity: 0.5;
        cursor: default;
      }

      .rtw-footer-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: #9a9a9a;
      }

      .rtw-typing-indicator {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .rtw-message-typing {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding-top: 2px;
        color: var(--rtw-mute);
        font-size: 14px;
      }

      .rtw-typing-label {
        font-size: 14px;
      }

      .rtw-typing-dot {
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: var(--rtw-brand);
        opacity: 0.35;
        animation: rtw-bounce 1.4s infinite ease-in-out both;
      }

      .rtw-typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .rtw-typing-dot:nth-child(3) { animation-delay: 0.4s; }

      @keyframes rtw-bounce {
        0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
        40% { transform: scale(1); opacity: 1; }
      }

      .rtw-error-banner {
        padding: 8px 12px;
        border-radius: 8px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #b91c1c;
        font-size: 12px;
      }

      .rtw-hidden {
        display: none !important;
      }

      @media (min-width: 768px) {
        .rtw-chat-page {
          max-width: 720px;
          margin: 0 auto;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #dbdbdb;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
        }
      }
    `
    document.head.appendChild(style)
  }

  function createChatState() {
    return {
      messages: [],
      isStreaming: false,
      inputValue: '',
      error: null,
      showStartGate: true,
    }
  }

  function constructorSessionStorageKey(projectKey) {
    return 'rtw_constructor_session:' + (projectKey || 'default')
  }

  function loadConstructorSessionId(projectKey) {
    try {
      return localStorage.getItem(constructorSessionStorageKey(projectKey)) || ''
    } catch {
      return ''
    }
  }

  function saveConstructorSessionId(projectKey, sessionId) {
    try {
      if (sessionId) {
        localStorage.setItem(constructorSessionStorageKey(projectKey), sessionId)
      }
    } catch {
      /* ignore */
    }
  }

  function clearConstructorSessionId(projectKey) {
    try {
      localStorage.removeItem(constructorSessionStorageKey(projectKey))
    } catch {
      /* ignore */
    }
  }

  function generateConstructorSessionId() {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
      }
    } catch {
      /* ignore */
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
      const r = (Math.random() * 16) | 0
      const v = ch === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  function ensureConstructorSessionId(projectKey, current) {
    const stored = loadConstructorSessionId(projectKey)
    if (stored) return stored
    if (current) return current
    const fresh = generateConstructorSessionId()
    saveConstructorSessionId(projectKey, fresh)
    return fresh
  }

  function pickSessionIdFromPayload(parsed) {
    if (!parsed || typeof parsed !== 'object') return ''
    if (typeof parsed.sessionId === 'string' && parsed.sessionId) return parsed.sessionId
    if (typeof parsed.session_id === 'string' && parsed.session_id) return parsed.session_id
    return ''
  }

  function createApiClient(options) {
    const { projectKey } = options
    const baseUrl = (options.apiBaseUrl || API_BASE_URL || '').replace(/\/$/, '')
    let sessionId = ensureConstructorSessionId(projectKey, loadConstructorSessionId(projectKey))
    /** Следующий запрос без cookie — после «Новый чат», чтобы бэк не цеплял старый constructor_site_sid */
    let omitCredentialsOnce = false
    let inFlight = false

    return {
      resetSession() {
        sessionId = generateConstructorSessionId()
        saveConstructorSessionId(projectKey, sessionId)
        omitCredentialsOnce = true
      },
      async sendMessage(payload) {
        const { text, onChunk, onDone, onError, onClassifierCommand } = payload

        if (!text) return
        if (inFlight) {
          console.warn(
            '[RostechChatWidget] Предыдущий stream ещё активен — повторный POST не отправлен.'
          )
          return
        }

        sessionId = ensureConstructorSessionId(projectKey, sessionId)

        const url = baseUrl + STREAM_PATH
        const body = {
          text,
          sessionId,
        }

        const useOmitCredentials = omitCredentialsOnce
        if (omitCredentialsOnce) {
          omitCredentialsOnce = false
        }

        const controller = new AbortController()
        const signal = controller.signal
        inFlight = true

        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(projectKey ? { 'x-project-key': projectKey } : {}),
              'x-constructor-session-id': sessionId,
            },
            credentials: useOmitCredentials ? 'omit' : 'include',
            cache: 'no-store',
            body: JSON.stringify(body),
            signal,
          })

          if (!res.ok || !res.body) {
            throw new Error('Bad response status: ' + res.status)
          }

          const reader = res.body.getReader()
          const decoder = new TextDecoder('utf-8')
          let buffer = ''
          let sawDone = false

          function finishStream() {
            if (sawDone) return
            sawDone = true
            onDone && onDone()
          }

          function handleSsePayload(parsed) {
            if (typeof parsed === 'string') {
              if (parsed.length && onChunk) onChunk(parsed)
              return
            }
            if (!parsed || typeof parsed !== 'object') return

            switch (parsed.type) {
              case 'session': {
                const nextSessionId = pickSessionIdFromPayload(parsed)
                if (nextSessionId) {
                  sessionId = nextSessionId
                  saveConstructorSessionId(projectKey, sessionId)
                  if (parsed.new === true) {
                    console.info(
                      '[RostechChatWidget] Новая сессия; sessionId записан в localStorage для следующих POST.'
                    )
                  }
                }
                return
              }
              case 'text': {
                const piece =
                  typeof parsed.text === 'string'
                    ? parsed.text
                    : typeof parsed.delta === 'string'
                      ? parsed.delta
                      : typeof parsed.content === 'string'
                        ? parsed.content
                        : ''
                if (piece.length && onChunk) onChunk(piece)
                return
              }
              case 'pdf_url': {
                const pdfUrl =
                  pickPdfUrlFromPayload(parsed) ||
                  (typeof parsed.url === 'string' ? parsed.url : '')
                const abs = normalizeReportUrl(pdfUrl, baseUrl)
                if (abs.length && onChunk) {
                  onChunk('\n\n' + abs)
                }
                return
              }
              case 'classifier_command':
                if (onClassifierCommand) onClassifierCommand(parsed)
                return
              case 'done':
                finishStream()
                return
              case 'first_run_pension':
              case 'firstRunPension': {
                const pdfRaw =
                  pickPdfUrlFromPayload(parsed) ||
                  pickPdfUrlFromPayload(parsed.summary)
                const pdfAbs = normalizeReportUrl(pdfRaw, baseUrl)

                const s = parsed.summary
                const summaryTextParts = []
                if (s && typeof s === 'object') {
                  if (typeof s.total_capital === 'number') {
                    summaryTextParts.push(
                      'Накопленный капитал: ' + Math.round(s.total_capital).toLocaleString('ru-RU') + ' ₽'
                    )
                  }
                  if (typeof s.projected_pension_monthly_future === 'number') {
                    summaryTextParts.push(
                      'Прогноз пенсии в будущих ценах: ' +
                        Math.round(s.projected_pension_monthly_future).toLocaleString('ru-RU') +
                        ' ₽/мес'
                    )
                  }
                  if (typeof s.projected_pension_monthly_present === 'number') {
                    summaryTextParts.push(
                      'Прогноз пенсии в текущих ценах: ' +
                        Math.round(s.projected_pension_monthly_present).toLocaleString('ru-RU') +
                        ' ₽/мес'
                    )
                  }
                  if (typeof s.state_pension_monthly_future === 'number') {
                    summaryTextParts.push(
                      'Ожидаемая гос. пенсия (будущие цены): ' +
                        Math.round(s.state_pension_monthly_future).toLocaleString('ru-RU') +
                        ' ₽/мес'
                    )
                  }
                  if (typeof s.state_pension_monthly_today === 'number') {
                    summaryTextParts.push(
                      'Ожидаемая гос. пенсия сегодня: ' +
                        Math.round(s.state_pension_monthly_today).toLocaleString('ru-RU') +
                        ' ₽/мес'
                    )
                  }
                }

                let summaryText = ''
                if (summaryTextParts.length) {
                  summaryText =
                    'Краткое резюме расчёта:\n- ' + summaryTextParts.join('\n- ')
                }

                if (pdfAbs) {
                  if (summaryText) summaryText += '\n\n'
                  else summaryText = 'Расчёт готов.'
                  summaryText += 'Отчёт можно скачать по ссылке:\n' + pdfAbs
                }

                if (!summaryText) return
                onChunk && onChunk('\n\n' + summaryText)
                return
              }
              default:
                return
            }
          }

          const pendingDataParts = []

          function flushPendingDataLines() {
            if (!pendingDataParts.length) return
            const payload = pendingDataParts.join('\n')
            pendingDataParts.length = 0
            if (payload === '[DONE]') return
            try {
              handleSsePayload(JSON.parse(payload))
            } catch (e) {
              console.warn(
                '[RostechChatWidget] SSE: не JSON после склейки data: (до 200 симв.):',
                payload.slice(0, 200)
              )
            }
          }

          while (true) {
            const { value, done } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            buffer = buffer.replace(/\r\n/g, '\n')
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const rawLine of lines) {
              const line = rawLine
              if (line === '') {
                flushPendingDataLines()
                continue
              }
              if (line.startsWith(':')) continue
              if (!line.startsWith('data:')) continue

              const dataPart = line.slice(5).trimStart()
              if (dataPart === '') continue
              if (dataPart === '[DONE]') continue

              try {
                const parsedLine = JSON.parse(dataPart)
                flushPendingDataLines()
                handleSsePayload(parsedLine)
              } catch {
                pendingDataParts.push(dataPart)
              }
            }
          }

          buffer = buffer.replace(/\r\n/g, '\n')
          if (buffer.trim()) {
            const tailLines = buffer.split('\n')
            for (const rawLine of tailLines) {
              if (rawLine === '') {
                flushPendingDataLines()
                continue
              }
              if (rawLine.startsWith(':')) continue
              if (!rawLine.startsWith('data:')) continue
              const dataPart = rawLine.slice(5).trimStart()
              if (!dataPart || dataPart === '[DONE]') continue
              try {
                const parsedLine = JSON.parse(dataPart)
                flushPendingDataLines()
                handleSsePayload(parsedLine)
              } catch {
                pendingDataParts.push(dataPart)
              }
            }
          }
          flushPendingDataLines()

          finishStream()
        } catch (err) {
          if (onError) onError(err)
        } finally {
          inFlight = false
        }
      },
    }
  }

  const PDF_URL_RE =
    /https?:\/\/[^\s<>"'()[\]]+\.pdf(?:[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?/gi
  const PDF_PATH_RE =
    /(?:^|[\s\n])(\/[^\s<>"'()]+\.pdf(?:\?[^\s<>"'()]*)?)/gi
  const PDF_AFTER_REPORT_RE =
    /(?:Отчёт|Отчет) можно скачать[^:\n]*:\s*\n?\s*(https?:\/\/\S+)/i

  function extractPdfLinksFromMessageContent(content) {
    if (!content || typeof content !== 'string') {
      return { displayText: '', pdfUrls: [] }
    }
    const apiBase = (API_BASE_URL || '').replace(/\/$/, '')
    const found = []
    const stripParts = []
    let m
    const reHttp = new RegExp(PDF_URL_RE.source, 'gi')
    while ((m = reHttp.exec(content)) !== null) {
      found.push(m[0])
      stripParts.push(m[0])
    }
    const rePath = new RegExp(PDF_PATH_RE.source, 'gi')
    while ((m = rePath.exec(content)) !== null) {
      const rel = (m[1] || '').trim()
      if (!rel) continue
      stripParts.push(rel)
      const full = apiBase ? apiBase + rel : rel
      found.push(full)
    }
    const reportLine = content.match(PDF_AFTER_REPORT_RE)
    if (reportLine && reportLine[1]) {
      const u = reportLine[1].replace(/[,;.]+$/, '')
      if (/\.pdf/i.test(u) || /\/reports?\//i.test(u)) {
        if (!found.includes(u)) {
          found.push(u)
          stripParts.push(u)
        }
      }
    }
    const pdfUrls = [...new Set(found)]
    let displayText = content
    for (const u of [...new Set(stripParts)]) {
      displayText = displayText.split(u).join('')
    }
    displayText = displayText
      .replace(/Отчёт можно скачать по ссылке:\s*(\n\s*)*/gi, '')
      .replace(/Отчет можно скачать по ссылке:\s*(\n\s*)*/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    return { displayText, pdfUrls }
  }

  function pickPdfUrlFromPayload(obj) {
    if (!obj || typeof obj !== 'object') return ''
    const keys = [
      'pdf_url',
      'pdfUrl',
      'report_url',
      'reportUrl',
      'pdf_link',
      'pdfLink',
      'download_url',
      'downloadUrl',
      'url',
    ]
    for (let i = 0; i < keys.length; i++) {
      const v = obj[keys[i]]
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
    return ''
  }

  function normalizeReportUrl(raw, apiBase) {
    if (!raw || typeof raw !== 'string') return ''
    const u = raw.trim()
    if (/^https?:\/\//i.test(u)) return u
    if (u.startsWith('//')) return 'https:' + u
    if (u.startsWith('/') && apiBase) {
      return apiBase.replace(/\/$/, '') + u
    }
    return u
  }

  function appendInlineBoldMarkdown(container, text) {
    if (!text) return
    const parts = text.split('**')
    if (parts.length < 3 || parts.length % 2 === 0) {
      container.appendChild(document.createTextNode(text))
      return
    }
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i]
      if (i % 2 === 0) {
        if (seg) container.appendChild(document.createTextNode(seg))
      } else {
        const strong = document.createElement('strong')
        strong.className = 'rtw-md-bold'
        strong.textContent = seg
        container.appendChild(strong)
      }
    }
  }

  function clearAllQuickReplies(messages) {
    messages.forEach((m) => {
      if (m.role === 'assistant' && m.quickReplies) {
        delete m.quickReplies
      }
    })
  }

  function applyClassifierQuickReplies(state, streamingAssistantMsg, command) {
    const labels = CLASSIFIER_QUICK_REPLIES[command]
    if (!labels || !labels.length) return
    const copy = labels.slice()
    const target =
      streamingAssistantMsg &&
      streamingAssistantMsg.role === 'assistant' &&
      state.messages.includes(streamingAssistantMsg)
        ? streamingAssistantMsg
        : null
    if (target) {
      target.quickReplies = copy
    } else {
      for (let i = state.messages.length - 1; i >= 0; i--) {
        if (state.messages[i].role === 'assistant') {
          state.messages[i].quickReplies = copy
          break
        }
      }
    }
  }

  function renderChat(root, state, api, uiOptions) {
    root.innerHTML = ''

    const theme = resolveTheme(uiOptions && uiOptions.theme)
    const skipStartGate = uiOptions && uiOptions.skipStartGate === true
    if (skipStartGate) {
      state.showStartGate = false
    }

    const assetBase = resolveAssetBaseUrl(uiOptions && uiOptions.assetBaseUrl)
    const avatarSrc = assetBase + 'assets/bot-avatar.png'
    let avatarFallbackSrc = ''
    try {
      avatarFallbackSrc = new URL('../assets/bot-avatar.png', assetBase || window.location.href).toString()
    } catch {
      avatarFallbackSrc = ''
    }
    if (avatarFallbackSrc === avatarSrc) {
      avatarFallbackSrc = ''
    }

    const page = document.createElement('div')
    page.className =
      'rtw-chat-page' + (theme.id === 'rostech' ? ' rtw-theme-rostech' : '')

    const header = document.createElement('div')
    header.className = 'rtw-chat-header'

    const headerLeft = document.createElement('div')
    headerLeft.className = 'rtw-chat-header-left'

    const headerAvatar = document.createElement('img')
    headerAvatar.className = 'rtw-chat-header-avatar'
    headerAvatar.src = avatarSrc
    headerAvatar.alt = ''
    headerAvatar.decoding = 'async'
    headerAvatar.onerror = function () {
      if (avatarFallbackSrc && headerAvatar.src !== avatarFallbackSrc) {
        headerAvatar.src = avatarFallbackSrc
        return
      }
      headerAvatar.style.display = 'none'
    }

    const titleWrap = document.createElement('div')
    titleWrap.className = 'rtw-chat-header-title'

    const titleMain = document.createElement('div')
    titleMain.className = 'rtw-chat-header-title-main'
    titleMain.textContent = theme.title

    const titleSub = document.createElement('div')
    titleSub.className = 'rtw-chat-header-title-sub'
    titleSub.textContent = theme.subtitle

    titleWrap.appendChild(titleMain)
    titleWrap.appendChild(titleSub)

    headerLeft.appendChild(headerAvatar)
    headerLeft.appendChild(titleWrap)

    const newChatBtn = document.createElement('button')
    newChatBtn.type = 'button'
    newChatBtn.className = 'rtw-new-chat-btn'
    newChatBtn.textContent = 'Новый чат'
    newChatBtn.title =
      'Сбросить сессию в этом браузере. Если бэк всё ещё цепляет старый диалог по cookie — очисти cookie сайта в настройках браузера.'

    const headerActions = document.createElement('div')
    headerActions.className = 'rtw-chat-header-actions'
    headerActions.appendChild(newChatBtn)

    const hasOnClose = !!(uiOptions && typeof uiOptions.onClose === 'function')
    let closeChatBtn = null
    if (hasOnClose) {
      closeChatBtn = document.createElement('button')
      closeChatBtn.type = 'button'
      closeChatBtn.className = 'rtw-close-chat-btn'
      closeChatBtn.textContent = 'Закрыть'
      headerActions.appendChild(closeChatBtn)
    }

    header.appendChild(headerLeft)
    header.appendChild(headerActions)

    const messagesWrap = document.createElement('div')
    messagesWrap.className = 'rtw-messages-wrap'

    const messagesEl = document.createElement('div')
    messagesEl.className = 'rtw-chat-messages'

    const startOverlay = document.createElement('div')
    startOverlay.className = 'rtw-start-overlay'
    const startCard = document.createElement('div')
    startCard.className = 'rtw-start-card'
    const startBadge = document.createElement('div')
    startBadge.className = 'rtw-start-badge'
    startBadge.textContent = theme.startBadge
    const startTitle = document.createElement('div')
    startTitle.className = 'rtw-start-title'
    startTitle.textContent = theme.startTitle
    const startDesc = document.createElement('div')
    startDesc.className = 'rtw-start-desc'
    startDesc.textContent = theme.startDesc
    const startBtn = document.createElement('button')
    startBtn.type = 'button'
    startBtn.className = 'rtw-start-btn'
    startBtn.textContent = 'Начать'
    startCard.appendChild(startBadge)
    startCard.appendChild(startTitle)
    startCard.appendChild(startDesc)
    startCard.appendChild(startBtn)
    startOverlay.appendChild(startCard)

    function syncStartGateUi() {
      const on = state.showStartGate === true
      startOverlay.classList.toggle('rtw-hidden', !on)
    }

    function renderMessages(scrollInstruction) {
      messagesEl.innerHTML = ''
      let scrollTargetEl = null
      state.messages.forEach((msg) => {
        const row = document.createElement('div')
        row.dataset.messageId = msg.id || ''
        row.className =
          'rtw-message-row ' +
          (msg.role === 'user' ? 'rtw-message-row-user' : 'rtw-message-row-bot')

        if (msg.role === 'user') {
          const bubble = document.createElement('div')
          bubble.className = 'rtw-message-bubble rtw-message-bubble-user'
          const textEl = document.createElement('div')
          textEl.className = 'rtw-message-text'
          appendInlineBoldMarkdown(textEl, msg.content)
          bubble.appendChild(textEl)
          row.appendChild(bubble)
        } else {
          const botAvatar = document.createElement('img')
          botAvatar.className = 'rtw-bot-avatar'
          botAvatar.src = avatarSrc
          botAvatar.alt = ''
          botAvatar.decoding = 'async'
          botAvatar.onerror = function () {
            if (avatarFallbackSrc && botAvatar.src !== avatarFallbackSrc) {
              botAvatar.src = avatarFallbackSrc
              return
            }
            botAvatar.style.visibility = 'hidden'
          }

          const col = document.createElement('div')
          col.className = 'rtw-bot-column'

          const bubble = document.createElement('div')
          bubble.className = 'rtw-message-bubble rtw-message-bubble-bot'

          const { displayText, pdfUrls } = extractPdfLinksFromMessageContent(
            msg.content
          )
          if (displayText) {
            const textEl = document.createElement('div')
            textEl.className = 'rtw-message-text'
            appendInlineBoldMarkdown(textEl, displayText)
            bubble.appendChild(textEl)
          }
          if (pdfUrls.length > 0) {
            const pdfBtn = document.createElement('button')
            pdfBtn.type = 'button'
            pdfBtn.className = 'rtw-pdf-report-btn'
            pdfBtn.textContent = 'Скачать отчёт (PDF)'
            pdfBtn.addEventListener('click', () =>
              triggerPdfDownload(pdfUrls[0], pdfBtn)
            )
            bubble.appendChild(pdfBtn)
          }
          if (!displayText && pdfUrls.length === 0) {
            bubble.textContent = msg.content || ''
          }

          col.appendChild(bubble)

          if (
            msg.quickReplies &&
            Array.isArray(msg.quickReplies) &&
            msg.quickReplies.length > 0
          ) {
            const qrWrap = document.createElement('div')
            qrWrap.className = 'rtw-quick-replies'
            msg.quickReplies.forEach((label) => {
              const b = document.createElement('button')
              b.type = 'button'
              b.className = 'rtw-quick-reply-btn'
              b.textContent = label
              b.disabled = state.isStreaming
              b.addEventListener('click', () =>
                submitUserText(label, { clearInput: false })
              )
              qrWrap.appendChild(b)
            })
            col.appendChild(qrWrap)
          }

          row.appendChild(botAvatar)
          row.appendChild(col)
        }

        messagesEl.appendChild(row)

        if (
          scrollInstruction &&
          scrollInstruction.type === 'message-start' &&
          scrollInstruction.messageId === msg.id
        ) {
          scrollTargetEl = row
        }
      })

      if (state.isStreaming) {
        const typingRow = document.createElement('div')
        typingRow.className = 'rtw-message-row rtw-message-row-bot'

        const typingCol = document.createElement('div')
        typingCol.className = 'rtw-bot-column'

        const typingIndicator = document.createElement('div')
        typingIndicator.className = 'rtw-message-typing'
        typingIndicator.innerHTML =
          '<span class="rtw-typing-label">Печатает</span><span class="rtw-typing-dot"></span><span class="rtw-typing-dot"></span><span class="rtw-typing-dot"></span>'

        typingCol.appendChild(typingIndicator)
        typingRow.appendChild(typingCol)
        messagesEl.appendChild(typingRow)
      }

      setTimeout(() => {
        if (!scrollInstruction) return
        if (scrollInstruction.type === 'bottom') {
          messagesEl.scrollTop = messagesEl.scrollHeight
          return
        }
        if (scrollInstruction.type === 'message-start' && scrollTargetEl) {
          messagesEl.scrollTop = Math.max(0, scrollTargetEl.offsetTop - 8)
        }
      }, 0)
    }

    if (!state.showStartGate && !state._initializedGreeting) {
      state.messages.push({
        id: 'greeting',
        role: 'assistant',
        content:
          'Привет! Я AI Реня, твой финансовый консультант.\nНапиши вопрос — отвечу в режиме живого диалога.',
      })
      state._initializedGreeting = true
    }

    const footer = document.createElement('div')
    footer.className = 'rtw-chat-footer'

    const errorBanner = document.createElement('div')
    errorBanner.className = 'rtw-error-banner rtw-hidden'
    footer.appendChild(errorBanner)

    const inputRow = document.createElement('div')
    inputRow.className = 'rtw-input-row'

    const inputWrap = document.createElement('div')
    inputWrap.className = 'rtw-input-wrap'

    const textarea = document.createElement('textarea')
    textarea.className = 'rtw-input-textarea'
    textarea.rows = 1
    textarea.placeholder = 'Введите сообщение...'
    textarea.value = state.inputValue || ''

    inputWrap.appendChild(textarea)

    const sendButton = document.createElement('button')
    sendButton.className = 'rtw-send-button'
    sendButton.type = 'button'
    sendButton.setAttribute('aria-label', 'Отправить')
    sendButton.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>'

    inputRow.appendChild(inputWrap)
    inputRow.appendChild(sendButton)

    const footerMeta = document.createElement('div')
    footerMeta.className = 'rtw-footer-meta'

    const typing = document.createElement('div')
    typing.className = 'rtw-typing-indicator rtw-hidden'
    typing.innerHTML =
      '<span class="rtw-typing-dot"></span><span class="rtw-typing-dot"></span><span class="rtw-typing-dot"></span>'

    const hint = document.createElement('div')
    hint.textContent = 'Сессия сохраняется в этом браузере (localStorage + cookie).'

    footerMeta.appendChild(typing)
    footerMeta.appendChild(hint)

    footer.appendChild(inputRow)
    footer.appendChild(footerMeta)

    messagesWrap.appendChild(messagesEl)
    messagesWrap.appendChild(startOverlay)

    page.appendChild(header)
    page.appendChild(messagesWrap)
    page.appendChild(footer)

    root.appendChild(page)

    renderMessages()
    syncStartGateUi()

    startBtn.addEventListener('click', () => {
      if (state.isStreaming) return
      state.showStartGate = false
      syncStartGateUi()
      submitUserText(START_MESSAGE, { clearInput: false })
    })

    function setError(msg) {
      state.error = msg
      if (msg) {
        errorBanner.textContent = msg
        errorBanner.classList.remove('rtw-hidden')
      } else {
        errorBanner.classList.add('rtw-hidden')
      }
    }

    function setStreaming(isStreaming, scrollInstruction) {
      state.isStreaming = isStreaming
      if (isStreaming) {
        typing.classList.remove('rtw-hidden')
        sendButton.disabled = true
        newChatBtn.disabled = true
        startBtn.disabled = true
        if (closeChatBtn) closeChatBtn.disabled = true
      } else {
        typing.classList.add('rtw-hidden')
        sendButton.disabled = false
        newChatBtn.disabled = false
        startBtn.disabled = false
        if (closeChatBtn) closeChatBtn.disabled = false
      }
      renderMessages(scrollInstruction)
    }

    function startNewChat() {
      if (state.isStreaming) return
      if (typeof api.resetSession === 'function') {
        api.resetSession()
      }
      setError(null)
      state.inputValue = ''
      textarea.value = ''
      state.messages = []
      state._initializedGreeting = false
      pendingClassifierCommand = ''
      streamingAssistantMsg = null

      if (skipStartGate) {
        state.showStartGate = false
        state.messages.push({
          id: 'greeting',
          role: 'assistant',
          content:
            'Привет! Я AI Реня, твой финансовый консультант.\nНапиши вопрос — отвечу в режиме живого диалога.',
        })
        state._initializedGreeting = true
      } else {
        state.showStartGate = true
      }

      syncStartGateUi()
      renderMessages()
    }

    newChatBtn.addEventListener('click', startNewChat)
    if (closeChatBtn) {
      closeChatBtn.addEventListener('click', () => {
        if (state.isStreaming) return
        uiOptions.onClose()
      })
    }

    function pushUserMessage(content) {
      const msg = {
        id: 'u-' + Date.now(),
        role: 'user',
        content,
      }
      state.messages.push(msg)
      renderMessages({ type: 'bottom' })
      return msg
    }

    function pushAssistantMessage() {
      const msg = {
        id: 'a-' + Date.now(),
        role: 'assistant',
        content: '',
      }
      state.messages.push(msg)
      renderMessages({ type: 'message-start', messageId: msg.id })
      return msg
    }

    let streamingAssistantMsg = null
    let pendingClassifierCommand = ''

    function submitUserText(text, opts) {
      const trimmed = (text || '').trim()
      if (!trimmed || state.isStreaming) return

      if (state.showStartGate) {
        state.showStartGate = false
        syncStartGateUi()
      }

      setError(null)
      clearAllQuickReplies(state.messages)

      if (opts && opts.clearInput) {
        state.inputValue = ''
        textarea.value = ''
      }

      pushUserMessage(trimmed)
      const assistantMsg = pushAssistantMessage()
      streamingAssistantMsg = assistantMsg
      pendingClassifierCommand = ''
      setStreaming(true, { type: 'message-start', messageId: assistantMsg.id })

      api.sendMessage({
        text: trimmed,
        onChunk(chunk) {
          assistantMsg.content += chunk
          renderMessages({ type: 'message-start', messageId: assistantMsg.id })
        },
        onClassifierCommand(parsed) {
          const cmd = typeof parsed.command === 'string' ? parsed.command : ''
          if (CLASSIFIER_QUICK_REPLIES[cmd]) {
            pendingClassifierCommand = cmd
          }
        },
        onDone() {
          const cmd = pendingClassifierCommand
          pendingClassifierCommand = ''
          if (cmd) {
            applyClassifierQuickReplies(state, assistantMsg, cmd)
          }
          streamingAssistantMsg = null
          setStreaming(false, { type: 'message-start', messageId: assistantMsg.id })
        },
        onError(err) {
          console.error('Widget stream error', err)
          pendingClassifierCommand = ''
          streamingAssistantMsg = null
          setStreaming(false)
          setError('Не удалось получить ответ. Попробуйте ещё раз.')
        },
      })
    }

    function handleSend() {
      const text = textarea.value.trim()
      if (!text || state.isStreaming) return
      submitUserText(text, { clearInput: true })
    }

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    })

    textarea.addEventListener('input', () => {
      state.inputValue = textarea.value
    })

    sendButton.addEventListener('click', handleSend)
  }

  function init(options) {
    options = options || {}
    if (!options.projectKey) {
      console.warn(
        '[RostechChatWidget] projectKey is required; виджет запустится в демо-режиме.'
      )
    }

    injectStyles()

    let mountEl = null
    if (options.mountSelector) {
      mountEl = document.querySelector(options.mountSelector)
    }
    if (!mountEl) {
      mountEl = document.getElementById(WIDGET_ID)
      if (!mountEl) {
        mountEl = document.createElement('div')
        mountEl.id = WIDGET_ID
        document.body.appendChild(mountEl)
      }
    }

    const state = createChatState()
    const api = createApiClient({
      projectKey: options.projectKey,
      apiBaseUrl: options.apiBaseUrl || API_BASE_URL,
    })
    renderChat(mountEl, state, api, {
      assetBaseUrl: options.assetBaseUrl,
      theme: options.theme,
      skipStartGate:
        options.skipStartGate === true || options.skipStartGate === 'true',
      onClose: typeof options.onClose === 'function' ? options.onClose : null,
    })

    return {
      sendSystemMessage(text) {
        state.messages.push({
          id: 'sys-' + Date.now(),
          role: 'assistant',
          content: text,
        })
      },
    }
  }

  if (!window.RostechChatWidget) {
    window.RostechChatWidget = { init }
  }

  function autoInitIfNeeded() {
    try {
      const currentScript =
        document.currentScript ||
        (function () {
          const scripts = document.getElementsByTagName('script')
          return scripts[scripts.length - 1]
        })()

      if (!currentScript) return

      const projectKey = currentScript.getAttribute('data-project-key')
      const mountSelector = currentScript.getAttribute('data-mount-selector')
      const themeAttr = currentScript.getAttribute('data-theme')
      const pathTheme =
        /\/rostech(\/|$)/i.test(window.location.pathname) ? 'rostech' : 'reni'

      if (projectKey) {
        const skipAttr = currentScript.getAttribute('data-skip-start-gate')
        window.RostechChatWidget.init({
          projectKey,
          mountSelector: mountSelector || undefined,
          theme: themeAttr || pathTheme,
          skipStartGate: skipAttr === 'true' || skipAttr === '1',
        })
      }
    } catch (e) {
      console.warn('[RostechChatWidget] auto-init failed', e)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitIfNeeded)
  } else {
    autoInitIfNeeded()
  }
})()
