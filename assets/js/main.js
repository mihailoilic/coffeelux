const data = {
    "shipping" : 4.99,
    "forms" : {}
};
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
        $("#menu").append("<li>Error loading navigation. Try again later.</li>");
    }
    
    try {
        data.products = await fetchData("products.json");
        data.brands = await fetchData("brands.json");
        data.categories = await fetchData("categories.json");
        data.tasting = await fetchData("tasting.json");
    }
    catch(c){
        console.log(`Error loading products! Status ${c}`);
        $("#new-arrivals, #shop-products-grid").append(`<p>Error loading products! Try again later.</p>`);
    }

    data.cart = getLocalStorageItem("cart");
    data.wishList = getLocalStorageItem("wishlist");
    refreshBadges();

    loadSidebar();
    loadProductsModal();
    loadRegularExpressions();

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
        $("#menu, #responsive-menu").append(`<li class="m-2"><a class="${active}" href="${link.href}">${link.title}</a></li>`);
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
function removeLocalStorageItem(name){
    data[name] = [];
    localStorage.removeItem(name);
    refreshBadges();
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
    if($("#sidebar-overlay").is(":visible")){
        return;
    }
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
            let product = cart ? getItemByID(data.products, array[i].id) : getItemByID(data.products, array[i]);
            html += `<div class="sidebar-item p-0 my-5 d-flex">
                <a href="#!" data-product-id="${product.id}" class="product-link bg-white d-flex align-items-center justify-content-center">
                    <div class="sidebar-item-image">
                        <img src="assets/img/${product.img[0]}" alt="${product.title}" class="w-100"/>
                        <div class="text-center small mt-1">View Product</div>
                    </div>
                </a>
                <div id="sidebar-item-info" class="d-flex flex-column justify-content-center align-items-start ml-4">
                    <h5>${product.title}</h5>`;
                    if(cart){
                        html+= getSidebarCartItemControls(product, i);
                    }
                    else {
                        html+= getSidebarWishListItemControls(product);
                    }
                html+=`</div></div>`;
        }
    }
    else {
        html = `<p class="mt-5">Your ${type} is empty!<br/>Visit our <a href="shop.html">shop</a> to add new items.</p>`;
    }
    return html;
}
function addClearAllButton(type){
    if(data[type] && data[type].length > 0){
        $(`#clear-${type}`).remove();
        $("#sidebar-content").append(`<a href="#!" id="clear-${type}" class="primary-button p-2"><span class="fas fa-times"></span> Clear all</a>`);
        $(`#clear-${type}`).click(function(){
            removeLocalStorageItem(type);
            if(type == "cart"){
                showCart();
            }
            else {
                showWishList();
            }
        });
    }
}

//LISTA ZELJA
function getSidebarWishListItemControls(product){
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
        removeWishListProduct(Number($(this).data("product-id")));
        $(this).parent().parent().fadeOut(300, showWishList);
    });

    addClearAllButton("wishList");
}

//KORPA
function getSidebarCartItemControls(product, index){
    let price = product.price.new * Number(data.cart[index].quantity);
    data.cart[index].price = product.price.new;
    return `<div class="my-3">Quantity: <input type="number" class="cart-item-quantity pl-1 rounded-0 border" value="${data.cart[index].quantity}" data-product-id="${product.id}" min="1", onchange="if(this.value<1){this.value=1;}"/></div>
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
        removeCartProduct(Number($(this).data("product-id")));
        $(this).parent().parent().fadeOut(300, showCart);
    });

    $(".sidebar-item .cart-item-quantity").change(function(){
        let id = Number($(this).data("product-id"));
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
        $("#sidebar-content").append(`<div class="total-price mt-5 pt-3 mb-2"><hr/>Total price: <span class="color-primary h4">${formatPrice(total)}</span></div>`);

        if(total < 30){
            $("#sidebar-content .total-price").append(` + Shipping <span class="color-primary h6">${formatPrice(data.shipping)}</span>`);
        }

        $("#cart-checkout").remove();
        $("#sidebar-content").append(`<a href="#!" id="cart-checkout" class="primary-button p-2 mr-2"><span class="fas fa-shopping-bag"></span> Checkout now</a>`);
        $("#cart-checkout").click(function(){
            showCheckoutForm(total);
        });

        addClearAllButton("cart");
    }
}
function showCheckoutForm(total){
    if(total < 30){
        total += data.shipping;
    }
    let html = `<div class="mt-5 py-2 d-flex justify-content-between">
        <a href="#!" id="back-to-cart"><span class="fas fa-chevron-left"></span> Back to cart</a>
        <span class="checkout-form-total"> Total: <span class="color-primary h4">${formatPrice(total)}</span></span>
    </div>
    <form id="checkout-form" action="#" method="post" class="mt-3">
        <div class="form-group">
            <input type="text" class="form-control" placeholder="Your full name" id="checkout-name"/>
        </div>
        <div class="form-group">
            <input type="text" class="form-control" placeholder="Your email" id="checkout-email"/>
        </div>
        <div class="form-group">
            <input type="text" class="form-control" placeholder="Your shipping address" id="checkout-address"/>
        </div>
        <button type="submit" class="primary-button border-0 px-2" id="checkout-submit">Place order</button>
    </form>`;
    
    showSidebar("Checkout", html, "fas fa-shopping-bag");

    $("#back-to-cart").click(showCart);
    $("#checkout-form").submit(validateCheckoutForm);
}
function validateCheckoutForm(event){
    event.preventDefault();
    resetFormMessages();
    data.forms.error = false;

    let name = $("#checkout-name");
    let email = $("#checkout-email");
    let address = $("#checkout-address");

    validateElement(name, data.forms.name);
    validateElement(email, data.forms.email);
    validateElement(address, data.forms.address);

    if(!data.forms.error){
        $(this).remove();
        $(".checkout-form-total, #back-to-cart").remove();
        $("#sidebar-content").append(`<span class="fas fa-check form-success mt-5"></span><p class="mt-2">You have successfully placed an order.<br/>We'll contact you soon.`);
        removeLocalStorageItem("cart");
    }
}


