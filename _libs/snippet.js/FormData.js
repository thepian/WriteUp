
/**
 * @beta
 * @private
 * Structure internal to HTMLForm
 * An instance is created for the form element and each of the controls
 */
HTMLFormData = function(oInstance,mHandlers,mExtras)
{
	this.namespaces = {};
	this.values = {};
	if (mExtras) {
		for(var s in mExtras.namespaces) {
			this.namespaces[s] = { __all__: {} };
			var ns = mExtras.namespaces[s];
			for(var n in ns) {
				this._setEntry(s+"."+n,s,n,ns[n]);
			}
		}
	}

	this.handlers = mHandlers;
	this.instance = oInstance;
	this.mappings = {};

	this.block = {};	// map of blocked method notifications (so far only set is supported)
	this.formTriggers = this.triggers = {}; // form element triggers
	
};

/** @private */
HTMLFormData.prototype._setEntry = function(sFullName,sNamespace,sName,mData)
{
	mData = mData || {};
	if (this.namespaces[sNamespace] == undefined) {
		this.namespaces[sNamespace] = { __all__ : {} };
	}
	
	this.values[sFullName] =
	this.namespaces[sNamespace][sName] = {
		name: sName,
		namespace: sNamespace,
		full: sFullName,
		
		parts: mData.parts,
		html: mData.html,
		attribute: mData.attribute,
		value: mData.value,
		all: this.namespaces[sNamespace].__all__,
		
		queued: false,
		reflections: [],
		triggers: {} // data triggers
	};
};



/**
 * Registers a data entry in template extras for use in the HTMLFormData constructor
 * 
 * @param {Map} mExtras
 * @param {Map} mNames
 */
HTMLFormData.register = function(mExtras,mNames)
{
	if (mExtras.namespaces == undefined) mExtras.namespaces = {};
	if (mExtras.namespaces[mNames.namespace] == undefined) mExtras.namespaces[mNames.namespace] = {};
	for(var i=0,n; n = mNames.names[i]; ++i) {
		var mEntry = mExtras.namespaces[mNames.namespace][n];
		if (mEntry == undefined) mEntry = mExtras.namespaces[mNames.namespace][n] = {
			parts: []
		}; 
		mEntry.html = mEntry.html || caplin.dom.HTMLTemplate.parseConstantString(mNames.html);
		mEntry.parts.push(mNames.parts[i]);
	}
	//TODO set data-default
};

/**
 * Used by data linking attributes in HTMLForm
 * @private
 * @param sDataName Optional name of the data
 * @param sHtml Optional static value of the presentation data
 */
HTMLFormData.makeNames = function(pStack,sDataName,sHtml,sDefault)
{
	var pSpace = [];
	pStack.forEach(function(e){
		var sModelName = e.getAttribute("data-namespace");
		if (sModelName) {
			pSpace.push(sModelName);
		}
	});
	if (pSpace.length == 0) {
		pSpace = ["namespace"];
	}
	
	var pNames = [];
	var pParts = [];
	if (sDataName) {
		pNames = sDataName.indexOf(" ") >= 0? sDataName.split(" ") : sDataName.split(",");
		for(var i=0,n; n = pNames[i]; ++i) {
			var pExpressAndMapping = n.split(":");
			pParts[i] = /([!+-]*)(.*)/.exec(pExpressAndMapping[0]);
			pParts[i].mapping = pExpressAndMapping[1]; // name of mapping for the data entry
			pParts[i].name = pNames[i] = pParts[i][2]; // third entry is the name
		}
	}

	var sNamespace = pSpace.join(".");
	if (pNames[0]) {
		pSpace.push(pNames[0]);
		var sFullName = pSpace.join(".");
	} else {
		var sFullName = undefined;
	}
	var mNames = {
		name: pNames[0],
		namespace: sNamespace,
		full: sFullName,
		html: sHtml,
		attribute: sDefault,
		parts: pParts,
		names: pNames
	};
	
	return mNames;
};

