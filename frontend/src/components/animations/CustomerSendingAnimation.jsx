import React from 'react'

export default function CustomerSendingAnimation({ className = '' }) {
  return (
    <div className={`relative w-64 h-48 ${className}`}>
      <svg viewBox="0 0 300 180" className="w-full h-full">
        {/* Background elements */}
        <defs>
          {/* Gradient for package */}
          <linearGradient id="packageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          
          {/* Gradient for person */}
          <linearGradient id="personGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Ground line */}
        <line x1="20" y1="150" x2="280" y2="150" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="5,5" />

        {/* Customer figure (left side) */}
        <g className="customer">
          {/* Body */}
          <circle cx="70" cy="95" r="18" fill="url(#personGradient)" />
          {/* Head */}
          <circle cx="70" cy="65" r="14" fill="#fcd34d" />
          {/* Face */}
          <circle cx="65" cy="63" r="2" fill="#374151" />
          <circle cx="75" cy="63" r="2" fill="#374151" />
          <path d="M 65 70 Q 70 75 75 70" stroke="#374151" strokeWidth="2" fill="none" />
          {/* Arms */}
          <line x1="55" y1="95" x2="40" y2="110" stroke="url(#personGradient)" strokeWidth="6" strokeLinecap="round">
            <animate attributeName="y2" values="110;105;110" dur="1s" repeatCount="indefinite" />
          </line>
          <line x1="85" y1="95" x2="100" y2="85" stroke="url(#personGradient)" strokeWidth="6" strokeLinecap="round">
            <animate attributeName="y2" values="85;80;85" dur="1s" repeatCount="indefinite" />
          </line>
          {/* Legs */}
          <line x1="65" y1="113" x2="60" y2="145" stroke="url(#personGradient)" strokeWidth="6" strokeLinecap="round" />
          <line x1="75" y1="113" x2="80" y2="145" stroke="url(#personGradient)" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* Package being sent */}
        <g className="package">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 120,-30; 120,-30; 0,0"
            keyTimes="0; 0.4; 0.6; 1"
            dur="4s"
            repeatCount="indefinite"
          />
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1; 0.8; 0.8; 1"
            keyTimes="0; 0.4; 0.6; 1"
            dur="4s"
            repeatCount="indefinite"
            additive="sum"
          />
          
          {/* Box */}
          <rect x="95" y="75" width="30" height="25" rx="3" fill="url(#packageGradient)">
            <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.35;0.4;0.95;1" dur="4s" repeatCount="indefinite" />
          </rect>
          {/* Box tape */}
          <line x1="110" y1="75" x2="110" y2="100" stroke="#92400e" strokeWidth="3">
            <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.35;0.4;0.95;1" dur="4s" repeatCount="indefinite" />
          </line>
          <line x1="95" y1="87" x2="125" y2="87" stroke="#92400e" strokeWidth="3">
            <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.35;0.4;0.95;1" dur="4s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Destination marker (right side) */}
        <g className="destination">
          {/* Pin */}
          <path d="M 230 130 Q 230 100 250 100 Q 270 100 270 130 Q 270 145 250 160 Q 230 145 230 130" fill="#ef4444">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
          </path>
          <circle cx="250" cy="125" r="8" fill="white" />
          
          {/* Pulse effect */}
          <circle cx="250" cy="125" r="15" fill="none" stroke="#ef4444" strokeWidth="2">
            <animate attributeName="r" values="15;25;15" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Motion trail particles */}
        <g className="particles">
          <circle cx="130" cy="70" r="3" fill="#fbbf24">
            <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite" begin="0.2s" />
            <animate attributeName="cx" values="100;180;180" dur="4s" repeatCount="indefinite" begin="0.2s" />
          </circle>
          <circle cx="140" cy="65" r="2" fill="#fbbf24">
            <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite" begin="0.3s" />
            <animate attributeName="cx" values="110;190;190" dur="4s" repeatCount="indefinite" begin="0.3s" />
          </circle>
          <circle cx="150" cy="75" r="2.5" fill="#fbbf24">
            <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite" begin="0.1s" />
            <animate attributeName="cx" values="105;185;185" dur="4s" repeatCount="indefinite" begin="0.1s" />
          </circle>
        </g>

        {/* Text label */}
        <text x="150" y="175" textAnchor="middle" fill="#6b7280" fontSize="12" fontWeight="500">
          Sending parcel...
        </text>
      </svg>
    </div>
  )
}
