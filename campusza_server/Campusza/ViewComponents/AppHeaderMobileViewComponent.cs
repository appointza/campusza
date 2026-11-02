using Microsoft.AspNetCore.Mvc;
using Campusza.Models;
using Campusza.Services;
using Campusza.Utils;
using Campusza.ViewModels;

namespace Campusza.ViewComponents
{
    public class AppHeaderMobileViewComponent : ViewComponent
    {
        private RequestState _requestState;
        
        public AppHeaderMobileViewComponent(RequestState requestState)
        {
            _requestState = requestState;
            
        }
        public async Task<IViewComponentResult> InvokeAsync()
        {
            AppHeaderMobileViewModel data = new AppHeaderMobileViewModel();
            
            return View(data);
        }
    }
}
