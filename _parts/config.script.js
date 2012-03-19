(function(){
    var DocumentRoles = Resolver("essential")("DocumentRoles");
    DocumentRoles.restrict({ singleton: true, lifecycle: "page" },{
        "handlers": {
            "dialog": DocumentRoles.enhance_dialog,
            "sheet": DocumentRoles.enhance_sheet
        }
    });
})();