/** @private */
HTMLFormData.prototype.forget = function()
{
	// Clear all data triggers
	for(var n in this.values) {
		if (this.values[n]) {
			var mTriggers = this.values[n].triggers;
			for(var t in mTriggers) delete mTriggers[t];
		}
	}
	// Clear form triggers
	for(var n in this.triggers) delete this.triggers[n];
};

/** @private */
HTMLFormData.HANDLERS = {
	"reset": "data", "increase":"data", "decrease":"data", "toggle":"data", 
	"set": "data", "editbegin": "data", "editdone": "data",
	
	"command": "command", // command rather than data-name 
	"lookup": "related", 
	"mapping": "related", 

	"renderer":"life",
	"implementation": "life",
	
	"change": "element", "changebegin": "element", "formchange": "element",
	"input": "element", "forminput": "element"
};


/** @private */
HTMLFormData.prototype.ensureTriggers = function(eForm)
{
	if (this.handlers.command == null) return;
	
	// Instantiate reset & submit command handlers for the form
	var mTriggers = this.triggers;
	if (mTriggers.submit_command == undefined) {
		mTriggers.submit_command = this.handlers.command.call(eForm,"form","submit",this.instance,null);
	}
//	if (mTriggers.reset_command == undefined) {
//		mTriggers.reset_command = this.command("reset",null,mElements,eForm,oForm);
//	}
};

/** @private */
HTMLFormData.prototype.DEFAULT_DATA_HANDLERS = {
	"reset": function(sNamespace,sName,oInstance,oFormData) {
		return function(vValue,sStage) {
			oFormData.set(sNamespace,sName,vValue === undefined? null : vValue);
		};
	},
	"mapping": function(sNamespace,sName,sMapping,oInstance,oFormData) {
		function notMapping(vValue) { 
			return !vValue; 
		}
		
		function nopMapping(vValue) {
			return vValue;
		}
		
		return sMapping == "not"? notMapping : nopMapping; 
	},
	"lookup": function(sNamespace,sName,sLookup,oInstance,oFormData) {
		return function(sStage) {
			return [];
		};
	},
	"set": null
};
 
/**
 * @private
 * @param {String} sEventName
 */
HTMLFormData.prototype.ensureMappingTriggers = function(sEventName,eForm)
{ 
	var fDefaultDataHandler = this.DEFAULT_DATA_HANDLERS[sEventName];
	var fDataHandler = this.handlers[sEventName] || fDefaultDataHandler; 
	if (fDataHandler != null) {
		for(var sFullName in this.values) {
			if (sFullName == null) continue; // only real names
			var mEntry = this.values[sFullName];
			
			for(var i=0,p; p = mEntry.parts[i]; ++i) {
				if (p.mapping) {
					var fTrigger = fDataHandler.call(eForm,mEntry.namespace,mEntry.name,p.mapping,this.instance,this);
					if (fTrigger == undefined && fDefaultDataHandler) {
						fTrigger = fDefaultDataHandler.call(eForm,mEntry.namespace,mEntry.name,p.mapping,this.instance,this);
					}
					mEntry.triggers[p.mapping +"_"+ sEventName] = fTrigger;
				}
			}			
		}
	}
};

/**
 * @private
 * Call on Control Data
 * @param {String} sEventName
 */
HTMLFormData.prototype.ensureLookupTrigger = function(sEventName,eForm, sLookup)
{ 
	var fDefaultDataHandler = this.DEFAULT_DATA_HANDLERS[sEventName];
	var fDataHandler = this.handlers[sEventName] || fDefaultDataHandler; 
	if (fDataHandler != null) {
		var mEntry = this.values[this.full];
		var fTrigger = fDataHandler.call(eForm,this.namespace,this.name,sLookup,this.instance,this);
		if (fTrigger == undefined && fDefaultDataHandler) {
			fTrigger = fDefaultDataHandler.call(eForm,this.namespace,this.name,sLookup,this.instance,this);
		}
		mEntry.triggers[sLookup +"_"+ sEventName] = fTrigger;
	}
};

