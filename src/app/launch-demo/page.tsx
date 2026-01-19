"use client";

import { useState, useEffect, useRef } from 'react';
import { Field } from '@/types/form';

// --- Types ---
type DemoState = 
  | 'intro'
  | 'problem'
  | 'solution_reveal'
  | 'voice_active' 
  | 'analyzing' 
  | 'building' 
  | 'customizing'
  | 'mobile_view'
  | 'publishing'
  | 'complete';

// --- Assets & Data ---
const DEMO_TRANSCRIPT = "I need a registration form with name, email, and a dark mode preference.";

const DEMO_FIELDS: Field[] = [
  { id: '1', type: 'text', label: 'Full Name', required: true, order: 0, placeholder: 'Jane Doe' },
  { id: '2', type: 'email', label: 'Email Address', required: true, order: 1, placeholder: 'jane@company.com' },
  { id: '3', type: 'switch', label: 'Dark Mode Preference', required: false, order: 2 },
];

// --- Components ---
function Waveform({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1 h-16 justify-center">
      {[...Array(30)].map((_, i) => {
        // Create a symmetric wave pattern
        const center = 15;
        const dist = Math.abs(i - center);
        const heightMultiplier = Math.max(0.1, 1 - dist / 12); // Taper off at edges
        
        return (
          <div 
            key={i}
            className="w-1.5 bg-black rounded-full transition-all duration-75"
            style={{ 
              height: `${Math.max(4, Math.random() * level * heightMultiplier + 4)}px`,
              opacity: level > 0 ? 0.8 : 0.2
            }}
          />
        );
      })}
    </div>
  );
}

