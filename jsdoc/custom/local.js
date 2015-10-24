/**
    @overview Make references to local things local.
    @module plugins/local
    @author Michael Mathews <micmath@gmail.com>
    @author Peter A. Bigot <pab@pabigot.com>
    @see {@link https://github.com/jsdoc3/jsdoc/issues/101|issue #101}
 */

var thisModule = '',
    registry = {};

function reset() {
    thisModule = '';
    registry = {};
}

exports.defineTags = function(dictionary) {
    dictionary.defineTag('local', {
        onTagged: function(doclet, tag) {
            registry[tag.text] = true;
        }
    });
}

function buildRE(prefix, tag) {
    var pat = '(' + prefix + ')\\b(' + tag + ')\\b';
    return new RegExp(pat, 'g');
}

exports.handlers = {
    jsdocCommentFound: function(e) {
        if (thisModule) for (var local in registry) {
            var sv = '$1'+thisModule+'~'+'$2';
            e.comment = e.comment.replace(buildRE('{', local), sv);
            e.comment = e.comment.replace(buildRE('{@link\\s*\\*?\\s*', local), sv);
        }
    },

    newDoclet: function(e) {
        if (e.doclet.kind === 'module') {
            thisModule = e.doclet.longname;
        }
        else {
            if (thisModule) for (var local in registry) {
                var augment;
                if (e.doclet.augments) {
                    for (var i = 0, len = e.doclet.augments.length; i < len; i++) {
                        augment = e.doclet.augments[i];
                        if (augment && augment.indexOf(local) === 0) {
                            e.doclet.augments[i] = thisModule+'~'+e.doclet.augments[i];
                        }
                    }
                }

                if (e.doclet.longname.indexOf(local) === 0) {
                    e.doclet.longname = thisModule+'~'+e.doclet.longname;
                }
            }
        }
    },
    fileComplete: function(e) {
        reset();
    }
};
