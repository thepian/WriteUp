/**
 * Forms are normally constructed and managed by the HTMLForm.get function
 * 
 * @param {HTMLTemplate} oTemplate Template instance
 * @param {Map} mOptions Map of options, normally shared with the template constructor
 */
HTMLForm = function(oTemplate,mOptions)
{
	this.m_oTemplate = oTemplate;
	this.m_mOptions = mOptions;
};

/**
 * Create an instance of the form
 * 
 * @param {Map} mHandlers Handler functions for Data & Elements
 * @param {Map} mOptions Options for how to render
 * @param {String} mOptions.tag Tag name of the form element, defaults to 'form'
 * 
 * @return Form Element to be added to DOM
 */
HTMLForm.prototype.render = function(mHandlers,mOptions)
{
	mOptions = mOptions || {};
	mHandlers = mHandlers || {};
	var oFormData = new HTMLFormData(mOptions.instance,mHandlers,this.m_oTemplate.m_mExtras);
	var eForm = this._createForm(mOptions.tag || "form", mOptions.attributes || {}, oFormData,	mHandlers, mOptions.instance);
	oFormData.block.set = true;
	oFormData.block.reflect = true;

	oFormData.ensureLifecycleTriggers("implementation",eForm);
	oFormData.ensureLifecycleTriggers("renderer",eForm);
	
	// Instantiate Data Handlers for fields defined with "data-" attributes
	// We know the data entries as the template is parsed already
	oFormData.ensureDataTriggers("reset",eForm);
	oFormData.ensureDataTriggers("set",eForm);
	oFormData.ensureMappingTriggers("mapping",eForm);
	
	// Reset all data to initial values before controls are made that need them
	oFormData.fireAllDataTriggers("reset",eForm, "default","init"); 
	
	eForm.data.ensureTriggers(eForm);
	
	// render template with controls in a FORM element
	eForm.bound.form = eForm; 
	var mTextNodes = {}; // Ignored
	var eFragment = this.m_oTemplate.render(eForm.bound,mTextNodes,oFormData.values);
	eForm.appendChild(eFragment);

	// Button default type = "button"
	var pButtons = eForm.getElementsByTagName("button");
	for(var i=0,l=pButtons.length; i<l; ++i) {
		var eButton = pButtons[i];
		if (eButton.getAttribute("type") == null) {
			eButton.setAttribute("type","button");
		}
	}
	
	oFormData.block.reflect = false;
	
	// populate controls
	oFormData.triggerQueuedReflections();

	oFormData.block.set = false;
	
	return eForm;
};

/**
 * form.bound - data bound elements
 * 
 * @private
 */
HTMLForm.prototype._createForm = function(sTag,mAttributes,oFormData,mHandlers,oInstance)
{
	var eForm = document.createElement(sTag);
	
	// apply HTML attributes
	if (mAttributes) {
		for(var n in mAttributes) {
			eForm.setAttribute(n,mAttributes[n]);
		}
	} else {
		if (sTag == "form") {
			eForm.setAttribute("method","none");
			eForm.setAttribute("action","");
		}
	}
	
	eForm.instance = oInstance;
	
	// Add form element maps
	eForm.bound = {};
	eForm.data = oFormData;
	//TODO access key map
	//TODO tab order
	//TODO lookups
	
	// Tie in the HTMLForm for now
	eForm.htmlForm = this;
	
	// Add form element methods
	var ELEMENT_METHODS = HTMLForm.ELEMENT_METHODS
	for(var n in ELEMENT_METHODS) {
		if (eForm[n]) {
			eForm["_" + n] = eForm[n];
		}
		eForm[n] = ELEMENT_METHODS[n];
	}

	// Submit handler for <button type="submit"> (TODO refine scope)	
	eForm.onsubmit = function(ev) {
		var mData = this.data;
		if (mData.triggers.submit_command) {
			mData.triggers.submit_command(); //TODO review alternative: this as the form element
		}
		var sAction = this.getAttribute("action");
		if (sAction == null || sAction == "") return false; // don't submit
	};
	
	// Reset handler for <button type="reset"> (TODO refine scope)	
	eForm.onreset = function(ev) {
		// Reset all data to initial values before controls are made that need them
		this.data.block.set = true;
		this.data.fireAllDataTriggers("reset", this, "default","all");
		this.data.block.set = false;
		
		//TODO update all controls with the data 
	}

	
	return eForm;
};

