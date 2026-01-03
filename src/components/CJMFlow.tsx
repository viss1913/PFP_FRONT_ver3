import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Target, ShieldCheck } from 'lucide-react';
import StepGenderAge from './steps/StepGenderAge';
import StepGoalSelection from './steps/StepGoalSelection';
import StepGoalDetails from './steps/StepGoalDetails';
import StepRiskProfile from './steps/StepRiskProfile';
import axios from 'axios';

interface CJMFlowProps {
    onComplete: (result: any) => void;
}

export interface CJMData {
    gender: 'male' | 'female';
    age: number;
    goalTypeId: number;
    goalName: string;
    targetAmount: number;
    termMonths: number;
    initialCapital: number;
    avgMonthlyIncome: number;
    riskProfile: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
}

const CJMFlow: React.FC<CJMFlowProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<CJMData>({
        gender: 'male',
        age: 39,
        goalTypeId: 3,
        goalName: 'Инвестиции',
        targetAmount: 1500000,
        termMonths: 60,
        initialCapital: 100000,
        avgMonthlyIncome: 150000,
        riskProfile: 'BALANCED'
    });

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const payload = {
                goals: [
                    {
                        goal_type_id: data.goalTypeId,
                        name: data.goalName,
                        target_amount: data.targetAmount,
                        term_months: data.termMonths,
                        risk_profile: data.riskProfile,
                        initial_capital: data.initialCapital,
                        avg_monthly_income: data.avgMonthlyIncome
                    }
                ],
                client: {
                    birth_date: new Date(new Date().getFullYear() - data.age, 0, 1).toISOString().split('T')[0],
                    sex: data.gender,
                    avg_monthly_income: data.avgMonthlyIncome,
                    total_liquid_capital: data.initialCapital
                }
            };

            const response = await axios.post('https://pfpbackend-production.up.railway.app/api/client/calculate', payload);
            onComplete(response.data);
        } catch (error) {
            console.error('Calculation error:', error);
            alert('Ошибка при расчете. Пожалуйста, попробуйте снова.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { title: 'Личные данные', icon: <User size={20} /> },
        { title: 'Выбор цели', icon: <Target size={20} /> },
        { title: 'Параметры', icon: <Calendar size={20} /> },
        { title: 'Риск-профиль', icon: <ShieldCheck size={20} /> }
    ];

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                {steps.map((s, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: step > i + 1 ? 'var(--secondary)' : step === i + 1 ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            color: step === i + 1 ? '#000' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 8px',
                            transition: 'all 0.3s ease'
                        }}>
                            {s.icon}
                        </div>
                        <span style={{ fontSize: '12px', color: step === i + 1 ? 'var(--primary)' : 'var(--text-muted)' }}>{s.title}</span>
                        {i < steps.length - 1 && (
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                left: 'calc(50% + 25px)',
                                right: 'calc(-50% + 25px)',
                                height: '2px',
                                background: step > i + 1 ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'
                            }} />
                        )}
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="premium-card"
                >
                    {step === 1 && <StepGenderAge data={data} setData={setData} onNext={nextStep} />}
                    {step === 2 && <StepGoalSelection data={data} setData={setData} onNext={nextStep} onPrev={prevStep} />}
                    {step === 3 && <StepGoalDetails data={data} setData={setData} onNext={nextStep} onPrev={prevStep} />}
                    {step === 4 && <StepRiskProfile data={data} setData={setData} onComplete={handleCalculate} onPrev={prevStep} loading={loading} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default CJMFlow;
