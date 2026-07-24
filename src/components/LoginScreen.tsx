import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { LogIn, Film, Sparkles, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onLoginSuccess();
    } catch (err: any) {
      console.error("Sign in error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("The Google login popup was blocked by your browser. Please enable popups for this site and try again.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in was cancelled. Please try again to access TPF Cinemas.");
      } else {
        setError(err.message || "An unexpected error occurred during Google Sign-In.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1c1e] flex flex-col justify-center items-center relative overflow-hidden font-sans select-none px-4">
      {/* Immersive background decoration */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-[#1c1c1e] to-[#0c0c0d] opacity-90" />
      
      {/* Dynamic light subtle ambient glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-md bg-[#252529]/90 border border-white/5 shadow-2xl rounded-3xl p-8 backdrop-blur-xl transition-all duration-500 hover:border-white/10 flex flex-col items-center">
        
        {/* Brand Logo Container with soft highlight for readability */}
        <div className="bg-white px-8 py-5 rounded-2xl shadow-inner flex items-center justify-center mb-6 hover:scale-[1.02] transition-all duration-300">
          <img
            src="https://lh3.googleusercontent.com/d/1WnKEHu3WYNJ8JUgzVlq5Eouzdw9LRIwc"
            alt="TPF Cinemas"
            referrerPolicy="no-referrer"
            className="h-[96px] w-auto object-contain select-none"
          />
        </div>

        {/* Text Area */}
        <div className="text-center mb-8">
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase flex items-center justify-center gap-2 mb-2 font-sans">
            <Film className="h-5 w-5 text-amber-500" />
            <span>Projection Room</span>
          </h1>
          <p className="text-xs text-white/50 max-w-sm mx-auto leading-relaxed font-sans">
            Curating the finest award-winning independent films, uncompromised artistic visions, and director retrospectives.
          </p>
        </div>

        {/* Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3.5 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-300 cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Verifying Ticket...</span>
            </div>
          ) : (
            <>
              {/* Custom SVG Google G Icon styled cleanly */}
              <svg className="h-4 w-4 text-black" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#000000" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#000000" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#000000" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#000000" />
              </svg>
              <span>Enter with Google</span>
            </>
          )}
        </button>

        {/* Error Feedback */}
        {error && (
          <div className="mt-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start gap-2 text-xs leading-relaxed max-w-sm font-sans animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Cinematic highlights */}
        <div className="mt-8 pt-6 border-t border-white/5 w-full flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white/40 text-xs font-sans">
            <Sparkles className="h-3.5 w-3.5 text-amber-500/60" />
            <span>Curated indie catalog updated daily</span>
          </div>
          <div className="flex items-center gap-2 text-white/40 text-xs font-sans">
            <CheckCircle className="h-3.5 w-3.5 text-amber-500/60" />
            <span>Director reviews & submission system</span>
          </div>
          <div className="flex items-center gap-2 text-white/40 text-xs font-sans">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500/60" />
            <span>Secure auth managed by Google Cloud</span>
          </div>
        </div>
      </div>

      {/* Elegant, clean visual copyright footer */}
      <footer className="relative z-10 mt-10 text-[10px] uppercase tracking-widest text-white/35 font-mono text-center">
        TPF Cinemas © 2026 • Curating Original Cinema
      </footer>
    </div>
  );
}
