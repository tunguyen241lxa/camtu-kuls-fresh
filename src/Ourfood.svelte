<script>
    let meal = [
		{ 
            id: '1', 
            name: 'Pakistani Chicken Platter', 
            img:'./img/mam.png', 
            view:'32',
            date:'20-30',
            eat: 'fas fa-mortar-pestle',
            country1:'Indian',
            country2:'Pakistani',
            iconheart:'fa fa-heart'
        },
		{ 
            id: '2', 
            name: 'Risotto',
            img:'./img/combo.png',
            view:'20',
            date:'10-20',
            eat: 'fas fa-mortar-pestle',
            country1:'Intalian',
            country2:'Eurpeon',
            iconheart:'far fa-heart'
        }
		
    ];
    let popular = [
        { 
            id: '4', 
            name: 'Moussouka',
            img:'./img/banhkep.png',
            view:'55',
            date:'15-25',
            eat: 'fas fa-hamburger',
            country1:'Intalian',
            country2:'Greek',
            iconheart:'fa fa-heart'
        },
		{ 
            id: '5', 
            name: 'Capachino',
            img:'./img/capachinno.png',
            view:'72',
            date:'20-30',
            eat: 'fas fa-wine-glass-alt',
            country1:'American',
            country2:'Eurpeon',
            iconheart:'fa fa-heart'
        },
        { 
            id: '6', 
            name: 'Arabic Mandi',
            img:'./img/arabic.png',
            view:'34',
            date:'35-45',
            eat: 'fas fa-mortar-pestle',
            country1:'Arabic',
            country2:'Turkish',
            iconheart:'far fa-heart'
        }
    ];

    let star = [
        {starimg: 'fa fa-star'},
        {starimg: 'fa fa-star'},
        {starimg: 'fa fa-star'},
        {starimg: 'fa fa-star'},
        {starimg: 'far fa-star'},
    ];
    let meals = [
		{ 
            id: '3', 
            name: 'Maslenitca',
            img:'./img/banh.png',
            view:'45',
            date:'20-30',
            eat: 'fas fa-stroopwafel',
            country1:'Russian',
            country2:'',
            iconheart:'fa fa-heart'
        }
		
    ];
 
</script>

<ul class="row main">
    {#each meal as {id,img,name,view,date,eat,country1,country2,iconheart} }
        <li class="col-main">
            <div class="food">
                <img src={img} alt="hamburger.png" />
                <div class="food-items-icon">
                    <i class={eat}></i>
                </div>
            </div>
            <div class="info-food">
                <div class="food-name">
                    <a>{name}</a>
                    <i class={iconheart} aria-hidden="true" />
                </div>
                <div class="price">
                    <ul>
                        {#each star as {starimg} }
                            <li>
                                <i class={starimg} aria-hidden="true" />
                            </li>
                        {/each}
                    </ul>
                    <span>{view} Preview</span>
                </div>
                <div class="country">
                    <ul>
                        <li>{country1}</li>
                        <li>{country2}</li>
                    </ul>
                    <div><i class="fa fa-clock-o" aria-hidden="true" />{date}</div>
                </div>
            </div>
        </li>
    {/each}
    {#each meals as {id,img,name,view,date,eat,country1,iconheart} }
        <li class="col-main">
            <div class="food">
                <img src={img} alt="hamburger.png" />
                <div class="food-items-icon">
                    <i class={eat}></i>
                </div>
            </div>
            <div class="info-food">
                <div class="food-name">
                    <a>{name}</a>
                    <i class={iconheart} aria-hidden="true" />
                </div>
                <div class="price">
                    <ul>
                        {#each star as {starimg} }
                            <li>
                                <i class={starimg} aria-hidden="true" />
                            </li>
                        {/each}
                    </ul>
                    <span>{view} Preview</span>
                </div>
                <div class="country">
                    <ul>
                        <li>{country1}</li>
                    </ul>
                    <div><i class="fa fa-clock-o" aria-hidden="true" />{date}</div>
                </div>
            </div>
        </li>
    {/each}

</ul>

<!--  -->

<!-- Our Meal  -->
<div class="feature">
    <div class="title-feature">POPULAR</div>
</div>

<ul class="row main">
    {#each popular as {id,img,name,view,date,eat,country1,country2,iconheart }}
        <li class="col-main">
            <div class="food">
                <img src={img} alt="hamburger.png" />
                <div class="food-items-icon">
                    <i class={eat}></i>
                </div>
                
            </div>
            <div class="info-food">
                <div class="food-name">
                    <a>{name}</a>
                    <i class={iconheart} aria-hidden="true" />
                </div>
                <div class="price">
                    <ul>
                        {#each star as {starimg} }
                            <li>
                                <i class={starimg} aria-hidden="true" />
                            </li>
                        {/each}
                    </ul>
                    <span>{view} Previews</span>
                </div>
                <div class="country">
                    <ul>
                        <li>{country1}</li>
                        <li>{country2}</li>
                    </ul>
                    <div><i class="fa fa-clock-o" aria-hidden="true" />{date}</div>
                </div>
            </div>
        </li>
    {/each}
</ul>