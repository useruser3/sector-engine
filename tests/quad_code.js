/**
 * Created by alan on 04/06/15.
 */

function RunPixelTest()
{
    buffer_data = buffer_context.getImageData(0,0,SCREEN_WIDTH, SCREEN_HEIGHT);

    var half_tex = floor_tex_width /2;

    var dest_size = 256;

    var max_floor_tex = floor_tex_width-1;

    var src = [[0,0], [dest_size-1, 0], [dest_size-1, dest_size-1], [0, dest_size-1]];

    var dst = [[5,5], [floor_tex_width-1, 0], [floor_tex_width-1, floor_tex_width-1], [0, floor_tex_width-1]];
    //var dst = [[8,0], [15, 8], [8, 8], [0, 8]];

    var matrix = transform(src, dst);

    console.log(matrix);

    for (var by=0; by<floor_tex_width; by++)
    {
        for (var bx=0; bx<floor_tex_width; bx++)
        {
            var c = floor_tex[by][bx];

            //if (c != 0) c=0; else c=255;
            pixel(buffer_data, bx+2, by+2, c.r, c.g, c.b);
        }
    }

    var ss="";
    for (var sy=0;sy<dest_size; sy++)
    {
        if (sy ==1 ) console.log(ss);
        for (var sx=0; sx<dest_size; sx++)
        {
            var sp = {x: sx, y:sy, z:0};
            var dp = matrix_transform(matrix, sp);
            var dx = Math.round(dp.x); // round to use nearest neighbour or decimal for bilinear filtering
            var dy = Math.round(dp.y);

            if (sy ==0 ) ss += "("+dx+","+dy+") ";




            if (dx > max_floor_tex) dx = max_floor_tex;
            if (dy > max_floor_tex) dy = max_floor_tex;
            if (dx<0) dx=0;
            if (dy<0) dy = 0;

            // console.log(dp);
            var c = floor_tex[dy][dx];
            //var c = bilinear_filter(floor_tex, dx, dy, floor_tex_width, floor_tex_width);
            //var c=0;
            // if (c != 0) c=0; else c=255;
            //   c=0;

            pixel(buffer_data, sx+(floor_tex_width*2), sy+(floor_tex_width*2), c.r, c.g, c.b);




        }
    }



    buffer_context.putImageData(buffer_data, 0, 0);

}

function bilinear_filter(bitmap, u, v, bitmap_width, bitmap_height)
{
    var maxx = bitmap_width- 1, maxy = bitmap_height-1;
    var x = Math.floor(u);
    var y = Math.floor(v);

    var uRatio = u - x;
    var vRatio = v - y;

    var uOpp = 1 - uRatio;
    var vOpp = 1 - vRatio;

    var a = bf_pixel(bitmap, x, y, maxx, maxy);
    var b = bf_pixel(bitmap, x+1, y, maxx, maxy);
    var c = bf_pixel(bitmap, x, y+1, maxx, maxy);
    var d = bf_pixel(bitmap, x+1,y+1, maxx, maxy);

    return {
        r: (a.r * uOpp + b.r * uRatio) * vOpp + (c.r * uOpp + d.r * uRatio) * vRatio,
        g: (a.g * uOpp + b.g * uRatio) * vOpp + (c.g * uOpp + d.g * uRatio) * vRatio,
        b: (a.b * uOpp + b.b * uRatio) * vOpp + (c.b * uOpp + d.b * uRatio) * vRatio
    };

    //return  (a * uOpp + b * uRatio) * vOpp + (c * uOpp + d * uRatio) * vRatio;
}

function bf_pixel(bitmap, x, y, maxx, maxy)
{
    if (x > maxx) x = maxx;
    if (y > maxy) y = maxy;
    if (x<0) x = 0;
    if (y<0) y= 0;
    return bitmap[y][x];
}

function matrix_transform(m, a)
{
    /**
     matrix = [  a1, b1, c1, d1,             0, 1, 2, 3
     a2, b2, c2, d2,             4, 5, 6, 7
     a3, b3, c3, d3,             8, 9,10,11
     a4, b4, c4, d4              12,13,14,15
     ]

     */
    var a1 = m[0], a2 = m[4], a3 = m[8],  a4 = m[12];
    var b1 = m[1], b2 = m[5], b3 = m[9],  b4 = m[13];
    var c1 = m[2], c2 = m[6], c3 = m[10], c4 = m[14];
    var d1 = m[3], d2 = m[7], d3 = m[11], d4 = m[15];

    return {
        x: a.x * a1 + a.y * a2 + a.z * a3 + a4,
        y: a.x * b1 + a.y * b2 + a.z * b3 + b4,
        z: a.x * c1 + a.y * c2 + a.z * c3 + c4
    }
}




function round(n, dp)
{
    var mul = Math.pow(10, dp);
    return Math.round(n*mul) / mul;
}

