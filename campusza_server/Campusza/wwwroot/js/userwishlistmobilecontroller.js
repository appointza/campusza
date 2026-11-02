

Campuszaapp.controller('UserWishlistMobileController', function UserWishlistMobileController($scope, $http) {

    $scope.itemlist = internal_userwishlistitemlist;
    $scope.skulist = internal_skulist;
    $scope.design = internal_design;
    $scope.cartcount = 0;
    $scope.selectedskuid = 0;


    $scope.selectsku = (skuId) => {
        $scope.selectedskuid = skuId;
    }
    $scope.toggleSelectWishlistModal = (show) => {
        let element = document.getElementById("wishlistmodal");
        let selectWishlistModal = bootstrap.Modal.getInstance(element);
        if (selectWishlistModal == null) {
            selectWishlistModal = new bootstrap.Modal(
                document.getElementById("wishlistmodal"),
                {}
            );
        }
        if (show) {
            selectWishlistModal.show();
        } else {
            selectWishlistModal.hide();
        }
    };

    $scope.addToBag = async () => {
        if ($scope.selectedskuid == 0 || $scope.selectedskuid == undefined) {
            toastr.error('Pick a size to proceed');
            return;
        } else {
            let resp = await $http({
                method: 'GET',
                url: `/api/users/AddSkuToCart/${$scope.selectedskuid}/1`
            });
            $scope.$applyAsync()
            $scope.removeItemFromWishlist($scope.design.designid)
            $scope.toggleSelectWishlistModal(false)

            $scope.updateCartCount()
        }
    }

    $scope.removeItemFromWishlist = async (id) => {
        let resp = await $http({
            method: 'GET',
            url: `/api/users/RemoveDesignFromWishlist/${id}`
        });
        $scope.$applyAsync()
        let index = $scope.itemlist.findIndex((e) => {
            return e.designid == id;
        })
        $scope.itemlist.splice(index, 1);
    }


    $scope.selectSku = async (id) => {
        if (id == 0) {
            return
        }
        let resp = await $http({
            method: 'POST',
            url: `/api/sku/GetSku/${id}`
        });
        $scope.skulist = resp.data.item
        $scope.$applyAsync();
        console.log("$.scope.itemlist", $scope.design)
        $scope.design = $scope.itemlist.find(v => {
            return v.designid == id
        })
        console.log("$.scope.itemlist", $scope.design)
        $scope.toggleSelectWishlistModal(true)
        let skuhavingstock = $scope.skulist.find(e => e.quantity > 0);
        if (skuhavingstock) {
            $scope.selectedskuid = skuhavingstock.id;
        }
        $scope.$applyAsync();



    }
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


    $scope.getfileindex = function (item) {
        return item.filelist.findIndex(type => type.filetype.toLowerCase().startsWith("image/"))
    }
});

