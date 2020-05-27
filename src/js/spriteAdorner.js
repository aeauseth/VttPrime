// Sprite Adorner
// Created by Aaron Auseth
// March 2020

// REF: https://pixijs.io/pixi-filters/docs/index.html
import {DropShadowFilter} from '@pixi/filter-drop-shadow';
import * as PIXI from 'pixi.js';
//import { Rectangle } from 'pixi.js';

export var createAdorner = function (sprite, overlayContainer) {
    console.log("createAdorner " + sprite.name, sprite);

    // Make sure sprite has id
    if (!sprite.id)
    {
        sprite.id = uuidv4();
    }

    if (!overlayContainer && sprite.adorner)
    {
        overlayContainer = sprite.adorner.parent;
    }

    if (!sprite) { console.log("missing sprite", sprite); return; }
    if (!overlayContainer) { console.log("missing overlayContainer", overlayContainer); return; }
    if (!overlayContainer.name) { console.log("bad overlayContainer", overlayContainer); return; }
    if (overlayContainer.name != 'overlay') { console.log("bad overlayContainer", overlayContainer); return; }
    // if (!PIXI) { console.log("missing PIXI", PIXI); return; }

    var stage = overlayContainer.parent;
    

    // Create container
    if (!sprite.adorner)
    {
        sprite.adorner = overlayContainer.addChild(new PIXI.Container());
    }

    sprite.adorner.removeChildren();

    var boundingBox = sprite.adorner.addChild(new PIXI.Container());
    boundingBox.x = sprite.x;
    boundingBox.y = sprite.y;

    // Red Line
    let solidRect = boundingBox.addChild(new PIXI.Graphics());
    solidRect.clear();
    solidRect.lineStyle(3 / stage.scale.x, 0x800000, 1);
    solidRect.drawRect(0, 0, sprite.width, sprite.height);
    //solidRect.x = sprite.x;
    //solidRect.y = sprite.y;
    solidRect.filters = [new DropShadowFilter()];

    // drawDashedPolygon (white)
    let dashRect = boundingBox.addChild(new PIXI.Graphics());
    dashRect.clear();
    dashRect.lineStyle(2 / stage.scale.x, 0xffffff, 1);
    let polygons = [];
    polygons.push({ x: 0, y: 0 });
    polygons.push({ x: sprite.width, y: 0 });
    polygons.push({ x: sprite.width, y: sprite.height });
    polygons.push({ x: 0, y: sprite.height });
    var step = 5 / stage.scale.x;
    dashRect.drawDashedPolygon(polygons, 0, 0, 0, step, step * 1.5, 0);

    // circles
    let circle = sprite.adorner.addChild(new PIXI.Graphics());
    circle.lineStyle(3 / stage.scale.x, 0x800000, 1);
    circle.drawCircle(0, 0, 5);



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



export var deleteAdorner = function (sprite) {
    console.log("deleteAdorner " + sprite.name, sprite);
    if (!sprite.adorner) return;
    sprite.adorner.parent.removeChild(sprite.adorner);
    sprite.adorner = undefined;
}


// Object.defineProperty(exports, "__esModule", {
//     value: true
//   });

// exports.createAdorner = createAdorner;
// exports.deleteAdorner = deleteAdorner;
