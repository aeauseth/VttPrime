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

		
		

		var overlayContainer = stage.overlayContainer;



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
			//sprite.adorner.x = sprite.x;
			//sprite.adorner.y = sprite.y;
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

		// Pivot
		//sprite.adorner.pivot.set(0.5, 0.5);
		boundingBox.pivot.set(sprite.width /2, sprite.height /2);
		sprite.SetOrigin();


}



function onDocumentMouseWheel(e)
{
	if (e.shiftKey)
	{
		if (window.stage.selectedItems.length == 1)
		{
			let sprite = window.stage.selectedItems[0];

			var delta = 45;

			if (e.ctrlKey)
			{
				delta = 5;
			}

			if (e.deltaY < 0)
			{
				sprite.angle += delta;
			} 
			else
			{
				sprite.angle -= delta;
			}

			// Angle Snap (default)
			if (!e.ctrlKey)
			{
				sprite.angle = Math.round(sprite.angle / 45) * 45;
			}

			sprite.adorner.angle = sprite.angle;
			//console.log(sprite.angle.toFixed(0), sprite.x, sprite.y, sprite.pivot.x, sprite.pivot.y);

			// Position nameplate
			window.stage.overlayContainer.namePlate.update();

			window.layers["background"].updateVlb();
			
		}
		return;
	}

	window.stage.selectedItems.forEach(sprite =>
		{
			sprite.addAdorner();
		}
	);
}


function onResizeStart(e)
{
	let resizer = e.currentTarget;
	let stage = resizer.GetStage();
	
	// store a reference to the mouse data
	resizer.data = e.data;

	resizer.dragging = true;

	// store where we clicked within the sprite (dragOffset)
	resizer.data.dragOffset = e.data.getLocalPosition(resizer.parent);
	resizer.data.dragOffset.x = resizer.data.dragOffset.x - resizer.x;
	resizer.data.dragOffset.y = resizer.data.dragOffset.y - resizer.y;

	//console.log(resizer.position.x , resizer.sprite.x);
	e.stopPropagation();
}

function onResizeEnd(e)
{
	let resizer = e.currentTarget;
	resizer.dragging = false;

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

					let width = resizer.position.x + 0;
					let height = resizer.position.y + 0;

					// Hold SHIFT key to keep height/width ratio
					if (e.data.originalEvent.shiftKey) {
						let ratio = resizer.sprite._texture.height / resizer.sprite._texture.width;
						//console.log(resizer.sprite);
						height = width * ratio;
					}

					// Hold CTRL key for size snap
					if (e.data.originalEvent.ctrlKey) {
						width = Math.max(25, Math.round(width / 50) * 50);
						height = Math.max(25, Math.round(height / 50) * 50);
					}

					// Update sprite size
					resizer.sprite.width = width;
					resizer.sprite.height = height;

					// Hack reposition (x/y are center, _x/_y are actual)
					resizer.sprite.SetOriginR()

					// Update adorner
					resizer.sprite.addAdorner();

					window.layers["background"].updateVlb();

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

PIXI.Sprite.prototype.SetOrigin = function ()
{
	// Pivot alters the origin; workaround
	if (this._x == undefined) {
		this._x = this.x;
		this._y = this.y;
		this.x += this.width /2;
		this.y += this.height /2;
	} 
	else
	{
		this._x = this.x - this.width /2;
		this._y = this.y - this.height /2;
	}
	
	if (this.adorner)
	{
		this.adorner.x = this.x;
		this.adorner.y = this.y;
	}
}

PIXI.Sprite.prototype.SetOriginR = function ()
{
	// Set x/y based on _x/_y as authoritive
	this.x = this._x + this.width /2;
	this.y = this._y + this.height /2;
	
	
	if (this.adorner)
	{
		this.adorner.x = this.x;
		this.adorner.y = this.y;
	}
}

window.PIXI = PIXI;

var deleteAdorner = function (sprite) {
    //console.log("deleteAdorner " + sprite.name, sprite);
    if (!sprite.adorner) return;
    sprite.adorner.parent.removeChild(sprite.adorner);
		sprite.adorner = undefined;
		sprite.off("mousemove", onDragMove);
}

// Stage MouseWheel Handler
if (!window.hasMouseWheelSpriteAdorner)
{
	document.addEventListener("mousewheel", onDocumentMouseWheel, false);
	window.hasMouseWheelSpriteAdorner = true;
}

// Object.defineProperty(exports, "__esModule", {
//     value: true
//   });

// exports.createAdorner = createAdorner;
// exports.deleteAdorner = deleteAdorner;
