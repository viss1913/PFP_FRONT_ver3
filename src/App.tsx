import { useState, useEffect } from 'react'
import './App.css'
import LoginPage from './components/LoginPage'
import CJMFlow from './components/CJMFlow'
import ResultPage from './components/ResultPage'
import ResultPageTest from './components/ResultPageTest'
import AiCrmPage from './components/AiCrmPage'
import Header from './components/Header'
import AiAssistantPage from './pages/AiAssistantPage'
import AiSmmPage from './pages/AiSmmPage'
import AiAgentPage from './pages/AiAgentPage'
import ReportPreviewPage from './components/ReportPreviewPage'
import type { Client } from './types/client'
import { clientApi } from './api/clientApi'

type Page = 'login' | 'list' | 'cjm' | 'edit' | 'result' | 'test' | 'ai-assistant' | 'report-preview' | 'smm' | 'ai-agent'

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

    const handleNavigate = (page: 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'products' | 'smm') => {
        console.log('Navigating to:', page);
        if (page === 'ai-assistant') setCurrentPage('ai-assistant');
        else if (page === 'smm') setCurrentPage('smm');
        else if (page === 'ai-agent') setCurrentPage('ai-agent');
        else if (page === 'crm' || page === 'pfp') setCurrentPage('list');
        // Handle other pages if they have dedicated views
    };

    const handleLoginSuccess = () => {
        setCurrentPage('list')
    }

    const handleCalculationComplete = async (result: any) => {
        console.log('Calculation Complete. Result:', result);

        // Handle FirstRun response structure: { client_id, summary, goals }
        // NEW: client_id is now natively at the root
        const clientId = result?.client_id || result?.id || result?.summary?.client_id;

        if (clientId) {
            console.log('Resolved clientId for recalculation:', clientId);
            try {
                const fullClient = await clientApi.getClient(clientId);
                console.log('Fetched full client after calculation:', fullClient);
                // CRITICAL: Ensure ID is preserved
                if (!fullClient.id) {
                    fullClient.id = clientId;
                }
                setSelectedClient(fullClient);
            } catch (err) {
                console.error('Failed to fetch client after calculation:', err);
                // Fallback: at least set a minimal client object with ID
                setSelectedClient(prev => prev || { id: clientId } as any);
            }

            setCalculationResult(result);
        }
        // Fallback or legacy structures
        else if (result?.client) {
            const client = result.client;
            if (!client.id && result.client_id) client.id = result.client_id;
            setSelectedClient(client);
            setCalculationResult(result);
        } else {
            setCalculationResult(result);
        }

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
            if (!fullClient.id) fullClient.id = client.id; // Preserve ID
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
        console.log('handleRecalculate called with payload:', payload);

        // Robust clientId resolution
        const clientId = selectedClient?.id || calculationResult?.client_id || calculationResult?.id || calculationResult?.summary?.client_id;

        console.log('Current selectedClient:', selectedClient);
        console.log('CalculationResult clientId:', calculationResult?.client_id);

        if (!clientId) {
            console.error('No selected client or clientId found! Cannot recalculate.', { selectedClient, calculationResult });
            alert('Ошибка: Клиент не выбран (ID не найден).');
            return null;
        }

        // If we have clientId but no selectedClient, try to recover it silently
        if (!selectedClient && clientId) {
            clientApi.getClient(clientId).then(setSelectedClient).catch(console.error);
        }

        setLoadingPlan(true);
        try {
            console.log(`Sending recalculate request to /client/${clientId}/recalculate`);
            // NEW: Adding client_id to the payload as requested
            const finalPayload = {
                ...payload,
                client_id: clientId
            };
            const result = await clientApi.recalculate(clientId, finalPayload);
            console.log('Recalculate success:', result);

            setCalculationResult(result);
            return result;
        } catch (error) {
            console.error('Recalculation failed:', error);
            alert('Не удалось произвести пересчет. Проверьте данные.');
            return null;
        } finally {
            setLoadingPlan(false);
        }
    }

    const handleAddGoal = async (goal: any) => {
        if (!selectedClient) return;
        setLoadingPlan(true);
        try {
            console.log(`Sending addGoal request for client ${selectedClient.id}`);
            const result = await clientApi.addGoal(selectedClient.id, goal);
            console.log('addGoal success:', result);

            setCalculationResult(result);

            // After adding a goal, refresh client info
            const updatedClient = await clientApi.getClient(selectedClient.id);
            if (!updatedClient.id) updatedClient.id = selectedClient.id; // Preserve ID
            setSelectedClient(updatedClient);
        } catch (error) {
            console.error('Failed to add goal:', error);
            alert('Не удалось добавить цель.');
        } finally {
            setLoadingPlan(false);
        }
    };

    const handleDeleteGoal = async (goalId: number) => {
        if (!selectedClient) return;
        if (!window.confirm('Вы уверены, что хотите удалить эту цель?')) return;

        setLoadingPlan(true);
        try {
            console.log(`Sending deleteGoal request for client ${selectedClient.id}, goal ${goalId}`);
            const result = await clientApi.deleteGoal(selectedClient.id, goalId);
            console.log('deleteGoal success:', result);

            setCalculationResult(result);

            // Refresh client info
            const updatedClient = await clientApi.getClient(selectedClient.id);
            if (!updatedClient.id) updatedClient.id = selectedClient.id; // Preserve ID
            setSelectedClient(updatedClient);
        } catch (error) {
            console.error('Failed to delete goal:', error);
            alert('Не удалось удалить цель.');
        } finally {
            setLoadingPlan(false);
        }
    };

    if (currentPage === 'report-preview') {
        return <ReportPreviewPage />;
    }

    return (
        <div className="app-container">
            {currentPage === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} />}

            {currentPage === 'ai-assistant' && (
                <AiAssistantPage onNavigate={handleNavigate} />
            )}

            {currentPage === 'smm' && (
                <AiSmmPage onNavigate={handleNavigate} />
            )}

            {currentPage === 'ai-agent' && (
                <AiAgentPage onNavigate={handleNavigate} />
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
                        onNavigate={handleNavigate}
                    />
                </>
            )}

            {currentPage === 'cjm' && (
                <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
                    <Header
                        activePage="pfp"
                        onNavigate={handleNavigate}
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
                        onNavigate={handleNavigate}
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
                        onNavigate={handleNavigate}
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
                        onAddGoal={handleAddGoal}
                        onDeleteGoal={handleDeleteGoal}
                        isCalculating={loadingPlan}
                    />
                </div>
            )}

            {currentPage === 'test' && <ResultPageTest />}
        </div>
    )
}

export default App
