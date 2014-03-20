define(['./gui'], function(ui) {
    function initKeyBindings() {
        Mousetrap.bind(['j', 'down'], function(x) { ui.moveSelLine("down"); });
        Mousetrap.bind(['k', 'up'], function(x) { ui.moveSelLine("up"); });
        Mousetrap.bind(['home'], function(x) { ui.moveSelLine("home"); });
        Mousetrap.bind(['end'], function(x) { ui.moveSelLine("end"); });
        Mousetrap.bind(['enter'], function(x) { ui.selectCurrentLine(); });
        Mousetrap.bind(['H'], function(x) { ui.showBranches(); });
        Mousetrap.bind(['l'], function(x) { ui.showCommits(); });
        Mousetrap.bind(['t'], function(x) { ui.showTree(); });
        Mousetrap.bind(['mod+l'], ui.askForRemote );
        Mousetrap.bind(['mod+o'], ui.chooseFSForLocalRepo );
        Mousetrap.bind(['q'], ui.cancelCurrentContext );
    }
    return  {
        init: initKeyBindings
    };
})

