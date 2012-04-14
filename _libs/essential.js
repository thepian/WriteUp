---
published: yes
---
/*!
    Essential JavaScript 鉂�http://essentialjs.com
    Copyright (C) 2011 by Henrik Vendelbo

    Licensed under GNU Affero v3 and MIT. See http://essentialjs.com/license/
*/

function Resolver(name,ns,options)
{
	switch(typeof(name)) {
	case "undefined":
		// Resolver()
		return Resolver.default;
		
	case "string":
		// Resolver("abc")
		// Resolver("abc",{})
		// Resolver("abc",{},{options})
		if (Resolver[name] == undefined) {
			if (options == undefined) { options = ns; ns = {}; }
			Resolver[name] = Resolver(ns,options);
			Resolver[name].named = name;
			}
		return Resolver[name];
	}

	// Resolver({})
	// Resolver({},{options})
	options = ns || {};
	ns = name;
	name = options.name;
	var _generator = options.generator || Generator(Object); //TODO faster default

	function _resolve(names,onundefined) {
        var top = ns;
        for (var j = 0, n; n = names[j]; ++j) {
            var prev_top = top;
            top = top[n];
            if (top == undefined) {
                switch(onundefined) {
                case undefined:
                case "generate":
                    top = prev_top[n] = _generator();
                    break;
                case "null":
                    return null;
                case "throw":
                	throw new Error("The '" + n + "' part of '" + names.join(".") + "' couldn't be resolved.");
                }
            }
        }
        return top;
	}
	
    function _setValue(value,names,base,symbol)
    {
    	base[symbol] = value;
		if (value.__generator__ == value) {
    		value.info.symbol = symbol;
    		value.info["package"] = names.join(".");
    		value.info.within = base;
    	}
    }

    /**
     * @param name To resolve
     * @param onundefined What to do for undefined symbols ("generate","null","throw")
     */
    function resolve(name,onundefined) {
        if (typeof name == "object") {
            return _resolve(name.name.split("."),name.onundefined);
        }
        else {
            return _resolve(name.split("."),onundefined);
        }
    };

    resolve.named = name;
    resolve.namespace = ns;
    
    resolve.declare = function(name,value,onundefined) 
    {
        var names = name.split(".");
        var symbol = names.pop();
    	var base = _resolve(names,onundefined);
    	if (base[symbol] === undefined) { 
    		_setValue(value,names,base,symbol);
    	}
    	return _resolve(names,onundefined)
    };

    resolve.set = function(name,value,onundefined) 
    {
        var names = name.split(".");
        var symbol = names.pop();
    	var base = _resolve(names,onundefined);
		_setValue(value,names,base,symbol);
		return value;
    };

    resolve.reference = function(name,onundefined)
    {
        var names = name.split(".");

    	function get() {
        	var base = _resolve(names,onundefined);
        	return base;
        }
        function set(value) {
            var symbol = names.pop();
        	var base = _resolve(names,onundefined);
        	names.push(symbol);
        	_setValue(value,names,base,symbol);
        	return value;
        }
        function declare(value) {
            var symbol = names.pop();
        	var base = _resolve(names,onundefined);
        	names.push(symbol);
        	if (base[symbol] === undefined) _setValue(value,names,base,symbol);
        	return _resolve(names,onundefined);
        }
        function mixin(map) {
            var symbol = names.pop();
        	var base = _resolve(names,onundefined);
        	names.push(symbol);
        	if (base[symbol] === undefined) _setValue({},names,base,symbol);
        	for(var n in map) {
        		base[symbol][n] = map[n];
        	}
        }
        get.set = set;
        get.get = get;
        get.declare = declare;
        get.mixin = mixin;

        return get;
    };

    resolve.override = function(ns,options)
    {
        options = options || {};
        var name = options.name || this.named; 
		Resolver[name] = Resolver(ns,options);
		Resolver[name].named = name;
		return Resolver[name];
    };

    return resolve;
}
Resolver.default = Resolver({},{ name:"default" });

