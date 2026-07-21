import React from 'react';
import { X, Shield, Users, Heart, Award, Cpu, BookOpen } from 'lucide-react';

interface AboutManifestoProps {
  onClose: () => void;
}

export default function AboutManifesto({ onClose }: AboutManifestoProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[#0c0c0e] border border-white/10 rounded shadow-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto animate-in fade-in-50 duration-200">
        
        {/* Close Button */}
        <button 
          id="close-manifesto-btn"
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 rounded hover:bg-white/5 text-white/40 hover:text-white transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-2">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded w-fit">
            THE MANIFESTO
          </span>
          <h2 className="text-xl font-bold tracking-tight text-[#F5F5F7] font-sans">
            A Cinema Platform Made for Emerging Creators
          </h2>
          <p className="text-xs text-white/40 font-mono uppercase tracking-wider">
            Why subscription-based distribution blocks cinematic innovation, and how we are fixing it.
          </p>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-6 text-white/80 text-xs leading-relaxed font-sans">
          
          {/* Section 1 */}
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/60">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-1">Decentralized & Subscription-Free</h3>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Traditional OTT platforms gatekeeper who gets screened and lock creators behind expensive monthly fees, taking up to 70% of the profits. We believe emerging filmmaker works should be 100% accessible to the public, fostering organic discovery without paywalls.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/60">
              <Heart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-1">Direct Filmmaker Patronage</h3>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Instead of corporate subscriptions, we implement a <strong className="text-amber-500 font-mono">Community Tipping & Sponsorship system</strong>. Every single cent from tips goes directly to the filmmakers. You can fund their next roll of 16mm film, sponsor a memory card, or help pay for a local film festival submission fee!
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/60">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-1">Constructive Technical Feedback</h3>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Beginner directors don't just need mindless views. They need actionable, specific critiques on storytelling, sound design, camera framing, and lighting. Our audience screening rooms feature aspect-specific rating scales to provide constructive data to the filmmakers.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/60">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-1">Maintain 100% Ownership</h3>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Uploading to IndieScreen is non-exclusive. You retain all copyrights, intellectual property, and licensing opportunities. You can use this as your launchpad, festival screener link, or portfolio showcase.
              </p>
            </div>
          </div>

          {/* Creative footer panel */}
          <div className="bg-black/30 p-4 rounded border border-white/5 mt-2">
            <h4 className="text-[10px] font-mono font-bold text-amber-500 uppercase mb-2 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> HOW TO SCREEN YOUR FILM:
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-white/40">
              <li>Click the <strong className="text-white/80">"Screen Your Work"</strong> button in the navigation bar.</li>
              <li>Provide your film title, gear used, and synopsis.</li>
              <li>Select one of our gorgeous cinematic posters or paste your own direct image.</li>
              <li>Choose an open movie stream template or link your custom MP4 stream, then click Launch.</li>
              <li>Your film is instantly added to the active theater for public feedback and direct tips!</li>
            </ol>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-5 border-t border-white/5 flex justify-end">
          <button
            id="manifesto-close-footer-btn"
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded text-xs font-bold transition-all cursor-pointer uppercase tracking-widest"
          >
            I Understand, Enter Cinema
          </button>
        </div>

      </div>
    </div>
  );
}
