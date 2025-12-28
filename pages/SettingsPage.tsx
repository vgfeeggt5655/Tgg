
import React from 'react';

const SettingsPage: React.FC = () => {
    
    const clearData = () => {
        if (window.confirm('WARNING: All progress and generated assets will be permanently deleted. Continue?')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-black mb-10 uppercase tracking-tighter">Control <span className="text-primary-500">Center</span></h1>
            
            <div className="bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-800">
                <h2 className="text-xl font-black mb-8 text-white uppercase tracking-widest border-b border-gray-800 pb-4">Storage & Privacy</h2>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <p className="font-black text-lg text-gray-200">System Wipe</p>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">Delete all session history, flashcards, and local cache permanently.</p>
                    </div>
                    <button
                        onClick={clearData}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg hover:shadow-red-500/20 active:scale-95"
                    >
                        CLEAR CACHE
                    </button>
                </div>
            </div>

             <div className="mt-12 text-center text-xs text-gray-600 font-black uppercase tracking-[0.2em] opacity-50">
                <p>Designed for Excellence. Visual Theme: Fixed Obsidian Dark.</p>
            </div>
        </div>
    );
};

export default SettingsPage;
