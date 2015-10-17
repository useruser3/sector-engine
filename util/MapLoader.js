
function MapSector(vert_index, vert_count, floorz, ceilz)
{
    this.vert_index = vert_index;
    this.vert_count = vert_count;
    this.walls = [];
    this.neighbours = [];
    this.floor_height = floorz;
    this.ceiling_height = ceilz;


    this.calc_neighbours = function(vertices)
    {
        for (var t=this.vert_index; t<this.vert_index+this.vert_count; t++)
        {
            var v = vertices[t];
            if (v.next_sector != -1)
                this.neighbours.push(v.next_sector);

        }

    };

    this._calc_wall_width = function(v1, v2)
    {
        var xdiff = (v1.x - v2.x);
        var ydiff = (v1.y - v2.y);

        return Math.sqrt((xdiff * xdiff) + (ydiff*ydiff));

    };

    this.extract_walls = function(vertices)
    {
        this.walls = [];

        for (var t=this.vert_index; t<this.vert_index+this.vert_count-1; t++)
        {
            this.walls.push({
                p1: t,
                p2: t+1,
                portalTo: vertices[t].next_sector,
                width: (this._calc_wall_width(vertices[t], vertices[t+1]))
            })
        }

        this.walls.push({
            p1: t,
            p2: this.vert_index,
            portalTo: vertices[t].next_sector,
            width: (this._calc_wall_width(vertices[this.vert_index], vertices[t]))
        })

    };
}

function MapVertex(x, y, j, nw, ns)
{
    this.x = x;
    this.y = y;
    this.join = j;
    this.next_wall = nw;
    this.next_sector = ns;
}


function Map()
{
    this.sectors = [];
    this.vertices = [];
    this.player = {};

    var that = this;

    this.load = function(path, scale, cb)
    {
        this._getFile(path, Bind(function(){
            this.parse();

            this.finalise(scale);
            //console.log(this);
            cb();
        }, this));

    };

    this.finalise = function(scale)
    {
        var ANGLE_SCALE = 2048;

        var sf = scale || 1.0;
        // scale world objects (BUILD is integer only, so scales are enormous for precision)

        this.player.start_x *= sf;
        this.player.start_y *= sf;
        this.player.start_z *= sf;

        this.player.start_ang = (this.player.start_ang / ANGLE_SCALE) * 360;

        var extent_y =0;
        for (var t=0; t< this.vertices.length; t++)
            if (this.vertices[t].y > extent_y) extent_y = this.vertices[t].y;

        for (t=0; t<this.vertices.length; t++)
        {
            //this.vertices[t].y = extent_y - (this.vertices[t].y);
            //this.vertices[t].y = -this.vertices[t].y;
            //this.vertices[t].y += bigY;

            this.vertices[t].x *= sf;
            this.vertices[t].y *= sf;
        }


        for (t=0; t<this.sectors.length; t++)
        {
            this.sectors[t].calc_neighbours(this.vertices);
            this.sectors[t].extract_walls(this.vertices);

            this.sectors[t].height *= sf * 0.1;
            this.sectors[t].floor_height *= sf  *-0.1;
            this.sectors[t].ceiling_height *= sf *-0.1 ;

          //  console.log("***** SECTOR *****");
            for (var w=0; w<this.sectors[t].walls.length; w++)
            {
            //    console.log("Wall: ", this.vertices[this.sectors[t].walls[w].p1],this.vertices[this.sectors[t].walls[w].p2] );
            }
          //  console.log(this.sectors[t].floor_height, this.sectors[t].ceiling_height);


        }


    };

    this._getFile = function(path, callback)
    {
        var oReq = new XMLHttpRequest();
        oReq.open("GET", path, true);
        oReq.responseType = "arraybuffer";

        oReq.onload = function (oEvent) {
            var arrayBuffer = oReq.response; // Note: not oReq.responseText
            if (arrayBuffer) {
                that.data = arrayBuffer;//new Uint8Array(arrayBuffer);
                callback();
            }

        };

        oReq.send(null);
    };


    this.parse = function()
    {
        var reader = new DataView(that.data);

        var version = reader.getInt32(0, true);
        this.player.start_x = reader.getInt32(4, true);
        this.player.start_y = reader.getInt32(8, true);
        this.player.start_z = reader.getInt32(12, true);
        this.player.start_ang = reader.getInt16(16, true);
        this.player.start_sector = reader.getInt16(18, true);



        var num_sectors = reader.getInt16(20, true);

        this.sectors = [];
        this.vertices = [];

        var fp = 20 + 2;

        for (var t=0; t<num_sectors; t++)
        {
            var wall_ptr = reader.getInt16(fp, true); fp+=2;
            var wall_num = reader.getInt16(fp, true); fp+=2;

            var ceiling_z = reader.getInt32(fp, true); fp+=4;
            var floor_z = reader.getInt32(fp, true); fp+=4;

            fp += 28;

            this.sectors.push(new MapSector(wall_ptr, wall_num, floor_z, ceiling_z));

        }

        var num_walls = reader.getInt16(fp, true);

        fp += 2;
        console.log("Num walls = ", num_walls);

        for (var t=0; t<num_walls; t++)
        {
            var wx = reader.getInt32(fp, true); fp +=4;
            var wy = reader.getInt32(fp, true); fp +=4;
            var join = reader.getInt16(fp, true); fp +=2;
            var next_wall = reader.getInt16(fp, true); fp +=2;
            var next_sector = reader.getInt16(fp, true); fp +=2;

            this.vertices.push(new MapVertex(wx, wy, join, next_wall, next_sector));

            fp += 18;
        }

    }


}