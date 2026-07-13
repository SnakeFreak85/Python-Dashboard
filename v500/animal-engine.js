(function () {
"use strict";

function text(v){
    return String(v ?? "").trim();
}

function number(v){
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function getName(animal){
    return text(animal && animal.name);
}

function getScientificName(animal){
    animal=animal||{};

    return [
        text(animal.genus),
        text(animal.species)
    ].filter(Boolean).join(" ") ||
    text(animal.animalGroup);
}

function getDisplayName(animal){
    return getName(animal) || getScientificName(animal);
}

function getBirthDate(animal){
    animal=animal||{};

    return (
        animal.birthDate ||
        animal.birth ||
        ""
    );
}

function getAgeDays(animal,now){

    const birth = getBirthDate(animal);

    if(!birth) return null;

    const b = new Date(birth);
    const t = now ? new Date(now) : new Date();

    if(
        Number.isNaN(b.getTime()) ||
        Number.isNaN(t.getTime())
    ){
        return null;
    }

    b.setHours(0,0,0,0);
    t.setHours(0,0,0,0);

    return Math.floor(
        (t-b)/86400000
    );
}

function getAgeText(animal,now){

    const d = getAgeDays(animal,now);

    if(d===null) return "";

    if(d<30)
        return d+" Tage";

    if(d<365){

        const months=Math.floor(d/30);

        return months+" Monate";
    }

    const years=Math.floor(d/365);
    const months=Math.floor(
        (d%365)/30
    );

    if(months===0)
        return years+" Jahre";

    return years+
        " Jahre "+
        months+
        " Monate";
}

function latest(list){
    return (Array.isArray(list)?list:[])
        .slice()
        .sort(function(a,b){
            return String((b&&b.date)||"")
                .localeCompare(String((a&&a.date)||""));
        })[0]||null;
}

function daysSince(value,now){
    const date=Date.parse(value||"");
    const today=now ? Date.parse(now) : Date.now();

    if(
        !Number.isFinite(date) ||
        !Number.isFinite(today)
    ){
        return null;
    }

    return Math.floor((today-date)/86400000);
}

function ensureHistories(animal){
    animal=animal||{};

    [
        "health",
        "photos",
        "feeds",
        "sheds",
        "weights"
    ].forEach(function(key){
        if(!Array.isArray(animal[key])){
            animal[key]=[];
        }
    });

    return animal;
}

function getFeedInterval(animal){
    animal=animal||{};

    if(
        animal.feedIntervalEnabled===false
    ){
        return null;
    }

    return number(
        animal.feedIntervalDays ??
        animal.feedInterval ??
        animal.feedingInterval
    );
}

function getWeightInterval(animal){
    animal=animal||{};

    if(
        animal.weightIntervalEnabled===false
    ){
        return null;
    }

    return number(
        animal.weightIntervalDays ??
        animal.weightInterval
    );
}

function feedEnabled(animal){
    return getFeedInterval(animal)!==null;
}

function weightEnabled(animal){
    return getWeightInterval(animal)!==null;
}

window.AnimalEngine={

    getName,

    getDisplayName,

    getScientificName,

    getBirthDate,

    getAgeDays,

    getAgeText,

    latest,

    daysSince,

    ensureHistories,

    getFeedInterval,

    getWeightInterval,

    feedEnabled,

    weightEnabled

};

})();