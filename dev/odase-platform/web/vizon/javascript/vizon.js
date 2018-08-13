
/******************************************************************************
 * initial svg element reposition, text fitting, overlap avoidance
******************************************************************************/

function growRectanglesToFitLargestText(element)
{
    var largest = getLargestText(element);
    largest += 15;
    growElementsWithWidth(largest, element);
}

function growElementsWithWidth(width, element)
{
    if(element && element.hasAttribute && element.hasAttribute("width") && parseFloat(element.getAttribute("width")) < width)
    {
        element.setAttribute("width", width);
    }
    for(var i = 0; i < element.childNodes.length; ++i)
    {
        growElementsWithWidth(width, element.childNodes.item(i));
    }
}

function getLargestText(element)
{
    var largest = 0.0;
    if(element && element.childNodes)
    {
        for(var i = 0; i < element.childNodes.length; ++i)
        {
            if(element.childNodes.item(i))
            {
                var offset = 0;
                if(element.childNodes.item(i).getAttribute && element.childNodes.item(i).getAttribute("x") != null && element.childNodes.item(i).getAttribute("x") != "")
                {
                    offset = parseInt(element.childNodes.item(i).getAttribute("x"));
                }
                var lengthElem = element.childNodes.item(i).getComputedTextLength && element.childNodes.item(i).getComputedTextLength() + offset;
                if(lengthElem > largest)
                {
                    largest = lengthElem;
                }
            }
            var subLargest = getLargestText(element.childNodes.item(i));
            if(subLargest > largest)
                largest = subLargest;
        }
    }
    return largest;
}

function getLargestSize(element)
{
    var largest = {width:0, height:0};
    for(var i = 0; i < element.childNodes.length; ++i)
    {
        var childLargest = getLargestSize(element.childNodes.item(i));
        if(childLargest.width > largest.width) largest.width = childLargest.width;
        if(childLargest.height > largest.height) largest.height = childLargest.height;
    }
    // XXX not generic at all!!!!
    if(element.hasAttribute)
    {
        if(element.hasAttribute("width") && parseInt(element.getAttribute("width")) > largest.width) 
            largest.width = parseInt(element.getAttribute("width"));
        if(element.hasAttribute("height") && parseInt(element.getAttribute("height")) > largest.height) 
            largest.height = parseInt(element.getAttribute("height"));
    }
    return largest;
}

function avoidGChildrenOverlapDown(element, height)
{
    var accumulatedHeight = 0;
    for(var i = 0; i < element.childNodes.length; ++i)
    {
        if(element.childNodes.item(i) && element.childNodes.item(i).transform)
        {
            var trans = element.ownerSVGElement.createSVGTransform();
            trans.setTranslate(0, accumulatedHeight);
            element.childNodes.item(i).transform.baseVal.appendItem(trans);
            accumulatedHeight += height;
        }
    }
    element.setAttribute("height", accumulatedHeight);
}

function shuffleAll()
{
    var width = 1024;
    var height = 768;
    if(window && window.innerWidth) width = window.innerWidth;
    if(window && window.innerHeight) height = window.innerHeight;
    if(typeof rearrangeAllId == "undefined" || rearrangeAllId == null)
    {
        for(var node in nodes)
        {
            nodes[node].move(Math.random()*width, Math.random()*height);
        }
        rearrangeAllId = setTimeout("rearrangeAllOnce(true);", 500);
    }
    else
    {
        clearTimeout(rearrangeAllId);
        rearrangeAllId = null;
        initialUpdate();
    }
    initialUpdate();
}

function pickRandomProperty(obj) {
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1/++count)
           result = prop;
    return result;
}
function shuffleOneNode()
{
    var node = pickRandomProperty(nodes);
    var bestx = nodes[node].getX();
    var besty = nodes[node].getY();
    nodes[node].move(bestx + (Math.random()-0.5)*200, besty + (Math.random()-0.5)*200);
}



function rearrangeAllOnce(random)
{
    if(random) shuffleOneNode();
    for(var node in nodes)
    {
        nodes[node].automaticReplace(2);
    } 
    rearrangeAllId = setTimeout("rearrangeAllOnce(" + random + ");", 500);
}

function rearrangeAllOn()
{
    realignAll();
    if(typeof rearrangeAllId == "undefined" || rearrangeAllId == null)
        rearrangeAllId = setTimeout("rearrangeAllOnce(false);", 500);
    else
    {
        clearTimeout(rearrangeAllId);
        rearrangeAllId = null;
        initialUpdate();
    }
}

