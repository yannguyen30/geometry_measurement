/**
 * Created by mva on 16/10/2014.
 */




function jsonLDIdReferenceGraphToNewPointerGraph(jsonObject,localContext){
    var knownObjects = {};
    var contextStack = [];
    var root;
    if(jsonObject["@graph"] !== undefined) {
        if(jsonObject["@context"] !== undefined){
            contextStack.push(jsonObject["@context"]);
        }
        root = {
            "@graph" : []
        };
        for(var i = 0; i < jsonObject["@graph"].length; ++i) {
            root["@graph"][i] = __jsonLDIdReferenceGraphToNewPointerGraph(knownObjects, jsonObject["@graph"][i], localContext, contextStack);
        }
    } else {
        root = __jsonLDIdReferenceGraphToNewPointerGraph(knownObjects,jsonObject,localContext,contextStack);
    }
    if(root["@context"] === undefined) {
        root["@context"] = {};
    }
    __mergeContextForNamespaces(root["@context"], localContext);
    return root;
}

function __mergeContextForNamespaces(initialContext, localContextForNamespaces) {
    for(var key in initialContext) {
        if(typeof key == 'string' && typeof initialContext[key] == 'string') { // it's a namespace entry
            delete initialContext[key];
        }
    }
    for(var key in localContextForNamespaces) {
        initialContext[key] = localContextForNamespaces[key];
    }
}

function __jsonLDIdReferenceGraphToNewPointerGraph(knownObjects,jsonObject,localContext,contextStack){
    if(__isJsonLDIndividual(jsonObject)) {
        if(jsonObject["@context"] !== undefined){
            contextStack.push(jsonObject["@context"]);
        }
        if(knownObjects[jsonObject["@id"]] !== undefined) {
            if(__isJsonLDFullIndividual(knownObjects[jsonObject["@id"]])) {
                return knownObjects[jsonObject["@id"]];
            } else {
                copyValuesAndExpandCompact(jsonObject, knownObjects[jsonObject["@id"]],localContext,contextStack);
            }
        } else {
            var newObject = {};
            copyValuesAndExpandCompact(jsonObject,newObject,localContext,contextStack);
            knownObjects[jsonObject["@id"]] = newObject;
        }
        for(var key in jsonObject) {
            var newkey = __expandAndCompactToLocalContextKey(key,contextStack,localContext);
            if(__isJsonLDIndividual(jsonObject[key])) {
                knownObjects[jsonObject["@id"]][newkey] = __jsonLDIdReferenceGraphToNewPointerGraph(knownObjects, jsonObject[key],localContext,contextStack);
            } else if(jsonObject[key] instanceof Array && key != "@type") {
                var newValues = [];
                for(var i = 0; i < jsonObject[key].length; ++i) {
                    newValues.push(__jsonLDIdReferenceGraphToNewPointerGraph(knownObjects, jsonObject[key][i],localContext,contextStack));
                }
                knownObjects[jsonObject["@id"]][newkey] = newValues;
            }
        }
        if(jsonObject["@context"] !== undefined){
            contextStack.pop();
        }

        return knownObjects[jsonObject["@id"]];
    } else {
        return jsonObject;
    }
}


function __expandAndCompactToLocalContextKey(key,contextStack,localContext){
    if(key.startsWith("@")){
        return key;
    }
    if(contextStack.length > 0){
        var expandedKey;
        var keyName;
        for(var i = contextStack.length -1 ;i>=0;i--){
            var currContext = contextStack[i];
            if(key.search(/:/) != -1){  // probably a compatc IRI
                for(var currContextKey in currContext){
                    if(typeof currContext[currContextKey] == 'string' &&
                       __keyMatchesContextKey(key,currContextKey)
                      ){
                        var keyName = key.replace(new RegExp("^"+currContextKey+":"),"");
                        expandedKey = currContext[currContextKey]+keyName;
                    }
                }
            }else{ //probably a vocab
                if(currContext["@vocab"] !== undefined){
                    expandedKey = currContext["@vocab"]+key;
                }
            }
        }
        if(expandedKey === undefined){
            expandedKey = key;
        }
        var newKey = __reverseLookup(expandedKey,localContext);
        if(newKey == "@vocab"){
            return expandedKey.replace(new RegExp("^"+localContext[newKey]),"");
        }else if (newKey == expandedKey){
            return newKey;
        }else
            return newKey+":"+expandedKey.replace(new RegExp("^"+localContext[newKey]),"");
    }
    return key;
    }


