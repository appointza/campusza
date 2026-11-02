Campuszaapp.controller(
    "AppFooterMobileController",
    function AppFooterMobileController($scope, $http) {
        $scope.isloggedin = internal_footermobile_isloggedin;
        $scope.cartitemscount = internal_footermobile_cartitemscount;
        $scope.username = internal_footermobile_username;
        $scope.userinitial = "";

        if ($scope.isloggedin && $scope.username.length > 0) {
            $scope.userinitial = $scope.username.charAt(0).toUpperCase();
        }
       
    }
);