function realignAll()
{
    var minX = 99999;
    var minY = 99999;
    for(var node in nodes)
    {
        minX = Math.min(nodes[node].getX(), minX);
        minY = Math.min(nodes[node].getY(), minY);
    }
    for(var node in nodes)
    {
        nodes[node].move(nodes[node].getX() - minX + 10, nodes[node].getY() - minY + 10);
    }
}

/******************************************************************************
 * drag and drop
******************************************************************************/

function addDragNDrop(node, moveHandler)
{
    var _drag = function(_moveHandler){return function(_evt){drag(_moveHandler, _evt);};};
    node.element.addEventListener("mousedown", _drag(moveHandler), true);
    node.element.setAttribute("drag", "true");

    node.element.addEventListener("dblclick", automaticReplace, true);
}

function drag(moveHandler, evt)
{
    if(evt.preventDefault)
    {
        evt.preventDefault();
    }
    var elemToDrag = evt.target;
    while(elemToDrag.getAttribute("drag") != "true") elemToDrag = elemToDrag.parentNode;
    var _drop = function(_element){return function(_evt){drop(_element, _evt);};};
    var node = nodes[elemToDrag.getAttribute("id")];
    node._drag_deltax = evt.clientX - node.getX();
    node._drag_deltay = evt.clientY - node.getY();
    node._drop = _drop(elemToDrag);
    document.addEventListener("mouseup", node._drop, true);
    document.addEventListener("mousedown", node._drop, true);
    var _dragging = function(_element, _moveHandler){return function(_evt){dragging(_element, _moveHandler, _evt);};};
    node._dragging = _dragging(elemToDrag, moveHandler);
    document.addEventListener("mousemove", node._dragging, true);
    elemToDrag.setAttribute("dragging", "true");
}
function drop(element, evt)
{
    var node = nodes[element.getAttribute("id")];
    document.removeEventListener("mousedown", node._drop, true);
    document.removeEventListener("mouseup", node._drop, true);
    document.removeEventListener("mousemove", node._dragging, true);
    nodes[element.getAttribute("id")].update();
    element.removeAttribute("dragging");
}

function dragging(element, moveHandler, evt)
{
    var id = element.ownerSVGElement.suspendRedraw(1000);
    var node = nodes[element.getAttribute("id")];
    node.move((evt.clientX - node._drag_deltax), (evt.clientY - node._drag_deltay));
    if(moveHandler)
        moveHandler.call(this, evt);
    nodes[element.getAttribute("id")].update();
    element.ownerSVGElement.unsuspendRedraw(id);
}

function automaticReplace(evt)
{
    if(evt.preventDefault)
    {
        evt.preventDefault();
    }
    var elemToDrag = evt.target;
    while(elemToDrag.getAttribute("drag") != "true") elemToDrag = elemToDrag.parentNode;
    nodes[elemToDrag.getAttribute("id")].automaticReplace(100);
}

/******************************************************************************
 * constructors and updates
******************************************************************************/

var nodes = {};

function nodeOnload(element, childrenSize)
{
    if(nodes[element.getAttribute("id")] == null)
    {
        var node = new Node(element);
        nodes[element.getAttribute("id")] = node;
        addDragNDrop(node);
        growRectanglesToFitLargestText(element);
        avoidGChildrenOverlapDown(element, childrenSize); 
    }
}

function initGraph(directArcs)
{
    triggerOnloads(document.rootElement);
    var fromArcs = {};
    var toArcs = {};
    addArcs(document.rootElement, fromArcs, toArcs);
    
    for(var nodeName in fromArcs)
    {
        for(var i = 0; i < fromArcs[nodeName].length; ++i)
        {
            var from = nodes[nodeName];
            var to = nodes[fromArcs[nodeName][i].getAttribute("to")];
            if(from != null && to != null)
            {
                var arc;
                if(directArcs)
                    arc = new SimpleArc(fromArcs[nodeName][i], from, to);
                else
                    arc = new Arc(fromArcs[nodeName][i], from, to);
                nodes[nodeName].outgoingArcs.push(new OutgoingArc(arc));
                nodes[fromArcs[nodeName][i].getAttribute("to")].incomingArcs.push(new IncomingArc(arc));
            }
            else
            {
                alert("Arc with unknown node " + nodeName + " and/or " + fromArcs[nodeName][i].getAttribute("to"));
            }
        }
    }
}


