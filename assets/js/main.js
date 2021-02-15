const data = {};
$(document).ready(function(){
    initializePage();
});
//INICIJALIZACIJA SVAKE STRANICE
async function initializePage(){
    try{
        data.nav = await fetchData("nav.json");
        loadNav();
        loadSidebar();
        pageRelatedFeatures();
    }
    catch(c){
        console.log(`Greska pri ucitavanju! Status ${c}`);
    }
    $("#loading").fadeOut(1000);
}
function loadNav(){
    for(link of data.nav) {
        let active = "";
        if(window.location.pathname.includes(link.href)){
            data.page = link.title;
            active = " active";
        }
        $("#menu, #responsive-menu").append(`<li class="m-2"><a class="${active}" href="${link.href}">${link.title}</a>`);
    }
    if(!data.page){
        data.page = "Home";
    }
    navScrollEvent();
    $(window).on("scroll",navScrollEvent);
    $("#menu-button").click(function(){
        $("#responsive-menu-wrapper").toggleClass("active").toggle(300);
        navScrollEvent();
    });
}
function navScrollEvent(){
    if($(window).scrollTop() > 70 || $("#responsive-menu-wrapper").hasClass("active")){
        $("#header").addClass("bg-darkTransparent");
    }
    else {
        $("#header").removeClass("bg-darkTransparent")
    }
}
//AJAX DOHVATANJE
function fetchData(filename){
    return new Promise((resolve, reject)=>{
        $.ajax({
            url: `assets/data/${filename}`,
            method: "get",
            dataType: "json",
            success: function(data){
                resolve(data);
            },   
            error: function(xhr){
                reject(xhr.status);
            }
        });
    });
}
//LISTA ZELJA, KORPA
async function loadSidebar(){
    $("#close-sidebar").click(hideSidebar);
    $("#sidebar-overlay").click(hideSidebar);
    $("#sidebar").click(function(event){stopPropagation(event)});
    $("#cart-button").click(openCart);
    $("#wishlist-button").click(openWishList);
}
function stopPropagation(event){
    event.stopPropagation();
}
function showSidebar(title, htmlContent, iconClass){
    $("#sidebar-title").text(title);
    $("#sidebar-content").html(htmlContent);
    $("#sidebar-icon").removeAttr("class").attr("class", iconClass);
    $("#sidebar-overlay")
        .stop()
        .fadeIn(400)
        .find("#sidebar")
        .animate({
            "right" : "0px",
        }, 400);
    $("#sidebar-fix").fadeIn(10);
    $("body").css("overflow-y", "hidden");
}
function hideSidebar(){
    $("#sidebar-overlay")
        .stop()
        .fadeOut(400)
        .find("#sidebar")
        .animate({
            "right" : "-700px",
        }, 400);
    $("#sidebar-fix").fadeOut(10);
    $("body").css("overflow-y", "scroll");
}
function openCart(){
    let html = "cart!";
    showSidebar("Your Cart", html, "fas fa-shopping-cart");
}
function openWishList(){
    let html = "wish list!";
    showSidebar("Your Wish List", html, "far fa-heart");
}
//USMERAVANJE U SKLADU SA TRENUTNOM STRANICOM
function pageRelatedFeatures(){
    switch(data.page){
        case "Home": loadHomePage(); break;
    }
}
//HOME STRANICA
function loadHomePage(){
    loadSlider();
}
async function loadSlider(){
    data.slider = await fetchData("slider.json");
    for(img of data.slider){
        $("#slider").append(`<div><img src="assets/img/${img.src}" class="w-100 h-100" alt="${img.title}"/></div>`);
    }
    $("#slider").slick({
        prevArrow: `<a href="#!" class="slick-prev"><span class="fas fa-long-arrow-alt-left"></span></a>`,
        nextArrow: `<a href="#!" class="slick-next"><span class="fas fa-long-arrow-alt-right"></span></a>`
    });
}