import React, { useState } from 'react'
import './App.css'
import LoginPage from './components/LoginPage'
import CJMFlow from './components/CJMFlow'
import ResultPage from './components/ResultPage'

type Page = 'login' | 'cjm' | 'result'

function App() {
    const [currentPage, setCurrentPage] = useState<Page>('login')
    const [calculationResult, setCalculationResult] = useState<any>(null)

    const handleLoginSuccess = () => {
        setCurrentPage('cjm')
    }

    const handleCalculationComplete = (result: any) => {
        setCalculationResult(result)
        setCurrentPage('result')
    }

    return (
        <div className="app-container">
            {currentPage === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} />}
            {currentPage === 'cjm' && <CJMFlow onComplete={handleCalculationComplete} />}
            {currentPage === 'result' && (
                <ResultPage
                    data={calculationResult}
                    onRestart={() => setCurrentPage('cjm')}
                />
            )}
        </div>
    )
}

export default App