// hack for onload bug on firefox not triggered for some elements.
function triggerOnloads(element)
{
    if(document.rootElement != element && element.hasAttribute && element.hasAttribute("onload"))
    {
        eval("function tmp(evt){" + element.getAttribute("onload") + "}");
        var _evt = {target:element};
        tmp(_evt);
    }
    for(var i = 0; i < element.childNodes.length; ++i)
    {
        triggerOnloads(element.childNodes.item(i));
    }
}


function addArcs(element, fromArcs, toArcs)
{
    if(element.hasAttribute && element.hasAttribute("from") && element.hasAttribute("to"))
    {
        if(fromArcs[element.getAttribute("from")] == null)
            fromArcs[element.getAttribute("from")] = [];
        fromArcs[element.getAttribute("from")].push(element);
        if(toArcs[element.getAttribute("to")] == null)
            toArcs[element.getAttribute("to")] = [];
        toArcs[element.getAttribute("to")].push(element);
    }
    for(var i = 0; i < element.childNodes.length; ++i)
    {
        addArcs(element.childNodes.item(i), fromArcs, toArcs);
    }
}


function initialUpdate()
{
    for(var node in nodes)
    {
        nodes[node].move(nodes[node].getX(), nodes[node].getY());
    }    
    update();
}

function update()
{
    for(var node in nodes)
    {
        nodes[node].update();
    }
}

/******************************************************************************
 * utils
******************************************************************************/

function relativeDirection(c1, c2, breakAngle)
{
    var angle = Math.atan2(c2.y-c1.y, c2.x-c1.x)/Math.PI*180.0;
    if(angle >= -breakAngle && angle < breakAngle) return "right";
    if(angle >= breakAngle && angle < 180-breakAngle) return "bottom";
    if(angle >= breakAngle-180 && angle < -breakAngle) return "top";
    return "left";
}

/******************************************************************************
 * Nodes
******************************************************************************/

function nodesRelativeDirection(node1, node2, breakAngle)
{
    return relativeDirection({x:node1.getCenterX(),y:node1.getCenterY()}, {x:node2.getCenterX(),y:node2.getCenterY()}, breakAngle);
}

function Node(_element)
{
    this.element = _element;
    this.uuid = this.element.getAttribute("id");
    this.left = [];
    this.right = [];
    this.top = [];
    this.bottom = [];
    this.incomingArcs = [];
    this.outgoingArcs = [];
}

