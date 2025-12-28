
import React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { QuizResult } from '../types';

const DashboardPage: React.FC = () => {
    const [quizResults] = useLocalStorage<QuizResult[]>('quizResults', []);

    const totalQuizzes = quizResults.length;
    const totalQuestionsAnswered = quizResults.reduce((sum, result) => sum + result.totalQuestions, 0);
    const averageScore = totalQuizzes > 0 ? Math.round(quizResults.reduce((sum, result) => sum + result.percentage, 0) / totalQuizzes) : 0;
    const lastQuiz = quizResults[0] || null;

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-black mb-10 tracking-tighter uppercase">Your <span className="text-primary-500">Analytics</span></h1>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-800 border-l-8 border-l-primary-600">
                    <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Total Quizzes</h2>
                    <p className="text-4xl font-black text-white">{totalQuizzes}</p>
                </div>
                <div className="bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-800 border-l-8 border-l-green-600">
                    <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Success Rate</h2>
                    <p className="text-4xl font-black text-white">{averageScore}%</p>
                </div>
                <div className="bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-800 border-l-8 border-l-indigo-600">
                    <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">XP Earned</h2>
                    <p className="text-4xl font-black text-white">{totalQuestionsAnswered * 10}</p>
                </div>
            </div>

            {/* Last Quiz Section */}
            {lastQuiz && (
                 <div className="bg-gray-900 p-10 rounded-3xl shadow-2xl mb-10 border border-gray-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl rounded-full"></div>
                    <h2 className="text-2xl font-black mb-6 text-white uppercase tracking-tighter">Recent Performance</h2>
                    <div className="flex flex-wrap justify-between items-center gap-6">
                        <div>
                            <p className="font-black text-2xl text-primary-400">{lastQuiz.pdfName}</p>
                            <p className="text-sm text-gray-500 font-mono mt-1">Completion: {lastQuiz.date}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-5xl font-black text-white">{lastQuiz.percentage}%</p>
                             <p className="text-sm text-gray-500 mt-1 uppercase font-black tracking-widest">{lastQuiz.score} / {lastQuiz.totalQuestions} Correct</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quiz History */}
            <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 overflow-hidden">
                <div className="px-10 py-6 bg-gray-800/30 border-b border-gray-800">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Historical Log</h2>
                </div>
                {quizResults.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs text-gray-500 uppercase font-black tracking-widest bg-gray-950/40">
                                <tr>
                                    <th className="px-10 py-4">Session</th>
                                    <th className="px-10 py-4">Date</th>
                                    <th className="px-10 py-4">Raw Score</th>
                                    <th className="px-10 py-4 text-right">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {quizResults.map(result => (
                                    <tr key={result.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-10 py-6 font-bold text-gray-200 group-hover:text-primary-400">{result.pdfName}</td>
                                        <td className="px-10 py-6 text-gray-500 font-mono text-sm">{result.date}</td>
                                        <td className="px-10 py-6 text-gray-400">{result.score}/{result.totalQuestions}</td>
                                        <td className="px-10 py-6 text-right font-black text-xl text-white">{result.percentage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-20 text-center">
                        <p className="text-gray-600 font-black uppercase tracking-widest italic">No data records found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
