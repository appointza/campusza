Campuszaapp.controller(
    "UserAddressesMobileController",
    function UserAddressesMobileController($scope, $http, $window) {
        //$scope.addresslist = internal_useraddresseslist;
        //$scope.guid = internal_addressguid;
        //$scope.address = {
        //    name: "",
        //    mobilenumber: "",
        //    email: "",
        //    pincode: "",
        //    state: "",
        //    address: "",
        //    location: "",
        //    city: "",
        //    type: "",
        //    isdefault: true,
        //    guid: "",
        //};
        //$scope.addressindex = -1


        //if ($scope.guid != "") {
        //    var index = $scope.addresslist.findIndex(v => {
        //        return v.guid == $scope.guid;
        //    })

        //    if (index > -1) {
        //        $scope.address = $scope.addresslist[index]
        //    }
        //}



        //$scope.setTypeHome = () => {
        //    $scope.address.type = "Home"
        //};

        //$scope.setTypeWork = () => {
        //    $scope.address.type = "Work"
        //};



        //$scope.save = async (form) => {
        //    if (form.$invalid) {
        //        form.$$controls.forEach((e) => {
        //            e.$touched = true;
        //        });
        //        return;
        //    }
        //    ///////////////
        //    if ($scope.address.isdefault) {
        //        $scope.addresslist.forEach((e, i) => {
        //            if (e.guid != $scope.address.guid) e.isdefault = false;
        //        });
        //    }
        //    if ($scope.address.guid.length == 0) {
        //        $scope.addresslist.push($scope.address);
        //    } else {
        //        let index = $scope.addresslist.findIndex((e) => {
        //            return e.guid == $scope.address.guid;
        //        });
        //        $scope.addresslist[index] = $scope.address;
        //    }
        //    let postdata = {
        //        item: $scope.addresslist,
        //    };
        //    let resp = await $http({
        //        method: "POST",
        //        url: `/api/users/UpdateUserAddresses`,
        //        headers: {
        //            "Content-Type": "application/json",
        //        },
        //        data: JSON.stringify(postdata),
        //    });
        //    $scope.$applyAsync();

        //};






        $scope.addresslist = internal_useraddresseslist;
        $scope.previousController = internal_previouscontroller
        $scope.previousAction = internal_previousaction
        $scope.id = internal_id
        $scope.address = {}

        if ($scope.id > 0) {
            let index = -1
            index = $scope.addresslist.findIndex(v => {
                return v.id == $scope.id
            })

            if (index > -1) {
                $scope.address = $scope.addresslist.slice(0)[index]
            }
        } else {
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

        }



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
            $scope.$applyAsync();
            if (isedit) {
                let index = $scope.addresslist.findIndex(e => e.id == resp.data.item.id);
                $scope.addresslist[index] = resp.data.item
            } else {
                $scope.addresslist.unshift(resp.data.item)
            }

            $window.location.href = '/' + $scope.previousController + '/' + $scope.previousAction;


        };



        $scope.setTypeHome = () => {
            $scope.address.typecode = 1
        };

        $scope.setTypeWork = () => {
            $scope.address.typecode = 2
        };


        $scope.goBack = () => {
            $window.location.href = '/' + $scope.previousController + '/' + $scope.previousAction;

        }


    }




);
