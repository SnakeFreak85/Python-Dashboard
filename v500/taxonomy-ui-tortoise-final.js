(function(){
'use strict';

const P=window.NGTTaxonomyUIInternal;
const illustrations=P&&P.illustrations;
if(!illustrations){throw new Error('taxonomy tortoise final requires illustrations');}

const previous=illustrations.illustrationFor;
const classify=illustrations.classify;
const clean=illustrations.clean;

function esc(value){
 return String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function tortoise(label){
 return `
  <svg class="tc2TaxSilhouetteSvg" viewBox="0 0 160 120" role="img" aria-label="${esc(label)}">
   <defs>
    <radialGradient id="tc2TortoiseBg" cx="42%" cy="36%" r="72%">
     <stop offset="0%" stop-color="#24564d" stop-opacity=".78"/>
     <stop offset="55%" stop-color="#102f36" stop-opacity=".42"/>
     <stop offset="100%" stop-color="#06121d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="tc2TortoiseShell" x1="0" y1="0" x2="1" y2="1">
     <stop offset="0%" stop-color="#c6ed63"/>
     <stop offset="45%" stop-color="#7fc84e"/>
     <stop offset="100%" stop-color="#3b7d3e"/>
    </linearGradient>
    <linearGradient id="tc2TortoiseSkin" x1="0" y1="0" x2="1" y2="1">
     <stop offset="0%" stop-color="#b9ec79"/>
     <stop offset="100%" stop-color="#4f9b51"/>
    </linearGradient>
    <filter id="tc2TortoiseShadow" x="-40%" y="-40%" width="180%" height="180%">
     <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#42c98d" flood-opacity=".28"/>
    </filter>
   </defs>
   <ellipse cx="80" cy="62" rx="70" ry="51" fill="url(#tc2TortoiseBg)"/>
   <g filter="url(#tc2TortoiseShadow)">
    <ellipse cx="72" cy="65" rx="42" ry="31" fill="url(#tc2TortoiseShell)" stroke="#d8f2a2" stroke-opacity=".35" stroke-width="1.4"/>
    <path d="M31 65 Q72 27 114 65 Q73 102 31 65Z" fill="none" stroke="#3e7a44" stroke-width="3" opacity=".95"/>
    <path d="M72 35 L72 95 M34 65 L111 65 M47 44 Q72 62 97 44 M47 86 Q72 68 97 86" fill="none" stroke="#467f43" stroke-width="2.2" opacity=".85"/>
    <path d="M52 39 Q72 49 92 39 L103 58 Q74 70 42 58Z" fill="#a6df58" opacity=".42"/>
    <ellipse cx="121" cy="64" rx="16" ry="12" fill="url(#tc2TortoiseSkin)" stroke="#d9f3aa" stroke-opacity=".28"/>
    <circle cx="127" cy="61" r="2.4" fill="#07131b"/>
    <path d="M132 69 Q125 73 118 69" fill="none" stroke="#35613a" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="43" cy="93" rx="11" ry="6" fill="url(#tc2TortoiseSkin)" transform="rotate(-18 43 93)"/>
    <ellipse cx="91" cy="94" rx="11" ry="6" fill="url(#tc2TortoiseSkin)" transform="rotate(18 91 94)"/>
    <ellipse cx="43" cy="38" rx="10" ry="5.5" fill="url(#tc2TortoiseSkin)" transform="rotate(16 43 38)"/>
    <ellipse cx="91" cy="37" rx="10" ry="5.5" fill="url(#tc2TortoiseSkin)" transform="rotate(-16 91 37)"/>
    <path d="M28 65 L18 70 L29 74Z" fill="url(#tc2TortoiseSkin)"/>
   </g>
   <path d="M24 103 C58 112 105 112 137 100" fill="none" stroke="#65c6ba" stroke-opacity=".19" stroke-width="2"/>
  </svg>`;
}

illustrations.illustrationFor=function(value){
 const label=clean(value)||'Tier';
 if(classify(label)==='tortoise')return tortoise(label);
 return previous(label);
};

})();