Node.prototype =
{
    getCenterX:function()
    {
        return this.getX() + this.getWidth()/2;
    },
    getCenterY:function()
    {
        return this.getY() + this.getHeight()/2;
    },
    getX:function()
    {
        if(this.x)
            return this.x;
        if(this.element._x)
            return this.element._x;
        if(this.element.hasAttribute("x"))
            return parseInt(this.element.getAttribute("x"));
        return 0;
    },
    getY:function()
    {
        if(this.y)
            return this.y;
        if(this.element._y)
            return this.element._y;
        if(this.element.hasAttribute("y"))
            return parseInt(this.element.getAttribute("y"));
        return 0;
    },

    getWidth:function()
    {
        if(this._width == null)
            this._width = getLargestSize(this.element).width;
        return this._width;
    },
    getHeight:function()
    {
        if(this._height == null)
            this._height = getLargestSize(this.element).height;
        return this._height;
    },
    getDiagonalAngle:function()
    {
        if(this._diagonalAngle == null)
        {
            this._diagonalAngle = Math.atan2(this.getHeight()/2, this.getWidth()/2)/Math.PI*180.0;
        }
        return this._diagonalAngle;
    },
    getAllArcs : function()
    {
        return this.incomingArcs.concat(this.outgoingArcs);
    },
    // sorting from left to right and top to bottom.
    splitAndSortArcsPerDirection: function()
    {
        this.left = [];
        this.right = [];
        this.top = [];
        this.bottom = [];
        var arcs = this.getAllArcs();
        for(var i = 0; i < arcs.length; ++i)
        {
            this[nodesRelativeDirection(this, arcs[i].getOtherNode(), arcs[i].arc.getBreakAngle())].push(arcs[i]);
        }
        this.left.sort(sortByY);
        this.right.sort(sortByY);
        this.top.sort(sortByX);
        this.bottom.sort(sortByX);
        this.left = this.mergeArcOnSide(this.left);
        this.right = this.mergeArcOnSide(this.right);
        this.top = this.mergeArcOnSide(this.top);
        this.bottom = this.mergeArcOnSide(this.bottom);
    },
    mergeArcOnSide:function(side)
    {
        var mergedSide = [];
        for(var i = 0; i < side.length; )
        {
            var j = i + 1;
            var merged = [side[i]];
            while(j < side.length && 
                    side[i].getLocalMergeId() != null && 
                    side[i].getLocalMergeId() != "" &&
                    side[i].getLocalMergeId() == side[j].getLocalMergeId())
            {
                merged.push(side[j]);
                j++;
            }
            i = j;
            mergedSide.push(merged);
        }
        return mergedSide;
    },
    update : function()
    {
        var arcs = this.getAllArcs();
        for(var i = 0; i < arcs.length; ++i)
        {
            arcs[i].getOtherNode().splitAndSortArcsPerDirection();
        }
        this.splitAndSortArcsPerDirection();
        this.localUpdate();
        for(var i = 0; i < arcs.length; ++i)
        {
            arcs[i].getOtherNode().localUpdate();
        }
    },
    localUpdate : function()
    {
        var arcs = this.getAllArcs();
        for(var i = 0; i < arcs.length; ++i)
        {
            arcs[i].update();
        }
    },
    // returns where this arc should connect with this node.
    getConnectingPoint : function(arc, isOutgoing)
    {
        // XXX use arc to figure out the order, and from there, the placement along the
        // use the size of the object to make the point at the beginning of the box.
      // XXX this is ridiculous, use trigo!!!!
        var directionPosition = this.arcDirectionPosition(arc);
        
        if(arc.isSelfArc() && isOutgoing) directionPosition.position++;
        var point = {x:this.getX(), y:this.getY()};
        if(directionPosition)
        {
            switch(directionPosition.direction)
            {
                case "left":
                    point.y += (this.getHeight()/(this.left.length+1))*(directionPosition.position+1);
                    break;
                case "right":
                    point.y += (this.getHeight()/(this.right.length+1))*(directionPosition.position+1);
                    point.x += this.getWidth();
                    break;
                case "top":
                    point.x += (this.getWidth()/(this.top.length+1))*(directionPosition.position+1);
                    break;
                case "bottom":
                    point.x += (this.getWidth()/(this.bottom.length+1))*(directionPosition.position+1);
                    point.y += this.getHeight();
                    break;
            }
        }
        return point;
    },
    arcDirectionPosition:function(arc)
    {
        for(var i = 0; i < this.left.length; ++i)
            for(var j = 0; j < this.left[i].length; ++j)
                if(this.left[i][j].arc == arc) return {direction:"left", position:i, length:this.left.length};
        for(var i = 0; i < this.right.length; ++i)
            for(var j = 0; j < this.right[i].length; ++j)
                if(this.right[i][j].arc == arc) return {direction:"right", position:i, length:this.right.length};
        for(var i = 0; i < this.top.length; ++i)
            for(var j = 0; j < this.top[i].length; ++j)
                if(this.top[i][j].arc == arc) return {direction:"top", position:i, length:this.top.length};
        for(var i = 0; i < this.bottom.length; ++i)
            for(var j = 0; j < this.bottom[i].length; ++j)
                if(this.bottom[i][j].arc == arc) return {direction:"bottom", position:i, length:this.bottom.length};
        return null;
    },
    move:function(_x, _y)
    {
        if(!isFinite(_x) || isNaN(_x)) _x = 0;
        if(!isFinite(_y) || isNaN(_y)) _y = 0;
        // snapping to 5.
        this.x = Math.round(_x /5 ) * 5;
        this.y = Math.round(_y/5 ) * 5;
        this.x = Math.max(0, this.x);
        this.y = Math.max(0, this.y);
        this.element.setAttribute("transform", "translate(" + this.x + "," + this.y + ")");
    },

    // lower is better in absolute value.
    getArcDistanceForces:function()
    {
        var springMin = 50;
        var forces = [];
        var arcs = this.getAllArcs();
        for(var i = 0; i < arcs.length; ++i)
        {
            var ocp = arcs[i].getOtherNode().getConnectingPoint(arcs[i].arc);
            var tcp = this.getConnectingPoint(arcs[i].arc);
            var distance = Math.sqrt((ocp.x-tcp.x)*(ocp.x-tcp.x) + (ocp.y-tcp.y)*(ocp.y-tcp.y));
            forces.push({x:(distance - Math.max(springMin, getLargestText(arcs[i].arc.getLabel()))) * (ocp.x - tcp.x),
                          y:(distance - Math.max(springMin, getLargestText(arcs[i].arc.getLabel()))) * (ocp.y - tcp.y)});
        }
        return forces;
    },
    // lower is better in absolute value.
    getNodeOverlapForces:function()
    {
        var repulsion = 150000;
        var forces = [];
        for(var node in nodes)
        {
            if(nodes[node] != this)
            {
                var deltaCenterX = (nodes[node].getCenterX() - this.getCenterX());
                var deltaCenterY = (nodes[node].getCenterY() - this.getCenterY());
                var angle = Math.atan2(deltaCenterY, deltaCenterX);
                var combinedWidth = ((this.getWidth()/2) + (nodes[node].getWidth()/2)) * 1.1;
                var combinedHeight = ((this.getHeight()/2) + (nodes[node].getHeight()/2)) * 1.1;
                var centerd2 =  Math.pow(deltaCenterX, 2) + Math.pow(deltaCenterY, 2);
                var d2;
                if( Math.abs(deltaCenterX) < combinedWidth)
                {
                    if( Math.abs(deltaCenterY) < combinedHeight)
                    {
                        d2 = 0.5;
                    }
                    else
                    {
                        d2 = Math.pow(deltaCenterY - combinedHeight, 2);
                    }
                }
                else
                {
                    if(Math.abs(deltaCenterY) < combinedHeight)
                    {
                        d2 = Math.pow(deltaCenterX - combinedWidth, 2);
                    }
                    else
                    {
                        d2 = Math.pow(deltaCenterX - combinedWidth, 2) + Math.pow(deltaCenterY - combinedHeight, 2);
                    }
                }

                // add jitter to angle dependent proportional to the distance, closer, more random
                angle += Math.random()*Math.PI*(1/(Math.sqrt(centerd2)/50));
                forces.push({x:(repulsion/d2) * Math.cos(angle),
                             y:(repulsion/d2) * Math.sin(angle)});
            }
        }
        return forces;
    },
    getSpringForce:function()
    {
        var stepSize = 0.0001;
        var force = {x:0,y:0};
        
        var arcForces = this.getArcDistanceForces();
        for(var i = 0; i < arcForces.length; ++i)
        {
            force.x += arcForces[i].x;
            force.y += arcForces[i].y;
        }

        var overlapForces = this.getNodeOverlapForces();
        for(var i = 0; i < overlapForces.length; ++i)
        {
            force.x -= overlapForces[i].x;
            force.y -= overlapForces[i].y;
        }

        force.x *= stepSize;
        force.y *= stepSize;
        return force;
    },
    automaticReplace:function(maxIterations)
    {
        var startTime = (new Date()).getTime();
        var iteration = 0;
        var timeSpent = 0;
        var converged = false;
        while(timeSpent < 1000 && iteration < maxIterations && !converged)
        {
            timeSpent = (new Date()).getTime() - startTime;
            var force = this.getSpringForce();
            this.move(this.getX() + force.x, this.getY() + force.y);
            if(force.x + force.y < 1) converged = true;
            iteration++;
        }
        this.update();
    }
};

