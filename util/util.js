/**
 * Created by alan on 26/09/15.
 */

function Bind (fn, obj) {

    var slice = Array.prototype.slice;

    if (fn.bind) {
        return fn.bind.apply(fn, slice.call(arguments, 1));
    }

    var args = slice.call(arguments, 2);

    return function () {
        return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
    };
}

window.Bind = Bind;
