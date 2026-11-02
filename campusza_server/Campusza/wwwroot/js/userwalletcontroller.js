Campuszaapp.controller(
    "UserWalletController",
    function UserWalletController($scope, $http, $window) {

        $scope.transactionlist = internal_transactionlist
        $scope.orderlist = []
        $scope.activeCollapse = -1; // Initialize to -1 (none open)




        const UserWalletTransactionReferenceTypes = {
            Order: 'Order',
            OrderGroup: 'OrderGroup'
        }


        //href = "/user/OrderDetails/{{transaction.referenceid}}"

        $scope.getOrdersOrRoute = async (transaction, index) => {
            $scope.orderlist = []
            if (transaction.referencetype == UserWalletTransactionReferenceTypes.OrderGroup) {

                if ($scope.activeCollapse === index) {
                    $scope.activeCollapse = -1; // Close the active one
                } else {
                    $scope.activeCollapse = index; // Open the clicked one
                }

                let ordereq = {
                    id: 0,
                    customerid: 0,
                    groupid: transaction.referenceid,
                    paymentgroupid: 0,
                    parentid: 0,
                    type: 0,
                    refundid: 0
                }



                let postdata = {
                    item: ordereq
                }
                let resp = await $http({
                    method: 'POST',
                    url: `/api/Orders/Select`,
                    headers: {
                        'Content-Type': "application/json"
                    },
                    data: JSON.stringify(postdata)

                });
                $scope.orderlist = resp.data.item
                $scope.$applyAsync()

            } else {

                var orderGroupReferenceId = transaction.referenceid;
                var url = '/user/OrderDetails/' + orderGroupReferenceId;
                $window.location.href = url;

            }



        }


        $scope.convertToFormattedLocalTime = function (utcDate) {
            if (!utcDate) return '';

            var localTime = new Date(utcDate);
            // Adjust for IST (Indian Standard Time) offset: +5 hours and 30 minutes
            localTime.setHours(localTime.getHours() + 5);
            localTime.setMinutes(localTime.getMinutes() + 30);

            var formattedTime = localTime.toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });

            return formattedTime;
        };
    }

);
