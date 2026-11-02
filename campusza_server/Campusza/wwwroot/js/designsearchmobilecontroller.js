Campuszaapp.controller('DesignSearchMobileController', function DesignSearchMobileController($scope, $http, $sce) {

    $scope.searchstring = "";
    $scope.search = async () => {
        if ($scope.searchstring.trim().length == 0) {
            return;
        }
        window.location.assign("/designs/search/" + $scope.searchstring)
    }
  

})