function Cursor({ x, y, clicking }: { x: number, y: number, clicking: boolean }) {
  return (
    <div 
      className="fixed pointer-events-none z-50 transition-all duration-300 ease-out"
      style={{ left: x, top: y }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={`drop-shadow-xl transition-transform ${clicking ? 'scale-90' : 'scale-100'}`}>
        <path d="M12 3L23 27L17 21L25 32L21 32L14 21L6 23L12 3Z" fill="black" stroke="white" strokeWidth="2"/>
      </svg>
    </div>
  );
}

export default function LaunchDemoPage() {
  const [state, setState] = useState<DemoState>('intro');
  const [text, setText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [visibleFields, setVisibleFields] = useState<Field[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [cursorClicking, setCursorClicking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);

  // Animation Loop for Waveform
  useEffect(() => {
    if (state === 'voice_active') {
      const interval = setInterval(() => setAudioLevel(Math.random() * 50 + 20), 50);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [state]);

  const runSequence = async () => {
    // Reset
    setState('intro');
    setText('');
    setVisibleFields([]);
    setIsMobile(false);
    setShowConfetti(false);
    setCursorPos({ x: -100, y: -100 });
    
    // 0:00 - Intro
    await wait(4000);
    
    // 0:05 - The Problem (Simulated rapid cuts done via CSS class on container)
    setState('problem');
    await wait(5000);
    
    // 0:10 - The Solution Reveal
    setState('solution_reveal');
    await wait(2000);
    
    // 0:12 - Voice Active
    setState('voice_active');
    await wait(1000); // Pause before speaking
    
    // 0:15 - Voice Command Typing
    const words = DEMO_TRANSCRIPT.split(' ');
    for (const word of words) {
      setText(prev => prev + (prev ? ' ' : '') + word);
      await wait(250);
    }
    await wait(1000);
    
    // 0:20 - Generating
    setState('analyzing');
    await wait(1500);
    
    setState('building');
    
    // Reveal fields with "flying in" animation
    for (const field of DEMO_FIELDS) {
      setVisibleFields(prev => [...prev, field]);
      await wait(400); 
    }
    await wait(1000);
    
    // 0:25 - Customization
    setState('customizing');
    // Move cursor to first field edit button
    await moveCursorTo(window.innerWidth / 2 + 200, window.innerHeight / 2 - 50, 1000);
    await clickCursor();
    setEditMode('1'); // Highlight first field
    await wait(500);
    
    // Move to toggle switch
    await moveCursorTo(window.innerWidth / 2 + 100, window.innerHeight / 2 + 100, 800);
    await clickCursor();
    // Simulate toggling a setting
    await wait(500);
    
    // 0:30 - Mobile View
    setState('mobile_view');
    setIsMobile(true);
    await wait(3000);
    
    // 0:35 - Publish
    setState('publishing');
    setIsMobile(false); // Back to desktop for grand finale
    await wait(500);
    
    // Move to publish button
    await moveCursorTo(window.innerWidth / 2 + 300, 80, 1000);
    await clickCursor();
    setShowConfetti(true);
    
    await wait(2000);
    
    // 0:40 - Call to Action
    setState('complete');
  };

  const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
  
  const moveCursorTo = async (x: number, y: number, duration: number) => {
    setCursorPos({ x, y });
    await wait(duration);
  };
  
  const clickCursor = async () => {
    setCursorClicking(true);
    await wait(150);
    setCursorClicking(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-black font-[Patrick_Hand] overflow-hidden relative flex items-center justify-center">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
        
        .font-hand {
          font-family: 'Patrick Hand', cursive;
        }
        
        .paper-card {
          background: white;
          border: 2px solid black;
          border-radius: 12px;
          box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
        }
        
        .paper-input {
          border: 2px solid black;
          border-radius: 8px;
          padding: 12px;
          font-family: 'Patrick Hand', cursive;
          font-size: 1.1rem;
          transition: all 0.2s;
        }
        
        .paper-input:focus {
          box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
          transform: translate(-1px, -1px);
          outline: none;
        }
        
        .paper-button {
          background: white;
          border: 2px solid black;
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: bold;
          box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
          transition: all 0.1s;
        }
        
        .paper-button:active {
          box-shadow: 0px 0px 0px 0px rgba(0,0,0,1);
          transform: translate(2px, 2px);
        }
        
        .paper-button-primary {
          background: black;
          color: white;
          border: 2px solid black;
          border-radius: 8px;
          box-shadow: 3px 3px 0px 0px rgba(0,0,0,0.3);
        }
        
        .animate-fly-in {
          animation: flyIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          opacity: 0;
          transform: translateY(50px) scale(0.9);
        }
        
        @keyframes flyIn {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .old-way-filter {
            filter: grayscale(100%) contrast(120%) blur(0.5px);
        }
      `}</style>

      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
        }} 
      />

      {/* Cursor Element */}
      <Cursor x={cursorPos.x} y={cursorPos.y} clicking={cursorClicking} />

      <div className={`w-full max-w-6xl h-screen flex flex-col relative transition-all duration-700 ${isMobile ? 'max-w-sm border-x-4 border-black/10' : ''}`}>
        
        {/* --- 0:00 Intro Text --- */}
        {state === 'intro' && (
            <div className="absolute inset-0 flex items-center justify-center z-50 bg-white">
                <h1 className="text-7xl font-bold animate-in fade-in zoom-in duration-1000 text-center leading-tight">
                    Stop building forms<br/>manually.
                </h1>
            </div>
        )}

        {/* --- 0:05 The Problem (Old Way) --- */}
        {state === 'problem' && (
            <div className="absolute inset-0 flex items-center justify-center z-40 bg-[#eee] old-way-filter">
                <div className="text-center space-y-4">
                    <div className="w-[600px] h-[400px] bg-white border border-gray-400 rounded shadow-sm p-8 flex flex-col gap-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/5 animate-pulse" />
                        <div className="h-8 bg-gray-200 w-1/3 rounded" />
                        <div className="h-10 bg-gray-100 border border-gray-300 rounded w-full" />
                        <div className="h-10 bg-gray-100 border border-gray-300 rounded w-full" />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-gray-400 rotate-12">
                            THE OLD WAY...
                        </div>
                        {/* Simulated mouse struggle */}
                        <div className="absolute top-[60%] left-[60%] animate-bounce">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="black"><path d="M12 2L15 21L12 18L9 21L12 2Z"/></svg>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- 0:10 - 0:40 The Solution (Main App UI) --- */}
        {['solution_reveal', 'voice_active', 'analyzing', 'building', 'customizing', 'mobile_view', 'publishing', 'complete'].includes(state) && (
            <div className={`flex-1 flex flex-col transition-opacity duration-500 ${state === 'solution_reveal' ? 'opacity-0 animate-in fade-in duration-1000' : 'opacity-100'}`}>
                
                {/* App Header */}
                <header className="px-8 py-4 border-b-2 border-black flex items-center justify-between bg-white z-20">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-xl">F</div>
                        <span className="text-2xl font-bold">Forms AI</span>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="hidden md:flex gap-2">
                            <button className="paper-button">Preview</button>
                            <button className="paper-button">Share</button>
                        </div>
                        <button className="paper-button-primary px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                            Publish
                        </button>
                    </div>
                </header>

                <main className="flex-1 flex overflow-hidden">
                    
                    {/* Left Sidebar (Controls) */}
                    <div className={`w-80 border-r-2 border-black bg-white p-6 flex flex-col gap-6 transition-transform duration-500 ${isMobile ? '-translate-x-full absolute' : 'translate-x-0'}`}>
                        <div className="space-y-2">
                            <h3 className="font-bold text-xl">Create Form</h3>
                            <p className="text-gray-500 text-sm leading-tight">Describe what you need and let AI handle the rest.</p>
                        </div>

                        {/* Voice Input Box */}
                        <div className={`paper-card p-4 transition-all duration-300 ${state === 'voice_active' ? 'scale-105 shadow-[6px_6px_0px_0px_#3b82f6]' : ''}`}>
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold">Voice Input</span>
                                {state === 'voice_active' && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
                            </div>
                            
                            <div className="min-h-[100px] flex items-center justify-center mb-4 bg-gray-50 rounded-lg border-2 border-gray-100 p-2 text-center text-lg leading-snug">
                                {state === 'voice_active' ? (
                                    text || <Waveform level={audioLevel} />
                                ) : (
                                    text ? text : <span className="text-gray-400">Click mic to start...</span>
                                )}
                            </div>

                            <button className={`w-full paper-button flex justify-center items-center gap-2 ${state === 'voice_active' ? 'bg-red-50 border-red-500 text-red-500' : ''}`}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                    <line x1="12" y1="19" x2="12" y2="23"/>
                                    <line x1="8" y1="23" x2="16" y2="23"/>
                                </svg>
                                {state === 'voice_active' ? 'Listening...' : 'Start Recording'}
                            </button>
                        </div>

                        {/* Stacking fields visualization */}
                        <div className="flex-1 space-y-3 opacity-30 pointer-events-none">
                            <div className="h-12 bg-gray-100 border-2 border-black border-dashed rounded-lg" />
                            <div className="h-12 bg-gray-100 border-2 border-black border-dashed rounded-lg" />
                            <div className="h-12 bg-gray-100 border-2 border-black border-dashed rounded-lg" />
                        </div>
                    </div>

                    {/* Main Canvas (Preview) */}
                    <div className="flex-1 bg-[#f0f0f0] p-8 flex justify-center overflow-y-auto">
                        <div className={`bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] transition-all duration-500 ${isMobile ? 'w-[375px] my-auto h-[667px] rounded-[32px] border-4' : 'w-full max-w-2xl rounded-xl min-h-[600px]'}`}>
                            
                            {/* Form Header */}
                            <div className="p-8 border-b-2 border-gray-100">
                                <h1 className="text-4xl font-bold mb-2">Registration</h1>
                                <p className="text-gray-500 text-lg">Please fill out your details below.</p>
                            </div>

                            {/* Form Fields Area */}
                            <div className="p-8 space-y-6">
                                {visibleFields.map((field) => (
                                    <div 
                                        key={field.id} 
                                        className={`animate-fly-in group relative p-4 -mx-4 rounded-lg transition-colors ${editMode === field.id ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : 'hover:bg-gray-50'}`}
                                    >
                                        <label className="block text-xl font-bold mb-2">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        
                                        {field.type === 'text' || field.type === 'email' ? (
                                            <input 
                                                type={field.type} 
                                                placeholder={field.placeholder}
                                                className="w-full paper-input"
                                                disabled
                                            />
                                        ) : field.type === 'switch' ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-6 bg-gray-200 rounded-full border-2 border-black relative">
                                                    <div className="w-4 h-4 bg-white border-2 border-black rounded-full absolute top-0.5 left-0.5" />
                                                </div>
                                                <span className="text-lg">Off</span>
                                            </div>
                                        ) : null}

                                        {/* Edit Controls (Hover) */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <button className="p-1 bg-white border-2 border-black rounded hover:bg-gray-100">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                {visibleFields.length === DEMO_FIELDS.length && (
                                    <div className="pt-6 animate-fly-in" style={{ animationDelay: '0.3s' }}>
                                        <button className="w-full bg-black text-white text-xl font-bold py-3 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-1 hover:shadow-none transition-all">
                                            Submit
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        )}

        {/* --- 0:35 Success Confetti --- */}
        {showConfetti && (
            <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                 <div className="bg-black text-white px-8 py-4 rounded-full text-2xl font-bold animate-in zoom-in slide-in-from-bottom-10 fade-in duration-300 shadow-2xl flex items-center gap-3">
                    <span className="text-3xl">🎉</span> Published Successfully!
                 </div>
            </div>
        )}

        {/* --- 0:40 Complete Call to Action --- */}
        {state === 'complete' && (
            <div className="absolute inset-0 z-[60] bg-white flex flex-col items-center justify-center animate-in fade-in duration-1000">
                <div className="text-8xl font-bold mb-4">Forms AI</div>
                <p className="text-2xl text-gray-600 mb-8">Build your first form in seconds.</p>
                <div className="px-8 py-4 border-2 border-black rounded-full text-xl font-bold hover:bg-black hover:text-white transition-colors cursor-pointer">
                    forms-ai.com
                </div>
            </div>
        )}

      </div>

      {/* Control Bar */}
      <div className="fixed bottom-8 right-8 z-[100] opacity-0 hover:opacity-100 transition-opacity">
        <button 
            onClick={runSequence}
            className="bg-black text-white px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform font-sans"
        >
            ▶ Play Full Sequence
        </button>
      </div>

    </div>
  );
}
