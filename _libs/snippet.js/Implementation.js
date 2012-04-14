/* requires Template.js */

/**
 * How to manipulate a form element of a certain type.
 * Implementations maintain no state, so they can be shared among elements of the same type.
 * 
 * Type is either identified by "tagName" & "type" or by a JavaScript class name.
 *  
 * @beta
 * Internal to HTMLForm for now
 * @param mMods Modifications (optional)
 */
HTMLImplementation = function(mMods)
{
	for(var n in mMods) {
		this[n+"Native"] = mMods[n];
		this[n] = mMods[n];
	} 
};

/**
 * Make an implementation for a control element
 * @param {Object} eClone
 * @param {Object} eForm
 */
HTMLImplementation.prototype.makeControlImplementation = function(eClone,eForm,mNames)
{
	var oImplementation = this;

	var oData = eClone.data;
	if (oData) {
		oImplementation = oData.fireLifecycleTrigger("implementation","init",eForm,eClone,oImplementation) || oImplementation;
	}
	oImplementation.decorate(eClone,eForm,mNames);
	//TODO call undecorate when branch torn down
	
	return oImplementation;
};

HTMLImplementation.prototype.forgetControlImplementation = function(eClone,eForm)
{
	var oImplementation = this;
	oImplementation.undecorate(eClone,eForm);
	var oData = eClone.data;
	if (oData) {
		oData.fireLifecycleTrigger("implementation","destroy",eForm,eClone,oImplementation);
	}
	this.callCleaners(eClone);
};

HTMLImplementation.prototype.decorate = function(eControl,eForm,mNames)
{
	//TODO
};

HTMLImplementation.prototype.undecorate = function(eControl,eForm)
{
	//TODO
};

HTMLImplementation.prototype.ieButtonDecorate = function(eControl,mNames)
{
	//TODO stop the mouse down shifting
};

// http://www.w3.org/TR/CSS2/propidx.html

HTMLImplementation.prototype.STYLES = {
	"display": (function(){
		var m =  {
			// inline | block | list-item | run-in | inline-block | table | inline-table | table-row-group | table-header-group | table-footer-group | table-row | table-column-group | table-column | table-cell | table-caption | none | inherit
			"block":"block", "inline":"inline", "inline-block":"inline-block",
			"table":"table", "inline-table":"inline-table", 
			"list-item":"list-item", 
			"none":"none", "inherit":"inherit"
		};
		m[false] = "none";
		return m;
		})(),
		
	"visible": (function(){
		var m = {
			"visible":"visible", "hidden":"hidden", "collapse":"collapse", "inherit":"inherit"
		};
		m[true] = "visible";
		m[false] = "hidden";
		return m;
		})(),
		
	"visibility": (function(){
		var m = {
			"visible":"visible", "hidden":"hidden", "collapse":"collapse", "inherit":"inherit"
		};
		m[true] = "visible";
		m[false] = "hidden";
		return m;
		})()
};

HTMLImplementation.prototype.STYLES_KEY = {
	"display":"display",
	"visibility":"visibility",
	"visible":"visibility"
};

HTMLImplementation.prototype.filterStyle = function(sKey,sValue,sDefault)
{
	//TODO consider if true/false should derive from defaults from a class definition
	
	if (this.STYLES[sKey] == undefined) return sDefault; // not supported
	var sTranslation = this.STYLES[sKey][sValue];
	if (sTranslation === undefined) return sDefault; // not supported value
	return sTranslation;
};

HTMLImplementation.prototype.getClass = function(eControl)
{
	return eControl.className;	
};

HTMLImplementation.prototype.getClassNative = HTMLImplementation.prototype.getClass;

HTMLImplementation.prototype.setClass = function(eControl,sValue)
{
	if (typeof sValue == "object" && typeof sValue.toString == "function") sValue = sValue.toString();
	eControl.className = sValue;	
};

HTMLImplementation.prototype.setClassNative = HTMLImplementation.prototype.setClass;

HTMLImplementation.prototype.setStyle = function(eControl,sKey,sValue)
{
	if (this.STYLES[sKey] == undefined) return; // not supported
	var sTranslation = this.STYLES[sKey][sValue];
	if (sTranslation === undefined) return; // not supported value
	sKey = this.STYLES_KEY[sKey] || sKey;
	eControl.style[sKey] = sTranslation;	
};

HTMLImplementation.prototype.setStyleNative = HTMLImplementation.prototype.setStyle;

HTMLImplementation.prototype.getEnabled = function(eControl)
{
	var sDisabled = eControl.getAttribute("disabled");
	return sDisabled !== true && sDisabled != "disabled";
};


