Campuszaapp.controller(
    "UserAddressesController",
    function UserAddressesController($scope, $http) {
        $scope.addresslist = internal_useraddresseslist;
        $scope.address = {};
        $scope.addressindex = -1
        $scope.save = async (form) => {
            if (form.$invalid) {
                form.$$controls.forEach((e) => {
                    e.$touched = true;
                });
                return;
            }
            ///////////////
            if ($scope.address.isdefault) {
                $scope.addresslist.forEach((e, i) => {
                    if (e.id != $scope.address.id) {
                        e.isdefault = false;
                        e.version++;
                    }
                });
            }
            let isedit = $scope.address.id != 0;
            let postdata = {
                item: $scope.address,
            };
            let resp = await $http({
                method: "POST",
                url: `/api/useraddress/save`,
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify(postdata),
            });

            form.$setPristine();
            form.$setUntouched();

            $scope.$applyAsync();
            if (isedit) {
                let index = $scope.addresslist.findIndex(e => e.id == resp.data.item.id);
                $scope.addresslist[index] = resp.data.item
            } else {
                $scope.addresslist.unshift(resp.data.item)
            }
            $scope.selectAddress(null);
            $scope.toggleAddressModal(false);

        };


        $scope.remove = async (index) => {
            
            let postdata = {
                item: $scope.addresslist[index],
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
            $scope.addresslist.splice(index, 1);
        };

        $scope.toggleAddressModal = (show) => {
            let element = document.getElementById("addressModal");
            let addressModel = bootstrap.Modal.getInstance(element);
            if (addressModel == null) {
                addressModel = new bootstrap.Modal(
                    document.getElementById("addressModal"),
                    {}
                );
            }
            if (show) {
                addressModel.show();
            } else {
                addressModel.hide();
            }
        };
        $scope.selectAddress = (address) => {
            if (address == null) {
                $scope.address = {
                    name: "",
                    mobile: "",
                    pincode: "",
                    state: "",
                    address: "",
                    locality: "",
                    city: "",
                    typecode: 1,
                    isdefault: true,
                    id: 0,
                };
            } else {
                $scope.address = Object.assign({}, address);
            }
        };
        $scope.selectAddress(null);



        $scope.selectIndex = (index) => {

            if (index > -1) {

                $scope.addressindex = index
            }




        }

    }



);
