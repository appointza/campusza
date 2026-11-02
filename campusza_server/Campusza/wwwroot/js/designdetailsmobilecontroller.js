////Campuszaapp.controller('DesignsDetailMobileController', function DesignsDetailMobileController($scope, $http, $window) {
////    $scope.quantity = 1;
////    $scope.currentusercustomerreview = internal_designdetails_currentusercustomerreview;
////    $scope.attributelist = internal_attribuelist;
////    $scope.skulist = internal_designdetails_skulist;
////    $scope.selectedsku = null;
////    $scope.cartcount = 0;
////    $scope.wishlistcount = 0;
////    $scope.design = internal_design;
////    $scope.filelist = internal_filelist;
////    $scope.reviewaverageandcount = internal_reviewaverageandcount;
////    $scope.customerreviewlist = internal_customerreviewlist;
////    $scope.customerreview = internal_customerreview;
////    $scope.isloggedin = internal_isloggedin;
////    $scope.group = internal_group;


////    $scope.isaddedtobag = false;
////    $scope.isaddedtowishlist = false;

////    $scope.selectSkuV2 = (sku) => {
////        $scope.selectedsku = sku;
////        $scope.isaddedtobag = false;
////        //$scope.isaddedtowishlist = false;
////    }
////    $scope.addToBagV2 = async () => {
////        if ($scope.selectedsku == null)
////            return;
////        try {
////            let resp = await $http({
////                method: 'GET',
////                url: `/api/users/AddSkuToCart/${$scope.selectedsku.id}/${$scope.quantity}`
////            });
////            $scope.$applyAsync()
////            $scope.isaddedtobag = true;
////            $scope.quantity = 1
////            $scope.updateCartAndWishlistCount()
////            $scope.updateCartCount()
////        } catch (e) {
////            if (e.data.key == "SkuQuantityExceedsAvailable") {
////                toastr.error('Entered quantity exceeds the available quantity.');
////            }
////        }








////    }

////    $scope.buyNowV2 = async () => {

////        if ($scope.selectedsku == null)
////            return;
////        try {
////            let resp = await $http({
////                method: 'GET',
////                url: `/api/users/AddSkuToCart/${$scope.selectedsku.id}/${$scope.quantity}`
////            });
////            $scope.$applyAsync()
////            window.location.assign(`/user/cart`)
////        } catch (e) {
////            if (e.data.key == "SkuQuantityExceedsAvailable") {
////                toastr.error('Entered quantity exceeds the available quantity.');
////            }
////        }

////    }


////    $scope.addQuantity = (value) => {
////        if (($scope.selectedsku.quantity - $scope.selectedsku.pendingquantity) == $scope.quantity) {
////            toastr.info('Entered quantity exceeds the available quantity.');
////            return;
////        }
////        let updatedquantity = $scope.quantity + value
////        if (updatedquantity > 0) {
////            $scope.quantity = updatedquantity;
////        }
////    }
////    $scope.addToWishList = async (designid) => {
////        let resp = await $http({
////            method: 'GET',
////            url: `/api/users/AddDesignToWishlist/${designid}`

////        });
////        $scope.updateCartAndWishlistCount();

////        $scope.$applyAsync()

////        $scope.isaddedtowishlist = true;

////    }
////    $scope.updateCustomerReview = async () => {
////        let postdata = {
////            item: $scope.currentusercustomerreview
////        };
////        let resp = await $http({
////            method: 'POST',
////            url: `/api/customerreview/update`,
////            headers: {
////                "Content-Type": "application/json",
////            },
////            data: JSON.stringify(postdata),
////        });
////        $scope.currentusercustomerreview = resp.data.item;
////        $scope.$applyAsync()
////        $window.location.reload();
////    }


////    $scope.updateCartAndWishlistCount = async () => {
////        let resp = await $http({
////            method: 'GET',
////            url: `/api/users/GetUserWishlistandCartCount`

////        });
////        let user = resp.data.item
////        //$scope.cartcount = user[0].cart.itemlist.length;
////        $scope.wishlistcount = user[0].wishlist.itemlist.length;

////        user[0].wishlist.itemlist.forEach(v => {
////            console.log("Checking item with product ID: " + v);

