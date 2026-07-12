(function(){
'use strict';

/*
 * TerraControl Taxonomy UI
 *
 * Verwendet ausschließlich lokal erzeugte SVG-Illustrationen.
 * Es werden keine Bestandsfotos als Gruppen- oder Gattungsbilder benutzt.
 * Es findet keine automatische Bildsuche im Internet statt.
 *
 * Priorität auf Einzeltierebene:
 * 1. eigenes Tierfoto
 * 2. passende Taxonomie-Illustration
 */

const STYLE_ID='tc2TaxonomyIllustrationStyles';

let observer=null;
let decorationTimer=null;

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
 if(
  window.NGT500&&
  typeof NGT500.esc==='function'
 ){
  return NGT500.esc(
   value||''
  );
 }

 return String(value||'')
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#39;');
}

function currentRoute(){
 if(
  window.NGT500&&
  typeof NGT500.current==='function'
 ){
  return NGT500.current();
 }

 return null;
}

function hashText(value){
 const text=String(value||'');
 let hash=0;

 for(let index=0;index<text.length;index++){
  hash=(
   (
    hash<<5
   )-
   hash+
   text.charCodeAt(index)
  )|0;
 }

 return Math.abs(hash);
}

function paletteFor(value){
 const palettes=[
  {
   main:'#9bec58',
   second:'#65c6ba',
   dark:'#0d2630',
   glow:'rgba(155,236,88,.28)'
  },
  {
   main:'#62d6ff',
   second:'#7d8cff',
   dark:'#102538',
   glow:'rgba(98,214,255,.25)'
  },
  {
   main:'#ffb454',
   second:'#ff6b81',
   dark:'#31231d',
   glow:'rgba(255,180,84,.25)'
  },
  {
   main:'#c58cff',
   second:'#6dd6ff',
   dark:'#251d35',
   glow:'rgba(197,140,255,.25)'
  },
  {
   main:'#72e3a6',
   second:'#f1d35f',
   dark:'#142b25',
   glow:'rgba(114,227,166,.25)'
  },
  {
   main:'#ff8e72',
   second:'#ffd06b',
   dark:'#33211f',
   glow:'rgba(255,142,114,.25)'
  }
 ];

 return palettes[
  hashText(value)%
  palettes.length
 ];
}

function classifyTaxon(value){
 const text=normalize(value);

 if(
  /(vogelspinne|spinne|tarantel|brachypelma|caribena|nhandu|poecilotheria|psalmopoeus|teraphosa|hamorii|boehmei|versicolor|metallica|blondi)/.test(
   text
  )
 ){
  return 'spider';
 }

 if(
  /(python|schlange|boa|natter|cobra|viper|naja|lampropeltis|pantherophis|morelia|antaresia|regius|reticulatus|molurus)/.test(
   text
  )
 ){
  return 'snake';
 }

 if(
  /(chamaleon|chamaeleon|furcifer|calyptratus|trioceros|jemen|pantherchamaleon)/.test(
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
  /(schildkrote|landschildkrote|testudo|turtle|tortoise)/.test(
   text
  )
 ){
  return 'tortoise';
 }

 if(
  /(frosch|frog|dendrobates|ranitomeya|kröte|krote)/.test(
   text
  )
 ){
  return 'frog';
 }

 if(
  /(skorpion|scorpion|pandinus|heterometrus)/.test(
   text
  )
 ){
  return 'scorpion';
 }

 if(
  /(mantis|heuschrecke|kafer|käfer|insekt|schabe|phasmid|gespenstschrecke)/.test(
   text
  )
 ){
  return 'insect';
 }

 if(
  /(agame|waran|iguana|leguan|echse|anolis|pogona|varanus)/.test(
   text
  )
 ){
  return 'lizard';
 }

 if(
  /(vogel|papagei|sittich|amadine|fink|eule)/.test(
   text
  )
 ){
  return 'bird';
 }

 if(
  /(fisch|aquarium|betta|cichlide|wels|guppy)/.test(
   text
  )
 ){
  return 'fish';
 }

 return 'generic';
}

function svgFrame(content,palette,label){
 return `
  <svg
   class="tc2TaxIllustrationSvg"
   viewBox="0 0 120 120"
   role="img"
   aria-label="${escapeHtml(label||'Tierillustration')}"
  >
   <defs>
    <radialGradient id="taxGlow" cx="38%" cy="30%" r="75%">
     <stop offset="0%" stop-color="${palette.second}" stop-opacity=".34"/>
     <stop offset="58%" stop-color="${palette.main}" stop-opacity=".09"/>
     <stop offset="100%" stop-color="${palette.dark}" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="taxMain" x1="0" y1="0" x2="1" y2="1">
     <stop offset="0%" stop-color="${palette.main}"/>
     <stop offset="100%" stop-color="${palette.second}"/>
    </linearGradient>

    <filter id="taxShadow" x="-30%" y="-30%" width="160%" height="160%">
     <feDropShadow
      dx="0"
      dy="4"
      stdDeviation="5"
      flood-color="${palette.main}"
      flood-opacity=".22"
     />
    </filter>
   </defs>

   <circle
    cx="60"
    cy="60"
    r="53"
    fill="url(#taxGlow)"
   />

   <g
    class="tc2TaxIllustrationCreature"
    filter="url(#taxShadow)"
   >
    ${content}
   </g>

   <circle
    class="tc2TaxIllustrationSpark tc2TaxIllustrationSparkOne"
    cx="94"
    cy="28"
    r="3"
    fill="${palette.second}"
   />

   <circle
    class="tc2TaxIllustrationSpark tc2TaxIllustrationSparkTwo"
    cx="25"
    cy="91"
    r="2.5"
    fill="${palette.main}"
   />
  </svg>
 `;
}

function snakeSvg(palette,label){
 return svgFrame(
  `
   <path
    d="
     M26 75
     C31 49 55 88 72 68
     C87 50 66 39 54 50
     C43 60 52 72 65 65
     C80 57 91 42 82 28
    "
    fill="none"
    stroke="url(#taxMain)"
    stroke-width="13"
    stroke-linecap="round"
    stroke-linejoin="round"
   />

   <path
    d="M81 28 L96 25 L88 38 Z"
    fill="${palette.second}"
   />

   <circle
    cx="87"
    cy="29"
    r="2.2"
    fill="#06111a"
   />

   <path
    d="M96 29 L104 26 M96 29 L104 33"
    stroke="${palette.main}"
    stroke-width="2"
    stroke-linecap="round"
   />
  `,
  palette,
  label
 );
}

function spiderSvg(palette,label){
 const legs=[
  'M48 49 C31 32 22 31 14 34',
  'M44 57 C25 48 17 49 10 55',
  'M44 66 C24 67 17 72 11 80',
  'M48 73 C33 87 27 94 28 105',
  'M72 49 C89 32 98 31 106 34',
  'M76 57 C95 48 103 49 110 55',
  'M76 66 C96 67 103 72 109 80',
  'M72 73 C87 87 93 94 92 105'
 ];

 return svgFrame(
  `
   <g
    fill="none"
    stroke="url(#taxMain)"
    stroke-width="6"
    stroke-linecap="round"
   >
    ${legs.map(function(path){
     return `<path d="${path}"/>`;
    }).join('')}
   </g>

   <ellipse
    cx="60"
    cy="67"
    rx="22"
    ry="26"
    fill="url(#taxMain)"
   />

   <circle
    cx="60"
    cy="43"
    r="14"
    fill="${palette.second}"
   />

   <g fill="#071521">
    <circle cx="54" cy="40" r="2"/>
    <circle cx="60" cy="38" r="2"/>
    <circle cx="66" cy="40" r="2"/>
    <circle cx="57" cy="45" r="1.7"/>
    <circle cx="63" cy="45" r="1.7"/>
   </g>

   <path
    d="M49 65 Q60 75 71 65"
    fill="none"
    stroke="${palette.dark}"
    stroke-width="3"
    opacity=".45"
   />
  `,
  palette,
  label
 );
}

function chameleonSvg(palette,label){
 return svgFrame(
  `
   <path
    d="
     M35 72
     C44 43 72 34 87 51
     C99 65 88 86 67 86
     C51 86 39 80 35 72
    "
    fill="url(#taxMain)"
   />

   <circle
    cx="82"
    cy="51"
    r="14"
    fill="${palette.second}"
   />

   <circle
    cx="86"
    cy="48"
    r="4"
    fill="#f7fbff"
   />

   <circle
    cx="87"
    cy="48"
    r="2"
    fill="#071521"
   />

   <path
    d="
     M38 71
     C19 65 18 89 35 91
     C49 93 52 79 42 76
     C35 74 31 80 36 84
    "
    fill="none"
    stroke="${palette.main}"
    stroke-width="8"
    stroke-linecap="round"
   />

   <path
    d="M56 83 L48 103 M69 84 L76 103"
    stroke="${palette.second}"
    stroke-width="6"
    stroke-linecap="round"
   />

   <path
    d="M75 39 L81 25 L88 42"
    fill="${palette.main}"
   />
  `,
  palette,
  label
 );
}

function geckoSvg(palette,label){
 return svgFrame(
  `
   <path
    d="
     M32 68
     C43 43 73 38 87 55
     C96 66 87 81 69 83
     C50 85 37 78 32 68
    "
    fill="url(#taxMain)"
   />

   <circle
    cx="86"
    cy="55"
    r="12"
    fill="${palette.second}"
   />

   <circle
    cx="90"
    cy="52"
    r="2.5"
    fill="#06111a"
   />

   <path
    d="M34 69 C20 72 18 88 30 93"
    fill="none"
    stroke="${palette.main}"
    stroke-width="8"
    stroke-linecap="round"
   />

   <g
    stroke="${palette.second}"
    stroke-width="6"
    stroke-linecap="round"
   >
    <path d="M48 75 L35 91"/>
    <path d="M61 79 L55 99"/>
    <path d="M70 78 L82 94"/>
    <path d="M78 70 L96 78"/>
   </g>

   <g fill="${palette.second}">
    <circle cx="33" cy="93" r="4"/>
    <circle cx="54" cy="101" r="4"/>
    <circle cx="84" cy="96" r="4"/>
    <circle cx="99" cy="79" r="4"/>
   </g>
  `,
  palette,
  label
 );
}

function tortoiseSvg(palette,label){
 return svgFrame(
  `
   <ellipse
    cx="57"
    cy="62"
    rx="35"
    ry="28"
    fill="url(#taxMain)"
   />

   <path
    d="M31 61 Q57 30 83 61 Q57 90 31 61"
    fill="none"
    stroke="${palette.dark}"
    stroke-width="4"
    opacity=".45"
   />

   <path
    d="M57 36 L57 88 M31 61 L83 61"
    stroke="${palette.dark}"
    stroke-width="3"
    opacity=".38"
   />

   <circle
    cx="94"
    cy="62"
    r="12"
    fill="${palette.second}"
   />

   <circle
    cx="98"
    cy="59"
    r="2"
    fill="#06111a"
   />

   <g fill="${palette.second}">
    <ellipse cx="34" cy="88" rx="9" ry="5"/>
    <ellipse cx="74" cy="89" rx="9" ry="5"/>
    <ellipse cx="31" cy="38" rx="8" ry="5"/>
    <ellipse cx="73" cy="36" rx="8" ry="5"/>
   </g>
  `,
  palette,
  label
 );
}

function frogSvg(palette,label){
 return svgFrame(
  `
   <ellipse
    cx="60"
    cy="67"
    rx="31"
    ry="25"
    fill="url(#taxMain)"
   />

   <circle
    cx="43"
    cy="45"
    r="14"
    fill="${palette.second}"
   />

   <circle
    cx="77"
    cy="45"
    r="14"
    fill="${palette.second}"
   />

   <circle cx="43" cy="44" r="5" fill="#f7fbff"/>
   <circle cx="77" cy="44" r="5" fill="#f7fbff"/>
   <circle cx="43" cy="44" r="2.5" fill="#06111a"/>
   <circle cx="77" cy="44" r="2.5" fill="#06111a"/>

   <path
    d="M48 70 Q60 78 72 70"
    fill="none"
    stroke="${palette.dark}"
    stroke-width="3"
    stroke-linecap="round"
   />

   <path
    d="M36 78 L17 94 M84 78 L103 94"
    stroke="${palette.second}"
    stroke-width="7"
    stroke-linecap="round"
   />
  `,
  palette,
  label
 );
}

function scorpionSvg(palette,label){
 return svgFrame(
  `
   <ellipse
    cx="57"
    cy="69"
    rx="20"
    ry="24"
    fill="url(#taxMain)"
   />

   <circle
    cx="57"
    cy="45"
    r="12"
    fill="${palette.second}"
   />

   <g
    stroke="${palette.main}"
    stroke-width="5"
    stroke-linecap="round"
    fill="none"
   >
    <path d="M43 57 L25 47 L15 51"/>
    <path d="M40 66 L20 63 L10 70"/>
    <path d="M42 76 L23 84 L17 95"/>
    <path d="M71 57 L89 47 L99 51"/>
    <path d="M74 66 L94 63 L104 70"/>
    <path d="M72 76 L91 84 L97 95"/>
   </g>

   <path
    d="
     M59 91
     C65 107 88 104 91 88
     C94 72 80 68 75 78
    "
    fill="none"
    stroke="${palette.second}"
    stroke-width="8"
    stroke-linecap="round"
   />

   <path
    d="M73 79 L82 74 L80 85 Z"
    fill="${palette.main}"
   />
  `,
  palette,
  label
 );
}

function insectSvg(palette,label){
 return svgFrame(
  `
   <ellipse
    cx="60"
    cy="68"
    rx="15"
    ry="29"
    fill="url(#taxMain)"
   />

   <circle
    cx="60"
    cy="39"
    r="12"
    fill="${palette.second}"
   />

   <ellipse
    cx="39"
    cy="61"
    rx="17"
    ry="25"
    fill="${palette.second}"
    opacity=".55"
    transform="rotate(-25 39 61)"
   />

   <ellipse
    cx="81"
    cy="61"
    rx="17"
    ry="25"
    fill="${palette.second}"
    opacity=".55"
    transform="rotate(25 81 61)"
   />

   <g
    stroke="${palette.main}"
    stroke-width="4"
    stroke-linecap="round"
   >
    <path d="M48 54 L25 43"/>
    <path d="M45 67 L20 67"/>
    <path d="M48 80 L25 94"/>
    <path d="M72 54 L95 43"/>
    <path d="M75 67 L100 67"/>
    <path d="M72 80 L95 94"/>
   </g>

   <path
    d="M55 30 L45 18 M65 30 L75 18"
    stroke="${palette.second}"
    stroke-width="3"
    stroke-linecap="round"
   />
  `,
  palette,
  label
 );
}

function lizardSvg(palette,label){
 return svgFrame(
  `
   <path
    d="
     M25 70
     C39 43 70 40 88 57
     C98 67 88 81 70 84
     C48 88 32 81 25 70
    "
    fill="url(#taxMain)"
   />

   <circle
    cx="89"
    cy="57"
    r="12"
    fill="${palette.second}"
   />

   <circle
    cx="93"
    cy="54"
    r="2.5"
    fill="#06111a"
   />

   <path
    d="M28 70 C11 72 12 91 28 96"
    fill="none"
    stroke="${palette.main}"
    stroke-width="8"
    stroke-linecap="round"
   />

   <g
    stroke="${palette.second}"
    stroke-width="6"
    stroke-linecap="round"
   >
    <path d="M47 77 L36 96"/>
    <path d="M66 80 L74 100"/>
    <path d="M75 72 L96 80"/>
   </g>
  `,
  palette,
  label
 );
}

function birdSvg(palette,label){
 return svgFrame(
  `
   <path
    d="
     M29 69
     C39 41 72 34 89 52
     C99 63 91 81 71 86
     C49 91 34 82 29 69
    "
    fill="url(#taxMain)"
   />

   <circle
    cx="84"
    cy="48"
    r="14"
    fill="${palette.second}"
   />

   <path
    d="M97 49 L110 55 L97 60 Z"
    fill="${palette.main}"
   />

   <circle
    cx="88"
    cy="45"
    r="2.5"
    fill="#06111a"
   />

   <path
    d="M45 61 Q61 51 73 68 Q57 80 45 61"
    fill="${palette.second}"
    opacity=".68"
   />

   <path
    d="M55 87 L50 103 M68 86 L72 103"
    stroke="${palette.main}"
    stroke-width="4"
    stroke-linecap="round"
   />
  `,
  palette,
  label
 );
}

function fishSvg(palette,label){
 return svgFrame(
  `
   <path
    d="
     M23 62
     C38 37 76 38 94 61
     C76 85 38 86 23 62
    "
    fill="url(#taxMain)"
   />

   <path
    d="M25 62 L10 43 L10 81 Z"
    fill="${palette.second}"
   />

   <circle
    cx="80"
    cy="55"
    r="4"
    fill="#f7fbff"
   />

   <circle
    cx="81"
    cy="55"
    r="2"
    fill="#06111a"
   />

   <path
    d="M52 47 Q63 61 52 77"
    fill="none"
    stroke="${palette.second}"
    stroke-width="4"
   />

   <circle cx="94" cy="28" r="4" fill="${palette.second}" opacity=".65"/>
   <circle cx="103" cy="17" r="3" fill="${palette.main}" opacity=".55"/>
  `,
  palette,
  label
 );
}

function genericSvg(palette,label){
 return svgFrame(
  `
   <circle
    cx="60"
    cy="66"
    r="23"
    fill="url(#taxMain)"
   />

   <circle
    cx="35"
    cy="40"
    r="10"
    fill="${palette.second}"
   />

   <circle
    cx="54"
    cy="28"
    r="10"
    fill="${palette.main}"
   />

   <circle
    cx="76"
    cy="31"
    r="10"
    fill="${palette.second}"
   />

   <circle
    cx="91"
    cy="49"
    r="10"
    fill="${palette.main}"
   />

   <path
    d="
     M39 77
     C43 57 77 54 83 77
     C88 96 68 103 60 94
     C50 104 35 94 39 77
    "
    fill="url(#taxMain)"
   />
  `,
  palette,
  label
 );
}

function illustrationFor(value){
 const label=clean(value)||'Tier';
 const type=classifyTaxon(label);
 const palette=paletteFor(label);

 switch(type){
  case 'snake':
   return snakeSvg(palette,label);

  case 'spider':
   return spiderSvg(palette,label);

  case 'chameleon':
   return chameleonSvg(palette,label);

  case 'gecko':
   return geckoSvg(palette,label);

  case 'tortoise':
   return tortoiseSvg(palette,label);

  case 'frog':
   return frogSvg(palette,label);

  case 'scorpion':
   return scorpionSvg(palette,label);

  case 'insect':
   return insectSvg(palette,label);

  case 'lizard':
   return lizardSvg(palette,label);

  case 'bird':
   return birdSvg(palette,label);

  case 'fish':
   return fishSvg(palette,label);

  default:
   return genericSvg(palette,label);
 }
}

function installStyles(){
 if(
  document.getElementById(
   STYLE_ID
  )
 ){
  return;
 }

 const style=document.createElement(
  'style'
 );

 style.id=STYLE_ID;

 style.textContent=`
  .tc2TaxIllustrationHost{
   display:grid!important;
   place-items:center!important;

   overflow:hidden!important;

   color:#9bec58!important;

   background:
    radial-gradient(
     circle at 35% 28%,
     rgba(105,210,196,.12),
     transparent 58%
    ),
    rgba(5,17,27,.58)!important;

   border:
    1px solid
    rgba(125,170,210,.24)!important;
  }

  .tc2TaxIllustrationSvg{
   display:block!important;

   width:100%!important;
   height:100%!important;

   overflow:visible!important;
  }

  .tc2TaxIllustrationCreature{
   transform-origin:60px 62px;
   animation:
    tc2TaxFloat
    4.6s
    ease-in-out
    infinite;
  }

  .tc2TaxIllustrationSpark{
   transform-origin:center;
   animation:
    tc2TaxSpark
    2.8s
    ease-in-out
    infinite;
  }

  .tc2TaxIllustrationSparkTwo{
   animation-delay:1.2s;
  }

  @keyframes tc2TaxFloat{
   0%,
   100%{
    transform:
     translateY(1px)
     rotate(-1deg);
   }

   50%{
    transform:
     translateY(-4px)
     rotate(1deg);
   }
  }

  @keyframes tc2TaxSpark{
   0%,
   100%{
    opacity:.3;
    transform:scale(.75);
   }

   50%{
    opacity:1;
    transform:scale(1.25);
   }
  }

  @media(
   prefers-reduced-motion:
   reduce
  ){
   .tc2TaxIllustrationCreature,
   .tc2TaxIllustrationSpark{
    animation:none!important;
   }
  }

  .tc2TaxFolder>
  .tc2TaxIllustrationHost{
   width:84px!important;
   min-width:84px!important;
   max-width:84px!important;

   height:84px!important;
   min-height:84px!important;
   max-height:84px!important;

   margin:0!important;
   padding:5px!important;

   border-radius:21px!important;

   font-size:0!important;
   letter-spacing:0!important;
  }

  .tc2TaxAnimal>
  .tc2TaxIllustrationHost{
   width:100%!important;
   height:100%!important;

   margin:0!important;
   padding:10px!important;

   border:0!important;
   border-radius:0!important;
  }

  .tc2TaxFolder{
   grid-template-columns:
    84px
    minmax(0,1fr)
    24px!important;

   grid-template-rows:
    auto
    auto!important;

   column-gap:14px!important;
   row-gap:5px!important;

   align-items:center!important;

   min-height:112px!important;
   padding:13px!important;
  }

  .tc2TaxFolder>
  .tc2TaxIllustrationHost{
   grid-column:1!important;
   grid-row:1 / 3!important;
  }

  .tc2TaxFolder>b{
   grid-column:2!important;
   grid-row:1!important;

   align-self:end!important;

   max-width:100%!important;
   overflow:hidden!important;

   color:#f4f7fb!important;

   font-size:17px!important;
   font-weight:900!important;
   line-height:1.2!important;

   text-align:left!important;
   text-overflow:ellipsis!important;
   white-space:nowrap!important;
  }

  .tc2TaxFolder>small{
   grid-column:2!important;
   grid-row:2!important;

   align-self:start!important;

   color:#a7b3bd!important;

   font-size:10px!important;
   font-weight:750!important;

   text-align:left!important;
  }

  .tc2TaxFolder::after{
   grid-column:3!important;
   grid-row:1 / 3!important;

   align-self:center!important;
  }

  @media(max-width:420px){
   .tc2TaxFolder{
    grid-template-columns:
     74px
     minmax(0,1fr)
     22px!important;

    min-height:100px!important;
    column-gap:11px!important;
    padding:11px!important;
   }

   .tc2TaxFolder>
   .tc2TaxIllustrationHost{
    width:74px!important;
    min-width:74px!important;
    max-width:74px!important;

    height:74px!important;
    min-height:74px!important;
    max-height:74px!important;

    border-radius:19px!important;
   }

   .tc2TaxFolder>b{
    font-size:15px!important;
   }
  }
 `;

 document.head.appendChild(
  style
 );
}

function directChild(
 parent,
 selector
){
 if(!parent){
  return null;
 }

 return Array.from(
  parent.children
 ).find(function(child){
  return child.matches(
   selector
  );
 })||null;
}

function folderLabel(button){
 const label=
  directChild(
   button,
   'b'
  );

 return clean(
  label&&label.textContent
 );
}

function folderIllustrationTarget(
 button
){
 const firstSpan=
  directChild(
   button,
   'span'
  );

 if(firstSpan){
  return firstSpan;
 }

 return null;
}

function decorateFolder(button){
 if(
  !button||
  button.dataset.taxIllustrated==='1'
 ){
  return;
 }

 const label=folderLabel(
  button
 );

 if(!label){
  return;
 }

 const target=
  folderIllustrationTarget(
   button
  );

 if(!target){
  return;
 }

 target.className=
  'tc2TaxIllustrationHost';

 target.innerHTML=
  illustrationFor(label);

 button.dataset.taxIllustrated='1';
}

function animalTaxonomyLabel(card){
 const taxonomy=
  directChild(
   card,
   'small'
  );

 if(
  taxonomy&&
  clean(taxonomy.textContent)
 ){
  return clean(
   taxonomy.textContent
  );
 }

 const name=
  directChild(
   card,
   'strong'
  );

 return clean(
  name&&name.textContent
 )||'Tier';
}

function animalImageTarget(card){
 return directChild(
  card,
  'div'
 );
}

function targetHasRealPhoto(target){
 if(!target){
  return false;
 }

 const image=
  target.querySelector(
   'img'
  );

 if(!image){
  return false;
 }

 const source=clean(
  image.getAttribute('src')
 );

 return !!source;
}

function decorateAnimal(card){
 if(
  !card||
  card.dataset.taxIllustrated==='1'
 ){
  return;
 }

 const target=
  animalImageTarget(
   card
  );

 if(!target){
  return;
 }

 /*
  * Eigene Tierfotos bleiben erhalten.
  * Nur Kamera-/Platzhalter werden ersetzt.
  */
 if(targetHasRealPhoto(target)){
  card.dataset.taxIllustrated='1';
  return;
 }

 const label=
  animalTaxonomyLabel(
   card
  );

 target.className=
  'tc2TaxIllustrationHost';

 target.innerHTML=
  illustrationFor(label);

 card.dataset.taxIllustrated='1';
}

function decorate(){
 installStyles();

 document
  .querySelectorAll(
   '.tc2TaxFolder'
  )
  .forEach(
   decorateFolder
  );

 document
  .querySelectorAll(
   '.tc2TaxAnimal'
  )
  .forEach(
   decorateAnimal
  );
}

function scheduleDecoration(){
 clearTimeout(
  decorationTimer
 );

 decorationTimer=setTimeout(
  decorate,
  60
 );
}

function observeApp(){
 if(observer){
  return;
 }

 const app=
  document.getElementById(
   'app'
  );

 if(!app){
  setTimeout(
   observeApp,
   100
  );

  return;
 }

 observer=
  new MutationObserver(
   function(){
    scheduleDecoration();
   }
  );

 observer.observe(
  app,
  {
   childList:true,
   subtree:true
  }
 );
}

function init(){
 installStyles();
 observeApp();

 if(
  window.NGT500&&
  typeof NGT500.on==='function'
 ){
  NGT500.on(
   'route',
   scheduleDecoration
  );

  NGT500.on(
   'store:changed',
   scheduleDecoration
  );
 }

 window.addEventListener(
  'load',
  scheduleDecoration
 );

 scheduleDecoration();
}

window.NGTTaxonomyUI={
 decorate:decorate,
 illustrationFor:
  illustrationFor,

 classifyTaxon:
  classifyTaxon
};

document.readyState==='loading'
 ?document.addEventListener(
   'DOMContentLoaded',
   init
  )
 :init();

})();