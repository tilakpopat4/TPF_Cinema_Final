import React, { useState } from 'react';
import { X, Gift, Heart, AlertCircle, QrCode, Copy, Check } from 'lucide-react';
import { Film } from '../types';

interface TipJarModalProps {
  film: Film;
  onClose: () => void;
  onSponsor: (amountINR: number, patronName: string) => Promise<void>;
}

export default function TipJarModal({ film, onClose, onSponsor }: TipJarModalProps) {
  const [customAmount, setCustomAmount] = useState('500');
  const [patronName, setPatronName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const getActiveAmount = () => {
    const parsed = parseFloat(customAmount);
    return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  };

  const upiAddress = film.upiId || 'filmmaker@okaxis';

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!patronName.trim()) {
      setErrorMessage('Please provide your name or enter "Anonymous".');
      return;
    }

    const amount = getActiveAmount();
    if (amount <= 0) {
      setErrorMessage('Please enter a valid support contribution.');
      return;
    }

    const amountINR = Math.round(amount);
    setIsSubmitting(true);

    onSponsor(amountINR, patronName.trim())
      .then(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
      })
      .catch((err: any) => {
        setIsSubmitting(false);
        setErrorMessage(err.message || 'Error registering payment confirmation.');
      });
  };

  const amountINR = Math.round(getActiveAmount());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0c0c0e] sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-amber-500" />
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#F5F5F7]">Sponsor "{film.title}"</h3>
              <p className="text-[11px] text-white/40 font-mono mt-0.5 uppercase tracking-wide">100% direct patronage to {film.director}</p>
            </div>
          </div>
          <button 
            id="close-tip-jar-btn"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/5 text-white/40 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Inner Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          
          {isSuccess ? (
            /* Celebration screen */
            <div className="flex flex-col items-center text-center py-8 px-4 gap-4 animate-in fade-in-50 duration-500">
              <div className="h-14 w-14 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/5 mb-2">
                <Heart className="h-6 w-6 fill-current text-rose-500" />
              </div>
              <h4 className="text-base font-mono font-bold text-[#F5F5F7] tracking-wider uppercase flex items-center gap-1.5 justify-center">
                Thank You, Patron!
              </h4>
              <p className="text-xs text-white/50 max-w-sm leading-relaxed">
                Your direct contribution of <strong className="text-amber-500 text-xs font-mono">₹{amountINR}</strong> has been successfully registered for <span className="text-white font-semibold">{film.director}</span>.
              </p>
              <div className="bg-black/30 p-4 rounded border border-white/5 text-[11px] text-white/40 max-w-xs font-sans leading-relaxed">
                "Direct community support is what keeps modern cinematic exploration alive. This contribution helps fund my next lens rental and script registrations. Thank you for viewing!" <br/>
                <span className="text-[#F5F5F7] font-mono font-semibold block mt-1 uppercase text-[10px] tracking-wider">— {film.director}</span>
              </div>
              
              <button
                id="tip-success-close-btn"
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-amber-500 text-black text-xs font-bold rounded shadow-md hover:bg-amber-400 active:scale-95 transition-all cursor-pointer uppercase tracking-widest"
              >
                Return to Screenings
              </button>
            </div>
          ) : (
            /* Standard checkout screen */
            <form onSubmit={handleCheckout} className="flex flex-col gap-5">
              {errorMessage && (
                <div className="p-3 bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded text-xs flex items-center gap-2 font-mono uppercase tracking-tight">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Direct Support Amount Input */}
              <div className="flex flex-col gap-2">
                <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest">
                  Sponsorship Amount (INR):
                </label>
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/40 font-mono text-base font-bold">
                    ₹
                  </span>
                  <input
                    id="tip-custom-amount-input"
                    type="number"
                    min="1"
                    required
                    placeholder="500"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full bg-white/5 text-[#F5F5F7] pl-8 pr-4 py-3 rounded-lg text-sm border border-white/10 focus:border-amber-500 focus:outline-none font-mono text-lg font-bold"
                  />
                </div>
              </div>

              {/* Step 2: Google Pay Gateway Details */}
              <div className="flex flex-col gap-4 border-t border-white/5 pt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-sans text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <QrCode className="h-3.5 w-3.5 text-amber-500" />
                    Google Pay Only
                  </h4>
                  <span className="text-[8px] bg-amber-500/15 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-sans font-bold uppercase tracking-widest">
                    100% Direct (0% fee)
                  </span>
                </div>

                <div className="flex flex-col items-center gap-4 bg-black/40 border border-white/5 p-4 rounded-lg">
                  {/* Dynamic QR Code */}
                  <div className="flex flex-col items-center gap-1.5 bg-white p-2.5 rounded shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                        `upi://pay?pa=${upiAddress}&pn=${encodeURIComponent(film.director)}&am=${amountINR}&cu=INR&tn=Sponsoring%20${encodeURIComponent(film.title)}`
                      )}`}
                      alt="UPI QR Code"
                      className="w-32 h-32"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[7px] text-black/60 font-sans font-bold uppercase tracking-widest">
                      Scan with Google Pay (GPay)
                    </span>
                  </div>

                  {/* UPI ID Info */}
                  <div className="w-full flex flex-col gap-2.5">
                    <div>
                      <label className="block text-[8px] font-sans text-white/45 uppercase tracking-widest mb-1 text-center sm:text-left">
                        Filmmaker UPI ID (GPay)
                      </label>
                      <div className="flex items-center gap-1.5 bg-white/5 p-2 rounded border border-white/10">
                        <span className="text-xs font-mono font-bold text-[#F5F5F7] select-all break-all flex-1 text-center sm:text-left">
                          {upiAddress}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(upiAddress);
                            setCopiedUpi(true);
                            setTimeout(() => setCopiedUpi(false), 2000);
                          }}
                          className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white transition-all cursor-pointer"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/[0.02] border border-white/5 p-2 rounded text-center">
                        <span className="text-[8px] text-white/40 uppercase block">Payment Mode</span>
                        <span className="text-xs font-mono font-bold text-white">GPay Only</span>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 p-2 rounded text-center">
                        <span className="text-[8px] text-amber-500 uppercase block font-bold">GPay Amount</span>
                        <span className="text-xs font-mono font-bold text-amber-500">₹{amountINR}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 rounded p-3 text-[10px] text-white/50 leading-relaxed font-sans text-center">
                  Open your <strong className="text-white">Google Pay (GPay)</strong> app on your mobile, scan the QR code above or copy the UPI ID, and transfer <strong className="text-[#F5F5F7]">₹{amountINR}</strong>. After doing so, please confirm your name and mark as paid below.
                </div>

                {/* Patron Name Input */}
                <div>
                  <label className="block text-[8px] font-sans text-white/45 uppercase tracking-widest mb-1">
                    Your Name (or "Anonymous")
                  </label>
                  <input
                    id="tip-patron-name-upi-input"
                    type="text"
                    required
                    placeholder="e.g. Sarah Chen"
                    value={patronName}
                    onChange={(e) => setPatronName(e.target.value)}
                    className="w-full bg-white/5 text-[#F5F5F7] text-xs px-3 py-2 rounded border border-white/10 focus:border-amber-500/50 focus:outline-none focus:bg-white/5 transition-all"
                  />
                </div>
              </div>

              {/* Sponsor Submit CTA */}
              <div className="mt-3 pt-4 border-t border-white/5 flex justify-end gap-3 font-sans">
                <button
                  id="tip-cancel-footer-btn"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/50 rounded text-xs font-bold transition-all cursor-pointer uppercase tracking-wider font-sans"
                >
                  Cancel
                </button>
                <button
                  id="tip-confirm-footer-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-white/5 disabled:text-white/30 text-black font-extrabold text-xs rounded transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/5 uppercase tracking-widest font-sans"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-3 w-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 text-black" />
                      <span>Mark as Paid</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
