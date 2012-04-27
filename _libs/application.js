(function(){

var essential = Resolver("essential");
var DialogAction = essential("DialogAction");
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

})();
