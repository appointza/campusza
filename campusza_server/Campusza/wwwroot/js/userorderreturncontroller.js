Campuszaapp.controller(
    "UserOrderReturnController",
    function UserOrderReturnController($scope, $http) {

        $scope.data = internal_user_order_return_data;
        $scope.ischooseaddresspanelvisible = false;
        $scope.quantity = $scope.data.quantity;
        $scope.reason = "";
        $scope.pickupaddress = $scope.data.addresslist.find(e => e.isdefault == true);
        if ($scope.pickupaddress == null && $scope.data.addresslist.length > 0) {
            $scope.pickupaddress = $scope.data.addresslist[0];
        }
        $scope.addQuantity = () => {
            if ($scope.quantity == $scope.data.quantity) {
                return;
            }
            $scope.quantity++;
        }
        $scope.subtractQuantity = () => {
            if ($scope.quantity == 1) {
                return;
            }
            $scope.quantity--;
        }
        $scope.toggleChooseAddressPanel = () => {
            $scope.ischooseaddresspanelvisible = !$scope.ischooseaddresspanelvisible;
        }
        $scope.selectPickupAddress = (address) => {
            $scope.pickupaddress = address;
            $scope.toggleChooseAddressPanel();
        }
        $scope.save = async () => {
            let postdata = {
                item: {
                    originalorderid: $scope.data.orderid,
                    quantity: $scope.quantity,
                    notes: $scope.reason,
                    pickupaddress: {
                        name: $scope.pickupaddress.name, 
                        mobile: $scope.pickupaddress.mobile, 
                        email: $scope.pickupaddress.email, 
                        address: $scope.pickupaddress.address, 
                        pincode: $scope.pickupaddress.pincode, 
                        state: $scope.pickupaddress.state, 
                        locality: $scope.pickupaddress.locality, 
                        city: $scope.pickupaddress.city, 
                    }
                }
            };
            let resp = await $http({
                method: 'POST',
                url: `/api/users/PlaceReturnOrder`,
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify(postdata),
            });
            if (resp.data.item == true) {
                toastr.success('Order Return Request Successful');
                setTimeout(() => {
                    window.location.assign("/");
                }, 2000)
            }
            $scope.$applyAsync()
        }
    }
);
