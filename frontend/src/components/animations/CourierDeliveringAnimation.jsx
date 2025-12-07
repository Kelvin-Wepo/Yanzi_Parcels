import React from 'react'

export default function CourierDeliveringAnimation({ className = '' }) {
  return (
    <div className={`relative w-64 h-48 ${className}`}>
      <svg viewBox="0 0 300 180" className="w-full h-full">
        <defs>
          {/* Gradient for motorcycle */}
          <linearGradient id="bikeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          
          {/* Courier uniform gradient */}
          <linearGradient id="uniformGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Delivery box gradient */}
          <linearGradient id="boxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Road */}
        <rect x="0" y="140" width="300" height="25" fill="#4b5563" />
        <line x1="0" y1="152" x2="300" y2="152" stroke="#fbbf24" strokeWidth="2" strokeDasharray="20,15">
          <animate attributeName="stroke-dashoffset" values="0;-35" dur="0.5s" repeatCount="indefinite" />
        </line>

        {/* Moving scenery (buildings in background) */}
        <g className="scenery">
          <rect x="0" y="80" width="25" height="60" fill="#e5e7eb" rx="2">
            <animate attributeName="x" values="280;-30" dur="3s" repeatCount="indefinite" />
          </rect>
          <rect x="100" y="95" width="20" height="45" fill="#d1d5db" rx="2">
            <animate attributeName="x" values="380;-30" dur="3s" repeatCount="indefinite" begin="0.5s" />
          </rect>
          <rect x="200" y="70" width="30" height="70" fill="#e5e7eb" rx="2">
            <animate attributeName="x" values="480;-40" dur="3s" repeatCount="indefinite" begin="1s" />
          </rect>
        </g>

        {/* Motorcycle with courier */}
        <g className="motorcycle" transform="translate(100, 0)">
          {/* Bike body */}
          <ellipse cx="70" cy="130" rx="35" ry="8" fill="url(#bikeGradient)" />
          
          {/* Back wheel */}
          <circle cx="45" cy="135" r="18" fill="#1f2937" stroke="#374151" strokeWidth="3">
            <animateTransform attributeName="transform" type="rotate" values="0 45 135;360 45 135" dur="0.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="45" cy="135" r="6" fill="#9ca3af" />
          {/* Wheel spokes */}
          <g>
            <animateTransform attributeName="transform" type="rotate" values="0 45 135;360 45 135" dur="0.5s" repeatCount="indefinite" />
            <line x1="45" y1="120" x2="45" y2="150" stroke="#6b7280" strokeWidth="2" />
            <line x1="30" y1="135" x2="60" y2="135" stroke="#6b7280" strokeWidth="2" />
          </g>
          
          {/* Front wheel */}
          <circle cx="95" cy="135" r="16" fill="#1f2937" stroke="#374151" strokeWidth="3">
            <animateTransform attributeName="transform" type="rotate" values="0 95 135;360 95 135" dur="0.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="95" cy="135" r="5" fill="#9ca3af" />
          {/* Wheel spokes */}
          <g>
            <animateTransform attributeName="transform" type="rotate" values="0 95 135;360 95 135" dur="0.5s" repeatCount="indefinite" />
            <line x1="95" y1="122" x2="95" y2="148" stroke="#6b7280" strokeWidth="2" />
            <line x1="82" y1="135" x2="108" y2="135" stroke="#6b7280" strokeWidth="2" />
          </g>

          {/* Bike frame */}
          <path d="M 45 135 L 60 110 L 85 110 L 95 135" stroke="#1f2937" strokeWidth="4" fill="none" />
          <path d="M 60 110 L 50 95" stroke="#1f2937" strokeWidth="4" fill="none" />
          
          {/* Handlebar */}
          <line x1="78" y1="95" x2="92" y2="95" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
          
          {/* Delivery box on back */}
          <rect x="30" y="85" width="28" height="22" rx="3" fill="url(#boxGradient)">
            <animate attributeName="y" values="85;83;85" dur="0.3s" repeatCount="indefinite" />
          </rect>
          <text x="44" y="99" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">YP</text>
          
          {/* Courier body */}
          <g className="courier">
            <animate attributeName="transform" type="translate" values="0,0;0,-2;0,0" dur="0.3s" repeatCount="indefinite" />
            
            {/* Torso */}
            <rect x="55" y="78" width="20" height="25" rx="5" fill="url(#uniformGradient)" />
            
            {/* Head with helmet */}
            <circle cx="65" cy="62" r="14" fill="#374151" />
            <ellipse cx="65" cy="58" rx="13" ry="10" fill="#1f2937" />
            <rect x="52" y="62" width="26" height="8" rx="2" fill="#1f2937" />
            {/* Visor */}
            <rect x="54" y="64" width="22" height="4" rx="1" fill="#60a5fa" opacity="0.7" />
            
            {/* Arms holding handlebar */}
            <line x1="60" y1="85" x2="50" y2="95" stroke="url(#uniformGradient)" strokeWidth="5" strokeLinecap="round" />
            <line x1="70" y1="85" x2="82" y2="95" stroke="url(#uniformGradient)" strokeWidth="5" strokeLinecap="round" />
            
            {/* Legs */}
            <line x1="60" y1="103" x2="55" y2="120" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
            <line x1="70" y1="103" x2="75" y2="118" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
          </g>
        </g>

        {/* Speed lines */}
        <g className="speed-lines">
          <line x1="50" y1="100" x2="20" y2="100" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
            <animate attributeName="opacity" values="0;1;0" dur="0.4s" repeatCount="indefinite" />
          </line>
          <line x1="60" y1="115" x2="25" y2="115" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
            <animate attributeName="opacity" values="0;1;0" dur="0.4s" repeatCount="indefinite" begin="0.1s" />
          </line>
          <line x1="55" y1="130" x2="30" y2="130" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
            <animate attributeName="opacity" values="0;1;0" dur="0.4s" repeatCount="indefinite" begin="0.2s" />
          </line>
        </g>

        {/* Dust particles */}
        <g className="dust">
          <circle r="3" fill="#9ca3af">
            <animate attributeName="cx" values="130;80;40" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="cy" values="145;140;135" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.4;0" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <circle r="2" fill="#9ca3af">
            <animate attributeName="cx" values="135;90;50" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
            <animate attributeName="cy" values="148;145;140" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
            <animate attributeName="opacity" values="0.6;0.3;0" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
          </circle>
          <circle r="2.5" fill="#9ca3af">
            <animate attributeName="cx" values="140;95;55" dur="0.8s" repeatCount="indefinite" begin="0.4s" />
            <animate attributeName="cy" values="146;142;138" dur="0.8s" repeatCount="indefinite" begin="0.4s" />
            <animate attributeName="opacity" values="0.7;0.35;0" dur="0.8s" repeatCount="indefinite" begin="0.4s" />
          </circle>
        </g>

        {/* Text label */}
        <text x="150" y="175" textAnchor="middle" fill="#6b7280" fontSize="12" fontWeight="500">
          On the way...
        </text>
      </svg>
    </div>
  )
}
