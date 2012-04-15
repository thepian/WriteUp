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

})();