Resolver.hasGenerator = function(subject) {
	if (subject.__generator__) return true;
	if (typeof subject == "function" && typeof subject.type == "function") return true;
	return false;
};

/**
 * Generator(constr) - get cached or new generator
 * Generator(constr,base1,base2) - define with bases
 * Generator(constr,base,options) - define with options 
 *
 * options { singleton: false, pool: undefined, allocate: true } 
 *
 */
function Generator(mainConstr,options)
{
	if (mainConstr.__generator__) return mainConstr.__generator__;

	var info = {
		arguments: {},
		options: options,
		constructors: []
	};

	function newGenerator(a,b,c,d,e,f,g,h,i,j,k,l) {
		var instance;
		if (generator.info.existing) {
			//TODO perhaps different this pointer
			var id = generator.info.identifier.apply(generator.info,arguments);
			if (id in generator.info.existing) {
				return instance = generator.info.existing[id];
			} else {
				instance = generator.info.existing[id] = new generator.type();
			}
		} else {
			instance = new generator.type();
		}
		
		// constructors
		instance.__context__ = { generator:generator, info:info, args:[a,b,c,d,e,f,g,h,i,j,k,l] }; //TODO inject morphers that change the args for next constructor
		for(var i=0,cst; cst=info.constructors[i]; ++i) {
			cst.apply(instance,instance.__context__.args);
		}
		delete instance.__context__;
		return instance;
	}


	function simpleGenerator(a,b,c,d,e,f,g,h,i,j,k,l) {
		var instance = mainConstr.apply(generator,arguments);
		return instance;
	}

	function builtinGenerator(a,b,c,d,e,f,g,h,i,j,k,l) {
		var instance;
		if (generator.info.existing) {
			//TODO perhaps different this pointer
			var id = generator.info.identifier.apply(generator.info,arguments);
			if (id in generator.info.existing) {
				return instance = generator.info.existing[id];
			} else {
				instance = generator.info.existing[id] = info.extendsBuiltin[arguments.length].apply(null,arguments);
			}
		} else {
			instance = info.extendsBuiltin[arguments.length].apply(null,arguments);
			// copy the methods
			for(var mn in generator.prototype) {
				instance[mn] = generator.prototype[mn];
			}
			//TODO instance.constructor = mainConstr
			mainConstr.prototype = info.extendsBuiltin.ctr.prototype; // help instanceof 
		}

		// constructors
		instance.__context__ = { generator:generator, info:info, args:[a,b,c,d,e,f,g,h,i,j,k,l] }; //TODO inject morphers that change the args for next constructor
		for(var i=0,ctr; ctr=info.constructors[i]; ++i) {
			if (info.extendsBuiltin.ctr !== ctr) {
				ctr.apply(instance,instance.__context__.args);
			}
		}
		delete instance.__context__;
		return instance;
	}

	function fillMissingArgs() {
		var passedArgs = this.__context__.args;
		for(var i=0,argDef; argDef = generator.args[i]; ++i) if (passedArgs[i] === undefined) {
			 var argName = generator.args[i].name;
			 var argDefault = generator.args[i].default;
			 if (argName in info.restrictedArgs) passedArgs[i] = info.restrictedArgs[argName];
			 else if (argDefault) passedArgs[i] = argDefault;
		}
		//TODO support args default values in all cases
	}

	function presetMembers() {
		var args = this.__context__.generator.args;
		for(var i=0,a; a = args[i]; ++i) if (a.preset) {
			this[a.preset] = arguments[i];
		}
	}

	function constructByNumber(ctr,no) {
		return function(a,b,c,d,e,f,g,h,i,j,k,l) {
			switch(no) {
				case 1: return new ctr(a);
				case 2: return new ctr(a,b);
				case 3: return new ctr(a,b,c);
				case 4: return new ctr(a,b,c,d);
				case 5: return new ctr(a,b,c,d,e);
				case 6: return new ctr(a,b,c,d,e,f);
				case 7: return new ctr(a,b,c,d,e,f,g);
				case 8: return new ctr(a,b,c,d,e,f,g,h);
				case 9: return new ctr(a,b,c,d,e,f,g,h,i);
				case 10: return new ctr(a,b,c,d,e,f,g,h,i,j);
				case 11: return new ctr(a,b,c,d,e,f,g,h,i,j,k);
				case 12: return new ctr(a,b,c,d,e,f,g,h,i,j,k,l);
				default: return new ctr();
			}
		};
	}
	
	// Make the generator with type annotations
	var generator = (function(args){
		// mark end of constructor arguments
		var last = args.length-1;
		var options = args[last];
		if (typeof options == "function") {
			options = {};
		} else {
			--last;
		}
		info.options = options;

		// get order of bases and constructors from the main constructor or the arguments
		var bases = mainConstr.bases || [];
		if (last > 0) {
			bases = [];
			for(var i=last,ctr; (i >= 1) &&(ctr = args[i]); --i) {
				switch(ctr) {
					case Array:
					case String: 
						info.extendsBuiltin = { "ctr":ctr }
						for(var ci=12; ci>=0; --ci) info.extendsBuiltin[ci] = constructByNumber(ctr,ci);
				}
				bases.push(args[i]);
			}
		}	
		var constructors = info.constructors;
		for(var i=0,b; b = bases[i];++i) {
			if (b.bases) {
				for(var j=0,b2; b2 = b.bases[j]; ++j) constructors.push(b.bases[j]);
			}
			constructors.push(b);
		}
		constructors.push(mainConstr);
		constructors[-1] = mainConstr;

		// determine the generator to use
		var generator = newGenerator;
		if (options.alloc === false) generator = simpleGenerator;
		else if (info.extendsBuiltin) generator = builtinGenerator;

		generator.__generator__ = generator;
		generator.info = info;
		generator.bases = bases;

		// arguments planning
		generator.args = options.args || mainConstr.args || [];
		var argsPreset = false;
		for(var i=0,a; a = generator.args[i]; ++i) {
			a.no = i;
			info.arguments[a.name] = a;
			if (a.preset) argsPreset = true;
		}
		if (argsPreset) {
			info.constructors.unshift(presetMembers)
		}

		// If we have base classes, make prototype based on their type
		if (bases.length) {
			var base = Generator(bases[0]);
			var p = generator.prototype = new base.type();
			for(var i=1,b; b = bases[i]; ++i) {
				for(var n in b.prototype) p[n] = b.prototype[n]; 
			}
		}

		// simple type with inheritance chain, fresh prototype
		function type() {}
		generator.type = type;
		generator.type.prototype = generator.prototype;

		// migrate prototype
		for(var n in mainConstr.prototype) generator.prototype[n] = mainConstr.prototype[n];
		mainConstr.prototype = generator.prototype;

		
		return generator;
	})(arguments);

	function mixin(mix) {
		for(var n in mix) this.prototype[n] = mix[n];
	}
	generator.mixin = mixin;
	
	function variant(name,variantConstr,v1,v2,v3,v4) {
		if (variantConstr == undefined) { // Lookup the variant generator
			var g = this.variants[name];
			if (g && g.generator) return g.generator;
			var g = this.variants[""]; // default generator
			if (g && g.generator) return g.generator;
			return this;			
		} else {	// Set the variant generator
			var handlers = variantConstr.handlers;
			var bases = variantConstr.bases;
			this.variants[name] = { 
				func: variantConstr,
				generator: Generator(variantConstr),
				handlers: handlers || {},
				bases: bases || [],
				additional: [v1,v2,v3,v4] 
			}; 
		}
	}

	// variant get/set function and variants map
	generator.variant = variant;
	generator.variants = {};

	function toRepr() {
		var l = [];
		l.push("function ");
		l.push(this.info.package);
		l.push(".");
		l.push(this.info.symbol);
		l.push("(");
		var ps = [];
		for(var i=0,a; a = this.args[i]; ++i) {
			ps.push(a.name + ":" + a.variantName);
		}
		l.push(ps.join(","))
		l.push(")");
		l.push(" {");
		l.push("<br>  ");
		l.push("<br>  }");
		l.push("<br>  ");
		
		return l.join("");
	}
	generator.toRepr = toRepr;

	function restrict(restrictions,args) {
		if (restrictions.singleton) {
			this.info.singleton = true;
			this.info.lifecycle = restrictions.lifecycle;
			this.info.existing = {};
			this.info.identifier = function() {
				return 0;
			}
			if (!this.info.restricted) {
				Generator.restricted.push(generator);
				this.info.restricted = true;
			}
		}
		else if (restrictions.identifier) {
			var fn = typeof restrictions.identifier == "string"? restrictions.identifier : "identifier";
			this.info.identifier = this.info.constructors[-1][fn];
			this.info.existing = {};
			if (!this.info.restricted) {
				Generator.restricted.push(generator);
				this.info.restricted = true;
			}
		}
		else if (restrictions.size != undefined) {
			
			if (!this.info.restricted) {
				Generator.restricted.push(generator);
				this.info.restricted = true;
			}
		}
		else {
			//TODO remove from restricted list
		}
		this.info.restrictedArgs = args;
		if (args) {
			this.info.constructors.unshift(fillMissingArgs);
		}
	}
	generator.restrict = restrict;

	// Future calls will return this generator
	mainConstr.__generator__ = generator;
		
	return generator;
};

