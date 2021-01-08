<script>
	import Body from "./Body.svelte";
	import Home from "./Home.svelte";
	export let name, count;

	// $: doubled = count * 2;
	// function doubleHandleclick() {
	// 	count += 1;
	// }
	// import Fluid from "svelte-fluid-header"
	let header = [
		{ id: '1', name: 'Find' },
		{ id: '2', name: 'About Us' },
		{ id: '3', name: 'How It Works' },
		{ id: '4', name: 'Plans' },
		{ id: '5', name: 'Contact Us' }
	];

	let international = [
		{ id: '1', name: 'American' },
		{ id: '2', name: 'Indian' },
		{ id: '3', name: 'Italian' },
		{ id: '4', name: 'Persian' },
		{ id: '5', name: 'Russian' },
		
	];
	let internationals = [
		{ id: '6', name: 'Italian' },
		{ id: '7', name: 'Japanese' },
		{ id: '8', name: 'Latin' },
		{ id: '9', name: 'Mexican' },
		{ id: '10', name: 'Seafood' }
	];

</script>

<style>
	  #infobar {
      width: 500px;
      height: 200px;
      border: 1px solid #333;
      overflow-y: scroll;
    }

    .content {
      width: 100%;
    }

 

    .content div span {
      color: #666;
    }

    .info {
      margin-top: 10px;
    }

    .example {
      background-color: #F8F8F8;
    }

    .submit {
      margin-top: 20px;
    }

    @media only screen and (max-width: 720px) {
      #mobile {
        padding: 20px 0;
      }
    }
</style>

<main>
	

	<div class="bg-body">
		<div class="felt">
			<header class="main-header">
				<div class="container">
					<!-- <div class="border-header"> -->
					<a class="nav-brand">
						<h3>KUKS FRESH</h3>
					</a>
					<nav class="main-nav">
						<ul class="main-nav-list">
							<!-- <li><a class="active" href="#"></a></li> -->
							{#each header as { name }}
								<li class="nav-item"><a target="_blank" class="navbar-collapse">{name}</a></li>
							{/each}
							
						</ul>
						<div class="author-submit">
							<div class="border-img">
								<img class="author" src="./img/Image39.png" alt="Image39.png" />
							</div>
							<button class="submit-items">
								<i class="fa fa-shopping-cart" aria-hidden="true" />(5)Items
							</button>
						</div>
					</nav>
					<!-- </div> -->
				</div>
			</header>

			<!-- home -->
			<Home />
			<Body />
		</div>

		<div class="right">
			<div class="item-right">
				<div class="adverti">
					<h3 style="text-align:center;margin: 0 4px 0 0;">Your Meal Has <br/>Been Shipped</h3>
					<div class="img-shipper" />
					<ul class="date-time">
						<li id="hours"></li>
						<li id="text">m</li>
						<li id="point">:</li>
						<li id="min"></li>
						<li id="text">s</li>

					</ul>
				</div>
			</div>
			<div class="item-right">
				<div class="adverti">
					<div class="top-cus">
						<div class="items-price-top">
							<h3>Price/ Serving</h3>
							<div class="example">
								<div class="range-example-2"></div>
								<script>
								$(document).ready(function() {
									var one = $(".range-example-2").asRange({
									range: true,
									limit: true,
									tip: {
										active: 'onMove'
									}
									});
									console.log(one.asRange('set', [0, 20]));
								});
								</script>
							</div>
						</div>
						<div class="items-price-top">
							<h3>Cusine</h3>
							<div class="selector-country">
								<ul class="selector">
									{#each international as { id,name }}
										<li class="column">
											<a target="_blank" id={id}>
												{name}
											</a>
										</li>
									{/each}
									{#each internationals as { id,name }}
										<li class="columns">
											<a target="_blank" id={id}>
												{name}
											</a>
										</li>
									{/each}
								</ul>	
							</div>
						</div>
					</div>
					<div class="bottom-cus">
						<button class="select-cus">Select</button>
					</div>
				</div>

			</div>
		</div>
	</div>
</main>
