<template>
  <v-app>
    <v-app-bar
      app
      _color="primary"
      dense
      height="18px"
      clipped-left
      
    >

      <v-menu 
        offset-y 
        v-for="(item, index) in menu"
        :key="index"
        >
        <template v-slot:activator="{ on }">
          <v-btn
            :id="'menu_' + (item.key || item.title)"
            color="blue-grey lighten-5"
            x-small
            borderless
            v-on="on"
            v-html="UnderlineHotKey(item.title, item.hotKey)"
            @click.stop="doAction(item.action)"
          >
            <!-- {{ item.title }} -->
          </v-btn>
          <template v-html="item.template" />
        </template>
        <v-list v-if="item.menu"
          dense
          x-small
          >
          <v-list-item
            
            v-for="(item2, index2) in item.menu"
            :key="index2"
            @click.stop="doAction(item2.action)"
            
            >
            <v-list-item-title 
            :id="'menu_' + (item2.key || item2.title)"
            v-html="UnderlineHotKey(item2.title, item2.hotKey)">
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <template v-slot:extension>
        <v-btn-toggle 
          _v-model="toolBarDepressed"
          multiple
          _change="toolButtonClick"
          >
          <v-btn
            title="Show All bounding boxes"
            v-model="toolBarStatus['ShowAllBounding'].active"
            >
            <v-icon>mdi-eye-outline</v-icon>
          </v-btn>
          <v-btn
            title="test"
            v-model="toolBarStatus['Widget'].active"
                        >
            <v-icon>mdi-wrench</v-icon>
          </v-btn>
        </v-btn-toggle>
      </template>
    </v-app-bar>
    

    

    <v-content>
      <splitpanes class="default-theme" @resized="onResize('resized1', $event)" >
        <pane size="20">
          TreePane
        </pane>
        <pane size="80" >
          <splitpanes horizontal @resized="onResize('resized2', $event)"  >
            <pane size="80" 
            v-bind:style="{overflow: 'hidden', backgroundColor: '#222222'}">

            <MapPanel ref="MapPanel" 
            :DiagProps="this.diagItems"
            :ToolBarStatus="this.toolBarStatus" 

            />
            </pane>
            <pane size="20">
              ChatPane
            </pane>
          </splitpanes>
        </pane>
        <pane size="20"  >
          <div class="aaHeight">
            <v-treeview 
              id='diagTree'
              class="diagTree"
              dense
              :items="diagItems"
              color="primary"
              open-on-click
              open-all
              
            ></v-treeview>
          </div>
        </pane>

      </splitpanes>
    </v-content>




    <v-system-bar>
      System Bar
    </v-system-bar>

    <v-dialog
      v-model="aboutDialog"
      _max-width="290"
    >
      <v-card>
        <v-card-title class="headline">About</v-card-title>

        <v-card-text>
          <p>Created by: Aaron Auseth</p>

          <p>Created with:
          <ul>
            <li><a href="https://vuejs.org/">Vue</a>: Framework</li>
            <li><a href="https://vuetifyjs.com/" target="_blank">Veautify</a>: User Interface</li>
            <li><a href="https://www.npmjs.com/" target="_blank">NPM</a>: Code Management</li>
            <li><a href="https://code.visualstudio.com/" target="_blank">Visual Studio Code</a>: Code Editor</li>
            <li><a href="https://antoniandre.github.io/splitpanes/" target="_blank">Vue Split Panes</a>: UI Layout</li>
            <li><a href="https://www.pixijs.com/" target="_blank">PixiJS</a>: Graphics</li>
            <li><a href="https://github.com/SortableJS/Vue.Draggable" target="_blank">vuedraggable</a>: drag list items (e.g. layers)</li>
            <li><a href="https://github.com/pixijs/pixi.js/issues/1333" target="_blank">drawDashedPolygon</a></li>
          </ul>
          </p>
          <p>Inspired by:
            <ul>
              <li>
                <a href="https://www.rptools.net/" target="_blank">RPTools Maptool</a>
              </li>
              <li>
                <a href="https://codepen.io/ardenpm/pen/pVojYG" target="_blank">Pixi Grid Shader</a>
              </li>
            </ul>
          </p>

          <p>ToDo:
            <ol>
              <li>Menu Shortcut keys</li>
              <li><a href="https://www.ghosh.dev/posts/creating-a-multi-level-hierarchical-flyout-navigation-menu-using-only-html-and-css/">Flyout Menus</a>
              </li>
              <li>
                Drag Drop panels + tabs
              </li>
              <li>
                <a href="https://bugs.chromium.org/p/chromium/issues/detail?id=460919" target="_blank">Chrome suffers from excessive mouse 'input lag'</a>.  chrome://flags/ + Choose ANGLE graphics backend = OpenGL is easy fix.
              </li>
              <li>
                Browser zoom corrupts layout.
              </li>
              <li>
                Import Maptool map (reqires ZIP support)
              </li>
              <li>
                <a href="https://konvajs.org/docs/select_and_transform/Basic_demo.html" target="_blank">Sprite sizing handle Transforms</a>
              </li>
              <li>
                  <a href="https://developer.okta.com/blog/2018/07/03/deploy-vue-app-aws">AWS Lambda</a>
              </li>
            </ol>
            </p>
        </v-card-text>

        <v-card-actions >
          <v-spacer />
          <v-btn
            @click="aboutDialog = false"
          >
            OK
          </v-btn>

        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>

