(function(){
    var DocumentRoles = Resolver("essential")("DocumentRoles");
    DocumentRoles.restrict({ singleton: true, lifecycle: "page" });
    
    DocumentRoles.declare("handlers.dialog", DocumentRoles.enhance_dialog);
    DocumentRoles.declare("handlers.sheet", DocumentRoles.enhance_sheet);
    // DocumentRoles.presets.reference("handlers").declare...

})();