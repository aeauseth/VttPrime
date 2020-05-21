<template>
  <div class="menuBar">

		<!-- Top Level Menu -->
		<button 
			v-for="menu in menus" 
			:key="menu.key" 
			class="dropbtn" 
			@click="menuClick(menu)"
			:id="menu.key + 'Menu'"
			v-html="UnderlineHotKey(menu.title || menu.key, menu.hotKey)"
			>
			<!-- {{ this.UnderlineHotKey(menu.title || menu.key) }} -->
		</button>

		<!-- Second Level Menu -->

			<div  
				class="dropdown-content"
				v-for="menu in menus"
				:key="menu.key + 'd'"
				v-bind:style="{left: menu.left }"
				v-show="menu.showChildren"
				>
					<button
						v-for="subMenu in menu.menus" 
						:key="subMenu.title" 
						class="dropdown-submenu-item"
						@click="menuClick(subMenu)"
					>
					{{ subMenu.title || subMenu.key }}
					</button>
				</div>

		
			<!-- <a href="https://dzone.com/articles/making-and-moving-selectable" target="_blank">Making and Moving Selectable Shapes on an HTML5 Canvas: A Simple Example</a>
			<a href="https://dzone.com/articles/selectable-shapes-part-2" target="_blank">Selectable Shapes Part 2: Resizable, Movable Shapes on HTML5 Canvas</a>
			<a href="http://jsfiddle.net/M8kms/2/" target="_blank">Selectable Shapes Part 2: Resizable, Movable Shapes on HTML5 Canvas</a> -->

  </div>
</template>

<script>


//import Vue from 'vue'
//import VueHotkey from 'v-hotkey'
//Vue.use(VueHotkey)
//import $ from 'jquery';

export default {
  name: 'MenuBar',
  props: {

	},
	inheritAttrs: true,
	data () {
    return {
			menus: [
				{ key: "File", hotKey: 'f'	},
				{ key: "Edit" },
				{ key: "Map" },
				{ key: "Notes" , hotKey: "o" },
				{ key: "Test" , hotKey: "t", menus: [
					{ key: "Bunnies 5x5 rotate" , Action: "Bunnies5x5rot" },
					]
				},
			],

      showMenuArray: {
				"menuFileDropDown": false,
				"menuNotesDropDown": false,
			}
    }
  },
	computed: {
		keymap () {
      return {
        // 'esc+ctrl' is OK.
				//'alt+f': this.menuClick("menuFileDropDown"),
				'alt+t': this.toggle(),
        // 'enter': {
        //   keydown: this.hide,
        //   keyup: this.show
        // }
      }
    }
	},
	methods: {
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

		// showMenu(dropTarget) {
		// 	console.log("showMenu:", dropTarget, this.showMenuArray[dropTarget] | false);
		// 	return this.showMenuArray[dropTarget];
		// },
		// toggle () {
		// 	console.log("toggle");
    //   //this.show = !this.show
    // },
    // show () {
    //   this.show = true
    // },
    // hide () {
    //   this.show = false
    // },
		
		menuHideAll()
		{
			// Object.keys(this.showMenuArray).forEach(key => {
			// 	this.showMenuArray[key] = false;
			// });
			this.menus.forEach(m => {
				//console.log(m);
				if (m.showChildren)
				{
					this.$set(m, 'showChildren', false);
					//console.log(m);
				}
			})
		},

		menuClick (m)
		{

			// If there is an action do it
			if (m.Action)
			{
				this.MenuAction(m.Action);
				return;
			}

			// Toggle our submenu
			if (m.showChildren)
			{
				this.$set(m, 'showChildren', false);
			} else
			{
				this.$set(m, 'showChildren', true);
			}

			// Clear all other submenus
			this.menus.forEach(m2 => {
				if (m2.key != m.key)
				{
					this.$set(m2, 'showChildren', false);
				}
			})


		},

		// _menuClick(event) {
		// 	let target = event.target;
		// 	let dropTarget = target.getAttribute("dropTarget");
		// 	let dropTargetElement = document.getElementById(dropTarget);
			
		// 	// Hide all other menus
		// 	Object.keys(this.showMenuArray).forEach(key => {
		// 		if (key != dropTarget)
		// 		{
		// 		this.showMenuArray[key] = false;
		// 		}
		// 	});

		// 	this.showMenuArray[dropTarget] = !this.showMenuArray[dropTarget]

		// 	if (dropTarget == null)
		// 	{
		// 		console.log("menuClick:", dropTarget, this.showMenuArray[dropTarget], event);
		// 	}


		// },

		MenuAction(action) {
			console.log("MenuAction", action);
			this.$parent.DoAction(action);
			this.menuHideAll();
		},

		onKeyDown(e)
		{
			// TODO: Fix Repeat when key is held down (low priority)
			this.menus.forEach(m => {
				if (m.hotKey == e.key && e.altKey)
				{

					// We found a match with a menu hotkey
					// CLICK the menu and prevent subsequent handling of this event
					this.menuClick(m);
					e.preventDefault();
					return;
				}
			});
			
		}
	},

	mounted ()
	{

		// Submenus need to know the LEFT of the parent for visual alignment.
		// So we set that here as it is null upon mounting
		this.menus.forEach(m => {
			let el = document.getElementById(m.key + "Menu");
			this.$set(m, 'left', Math.floor(el.getBoundingClientRect().x) + 'px');
		});

		// Basic Keyboard handling for menu hotkeys
		window.addEventListener("keydown", this.onKeyDown );
	},
	
	// updated()
	// {
	// 	console.log("updated");
	// },

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.menuBar {
	position: fixed; /* Set the navbar to fixed position */
  top: 0;
}

/* Dropdown Button */
.dropbtn {
  background-color: rgb(238, 237, 230);
  //color: white;
  border: none;
  cursor: pointer;
	vertical-align: top;
	height: 18px;
}

/* Dropdown button on hover & focus */
.dropbtn:hover {
  background-color: rgb(190, 208, 233);
}

/* The container <div> - needed to position the dropdown content */
.dropdown {
  position: relative;
  display: inline-block;
	
}

/* Dropdown Content (Hidden by Default) */
.dropdown-content {
	_display: none;
  display: block; 
  position: absolute;
  background-color: white;
	//font-family: Arial;
	//font-size: 10px;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
}

/* Links inside the dropdown */
.dropdown-content a {
  color: black;
  padding: 2px 10px;
  text-decoration: none;
  display: block;
}

/* Drop down submenu item is a button */
.dropdown-submenu-item {
	width: 100%;
	text-align: left;
	background-color: transparent;
	border: none;
  cursor: pointer;
	padding: 2px 10px;
	font-size: 12px;
}

/* Dropdown sub-item button on hover & focus */
.dropdown-submenu-item:hover {
  background-color: rgb(190, 208, 233);
}


/* Change color of dropdown links on hover */
.dropdown-content a:hover {background-color: #2980B9;}

/* Show the dropdown menu (use JS to add this class to the .dropdown-content container when the user clicks on the dropdown button) */
/*.showMenu {display:block;} */

</style>
