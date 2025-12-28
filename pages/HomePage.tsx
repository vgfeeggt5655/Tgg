
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
        <div className="max-w-4xl mx-auto py-10">
            <header className="text-center mb-12">
                <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
                    STUDY <span className="text-primary-500">AI</span>
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
                    The most powerful learning engine for modern students. Complete PDF transformation.
                </p>
            </header>
            
            <div className="bg-gray-900/50 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-gray-800">
                
                {/* 1. File Upload Section */}
                <div className="mb-10">
                    <label className="block text-xs font-black text-gray-500 mb-5 uppercase tracking-[0.3em]">
                        Step 01: Resource Upload
                    </label>
                    <div className="relative group">
                        <div className="flex justify-center items-center px-10 pt-14 pb-14 border-2 border-gray-800 border-dashed rounded-3xl bg-gray-950/40 group-hover:border-primary-500 group-hover:bg-primary-500/5 transition-all cursor-pointer">
                            <div className="space-y-4 text-center">
                                {isParsing ? (
                                    <div className="flex flex-col items-center">
                                        <Spinner />
                                        <p className="text-sm text-primary-400 mt-4 font-bold tracking-widest animate-pulse">EXTRACTING KNOWLEDGE...</p>
                                    </div>
                                ) : (
                                    <>
                                        <UploadIcon className="mx-auto h-16 w-16 text-gray-700 group-hover:text-primary-500 transition-all duration-500" />
                                        <div className="flex flex-col text-sm text-gray-400">
                                            <label htmlFor="pdf-upload" className="relative cursor-pointer rounded-md font-black text-primary-500 hover:text-primary-400 text-xl transition-colors">
                                                <span>Drop your PDFs here</span>
                                                <input id="pdf-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} multiple />
                                            </label>
                                            <p className="mt-2 text-gray-600 font-bold uppercase tracking-wider text-xs">Maximum extraction quality enabled</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. File List */}
                {uploadedFiles.length > 0 && (
                    <div className="mb-10 overflow-hidden rounded-3xl border border-gray-800 bg-gray-950/40">
                        <div className="bg-gray-800/30 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                            <span className="text-xs font-black text-primary-500 uppercase tracking-widest">{uploadedFiles.length} Documents Active</span>
                            <button onClick={clearAllFiles} className="text-xs text-red-500 hover:text-red-400 font-black uppercase tracking-widest transition-colors">Flush All</button>
                        </div>
                        <ul className="divide-y divide-gray-800 max-h-48 overflow-y-auto">
                            {uploadedFiles.map(file => (
                                <li key={file.id} className="flex justify-between items-center px-6 py-5 hover:bg-primary-500/5 transition-colors">
                                    <span className="text-sm font-bold truncate text-gray-300 flex items-center">
                                        <span className="mr-4 text-primary-500 text-lg">📄</span> {file.name}
                                    </span>
                                    <button onClick={() => removeFile(file.id)} className="text-gray-600 hover:text-red-500 transition-colors"><XIcon className="h-5 w-5" /></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 3. Settings Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
                    <div>
                        <label className="block text-xs font-black text-gray-500 mb-4 uppercase tracking-[0.2em]">
                            Step 02: Session Identity
                        </label>
                        <input
                            type="text"
                            className="w-full p-6 border border-gray-800 rounded-2xl bg-gray-950 text-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder-gray-800 font-bold text-lg"
                            placeholder="Study Session Title..."
                            value={pdfName}
                            onChange={(e) => setPdfName(e.target.value)}
                        />
                    </div>

                    <div className="bg-gray-950/60 p-8 rounded-2xl border border-gray-800">
                        <div className="flex justify-between items-center mb-8">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">
                                Step 03: Question Intensity
                            </label>
                            <span className="px-6 py-2 rounded-xl bg-primary-600 text-white font-black text-2xl shadow-[0_0_30px_rgba(139,92,246,0.4)]">
                                {numQuestions}
                            </span>
                        </div>
                        
                        <input
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            className="w-full h-3 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary-500 mb-10"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                        />
                        
                        <div className="grid grid-cols-5 gap-3">
                            {[10, 20, 30, 50, 100].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setNumQuestions(val)}
                                    className={`py-3 rounded-xl text-xs font-black transition-all border ${
                                        numQuestions === val
                                        ? 'bg-primary-600 border-primary-600 text-white shadow-xl scale-105'
                                        : 'bg-gray-900 border-gray-800 text-gray-600 hover:border-gray-600 hover:text-gray-300'
                                    }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && <p className="mb-8 text-red-400 text-center font-black text-sm bg-red-950/40 p-5 rounded-2xl border border-red-900/50 uppercase tracking-widest">{error}</p>}

                {/* 4. Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-10 border-t border-gray-800">
                    <button
                        onClick={() => handleGeneration('quiz')}
                        disabled={!!loading || uploadedFiles.length === 0}
                        className="group flex flex-col items-center justify-center p-8 bg-primary-600 hover:bg-primary-700 text-white rounded-3xl font-black shadow-2xl hover:-translate-y-2 transition-all duration-500 disabled:opacity-20 disabled:translate-y-0"
                    >
                        {loading === 'quiz' ? <Spinner /> : <><span className="text-3xl mb-2">⚡</span> <span className="tracking-widest text-xs">GENERATE QUIZ</span></>}
                    </button>
                    <button
                        onClick={() => handleGeneration('summary')}
                        disabled={!!loading || uploadedFiles.length === 0}
                        className="group flex flex-col items-center justify-center p-8 bg-gray-800 hover:bg-gray-700 text-white rounded-3xl font-black shadow-2xl hover:-translate-y-2 transition-all duration-500 disabled:opacity-20 disabled:translate-y-0"
                    >
                        {loading === 'summary' ? <Spinner /> : <><span className="text-3xl mb-2">📄</span> <span className="tracking-widest text-xs">SUMMARIZE</span></>}
                    </button>
                    <button
                        onClick={() => handleGeneration('flashcards')}
                        disabled={!!loading || uploadedFiles.length === 0}
                        className="group flex flex-col items-center justify-center p-8 bg-gray-800 hover:bg-gray-700 text-white rounded-3xl font-black shadow-2xl hover:-translate-y-2 transition-all duration-500 disabled:opacity-20 disabled:translate-y-0"
                    >
                        {loading === 'flashcards' ? <Spinner /> : <><span className="text-3xl mb-2">🃏</span> <span className="tracking-widest text-xs">FLASHCARDS</span></>}
                    </button>
                    <button
                        onClick={() => handleGeneration('studynote')}
                        disabled={!!loading || uploadedFiles.length === 0}
                        className="group flex flex-col items-center justify-center p-8 bg-gray-800 hover:bg-gray-700 text-white rounded-3xl font-black shadow-2xl hover:-translate-y-2 transition-all duration-500 disabled:opacity-20 disabled:translate-y-0"
                    >
                        {loading === 'studynote' ? <Spinner /> : <><span className="text-3xl mb-2">💎</span> <span className="tracking-widest text-xs">STUDY NOTE</span></>}
                    </button>
                </div>
            </div>

            {/* Content Results */}
            {summary && (
                <div className="mt-16 bg-gray-900 p-12 rounded-[3rem] shadow-2xl border border-gray-800">
                    <h2 className="text-4xl font-black mb-10 text-white border-l-8 border-primary-500 pl-6 uppercase tracking-tighter">Knowledge Synthesis</h2>
                    <div className="prose prose-invert max-w-none text-gray-400 leading-relaxed text-xl whitespace-pre-wrap font-medium">{summary}</div>
                </div>
            )}

            {showFlashcards && flashcards.length > 0 && (
                <div className="mt-16">
                    <h2 className="text-4xl font-black mb-12 text-center uppercase tracking-[0.4em] text-primary-500">Mastery Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {flashcards.map((card, idx) => (
                            <div key={idx} className="bg-gray-900 p-10 rounded-3xl shadow-xl border border-gray-800 hover:border-primary-500/50 hover:bg-primary-500/[0.02] transition-all group cursor-default">
                                <h3 className="font-black text-primary-400 text-2xl mb-6 group-hover:text-primary-300 transition-colors uppercase tracking-tight">{card.term}</h3>
                                <p className="text-gray-500 group-hover:text-gray-300 transition-colors leading-relaxed text-lg font-medium">{card.definition}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
