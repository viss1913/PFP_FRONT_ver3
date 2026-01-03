import React from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCcw, CheckCircle2 } from 'lucide-react';

interface ResultPageProps {
    data: any;
    onRestart: () => void;
}

const ResultPage: React.FC<ResultPageProps> = ({ data, onRestart }) => {
    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
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
                </div>
            </motion.div>

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
        </div>
    );
};

export default ResultPage;
