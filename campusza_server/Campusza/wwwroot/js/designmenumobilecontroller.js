Campuszaapp.controller('DesignMenuMobileController', function DesignMenuMobileController($scope, $http, $sce, $window) {


    $scope.menulist = internal_menulist
    $scope.menuname = ""
    $scope.link = ""
    $scope.attributes = {}



    $scope.getAttributes = (attributes, menuname, menulink) => {

        $scope.attributes = attributes
        $scope.menuname = menuname
        $scope.link = menulink

    }

    $scope.trustHtml = function (html) {
        return $sce.trustAsHtml(html);
    };

    $scope.navigateToURL = (link) => {
        $window.location.href = link;

    }

})