function sortByX(a,b)
{
    if(a.getOtherNode().getX() < b.getOtherNode().getX())
        return -1;
    if(a.getOtherNode().getX() > b.getOtherNode().getX())
        return 1;
    if(a.arc.uuid < b.arc.uuid)
        return -1;
    if(a.arc.uuid > b.arc.uuid)
        return 1;
    return 0;
}
function sortByY(a,b)
{
    if(a.getOtherNode().getY() < b.getOtherNode().getY())
        return -1;
    if(a.getOtherNode().getY() > b.getOtherNode().getY())
        return 1;
    if(a.arc.uuid < b.arc.uuid)
        return -1;
    if(a.arc.uuid > b.arc.uuid)
        return 1;
    return 0;
}

/******************************************************************************
 * Arcs
******************************************************************************/

function IncomingArc(_arc)
{
    this.arc = _arc;
}
IncomingArc.prototype =
{
    getLocalNode : function(){return this.arc.end},
    getOtherNode : function(){return this.arc.start},
    update : function(){this.arc.update_end();},
    getLocalMergeId : function(){return this.arc.mergeTo;}
};

function OutgoingArc(_arc)
{
    this.arc = _arc;
}
OutgoingArc.prototype =
{
    getLocalNode : function(){return this.arc.start},
    getOtherNode : function(){return this.arc.end},
    update : function(){this.arc.update_start();},
    getLocalMergeId : function(){return this.arc.mergeFrom;}
};


