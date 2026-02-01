
import React, { useState, useEffect, useCallback } from 'react';
import { explainCommand, ExplanationResult } from './services/geminiService';

const QUICK_COMMANDS = [
  { cmd: 'aws s3 sync . s3://my-bucket --delete', label: 'AWS: S3 Sync' },
  { cmd: 'az vm list --output table --resource-group prod-rg', label: 'Azure: List VMs' },
  { cmd: 'gcloud compute instances stop my-instance --zone us-central1-a', label: 'GCP: Stop VM' },
  { cmd: 'kubectl get pods -n kube-system', label: 'K8s: Get Pods' },
  { cmd: 'docker-compose up -d --build', label: 'Docker: Rebuild' }
];

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<'NONE' | 'QUOTA' | 'AUTH' | 'LEAKED'>('NONE');

  const checkApiKey = useCallback(async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    } else {
      setHasApiKey(!!process.env.API_KEY);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleOpenKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setError('');
      setErrorType('NONE');
    }
  };

  const handleSearch = async (targetQuery?: string) => {
    const finalQuery = targetQuery || query;
    if (!finalQuery.trim()) return;
    if (targetQuery) setQuery(targetQuery);

    setIsLoading(true);
    setError('');
    setErrorType('NONE');
    
    try {
      const data = await explainCommand(finalQuery);
      setResult(data);
    } catch (err: any) {
      if (err.message === "KEY_LEAKED") {
        setErrorType('LEAKED');
        setError('Your API key was reported as leaked. It has been permanently disabled.');
      } else if (err.message === "KEY_AUTH_REQUIRED") {
        setHasApiKey(false);
        setErrorType('AUTH');
        setError('Authentication required. Please authorize your API key.');
      } else if (err.message === "QUOTA_EXCEEDED") {
        setErrorType('QUOTA');
        setError('Your API Key has exceeded its quota.');
      } else {
        setError(err.message || 'The system encountered an error.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05080a] text-slate-300 font-mono selection:bg-emerald-500/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#161b22_1px,transparent_1px),linear-gradient(to_bottom,#161b22_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-20 w-full border-b border-white/5 bg-black/40 backdrop-blur-md px-6 py-2 flex justify-between items-center text-[10px] tracking-widest uppercase font-bold">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${
              errorType === 'LEAKED' ? 'bg-red-600 shadow-[0_0_8px_#dc2626]' : 
              errorType === 'QUOTA' ? 'bg-orange-500' :
              hasApiKey ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-700'
            } animate-pulse`}></span>
            {errorType === 'LEAKED' ? 'Security Alert' : 
             errorType === 'QUOTA' ? 'Quota Full' :
             hasApiKey ? 'Cloud Nodes Ready' : 'System Offline'}
          </div>
          <div className="text-slate-600 hidden md:block">Engine: Gemini-Flash-3.0-Cloud</div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleOpenKeySelector}
            className="text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
            Account Access
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <header className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4 italic">
            CLOUD<span className="text-blue-500">-</span>DECODE
          </h1>
          <p className="text-slate-500 text-sm tracking-[0.2em] uppercase font-bold">
            Mastering Shell, AWS, Azure, & GCP Infrastructure
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-10">
            <section>
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-4">
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
                  <textarea
                    rows={4}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Paste your AWS, Azure, or GCP command here..."
                    className="relative w-full bg-black/80 border border-white/10 rounded-2xl p-6 text-blue-400 focus:border-blue-500/50 outline-none transition-all resize-none shadow-2xl placeholder:text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !hasApiKey || errorType === 'LEAKED'}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-900 text-black font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  ) : (
                    <>DECODE INFRASTRUCTURE <span className="text-xl">↵</span></>
                  )}
                </button>
              </form>
            </section>

            <section className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Cloud Blueprint Library</h3>
              <div className="space-y-3">
                {QUICK_COMMANDS.map((qc, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(qc.cmd)}
                    disabled={errorType === 'LEAKED'}
                    className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-white/5 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/20 text-xs transition-all text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span>{qc.label}</span>
                    <span className="text-[9px] opacity-30 font-mono font-bold tracking-tighter">{qc.cmd.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7">
            {errorType !== 'NONE' ? (
              <div className={`p-10 rounded-3xl border ${errorType === 'LEAKED' ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-white/5'} text-center space-y-6`}>
                <div className={`w-16 h-16 ${errorType === 'LEAKED' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'} rounded-full flex items-center justify-center mx-auto`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <div className="space-y-2">
                  <h4 className="font-black text-xl uppercase text-white">{errorType === 'LEAKED' ? 'Access Denied' : 'System Error'}</h4>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">{error}</p>
                </div>
                <button 
                  onClick={handleOpenKeySelector}
                  className="bg-white text-black font-black px-10 py-4 rounded-2xl hover:bg-blue-500 transition-colors"
                >
                  Configure New Key
                </button>
              </div>
            ) : result ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-700">
                <div className="p-10 rounded-3xl border border-white/10 bg-black/60 shadow-2xl">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="h-px flex-grow bg-white/10 ml-4"></div>
                  </div>
                  
                  <h2 className="text-4xl font-black text-white mb-6">
                    <span className="text-blue-500">$</span> {result.issue}
                  </h2>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Operational Logic:</h4>
                      <p className="text-slate-300 font-sans leading-relaxed">{result.cause}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">Architect Tip:</h4>
                      <p className="text-slate-300 font-sans leading-relaxed italic border-l-2 border-emerald-500/30 pl-4">{result.solution}</p>
                    </div>
                  </div>
                </div>

                <div className="p-10 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                  <h4 className="text-white text-sm font-black mb-8 flex items-center gap-3 uppercase">
                    <span className="w-8 h-px bg-blue-500"></span> Implementation Patterns
                  </h4>
                  <div className="space-y-6">
                    {result.examples.map((ex, i) => (
                      <div key={i} className="group relative">
                        <div className="absolute -inset-2 bg-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                          <div className="flex justify-between mb-2">
                            <span className="text-[9px] text-slate-600 font-bold tracking-widest uppercase">Pattern {i+1}</span>
                            <button 
                              onClick={() => navigator.clipboard.writeText(ex.split('#')[0].trim())}
                              className="text-[9px] text-blue-500/50 hover:text-blue-400 font-black uppercase"
                            >
                              [ Copy ]
                            </button>
                          </div>
                          <div className="bg-black/60 border border-white/5 rounded-xl p-4">
                            <code className="block text-blue-400 text-sm break-all">
                              {ex.includes('#') ? ex.split('#')[0] : ex}
                            </code>
                            {ex.includes('#') && (
                              <p className="mt-2 text-xs text-slate-500 font-sans leading-relaxed border-t border-white/5 pt-2 italic">
                                # {ex.split('#')[1]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-20 text-center rounded-[40px] border-2 border-white/5 border-dashed bg-white/[0.01]">
                <div className="w-24 h-24 text-slate-800 mb-8 opacity-20">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <h3 className="text-slate-500 font-black text-xl uppercase tracking-widest">Awaiting Blueprint</h3>
                <p className="text-slate-700 text-xs max-w-xs mx-auto mt-4 leading-relaxed uppercase tracking-widest font-bold">
                  Paste any shell or cloud provider CLI string for real-time architectural decomposition.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="py-20 text-center opacity-30">
        <p className="text-[9px] text-slate-500 uppercase tracking-[0.5em] font-bold">Multi-Cloud Protocol V3.0 • Flash Layer • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;
