/**
 * @beta
 * @param {Object} vMessage
 * @param {Object} mOptions
 */
HTMLMessage = function(vMessage,mOptions)
{
    caplin.dom.HTMLTemplate.apply(this,arguments);
};
caplin.implement(HTMLMessage, caplin.dom.HTMLTemplate);

/**
 * @private
 */
HTMLMessage.CACHE = {};

/** @private */
HTMLMessage.DEFAULTS = {};

/**
 * Messages will be looked up on this document by default
 */
HTMLMessage.defaultDocument = document;

/**
 * @private
 */
HTMLMessage._get = function(sName,oDocument,mCache)
{
    if (mCache[sName]) {
        return mCache[sName];
    } 
    var pTemplates = oDocument.getElementsByTagName("message");
    for(var i=0,t; t = pTemplates[i]; ++i) {
        if (t.getAttribute("name") == sName) {
            var mOptions = {};
            if (t.getAttribute("substitute")) { mOptions["substitute"] = true; }
            mCache[sName] = new HTMLMessage(t,mOptions);
            return mCache[sName];
        }
    }
    return undefined;
};

/**
 * Get message from the document
 * @param {Object} sName Name of the template
 * @param {Object} oDocument Optional document to fetch from
 */
HTMLMessage.get = function(sName,oDocument)
{
    oDocument = oDocument || HTMLMessage.defaultDocument;
    var mCache = this.CACHE[oDocument];
    if (mCache == undefined) { 
        mCache = this.CACHE[oDocument] = {};
        //TODO if there is a "default" template in the document use that
        mCache["default"] = new HTMLMessage(""); 
    }
    var oMessage = this._get(sName,oDocument,mCache);
    if (oMessage) return oMessage;
    throw new Error("Failed to get template '"+sName+"' from "+(oDocument.defaultView || window).location.href);
};

/**
 * Set the translation for a code used as a default
 * 
 * @param {String} sCode Code e.g 'button:ok'
 * @param {String} sHtml HTML
 * @param {Map} mOptions Map of HTMLMessage options
 */
HTMLMessage.setDefaultTranslate = function(sCode,sHtml,mOptions)
{
    this.DEFAULTS[sCode] = new HTMLMessage(sHtml,mOptions || {});
};

/**
 * Translate a message to locale specific *DOM tree*
 * 
 * If used the sCode must by prefixed by category (alert: error: caption: button: validation:)
 * 
 * The current implementation maps the four parameters into one namespace, but that
 * may not remains so in the future. 
 * The priority order may also change, or become configurable.
 * 
 * @param {String} sHtml Message html to translate
 * @param {String} sText Message text to translate
 * @param {String} sCode (Optional) Message code that overrides the message
 * @param {String} sDefault Default html if sMessage & sCode is null or undefined
 * @param {Map} mValues (Optional) Values that can be referenced in the message template
 * 
 * @return DOM Fragment with toString & toHtml functions
 * @beta
 */
HTMLMessage.translate = function(sHtml,sText,sCode,sDefault,mValues)
{
    mValues = mValues || {};
	var oDocument = HTMLMessage.defaultDocument;
    var mCache = this.CACHE[oDocument];
    if (mCache == undefined) { 
        mCache = this.CACHE[oDocument] = {};
        //TODO if there is a "default" template in the document use that
        mCache["default"] = new HTMLMessage(""); 
    }
    
    function text2html(sText,mValues) {
		if (mValues.literal) {
			sText = sText.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
		}
        return sText.replace(/\n /g, "<br>&nbsp;").replace(/\n/g, "<br>");
    }
	
	function text2key(sText) {
		if (sText == null) return null;
		return sText.replace(/\n/,"");
	}
	
	function html2key(sHtml) {
		if (sHtml == null) return null;
		return sHtml.replace(/<[^>]*>/,"");
	}

    var oMessage;
	var sKey = sCode || text2key(sText) || html2key(sHtml) || html2key(sDefault); // Key for lookups
	//TODO fetch from cache
	
    if (sCode) {
        oMessage = this._get(sCode,oDocument,mCache);
        if (oMessage == null) {
            oMessage = this.DEFAULTS[sCode];
        }
    } else
    if (sText != null) {
        oMessage = this._get(sKey,oDocument,mCache);
    } else 
    if (sHtml != null) {
        //TODO support for tags removed before looking up the name
        oMessage = this._get(sKey,oDocument,mCache);
    } else
    if (sDefault != null) {
        oMessage = this._get(sKey,oDocument,mCache);
        if (oMessage == null) {
            oMessage = this.DEFAULTS[sKey];
        }
    }
    
    // create template from text if not in repository
    if (oMessage == null) {
        if (sText != null && sHtml == null) {
	        // translate text
            sHtml = text2html(sText,mValues);
        }
        var sTemplate = sHtml || sDefault;
        oMessage = mCache[sKey] = new HTMLMessage(sTemplate,{ substitute:true });
    }
    
    return oMessage.render({},{},mValues);
};

/**
 * Translate a message *html* string to locale specific *DOM tree*
 * 
 * @param {String} sMessage Message to translate
 * @param {String} sDefault (Optional) Default if sMessage is null or undefined
 * @param {Map} mValues (Optional) Values that can be referenced in the message template
 * 
 * @return DOM Fragment with toString & toHtml functions
 * @beta
 */
HTMLMessage.translateHtml = function(sMessage,sDefault,mValues)
{
    if (arguments.length == 2 && typeof sDefault == "object") {
        return this.translate(sMessage,null,null,null,sDefault);
    }
    return this.translate(sMessage,null,null,sDefault,mValues);
};

/**
 * Translate a message *text* string to locale specific *DOM tree*
 * 
 * @param {String} sMessage Text message to translate
 * @param {String} sDefault Default if sMessage is null or undefined
 * @param {Map} mValues (Optional) Values that can be referenced in the message template
 * 
 * @return DOM Fragment with toString & toHtml functions
 * @beta
 */
HTMLMessage.translateText = function(sMessage,sDefault,mValues)
{
    if (arguments.length == 2 && typeof sDefault == "object") {
        return this.translate(null,sMessage,null,null,sDefault);
    }
    if (sDefault) {
        sDefault = sDefault.replace(/\n /g, "<br>&nbsp;").replace(/\n/g, "<br>")
    }
    return this.translate(null,sMessage,null,sDefault,mValues);
};

/**
 * Translate a message referenced by code to locale specific *DOM tree*
 * 
 * @param {String} sCode Code reference to template to translate
 * @param {String} sDefault Default if sMessage & sCode is null or undefined
 * @param {Map} mValues (Optional) Values that can be referenced in the message template
 * 
 * @return DOM Fragment with toString & toHtml functions
 * @beta
 */
HTMLMessage.translateCode = function(sCode,sDefault,mValues)
{
    return this.translate(null,null,sCode,sDefault,mValues);
};

/**
 * Simplified translate implementation that doesn't replace the tree with a tree, but the tree with 
 * a rendered html fragment.
 * 
 * @param {Object} pStack
 * @param {Object} mExtras
 * @param {Object} sAttrName
 * @param {Object} sCode
 */
caplin.dom.HTMLTemplate.ATTRIBUTES["translate"] = function(pStack,mExtras,sAttrName,sCode)
{
	try {
	    var oMessage = HTMLMessage.get(sCode);

		// instantiate handler the clone of mElements['form'].handlers
		return function(mElements,mTextNodes,mValues,eClone) {
			var mValues = {};
			var eFragment = oMessage.render({},{},mValues);
			eClone.replaceChild(eFragment,eClone.firstChild);
		};
	}
	catch(ex) {
		return null;
	}
};


