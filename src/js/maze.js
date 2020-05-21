// maze.js

var Maze = Maze || {};

var create = function (mazeHeight, mazeWidth) {
    var maze = [];
    var moves = [];

    for (var i = 0; i < mazeHeight; i++) {
        maze[i] = [];
        for (var j = 0; j < mazeWidth; j++) {
            maze[i][j] = 1;
        }
    }
    var posX = 1;
    var posY = 1;
    maze[posX][posY] = 0;
    moves.push(posY + posY * mazeWidth);
    while (moves.length) {
        var possibleDirections = "";
        if (posX + 2 > 0 && posX + 2 < mazeHeight - 1 && maze[posX + 2][posY] == 1) {
            possibleDirections += "S";
        }
        if (posX - 2 > 0 && posX - 2 < mazeHeight - 1 && maze[posX - 2][posY] == 1) {
            possibleDirections += "N";
        }
        if (posY - 2 > 0 && posY - 2 < mazeWidth - 1 && maze[posX][posY - 2] == 1) {
            possibleDirections += "W";
        }
        if (posY + 2 > 0 && posY + 2 < mazeWidth - 1 && maze[posX][posY + 2] == 1) {
            possibleDirections += "E";
        }
        if (possibleDirections) {
            var move = randomIntBetween(0, possibleDirections.length - 1);
            switch (possibleDirections[move]) {
                case "N":
                    maze[posX - 2][posY] = 0;
                    maze[posX - 1][posY] = 0;
                    posX -= 2;
                    break;
                case "S":
                    maze[posX + 2][posY] = 0;
                    maze[posX + 1][posY] = 0;
                    posX += 2;
                    break;
                case "W":
                    maze[posX][posY - 2] = 0;
                    maze[posX][posY - 1] = 0;
                    posY -= 2;
                    break;
                case "E":
                    maze[posX][posY + 2] = 0;
                    maze[posX][posY + 1] = 0;
                    posY += 2;
                    break;
            }
            moves.push(posY + posX * mazeWidth);
        }
        else {
            var back = moves.pop();
            posX = Math.floor(back / mazeWidth);
            posY = back % mazeWidth;
        }
    }

    return maze;
}

var draw = function(maze, PIXI, layer, texture, AddSpriteHandlers)
{
	//console.log(maze, texture);
	for (var x = 0; x < maze.length; x++)
	{
		for (var y = 0; y < maze[0].length; y++)
		{
			var sprite;
			if (maze[x][y]==1 )
			{
				if (texture)
				{
					sprite = new PIXI.Sprite(texture);
					sprite.width = 50;
					sprite.height = 50;
					sprite.name = sprite.texture.baseTexture.textureCacheIds[0].split('.')[0] + '.' + x + '.' + y;
				} 
				else
				{
					sprite = new PIXI.Graphics();
					sprite.beginFill(0xaaaaff);
					sprite.drawRect(0, 0, 50, 50);
					sprite.endFill();
					sprite.name = 'maze' + '.' + x + '.' + y;
					
				}
				layer.addChild(sprite);
				sprite.x = x * 50;
				sprite.y = y * 50;
			

				if (AddSpriteHandlers)
				{
					AddSpriteHandlers(sprite);
				}
			}
		}
	}
}

var randomIntBetween = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

Object.defineProperty(exports, "__esModule", {
    value: true
  });

exports.create = create;
exports.draw = draw;
//exports.default = 21; 