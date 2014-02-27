/**
 * A simple templating method based on Douglas Crockford's supplant. 
 * This method replaces all instances of the ${key} pattern with the 
 * corresponding key's value on the object passed into it. it also uses 
 * the pattern [key: text ${key} text] to signify repetition 
 * patterns. The inner text of the pattern is repeated N times, where N 
 * is the number of items at the key. A zero length array, null, 
 * undefined or empty string on the key removes the pattern entirely. 
 * Otherwise an array containing strings or objects gets applied 
 * recursively to the inner text pattern. 
 * Author: Breton Slivka - https://gist.github.com/Breton/2497986 
 */
define(function() {
    return function template(o, tmpl) {
        var tag = /\$\{([^\}]*)\}/g,
            many = /\[([a-zA-Z$_][a-zA-Z$_0-9]*?):([^\]]*)\]/g;

        function promote (v,b) {
            if (typeof v !=='object'){
                tmp={};
                tmp[b]=v;
                v=tmp;
            }
            return v;
        }
        function rmany(a, b, c) {
            var r = (o[b] === 0 ? 0 : o[b] || []), i, set,tmp;
            r=promote(r,b);
            if ( typeof r.length !== 'number') {
                r = [r];
            }

            for (i = 0, set = []; i < r.length; i += 1) {
                r[i] = promote(r[i],b);
                set[i] = c.template(r[i]);
            }
            return set.join('');
        }

        function rtag(a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : "";
        }
        return tmpl.replace(many, rmany).replace(tag, rtag);
    };
});
