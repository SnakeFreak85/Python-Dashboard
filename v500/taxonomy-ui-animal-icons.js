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

const ICONS={
 chameleon:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAABgFBMVEUNJTAHGyVOh1UyaFEYNzJrmE4pWEwxVjIoRy51plEpOCdrp2pHeVA6dVIaO0IaREQgN0VXk1pVlmMHFxyLt1ZQdziUxGut1m1HZjR2s3EoKiNOSDGIuWpahTtlikccRDeEqk4jSksBCxaXw1oWIx02ZDhknGNRVjZ2Z0RMi2BFakeKdktmWTqjzWdZomlniz2TyIQmJRw8gloaNR40dGJEPCqkyVlpkz0zbmBpZDthfDx5uoG84XEdUUx+sViVg1ImPB1yeEWCbkaFlEyY0X3Yx3bD42wfUDdfWUBfb2lekD55oD6Ml4O/q2Oh0Ybf0pLz5aj+/9wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADo52U+AAAAgHRSTlP/////////////////////////////////////////////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIlv0FsAAAghSURBVHja7VnpetpIFq0qValKW4jQggBJyKwGb7E9sbN0Ot3Ty+zb+7/MnCuBDTaJsQ3fNz/mOgYk4XPuXrcqbBhFw2HE5Nujt4/lzVLurrc+rz/cf3nzSwz4nAGdHUqGkTwgOsnbw8KzI/Z/+Z8Tzjeu6F99i6+ulrfrrz6Qh3+9ReSRbX1TPlhPi30k2TdJ3hC43Wq13rzBL17pbSnNp7vL1c1a1q6g3wfLltsouLSsL3IfToae2yhsq7W3MLKWZT9U/4O931yxLbmB/we572RsrUEC/wDpfq80feQHqKh7tYM3/CAl27Kad9viB2oKts03LNm/BAgDt74cjoCcdEgDGPtAETgkAbrDh9YhCeSBPbQMw2GnCvuZRdAsXM/oel/4c7C5XCwWkpmNpfP7BC2+M7xbVirudDrONFeL+o+niyc5diaQ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',
 gecko:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAABgFBMVEUMJTAIGyUZNDouaFInV00BCxVwx4iM144EFBxtuHhLmGpUpnI0dVVrqG4aRkMZRDojNThatXpKh1gjTEeRxnNouoKLuW0xbWAbM0BHimR505EpRzhxwnyIzIWOp1kvUjk6hVw8h2ROeE1whUnPylfR2GpKVzWpuWWrx29vl1iwtlmp2YhVZzus1HUjOUaY45anqFBcuIGMqGWNlkup5I4dUkkzcWFYlllqeUpIZERqmWiY0XcdUT4+kWZESzF0pFuNjUejm0fl1lxMWkhwdDaRsl6KtoqO56fHuVTb4nEZJR4wKSpZwHtcxYiI3aDJyGTp5XEnHCg7kF9ZoV1hbz55cmBthGR/vF+Sin2WkpCc8qy9xV+m6aLAtmXOz5Xf0lvi32YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6exKHAAAAgHRSTlP/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABClA1oAAAfpSURBVHja7Zp5e6M4EsZ1ARICYzAmxmd8H7Gnnatz9T19zj1737vf/1NsSZCJ3YEsCfZ/W53HbYPz/lSlqpJEN+KpGXsylKpzjBAi96yaGvmfln5PvXyT/oJ+QVoek2/AGg1EGsnX4a9GQ71vJLYp1Ui/1CAwIkT0uLa+sfEebnODI9BGezMD5NE+rbFfeYT2rf9/e7Rl11thUwoYP6BfYRTs4OD5wYbR5BqFP9qeK0uuZhhjBOUgCDugrELKhYCoMbJMBDs4J7uJMmGA+Ppq5eB8l3PJnMa2E4yS3SYLcbacYGz3CbkRJswo3kPGU5aq4hrdT1HRWkIgz/dVtg5JXKmUjEVu7Vbo3euTikqrI1Kr1UhekNRLpUxRsevw6OjM6sTZQ4DBNw4eN+KNj386Ofl4puzZs2fWINsFSNGiFUy64ytMht/efq7Nvvw8PrOsszML9E2RGSXYTRQtYdwbjy/x4Mv6ljebfvzLxFIG+lZT1HBulAraYMbwoDtJP13PXqFfWyB9dASMZlswnLMCFBt/C35ChqKr2+ZiTb/n37spoGlG3RwPaqxQl7gazxGK5vMT4MwuMcL2UejaH0HfUg6Y7ekpyRZilUKA4bTrDsLVak4H3b8PMSemDr7SX8FLW8yHOXNZEIBahEarmzAMvF4LIc7MTkdPsLUKLavTEfMBKgdQkxyF4Z8H1dOl6r+miG6U/k3YsTpHs+iClgd4HUsEQXd0qvqXKaYwdCsMQzNc/euPy4u8uXwEIP6HKT1Mlq3Eg9Bsgr5oi5vTv35rBL2yAFyBZHGwbm8a0Dat2UzUhQgncIAZeKUBtqUcSHoz7pvCNMNFVAfA6wn/bpJbr0UB2DNN01bbJsU4N00honVXSNd1fx/AfqtVGnDYNHXum8KmtA4A2T2dyzi27SB4QL94iGLfN02V+00gwU9bBsriQwd2ci1cGoBZ0LdlHewYQE2rI6TtpLvRFwSXB6itK3X6ti19Ham2kLHDXrw4P/fgJPnAlro4QK2+PerYWh8KQAYASDfsO/FAKXHU1/qrUeQrgJfuKh7QeAwAFuS+ir919O9RJG2YXoITff2gAJf3gMhmOLOa1niUABwoXz3+S7VSt7JPBY8AVEyrsxp3mqvRaAZJdNiX/WQClqNFFV+N1yU9OFfhX8061mi0EBIA0qwzlUC4txgipNosLgOA8ev1vdOZTaFByN8BwLS5Cn9r2kPd7oQUD1FWXkhr/MtY9QpoE+7ite04ADA9rnYE4UkUknSuiwBwb0hw6+Ryg8cda/blPynAlycXh4y+FGYzMDCh9c7N6nWPVN9UcSEAJovx0hj+stDVpTOQk3o4Hr9bQY9QfU7ageN5jmybfis2f4LW+iGKutN3b4oBEFl2r4zeAhZfz7Vszey3o9G7n0HdNOugbwdQA+zQb4t606zbwcW81Wpdvp3ge+WQM8mBy+kpQbT56dPfbPCC+CKaTttaX3zoggMUcURtX9R9O6ZebzgxOKoWm2TWhfXVDa4DTKE1Wz9ZNVXBQohE359+XswdCgmqCNLuO54K4XBZTQd/lyDqDbu/ln4YzwIadzrXzGzWIfc/2dg7/uGHBFD3o8+L7pBSop4mEufQYURpGq/Gi3R7nyyqt28yAMvhVeCGQrh1mE6/CRtP5PzYhv1DG7xwZbRYnw7gBKlLjNz2Oz55+/522HcAnAnQBw0KYkJXK4SJyvZsFCX6crF+qxzAeKNNqzfVjbikN+4D8O3Tht7cVfqOZ/uwPh7DDEfKAShgu3s61I87NpeBuw9JXutPOAHcr29MTqbRoAWpCMfQl76qXB0dX7jdE7g6oMoB9JUHaUjwlqEUgLcd6E3XcMzwKCMcO9I/9o9VvMTJ+tp1VYKqR0LoTuo25vg3wObN+x7AxckyOUFDnlAp5S3gtSowh/YY2ZTAv8Ujy/Qc4M0mt+04917CMu+LZH4T/Ra6p4/z9PFtiJIlD98DYOQogCIo/UMIT1VvIrY0Ec5AbniA7mK4hdC/yuSx7yoDfQh/jXCDZwnhBwGZ99NlWPhRF8ID+rZQGSUHhOPCpkOUd08vM9CEujr8tjSTQ5MlHkF4CKAIL6F56ujHfSnqpjbhU4PvxgM4Bqh9up5dR/mgzJe2txsAxoewn4ZNKHRkVoOdqTbp2476d5MdALhjdqbRsa/1CfE89fDYPpZ9WAoQ5sUBOWZUYPz/jKTsq+RUQM4N9iN0QGSg9VtUFsCRanOu2iGylv4S6CO13yK8Oh99rvKygNgMVfyVfjJaWCMddepgg/ng/StczgP1sCAKhauag3fXolQxOxcXLYMbxecg+5vIhvx01Xg3R8CUvu3OB5Phq3IAcAAqTI0fbU9Mjw7mvd6g+25d0gMbjtgqf7aThRukx4dLw/ju/aQcgBxHEQToK31IpGHPQMMJf1QlZxmtu0Ie0q+TnV+Ohpi/GS2NwoBaNqBfh+XXue/dH9ZDhN+sL3FJANIAmnEH9oe4OkGlATboxx4ubwDgeQAH7QaQeTnIidCuANhRAL4/AKewfu0VwGLoa3sMESd9243JLgCVnHbtQB6xXQAalexI12Jb2DvIU0RyAIjGUji4NAKhWs4d4th+XSUS5yUBeYP0HNiLOrA2aoBhPI2DcCV3o0kgSqZkSP/Pl1b8pLJQ++rKA4uFAxMBXS+GlHpa0qozdO2BiSQ1SgdQc7Hj4Sc5UPsvi52nx3FZMqIAAAAASUVORK5CYII=',
 python:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAABgFBMVEULJDAEGiQDExwsRyoYNi40Vy8mWFJOdjdql0p0plECDhhIaDNUhkokPEkiSkiYxmmKt1eJuGolOiSs1nM7ZTVOekVXhjtthzmNqE4SJhsZRUNkikkuZlZEWy2oymupuFRleTbO2Wl0qWmUw1sbMx0bQTVYk1Nskz2GmUM6dkq3xlxVmWN6sGqz2YJHakQnLCp9sViElT0aOkImOR1lmWYwbWEycWNPi2TEzWPS4nWhrUofVE1coWpzVDdoekXJ54UhJhg+cD5KPC1mSyyRWzOPZjyAhlWmZjXCzlvHx6wBDyVdQi6OgGyDrmCBuoGRxIKe0F6t01644IcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACI0tvYAAAAgHRSTlP//////////////////////////////////////////////////////////////////////////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHR1vNEAAAjESURBVHja7VppY+I4EpUsGUmWGh/4AoMhhEDSObo7Sd/XzM69uzN7/P8fs1WyTSDhiHN825pMGwy8p7pLIOI8s5C1Z57jeXjBq320vGufepXUV/v85qazfOhVL1RYDUGDR2n1tyYOdeytm5XUD2l9t77S+rXVT5IKHR7wF88iBOEpgl+S5xHHoy+6L8jzicO7l+Q55VlXj8LJ/+VBQqn9I7St3MMnvNvtdroPlMEl+HQrCyXdztvhcNh5hAzx83wLfOfdcIALeIwA0CWwdDclxLshJ/RpXDgYDvltqA23HhMkg5POOtzbzhOHIax49fm7AX3ySO8MnxUfGD4Pl1wd+izZWuPSwZA+Uz0YVpZ5yx9UTKq6sKs8UD58uIHYRVEknUGnw3YxdDA43z4AvhP2vn8875VheBaaXW98R2j3AR64+P69F/oA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'
};

