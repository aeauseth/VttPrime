<template>
  <div id='mapDiv'>
    <canvas id='mapCanvas'>
    </canvas>
      
    <v-list 
      id='listLayers'
      dense
    >
      <v-list-item-group v-model="layersSelectedIndex" mandatory>
        <v-list-item-title id="listLayersTitle" 
        class="indigo darken-2 text-center white--text" >
           
            <v-btn icon color="white"
            dense
            v-bind:style="{position: 'absolute', left:'0', marginTop:'-6px'}"
            >
            
            <v-icon title="edit layer properties"
            size="medium"
            >
              mdi-dots-vertical
            </v-icon>
            </v-btn> 
            LAYER
           
        </v-list-item-title>
        <draggable id="_dragList" 
        v-model="layersZindex" 
        @start="drag=true" 
        @end="drag=false"
        >

          <v-list-item
            v-for="(item, i) in layersZindex"
            :key="i"
            
          >
            
            <v-btn icon color="indigo">
            <v-icon v-if="item.visible" title="click to hide layer"
            @click="item.visible = false; DeselectSprite(selectedSprite)"
            size="small"
            dense
            >
              mdi-eye-outline
            </v-icon>
            <v-icon v-if="!item.visible" title="click to show layer"
            @click="item.visible = true"
            size="small"
            dense
            >
              mdi-eye-off

            </v-icon>
            </v-btn>

            
            

            <v-btn icon color="indigo">
            <v-icon v-if="!item.locked" title="click to lock layer"
            @click="item.locked = true"
            size="small"
            dense
            >
              mdi-lock-open-outline
            </v-icon>
            <v-icon v-if="item.locked" title="click to unlock layer"
            @click="item.locked = false"
            size="small"
            dense
            >
              mdi-lock

            </v-icon>

</v-btn>
            

            <v-list-item-content>
              <v-list-item-title v-text="item.name"
              title="click to select this layer.  click and drag to sort layers.">
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

        </draggable>
      </v-list-item-group>
      
    </v-list>
      
  </div>
</template>

<script>

import * as MAZE from '../js/maze.js'


import * as PIXI from 'pixi.js';
import * as SPRITEADORNER from '../js/spriteAdorner.js'

// REF: https://pixijs.io/pixi-filters/docs/index.html
import {DropShadowFilter} from '@pixi/filter-drop-shadow';

// REF: https://medium.com/vuetify/drag-n-drop-in-vuetify-part-i-166f2c7a4a82
import draggable from 'vuedraggable'

// REF: https://stackoverflow.com/questions/49977513/how-to-draw-dashed-line-across-the-rectangle-in-pixi-js-and-angular
PIXI.Graphics.prototype.drawDashedPolygon = function (polygons, x, y, rotation, dash, gap, offsetPercentage) {
	var i;
	var p1;
	var p2;
	var dashLeft = 0;
	var gapLeft = 0;
	if (offsetPercentage > 0) {
		var progressOffset = (dash + gap) * offsetPercentage;
		if (progressOffset < dash) dashLeft = dash - progressOffset;
		else gapLeft = gap - (progressOffset - dash);
	}
	let rotatedPolygons = [];
	for (i = 0; i < polygons.length; i++) {
		let p = { x: polygons[i].x, y: polygons[i].y };
		let cosAngle = Math.cos(rotation);
		let sinAngle = Math.sin(rotation);
		let dx = p.x;
		let dy = p.y;
		p.x = (dx * cosAngle - dy * sinAngle);
		p.y = (dx * sinAngle + dy * cosAngle);
		rotatedPolygons.push(p);
	}
	for (i = 0; i < rotatedPolygons.length; i++) {
		p1 = rotatedPolygons[i];
		if (i == rotatedPolygons.length - 1) p2 = rotatedPolygons[0];
		else p2 = rotatedPolygons[i + 1];
		let dx = p2.x - p1.x;
		let dy = p2.y - p1.y;
		let len = Math.sqrt(dx * dx + dy * dy);
		let normal = { x: dx / len, y: dy / len };
		let progressOnLine = 0;
		this.moveTo(x + p1.x + gapLeft * normal.x, y + p1.y + gapLeft * normal.y);
		while (progressOnLine <= len) {
			progressOnLine += gapLeft;
			if (dashLeft > 0) progressOnLine += dashLeft;
			else progressOnLine += dash;
			if (progressOnLine > len) {
				dashLeft = progressOnLine - len;
				progressOnLine = len;
			} else {
				dashLeft = 0;
			}
			this.lineTo(x + p1.x + progressOnLine * normal.x, y + p1.y + progressOnLine * normal.y);
			progressOnLine += gap;
			if (progressOnLine > len && dashLeft == 0) {
				gapLeft = progressOnLine - len;
				//console.log(progressOnLine, len, gap);
			} else {
				gapLeft = 0;
				this.moveTo(x + p1.x + progressOnLine * normal.x, y + p1.y + progressOnLine * normal.y);
			}
		}
	}
}

