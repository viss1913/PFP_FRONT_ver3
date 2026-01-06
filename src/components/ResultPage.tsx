import React from 'react';
import ResultPageDesign from './ResultPageDesign';

interface ResultPageProps {
    data: any;
    onRestart: () => void;
}

const ResultPage: React.FC<ResultPageProps> = ({ data, onRestart }) => {
    return (
        <ResultPageDesign
            calculationData={data}
            onAddGoal={() => {
                // TODO: Реализовать добавление цели - можно вернуться к шагу выбора целей
                console.log('Добавить цель');
                onRestart(); // Временно - возвращаемся к началу
            }}
            onGoToReport={() => {
                // TODO: Реализовать переход к отчету (PDF или детальная страница)
                console.log('Перейти в отчет');
            }}
        />
    );
};

export default ResultPage;
