(function(){
'use strict';

const P=window.NGTTaxonomyUIInternal;
const base=P&&P.illustrations;

if(!base){
 throw new Error('taxonomy-ui-animal-icons.js benoetigt taxonomy-ui-illustrations.js.');
}

const clean=base.clean;
const classify=base.classify;
const fallback=base.illustrationFor;

function esc(value){
 return String(value||'')
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#39;');
}

function frame(body,label){
 return `
  <svg class="tc2TaxSilhouetteSvg" viewBox="0 0 160 120" role="img" aria-label="${esc(label)}">
   <defs>
    <radialGradient id="tc2IconBg" cx="45%" cy="38%" r="72%">
     <stop offset="0%" stop-color="#285f4b" stop-opacity=".55"/>
     <stop offset="60%" stop-color="#12382f" stop-opacity=".34"/>
     <stop offset="100%" stop-color="#06121d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="tc2IconBody" x1="0" y1="0" x2="1" y2="1">
     <stop offset="0%" stop-color="#d8ff72"/>
     <stop offset="46%" stop-color="#72d95f"/>
     <stop offset="100%" stop-color="#23894e"/>
    </linearGradient>
    <linearGradient id="tc2IconDark" x1="0" y1="0" x2="1" y2="1">
     <stop offset="0%" stop-color="#4da54d"/>
     <stop offset="100%" stop-color="#17643f"/>
    </linearGradient>
    <filter id="tc2IconShadow" x="-30%" y="-30%" width="160%" height="170%">
     <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#3bbf66" flood-opacity=".3"/>
    </filter>
   </defs>
   <ellipse cx="80" cy="62" rx="69" ry="50" fill="url(#tc2IconBg)"/>
   <g class="tc2TaxSilhouetteCreature" filter="url(#tc2IconShadow)">${body}</g>
  </svg>`;
}

function chameleon(label){
 return frame(`
  <path d="M31 82 C21 69 24 51 38 39 C51 28 72 23 92 29 C111 35 126 49 126 65 C126 80 113 91 95 94 C75 98 55 93 44 84 C39 80 35 79 31 82 Z" fill="url(#tc2IconBody)"/>
  <path d="M43 79 C28 75 18 83 20 94 C22 105 36 108 44 101 C50 96 49 87 43 84 C38 82 34 86 35 91 C36 95 42 96 44 92" fill="none" stroke="url(#tc2IconBody)" stroke-width="8" stroke-linecap="round"/>
  <path d="M91 31 L101 17 L108 34 L116 23 L119 41" fill="url(#tc2IconDark)"/>
  <ellipse cx="108" cy="52" rx="15" ry="13" fill="url(#tc2IconBody)"/>
  <circle cx="112" cy="50" r="5.5" fill="#efffd0"/>
  <circle cx="113" cy="50" r="2.6" fill="#162319"/>
  <path d="M119 61 C126 60 130 62 134 65" fill="none" stroke="#1a563b" stroke-width="2" stroke-linecap="round"/>
  <path d="M55 80 L48 101 M75 88 L70 107 M96 85 L102 105" fill="none" stroke="url(#tc2IconBody)" stroke-width="6" stroke-linecap="round"/>
  <path d="M46 103 C69 98 95 100 123 94" fill="none" stroke="#8d6335" stroke-width="5" stroke-linecap="round"/>
  <g fill="#4fab4d" opacity=".75">
   <circle cx="61" cy="48" r="4"/><circle cx="75" cy="39" r="3.5"/><circle cx="85" cy="56" r="4.5"/><circle cx="68" cy="69" r="3"/>
  </g>
 `,label);
}

function gecko(label){
 return frame(`
  <path d="M40 67 C46 43 67 31 88 38 C106 44 116 57 112 70 C108 82 94 89 77 87 C60 85 46 77 40 67 Z" fill="url(#tc2IconBody)"/>
  <ellipse cx="107" cy="52" rx="13" ry="11" fill="url(#tc2IconBody)"/>
  <circle cx="111" cy="49" r="3.8" fill="#ecffd1"/><circle cx="112" cy="49" r="2" fill="#152218"/>
  <path d="M43 68 C27 67 19 76 22 89 C24 97 30 102 37 104" fill="none" stroke="url(#tc2IconBody)" stroke-width="7" stroke-linecap="round"/>
  <g fill="none" stroke="url(#tc2IconBody)" stroke-width="5.5" stroke-linecap="round">
   <path d="M58 75 L43 94"/><path d="M70 82 L66 104"/><path d="M88 80 L103 96"/><path d="M96 66 L119 72"/>
  </g>
  <g fill="#caff74">
   <circle cx="41" cy="96" r="3.6"/><circle cx="66" cy="106" r="3.6"/><circle cx="105" cy="98" r="3.6"/><circle cx="122" cy="73" r="3.6"/>
  </g>
  <g fill="#f3d75a" opacity=".75">
   <circle cx="58" cy="54" r="3"/><circle cx="70" cy="47" r="3.5"/><circle cx="82" cy="60" r="3"/><circle cx="90" cy="72" r="2.5"/>
  </g>
 `,label);
}

function snake(label){
 return frame(`
  <path d="M36 88 C47 72 67 91 82 80 C97 69 90 56 75 54 C59 52 48 64 54 75 C60 86 83 84 96 72 C109 60 112 45 103 36 C95 28 85 31 82 38" fill="none" stroke="url(#tc2IconBody)" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M99 34 C106 22 119 18 131 25 C139 30 141 39 136 46 C131 53 120 54 111 49 C104 45 100 40 99 34 Z" fill="url(#tc2IconBody)"/>
  <circle cx="127" cy="31" r="4" fill="#f2ffd2"/><circle cx="128" cy="31" r="2" fill="#142017"/>
  <path d="M138 42 L147 39 M138 42 L147 46" fill="none" stroke="#e06a45" stroke-width="2" stroke-linecap="round"/>
  <g fill="#4aa74e" opacity=".78">
   <circle cx="55" cy="78" r="3.5"/><circle cx="70" cy="72" r="4"/><circle cx="84" cy="65" r="3"/><circle cx="94" cy="51" r="3.8"/><circle cx="111" cy="38" r="3.2"/>
  </g>
 `,label);
}

function illustrationFor(value){
 const label=clean(value)||'Tier';
 switch(classify(label)){
  case 'chameleon': return chameleon(label);
  case 'gecko': return gecko(label);
  case 'snake': return snake(label);
  default: return fallback(label);
 }
}

P.illustrations={
 clean:clean,
 classify:classify,
 illustrationFor:illustrationFor
};

})();