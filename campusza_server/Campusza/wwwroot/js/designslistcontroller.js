Campuszaapp.controller('DesignsListController', function DesignsListController($scope, $http, $window) {

    $scope.sorttext = ''

    if ($window.localStorage.getItem('gridSize') && $window.localStorage.getItem('gridSize') != '') {
        $scope.columnClass = $window.localStorage.getItem('gridSize');
    } else {
        $scope.columnClass = "col-3"
    }

    if ($window.localStorage.getItem('sortText') && $window.localStorage.getItem('sortText') != '') {
        $scope.sorttext = $window.localStorage.getItem('sortText');
    } else {
        $scope.sorttext = "New Arrivals"
    }

    $scope.saveString = function (newClass) {
        $window.localStorage.setItem('gridSize', newClass);
        $scope.getString()
    };

    $scope.getString = function () {
        $scope.columnClass = $window.localStorage.getItem('gridSize');
    };



    let filterStringToArray = (filterstring) => {
        if (filterstring.trim().length == 0) {
            return [];
        }
        let result = [];
        let step1 = filterstring.split(";");
        step1.map((e) => {
            let temp = e.split(":");
            let key = temp[0];
            temp[1].split(",").forEach(e => {
                result.push(`${key}:${e}`)
            });
        })
        return result;
    }
    let filterArrayToString = (filterarray) => {
        let step1 = [];
        filterarray.map(e => {
            let temp = e.split(":");
            let key = temp[0];
            let value = temp[1];
            let index = step1.findIndex(e2 => {
                return e2.attributekey == key;
            })
            if (index == -1) {
                step1.push({
                    attributekey: key,
                    attributevalues: [value]
                })
            } else {
                step1[index].attributevalues.push(value)
            }
        })
        let step2 = step1.map((e) => {
            return `${e.attributekey}:${e.attributevalues.join(",")}`;
        })
        return step2.join(";")
    }
    $scope.isaddedtowishlist = false;
    $scope.filters = internal_designslistfilters;
    $scope.selectedfilterstring = internal_designslistselectedfilters;
    $scope.url = internal_designslisturl;




    var segments = $scope.url.split('/').filter(function (segment) {
        return segment !== '';
    });

    let temp1 = segments[1].replace(/[_-]/g, ' ');
    $scope.category = temp1
    let temp2 = segments[2].replace(/[_-]/g, ' ');
    $scope.product = temp2;





    $scope.selectedfilters = [];
    $scope.selectedfilters = filterStringToArray($scope.selectedfilterstring);
    $scope.filterstringforsort = "";
    $scope.selectedsort = internal_selectedsort == "" ? "newcontent" : internal_selectedsort;


    //$scope.columnClass = 'col-3';

    //$scope.changeColumnClass = function (newClass) {
    //    $scope.columnClass = newClass;
    //};





    $scope.changeColumnClass = function (newClass) {
        $scope.saveString(newClass)
    };

    $scope.onFilterClick = (filterstring) => {
        let selectedfilterstemp = $scope.selectedfilters.slice(0);
        if (selectedfilterstemp.includes(filterstring)) {
            const index = selectedfilterstemp.indexOf(filterstring);
            if (index > -1) {
                selectedfilterstemp.splice(index, 1);
            }
        } else {
            selectedfilterstemp.push(filterstring);
        }
        let filterstringtemp = filterArrayToString(selectedfilterstemp);
        $scope.filterstringforsort = filterstringtemp;

        let url =
            `${$scope.url}/${filterstringtemp}?sort=${$scope.selectedsort}`;
        window.location.assign(url)

    }
    $scope.sortitems = [];

    $scope.onSortClick = function () {
        let url =
            `${$scope.url}/${$scope.selectedfilterstring}?sort=${$scope.selectedsort}`;
        window.location.assign(url)
    }


    $scope.addToWishList = async (designid) => {
        console.log("designid", designid)
        let resp = await $http({
            method: 'GET',
            url: `/api/users/AddDesignToWishlist/${designid}`

        });
        $scope.$applyAsync()
        $scope.isaddedtowishlist = true;

    }

    $scope.isCollapseOpen = [];

    $scope.toggleCollapse = function (index) {
        $scope.isCollapseOpen[index] = !$scope.isCollapseOpen[index];
    };


    $scope.getColor = (colourname) => {
        return colourname.toLowerCase().replace(/ /g, '');
    }



    $scope.selectedSort = (sortstring, name) => {
        let url =
            `${$scope.url}/${$scope.selectedfilterstring}?sort=${sortstring}`;

        $window.localStorage.setItem('sortText', name);

        window.location.assign(url)
    }

});