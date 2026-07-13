(function(){
'use strict';

const P=window.NGTTaxonomyUIInternal=
 window.NGTTaxonomyUIInternal||{};

function clean(value){
 return String(
  value==null
   ?''
   :value
 )
  .replace(/\s+/g,' ')
  .trim();
}

function normalize(value){
 return clean(value)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/ß/g,'ss');
}

function escapeHtml(value){
 return String(value||'')
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#39;');
}

function classify(value){
 const text=normalize(value);

 if(
  /(vogelspinne|spinne|tarantel|brachypelma|caribena|nhandu|poecilotheria|psalmopoeus|theraphosa|grammostola|avicularia)/.test(
   text
  )
 ){
  return 'spider';
 }

 if(
  /(python|schlange|boa|natter|morelia|antaresia|lampropeltis|pantherophis|regius|reticulatus|molurus)/.test(
   text
  )
 ){
  return 'snake';
 }

 if(
  /(chamaleon|chamaeleon|furcifer|calyptratus|trioceros)/.test(
   text
  )
 ){
  return 'chameleon';
 }

 if(
  /(gecko|gekko|phelsuma|correlophus|eublepharis|leopardgecko|kronengecko)/.test(
   text
  )
 ){
  return 'gecko';
 }

 if(
  /(schildkrote|landschildkrote|testudo|tortoise|turtle)/.test(
   text
  )
 ){
  return 'tortoise';
 }

 if(
  /(skorpion|scorpion|pandinus|heterometrus)/.test(
   text
  )
 ){
  return 'scorpion';
 }

 if(
  /(frosch|frog|dendrobates|ranitomeya|krote)/.test(
   text
  )
 ){
  return 'frog';
 }

 if(
  /(agame|waran|leguan|iguana|echse|anolis|pogona|varanus)/.test(
   text
  )
 ){
  return 'lizard';
 }

 if(
  /(mantis|insekt|kafer|heuschrecke|schabe|phasmid)/.test(
   text
  )
 ){
  return 'insect';
 }

 return 'generic';
}

function frame(content,label){
 return `
  <svg
   class="tc2TaxSilhouetteSvg"
   viewBox="0 0 160 120"
   role="img"
   aria-label="${escapeHtml(label||'Tier')}"
  >
   <defs>
    <radialGradient
     id="tc2TaxBackground"
     cx="42%"
     cy="38%"
     r="72%"
    >
     <stop
      offset="0%"
      stop-color="#214c53"
      stop-opacity=".58"
     />

     <stop
      offset="54%"
      stop-color="#112c38"
      stop-opacity=".30"
     />

     <stop
      offset="100%"
      stop-color="#06121d"
      stop-opacity="0"
     />
    </radialGradient>

    <linearGradient
     id="tc2TaxBody"
     x1="0"
     y1="0"
     x2="1"
     y2="1"
    >
     <stop
      offset="0%"
      stop-color="#d6e8e7"
     />

     <stop
      offset="52%"
      stop-color="#85aaa9"
     />

     <stop
      offset="100%"
      stop-color="#3f6469"
     />
    </linearGradient>

    <filter
     id="tc2TaxShadow"
     x="-40%"
     y="-40%"
     width="180%"
     height="180%"
    >
     <feDropShadow
      dx="0"
      dy="5"
      stdDeviation="6"
      flood-color="#4bc9bb"
      flood-opacity=".18"
     />
    </filter>
   </defs>

   <ellipse
    cx="80"
    cy="61"
    rx="70"
    ry="51"
    fill="url(#tc2TaxBackground)"
   />

   <g
    class="tc2TaxSilhouetteCreature"
    fill="url(#tc2TaxBody)"
    stroke="#d8eeee"
    stroke-opacity=".20"
    stroke-width="1.2"
    filter="url(#tc2TaxShadow)"
   >
    ${content}
   </g>

   <path
    d="M24 101 C58 111 105 111 137 99"
    fill="none"
    stroke="#65c6ba"
    stroke-opacity=".17"
    stroke-width="2"
   />
  </svg>
 `;
}

function spider(label){
 return frame(
  `
   <g
    fill="none"
    stroke="url(#tc2TaxBody)"
    stroke-width="6.5"
    stroke-linecap="round"
    stroke-linejoin="round"
   >
    <path d="M67 51 C49 31 36 27 22 30"/>
    <path d="M63 58 C43 45 30 43 16 49"/>
    <path d="M62 68 C39 65 28 70 17 81"/>
    <path d="M67 76 C48 91 40 101 39 110"/>

    <path d="M93 51 C111 31 124 27 138 30"/>
    <path d="M97 58 C117 45 130 43 144 49"/>
    <path d="M98 68 C121 65 132 70 143 81"/>
    <path d="M93 76 C112 91 120 101 121 110"/>
   </g>

   <ellipse
    cx="80"
    cy="71"
    rx="22"
    ry="27"
   />

   <ellipse
    cx="80"
    cy="46"
    rx="15"
    ry="14"
   />

   <g fill="#10252d" stroke="none">
    <circle cx="74" cy="43" r="2"/>
    <circle cx="80" cy="41" r="2"/>
    <circle cx="86" cy="43" r="2"/>
    <circle cx="77" cy="47" r="1.5"/>
    <circle cx="83" cy="47" r="1.5"/>
   </g>
  `,
  label
 );
}

function snake(label){
 return frame(
  `
   <path
    d="
     M28 82
     C34 56 56 91 78 76
     C101 61 96 39 79 36
     C62 33 52 48 61 58
     C72 70 93 55 104 43
     C116 30 120 22 116 16
    "
    fill="none"
    stroke="url(#tc2TaxBody)"
    stroke-width="15"
    stroke-linecap="round"
    stroke-linejoin="round"
   />

   <path
    d="M111 17 L131 20 L118 34 Z"
   />

   <circle
    cx="120"
    cy="22"
    r="2.2"
    fill="#07131b"
    stroke="none"
   />

   <path
    d="M130 26 L140 22 M130 26 L140 30"
    fill="none"
    stroke="#8abfba"
    stroke-width="1.8"
    stroke-linecap="round"
   />
  `,
  label
 );
}

function chameleon(label){
 return frame(
  `
   <path
    d="
     M42 76
     C43 49 67 32 95 39
     C115 44 123 61 113 76
     C103 90 75 91 57 84
     C49 81 44 78 42 76
    "
   />

   <path
    d="
     M45 74
     C27 63 18 76 25 89
     C31 100 47 98 50 87
     C52 80 44 76 39 82
     C36 87 41 91 45 88
    "
    fill="none"
    stroke="url(#tc2TaxBody)"
    stroke-width="8"
    stroke-linecap="round"
   />

   <path
    d="M101 43 L108 26 L116 47 Z"
   />

   <circle
    cx="108"
    cy="51"
    r="10"
   />

   <circle
    cx="111"
    cy="49"
    r="3"
    fill="#08141c"
    stroke="none"
   />

   <path
    d="M66 80 L58 101 M87 83 L94 103"
    fill="none"
    stroke="url(#tc2TaxBody)"
    stroke-width="6"
    stroke-linecap="round"
   />

   <path
    d="M38 103 C68 98 100 100 131 96"
    fill="none"
    stroke="#55746f"
    stroke-width="5"
    stroke-linecap="round"
   />
  `,
  label
 );
}

function gecko(label){
 return frame(
  `
   <path
    d="
     M42 71
     C49 46 73 37 99 45
     C117 50 121 66 108 77
     C93 90 63 88 48 79
     C44 76 42 73 42 71
    "
   />

   <circle
    cx="108"
    cy="53"
    r="10"
   />

   <circle
    cx="112"
    cy="50"
    r="2.4"
    fill="#08141c"
    stroke="none"
   />

   <path
    d="M43 72 C27 72 20 84 25 95"
    fill="none"
    stroke="url(#tc2TaxBody)"
    stroke-width="8"
    stroke-linecap="round"
   />

   <g
    fill="none"
    stroke="url(#tc2TaxBody)"
    stroke-width="6"
    stroke-linecap="round"
   >
    <path d="M58 77 L42 96"/>
    <path d="M74 82 L68 103"/>
    <path d="M88 79 L101 96"/>
    <path d="M97 68 L119 75"/>
   </g>

   <g stroke="none">
    <circle cx="40" cy="98" r="4"/>
    <circle cx="68" cy="105" r="4"/>
    <circle cx="103" cy="98" r="4"/>
    <circle cx="122" cy="76" r="4"/>
   </g>
  `,
  label
 );
}

function tortoise(label){
 return frame(
  `
   <ellipse
    cx="76"
    cy="65"
    rx="39"
    ry="29"
   />

   <path
    d="M39 65 Q75 32 113 65 Q76 96 39 65"
    fill="none"
    stroke="#314e52"
    stroke-width="3"
   />

   <path
    d="M76 37 L76 93 M40 65 L112 65"
    fill="none"
    stroke="#314e52"
    stroke-width="2"
   />

   <ellipse
    cx="124"
    cy="64"
    rx="14"
    ry="11"
   />

   <circle
    cx="129"
    cy="61"
    r="2"
    fill="#08141c"
    stroke="none"
   />

   <ellipse cx="48" cy="91" rx="10" ry="5"/>
   <ellipse cx="91" cy="92" rx="10" ry="5"/>
   <ellipse cx="47" cy="38" rx="9" ry="5"/>
   <ellipse cx="91" cy="37" rx="9" ry="5"/>
  `,
  label
 );
}

function scorpion(label){
 return frame(
  `
   <ellipse
    cx="77"
    cy="70"
    rx="18"
    ry="24"
   />

   <ellipse
    cx="77"
    cy="45"
    rx="13"
    ry="12"
   />

   <g
    fill="none"
    stroke="url(#tc2TaxBody)"
    stroke-width="5"
    stroke-linecap="round"
   >
    <path d="M64 55 L44 43 L28 48"/>
    <path d="M61 66 L37 62 L23 70"/>
    <path d="M63 77 L43 88 L35 103"/>

    <path d="M90 55 L110 43 L126 48"/>
    <path d="M93 66 L117 62 L131 70"/>
    <path d="M91 77 L111 88 L119 103"/>
   </g>

   <path
    d="
     M80 91
     C88 108 113 105 119 88
     C124 73 112 65 104 74
    "
    fill="none"
    stroke="url(#tc2TaxBody)"
    stroke-width="8"
    stroke-linecap="round"
   />

   <path
    d="M101 75 L112 70 L109 83 Z"
   />
  `,
  label
 );
}

function frog(label){
 return frame(
  `
   <ellipse
    cx="80"
    cy="72"
    rx="34"
    ry="25"
   />

   <circle
    cx="60"
    cy="47"
    r="14"
   />

   <circle
    cx="100"
    cy="47"
    r="14"
   />

   <circle
    cx="60"
    cy="46"
    r="4"
    fill="#08141c"
    stroke="none"
   />

   <circle
    cx="100"
    cy="46"
    r="4"
    fill="#08141c"
    stroke="none"
   />

   <path
    d="M66 75 Q80 82 94 75"
    fill="none"
    stroke="#314e52"
    stroke-width="3"
    stroke-linecap="round"
   />

   <path
    d="M53 82 L29 101 M107 82 L131 101"
    fill="none"
    stroke="url(#tc2TaxBody)"
    stroke-width="7"
    stroke-linecap="round"
   />
  `,
  label
 );
}

function lizard(label){
 return frame(
  `
   <path
    d="
     M38 71
     C48 44 77 38 105 49
     C120 55 122 68 108 78
     C91 90 61 88 45 79
     C40 76 38 73 38 71
    "
   />

   <circle
    cx="112"
    cy="55"
    r="10"
   />

   <circle
    cx="116"
    cy="52"
    r="2.3"
    fill="#08141c"
    stroke="none"
   />

   <path
    d="M40 72 C23 73 18 87 25 98"
    fill="none"
    stroke="url(#tc2TaxBody)"
    stroke-width="8"
    stroke-linecap="round"
   />

   <g
    fill="none"
    stroke="url(#tc2TaxBody)"
    stroke-width="6"
    stroke-linecap="round"
   >
    <path d="M58 78 L42 98"/>
    <path d="M78 82 L74 104"/>
    <path d="M92 78 L106 96"/>
   </g>
  `,
  label
 );
}

function insect(label){
 return frame(
  `
   <ellipse
    cx="80"
    cy="70"
    rx="15"
    ry="30"
   />

   <circle
    cx="80"
    cy="39"
    r="12"
   />

   <ellipse
    cx="56"
    cy="63"
    rx="17"
    ry="27"
    opacity=".58"
    transform="rotate(-25 56 63)"
   />

   <ellipse
    cx="104"
    cy="63"
    rx="17"
    ry="27"
    opacity=".58"
    transform="rotate(25 104 63)"
   />

   <g
    fill="none"
    stroke="url(#tc2TaxBody)"
    stroke-width="4"
    stroke-linecap="round"
   >
    <path d="M67 55 L42 42"/>
    <path d="M65 69 L36 69"/>
    <path d="M67 82 L43 100"/>

    <path d="M93 55 L118 42"/>
    <path d="M95 69 L124 69"/>
    <path d="M93 82 L117 100"/>

    <path d="M75 29 L64 17"/>
    <path d="M85 29 L96 17"/>
   </g>
  `,
  label
 );
}

function generic(label){
 return frame(
  `
   <path
    d="
     M44 75
     C46 51 66 38 88 42
     C108 45 120 61 114 77
     C108 92 86 96 66 90
     C54 87 46 81 44 75
    "
   />

   <circle
    cx="102"
    cy="50"
    r="12"
   />

   <circle
    cx="106"
    cy="47"
    r="2.3"
    fill="#08141c"
    stroke="none"
   />

   <path
    d="M46 75 C29 75 22 87 27 99"
    fill="none"
    stroke="url(#tc2TaxBody)"
    stroke-width="7"
    stroke-linecap="round"
   />

   <path
    d="M60 85 L55 103 M88 87 L95 103"
    fill="none"
    stroke="url(#tc2TaxBody)"
    stroke-width="6"
    stroke-linecap="round"
   />
  `,
  label
 );
}

function illustrationFor(value){
 const label=clean(value)||'Tier';

 switch(classify(label)){
  case 'spider':
   return spider(label);

  case 'snake':
   return snake(label);

  case 'chameleon':
   return chameleon(label);

  case 'gecko':
   return gecko(label);

  case 'tortoise':
   return tortoise(label);

  case 'scorpion':
   return scorpion(label);

  case 'frog':
   return frog(label);

  case 'lizard':
   return lizard(label);

  case 'insect':
   return insect(label);

  default:
   return generic(label);
 }
}

P.illustrations={
 clean:clean,
 classify:classify,
 illustrationFor:illustrationFor
};

})();

