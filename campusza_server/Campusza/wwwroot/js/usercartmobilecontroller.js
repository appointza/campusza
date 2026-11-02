Campuszaapp.controller(
    "UserCartMobileController",
    function UserCartMobileController($scope, $http, $window) {



        $scope.itemlist = internal_usercartitemlist;
        $scope.address = internal_usercartaddress;
        $scope.addresslist = internal_useraddresseslist;
        $scope.selecteddesign = {}

        $scope.addressneedsupdate = internal_usercartaddressneedsupdate;
        $scope.profileneedsupdate = internal_usercartprofileneedsupdate;
        $scope.totalmrp = 0;
        $scope.totaldiscount = 0;
        $scope.totalamount = 0;
        $scope.paymentmode = "1"
        $scope.wishlistcount = 0;
        $scope.sizelist = [];
        $scope.previoussizeid = 0;
        $scope.quantity = 0;
        $scope.sizequantity = 0;
        $scope.skuid = 0;
        $scope.sizekey = "";
        $scope.calculateTotal = () => {
            $scope.totalmrp = 0;
            $scope.totaldiscount = 0;
            $scope.itemlist.forEach((e) => {
                $scope.totalmrp += e.salesprice * e.quantity;

                $scope.totaldiscount += e.discount * e.quantity;
            });
            $scope.totalamount = $scope.totalmrp - $scope.totaldiscount;
        };
        $scope.calculateTotal();
        $scope.design = internal_design;
        $scope.profilelist = internal_profilelist;


        $scope.value = internal_useraddresseslist;
        $scope.removeItemFromCart = async (id) => {
            let resp = await $http({
                method: "GET",
                url: `/api/users/removeSkufromcart/${id}`,
            });
            $scope.$applyAsync();
            let index = $scope.itemlist.findIndex((e) => {
                return e.id == id;
            });
            $window.location.reload();
            //$scope.calculateTotal();
        };




        $scope.sendAddress = async (index) => {

            let updateaddress = $scope.addresslist.slice(0)[index]


            let postdata = {
                item: updateaddress
            }
            let resp = await $http({
                method: 'POST',
                url: `/api/users/UpdateUserCartAddress`,
                headers: {
                    'Content-Type': "application/json"
                },
                data: JSON.stringify(postdata)

            });
            $scope.address = updateaddress
            $scope.$applyAsync()
        }

        $scope.toggleUpdateProfileAndAddressAlert = (show) => {
            let element = document.getElementById("updateProfileAndAddressAlert");
            let updateProfileAndAddressAlert = bootstrap.Modal.getInstance(element);
            if (updateProfileAndAddressAlert == null) {
                updateProfileAndAddressAlert = new bootstrap.Modal(
                    document.getElementById("updateProfileAndAddressAlert"),
                    {}
                );
            }
            if (show) {
                updateProfileAndAddressAlert.show();
            } else {
                updateProfileAndAddressAlert.hide();
            }
        };


        $scope.toggleSelectAddressModal = (show) => {
            let element = document.getElementById("selectAddressModal");
            let selectAddressModal = bootstrap.Modal.getInstance(element);
            if (selectAddressModal == null) {
                selectAddressModal = new bootstrap.Modal(
                    document.getElementById("selectAddressModal"),
                    {}
                );
            }
            if (show) {
                selectAddressModal.show();
            } else {
                selectAddressModal.hide();
            }
        };
        $scope.proceedToPayment = (form) => {
            $scope.paymentmode = form.$$controls[0].$modelValue;
            if ($scope.profileneedsupdate || $scope.addressneedsupdate) {
                $scope.toggleUpdateProfileAndAddressAlert(true);
                return;
            }
            let address = $scope.address;
            if (!(address != null && address.id > 0)) {
                $scope.toggleSelectAddressModal(true);
                return;
            }
            window.location.assign(`/user/ProceedToPayment/${$scope.paymentmode}`)
        }

        $scope.alertCart = (id) => {

            console.log("$.scope.itemlist", $scope.design)
            $scope.design = $scope.itemlist.find(v => {
                return v.designid == id
            })
            console.log("$.scope.itemlist", $scope.design)
            $scope.$applyAsync();

        }

        $scope.addToWishList = async (designid, id) => {
            console.log("designid", designid)
            let resp = await $http({
                method: 'GET',
                url: `/api/users/AddDesignToWishlist/${designid}`

            });
            $scope.$applyAsync()
            $scope.removeItemFromCart(id)

            console.log(resp, $scope.isaddedtowishlist);
            $scope.getUser();
        }




        $scope.getSize = async (design) => {
            if (design.id == 0) {
                return
            }
            $scope.selecteddesign = design
            $scope.selectedskuid = design.id

            $scope.previoussizeid = design.id
            $scope.sizequantity = design.quantity
            let resp = await $http({
                method: 'POST',
                url: `/api/sku/GetSku/${design.designid}`
            });

            $scope.sizelist = resp.data.item
            $scope.$applyAsync()

            $scope.alertCart(design.designid)


        }

        $scope.changedSize = async (skuid, sizekey) => {
            if (skuid == 0) {
                return
            }
            $scope.skuid = skuid
            $scope.sizekey = sizekey
            $scope.$applyAsync();
            $scope.selectedskuid = skuid
        }



        $scope.getQuantity = async (designid, id, quantity) => {
            $scope.quantity = quantity
            $scope.quantityfordesignid = id
            $scope.$applyAsync()


        }


        $scope.decreaseQuantity = () => {
            if ($scope.quantity > 1) {
                $scope.quantity = $scope.quantity - 1
            }

        }

        $scope.increaseQuantity = () => {
            $scope.quantity = $scope.quantity + 1
        }




        $scope.updateQuantity = async () => {
            try {

                console.log($scope.quantityfordesignid)

                let index = $scope.itemlist.findIndex(v => {
                    return v.id == $scope.quantityfordesignid;
                })

                let item = $scope.itemlist[index]
                let skuid = item.id;
                let quantity = $scope.quantity;
                let resp = await $http({
                    method: 'GET',
                    url: `/api/users/UpdateUserCartItem/${skuid}/${quantity}`,
                    headers: {
                        'Content-Type': "application/json"
                    },

                });
                if (quantity == 0) {
                    $scope.itemlist.splice(index, 1);
                } else {
                    $scope.itemlist[index].quantity = quantity;
                }
                $scope.calculateTotal()
                $scope.$applyAsync()
            } catch (e) {
                if (e.data.key == "SkuQuantityExceedsAvailable") {
                    toastr.error('Entered quantity exceeds the available quantity.');
                }
            }

        }

        $scope.changedSize = async (skuid, sizekey) => {
            if (skuid == 0) {
                return
            }
            $scope.skuid = skuid
            $scope.sizekey = sizekey
            $scope.$applyAsync();
            $scope.selectedskuid = skuid
        }


        $scope.saveSize = async () => {
            if ($scope.skuid > 0 && $scope.skuid != $scope.previoussizeid) {
                let resp = await $http({
                    method: 'POST',
                    url: `/api/users/UpdateUserCartItemSize/${$scope.skuid}/${$scope.previoussizeid}/${$scope.sizequantity}`,
                    headers: {
                        'Content-Type': "application/json"
                    },

                });
                $scope.$applyAsync();

                if (resp.data.item) {

                    if ($scope.itemlist.some(v => {
                        return v.id == $scope.skuid
                    })) {
                        let index1 = $scope.itemlist.findIndex((e) => {
                            return e.id == $scope.skuid;
                        })
                        $scope.itemlist.splice(index1, 1);
                    }

                    var index = $scope.itemlist.findIndex((v) => {
                        return v.id == $scope.previoussizeid
                    })

                    let data = await $scope.selectSku($scope.skuid)

                    //var index1 = resp.data.item.cart.itemlist.findIndex((v) => {
                    //    return v.skuid == $scope.skuid
                    //})
                    $scope.itemlist[index].sizekey = $scope.sizekey
                    $scope.itemlist[index].quantity = 1
                    $scope.itemlist[index].sizename = $scope.sizekey
                    $scope.itemlist[index].id = $scope.skuid
                    $scope.itemlist[index].salesprice = data[0].salesprice
                    $scope.itemlist[index].discount = data[0].discount
                    $scope.itemlist[index].netprice = data[0].netprice
                    //$scope.itemlist[index].quantity = resp.data.item.cart.itemlist[index1].quantity
                    $scope.skuid = 0


                }

                console.log("itemlist", $scope.itemlist)
                $scope.createSkuGroup();

                $scope.calculateTotal();

                $scope.$applyAsync();
            }


        }

        $scope.getUser = async () => {
            let resp = await $http({
                method: 'GET',
                url: `/api/users/GetUserWishlistandCartCount`

            });
            let user = resp.data.item

            if (user && user.length > 0) {

                $scope.user = user[0]
                $scope.wishlistcount = $scope.user.wishlist.itemlist.length;
            }


            $scope.$applyAsync()
        }

        $scope.getUser();



        $scope.selectSku = async (skuid) => {

            let resp = await $http({
                method: 'POST',
                url: `/api/sku/GetSkuwithId/${skuid}`
            });
            return resp.data.item;
            $scope.$applyAsync()


        }






        $scope.createSkuGroup = () => {

            $scope.copieditemlist = [...$scope.itemlist]
            console.log($scope.itemlist, "$scope.itemlist")


            $scope.skugroup = {};
            $scope.skugrouplist = [];
            $scope.designqtyupdate = 0;
            $scope.copieditemlist.forEach(item => {
                const designid = item.designid;

                if (!$scope.skugroup[designid]) {
                    $scope.skugroup[designid] = [];
                }

                $scope.skugroup[designid].push(item);
            });

            $scope.skugrouplist = [];

            for (const designid in $scope.skugroup) {
                if ($scope.skugroup.hasOwnProperty(designid)) {
                    const hasCanAddBulk = $scope.skugroup[designid].some(item => item.canorderinbulk === true);

                    if (hasCanAddBulk) {
                        $scope.skugrouplist.push({
                            designid: parseInt(designid),
                            items: $scope.skugroup[designid]
                        });
                    }
                }
            }

            $scope.copieditemlist = $scope.copieditemlist.filter(item => item.canorderinbulk !== true);


            console.log("skugrouplist", $scope.skugrouplist);

        };

        $scope.createSkuGroup();


        console.log("$scope.copieditemlist", $scope.copieditemlist)
        console.log("skugrouplist", $scope.skugrouplist);






        $scope.addToWishListBulk = async (designid) => {
            console.log("designid", designid)
            let resp = await $http({
                method: 'GET',
                url: `/api/users/AddDesignToWishlist/${designid}`

            });
            $scope.$applyAsync()
            $scope.removeItemFromCartBulk(designid)
            console.log(resp, $scope.isaddedtowishlist);
        }




        $scope.removeItemFromCartBulk = async (designid) => {

            var index = $scope.skugrouplist.findIndex(v => {
                return v.designid == designid;
            });

            if (index > -1) {

                const items = $scope.skugrouplist[index].items;
                let skuidlist = []
                items.forEach(v => {
                    skuidlist.push(v.id)
                })
                let postdata = {
                    item: skuidlist
                }
                let resp = await $http({
                    method: 'POST',
                    url: `/api/users/RemoveSkuFromCartInBulk`,
                    headers: {
                        'Content-Type': "application/json"
                    },
                    data: JSON.stringify(postdata)

                });
                $scope.$applyAsync();
            }

            $window.location.reload();
        };


        $scope.getSkuToUpdateQuantityForBulk = (designid) => {
            const temparray = $scope.itemlist.filter((v) => v.designid === designid);
            $scope.tempskulist = JSON.parse(JSON.stringify(temparray));
            console.log($scope.tempskulist, "values");
            const maxLength = $scope.tempskulist.reduce((max, item) => {
                const textLength = item.sizename.length;
                return textLength > max ? textLength : max;
            }, 0);

            $scope.minwidth = 80;
            $scope.dynamicwidth = maxLength * 15;

            if ($scope.dynamicwidth < 80) {
                $scope.dynamicwidth = 80;
            }
        }


        $scope.bulkUpdateQty = async (form) => {


            if (form.$invalid) {
                form.$$controls.forEach((e) => {
                    e.$touched = true;
                });
                return;
            }
            try {
                for (const v of $scope.tempskulist) {
                    const resp = await $http({
                        method: 'GET',
                        url: `/api/users/UpdateUserCartItem/${v.id}/${v.quantity}`,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                }
                toastr.success('Quantity Updated');
                $scope.tempskulist = []
                $scope.$applyAsync();
                $window.location.reload();
            } catch (e) {
                if (e.data.key == 'SkuQuantityExceedsAvailable') {
                    toastr.error('Entered quantity exceeds the available quantity.');
                }
            }

        };



        $scope.getFileIndex = function (item) {
            console.log
            return item.filelist.findIndex(v => v.filetype.toLowerCase().startsWith("image/"));

        };




    });
