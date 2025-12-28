
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateMCQs, generateSummary, generateFlashcards, generateStudyNote, StudyNote } from '../services/geminiService';
import useLocalStorage from '../hooks/useLocalStorage';
import Spinner from '../components/Spinner';
import { MCQ, Flashcard } from '../types';
import { UploadIcon, XIcon } from '../components/icons';
import * as pdfjsLib from 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

type GenerationType = 'quiz' | 'summary' | 'flashcards' | 'studynote' | null;

interface UploadedFile {
    id: string;
    name: string;
    text: string;
    size: number;
}

const AI_STYLES_ID = 'ai-generated-styles';

const HomePage: React.FC = () => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [pdfName, setPdfName] = useState('');
    const [numQuestions, setNumQuestions] = useState(20);
    const [isParsing, setIsParsing] = useState(false);
    const [loading, setLoading] = useState<GenerationType>(null);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState('');
    const [flashcards, setFlashcards] = useLocalStorage<Flashcard[]>('currentFlashcards', []);
    const [showFlashcards, setShowFlashcards] = useState(false);
    const [studyNote, setStudyNote] = useState('');
    const [, setStoredMCQs] = useLocalStorage<MCQ[]>('currentMCQs', []);
    const [, setStoredPdfName] = useLocalStorage<string>('currentPdfName', '');
    const [uploadMessage, setUploadMessage] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        return () => {
            document.getElementById(AI_STYLES_ID)?.remove();
        };
    }, []);

    const getAggregatedText = () => {
        return uploadedFiles.map(f => `--- SOURCE: ${f.name} ---\n${f.text}`).join('\n\n');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setError('');
        setIsParsing(true);
        setUploadMessage(`Processing ${files.length} file(s)...`);

        const newFiles: UploadedFile[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type !== 'application/pdf') continue;

            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                const numPages = pdf.numPages;
                let fullText = '';

                for (let j = 1; j <= numPages; j++) {
                    const page = await pdf.getPage(j);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }
                
                newFiles.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    text: fullText.trim(),
                    size: file.size
                });
            } catch (err) {
                console.error(`Error parsing ${file.name}:`, err);
                setError(`Failed to extract text from ${file.name}`);
            }
        }

        if (newFiles.length > 0) {
            setUploadedFiles(prev => [...prev, ...newFiles]);
            setUploadMessage(`✅ Successfully added ${newFiles.length} document(s).`);
            if (!pdfName) {
                setPdfName(newFiles[0].name.replace(/\.pdf$/i, '') + (newFiles.length > 1 ? ' & Others' : ''));
            }
        }
        setIsParsing(false);
        if (e.target) e.target.value = '';
    };

    const removeFile = (id: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== id));
    };

    const clearAllFiles = () => {
        setUploadedFiles([]);
        setPdfName('');
        setUploadMessage('');
    };

    const handleGeneration = async (type: GenerationType) => {
        const fullText = getAggregatedText();
        if (!fullText.trim()) {
            setError('Please upload at least one PDF first.');
            return;
        }
        if (!pdfName.trim()) {
            setError('Please provide a name for this study session.');
            return;
        }

        setError('');
        setUploadMessage('');
        setLoading(type);
        setSummary('');
        setShowFlashcards(false);
        setStudyNote('');
        document.getElementById(AI_STYLES_ID)?.remove();

        try {
            if (type === 'quiz') {
                const mcqs = await generateMCQs(fullText, numQuestions);
                setStoredMCQs(mcqs);
                setStoredPdfName(pdfName);
                navigate('/quiz');
                setLoading(null);
            } else if (type === 'summary') {
                const result = await generateSummary(fullText);
                setSummary(result);
                setLoading(null);
            } else if (type === 'flashcards') {
                const result = await generateFlashcards(fullText);
                setFlashcards(result);
                setShowFlashcards(true);
                setLoading(null);
            } else if (type === 'studynote') {
                const result: StudyNote = await generateStudyNote(fullText);
                const styleElement = document.createElement('style');
                styleElement.id = AI_STYLES_ID;
                styleElement.innerHTML = result.cssStyles;
                document.head.appendChild(styleElement);
                setStudyNote(result.htmlContent);
                setLoading(null);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
            setLoading(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <header className="text-center mb-10">
                <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter">
                    AI Study <span className="text-primary-500">Master</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    The ultimate dark-themed tool for power students. Combine PDFs into quizzes, summaries, and pro notes.
                </p>
            </header>
            
            <div className="bg-gray-900 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-gray-800">
                
                {/* 1. File Upload Section */}
                <div className="mb-8">
                    <label className="block text-lg font-black text-gray-200 mb-4 uppercase tracking-widest text-sm opacity-60">
                        1. Select PDFs
                    </label>
                    <div className="relative group">
                        <div className="flex justify-center items-center px-6 pt-10 pb-10 border-2 border-gray-800 border-dashed rounded-2xl min-h-[160px] bg-gray-950/40 group-hover:border-primary-500 group-hover:bg-primary-500/5 transition-all cursor-pointer">
                            <div className="space-y-2 text-center">
                                {isParsing ? (
                                    <div className="flex flex-col items-center">
                                        <Spinner />
                                        <p className="text-sm text-gray-500 mt-4 animate-pulse">Scanning Documents...</p>
                                    </div>
                                ) : (
                                    <>
                                        <UploadIcon className="mx-auto h-12 w-12 text-gray-600 group-hover:text-primary-500 transition-colors" />
                                        <div className="flex flex-col text-sm text-gray-400">
                                            <label htmlFor="pdf-upload" className="relative cursor-pointer rounded-md font-black text-primary-500 hover:text-primary-400 text-lg">
                                                <span>Click to browse</span>
                                                <input id="pdf-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} multiple />
                                            </label>
                                            <p className="mt-1">or drag files directly here</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. File List */}
                {uploadedFiles.length > 0 && (
                    <div className="mb-8 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/20">
                        <div className="bg-gray-800/40 px-5 py-3 border-b border-gray-800 flex justify-between items-center">
                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{uploadedFiles.length} Loaded Assets</span>
                            <button onClick={clearAllFiles} className="text-xs text-red-500 hover:text-red-400 font-black uppercase tracking-widest">Clear All</button>
                        </div>
                        <ul className="divide-y divide-gray-800 max-h-48 overflow-y-auto custom-scrollbar">
                            {uploadedFiles.map(file => (
                                <li key={file.id} className="flex justify-between items-center px-5 py-4 hover:bg-white/5 transition-colors">
                                    <span className="text-sm truncate text-gray-300 flex items-center">
                                        <span className="mr-3 text-primary-500">📄</span> {file.name}
                                    </span>
                                    <button onClick={() => removeFile(file.id)} className="text-gray-500 hover:text-red-500 transition-colors"><XIcon className="h-4 w-4" /></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 3. Settings Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
                    <div>
                        <label className="block text-xs font-black text-gray-500 mb-4 uppercase tracking-widest">
                            2. Session Label
                        </label>
                        <input
                            type="text"
                            className="w-full p-5 border border-gray-800 rounded-2xl bg-gray-950 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder-gray-700"
                            placeholder="e.g. Finals 2024"
                            value={pdfName}
                            onChange={(e) => setPdfName(e.target.value)}
                        />
                    </div>

                    <div className="bg-gray-950/60 p-6 rounded-2xl border border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                3. Question Count
                            </label>
                            <span className="px-5 py-1 rounded-full bg-primary-600 text-white font-black text-xl shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                                {numQuestions}
                            </span>
                        </div>
                        
                        <input
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary-500 mb-6"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                        />
                        
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                            {[5, 10, 15, 20, 25, 30, 40, 50, 75, 100].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setNumQuestions(val)}
                                    className={`py-2 rounded-xl text-xs font-black transition-all border ${
                                        numQuestions === val
                                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg'
                                        : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                                    }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && <p className="mb-8 text-red-400 text-center font-bold text-sm bg-red-950/30 p-4 rounded-2xl border border-red-900/50">{error}</p>}

                {/* 4. Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-8 border-t border-gray-800">
                    <button
                        onClick={() => handleGeneration('quiz')}
                        disabled={!!loading || uploadedFiles.length === 0}
                        className="group flex flex-col items-center justify-center p-6 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all disabled:opacity-30 disabled:translate-y-0"
                    >
                        {loading === 'quiz' ? <Spinner /> : <><span className="text-2xl mb-1">🧠</span> QUIZ</>}
                    </button>
                    <button
                        onClick={() => handleGeneration('summary')}
                        disabled={!!loading || uploadedFiles.length === 0}
                        className="group flex flex-col items-center justify-center p-6 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all disabled:opacity-30 disabled:translate-y-0"
                    >
                        {loading === 'summary' ? <Spinner /> : <><span className="text-2xl mb-1">📝</span> SUM</>}
                    </button>
                    <button
                        onClick={() => handleGeneration('flashcards')}
                        disabled={!!loading || uploadedFiles.length === 0}
                        className="group flex flex-col items-center justify-center p-6 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all disabled:opacity-30 disabled:translate-y-0"
                    >
                        {loading === 'flashcards' ? <Spinner /> : <><span className="text-2xl mb-1">🃏</span> CARDS</>}
                    </button>
                    <button
                        onClick={() => handleGeneration('studynote')}
                        disabled={!!loading || uploadedFiles.length === 0}
                        className="group flex flex-col items-center justify-center p-6 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all disabled:opacity-30 disabled:translate-y-0"
                    >
                        {loading === 'studynote' ? <Spinner /> : <><span className="text-2xl mb-1">📚</span> NOTE</>}
                    </button>
                </div>
            </div>

            {/* Content Results (Summary) */}
            {summary && (
                <div className="mt-12 bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-800">
                    <h2 className="text-3xl font-black mb-8 text-white border-l-4 border-primary-500 pl-4 uppercase tracking-tighter">Deep Synthesis</h2>
                    <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">{summary}</div>
                </div>
            )}

            {/* Flashcards */}
            {showFlashcards && flashcards.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-3xl font-black mb-8 text-center uppercase tracking-widest text-primary-500">Knowledge Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {flashcards.map((card, idx) => (
                            <div key={idx} className="bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-800 hover:border-primary-500/50 transition-all group">
                                <h3 className="font-black text-primary-400 text-xl mb-4 group-hover:text-primary-300 transition-colors uppercase tracking-tighter">{card.term}</h3>
                                <p className="text-gray-400 group-hover:text-gray-200 transition-colors leading-relaxed">{card.definition}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
