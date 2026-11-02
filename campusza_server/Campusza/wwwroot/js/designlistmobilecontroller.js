Campuszaapp.controller('DesignsListMobileController', function DesignsListMobileController($scope, $http) {
    $scope.attributevaluesList = []
    $scope.attributekey = ""
    $scope.isalive = false;
    $scope.name = "list";
    $scope.selectedSubFilterList = [];
    $scope.selectedFiltershow = (filter) => {
        console.log("clickvalue", filter)
        $scope.selectedSubFilterList = filter;
    }
    $scope.selectedSort = localStorage.getItem('selectedSort');

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
    $scope.attributekey = $scope.filters[0].attributekey
    $scope.attributevaluesList = $scope.filters[0].attributevalues
    $scope.selectedfilterstring = internal_designslistselectedfilters;
    $scope.url = internal_designslisturl;

    $scope.selectedfilters = [];
    $scope.selectedfilters = filterStringToArray($scope.selectedfilterstring);
    $scope.selectedfilterstemp = []
    $scope.selectedfilterstemp = filterStringToArray($scope.selectedfilterstring);

    $scope.filterstringforsort = "";
    $scope.onFilterClick = (filterstring) => {
        console.log("click", filterstring)


        //$scope.selectedfilterstemp = $scope.selectedfilters.slice(0);
        if ($scope.selectedfilterstemp.includes(filterstring)) {
            const index = $scope.selectedfilterstemp.indexOf(filterstring);
            if (index > -1) { // only splice array when item is found
                $scope.selectedfilterstemp.splice(index, 1); // 2nd parameter means remove one item only
            }
        } else {

            $scope.selectedfilterstemp.push(filterstring);
        }
        let filterstringtemp = filterArrayToString($scope.selectedfilterstemp);
        $scope.filterstringforsort = filterstringtemp;
        //let url =
        //    `${$scope.url}/${$scope.filterstringforsort}?sort=${$scope.selectedsort}`;
        //window.location.assign(url)
    }
    $scope.sortitems = [];
    $scope.selectedsort = internal_selectedsort == "" ? "newcontent" : internal_selectedsort;

   
  
    $scope.onSortClick = (sort) => {
        console.log(sort)
        $scope.selectedsort = sort;
        localStorage.setItem('selectedSort', sort);
        let url =
            `${$scope.url}/${$scope.selectedfilterstring}?sort=${sort}`;
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


    $scope.getAttributeValues = (attrkey) => {

        if (attrkey != '') {
            var index = -1;

            index = $scope.filters.findIndex(v => {
                return v.attributekey == attrkey
            })

            if (index > -1) {
                $scope.attributekey = attrkey
                $scope.attributevaluesList = $scope.filters[index].attributevalues;
            }



        }



    }

    $scope.applyFilter = () => {
        let url =
            `${$scope.url}/${$scope.filterstringforsort}?sort=${$scope.selectedsort}`;
        window.location.assign(url)

    }



})