<template>
	<nav class="flyout-nav">
			<ul>
					<li>
							<a href="#"><span class="label">File</span></a>
							<ul>
									<li>
											<a href="#">
													<span class="label">New Tab</span>
													<span class="shortcut">⌘T</span>
											</a>
									</li>
									<li>
											<a href="#">
													<span class="label">New Window</span>
													<span class="shortcut">⌘N</span>
											</a>
									</li>
									<li class="separator"></li>
									<li class="has-children">
											<a href="#">
													<span class="label">Share...</span>
											</a>
											<ul>
													<li>
															<a href="#">
																	<span class="label">✉️ Email</span>
															</a>
													</li>
													<li>
															<a href="#">
																	<span class="label">💬 Messages</span>
															</a>
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
	inheritAttrs: true,
	data () {
    return {
		
    }
  }
}
</script>