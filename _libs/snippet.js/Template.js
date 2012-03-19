/*
 * The implementation is functional with tests, but lacks key extensions needed before it can be used by the element library
 * 
 * It should be a very efficient templating implementation, but tests will be needed.
 * 
 * Current restrictions:
 * - The custom tags cannot use /> together or on their own in the attribute values.
 * - The custom tags must be lowercase
 * @beta
 */
/**
 * Template rendered by interpreting node attributes
 * 
 * If a DOM element is used, it and its descendants will be annotated.<br>
 * Options supported:
 * <pre>
 * substitute:  Substitute ${x} with value x anywhere in textnodes
 * stripBlanks: Strip blank textnodes at beginning and end (default=true)
 * </pre>
 * 
 * caplin.dom.HTMLForm interacts tightly with this class.
 * 
 * @beta
 * @constructor
 * @param {String|DOMElement} template Source to be rendered.
 * @param {Variant} mOptions Optional map of options. 
 */
HTMLTemplate = function(vTemplate,mOptions)
{
	this.m_eTemplate = vTemplate;
	this.m_mOptions = mOptions || {};
	this.m_mExtras = {};
	if (vTemplate.childNodes == undefined) {
		this.m_eTemplate = document.createElement("DIV");
		// Calling on prototype for browsers that haven't resolved the prototype yet
		this.m_eTemplate.innerHTML = this._transformTemplate(vTemplate.toString());
	}

	// Strip whitespace before/after main content
	var bStrip = this.m_mOptions.stripBlanks === undefined || this.m_mOptions.stripBlanks === true;
	var eFirst = this.m_eTemplate.firstChild;
	var eLast = this.m_eTemplate.lastChild;
	if (eFirst != eLast && bStrip) {
		if (eFirst.nodeType == 3 && /^\s*$/.test(eFirst.nodeValue)) {
			this.m_eTemplate.removeChild(eFirst); 
		}
		if (eLast.nodeType == 3 && /^\s*$/.test(eLast.nodeValue)) {
			this.m_eTemplate.removeChild(eLast); 
		}
	}

	// Decorate the template DOM
	var pStack = caplin.core.ArrayUtility.enhance([]);
	for(var n in mOptions) this.m_mExtras[n] = pStack[n] = mOptions[n];
	this._decorate(this.m_eTemplate,pStack);
	pStack.length = 0; // make sure closures are referencing an array with no elements
};

/**
 * Tag handlers
 */
HTMLTemplate.prototype.TAGS =
HTMLTemplate.TAGS = {};

/*
 TAG handlers
 
 function(pStack,mExtras)
   pStack[0] is the <template> or m_eTemplate element
   pStack[length-1] is the descendant element in the template being handled
   mExtras allows handlers to share data held by the template in m_mExtras
 
   return a function(mElements,mTextNodes,mValues) that will clone the template node
   if child elements should be cloned call cloneChildren(eTarget, mElements, mTextNodes, mValues) on template node
 */

/**
 * Set a node clone function for 'value' tags
 * 
 * The value tag can have a 'key' or 'name' attribute specifying which entry in the value map to use.
 * By default the 'value' entry is used.
 * The new text node will be bound in the text map.
 * 
 * @param {Array} pStack
 */
HTMLTemplate.TAGS["value"] = function(pStack,mExtras)
{
	var sKey = this.getAttribute("name") || this.getAttribute("key") || "value";
	
	return function(mElements,mTextNodes,mValues) {
		var sText = mValues[sKey];
		mTextNodes[sKey] = document.createTextNode(sText == null? "" : sText);
		return mTextNodes[sKey];
	};
};

/**
 * Include another template to be rendered in place.
 * 
 * The template tag must specify a name to specify which template to include.
 * 
 * @param {Array} pStack
 */
HTMLTemplate.TAGS["template"] = function(pStack,mExtras)
{
	var sName = this.getAttribute("name") || this.getAttribute("key");
	var oTemplate = HTMLTemplate.get(sName); 

	return function(mElements,mTextNodes,mValues) {
		return oTemplate.render(mElements,mTextNodes,mValues);
	};
};

