

Campuszaapp.controller('AppHeaderController', function AppHeaderController($scope, $http) {
    $scope.isloggedin = internal_header_isloggedin;
    $scope.username = internal_header_username;
    $scope.mobilenumber = internal_header_mobilenumber;
    $scope.cartitemscount = internal_header_cartitemscount;
    $scope.searchstring = "";
    //$scope.showbackbutton = internal_homeheadermobile_showbackbutton;
    //$scope.showlogo = internal_homeheadermobile_showlogo;
    //$scope.showpagetitle = internal_homeheadermobile_showpagetitle;
    //$scope.showwishlisticon = internal_homeheadermobile_showwishlisticon;
    //$scope.showsearchicon = internal_homeheadermobile_showsearchicon;
    //$scope.showcarticon = internal_homeheadermobile_showcarticon;
    //$scope.titletext = internal_homeheadermobile_titletext;
    

    $scope.search = async () => {
        if ($scope.searchstring.trim().length == 0) {
            return;
        }
        window.location.assign("/designs/search/" + $scope.searchstring)
    }

    

});

