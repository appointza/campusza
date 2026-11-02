namespace Campusza.Utils
{
    public interface IDbProvider
    {
        public Task<IDb> GetDb(String? connectionString = null);
    }
}
