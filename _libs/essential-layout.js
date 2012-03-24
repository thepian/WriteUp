function PanelState(layout,el) {
	this.el = el;
	this.id = el.getAttribute("data-panel-id");
	this.initialClassName = this.el.className;
	this.sectionId = layout.name;
	this.sectionEl = layout.el;
	this.sectionLayout = layout;
	var pData = layout.panels[this.id] || {
		"state": { "open":true },
		"matter": { "collapsible": false }
	};
	if (pData.matter.collapsible == false) pData.state.open = true; // force open if not collapsible

	this.state = pData.state;
	this.matter = pData.matter;
	this.minWidth = parseInt(layout.matter["default-min-panel-width"]); //TODO %
	this.maxWidth = parseInt(layout.matter["default-max-panel-width"]); //TODO %
	this.minExpandedHeight = parseInt(layout.matter["default-min-panel-expanded-height"]);
	if (this.matter["min-panel-expanded-height"] != undefined) {
		this.minExpandedHeight = parseInt(this.matter["min-panel-expanded-height"]);
	}
	this.minCollapsedHeight = parseInt(layout.matter["default-min-panel-collapsed-height"]);
	if (this.matter["min-panel-collapsed-height"] != undefined) {
		this.minCollapsedHeight = parseInt(this.matter["min-panel-collapsed-height"]);
	}
	

	this.reflectInClassName();
}

PanelState.prototype.measure = function()
{
	this.height = Math.max(this.el.offsetHeight,this.state.open? this.minExpandedHeight : this.minCollapsedHeight);
};

PanelState.prototype.reflectInClassName = function()
{
	this.el.className = this.initialClassName + " " + (this.state.open? "panel-open" : "panel-closed");	
};

