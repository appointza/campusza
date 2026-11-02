Campuszaapp.controller('HomeMobileController', function HomeMobileController($scope, $http) {
    $scope.category = {
        id: 0,
        name: "",
        getsecondarycategory: false,
        parentid: 0,
        issuspended: false
    }
    $scope.addToWishList = async () => {
        console.log("hit the js")
        let postdata = {
            item: $scope.category,
        };
        
        let resp = await $http({
            method: 'POST',
            url: `/api/Category/Select`,
            headers: {
                "Content-Type": "application/json",
            },
            data: JSON.stringify(postdata),

        });
        $scope.$applyAsync()
        console.log("designid", resp)
    }
})