/*
HTMLTemplate.onAfterClassLoad = function()
{
};
caplin.notifyAfterClassLoad(HTMLTemplate);
*/

/*
 ATTRIBUTE handlers
 
 function(pStack,mExtras,sAttrName,sAttrValue)
   pStack[0] is the <template> or m_eTemplate element
   pStack[length-1] is the descendant element in the template being handled
   mExtras allows handlers to share data held by the template in m_mExtras
   
   returns a function that will handle the particular attribute for that specific element
 */

/**
 * Attribute handlers
 */
HTMLTemplate.prototype.ATTRIBUTES = HTMLTemplate.ATTRIBUTES = {};

/**
 * Prepend resource url to IMG src attributes
 * (this is template element)
 * @private
 */
HTMLTemplate.ATTRIBUTES["resource-package"] = function(pStack,mExtras,sAttrName,sAttrValue)
{
	if (this.getAttribute("src")) {
		var sPackage = this.getAttribute(sAttrName);
		var sSrc = this.getAttribute("src");
		if (sSrc.lastIndexOf("/")) sSrc = sSrc.substring(sSrc.lastIndexOf("/")+1);
		sSrc = caplin.getModuleResourceUrl(sPackage,sSrc);
		this.src = sSrc;
		this.removeAttribute(sAttrName);
	}
	return null; // no decoration after clone
};

/**
 * Set a node decorator which will add the element to mElements
 * (this is template element)
 * @private
 */
HTMLTemplate.ATTRIBUTES["bind-node"] = function(pStack,mExtras,sAttrName,sAttrValue)
{
	var sBindName = this.getAttribute(sAttrName);

	// decorate the clone
	return function(mElements,mTextNodes,mValues,eClone) {
		mElements[sBindName] = eClone; //TODO array?
		eClone.removeAttribute(sAttrName);
	};
};

/**
 * Set a node decorator which will add the nested text node to mTextNodes
 * (this is template element)
 * @private
 */
HTMLTemplate.ATTRIBUTES["bind-text"] = function(pStack,mExtras,sAttrName,sAttrValue)
{
	var sBindName = this.getAttribute(sAttrName);
	

	// decorate the clone
	return function(mElements,mTextNodes,mValues,eClone) {
		//TODO pre-calc text node
		var eText = null;
		for(var i=0,e; e = eClone.childNodes[i]; ++i) {
			if (e.nodeType == 3) { eText = e; break; }
		}
		if (eText == null) {
			eText = document.createTextNode("");
			eClone.appendChild(eText);
		}
		mTextNodes[sBindName] = eText; //TODO array?
		eClone.removeAttribute(sAttrName);
	};
};

/**
 * Set a node decorator which will add classes to the cloned element
 * (this is template element)
 * @private
 */
HTMLTemplate.ATTRIBUTES["add-class"] = function(pStack,mExtras,sAttrName,sAttrValue)
{
	var addClasses = this.getAttribute("add-class").split(" ");

	// decorate the clone
	return function(mElements,mTextNodes,mValues,eClone) {
		var sClassName = eClone.className;
		var r = sClassName.length? [sClassName] : [];
		for(var i=0,c;c=addClasses[i];++i) {
			var sAddedClass = mValues[c] != undefined? mValues[c] : c;
			if (sAddedClass) r.push(sAddedClass.replace(/^\s+|\s+$/g,""));
		} 
		eClone.className = r.join(" ").replace(/^\s+|\s+$/g,"").replace(/\s+/," "); 
		eClone.removeAttribute("add-class");
	};
};

/**
 * @private
 */
