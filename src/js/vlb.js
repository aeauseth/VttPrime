//import Shape from '@doodle3d/clipper-js';  // REF: https://github.com/Doodle3D/clipper-js
import * as PIXI from 'pixi.js';

import * as ClipperLib from './clipper_unminified.js';

//const subjectPaths = [[{ X: 30, Y: 30 }, { X: 10, Y: 30 }, { X: 10, Y: 10 }, { X: 30, Y: 10 }]];
//const clipPaths = [[{ X: 20, Y: 20 }, { X: 0, Y: 20 }, { X: 0, Y:0 }, { X: 20, Y: 0 }]];

//const subject = new Shape(subjectPaths, true);
//const clip = new Shape(subjectPaths, true);

//const result = subject.intersect(clip);

//console.log(result);

PIXI.Container.prototype.updateVlb = function ()
{
    
    var diagStart = performance.now();

    var cpr = new ClipperLib.Clipper();
    var clipPaths  = [];
    var solution_paths = new ClipperLib.Paths();

    addClipPaths(this, clipPaths);

    cpr.AddPath(clipPaths[0], ClipperLib.PolyType.ptSubject, true);
    for (var i = 1; i < clipPaths.length; i++) {
        cpr.AddPath(clipPaths[i], ClipperLib.PolyType.ptClip, true);
    }
    
    cpr.Execute(ClipperLib.ClipType.ctUnion, 
        solution_paths); //, 
        //ClipperLib.PolyFillType.pftNonZero, 
        //ClipperLib.PolyFillType.pftNonZero);

    console.log("Autogeneration of VLB took " + (performance.now() - diagStart).toFixed(1) + "ms");
    
    drawVlb(solution_paths);

    //console.log(clipPaths, solution_paths);

    // graphics.lineStyle(2, 0x0000ff, 1);
    //     graphics.drawRect(child._x, child._y, child.width, child.height);
}

function drawVlb(paths)
{
    console.log(paths);
    var vlbContainer = window.stage.vlb;

    var graphics = vlbContainer.children[0];
    if (!graphics)
    {
        graphics = new PIXI.Graphics();
        vlbContainer.addChild(graphics);
    }
    
    graphics.clear();
    graphics.lineStyle(2, 0x0000ff, 1);

    for (var i = 0; i < paths.length; i++) {
		var lastPt = undefined;
        for (var j = 0; j < paths[i].length; j++) {
            console.log(paths[i][j].X, paths[i][j].Y);
            if (!j) {
                
				graphics.moveTo(paths[i][j].X, paths[i][j].Y);
				lastPt = [paths[i][j].X, paths[i][j].Y];
            }
            else {

				graphics.lineTo(paths[i][j].X, paths[i][j].Y);
				//window.segments.push([lastPt, [paths[i][j].X, paths[i][j].Y] ]);
				lastPt = [paths[i][j].X, paths[i][j].Y];


			}
			

		}
		//window.segments.push([lastPt, [paths[i][0].X, paths[i][0].Y]]);
        graphics.lineTo(paths[i][0].X, paths[i][0].Y);

	}


}
    
function addClipPaths(container, clipPaths)
{
    //for (var i = 0, len = container.children.length; i < len; i++) {
    for (var i = 0, len = 3; i < len; i++) {

        var child = container.children[i];
        if (child instanceof PIXI.Sprite) {
            var cp = [
                { X: child._x, Y: child._y },
                { X: child._x + child.width, Y: child._y },
                { X: child._x + child.width, Y: child._y + child.height },
                { X: child._x, Y: child._y + child.height }
            ];
            clipPaths.push(cp);
        }
        else {
            //console.log(child, "has " + child.children.length + " children");
            addClipPaths(child);
        }
    }
}