////            if (v == $scope.design.id) {
////                $scope.isaddedtowishlist = true
////            }
////        })
////        //$scope.wishlist = resp.user
////        $scope.$applyAsync()
////    }
////    $scope.updateCartAndWishlistCount();

////    $scope.updateCartCount = async () => {
////        let resp = await $http({
////            method: 'GET',
////            url: `/api/UserCartItem/getCartCount`

////        });
////        let cartitem = resp.data.item
////        $scope.cartcount = cartitem.length;


////        $scope.$applyAsync()
////    }
////    $scope.updateCartCount()



////    ///////////////////////////////

////    $scope.cannotaddall = true;
////    $scope.selectedsku = null;
////    $scope.selectedskuList = []
////    $scope.skulisttemp = []
////    $scope.commonqyt = 0
////    $scope.tempqtypre = 0



////    $scope.skulist.forEach(v => {
////        $scope.skulisttemp.push({ id: v.id, sizekey: v.sizekey, tempquantity: 0, quantity: v.quantity, pendingquantity: v.pendingquantity, isadded: false, netprice: v.netprice, salesprice: v.salesprice, discountname: v.discountname, discountpercent: v.discountpercent })
////    })

////    const maxLength = $scope.skulist.reduce((max, item) => {
////        const textLength = item.sizekey.length;
////        return textLength > max ? textLength : max;
////    }, 0);

////    $scope.minwidth = 80
////    $scope.dynamicwidth = maxLength * 15;

////    if ($scope.dynamicwidth < 80) {
////        $scope.dynamicwidth = 80
////    }



////    $scope.actdeactAll = () => {
////        $scope.skulisttemp.forEach(v => {
////            return v.tempquantity = 0, v.isadded = false
////        })
////        $scope.selectedskuList = []


////        $scope.commonqyt = 0

////        $scope.cannotaddall = !$scope.cannotaddall
////        //if ($scope.cannotaddall == true) {
////        //    $scope.selectedskuList = []
////        //} else {
////        $scope.skulisttemp.forEach(v => {
////            $scope.selectedskuList.push({ id: v.id, quantity: v.tempquantity, availablequantity: v.quantity, pendingquantity: v.pendingquantity, outofstock: false });
////        })
////        //}
////    }





////    $scope.addQuantityAll = (qty) => {

////        console.log($scope.commonqyt, qty, "commonqyt")

////        $scope.skulisttemp.forEach(v => {
////            if ((v.quantity - v.pendingquantity) > $scope.commonqyt) {

////                return v.tempquantity = $scope.commonqyt
////            } else {
////                return v.tempquantity = v.quantity - v.pendingquantity
////            }
////        })

////        $scope.selectedskuList.forEach(v => {
////            if ((v.availablequantity - v.pendingquantity) > $scope.commonqyt) {
////                return v.quantity = $scope.commonqyt
////            } else {
////                return v.quantity = v.availablequantity - v.pendingquantity
////            }
////        })
////    }


////    $scope.selectSkuV2List = (sku) => {
////        const existingSkuIndex = $scope.selectedskuList.findIndex(item => item.id === sku.id);
////        $scope.cannotaddall = true

////        if (existingSkuIndex !== -1) {
////            if ((sku.quantity - sku.pendingquantity) > $scope.commonqyt) {

////                sku.tempquantity = $scope.commonqyt
////            } else {
////                sku.tempquantity = sku.quantity - sku.pendingquantity
////            }

////            if ($scope.selectedskuList[existingSkuIndex].quantity == $scope.commonqyt) {
////                sku.isadded = !sku.isadded
////            } else {

////                if ($scope.commonqyt > 0) {
////                    var tempid = 0
////                    tempid = $scope.selectedskuList[existingSkuIndex].id
////                    $scope.selectedskuList.push({ id: tempid, quantity: $scope.commonqyt, availablequantity: sku.quantity, pendingquantity: sku.pendingquantity, outofstock: false })
////                }
////                $scope.selectedskuList.splice(existingSkuIndex, 1);
////                sku.isadded = false;
////                $scope.tempqtypre = $scope.commonqyt
////            }
////        } else {
////            sku.isadded = true;
////            if (sku.tempquantity <= 0) {
////                sku.tempquantity = 1
////            }
////            $scope.selectedskuList.push({ id: sku.id, quantity: sku.tempquantity, availablequantity: sku.quantity, pendingquantity: sku.pendingquantity, outofstock: false });
////        }
////    };

