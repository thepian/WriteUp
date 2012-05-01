---
published: no
---
(function(){
	var essential = Resolver("essential",{});
	var ObjectType = essential("ObjectType");
    var baseUrl = location.href.substring(0,location.href.lastIndexOf("/")+1);

	// this = element
	function regScriptOnload(domscript,trigger) {

		domscript.onload = function(ev) { 
		    if ( ! domscript.onloadDone ) {
		        domscript.onloadDone = true; 
		        trigger.call(domscript,ev || event); 
		    }
		};
		domscript.onreadystatechange = function(ev) { 
		    if ( ( "loaded" === domscript.readyState || "complete" === domscript.readyState ) && ! domscript.onloadDone ) {
		        domscript.onloadDone = true; 
		        trigger.call(domscript,ev || event);
		    }
		}

	}

	//TODO regScriptOnnotfound (onerror, status=404)

	function HTMLScriptElement(from,doc) {
		var e = (doc || document).createElement("SCRIPT");
		for(var n in from) {
			switch(n) {
				case "id":
				case "class":
				case "rel":
				case "lang":
				case "language":
				case "src":
				case "type":
					if (from[n] !== undefined) e[n] = from[n]; 
					break;
				//TODO case "onprogress": // partial script progress
				case "onload":
					regScriptOnload(e,from.onload);
					break;
				default:
					e.setAttribute(n,from[n]);
					break;
			}
		}
		return e;
	}
	essential.set("HTMLScriptElement",HTMLScriptElement);


    function _makeEventCleaner(listeners,bubble)
    {
        // must be called with element as this
        function cleaner() {
            if (this.removeEventListener) {
                for(var n in listeners) {
                    this.removeEventListener(n, listeners[n], bubble);
                    delete listeners[n];
                }
            } else {
                for(var n in listeners) {
                    this.detachEvent('on'+ n, listeners[n]);
                    delete listeners[n];
                }
            }
        }
        cleaner.listeners = listeners; // for removeEventListeners
        return cleaner;
    };


    /**
     * Register map of event listeners 
     * { event: function }
     * Using DOM style event names
     * 
     * @param {Object} eControl
     * @param {Map} listeners Map from event name to function 
     * @param {Object} bubble
     */
    function addEventListeners(eControl, listeners,bubble)
    {
        if (eControl._cleaners == undefined) eControl._cleaners = [];

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
            for(var n in listeners) {
                eControl.addEventListener(n, listeners[n], bubble || false);
            }
            eControl._cleaners.push(_makeEventCleaner(listeners,bubble || false));
        } else {
            var listeners2 = {};
            for(var n in listeners) {
                listeners2[n] = makeIeListener(eControl,listeners[n]);
                eControl.attachEvent('on'+n,listeners2[n]);
            }
            eControl._cleaners.push(_makeEventCleaner(listeners2,bubble || false));
        }   
    }
    essential.declare("addEventListeners",addEventListeners);

    //TODO modifyable events object on IE

    //TODO removeEventListeners (eControl, listeners, bubble)

    /**
     * Cleans up registered event listeners and other references
     * 
     * @param {Object} eControl
     */
    function callCleaners(eControl)
    {
        var pCleaners = eControl._cleaners;
        if (pCleaners != undefined) {
            for(var i=0,c; c = pCleaners[i]; ++i) {
                c.call(eControl);
            }
            pCleaners = undefined;
        }
    };

    //TODO recursive clean of element and children?


	function DialogAction(actionName) {
		this.actionName = actionName;
	} 
	var DialogActionGenerator = essential.set("DialogAction",Generator(DialogAction));


    function resizeTriggersReflow(ev) {
        debugger;
    }

	function DocumentRoles(handlers) {
	    this.handlers = handlers || this.handlers || { enhance:{}, discard:{} };
	    //TODO configure reference as DI arg
	    var statefuls = ApplicationConfigGenerator(); // Ensure that config is present

        if (window.addEventListener) {
            window.addEventListener("resize",resizeTriggersReflow,false);
            document.body.addEventListener("orientationchange",resizeTriggersReflow,false);
        } else {
            window.attachEvent("onresize",resizeTriggersReflow);
        }
        
	    if (document.querySelectorAll) {
	        var with_roles = document.querySelectorAll("*[role]");
	        for(var i=0,e; e=with_roles[i]; ++i) {
	            var role = e.getAttribute("role");
	            (this.handlers.enhance[role] || DocumentRoles.default_enhance).call(this,e,role,statefuls.getConfig(e));
	        }
	    } else {
	        var with_roles = document.getElementsByTagName("*");
	        for(var i=0,e; e=with_roles[i]; ++i) {
	            var role = e.getAttribute("role");
	            if (role) {
    	            (this.handlers.enhance[role] || DocumentRoles.default_enhance).call(this,e,role,statefuls.getConfig(e));
	            }
	        }
	    }
	}
	var DocumentRolesGenerator = essential.set("DocumentRoles",Generator(DocumentRoles));
	
	DocumentRoles.args = [
	    ObjectType({ name:"handlers" })
	];
	
    DocumentRoles.discarded = function(instance) {
        if (document.querySelectorAll) {
            var with_roles = document.querySelectorAll("*[role]");
            for(var i=0,e; e=with_roles[i]; ++i) {
                var role = e.getAttribute("role");
                (instance.handlers.discard[role] || DocumentRoles.default_discard).call(instance,e,role,statefuls.getConfig(e));
                callCleaners(e);
            }
        } else {
            var with_roles = document.getElementsByTagName("*");
            for(var i=0,e; e=with_roles[i]; ++i) {
                var role = e.getAttribute("role");
                if (role) {
                    (instance.handlers.discard[role] || DocumentRoles.default_discard).call(instance,e,role,statefuls.getConfig(e));
                    callCleaners(e);
                }
            }
        }
    };

    function form_onsubmit(ev) {
        var frm = this;
        setTimeout(function(){
            frm.submit();
        },0);
        return false;
    }
    function form_submit() {
        if (document.activeElement) document.activeElement.blur();
        this.blur();

        dialog_submit.call(this);
    }
    function dialog_submit(clicked) {
        var submitName = "trigger";
        if (this.elements) {

            for(var i=0,e; e=this.elements[i]; ++i) {
                if (e.type=="submit") submitName = e.name;
            }
        } else {

            var buttons = this.getElementsByTagName("button");
            for(var i=0,e; e=buttons[i]; ++i) {
                if (e.type=="submit") submitName = e.name;
            }
            var inputs = this.getElementsByTagName("input");
            for(var i=0,e; e=inputs[i]; ++i) {
                if (e.type=="submit") submitName = e.name;
            }
        }
        if (clicked && clicked.name) submitName = clicked.name;

        var action = this.getAttribute("action");
        if (action) {
            action = action.replace(baseUrl,"");
        } else {
            action = "submit";
        }

        var actionVariant = DialogActionGenerator.variant(action)(action);
        if (actionVariant[submitName]) actionVariant[submitName](this);
        else {
            var sn = submitName.replace("-","_").replace(" ","_");
            if (actionVariant[sn]) actionVariant[sn](this);
        }
        //TODO else dev_note("Submit of " submitName " unknown to DialogAction " action)
    }

    function form_blur() {
        for(var i=0,e; e=this.elements[i]; ++i) e.blur();
    }
    function form_focus() {
        for(var i=0,e; e=this.elements[i]; ++i) {
            var autofocus = e.getAttribute("autofocus");
            if (autofocus == undefined) continue;
            e.focus();
            break; 
        }
    }

    function dialog_button_click(ev) {
        ev = ev || event;
        var e = ev.target || ev.srcElement;
        if (e.getAttribute("role") == "button") this.submit(e); else
        if (e.type=="submit") this.submit(e); //TODO action context
    }

	DocumentRolesGenerator.enhance_dialog = DocumentRoles.enhance_dialog = function (el,role,config) {
	    switch(el.tagName.toLowerCase()) {
	        case "form":
                // f.method=null; f.action=null;
                el.onsubmit = form_onsubmit;
                el.__builtinSubmit = f.submit;
                el.submit = form_submit;
                el.__builtinBlur = f.blur;
                el.blur = form_blur;
                el.__builtinFocus = f.focus;
                el.focus = form_focus;
	            break;
	            
	        default:
                el.submit = dialog_submit;
	        	// debugger;
	            //TODO capture enter from inputs, tweak tab indexes
	            break;
	    }
	    
        addEventListeners(el, {
            "click": dialog_button_click
        },false);
    };

    DocumentRolesGenerator.discard_dialog = DocumentRoles.discard_dialog = function (el,role,config) {
    };

    DocumentRolesGenerator.enhance_sheet = DocumentRoles.enhance_sheet = function(el,role,config) {
        
    };

    DocumentRolesGenerator.discard_sheet = DocumentRoles.discard_sheet = function(el,role,config) {
        
    };

    DocumentRoles.default_enhance = function(el,role,config) {
        
    };

    DocumentRoles.default_discard = function(el,role,config) {
        
    };
    
    function Layouter(key,el,conf) {

    }
    var LayouterGenerator = essential.declare("Layouter",Generator(Layouter));

    var stages = [];

    function StageLayouter(key,el,conf) {
    	this.key = key;
    	this.type = conf.layouter;
    	this.areaNames = conf["area-names"];
    	this.activeArea = null;

    	this.baseClass = conf["base-class"];
    	if (this.baseClass) this.baseClass += " ";
    	this.baseClass = "";

    	stages.push(this); // for area updates
    }
    var StageLayouterGenerator = essential.declare("StageLayouter",Generator(StageLayouter));
    LayouterGenerator.variant("area-stage",StageLayouterGenerator);

    StageLayouter.prototype.refreshClass = function(el) {
    	var areaClasses = [];
    	for(var i=0,a; a = this.areaNames[i]; ++i) {
    		if (a == this.activeArea) areaClasses.push(a + "-area-active");
    		else areaClasses.push(a + "-area-inactive");
    	}
    	var newClass = this.baseClass + areaClasses.join(" ")
    	if (el.className != newClass) el.className = newClass;
    };

    StageLayouter.prototype.updateActiveArea = function(areaName) {
    	this.activeArea = areaName;
    	this.refreshClass(document.getElementById(this.key)); //TODO on delay	
    }

    function Laidout(key,el,conf) {

    }
    var LaidoutGenerator = essential.declare("Laidout",Generator(Layouter));

    function MemberLaidout(key,el,conf) {
    	this.key = key;
    	this.type = conf.laidout;
    	this.areaNames = conf["area-names"];

    }
    var MemberLaidoutGenerator = essential.declare("MemberLaidout",Generator(MemberLaidout));
    LaidoutGenerator.variant("area-member",MemberLaidoutGenerator);


    function activateArea(areaName) {
    	for(var i=0,s; s = stages[i]; ++i) {
    		s.updateActiveArea(areaName);
    	}
    }
    essential.set("activateArea",activateArea);

    var pageStateUpdaterId;

    function bringLive() {
    	var ap = ApplicationConfigGenerator();
    	if (ap.isAuthenticated()) activateArea(ap.getAuthenticatedArea());
    	else activateArea(ap.getIntroductionArea());

    	pageStateUpdaterId = setInterval(pageStateUpdater,100);
    }

    function pageStateUpdater() {

    }

    function ApplicationConfig() {
    	this.config = {};
    	this.configure_document();
    	this.enhance_elements();

    	setTimeout(bringLive,100);
    }
    var ApplicationConfigGenerator = Generator(ApplicationConfig);
    essential.set("ApplicationConfig",ApplicationConfigGenerator).restrict({ "singleton":true, "lifecycle":"page" });

    ApplicationConfig.prototype.isAuthenticated = function() {
    	//TODO if user has completed account login and preferences, return true
    	return false;
    };
    ApplicationConfig.prototype.getAuthenticatedArea = function() {
    	return "edit";
    };
    ApplicationConfig.prototype.getIntroductionArea = function() {
    	return "signup";
    };

    ApplicationConfig.prototype.declare = function(key,value) {
    	this.config[key] = value;
    	// console.log(key, value);
    };
    ApplicationConfig.prototype.configure_document = function() {
    	var scripts = document.getElementsByTagName("script");
    	for(var i=0,s; s = scripts[i]; ++i) {
    		if (s.getAttribute("type") == "application/config") {
    			with(this) eval(s.text);
    		}
    	}
    };

    ApplicationConfig.prototype.enhance_elements = function() {
    	for(var k in this.config) {
    		var conf = this.config[k];
    		var el = this.getElement(k);

    		if (conf.layouter) {
    			el.layouter = LayouterGenerator.variant(conf.layouter)(k,el,conf);
    		}
    		if (conf.laidout) {
    			el.laidout = LaidoutGenerator.variant(conf.laidout)(k,el,conf);
    		}
    	}
    };

    ApplicationConfig.prototype.getConfig = function(element) {
    	if (element.id) {
    		return this.config[element.id] || {};
    	}
    	var name = element.getAttribute("name");
    	if (name) {
    		var p = element.parentNode;
    		while(p) {
	    		if (p.id) return this.config[p.id + "." + name];
	    		p = p.parentNode;
    		} 
    	}
    	return {};
    };

    ApplicationConfig.prototype.getElement = function(key) {
    	var keys = key.split(".");
    	var el = document.getElementById(keys[0]);
    	if (keys.length > 1) el = el.getElementByName(keys[1]);
    	return el;
    };

})();