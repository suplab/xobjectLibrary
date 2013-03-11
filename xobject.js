/*************************************************
XObject Library - WIP
*************************************************/

function xObject(obj) {
    if (this === window) {
        return new xObject(obj);
    }

    var type = typeof obj;

    if (type === "string") {
        this.el = document.getElementById(obj);
    } else if (type === "object" && obj.nodeType !== "undefined" && obj.nodeType === 1) {
        this.el = obj;
    } else {
        throw new Error("Argument is of wrong type");
    }
}

/*** Event instance methods   ***/
xObject.prototype.addEvent = function(evt, fn) {
    xObject.addEvent(this.el, evt, fn);

    return this;
};

xObject.prototype.removeEvent = function(evt, fn) {
    xObject.removeEvent(this.el, evt, fn);

    return this;
};

xObject.prototype.click = function(fn) {
    var that = this;

    xObject.addEvent(this.el, "click", function(e) {
        fn.call(that, e);
    });

    return this;
};

xObject.prototype.mouseout = function(fn) {
    var that = this;

    xObject.addEvent(this.el, "mouseout", function(e) {
        fn.call(that, e);
    });

    return this;
};

xObject.prototype.mouseover = function(fn) {
    var that = this;

    xObject.addEvent(this.el, "mouseover", function(e) {
        fn.call(that, e);
    });

    return this;
};

/*** Event static methods ***/
if (typeof addEventListener !== "undefined") {
    xObject.addEvent = function(obj, evt, fn) {
        obj.addEventListener(evt, fn, false);
    };

    xObject.removeEvent = function(obj, evt, fn) {
        obj.removeEventListener(evt, fn, false);
    };
} else if (typeof attachEvent !== "undefined") {
    xObject.addEvent = function(obj, evt, fn) {
        var fnHash = "e_" + evt + fn;

        obj[fnHash] = function() {
            var type = event.type,
                relatedTarget = null;

            if (type === "mouseover" || type === "mouseout") {
                relatedTarget = (type === "mouseover") ? event.fromElement : event.toElement;
            }
            
            fn.call(obj, {
                target : event.srcElement,
                type : type,
                relatedTarget : relatedTarget,
                _event : event,
                preventDefault : function() {
                    this._event.returnValue = false;
                },
                stopPropagation : function() {
                    this._event.cancelBubble = true;
                }
            });
        };

        obj.attachEvent("on" + evt, obj[fnHash]);
    };

    xObject.removeEvent = function(obj, evt, fn) {
        var fnHash = "e_" + evt + fn;

        if (typeof obj[fnHash] !== "undefined") {
            obj.detachEvent("on" + evt, obj[fnHash]);
            delete obj[fnHash];
        }
    };
} else {
    xObject.addEvent = function(obj, evt, fn) {
        obj["on" + evt] = fn;
    };

    xObject.removeEvent = function(obj, evt, fn) {
        obj["on" + evt] = null;
    };
}

/*** Style static methods ***/
xObject.css = function(el, css, value) {
    var cssType = typeof css,
        valueType = typeof value,
        elStyle = el.style;

    if (cssType !== "undefined" && valueType === "undefined") {
        if (cssType === "object") {
            // set style info
            for (var prop in css) {
                if (css.hasOwnProperty(prop)) {
                    elStyle[toCamelCase(prop)] = css[prop];
                }
            }
        } else if (cssType === "string") {
            // get style info for specified property
            return getStyle(el, css);
        } else {
            throw { message: "Invalid parameter passed to css()" };
        }

    } else if (cssType === "string" && valueType === "string") {
        elStyle[toCamelCase(css)] = value;

    } else {
        throw { message: "Invalid parameters passed to css()" };
    }
};

xObject.hasClass = function(el, value) {   
	return (" " + el.className + " ").indexOf(" " + value + " ") > -1;
};

xObject.addClass = function(el, value) {
    var className = el.className;
    
    if (!className) {
		el.className = value;
	} else {
        var classNames = value.split(/\s+/),
            l = classNames.length;

        for ( var i = 0; i < l; i++ ) {		    
            if (!this.hasClass(el, classNames[i])) {
                className += " " + classNames[i];
            }
        }

        el.className = className.trim();
	}
};

xObject.removeClass = function(el, value) {
    if (value) {
        var classNames = value.split(/\s+/),
            className = " " + el.className + " ",
            l = classNames.length;

        for (var i = 0; i < l; i++) {
            className = className.replace(" " + classNames[i] + " ", " ");
        }

        el.className = className.trim();

    } else {
        el.className = "";
    }
};

xObject.toggleClass = function(el, value) {
    var classNames = value.split(/\s+/),
        i = 0,
        className;

    while (className = classNames[i++]) {
        this[this.hasClass(el, className) ? "removeClass" : "addClass"](el, className);
    }
};

/*** Style instance methods ***/
xObject.prototype.css = function(css, value) {
    return xObject.css(this.el, css, value) || this;
};

xObject.prototype.addClass = function(value) {
    xObject.addClass(this.el, value);

    return this;
};

xObject.prototype.removeClass = function(value) {
    xObject.removeClass(this.el, value);

    return this;
};

xObject.prototype.toggleClass = function(value) {
    xObject.toggleClass(this.el, value);
    
    return this;
};

xObject.prototype.hasClass = function(value) {
    return xObject.hasClass(this.el, value);
};

/*** DOM Object Stuff ***/
xObject.createElement = function(obj) {
    if (!obj || !obj.tagName) {
        throw { message : "Invalid argument" };
    }

    var el = document.createElement(obj.tagName);
    obj.id && (el.id = obj.id);
    obj.className && (el.className = obj.className);
    obj.html && (el.innerHTML = obj.html);
    
    if (typeof obj.attributes !== "undefined") {
        var attr = obj.attributes,
            prop;

        for (prop in attr) {
            if (attr.hasOwnProperty(prop)) {
                el.setAttribute(prop, attr[prop]);
            }
        }
    }

    if (typeof obj.children !== "undefined") {
        var child,
            i = 0;

        while (child = obj.children[i++]) {
            el.appendChild(this.createElement(child));
        }
    }

    return el;
};

xObject.prototype.append = function(data) {
    if (typeof data.nodeType !== "undefined" && data.nodeType === 1) {
        this.el.appendChild(data);
    } else if (data instanceof xObject) {
        this.el.appendChild(data.el);
    } else if (typeof data === "string") {
        var html = this.el.innerHTML;
        
        this.el.innerHTML = html + data;
    }

    return this;
};

xObject.prototype.html = function(html) {
    if (typeof html !== "undefined") {
        this.el.innerHTML = html;
        
        return this;
    } else {
        return this.el.innerHTML;
    }
};

/*** Helper Functions ***/
function toCamelCase(str) {
    return str.replace(/-([a-z])/ig, function( all, letter ) {
		return letter.toUpperCase();
	});
}

var getStyle = (function() {
    if (typeof getComputedStyle !== "undefined") {
        return function(el, cssProp) {
            return window.getComputedStyle(el, null).getPropertyValue(cssProp);
        };
    } else {
        return function(el, cssProp) {
            return el.currentStyle[toCamelCase(cssProp)];
        };
    }
}());


/*** Language Extensions ***/
if (typeof String.prototype.trim === "undefined") {
    String.prototype.trim = function() {
        return this.replace( /^\s+/, "" ).replace( /\s+$/, "" );
    };
}