function transform(sourcePoints, targetPoints)
{
    for (var a = [], b = [], i = 0, n = sourcePoints.length; i < n; ++i)
    {
        var s = sourcePoints[i];
        var t = targetPoints[i];
        a.push([s[0], s[1], 1, 0, 0, 0, -s[0] * t[0], -s[1] * t[0]]), b.push(t[0]);
        a.push([0, 0, 0, s[0], s[1], 1, -s[0] * t[1], -s[1] * t[1]]), b.push(t[1]);
    }

    var X = solve(a, b, true), matrix = [
        X[0], X[3], 0, X[6],
        X[1], X[4], 0, X[7],
        0,    0, 1,    0,
        X[2], X[5], 0,    1
    ].map(function(x) {
            return round(x, 6);
        });

    return matrix;
    //console.log(matrix);
    // svgTransform.style(transform, "matrix3d(" + matrix + ")");
}

function quadperspective2(source, dest)
{
    var xs0, ys0, xs1, ys1, xs2, ys2, xs3, ys3;  // Four corners of the source (a quadrilateral area)
    var xt0, yt0, xt1, yt1, xt2, yt2, xt3, yt3;  // Four corners of the target (a rectangle)



    var A= 0, B= 1, C= 2, D= 3, X = 0, Y=1;

    xs0 = source[A][X]; ys0 = source[A][Y];
    xs1 = source[B][X]; ys1 = source[B][Y];
    xs2 = source[C][X]; ys2 = source[C][Y];
    xs3 = source[D][X]; ys3 = source[D][Y];

    xt0 = dest[A][X]; yt0 = dest[A][Y];
    xt1 = dest[B][X]; yt1 = dest[B][Y];
    xt2 = dest[C][X]; yt2 = dest[C][Y];
    xt3 = dest[D][X]; yt3 = dest[D][Y];



    var xt, yt; // Target (rectangle)
    var xs, ys; // Source (quadrilatreal area)
    //COLORREF c;    // Pixel

    ys = ys0;

    // Formula f(x) = ax + b for the edges and diagonals
    var a_top, b_top, a_bottom, b_bottom, a_left, b_left, a_right, b_right;

    // Data for any line between the top and the bottom edge and more or less parallel to them
    var xs_horiz_left, ys_horiz_left, xs_horiz_right, ys_horiz_right;
    var a_horiz, b_horiz;

    // Data for any line between the left and the right edge and more or less parallel to them
    var xs_verti_top, ys_verti_top, xs_verti_bottom, ys_verti_bottom;
    var a_verti, b_verti;

    // Data for perspective
    var perspv_a, perspv_b, perspv_4d05;
    var persph_a, persph_b, persph_4d05;
    var tmp_01;

    // -----------------------------------------------------------------------------
    // Get the equations, f(x) = ax + b, of the four edges of the quadrilateral area
    // (for vertical lines, a = 0 means a = infinity for x = b)
    // -----------------------------------------------------------------------------
    // Top edge
    if (xs1 == xs0) {a_top = 0; b_top = xs1;} // special case of vertical line
    else {a_top = (ys1 - ys0) / (xs1 - xs0); b_top = ys0 - a_top * xs0;}

    // Bottom edge
    if (xs2 == xs3) {a_bottom = 0; b_bottom = xs2;}
    else {a_bottom = (ys2 - ys3) / (xs2 - xs3); b_bottom = ys3 - a_bottom * xs3;}

    // Left edge
    if (xs3 == xs0) {a_left = 0; b_left = xs3;}
    else {a_left = (ys3 - ys0) / (xs3 - xs0); b_left = ys0 - a_left * xs0;}

    // Right edge
    if (xs2 == xs1) {a_right = 0; b_right = xs2;}
    else {a_right = (ys2 - ys1) / (xs2 - xs1); b_right = ys1 - a_right * xs1;}

    // Data for perspective
    perspv_4d05 = ((xs1 - xs0) / (xs2 - xs3)) * 2;
    perspv_a = 2 - perspv_4d05;
    perspv_b = perspv_4d05 - 1;

    persph_4d05 = ((ys3 - ys0) / (ys2 - ys1)) * 2;
    persph_a = 2 - persph_4d05;
    persph_b = persph_4d05 - 1;

    // Loop for each horizontal line
    for (yt = yt0; yt < yt3; yt++) {

        // Find the corresponding y on the left edge of the quadrilateral area
        //   - adjust according to the lengths
        ys_horiz_left = (yt * (ys3 - ys0) / (yt3 - yt0));

        if (a_left != a_right) { // left edge not parallel to the right edge
            //   - adjust according to the perspective
            tmp_01 = (ys_horiz_left) / (ys3 - ys0);
            ys_horiz_left = (ys3 - ys0) * (tmp_01 * tmp_01 * perspv_a + tmp_01 * perspv_b);
        }

        ys_horiz_left += ys0;

        // Find the corresponding x on the left edge of the quadrilateral area
        if (a_left == 0) xs_horiz_left = b_left;
        else xs_horiz_left = (ys_horiz_left - b_left) / a_left;

        // Find the corresponding of y on the right edge of the quadrilateral area
        //   - adjust according to the lengths
        ys_horiz_right = (yt * (ys2 - ys1) / (yt2 - yt1));

        if (a_left != a_right) { // left edge not parallel to the right edge
            //   - adjust according to the perspective
            tmp_01 = (ys_horiz_right) / (ys2 - ys1);
            ys_horiz_right = (ys2 - ys1) * (tmp_01 * tmp_01 * perspv_a + tmp_01 * perspv_b);
        }

        ys_horiz_right += ys1;

        // Find the corresponding x on the left edge of the quadrilateral area
        if (a_right == 0) xs_horiz_right = b_right;
        else xs_horiz_right = (ys_horiz_right - b_right) / a_right;

        // Find the equation of the line joining the points on the left and the right edges
        if (xs_horiz_right == xs_horiz_left) {a_horiz = 0; b_horiz = xs_horiz_right;}
        else {
            a_horiz = (ys_horiz_right - ys_horiz_left) / (xs_horiz_right - xs_horiz_left);
            b_horiz = ys_horiz_left - a_horiz * xs_horiz_left;
        }

        // Loop for each point in an horizontal line
        for (xt = xt0; xt < xt1; xt++) {

            // Find the corresponding x
            //   - adjust according to the lengths
            xs = (xt * (xs_horiz_right - xs_horiz_left) / (xt1 - xt0));
            xs += xs_horiz_left;

            // - adjust for perspective

            // Find the corresponding point on the top edge of the quadrilateral area
            xs_verti_top = (xs - xs_horiz_left) * (xs1 - xs0) / (xs_horiz_right - xs_horiz_left);

            if (a_top != a_bottom) { // top edge not parallel to the bottom edge
                tmp_01 = (xs_verti_top) / (xs1 - xs0);
                xs_verti_top = (xs1 - xs0) * (tmp_01 * tmp_01 * persph_a + tmp_01 * persph_b);
            }

            xs_verti_top += xs0;
            ys_verti_top = a_top * xs_verti_top + b_top;

            // Find the corresponding of x on the bottom edge of the quadrilateral area
            xs_verti_bottom = (xs - xs_horiz_left) * (xs2 - xs3) / (xs_horiz_right - xs_horiz_left);

            if (a_top != a_bottom) { // top edge not parallel to the bottom edge
                tmp_01 = (xs_verti_bottom) / (xs2 - xs3);
                xs_verti_bottom = (xs2 - xs3) * (tmp_01 * tmp_01 * persph_a + tmp_01 * persph_b);
            }

            xs_verti_bottom += xs3;
            ys_verti_bottom = a_bottom * xs_verti_bottom + b_bottom;

            // Find the equation of the line joining the points on the top and the bottom edges
            if (xs_verti_top != xs_verti_bottom) {
                //console.log("I AM NOT EXECUTING LOL?");
                a_verti = (ys_verti_bottom - ys_verti_top) / (xs_verti_bottom - xs_verti_top);
                b_verti = ys_verti_top - a_verti * xs_verti_top;

                xs = (ys - b_verti) / a_verti; // new xs
                // ys = a_horiz * xs + b_horiz;   // adjust ys
                //  if (yt < 10)
                //      console.log(xs, ys, a_verti, b_verti);

            }

            // Find the corresponding y with the equation of the line
            ys = a_horiz * xs + b_horiz;

            //console.log(ys, a_horiz, b_horiz);

            //console.log(xs, ys, " -> ", xt, yt);

            // Copy a pixel
            if (1==1) {//direction == QUADRI2RECT) {
                var idx = Math.floor(xs);
                //  if (idx < 0) idx = 0;
                // if (idx > floor_tex_width-1); idx = floor_tex_width-1;
                var idy = Math.floor(ys);
                // if (idy < 0) idy = 0;
                // if (idy > floor_tex_width-1); idy = floor_tex_width-1;
                //console.log(idx, idy)
                var c = floor_tex[idy][idx];
                //  console.log(c, xs, ys);
                pixel(buffer_data, Math.round(xt) + (floor_tex_width * 2), Math.round(yt) + (floor_tex_width * 2), c.r, c.g, c.b);
                //c = GetPixel(hdc, (int)(xs) + view_org_xs, (int)(ys) + view_org_ys);
                //SetPixel(hdc, (int)(xt + 0.5) + view_org_xt, (int)(yt + 0.5) + view_org_yt, c);
            }
            else {
                //  c = GetPixel(hdc, (int)(xt) + view_org_xt, (int)(yt) + view_org_yt);
                //  SetPixel(hdc, (int)(xs + 0.5) + view_org_xs, (int)(ys + 0.5) + view_org_ys, c);
            }
        }

    }

    //return TRUE;
}

