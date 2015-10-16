/**
 * Created by alan on 15/10/2015.
 */


function TextureManager()
{
    var that = this;
    this.textures = [];

    this.add = function(index,url)
    {
        var i = new Image();
        i.index = index;
        i.src = url;

        i.onload = function()
        {
            var texture = {
                w: this.width,
                h: this.height,
                img: this
            };
            console.log("Loaded: "+this.src);
            that.textures[this.index] = texture;
        }

    }

}