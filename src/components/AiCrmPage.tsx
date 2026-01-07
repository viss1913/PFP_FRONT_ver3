import React from 'react';
import Header from './Header';
import ClientList from './ClientList';
import type { Client } from '../types/client';
import { Send } from 'lucide-react';

interface AiCrmPageProps {
    onSelectClient: (client: Client) => void;
    onNewClient: (data: { fio: string, phone: string, uuid: string }) => void;
}

const AiCrmPage: React.FC<AiCrmPageProps> = ({ onSelectClient, onNewClient }) => {
    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            <Header activePage="crm" />

            <main style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 400px) 1fr',
                gap: '24px',
                padding: '24px',
                maxWidth: '1600px',
                margin: '0 auto',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {/* Left Column: AI Chat Placeholder */}
                <div style={{
                    background: '#fff',
                    borderRadius: '24px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    height: 'calc(100vh - 112px)', // Header + padding
                    position: 'sticky',
                    top: '88px'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                background: '#eee'
                            }}>
                                {/* AI Avatar Placeholder */}
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="AI" style={{ width: '100%', height: '100%' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#666' }}>
                                    Привет! Как дела? Будем работать?
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Input Placeholder */}
                    <div style={{
                        marginTop: 'auto',
                        background: '#f0f0f0',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ width: '24px' }}></div> {/* Spacer */}
                        <Send size={20} color="#666" />
                    </div>
                </div>

                {/* Right Column: Client List */}
                <div style={{
                    background: '#fff',
                    borderRadius: '24px',
                    padding: '32px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                }}>
                    <ClientList
                        onSelectClient={onSelectClient}
                        onNewClient={onNewClient}
                        embedded={true}
                    />
                </div>
            </main>
        </div>
    );
};

export default AiCrmPage;