/* List of generators that have been restricted */
Generator.restricted = [];

// types for describing generator arguments and generated properties
(function(win){
	var essential = Resolver("essential",{});
	function Type(options) {
		this.options = options || {};
		this.name = this.options.name;
		this.preset = this.options.preset === true? this.name : this.options.preset;
	}
	essential.set("Type",Generator(Type));
	
	function StringType(options) {
		this.type = String;
		this.variantName = "String";
	}
	essential.set("StringType",Generator(StringType,Type));
	essential.namespace.Type.variant("String",essential.namespace.StringType);
		
	function NumberType(options) {
		this.type = Number;
		this.variantName = "Number";
	}
	essential.set("NumberType",Generator(NumberType,Type));
	essential.namespace.Type.variant("Number",essential.namespace.NumberType);
	
	function DateType(options) {
		this.type = Date;
		this.variantName = "Date";
	}
	essential.set("DateType",Generator(DateType,Type));
	essential.namespace.Type.variant("Date",essential.namespace.DateType);
	
	function BooleanType(options) {
		this.type = Boolean;
		this.variantName = "Boolean";
	}
	essential.set("BooleanType",Generator(BooleanType,Type));
	essential.namespace.Type.variant("Boolean",essential.namespace.BooleanType);
	
	function ObjectType(options) {
		this.type = Object;
		this.variantName = "Object";
	}
	essential.set("ObjectType",Generator(ObjectType,Type));
	essential.namespace.Type.variant("Object",essential.namespace.ObjectType);
	
	function ArrayType(options) {
		this.type = Array;
		this.variantName = "Array";
	}
	essential.set("ArrayType",Generator(ArrayType,Type));
	essential.namespace.Type.variant("Array",essential.namespace.ArrayType);

	//TODO consider if ""/null restriction is only for derived DOMTokenList
	
	function ArraySet() {
		this._set = {};
		for(var i=this.length-1; i>=0; --i) {
			var key = this[i];
			if (this._set[key] || key === "") this.splice(i,1);
			if (key != "" && key != null) this._set[key] = true;	
		} 
		//TODO remove dupes
	}
	essential.set("ArraySet",Generator(ArraySet,Array)); //TODO support this
	essential.set("DOMTokenList",Generator(ArraySet,Array)); //TODO support this

	ArraySet.prototype.item = function(index) {
		return this[index]; // use native array
	};

	ArraySet.prototype.has = function(id) {
		return this._set[id];
	};

	ArraySet.prototype.contains = 
	ArraySet.prototype.has = function(id) {
		return Boolean(this._set[id]);
	};

	ArraySet.prototype.set = function(id,value) {
		if (typeof id == "object"); //TODO set map removing rest
		if (value) { // set true
			this.add(id);
		} else { // set false
			this.remove(id);
		}
	};
	
	//TODO mixin with map of entries to set

	ArraySet.prototype.add = function(id) {
		if (!(id in this._set)) {
			this._set[id] = true;
			this.push(id);
		}
	};
	ArraySet.prototype.remove = function(id) {
		if (id in this._set) {
			for(var i=this.length-1; i>=0; --i) if (this[i] === id) this.splice(i,1);
			delete this._set[id];
		}
	};
	ArraySet.prototype.toggle = function(id) {
		if (this.has(id)) this.remove(id);
		else this.add(id);
	};
	
	ArraySet.prototype.separator = " ";

	ArraySet.prototype.toString = function() {
		return this.join(this.separator);
	};


	function instantiatePageSingletons()
	{
		for(var i=0,g; g = Generator.restricted[i]; ++i) {
			if (g.info.lifecycle == "page") {
				g();
			}
		}
	}

	function discardRestricted()
	{
		for(var i=0,g; g = Generator.restricted[i]; ++i) {
			var discarded = g.info.constructors[-1].discarded;
			for(var n in g.info.existing) {
				var instance = g.info.existing[n];
				if (discarded) {
					discarded.call(g,instance);
				}
			}
			g.info.constructors[-1].__generator__ = undefined;
			g.__generator__ = undefined;
		}
	}

	function fireDomReady()
	{
		instantiatePageSingletons();
	}
	function fireLoad()
	{
		
	}
	function fireBeforeUnload()
	{
		discardRestricted();
	}


	function listenForDomReady() 
	{
	    // Mozilla, Opera and webkit nightlies currently support this event
	    if (win.document.addEventListener) {
	      var DOMContentLoaded = function() {
	        win.document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
	        fireDomReady();
	      };
	      
	      win.document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);
	      win.addEventListener("load", fireDomReady, false); // fallback
	      
	      // If IE event model is used
	    } else if (win.document.attachEvent) {
	      
	      var onreadystatechange = function() {
	        if (win.document.readyState === "complete") {
	          win.document.detachEvent("onreadystatechange", onreadystatechange);
	          fireDomReady();
	        }
	      };
	      
	      win.document.attachEvent("onreadystatechange", onreadystatechange);
	      win.attachEvent("onload", fireDomReady); // fallback

	      // If IE and not a frame, continually check to see if the document is ready
	      var toplevel = false;

	      try {
	        toplevel = win.frameElement == null;
	      } catch(e) {}

	      // The DOM ready check for Internet Explorer
	      if (win.document.documentElement.doScroll && toplevel) {
	        var doScrollCheck = function() {

	          // stop searching if we have no functions to call 
	          // (or, in other words, if they have already been called)
	          if (readyList.length == 0) {
	            return;
	          }

	          try {
	            // If IE is used, use the trick by Diego Perini
	            // http://javascript.nwbox.com/IEContentLoaded/
	            win.document.documentElement.doScroll("left");
	          } catch(e) {
	            setTimeout(doScrollCheck, 1);
	            return;
	          }

	          // and execute any waiting functions
	          fireDomReady();
	        }  
	        doScrollCheck();
	      }
	    } 
	}


	if (window.device) {
		//TODO PhoneGap support
	}
	else {
		listenForDomReady();		
		if (win.addEventListener) {
			win.addEventListener("load",fireLoad,false);
		} else {
			win.attachEvent("onload",fireLoad);
		}
		if (win.addEventListener) {
			win.addEventListener("beforeunload",fireBeforeUnload,false);
		} else {
			win.attachEvent("onbeforeunload",fireBeforeUnload);
		}
	}


})(window);