function esc(value){
 return String(value||'')
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#39;');
}

function image(name,label){
 return '<img class="tc2TaxReferenceIcon" src="'+ICONS[name]+'" alt="'+esc(label)+'">';
}

function emptyIcon(label){
 return (
  '<span '+
   'class="tc2TaxNoIcon" '+
   'aria-hidden="true" '+
   'data-label="'+esc(label)+'"'+
  '></span>'
 );
}

function spiderIcon(label){
 const src=new URL(
  'v500/assets/taxonomy/spider.png?v=spider-3',
  document.baseURI
 ).href;

 return (
  '<img '+
   'class="tc2TaxReferenceIcon" '+
   'src="'+esc(src)+'" '+
   'alt="'+esc(label)+'" '+
   'loading="eager" '+
   'decoding="async"'+
  '>'
 );
}

function tortoiseIcon(label){
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

function illustrationFor(value){
 const label=clean(value)||'Tier';
 switch(classify(label)){
  case 'chameleon': return image('chameleon',label);
  case 'gecko': return image('gecko',label);
  case 'snake': return image('python',label);
  case 'spider': return spiderIcon(label);
  case 'tortoise': return tortoiseIcon(label);
  case 'generic': return emptyIcon(label);
  default: return fallback(label);
 }
}

P.illustrations={clean:clean,classify:classify,illustrationFor:illustrationFor};

})();
