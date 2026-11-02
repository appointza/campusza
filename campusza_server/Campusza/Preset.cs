
using Campusza.Services;
using System.Text;

namespace Campusza
{
    public class Preset
    {
        public async Task Start(WebApplication app)
        {
            using (var scope = app.Services.CreateScope())
            {
                Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
                
            }
        }
    }
}
