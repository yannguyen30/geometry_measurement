/**
 * Created by mva on 16/10/2014.
 *
 * When using pigwidgeon pojo generation with jackson for json (de-)serialization,
 *  the pojo graph is serialized to a json tree, with some id-references.
 *  idReferenceGraphToPointerGraph(json) will traverse the tree, transforming these
 *  id-references into pointers, making the proper graph again.
 *  idReferenceGraphToPointerGraph(jsonObject, objectProperties) allows you to specify the
 *  set of object properties to consider, if objectProperties is null, it will transform all the strings
 *  corresponding to the id of a known object into the corresponding pointer.
 *
 *  pointerGraphToIdReferenceGraph(jsonObject) is the inverse function, taking a graph,
 *  and making a tree, replacing some of the pointers into id-references.
 */


function idReferenceGraphToPointerGraph(jsonObject, objectProperties) {
    var knownObjects = {};
    __idReferenceGraphToPointerGraph(objectProperties, knownObjects, jsonObject);
    return knownObjects;
}

function __idReferenceGraphToPointerGraph(objectProperties, knownObjects, jsonObject) {
    if(jsonObject != null && typeof jsonObject.id == "string") {
        knownObjects[jsonObject.id] = jsonObject;
        for(var key in jsonObject) {
            if(key != "id") {
                if(objectProperties == null || objectProperties.contains(key)) {
                    if(typeof jsonObject[key] == "string" && knownObjects[jsonObject[key]] != null) {
                        jsonObject[key] = knownObjects[jsonObject[key]];
                    } else if (jsonObject[key] instanceof Array) {
                        var newValues = new Array();
                        for(var i = 0; i < jsonObject[key].length; ++i) {
                            var value = jsonObject[key][i];
                            if(typeof value == "string" && knownObjects[value] != null) {
                                newValues.push(knownObjects[value]);
                            } else {
                                newValues.push(value);
                                __idReferenceGraphToPointerGraph(objectProperties, knownObjects, value);
                            }
                        }
                        jsonObject[key] = newValues;
                    } else if(jsonObject[key] != null && typeof jsonObject[key] == "object") {
                        __idReferenceGraphToPointerGraph(objectProperties, knownObjects, jsonObject[key]);
                    }
                }
            }
        }
    }
}

function pointerGraphToIdReferenceGraph(jsonObject) {
    var knownObjects = {};
    __pointerGraphToIdReferenceGraph(knownObjects, jsonObject);
    return knownObjects;
}

function __pointerGraphToIdReferenceGraph(knownObjects, jsonObject) {
    if(jsonObject != null && typeof jsonObject.id == "string") {
        knownObjects[jsonObject.id] = jsonObject;
        for (var key in jsonObject) {
            if (key != "id") {
                if (jsonObject[key] != null && typeof jsonObject[key] == "object" &&
                    typeof jsonObject[key].id == "string" &&
                    knownObjects[jsonObject[key].id] != null) {

                    jsonObject[key] = jsonObject[key].id;
                } else if (jsonObject[key] instanceof Array) {
                    var newValues = new Array();
                    for(var i = 0; i < jsonObject[key].length; ++i) {
                        var value = jsonObject[key][i];
                        if (typeof value == "object" &&
                            typeof value.id == "string" &&
                            knownObjects[value.id] != null) {
                            newValues.push(value.id);
                        } else {
                            newValues.push(value);
                            __pointerGraphToIdReferenceGraph(knownObjects, value);
                        }
                    }
                    jsonObject[key] = newValues;
                } else if (jsonObject[key] != null && typeof jsonObject[key] == "object") {
                    __pointerGraphToIdReferenceGraph(knownObjects, jsonObject[key]);
                }
            }
        }
    }
}

function pointerGraphToIdReferenceGraphCopy(jsonObject) {
    var knownObjects = {};
    return __pointerGraphToIdReferenceGraphCopy(knownObjects, jsonObject);
}

function __pointerGraphToIdReferenceGraphCopy(knownObjects, jsonObject) {
    if(jsonObject != null && typeof jsonObject.id == "string") {
        knownObjects[jsonObject.id] = jsonObject;
        var result = {id : jsonObject.id};
        for (var key in jsonObject) {
            if (key != "id") {
                if (jsonObject[key] != null && typeof jsonObject[key] == "object" &&
                    typeof jsonObject[key].id == "string" &&
                    knownObjects[jsonObject[key].id] != null) {
                    result[key] = jsonObject[key].id;
                } else if (jsonObject[key] instanceof Array) {
                    var newValues = new Array();
                    for(var i = 0; i < jsonObject[key].length; ++i) {
                        var value = jsonObject[key][i];
                        if (typeof value == "object" &&
                            typeof value.id == "string" &&
                            knownObjects[value.id] != null) {
                            newValues.push(value.id);
                        } else {
                            newValues.push(__pointerGraphToIdReferenceGraphCopy(knownObjects, value));
                        }
                    }
                    result[key] = newValues;
                } else if (jsonObject[key] != null && typeof jsonObject[key] == "object") {
                    result[key] = __pointerGraphToIdReferenceGraphCopy(knownObjects, jsonObject[key]);
                } else {
                    result[key] = jsonObject[key];
                }
            }
        }
        return result;
    }
    return jsonObject;
}