HTMLTemplate.prototype._transformTemplate = function(sTemplate)
{
	if (caplin.dom.Browser.INSTANCE.getClientBrowser() == caplin.dom.Browser.CLIENT_BROWSER_INTERNET_EXPLORER) {
		sTemplate = sTemplate.replace(/\<br\/\>/,"<br>");
		for(var n in this.TAGS) {
			var rSingleTags = new RegExp( '\\<\\s*' + n + '([^/\\>]*)' + '/\\>' );
			sTemplate = sTemplate.replace(rSingleTags, '<dfn tag="'+n+'"'+'$1></dfn>');
			var rEndTags = new RegExp( '\\</\\s*' + n + '([^/\\>]*)' + '\\>' );
			sTemplate = sTemplate.replace(rEndTags, '</dfn$1>');
			var rSwitcher = new RegExp("\\<\\s*" + n + '([^/\\>]*)' + "(/?)\\>");
 			sTemplate = sTemplate.replace(rSwitcher,'<dfn tag="'+n+'"'+ "$1$2>");
		}
	}
	else {
		for(var n in this.TAGS) {
			var rSingleTags = new RegExp( '\\<\\s*' + n + '([^/\\>]*)' + '/\\>' );
			sTemplate = sTemplate.replace(rSingleTags, '<'+n+'$1></'+n+'>');
		}
	}
	
	return sTemplate;
};

/**
 * @private
 * Default used for text nodes and other nodes without a clone function
 * @param {Object} mElements
 * @param {Object} mTextNodes
 * @param {Object} mValues
 */
HTMLTemplate.prototype._defaultClone = function(mElements,mTextNodes,mValues) {
		return this.cloneNode(false);			
};

/**
 * Set of keys that are used in values as options for the templating
 * @private
 */
HTMLTemplate.OPTION_NAMES = {
	literal: true,
	substitute: true
};
	
/**
 * @private
 * Default used for text nodes and other nodes without a clone function
 * @param {Object} mElements
 * @param {Object} mTextNodes
 * @param {Object} mValues
 */
HTMLTemplate.prototype._substitutingClone = function(mElements,mTextNodes,mValues) {
	var sValue = this.nodeValue;
	var sKey = null;
	var OPTION_NAMES = HTMLTemplate.OPTION_NAMES;
	for(var n in mValues) {
		sValue = sValue.replace("${"+n+"}",mValues[n]);
		if (!OPTION_NAMES[n]) {
			sKey = n;
		}
	}
	var eText = document.createTextNode(sValue);
	if (sKey != null) {
		mTextNodes[sKey] = eText;
	}
	return eText;		
};
	
/**
 * Make a function for Element.cloneTemplateNode
 * @private
 * @param {Array} pFunctions
 * @param {Boolean} bDeep
 */
HTMLTemplate.prototype._makeCloneFunction = function(pFunctions,bDeep) {
		
	var bDomChildren = bDeep == 1;
	var bChildrenWithAttributes = bDeep == 2;
	
	function withFunctions(mElements,mTextNodes,mValues) {
		var eClone = this.cloneNode(bDomChildren);
		for(var i=0,f; f = pFunctions[i]; ++i) {
			f.call(this,mElements,mTextNodes,mValues,eClone);
		}
		if (bChildrenWithAttributes) this.cloneChildren(eClone, mElements, mTextNodes, mValues);
		if (eClone.cloneChildren) eClone.removeAttribute("cloneChildren"); // IE copies custom js attributes (TODO switch implementation for IE)
		if (eClone.cloneTemplateNode) eClone.removeAttribute("cloneTemplateNode"); // IE copies custom js attributes (TODO switch implementation for IE)
		return eClone;			
	}
	
	function domClone(mElements,mTextNodes,mValues) {
		var eClone = this.cloneNode(bDeep);			
		if (eClone.cloneChildren) eClone.removeAttribute("cloneChildren"); // IE copies custom js attributes (TODO switch implementation for IE)
		if (eClone.cloneTemplateNode) eClone.removeAttribute("cloneTemplateNode"); // IE copies custom js attributes (TODO switch implementation for IE)
		return eClone;			
	};

	function domCloneAndChildrenWithAttributes(mElements,mTextNodes,mValues) {
		var eClone = this.cloneNode(false);
		this.cloneChildren(eClone, mElements, mTextNodes, mValues);
		if (eClone.cloneChildren) eClone.removeAttribute("cloneChildren"); // IE copies custom js attributes (TODO switch implementation for IE)
		if (eClone.cloneTemplateNode) eClone.removeAttribute("cloneTemplateNode"); // IE copies custom js attributes (TODO switch implementation for IE)
		return eClone;			
	};

	if (pFunctions.length) {
		return withFunctions;
	} else {
		return bChildrenWithAttributes? domCloneAndChildrenWithAttributes : domClone;
	}
};
	
