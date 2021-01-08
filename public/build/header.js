
$( document ).ready(function() {
    
    $('.navbar-collapse').click(function(){
        $('.navbar-collapse').removeClass('orange');
        $(this).addClass('orange');
    });


    $(".items-meal").on("click", function () {
       
            $(".items-meal").removeClass("items-orange");
            //remove the background property so it comes transparent again (defined in your css)
            $(this).addClass("items-orange");
     
    });

    $(".column").on("click", function () {
        $(".column").removeClass("column-orange");
        $(this).addClass("column-orange");
    });

    $(".columns").on("click", function () {
        $(".columns").removeClass("column-orange");
        $(this).addClass("column-orange");
    });
    
})