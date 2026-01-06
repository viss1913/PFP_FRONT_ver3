import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCcw, CheckCircle2 } from 'lucide-react';
import ResultDesignView from './ResultDesignView';

// Конфигурация Figma
// File Key: HIc2F0OeTuvafJNSTKMm3E (из URL: https://www.figma.com/design/HIc2F0OeTuvafJNSTKMm3E/Фронт)
// Токен должен быть в переменной окружения VITE_FIGMA_TOKEN (см. .env файл)
const FIGMA_ACCESS_TOKEN = import.meta.env.VITE_FIGMA_TOKEN || '';
const FIGMA_FILE_KEY = import.meta.env.VITE_FIGMA_FILE_KEY || 'HIc2F0OeTuvafJNSTKMm3E';

interface ResultPageProps {
    data: any;
    onRestart: () => void;
}

const ResultPage: React.FC<ResultPageProps> = ({ data, onRestart }) => {
    const [showRawData, setShowRawData] = useState(false);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="premium-card"
                style={{ textAlign: 'center', marginBottom: '32px' }}
            >
                <div style={{ color: 'var(--secondary)', marginBottom: '16px' }}>
                    <CheckCircle2 size={64} style={{ margin: '0 auto' }} />
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Расчет готов!</h1>
                <p style={{ color: 'var(--text-muted)' }}>Мы проанализировали ваши данные и подготовили персональный финансовый план.</p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
                    <button className="btn-primary" style={{ width: 'auto', background: 'var(--secondary)' }}>
                        <Download size={18} style={{ marginRight: '8px' }} />
                        Скачать отчет (PDF)
                    </button>
                    <button className="btn-primary" style={{ width: 'auto', background: 'rgba(255,255,255,0.1)', color: '#fff' }} onClick={onRestart}>
                        <RefreshCcw size={18} style={{ marginRight: '8px' }} />
                        Начать заново
                    </button>
                    <button 
                        className="btn-primary" 
                        style={{ width: 'auto', background: 'rgba(255,255,255,0.1)', color: '#fff' }} 
                        onClick={() => setShowRawData(!showRawData)}
                    >
                        {showRawData ? 'Скрыть' : 'Показать'} JSON
                    </button>
                </div>
            </motion.div>

            {/* Верстка по дизайну из Figma с подстановкой данных */}
            {FIGMA_FILE_KEY && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ marginBottom: '24px' }}
                >
                    <ResultDesignView
                        fileKey={FIGMA_FILE_KEY}
                        accessToken={FIGMA_ACCESS_TOKEN}
                        calculationData={data}
                    />
                </motion.div>
            )}

            {/* Сырые данные (JSON) - показываются по требованию */}
            {showRawData && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="premium-card"
                    style={{ padding: '0' }}
                >
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Сырые данные (JSON)</h2>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>API Response</span>
                    </div>
                    <div style={{ padding: '24px', overflow: 'auto', maxHeight: '500px' }}>
                        <pre style={{
                            fontSize: '14px',
                            color: 'var(--primary)',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all'
                        }}>
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                </motion.div>
            )}

            {/* Предупреждение, если нет FIGMA_FILE_KEY */}
            {!FIGMA_FILE_KEY && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="premium-card"
                    style={{ padding: '24px', background: 'rgba(255, 199, 80, 0.1)', border: '1px solid rgba(255, 199, 80, 0.3)' }}
                >
                    <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
                        ⚠️ Для отображения Figma дизайна необходимо настроить FIGMA_FILE_KEY.
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        Получите File Key из URL вашего Figma файла (например: https://www.figma.com/file/<strong>FILE_KEY</strong>/...)
                        и добавьте в .env файл как VITE_FIGMA_FILE_KEY
                    </p>
                </motion.div>
            )}
        </div>
    );
};

export default ResultPage;