function __keyMatchesContextKey(key, currContextKey){
    return  key.match(new RegExp("^"+currContextKey+":[^/][^/]"));
}


function __reverseLookup(expandedKey,localContext){
    for(var key in localContext){
        if(expandedKey.startsWith(localContext[key])){
            return key;
        }
    }
    return expandedKey;
}


function __isJsonLDIndividual(jsonObject) {
    return jsonObject != null && typeof jsonObject["@id"] == "string";
}

function __isJsonLDFullIndividual(jsonObject) {
    return __isJsonLDIndividual(jsonObject) && Object.keys(jsonObject).length > 1;
}

function copyValues(jsonObjectSource, jsonObjectTarget) {
    for(var key in jsonObjectSource) {
        if(key != "@id") {
            jsonObjectTarget[key] = jsonObjectSource[key];
        }
    }
}

function copyValuesAndExpandCompact(jsonObjectSource, jsonObjectTarget,localContext,contextStack){
    for(var key in jsonObjectSource) {
        if(key == "@type"){
            jsonObjectTarget[key] = [];
            for(var i = 0; i< jsonObjectSource[key].length;i++){
                jsonObjectTarget[key].push(__expandAndCompactToLocalContextKey(jsonObjectSource[key][i],contextStack,localContext));
            }
        }else if(key == "@id"){
            jsonObjectTarget[key] = __expandAndCompactToLocalContextKey(jsonObjectSource[key],contextStack,localContext);
        }else if(!__isJsonLDIndividual(jsonObjectSource[key])) {
            jsonObjectTarget[__expandAndCompactToLocalContextKey(key,contextStack,localContext)] = jsonObjectSource[key];
        }
    }

}
function jsonLDIdReferenceGraphToPointerGraph(jsonObject) {
    var knownObjects = {};
    __jsonLDIdReferenceGraphToPointerGraph(knownObjects, jsonObject);
    return knownObjects;
}

function __jsonLDIdReferenceGraphToPointerGraph(knownObjects, jsonObject) {
    if(__isJsonLDIndividual(jsonObject)) {
        if(knownObjects[jsonObject["@id"]] != null) {
            if(__isJsonLDFullIndividual(knownObjects[jsonObject["@id"]])) {
                return knownObjects[jsonObject["@id"]];
            } else {
                copyValues(jsonObject, knownObjects[jsonObject["@id"]]);
                jsonObject = knownObjects[jsonObject["@id"]];
            }
        } else {
            knownObjects[jsonObject["@id"]] = jsonObject;
        }
        for(var key in jsonObject) {
            if(__isJsonLDIndividual(jsonObject[key])) {
                jsonObject[key] = __jsonLDIdReferenceGraphToPointerGraph(knownObjects, jsonObject[key]);
            } else if(jsonObject[key] instanceof Array) {
                var newValues = [];
                for(var i = 0; i < jsonObject[key].length; ++i) {
                    newValues.push(__jsonLDIdReferenceGraphToPointerGraph(knownObjects, jsonObject[key][i]));
                }
                jsonObject[key] = newValues;
            }
        }
        return jsonObject;
    } else {
        return jsonObject;
    }
}

// Does not support local context
function __expandToLocalContextKey(key,context){
    if(key.startsWith("@")){
        return key;
    }
    var expandedKey;
    var keyName;
    if(key.search(/:/) != -1){  // probably a compatc IRI
        for(var currContextKey in context){
            if(typeof context[currContextKey] == 'string' &&
               __keyMatchesContextKey(key,currContextKey)){
                    var keyName = key.replace(new RegExp("^"+currContextKey+":"),"");
                    expandedKey = context[currContextKey]+keyName;
            }
        }
    }
    if(expandedKey === undefined){
        expandedKey = key;
    }
    return expandedKey;
}


var JSONLD = {
    stringify : function(individual, validator) {
        var knownObjects = {};
        return JSON.stringify(individual,
            function(key, jsonObject) {
                if(validator && !validator(key, individual["@context"])) return undefined;
                if(__isJsonLDIndividual(jsonObject)) {
                    if(knownObjects[jsonObject["@id"]] !== undefined) {
                        return {"@id" : jsonObject["@id"]};
                    } else {
                        knownObjects[jsonObject["@id"]] = jsonObject;
                        return jsonObject;
                    }
                } else {
                    return jsonObject;
                }
            }
        );
    },
    normalize : function(individual,context){
        return jsonLDIdReferenceGraphToNewPointerGraph(individual,context);
    }
};
