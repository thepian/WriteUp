
function buttonEvent(event) {
      if ((event.type == "click" && event.button == 0) ||
          (event.type == "keydown" &&
    (event.keyCode == 32 || event.keyCode ==13))) {
  var SVGDocument = event.target.ownerDocument;
  var SVGRoot     = SVGDocument.documentElement;

        var pressed = false;
  var fill = "red";
  var text = "OFF";

        if ("false" == SVGRoot.getAttribute("aria-pressed")) {
         pressed = true;
   fill = "green";
   text = "ON";
        }

        SVGRoot.setAttribute("aria-pressed", pressed);

  var ButtonBase  = SVGDocument.getElementById("ButtonBase");
  var Text        = SVGDocument.getElementById("Text");
  var TextShadow  = SVGDocument.getElementById("TextShadow");
  if (ButtonBase) ButtonBase.style.setProperty("fill", fill, "");
  if (Text) Text.firstChild.nodeValue = text;
  if (TextShadow) TextShadow.firstChild.nodeValue = text;

      if (parent.projects_status) parent.projects_status(text);
      }
}

//alert("svg events");

var buttons = document.querySelectorAll("*[role=button]");
if (parent.Modernizr.touch) {
	alert(button);
	for(var i=0,e; e = buttons[i]; ++i) {
		e.addEventListener("touchstart",buttonEvent,false);
		e.addEventListener("touchmove",buttonEvent,false);
		e.addEventListener("touchend",buttonEvent,false);
	}
} else {
	alert("desktop");
	for(var i=0,e; e = buttons[i]; ++i) {
		e.addEventListener("click",buttonEvent,false);
	}
}