/**
 * @private
 * @param {String} sEventName
 */
HTMLFormData.prototype.ensureDataTriggers = function(sEventName,eForm)
{ 
	var fDefaultDataHandler = this.DEFAULT_DATA_HANDLERS[sEventName];
	var fDataHandler = this.handlers[sEventName] || fDefaultDataHandler; 
	if (fDataHandler != null) {
		for(var sFullName in this.values) {
			if (sFullName == null) continue; // only real names
			var mEntry = this.values[sFullName];
			
			mEntry.triggers[sEventName] = fDataHandler.call(eForm,mEntry.namespace,mEntry.name,this.instance,this);
			if (mEntry.triggers[sEventName] == undefined && fDefaultDataHandler) {
				mEntry.triggers[sEventName] = fDefaultDataHandler.call(eForm,mEntry.namespace,mEntry.name,this.instance,this);
			}
		}
	}
};

/** @private */
HTMLFormData.prototype.fireDataTrigger = function(sAction,oThis,sName,v1,v2)
{
	if (this.values[sName] == undefined) return; // data entry unknown
	var mTriggers = this.values[sName].triggers;
	if (mTriggers[sAction]) return mTriggers[sAction].call(oThis,v1,v2);
};
 
/** @private 
 * 
 * @param {Object} sAction
 * @param {Object} sStage
 * @param {String} sValue Determines which value to use ("default" for 
 */
HTMLFormData.prototype.fireAllDataTriggers = function(sAction,oThis,sValue,sStage)
{
	for(var sFullName in this.values) {
		var mValues = this.values[sFullName];
		var mTriggers = this.values[sFullName].triggers;
		var vValue = sValue == "default"? (
			mValues.attribute === undefined? mValues.html : mValues.attribute
		) : mValues.value; 
		if (mTriggers[sAction]) mTriggers[sAction].call(oThis,vValue,sStage);	// Reset must be supported on all data
	}
};

/**
 * Called on form level 
 * 
 * @param {String} sEventName implementation or renderer
 * @param {HTMLFormElement} eForm
 */
HTMLFormData.prototype.ensureLifecycleTriggers = function(sEventName,eForm)
{
	for(var n in this.handlers) {
		if (HTMLFormData.HANDLERS[n] == "life") {
			this.triggers["init_"+n] = this.handlers[n].call(eForm,this.instance,"init");
			this.triggers["destroy_"+n] = this.handlers[n].call(eForm,this.instance,"destroy");
		}
	}	
};

/**
 * Called by the implementation for a control
 * 
 * @param {Object} sEventName
 * @param {Object} sStage
 * @param {Object} eControl
 * @param {Object} sRenderer
 * @param {Object} sNamespace
 * @param {Object} sName
 */
HTMLFormData.prototype.fireLifecycleTrigger = function(sEventName,sStage,oThis,eControl,v1,v2,v3,v4)
{
	var sAction = sStage+"_"+sEventName;
	if (this.formTriggers[sAction]) return this.formTriggers[sAction].call(oThis,eControl,v1,v2,v3,v4);
};

/**
 * Called on a the data for a control.
 * It creates missing element/command triggers
 * 
 * @param {HTMLElement} eControl
 * @param {HTMLFormElement} eForm
 * @param {String} sCommand
 */
HTMLFormData.prototype.ensureControlTriggers = function(eControl,eForm,sCommand)
{
	for(var n in this.handlers) {
		if (HTMLFormData.HANDLERS[n] == "command" && sCommand && this.triggers[n] == undefined) {
			this.triggers[n] =	this.handlers[n].call(eForm,this.namespace,sCommand,this.instance,eControl);
		}
		if (HTMLFormData.HANDLERS[n] == "element" && this.triggers[n] == undefined) {
			this.triggers[n] =	this.handlers[n].call(eForm,this.namespace,this.name,this.instance,eControl);
		}
	}	
}; 

