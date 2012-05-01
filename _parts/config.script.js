(function(){
    var DocumentRoles = Resolver("essential")("DocumentRoles");
    DocumentRoles.restrict({ singleton: true, lifecycle: "page" });
    
    DocumentRoles.presets.declare("handlers.enhance.dialog", DocumentRoles.enhance_dialog);
    DocumentRoles.presets.declare("handlers.discard.dialog", DocumentRoles.discard_dialog);
    DocumentRoles.presets.declare("handlers.enhance.sheet", DocumentRoles.enhance_sheet);
    DocumentRoles.presets.declare("handlers.discard.sheet", DocumentRoles.discard_sheet);
    // DocumentRoles.presets.reference("handlers").declare...

})();