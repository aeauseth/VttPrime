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
            @click="item.visible = false; DeselectAllSprites()"
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
import * as VLB from '../js/vlb.js'
import * as LOS from '../js/los.js'


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

// PIXI.Container.prototype.Select = function()
// {
//   this.DeselectAllSprites();
//   this.addAdorner();
// }

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
        mousePosition: {x: 0, y: 0, data: null},
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
        ],
        vlbGenerationAndDrawMs: 0,
        losGenerationAndDrawMs: 0,

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
      this.DiagProps[0].children[2].name = "VBL: " + this.vlbGenerationAndDrawMs + " ms [" + this.layers.vlb.segments.length + "]";
      this.DiagProps[0].children[3].name = "LOS: " + this.losGenerationAndDrawMs + " ms";
      
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
        this.$nextTick(this.stageResize);
      }
      
    },

    createLayers() {

      var stage = window.stage = this.app.stage;
      stage.name = "stage";
      stage.interactive = true;
      stage.on("mousedown", this.stageMouseDownEventHandler);

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

      // var testObject = new PIXI.Graphics();
      // testObject.beginFill(0xff0000);
      // testObject.drawRect(0, 0, 1, 1);
      // testObject.endFill();
      // this.layers.object.addChild(testObject);

      // var testObject2 = new PIXI.Graphics();
      // testObject2.beginFill(0xff0000);
      // testObject2.drawRect(0, 0, 1, 1);
      // testObject2.endFill();
      // testObject2.x = 49;
      // testObject2.y = 49;
      // this.layers.object.addChild(testObject2);
      

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

      // Vislble Line Blocking (VLB)
      this.layers.vlb = layersContainer.addChild(new PIXI.Container());
      this.layers.vlb.name = "vlb";
      stage.vlb = this.layers.vlb;
      this.layers.vlb.segments = [];

      // Vislble Line Blocking (LOS)
      this.layers.los = layersContainer.addChild(new PIXI.Container());
      this.layers.los.name = "los";
      stage.los = this.layers.los;

      // Layers Z index (used to sort layers)
      layersContainer.children.forEach( e => {
        this.layersZindex.splice(this.layersZindex, 0, e);
        e.interactiveChildren = false;  // default to no interaction
        
      });

      // Default to TOKEN layer
      for (var i = 0; i< this.layersZindex.length; i++)
      {
        let layer = this.layersZindex[i];
        if (layer.name == "token")
        {
          this.layersSelectedIndex = i;
          this.layersZindex[i].interactiveChildren = true;
          break;
        }
      }

      // Handlers
      stage.interactive = true;
      stage.on("mousemove", this.stageMouseMoveEventHandler);
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
      sprite.on("mousedown", this.onSpriteStart)
      sprite.on("mouseup", this.onSpriteEnd);
      sprite.on("mouseupoutside", this.onSpriteEnd);
      sprite.on("mousemove", this.onSpriteMove);
      sprite.on("mouseover", this.onSpriteOver);
      sprite.on("mouseout", this.onSpriteOut);
      sprite.cursor = "pointer";

      // Default name
      if (!sprite.name)
      {
        sprite.name = sprite.texture.baseTexture.textureCacheIds[0].split('.')[0].substring(0, 25);
      }

      // Make sure sprite has unique id
      if (!sprite.id)
      {
          sprite.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
      }

      // Anchor fix
      sprite.anchor.set(0.5, 0.5);
      sprite.SetOrigin();

      

    },

    onSpriteOver(e) {

      //var sprite = e.currentTarget;

      if (!this.app.stage.overlayContainer.namePlate) 
      {
        this.app.stage.overlayContainer.namePlate = this.app.stage.overlayContainer.addChild(new PIXI.Container());
        this.app.stage.overlayContainer.namePlate.addChild( new PIXI.Graphics());
        this.app.stage.overlayContainer.namePlate.addChild( new PIXI.Text());
        this.app.stage.overlayContainer.namePlate.update = function(sprite) {

          if (sprite)
          if(!sprite.isSprite)
          {
            console.log("missing sprite2"); 
          }

          let namePlate = this;

          let boxElement = namePlate.children[0];
          let textElement = namePlate.children[1];

          if (sprite) // && e.data.originalEvent.buttons != 1) 
          {
            textElement.text = sprite.name || "undefined";
            namePlate.visible = true;
            namePlate.sprite = sprite;
          } else
          {
            sprite = namePlate.sprite; // used later in this function
          }
          if (!sprite)
          {
            console.log("missing sprite");
          }
          if (!sprite.isSprite)
          {
            console.log("missing sprite"); 
          }

          // Text Element
          var scale = 1 /  Math.sqrt(window.stage.scale.x);
          if (scale > 1) {
            scale = 1 / window.stage.scale.x;
          }
          if (textElement)
          {
            textElement.style.fontSize = (2 * scale).toFixed(2) + "em";
            textElement.resolution = Math.max(1, window.stage.scale.x).toFixed(2);
          }

          // Box Element
          if (textElement && boxElement)
          {
            if (textElement.height && textElement.width)
            {
              boxElement.clear();
              boxElement.lineStyle(2 / window.stage.scale.x, 0xaaaaff);
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

          //let textElement = namePlate.children[1];
          //let sprite = namePlate.sprite;
          namePlate.x = sprite._x + sprite.width / 2 - textElement.width /2;
          namePlate.y = sprite._y + sprite.getBounds().height / window.stage.scale.x;
          //console.log(namePlate.y, sprite.getBounds().height / window.stage.scale.x);

        };

      }

      

      window.stage.overlayContainer.namePlate.update(e.currentTarget);


    },

    onSpriteOut(e) {
      var sprite = e.currentTarget;
      this.app.stage.overlayContainer.namePlate.visible = false;
    },

    onSpriteStart(e) {
      let sprite = e.currentTarget;
      

      // store a reference to the mouse data
      sprite.data = e.data;

      if (window.stage.selectedItems.length > 0)
      {
        if (window.stage.selectedItems[0].id != sprite.id)
        {
          window.stage.selectedItems[0].removeAdorner();
        }
      }

      // update UI
      sprite.cursor = "grabbing";
      sprite.addAdorner();
      sprite.dragging = true;
      window.stage.selectedItems = [ sprite ];

      // store where we clicked within the sprite (dragOffset)
      sprite.data.dragOffset = e.data.getLocalPosition(sprite.parent);
      sprite.data.dragOffset.x = sprite.data.dragOffset.x - sprite.x;
      sprite.data.dragOffset.y = sprite.data.dragOffset.y - sprite.y;

      if (this.activeLayer().name == "token")
      {
        this.losGenerationAndDrawMs = sprite.updateLos();
        this.updateDiag();
      }

      e.stopPropagation();
    },

    onSpriteEnd(e) {
      let sprite = e.currentTarget;

      sprite.cursor = "pointer";
      sprite.dragging = false;
      //sprite.DestroyAdorner();

      // set the interaction data to null
      sprite.data = null;
      e.stopPropagation();
    },

    onSpriteMove(e) {
      let sprite = e.currentTarget;
      if (sprite.dragging)
      {
          var newPosition = sprite.data.getLocalPosition(sprite.parent);

          let x = newPosition.x - sprite.data.dragOffset.x;
          let y = newPosition.y - sprite.data.dragOffset.y;
					// Hold CTRL key to snap to grid
					if (e.data.originalEvent.ctrlKey) {

            let _x = x - sprite.width /2;
            let _y = y - sprite.height /2;
    
						_x = Math.round( _x / 50 ) * 50;
            _y = Math.round( _y / 50 ) * 50;
            
            x = _x + sprite.width / 2;
            y = _y + sprite.width / 2;
          }
          
          sprite.x = x;
          sprite.y = y;
          sprite.SetOrigin();

          //this.PositionNamePlate(sprite);
          window.stage.overlayContainer.namePlate.update();

          if (this.activeLayer().name == "background")
          {
            this.vlbGenerationAndDrawMs = this.layers.background.updateVlb();
            this.updateDiag();
          }

          if (this.activeLayer().name == "token")
          {
            this.losGenerationAndDrawMs = sprite.updateLos();
            this.updateDiag();
          }

        e.stopPropagation();
      }
    },

    // PositionNamePlate(sprite)
    // {
    //     if (this.app.stage.overlayContainer.namePlate && sprite)
    //     {
    //       let namePlate = this.app.stage.overlayContainer.namePlate;
    //       let textElement = namePlate.children[1];
    //       namePlate.x = sprite._x + sprite.width / 2 - textElement.width /2;
    //       namePlate.y = sprite._y + sprite.getBounds().height / window.stage.scale.x;
    //       console.log(namePlate.y, sprite.getBounds().height / window.stage.scale.x);
    //     }
    // },


    DeselectAllSprites() {
      if (window.stage.selectedItems.length > 0)
      {
        window.stage.selectedItems[0].removeAdorner();
        window.stage.selectedItems = [];
      }

      // Clear LOS
      if (window.stage.los)
      {
        if (window.stage.los.children[0])
        {
          window.stage.los.children[0].clear();
        }
      }

    },


    stageMouseDownEventHandler(e) {
      // If stage was clicked then no sprites were clicked, so Deselect all sprites.
      // We are only concered with left clicks
      if (e.data.originalEvent.buttons == 1) {
        this.DeselectAllSprites();
      }
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

      //this.layers.background.updateVlb();
      // Hack dealy because sprite are not loaded yet
      window.setTimeout(function() {this.vlbGenerationAndDrawMs = this.layers.background.updateVlb()}, 1000 );
      this.updateDiag();


      this.updateDiag();
    },

    stageMouseMoveEventHandler(e)
    {
      this.mousePosition = e.data.getLocalPosition(this.app.stage);
      this.mousePosition.data = e.data;
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

      

      if (e.data.originalEvent.buttons == 0) {
        this.prevMousePosition = {};
      }

      this.DiagProps[0].children[4].name = "Mouse: " + Math.floor(this.mousePosition.x) + "x " + Math.floor(this.mousePosition.y) + "y";
    },

    stageResize() {
      if (this.shaders.gridShader)
      {
        this.shaders.gridShader.uniforms.offset = { 
          x: this.app.stage.x,
          y: this.app.renderer.view.height - this.app.stage.y};  // OpenGL's Y is reversed
        this.shaders.gridShader.uniforms.scale = { 
          x: this.app.stage.scale.x,
          y: this.app.stage.scale.y };
      }

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

        //this.selectedSprite = null;
        this.DeselectAllSprites();

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
      PIXI.Loader.shared.reset();
      Object.keys(PIXI.utils.TextureCache).forEach(function(texture) { if(PIXI.utils.TextureCache[texture]) PIXI.utils.TextureCache[texture].destroy(true);});
      

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
      e.preventDefault();
      if (e.shiftKey) return;
      var bb = e.target.getBoundingClientRect();
      this.zoom(e.clientX - bb.left, e.clientY - bb.top, e.deltaY < 0);
      e.preventDefault();
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
      if (window.stage.overlayContainer.namePlate)
      {
        window.stage.overlayContainer.namePlate.update();
      }
      this.stageResize();
    },

    dropFile(e) {

      if (e.dataTransfer.items)
      {
        
        for (var i = 0; i < e.dataTransfer.items.length; i++) {
          // If dropped items aren't files, reject them
          if (e.dataTransfer.items[i].kind === 'file') {
            var file = e.dataTransfer.items[i].getAsFile();
            //console.log('... file[' + i + '].name = ' + file.name, file, e.dataTransfer.items[i]);

            
            if (file.type.indexOf("image") > -1)
            {
              
              this.DeselectAllSprites();

              var upload = null;
              var that = this;

              {
                var fReader = new FileReader();
                fReader.onload = function(){
                    upload = fReader.result;
                    //console.log(upload);
                    //var tex = PIXI.Texture.from(upload);
                    //var sprite;
                    
                    // Load texture into PIXI (async)

                    if (PIXI.Loader.shared.resources[upload])
                    {
                      const tex = PIXI.Loader.shared.resources[upload].texture;
                      const sprite = new PIXI.Sprite(tex);
                      that.dropFileComplete(sprite, file);
                    }else
                    {
                      PIXI.Loader.shared
                          .add(upload)
                          .load((loader, resources) => {
                              const tex = PIXI.Loader.shared.resources[upload].texture;
                              const sprite = new PIXI.Sprite(tex);
                              that.dropFileComplete(sprite, file);
                      });
                    }
                    
                };
                fReader.readAsDataURL(file); //async
              }
              
             }


          }
        }
      }
    },

    dropFileComplete(sprite, file)
    {
      
      sprite.name = file.name.split(".")[0];
      this.AddSpriteHandlers(sprite);
      this.activeLayer().addChild(sprite);
      sprite.x = this.mousePosition.x - sprite.width / 2;
      sprite.y = this.mousePosition.y - sprite.height / 2;

      // Select new Sprite
      sprite.cursor = "pointer";
      sprite.addAdorner();
      window.stage.selectedItems = [ sprite ];
      sprite.data = this.mousePosition.data;
      this.onSpriteOver( { currentTarget: sprite});

      console.log(sprite, sprite.id, sprite.name, sprite.width, sprite.height, sprite.parent.name);
      if (sprite.width < 50)
      {
        console.log("bad sprite");
      }
    },
    
    activeLayer() {
      //console.log(this.layersZindex, this.layersSelectedIndex);
      return this.layersZindex[this.layersSelectedIndex];
    }
  },
  
  
  mounted() {



    this.app = new PIXI.Application({
      transparent: false,
      antialias: true,
      width: '50px',
      height: '50px',
      view: document.getElementById("mapCanvas"),
    });
    window.renderer = this.app.renderer;
    window.stage = this.app.stage;
    window.stage.selectedItems = [];

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

    //this.app.view.addEventListener("dragover", function (e) { console.log("dragover")} );
    this.app.view.addEventListener("drop", this.dropFile, false );


    document.body.addEventListener("mousewheel", this.mouseWheelHandler, {passive: false});
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

      this.DeselectAllSprites();

      

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
      this.DeselectAllSprites();
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

/* canvas {
  outline: aliceblue 3px dashed;
  outline-offset: -10px;
} */

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