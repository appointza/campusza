using Microsoft.AspNetCore.Mvc;
using Campusza.Services;
using Campusza.Utils;
using Campusza.ViewModels;
using Campusza.Models;
using Amazon.Util.Internal.PlatformServices;


namespace Campusza.ViewComponents
{
    public class AppHeaderViewComponent : ViewComponent
    {
        private RequestState _requestState;
        
        public AppHeaderViewComponent(RequestState requestState)
        {
            _requestState = requestState;
           
        }
        public async Task<IViewComponentResult> InvokeAsync()
        {
            AppHeaderViewModel data = new AppHeaderViewModel();
           
            return View(data);
        }
    }
}