function quadperspective(source, dest)
{
    var xs0, ys0, xs1, ys1, xs2, ys2, xs3, ys3;  // Four corners of the source (a quadrilateral area)
    var xt0, yt0, xt1, yt1, xt2, yt2, xt3, yt3;  // Four corners of the target (a rectangle)

    var A= 0, B= 1, C= 2, D= 3, X = 0, Y=1;

    xs0 = source[A][X]; ys0 = source[A][Y];
    xs1 = source[B][X]; ys1 = source[B][Y];
    xs2 = source[C][X]; ys2 = source[C][Y];
    xs3 = source[D][X]; ys3 = source[D][Y];

    xt0 = dest[A][X]; yt0 = dest[A][Y];
    xt1 = dest[B][X]; yt1 = dest[B][Y];
    xt2 = dest[C][X]; yt2 = dest[C][Y];
    xt3 = dest[D][X]; yt3 = dest[D][Y];

    //var view_org_xs, view_org_ys, view_org_xt, view_org_yt; // integers
    //var QUADRI2RECT = 0; //const
    //var RECT2QUADRI = 1;

    var xt, yt; // Target (rectangle)
    var xs, ys=0; // Source (quadrilatreal area)
    //var c;    // Pixel



    // Formula f(x) = ax + b for the edges and diagonals
    var a_top, b_top, a_bottom, b_bottom, a_left, b_left, a_right, b_right;

    // Data for any line between the top and the bottom edge and more or less parallel to them
    var xs_horiz_left, ys_horiz_left, xs_horiz_right, ys_horiz_right;
    var a_horiz, b_horiz;

    // Data for any line between the left and the right edge and more or less parallel to them
    var xs_verti_top, ys_verti_top, xs_verti_bottom, ys_verti_bottom;
    var a_verti, b_verti;

    // Data for perspective
    var perspv_a, perspv_b, perspv_4d05;
    var persph_a, persph_b, persph_4d05;
    var tmp_01;

    // -----------------------------------------------------------------------------
    // Get the equations, f(x) = ax + b, of the four edges of the quadrilateral area
    // (for vertical lines, a = 0 means a = infinity for x = b)
    // -----------------------------------------------------------------------------
    // Top edge
    if (xs1 == xs0) {a_top = 0; b_top = xs1;} // special case of vertical line
    else {a_top = (ys1 - ys0) / (xs1 - xs0); b_top = ys0 - a_top * xs0;}

    // Bottom edge
    if (xs2 == xs3) {a_bottom = 0; b_bottom = xs2;}
    else {a_bottom = (ys2 - ys3) / (xs2 - xs3); b_bottom = ys3 - a_bottom * xs3;}

    // Left edge
    if (xs3 == xs0) {a_left = 0; b_left = xs3;}
    else {a_left = (ys3 - ys0) / (xs3 - xs0); b_left = ys0 - a_left * xs0;}

    // Right edge
    if (xs2 == xs1) {a_right = 0; b_right = xs2;}
    else {a_right = (ys2 - ys1) / (xs2 - xs1); b_right = ys1 - a_right * xs1;}

    // Data for perspective
    perspv_4d05 = ((xs1 - xs0) / (xs2 - xs3)) * 2;
    perspv_a = 2 - perspv_4d05;
    perspv_b = perspv_4d05 - 1;

    persph_4d05 = ((ys3 - ys0) / (ys2 - ys1)) * 2;
    persph_a = 2 - persph_4d05;
    persph_b = persph_4d05 - 1;

    // Loop for each horizontal line
    for (yt = yt0; yt < yt3; yt++) {

        // Find the corresponding y on the left edge of the quadrilateral area
        //   - adjust according to the lengths
        ys_horiz_left = (yt * (ys3 - ys0) / (yt3 - yt0));

        if (a_left != a_right) { // left edge not parallel to the right edge
            //   - adjust according to the perspective
            tmp_01 = (ys_horiz_left) / (ys3 - ys0);
            ys_horiz_left = (ys3 - ys0) * (tmp_01 * tmp_01 * perspv_a + tmp_01 * perspv_b);
        }

        ys_horiz_left += ys0;

        // Find the corresponding x on the left edge of the quadrilateral area
        if (a_left == 0) xs_horiz_left = b_left;
        else xs_horiz_left = (ys_horiz_left - b_left) / a_left;

        // Find the corresponding of y on the right edge of the quadrilateral area
        //   - adjust according to the lengths
        ys_horiz_right = (yt * (ys2 - ys1) / (yt2 - yt1));

        if (a_left != a_right) { // left edge not parallel to the right edge
            //   - adjust according to the perspective
            tmp_01 = (ys_horiz_right) / (ys2 - ys1);
            ys_horiz_right = (ys2 - ys1) * (tmp_01 * tmp_01 * perspv_a + tmp_01 * perspv_b);
        }

        ys_horiz_right += ys1;

        // Find the corresponding x on the left edge of the quadrilateral area
        if (a_right == 0)
            xs_horiz_right = b_right;
        else
            xs_horiz_right = (ys_horiz_right - b_right) / a_right;

        // Find the equation of the line joining the points on the left and the right edges
        if (xs_horiz_right == xs_horiz_left)
        {
            a_horiz = 0;
            b_horiz = xs_horiz_right;
        }
        else
        {
            a_horiz = (ys_horiz_right - ys_horiz_left) / (xs_horiz_right - xs_horiz_left);
            b_horiz = ys_horiz_left - a_horiz * xs_horiz_left;
        }


        // Loop for each point in an horizontal line
        for (xt = xt0; xt < xt1; xt++) {

            // Find the corresponding x
            //   - adjust according to the lengths
            xs = (xt * (xs_horiz_right - xs_horiz_left) / (xt1 - xt0));
            xs += xs_horiz_left;

            // - adjust for perspective

            // Find the corresponding point on the top edge of the quadrilateral area
            xs_verti_top = (xs - xs_horiz_left) * (xs1 - xs0) / (xs_horiz_right - xs_horiz_left);

            if (a_top != a_bottom) // top edge not parallel to the bottom edge
            {
                tmp_01 = (xs_verti_top) / (xs1 - xs0);
                xs_verti_top = (xs1 - xs0) * (tmp_01 * tmp_01 * persph_a + tmp_01 * persph_b);
            }

            xs_verti_top += xs0;
            ys_verti_top = a_top * xs_verti_top + b_top;

            // Find the corresponding of x on the bottom edge of the quadrilateral area
            xs_verti_bottom = (xs - xs_horiz_left) * (xs2 - xs3) / (xs_horiz_right - xs_horiz_left);

            if (a_top != a_bottom) { // top edge not parallel to the bottom edge
                tmp_01 = (xs_verti_bottom) / (xs2 - xs3);
                xs_verti_bottom = (xs2 - xs3) * (tmp_01 * tmp_01 * persph_a + tmp_01 * persph_b);
            }

            xs_verti_bottom += xs3;
            ys_verti_bottom = a_bottom * xs_verti_bottom + b_bottom;

            // Find the equation of the line joining the points on the top and the bottom edges
            if (xs_verti_top != xs_verti_bottom) {
                a_verti = (ys_verti_bottom - ys_verti_top) / (xs_verti_bottom - xs_verti_top);
                b_verti = ys_verti_top - a_verti * xs_verti_top;

                xs = (ys - b_verti) / a_verti; // new xs
                // ys = a_horiz * xs + b_horiz;   // adjust ys
            }

            // Find the corresponding y with the equation of the line
            ys = a_horiz * xs + b_horiz;

            // Copy a pixel
            if (1==1) { //direction == QUADRI2RECT) {

                var dx = Math.round(xs);   if (dx>63) dx = 63;
                var dy = Math.round(ys);  if (dy > 63) dy = 63;

                var c = floor_tex[dy][dx];
                //var c = bilinear_filter(floor_tex, ys, xs, floor_tex_width, floor_tex_width);
                //var c=0;
                // if (c != 0) c=0; else c=255;
                //   c=0;

                pixel(buffer_data, Math.round(xt) + (floor_tex_width * 2), Math.round(yt) + (floor_tex_width * 2), c.r, c.g, c.b);

                //var c = Math
                //c = GetPixel(hdc, (int)(xs) + view_org_xs, (int)(ys) + view_org_ys);
                //SetPixel(hdc, (int)(xt + 0.5) + view_org_xt, (int)(yt + 0.5) + view_org_yt, c);
            }
            //else {
            //    c = GetPixel(hdc, (int)(xt) + view_org_xt, (int)(yt) + view_org_yt);
            //    SetPixel(hdc, (int)(xs + 0.5) + view_org_xs, (int)(ys + 0.5) + view_org_ys, c);
            //}
        }

    }

    //return TRUE;





}


