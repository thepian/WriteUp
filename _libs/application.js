(function(){

var essential = Resolver("essential");
var DialogAction = essential("DialogAction");

function when_device_ready()
{
    setTimeout(function() {
               // debug.log("removing splash screen");    
               navigator.splashscreen.hide();
               }, 70);
	
}
if (document.addEventListener) {
	document.addEventListener("deviceready", when_device_ready, false);
	// window.addEventListener("load", page_load, false);
}

var SigninAction = Generator(function(){ 


},DialogAction);
DialogAction.variant("signin-actions",SigninAction);

SigninAction.prototype.login = function(dialogEl) {
	// debugger;
	essential("activateArea")("settings");
};

var TopbarAction = Generator(function(){ 


},DialogAction);
DialogAction.variant("topbar-actions",TopbarAction);

TopbarAction.prototype.edit = function(dialogEl) {
	// debugger;
	essential("activateArea")("edit");
};

TopbarAction.prototype.homepage = function(dialogEl) {
	// debugger;
	alert("homepage");
};

TopbarAction.prototype.wiki = function(dialogEl) {
	// debugger;
	alert("wiki");
};

TopbarAction.prototype.issues = function(dialogEl) {
	// debugger;
	alert("issues");
};

TopbarAction.prototype.account_illu = function(dialogEl) {
	// debugger;
	alert("account-illu");
};

})();
