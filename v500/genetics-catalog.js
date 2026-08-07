(function(){
'use strict';

const TRAITS=[
 {id:'bp-albino',name:'Albino',scope:'ball-python',inheritance:'recessive',aliases:['albino']},
 {id:'bp-pied',name:'Pied',scope:'ball-python',inheritance:'recessive',aliases:['pied','piebald']},
 {id:'bp-clown',name:'Clown',scope:'ball-python',inheritance:'recessive',aliases:['clown']},
 {id:'bp-axanthic',name:'Axanthic',scope:'ball-python',inheritance:'recessive',aliases:['axanthic'],requiresLine:true},
 {id:'bp-genetic-stripe',name:'Genetic Stripe',scope:'ball-python',inheritance:'recessive',aliases:['genetic stripe']},
 {id:'bp-ultramel',name:'Ultramel',scope:'ball-python',inheritance:'recessive',aliases:['ultramel']},
 {id:'bp-hypo',name:'Hypo / Ghost',scope:'ball-python',inheritance:'recessive',aliases:['orange ghost','hypo','ghost']},
 {id:'bp-desert-ghost',name:'Desert Ghost',scope:'ball-python',inheritance:'recessive',aliases:['desert ghost','dg']},
 {id:'bp-monsoon',name:'Monsoon',scope:'ball-python',inheritance:'recessive',aliases:['monsoon']},
 {id:'bp-puzzle',name:'Puzzle',scope:'ball-python',inheritance:'recessive',aliases:['puzzle']},

 {id:'bp-pastel',name:'Pastel',scope:'ball-python',inheritance:'incomplete',aliases:['pastel']},
 {id:'bp-fire',name:'Fire',scope:'ball-python',inheritance:'incomplete',aliases:['fire']},
 {id:'bp-orange-dream',name:'Orange Dream',scope:'ball-python',inheritance:'incomplete',aliases:['orange dream','od']},
 {id:'bp-banana',name:'Banana / Coral Glow',scope:'ball-python',inheritance:'incomplete',aliases:['banana','coral glow'],sexLinked:true,issue:'Geschlechtsgebundene Vererbung: Male-/Female-Maker beeinflusst die Geschlechterverteilung.'},
 {id:'bp-yellow-belly',name:'Yellow Belly',scope:'ball-python',inheritance:'incomplete',aliases:['yellow belly','yb'],complex:'yellow-belly'},
 {id:'bp-gravel',name:'Gravel',scope:'ball-python',inheritance:'incomplete',aliases:['gravel'],complex:'yellow-belly'},
 {id:'bp-asphalt',name:'Asphalt',scope:'ball-python',inheritance:'incomplete',aliases:['asphalt'],complex:'yellow-belly'},
 {id:'bp-specter',name:'Specter',scope:'ball-python',inheritance:'incomplete',aliases:['specter'],complex:'yellow-belly'},
 {id:'bp-mojave',name:'Mojave',scope:'ball-python',inheritance:'incomplete',aliases:['mojave'],complex:'bel'},
 {id:'bp-lesser',name:'Lesser',scope:'ball-python',inheritance:'incomplete',aliases:['lesser'],complex:'bel',issue:'Super Lesser kann vergrößerte Augen zeigen.'},
 {id:'bp-butter',name:'Butter',scope:'ball-python',inheritance:'incomplete',aliases:['butter'],complex:'bel'},
 {id:'bp-russo',name:'Russo',scope:'ball-python',inheritance:'incomplete',aliases:['russo'],complex:'bel'},
 {id:'bp-mystic',name:'Mystic',scope:'ball-python',inheritance:'incomplete',aliases:['mystic'],complex:'bel'},
 {id:'bp-phantom',name:'Phantom',scope:'ball-python',inheritance:'incomplete',aliases:['phantom'],complex:'bel'},
 {id:'bp-bamboo',name:'Bamboo',scope:'ball-python',inheritance:'incomplete',aliases:['bamboo'],complex:'bel'},
 {id:'bp-special',name:'Special',scope:'ball-python',inheritance:'incomplete',aliases:['special'],complex:'bel'},
 {id:'bp-cinnamon',name:'Cinnamon',scope:'ball-python',inheritance:'incomplete',aliases:['cinnamon','cinny'],complex:'eight-ball',issue:'Super Cinnamon kann Fehlbildungen zeigen.'},
 {id:'bp-black-pastel',name:'Black Pastel',scope:'ball-python',inheritance:'incomplete',aliases:['black pastel'],complex:'eight-ball',issue:'Super Black Pastel kann Fehlbildungen zeigen.'},
 {id:'bp-enchi',name:'Enchi',scope:'ball-python',inheritance:'incomplete',aliases:['enchi'],complex:'eight-ball'},
 {id:'bp-hra',name:'Het Red Axanthic',scope:'ball-python',inheritance:'incomplete',aliases:['het red axanthic','hra'],complex:'eight-ball'},
 {id:'bp-spotnose',name:'Spotnose',scope:'ball-python',inheritance:'incomplete',aliases:['spotnose'],complex:'spider'},
 {id:'bp-spider',name:'Spider',scope:'ball-python',inheritance:'incomplete',aliases:['spider'],complex:'spider',issue:'Genetischer Wobble; Super Spider gilt als letal.'},
 {id:'bp-champagne',name:'Champagne',scope:'ball-python',inheritance:'incomplete',aliases:['champagne'],complex:'spider',issue:'Super Champagne gilt als letal; weitere Kombinationen können problematisch sein.'},
 {id:'bp-woma',name:'Woma',scope:'ball-python',inheritance:'incomplete',aliases:['woma'],complex:'spider',issue:'Woma kann einen genetischen Wobble zeigen.'},
 {id:'bp-pinstripe',name:'Pinstripe',scope:'ball-python',inheritance:'dominant',aliases:['pinstripe']},

 {id:'lg-tremper-albino',name:'Tremper Albino',scope:'leopard-gecko',inheritance:'recessive',aliases:['tremper albino','tremper']},
 {id:'lg-bell-albino',name:'Bell Albino',scope:'leopard-gecko',inheritance:'recessive',aliases:['bell albino']},
 {id:'lg-rainwater-albino',name:'Rainwater Albino',scope:'leopard-gecko',inheritance:'recessive',aliases:['rainwater albino','las vegas albino']},
 {id:'lg-eclipse',name:'Eclipse',scope:'leopard-gecko',inheritance:'recessive',aliases:['eclipse']},
 {id:'lg-blizzard',name:'Blizzard',scope:'leopard-gecko',inheritance:'recessive',aliases:['blizzard']},
 {id:'lg-murphy-patternless',name:'Murphy Patternless',scope:'leopard-gecko',inheritance:'recessive',aliases:['murphy patternless','patternless']},
 {id:'lg-mack-snow',name:'Mack Snow',scope:'leopard-gecko',inheritance:'incomplete',aliases:['mack snow']},
 {id:'lg-lemon-frost',name:'Lemon Frost',scope:'leopard-gecko',inheritance:'dominant',aliases:['lemon frost'],issue:'Lemon Frost ist mit einem erhöhten Tumorrisiko verbunden.'},
 {id:'lg-tangerine',name:'Tangerine',scope:'leopard-gecko',inheritance:'polygenic',aliases:['tangerine'],note:'Linienmerkmal; keine belastbare Mendel-Quote.'},
 {id:'lg-bold-stripe',name:'Bold Stripe',scope:'leopard-gecko',inheritance:'polygenic',aliases:['bold stripe'],note:'Linienmerkmal; keine belastbare Mendel-Quote.'}
];

const COMPLEX_LABELS={
 bel:'Blue-Eyed-Leucistic-Komplex',
 'yellow-belly':'Yellow-Belly-Komplex',
 'eight-ball':'8-Ball-Komplex',
 spider:'Spider-Komplex'
};

function byId(id){
 return TRAITS.find(function(trait){return trait.id===id;})||null;
}

function forScope(scope){
 return TRAITS.filter(function(trait){return !scope||trait.scope===scope;});
}

window.GeneticsCatalog={
 version:'2026.08.1',
 reviewedAt:'2026-08-07',
 traits:TRAITS,
 byId:byId,
 forScope:forScope,
 complexLabel:function(id){return COMPLEX_LABELS[id]||id||'';},
 sources:[
  'https://www.morphmarket.com/morphpedia/ball-pythons/',
  'https://www.morphmarket.com/morphpedia/leopard-geckos/'
 ]
};

})();
