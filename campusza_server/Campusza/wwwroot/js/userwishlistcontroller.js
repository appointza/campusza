

Campuszaapp.controller('UserWishlistController', function UserWishlistController($scope, $http) {

    $scope.itemlist = internal_userwishlistitemlist;
    $scope.skulist = internal_skulist;
    $scope.design = internal_design;

    $scope.selectsku = (skuId) => {
        $scope.selectedskuid = skuId;
    }
    //$scope.addToBag = async () => {
    //    if ($scope.selectedskuid == 0 || $scope.selectedskuid == undefined)
    //        return;
    //    let resp = await $http({
    //        method: 'GET',
    //        url: `/api/users/AddSkuToCart/${$scope.selectedskuid}`
    //    });
    //    $scope.$applyAsync()
    //    $scope.removeItemFromWishlist($scope.design.designid)


    //}
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
        let skuhavingstock = $scope.skulist.find(e => e.quantity > 0);
        if (skuhavingstock) {
            $scope.selectedskuid = skuhavingstock.id;
        }
        $scope.$applyAsync();
    }

    $scope.getFileIndex = function (item) {
        return item.filelist.findIndex(v => v.filetype.toLowerCase().startsWith("image/"));
    };

});

