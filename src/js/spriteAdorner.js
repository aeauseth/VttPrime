// Sprite Adorner
// Created by Aaron Auseth
// March 2020

// REF: https://pixijs.io/pixi-filters/docs/index.html
import {DropShadowFilter} from '@pixi/filter-drop-shadow';
import * as PIXI from 'pixi.js';
//import { Rectangle } from 'pixi.js';



var createAdorner = function (sprite) {
		//console.log("createAdorner " + sprite.name, sprite);
		
		var stage = sprite.GetStage();

		// Add to selected items
		if (!stage.selectedItems)
		{
			stage.selectedItems = [];
		}
		

		var overlayContainer = stage.overlayContainer;

    // Make sure sprite has unique id
    if (!sprite.id)
    {
        sprite.id = uuidv4();
    }

    if (!overlayContainer && sprite.adorner)
    {
        overlayContainer = sprite.adorner.parent;
    }

    // if (!sprite) { console.log("missing sprite", sprite); return; }
    // if (!overlayContainer) { console.log("missing overlayContainer", overlayContainer); return; }
    // if (!overlayContainer.name) { console.log("bad overlayContainer", overlayContainer); return; }
    // if (overlayContainer.name != 'overlay') { console.log("bad overlayContainer", overlayContainer); return; }
    // if (!PIXI) { console.log("missing PIXI", PIXI); return; }

    

    // Create container
    // if (!sprite.adorner)
    // {
		// 		sprite.adorner = overlayContainer.addChild(new PIXI.Container());
		// 		sprite.adorner.name = "adorner";
		// }
		
		//sprite.adorner.removeChildren();

		var boundingBox = sprite.adorner;
		if (!boundingBox) 
		{
			boundingBox = sprite.adorner = overlayContainer.addChild(new PIXI.Container());
			boundingBox.name = "boundingBox";
			stage.selectedItems.push(sprite);
		}
		
    //boundingBox.x = sprite.x;
    //boundingBox.y = sprite.y;

		// Red Line
		let solidRect = boundingBox.children[0];
		if (!solidRect) 
		{
			solidRect = boundingBox.addChild(new PIXI.Graphics());
		}
		solidRect.clear();
		solidRect.name = "solidRect";
    solidRect.lineStyle(3 / stage.scale.x, 0x800000, 1);
    solidRect.drawRect(0, 0, sprite.width, sprite.height);
    solidRect.filters = [new DropShadowFilter()];

		// drawDashedPolygon (white)
		let dashRect = boundingBox.children[1];
		if (!dashRect) 
		{
			dashRect = boundingBox.addChild(new PIXI.Graphics());
		}
		dashRect.clear();
		dashRect.name = "dashRect";
    dashRect.lineStyle(2 / stage.scale.x, 0xffffff, 1);
    let polygons = [];
    polygons.push({ x: 0, y: 0 });
    polygons.push({ x: sprite.width, y: 0 });
    polygons.push({ x: sprite.width, y: sprite.height });
    polygons.push({ x: 0, y: sprite.height });
    var step = 5 / stage.scale.x;
		dashRect.drawDashedPolygon(polygons, 0, 0, 0, step, step * 1.5, 0);
		
		// Mouse Move Handler
		sprite.on("mousemove", onDragMove);




		// Resize Handle
		var resizer = boundingBox.children[2];
		if (!resizer) 
		{
			resizer = boundingBox.addChild(new PIXI.Sprite.from("resize1.png"));
			//console.log(boundingBox.children);
			resizer.cursor = 'move';
			resizer.interactive = true;
			resizer.name = 'resizeHandle';
			resizer.sprite = sprite;
			
			resizer.anchor.x = 1;
			resizer.anchor.y = 1;
			resizer.on("mousedown", onResizeStart)
			resizer.on("mouseup", onResizeEnd);
			resizer.on("mouseupoutside", onResizeEnd);
			resizer.on("mousemove", onResizeMove);
		}

		resizer.width = Math.min(sprite.width / 2, 25);
		resizer.height = Math.min(sprite.width / 2, 25);

		resizer.x = sprite.width;
		resizer.y = sprite.height;

		

    // circles
    
    // let points = [ [0, 0], 
    //     [sprite.width, 0], 
    //     [sprite.width, sprite.height],
    //     [0 , sprite.height] 
    // ];
    // for (let p = 0; p < points.length; p++)
    // {
		// 	let circle = boundingBox.addChild(new PIXI.Graphics());
    //     circle.lineStyle(1 / stage.scale.x, 0x000000, 1);
    //     circle.beginFill(0x9999ff);
    //     circle.drawCircle(points[p][0], points[p][1], 5 / stage.scale.x);
    //     circle.endFill();
    //     circle.interactive = true;
    //     if (p % 2 == 0) {
    //         circle.cursor = "nwse-resize";
    //     } else
    //     {
    //         circle.cursor = "nesw-resize";
    //     }
        
        
    // }



}

