---
published: no
---
(function(){
	var essential = Resolver("essential",{});
	var ObjectType = essential("ObjectType");

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

	function DialogAction(actionName) {
		this.actionName = actionName;
	} 
	essential.set("DialogAction",Generator(DialogAction));
	
	function DocumentRoles(handlers) {
	    this.handlers = handlers || this.handlers || {};
	    //TODO configure reference as DI arg
	    var statefuls = ApplicationConfigGenerator(); // Ensure that config is present

	    if (document.querySelectorAll) {
	        var with_roles = document.querySelectorAll("*[role]");
	        for(var i=0,e; e=with_roles[i]; ++i) {
	            var role = e.getAttribute("role");
	            (this.handlers[role] || this.default_enhance).call(this,e,role,statefuls.getConfig(e));
	        }
	    } else {
	        var with_roles = document.getElementsByTagName("*");
	        for(var i=0,e; e=with_roles[i]; ++i) {
	            var role = e.getAttribute("role");
	            if (role) {
    	            (this.handlers[role] || this.default_enhance).call(this,e,role,statefuls.getConfig(e));
	            }
	        }
	    }
	}
	var DocumentRolesGenerator = essential.set("DocumentRoles",Generator(DocumentRoles));
	
	DocumentRoles.args = [
	    ObjectType({ name:"handlers" })
	];
	
	DocumentRoles.prototype.default_enhance = function(el) {
	    
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
        var submitName = "trigger";
        for(var i=0,e; e=this.elements[i]; ++i) {
            if (e.type=="submit") submitName = e.name;
        }
        var action = this.action? this.action.replace(baseUrl,"") : "submit";
        var actionVariant = DialogAction.variant(action)(action);
        if (actionVariant[submitName]) actionVariant[submitName](this);
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
	        	debugger;
	            //TODO capture enter from inputs, tweak tab indexes
	            break;
	    }
	    
    };
    
    DocumentRolesGenerator.enhance_sheet = DocumentRoles.enhance_sheet = function(el,role,config) {
        
    };

    DocumentRoles.default_enhance = function(el,role,config) {
        
    };

    function ApplicationConfig() {
    	this.config = {};
    	this.configure_document();
    }
    var ApplicationConfigGenerator = Generator(ApplicationConfig);
    essential.set("ApplicationConfig",ApplicationConfigGenerator).restrict({ "singleton":true, "lifecycle":"page" });

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
    }
    
})();