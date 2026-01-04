import { useState } from 'react'
import './App.css'
import LoginPage from './components/LoginPage'
import CJMFlow from './components/CJMFlow'
import ResultPage from './components/ResultPage'
import ClientList from './components/ClientList'
import type { Client } from './types/client'

type Page = 'login' | 'list' | 'cjm' | 'edit' | 'result'

function App() {
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

    const handleNewClient = (data: { fio: string, phone: string, uuid: string }) => {
        setNewClientData(data);
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
                <ClientList
                    onSelectClient={handleSelectClient}
                    onNewClient={handleNewClient}
                />
            )}

            {currentPage === 'cjm' && (
                <CJMFlow
                    onComplete={handleCalculationComplete}
                    initialData={newClientData || undefined}
                    onBack={() => setCurrentPage('list')}
                />
            )}

            {currentPage === 'edit' && selectedClient && (
                <CJMFlow
                    onComplete={handleCalculationComplete}
                    clientId={selectedClient.id}
                    onBack={() => setCurrentPage('list')}
                />
            )}

            {currentPage === 'result' && (
                <ResultPage
                    data={calculationResult}
                    onRestart={() => setCurrentPage('list')}
                />
            )}
        </div>
    )
}

export default App