/** @private */
HTMLForm.ELEMENT_METHODS = {
	forget: function() {
		// undecorates implementations on elements
		// unbinds all renderers on elements
		// notifies implementation handlers
		var mElements = this.bound;
		for(var i=0,l=mElements.length,e; (e = mElements[i]) && i<l; ++i) {
			if (e.data) {
				e.data.forget();
			}
			if (e.implementation) {
				e.implementation.forgetControlImplementation(e,this);
			}
			e.data = null;
			e.implementation = null;
		}
		if (this.implementation) {
			this.implementation.callCleaners(this);
		}
		if (this.data) this.data.forget();
		this.data = null;
		this.instance = null;
		this.bound = null;
	},
	submit: function() {
		var mData = this.data;
		if (mData.triggers.submit_command) {
			mData.triggers.submit_command(); //TODO review alternative: this as the form element
		}
		var sAction = this.getAttribute("action");
		if (sAction) {
			var _submit = this._submit;
			if (_submit) return _submit.apply(this,arguments);
		}
	},
	
	reset: function() {
		var _reset = this._reset;
		if (_reset) return _reset.apply(this,arguments);

		// Reset all data to initial values before controls are made that need them
		this.data.block.set = true;
		this.data.fireAllDataTriggers("reset", this, "default","all");
		this.data.block.set = false;
		
		//TODO update all controls with the data 
	},
//	item: function(nIndex) {
//		var _checkValidity = this._checkValidity;
//		if (_checkValidity) _checkValidity.apply(this,arguments);
//		
//	},
//	namedItem: function(sName) {
//		var _checkValidity = this._checkValidity;
//		if (_checkValidity) _checkValidity.apply(this,arguments);
//		
//	},
	checkValidity: function() {
		var _checkValidity = this._checkValidity;
		if (_checkValidity) return _checkValidity.apply(this,arguments);
	},
	//TODO remap - update access key mappings
	dispatchFormInput: function() {
		var _dispatchFormInput = this._dispatchFormInput;
		if (_dispatchFormInput) return _dispatchFormInput.apply(this,arguments);
	},
	dispatchFormChange: function() {
		var _dispatchFormChange = this._dispatchFormChange;
		if (_dispatchFormChange) return _dispatchFormChange.apply(this,arguments);
	}	
};

/**
 * @private
 */
HTMLForm.CACHE = {};

/**
 * Class being instantiated by the get function
 * This should only be overridden in exceptional circumstances
 */
HTMLForm.CLASS = HTMLForm;

/**
 * Forms will be looked up on the HTMLTemplate default by default
 */
HTMLForm.defaultDocument = null;

/**
 * @private
 */
HTMLForm._get = function(sName,oDocument,mCache)
{
    if (mCache[sName]) {
        return mCache[sName];
    }
	var oTemplate = caplin.dom.HTMLTemplate._get(sName,oDocument);
	var oForm = new HTMLForm.CLASS(oTemplate, oTemplate? oTemplate.m_mOptions : null);
	 
   return oForm;
};


/**
 * 
 * @param {String} sName
 * @param {Object} oDocument
 */ 
HTMLForm.get = function(sName,oDocument)
{
    oDocument = oDocument || HTMLForm.defaultDocument;
	
    var oForm = this._get(sName,oDocument,this.CACHE);
	if (oForm && oForm.m_oTemplate) {
		return oForm;
	}
    throw new Error("Failed to get template for form '"+sName+"' from "+((oDocument || document).defaultView || window).location.href);
};


/* ********************************** *
 *  Form Template Attribute Handlers
 * ********************************** */

/**
 * Template Handler for 'data-namespace' attributes.
 *  
 * @param {Object} pStack
 * @param {Object} sAttrName
 */
caplin.dom.HTMLTemplate.ATTRIBUTES["data-namespace"] = function(pStack,mExtras,sAttrName,sModelName)
{
	// no decoration of data-namespace nodes
	return null;
};

/**
 * @private
 * Tags that support command attribute
 */
HTMLForm.COMMAND_TAGS = {
	"input":true,
	"INPUT":true,
	"button":true,
	"BUTTON":true,
	"div":true,
	"DIV":true
};

/**
 * @private
 * Tags that support data-action attribute
 */
HTMLForm.DATA_ACTION_TAGS = {
	"input":true,
	"button":true,
	"INPUT":true,
	"BUTTON":true
};

