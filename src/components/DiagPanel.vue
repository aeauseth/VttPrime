<template>
  <div>
      <ul>
				<li>
					Pixi Containers: {{ diag.pixi.containers }}
        </li>
				<li>
				Pixi textureCache: {{ diag.pixi.textureCache }}
				</li>
			</ul>
  </div>
</template>

<script>
export default {
  name: 'DiagPanel',
  props: {
      diag: Object,
  },
  data () {
      return (
      {
        PIXI: {
            Objects: null,
        }
      });
  },
  methods: {
    //   onTick () {
    //       console.log("onTick", this.MapPanel);
    //   }
  },
  mounted: function() {
    //    window.setInterval(() => {
    //         this.onTick()
    //     }, 1000)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
div {
    background-color: powderblue;
}
ul {
	margin: 0;
	list-style-type: none;
}
</style>
