using Amazon.Runtime.Internal;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using Microsoft.Net.Http.Headers;
using Campusza.Models;
using Campusza.Services;

namespace Campusza.Utils
{
    public class RequestState
    {
        private readonly IHttpContextAccessor _accessor;
        private ApplicationEnvironment _applicationEnvironment;
        private String _dbConnectionString;
        ILogger<RequestState> _logger;
        public RequestState(IHttpContextAccessor accessor, IOptions<ApplicationEnvironment> applicationEnvironment, ILogger<RequestState> logger)
        {
            _accessor = accessor;
            _applicationEnvironment = applicationEnvironment.Value;
            _logger = logger;
        }
        public async Task<String> GetDBConnectionString()
        {
            if (_dbConnectionString == null)
            {
                _dbConnectionString = _applicationEnvironment.postgresqlconnection;
            }

            return _dbConnectionString;
        }
        public void SetUserContext(UsersContext usercontext)
        {
            _accessor.HttpContext.Items["usercontext"] = usercontext;
        }
        private UsersContext _usercontext { get; set; }
        public UsersContext usercontext
        {
            get
            {
                if (_usercontext == null)
                {
                    UsersContext? result = null;
                    try
                    {
                        result = (UsersContext)_accessor.HttpContext.Items["usercontext"];
                    }
                    catch (Exception e)
                    {
                        _logger.LogInformation(e.Message);
                        _logger.LogInformation(e.StackTrace ?? string.Empty);
                    }
                    if (result != null)
                    {
                        _usercontext = result;

                    }
                    else
                    {
                        _usercontext = new UsersContext { userid = -1 };
                    }
                }
                return _usercontext;

            }
        }

        public bool? _ismobile = null;
        public bool ismobile
        {
            get
            {
                if (_ismobile == null)
                {
                    _ismobile = false;
                    try
                    {
                        var userAgent = _accessor.HttpContext.Request.Headers[HeaderNames.UserAgent].ToString();
                        string[] mobileKeywords = { "Mobile", "Android", "iPhone", "iPad" };

                        foreach (var keyword in mobileKeywords)
                        {
                            if (userAgent.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                            {
                                _ismobile = true;
                            }
                        }
                    }
                    catch (Exception e)
                    {
                        _logger.LogInformation(e.Message);
                        _logger.LogInformation(e.StackTrace ?? string.Empty);
                    }
                }
                return (bool)_ismobile;
            }
        }
        public String GetBaseUrl()
        {
            return $"{_accessor.HttpContext.Request.Scheme}://{_accessor.HttpContext.Request.Host}";
        }

        private string? _useragent = null;
        private string useragent
        {
            get
            {
                if (_useragent == null)
                {
                    _useragent = "";
                    try
                    {
                        HttpContext context = _accessor.HttpContext;

                        // Check if HttpContext is not null to avoid null reference exceptions
                        if (context != null)
                        {
                            IQueryCollection queryParams = context.Request.Query;

                            // Access specific query parameters by key
                            if (queryParams.ContainsKey("useragent"))
                            {
                                StringValues paramValues = queryParams["useragent"];
                                string firstParamValue = paramValues.FirstOrDefault();

                                // Use firstParamValue as needed
                                _useragent = firstParamValue;
                            }
                        }

                    }
                    catch (Exception e)
                    {
                        _logger.LogInformation(e.Message);
                        _logger.LogInformation(e.StackTrace ?? string.Empty);
                    }
                }
                return _useragent;
            }
        }
    }
}
