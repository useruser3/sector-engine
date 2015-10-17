
/**
 * Created by alan on 17/10/15.
 */
/**
 *
 *  this exquisite piece of code essentially takes a bunch of vertical lines
 *  (forming a shape) and scan-converts them into horizontal lines.
 *  why? because if we draw horizontally, it's linear! so fast interpolation.
 *
 */



function VerticalSpan()
{
    this.x = 0;
    this.y1 = 0;
    this.y2 = 0;
    this.height = 0;
    this.minx = 100000;
    this.maxx = -1;
    this.columns = [];

    this.add = function (x, y1, y2, height) {
        if (x < this.minx) this.minx = x;
        if (x > this.maxx) this.maxx = x;

        this.columns[x] = {
            yt: y1,
            yb: y2,
            h: height
        };
    };


    this.makeHorz = function ()
    {
        //step 1: find the highest Y peak and then begin scanning from its far left-most value
        var top_y = SCREEN_HEIGHT;
        var start_index = -1;
        for (var t = 0; t < SCREEN_WIDTH; t++) {
            if (this.columns[t]) {
                if (this.columns[t].yt < top_y) {
                    top_y = this.columns[t].yt;
                    start_index = t;
                }
            }

        }

        var horzLines = [];

        //step 2: iterate through remaining Y coordinates and extract a horz span
        var cnt = 0;
        for (var y = top_y; y < SCREEN_HEIGHT; y++)
        {
            var span = this._getHorizontalExtent(y);

            if (span.valid) {
                cnt++;
                horzLines.push({
                    y: y,
                    x1: span.left,
                    x2: span.right,
                    h: span.height
                });
            }
        }

        // erm... that was easy.

        return horzLines

    };

    this._getHorizontalExtent = function (y)
    {
        var valid = false;
        var x_left = SCREEN_WIDTH;
        var x_right = 0;
        var height = -99999;

        for (var x = 0; x < SCREEN_WIDTH; x++)
        {
            if (this.columns[x]) {
                //console.log(this.columns[x].yt," y ",y);
                if (this.columns[x].yt <= y && this.columns[x].yb >= y) {
                    valid = true;
                    if (x < x_left) x_left = x;
                    if (x > x_right) x_right = x;
                    if (height < -99998) height = this.columns[x].h;
                }
            }
        }

        return {left: x_left, right: x_right, height: height, valid: valid};

    };
}



