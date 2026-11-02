using System.Data.Common;

namespace Campusza.Utils
{
    public interface IDb: IDisposable
    {
        Task Connect();
        Task Close();
        Task BeginTransaction();
        Task CommitTransaction();
        Task RollbackTransaction();
        DbCommand GetCommand(string query);
        DbCommand GetCommand();
        DbParameter AddParameter(DbCommand command, string parameterName, DbTypes.Types type);
        Task<DbDataReader> Execute(DbCommand command);
        Task<int> ExecuteNonQuery(DbCommand command); 
    }
}
