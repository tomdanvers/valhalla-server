module.exports = function(data) {

    var width = data.width;
    var height = data.height;
    var tileWidth = data.tilewidth;
    var tileHeight = data.tileheight;

    var api = {
        getFloorColumn: getFloorColumn
    };

    api.tileWidth = tileWidth;
    api.tileHeight = tileHeight;
    api.widthPx = width * data.tilewidth;
    api.heightPx = height * data.tileheight;

    var layersMap = {};

    var floorLayer = getLayer('floor');

    var floorColumns = [];

    for (var i = 0; i < width; i ++) {

        floorColumns[i] = [];

        for (var j = 0; j < height; j ++) {
            if (floorLayer.data[j * width + i] != 0) {
                floorColumns[i][j] = floorLayer.data[j * width + i];
            }
        }
    }

    function getLayer(id){

        if (layersMap[id] === undefined) {
            for (var i = data.layers.length - 1; i >= 0; i--) {
                if(data.layers[i].name === id) layersMap[id] = data.layers[i];
            }
        }

        return layersMap[id];
    }

    function getFloorTile(x, y){

        x = Math.floor(x / tileWidth);
        y = Math.floor(y / tileHeight);
        return floorLayer.data[y * width + x];

    };

    function getFloorColumn(x){

        x = Math.floor(x / tileWidth);
        return floorColumns[x];

    }

    return api;

}