/** @private */
HTMLFormData.prototype.fireTrigger = function(sAction,oThis,mEntry,v1,v2,v3)
{
	if (mEntry == undefined) mEntry = this.values[this.full];
	var sEvent = sAction.indexOf("_")>=0? sAction.substring(sAction.indexOf("_")+1) : sAction; 
	
	switch(HTMLFormData.HANDLERS[sEvent]) {
		case "data":
		case "related":	
			if (mEntry && mEntry.triggers[sAction]) return mEntry.triggers[sAction].call(oThis,v1,v2,v3);
			break;
		
		default: // control or form specific element triggers
			if (this.triggers[sAction]) return this.triggers[sAction].call(oThis,v1,v2,v3);
			break;
	};
};

/**
 * Called ON THE FORMS data, for a control element to ensure that FormData is created for the Control
 * 
 * @param {HTMLElement} eControl
 * @param {HTMLFormElement} eForm
 */
HTMLFormData.prototype.ensureControlData = function(eControl,mNames)
{
	if (eControl.data) return;
	
	var oControlData = eControl.data = new HTMLFormData(this.instance,this.handlers);
	oControlData.namespace = mNames.namespace;
	oControlData.name = mNames.name;
	oControlData.full = mNames.full;
	oControlData.values = this.values;
	oControlData.namespaces = this.namespaces;
	oControlData.block = this.block;
	oControlData.formTriggers = this.formTriggers;
	oControlData.mappings = {};
}; 

/**
 * 
 */
HTMLFormData.prototype.setDataName = function(mNames)
{
	this.namespace = mNames.namespace;
	this.name = mNames.name;
	this.full = mNames.full;
}; 

/**
 * 
 */
HTMLFormData.prototype.setDataList = function(sAttribute,mNames)
{
	var pList = this[sAttribute] = [];
	for(var i=0,n; n = mNames.names[i]; ++i) {
		var oRefs = pList[i] = { 
			mapping: null,
			part: mNames.parts[i],
			entry: this.namespaces[mNames.namespace][n] 
		};
	}
}; 

/**
 * 
 * @param {String} sNamespace
 * @param {String} sName
 * @param {Map} mReflection { implementation, element, target, source } 
 */
HTMLFormData.prototype.addReflection = function(mNames, mReflection) 
{
	//TODO var pDepends = eClone.data.values[mNames.full].depends = mNames.depends;

	for(var i=0,n; n = mNames.names[i]; ++i) {
		var mReflection2 = { part: mNames.parts[i], names: mNames.names, parts: mNames.parts };
		for(var m in mReflection) mReflection2[m] = mReflection[m];
		this.namespaces[mNames.namespace][n].reflections.push(mReflection2);
	}
	
};

/**
 * Mark a set of names as queued. Specify a names map or a namespace and single name.
 * 
 * @param {Map} mNames Set of names to mark
 */
HTMLFormData.prototype.markChanged = function(mNames)
{
	if (typeof mNames == "string") {
		this.namespaces[arguments[0]][arguments[1]].queued = true;
	} else {
		for(var i=0,n; n = mNames.names[i]; ++i) {
			this.namespaces[mNames.namespace][n].queued = true;
		}
	}	
		
};

