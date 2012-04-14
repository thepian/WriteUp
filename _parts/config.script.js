(function(){
    var DocumentRoles = Resolver("essential")("DocumentRoles");
    DocumentRoles.restrict({ singleton: true, lifecycle: "page" });
    
    DocumentRoles.presets.declare("handlers.dialog", DocumentRoles.enhance_dialog);
    DocumentRoles.presets.declare("handlers.sheet", DocumentRoles.enhance_sheet);
    // DocumentRoles.presets.reference("handlers").declare...

})();