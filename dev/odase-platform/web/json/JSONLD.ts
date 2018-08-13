/**
 * Created by mva on 16/10/2014.
 */

export namespace JSONLD {

 
export interface JsonObject {
    [key:string]: any
}

interface JsonObjectMap {
    [key:string]: JsonObject
}

function jsonLDIdReferenceGraphToNewPointerGraph(jsonObject: JsonObject, localContext: JsonObject, 
                                                 sort?: (o1: JsonObject, o2: JsonObject) => number) {
    let knownObjects: JsonObjectMap = {};
    let contextStack: JsonObject[] = [];
    let root: JsonObject;
    if(jsonObject["@graph"] !== undefined) {
        if(jsonObject["@context"] !== undefined){
            contextStack.push(jsonObject["@context"]);
        }
        root = {
            "@graph" : []
        };
        for(let i = 0; i < jsonObject["@graph"].length; ++i) {
            root["@graph"][i] = __jsonLDIdReferenceGraphToNewPointerGraph(knownObjects, jsonObject["@graph"][i], localContext, contextStack, sort);
        }
    } else {
        root = __jsonLDIdReferenceGraphToNewPointerGraph(knownObjects,jsonObject,localContext,contextStack, sort);
    }
    if(root["@context"] === undefined) {
        root["@context"] = {};
    }
    __mergeContextForNamespaces(root["@context"], localContext);
    return root;
}

function __mergeContextForNamespaces(initialContext: JsonObject, localContextForNamespaces: JsonObject) {
    if (Object.is(initialContext, localContextForNamespaces)) return;
    for(let key in initialContext) {
        if(typeof initialContext[key] == 'string' && key in localContextForNamespaces) {
            // it's a namespace entry
            delete initialContext[key];
        }
    }
    for(let key in localContextForNamespaces) {
        initialContext[key] = localContextForNamespaces[key];
    }
}

function __jsonLDIdReferenceGraphToNewPointerGraph(knownObjects: JsonObjectMap, jsonObject: JsonObject, 
                                                   localContext: JsonObject, contextStack: JsonObject[], 
                                                   sort?: (o1: JsonObject, o2: JsonObject) => number) {
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
            let newObject: JsonObject = {};
            copyValuesAndExpandCompact(jsonObject,newObject,localContext,contextStack);
            // Set local context
            newObject['@localContext'] = localContext;
            knownObjects[jsonObject["@id"]] = newObject;
        }
        for(let key in jsonObject) {
            let newkey = __expandAndCompactToLocalContextKey(key,contextStack,localContext);
            if(__isJsonLDIndividual(jsonObject[key])) {
                knownObjects[jsonObject["@id"]][newkey] = __jsonLDIdReferenceGraphToNewPointerGraph(knownObjects, jsonObject[key],localContext,contextStack, sort);
            } else if(jsonObject[key] instanceof Array && key != "@type") {
                let newValues = [];
                for(let i = 0; i < jsonObject[key].length; ++i) {
                    newValues.push(__jsonLDIdReferenceGraphToNewPointerGraph(knownObjects, jsonObject[key][i],localContext,contextStack, sort));
                }
                if(sort != null) {
                    newValues.sort(sort);
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


function __expandAndCompactToLocalContextKey(key: string, contextStack: JsonObject[], localContext: JsonObject){
    if(key.startsWith("@")){
        return key;
    }
    if(contextStack.length > 0){
        let expandedKey;
        for(let i = contextStack.length - 1; i >= 0; i--){
            let currContext = contextStack[i];
            let idx = key.indexOf(':');
            if(idx != -1 && key.substr(idx+1, 2) !== "//"){  // probably a compatc IRI
                let contextKey = key.substr(0, idx);
                // Expand if not the same as in localContext
                let expanded = currContext[contextKey];
                if(typeof expanded == "string"){
                    if (expanded == localContext[contextKey]){
                        return key; // same as in localContext - do not expand
                    }
                    else {
                        let keyName = key.slice(idx+1);
                        expandedKey = expanded + keyName;
                        break;
                    }
                }
            }else if(currContext["@vocab"] !== undefined){//probably a vocab
                if (currContext["@vocab"] == localContext["@vocab"]){
                    return key;
                }else{
                    expandedKey = currContext["@vocab"]+key;
                }
            }
        }
        if(expandedKey === undefined){
            expandedKey = key;
        }
        let newKey = __reverseLookup(expandedKey,localContext);
        if(newKey == "@vocab"){
            return expandedKey.slice(localContext[newKey].length);
        }else if (newKey == expandedKey){
            return newKey;
        }else
            return newKey+":"+expandedKey.slice(localContext[newKey].length);
    }
    return key;
}


function __reverseLookup(expandedKey: string, localContext: JsonObject): string {
    if (expandedKey.startsWith('func:') || expandedKey.startsWith('urn:')) return expandedKey;
    for(let key in localContext){
        if(expandedKey.startsWith(localContext[key])){
            return key;
        }
    }
    return expandedKey;
}


function __isJsonLDIndividual(jsonObject: any): boolean {
    return jsonObject != null && typeof jsonObject == 'object' && "@id" in jsonObject;
}

function __isJsonLDFullIndividual(jsonObject: JsonObject): boolean {
    return __isJsonLDIndividual(jsonObject) && Object.keys(jsonObject).length > 1;
}

function copyValues(jsonObjectSource: JsonObject, jsonObjectTarget: JsonObject) {
    for(let key in jsonObjectSource) {
        if(key != "@id") {
            jsonObjectTarget[key] = jsonObjectSource[key];
        }
    }
}

function copyValuesAndExpandCompact(jsonObjectSource: JsonObject, jsonObjectTarget: JsonObject,
                                    localContext: JsonObject, contextStack: JsonObject[]) {
    for(let key in jsonObjectSource) {
        if(key == "@type"){
            jsonObjectTarget[key] = [];
            for(let i = 0; i< jsonObjectSource[key].length;i++){
                jsonObjectTarget[key].push(__expandAndCompactToLocalContextKey(jsonObjectSource[key][i],contextStack,localContext));
            }
        }else if(key == "@id"){
            jsonObjectTarget[key] = __expandAndCompactToLocalContextKey(jsonObjectSource[key],contextStack,localContext);
        }else if(!__isJsonLDIndividual(jsonObjectSource[key])) {
            jsonObjectTarget[__expandAndCompactToLocalContextKey(key,contextStack,localContext)] = jsonObjectSource[key];
        }
    }
}

/*function jsonLDIdReferenceGraphToPointerGraph(jsonObject: JsonObject) {
    let knownObjects = {};
    __jsonLDIdReferenceGraphToPointerGraph(knownObjects, jsonObject);
    return knownObjects;
}

function __jsonLDIdReferenceGraphToPointerGraph(knownObjects: JsonObjectMap, jsonObject: JsonObject) {
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
        for(let key in jsonObject) {
            if(__isJsonLDIndividual(jsonObject[key])) {
                jsonObject[key] = __jsonLDIdReferenceGraphToPointerGraph(knownObjects, jsonObject[key]);
            } else if(jsonObject[key] instanceof Array) {
                let newValues = [];
                for(let i = 0; i < jsonObject[key].length; ++i) {
                    newValues.push(__jsonLDIdReferenceGraphToPointerGraph(knownObjects, jsonObject[key][i]));
                }
                jsonObject[key] = newValues;
            }
        }
    }
    return jsonObject;
}
*/

export function stringify(individual: JsonObject, 
                          validator?: (k:string, ctx: any) => boolean) {
    let knownObjects: JsonObjectMap = {};
    let rootContext = individual['@context'];
    return JSON.stringify(individual,
        function (key, jsonObject) {
            if (jsonObject instanceof Function) return undefined;
            // Do not try to process array indexes
            if (validator && isNaN(key as any) && key.indexOf(':') != -1 && 
                !validator(key, rootContext)) return undefined;
            if (__isJsonLDIndividual(jsonObject)) {
                if (knownObjects[jsonObject["@id"]] !== undefined) {
                    return { "@id": jsonObject["@id"] };
                } else {
                    knownObjects[jsonObject["@id"]] = jsonObject;
                    return jsonObject;
                }
            } else {
                if (key == '@localContext') {
                    return undefined;
                }
                return jsonObject;
            }
        }
    );
}

export function normalize(individual: JsonObject, 
                          context?: JsonObject | null, 
                          sort?: (o1: JsonObject, o2: JsonObject) => number) {
    let localContext: JsonObject;
    if (context === undefined) localContext = individual['@context'];
    else if (context == null) localContext = {};
    else localContext = context;
    return jsonLDIdReferenceGraphToNewPointerGraph(individual, localContext, sort);
}

}