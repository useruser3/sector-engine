

function Clip2d(x1, y1, x2, y2,  xmin,  ymin,  xmax,  ymax)
{
    var deltaX, deltaY, p, q;
    var u1 = 0.0, u2 = 1.0;
    var r;
    var isVisible = true;
    var clipped = false;

    if (x1 < xmin || x1 > xmax || x2  < xmin || x2 > xmax )
        clipped = true;

    if (y1< ymin || y1 > ymax || y2 < ymin || y2 > ymax )
        clipped = true;

    var lineout = {
        visible: true,
        clipped: clipped
    };


    deltaX = (x2 - x1);
    deltaY = (y2 - y1);

    /*
     * left edge, right edge, bottom edge and top edge checking
     */

    var pPart=[];
    var qPart=[];

    pPart[0] = -1 * deltaX; pPart[1] = deltaX; pPart[2] = -1 * deltaY; pPart[3] = deltaY;
    qPart[0] = x1 - xmin; qPart[1]=xmax - x1; qPart[2] = y1 - ymin; qPart[3] = ymax - y1;

    var accept = true;

    for (var i = 0; i < 4; i++)
    {
        p = pPart[i];
        q = qPart[i];

        if (p == 0 && q < 0)
        {
            accept = false;
            break;
        }

        r = q / p;

        if (p < 0)
        {
            u1 = Math.max(u1, r);
        }

        if (p > 0)
        {
            u2 = Math.min(u2, r);
        }

        if (u1 > u2)
        {
            accept = false;
            break;
        }
        //System.out.println(u1 +" " + u2);

    }

    if (accept)
    {
        if (u2 < 1)
        {
            x2 = (x1 + u2 * deltaX);
            y2 = (y1 + u2 * deltaY);
        }
        if (u1 > 0)
        {
            x1 = (x1 + u1 * deltaX);
            y1 = (y1 + u1 * deltaY);
        }

        //set(x1, y1, x2, y2);
        lineout.visible = true;
        lineout.x1 = x1;
        lineout.y1 = y1;
        lineout.x2 = x2;
        lineout.y2 = y2;

    }
    else
    {
        isVisible = false;
        //set(-1, -1, -1, -1);
        lineout.visible = false;
        lineout.x1 = -1;
        lineout.y2 = -1;
        lineout.x2 = -1;
        lineout.y2 = -1;
    }

    return lineout;

}