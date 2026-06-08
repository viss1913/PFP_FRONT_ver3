import React from 'react';
import Header from '../components/Header';
import NewsFeedCard from '../components/news/NewsFeedCard';
import NewsFeedSkeleton from '../components/news/NewsFeedSkeleton';
import NewsQuietState from '../components/news/NewsQuietState';
import { useNewsFeed } from '../hooks/useNewsFeed';

interface NewsPageProps {
    onNavigate: (page: 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'news' | 'macro' | 'settings') => void;
}

const DISCLAIMER =
    'Материал носит ознакомительный характер и не является индивидуальной инвестиционной рекомендацией.';

const NewsPage: React.FC<NewsPageProps> = ({ onNavigate }) => {
    const { data, loading, error } = useNewsFeed();

    const showQuiet =
        !loading && !error && (data?.quiet === true || (data && !data.quiet && data.items.length === 0));
    const showItems = !loading && !error && data && data.items.length > 0 && !data.quiet;

    return (
        <Header activePage="news" onNavigate={onNavigate}>
            <main className="lk-page-main" style={{ maxWidth: '1200px' }}>
                <div className="lk-card" style={{ textAlign: 'left', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#111' }}>
                        Важное сегодня
                    </h1>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
                        Что обсудить с клиентом
                    </p>

                    {error && (
                        <p style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '16px' }}>{error}</p>
                    )}

                    {loading && <NewsFeedSkeleton />}

                    {showQuiet && <NewsQuietState message={data?.message} />}

                    {showItems && (
                        <div>
                            {data!.items.map((item) => (
                                <NewsFeedCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}

                    <p
                        style={{
                            marginTop: '24px',
                            fontSize: '12px',
                            color: '#9ca3af',
                            lineHeight: 1.5,
                        }}
                    >
                        {DISCLAIMER}
                    </p>
                </div>
            </main>
        </Header>
    );
};

export default NewsPage;
