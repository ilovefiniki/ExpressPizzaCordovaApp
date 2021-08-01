
// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    StatusBar.overlaysWebView(false);
    StatusBar.backgroundColorByHexString('#ed462f');
    StatusBar.show();
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');
    iOSStatusBar();
}

function iOSStatusBar() {
    if(device.platform === 'iOS') {
        if(device.version >= 11) {
            document.getElementById('app').classList.add('header-no-img');
        }
    }
}

new Vue({
    el: '#app',
    vuetify: new Vuetify(),
    data: () => ({
        init: false,
        loader: true,
        loaderText: "Загрузка меню...",
        sender: false,
        drawer: false,
        group: null,
        tovars: null,
        groups: null,
        slides: null,
        termCode: null,
        page: 'front',
        title: null,
        cart: {},
        total: 0,
        totalDiscount: 0,
        discount: 0,
        qty: 0,
        form: {},
        msg: null,
        body: null,
        popupImgUrl: null,
        popup: false,
        rules: {
            required: value => !!value || 'Заполните поле',
            counter: value => value.length <= 20 || 'Максимум 20 символов',
            phone: value => value.length == 17 || 'Заполните телефон',
            email: value => {
                const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                return pattern.test(value) || 'Invalid e-mail.'
            },
        },
    }),
    mounted() {
        this.init = true;
        this.updateTovars();
        this.updateGroups();
        this.updateSlides();
        this.updateDiscount();
    },
    filters: {
        currency (value) {
            return value.toFixed(2)
        }
    },
    methods: {
        moneyFormat (value) {
            return parseFloat(value).toFixed(2)
        },
        updateTovars: function () {
            var obj = this;
            this.loader = true;
            this.loaderText="Загрузка меню...";
            axios
                .get('https://express-pizza.by/tovarjson')
                .then(response => {
                    console.log('Tovars updated');
                    this.tovars = response.data.Items;
                    this.loader = false;
                    setTimeout(obj.updateTovars, 1800000);
                });
        },
        updateGroups: function () {
            var obj = this;
            this.loader = true;
            this.loaderText="Загрузка меню...";
            axios
                .get('https://express-pizza.by/groupjson')
                .then(response => {
                    console.log('Groups updated');
                    this.groups = response.data.Items;
                    this.loader = false;
                    setTimeout(obj.updateGroups, 1800000);
                });
        },
        updateSlides: function () {
            var obj = this;
            this.loader = true;
            this.loaderText="Загрузка слайдов...";
            axios
                .get('https://express-pizza.by/slidesjson')
                .then((response) => {
                    console.log('Slides updated');
                    this.slides = response.data.Items;
                    this.loader = false;
                    setTimeout(obj.updateSlides, 1800000);
                });
        },
        updateDiscount: function () {
            var obj = this;
            axios
                .get('https://express-pizza.by/discountjson')
                .then((response) => {
                    console.log('Discount updated');
                    this.discount = response.data.Items[0].node.discount;
                    setTimeout(obj.updateDiscount, 1800000);
                });
        },
        popupImg: function(img) {
            this.popupImgUrl = img;
            this.popup = true;
        },
        groupCode: function (term) {
            this.termCode = term.code;
            this.page = 'tovars';
            this.title = term.name;
        },
        next: function () {
            if(this.page == 'cart') {
                this.page = 'checkout';
                this.title = 'Оформление заказа';
            } else if(this.page == 'tovars' || this.page == 'front') {
                this.page = 'cart';
                this.title = 'Корзина';
            }
        },
        previous: function () {
            if(this.page == 'checkout') {
                this.page = 'cart';
                this.title = 'Корзина';
            } else {
                this.page = 'front';
            }
        },
        addTovar: function (node) {
            if(this.cart[node.nid]){
                this.cart[node.nid].qty += 1;
            } else {
                this.cart[node.nid] = {};
                this.cart[node.nid] = node;
                this.cart[node.nid].qty = 1;
            }
            this.cartSum();
        },
        removeTovar: function (node) {
            if(this.cart[node.nid]) {
                if(this.cart[node.nid].qty>1){
                    this.cart[node.nid].qty -= 1;
                } else {
                    delete this.cart[node.nid];
                }
                this.cartSum();
            }
        },
        cartSum: function () {
            this.total = 0;
            this.qty = 0;
            for (var nid in this.cart) {
                if ( this.cart.hasOwnProperty(nid) ) {
                    this.total += this.cart[nid].price*this.cart[nid].qty;
                    this.qty += this.cart[nid].qty;
                }
                if(this.discount) {
                    this.totalDiscount = this.total - (this.total*this.discount/100);
                }
            }
        },
        sendOrder: function () {
            if(this.$refs.form.validate()){
                var obj = this;
                this.loader = true;
                this.loaderText="Отправка заказа...";
                this.form.hour = 0;
                this.form.minute = 0;
                this.form.dostavka = 1;
                const data = {};
                data.action = 1;
                data.form = this.form;
                data.cart = this.cart;
                axios.post('https://express-pizza.by/checkout2.php', data )
                    .then((response) => {
                        console.log(response);
                        this.loader = false;
                        if(response.data.status){
                            this.page = 'complete';
                            this.title = 'Заказ отправлен';
                            this.msg = response.data.msg;
                            this.cart = {};
                            this.total = 0;
                            this.qty = 0;
                            window.localStorage.setItem('lastOrderId', response.data.order_id);
                            this.loader = true;
                            this.loaderText="Статус заказа...";
                            setTimeout(obj.loadStatusPage, 3000);
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        this.loader = false;
                    });
            }
        },
        loadExternalPage: function(nid) {
            this.loader = true;
            this.loaderText="Загрузка...";
            axios
                .get('https://express-pizza.by/pages.php',  {
                    params: {
                        page: true,
                        nid: nid,
                    }
                })
                .then((response) => {
                    this.loader = false;
                    console.log(response);
                    if(response.data.status){
                        this.page = 'externalpage';
                        this.title = response.data.title;
                        this.body = response.data.body;
                        this.drawer = false;
                    }
                })
                .catch((error) => {
                    this.loader = false;
                    console.log(error);
                });
        },
        loadStatusPage: function() {
            var obj = this;
            var order_id = window.localStorage.getItem('lastOrderId');
            axios
                .get('https://express-pizza.by/pages.php',  {
                    params: {
                        page: true,
                        nid: 66512,
                        last_order_id: order_id
                    }
                })
                .then((response) => {
                    this.loader = false;
                    console.log(response);
                    if(response.data.status){
                        // только если страница complete или страницы статуса заказа
                        if(this.page == 'complete' || this.title == response.data.title) {
                            this.page = 'externalpage';
                            this.title = response.data.title;
                            this.body = response.data.body;
                            this.drawer = false;
                            setTimeout(obj.loadStatusPage, 30000);
                        }
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        },
    }
});
Vue.directive('mask', VueMask.VueMaskDirective);