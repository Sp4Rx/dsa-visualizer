/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipBack, SkipForward, RotateCcw, 
  Sparkles, Code, Layout, Info, Settings, User, 
  ChevronRight, ChevronLeft, Save, Trash2, ExternalLink
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { GeminiService } from './services/geminiService';
import { ExecutionStep, AIResponse, EXAMPLE_PROBLEMS } from './types';
import { cn } from './lib/utils';

export default function App() {
  // State
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('gemini_api_key') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey);
  const [problemText, setProblemText] = useState('');
  const [code, setCode] = useState(EXAMPLE_PROBLEMS[0].code);
  const [explanation, setExplanation] = useState('');
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'explanation'>('visualizer');
  const [error, setError] = useState<string | null>(null);

  // Refs
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<any>(null);

  // Playback Logic
  useEffect(() => {
    if (isPlaying && steps.length > 0 && currentStepIndex < steps.length - 1) {
      playbackTimerRef.current = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, playbackSpeed);
    } else if (steps.length > 0 && currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => {
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    };
  }, [isPlaying, currentStepIndex, steps.length, playbackSpeed]);

  // Handle API Key
  const handleSaveApiKey = (key: string) => {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      localStorage.setItem('gemini_api_key', trimmedKey);
      setApiKey(trimmedKey);
      setShowApiKeyInput(false);
      setError(null);
    }
  };

  // Handle Generation
  const handleGenerate = async () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    if (!code.trim() && !problemText.trim()) {
      setError("Please provide some code or a problem description.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const gemini = new GeminiService(apiKey);
      const response = await gemini.generateVisualization(problemText || "Explain this code", code);
      
      if (!response || !response.steps || response.steps.length === 0) {
        throw new Error("AI returned an empty execution trace. Try a simpler problem.");
      }

      setSteps(response.steps);
      setExplanation(response.explanation);
      if (response.solution) setCode(response.solution);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      setActiveTab('visualizer');
    } catch (err: any) {
      console.error("Generation failed:", err);
      setError(err.message || "Failed to generate visualization. Check your API key and internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleSelect = (example: typeof EXAMPLE_PROBLEMS[0]) => {
    setProblemText(example.problem);
    setCode(example.code);
  };

  const currentStep = steps[currentStepIndex];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between glass-panel sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">DSA Visualizer <span className="text-primary">AI</span></h1>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Beginner Friendly</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowApiKeyInput(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-white/60 hover:text-white border border-white/10 text-xs font-medium"
          >
            <Settings className="w-4 h-4" />
            API Settings
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel: Input & Editor */}
        <div className="w-full lg:w-[40%] flex flex-col border-r border-white/10 h-full">
          {/* Problem Input */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">DSA Problem / Description</label>
              <div className="flex gap-2">
                {EXAMPLE_PROBLEMS.map((ex, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleExampleSelect(ex)}
                    className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-all"
                  >
                    {ex.title}
                  </button>
                ))}
              </div>
            </div>
            <textarea 
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder="Paste a problem description or ask AI to solve something... (e.g., 'Explain Bubble Sort')"
              className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            />
            <button 
              onClick={handleGenerate}
              disabled={isLoading}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg",
                isLoading ? "bg-white/10 text-white/40 cursor-not-allowed" : "bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Visualize with AI
                </>
              )}
            </button>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-[10px] font-medium leading-relaxed">
                {error}
              </div>
            )}
          </div>

          {/* Code Editor */}
          <div className="flex-1 flex flex-col min-h-[300px]">
            <div className="px-6 py-2 border-y border-white/10 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">JavaScript Code</span>
              </div>
              <button 
                onClick={() => setCode('')}
                className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors"
                title="Clear Code"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 relative">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  automaticLayout: true,
                  padding: { top: 20 },
                  lineDecorationsWidth: 10,
                }}
              />
              {/* Line Highlight Overlay */}
              {currentStep && (
                <div 
                  className="absolute left-0 w-full bg-primary/10 border-l-4 border-primary pointer-events-none transition-all duration-300"
                  style={{
                    top: `${(currentStep.line - 1) * 19 + 20}px`,
                    height: '19px'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Visualization & Explanation */}
        <div className="flex-1 flex flex-col h-full bg-black/20">
          {/* Tabs */}
          <div className="flex border-b border-white/10 bg-white/5">
            <button 
              onClick={() => setActiveTab('visualizer')}
              className={cn(
                "px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
                activeTab === 'visualizer' ? "border-primary text-primary" : "border-transparent text-white/40 hover:text-white/60"
              )}
            >
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Visualizer
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('explanation')}
              className={cn(
                "px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
                activeTab === 'explanation' ? "border-primary text-primary" : "border-transparent text-white/40 hover:text-white/60"
              )}
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                AI Explanation
              </div>
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'visualizer' ? (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                {/* Animation Area */}
                <div className="flex-1 glass-panel rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                  {steps.length > 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-12">
                      {/* Data Structure Visualization (Simple Array for now) */}
                      <div className="flex flex-wrap justify-center gap-4">
                        {Object.entries(currentStep?.variables || {}).map(([key, val]) => (
                          Array.isArray(val) ? (
                            <div key={key} className="flex flex-col items-center gap-2">
                              <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">{key}</span>
                              <div className="flex gap-2">
                                {val.map((item, i) => (
                                  <motion.div 
                                    key={i}
                                    layout
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={cn(
                                      "w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold text-lg border-2 transition-all",
                                      "bg-white/5 border-white/10"
                                    )}
                                  >
                                    {item}
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ) : null
                        ))}
                      </div>

                      {/* Step Description */}
                      <motion.div 
                        key={currentStepIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="max-w-md text-center"
                      >
                        <p className="text-lg font-medium text-white/90 leading-relaxed">
                          {currentStep?.description || "Ready to visualize..."}
                        </p>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                        <Play className="w-6 h-6 text-white/20" />
                      </div>
                      <p className="text-white/40 text-sm font-medium">Enter a problem and click "Visualize" to start</p>
                    </div>
                  )}
                </div>

                {/* Variable Tracker */}
                <div className="mt-6 h-48 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Variable Tracker</span>
                      {currentStep && (
                        <button 
                          onClick={async () => {
                            if (!apiKey) return;
                            setIsLoading(true);
                            try {
                              const ai = new GoogleGenAI({ apiKey });
                              const prompt = `Explain this specific step in detail for a beginner. 
                                Code: ${code}
                                Current Step: ${currentStep.description}
                                Variables: ${JSON.stringify(currentStep.variables)}`;
                              const result = await ai.models.generateContent({
                                model: "gemini-3-flash-preview",
                                contents: prompt
                              });
                              alert(result.text);
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
                        >
                          <Sparkles className="w-3 h-3" />
                          Explain Step
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-primary">Step {currentStepIndex + 1} / {steps.length || 0}</span>
                  </div>
                  <div className="flex-1 glass-panel rounded-xl p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {currentStep ? (
                      Object.entries(currentStep.variables).map(([key, val]) => (
                        <div key={key} className="p-3 bg-white/5 rounded-lg border border-white/5 flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-white/40 uppercase">{key}</span>
                          <span className="font-mono text-sm text-accent truncate">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full flex items-center justify-center h-full text-white/20 text-xs italic">
                        No variables tracked yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-8 overflow-y-auto leading-relaxed text-white/80 space-y-6">
                {explanation ? (
                  <div className="prose prose-invert max-w-none">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                        <Info className="w-5 h-5 text-accent" />
                      </div>
                      <h2 className="text-xl font-bold text-white m-0">Algorithm Breakdown</h2>
                    </div>
                    <div className="whitespace-pre-wrap text-lg">
                      {explanation}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <Sparkles className="w-12 h-12" />
                    <p>AI explanation will appear here after generation</p>
                  </div>
                )}
              </div>
            )}

            {/* Controls Bar */}
            <div className="h-24 border-t border-white/10 glass-panel px-8 flex items-center gap-8">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentStepIndex(0)}
                  disabled={steps.length === 0}
                  className="p-3 hover:bg-white/10 rounded-full text-white/60 disabled:opacity-20 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                  disabled={steps.length === 0 || currentStepIndex === 0}
                  className="p-3 hover:bg-white/10 rounded-full text-white/60 disabled:opacity-20 transition-all"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={steps.length === 0}
                  className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>
                <button 
                  onClick={() => setCurrentStepIndex(prev => Math.min(steps.length - 1, prev + 1))}
                  disabled={steps.length === 0 || currentStepIndex === steps.length - 1}
                  className="p-3 hover:bg-white/10 rounded-full text-white/60 disabled:opacity-20 transition-all"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                  <span>Progress</span>
                  <span>{Math.round(((currentStepIndex + 1) / (steps.length || 1)) * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max={Math.max(0, steps.length - 1)}
                  value={currentStepIndex}
                  onChange={(e) => setCurrentStepIndex(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Speed</span>
                  <select 
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono focus:outline-none"
                  >
                    <option value="2000">0.5x</option>
                    <option value="1000">1.0x</option>
                    <option value="500">2.0x</option>
                    <option value="250">4.0x</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* API Key Modal */}
      <AnimatePresence>
        {showApiKeyInput && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl border border-white/10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">API Configuration</h2>
                  <p className="text-xs text-white/40">Connect to Gemini AI</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/60">Gemini API Key</label>
                  <input 
                    type="password"
                    defaultValue={apiKey}
                    placeholder="Paste your API key here..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveApiKey((e.target as HTMLInputElement).value);
                    }}
                    id="api-key-input"
                  />
                  <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] text-white/60 leading-relaxed">
                      We do not store your data. Your API key stays in your browser's local storage only. 
                      Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">AI Studio <ExternalLink className="w-2.5 h-2.5" /></a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowApiKeyInput(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      const input = document.getElementById('api-key-input') as HTMLInputElement;
                      handleSaveApiKey(input.value);
                    }}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Status */}
      <footer className="h-8 border-t border-white/10 px-6 flex items-center justify-between bg-black/40 text-[10px] font-mono text-white/20 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span>Status: {isLoading ? 'AI Thinking...' : 'Ready'}</span>
          <span>•</span>
          <span>Engine: Gemini 3 Flash</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Made for Beginners</span>
          <span>•</span>
          <span>v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
