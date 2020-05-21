<template>
  <div id="PanelMasterDiv"

	>
	<div id="menuDiv">
		<MenuBar ref="MenuBar" />
		</div>
    <div class="splitter" 		
			@mousemove="seperatorMousemove"
			@mouseup="seperatorMouseup"
			>
      <div id="first">
				<MapPanel ref="mapPanel"
				v-on:DiagPixiUpdate="DiagPixiUpdate"/>
			</div>
      <div id="seperator" dragging="false"
        @mousedown="seperatorMousedown"

        
      />
      <div id="second">
		<DiagPanel v-bind:diag="diag" />
		</div>
    </div>
  </div>
</template>

<script>

import MapPanel from './MapPanel'
import MenuBar from './MenuBar'
import DiagPanel from './DiagPanel'


import $ from 'jquery'

export default {
	name: 'PanelMaster',
	components: {
	MapPanel,
	MenuBar,
	DiagPanel
  },
  props: {

	},
	
	data() {
		return {
			drag: { x:0, y:0 },

			diag: {
				pixi: {
					containers: null,
				}
			}
		}
	},
	computed: {
		
	},

  methods: {
		// DiagPixiUpdate(diag2)
		// {
		// 	console.log(diag2);
		// 	this.diag.pixi = diag2.pixi;
		// },

		testProp1() {
			if (this.$refs.mapPanel)
			{
				return this.$refs.mapPanel.getDiag();
			}
			return "null";
		},

		seperatorMousedown: function (event) {
			this.drag.x = event.clientX;
			this.drag.y = event.clientY;

			let element = document.getElementById("seperator");
			element.setAttribute("dragging", "true");

			//console.log(element, event);
		},
		seperatorMouseup: function() {
			let element = document.getElementById("seperator");
			//console.log("seperatorMouseup", element, event);

			//if (element.id != "splitter") return;
			element.setAttribute("dragging", "false");
			
		},
		seperatorMousemove: function (event) {
			let element = document.getElementById("seperator");

			// Check if we are dragging
			if (element.getAttribute("dragging")!="true") return;


			const currentX = event.clientX;
			const currentY = event.clientY;

			let delta = { x:0, y:0 };
			delta.x = currentX - this.drag.x;
			delta.y = currentY - this.drag.y
		
			const offsetLeft = element.offsetLeft;
			//const offsetTop = element.offsetTop;

			const first = document.getElementById("first");
			const second = document.getElementById("second");
			let firstWidth = first.offsetWidth;
			let secondWidth = second.offsetWidth;

			element.style.left = offsetLeft + delta.x + "px";
			firstWidth += delta.x;
			//secondWidth -= delta.x;
			secondWidth = window.innerWidth - firstWidth - 10;
			this.drag.x = currentX;
			this.drag.y = currentY;
			first.style.width = firstWidth + "px";
			second.style.width = secondWidth + "px";

			this.$refs.mapPanel.onResize();
			//console.log("dragging", second);
		},

		onResize(event) {
			const first = document.getElementById("first");
			const second = document.getElementById("second");
			let firstWidth = first.offsetWidth;
			let secondWidth = window.innerWidth - firstWidth - 10;
			second.style.width = secondWidth + "px";

			this.$refs.mapPanel.onResize(event);
		},

		onMouseDown(event) {
			//console.log(event.target);
			if (! $(event.target).hasClass("dropdown-submenu-item")
				&& ! $(event.target).hasClass("dropbtn"))
			{
			// 	$(".showMenu").removeClass("showMenu");
				this.$refs.MenuBar.menuHideAll();
			}
			

		},

		DoAction(action) {
			console.log("DoAction", action);

			// Assume most actions are MAP related
			this.$refs.mapPanel.DoAction(action);

		},

		onKeyDown(event)
		{
			console.log(event);
			event.stopPropagation();
		}

	},
	mounted() {
		this.onResize();
		window.addEventListener('resize', this.onResize);
		window.addEventListener("mousedown", this.onMouseDown);
		//window.addEventListener("keydown", this.onKeyDown);
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.splitter {
	width: 100vw;
	height: calc(100vh - 18px);
	display: flex;
}

#seperator {
	cursor: col-resize;
	background: url(https://raw.githubusercontent.com/RickStrahl/jquery-resizable/master/assets/vsizegrip.png) center center no-repeat #535353;	
	width: 10px;
	min-width: 10px;
}

#menuDiv {
	background-color: orange;
	width: 100vw;
	height: 18px;
}

#first {
	background-color: green;
	width: calc(100vw - 210px);
	min-width: 10px;
}

#second {
	background-color: red;
	width: calc(200px);
	min-width: 10px;
}

/* #PanelMasterDiv {

} */
</style>