HTMLImplementation.prototype.getEnabledNative = HTMLImplementation.prototype.getEnabled;

HTMLImplementation.prototype.setEnabled = function(eControl,bEnabled)
{
	eControl.setAttribute("disabled", bEnabled? "" : "disabled");
};

HTMLImplementation.prototype.setEnabledNative = HTMLImplementation.prototype.setEnabled;

HTMLImplementation.prototype.getPropertyEnabled = function(eControl)
{
	return !eControl.disabled;
};

HTMLImplementation.prototype.setPropertyEnabled = function(eControl,bEnabled)
{
	eControl.disabled = !bEnabled;
};

HTMLImplementation.prototype.getReadOnly = function(eControl)
{
	//TODO consider supporting IE contentEditable attribute
	
	var sReadOnly = eControl.getAttribute("readOnly");
	return sReadOnly != "readonly";
};

HTMLImplementation.prototype.getReadOnlyNative = HTMLImplementation.prototype.getReadOnly;

HTMLImplementation.prototype.setReadOnly = function(eControl,bReadOnly)
{
	eControl.setAttribute("readOnly", bReadOnly? "" : "readonly");
};

HTMLImplementation.prototype.setReadOnlyNative = HTMLImplementation.prototype.setReadOnly;

HTMLImplementation.prototype.getPropertyReadOnly = function(eControl)
{
	return eControl.readOnly;
};

HTMLImplementation.prototype.setPropertyReadOnly = function(eControl,bReadOnly)
{
	eControl.readOnly = bReadOnly;
};

HTMLImplementation.prototype.getFormatted = function(eControl)
{
	return eControl.innerHTML;
};

HTMLImplementation.prototype.getFormattedNative = HTMLImplementation.prototype.getFormatted;

HTMLImplementation.prototype.getValueFormatted = function(eControl)
{
	return eControl.value;
};

HTMLImplementation.prototype.getSelectFormatted = function(eControl)
{
	return eControl.value;
};

HTMLImplementation.prototype.getCheckedFormatted = function(eControl)
{
	return eControl.checked;
};

HTMLImplementation.prototype.setFormatted = function(eControl,vValue)
{
	if (caplin.dom.HTMLTemplate.isFragment(vValue)) {
		eControl.innerHTML = '';
		eControl.appendChild(vValue); //TODO improve the speed by implementing replaceChildren
	} else {
		eControl.innerHTML = vValue;
	}
};

HTMLImplementation.prototype.setFormattedNative = HTMLImplementation.prototype.setFormatted;

HTMLImplementation.prototype.setValueFormatted = function(eControl,vValue)
{
	eControl.value = vValue;
};

HTMLImplementation.prototype.setCheckedFormatted = function(eControl,vValue)
{
	eControl.checked = vValue;
};

HTMLImplementation.prototype.setSelectFormatted = function(eControl,vValue)
{
	eControl.value = vValue;
};

HTMLImplementation.prototype.setFields = function(eControl,vValue)
{
	// only works for renderers
};

HTMLImplementation.prototype.setOptions = function(eControl,pValues)
{
	// only works for select boxes
};

/**
 * 
 * @param {Object} eControl
 * @param {Array} pValues List of objects describing the options
 */
HTMLImplementation.prototype.setSelectOptions = function(eControl,pValues)
{
	eControl.options.length = 0;
	for(var i=0,v; v = pValues[i]; ++i) {
		var sText = v.formatted;
		var sKey = v.key !== undefined? v.key : v.formatted;
		var oOption = new Option(sText,sKey, false, false);
		eControl.options.add(oOption);
	}
};

HTMLImplementation.prototype.reflect = function(eControl,sTarget,vValue)
{
	switch(sTarget) {
		case "formatted": this.setFormatted(eControl,vValue); break;
		case "fields": this.setFields(eControl,vValue); break;
		case "options": this.setOptions(eControl,vValue); break;
		case "enabled": this.setEnabled(eControl, vValue); break;
		case "readonly": this.setReadOnly(eControl,vValue); break;
		case "class":
			if (typeof vValue == "object") {
				var pNames = [];
				for(var n in vValue) pNames.push(n);
				vValue = pNames.join(" "); 
			} 
			this.setClass(eControl,vValue); 
			break;
		case "style.display": this.setStyle(eControl,"display",String(vValue)); break;
		case "style.visible": this.setStyle(eControl,"visible",String(vValue)); break;
		default: if (sTarget.substring(0,6) == "style.") {
			this.setStyle(eControl,sTarget.substring(6),vValue);
		} break;
	}
};

