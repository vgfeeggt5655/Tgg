
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import { MCQ, QuizResult } from '../types';
import { ClipboardCopyIcon } from '../components/icons';

const QuizPage: React.FC = () => {
    const [mcqs] = useLocalStorage<MCQ[]>('currentMCQs', []);
    const [pdfName] = useLocalStorage<string>('currentPdfName', 'Untitled Quiz');
    const [quizResults, setQuizResults] = useLocalStorage<QuizResult[]>('quizResults', []);
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});
    const [isFinished, setIsFinished] = useState(false);

    const navigate = useNavigate();

    const finishQuiz = useCallback(() => {
        setIsFinished(true);
        const score = Object.entries(selectedAnswers).reduce((acc, [index, answer]) => {
            if (mcqs[Number(index)]?.answer === answer) {
                return acc + 1;
            }
            return acc;
        }, 0);

        const newResult: QuizResult = {
            id: new Date().toISOString(),
            pdfName,
            score,
            totalQuestions: mcqs.length,
            percentage: mcqs.length > 0 ? Math.round((score / mcqs.length) * 100) : 0,
            date: new Date().toLocaleDateString(),
        };
        setQuizResults(prevResults => [newResult, ...prevResults]);
    }, [mcqs, pdfName, selectedAnswers, setQuizResults]);

    useEffect(() => {
        if (mcqs.length === 0) {
             navigate('/');
        }
    }, [mcqs.length, navigate]);

    const handleAnswerSelect = (option: string) => {
        if (isFinished) return;
        setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: option }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < mcqs.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishQuiz();
        }
    };
    
    const shareResults = () => {
        const result = quizResults[0];
        if (!result) return;
        const shareText = `I just scored ${result.score}/${result.totalQuestions} (${result.percentage}%) on a quiz about "${result.pdfName}"! 🎉`;
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Results copied to clipboard!');
        });
    };

    if (mcqs.length === 0) {
        return <div className="text-center p-8 text-gray-400">No quiz available. Please return to the homepage to generate one.</div>;
    }

    if (isFinished) {
        const result = quizResults[0];
        return (
            <div className="max-w-2xl mx-auto bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800">
                <h1 className="text-3xl font-black text-center mb-4 text-white">Quiz Complete!</h1>
                <p className="text-center text-xl mb-6 text-gray-300">You scored <span className="text-primary-500 font-bold">{result.score}</span> out of {result.totalQuestions} ({result.percentage}%)</p>
                <div className="text-center mb-8">
                    <button
                        onClick={shareResults}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl inline-flex items-center transition-transform hover:scale-105"
                    >
                       <ClipboardCopyIcon className="h-5 w-5 mr-2" /> Share Results
                    </button>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {mcqs.map((mcq, index) => (
                        <div key={index} className="p-5 rounded-xl bg-gray-800 border border-gray-700">
                            <p className="font-bold text-gray-100">{index + 1}. {mcq.question}</p>
                            <div className="mt-3 flex flex-col gap-1">
                                <p className="text-sm">Your answer: <span className={selectedAnswers[index] === mcq.answer ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{selectedAnswers[index] || 'Not answered'}</span></p>
                                <p className="text-sm">Correct answer: <span className="text-green-400 font-bold">{mcq.answer}</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    const currentMCQ = mcqs[currentQuestionIndex];
    const progressPercentage = ((currentQuestionIndex + 1) / mcqs.length) * 100;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-white truncate max-w-[80%]">{pdfName}</h2>
                    <span className="text-gray-500 font-mono text-sm">{currentQuestionIndex + 1} / {mcqs.length}</span>
                </div>
                
                {/* SMOOTH PROGRESS BAR */}
                <div className="w-full bg-gray-800 rounded-full h-3 mb-8 overflow-hidden">
                    <div 
                        className="bg-primary-500 h-full rounded-full transition-all duration-700 ease-in-out shadow-[0_0_15px_rgba(139,92,246,0.5)]" 
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>

                <div className="min-h-[300px] flex flex-col">
                    <p className="text-xl font-bold mb-8 text-gray-100 leading-relaxed">{currentMCQ.question}</p>
                    <div className="space-y-4 flex-grow">
                        {currentMCQ.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(option)}
                                className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-300 transform
                                    ${selectedAnswers[currentQuestionIndex] === option 
                                        ? 'bg-primary-950/40 border-primary-500 text-white shadow-lg shadow-primary-500/10 scale-[1.02]' 
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-gray-800/80 hover:scale-[1.01]'}`}
                            >
                                <span className="inline-block w-8 h-8 rounded-lg bg-gray-700 text-center leading-8 mr-3 font-bold text-xs uppercase">
                                    {String.fromCharCode(65 + index)}
                                </span>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="mt-10 flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={!selectedAnswers[currentQuestionIndex]}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-black py-3 px-10 rounded-xl disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed shadow-xl shadow-primary-500/20 transition-all hover:-translate-y-1 active:translate-y-0"
                    >
                        {currentQuestionIndex < mcqs.length - 1 ? 'NEXT QUESTION' : 'FINISH QUIZ'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizPage;