/**
 * Called on Element to clone the children. NOT called on HTMLTemplate instance.
 * @private
 * 
 * @param {Element} eTarget
 * @param {Map} mElements
 * @param {Map} mTextNodes
 * @param {Map} mValues
 */
HTMLTemplate.prototype._cloneChildren = function cloneChildren(eTarget, mElements, mTextNodes, mValues) {
	var fDefaultClone = HTMLTemplate.prototype._defaultClone; 
	for (var eChild = this.firstChild; eChild; eChild = eChild.nextSibling) {
		var eClone = (eChild.cloneTemplateNode || fDefaultClone).call(eChild,mElements,mTextNodes,mValues);
		eTarget.appendChild(eClone);
	}
};

/**
 * Called on Element to clone the children, substituting variables in text nodes. 
 * NOT called on HTMLTemplate instance.
 * @private
 * 
 * @param {Element} eTarget
 * @param {Map} mElements
 * @param {Map} mTextNodes
 * @param {Map} mValues
 */
HTMLTemplate.prototype._cloneChildrenSubstitute = function cloneChildrenSubstitute(eTarget, mElements, mTextNodes, mValues) {
	var fDefaultClone = HTMLTemplate.prototype._defaultClone; 
	var fSubstitutingClone = HTMLTemplate.prototype._substitutingClone; 
	for (var eChild = this.firstChild; eChild; eChild = eChild.nextSibling) {
		var fClone = eChild.cloneTemplateNode || (eChild.nodeType == 3? fSubstitutingClone:fDefaultClone)
		var eClone = fClone.call(eChild,mElements,mTextNodes,mValues);
		eTarget.appendChild(eClone);
	}
};

/**
 * Recursive scan through the template elements to determine clone implementation
 * 
 * @private
 * @param {Element} eParent 
 * @param {Array} pStack Stack of elements from Template div, down to the currently decorated parent
 */