HTMLImplementation.prototype._makeEventCleaner = function(mListeners,bBubble)
{
	// must be called with element as this
	function cleaner() {
		if (this.removeEventListener) {
			for(var n in mListeners) {
				this.removeEventListener(n, mListeners[n], bBubble);
				delete mListeners[n];
			}
		} else {
			for(var n in mListeners) {
				this.detachEvent('on'+ n, mListeners[n]);
				delete mListeners[n];
			}
		}
	}
	cleaner.listeners = mListeners; // for removeEventListeners
	return cleaner;
};

/**
 * Register map of event listeners 
 * { event: function }
 * Using DOM style event names
 * 
 * @param {Object} eControl
 * @param {Map} mListeners Map from event name to function 
 * @param {Object} bBubble
 */
HTMLImplementation.prototype.addEventListeners = function(eControl, mListeners,bBubble)
{
	if (eControl.cleaners == undefined) eControl.cleaners = [];

	// need to remember the function to call
	// supports DOM 2 EventListener interface
	function makeIeListener(eControl,fCallOrThis) {
		var bListenerInstance = typeof fCallOrThis == "object";
		
		var oThis = bListenerInstance? fCallOrThis : eControl;
		var fCall = bListenerInstance? fCallOrThis.handleEvent : fCallOrThis;
		return function() { 
			return fCall.call(eControl,window.event); 
		};
	} 

	if (eControl.addEventListener) {
		for(var n in mListeners) {
			eControl.addEventListener(n, mListeners[n], bBubble);
		}
		eControl.cleaners.push(this._makeEventCleaner(mListeners,bBubble));
	} else {
		var mListeners2 = {};
		for(var n in mListeners) {
			mListeners2[n] = makeIeListener(eControl,mListeners[n]);
			eControl.attachEvent('on'+n,mListeners2[n]);
		}
		eControl.cleaners.push(this._makeEventCleaner(mListeners2,bBubble));
	}	
};

//TODO modifyable events object on IE

//TODO removeEventListeners (eControl, mListeners, bBubble)

/**
 * Cleans up registered event listeners and other references
 * 
 * @param {Object} eControl
 */
HTMLImplementation.prototype.callCleaners = function(eControl)
{
	var pCleaners = eControl.cleaners;
	if (pCleaners != undefined) {
		for(var i=0,c; c = pCleaners[i]; ++i) {
			c.call(eControl);
		}
		pCleaners = undefined;
	}
};

//TODO recursive clean of element and children?


////////////////////////////////////////////////////////
// Attaching implementation to an element
////////////////////////////////////////////////////////


/**
 * Ensure that an implementation object have been referenced on the control.
 * 
 * @param {HTMLElement} eControl Template element
 * @return the implementation (= eControl.implementation)
 */
HTMLImplementation.ensure = function(eControl)
{
	if (typeof eControl.implementation == "object") return eControl.implementation;
	eControl.implementation = this.get(eControl);
	return eControl.implementation;
};

/**
 * Determines the control implementation for an element.
 * The implementation attribute can specify the specific class to instantiate,
 * otherwise it is determined by tagName and type.
 * 
 * @return HTMLImplementation appropriate for the element.
 * 
 * @param {HTMLElement} eControl Element
 */
HTMLImplementation.get = function(eControl)
{
	var sType = eControl.getAttribute("type");
	var sDefaultIndex = sType? eControl.tagName.toLowerCase() + " " + sType : eControl.tagName.toLowerCase(); 
	if (this.CACHE[sDefaultIndex] == undefined) {
		var mMods = this.MODS[sDefaultIndex] || this.MODS['span'];
		this.CACHE[sDefaultIndex] = new HTMLImplementation(mMods);
	}

	var sImplementation = eControl.getAttribute("implementation");
	if (sImplementation) {
		var sIndex = "class:"+sImplementation;
		if (this.CACHE[sIndex]) return this.CACHE[sIndex];
		try {
			var fConstructor = eval(sImplementation);
			var mMods = this.MODS[sDefaultIndex] || this.MODS['span'];
			var oImplementation = this.CACHE[sIndex] = new fConstructor(mMods,eControl);
			return oImplementation;
		} catch(ex) {
			// TODO warn?
		}
	}

	var oImplementation = this.CACHE[sDefaultIndex];
	return oImplementation;
};



/**
 * 
 */
HTMLImplementation.CACHE = {
	
};

/**
 * Implementation modifications indexed by tagName [+ type]
 */