/**
 double xs0, ys0, xs1, ys1, xs2, ys2, xs3, ys3;  // Four corners of the source (a quadrilateral area)
 double xt0, yt0, xt1, yt1, xt2, yt2, xt3, yt3;  // Four corners of the target (a rectangle)
 int view_org_xs, view_org_ys, view_org_xt, view_org_yt;
 #define QUADRI2RECT 0
 #define RECT2QUADRI 1

 static int draw_and_cvt_bmp(HDC hdc, int direction)
 {
    double xt, yt; // Target (rectangle)
    double xs, ys; // Source (quadrilatreal area)
    COLORREF c;    // Pixel

    // Formula f(x) = ax + b for the edges and diagonals
    double a_top, b_top, a_bottom, b_bottom, a_left, b_left, a_right, b_right;

    // Data for any line between the top and the bottom edge and more or less parallel to them
    double xs_horiz_left, ys_horiz_left, xs_horiz_right, ys_horiz_right;
    double a_horiz, b_horiz;

    // Data for any line between the left and the right edge and more or less parallel to them
    double xs_verti_top, ys_verti_top, xs_verti_bottom, ys_verti_bottom;
    double a_verti, b_verti;

    // Data for perspective
    double perspv_a, perspv_b, perspv_4d05;
    double persph_a, persph_b, persph_4d05;
    double tmp_01;

    // -----------------------------------------------------------------------------
    // Get the equations, f(x) = ax + b, of the four edges of the quadrilateral area
    // (for vertical lines, a = 0 means a = infinity for x = b)
    // -----------------------------------------------------------------------------
    // Top edge
    if (xs1 == xs0) {a_top = 0; b_top = xs1;} // special case of vertical line
    else {a_top = (ys1 - ys0) / (xs1 - xs0); b_top = ys0 - a_top * xs0;}

    // Bottom edge
    if (xs2 == xs3) {a_bottom = 0; b_bottom = xs2;}
    else {a_bottom = (ys2 - ys3) / (xs2 - xs3); b_bottom = ys3 - a_bottom * xs3;}

    // Left edge
    if (xs3 == xs0) {a_left = 0; b_left = xs3;}
    else {a_left = (ys3 - ys0) / (xs3 - xs0); b_left = ys0 - a_left * xs0;}

    // Right edge
    if (xs2 == xs1) {a_right = 0; b_right = xs2;}
    else {a_right = (ys2 - ys1) / (xs2 - xs1); b_right = ys1 - a_right * xs1;}

    // Data for perspective
    perspv_4d05 = ((xs1 - xs0) / (xs2 - xs3)) * 2;
    perspv_a = 2 - perspv_4d05;
    perspv_b = perspv_4d05 - 1;

    persph_4d05 = ((ys3 - ys0) / (ys2 - ys1)) * 2;
    persph_a = 2 - persph_4d05;
    persph_b = persph_4d05 - 1;

    // Loop for each horizontal line
    for (yt = yt0; yt < yt3; yt++) {

       // Find the corresponding y on the left edge of the quadrilateral area
       //   - adjust according to the lengths
       ys_horiz_left = (yt * (ys3 - ys0) / (yt3 - yt0));

       if (a_left != a_right) { // left edge not parallel to the right edge
          //   - adjust according to the perspective
          tmp_01 = (ys_horiz_left) / (ys3 - ys0);
          ys_horiz_left = (ys3 - ys0) * (tmp_01 * tmp_01 * perspv_a + tmp_01 * perspv_b);
       }

       ys_horiz_left += ys0;

       // Find the corresponding x on the left edge of the quadrilateral area
       if (a_left == 0) xs_horiz_left = b_left;
       else xs_horiz_left = (ys_horiz_left - b_left) / a_left;

       // Find the corresponding of y on the right edge of the quadrilateral area
       //   - adjust according to the lengths
       ys_horiz_right = (yt * (ys2 - ys1) / (yt2 - yt1));

       if (a_left != a_right) { // left edge not parallel to the right edge
          //   - adjust according to the perspective
          tmp_01 = (ys_horiz_right) / (ys2 - ys1);
          ys_horiz_right = (ys2 - ys1) * (tmp_01 * tmp_01 * perspv_a + tmp_01 * perspv_b);
       }

       ys_horiz_right += ys1;

       // Find the corresponding x on the left edge of the quadrilateral area
       if (a_right == 0) xs_horiz_right = b_right;
       else xs_horiz_right = (ys_horiz_right - b_right) / a_right;

       // Find the equation of the line joining the points on the left and the right edges
       if (xs_horiz_right == xs_horiz_left) {a_horiz = 0; b_horiz = xs_horiz_right;}
       else {
          a_horiz = (ys_horiz_right - ys_horiz_left) / (xs_horiz_right - xs_horiz_left);
          b_horiz = ys_horiz_left - a_horiz * xs_horiz_left;
       }

       // Loop for each point in an horizontal line
       for (xt = xt0; xt < xt1; xt++) {

          // Find the corresponding x
          //   - adjust according to the lengths
          xs = (xt * (xs_horiz_right - xs_horiz_left) / (xt1 - xt0));
          xs += xs_horiz_left;

          // - adjust for perspective

          // Find the corresponding point on the top edge of the quadrilateral area
          xs_verti_top = (xs - xs_horiz_left) * (xs1 - xs0) / (xs_horiz_right - xs_horiz_left);

          if (a_top != a_bottom) { // top edge not parallel to the bottom edge
             tmp_01 = (xs_verti_top) / (xs1 - xs0);
             xs_verti_top = (xs1 - xs0) * (tmp_01 * tmp_01 * persph_a + tmp_01 * persph_b);
          }

          xs_verti_top += xs0;
          ys_verti_top = a_top * xs_verti_top + b_top;

          // Find the corresponding of x on the bottom edge of the quadrilateral area
          xs_verti_bottom = (xs - xs_horiz_left) * (xs2 - xs3) / (xs_horiz_right - xs_horiz_left);

          if (a_top != a_bottom) { // top edge not parallel to the bottom edge
             tmp_01 = (xs_verti_bottom) / (xs2 - xs3);
             xs_verti_bottom = (xs2 - xs3) * (tmp_01 * tmp_01 * persph_a + tmp_01 * persph_b);
          }

          xs_verti_bottom += xs3;
          ys_verti_bottom = a_bottom * xs_verti_bottom + b_bottom;

          // Find the equation of the line joining the points on the top and the bottom edges
          if (xs_verti_top != xs_verti_bottom) {
             a_verti = (ys_verti_bottom - ys_verti_top) / (xs_verti_bottom - xs_verti_top);
             b_verti = ys_verti_top - a_verti * xs_verti_top;

             xs = (ys - b_verti) / a_verti; // new xs
             // ys = a_horiz * xs + b_horiz;   // adjust ys
          }

          // Find the corresponding y with the equation of the line
          ys = a_horiz * xs + b_horiz;

          // Copy a pixel
          if (direction == QUADRI2RECT) {
             c = GetPixel(hdc, (int)(xs) + view_org_xs, (int)(ys) + view_org_ys);
             SetPixel(hdc, (int)(xt + 0.5) + view_org_xt, (int)(yt + 0.5) + view_org_yt, c);
          }
          else {
             c = GetPixel(hdc, (int)(xt) + view_org_xt, (int)(yt) + view_org_yt);
             SetPixel(hdc, (int)(xs + 0.5) + view_org_xs, (int)(ys + 0.5) + view_org_ys, c);
          }
       }

    }

    return TRUE;
 }

 */



