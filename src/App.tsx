import { useState, useEffect } from 'react'
import './App.css'
import LoginPage from './components/LoginPage'
import CJMFlow from './components/CJMFlow'
import ResultPage from './components/ResultPage'
import ResultPageTest from './components/ResultPageTest'
import AiCrmPage from './components/AiCrmPage'
import Header from './components/Header'
import AiAssistantPage from './pages/AiAssistantPage'
import ReportPreviewPage from './components/ReportPreviewPage'
import type { Client } from './types/client'
import { clientApi } from './api/clientApi'

type Page = 'login' | 'list' | 'cjm' | 'edit' | 'result' | 'test' | 'ai-assistant' | 'report-preview'

function App() {
    // Для тестирования: устанавливаем 'test' чтобы сразу видеть страницу результатов
    const [currentPage, setCurrentPage] = useState<Page>('login')
    const [calculationResult, setCalculationResult] = useState<any>(null)
    const [newClientData, setNewClientData] = useState<{ fio: string, phone: string, uuid: string } | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [loadingPlan, setLoadingPlan] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('page') === 'preview') {
            setCurrentPage('report-preview');
        }
    }, []);

    const handleLoginSuccess = () => {
        setCurrentPage('list')
    }

    const handleCalculationComplete = (result: any) => {
        setCalculationResult(result)
        setCurrentPage('result')
    }

    const handleNewClient = () => {
        setNewClientData(null); // No data from list anymore, starts fresh in CJM
        setSelectedClient(null); // Clear selected client if any
        setCurrentPage('cjm');
    }

    const handleSelectClient = async (client: Client) => {
        setLoadingPlan(true);
        try {
            const fullClient = await clientApi.getClient(client.id);
            setSelectedClient(fullClient);
            setNewClientData(null);

            if (fullClient.goals_summary) {
                // If client has a saved plan, show it
                setCalculationResult(fullClient.goals_summary);
                setCurrentPage('result');
            } else {
                // Otherwise open CJM flow for editing/creation
                setCurrentPage('edit');
            }
        } catch (error) {
            console.error('Failed to fetch client details:', error);
            // Fallback to edit mode if fetch fails
            setSelectedClient(client);
            setCurrentPage('edit');
        } finally {
            setLoadingPlan(false);
        }
    }

    const handleRecalculate = async (payload: any) => {
        if (!selectedClient) return;
        setLoadingPlan(true);
        try {
            const result = await clientApi.recalculate(selectedClient.id, payload);
            setCalculationResult(result);
            // ResultPage should automatically re-render with new data
        } catch (error) {
            console.error('Recalculation failed:', error);
            alert('Не удалось произвести пересчет. Проверьте данные.');
        } finally {
            setLoadingPlan(false);
        }
    }

    if (currentPage === 'report-preview') {
        return <ReportPreviewPage />;
    }

    return (
        <div className="app-container">
            {currentPage === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} />}

            {currentPage === 'ai-assistant' && (
                <AiAssistantPage
                    onNavigate={(page) => {
                        if (page === 'crm') setCurrentPage('list');
                        else if (page === 'pfp') setCurrentPage('list'); // Default to list for now
                        else if (page === 'ai-assistant') setCurrentPage('ai-assistant');
                        // Add other navigations as needed
                    }}
                />
            )}

            {currentPage === 'list' && (
                <>
                    {loadingPlan && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            color: '#fff'
                        }}>
                            Загрузка финансового плана...
                        </div>
                    )}
                    <AiCrmPage
                        onSelectClient={handleSelectClient}
                        onNewClient={handleNewClient}
                        onNavigate={(page) => {
                            console.log('Navigate to:', page);
                            if (page === 'ai-assistant') setCurrentPage('ai-assistant');
                            else if (page === 'crm') setCurrentPage('list');
                        }}
                    />
                </>
            )}

            {currentPage === 'cjm' && (
                <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
                    <Header
                        activePage="pfp"
                        onNavigate={(page) => {
                            if (page === 'crm') setCurrentPage('list');
                            else if (page === 'ai-assistant') setCurrentPage('ai-assistant');
                        }}
                    />
                    <CJMFlow
                        onComplete={handleCalculationComplete}
                        initialData={newClientData || undefined}
                        onBack={() => setCurrentPage('list')}
                    />
                </div>
            )}

            {currentPage === 'edit' && selectedClient && (
                <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
                    <Header
                        activePage="pfp"
                        onNavigate={(page) => {
                            if (page === 'crm') setCurrentPage('list');
                            else if (page === 'ai-assistant') setCurrentPage('ai-assistant');
                        }}
                    />
                    <CJMFlow
                        onComplete={handleCalculationComplete}
                        clientId={selectedClient.id}
                        onBack={() => setCurrentPage('list')}
                    />
                </div>
            )}

            {currentPage === 'result' && (
                <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
                    <Header
                        activePage="pfp"
                        onNavigate={(page) => {
                            if (page === 'crm') setCurrentPage('list');
                            else if (page === 'ai-assistant') setCurrentPage('ai-assistant');
                        }}
                    />
                    {loadingPlan && (
                        <div style={{
                            position: 'fixed',
                            top: '80px',
                            right: '40px',
                            padding: '12px 24px',
                            background: 'var(--primary)',
                            color: '#fff',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 1000
                        }}>
                            Обновление расчета...
                        </div>
                    )}
                    <ResultPage
                        data={calculationResult}
                        client={selectedClient}
                        onRestart={() => setCurrentPage('list')}
                        onRecalculate={handleRecalculate}
                    />
                </div>
            )}

            {currentPage === 'test' && <ResultPageTest />}
        </div>
    )
}

export default App
