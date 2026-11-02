
Campuszaapp.controller(
    "UserAccountMobileController",
    function UserAccountMobileController($scope, $http, $window) {

        $scope.user = internal_useraccount_profile;
        $scope.profilelist = internal_profilelist;
        $scope.profile = {};
        $scope.sizelist = internal_sizelist;
        $scope.activetab = 'topWear'

        const words = $scope.user.name.split(' ');

        $scope.initials = words.map(word => word.charAt(0).toUpperCase()).join('');

        $scope.profileneedsupdate = false;
        $scope.saved = false;
        $scope.deleted = false;

        $scope.checkprofilestatus = () => {

            if ($scope.user.name.trim() != "") {
                $scope.profileneedsupdate = false;
            } else {
                $scope.profileneedsupdate = true;

            }

        };
        $scope.checkprofilestatus();


        $scope.dynamicwidth = () => {
            const maxLength = $scope.sizelist.reduce((max, item) => {
                const textLength = item.name.length;
                return textLength > max ? textLength : max;
            }, 0);

            $scope.minwidth = 70;
            $scope.dynamicwidth = maxLength * 12;

            if ($scope.dynamicwidth < 80) {
                $scope.dynamicwidth = 80;
            }
        }
        $scope.dynamicwidth();



        $scope.selectProfile = (profile) => {
            if (profile == null) {
                $scope.profile = {
                    id: 0,
                    userid: 0,
                    name: '',
                    dob: '',
                    gender: '',
                    attributes: {
                        height: 0,
                        weight: 0,
                        preferredsize: '',
                        topwear: {
                            shoulderwidth: 0,
                            chestcircumference: 0,
                            sleevelength: 0,
                            shirtlength: 0
                        },
                        bottomwear: {
                            waistcircumference: 0,
                            hipcircumference: 0,
                            inseamlength: 0,
                            thighcircumference: 0,
                            legopening: 0
                        }
                    }
                }
            } else {
                $scope.address = Object.assign({}, address);
            }
        };
        $scope.selectProfile(null);


        $scope.setTypeMale = () => {
            $scope.profile.gender = "Male"
        };

        $scope.setTypeFemale = () => {
            $scope.profile.gender = "Female"
        };








        $scope.save = async (form) => {
            if (form.$invalid) {
                form.$$controls.forEach((e) => {
                    e.$touched = true;
                });
                return;
            }

            if ($scope.saved == false) {
                let postdata = {
                    item: $scope.profile,
                };
                let resp = await $http({
                    method: "POST",
                    url: `/api/Profile/save`,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: JSON.stringify(postdata),
                });
                $scope.$applyAsync(function () {
                    toastr.success('Your preferences have been successfully saved for an enhanced user experience.');
                    $scope.saved = true
                    setTimeout(function () {
                        $window.location.reload();
                    }, 3000)
                });



            }




        };


        $scope.selectedProfile = (profile) => {

            $scope.profile = {
                id: profile.id,
                userid: profile.userid,
                name: profile.name,
                dob: profile.dob.substring(0, 10),
                gender: profile.gender,
                attributes: {
                    height: profile.attributes.height,
                    weight: profile.attributes.weight,
                    preferredsize: profile.attributes.preferredsize,
                    topwear: {
                        shoulderwidth: profile.attributes.topwear.shoulderwidth,
                        chestcircumference: profile.attributes.topwear.chestcircumference,
                        sleevelength: profile.attributes.topwear.sleevelength,
                        shirtlength: profile.attributes.topwear.shirtlength
                    },
                    bottomwear: {
                        waistcircumference: profile.attributes.bottomwear.waistcircumference,
                        inseamlength: profile.attributes.bottomwear.inseamlength,
                        thighcircumference: profile.attributes.bottomwear.thighcircumference,
                        legopening: profile.attributes.bottomwear.legopening
                    }
                }
            }
        }


        $scope.pickSize = function (sizekey) {
            $scope.profile.attributes.preferredsize = sizekey
        }

        $scope.changeToggle = function (heading) {
            $scope.activetab = heading;
        };


        $scope.deleteProfile = async () => {
            if ($scope.deleted == false) {

                let deleteobj = {
                    id: $scope.profile.id,
                    version: $scope.profile.version
                }

                let postdata = {
                    item: deleteobj,
                };
                let resp = await $http({
                    method: "POST",
                    url: `/api/Profile/Delete`,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: JSON.stringify(postdata),
                });
                $scope.$applyAsync(function () {
                    $scope.deleted = true
                    toastr.success('Profile deleted successfully');
                    setTimeout(function () {
                        $window.location.reload();
                    }, 2000)
                });
            }


        }
    }






);