HTMLImplementation.MODS = {
	"input":{
		handleOnChange:true,
		getFormatted: HTMLImplementation.prototype.getValueFormatted,
		setFormatted: HTMLImplementation.prototype.setValueFormatted,
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled,
		getReadOnly: HTMLImplementation.prototype.getPropertyReadOnly,
		setReadOnly: HTMLImplementation.prototype.setPropertyReadOnly
	},
	"input text":{
		handleOnChange:true,
		getFormatted: HTMLImplementation.prototype.getValueFormatted,
		setFormatted: HTMLImplementation.prototype.setValueFormatted,
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled,
		getReadOnly: HTMLImplementation.prototype.getPropertyReadOnly,
		setReadOnly: HTMLImplementation.prototype.setPropertyReadOnly
	},
	"input password":{
		handleOnChange:true,
		getFormatted: HTMLImplementation.prototype.getValueFormatted,
		setFormatted: HTMLImplementation.prototype.setValueFormatted,
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled,
		getReadOnly: HTMLImplementation.prototype.getPropertyReadOnly,
		setReadOnly: HTMLImplementation.prototype.setPropertyReadOnly
	},
	"input date":{
		handleOnChange:true,
		getFormatted: HTMLImplementation.prototype.getValueFormatted,
		setFormatted: HTMLImplementation.prototype.setValueFormatted,
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled,
		getReadOnly: HTMLImplementation.prototype.getPropertyReadOnly,
		setReadOnly: HTMLImplementation.prototype.setPropertyReadOnly
	},
	"input image":{
		//?? handleOnChange:true,
		getFormatted: function() { return ''; },
		setFormatted: function() { return ''; }
	},
	"input button":{
		getFormatted: HTMLImplementation.prototype.getValueFormatted,
		setFormatted: HTMLImplementation.prototype.setValueFormatted,
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled
	},
	"button submit":{
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled
	},
	"input submit":{
		getFormatted: HTMLImplementation.prototype.getValueFormatted,
		setFormatted: HTMLImplementation.prototype.setValueFormatted,
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled
	},
	"button reset":{
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled
	},
	"input reset":{
		getFormatted: HTMLImplementation.prototype.getValueFormatted,
		setFormatted: HTMLImplementation.prototype.setValueFormatted,
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled
	},
	"button checkbox":{
		handleOnChange:true,
		getFormatted: HTMLImplementation.prototype.getCheckedFormatted,
		setFormatted: HTMLImplementation.prototype.setCheckedFormatted,
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled
	},
	"input checkbox":{
		handleOnChange:true,
		getFormatted: HTMLImplementation.prototype.getCheckedFormatted,
		setFormatted: HTMLImplementation.prototype.setCheckedFormatted,
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled
	},
	"input radio":{
		handleOnChange:true,
		getFormatted: HTMLImplementation.prototype.getCheckedFormatted,
		setFormatted: HTMLImplementation.prototype.setCheckedFormatted,
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled
	},
	"input file":{
		handleOnChange:true,
		getFormatted: HTMLImplementation.prototype.getValueFormatted,
		setFormatted: HTMLImplementation.prototype.setValueFormatted,
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled,
		getReadOnly: HTMLImplementation.prototype.getPropertyReadOnly,
		setReadOnly: HTMLImplementation.prototype.setPropertyReadOnly
	},
	"button":{
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled
	},
	"button button":{
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled
	},
	"textarea":{
		getFormatted: HTMLImplementation.prototype.getValueFormatted,
		setFormatted: HTMLImplementation.prototype.setValueFormatted,
		getReadOnly: HTMLImplementation.prototype.getPropertyReadOnly,
		setReadOnly: HTMLImplementation.prototype.setPropertyReadOnly,
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled
	},
	"textarea textarea":{ // mapping for IE
		getFormatted: HTMLImplementation.prototype.getValueFormatted,
		setFormatted: HTMLImplementation.prototype.setValueFormatted,
		getReadOnly: HTMLImplementation.prototype.getPropertyReadOnly,
		setReadOnly: HTMLImplementation.prototype.setPropertyReadOnly,
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled
	},
	"select":{
		handleOnChange:true,
		getFormatted: HTMLImplementation.prototype.getSelectFormatted,
		setFormatted: HTMLImplementation.prototype.setSelectFormatted,
		setOptions: HTMLImplementation.prototype.setSelectOptions,
		getEnabled: HTMLImplementation.prototype.getPropertyEnabled,
		setEnabled: HTMLImplementation.prototype.setPropertyEnabled
	},
	"fieldset":{},
	"iframe":{},
	"object":{
		getFormatted: function() { return ''; }
	},
	"a":{
		// disabled attribute support ?
	},
	"img":{
		getFormatted: function() { return ''; }
	},
	"label":{},
	"div":{},
	"span":{}
};

// IE specific mods 
if (navigator.userAgent.indexOf("MSIE/") > -1) {
	
	HTMLImplementation.MODS['input'].decorate = HTMLImplementation.prototype.ieButtonDecorate;
}