function Arc(_element, node1, node2)
{
    this.element = _element;
    this.start = node1;
    this.end =   node2;
    this.uuid = this.start.uuid + "_" + this.end.uuid + this.element.textContent;
    this.pathData = [{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}];
    this.direction = "right";
    this.labelThresholdMiddleSection = 25;
    this.mergeFrom = this.element.getAttribute("merge_from");
    this.mergeTo = this.element.getAttribute("merge_to");
    this.offsetSize = 20;
}

Arc.prototype =
{
    // XXX why two method? could be only replacing one end? or not?
    // public
    update_start:function()
    {
        this.direction = nodesRelativeDirection(this.start, this.end, this.getBreakAngle());
        var startPoint = this.start.getConnectingPoint(this, true);
        var endPoint = this.end.getConnectingPoint(this, false);
        var offset = this.getOffset();
        this.getPath().setAttribute("d", this.twoSectionPath(offset, startPoint, endPoint));
        this.placeLabel(offset, startPoint, endPoint);
    },
    // public
    update_end:function()
    {
        this.direction = nodesRelativeDirection(this.start, this.end, this.getBreakAngle());
        var startPoint = this.start.getConnectingPoint(this, true);
        var endPoint = this.end.getConnectingPoint(this, false);
        var offset = this.getOffset();
        this.getPath().setAttribute("d", this.twoSectionPath(offset, startPoint, endPoint));
        this.placeLabel(offset, startPoint, endPoint);
    },
    // public
    getBreakAngle:function()
    {
        var directLength = Math.sqrt(Math.pow(this.end.getCenterX() - this.start.getCenterX(), 2) + Math.pow(this.end.getCenterY() - this.start.getCenterY(), 2));
        var shapeInfluence = 1/(1+Math.pow(Math.E, -(directLength/70)+4)); // 1/(1+e^(-x/70+4)), to be close to 0 when close to zero, and close to 1 when far enough (over 300)
        return ((this.start.getDiagonalAngle() + this.end.getDiagonalAngle())/2)*(1-shapeInfluence) + shapeInfluence*45;
    },
    // private
    getOffset : function()
    {
        // XXX do this consistently in Incoming/OutgoingArc ?
        // independant of the arc direction (from/to), but consistent 
        var consistentStart; 
        var consistentEnd; 
        var offset = {x:0, y:0};
        if(this.start.uuid < this.end.uuid)
        {
            consistentStart = this.start;
            consistentEnd = this.end;
        }
        else
        {
            consistentStart = this.end;
            consistentEnd = this.start;
        }
        var directionPosition = consistentStart.arcDirectionPosition(this);
        if(directionPosition)
        {
            var position = directionPosition.position;
            var length = directionPosition.length;
            var centeredPosition = position - Math.floor(length/2);
            if(this.isSelfArc())
            {
                centeredPosition = -position - 2;
            }
            var breakAngle = this.getBreakAngle();
            var angle = Math.atan2(consistentEnd.getY()-consistentStart.getY(), consistentEnd.getX()-consistentStart.getX())/Math.PI*180.0;
            if((angle >= 0 && angle < breakAngle)  || (angle >= -180 && angle < breakAngle-180)) offset.x -= this.offsetSize * centeredPosition;
            if((angle >= breakAngle && angle < 90) || (angle >= breakAngle-180 && angle < -90))  offset.y -= this.offsetSize * centeredPosition;
            if((angle >= 90 && angle < 180-breakAngle)  || (angle >= -90 && angle < -breakAngle)) offset.y += this.offsetSize * centeredPosition;
            if((angle >= 180-breakAngle && angle < 180)  || (angle >= -breakAngle && angle < 0))  offset.x += this.offsetSize * centeredPosition;
        }
        return offset;
    },
    // public
    isSelfArc : function(){return this.start == this.end;},

    // private
    twoSectionPath: function (offset, c1, c2)
    {
      // XXX add minimum shoot out.
        this.pathData[0].x = c1.x ;
        this.pathData[0].y = c1.y ;
        this.pathData[3].x = c2.x ;
        this.pathData[3].y = c2.y ;
        switch(this.direction)
        {
            case "right":
            case "left": 
                  this.pathData[1].x = (c1.x + c2.x)/2 + offset.x;
                  this.pathData[1].y = c1.y ;
                  this.pathData[2].x = (c1.x + c2.x)/2 + offset.x;
                  this.pathData[2].y = c2.y ;
                  break;
            case "top":
            case "bottom":
                  this.pathData[1].x = c1.x ;
                  this.pathData[1].y = (c1.y + c2.y)/2 + offset.y;
                  this.pathData[2].x = c2.x ;
                  this.pathData[2].y = (c1.y + c2.y)/2 + offset.y;
                  break;
        }
        return "M " + this.pathData[0].x + " " + this.pathData[0].y + " L "
                    + this.pathData[1].x + " " + this.pathData[1].y + " L "
                    + this.pathData[2].x + " " + this.pathData[2].y + " L "
                    + this.pathData[3].x + " " + this.pathData[3].y;
/*	
	var middle = {x:((this.pathData[1].x + this.pathData[2].x)/2),y:((this.pathData[1].y + this.pathData[2].y)/2)};
          return "M " + this.pathData[0].x + " " + this.pathData[0].y + 
		" S " + this.pathData[1].x + " " + this.pathData[1].y + " " + middle.x + " " + middle.y +
	        " S " + this.pathData[2].x + " " + this.pathData[2].y + " " + this.pathData[3].x + " " + this.pathData[3].y;
*/
    },

    // private
    placeLabel:function(offset, startPoint, endPoint)
    {
        var textElement = this.getLabel();
        if(textElement)
        {
            if(this._textLength == null)
                this._textLength = getLargestText(textElement);
            var center = {x:(this.pathData[1].x+this.pathData[2].x)/2, y:(this.pathData[1].y+this.pathData[2].y)/2};
            var rotate = 0;
            var followMainDirection = (Math.abs(this.pathData[1].x-this.pathData[2].x+this.pathData[1].y-this.pathData[2].y) < this.labelThresholdMiddleSection);
            switch(this.direction)
            {
                case "right":
                case "left":
                    if(!followMainDirection)
                    {
                        rotate += 90;
                        center.y -= this._textLength/2;
                    }
                    else
                    {
                        center.x -= this._textLength/2;
                    }
                    break;
                case "top":
                case "bottom":
                    if(!followMainDirection)
                    {
                        center.x -= this._textLength/2;
                    }
                    else
                    {
                        center.y -= this._textLength/2;
                        rotate += 90;
                    }
                    break;
            }
            textElement.setAttribute("transform", "translate(" + center.x + ", " + center.y + "), rotate(" + rotate + ")");
        }
    },

    // private
    getPath : function()
    {
        if(this._path == null)
        {
            for(var i = 0; i < this.element.childNodes.length; ++i)
            {
                if(this.element.childNodes.item(i).nodeName == "path")
                    this._path = this.element.childNodes.item(i);
            }
        }
        return this._path;
    },
    // public
    getLabel:function()
    {
        if(this._label == null)
        {
            for(var i = 0; i < this.element.childNodes.length; ++i)
            {
                if(this.element.childNodes.item(i).getAttribute("type") == "label")
                    this._label = this.element.childNodes.item(i);
            }
        }
        return this._label;
    }
};