import "./appVer.js"

// SplitPanes
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import MapPanel from './components/MapPanel';


export default {
  name: 'App',

  components: {
    Splitpanes, Pane,
    MapPanel,
  },

  data: () => ({
    menu: [
      { title: "File" },
      { title: "Edit" },
      { title: "Map" },
      { title: "Notes" },
      { title: "Test", hotKey: "t", 
        menu: [
          { title: "Basic Map 1", key:"Basic1", hotKey: "b"
          , action: { function: "Do_CreateMap", params: "Basic1" } 
          }
        ]
      },
      { title: "About", hotKey: "a", action: "Do_About" }
    ],

    //toolBarDepressed: [],
    toolBarStatus: { 
      'ShowAllBounding': { idx: 0, active: false },
      'Widget': { idx: 1, active: false },
    },
    
    aboutDialog: false,

    diagItems: [
        {
          id: 100,
          name: 'PIXI :',
          children: [
            { id: 101, name: 'Containers:' },
            { id: 102, name: 'Textures:' },
            { id: 103, name: 'Mouse:' },
          ],
        },
    ],

  }),

  methods: {


    toolButtonClick (event)
    {
      console.log(this.toolBarStatus);
      // let that = this;
      // Object.keys(this.toolBarDict).forEach(function (key) 
      //   {
      //     //let item = this.toolBarDict[key];
      //     //console.log(key);
      //     var item = that.toolBarDict[key];
      //     if (that.toolBarDepressed)
      //     {
      //       if (that.toolBarDepressed[item.idx])
      //       {
      //         item.active = true;
      //       } else
      //       {
      //         item.active = false;
      //       }
      //     } else
      //     {
      //       item.active = false;
      //     }

      //     console.log(key, item.idx, item.active, that.toolBarDepressed);
      //   }
        
      // );
 
      
      // if (t.this.toolBarDict["ShowAllBounding"]])
      // {
      //   this.$ref.MapPanel.doAction("ShowAllBounding");
      // }
  
      
    },

    UnderlineHotKey(text, hotKey)
		{
			if (!hotKey)
			{
				return text ;
			}

			// The hotkey is always lowercase (so use uppercase)
			let idx = text.toUpperCase().indexOf(hotKey.toUpperCase());
			let h = text.substring(idx,idx + 1);
			return text.replace(h, "<u>" + h + "</u>");
    },
    
    doAction (action)
    {
      if (action)
      {
        if (!action.function)
        {
          action = { function: action};
        }

        // Valid actions must start with Do_
        if (action.function.indexOf("Do_") != 0) 
        {
          console.log("[" + action.function + "] is invalid.  Must start with Do_");
          return;
        }

        if (this[action.function])
        {
          this[action.function](); 
          return;
        }

        if (this.$refs.MapPanel[action.function])
        {
          this.$refs.MapPanel[action.function](action.params); 
          return;
        } 


        console.log("[" + action.function + "] has no handler");

      }
    },

    

    Do_About () {
      this.aboutDialog = true;
    },

    onResize(msg, event)
    {
      //console.log(msg, event);
      if (this.$refs.MapPanel)
      {
        this.$refs.MapPanel.onResize();
      }
    },

    onKeyDown(e)
		{
			// TODO: Fix Repeat when key is held down (low priority)
			this.menu.forEach(m => {
				if (m.hotKey == e.key && e.altKey)
				{

					// We found a match with a menu hotkey
					// CLICK the menu and prevent subsequent handling of this event
          //this.menuClick(m);
          console.log(e.key, m.title, m.el);
          m.el.click();
					e.preventDefault();
					return;
				}
			});
			
		},

  },
  mounted() {
    console.log("mounted appVer " + window.appVer);

    window.addEventListener('resize', this.onResize);
    
    //Prevent DRAGOVER and DROP to browser
    window.addEventListener("dragover",function(e){
      e = e || event;
      e.preventDefault();
    },false);
    window.addEventListener("drop",function(e){
      e = e || event;
      e.preventDefault();
    },false);
    
  },
  unload() {
    //console.log("unload22");
  }
};
</script>

<style scoped>

/* #app {
  cursor: no-drop;
} */

.aaHeight {
  height: calc(100vh - 120px);
  overflow-x: hidden;
  overflow-y: auto;
}

/* .diagTree {
  font-size: 9px;
  padding-top: 0px
}
*/

</style>

<style>
#diagTree .v-treeview-node__root {
  font-size: 12px;
  line-height: 1.1;
  min-height:10px;
  padding-left:0px;
  padding-right:0px;
  
}

#diagTree .v-icon {
  /* font-size: 24px; */
  /* height: 12px; */
  width: 9px;

}

#diagTree .v-treeview-node__level {
  width: 5px;
}

/* #diagTree .v-treeview--dense {
  min-height:10px;
} */




</style>