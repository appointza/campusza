Campuszaapp.controller(
    "HomeHeaderMobileController",
    function HomeHeaderMobileController($scope, $http) {
        $scope.isloggedin = internal_homeheadermobile_isloggedin;
        $scope.username = internal_homeheadermobile_username;
        $scope.mobilenumber = internal_homeheadermobile_mobilenumber;
        $scope.cartitemscount = internal_homeheadermobile_cartitemscount;
        $scope.wishlistitemscount = internal_homeheadermobile_wishlistitemcount;

        $scope.showbackbutton = internal_homeheadermobile_showbackbutton;
        $scope.showlogo = internal_homeheadermobile_showlogo;
        $scope.showpagetitle = internal_homeheadermobile_showpagetitle;
        $scope.showwishlisticon = internal_homeheadermobile_showwishlisticon;
        $scope.showsearchicon = internal_homeheadermobile_showsearchicon;
        $scope.showcarticon = internal_homeheadermobile_showcarticon;
        $scope.titletext = internal_homeheadermobile_titletext;



        $scope.userinitial = "";


        if ($scope.isloggedin && $scope.username.length > 0) {
            $scope.userinitial = $scope.username.charAt(0).toUpperCase();
        }

    }
);
