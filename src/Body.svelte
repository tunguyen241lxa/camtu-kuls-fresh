<script>
    import { each } from 'svelte/internal';
import Ourfood from './Ourfood.svelte';
    let menubody = [
        { id: '0', img: '',name: 'All',num:'170'},
        { id: '1', img: 'fas fa-hamburger', des: 'hamburger.png', name: 'Find',num:'23' },
		{ id: '2', img: 'fas fa-mortar-pestle', des:'nisk.png',name: 'About Us',num:'41' },
		{ id: '3', img: 'fas fa-wine-glass-alt', des:'cup.png',name: 'How It Works',num:'53' },
		{ id: '4', img: 'fas fa-stroopwafel', des:'cake.png',name: 'Plans',num:'33' },
		{ id: '5', img: 'fas fa-hamburger', des:'hamburger2.png',name: 'Contact Us', num:'20' }
    ];
</script>
<div class="container">
    <div class="home-bg-img">
        <div class="home-table">
            <div class="row">
                <div class="header-title">
                    <h1>Find Healthy And</h1>
                    <h1>Favourite foods</h1>
                    <h1>Near you</h1>
                </div>
            </div>
            <div class="row">
                <div class="header-btn">
                    <button class="btn-as"><i class="fab fa-apple" aria-hidden="true"></i><span>Download on the <h3>App Store</h3></span></button>
                    <button class="btn-gg"><i class="fab fa-google-play" aria-hidden="true"></i><span>GET IT ON <h3>Google Play</h3></span></button>
                </div>
            </div>
        </div>
    </div>

    <!-- Our Meal  -->
    <div class="feature">
        <div class="title-feature">OUR MEAL</div>
        <div class="search">
            <form class="search-form">
               
                <input type="text" id="search" placeholder="search" />
                <!-- <input type="text" id="fname" name="fname"> -->
                <i class="fa fa-search" aria-hidden="true" />
            </form>
            <div class="icon-slider">
                <button class="btn-btnslider"><i
                        class="fa fa-sliders"
                        aria-hidden="true" /></button>
            </div>
        </div>
    </div>

    <div class="menu">
        <ul class="menu-ourmeal">
            {#each menubody as {img, des, name,num}}
                <!-- <li class="items-meal"><a class="orange-meal"><img src={img} alt={des}/>{name} ({num})</a></li> -->
                <li class="items-meal"><a class="orange-meal"><i class={img}/>{name} ({num})</a></li>
            {/each}
        </ul>
    </div>

    <Ourfood />
</div>