/**
 * @private
 * Handlers supported for data-action attribute
 */
HTMLForm.DATA_ACTIONS = {
	"reset":true,
	"increase":true,
	"decrease":true,
	"toggle":true
};

HTMLForm._addToElements = function(mElements,mNames,eClone)
{
	if (mElements[mNames.full] == undefined) {
		mElements[mNames.full] = [];
	}
	mElements[mNames.full].push(eClone);
	mElements.length = (mElements.length || 0) + 1;
	mElements[mElements.length -1] = eClone; //TODO array?
};

/** @private */
HTMLForm.COMMAND_LISTENERS = {};

HTMLForm.COMMAND_LISTENERS.click = function(e) {
	// specific to control
	var eForm = this.form; // TODO
	this.data.fireTrigger("command",eForm);
}; 

/**
 * Template Handler for 'command' attributes.
 *  
 * @param {Object} pStack
 * @param {Object} sAttrName
 */
caplin.dom.HTMLTemplate.ATTRIBUTES["command"] = function(pStack,mExtras,sAttrName,sCommand)
{
	// Only on supported HTML tags
	if (!HTMLForm.COMMAND_TAGS[this.tagName]) return;

	var oTemplateImplementation = HTMLImplementation.get(this);
	if (this.tagName.toLowerCase() == "button") {
		this.setAttribute("type","button"); // ignore default of "submit"
	}
	var mNames = HTMLFormData.makeNames(pStack);

	// instantiate handler the clone of mElements['form'].handlers
	return function(mElements,mTextNodes,mValues,eClone) {
		var eForm = mElements.form;
		eForm.data.ensureControlData(eClone,mNames);
		if (eClone.implementation == undefined) {
			//TODO use names fro data-name/name attribute
			eClone.implementation = oTemplateImplementation.makeControlImplementation(eClone,eForm,mNames);
		}
		eClone.data.ensureControlTriggers(eClone,eForm,sCommand);
		eClone.implementation.addEventListeners(eClone,HTMLForm.COMMAND_LISTENERS,false);
	};
};

caplin.dom.HTMLTemplate.ATTRIBUTES["data-default"] = function(pStack,mExtras,sAttrName,sDataDefault)
{
	if (mExtras.mDefaults == undefined) mExtras.mDefaults = {};
	
	var sDataName = this.getAttribute("data-name");
	var mNames = HTMLFormData.makeNames(pStack,sDataName);
	if (sDataDefault != undefined && mNames.name) {
		if (sDataDefault != undefined) mExtras.mDefaults[mNames.full] = caplin.dom.HTMLTemplate.parseConstantString(sDataDefault);
	}
};

/** @private */
HTMLForm.DATA_NAME_LISTENERS = {};

/** @private */
HTMLForm.DATA_NAME_LISTENERS.change = function(oEvent)
{
	var oData = this.data;
	var oEntry = oData.values[oData.full];
	var eForm = this.form; // TODO improve
	if (!oEntry.editing) {
		oData.fireTrigger("changebegin",eForm,oEntry,oEntry.value,oEvent); //TODO parameters
		oData.fireTrigger("editbegin",eForm,oEntry,oEntry.value,"single")
	}
	oEntry.editing = false;
	
	//TODO formchange for other controls
	var vValue = this.implementation.getFormatted(this);
	oData.fireTrigger("change",eForm,oEntry,vValue);
	this.data.set(oData.namespace,oData.name,vValue,"editdone");
};

HTMLForm.DATA_NAME_LISTENERS.keypress = function(oEvent)
{
	var oData = this.data;
	var oEntry = oData.values[oData.full];
	var eForm = this.form; // TODO improve
	if (!oEntry.editing) {
		oData.fireTrigger("changebegin",eForm,oEntry,oEntry.value); //TODO parameters
		oData.fireTrigger("editbegin",eForm,oEntry,oEntry.value,"single");
		oEntry.editing = true;
	}
	//TODO fire forminput
	var vValue = this.implementation.getFormatted(this);
	oData.fireTrigger("input",eForm,oEntry,vValue,oEvent); //TODO parameters
};

// cut / past events

// select DOMActivate DOMFocusIn DOMFocusOut click dblclick focus blur mouseover mouseout

/**
 * Template Handler for 'data-name' attributes.
 *  
 * @param {Object} pStack
 * @param {Object} sAttrName
 */
