<!-- https://www.ghosh.dev/posts/creating-a-multi-level-hierarchical-flyout-navigation-menu-using-only-html-and-css/ -->
<!-- https://jsonformatter.org/scss-to-css -->
<!-- https://www.telerik.com/blogs/passing-variables-to-css-on-a-vue-component -->

<template>
		<nav class="flyout-nav" :style="cssVars">

			<ul>
				<li 
					v-for="(item1) in menu" 
					:key="item1.label"
					:class="{ disabled: item1.isDisabled}"
				>
					<a @click="menuClick(item1)"><span class="label">{{ item1.label }}</span></a>

					<ul>
						<li 
							v-for="(item2) in item1.menu" 
							:key="item2.label"
							:class="{ disabled: item2.isDisabled || (!item2.Action && !item2.menu), 'has-children': item2.menu}"
						>
							<a @click="menuClick(item2)"><span class="label">{{ item2.label }}</span></a>
							<ul>
								<li 
									v-for="(item3) in item2.menu" 
									:key="item3.label"
									:class="{ disabled: item3.isDisabled || (!item3.Action)}"
								>
									<a @click="menuClick(item3)"><span class="label">{{ item3.label }}</span></a>
								</li>
							</ul>
						</li>
					</ul>
				</li>
			</ul>
			
	</nav>
</template>

<script>
export default {
  name: 'MenuFlyout',
  props: {

	},
	//inheritAttrs: true,
	data () {
    return {
			menu: [
				{ label: 'File', menu: [
					{ label: 'Open Campaign', isDisabled: true }
				]},
				{ label: 'Edit', isDisabled: true },
				{ label: 'View', isDisabled: true },
				{ label: 'Window', isDisabled: true },
				{ label: 'Test', menu: [
					{ label: 'Create Maze',  menu: [
						{ label: '5 x 5' , Action: { function: 'Do_CreateMaze', props: {x: 5, y: 5} } },
						{ label: '13 x 9', Action: { function: 'Do_CreateMaze', props: {x: 13, y: 9} } },
						{ label: '33 x 33', Action: { function: 'Do_CreateMaze', props: {x: 33, y: 33} } },
					]},
				]},
				{ label: 'Help', menu: [
					{ label: 'About', Action: 'Do_HelpAbout' }
				]},
			]
		
    }
	},
	computed: {
    cssVars() { // REF: https://www.ghosh.dev/posts/creating-a-multi-level-hierarchical-flyout-navigation-menu-using-only-html-and-css/
      return {
        '--base-font-size': '0.5rem',
        '--menu-silver': '#eee',
        '--menu-border': '#ded0e8', //'#dedede',
        '--menu-focused': 'indigo', //'#1e88e5',
        '--menu-separator': '#cdb9dc', //'#ccc',
        '--menu-text-color': '#333',
        '--menu-shortcut-color': '#999',
        '--menu-focused-text-color': '#fff',
        '--menu-text-color-disabled': '#999',
        '--menu-border-width': '1px',
        '--menu-shadow': '2px 2px 3px -3px',  //$menu-text-color',
				//'--menu-content-padding': '0.5rem 1rem 0.5rem 1.75rem',
				'--menu-content-padding': '0.25rem 0.5rem 0.25rem 0.875rem',
        '--menu-border-radius': '0.5rem',
				//'--menu-top-padding': '0.25rem',
				'--menu-top-padding': '0.125rem'
      }
    }
	},
	methods: {
		menuClick(e) {
			if (e.Action)
			{
				this.$parent.$parent.$parent.DoAction(e.Action);
			}
		},


	}
}
</script>

<style scoped>


	.flyout-nav {
		font-size: var(--base-font-size);
	}

	/* nav-bar styling */
	.flyout-nav ul {
		margin: 0;
		padding: 0;
		position: absolute;
		display: none;
		list-style-type: none;
		white-space: nowrap;
		background: var(--menu-silver);
		border: var(--menu-border-width) solid var(--menu-border);
		box-shadow: var(--menu-shadow);
	}
	.flyout-nav li {
		position: relative;
		display: block;
	}
	.flyout-nav li.separator {
		margin-bottom: var(--menu-top-padding);
		border-bottom: var(--menu-border-width) solid var(--menu-separator);
		padding-bottom: var(--menu-top-padding);
	}
	.flyout-nav li a {
		text-decoration: none;
		outline: none;
		color: var(--menu-text-color);
		position: relative;
		display: table;
		width: 100%;
	}
	.flyout-nav li a .label, .flyout-nav li a .shortcut {
		display: table-cell;
		padding: var(--menu-content-padding);
	}
	.flyout-nav li a .shortcut {
		text-align: right;
		color: var(--menu-shortcut-color);
	}
	.flyout-nav li a label {
		cursor: pointer;
	}
	.flyout-nav li a input[type='checkbox'] {
		display: none;
	}
	.flyout-nav li a input[type='checkbox']:checked + .label:before {
		content: '✔️';
		position: absolute;
		top: 0;
		left: var(--menu-top-padding);
		padding: var(--menu-top-padding);
	}
	.flyout-nav li a:hover {
		background: var(--menu-focused);
	}
	.flyout-nav li a:hover .label, .flyout-nav li a:hover .shortcut {
		color: #fff;
	}
	.flyout-nav li.has-children > a {
		margin-right: 2.5rem;
	}
	.flyout-nav li.has-children > a:after {
		content: '▶';
		text-align: right;
		position: absolute;
		right: 0;
		padding: var(--menu-content-padding);
	}
	.flyout-nav li.disabled {
		pointer-events: none;
	}
	.flyout-nav li.disabled .label, .flyout-nav li.disabled .shortcut {
		color: var(--menu-text-color-disabled);
	}
	.flyout-nav li:hover > ul {
		display: block;
		top: -1px;
		left: 100%;
	}
	.flyout-nav > ul {
		display: flex;
		flex-flow: row nowrap;
		justify-content: flex-start;
		align-items: stretch;
		width: 100%;
		border: none;
		/* border-bottom: none; var(--menu-border-width) solid var(--menu-border); 
		border-left: none;
		border-right: none; */
		box-shadow: none; /*var(--menu-shadow) var(--menu-text-color);*/
		padding: 0;
	}
	.flyout-nav > ul > li > a > .label {
		padding-left: 1rem;
	}
	.flyout-nav > ul > li:hover > ul {
		top: 100%;
		left: -1px;
	}
</style>