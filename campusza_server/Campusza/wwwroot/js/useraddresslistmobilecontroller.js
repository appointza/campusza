Campuszaapp.controller(
    "UserAddressListMobileController",
    function UserAddressListMobileController($scope, $http) {
        $scope.addresslist = internal_useraddresseslist;
        $scope.addressindex = -1


        $scope.remove = async () => {

            let postdata = {
                item: $scope.addresslist[$scope.addressindex],
            };
            let resp = await $http({
                method: "POST",
                url: `/api/useraddress/DeleteAndUpdate`,
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify(postdata),
            });
            $scope.$applyAsync();
            if (resp.data.item == true) {
                $scope.addresslist.splice($scope.addressindex, 1);
            }
        };

        $scope.selectIndex = (index) => {

            if (index > -1) {

                $scope.addressindex = index
            }
        }

    });
