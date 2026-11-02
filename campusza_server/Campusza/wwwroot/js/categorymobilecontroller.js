Campuszaapp.controller('CategoryMobileController', function CategoryMobileController($scope, $http) {
    $scope.category = {
        id: 0,
        name: "",
        getsecondarycategory: false,
        parentid: 0,
        issuspended: null
    }
    $scope.categorylist = [];
    $scope.subcategorylist = [];
    $scope.searchstring = "";
    $scope.getCategory = async () => {
        console.log("hit the js")
        let postdata = {
            item: $scope.category,
        };

        $scope.categorylist = await $http({
            method: 'POST',
            url: `/api/Category/Select`,
            headers: {
                "Content-Type": "application/json",
            },
            data: JSON.stringify(postdata),

        });
        $scope.$applyAsync()
        console.log("designid", $scope.categorylist.data.item)
    }
    $scope.getCategory();
    $scope.subcategory = {
        id: 0,
        name: "",
        getsecondarycategory: false,
        parentid: 0,
        issuspended: null
    }
    $scope.getSubCategory = async (id) => {
        $scope.subcategory = {
            id: 0,
            name: "",
            getsecondarycategory: false,
            parentid: id,
            issuspended: null
        }
        let postdata = {
            item: $scope.subcategory,
        };

        $scope.subcategorylist = await $http({
            method: 'POST',
            url: `/api/Category/Select`,
            headers: {
                "Content-Type": "application/json",
            },
            data: JSON.stringify(postdata),

        });
        $scope.$applyAsync()
        console.log("subcategory", $scope.subcategorylist.data.item)
    }
    $scope.redirectToProduct = async (id) => {

        console.log("open productlist")
        window.location.assign(`/designs/Search/${$scope.categorylist.data.item[0].key}/${$scope.subcategorylist.data.item[0].key}`);
    }

})