function SimpleArc(_element, node1, node2)
{
    this.element = _element;
    this.start = node1;
    this.end =   node2;
    this.uuid = this.start.uuid + "_" + this.end.uuid + this.element.textContent;
    this.pathData = [{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}];
    this.direction = "right";
    this.labelThresholdMiddleSection = 25;
    this.mergeFrom = this.element.getAttribute("merge_from");
    this.mergeTo = this.element.getAttribute("merge_to");
    this.offsetSize = 20;
}

SimpleArc.prototype.update_start = Arc.prototype.update_start;
SimpleArc.prototype.update_end = Arc.prototype.update_end;
SimpleArc.prototype.getBreakAngle = Arc.prototype.getBreakAngle;
SimpleArc.prototype.getOffset = Arc.prototype.getOffset;
SimpleArc.prototype.isSelfArc = Arc.prototype.isSelfArc;
SimpleArc.prototype.getPath = Arc.prototype.getPath;
SimpleArc.prototype.getLabel = Arc.prototype.getLabel;
SimpleArc.prototype.twoSectionPath = function (offset, c1, c2)
    {
        this.pathData[0].x = c1.x ;
        this.pathData[0].y = c1.y ;
        this.pathData[3].x = c2.x ;
        this.pathData[3].y = c2.y ;
        return "M " + this.pathData[0].x + " " + this.pathData[0].y + " L "
                    + this.pathData[3].x + " " + this.pathData[3].y;
    };

