import React from 'react';

const SKELETON_COUNT = 3;

const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #f0f0f0',
    marginBottom: '12px',
};

const bar = (width: string, height: number, marginBottom = 10): React.CSSProperties => ({
    width,
    height,
    borderRadius: '6px',
    background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
    backgroundSize: '200% 100%',
    animation: 'newsSkeletonShimmer 1.2s ease-in-out infinite',
    marginBottom,
});

const NewsFeedSkeleton: React.FC = () => (
    <>
        <style>
            {`
                @keyframes newsSkeletonShimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}
        </style>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div key={i} style={cardStyle}>
                <div style={bar('80px', 22, 12)} />
                <div style={bar('90%', 18, 8)} />
                <div style={bar('70%', 14, 12)} />
                <div style={bar('50%', 12, 0)} />
            </div>
        ))}
    </>
);

export default NewsFeedSkeleton;
