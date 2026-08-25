'use strict';

const {initializeApp}=require('firebase-admin/app');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
const {defineSecret}=require('firebase-functions/params');
const {onCall,HttpsError}=require('firebase-functions/v2/https');

initializeApp();

const OPENAI_API_KEY=defineSecret('OPENAI_API_KEY');
const ADMIN_EMAIL='saschad1711@gmail.com';
const MAX_TITLE_LENGTH=80;
const MAX_MESSAGE_LENGTH=1000;
const TRANSLATED_TITLE_LENGTH=120;
const TRANSLATED_MESSAGE_LENGTH=1600;
const MODEL='gpt-4o-mini';

function clean(value){
 return String(value||'').trim();
}

function normalizedEmail(value){
 return clean(value).toLowerCase();
}

function validateSource(title,message){
 if(!title){
  throw new HttpsError('invalid-argument','Bitte gib eine Überschrift ein.');
 }

 if(title.length>MAX_TITLE_LENGTH){
  throw new HttpsError('invalid-argument','Die Überschrift ist zu lang.');
 }

 if(!message){
  throw new HttpsError('invalid-argument','Bitte gib eine Mitteilung ein.');
 }

 if(message.length>MAX_MESSAGE_LENGTH){
  throw new HttpsError('invalid-argument','Die Mitteilung ist zu lang.');
 }
}

function translationSchema(){
 const localized={
  type:'object',
  additionalProperties:false,
  properties:{
   title:{type:'string'},
   message:{type:'string'}
  },
  required:['title','message']
 };

 return {
  type:'object',
  additionalProperties:false,
  properties:{
   en:localized,
   it:localized,
   hu:localized
  },
  required:['en','it','hu']
 };
}

function responseText(payload){
 if(clean(payload&&payload.output_text)){
  return clean(payload.output_text);
 }

 const output=Array.isArray(payload&&payload.output)
  ?payload.output
  :[];

 for(const item of output){
  const content=Array.isArray(item&&item.content)
   ?item.content
   :[];

  for(const part of content){
   if(part&&part.type==='output_text'&&clean(part.text)){
    return clean(part.text);
   }
  }
 }

 return '';
}

function validateTranslations(value){
 const result={};

 for(const language of ['en','it','hu']){
  const entry=value&&value[language]||{};
  const title=clean(entry.title);
  const message=clean(entry.message);

  if(!title||!message){
   throw new Error('Incomplete translation for '+language);
  }

  if(
   title.length>TRANSLATED_TITLE_LENGTH||
   message.length>TRANSLATED_MESSAGE_LENGTH
  ){
   throw new Error('Translation too long for '+language);
  }

  result[language]={
   title:title,
   message:message
  };
 }

 return result;
}

async function translate(title,message){
 const response=await fetch('https://api.openai.com/v1/responses',{
  method:'POST',
  headers:{
   Authorization:'Bearer '+OPENAI_API_KEY.value(),
   'Content-Type':'application/json'
  },
  body:JSON.stringify({
   model:MODEL,
   store:false,
   input:[
    {
     role:'developer',
     content:[
      {
       type:'input_text',
       text:[
        'Translate this TerraControl app announcement from German into English, Italian and Hungarian.',
        'Translate faithfully and naturally. Do not add, remove or reinterpret information.',
        'Keep TerraControl, names, email addresses, URLs, numbers, emojis and line breaks unchanged.',
        'The title must stay concise. Return only the requested structured output.'
       ].join(' ')
      }
     ]
    },
    {
     role:'user',
     content:[
      {
       type:'input_text',
       text:JSON.stringify({title:title,message:message})
      }
     ]
    }
   ],
   text:{
    format:{
     type:'json_schema',
     name:'announcement_translations',
     strict:true,
     schema:translationSchema()
    }
   }
  })
 });

 const payload=await response.json().catch(function(){return {};});

 if(!response.ok){
  const apiMessage=clean(
   payload&&payload.error&&payload.error.message
  );
  throw new Error(apiMessage||'OpenAI request failed with '+response.status);
 }

 const text=responseText(payload);

 if(!text){
  throw new Error('OpenAI returned no translation text');
 }

 return validateTranslations(JSON.parse(text));
}

exports.translateAndPublishAnnouncement=onCall(
 {
  region:'europe-west3',
  secrets:[OPENAI_API_KEY],
  timeoutSeconds:60,
  memory:'256MiB'
 },
 async function(request){
  const email=normalizedEmail(
   request.auth&&request.auth.token&&request.auth.token.email
  );

  if(!request.auth){
   throw new HttpsError('unauthenticated','Bitte melde dich zuerst an.');
  }

  if(email!==ADMIN_EMAIL){
   throw new HttpsError('permission-denied','Nur der TerraControl-Administrator darf Mitteilungen veröffentlichen.');
  }

  const title=clean(request.data&&request.data.title);
  const message=clean(request.data&&request.data.message);
  const important=!!(request.data&&request.data.important);

  validateSource(title,message);

  let translations;

  try{
   translations=await translate(title,message);
  }catch(error){
   console.error('Announcement translation failed',error);
   throw new HttpsError(
    'unavailable',
    'Die automatische Übersetzung ist momentan nicht verfügbar.'
   );
  }

  const now=Date.now();
  const allTranslations=Object.assign(
   {
    de:{
     title:title,
     message:message
    }
   },
   translations
  );

  await getFirestore()
   .doc('appAnnouncements/current')
   .set({
    title:title,
    message:message,
    translations:allTranslations,
    important:important,
    active:true,
    publishedAt:FieldValue.serverTimestamp(),
    publishedAtMs:now
   });

  return {
   publishedAtMs:now,
   languages:['de','en','it','hu']
  };
 }
);

exports.__test={
 clean:clean,
 responseText:responseText,
 validateTranslations:validateTranslations,
 translationSchema:translationSchema
};