export default {
  name: 'MapPanel',
  props: {
    DiagProps: Array,
    ToolBarStatus: Object,
  },
  components: {
    draggable
  },
  data() {
    return {
        app: { stage: {children:[ {name: 'test15' } ]}},
        diag: {
          pixi: {
            containers: null,
            textureCache: null,
            test: null
          }
        },
        mousePosition: {x: 0, y: 0},
        prevMousePosition: {x: 0, y: 0},
        shaders: {
          gridShader: null,
        },
        layers: {
        },
        layersZindex: [],
        selectedSprite: null,
        layersSelectedIndex: 0,
        showLayerMenu: true,
        testList: [
          {name: "one"},
          {name: "two"},
          {name: "three"}
        ]

    }
  },

	methods: {

    countAllContainers(container)
    {
      var count = 0;
      //console.log(this.app.stage, container);
      count += 1;

      if (!container)
      {
        container = this.app.stage;
        count += 1;
      }

      for (var i = 0; i < container.children.length; i++)
      {
        count += this.countAllContainers(container.children[i]);
      }
      
      return count;
    },

    updateDiag() {
      // this.diag.pixi.containers = this.countAllContainers();
      // this.diag.pixi.textureCache = Object.keys(PIXI.utils.TextureCache).length;
      // this.diag.pixi.test = Math.floor(Math.random() * 100);
      // //this.$emit("DiagPixiUpdate", this.diag);
      // //window._PIXI = PIXI;
      // console.log(this.diag);

      //console.log(this.DiagProps[0]);
      this.DiagProps[0].children[0].name = "Containers: " + this.countAllContainers();
      this.DiagProps[0].children[1].name = "Textures: " + Object.keys(PIXI.utils.TextureCache).length;
      
    //    diagItems: [
    //     {
    //       id: 100,
    //       name: 'PIXI :',
    //       children: [
    //         { id: 101, name: 'Containers:' },
    //         { id: 102, name: 'Textures:' },
    //       ],
    //     },
    // ],

    },
		onResize() {
      //this.app.resize();
      //console.log("resize", width, height);
      let height = this.$el.parentElement.clientHeight;
      let width  = this.$el.parentElement.clientWidth;
      if (width)
      {
        //console.log("resize", width, height);
        this.app.renderer.resize(width, height);
        this.stageResize();
      }
      
    },

    createLayers() {

      var stage = window.stage = this.app.stage;
      stage.name = "stage";
      //stage.interactive = true;
      //stage.on("mousedown", this.stageMouseDownEventHandler);

      // KLUGE: grid & background are 65536 (or 1000 * 50) square centered at 0.
      //  A better solution would be to resize grid to viewport as needed.
      const width = 1000 * 50;
      const height = width;

      // (re) delare layers
      window.layers = this.layers = {};
      this.layersZindex = [];

      // Stage has three children (first one is a base image)
      let sprite = new PIXI.TilingSprite.from("Grass0027_1_270.jpg")
      sprite.width = width;
      sprite.height = height;
      sprite.x = Math.floor(-width / 2);
      sprite.y = sprite.x;
      let baseImageContainer = stage.addChild(sprite);
      baseImageContainer.name = 'baseImageContainer';
      stage.baseImageContainer = baseImageContainer;
      
      // Stage second child is a container for all the layers)
      let layersContainer = stage.addChild(new PIXI.Container());
      layersContainer.name = 'layerContainer';
      stage.layersContainer = layersContainer;
      
      // Stage third child is OVERLAY (should always be on top)
      let overlayContainer = stage.addChild(new PIXI.Container());
      overlayContainer.name = "overlay";
      stage.overlayContainer = overlayContainer;

      // BACKGROUND layer
      this.layers.background = layersContainer.addChild(new PIXI.Container());
      this.layers.background.name = "background";
      this.layers.background.addc

      // const textureBackground = PIXI.Texture.from("Grass0027_1_270.jpg");
      // var background = new PIXI.TilingSprite(textureBackground);
      // background.width = width;
      // background.height = height;
      // background.x = Math.floor(-width / 2);
      // background.y = background.x;
      // this.layers.background = layersContainer.addChild(background);
      // this.layers.background.name = "background";
      // this.layers.background.locked = false;
      

      // background.interactive = true;
      // background.hitArea = new PIXI.Rectangle(0, 0, width, height);
      // background.on("mousedown", this.stageMouseDownEventHandler);


      // GRID Layer (via GPU Shader)
      // An arbritarily large texture is not ideal.  
      // Repeating textures are better, but must be re-rendered during zoom.
      // Shader is a simpler implementation.  
      // Shader always has thin (1px) lines, regardless of scale.
      const vertShader = `
        attribute vec2 aVertexPosition;

        uniform mat3 projectionMatrix;

        varying vec2 vTextureCoord;

        uniform vec4 inputSize;
        uniform vec4 outputFrame;

        vec4 filterVertexPosition( void )
        {
            vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

            return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
        }

        vec2 filterTextureCoord( void )
        {
            return aVertexPosition * (outputFrame.zw * inputSize.zw);
        }

        void main(void)
        {
            gl_Position = filterVertexPosition();
            vTextureCoord = filterTextureCoord();
        }
      `;

      const fragShader = `
        varying vec2 vTextureCoord;

        uniform sampler2D uSampler;

        uniform float gridSize;
        uniform vec2 offset;
        uniform vec2 scale;

        void main(void){
          //vec2 whole;
          float modX = mod(( gl_FragCoord.x  - offset.x ) , gridSize * scale.x )  ;
          float modY = mod(( gl_FragCoord.y - offset.y ) , gridSize * scale.y )  ;
          float white1 = min(gridSize * scale.x / 8.0, gridSize / 8.0);
          float white2 = (gridSize * scale.y) - white1;
          
          if ( int(modX) == 0 ||
               int(modY) == 0 ) 
          {

            // Black grid lines
            gl_FragColor = vec4(0, 0, 0, 1);

            if (
              (modX < white1 && modY < white1 )
              ||
              (modX > white2|| modY > white2)
              )
            {
              // White intersections
              //gl_FragColor = vec4(1.0, 1.0, 1.0, 0.5);
            } 
           
          } 
          else
          {
            // Transparent pixel
            gl_FragColor = vec4(0,0,0,0);
          }
        }
      `;



      var uniforms = {};
      uniforms.gridSize = 50;
      uniforms.offset = { x: 0.0, y: this.app.renderer.view.height};
      uniforms.scale = { x: 1, y: 1 };
      this.shaders.gridShader = new PIXI.Filter(vertShader, fragShader, uniforms);
      const rect = new PIXI.Graphics();
      //rect.beginFill(0x330000);
      rect.drawRect(0, 0, width, height);
      //rect.endFill();
      //this.shaders.gridShader.blendMode = PIXI.BLEND_MODES.MULTIPLY;
      rect.filters = [this.shaders.gridShader];
      rect.name = "grid";
      rect.x = Math.floor(-width / 2);
      rect.y = rect.x;

      this.layers.grid = layersContainer.addChild(rect);


      
      // OBJECT layer
      this.layers.object = layersContainer.addChild(new PIXI.Container());
      this.layers.object.name = "object";

      var testObject = new PIXI.Graphics();
      testObject.beginFill(0xff0000);
      testObject.drawRect(0, 0, 1, 1);
      testObject.endFill();
      this.layers.object.addChild(testObject);

      var testObject2 = new PIXI.Graphics();
      testObject2.beginFill(0xff0000);
      testObject2.drawRect(0, 0, 1, 1);
      testObject2.endFill();
      testObject2.x = 49;
      testObject2.y = 49;
      this.layers.object.addChild(testObject2);
      

      // TOKEN layer
      this.layers.token = layersContainer.addChild(new PIXI.Container());
      this.layers.token.name = "token";
      

      
      const texture = PIXI.Texture.from("wizard7.png");
      var wizard7 = new PIXI.Sprite(texture);
      wizard7.x = 0;
      wizard7.y = 0;
      wizard7.width = 50;
      wizard7.height = 50;
      wizard7.name = "wizard7";
      this.AddSpriteHandlers(wizard7);
      this.layers.token.addChild(wizard7);

      //a280de439fa279e3b04893f619835961.png
      //var stormGiant = new PIXI.Sprite.from("a280de439fa279e3b04893f619835961.png");
      var frostGiant4 = new PIXI.Sprite.from("f3947d94db2c34d85bd6dd4c3da464a3.png");
      frostGiant4.x = 50;
      frostGiant4.y = 50;
      frostGiant4.width = 50;
      frostGiant4.height = 50;
      frostGiant4.name = "frostGiant4";
      this.AddSpriteHandlers(frostGiant4);
      this.layers.token.addChild(frostGiant4);



      // Layers Z index (used to sort layers)
      layersContainer.children.forEach( e => {
        this.layersZindex.splice(this.layersZindex, 0, e);
        e.interactiveChildren = false;  // default to no interaction
      });
      this.layersZindex[0].interactiveChildren = true;  // top layer (likely token) is active layer

      // Handlers
      // stage.interactive = true;
      // stage.on("mousemove", this.stageMouseMoveEventHandler);
      // stage.on("mousedown", this.stageMouseDownEventHandler);
      // stage.on("mouseup", this.stageMouseUpEventHandler);

      
    },

    AddSpriteHandlers(sprite) {
      // sprite.interactive = true;
      // sprite.buttonMode = true;
      // sprite.on("mousedown", this.SpriteMouseDown);
      // sprite.on("mouseup", this.SpriteMouseUp);
      // sprite.on("mouseover", this.SpriteMouseOver);
      // sprite.on("mouseout", this.SpriteMouseOut);

      sprite.interactive = true;
      sprite.on("mousedown", this.onDragStart)
      sprite.on("mouseup", this.onDragEnd);
      sprite.on("mouseupoutside", this.onDragEnd);
      sprite.on("mousemove", this.onDragMove);
      sprite.cursor = "pointer";

    },

    onDragStart(e) {
      let sprite = e.currentTarget;
      

      // store a reference to the mouse data
      sprite.data = e.data;

      // update UI
      sprite.cursor = "grabbing";
      sprite.addAdorner();
      sprite.dragging = true;

      // store where we clicked within the sprite (dragOffset)
      sprite.data.dragOffset = e.data.getLocalPosition(sprite.parent);
      sprite.data.dragOffset.x = sprite.data.dragOffset.x - sprite.x;
      sprite.data.dragOffset.y = sprite.data.dragOffset.y - sprite.y;

      //console.log("onDragStart", sprite, e.data, sprite.dragOffset);

    },

    onDragEnd(e) {
      let sprite = e.currentTarget;

      sprite.cursor = "pointer";
      sprite.dragging = false;
      //sprite.DestroyAdorner();

      // set the interaction data to null
      sprite.data = null;
    },

    onDragMove(e) {
      let sprite = e.currentTarget;
      if (sprite.dragging)
      {
          var newPosition = sprite.data.getLocalPosition(sprite.parent);
          sprite.position.x = newPosition.x - sprite.data.dragOffset.x;
          sprite.position.y = newPosition.y - sprite.data.dragOffset.y;
      }
    },


    SpriteMouseOver(e) {

      if (!this.app.stage.overlayContainer) return;
      if (!e) return;
      
      // Skip if any mouse button is down
      if (e.data.originalEvent.buttons > 0) return;

      // if (!e && this.namePlate) {
      //   let textElement = this.namePlate.children[1];
      //   textElement.style.fontSize = (2 * 1 / this.app.stage.scale.x).toFixed(2) + "em";
      //   return;
      // }

      // Ignore if not part of selected layer
      if(e.target.parent.name != this.layersZindex[this.layersSelectedIndex].name) return;


      let sprite = (e || {}).currentTarget;

      
      window.PIXI = PIXI;

      if (!this.app.stage.overlayContainer.namePlate) 
      {
        this.app.stage.overlayContainer.namePlate = this.app.stage.overlayContainer.addChild(new PIXI.Container());
        this.app.stage.overlayContainer.namePlate.addChild( new PIXI.Graphics());
        this.app.stage.overlayContainer.namePlate.addChild( new PIXI.Text());

      }

      let boxElement = this.app.stage.overlayContainer.namePlate.children[0];
      let textElement = this.app.stage.overlayContainer.namePlate.children[1];

      // 
      if (sprite) // && e.data.originalEvent.buttons != 1) 
      {
        textElement.text = sprite.name || "undefined";
        this.app.stage.overlayContainer.namePlate.visible = true;
        this.app.stage.overlayContainer.namePlate.sprite = sprite;
      } 

      // Text Element
      var scale = 1 /  Math.sqrt(this.app.stage.scale.x);
      if (scale > 1) {
        scale = 1 / this.app.stage.scale.x;
      }
      if (textElement)
      {
        textElement.style.fontSize = (2 * scale).toFixed(2) + "em";
        textElement.resolution = Math.max(1, this.app.stage.scale.x).toFixed(2);
        //console.log(textElement.style.fontSize, textElement.resolution);
      }


      // Box Element
      if (textElement && boxElement)
      {
        if (textElement.height && textElement.width)
        {
          boxElement.clear();
          boxElement.lineStyle(2 / this.app.stage.scale.x, 0xaaaaff);
          boxElement.beginFill(0x9999ff);
          let pad = Math.floor(textElement.height / 4);
          boxElement.drawRoundedRect(
            textElement.x - pad, 
            textElement.y, 
            textElement.width + pad * 2, 
            textElement.height, 
            6);
          boxElement.endFill();
        }
        
      }

      // Position Container
      if (this.app.stage.overlayContainer.namePlate.sprite && textElement)
      {
        this.app.stage.overlayContainer.namePlate.x = this.app.stage.overlayContainer.namePlate.sprite.x +this.app.stage.overlayContainer.namePlate.sprite.width / 2 - textElement.width /2;
        this.app.stage.overlayContainer.namePlate.y = this.app.stage.overlayContainer.namePlate.sprite.y + this.app.stage.overlayContainer.namePlate.sprite.height + 2;
      }

    },

    SpriteMouseOut(e) {

      // Skip if any mouse button is down
      if (e.data.originalEvent.buttons > 0) return;

      // hide namePlate
      if (this.app.stage.overlayContainer.namePlate)
      {
      this.app.stage.overlayContainer.namePlate.visible = false;
      }
      //e.currentTarget.mouseover = false;
      //this.SelectedSpriteResize();
    },
    
    SpriteMouseDown(e) {
      // We are only concered with left clicks
      if (e.data.originalEvent.buttons == 1) {

        if (e.target.name == 'resizeHandle')
        {
          this.selectedHandle = e.target;
          e.stopPropagation();
          return;
        }

        this.selectedHandle = null;

        // Ignore if not part of selected layer
        if(e.target.parent.name != this.layersZindex[this.layersSelectedIndex].name) return;
        this.SelectSprite(e.target);
        e.target.cursor = "grabbing";
        e.stopPropagation();
      }
    },

    SpriteMouseUp(e) {
      this.SpriteMouseOver(e);
      if (this.selectedSprite)
      {
        this.selectedSprite.cursor = "grab";
      }
    },

    SelectSprite(sprite) {
      //console.log("SelectSprite", sprite.name, sprite);

      if (this.selectedSprite)
      {
        // Do nothing if same sprite is selected again
        if (this.selectedSprite.id == sprite.id) return true;

        // Otherwise deselect current selected sprite
        this.DeselectSprite(this.selectedSprite);
      }

      this.selectedSprite = sprite;
      window.selectedSprite = sprite;
      sprite.selected = true;
      sprite.cursor = "grab";
      SPRITEADORNER.createAdorner(sprite, this.app.stage.overlayContainer);

      window.sprite = sprite;

      //this.app.stage.overlayContainer.visible = true;
      //this.SelectedSpriteResize();

      this.updateDiag();

      return true;
    },

    DeselectSprite(sprite) {

      //console.log("DeslectSprite", sprite.name, sprite);
      if (!sprite) return;


      SPRITEADORNER.deleteAdorner(sprite);
      sprite.selected = false;
      sprite.cursor = "pointer";
      this.selectedSprite = null;
      //this.app.stage.overlayContainer.boundingBox.visible = false;

      window.selectedSprite = null;
      this.updateDiag();
      
    },

    _SelectedSpriteResize() {
      var sprite = this.selectedSprite;
      if (!sprite) {
        return;
      }

      // Determine bounds of sprite
      var bounds = {};
      bounds.width = sprite.width;
      bounds.height = sprite.height;
      bounds.x = sprite.x - sprite.anchor.x * bounds.width;
      bounds.y = sprite.y - sprite.anchor.y * bounds.height;

      // TODO: We might be able to reuse this overlay if scale & rotation are the same
      
      // Remove any previous overlays
      // this.app.stage.overlayContainer.children.forEach( child => {
      //   child.destroy();
      // });
      // this.app.stage.overlayContainer.removeChildren();

      // Draw boundingbox overlay
      let stage = this.app.stage;
 
      var boundingBox = this.app.stage.overlayContainer.boundingBox;
      if (!boundingBox) 
      {
        boundingBox = this.app.stage.overlayContainer.boundingBox = this.app.stage.overlayContainer.addChild(new PIXI.Container());
      }
      boundingBox.visible = true;

      if (boundingBox.visible)
      {

        // Red Line
        let solidRect = boundingBox.children[0];
        if (!solidRect) solidRect = boundingBox.addChild(new PIXI.Graphics());
        solidRect.clear();
        solidRect.lineStyle(3 / stage.scale.x, 0x800000, 1);
        solidRect.drawRect(0, 0, sprite.width, sprite.height);
        solidRect.x = sprite.x;
        solidRect.y = sprite.y;
        solidRect.filters = [new DropShadowFilter()];

        // drawDashedPolygon (white)
        let dashRect = boundingBox.children[1];
        if (!dashRect) dashRect = boundingBox.addChild(new PIXI.Graphics());
        dashRect.clear();
        dashRect.lineStyle(2 / stage.scale.x, 0xffffff, 1);
        let polygons = [];
        polygons.push({ x: 0, y: 0 });
        polygons.push({ x: sprite.width, y: 0 });
        polygons.push({ x: sprite.width, y: sprite.height });
        polygons.push({ x: 0, y: sprite.height });
        var step = 5 / stage.scale.x;
        dashRect.drawDashedPolygon(polygons, 0, 0, 0, step, step * 1.5, 0);
        dashRect.x = sprite.x;
        dashRect.y = sprite.y;
      }

      this.updateDiag();
    },

    stageMouseDownEventHandler(e) {
      //console.log("stageMouseDownEventHandler", e, this.selectedSprite);
      // If stage was clicked then no sprites were clicked, so unselect
      // We are only concered with left clicks
      if (e.data.originalEvent.buttons == 1) {
        if (this.selectedSprite) {
            if (e.target.name == 'resizeHandle') return;  // ignore resize handle
            this.DeselectSprite(this.selectedSprite);
          //}
         
        }
      }
    },

    stageMouseUpEventHandler() {
      if (this.selectedSprite) {
        this.selectedSprite.cursor = "grab";
      }
      return true;
    },

    CreateMap_Basic1()
    {
      console.log("Creating new map: Basic1");
      this.ResetPixi();

      this.createLayers();

      //var myMaze = new MAZE();
      var myMaze = MAZE.create(13,9);
      var texture = PIXI.Texture.from("Concrete-a5x5.png");
      MAZE.draw(myMaze, PIXI, this.layers.background, texture, this.AddSpriteHandlers);


      this.updateDiag();
    },

    stageMouseMoveEventHandler(e)
    {
      this.mousePosition = e.data.getLocalPosition(this.app.stage);
      //console.log(this.mousePosition);
      if (e.data.originalEvent.buttons == 2) {

        //console.log(e.data.originalEvent.offsetX, e);
        let pos = e.data.global;
        if (this.prevMousePosition.x) {
          let dx = pos.x - this.prevMousePosition.x;
          let dy = pos.y - this.prevMousePosition.y;
          this.app.stage.x += dx;
          this.app.stage.y += dy;
          this.stageResize();
        }
        this.prevMousePosition.x = pos.x;
        this.prevMousePosition.y = pos.y;
      }

      if (e.data.originalEvent.buttons == 1) {
        //console.log(e.data.originalEvent.buttons, selectedEntity);

        console.log(this.selectedHandle.name);
        // Check for resize handle
        if (this.selectedHandle)
        {
          console.log(this.selectedHandle.name);
          e.stopPropagation();
          return;
        }

        // Check for selected sprite
        if (this.selectedSprite) {
          if (this.selectedSprite.selected) {
            let pos = e.data.global;
            let stage = this.app.stage;
            if (this.prevMousePosition.x) {
              let dx = pos.x - this.prevMousePosition.x;
              let dy = pos.y - this.prevMousePosition.y;
              this.selectedSprite.x += dx / stage.scale.x;
              this.selectedSprite.y += dy / stage.scale.x;
            }
            this.prevMousePosition.x = pos.x;
            this.prevMousePosition.y = pos.y;

            this.selectedSprite.cursor = "grabbing";
            this.selectedSprite.__OnMove();
            
            
            // Position Nameplate
            if (this.app.stage.overlayContainer.namePlate)
            {
              if (this.app.stage.overlayContainer.namePlate.sprite)
              {
                let textElement = this.app.stage.overlayContainer.namePlate.children[1];
                this.app.stage.overlayContainer.namePlate.x = this.app.stage.overlayContainer.namePlate.sprite.x +this.app.stage.overlayContainer.namePlate.sprite.width / 2 - textElement.width /2;
                this.app.stage.overlayContainer.namePlate.y = this.app.stage.overlayContainer.namePlate.sprite.y + this.app.stage.overlayContainer.namePlate.sprite.height + 2;
              }
            }
          }
        }
      }

      if (e.data.originalEvent.buttons == 0) {
        this.prevMousePosition = {};
      }

      this.DiagProps[0].children[2].name = "Mouse: " + Math.floor(this.mousePosition.x) + "x " + Math.floor(this.mousePosition.y) + "y";
    },

    stageResize() {
      if (this.shaders.gridShader)
      {
        this.shaders.gridShader.uniforms.offset = { 
          x: this.app.stage.x + 0,
          y: this.app.renderer.view.height - this.app.stage.y };  // OpenGL's Y is reversed
        // this.app.stage.x = 0;
        // this.app.stage.y = 0;
        this.shaders.gridShader.uniforms.scale = { 
          x: this.app.stage.scale.x,
          y: this.app.stage.scale.y };
      }
      this.SpriteMouseOver();

    },
    
    // CreateMap_Bunnies5x5rot () {
    //   console.log("Creating new map: Bunnies5x5rot");
    //   this.ResetPixi();

    //   const container = new PIXI.Container();
    //   this.app.stage.addChild(container);

    //   // Create a 5x5 grid of bunnieshttps://
    //   const texture = PIXI.Texture.from("https://pixijs.io/examples/examples/assets/bunny.png");

    //   // Create a 5x5 grid of bunnies
    //   for (let i = 0; i < 25; i++) {
    //       const bunny = new PIXI.Sprite(texture);
    //       bunny.anchor.set(0.5);
    //       bunny.x = (i % 5) * 40;
    //       bunny.y = Math.floor(i / 5) * 40;
    //       container.addChild(bunny);
    //   }

    //   // bounding box
    //   const rect = new PIXI.Graphics();
    //   rect.lineStyle(2, 0xFF0000);
    //   const bb = container.getBounds();
    //   rect.drawRect(bb.x, bb.y, bb.width, bb.height);
    //   rect.visible = this.ToolBarStatus["ShowAllBounding"].active;
    //   rect.bb = true;
    //   container.addChild(rect);

    //   // Move container to the center
    //   container.x = this.app.screen.width / 2;
    //   container.y = this.app.screen.height / 2;

    //   // Center bunny sprite in local container coordinates
    //   container.pivot.x = container.width / 2;
    //   container.pivot.y = container.height / 2;

      

      



    //   // Listen for animate update
    //   let t = (delta) => {
    //     // rotate the container!
    //     //use delta to create frame-independent transform
    //     container.rotation -= 0.01 * delta;
    //   };
    //   //this.tickers.push( t);
    //   //console.log(t);
    //   this.app.ticker.add(t);

    //   this.updateDiag();

    // },

    // DoAction(action) {
    //   console.log("DoAction", action);
      
    //   switch(action) {
    //     case "Bunnies5x5rot" : 
    //       this.Bunnies5x5rot();
    //       break;
    //     default: 
    //       console.log("Unhandled action", action);

    //   }
    Do_CreateMap(map)
    {
      if (this["CreateMap_" + map])
      {
        this["CreateMap_" + map]();
      } else
      {
        console.log("function CreateMap_" + map + " does not exist");
      }
      //console.log(map);
      
    },

    
    ResetPixi() {
      
      // Clear stage
      if (this.app)
      {

        this.selectedSprite = null;

        // Remove all layers
        this.layers = {};

        // Remove all stage children
        this.app.stage.children.forEach(child => {
          child.destroy(true);
        });
        this.app.stage.removeChildren();

        // Reset Stage
        this.app.stage.x = 0;
        this.app.stage.y = 0;
        this.app.stage.scale.x = 1;
        this.app.stage.scale.y = 1;

      }

      // Destroy textures (required to clear GPU memory)
      Object.keys(PIXI.utils.TextureCache).forEach(function(texture) { PIXI.utils.TextureCache[texture].destroy(true);});
    
    },

    // NewCampaign() {
    //   this.ResetPixi();
    //   this.example1();

    //   window._PIXI = PIXI;
    //   window._MAPAPP = this.app;
    // }

  //   KlugeInitCheck()
  //   {
      
  //     if (!this.$el.parentElement.style.height)
  //     {
  //       console.log("KlugeInitCheck", this.$el.parentElement);
  //       this.$nextTick(this.KlugeInitCheck);
  //     } else
  //     {
  //       console.log("KlugeInitCheck:Resize:", this.$el.parentElement);
  //       this.onResize();
  //     }
  //   }
    WatcherShowAllBounding(n) {
      this.app.stage.children[0].children.forEach( function (c) {
          if (c.bb)
          {
            c.visible = n;
            console.log(c, n);
          }
        });
    },
    

    mouseWheelHandler(e) {
      //console.log("mouseWheel", e);
      var bb = e.target.getBoundingClientRect();
      this.zoom(e.clientX - bb.left, e.clientY - bb.top, e.deltaY < 0);
    },

    zoom(x, y, isZoomIn) {
      var direction = isZoomIn ? 1 : -1;
      var s = (1 + direction * 0.1);
      var stage = this.app.stage;
      var worldPos = { x: (x - stage.x) / stage.scale.x, y: (y - stage.y) / stage.scale.y };
      var newScale = { x: Math.min(9, stage.scale.x * s), y: Math.min(9, stage.scale.y * s) };
      var newScreenPos = { x: (worldPos.x) * newScale.x + stage.x, y: (worldPos.y) * newScale.y + stage.y };
      stage.x -= (newScreenPos.x - x);
      stage.y -= (newScreenPos.y - y);
      stage.scale.x = newScale.x;
      stage.scale.y = newScale.y;
      //updateGrid();
      //this.SelectedSpriteResize();
      //this.selectedSprite.__OnMove(true);
      // drawVbl();
      //drawVP();
      this.stageResize();
    },

    
  },
  
  
  mounted() {



    this.app = new PIXI.Application({
      transparent: false,
      antialias: true,
      width: '50px',
      height: '50px',
      view: document.getElementById("mapCanvas"),
    });
    //this.$el.appendChild(this.app.view);
    this.app.backgroundColor = 0;
    this.app.resizeTo = this.$el;

    this.$el.parentElement.parentElement.style.overflow = "hidden";
    //this.$el.style.marginLeft = "5px";
    //this.$el.style.marginTop = "5px";

    
    
    // KLUGE: The splitter panes start with equidistant sizes, then resizes to SIZE.
    // The splitter @ready fires before the pane SIZE is set (a likely bug).
    var that = this;
    window.setTimeout(function() {
      window.dispatchEvent(new Event("resize"));
      that.CreateMap_Basic1 ();
    }, 1000);

    // WATCH: ShowAllBounding
    this.$watch(()=> this.ToolBarStatus["ShowAllBounding"].active, function(n) {
      console.log("ShowAllBounding: " + n);
      this.WatcherShowAllBounding(n);
    });

    // Prevent Context Menu on right click
    this.$el.oncontextmenu = function (e) {
      if (e.preventDefault != undefined)
        e.preventDefault();
      if (e.stopPropagation != undefined)
        e.stopPropagation();
    };

    document.addEventListener("mousewheel", this.mouseWheelHandler, false);
    //this.app.$el.addEventListener("mousedown", this.stageMouseDownEventHandler, false);


  },

  computed: {
    IsShowAllBoundingActive () {
      if (!this.toolBarStatus) return false;
      if (!this.ToolBarStatus["ShowAllBounding"]) return false;
      return this.ToolBarStatus["ShowAllBounding"].active || false;
    }
  },

  watch: {
    layersZindex(n, o)  {
      //console.log("layersZindex", n, o);
      // PIXI draws from back [index 0] to front.
      // KLUGE: Layer list show from top most layer to bottom most layer [index 0]
      if (!this.layersZindex) return;
      if (this.layersZindex.length == 0) return;
      let stage = this.app.stage;
      if (!stage.layersContainer) return;

      this.DeselectSprite(this.selectedSprite);

      

      var that = this;
      this.layersZindex.forEach( (e, i) => {
        let child = that.layers[e.name];
        let index = that.layersZindex.length - i -1;
        stage.layersContainer.setChildIndex(child, index);

        // The layerSelectedIndex may need to be changed with the recent order change
        if (o) {
          if (o[that.layersSelectedIndex])
          {
            if (child.name == o[that.layersSelectedIndex].name)
            {
              that.layersSelectedIndex = i;
            }
          }
        }
      });
    }

    ,layersSelectedIndex(n, o) {
      if (n == undefined || o == undefined) return;
      //console.log("layersSelectedIndex", n, o);
      this.DeselectSprite(this.selectedSprite);
      this.layersZindex.forEach( (e, i) => {
        let child = this.layers[e.name];
        //let index = this.layersZindex.length - i -1;
        if (i == n)
        {
          child.interactiveChildren = true;
          //console.log("+", child.name);
        } else
        {
          child.interactiveChildren = false;
          //console.log("-", child.name);
        }
      });
    },

    // IsShowAllBoundingActive: {
    //   handler(n, o) {
    //     console.log("ShowAllBounding:", n);
    //   },
    //   deep: true,
    //   immediate: true,
    // },
    


  },

  
}
</script>



<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
/* h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
} */
#mapDiv {
  position:relative
}

#listLayers {
  position: absolute;
  top:5px;
  right:5px;
  border: 2px solid #303f9f; /* indigo darken-2 */
  padding-top: 0px;
  padding-bottom: 1px;
}

#listLayers .v-list-item__content {
padding-top: 0px;
padding-bottom: 0px;
}

#listLayers .v-list-item__title {
font-size: 12px;
line-height: 1.1;
font-style:normal;
font-weight: normal;
}

#listLayers .v-list-item {
line-height: 10px;
min-height: 10px;
padding-left: 5px;
padding-right: 5px;

}

#listLayersTitle {
height: 18px;
padding-top: 2px;

}

#listLayers  .v-btn {
height: auto;
}

/* #listLayers  .v-list .v-list--dense {
padding-top: 0px;

} */


</style>