SimpleArc.prototype.placeLabel = function(offset, startPoint, endPoint)
    {
        var textElement = this.getLabel();
        if(textElement)
        {
            if(this._textLength == null)
                this._textLength = getLargestText(textElement);
            var center = {x:(this.pathData[0].x+this.pathData[3].x)/2, y:(this.pathData[0].y+this.pathData[3].y)/2};
            var rotate = Math.atan2(this.pathData[3].y - this.pathData[0].y, this.pathData[3].x - this.pathData[0].x)/Math.PI*180.0;
            if(rotate < -90 && rotate > -180)
            {
                rotate = rotate - 180
            }
            else if(rotate > 90 && rotate < 180)
            {
                rotate = rotate -180
            }
            var centerX = center.x - (this._textLength/2);
            textElement.setAttribute("transform", "translate(" + centerX + ", " + center.y + "), " +
                    "rotate(" + rotate + ", " + this._textLength/2 + ", " + 0 + ")");
            //textElement.setAttribute("transform", "translate(" + center.x + ", " + center.y + ")");
        }
    };

/******************************************************************************
 * position turtle save
******************************************************************************/

// if it is a gecko browser
if(typeof navigator != "undefined" && navigator.userAgent.indexOf("ecko") != -1)
{
    function pick_file_and_save(content, defaultName)
    {    
        try {
            netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
            var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance( Components.interfaces.nsIFilePicker );
            fp.init(window, "save positions as ttl", Components.interfaces.nsIFilePicker.modeSave );
            if(defaultName)
                fp.defaultString = defaultName;
            if ( fp.show() != fp.returnCancel )
            {
                if ( fp.file != null )
                {
                    try 
                    {
                        if ( !fp.file.exists() )
                            FileIO.create( fp.file );
                        FileIO.write( fp.file, content, null, "UTF-8");
                    }        
                    catch(e)
                    {          
                        alert( "The content could not be saved , error message " + e.message);
                    }
                }
            }
            netscape.security.PrivilegeManager.revertPrivilege("UniversalXPConnect");
        }
        catch(e)
        {
            uriContent = "data:application/octet-stream," + encodeURIComponent(content);
            window.open(uriContent, 'Save the positions as ntriple');
        }
    }
}


function getAllNodesPositions()
{
    var positions = {};
    for(var node in nodes)
    {
        positions[node] = {config_id: nodes[node].element.getAttribute("config_id"),x:nodes[node].getX(), y:nodes[node].getY()};
    }
    return positions;
}

function getAllNodesPositionsAsNTriples(viewUri, viewConfigUri, configForNodeUri, abscissaUri, ordinateUri)
{
    var positions = getAllNodesPositions();
    var nt = "";
    var i = 0;
    for(var node in positions)
    {
        var config_id = "<" + positions[node].config_id + ">";
        //nt += "<" + viewUri + "> <" + viewConfigUri + "> " + config_id + ".\n";
        //nt += config_id + " <" + configForNodeUri + "> <" + node + ">.\n";
        nt += config_id + " <" + abscissaUri + "> \"" + positions[node].x + "\"^^<http://www.w3.org/2001/XMLSchema#int>.\n";
        nt += config_id + " <" + ordinateUri + "> \"" + positions[node].y + "\"^^<http://www.w3.org/2001/XMLSchema#int>.\n";        
        i++;
    }
    return nt;
}

function saveTurtlePosition(viewUri, defaultTTL, viewConfigUri, configForNodeUri, abscissaUri, ordinateUri)
{
    var content = getAllNodesPositionsAsNTriples(viewUri, viewConfigUri, configForNodeUri, abscissaUri, ordinateUri);
	pick_file_and_save(content, defaultTTL);
}



function hideIfBatik(element)
{
     if(typeof navigator == "undefined")
     {
         element.setAttribute("transform", "translate(-1000,-1000)");
     }
}

