import React, { useState } from 'react';
import { Star, MessageSquare, Plus, AlertCircle, Smile } from 'lucide-react';
import { Film, Review } from '../types';

interface FeedbackSectionProps {
  film: Film;
  onAddReview: (filmId: string, review: Omit<Review, 'id' | 'createdAt'>) => void;
}

export default function FeedbackSection({ film, onAddReview }: FeedbackSectionProps) {
  const [userName, setUserName] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  
  // Specific aspect scores
  const [storytelling, setStorytelling] = useState(5);
  const [cinematography, setCinematography] = useState(5);
  const [soundDesign, setSoundDesign] = useState(5);
  const [acting, setActing] = useState(5);

  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Compute average aspects across all reviews
  const computeAverageAspects = () => {
    if (film.reviews.length === 0) return { storytelling: 0, cinematography: 0, soundDesign: 0, acting: 0 };
    
    let story = 0, cine = 0, sound = 0, act = 0;
    film.reviews.forEach(r => {
      story += r.aspects.storytelling;
      cine += r.aspects.cinematography;
      sound += r.aspects.soundDesign;
      act += r.aspects.acting;
    });

    const len = film.reviews.length;
    return {
      storytelling: parseFloat((story / len).toFixed(1)),
      cinematography: parseFloat((cine / len).toFixed(1)),
      soundDesign: parseFloat((sound / len).toFixed(1)),
      acting: parseFloat((act / len).toFixed(1)),
    };
  };

  const averages = computeAverageAspects();
  const overallAverage = film.reviews.length > 0 
    ? parseFloat((film.reviews.reduce((acc, curr) => acc + curr.rating, 0) / film.reviews.length).toFixed(1))
    : 0;

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setFormError('Please provide your name or a cinematic pseudonym.');
      return;
    }
    if (!comment.trim() || comment.length < 10) {
      setFormError('Please leave a helpful review comment (at least 10 characters).');
      return;
    }

    onAddReview(film.id, {
      userName: userName.trim(),
      rating,
      comment: comment.trim(),
      aspects: {
        storytelling,
        cinematography,
        soundDesign,
        acting,
      }
    });

    // Reset Form
    setUserName('');
    setComment('');
    setRating(5);
    setStorytelling(5);
    setCinematography(5);
    setSoundDesign(5);
    setActing(5);
    setFormError('');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 4000);
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-6 bg-[#0c0c0e] border border-white/5 rounded-lg p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#F5F5F7] flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-amber-500" /> AUDIENCE REVIEWS & CRITIQUE
          </h3>
          <p className="text-xs text-white/40 font-mono mt-0.5">TECHNICAL FEEDBACK PRESERVED ON THE ARCHIVE INDEX</p>
        </div>
        
        {!showForm && (
          <button
            id="write-review-toggle-btn"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-amber-500 hover:text-amber-400 border border-white/10 rounded text-xs font-bold transition-all cursor-pointer uppercase tracking-widest"
          >
            <Plus className="h-4 w-4" />
            <span>Write Critique</span>
          </button>
        )}
      </div>

      {/* Aggregate Score Dashboard Removed */}

      {/* Write a Review Drawer/Form */}
      {showForm && (
        <form 
          onSubmit={handleSubmitReview}
          className="bg-black/40 p-5 rounded border border-white/5 flex flex-col gap-5"
        >
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">Submit New critique</h4>
            <button
              id="cancel-review-btn"
              type="button"
              onClick={() => setShowForm(false)}
              className="text-[10px] text-white/40 hover:text-white font-mono uppercase tracking-wider cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded text-xs flex items-center gap-2 font-mono uppercase tracking-tight">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Name */}
            <div>
              <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">
                Your Screen Name
              </label>
              <input
                id="review-username-input"
                type="text"
                required
                placeholder="e.g. Cinephile99, Tilak"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/10 text-[#F5F5F7] text-xs px-3 py-2 rounded border border-white/10 focus:border-amber-500/50 focus:outline-none focus:bg-white/5 transition-all"
              />
            </div>

            {/* Overall Rating Slider */}
            <div>
              <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">
                Overall Star Rating: <span className="text-amber-500 font-bold">{rating}/5 Stars</span>
              </label>
              <input
                id="review-overall-rating-slider"
                type="range"
                min="1"
                max="5"
                step="1"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="w-full h-1 bg-white/15 accent-amber-500 rounded appearance-none cursor-pointer focus:outline-none"
              />
            </div>
          </div>

          {/* Aspect Ratings */}
          <div className="bg-white/[0.01] p-4 rounded border border-white/5 flex flex-col gap-4">
            <h5 className="text-[9px] font-mono font-bold tracking-widest text-white/40 uppercase">Aspect-Specific Feedback (1-5)</h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex justify-between text-[11px] font-mono text-white/50 mb-1 uppercase">
                  <span>Storytelling</span>
                  <span className="text-amber-500 font-bold">{storytelling}/5</span>
                </label>
                <input
                  id="aspect-storytelling-input"
                  type="range"
                  min="1"
                  max="5"
                  value={storytelling}
                  onChange={(e) => setStorytelling(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/15 accent-amber-500 rounded appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="flex justify-between text-[11px] font-mono text-white/50 mb-1 uppercase">
                  <span>Cinematography</span>
                  <span className="text-amber-500/80 font-bold">{cinematography}/5</span>
                </label>
                <input
                  id="aspect-cinematography-input"
                  type="range"
                  min="1"
                  max="5"
                  value={cinematography}
                  onChange={(e) => setCinematography(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/15 accent-amber-500 rounded appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="flex justify-between text-[11px] font-mono text-white/50 mb-1 uppercase">
                  <span>Sound & Music</span>
                  <span className="text-amber-500/60 font-bold">{soundDesign}/5</span>
                </label>
                <input
                  id="aspect-sound-input"
                  type="range"
                  min="1"
                  max="5"
                  value={soundDesign}
                  onChange={(e) => setSoundDesign(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/15 accent-amber-500 rounded appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="flex justify-between text-[11px] font-mono text-white/50 mb-1 uppercase">
                  <span>Acting & Direction</span>
                  <span className="text-amber-500/40 font-bold">{acting}/5</span>
                </label>
                <input
                  id="aspect-acting-input"
                  type="range"
                  min="1"
                  max="5"
                  value={acting}
                  onChange={(e) => setActing(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/15 accent-amber-500 rounded appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Comment Box */}
          <div>
            <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">
              Critique Details (Min 10 characters)
            </label>
            <textarea
              id="review-comment-input"
              rows={3}
              required
              placeholder="What worked? What could they do better next time given their hardware limits?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-white/5 hover:bg-white/10 text-[#F5F5F7] text-xs p-3 rounded border border-white/10 focus:border-amber-500/50 focus:outline-none focus:bg-white/5 transition-all font-sans leading-relaxed resize-none"
            />
          </div>

          {/* Submit */}
          <button
            id="submit-review-btn"
            type="submit"
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-[#050505] font-extrabold text-xs rounded transition-all cursor-pointer uppercase tracking-widest"
          >
            Submit Critique
          </button>
        </form>
      )}

      {/* Success Notification */}
      {isSuccess && (
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 rounded text-xs flex items-center gap-2 font-mono uppercase tracking-tight">
          <Smile className="h-4 w-4 text-emerald-500" />
          <span>Feedback archived successfully. Thank you for your review.</span>
        </div>
      )}

      {/* Review Comments Feed */}
      <div className="flex flex-col gap-4 max-h-[450px] overflow-y-auto pr-1">
        {film.reviews.length === 0 ? (
          <div className="p-8 bg-white/[0.01] border border-dashed border-white/10 text-center rounded">
            <p className="text-xs text-white/40 font-mono uppercase tracking-wider">No technical reviews on file yet.</p>
          </div>
        ) : (
          film.reviews.map((rev) => (
            <div 
              key={rev.id} 
              className="p-5 bg-black/30 rounded border border-white/5 hover:border-white/10 transition-all flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-[#F5F5F7]">{rev.userName}</h5>
                  <span className="text-[9px] text-white/40 font-mono uppercase tracking-widest">{rev.createdAt}</span>
                </div>
                
                {/* Micro Star Badge */}
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                  <Star className="h-2.5 w-2.5 text-amber-500 fill-current" />
                  <span className="text-[10px] font-bold font-mono text-white/80">{rev.rating}/5</span>
                </div>
              </div>

              <p className="text-xs text-[#F5F5F7]/80 font-sans leading-relaxed">
                {rev.comment}
              </p>

              {/* Individual Aspect scores removed */}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
