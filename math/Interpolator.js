/**
 * Created by alan on 02/10/15.
 */

// Helper method for linear interpolation

function Interpolator(from, to, steps)
{
    var s = 0, ss=steps;
    var inc = (to - from) / (steps-1);
    var val = from - inc;

    this.next = function()
    {
        if (s++>=ss) return val;
        val += inc;
        return val;
    }

}
