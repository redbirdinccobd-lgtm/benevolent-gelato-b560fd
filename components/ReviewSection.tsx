
import React, { useState } from 'react';
import { Review } from '../types';
import { auth, db, OperationType, handleFirestoreError } from '../src/firebase';
import { collection, addDoc, updateDoc, increment, doc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface ReviewSectionProps {
  productId: number;
  reviews: Review[];
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ productId, reviews }) => {
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !comment) return;

    if (!auth?.currentUser) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth!, provider);
      } catch (error) {
        console.error("Sign in failed", error);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (!db) throw new Error("Firebase DB not initialized");
      await addDoc(collection(db, 'reviews'), {
        id: Math.random().toString(36).substr(2, 9),
        productId,
        userName,
        rating,
        comment,
        date: new Date().toISOString()
      });
      setUserName('');
      setRating(5);
      setComment('');
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'reviews');
       alert("Failed to submit review. Please try again later.");
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleVote = async (reviewId: string, voteType: 'up' | 'down') => {
    if (!db) return;
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, {
        [voteType === 'up' ? 'upvotes' : 'downvotes']: increment(1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reviews/${reviewId}`);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="mt-12 pt-12 border-t border-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h5 className="text-2xl font-bold text-slate-900 mb-2">Customer Reviews</h5>
          <div className="flex items-center gap-3">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < Math.round(Number(averageRating)) ? 'fill-current' : 'text-slate-200'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-slate-600 font-medium">{averageRating} out of 5 ({reviews.length} reviews)</span>
          </div>
        </div>
        
        <button 
          onClick={() => document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95"
        >
          Write a Review
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-8 mb-16">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-slate-900">{review.userName}</p>
                  <p className="text-xs text-slate-400">{new Date(review.date).toLocaleDateString()}</p>
                </div>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed underline-offset-4 decoration-slate-200">{review.comment}</p>
              
              {/* Voting Section */}
              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-sm p-1">
                  <button 
                    onClick={() => handleVote(review.id, 'up')}
                    className="text-slate-400 hover:text-green-600 transition-all p-1.5 hover:bg-green-50 rounded-lg"
                    title="Upvote"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <div className="px-2 min-w-[2rem] text-center border-x border-slate-100">
                    <span className={`font-black text-sm ${(review.upvotes || 0) - (review.downvotes || 0) >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                      {(review.upvotes || 0) - (review.downvotes || 0)}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleVote(review.id, 'down')}
                    className="text-slate-400 hover:text-red-600 transition-all p-1.5 hover:bg-red-50 rounded-lg"
                    title="Downvote"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Helpful review?</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400">No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </div>

      {/* Review Form */}
      <div id="review-form" className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h6 className="text-xl font-bold text-slate-900 mb-6">Share Your Experience</h6>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Rating</label>
              <div className="flex items-center gap-2 h-12">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-1 transition-all transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-slate-200'}`}
                  >
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Your Comment</label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none"
              placeholder="Tell us what you think about this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all active:scale-[0.98] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-700'}`}
          >
            {isSubmitting ? 'Submitting...' : 'Post Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewSection;
