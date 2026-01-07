import { useState } from 'react'
import './App.css'
import LoginPage from './components/LoginPage'
import CJMFlow from './components/CJMFlow'
import ResultPage from './components/ResultPage'
import ResultPageTest from './components/ResultPageTest'
import AiCrmPage from './components/AiCrmPage'
import Header from './components/Header'
import type { Client } from './types/client'

type Page = 'login' | 'list' | 'cjm' | 'edit' | 'result' | 'test'

function App() {
    // Для тестирования: устанавливаем 'test' чтобы сразу видеть страницу результатов
    const [currentPage, setCurrentPage] = useState<Page>('login')
    const [calculationResult, setCalculationResult] = useState<any>(null)
    const [newClientData, setNewClientData] = useState<{ fio: string, phone: string, uuid: string } | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setNewClientData(null); // Clear new client data
        setCurrentPage('edit');
    }

    return (
        <div className="app-container">
            {currentPage === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} />}

            {currentPage === 'list' && (
                <AiCrmPage
                    onSelectClient={handleSelectClient}
                    onNewClient={handleNewClient}
                    onNavigate={(page) => {
                        console.log('Navigate to:', page);
                        // Handle navigation if needed, or just log
                    }}
                />
            )}

            {currentPage === 'cjm' && (
                <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
                    <Header activePage="pfp" />
                    <CJMFlow
                        onComplete={handleCalculationComplete}
                        initialData={newClientData || undefined}
                        onBack={() => setCurrentPage('list')}
                    />
                </div>
            )}

            {currentPage === 'edit' && selectedClient && (
                <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
                    <Header activePage="pfp" />
                    <CJMFlow
                        onComplete={handleCalculationComplete}
                        clientId={selectedClient.id}
                        onBack={() => setCurrentPage('list')}
                    />
                </div>
            )}

            {currentPage === 'result' && (
                <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
                    <Header activePage="pfp" />
                    <ResultPage
                        data={calculationResult}
                        onRestart={() => setCurrentPage('list')}
                    />
                </div>
            )}

            {currentPage === 'test' && <ResultPageTest />}
        </div>
    )
}

export default App
