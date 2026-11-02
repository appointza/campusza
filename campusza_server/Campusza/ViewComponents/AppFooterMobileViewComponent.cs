using Microsoft.AspNetCore.Mvc;
using Campusza.Models;
using Campusza.Services;
using Campusza.Utils;
using Campusza.ViewModels;

namespace Campusza.ViewComponents
{
    public class AppFooterMobileViewComponent : ViewComponent
    {
        RequestState requeststate;
        public AppFooterMobileViewComponent(RequestState requeststate)
        {
            this.requeststate = requeststate;
           
        }
        public async Task<IViewComponentResult> InvokeAsync()
        {
            AppFooterMobileViewModel data = new AppFooterMobileViewModel();
            

            return View(data);
        }
    }
}