HTMLTemplate.prototype._decorate = function(eParent,pStack)
{
	pStack.push(eParent);
	
	// Add template node API
	eParent.cloneChildren = this.m_mOptions.substitute? this._cloneChildrenSubstitute : this._cloneChildren;
	
	var bChildren = false;
	for (var eChild = eParent.firstChild; eChild; eChild = eChild.nextSibling) {
		// Template tags
		var sTag = eChild.getAttribute? eChild.getAttribute("tag") : eChild.tag; 
		sTag = sTag || eChild.tagName;
		var sTag = sTag? sTag.toLowerCase().replace(":","") : null;
		if (sTag && this.TAGS[sTag]) {
			pStack.push(eChild);
			var fClone = this.TAGS[sTag].call(eChild,pStack,this.m_mExtras);
			pStack.length -= 1;
			// This is cleared in forget, 
			eChild.cloneTemplateNode = fClone;
			bChildren = 2;
			
			this._decorate(eChild,pStack);

		// Template attributes
		} else {
			if (eChild.nodeType == 3) {
				// for text nodes beside templated elements
				bChildren = bChildren || 1;
				if (/\$\{/.test(eChild.nodeValue)) bChildren = 2;
				// IE doesn't allow addition of text node attributes
//				var fClone = this._makeCloneFunction([],false);
//				eChild.cloneTemplateNode = fClone;
			}
			if (eChild.nodeType == 1) {
				bChildren = bChildren || 1;

				var pFunctions = [];
				for(var sName in this.ATTRIBUTES) {
					var sValue = eChild.getAttribute(sName);
					if (sValue != null) {
						pStack.push(eChild);
						fDecorate = this.ATTRIBUTES[sName].call(eChild,pStack,this.m_mExtras,sName,sValue);
						pStack.length -= 1;
						if (fDecorate) pFunctions.push(fDecorate);
						bChildren = 2;
					}
				}
				var bChildrenOfChild = this._decorate(eChild,pStack);
				eChild.cloneTemplateNode = this._makeCloneFunction(pFunctions,bChildrenOfChild);
				bChildren = Math.max(bChildrenOfChild,bChildren);
			} else {
				// Text/Attributes/Comment/CDATA should not have children to clone
				//TODO consider if other types need handling
			}
		} 
	}

	pStack.pop();
	
	return bChildren;		
}

/**
 * Render the template as DOM elements
 * 
 * @param {Map} mElements Empty map to be filled with references to bound elements
 * @param {Map} mTextNodes Empty map to be filled with references to bound text nodes
 * @param {Map} mValues Map of values injected to template
 * @return Document Fragment containing a rendering of the template
 */
HTMLTemplate.prototype.render = function(mElements,mTextNodes,mValues)
{
	var eFragment = document.createDocumentFragment();
	this.m_eTemplate.cloneChildren(eFragment, mElements, mTextNodes, mValues);
	this._addToFunctions(eFragment);
	return eFragment;
};

// Render the template as Html String
//TODO HTMLTemplate.prototype.renderHtml 

/**
 * Render the template as HTML string
 * This will create a DOM tree and flatten it into a string.
 * (For optimal performance use the render method)
 * @param {Map} mValues Map of values injected to template
 * @type String
 * @return String containing a rendering of the template
 */
HTMLTemplate.prototype.renderHtml = function(mValues)
{
	var eDiv = document.createElement("div");
	var mElements = {};
	var mTextNodes = {};
	this.m_eTemplate.cloneChildren(eDiv, mElements, mTextNodes, mValues);
	return eDiv.innerHTML;
};


/**
 * Add toString and toHTML functions
 * @private
 * @param {HTMLElement} eTop Top element or Document fragment
 */
HTMLTemplate.prototype._addToFunctions = function(eTop)
{
	function blank() {
		return "";
	}

	// called recursively by toString
	function appendString(oBuilder,eTop) {
		for(var e = eTop.firstChild; e; e = e.nextSibling) {
			if (e.nodeType == 1) { // DOM element
				appendString(oBuilder,e);
			} else { // DOM text node / cdata
				oBuilder.append(e.nodeValue);
			}
		}
	}
	
	function toString() {
		var oBuilder = new caplin.core.StringBuilder();
		appendString(oBuilder,this);
		return oBuilder.toString();
	}
	
	function toInnerHtml() {
		return this.innerHTML;
	}
	
	function toFragmentHtml() {
		var eDiv = document.createElement("div");
		while(this.firstChild) {
			eDiv.appendChild(this.firstChild);
		}
		var sHtml = eDiv.innerHTML;
		while(eDiv.firstChild) {
			this.appendChild(eDiv.firstChild);
		}
		return sHtml;
	}
	
	if (eTop.nodeType == 11) {
		// Document Fragment
		eTop.toString = toString;
		eTop.toHTML = toFragmentHtml;
		eTop.isDocumentFragment = true;
	} else {
		// DOM Element
		eTop.toString = toString;
		eTop.toHTML = toInnerHtml;
	}
};

/**
 * Check if a thing is a document fragment created by HTMLTemplate
 * 
 * @param {Any} vThing Any instance 
 */
HTMLTemplate.isFragment = function(vThing)
{
	return typeof vThing == "object" && vThing instanceof DocumentFragment; 
};

/** @private */
HTMLTemplate.isFragmentIE = function(vThing)
{
	return typeof vThing == "object" && vThing.toHTML && vThing.isDocumentFragment; 
};

/**
 * Call this to ensure memory cleanup
 */
HTMLTemplate.prototype.forget = function()
{
	//TODO recursively remove 'cloneTemplateNode' and 'cloneChildren' on eTemplate and descendants
};

/**
 * Parse a string of constant notation.
 * "abc" -> "abc"
 * "'abc'" -> "abc"
 * "'ab'c'" -> "ab'c"
 * "'ab'c" -> "'ab'c"
 * "0" -> (0)
 * "true" -> (true)
 * "'true'" -> "true"
 * "'0'" -> "0"
 * 
 * @param {String} sConstant
 * @return simple value or generator function that will return a simple value when called
 */
HTMLTemplate.parseConstantString = function(sConstant)
{
	if (this.PREDEFINED_CONSTANT.hasOwnProperty(sConstant)) {
		return this.PREDEFINED_CONSTANT[sConstant];
	}
	if (sConstant.charAt(0) == "'" && sConstant.charAt(sConstant.length-1) == "'") {
		return sConstant.substring(1,sConstant.length-1);
	}
	var nResult = Number(sConstant);
	return isNaN(nResult)? sConstant : nResult;
};

HTMLTemplate.formatConstantString = function(vValue)
{
	if (this.PREDEFINED_FORMAT[vValue]) {
		return this.PREDEFINED_FORMAT[vValue];
	}
	if (typeof vValue == "number") return String(vValue);
	if (typeof vValue == "string") return "'"+vValue+"'";
	return "NaN";
};

/** @private 
 * Constants with specific translations
 */
HTMLTemplate.PREDEFINED_CONSTANT = 
{
	"":"",
	"now":function(){ return new Date(); },
	"true":true,
	"false":false,
	"null": null,
	"NaN":NaN,
	"MIN_VALUE":Number.MIN_VALUE,
	"MAX_VALUE":Number.MAX_VALUE,
	"NEGATIVE_INFINITY":Number.NEGATIVE_INFINITY,
	"POSITIVE_INFINITY":Number.POSITIVE_INFINITY,
	"undefined":undefined
};

HTMLTemplate.PREDEFINED_FORMAT = {};

/** @private */
(function(){
	var CONSTANT = HTMLTemplate.PREDEFINED_CONSTANT;
	var FORMAT = HTMLTemplate.PREDEFINED_FORMAT;
	for(var n in CONSTANT) FORMAT[CONSTANT[n]] = n;
	FORMAT[""] = "''";
})();

/**
 * Templates will be looked up on this document by default
 */
HTMLTemplate.defaultDocument = document;

/**
 * @private
 */
HTMLTemplate.CACHE = {};

/**
 * @private
 * @param {String} sName Name of the template
 * @param {Object} oDocument Optional document to fetch from
 */
HTMLTemplate._get = function(sName,oDocument)
{
	oDocument = oDocument || HTMLTemplate.defaultDocument;
	var mCache = this.CACHE[oDocument];
	if (mCache == undefined) { 
		mCache = this.CACHE[oDocument] = {};
		//TODO if there is a "default" template in the document use that
		mCache["default"] = new HTMLTemplate(""); 
	}
	if (mCache[sName]) {
		return mCache[sName];
	} 
	var pTemplates = oDocument.getElementsByTagName("template");
	for(var i=0,t; t = pTemplates[i]; ++i) {
		if (t.getAttribute("name") == sName) {
			var mOptions = {};
			if (t.getAttribute("substitute")) { mOptions["substitute"] = true; }
			mCache[sName] = new HTMLTemplate(t,mOptions);
			return mCache[sName];
		}
	}
	return null;
};

/**
 * Get template from the document
 * @param {String} sName Name of the template
 * @param {Object} oDocument Optional document to fetch from
 */
HTMLTemplate.get = function(sName,oDocument)
{
	var oTemplate = HTMLTemplate._get(sName,oDocument);
	if (oTemplate) {
		return oTemplate;
	} 
	throw new Error("Failed to get template '"+sName+"' from "+(oDocument.defaultView ||window).location.href);
};

// IE specific mods 
if (navigator.userAgent.indexOf("Trident/") > -1) {
	
	HTMLTemplate.isFragment = HTMLTemplate.isFragmentIE;
}

