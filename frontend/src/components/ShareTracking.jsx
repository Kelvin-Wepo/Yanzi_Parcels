import { useState } from 'react';
import { Share2, Copy, MessageCircle, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ShareTracking({ jobId, trackingCode }) {
  const [copied, setCopied] = useState(false);
  
  const trackingUrl = `${window.location.origin}/track/${trackingCode}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };
  
  const shareWhatsApp = () => {
    const message = `Track my delivery: ${trackingUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };
  
  const shareSMS = () => {
    const message = `Track my delivery: ${trackingUrl}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-gray-800">Share Tracking</h3>
      </div>
      
      {/* Tracking Link */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-500 mb-1">Tracking Link</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={trackingUrl}
            readOnly
            className="flex-1 bg-transparent text-sm text-gray-700 font-mono outline-none truncate"
          />
          <button
            onClick={handleCopy}
            className={`p-2 rounded-lg transition ${
              copied ? 'bg-green-100 text-green-600' : 'hover:bg-gray-200 text-gray-500'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Share Buttons */}
      <div className="flex gap-3">
        <button
          onClick={shareWhatsApp}
          className="flex-1 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
        <button
          onClick={shareSMS}
          className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          SMS
        </button>
      </div>
    </div>
  );
}
