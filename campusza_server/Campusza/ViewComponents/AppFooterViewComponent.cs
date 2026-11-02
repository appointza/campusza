using Microsoft.AspNetCore.Mvc;
using Campusza.Models;
using Campusza.Services;
using Campusza.Utils;
using Campusza.ViewModels;

namespace Campusza.ViewComponents
{
    public class AppFooterViewComponent : ViewComponent
    {

        RequestState requeststate;
        public AppFooterViewComponent( RequestState requeststate)
        {
            this.requeststate = requeststate;
        }
        public async Task<IViewComponentResult> InvokeAsync()
        {
            AppFooterViewModel data = new AppFooterViewModel();
            
            return View(data);
        }
    }
}