// sprite.interactive = true;

// 			sprite.cursor = "pointer";

function onDocumentMouseWheel()
{
	//sprite.addAdorner();
	window.stage.selectedItems.forEach(e =>
		{
		e.addAdorner();
		}
	);
}

function onResizeStart(e)
{
	let resizer = e.currentTarget;
	let stage = resizer.GetStage();
	
	


	//console.log("onResizeStart", resizer.name);
      

	// store a reference to the mouse data
	resizer.data = e.data;

	resizer.dragging = true;

	// store where we clicked within the sprite (dragOffset)
	resizer.data.dragOffset = e.data.getLocalPosition(resizer.parent);
	resizer.data.dragOffset.x = resizer.data.dragOffset.x - resizer.x;
	resizer.data.dragOffset.y = resizer.data.dragOffset.y - resizer.y;



	//console.log(resizer.position.x , resizer.sprite.x);

}

function onResizeEnd(e)
{
	let resizer = e.currentTarget;
	resizer.dragging = false;

	//resizer.sprite.width = resizer.position.x + 0;
	//resizer.sprite.height = resizer.position.y + 0;
	//resizer.sprite.addAdorner();

	// set the interaction data to null
	resizer.data = null;
}

function onResizeMove(e)
{
	let resizer = e.currentTarget;

	if (resizer.dragging)
      {
				var stage = resizer.GetStage();

					var newPosition = resizer.data.getLocalPosition(resizer.parent);
          resizer.position.x = newPosition.x - resizer.data.dragOffset.x;
					resizer.position.y = newPosition.y - resizer.data.dragOffset.y;

					
					resizer.sprite.width = resizer.position.x + 0;
					resizer.sprite.height = resizer.position.y + 0;
					
					//console.log(resizer.position.x , resizer.sprite.x, x); 
					//resizer.sprite.height = resizer.position.y - resizer.sprite.y;

					resizer.sprite.addAdorner();
					//setTimeout(resizer.sprite.addAdorner(), 1);

      }

}

function onDragMove(e)
{
	let sprite = e.currentTarget;
	let adorner = sprite.children[0];

	sprite.adorner.x = sprite.x;
	sprite.adorner.y = sprite.y;

}
			

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

PIXI.Container.prototype.__OnMove = function (rebuild)
{
    if (!rebuild)
    {
        this.adorner.children[0].x = this.x;
        this.adorner.children[0].y = this.y;
    } else
    {
        createAdorner(this);
    }
}

PIXI.Container.prototype.GetStage = function ()
{
	if (this.parent) 
		return this.parent.GetStage();
	else 
		return this;
}


PIXI.Container.prototype.addAdorner = function ()
{
	//console.log(this);
	createAdorner(this);
}

PIXI.Container.prototype.removeAdorner = function ()
{
	//console.log(this);
	deleteAdorner(this);
}

var deleteAdorner = function (sprite) {
    console.log("deleteAdorner " + sprite.name, sprite);
    if (!sprite.adorner) return;
    sprite.adorner.parent.removeChild(sprite.adorner);
    sprite.adorner = undefined;
}

// Stage Zoom Handler
document.addEventListener("mousewheel", onDocumentMouseWheel, false);

// Object.defineProperty(exports, "__esModule", {
//     value: true
//   });

// exports.createAdorner = createAdorner;
// exports.deleteAdorner = deleteAdorner;
