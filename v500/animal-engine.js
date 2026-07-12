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
    return text(animal.name);
}

function getScientificName(animal){
    return [
        text(animal.genus),
        text(animal.species)
    ].filter(Boolean).join(" ");
}

function getDisplayName(animal){
    return getName(animal) || getScientificName(animal);
}

function getBirthDate(animal){
    return (
        animal.birthDate ||
        animal.birth ||
        ""
    );
}

function getAgeDays(animal){

    const birth = getBirthDate(animal);

    if(!birth) return null;

    const b = new Date(birth);
    const t = new Date();

    b.setHours(0,0,0,0);
    t.setHours(0,0,0,0);

    return Math.floor(
        (t-b)/86400000
    );

}

function getAgeText(animal){

    const d = getAgeDays(animal);

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

function getFeedInterval(animal){

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

    getFeedInterval,

    getWeightInterval,

    feedEnabled,

    weightEnabled

};

})();