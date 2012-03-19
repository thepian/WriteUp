---
published: no
---
(function(){
	var essential = Resolver("essential",{});

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
	    this.handlers = handlers;
	    if (document.querySelectorAll) {
	        var with_roles = document.querySelectorAll("*[role]");
	        for(var i=0,e; e=with_roles[i]; ++i) {
	            var role = e.getAttribute("role");
	            (handlers[role] || this.enhance).call(e,role);
	        }
	    } else {
	        var with_roles = document.getElementsByTagName("*");
	        for(var i=0,e; e=with_roles[i]; ++i) {
	            var role = e.getAttribute("role");
	            if (role) {
    	            (handlers[role] || this.default_enhance).call(e,role);
	            }
	        }
	    }
	}
	essential.set("DocumentRoles",Generator(DocumentRoles));
	
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
        var submitName = "trigger";
        for(var i=0,e; e=this.elements[i]; ++i) {
            if (e.type=="submit") submitName = e.name;
        }
        var action = this.action? this.action.replace(baseUrl,"") : "submit";
        var actionVariant = DialogAction.variant(action)(action);
        if (actionVariant[submitName]) actionVariant[submitName](this);
    }

	DocumentRoles.enhance_dialog = function (el) {
	    switch(el.tagName.toLowerCase()) {
	        case "form":
                // f.method=null; f.action=null;
                el.onsubmit = form_onsubmit;
                el.__builtinSubmit = f.submit;
                el.submit = form_submit;
	            break;
	        case "default":
	            //TODO capture enter from inputs, tweak tab indexes
	            break;
	    }
	    
    };
    
    DocumentRoles.enhance_sheet = function(el) {
        
    };
    
})();