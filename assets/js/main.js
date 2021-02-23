const data = {};
$(document).ready(function(){
    initializePage();
});

//INICIJALIZACIJA SVAKE STRANICE
async function initializePage(){
    try{
        data.nav = await fetchData("nav.json");
        loadNav();
    }
    catch(c){
        console.log(`Error loading navigation! Status ${c}`);
    }
    
    try {
        data.products = await fetchData("products.json");
        data.brands = await fetchData("brands.json");
        data.categories = await fetchData("categories.json");
        data.tasting = await fetchData("tasting.json");
    }
    catch(c){
        console.log(`Error loading products! Status ${c}`);
    }

    data.cart = getLocalStorageItem("cart");
    data.wishList = getLocalStorageItem("wishlist");
    refreshBadges();

    loadSidebar();
    loadProductsModal();

    pageRelatedFeatures();

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
        $("#menu, #responsive-menu").find("a:first").addClass("active");
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

//OBRADA LOCAL STORAGE
function getLocalStorageItem(name){
    let item = localStorage.getItem(name);
    if(item){
        parsedItem = JSON.parse(item);
        if(parsedItem.length > 0){
            return parsedItem;
        }
    }
    return false;
}
function getCartProductIndexByID(id){
    let productIndex = -1;
    data.cart.find((el,ind)=>{ 
        if(el.id == id){
            productIndex = ind;
            return true;
        }
        return false;
    });
    return productIndex;
}
function setCartProduct(productID, quantity, add = false){
    if(data.cart){
        let productIndex = getCartProductIndexByID(productID);
        if(productIndex > -1){
            let newQuantity = quantity;
            if(add){
                newQuantity += data.cart[productIndex].quantity;
            }
            data.cart[productIndex].quantity = newQuantity;
        }
        else {
            data.cart.push({"id": productID, "quantity": quantity});
        }
    }
    else {
        data.cart = [{"id": productID, "quantity": quantity}];
    }
    localStorage.setItem("cart", JSON.stringify(data.cart));
    refreshBadges();
}
function removeCartProduct(productID){
    data.cart.splice(getCartProductIndexByID(productID), 1);
    localStorage.setItem("cart",JSON.stringify(data.cart));
    refreshBadges();
}
function setWishListProduct(productID){
    if(data.wishList){
        if(!data.wishList.includes(productID)){
            data.wishList.push(productID);
        }
    }
    else {
        data.wishList = [productID];
    }
    localStorage.setItem("wishlist", JSON.stringify(data.wishList));
    refreshBadges();
}
function removeWishListProduct(productID){
    for(i in data.wishList){
        if (data.wishList[i] == productID){
            data.wishList.splice(i,1);
            break;
        } 
    }
    localStorage.setItem("wishlist", JSON.stringify(data.wishList));
    refreshBadges();
}
function refreshBadges(){
    $("#cart-button .badge").text(data.cart.length ? String(data.cart.length) : "");
    $("#wishlist-button .badge").text(data.wishList.length ? String(data.wishList.length) : "");
}

//SIDEBAR - LISTA ZELJA I KORPA
function loadSidebar(){
    $("#close-sidebar, #sidebar-overlay").click(hideSidebar);
    $("#sidebar").click(function(event){event.stopPropagation()});
    $("#cart-button").click(showCart);
    $("#wishlist-button").click(showWishList);
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
function createSidebarContent(array, type){
    let html = "";
    let cart = type == "cart";
    if(array && array.length > 0){
        for(i in array){
            let product = cart ? getItemById(data.products, array[i].id) : getItemById(data.products, array[i]);
            html += `<div class="sidebar-item p-0 mt-5 d-flex">
                <a href="#!" data-product-id="${product.id}" class="product-link bg-white d-flex align-items-center justify-content-center">
                    <div class="sidebar-item-image">
                        <img src="assets/img/${product.img[0]}" alt="${product.title}" class="w-100"/>
                        <div class="text-center small mt-1">View Product</div>
                    </div>
                </a>
                <div id="sidebar-item-info" class="d-flex flex-column justify-content-center align-items-start ml-4">
                    <h5>${product.title}</h5>`;
                    html+= cart ? getSidebarCartItemInfo(product, array[i]) : getSidebarWishListItemInfo(product);
                html+=`</div>
                    </div>`;
        }
    }
    else {
        html = `<p class="mt-5">Your ${type} is empty!<br/>Visit our <a href="shop.html">shop</a> to add new items.</p>`;
    }
    return html;
}

//KORPA
function getSidebarCartItemInfo(product, cartItem){
    let price = product.price.new * Number(cartItem.quantity);
    data.cart[i].price = product.price.new;
    return `<div class="my-3">Quantity: <input type="number" class="cart-item-quantity pl-1 rounded-0 border" value="${cartItem.quantity}" data-product-id="${product.id}" min="1", onchange="if(this.value<1){this.value=1;}"/></div>
    <span class="cart-item-price color-primary h4">${formatPrice(price)}</span>
    <a href="#!" data-product-id="${product.id}" class="remove-cart-item d-flex align-items-center primary-button p-2 text-white">Remove</a>`;
}
function showCart(){
    let html = createSidebarContent(data.cart, "cart");
    showSidebar("Your Cart", html, "fas fa-shopping-cart");
    showCartTotal();

    $(".sidebar-item .product-link")
        .click(hideSidebar)
        .each(function(){
            bindProductModalLink(this);
        });

    $(".sidebar-item .remove-cart-item").click(function(){
        removeCartProduct(Number($(this).attr("data-product-id")));
        $(this).parent().parent().fadeOut(300, showCart);
    });

    $(".sidebar-item .cart-item-quantity").change(function(){
        let id = Number($(this).attr("data-product-id"));
        let quantity = Number($(this).val());
        let index = getCartProductIndexByID(id);
        let price = data.cart[index].price;
        setCartProduct(id,quantity);
        $(this)
            .parent()
            .parent()
            .find(".cart-item-price")
            .text(`${formatPrice(price*quantity)}`);
        showCartTotal();
    });
}
function showCartTotal(){
    if(data.cart && data.cart.length > 0){
        let total = 0;
        $(data.cart).each(function(){
            total += this.price * this.quantity;
        });
        $(".total-price").remove();
        $("#sidebar-content").append(`<div class="total-price mt-5">Total price: <span class="color-primary h4">${formatPrice(total)}</span></div>`);
    }
}

//LISTA ZELJA
function getSidebarWishListItemInfo(product){
    return `<a href="#!" data-product-id="${product.id}" class="remove-wishlist-item d-flex align-items-center primary-button p-2 text-white"><span class="fas fa-heart-broken"></span>&nbsp;Remove</a>`;
}
function showWishList(){
    
    let html = createSidebarContent(data.wishList, "wish list");
    showSidebar("Your Wish List", html, "far fa-heart");

    $(".sidebar-item .product-link")
        .click(hideSidebar)
        .each(function(){
            bindProductModalLink(this);
        });

    $(".sidebar-item .remove-wishlist-item").click(function(){
        removeWishListProduct(Number($(this).attr("data-product-id")));
        $(this).parent().parent().fadeOut(300, showWishList);
    });
}



//MODAL ZA PROIZVODE
function loadProductsModal(){
    $("#close-product-modal").click(hideProductsModal);
    $("#product-modal-overlay").click(hideProductsModal);
    $("#product-modal").click(function(event){event.stopPropagation();})
    bindAddToCartButton();
    bindWishListModalButton();
}
function bindAddToCartButton(){
    $("#add-to-cart").click(function(){
        setCartProduct(Number($(this).attr("data-product-id")), Number($("#product-modal-info .cart-item-quantity").val()), true);
        $("#product-modal-info .cart-item-quantity").val("1");
        let success = document.createElement("p");
        $(success)
            .text("Successfully added to cart!")
            .hide()
            .appendTo("#product-modal-info")
            .fadeIn(300);
        setTimeout(function(){
            $(success).fadeOut(300, function(){
                $(this).remove();
            });
        }, 1000);
    });
}
function bindWishListModalButton(){
    $("#add-to-wishlist").click(function(){
        let productID = Number($(this).attr("data-product-id"));
        if(data.wishList && data.wishList.includes(productID)){
            removeWishListProduct(productID);
        }
        else {
            setWishListProduct(productID);
        }
        refreshModalWishListIcon();
    });
}
function bindProductModalLink(element){
    let product = getItemById(data.products, element.getAttribute("data-product-id"));
    $(element).click(function(){
        showProductsModal(product);
    });
}
function hideProductsModal(){
    $("#product-modal-overlay").stop().fadeOut(300);
    $("body").css("overflow-y", "scroll");
}
function showProductsModal(product){
    insertProductModalData(product);
    $("#product-modal-overlay").stop().fadeIn(300);
    $("body").css("overflow-y", "hidden");
    bindProductModalImages();
    refreshModalWishListIcon();
}
function insertProductModalData(product){
    let decaf = product.decaf ? "Decaffeinated" : "";
    let category = getItemById(data.categories, product.category).name;
    let tasting = data.tasting.filter(el=>product.tasting.includes(el.id)).map(el=>el.name).join(", ");
    let images="";
    for (img of product.img){
        images+=`<div class="col-3 mr-2 p-0"> <a href="#!" class="product-image-link"><img src="assets/img/${img}" alt="" class="img-fluid"/></a></div>`;
    }
    $("#product-modal-image")
        .attr("src", `assets/img/${product.img[0]}`)
        .attr("alt", product.title);
    $("#product-modal-all-images").html(images);
    $("#product-modal-title").text(product.title);
    $("#product-modal-category").text(`${decaf} ${category}`);
    if(product.price.discount){
        $("#product-modal-discount-wrapper")
            .show()
            .find("span")
            .text(`-${product.price.discount}%`);
        $("#product-modal-old-price").text(formatPrice(product.price.old));
    }
    else {
        $("#product-modal-discount-wrapper").hide();
        $("#product-modal-old-price").text("");
    }
    $("#product-modal-description").text(product.description);
    $("#product-modal-tasting").text(tasting);
    $("#product-modal-package-size").text(product.size);
    $("#product-modal-new-price").text(formatPrice(product.price.new));
    $("#add-to-wishlist, #add-to-cart").attr("data-product-id", String(product.id));
}
function bindProductModalImages(){
    $(".product-image-link").click(function(){
        let newSrc = $(this).find("img").attr("src");
        $("#product-modal-image")
            .animate({"opacity":".3"}, 200, "swing", function(){
                $(this).attr("src", newSrc);
            })
            .animate({"opacity":"1"}, 200); 
    });
}
function refreshModalWishListIcon(){
    let heartClass = "far";
    let productID = Number($("#add-to-wishlist").attr("data-product-id"));
    if(data.wishList && data.wishList.includes(productID)){
        heartClass = "fas";
    }
    $("#add-to-wishlist span").attr("class", heartClass + " fa-heart")
}
//ISPIS PROIZVODA
function formatPrice(price){
    return price.toLocaleString("en-US",{style: 'currency', currency: 'USD'});
}
function showProducts(containerID, products, grid = true){
    let productContainerClass = "p-2";
    if(grid){
        productContainerClass += " col-12 col-sm-6 col-md-4 col-lg-3";
    }
    let html = ``;
    for(product of products){
         html += `<div class="${productContainerClass}">
        <a href="#!" class="product-link" data-product-id="${product.id}">
            <div class="product card text-dark rounded-0 border-0">
            ${product.price.discount ? `<div class="product-discount text-white py-1 px-2">-` + product.price.discount + "%</div>" : ""}
            <img class="card-img-top rounded-0" src="assets/img/${product.img[0]}" alt=""/>
                <div class="card-body">
                    <h5 class="card-title text-center">${product.title}</h5>
                    ${product.price.old ? `<s class="small d-block card-text text-center text-muted">$` + product.price.old + "</s>" : `<div class="small">&nbsp;</div>`}
                    <p class="card-text text-center color-primary product-price">$${product.price.new}</p>
                </div>
            </div>
        </a>
        </div>`;
    }
    $(`#${containerID}`)
        .html(html)
        .find(`.product-link`)
        .each(function(){
            bindProductModalLink(this);
        });
}
//FILTRIRANJE I SORTIRANJE
function getItemById(array, ID){
    return array.find(el => el.id == ID);
}
function sortProductsByDate(products){
    return products.sort((a,b)=>{
        let datumA = new Date(a.date);
        let datumB = new Date(b.date);
        return datumB - datumA;
    });
}
function sortProductsByDiscount(products){
    return products.sort((a,b)=>{
        return b.price.discount - a.price.discount;
    });
}
function filterDiscountedProducts(products){
    return products.filter(el => el.price.discount > 0);
}


//USMERAVANJE U SKLADU SA TRENUTNOM STRANICOM
function pageRelatedFeatures(){
    switch(data.page){
        case "Home": loadHomePage(); break;
        case "Shop": loadShopPage(); break;
    }
}

//HOME STRANICA
async function loadHomePage(){
    try{
        data.slider = await fetchData("slider.json");
        data.slickSettings = await fetchData("slick.json");
        loadSlider();
        loadNewArrivals();
        loadDiscounted();
    }
    catch(c){
        console.log("Error loading home page sliders. Status: " + c);
    }
}
function loadSlider(){
    for(img of data.slider){
        $("#slider").append(`<div><img src="assets/img/${img.src}" class="w-100 h-100" alt="${img.title}"/></div>`);
    }
    $("#slider").slick(data.slickSettings.homeSlider);
}
function loadNewArrivals(){
    showProducts("new-arrivals", sortProductsByDate(data.products).slice(0,6), false);
    $("#new-arrivals").slick(data.slickSettings.productsSlider);
}
function loadDiscounted(){
    showProducts("discounted", filterDiscountedProducts(sortProductsByDiscount(data.products)), false);
    $("#discounted").slick(data.slickSettings.productsSlider);
}

//SHOP STRANICA
function loadShopPage(){
    //FIX
    showProducts("shop-pr", data.products);
}