caplin.dom.HTMLTemplate.ATTRIBUTES["data-name"] = function(pStack,mExtras,sAttrName,sDataName)
{
	var oTemplateImplementation = HTMLImplementation.get(this);
	var sDataAction = this.getAttribute("data-action");
	var sDataLookup = this.getAttribute("data-lookup");
	if (sDataAction || sDataLookup) return null; // no renderer binding TODO refactor
	
	var sStatic = oTemplateImplementation.getFormattedNative(this);
	// only set html value if !action & !lookup
	var mNames = HTMLFormData.makeNames(pStack,sDataName,sStatic);
	HTMLFormData.register(mExtras,mNames);
	//TODO pass template element value to model as initial value
	
	// decorate the clone
	return function(mElements,mTextNodes,mValues,eClone) {
		var eForm = mElements.form;
		eForm.data.ensureControlData(eClone,mNames);
		eClone.data.setDataName(mNames);
//		eClone.data.setDataList("data-name",mNames);
		if (eClone.implementation == undefined) {
			eClone.implementation = oTemplateImplementation.makeControlImplementation(eClone,eForm,mNames);
		}
		var oImplementation = eClone.implementation;
		
		if (oImplementation.updateFields) {
			// getAllFieldNames from FormView
			eForm.data.addReflection(mNames, {
				implementation: oImplementation,
				form: eForm,
				element: eClone,
				target: "fields",
				source: "all"
			});
		} else {
			eForm.data.addReflection(mNames, {
				implementation: oImplementation,
				form: eForm,
				element: eClone,
				target: "formatted",
				source: "value"
			});
		}
		
		HTMLForm._addToElements(mElements,mNames,eClone);

		eClone.data.ensureControlTriggers(eClone,eForm);
		if (oImplementation.handleOnChange) {

			eClone.data.ensureDataTriggers("editbegin",eForm);
			if (eClone.data.triggers.editbegin || eClone.data.triggers.changebegin) {
//				eClone.onfocus = onFocus;
			}
			eClone.data.ensureDataTriggers("editdone",eForm);
			eClone.implementation.addEventListeners(eClone,HTMLForm.DATA_NAME_LISTENERS,false);
		}
	};
};

/**
 * Template Handler for 'data-enabled' attributes.
 *  
 * @param {Object} pStack
 * @param {Object} sAttrName
 */
caplin.dom.HTMLTemplate.ATTRIBUTES["data-readonly"] = function(pStack,mExtras,sAttrName,sDataName)
{
	var oTemplateImplementation = HTMLImplementation.get(this);

	var bStatic = oTemplateImplementation.getReadOnly(this);
	var mNames = HTMLFormData.makeNames(pStack,sDataName,bStatic);
	HTMLFormData.register(mExtras,mNames);

	// decorate the clone
	return function(mElements,mTextNodes,mValues,eClone) {
		var eForm = mElements.form;
		eForm.data.ensureControlData(eClone,mNames);
		eClone.data.setDataList("data-readonly",mNames);
		if (eClone.implementation == undefined) {
			//TODO use names fro data-name/name attribute
			eClone.implementation = oTemplateImplementation.makeControlImplementation(eClone,eForm, mNames);
		}
		eForm.data.addReflection(mNames, {
			implementation: eClone.implementation,
			form: eForm,
			element: eClone,
			target: "readonly",
			source: "value"
		});
		HTMLForm._addToElements(mElements,mNames,eClone);
	};
};

/** @private */
HTMLForm.DATA_ACTION_LISTENERS = {};

/** @private */
HTMLForm.DATA_ACTION_LISTENERS.click = function(oEvent)
{
	var oData = this.data;
	var oEntry = oData["data-action"][0]? oData["data-action"][0].entry : null;
	var eForm = this.form; // TODO improve
	if (oEntry && !oEntry.editing) {
		oData.fireTrigger("changebegin",eForm,oEntry,oEntry.value); //TODO parameters
		oData.fireTrigger("editbegin",eForm,oEntry,oEntry.value,"single");
		oEntry.editing = true;
	}
	if (oEntry) {
		oEntry.editing = false;
	}
	
	var sDataConstant = this.getAttribute("data-constant");
	var vDataConstant = sDataConstant == null? null : caplin.dom.HTMLTemplate.parseConstantString(sDataConstant);
	var sAction = this.getAttribute("data-action");

	oData.block.set = true;
	if (oEntry && oEntry.name) {
		if (sDataConstant != null && sAction != "toggle") { // attribute is defined
			var vValue = typeof vDataConstant == "function"? vDataConstant() : vDataConstant;
		} else {
			
			//TODO move to FormData and improve "reset" default
			var defaults = {
				reset: oEntry.attribute || oEntry.html,
				toggle: oEntry.value,
				increase: 1,
				decrease: 1
			};
			var vValue = defaults[sAction] !== undefined? defaults[sAction] : oEntry.html;
		}
		oData.fireTrigger(sAction,eForm,oEntry,vValue,"single");
		oData.fireTrigger("change",eForm,oEntry,vValue,oEvent);
	} else {
		oData.fireAllDataTriggers(sAction,this.form, "default","all"); 
	}
	oData.block.set = false;
};

