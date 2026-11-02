Campuszaapp.controller(
    "UserCartController",
    function UserCartController($scope, $http, $window) {

        $scope.skuidtemp = 0
        $scope.itemlist = internal_usercartitemlist;
        $scope.address = internal_usercartaddress;
        $scope.addresslist = internal_useraddresseslist;
        $scope.addressneedsupdate = internal_usercartaddressneedsupdate;
        $scope.profileneedsupdate = internal_usercartprofileneedsupdate;
        $scope.totalmrp = 0;
        $scope.totaldiscount = 0;
        $scope.totalamount = 0;
        $scope.paymentmode = "1"
        $scope.sizelist = []
        $scope.previoussizeid = 0
        $scope.sizequantity = 0
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
        $scope.qtyeditable = false;
        $scope.disable = false;
        $scope.enablecheckout = false;
        $scope.editorder = false;
        $scope.value = internal_useraddresseslist;



        //$scope.getSkuWithId = async () => {
        //    try {
        //        for (const v of $scope.itemlist) {
        //            const resp = await $http({
        //                method: 'POST',
        //                url: `/api/sku/GetSkuwithId/${v.id}`
        //            });

        //            const sku = resp.data.item[0];

        //            if (v.quantity > (sku.quantity - sku.pendingquantity)) {
        //                v.quantity = sku.quantity - sku.pendingquantity;
        //                if (v.quantity === 0) {
        //                    v.outofstock = true;
        //                }
        //            }
        //        }
        //    } catch (error) {
        //        console.error(error);
        //    }
        //};
        //$scope.getSkuWithId();



        $scope.removeItemFromCart = async (id) => {
            let resp = await $http({
                method: "GET",
                url: `/api/users/removeSkufromcart/${id}`,
            });
            $scope.$applyAsync();
            let index = $scope.itemlist.findIndex((e) => {
                return e.id == id;
            });
            $scope.itemlist.splice(index, 1);
            //$scope.calculateTotal();
            $window.location.reload();

        };



        $scope.checkout = () => {
            console.log("getting");
            if (!$scope.disable && !$scope.editorder) {
                window.location.assign('/user/checkout');
            } else {
                $scope.enablecheckout = true;
            }
        };

        $scope.updateQuantity = async (id, mquantity) => {
            try {
                let index = $scope.itemlist.findIndex(v => {
                    return v.id == id
                })
                let item = $scope.itemlist[index]
                let skuid = item.id;
                let quantity = item.quantity + mquantity;
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


        $scope.alertCartBulk = (id) => {

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
        }





        $scope.getSize = async (designid, id, quantity) => {
            if (designid == 0) {
                return
            }
            $scope.selectedskuid = id

            $scope.previoussizeid = id
            $scope.sizequantity = quantity
            let resp = await $http({
                method: 'POST',
                url: `/api/sku/GetSku/${designid}`
            });

            $scope.sizelist = resp.data.item
            $scope.$applyAsync()

            $scope.alertCart(designid)




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


                  


                    $scope.itemlist[index].sizekey = $scope.sizekey
                    $scope.itemlist[index].quantity = 1
                    $scope.itemlist[index].sizename = $scope.sizekey
                    $scope.itemlist[index].id = $scope.skuid
                    $scope.itemlist[index].salesprice = data[0].salesprice
                    $scope.itemlist[index].discount = data[0].discount
                    $scope.itemlist[index].netprice = data[0].netprice
                    $scope.skuid = 0
                    $scope.skuid = 0






                }

                console.log("itemlist", $scope.itemlist)
                $scope.createSkuGroup();

                $scope.calculateTotal();

                $scope.$applyAsync();
            }


        }


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

            $scope.skugrouplist.forEach(v => {
                v.items.forEach(v1 => {

                    v1.netprice = v1.netprice * v1.quantity
                })
            })
        };

        $scope.createSkuGroup();


        console.log("$scope.copieditemlist", $scope.copieditemlist)
        console.log("skugrouplist", $scope.skugrouplist);
        //////////////////////


        $scope.skuquantitylist = [];
        $scope.updateQuantityForBulk = async (designid, quantity, skuid) => {
            $scope.editorder = true;
            console.log(skuid, quantity);

            const existingIndex = $scope.skuquantitylist.findIndex(item => item.skuid === skuid);

            if (existingIndex !== -1) {
                $scope.skuquantitylist[existingIndex].quantity = quantity;
            } else {
                $scope.skuquantitylist.push({ skuid: skuid, quantity: quantity });
            }



            const designGroup = $scope.skugrouplist.find(group => group.designid === designid);

            if (designGroup) {
                const item = designGroup.items.find(item => item.id === skuid);

                if (item) {
                    item.quantity = quantity;

                    item.netprice = item.salesprice * quantity; 
                }
            }

            console.log($scope.skuquantitylist, " $scope.skuquantitylist")
        }


        $scope.bulkUpdateQty = async () => {
             
            if ($scope.skuquantitylist.length > 0) {
                try {
                    for (const v of $scope.skuquantitylist) {
                        const resp = await $http({
                            method: 'GET',
                            url: `/api/users/UpdateUserCartItem/${v.skuid}/${v.quantity}`,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                    }      
                    $scope.disable = true;
                    toastr.success('Quantity Updated');
                    $scope.qtyeditable = false;
                    $scope.designqtyupdate = 0;
                    $scope.skuquantitylist = [];
                    $scope.$applyAsync();
                    $window.location.reload();
                } catch (e) {
                    if (e.data.key == 'SkuQuantityExceedsAvailable') {
                        toastr.error('Entered quantity exceeds the available quantity.');
                    }
                }
            }
        };




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
            console.log(designid);
            var index = $scope.skugrouplist.findIndex(v => {
                return v.designid == designid;
            });

            if (index > -1) {
                const items = $scope.skugrouplist[index].items;

                for (let i = 0; i < items.length; i++) {
                    let resp = await $http({
                        method: "GET",
                        url: `/api/users/removeSkufromcart/${items[i].id}`,
                    });
                }

                $scope.$applyAsync();
            }

            $window.location.reload();
        };

        $scope.editQuantity = (designid) => {
            if ($scope.designqtyupdate > 0 && $scope.skuquantitylist.length > 0) {
                if ($scope.designqtyupdate != designid) {
                    toastr.error('Save changes first');
                }

            } else {
                $scope.qtyeditable = true
                $scope.designqtyupdate = designid
            }
        }



        //$scope.getSize = async (designid, id, quantity) => {
        //    if (designid == 0) {
        //        return
        //    }
        //    $scope.selectedskuid = id

        //    $scope.previoussizeid = id
        //    $scope.sizequantity = quantity
        //    let resp = await $http({
        //        method: 'POST',
        //        url: `/api/sku/GetSku/${designid}`
        //    });

        //    $scope.sizelist = resp.data.item
        //    $scope.$applyAsync()

        //    $scope.alertCart(designid)




        //}




        $scope.getFileIndex = function (item) {
            return item.filelist.findIndex(v => v.filetype.toLowerCase().startsWith("image/"));
        };

        



    });