//int xs0, ys0, xs1, ys1, xs2, ys2, xs3, ys3;  // Four corners of the source (a quadrilateral area)
//int xt0, yt0, xt1, yt1, xt2, yt2, xt3, yt3;  // Four corners of the target (a rectangle)
//int view_org_xs, view_org_ys, view_org_xt, view_org_yt;


function draw_source2target(source, dest)
{
    // all int
    var xs0, ys0, xs1, ys1, xs2, ys2, xs3, ys3;  // Four corners of the source (a quadrilateral area)
    var xt0, yt0, xt1, yt1, xt2, yt2, xt3, yt3;  // Four corners of the target (a rectangle)
    //var view_org_xs, view_org_ys, view_org_xt, view_org_yt;
    var A= 0, B= 1, C= 2, D= 3, X = 0, Y=1;

    xs0 = source[A][X]; ys0 = source[A][Y];
    xs1 = source[B][X]; ys1 = source[B][Y];
    xs2 = source[C][X]; ys2 = source[C][Y];
    xs3 = source[D][X]; ys3 = source[D][Y];

    xt0 = dest[A][X]; yt0 = dest[A][Y];
    xt1 = dest[B][X]; yt1 = dest[B][Y];
    xt2 = dest[C][X]; yt2 = dest[C][Y];
    xt3 = dest[D][X]; yt3 = dest[D][Y];

    var xt, yt; //int
    var xs, ys;

    var a_top, b_top, a_bottom, b_bottom, a_left, b_left, a_right, b_right;
    var xs_left, ys_left, xs_right, ys_right;
    var horiz_a, horiz_b;

    // Get the equations, f(x) = ax + b, of the four edges of the quadrilateral area
    // Top edge
    if (xs1 == xs0)
        a_top = 100000.0;
    else
        a_top = ((ys1) - (ys0)) / ((xs1) - (xs0));

    b_top = (ys0) - a_top * (xs0);


    // Bottom edge
    if (xs2 == xs3)
        a_bottom = 100000.0;
    else
        a_bottom = ((ys2) - (ys3)) / ((xs2) - (xs3));

    b_bottom = (ys3) - a_bottom * (xs3);

    // Left edge
    if (xs3 == xs0)
        a_left = 100000.0;
    else
        a_left = ((ys3) - (ys0)) / ((xs3) - (xs0));
    b_left = (ys0) - a_left * (xs0);


    // Right edge
    if (xs2 == xs1)
        a_right = 100000.0;
    else
        a_right = ((ys2) - (ys1)) / ((xs2) - (xs1));
    b_right = (ys1) - a_right * (xs1);


    // For every horizontal line
    for (yt = yt0; yt < yt3; yt++) {

        // Find the corresponding y on the left edge of the quadrilateral area
        //   (adjust according to the lengths but do not consider the perspective)
        ys_left = ((yt) * ((ys3) - (ys0)) / ((yt3) - (yt0)));
        ys_left += (ys0);

        // Find the corresponding x on the left edge of the quadrilateral area
        xs_left = (ys_left - b_left) / a_left;

        // Find the corresponding of y on the right edge of the quadrilateral area
        //   (adjust according to the lengths but do not consider the perspective)
        ys_right = ((yt) * ((ys2) - (ys1)) / ((yt2) - (yt1)));
        ys_right += (ys1);

        // Find the corresponding x on the left edge of the quadrilateral area
        xs_right = (ys_right - b_right) / a_right;

        // Find the equation of the line joining the points on the left and the right edges
        if (xs_right == xs_left)
            horiz_a = 100000.0;
        else
            horiz_a = ((ys_right) - (ys_left)) / ((xs_right) - (xs_left));
        horiz_b = (ys_left) - horiz_a * (xs_left);


        // For every point in an horizontal line
        for (xt = xt0; xt < xt1; xt++) {
            // Find the corresponding x on the edge
            xs = ((xt) * ((xs_right) - (xs_left)) / ((xt1) - (xt0)));
            xs += (xs_left);
            //    - adjust with the perspective effect, i.e. things near the base of a trapez are bigger

            // Find the corresponding y with the equation of the line
            ys = horiz_a * xs + horiz_b;

            // Copy a pixel
            //c = GetPixel(hdc, (int)(xs) + view_org_xs, (int)(ys) + view_org_ys);
            //SetPixel(hdc, xt + view_org_xt, yt + view_org_yt, c);

            var dy = Math.round(ys);
            var dx = Math.round(xs);

            //var c = floor_tex[dy][dx];
            var c = bilinear_filter(floor_tex, xs, ys, floor_tex_width, floor_tex_width);
            //var c=0;
            // if (c != 0) c=0; else c=255;
            //   c=0;

            pixel(buffer_data, xt + (floor_tex_width * 2), yt + (floor_tex_width * 2), c.r, c.g, c.b);

        }


    }
}

