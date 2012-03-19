/**
 * Decorate an array to support recent JavaScript APIs
 * 
 * @param {Array} pArray To Enhance
 * @return the array
 */
function EnhancedArray(array)
{
        function forEach(fun /*, thisp*/)
        {
                var len = this.length >>> 0;
                if (typeof fun != "function")
                  throw new TypeError();
                
                var thisp = arguments[1];
                for (var i = 0; i < len; i++)
                {
                  if (i in this)
                    fun.call(thisp, this[i], i, this);
                }
        };

        if (!Array.prototype.array){
                array.forEach = forEach; 
        }
        return array;
};

/*
 * @require "core/enhance.js"
 */

/**
 * 
 * @param {HTMLElement|string} source String or Element used as the source for the template
 */
function HTMLSnippet(source,options)
{
	this.options = options || {};
	var sourceElement = source;
	if (source.childNodes == undefined) {
		sourceElement = document.createElement("DIV");
		// Calling on prototype for browsers that haven't resolved the prototype yet
		sourceElement.innerHTML = this._transformString(source.toString());
	}

	// Strip whitespace before/after main content
	var bStrip = this.options.stripBlanks === undefined || this.options.stripBlanks === true;
	var eFirst = sourceElement.firstChild;
	var eLast = sourceElement.lastChild;
	if (eFirst != eLast && bStrip) {
		if (eFirst.nodeType == 3 && /^\s*$/.test(eFirst.nodeValue)) {
			sourceElement.removeChild(eFirst); 
		}
		if (eLast.nodeType == 3 && /^\s*$/.test(eLast.nodeValue)) {
			sourceElement.removeChild(eLast); 
		}
	}

	
	this.branches = EnhancedArray([new HTMLBranch(sourceElement,0)]);
	var stack = EnhancedArray([]);
	this._addBranches(this.branches, {
		el: sourceElement
	},stack);
	stack.length = 0;
}

HTMLSnippet.prototype.TAGS = {};

HTMLSnippet.prototype.ATTRIBUTES = {};


/**
 * 
 * @param {HTMLElement} element Element controlled
 * @param {int} idx Index in the branches array
 */
function HTMLBranch(element,idx)
{
	this.el = element;
	this.idx = idx;
	this.parent = element.parentNode; // vs branch parent
	this.level;
	this.pop; // this.push
	this.tpl; // repeated template
	this.locator; // [0,2,5,0]
	
	// this.cloneTag function
	
	this.functions = [];
	this.descendantFunctions = 0;
}

HTMLBranch.prototype.cloneNode = function()
{
	return this.el.cloneNode(this.cloneChildren);
};

var OPTION_NAMES = {
	literal: true,
	substitute: true
};

/**
 * Make a function for Element.cloneTemplateNode
 * @private
 * @param {Array} pFunctions
 * @param {Boolean} bDeep
 */
HTMLBranch.prototype._pickFunctions = function() 
{
		
	function withFunctions(mElements,mTextNodes,mValues) {
		var eClone = fCustomClone? fCustomClone.call(this) : this.cloneNode(bDomChildren);
		for(var i=0,f; f = this.functions[i]; ++i) {
			f.call(this,mElements,mTextNodes,mValues,eClone);
		}
		if (bChildrenWithAttributes) this.cloneChildren(eClone, mElements, mTextNodes, mValues);
		return eClone;			
	}
	
	function domClone(mElements,mTextNodes,mValues) {
		var eClone = fCustomClone? fCustomClone.call(this) : this.cloneNode(bDeep);			
		return eClone;			
	};

	function domCloneAndChildrenWithAttributes(mElements,mTextNodes,mValues) {
		var eClone = fCustomClone? fCustomClone.call(this) : this.cloneNode(false);
		this.cloneChildren(eClone, mElements, mTextNodes, mValues);
		return eClone;			
	};

	if (this.functions.length) {
		return withFunctions;
	} else {
		return bChildrenWithAttributes? domCloneAndChildrenWithAttributes : domClone;
	}
};
	
/*
el.cloneNode if,
 + no functions
 + no functions on descendants
 + no custom clone function 
  
Parent info:
 + process substitution on nested text nodes
 + children need processing
 + clone children
 
Node:
 + run functions  
*/

HTMLSnippet.prototype._addBranches = function(branches, parent, stack)
{
	stack.push(parent.el);
	
	for (var child = parent.el.firstChild; child; child = child.nextSibling) {

		var branch = new HTMLBranch(child, branches.length); 
		branches.push(branch);
		switch (child.nodeType) {
			case 3: // text node
				branch.needsSubstitute = /\$\{/.test(child.nodeValue);
				branch._pickFunctions();
				break;
			case 1: // element node
				var tag = child.getAttribute? child.getAttribute("tag") : child.tag; 
				tag = tag || child.tagName;
				tag = branch.tag = tag? tag.toLowerCase().replace(":","") : null;
				
				stack.push(child);
				if (tag && this.TAGS[tag]) {
					branch.cloneTag = this.TAGS[tag].call(branch, stack);
				}
				for(var name in this.ATTRIBUTES) {
					var value = child.getAttribute(name);
					if (value != null) {
						var fDecorate = this.ATTRIBUTES[sName].call(branch,stack,name,value);
						if (fDecorate) branch.functions.push(fDecorate);
					}
				}
				stack.length -= 1;
								
				this._addBranches(branches,branch,stack);
				parent.descendantFunctions += branch.descendantFunctions + branch.functions.length;
				branch._pickFunctions();
				break;
			case 11: // fragment
			case 9: // document
			case 10: // document type
				//TODO other types Attributes 2/Comment 8/CDATA 4/PI 7
				break;
		};
	}

	stack.pop();
};

HTMLSnippet.prototype._transformString = function(snippet)
{
	if (navigator.userAgent.indexOf("; MSIE \d*\.\d*;") > -1) {
		snippet = snippet.replace(/\<br\/\>/,"<br>");
		for(var n in this.TAGS) {
			var rSingleTags = new RegExp( '\\<\\s*' + n + '([^/\\>]*)' + '/\\>' );
			snippet = snippet.replace(rSingleTags, '<dfn tag="'+n+'"'+'$1></dfn>');
			var rEndTags = new RegExp( '\\</\\s*' + n + '([^/\\>]*)' + '\\>' );
			snippet = snippet.replace(rEndTags, '</dfn$1>');
			var rSwitcher = new RegExp("\\<\\s*" + n + '([^/\\>]*)' + "(/?)\\>");
 			snippet = snippet.replace(rSwitcher,'<dfn tag="'+n+'"'+ "$1$2>");
		}
	}
	else {
		for(var n in this.TAGS) {
			var rSingleTags = new RegExp( '\\<\\s*' + n + '([^/\\>]*)' + '/\\>' );
			snippet = snippet.replace(rSingleTags, '<'+n+'$1></'+n+'>');
		}
	}
	
	return snippet;
};
