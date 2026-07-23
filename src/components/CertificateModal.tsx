import React from 'react';
import { 
  X, Download, ShieldCheck, Award, FileText, CheckCircle2, 
  Sparkles, ExternalLink, QrCode, Film as FilmIcon, Image
} from 'lucide-react';
import { Film, Filmmaker } from '../types';
import { 
  getContentId, 
  getThumbnailContentId, 
  getCertificateNo, 
  generateScreeningCertificatePDF 
} from '../lib/certificateGenerator';
import { getDirectImageUrl } from '../lib/driveUtils';

interface CertificateModalProps {
  film: Film;
  filmmaker?: Filmmaker;
  onClose: () => void;
}

export default function CertificateModal({
  film,
  filmmaker,
  onClose,
}: CertificateModalProps) {
  const contentId = getContentId(film);
  const thumbId = getThumbnailContentId(film);
  const certNo = getCertificateNo(film);
  const directorName = filmmaker?.name || film.director || 'Licensed Filmmaker';
  const country = filmmaker?.country || 'India';
  const upiId = filmmaker?.upiId || film.upiId || 'Direct GPay Peer-to-Peer';
  const issueDate = film.createdAt 
    ? new Date(film.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleDownload = () => {
    generateScreeningCertificatePDF(film, filmmaker);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl bg-[#0a0a0d] border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh] text-white my-auto">
        
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/15 text-white/60 hover:text-white rounded-full transition-all cursor-pointer z-20 border border-white/10"
          title="Close Preview"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 shrink-0">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-white">
                Content Screening Rights Certificate
              </h2>
              <p className="text-xs text-amber-400/80 font-mono">
                TPF CINEMAS • OFFICIAL CONSENT & DISTRIBUTION DOCKET
              </p>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold font-mono text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF</span>
          </button>
        </div>

        {/* CERTIFICATE DISPLAY FRAME (Landscape Certificate Replica) */}
        <div className="mt-6 p-6 sm:p-8 bg-[#0f0f14] border-2 border-amber-500/40 rounded-xl relative shadow-2xl overflow-hidden">
          {/* Double Ornate Inner Border */}
          <div className="absolute inset-2 border border-amber-500/20 rounded-lg pointer-events-none" />

          {/* Certificate Header Banner */}
          <div className="text-center flex flex-col items-center gap-1.5 mb-6">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-black text-2xl tracking-widest uppercase">
              <Sparkles className="w-5 h-5" />
              <span>TPF CINEMAS</span>
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-mono tracking-widest text-white/50 uppercase">
              Indie Film OTT & Digital Streaming Vault
            </p>
            <div className="h-0.5 w-48 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent my-1" />
            <h3 className="text-lg font-extrabold font-sans uppercase tracking-wide text-white">
              Official Content Screening Rights & Consent Certificate
            </h3>
            <span className="text-[11px] font-mono text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded border border-amber-500/30 mt-1">
              {certNo}
            </span>
          </div>

          {/* Core Content & Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#14141c] border border-white/10 rounded-xl p-5 mb-6">
            
            {/* Poster Thumbnail */}
            <div className="md:col-span-3 flex flex-col items-center justify-center gap-2 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-4">
              <img
                src={getDirectImageUrl(film.posterUrl)}
                alt={film.title}
                className="w-28 h-40 object-cover rounded-lg border border-amber-500/40 shadow-xl"
                style={{ objectPosition: `center ${film.posterPositionY ?? 50}%` }}
                referrerPolicy="no-referrer"
              />
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                VERIFIED ARTWORK
              </span>
            </div>

            {/* Content Identifiers */}
            <div className="md:col-span-9 flex flex-col justify-between gap-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Film Details */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <FilmIcon className="w-3.5 h-3.5" /> 1. Content Identification
                  </span>
                  <div>
                    <span className="text-white/40 text-[10px] block">Title:</span>
                    <strong className="text-white text-sm font-sans font-extrabold">{film.title}</strong>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block">TPF Unique Content ID:</span>
                    <strong className="text-amber-400 font-bold">{contentId}</strong>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block">TPF Unique Thumbnail ID:</span>
                    <strong className="text-amber-400 font-bold">{thumbId}</strong>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block">Format & Genre:</span>
                    <span className="text-white/80">{film.type.toUpperCase()} • {Array.isArray(film.genre) ? film.genre.join(', ') : film.genre}</span>
                  </div>
                </div>

                {/* Filmmaker Details */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 2. Licensor & Director
                  </span>
                  <div>
                    <span className="text-white/40 text-[10px] block">Creator / Director:</span>
                    <strong className="text-white font-sans font-bold">{directorName}</strong>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block">Country of Origin:</span>
                    <span className="text-white/80">{country}</span>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block">GPay Monetization ID:</span>
                    <strong className="text-emerald-400 font-bold">{upiId}</strong>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block">Approval Date:</span>
                    <span className="text-white/80">{issueDate}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Legal Grant Clause */}
          <div className="bg-[#121218] border border-amber-500/30 rounded-xl p-4 mb-6">
            <h4 className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Declaration of Digital Screening Rights & Consent
            </h4>
            <p className="text-[11px] text-white/70 font-sans leading-relaxed">
              This official document certifies that <strong className="text-white">{directorName}</strong> (Licensor) has granted TPF Cinemas non-exclusive digital screening, streaming, and display rights for the work titled <strong className="text-amber-300">"{film.title}"</strong> under Unique Content ID <strong className="font-mono text-amber-400">{contentId}</strong> and Thumbnail Asset ID <strong className="font-mono text-amber-400">{thumbId}</strong>. The filmmaker retains 100% intellectual property rights, copyright ownership, and master film rights. TPF Cinemas is authorized to host high-bitrate streaming and route 100% direct crowd funding (GPay UPI: {upiId}) to the creator.
            </p>
          </div>

          {/* Seal & Verification Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-amber-500/10 flex flex-col items-center justify-center text-[8px] font-bold text-amber-400 text-center leading-tight shadow-lg shrink-0">
                <span>TPF</span>
                <span>SEAL</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  VERIFIED & APPROVED FOR STREAMING
                </span>
                <span className="text-[10px] text-white/40">Digitally registered in TPF Cinemas Vault Ledger</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-amber-400 font-serif italic text-sm font-bold">TPF Curation Directorate</div>
              <span className="text-[10px] text-white/40 uppercase block">Authorized Signatory</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
