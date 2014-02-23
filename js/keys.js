define(['./gui'], function(ui) {
    function initKeyBindings() {
        Mousetrap.bind(['j', 'up'], function(x) { ui.moveSelLine("up"); });
        Mousetrap.bind(['k', 'down'], function(x) { ui.moveSelLine("down"); });
        Mousetrap.bind(['home'], function(x) { ui.moveSelLine("home"); });
        Mousetrap.bind(['end'], function(x) { ui.moveSelLine("end"); });
        Mousetrap.bind(['enter'], function(x) { ui.selectCurrentLine(); });
        Mousetrap.bind(['q'], function(x) { $(".CodeMirror").remove(); });
        Mousetrap.bind(['mod+n'], ui.askForRemote );
        Mousetrap.bind(['mod+o'], ui.chooseLocalRepo );
    }
    return  {
        init: initKeyBindings
    };
})

