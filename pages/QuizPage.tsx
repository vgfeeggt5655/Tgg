
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
        const shareText = `I just scored ${result.score}/${result.totalQuestions} (${result.percentage}%) on "${result.pdfName}" via STUDY AI! 🚀`;
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Score copied to clipboard!');
        });
    };

    if (mcqs.length === 0) {
        return <div className="text-center p-20 text-gray-700 font-black tracking-widest uppercase">Initializing Knowledge Base...</div>;
    }

    if (isFinished) {
        const result = quizResults[0];
        return (
            <div className="max-w-2xl mx-auto bg-gray-900 p-10 rounded-[3rem] shadow-2xl border border-gray-800 my-10">
                <h1 className="text-4xl font-black text-center mb-6 text-white uppercase tracking-tighter">Session Terminated</h1>
                <div className="flex flex-col items-center mb-10">
                    <div className="w-32 h-32 rounded-full bg-primary-500/10 flex items-center justify-center border-4 border-primary-500 shadow-[0_0_50px_rgba(139,92,246,0.2)] mb-4">
                        <span className="text-4xl font-black text-white">{result.percentage}%</span>
                    </div>
                    <p className="text-xl text-gray-400 font-bold uppercase tracking-widest">{result.score} / {result.totalQuestions} CORRECT</p>
                </div>
                
                <div className="flex justify-center mb-12">
                    <button
                        onClick={shareResults}
                        className="bg-green-600 hover:bg-green-700 text-white font-black py-4 px-10 rounded-2xl inline-flex items-center transition-all hover:scale-105 shadow-xl shadow-green-500/20"
                    >
                       <ClipboardCopyIcon className="h-6 w-6 mr-3" /> EXPORT PERFORMANCE
                    </button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                    {mcqs.map((mcq, index) => (
                        <div key={index} className="p-6 rounded-2xl bg-gray-950/50 border border-gray-800">
                            <p className="font-bold text-gray-200 leading-relaxed mb-4">{index + 1}. {mcq.question}</p>
                            <div className="grid grid-cols-1 gap-2">
                                <p className="text-xs uppercase font-black tracking-widest text-gray-600">User Input:</p>
                                <p className={`text-sm font-bold ${selectedAnswers[index] === mcq.answer ? 'text-green-400' : 'text-red-400'}`}>
                                    {selectedAnswers[index] || 'NULL'}
                                </p>
                                <p className="text-xs uppercase font-black tracking-widest text-gray-600 mt-2">Correct Output:</p>
                                <p className="text-sm font-bold text-green-400">{mcq.answer}</p>
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
        <div className="max-w-2xl mx-auto py-10">
            <div className="bg-gray-900 p-10 rounded-[3rem] shadow-2xl border border-gray-800 relative overflow-hidden">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <span className="text-xs font-black text-primary-500 uppercase tracking-[0.3em] mb-2 block">Active Session</span>
                        <h2 className="text-2xl font-black text-white truncate max-w-[400px]">{pdfName}</h2>
                    </div>
                    <span className="text-gray-600 font-black text-lg tracking-tighter">{currentQuestionIndex + 1} <span className="text-gray-800">/</span> {mcqs.length}</span>
                </div>
                
                {/* ULTRA SMOOTH PROGRESS BAR */}
                <div className="w-full bg-gray-950 rounded-full h-4 mb-12 overflow-hidden border border-gray-800 p-1">
                    <div 
                        className="bg-primary-500 h-full rounded-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_0_20px_rgba(139,92,246,0.6)]" 
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>

                <div className="min-h-[350px] flex flex-col">
                    <p className="text-2xl font-black mb-10 text-white leading-snug tracking-tight">{currentMCQ.question}</p>
                    <div className="space-y-4 flex-grow">
                        {currentMCQ.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(option)}
                                className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 transform font-bold text-lg
                                    ${selectedAnswers[currentQuestionIndex] === option 
                                        ? 'bg-primary-950/30 border-primary-500 text-white shadow-2xl shadow-primary-500/10 scale-[1.03]' 
                                        : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300 hover:scale-[1.01]'}`}
                            >
                                <span className="inline-block w-10 h-10 rounded-xl bg-gray-900 text-center leading-10 mr-5 font-black text-xs uppercase tracking-widest text-primary-500">
                                    {String.fromCharCode(65 + index)}
                                </span>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="mt-12 flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={!selectedAnswers[currentQuestionIndex]}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-black py-4 px-14 rounded-2xl disabled:bg-gray-950 disabled:text-gray-800 disabled:cursor-not-allowed shadow-2xl shadow-primary-500/20 transition-all hover:-translate-y-2 active:translate-y-0 uppercase tracking-widest text-sm"
                    >
                        {currentQuestionIndex < mcqs.length - 1 ? 'Next Phase' : 'Terminate & Results'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizPage;
