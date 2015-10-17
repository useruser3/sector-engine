/**
 * Created by alan on 01/10/15.
 */

function PerspectiveProjector(screen_width, screen_height, fov)
{
    this.width = screen_width;
    this.height = screen_height;
    this.w2 = screen_width / 2;
    this.h2 = screen_height / 2;
    this.aspect = screen_width / screen_height;
    this.hfov = fov * (Math.PI /180);
    this.focal_length = this.w2 / Math.tan((fov * (Math.PI /180))/2);
    this.vfov = 2 * Math.atan(this.h2 / this.focal_length);

    this.getEdge = function(player, r1, r2, yceil, yfloor)
    {
        // pitch angle for lookup/down
        var radv = player.pitch * Math.PI / 180;

        var xscale1 = (this.width * this.hfov) / r1.z;
        var yscale1 = (this.height * this.vfov) / r1.z;
        var x1 = this.w2 + Math.floor(-r1.x * xscale1);

        var xscale2 = (this.width * this.hfov) / r2.z;
        var yscale2 = (this.height * this.vfov) / r2.z;
        var x2 = this.w2 + Math.floor(-r2.x * xscale2);

        var y1b = this.h2 + Math.floor(-Yaw(yceil, r1.z, radv) * yscale1);
        var y2b = this.h2 + Math.floor(-Yaw(yceil, r2.z, radv) * yscale2);

        var y1a = this.h2 + Math.floor(-Yaw(yfloor, r1.z, radv) * yscale1);
        var y2a = this.h2 + Math.floor(-Yaw(yfloor, r2.z, radv) * yscale2);

        return {
            x1: x1,
            x2: x2,
            y1a: y1a,
            y1b: y1b,
            y2a: y2a,
            y2b: y2b,
            xscale1: xscale1,
            xscale2: xscale2,
            yscale1: yscale1,
            yscale2: yscale2
        }
    };

    this.unProjectScreen = function(player, mapY, screenX, screenY)
    {
        var Z = mapY * this.height * this.vfov /
                    ((this.h2 - screenY) - player.pitch * this.height * this.vfov);

        var X = Z * (this.w2 - screenX) / (this.width * this.hfov);

        var rv = player.v * Math.PI/180;

        var s = Math.sin(rv);
        var c = Math.cos(rv);

        var rtx = Z * c + X * s;
        var rtz = Z * s - X * c;

        X = rtx + player.x;
        Z = rtz + player.y;

        return {x: X, z: Z};
    };

    this.projectPortalSector = function(edge, r1, r2, nextCeil, nextFloor)
    {
        var radv = player.pitch * Math.PI / 180;

        var ny1b = this.h2 + Math.floor( -Yaw(nextCeil, r1.z, radv) * edge.yscale1);
        var ny2b = this.h2 + Math.floor( -Yaw(nextCeil, r2.z, radv) * edge.yscale2);

        var ny1a = this.h2 + Math.floor( -Yaw(nextFloor, r1.z, radv) * edge.yscale1);
        var ny2a = this.h2 + Math.floor( -Yaw(nextFloor, r2.z, radv) * edge.yscale2);

        return {
            y1a: ny1a,
            y1b: ny1b,
            y2a: ny2a,
            y2b: ny2b
        }

    }



}

function Yaw(y,z,py)
{
    return (y + z * py);
}


function Edge(player, r1, r2)
{



}