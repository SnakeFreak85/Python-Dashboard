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

function getAgeYearsText(animal,now){
    const d=getAgeDays(animal,now);

    if(d===null) return "-";

    const years=Math.floor(d/365.25);

    return years>0
        ?years+" Jahre"
        :"< 1 Jahr";
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

function daysSinceOr(value,fallback,now){
    const days=daysSince(value,now);

    return days===null
        ?fallback
        :days;
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

function positiveNumber(value){
    const result=number(value);

    return result!==null&&result>0
        ?result
        :null;
}

function gramsFromText(value){
    const match=text(value).match(
        /(\d+(?:[,.]\d+)?)\s*(?:g|gramm|gr)\b/i
    );

    return match
        ?Number(match[1].replace(",","."))
        :null;
}

function normalizeFeedEvent(entry){
    const source=entry||{};
    const condition=text(
        source.condition||
        source.state
    );
    const prey=text(
        source.prey||
        source.itemName||
        source.type
    );
    const unit=text(source.unit)||"Stück";
    const storedVariant=text(
        source.variantLabel||
        source.variant||
        source.size
    );
    const storedLabel=text(
        source.displayLabel||
        source.label
    );
    const legacyAmount=positiveNumber(
        source.amount
    );
    const variantWeight=
        gramsFromText(storedVariant)||
        gramsFromText(storedLabel);

    let preyWeightGrams=positiveNumber(
        source.preyWeightGrams ??
        source.weightGrams ??
        source.grams
    );

    if(preyWeightGrams===null){
        preyWeightGrams=variantWeight;
    }

    const amountLooksLikeQuantity=
        /st(ü|ue)ck/i.test(unit)&&
        legacyAmount!==null&&
        (
            (
                !!storedVariant&&
                legacyAmount<=20
            )||
            (
                !storedVariant&&
                /heimchen|schabe|insekt|grille/i.test(prey)&&
                legacyAmount<=50
            )
        );

    let quantity=positiveNumber(
        source.quantity
    );

    if(quantity===null){
        quantity=amountLooksLikeQuantity
            ?legacyAmount
            :1;
    }

    if(
        preyWeightGrams===null&&
        legacyAmount!==null&&
        !amountLooksLikeQuantity
    ){
        preyWeightGrams=legacyAmount;
    }

    const variantLabel=
        storedVariant||
        (
            preyWeightGrams!==null
                ?preyWeightGrams+" g"
                :""
        );

    const displayLabel=
        storedLabel||
        [
            condition,
            prey,
            variantLabel
        ].filter(Boolean).join(" ");

    return {
        ...source,
        id:text(source.id),
        date:text(source.date),
        accepted:source.accepted!==false,
        foodInventoryId:text(
            source.foodInventoryId
        ),
        prey:prey,
        condition:condition,
        state:condition,
        variantLabel:variantLabel,
        variant:variantLabel,
        size:variantLabel,
        preyWeightGrams:preyWeightGrams,
        quantity:quantity,
        unit:unit,
        displayLabel:displayLabel,
        label:displayLabel,
        source:text(source.source),
        note:text(source.note),

        /*
         * Kompatibilitätsfeld für ältere Leser. `amount` bezeichnet
         * künftig niemals mehr die Stückzahl.
         */
        amount:preyWeightGrams||0
    };
}

function createFeedEvent(input){
    const event=normalizeFeedEvent(input);

    delete event.deductStock;
    delete event.inventoryLabel;

    return event;
}

function feedLabel(entry){
    return normalizeFeedEvent(entry).displayLabel;
}

function formatFeedEvent(entry,options){
    const event=normalizeFeedEvent(entry);
    const settings=options||{};
    const quantity=
        event.quantity>1
            ?event.quantity+" × "
            :"";
    const label=
        quantity+
        (
            event.displayLabel||
            "Futtertier"
        );

    if(settings.includeStatus===false){
        return label;
    }

    return (
        event.accepted
            ?"Gefressen "
            :"Verweigert "
    )+label;
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

    getAgeYearsText,

    latest,

    daysSince,

    daysSinceOr,

    ensureHistories,

    normalizeFeedEvent,

    createFeedEvent,

    feedLabel,

    formatFeedEvent,

    getFeedInterval,

    getWeightInterval,

    feedEnabled,

    weightEnabled
};

})();
