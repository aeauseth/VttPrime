import * as PIXI from 'pixi.js';
import * as VisibilityPolygon from "./visibility_polygon_dev.js"


PIXI.Container.prototype.updateLos = function ()
{
    var diagStart = performance.now();

    const losContainer = window.stage.los;
    const vlbContainer = window.stage.vlb;
    const segments = vlbContainer.segments;

    // var maxLos = [
    //     [ [-1000, -1000], [1000, -1000] ],
    //     [ [1000, -1000], [1000, 1000] ],
    //     [ [1000, 1000], [-1000, 1000] ],
    //     [ [-1000, 1000], [-1000, -1000] ],
    // ]

    var graphics = losContainer.children[0];
    if (!graphics)
    {
        graphics = new PIXI.Graphics();
        losContainer.addChild(graphics);
    }

    // Clear previous and set line style
    graphics.clear();
    graphics.lineStyle(1, 0xffff00, 1);

    //var results = VisibilityPolygon.VisibilityPolygon.compute([this.x, this.y], segments);
    var results = VisibilityPolygon.VisibilityPolygon.computeViewport([this.x, this.y], segments, 
        [this.x - 1000, this.y -1000], 
        [this.x + 1000, this.y +1000] );

    graphics.beginFill(0xffff00, 0.5);
    for (let i = 0; i < results.length; i++) {
        if (i == 0) {
            graphics.moveTo(results[i][0], results[i][1]);
        } else {
            graphics.lineTo(results[i][0], results[i][1]);
        }
    }
    graphics.lineTo(results[0][0], results[0][1]); // close polygon
    graphics.endFill();

    var DiagMs = (performance.now() - diagStart).toFixed(1);
    return DiagMs;

}