if (navigator.userAgent.indexOf("Trident/") > -1) {
	HTMLForm.DATA_ACTION_LISTENERS.dblclick =
	HTMLForm.DATA_ACTION_LISTENERS.click;
}

/**
 * Template Handler for 'data-action' attributes.
 *  
 * @param {Object} pStack
 * @param {Object} sAttrName
 */
caplin.dom.HTMLTemplate.ATTRIBUTES["data-action"] = function(pStack,mExtras,sAttrName,sAction)
{
	var oTemplateImplementation = HTMLImplementation.get(this);
	
	// Only on supported HTML tags
	if (!HTMLForm.DATA_ACTION_TAGS[this.tagName]) return;
	if (!HTMLForm.DATA_ACTIONS[sAction]) return;
	if (this.tagName.toLowerCase() == "button") {
		this.setAttribute("type","button"); // ignore default of "submit"
	}

	var sDataConstant = this.getAttribute("data-constant");
	var vDataConstant = sDataConstant == null? null : caplin.dom.HTMLTemplate.parseConstantString(sDataConstant);
	
	// Determine full name from "data-name" attribute	
	var sDataName = this.getAttribute("data-name");
	var mNames = HTMLFormData.makeNames(pStack,sDataName);
	if (mNames.name) {
		HTMLFormData.register(mExtras,mNames);
	}
	// Else namespace?
	
	// instantiate handler the clone of mElements['form'].handlers
	return function(mElements,mTextNodes,mValues,eClone) {
		var eForm = mElements.form;
		eForm.data.ensureControlData(eClone,mNames);
		eClone.data.setDataName(mNames);
		eClone.data.setDataList("data-action",mNames);
		if (eClone.implementation == undefined) {
			//TODO use names from data-name/name attribute
			eClone.implementation = oTemplateImplementation.makeControlImplementation(eClone,eForm,mNames);
		}

		eClone.data.ensureControlTriggers(eClone,eForm);
		eClone.data.ensureDataTriggers(sAction,eForm);
		eClone.data.ensureDataTriggers("editbegin", eForm);
		eClone.data.ensureDataTriggers("editdone", eForm);
		eClone.implementation.addEventListeners(eClone,HTMLForm.DATA_ACTION_LISTENERS,false);
	};
};

/** @private */
HTMLForm.DATA_LOOKUP_LISTENERS = {};

/** @private */
HTMLForm.DATA_LOOKUP_LISTENERS.mouseup = function(oEvent)
{
	var oData = this.data;
	var oEntry = oData["data-lookup"][0].entry;
	var eForm = this.form; // TODO improve

	if (!oEntry.editing) {
		oEntry.editing = true;
		oData.fireTrigger("changebegin",eForm,oEntry,oEntry.value,oEvent); //TODO parameters
		oData.fireTrigger("editbegin",eForm,oEntry,oEntry.value,"single");
	}
	
};

///** @private */
//HTMLForm.DATA_LOOKUP_LISTENERS.mousedown = function(oEvent)
//{
//	caplin.core.Logger.log(caplin.core.LogLevel.INFO, "mouse down lookup");
//};	

///** @private */
//HTMLForm.DATA_LOOKUP_LISTENERS.mouseup = function(oEvent)
//{
//	caplin.core.Logger.log(caplin.core.LogLevel.INFO, "mouse up lookup");
//};	

