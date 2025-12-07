import { useState, useEffect } from 'react';
import { Gift, Copy, Share2, Check, Users, DollarSign } from 'lucide-react';
import { referralAPI } from '../services/api';
import { toast } from 'react-hot-toast';

export default function ReferralProgram() {
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchReferral();
  }, []);

  const fetchReferral = async () => {
    try {
      const response = await referralAPI.getMyReferralCode();
      setReferral(response.data);
    } catch (error) {
      // User might not have a referral code yet
      console.error('Failed to get referral code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!referral?.code) return;
    try {
      await navigator.clipboard.writeText(referral.code);
      setCopied(true);
      toast.success('Code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleShare = () => {
    const message = `Join Yanzi Parcels and get KSh 100 off your first delivery! Use my referral code: ${referral.code}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join Yanzi Parcels',
        text: message,
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      toast.error('Please enter a referral code');
      return;
    }

    setRedeeming(true);
    try {
      await referralAPI.applyReferralCode(redeemCode.trim());
      toast.success('Referral code redeemed! KSh 100 added to your wallet.');
      setRedeemCode('');
      fetchReferral();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid or expired code');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="bg-gray-100 rounded-xl h-40" />
        <div className="bg-gray-100 rounded-xl h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Your Referral Code */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Refer & Earn KSh 100</h3>
            <p className="text-amber-100 text-sm">For every friend who signs up</p>
          </div>
        </div>

        {referral?.code ? (
          <>
            <div className="bg-white/20 rounded-xl p-4 mb-4">
              <p className="text-xs text-amber-100 mb-1">Your Referral Code</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-mono tracking-wider">
                  {referral.code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className={`p-2 rounded-lg transition ${
                    copied ? 'bg-green-500' : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="w-full py-3 bg-white text-amber-600 rounded-xl font-semibold hover:bg-amber-50 transition flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share with Friends
            </button>
          </>
        ) : (
          <p className="text-amber-100">Loading your referral code...</p>
        )}
      </div>

      {/* Stats */}
      {referral && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
            <Users className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">
              {referral.successful_referrals || 0}
            </p>
            <p className="text-sm text-gray-500">Friends Referred</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
            <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">
              KSh {(referral.total_earned || 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Total Earned</p>
          </div>
        </div>
      )}

      {/* Redeem a Code */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Have a Referral Code?</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none font-mono uppercase"
            maxLength={10}
          />
          <button
            onClick={handleRedeem}
            disabled={redeeming}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition disabled:opacity-50"
          >
            {redeeming ? '...' : 'Redeem'}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4">How It Works</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </div>
            <p className="text-sm text-gray-600">Share your unique referral code with friends</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </div>
            <p className="text-sm text-gray-600">They sign up and complete their first delivery</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </div>
            <p className="text-sm text-gray-600">You both get KSh 100 credited to your wallets!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