/**
 //? =============================================
 // Draw a projection of the source to the target
 // ============================================= *
 static int draw_source2target(HDC hdc)
 {
     int xt, yt; double xs, ys;
     COLORREF c;
     double a_top, b_top, a_bottom, b_bottom, a_left, b_left, a_right, b_right;
     double xs_left, ys_left, xs_right, ys_right; double horiz_a, horiz_b;

     // Get the equations, f(x) = ax + b, of the four edges of the quadrilateral area
     // Top edge
     if (xs1 == xs0)
         a_top = 100000.0;
     else
         a_top = ((double)(ys1) - (double)(ys0)) / ((double)(xs1) - (double)(xs0));
     b_top = (double)(ys0) - a_top * (double)(xs0);

     // Bottom edge
     if (xs2 == xs3)
         a_bottom = 100000.0;
     else
         a_bottom = ((double)(ys2) - (double)(ys3)) / ((double)(xs2) - (double)(xs3));
     b_bottom = (double)(ys3) - a_bottom * (double)(xs3);

     // Left edge
     if (xs3 == xs0)
         a_left = 100000.0;
     else
         a_left = ((double)(ys3) - (double)(ys0)) / ((double)(xs3) - (double)(xs0));
     b_left = (double)(ys0) - a_left * (double)(xs0);

     // Right edge
     if (xs2 == xs1)
         a_right = 100000.0;
     else
         a_right = ((double)(ys2) - (double)(ys1)) / ((double)(xs2) - (double)(xs1));
     b_right = (double)(ys1) - a_right * (double)(xs1);

     // For every horizontal line
     for (yt = yt0; yt < yt3; yt++) {

         // Find the corresponding y on the left edge of the quadrilateral area
         //   (adjust according to the lengths but do not consider the perspective)
         ys_left = ((double)(yt) * ((double)(ys3) - (double)(ys0)) / ((double)(yt3) - (double)(yt0)));
         ys_left += (double)(ys0);

         // Find the corresponding x on the left edge of the quadrilateral area
         xs_left = (ys_left - b_left) / a_left;

         // Find the corresponding of y on the right edge of the quadrilateral area
         //   (adjust according to the lengths but do not consider the perspective)
         ys_right = ((double)(yt) * ((double)(ys2) - (double)(ys1)) / ((double)(yt2) - (double)(yt1)));
         ys_right += (double)(ys1);

         // Find the corresponding x on the left edge of the quadrilateral area
         xs_right = (ys_right - b_right) / a_right;

         // Find the equation of the line joining the points on the left and the right edges
         if (xs_right == xs_left)
             horiz_a = 100000.0;
         else
             horiz_a = ((double)(ys_right) - (double)(ys_left)) / ((double)(xs_right) - (double)(xs_left));
         horiz_b = (double)(ys_left) - horiz_a * (double)(xs_left);

         // For every point in an horizontal line
         for (xt = xt0; xt < xt1; xt++) {

             // Find the corresponding x on the edge
             xs = ((double)(xt) * ((double)(xs_right) - (double)(xs_left))
             / ((double)(xt1) - (double)(xt0)));
             xs += (double)(xs_left);
             //    - adjust with the perspective effect, i.e. things near the base of a trapez are bigger

             // Find the corresponding y with the equation of the line
             ys = horiz_a * xs + horiz_b;

             // Copy a pixel
             c = GetPixel(hdc, (int)(xs) + view_org_xs, (int)(ys) + view_org_ys);
             SetPixel(hdc, xt + view_org_xt, yt + view_org_yt, c);
         }

     }

     return TRUE;
 }
 */

// RunPixelTest2();

function RunPixelTest2()
{
    buffer_data = buffer_context.getImageData(0,0,SCREEN_WIDTH, SCREEN_HEIGHT);
    var dest_size = 256;

    for (var by=0; by<floor_tex_width; by++)
    {
        for (var bx=0; bx<floor_tex_width; bx++)
        {
            var c = floor_tex[by][bx];

            //if (c != 0) c=0; else c=255;
            pixel(buffer_data, bx+2, by+2, c.r, c.g, c.b);
        }
    }

    var src = [[15,15], [floor_tex_width-1, 0], [floor_tex_width-1, floor_tex_width-1], [0, floor_tex_width-1]];
    //src = [[0,0], [31, 0], [31,31], [0, 31]];
    var dst = [[0,0], [dest_size-1, 0], [dest_size-1, dest_size-1], [0, dest_size-1]];

    //quadperspective2(src,dst);
    draw_source2target(src, dst);

    buffer_context.putImageData(buffer_data, 0, 0);
}