/** @private */
HTMLForm.DATA_LOOKUP_LISTENERS.change = function(oEvent)
{
	var oData = this.data;
	var oEntry = oData["data-lookup"][0].entry;
	var eForm = this.form; // TODO improve
	if (!oEntry.editing) {
		oData.fireTrigger("changebegin",eForm,oEntry,oEntry.value,oEvent); //TODO parameters
		oData.fireTrigger("editbegin",eForm,oEntry,oEntry.value,"single");
	}
	oEntry.editing = false;
	
	var sDataConstant = this.getAttribute("data-constant");
	var vDataConstant = sDataConstant == null? null : caplin.dom.HTMLTemplate.parseConstantString(sDataConstant);
	var sLookup = this.getAttribute("data-lookup");

	oData.block.set = true;
	
	oEntry.editing = false;
	
	//TODO formchange for other controls
	var vValue = this.implementation.getFormatted(this);
	oData.fireTrigger("changebegin",eForm,oEntry,vValue,oEvent); //TODO parameters
	oData.set(oEntry.namespace,oEntry.name,vValue,"editdone");
	
	oData.block.set = false;
};

//TODO listen to arrows in firefox to trap changes
//TODO perhaps setting size attribute on the select element will fix FF
// http://bytes.com/topic/javascript/answers/158340-change-event-select-firefox-doesnt-fire-when-using-cursor-keys

/**
 * Template Handler for 'data-lookup' attributes.
 *  
 * @param {Object} pStack
 * @param {Object} sAttrName
 */
caplin.dom.HTMLTemplate.ATTRIBUTES["data-lookup"] = function(pStack,mExtras,sAttrName,sLookup)
{
	var oTemplateImplementation = HTMLImplementation.get(this);
	
	if (this.tagName.toLowerCase() == "button") {
		this.setAttribute("type","button"); // ignore default of "submit"
	}
	// Determine full name from "data-name" attribute	
	var sDataName = this.getAttribute("data-name");
	var mNames = HTMLFormData.makeNames(pStack,sDataName);
	if (mNames.name) {
		HTMLFormData.register(mExtras,mNames);
	}
	// Else namespace?
	
	var sDataDepends = this.getAttribute("data-depends");
	var mDataDepends = HTMLFormData.makeNames(pStack,sDataDepends);

	// decorate the clone
	return function(mElements,mTextNodes,mValues,eClone) {
		var eForm = mElements.form;
		eForm.data.ensureControlData(eClone,mNames);
		eClone.data.setDataName(mNames);
		eClone.data.setDataList("data-lookup",mNames);

		//TODO setDataUrl eClone.data.setDataList("data-lookup",mNames);
		if (eClone.implementation == undefined) {
			//TODO use names from data-name/name attribute
			eClone.implementation = oTemplateImplementation.makeControlImplementation(eClone,eForm,mNames);
		}

		eClone.data.ensureControlTriggers(eClone,eForm);
		eClone.data.ensureDataTriggers("editbegin", eForm);
		eClone.data.ensureDataTriggers("editdone", eForm);
		eClone.data.ensureLookupTrigger("lookup",eForm, sLookup);
		eClone.implementation.addEventListeners(eClone,HTMLForm.DATA_LOOKUP_LISTENERS,false);

		eForm.data.addReflection(mNames, {
			implementation: eClone.implementation,
			form: eForm,
			element: eClone,
			target: "formatted",
			source: "value"
		});
		
		//TODO setKey / setInternal value
//		eForm.data.addDependency(mDataDepends, {
//			entry: ?
//			event: "lookup",
//			form: eForm,
//			element: eClone,
//			params: [sLookup,"change"],
//			implementation: eClone.implementation,
//			target: "options",
//			source: "trigger"
//		});
		
		var pValues = eClone.data.fireTrigger(sLookup+"_lookup",eForm,null,"init");
		//TODO map values to objects
		var pValues2 = pValues;
		eClone.implementation.setOptions(eClone,pValues2);
	};
};

/**
 * Template Handler for 'data-enabled' attributes.
 *  
 * @param {Object} pStack
 * @param {Object} sAttrName
 */