////    $scope.addQuantityForList = (sku) => {

////        //if (sku.tempquantity > sku.quantity) {
////        //    sku.tempquantity = sku.quantity;
////        //}
////        if ((sku.quantity - sku.pendingquantity) < sku.tempquantity) {
////            sku.tempquantity = sku.quantity - sku.pendingquantity;

////        }

////        var index = $scope.selectedskuList.findIndex(v => {
////            return v.id == sku.id
////        })
////        if (index > -1) {
////            $scope.selectedskuList[index].quantity = sku.tempquantity
////        }
////    }


////    //$scope.addToBagListV2 = async (form) => {
////    //    console.log("$scope.selectedskuList", $scope.selectedskuList)


////    //    if (form.$invalid) {
////    //        form.$$controls.forEach((e) => {
////    //            e.$touched = true;
////    //        });
////    //        return;
////    //    }


////    //    if ($scope.selectedskuList.length > 0) {
////    //        try {



////    //            for (const v of $scope.selectedskuList) {
////    //                if ((v.availablequantity - v.pendingquantity) <= 0) {
////    //                    v.quantity = 0
////    //                }
////    //                if (v.quantity && v.quantity > 0) {
////    //                    const resp = await $http({
////    //                        method: 'GET',
////    //                        url: `/api/users/AddSkuToCart/${v.id}/${v.quantity}`
////    //                    });
////    //                }
////    //            }

////    //            $scope.$applyAsync();
////    //            $scope.isaddedtobaglist = true;
////    //            $scope.quantity = 1;
////    //            $scope.updateCartAndWishlistCount()
////    //            $scope.updateCartCount()
////    //        } catch (e) {
////    //            if (e.data.key === "SkuQuantityExceedsAvailable") {
////    //                toastr.error('Entered quantity exceeds the available quantity.');
////    //            }
////    //        }
////    //    }
////    //    else {
////    //        toastr.error('Pick a size & quantity');
////    //        return
////    //    }
////    //};


////    $scope.addToBagListV2 = async (form) => {
////        console.log("$scope.selectedskuList", $scope.selectedskuList)


////        if (form.$invalid) {
////            form.$$controls.forEach((e) => {
////                e.$touched = true;
////            });
////            return;
////        }


////        if ($scope.selectedskuList.length > 0) {
////            try {

////                console.log("$scope.selectedskuList", $scope.selectedskuList)
////                let postdata = {
////                    item: $scope.selectedskuList
////                };
////                console.log(postdata)

////                let resp = await $http({
////                    method: 'POST',
////                    url: `/api/Users/AddSkuToCartInBulk`,
////                    headers: {
////                        "Content-Type": "application/json",
////                    },
////                    data: JSON.stringify(postdata),
////                });
////                //console.log("resp", resp)
////                //let data = resp.data.item
////                //let outofstocklist = []
////                //if (data && data.length > 0) {
////                //    outofstocklist = data.filter(v => {
////                //        return v.outofstock == true
////                //    })
////                //}

////                //if (outofstocklist.length > 0) {
////                //    for (const v of outofstocklist) {
////                //        var index = $scope.skulisttemp.findIndex(v1 => {
////                //            return v1.id == v.id
////                //        });
////                //        $scope.skulisttemp[index].outofstock = true;
////                //    }
////                //} else {
////                //    $scope.skulisttemp.forEach(v => {
////                //        if (v.outofstock) {
////                //            v.outofstock = false;
////                //        }
////                //    })
////                //}

////                //$scope.skulisttemp.forEach(v => {
////                //    if (!v.outofstock) {
////                //        v.tempquantity = 0
////                //        v.outofstock = false
////                //    }
////                //})

