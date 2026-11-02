using Campusza.Services.Campusza;
using Campusza.Utils;
using Xunit;

namespace Campusza.Tests;

public class SchoolRoomValidationTests
{
    [Fact]
    public void Grid_requires_both_dimensions_or_neither()
    {
        var ex = Assert.Throws<AppException>(() =>
            SchoolRoomTenant.ValidateGridDimensions(30, 5, null));
        Assert.Equal(AppException.ErrorCodes.BadRequest, ex.code);
    }

    [Fact]
    public void Grid_smaller_than_capacity_is_allowed_for_optional_exam_layout()
    {
        SchoolRoomTenant.ValidateGridDimensions(30, 5, 5);
    }

    [Fact]
    public void Grid_cannot_exceed_capacity()
    {
        var ex = Assert.Throws<AppException>(() =>
            SchoolRoomTenant.ValidateGridDimensions(30, 6, 6));
        Assert.Contains("exceed", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Valid_grid_at_capacity()
    {
        SchoolRoomTenant.ValidateGridDimensions(30, 5, 6);
    }

    [Fact]
    public void Capacity_must_be_positive()
    {
        var ex = Assert.Throws<AppException>(() =>
            SchoolRoomTenant.ValidateGridDimensions(0, null, null));
        Assert.Equal(AppException.ErrorCodes.BadRequest, ex.code);
    }
}

public class SchoolRoomApiAliasTests
{
    [Fact]
    public void ExamRoom_and_SchoolRoom_controllers_share_service_type()
    {
        var school = typeof(Campusza.Controllers.Campusza.SchoolRoomController);
        var exam = typeof(Campusza.Controllers.Campusza.ExamRoomController);
        Assert.Equal(
            school.GetConstructors()[0].GetParameters()[0].ParameterType,
            exam.GetConstructors()[0].GetParameters()[0].ParameterType);
    }
}
