Campuszaapp.directive("patternCustom", function () {
    return {
        require: "ngModel",
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$validators.patternCustom = function (modelValue, viewValue) {
                console.log(attrs.patternCustom);
                if (ctrl.$isEmpty(modelValue)) {
                    // consider empty models to be valid
                    return true;
                }

                let value = viewValue;
                let pattern = new RegExp(attrs.patternCustom);
                let isValid = pattern.test(value);

                if (isValid) {
                    // it is valid
                    return true;
                }

                // it is invalid
                return false;
            };
        },
    };
});