caplin.dom.HTMLTemplate.ATTRIBUTES["data-enabled"] = function(pStack,mExtras,sAttrName,sEnabledName)
{
	var oTemplateImplementation = HTMLImplementation.get(this);

	var bStatic = oTemplateImplementation.getEnabled(this);
	var mNames = HTMLFormData.makeNames(pStack,sEnabledName,bStatic);
	HTMLFormData.register(mExtras,mNames);
//	var sDataName = this.getAttribute("data-name");
//	var mDataNames = HTMLFormData.makeNames(pStack,sDataName);

	// decorate the clone
	return function(mElements,mTextNodes,mValues,eClone) {
		var eForm = mElements.form;
		eForm.data.ensureControlData(eClone,mNames);
		eClone.data.setDataList("data-enabled",mNames);
		if (eClone.implementation == undefined) {
			//TODO use names fro data-name/name attribute
			eClone.implementation = oTemplateImplementation.makeControlImplementation(eClone,eForm, mNames);
		}
		eClone.data.enabled = mNames;//TODO for others

		eForm.data.addReflection(mNames, {
			implementation: eClone.implementation,
			form: eForm,
			element: eClone,
			target: "enabled",
			source: "value"
		});
		HTMLForm._addToElements(mElements,mNames,eClone);
	};
};

/**
 * Template Handler for 'data-visible' attributes.
 *  
 * @param {Object} pStack
 * @param {Object} sAttrName
 */
caplin.dom.HTMLTemplate.ATTRIBUTES["data-visible"] = function(pStack,mExtras,sAttrName,sDataName)
{
	var oTemplateImplementation = HTMLImplementation.get(this);
	var sStatic = this.style.visibility || "visibility";
	var mNames = HTMLFormData.makeNames(pStack,sDataName,sStatic);
	HTMLFormData.register(mExtras,mNames);

	// decorate the clone
	return function(mElements,mTextNodes,mValues,eClone) {
		var eForm = mElements.form;
		eForm.data.ensureControlData(eClone,mNames);
		eClone.data.setDataList("data-visible",mNames);
		if (eClone.implementation == undefined) {
			//TODO use names fro data-name/name attribute
			eClone.implementation = oTemplateImplementation.makeControlImplementation(eClone,eForm,mNames);
		}

		eForm.data.addReflection(mNames, {
			implementation: eClone.implementation,
			form: eForm,
			element: eClone,
			target: "style.visible",
			source: "value"
		});
		HTMLForm._addToElements(mElements,mNames,eClone);
	};
};

/**
 * Template Handler for 'data-display' attributes.
 *  
 * @param {Object} pStack
 * @param {Object} sAttrName
 */
caplin.dom.HTMLTemplate.ATTRIBUTES["data-display"] = function(pStack,mExtras,sAttrName,sDataName)
{
	var oTemplateImplementation = HTMLImplementation.get(this);
	var sStatic = this.style.display;
	var mNames = HTMLFormData.makeNames(pStack,sDataName,sStatic);
	HTMLFormData.register(mExtras,mNames);

	// decorate the clone
	return function(mElements,mTextNodes,mValues,eClone) {
		var eForm = mElements.form;
		eForm.data.ensureControlData(eClone,mNames);
		eClone.data.setDataList("data-display",mNames);
		if (eClone.implementation == undefined) {
			//TODO use names fro data-name/name attribute
			eClone.implementation = oTemplateImplementation.makeControlImplementation(eClone,eForm,mNames);
		}

		eForm.data.addReflection(mNames, {
			implementation: eClone.implementation,
			form: eForm,
			element: eClone,
			target: "style.display",
			source: "value"
		});
		HTMLForm._addToElements(mElements,mNames,eClone);
	};
};

/**
 * Template Handler for 'data-class' attributes.
 *  
 * @param {Object} pStack
 * @param {Object} sAttrName
 */
caplin.dom.HTMLTemplate.ATTRIBUTES["data-class"] = function(pStack,mExtras,sAttrName,sDataName)
{
	var oTemplateImplementation = HTMLImplementation.get(this);
	var sStatic = oTemplateImplementation.getClass(this);
	var mNames = HTMLFormData.makeNames(pStack,sDataName,sStatic);
	HTMLFormData.register(mExtras,mNames);

	// decorate the clone
	return function(mElements,mTextNodes,mValues,eClone) {
		var eForm = mElements.form;
		eForm.data.ensureControlData(eClone,mNames);
		eClone.data.setDataList("data-class",mNames);
		if (eClone.implementation == undefined) {
			//TODO use names fro data-name/name attribute
			eClone.implementation = oTemplateImplementation.makeControlImplementation(eClone,eForm,mNames);
		}
		eForm.data.addReflection(mNames, {
			implementation: eClone.implementation,
			form: eForm,
			element: eClone,
			target: "class",
			source: "setset"
		});
		HTMLForm._addToElements(mElements,mNames,eClone);
	};
};