//REGULARNI IZRAZI I VALIDACIJA FORME
function loadRegularExpressions(){
    data.forms.name = {
        "regex" : /^\p{Uppercase_Letter}\p{Letter}{1,14}(\s\p{Uppercase_Letter}\p{Letter}{1,14}){1,3}$/u,
        "length": 30,
        "message": "All words must begin with a capital letter."
    };
    data.forms.email = {
        "regex" : /^[a-z]((\.|-|_)?[a-z0-9]){2,}@[a-z]((\.|-)?[a-z0-9]+){2,}\.[a-z]{2,6}$/i,
        "length": 50,
        "message": "Use only letters, numbers and symbols @.-_"
    };
    data.forms.address = {
        "regex" : /^[\w\.]+(,?\s[\w\.]+){2,8}$/,
        "length": 50,
        "message": "Adress should include your settlement and country."
    };
    data.forms.subject = {
        "regex": /^\p{Uppercase_Letter}[\p{Letter}\.,\?!\/-]*(\s[\p{Letter}\.,\?!\/-]+)*$/u,
        "length": 30,
        "message": "First letter must be a capital. You can use symbols .,-/?!"
    };
    data.forms.message = {
        "regex": /.{20,}/,
        "length": 200,
        "message": "Message must be at least 20 characters long."
    };
}
function validateString(string, validation){
    if(string == ""){
        return "empty";
    }
    if(string.length > validation.length){
        return "long";
    }
    if(!validation.regex.test(string)){
        return "incorrect";
    }
    return "valid";
}
function validateElement(element, validation){
    let fieldName = $(element).attr("placeholder");
    let fieldValidation = validateString($(element).val(), validation);
    if(fieldValidation == "empty"){
        formError(element, `Plese input ${fieldName.toLowerCase()}.`);
    }
    if(fieldValidation == "long"){
        formError(element, `${fieldName} is too long. Maximum characters: ${validation.length}.`);
    }
    else if(fieldValidation == "incorrect"){
        formError(element, `${fieldName} is invalid. ${validation.message}`);
    }
}
function formError(element, message){
    $(`<p class="form-error small text-danger">${message}</p>`).insertAfter($(element));
    data.forms.error = true;
}
function resetFormMessages(){
    $(".form-error").remove();
    $(".form-success").remove();
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
        setCartProduct(Number($(this).data("product-id")), Number($("#product-modal-info .cart-item-quantity").val()), true);

        $("#product-modal-info .cart-item-quantity").val("1");
        $(".add-to-cart-success").remove();
        $(`<p class="add-to-cart-success mt-2"><span class="fas fa-check form-success"></span> Successfully added to cart.</p>`)
            .hide()
            .appendTo("#product-modal-info")
            .fadeIn(300)
            .delay(1000)
            .fadeOut(300, function(){
                $(this).remove();
            });
    });
}
function bindWishListModalButton(){
    $("#add-to-wishlist").click(function(){
        let productID = Number($(this).data("product-id"));
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
    let product = getItemByID(data.products, element.getAttribute("data-product-id"));
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
    let category = getItemByID(data.categories, product.category).name;
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
    $("#add-to-wishlist, #add-to-cart").data("product-id", String(product.id));
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
    let productID = Number($("#add-to-wishlist").data("product-id"));
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
        productContainerClass += " col-12 col-md-6 col-lg-4 col-xl-3";
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
function getItemByID(array, ID){
    return array.find(el => el.id == ID);
}
function getMaxPrice(products){
    return sortProductsByPrice(products, "desc")[0].price.new;
}
function getDiscountedProducts(products){
    return products.filter(el => el.price.discount > 0);
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
function sortProductsByPrice(products, direction){
    let directionIndicator = -1;
    if(direction == "asc") {
        directionIndicator = 1;
    }
    return products.sort((a,b)=>{
        return (a.price.new - b.price.new) * directionIndicator;
    });
}
function sortProductsByName(products, direction){
    let directionIndicator = -1;
    if(direction == "asc") {
        directionIndicator = 1;
    }
    return products.sort((a,b)=>{
        if(a.title > b.title){
            return directionIndicator;
        }
        else if(a.title < b.title){
            return -directionIndicator;
        }
        else {
            return 0;
        }
    });
}
function sortProducts(products, sortString){
    let sortType = sortString.split("-")[0];
    switch(sortType){
        case "date": return sortProductsByDate(products);
        case "discount": return sortProductsByDiscount(products);
        case "price": return sortProductsByPrice(products, sortString.split("-")[1]);
        case "name": return sortProductsByName(products, sortString.split("-")[1]);
    }
}
function filterProductsDiscounted(products){
    if($("#filter-discount").is(":checked")){
        data.isFiltered = true;
        return getDiscountedProducts(products);
    }
    return products;
}
function filterProductsMaxPrice(products){
    setMaxPriceValue(products);
    let maxPrice = Number($("#max-price").val());
    return products.filter(el=> el.price.new <= maxPrice);
}
function filterProductsSearch(products){
    let search = $("#search-products").val().toLowerCase().trim();
    if(search == ""){
        return products;
    }
    data.isFiltered = true;
    return products.filter(el=>{
        if(el.title.toLowerCase().includes(search)){
            return true;
        }
        return false;
    });
}
function filterProducts(filterID, propertyName, products){
    let checkedItems = [];
    $(`#${filterID} input:checked`).each(function(){
        checkedItems.push($(this).val());
    });
    if(checkedItems.length == 0){
        return products;
    }
    data.isFiltered = true;
    return products.filter(el => {
        if(Array.isArray(el[propertyName])){
            for(item of el[propertyName]){
                if(checkedItems.includes(String(item))){
                    return true;
                }
            }
        }
        else if(checkedItems.includes(String(el[propertyName]))){
                return true;
        }
        return false;
    });
}

//USMERAVANJE U SKLADU SA TRENUTNOM STRANICOM
function pageRelatedFeatures(){
    switch(data.page){
        case "Home": loadHomePage(); break;
        case "Shop": loadShopPage(); break;
        case "Contact": loadContactPage(); break;
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
        $("#hero").append(`<p class="mt-2">Error loading home page sliders. Try again later.</p>`);
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
    showProducts("discounted", getDiscountedProducts(sortProductsByDiscount(data.products)), false);
    $("#discounted").slick(data.slickSettings.productsSlider);
}

//SHOP STRANICA
function loadShopPage(){
    showFilters("filter-categories", data.categories);
    showFilters("filter-brands", data.brands);
    showFilters("filter-tasting", data.tasting);
    $("#max-price").on("input", refreshMaxPriceLabel);
    $("#clear-max-price").click(clearMaxPrice);
    $("#shop-products input, #sort-products, #paginate-products").change(showProductsGrid);
    $("#search-products").keyup(showProductsGrid);
    $("#clear-filters").hide().click(clearAllFilters);
    data.firstTimeLoad = true;
    showProductsGrid();
}
function showFilters(containerID, array){
    let html = "";
    for(item of array){
        html += `<li class="form-check">
        <input class="form-check-input" type="checkbox" id="${containerID}-${item.name}" value="${item.id}"/>
        <label class="form-check-label" for="${containerID}-${item.name}">
          ${item.name}
        </label>
     </li>`;
    }
    $(`#${containerID}`).html(html);
}
function setMaxPriceValue(products){
    if(products.length){
        let maxPrice = String(Math.ceil(getMaxPrice(products)));
        let maxSelected = $("#max-price").val() == $("#max-price").attr("max");
        $("#max-price").attr("max", maxPrice);
        if(maxSelected){
            $("#max-price").val(maxPrice);
        }
        else if(!data.firstTimeLoad) {
            data.isFiltered = true;
        }
        refreshMaxPriceLabel();
        data.firstTimeLoad = false;
    }
}
function refreshMaxPriceLabel(){
    $("label[for=max-price]").text("$" + $("#max-price").val());
    if($("#max-price").val() == $("#max-price").attr("max")){
        $("#clear-max-price").hide();
    }
    else {
        $("#clear-max-price").show();
    }
}
function clearMaxPrice(){
    $("#max-price").val($("#max-price").attr("max"));
    refreshMaxPriceLabel();
    showProductsGrid();
}
function showProductsGrid(){
    clearPages();
    data.isFiltered = false;
    let filteredProducts = getFilteredProducts();
    let pagination = Number($("#paginate-products").val());
    if(filteredProducts.length){
        if(pagination){
            showProducts("shop-products-grid", filteredProducts.slice(0, pagination));
            paginateProductsGrid(filteredProducts, pagination);
        }
        else {
            showProducts("shop-products-grid", filteredProducts);
        }
    }
    else {
        $("#shop-products-grid").html(`<p class="m-5 h5">There are no products with selected criteria.</p>`);
    }

    if(data.isFiltered){
        $("#clear-filters").show();
    }
    else {
        $("#clear-filters").hide();
    }
}
function getFilteredProducts(){
    let filteredProducts = data.products;
    filteredProducts = filterProductsDiscounted(filteredProducts);
    filteredProducts = filterProducts("filter-caffeine", "decaf", filteredProducts);
    filteredProducts = filterProducts("filter-categories", "category", filteredProducts);
    filteredProducts = filterProducts("filter-brands", "brand", filteredProducts);
    filteredProducts = filterProducts("filter-tasting", "tasting", filteredProducts);
    filteredProducts = filterProductsSearch(filteredProducts);
    filteredProducts = filterProductsMaxPrice(filteredProducts);
    return sortProducts(filteredProducts, $("#sort-products").val());
}
function paginateProductsGrid(products, maxOnPage){
    let productCount = products.length;
    let pageCount = 0;
    while(productCount > 0){
        let productsOnPage = productCount > maxOnPage ? maxOnPage : productCount;
        createPage(products.slice(pageCount * maxOnPage, pageCount * maxOnPage + productsOnPage), pageCount + 1);
        pageCount++;
        productCount-=productsOnPage;
    }
}
function clearPages(){
    $("#pagination").html("");
}
function createPage(productsPacket, pageNumber){
    $("#pagination").append(`<a href="#!" class="pagination-link p-2 border${pageNumber == 1 ? " active" : ""}">${pageNumber}</a>`);

    $(".pagination-link:last").click(function(){
        $(".pagination-link").removeClass("active");
        $(this).addClass("active");
        showProducts("shop-products-grid", productsPacket);
        $("html").scrollTop($("#shop-products-grid").offset().top - 200);
    });
}
function clearAllFilters(){
    $("#shop-products input").prop("checked", false);
    $("#search-products").val("");
    clearMaxPrice();
}

//KONTAKT STRANICA
async function loadContactPage(){
    try {
        data.contactInfo = await fetchData("contact.json");
        showContactInfo();
    }
    catch(c){
        console.log("Error loading contact info. Status: " + c);
        $("#contact-info").append(`<li>Error loading contact info. Try again later.</p>`);
    }
    $("#contact-form").submit(validateContactForm);
}
function showContactInfo(){
    for(info of data.contactInfo){
        let html = `<li class="my-4 d-flex align-items-center"><span class="${info.icon} mr-3"></span>`;
        if(info.link){
            html += `<a href="${info.link}">${info.text}</a></li>`;
        }
        else {
            html += `${info.text}</li>`;
        }
        $("#contact-info").append(html);
    }
}
function validateContactForm(event){
    event.preventDefault();
    resetFormMessages();
    data.forms.error = false;

    let name = $("#contact-name");
    let email = $("#contact-email");
    let subject = $("#contact-subject");
    let message = $("#contact-message");

    validateElement(name, data.forms.name)
    validateElement(email, data.forms.email);
    validateElement(subject, data.forms.subject);
    validateElement(message, data.forms.message);

    if(!data.forms.error){
        this.reset();
        $(this).append(`<span class="fas fa-check form-success"></span><p class="form-success mt-2">You have successfully sent your message.<br/>We'll contact you soon.`);
    }
}