PanelState.prototype.getInitialSectionClass = function()
{
	var classId = this.id.replace(/\//,"_");
	var openClass = classId+"-in-"+this.sectionId+ "-open", closedClass = classId+"-in-"+this.sectionId+ "-closed";			
	return this.state.open? openClass : closedClass;	
};

PanelState.prototype.collapse = function()
{
	var openClass = this.id+"-in-"+this.sectionId+ "-open", closedClass = this.id+"-in-"+this.sectionId+ "-closed";			
	var sectionClass = this.sectionEl.className;

	this.sectionEl.className = sectionClass.replace(openClass,closedClass);				
	this.state.open = false;
	this.reflectInClassName();
	this.changed = true; // perhaps just keep a saved copy instead
	this.sectionLayout.changed = true;
	PageEnhancer.INSTANCE.needReflow = true;
	this.measure();
};

PanelState.prototype.expand = function()
{
	var openClass = this.id+"-in-"+this.sectionId+ "-open", closedClass = this.id+"-in-"+this.sectionId+ "-closed";			
	var sectionClass = this.sectionEl.className;

	this.sectionEl.className = sectionClass.replace(closedClass,"") + " " + openClass;				
	this.state.open = true;
	this.reflectInClassName();
	this.changed = true; // perhaps just keep a saved copy instead
	this.sectionLayout.changed = true;
	PageEnhancer.INSTANCE.needReflow = true;
	this.measure();
};

PanelState.prototype.toggleOpen = function()
{
	if (this.state.open) this.collapse();
	else this.expand();
};

function LayoutState(name,config,el) {
	this.name = name;
	this.el = el;
	// .state
	// .panels
	for(var n in config) {
		this[n] = config[n];
	}
	if (! this.matter) this.matter = {};

	this.logicWidth = this.matter.widths? 0 : null;
	this.logicHeight = this.matter.heights? 0 : null;
}

var NEXT_IN_ORDER = 0;

function SectionLayoutState(name,config,el,contentEl) {
	this.contentEl = contentEl;
	this.initialClass = el.className;
	this.areaName = el.getAttribute("in-area");
	if (el.getAttribute("hidden") == null) {
		this.inOrder = NEXT_IN_ORDER++;
	}

	LayoutState.call(this,name,config,el);
}
SectionLayoutState.prototype = LayoutState.prototype;

function AreaLayoutState(name,config,el) {
	LayoutState.call(this,name,config,el);
	this.nextInOrder = 0;
}
AreaLayoutState.prototype = LayoutState.prototype;

SectionLayoutState.prototype.getAreaClasses = function()
{
	return "in-"+this.areaName+"-area";	
};

SectionLayoutState.prototype.getOrderClasses = function()
{
	var cls = "in-" + this.areaName + "-area-order-" + this.inOrderArea + " in-order-" + this.inOrder;

	if (this.lastInOrder) {
		cls += " in-order-last";
	}
	if (this.lastInOrderArea) {
		cls += " in-" + this.areaName +"-area-order-last";
	}
	return cls;
};

SectionLayoutState.prototype.updateClasses = function()
{
	this.el.className = this.initialClass + " " + this.getOrderClasses();
};

AreaLayoutState.prototype.newSection = function(sectionLayout)
{
	if (sectionLayout.inOrder != undefined) {
		sectionLayout.inOrderArea = this.nextInOrder++;
		this.lastInOrder = sectionLayout;
		sectionLayout.updateClasses();
	}
};

AreaLayoutState.prototype.markLastSection = function()
{
	if (this.lastInOrder) {
		this.lastInOrder.lastInOrderArea = true;
		this.lastInOrder.updateClasses()
	}
};

AreaLayoutState.prototype.updateContextClass = function()
{
	// updates the class for the common context

	var areas = this.el.areas;
	var className = this.el.className;


	var classes = [];
	for(var i=0,a; a=areas[i]; ++i) {
		if (a.active) {
			classes.push(a.name + "-area-active");
		}
		if (a.page != undefined) {
			classes.push(a.name + "-area-page-"+a.page);
		}
		var sections = PageEnhancer.INSTANCE.sectionLayouts;
		if (a.state.active in sections) {
			var activeSection = sections[a.state.active]
			if (activeSection.inOrderArea != undefined) {
				classes.push("in-"+a.name+"-area-order-"+activeSection.inOrderArea+"-active");
			}
		}

		if (a.state.open != undefined) {
			classes.push(a.name + "-area-" + (a.state.open? "open":"closed"));
		}
		if (a.logicHeight != null) {
			var defaultHeight = 0 || a.matter["default-height"];
			var height = a.state.height != undefined? a.state.height : defaultHeight;
			for(var i=0,h; h = a.matter.heights[i]; ++i) {
				if (h === height) a.logicHeight = i;
			}

			classes.push( a.name + "-area-height-" + a.matter.heights[a.logicHeight] );
			// console.log(this.name,"Area class", areaClass);
		}
	}
	var newClassName = this.el.initialClass + " " + classes.join(" ");

	if (className != newClassName) {
		PageEnhancer.INSTANCE.needTrackTheDriven = true;	
		this.el.className = newClassName;
	}
};

AreaLayoutState.prototype.mainPageLeft = function()
{
	if (this.page == undefined) {
		this.page = 0;
	}
	else if (this.page > 0) {
		--this.page;
		this.updateContextClass();
	}
};

AreaLayoutState.prototype.mainPageRight = function()
{
	if (this.page == undefined) {
		this.page = 1;
		this.updateContextClass();
	}
	else if (this.page < 2) {
		++this.page;
		this.updateContextClass();
	}
};



LayoutState.prototype.findMembers = function()
{
	var inArea = Array.prototype.slice.call( this.querySelectorAll("*[in-area="+this.name+"]") );
	var inDeck = Array.prototype.slice.call( this.querySelectorAll("*[in-deck="+this.name+"]") );
	var inProgression = Array.prototype.slice.call( this.querySelectorAll("*[in-progression="+this.name+"]") );
	
	this.members = inArea.concat(inArea).concat(inProgression);
};

LayoutState.prototype.findPanels = function()
{
	var layout = this;
	this.panelElements = this.querySelectorAll(".panel",this.el);
	var panelStates = this.panelStates = [];
	var stateClasses = [];
	this.panelElements.forEach(function(el){
		var panelState = new PanelState(layout,el);
		el.state = el.panelState = panelState;
		panelStates.push(panelState);
		stateClasses.push(panelState.getInitialSectionClass());
		panelState.measure();
	});
	this.el.className += " " + stateClasses.join(" ");

	var panelOpenToggles = this.querySelectorAll("*[data-panel-open-toggle]",this.el);
	panelOpenToggles.forEach(function(el){
		var panelEl = el;
		while(panelEl && panelEl.panelState == undefined) panelEl = panelEl.parentNode;
		function panelOpenToggle(ev) {
			panelEl.state.toggleOpen();
		}

		if (el.addEventListener) {
			el.addEventListener("click",panelOpenToggle,false);
		} else {
			el.attachEvent("click",panelOpenToggle);
		}
	},this);
	
};

var extraLogging = false; 
/*
Used to reposition panels in a section when the area size has changed.
*/
LayoutState.prototype.reflowPanels = function()
{
	if (this.panelStates.length <= 1) return; // No reflow if only one panel
	
	var contentWidth = this.contentWidth - 18; //TODO configurable scrollbar width
	
	console.log("Reflowing ",this.panelStates.length," panels for ",this.name," (",contentWidth,"x",this.contentHeight,")");
	var minWidth = parseInt(this.matter["default-min-panel-width"]); //TODO %
	var maxWidth = parseInt(this.matter["default-max-panel-width"]); //TODO %
	var maxColumns = Math.floor(contentWidth / minWidth);
	if (this.matter["max-columns"] != undefined) {
		maxColumns = Math.min(maxColumns,this.matter["max-columns"]);
	}
	
	var totalHeight = 0;
	var naturalWidth = minWidth;
	this.panelStates.__forEach(function(state) {
		if (extraLogging) console.log("Panel ",state.el.offsetWidth,"x",state.el.offsetHeight,state);
		naturalWidth = Math.max(state.el.offsetWidth,naturalWidth);
		totalHeight += state.minExpandedHeight;
	},this);
	var avHeight = Math.max(totalHeight / maxColumns , this.contentHeight);
	var columnWidth = Math.max(naturalWidth,maxWidth);
	if (maxColumns*columnWidth > contentWidth) {
		columnWidth = Math.floor(contentWidth /  maxColumns);
	}
	var gapWidth =  Math.floor((contentWidth - maxColumns * columnWidth) / (maxColumns+1));
	
	var baseLeft = gapWidth, baseTop = 0;
	var curLeft = gapWidth, curTop = 0, curCol = 0;
	var logicTop = 0;
	
	// log info
	var minCollapsedHeight = parseInt(this.matter["default-min-panel-collapsed-height"]);
	if (extraLogging) console.log("min=",minWidth,"x",minCollapsedHeight,"max=",maxWidth,"x ..",
				" cols=",maxColumns," of ",columnWidth,"px(",naturalWidth,") "," av. height=",avHeight,"(",totalHeight,")");
	
	//if (this.matter["default-min-panel-width"]) debugger;
	this.panelStates.__forEach(function(state) {
		if (logicTop+state.height >= avHeight && curCol+1 < maxColumns) {
			curTop = baseTop;
			logicTop = baseTop;
			curLeft += columnWidth + gapWidth;
			++curCol;
		}
		state.el.style.left = curLeft + "px";
		state.el.style.width = columnWidth + "px";
		state.el.style.top = curTop + "px";
		curTop += state.height;
		logicTop += state.minExpandedHeight;
		if (extraLogging) console.log("cur=",curLeft,",",curTop," height=",state.height," expanded height=",state.minExpandedHeight);
	});
};

/*
	Enable the area layout based on the current state. Primary used for initial state.
*/
LayoutState.prototype.enableArea = function() 
{
	if (this.state.active) {
		var activeEl = document.getElementById(this.state.active);
		if (activeEl) {
			this.members.forEach(function(el){
				el.className = el.className.replace(" active "," ").replace(" active","").replace("active","");
			});
			activeEl.className += " active"; //TODO active-in-left, active-in-lower
		}
		var actives = this.querySelectorAll("*[data-in-area-activate="+this.state.active+"]");
		actives.forEach(function(el){
			el.className += " target-active";
		},this);
	}

	var pe = PageEnhancer.INSTANCE;
	pe.widthCycleDown.forEach(function(el){
		if (el.getAttribute("data-in-area-width-cycle-down") == this.name) {
			if (el.addEventListener) {
				el.addEventListener("click",this.cycleHandler("width","down"),false);
			} else {
				el.attachEvent("click",this.cycleHandler("width","down"),false);
			}
		}
	},this);
	pe.widthCycleUp.forEach(function(el){
		if (el.getAttribute("data-in-area-width-cycle-up") == this.name) {
			if (el.addEventListener) {
				el.addEventListener("click",this.cycleHandler("width","up"),false);
			} else {
				el.attachEvent("click",this.cycleHandler("width","up"),false);
			}
		}
	},this);
	pe.heightCycleDown.forEach(function(el){
		if (el.getAttribute("data-in-area-height-cycle-down") == this.name) {
			if (el.addEventListener) {
				el.addEventListener("click",this.cycleHandler("height","down"),false);
			} else {
				el.attachEvent("click",this.cycleHandler("height","down"),false);
			}
		}
	},this);
	pe.heightCycleUp.forEach(function(el){
		if (el.getAttribute("data-in-area-height-cycle-up") == this.name) {
			if (el.addEventListener) {
				el.addEventListener("click",this.cycleHandler("height","up"),false);
			} else {
				el.attachEvent("click",this.cycleHandler("height","up"),false);
			}
		}
	},this);
};


LayoutState.prototype.handlerInAreaTarget = function(target,targetId,toggle)
{
	var ds = this;
	
	return function(ev) {
		if (toggle) {
			if (ds.state.open) {
				if (ds.state.active == targetId) {
					ds.collapse();
				} else {
					// just swap side panel
					ds.activateTarget(target,targetId);
				}
			} else {
				ds.expand();
				ds.activateTarget(target,targetId);
			}
		}
		else ds.activateTarget(target,targetId);
		ds.updateContextClass();
	};
};

/* dimension=width/height direction=up/down */
LayoutState.prototype.cycleHandler = function(dimension,direction)
{
	var area = this;
	return function(el) {
		if (dimension == "width") {
			
		} else {
			if (direction == "up") {
				if (area.logicHeight > 0) --area.logicHeight; 
			} else {
				if (area.logicHeight < area.matter.heights.length) ++area.logicHeight;
			}
			area.updateLogicHeight();
			area.state.height = area.matter.heights[area.logicHeight];
			area.changed = true;
			//console.log("Cycle",area.name,dimension,direction,area.matter.heights[area.logicHeight-1],area.matter.heights[area.logicHeight+1]);	
		}
	};
};

LayoutState.prototype.updateLogicWidth = function()
{
	
};

LayoutState.prototype.updateLogicHeight = function()
{
	var areaClass = this.el.className;
	var ah = new RegExp(this.name + "-area-height-[^ ]+");
	var newClass = this.name + "-area-height-" + this.matter.heights[this.logicHeight];

	this.el.className = areaClass.replace(ah,newClass);
};


	


// Area specific
LayoutState.prototype.startSectionReflow = function(sectionLayouts)
{
	if (this.tracker) {
		var content = this.tracker.querySelector("div"); //TODO configurable content selector
		if (extraLogging) console.log(this.name," area reflow: (",this.tracker.offsetWidth,",",this.tracker.offsetHeight,")");
		this.trackerWidth = this.tracker.offsetWidth;
		this.trackerHeight = this.tracker.offsetHeight;
		this.contentWidth = content.offsetWidth;
		this.contentHeight = content.offsetHeight;
		for(var section_name in sectionLayouts) {
			var sectionLayout = sectionLayouts[section_name];
			if (sectionLayout.areaName == this.name) {
				sectionLayout.contentWidth = this.contentWidth;
				sectionLayout.contentHeight = this.contentHeight;
				sectionLayout.needReflow = true;
			}
		}
	}
};

LayoutState.prototype.querySelectorAll = PageEnhancer.prototype.querySelectorAll;

LayoutState.prototype.activateTarget = function(target,targetId)
{
	for(var i=0,a; a = this.el.areas[i]; ++i) a.active = false;
	this.active = true;

	this.members.forEach(function(el){
		el.className = el.className.replace(" active "," ").replace(" active","").replace("active","");
	});
	target.className += " active"; //TODO active-in-left, active-in-lower
	this.state.active = targetId;
	this.changed = true; // perhaps just keep a saved copy instead

	var activates = this.querySelectorAll("*[data-in-area-activate]");
	activates.forEach(function(el){
		var activateId = el.getAttribute("data-in-area-activate");
		if (activateId == targetId) {
			el.className += " target-active";
		} else {
			el.className = el.className.replace(" target-active "," ").replace(" target-active","").replace("target-active","");
		}
	},this);
	
};

LayoutState.prototype.collapse = function()
{
	this.state.open = false;
	this.changed = true; // perhaps just keep a saved copy instead
	PageEnhancer.INSTANCE.needReflow = true;
};

LayoutState.prototype.expand = function()
{
	this.state.open = true;
	this.changed = true; // perhaps just keep a saved copy instead
	PageEnhancer.INSTANCE.needReflow = true;
};

