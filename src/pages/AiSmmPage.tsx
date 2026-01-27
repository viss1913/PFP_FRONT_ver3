import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { smmApi, type SmmPost, type SmmAgentProfile } from '../api/smmApi';
import { Send, Image as ImageIcon, History, SendHorizontal, LayoutDashboard } from 'lucide-react';

interface AiSmmPageProps {
    onNavigate: (page: 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'products' | 'smm') => void;
}

const AiSmmPage: React.FC<AiSmmPageProps> = ({ onNavigate }) => {
    const [profile, setProfile] = useState<SmmAgentProfile | null>(null);
    const [posts, setPosts] = useState<SmmPost[]>([]);
    const [postText, setPostText] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [healthStatus, setHealthStatus] = useState<'loading' | 'ok' | 'error'>('loading');
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            console.log('SMM: Loading initial data...');
            try {
                // Проверка доступности бэкенда
                const isHealthy = await smmApi.checkHealth();
                setHealthStatus(isHealthy ? 'ok' : 'error');

                if (!isHealthy) {
                    console.warn('SMM: Health check failed.');
                }

                const [profileData, postsData] = await Promise.all([
                    smmApi.getMe(),
                    smmApi.getPosts()
                ]);
                setProfile(profileData);
                setPosts(postsData);
            } catch (error: any) {
                console.error('SMM: Failed to load data:', error);
                setErrorDetails(error?.response?.data ? JSON.stringify(error.response.data) : error.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const handleSendPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postText.trim() || isSending) return;

        setIsSending(true);
        try {
            const result = await smmApi.sendManualPost(postText, imageUrl);
            if (result.success) {
                setPostText('');
                setImageUrl('');
                // Refresh posts
                const freshPosts = await smmApi.getPosts();
                setPosts(freshPosts);
            }
        } catch (error) {
            console.error('Failed to send post:', error);
            alert('Ошибка при отправке поста');
        } finally {
            setIsSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            console.log('SMM: Uploading image:', file.name);
            const result = await smmApi.uploadImage(file);
            console.log('SMM: Upload result:', result);
            if (result.success && result.url) {
                setImageUrl(result.url);
            } else {
                alert('Ошибка при загрузке изображения');
            }
        } catch (error) {
            console.error('SMM: Upload failed:', error);
            alert('Не удалось загрузить изображение');
        } finally {
            setIsUploading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('ru-RU', {
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            <Header activePage="smm" onNavigate={onNavigate} />

            <main style={{
                flex: 1,
                padding: '32px',
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {/* Dashboard Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '32px'
                }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: '#111' }}>AI SMM</h1>
                        <p style={{ color: '#666', marginTop: '8px' }}>
                            Управление контентом вашего канала {profile?.telegram_channel_id}
                        </p>
                    </div>
                    {profile && (
                        <div style={{
                            background: '#fff',
                            padding: '12px 20px',
                            borderRadius: '16px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #D946EF, #8B5CF6)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff'
                            }}>
                                <LayoutDashboard size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 600 }}>{profile.fio_firstname} {profile.fio_lastname}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>{profile.region}</div>
                            </div>
                        </div>
                    )}
                </div>

                {healthStatus === 'error' && (
                    <div style={{
                        background: '#fff5f5',
                        border: '1px solid #feb2b2',
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '32px',
                        color: '#c53030'
                    }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>⚠️ Ошибка подключения к бэкенду SMM</h3>
                        <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
                            Бэкенд не вернул ответ на проверку здоровья (Health Check). Это может означать, что адрес в настройках Vercel указан неверно или сервер недоступен.
                        </p>
                        <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
                            <div><b>Configured URL:</b> {import.meta.env.VITE_SMM_API_URL || 'NOT SET (using internal fallback)'}</div>
                            {errorDetails && <div style={{ marginTop: '8px' }}><b>Response Error:</b> {errorDetails}</div>}
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
                    {/* Left Column: Create Post & History */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Create Post Form */}
                        <div style={{
                            background: '#fff',
                            borderRadius: '24px',
                            padding: '32px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                            border: '1px solid #f0f0f0'
                        }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <SendHorizontal size={20} color="#D946EF" />
                                Создать новый пост
                            </h2>
                            <form onSubmit={handleSendPost}>
                                <div style={{ marginBottom: '20px' }}>
                                    <textarea
                                        value={postText}
                                        onChange={(e) => setPostText(e.target.value)}
                                        placeholder="О чем хотите рассказать сегодня?.."
                                        style={{
                                            width: '100%',
                                            height: '150px',
                                            padding: '16px',
                                            borderRadius: '16px',
                                            border: '1px solid #eee',
                                            background: '#fcfcfc',
                                            fontSize: '16px',
                                            resize: 'none',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#D946EF'}
                                        onBlur={(e) => e.target.style.borderColor = '#eee'}
                                    />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <label style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '12px 20px',
                                            background: '#f8f9fa',
                                            border: '2px dashed #eee',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            color: '#666',
                                            transition: 'all 0.2s'
                                        }}
                                            onMouseOver={(e) => e.currentTarget.style.borderColor = '#D946EF'}
                                            onMouseOut={(e) => e.currentTarget.style.borderColor = '#eee'}
                                        >
                                            <ImageIcon size={20} color={imageUrl ? '#D946EF' : '#999'} />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {isUploading ? 'Загрузка...' : imageUrl ? 'Изображение выбрано' : 'Добавить изображение'}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                style={{ display: 'none' }}
                                                disabled={isUploading}
                                            />
                                        </label>
                                        {imageUrl && (
                                            <button
                                                type="button"
                                                onClick={() => setImageUrl('')}
                                                style={{
                                                    padding: '8px 12px',
                                                    background: '#fff',
                                                    border: '1px solid #eee',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    color: '#ff4d4f',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Удалить
                                            </button>
                                        )}
                                    </div>
                                    {imageUrl && (
                                        <div style={{ marginTop: '12px' }}>
                                            <img
                                                src={imageUrl}
                                                alt="Preview"
                                                style={{
                                                    width: '100px',
                                                    height: '100px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    border: '2px solid #D946EF'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={!postText.trim() || isSending}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'linear-gradient(135deg, #D946EF, #8B5CF6)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        opacity: (!postText.trim() || isSending) ? 0.6 : 1,
                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        if (postText.trim() && !isSending) {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(217, 70, 239, 0.3)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    {isSending ? 'Отправка...' : 'Опубликовать'}
                                    {!isSending && <Send size={18} />}
                                </button>
                            </form>
                        </div>

                        {/* Recent Posts Feed */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <History size={20} color="#D946EF" />
                                Последние публикации
                            </h2>
                            {isLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Загрузка постов...</div>
                            ) : posts.length === 0 ? (
                                <div style={{
                                    background: '#fff',
                                    padding: '40px',
                                    borderRadius: '24px',
                                    textAlign: 'center',
                                    color: '#999',
                                    border: '1px solid #f0f0f0'
                                }}>
                                    История публикаций пуста
                                </div>
                            ) : (
                                posts.map(post => (
                                    <div key={post.id} style={{
                                        background: '#fff',
                                        borderRadius: '20px',
                                        padding: '24px',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                                        border: '1px solid #f0f0f0'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <span style={{
                                                fontSize: '12px',
                                                color: '#999',
                                                fontWeight: 500
                                            }}>
                                                {formatDate(post.sent_at)}
                                            </span>
                                            <span style={{
                                                fontSize: '11px',
                                                padding: '4px 8px',
                                                background: post.kind === 'regular' ? '#f0f9ff' : '#fdf4ff',
                                                color: post.kind === 'regular' ? '#0369a1' : '#a21caf',
                                                borderRadius: '6px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase'
                                            }}>
                                                {post.kind === 'regular' ? 'Авто' : 'Ручной'}
                                            </span>
                                        </div>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '15px',
                                            lineHeight: 1.6,
                                            color: '#333',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {post.payload_text}
                                        </p>
                                        {post.payload_image_url && (
                                            <img
                                                src={post.payload_image_url}
                                                alt="Post content"
                                                style={{
                                                    marginTop: '16px',
                                                    width: '100%',
                                                    borderRadius: '12px',
                                                    maxHeight: '300px',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column: Mini Stats/Tips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{
                            background: '#fff',
                            borderRadius: '24px',
                            padding: '24px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                            border: '1px solid #f0f0f0'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Совет AI</h3>
                            <div style={{
                                background: '#fdf4ff',
                                padding: '16px',
                                borderRadius: '16px',
                                fontSize: '14px',
                                color: '#701a75',
                                lineHeight: 1.5,
                                borderLeft: '4px solid #D946EF'
                            }}>
                                Посты с изображениями получают на 40% больше вовлеченности. Старайтесь добавлять визуальный контент к важным сообщениям.
                            </div>
                        </div>

                        <div style={{
                            background: '#fff',
                            borderRadius: '24px',
                            padding: '24px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                            border: '1px solid #f0f0f0'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Статус канала</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ color: '#666' }}>Соединение</span>
                                    <span style={{ color: '#10b981', fontWeight: 600 }}>Активно</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ color: '#666' }}>Авто-постинг</span>
                                    <span style={{ color: profile?.is_active ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                                        {profile?.is_active ? 'Включен' : 'Выключен'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ color: '#666' }}>ID канала</span>
                                    <span style={{ fontWeight: 500 }}>{profile?.telegram_channel_id || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AiSmmPage;
