
function when_device_ready()
{
    setTimeout(function() {
               // debug.log("removing splash screen");    
               navigator.splashscreen.hide();
               }, 70);
	
}

function page_load()
{
	var buttons = document.querySelectorAll("*[role=button]");
	if (Modernizr.touch) {
		for(var i=0,e; e = buttons[i]; ++i) {
			e.addEventListener("touchstart",buttonEvent,false);
			e.addEventListener("touchmove",buttonEvent,false);
			e.addEventListener("touchend",buttonEvent,false);
		}
	} else {
		for(var i=0,e; e = buttons[i]; ++i) {
			e.addEventListener("click",buttonEvent,false);
		}
	}
		
}

function buttonEvent(evt) {
	alert(evt);
}

function home_page() {
	alert("home page");
}

function activate_project(ev) {
    
}

function list_projects()
{
    var projects = localStorage.projects;
    if (projects == undefined) {
        projects = localStorage.projects = [];
    }
    var ul = document.querySelector("#side .projects ul");
    ul.innerHTML = "";
    for(var i=0,p=projects[i];p;++i) {
        var li = document.createElement("LI");
        li.innerHTML= "<a>" + p.title + "</a>";
        li.firstChild.addEventListener("click",activate_project);
        li.firstChild.id = p.id;
        ul.appendChild(li);
    }
}

function projects_status(text) {
    //alert(text)
}