HTMLFormData.prototype._triggerReflection = function(mEntry)
{
	function mapIt(vValue,mEntry,oPart,oForm) {
		if (oPart && oPart.mapping) {
			vValue = this.fireTrigger(oPart.mapping + "_mapping",oForm,mEntry,vValue);
			if (typeof vValue == "object") {
				vValue = vValue.formatted;//TODO caplin.dom.HTMLMessage.translateCode(vValue.code,vValue.formatted,vValue);
			}
		}
		return vValue;
	}
	
 	for(var i=0,r; r = mEntry.reflections[i]; ++i) {
		var vValue;
		switch(r.source) {
			//TODO "string" force it to string
			case "setset":
				var vValue = {};
				for(var i2=0,pPart;pPart = r.parts[i2]; ++i2) {
					var sName = pPart[2];
					var mEntry2 = this.namespaces[mEntry.namespace][sName];
					if (typeof mEntry2.value == "string") {
						var pValue = mEntry2.value.split(" ");
						for(var i3=0,m; m = pValue[i3]; ++i3) {
							var sValue = mapIt.call(this,m,mEntry,r.part,r.form);
							vValue[sValue] = true;
						}
					} else {
						var sValue = mapIt.call(this,mEntry2.value,mEntry,r.part,r.form).toString();
						vValue[sValue] = true;
					}
				}
				break;
			case "all": 
				vValue = mEntry.all; 
				break;
			default:
				vValue = mapIt.call(this,mEntry.value,mEntry,r.part,r.form);
				break;
		};
		r.implementation.reflect(r.element,r.target,vValue);
	}
	mEntry.queued = false;
};

HTMLFormData.prototype.triggerQueuedReflections = function()
{
	for(var sFullName in this.values) {
		var mEntry = this.values[sFullName];
		if (mEntry.queued) {
			this._triggerReflection(mEntry);
		}
	}
};
 
/* *********************** *
 *  Instantiated Presentation Values
 * *********************** */

/** 
 * @private 
 * ("namespace","name",value)
 * or
 * ("namespace",{ map }[,key list])
 * 
 * @param {Object} sNamespace
 * @param {Object} mValues
 * @param {Object} pFields
 * @param {String} sNotify Notification method name (set or editdone)
 * @param {HTMLElement} eSource Source element which will not be updated as it should already be up-to-date or refresh itself
 */
HTMLFormData.prototype.set = function(sNamespace,mValues,pFields,sNotify,eSource)
{
	var eForm = null;//TODO
	
	sNotify = sNotify || "set";
	if (this.namespaces[sNamespace] == undefined) {
		this.namespaces[sNamespace] = {};
	} 
	
	//TODO skip changes to same value
	if (typeof mValues == "string") {
		var sName = mValues;	//arguments[1];
		var vValue = pFields;	//arguments[2];
		var sFullName = sNamespace+"."+sName;
		var mEntry = this.namespaces[sNamespace][sName];
		if (mEntry == undefined) {
			this._setEntry(sFullName,sNamespace,sName,{});
		}
		this.namespaces[sNamespace].__all__[sName] =
		mEntry.value = vValue;
		if (!this.block[sNotify]) this.fireTrigger(sNotify,eForm,mEntry,vValue);
		
		mEntry.queued = true;
		
		var mToSet = {};
		mToSet[sName] = vValue;
	} else {
		var mToSet = mValues;
		if (pFields) {
			mToSet = {};
			for(var i=0,f; f=pFields[i]; ++i) {
				if (mValues[f] !== undefined) mToSet[f] = mValues[f];
			}
		}
		for(var sName in mToSet) {
			var sFullName = sNamespace+"."+sName;
			var mEntry = this.namespaces[sNamespace][sName];
			if (mEntry == undefined) {
				this._setEntry(sFullName,sNamespace,sName,{});
			}
			this.namespaces[sNamespace].__all__[sName] =
			mEntry.value = mValues[sName];
			if (sNotify && !this.block[sNotify]) this.fireTrigger(sNotify,eForm,mEntry,mValues[sName]);
			
			mEntry.queued = true;
			//TODO optimise to only call one renderer once
			//TODO delay render updateFields calls ?
		} 
	}
	if (!this.block.reflect) this.triggerQueuedReflections();
};

/** @private */
HTMLFormData.prototype.reset = function()
{
	//TODO implement	
};
