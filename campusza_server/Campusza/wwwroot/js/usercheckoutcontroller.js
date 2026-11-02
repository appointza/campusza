
Campuszaapp.controller('UserCheckoutController', function UserCheckoutController($scope, $http) {
    $scope.itemlist = internal_usercheckoutitemlist;
    $scope.address = internal_usercheckoutaddress;
    $scope.addresslist = internal_useraddresseslist;
    $scope.addressneedsupdate = internal_usercartaddressneedsupdate;
    $scope.profileneedsupdate = internal_usercartprofileneedsupdate;
    $scope.userwallet = internal_usercheckoutuserwallet;
    $scope.iswalletbalanceapplied = internal_usercheckoutiswalletbalanceapplied;
    $scope.walletbalanceapplied = internal_usercheckoutwalletbalanceapplied;
    $scope.newaddress = {};
    $scope.paymentmode = 0;
    $scope.addressindex = -1
    $scope.addresspayment = false;
    $scope.userprofile = internal_userprofile;
    $scope.usercopy = null;
    $scope.insert = false;
    $showAddressError = false;
    $scope.totalmrp = 0;
    $scope.totaldiscount = 0;
    $scope.totalamount = 0;
    $scope.hidepaymentoptions = false;
    $scope.enablecheckout = false;
  


    $scope.selectPaymentMode = (paymentmode) => {
        $scope.paymentmode = paymentmode;  
    }

    $scope.calculateTotal = () => {
        $scope.totalmrp = 0;
        $scope.totaldiscount = 0;
        $scope.itemlist.forEach((e) => {
            $scope.totalmrp += e.salesprice * e.quantity;
            $scope.totaldiscount += e.discount * e.quantity;
        });
        $scope.totalamount = $scope.totalmrp - $scope.totaldiscount;
        $scope.totalamount -= $scope.walletbalanceapplied;
        if ($scope.totalamount == 0) {
            $scope.hidepaymentoptions = true;
        } else {
            $scope.hidepaymentoptions = false;
        }
    }
    $scope.calculateTotal();


    //$scope.initiateAddress = async () => {

    //    var index = $scope.addresslist.findIndex((e) => {
    //        return e.id == $scope.address.id;
    //    })



    //    if (index == -1 && $scope.addresslist.length > 0) {

    //        var defaultAddress = $scope.addresslist.filter((e) => {
    //            return e.isdefault == true;
    //        })

    //        if (defaultAddress.length > 0) {
    //            var updateaddress = defaultAddress[0]


    //            let postdata = {
    //                item: updateaddress
    //            }
    //            let resp = await $http({
    //                method: 'POST',
    //                url: `/api/users/UpdateUserCartAddress`,
    //                headers: {
    //                    'Content-Type': "application/json"
    //                },
    //                data: JSON.stringify(postdata)

    //            });
    //            $scope.address = updateaddress
    //            $scope.$applyAsync()
    //        }
    //        //else {


    //        //    var updateaddress = $scope.addresslist[0]

    //        //}
    //    }




    //}

    //$scope.initiateAddress();

    $scope.initiateAddress = async () => {

        var index = $scope.addresslist.findIndex((e) => {
            return e.id == $scope.address.id;
        })


        if (index > -1 && $scope.addresslist.length > 0) {

            $scope.address = $scope.addresslist[index]

            let postdata = {
                item: $scope.address
            }
            let resp = await $http({
                method: 'POST',
                url: `/api/users/UpdateUserCartAddress`,
                headers: {
                    'Content-Type': "application/json"
                },
                data: JSON.stringify(postdata)

            });
            $scope.$applyAsync()
        }
        else if (index == -1 && $scope.addresslist.length > 0) {

            var defaultAddress = $scope.addresslist.filter((e) => {
                return e.isdefault == true;
            })

            if (defaultAddress.length > 0) {
                var updateaddress = defaultAddress[0]
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

            } else {


                var updateaddress = {}

            }

        }




    }

    $scope.initiateAddress();


    //$scope.sendAddress = async (index) => {
    //    $scope.showAddressError = false;
    //    $scope.addresspayment = false;

    //    let updateaddress = $scope.addresslist.slice(0)[index]



    //    let postdata = {
    //        item: updateaddress
    //    }
    //    let resp = await $http({
    //        method: 'POST',
    //        url: `/api/users/UpdateUserCartAddress`,
    //        headers: {
    //            'Content-Type': "application/json"
    //        },
    //        data: JSON.stringify(postdata)

    //    });
    //    $scope.address = updateaddress

    //    $scope.$applyAsync()
    //}

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


    $scope.editUser = () => {
        $scope.usercopy = Object.assign({}, $scope.userprofile);
        $scope.usercopy.dob = $scope.userprofile.dob.substring(0, 10);
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

    $scope.save = async (form) => {
        if (form.$invalid) {
            form.$$controls.forEach((e) => {
                e.$touched = true;
            });
            return;
        }
        if ($scope.usercopy.email != "" && $scope.usercopy.mobilenumber != "") {
            $scope.profileneedsupdate = false
        }
        let postdata = {
            item: $scope.usercopy,
        };
        let resp = await $http({
            method: "POST",
            url: `/api/users/UpdateUserprofile`,
            headers: {
                "Content-Type": "application/json",
            },
            data: JSON.stringify(postdata),
        });
        $scope.$applyAsync();

        $scope.userprofile = resp.data.item;
        $scope.toggleAddressModal(false);
    };
  

    $scope.selectAddress = (address) => {
        console.log(address,"address")
        if (address == null) {
            $scope.newaddress = {
                name: "",
                mobile: "",
                pincode: "",
                state: "",
                address: "",
                location: "",
                city: "",
                typecode: 1,
                isdefault: true,
                id: 0,
            };
        } else {
            $scope.newaddress = Object.assign({}, address);
        }
        if ($scope.addressForm) {
            $scope.addressForm.$setPristine();
            $scope.addressForm.$setUntouched();
        }
    };
    $scope.selectAddress(null);


    $scope.toggleAddressEditModal = (show) => {
        let element = document.getElementById("addressEditModal");
        let addressModel = bootstrap.Modal.getInstance(element);
        if (addressModel == null) {
            addressModel = new bootstrap.Modal(
                document.getElementById("addressEditModal"),
                {}
            );
        }
        if (show) {
            addressModel.show();
        } else {
            addressModel.hide();
        }
    };



    $scope.saveaddress = async (form) => {
        if (form.$invalid) {
            form.$$controls.forEach((e) => {
                e.$touched = true;
            });
            return;
        }
        ///////////////
        if ($scope.newaddress.isdefault) {
            $scope.addresslist.forEach((e, i) => {
                if (e.id != $scope.newaddress.id) {
                    e.isdefault = false;
                    e.version++;
                }
            });
        }

        let isedit = $scope.newaddress.id > 0;

        let postdata = {
            item: $scope.newaddress,
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
            let index = $scope.addresslist.findIndex(e => e.id == $scope.newaddress.id);
            $scope.addresslist[index] = resp.data.item;
        } else {
            $scope.addresslist.unshift(resp.data.item);
        }
        if (resp.data.item.isdefault == true) {
            $scope.address = resp.data.item
        } else {
            $scope.address = {}
        }

        $scope.selectAddress(resp.data.item);
        $scope.toggleAddressEditModal(false);
        $scope.addressneedsupdate = false;
    };



    $scope.proceedToPayment = (form) => {
        console.log($scope.paymentmode, "paymentmode")
        if ($scope.addressneedsupdate) {
            $scope.toggleAddressEditModal(true);
            return;
        }

        if ($scope.profileneedsupdate) {
            $scope.toggleAddressModal(true);
            return;
        }

        if ($scope.paymentmode == 0 && $scope.hidepaymentoptions == false) {
            toastr.error('Select a Payment Option');
            return

        }

        let address = $scope.address;
        if (!(address != null && address.id > 0)) {

            toastr.error('Select a  address');
            return
        }
       
        window.location.assign(`/user/ProceedToPayment/${$scope.paymentmode}`)
    }

    $scope.selectIndex = (index) => {

        if (index > -1) {

            $scope.addressindex = index
        }
    }
    $scope.toggleWallet = async () => {
        let postdata = {
            item: {
                iswalletbalanceapplied: !$scope.iswalletbalanceapplied
            },
        };
        let resp = await $http({
            method: "POST",
            url: `/api/users/ToggleWalletInUsercart`,
            headers: {
                "Content-Type": "application/json",
            },
            data: JSON.stringify(postdata),
        });
        $scope.$applyAsync();
        $scope.iswalletbalanceapplied = resp.data.item.iswalletbalanceapplied;
        $scope.walletbalanceapplied = resp.data.item.walletbalanceapplied;
        $scope.userwallet.balance = resp.data.item.walletbalance;
        $scope.calculateTotal();
    }

    $scope.getFileIndex = function (item) {
        return item.filelist.findIndex(v => v.filetype.toLowerCase().startsWith("image/"));
    };


});