////                $scope.$applyAsync();
////                $scope.isaddedtobaglist = true;
////                $scope.quantity = 1;
////                $scope.updateCartAndWishlistCount()
////                $scope.updateCartCount()
////                $scope.selectedskuList = []
////            } catch (e) {
////                if (e.data.key === "SkuQuantityExceedsAvailable") {
////                    toastr.error('Entered quantity exceeds the available quantity.');
////                }
////            }
////        }
////        else {
////            toastr.error('Pick a size & quantity');
////            return
////        }
////    };

////    let skuhavingstock = internal_designdetails_skulist.find(e => e.quantity > 0);
////    if (skuhavingstock) {
////        $scope.selectedsku = skuhavingstock;
////    }

////    console.log(" $scope.selectedsku", $scope.selectedsku)

////});


Campuszaapp.controller('DesignsDetailMobileController', function DesignsDetailMobileController($scope, $http, $window) {
    $scope.quantity = 1;
    $scope.currentusercustomerreview = internal_designdetails_currentusercustomerreview;
    $scope.attributelist = internal_attribuelist;
    $scope.skulist = internal_designdetails_skulist;
    $scope.selectedsku = null;
    $scope.cartcount = 0;
    $scope.wishlistcount = 0;
    $scope.design = internal_design;


    $scope.isaddedtobag = false;
    $scope.isaddedtowishlist = false;

    $scope.selectSkuV2 = (sku) => {
        $scope.selectedsku = sku;
        $scope.isaddedtobag = false;
        //$scope.isaddedtowishlist = false;
    }
    $scope.addToBagV2 = async () => {
        if ($scope.selectedsku == null)
            return;
        try {
            let resp = await $http({
                method: 'GET',
                url: `/api/users/AddSkuToCart/${$scope.selectedsku.id}/${$scope.quantity}`
            });
            $scope.$applyAsync()
            $scope.isaddedtobag = true;
            $scope.quantity = 1
            $scope.updateCartAndWishlistCount()
            $scope.updateCartCount()
        } catch (e) {
            if (e.data.key == "SkuQuantityExceedsAvailable") {
                toastr.error('Entered quantity exceeds the available quantity.');
            }
        }








    }

    $scope.buyNowV2 = async () => {

        if ($scope.selectedsku == null)
            return;
        try {
            let resp = await $http({
                method: 'GET',
                url: `/api/users/AddSkuToCart/${$scope.selectedsku.id}/${$scope.quantity}`
            });
            $scope.$applyAsync()
            window.location.assign(`/user/cart`)
        } catch (e) {
            if (e.data.key == "SkuQuantityExceedsAvailable") {
                toastr.error('Entered quantity exceeds the available quantity.');
            }
        }

    }


    $scope.addQuantity = (value) => {
        if (($scope.selectedsku.quantity - $scope.selectedsku.pendingquantity) == $scope.quantity) {
            toastr.info('Entered quantity exceeds the available quantity.');
            return;
        }
        let updatedquantity = $scope.quantity + value
        if (updatedquantity > 0) {
            $scope.quantity = updatedquantity;
        }
    }
    $scope.addToWishList = async (designid) => {
        let resp = await $http({
            method: 'GET',
            url: `/api/users/AddDesignToWishlist/${designid}`

        });
        $scope.updateCartAndWishlistCount();

        $scope.$applyAsync()

        $scope.isaddedtowishlist = true;

    }
    $scope.updateCustomerReview = async () => {
        let postdata = {
            item: $scope.currentusercustomerreview
        };
        let resp = await $http({
            method: 'POST',
            url: `/api/customerreview/update`,
            headers: {
                "Content-Type": "application/json",
            },
            data: JSON.stringify(postdata),
        });
        $scope.currentusercustomerreview = resp.data.item;
        $scope.$applyAsync()
        $window.location.reload();
    }


    $scope.updateCartAndWishlistCount = async () => {
        let resp = await $http({
            method: 'GET',
            url: `/api/users/GetUserWishlistandCartCount`

        });
        let user = resp.data.item
        //$scope.cartcount = user[0].cart.itemlist.length;
        $scope.wishlistcount = user[0].wishlist.itemlist.length;

        user[0].wishlist.itemlist.forEach(v => {
            console.log("Checking item with product ID: " + v);

            if (v == $scope.design.id) {
                $scope.isaddedtowishlist = true
            }
        })
        //$scope.wishlist = resp.user
        $scope.$applyAsync()
    }
    $scope.updateCartAndWishlistCount();

    $scope.updateCartCount = async () => {
        let resp = await $http({
            method: 'GET',
            url: `/api/UserCartItem/getCartCount`

        });
        let cartitem = resp.data.item
        $scope.cartcount = cartitem.length;


        $scope.$applyAsync()
    }
    $scope.updateCartCount()



    ///////////////////////////////

    $scope.cannotaddall = true;
    $scope.selectedsku = null;
    $scope.selectedskuList = []
    $scope.skulisttemp = []
    $scope.commonqyt = 0
    $scope.tempqtypre = 0



    $scope.skulist.forEach(v => {
        $scope.skulisttemp.push({ id: v.id, sizekey: v.sizekey, tempquantity: 0, quantity: v.quantity, pendingquantity: v.pendingquantity, isadded: false, netprice: v.netprice, salesprice: v.salesprice, discountname: v.discountname, discountpercent: v.discountpercent })
    })

    const maxLength = $scope.skulist.reduce((max, item) => {
        const textLength = item.sizekey.length;
        return textLength > max ? textLength : max;
    }, 0);

    $scope.minwidth = 80
    $scope.dynamicwidth = maxLength * 15;

    if ($scope.dynamicwidth < 80) {
        $scope.dynamicwidth = 80
    }



    $scope.actdeactAll = () => {
        $scope.skulisttemp.forEach(v => {
            return v.tempquantity = 0, v.isadded = false
        })
        $scope.selectedskuList = []


        $scope.commonqyt = 0

        $scope.cannotaddall = !$scope.cannotaddall
        //if ($scope.cannotaddall == true) {
        //    $scope.selectedskuList = []
        //} else {
        $scope.skulisttemp.forEach(v => {
            $scope.selectedskuList.push({ id: v.id, quantity: v.tempquantity, availablequantity: v.quantity, pendingquantity: v.pendingquantity, outofstock: false });
        })
        //}
    }





    $scope.addQuantityAll = (qty) => {

        console.log($scope.commonqyt, qty, "commonqyt")

        $scope.skulisttemp.forEach(v => {
            if ((v.quantity - v.pendingquantity) > $scope.commonqyt) {

                return v.tempquantity = $scope.commonqyt
            } else {
                return v.tempquantity = v.quantity - v.pendingquantity
            }
        })

        $scope.selectedskuList.forEach(v => {
            if ((v.availablequantity - v.pendingquantity) > $scope.commonqyt) {
                return v.quantity = $scope.commonqyt
            } else {
                return v.quantity = v.availablequantity - v.pendingquantity
            }
        })
    }


    $scope.selectSkuV2List = (sku) => {
        const existingSkuIndex = $scope.selectedskuList.findIndex(item => item.id === sku.id);
        $scope.cannotaddall = true

        if (existingSkuIndex !== -1) {
            if ((sku.quantity - sku.pendingquantity) > $scope.commonqyt) {

                sku.tempquantity = $scope.commonqyt
            } else {
                sku.tempquantity = sku.quantity - sku.pendingquantity
            }

            if ($scope.selectedskuList[existingSkuIndex].quantity == $scope.commonqyt) {
                sku.isadded = !sku.isadded
            } else {

                if ($scope.commonqyt > 0) {
                    var tempid = 0
                    tempid = $scope.selectedskuList[existingSkuIndex].id
                    $scope.selectedskuList.push({ id: tempid, quantity: $scope.commonqyt, availablequantity: sku.quantity, pendingquantity: sku.pendingquantity, outofstock: false })
                }
                $scope.selectedskuList.splice(existingSkuIndex, 1);
                sku.isadded = false;
                $scope.tempqtypre = $scope.commonqyt
            }
        } else {
            sku.isadded = true;
            if (sku.tempquantity <= 0) {
                sku.tempquantity = 1
            }
            $scope.selectedskuList.push({ id: sku.id, quantity: sku.tempquantity, availablequantity: sku.quantity, pendingquantity: sku.pendingquantity, outofstock: false });
        }
    };

    $scope.addQuantityForList = (sku) => {

        //if (sku.tempquantity > sku.quantity) {
        //    sku.tempquantity = sku.quantity;
        //}
        if ((sku.quantity - sku.pendingquantity) < sku.tempquantity) {
            sku.tempquantity = sku.quantity - sku.pendingquantity;

        }

        var index = $scope.selectedskuList.findIndex(v => {
            return v.id == sku.id
        })
        if (index > -1) {
            $scope.selectedskuList[index].quantity = sku.tempquantity
        }
    }


    //$scope.addToBagListV2 = async (form) => {
    //    console.log("$scope.selectedskuList", $scope.selectedskuList)


    //    if (form.$invalid) {
    //        form.$$controls.forEach((e) => {
    //            e.$touched = true;
    //        });
    //        return;
    //    }


    //    if ($scope.selectedskuList.length > 0) {
    //        try {



    //            for (const v of $scope.selectedskuList) {
    //                if ((v.availablequantity - v.pendingquantity) <= 0) {
    //                    v.quantity = 0
    //                }
    //                if (v.quantity && v.quantity > 0) {
    //                    const resp = await $http({
    //                        method: 'GET',
    //                        url: `/api/users/AddSkuToCart/${v.id}/${v.quantity}`
    //                    });
    //                }
    //            }

    //            $scope.$applyAsync();
    //            $scope.isaddedtobaglist = true;
    //            $scope.quantity = 1;
    //            $scope.updateCartAndWishlistCount()
    //            $scope.updateCartCount()
    //        } catch (e) {
    //            if (e.data.key === "SkuQuantityExceedsAvailable") {
    //                toastr.error('Entered quantity exceeds the available quantity.');
    //            }
    //        }
    //    }
    //    else {
    //        toastr.error('Pick a size & quantity');
    //        return
    //    }
    //};


    $scope.addToBagListV2 = async (form) => {
        console.log("$scope.selectedskuList", $scope.selectedskuList)


        if (form.$invalid) {
            form.$$controls.forEach((e) => {
                e.$touched = true;
            });
            return;
        }


        if ($scope.selectedskuList.length > 0) {
            try {

                console.log("$scope.selectedskuList", $scope.selectedskuList)
                let postdata = {
                    item: $scope.selectedskuList
                };
                console.log(postdata)

                let resp = await $http({
                    method: 'POST',
                    url: `/api/Users/AddSkuToCartInBulk`,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: JSON.stringify(postdata),
                });
                //console.log("resp", resp)
                //let data = resp.data.item
                //let outofstocklist = []
                //if (data && data.length > 0) {
                //    outofstocklist = data.filter(v => {
                //        return v.outofstock == true
                //    })
                //}

                //if (outofstocklist.length > 0) {
                //    for (const v of outofstocklist) {
                //        var index = $scope.skulisttemp.findIndex(v1 => {
                //            return v1.id == v.id
                //        });
                //        $scope.skulisttemp[index].outofstock = true;
                //    }
                //} else {
                //    $scope.skulisttemp.forEach(v => {
                //        if (v.outofstock) {
                //            v.outofstock = false;
                //        }
                //    })
                //}

                //$scope.skulisttemp.forEach(v => {
                //    if (!v.outofstock) {
                //        v.tempquantity = 0
                //        v.outofstock = false
                //    }
                //})

                $scope.$applyAsync();
                $scope.isaddedtobaglist = true;
                $scope.quantity = 1;
                $scope.updateCartAndWishlistCount()
                $scope.updateCartCount()
                $scope.selectedskuList = []
            } catch (e) {
                if (e.data.key === "SkuQuantityExceedsAvailable") {
                    toastr.error('Entered quantity exceeds the available quantity.');
                }
            }
        }
        else {
            toastr.error('Pick a size & quantity');
            return
        }
    };

    let skuhavingstock = internal_designdetails_skulist.find(e => e.quantity > 0);
    if (skuhavingstock) {
        $scope.selectedsku = skuhavingstock;
    }

    console.log(" $scope.selectedsku", $scope.selectedsku)

});