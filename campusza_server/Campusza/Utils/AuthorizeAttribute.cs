
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Campusza.Models;

namespace Campusza.Utils
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class AuthorizeAttribute : Attribute, IAuthorizationFilter
    {
        //private List<UserRoles> _roleList { get; set; }
        public AuthorizeAttribute(
            //UserRoles[] roleList
            )
        {
            //_roleList = roleList.ToList();

        }
        public void OnAuthorization(AuthorizationFilterContext context)
        {

            //var user = (Users)context.HttpContext.Items["User"];
            //if (user == null)
            //{
            //    context.Result = new JsonResult(new { message = "Unauthorized" }) { StatusCode = StatusCodes.Status401Unauthorized };
            //    return;
            //}

            //Boolean allowAccess = false;
            //_roleList.ForEach(role => {
            //    switch (role)
            //    {
            //        case UserRoles.Customer:
            //            if (user.iscustomer)
            //            {
            //                allowAccess = true;
            //            }
            //            break;
            //        case UserRoles.System:
            //            if (user.issystem)
            //            {
            //                allowAccess = true;
            //            }
            //            break;
            //        case UserRoles.Vendor:
            //            if (user.isvendor)
            //            {
            //                allowAccess = true;
            //            }
            //            break;

            //        default:
            //            break;
            //    }
            //});
            //if (allowAccess == false)
            //{
            //    context.Result = new JsonResult(new { message = "Forbidden" }) { StatusCode = StatusCodes.Status403Forbidden };
            //    return;
            //}
        }
        //public Boolean MatchPermission(
        //     )
        //{
        //    Boolean result = false;
        //    try
        //    {
        //        //PeopleFacilityPermissionMap peopleFacilityPermissionMap = new PeopleFacilityPermissionMap();
        //        //if (_facilityUid.Length > 0)
        //        //{
        //        //    var temp = facilityPermissionMapList.Find(e => e.facility_uid.Equals(_facilityUid));
        //        //    if (temp != null)
        //        //    {
        //        //        peopleFacilityPermissionMap = temp;
        //        //    }
        //        //}
        //        //else if (facilityPermissionMapList.Count > 0)
        //        //{
        //        //    peopleFacilityPermissionMap = facilityPermissionMapList[0];
        //        //}
        //        //if (peopleFacilityPermissionMap.permissions > 0)
        //        //{
        //        //    var permissionBinaryString = Convert.ToString(peopleFacilityPermissionMap.permissions, 2);
        //        //    switch (_permissionCheckMode)
        //        //    {
        //        //        case PeoplePermissionCheckMode.Some:
        //        //            result = _permissionList.Any(e => int.Parse(permissionBinaryString[(int)e].ToString()) == 1);
        //        //            break;
        //        //        case PeoplePermissionCheckMode.Every:
        //        //            result = _permissionList.All(e => int.Parse(permissionBinaryString[(int)e].ToString()) == 1);
        //        //            break;
        //        //        default:
        //        //            break;
        //        //    }
        //        //}

        //    }
        //    catch (Exception)
        //    {

        //        throw;
        //    }
        //    return result;
        //}
    }
}
