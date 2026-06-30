(function(){
'use strict';
function wait(fn){if(window.NGTV2&&window.NGTData&&window.NGTActivity&&NGTActivity.build)fn();else setTimeout(function(){wait(fn);},100);}
function save(){const data=NGTData.load();data.activities=NGTActivity.build();NGTData.save(data,'v2-activity');return data.activities;}
function recent(n){return save().slice(0,n||20);}
wait(function(){window.NGTActivity.save=save;window.NGTActivity.recent=recent;save();NGTV2.on('data:changed',function(){setTimeout(save,80);});NGTV2.log('v2-activity-ready');});
})();
