Campuszaapp.controller(
    "UserProfileController",
    function UserProfileController($scope, $http) {

        $scope.user = internal_userprofile_profile;
        $scope.usercopy = null;
        $scope.save = async (form) => {
            if (form.$invalid) {
                form.$$controls.forEach((e) => {
                    e.$touched = true;
                });
                return;
            }
            ///////////////
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

            $scope.user = resp.data.item;
            $scope.toggleAddressModal(false);
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

        $scope.editUser = () => {
            $scope.usercopy = Object.assign({}, $scope.user);
            $scope.usercopy.dob = $scope.user.dob.substring(0, 10);
        };
       

    }
);
