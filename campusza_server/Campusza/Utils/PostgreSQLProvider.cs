
namespace Campusza.Utils
{
    public class PostgreSQLProvider : IDbProvider
    {
        private string _connectionString;
        private RequestState _requestState;
        public PostgreSQLProvider(IConfiguration configuration, RequestState requestState)
        {
            _requestState = requestState;   
        }
        public async Task<IDb> GetDb(String? connectionString = null)
        {
            var environmentConnectionString = await _requestState.GetDBConnectionString();
            if (environmentConnectionString != null)
                _connectionString = environmentConnectionString;
            IDb db;
            try
            {
                if (connectionString == null)
                {
                    db = new PostgreSQL(_connectionString);
                }
                else
                {
                    db = new PostgreSQL(connectionString);
                }
            }
            catch (Exception)
            {

                throw;
            }
            return db;
        }
    }
}
