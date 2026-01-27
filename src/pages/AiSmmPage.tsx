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

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [profileData, postsData] = await Promise.all([
                    smmApi.getMe(),
                    smmApi.getPosts()
                ]);
                setProfile(profileData);
                setPosts(postsData);
            } catch (error) {
                console.error('Failed to load SMM data:', error);
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
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
                                            <ImageIcon size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            placeholder="URL изображения (необязательно)"
                                            style={{
                                                width: '100%',
                                                padding: '12px 12px 12px 40px',
                                                borderRadius: '12px',
                                                border: '1px solid #eee',
                                                background: '#fcfcfc',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
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
