using Npgsql;
using System;
using System.Data.Common;

namespace Campusza.Utils
{

    public class PostgreSQL : IDb
    {
        private string _connectionString;
        private NpgsqlConnection _connection;
        private NpgsqlTransaction _transaction;
        public PostgreSQL(string connectionString)
        {
            _connectionString = EnsureResilientConnectionString(connectionString);
        }

        private static string EnsureResilientConnectionString(string connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString)) return connectionString;
            var parts = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var keys = new HashSet<string>(parts.Select(p => p.Split('=')[0].Trim().ToLowerInvariant()));
            var extras = new List<string>();
            if (!keys.Contains("keepalive")) extras.Add("Keepalive=30");
            if (!keys.Contains("timeout")) extras.Add("Timeout=30");
            if (!keys.Contains("command timeout")) extras.Add("Command Timeout=60");
            return extras.Count == 0 ? connectionString : connectionString.TrimEnd(';') + ";" + string.Join(";", extras);
        }

        private static bool IsConnectionLost(NpgsqlException ex)
        {
            if (ex.InnerException is System.IO.IOException) return true;
            return ex.SqlState is "57P01" or "08006" or "08003" or "08001";
        }

        private async Task ResetConnectionAsync()
        {
            try
            {
                if (_transaction != null)
                {
                    try { await _transaction.DisposeAsync(); } catch { /* ignore */ }
                    _transaction = null;
                }
                if (_connection != null)
                {
                    try { await _connection.DisposeAsync(); } catch { /* ignore */ }
                    _connection = null;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Warning during connection reset: {ex.Message}");
            }
            await Connect();
        }

        private DbCommand RecreateCommand(DbCommand failed)
        {
            var sql = failed.CommandText;
            var parameters = new List<NpgsqlParameter>();
            foreach (NpgsqlParameter p in failed.Parameters)
            {
                parameters.Add(new NpgsqlParameter(p.ParameterName, p.NpgsqlDbType) { Value = p.Value ?? DBNull.Value });
            }
            failed.Dispose();
            var cmd = GetCommand(sql);
            foreach (var p in parameters)
            {
                cmd.Parameters.Add(p);
            }
            return cmd;
        }
        public async Task Connect()
        {
            const int maxRetries = 3;
            const int delayMs = 1000;
            
            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    if (_connectionString == null)
                    {
                        throw new DbException(DbException.Codes.ConnectionStringNotFound);
                    }
                    
                    // Create new connection for each attempt
                    if (_connection != null)
                    {
                        _connection.Dispose();
                    }
                    _connection = new NpgsqlConnection(_connectionString);

                    await _connection.OpenAsync();
                    Console.WriteLine($"✅ Database connection established (attempt {attempt})");
                    return; // Success, exit retry loop
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Database connection attempt {attempt} failed: {ex.Message}");
                    
                    if (attempt == maxRetries)
                    {
                        Console.WriteLine($"❌ All {maxRetries} connection attempts failed");
                        throw;
                    }
                    
                    Console.WriteLine($"⏳ Retrying connection in {delayMs}ms...");
                    await Task.Delay(delayMs);
                }
            }
        }
        public async Task Close()
        {
            try
            {
                if (_connection != null)
                    await _connection.CloseAsync();
            }
            catch (Exception)
            {
                throw;
            }
        }
        public async Task BeginTransaction()
        {
            try
            {
                if (_connection == null)
                {
                    throw new DbException(DbException.Codes.ConnectionNotOpened);
                }
                if (_transaction != null)
                {
                    return;
                }
                _transaction = await _connection.BeginTransactionAsync();
            }
            catch (Exception)
            {
                throw;
            }
        }
        public async Task CommitTransaction()
        {
            try
            {
                if (_transaction == null)
                {
                    throw new DbException(DbException.Codes.TransactionNotBegun);
                }
                await _transaction.CommitAsync();
            }
            catch (Exception)
            {
                throw;
            }
        }
        public async Task RollbackTransaction()
        {
            try
            {
                if (_transaction == null)
                {
                    throw new DbException(DbException.Codes.TransactionNotBegun);
                }
                await _transaction.RollbackAsync();
            }
            catch (ObjectDisposedException)
            {
                // Connection was already disposed, transaction is already rolled back
                // This is a common scenario when connection is forcibly closed
                Console.WriteLine("Transaction already rolled back due to disposed connection");
            }
            catch (Exception ex) when (ex.InnerException is System.Net.Sockets.SocketException)
            {
                // Connection was forcibly closed by remote host
                Console.WriteLine("Transaction rollback skipped due to connection being forcibly closed");
            }
            catch (Exception)
            {
                throw;
            }
        }
        public void Dispose()
        {
            try
            {
                if (_connection != null)
                {
                    // Check if connection is in a valid state before closing
                    if (_connection.State == System.Data.ConnectionState.Open || 
                        _connection.State == System.Data.ConnectionState.Connecting ||
                        _connection.State == System.Data.ConnectionState.Executing)
                    {
                        try
                        {
                            // Cancel any ongoing operations first
                            if (_connection.State == System.Data.ConnectionState.Executing)
                            {
                                // Wait a bit for the operation to complete
                                System.Threading.Thread.Sleep(100);
                            }
                            
                            if (_connection.State != System.Data.ConnectionState.Closed)
                            {
                                _connection.Close();
                            }
                        }
                        catch (Exception ex)
                        {
                            // Log the exception but don't throw it during disposal
                            Console.WriteLine($"Warning: Error closing database connection: {ex.Message}");
                        }
                    }
                    _connection.Dispose();
                }
            }
            catch (Exception ex)
            {
                // Log the exception but don't throw it during disposal
                Console.WriteLine($"Warning: Error disposing database connection: {ex.Message}");
            }
        }
        
        public async Task SafeCloseConnection()
        {
            try
            {
                if (_connection != null && _connection.State != System.Data.ConnectionState.Closed)
                {
                    // If connection is executing, wait for it to complete
                    if (_connection.State == System.Data.ConnectionState.Executing)
                    {
                        // Wait up to 5 seconds for the operation to complete
                        int waitTime = 0;
                        while (_connection.State == System.Data.ConnectionState.Executing && waitTime < 5000)
                        {
                            await Task.Delay(100);
                            waitTime += 100;
                        }
                    }
                    
                    if (_connection.State != System.Data.ConnectionState.Closed)
                    {
                        await _connection.CloseAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Warning: Error safely closing connection: {ex.Message}");
            }
        }
        
        public DbCommand GetCommand(string query)
        {
            DbCommand command = null;
            try
            {
                if (_connection == null)
                {
                    throw new DbException(DbException.Codes.ConnectionNotOpened);
                }
                if (_transaction == null)
                {
                    command = new NpgsqlCommand(query, _connection);
                }
                else
                {
                    command = new NpgsqlCommand(query, _connection, _transaction);
                }
            }
            catch (Exception)
            {

                throw;
            }
            return command;

        }
        public DbCommand GetCommand()
        {
            DbCommand command = null;
            try
            {
                if (_connection == null)
                {
                    throw new DbException(DbException.Codes.ConnectionNotOpened);
                }
                if (_transaction == null)
                {
                    command = new NpgsqlCommand();
                    command.Connection = _connection;
                }
                else
                {
                    command = new NpgsqlCommand();
                    command.Connection = _connection;
                    command.Transaction = _transaction;
                }
            }
            catch (Exception)
            {

                throw;
            }
            return command;

        }
        public DbParameter AddParameter(DbCommand command, string parameterName, DbTypes.Types type)
        {
            DbParameter parameter = null;
            try
            {
                int position = -1;
                NpgsqlParameter pgParameter = null;

                switch (type)
                {
                    case DbTypes.Types.String:
                        pgParameter = new NpgsqlParameter(parameterName, NpgsqlTypes.NpgsqlDbType.Varchar);
                        position = command.Parameters.Add(pgParameter);
                        break;
                    case DbTypes.Types.Boolean:
                        pgParameter = new NpgsqlParameter(parameterName, NpgsqlTypes.NpgsqlDbType.Boolean);
                        position = command.Parameters.Add(pgParameter);
                        break;
                    case DbTypes.Types.Integer:
                        pgParameter = new NpgsqlParameter(parameterName, NpgsqlTypes.NpgsqlDbType.Integer);
                        position = command.Parameters.Add(pgParameter);
                        break;
                    case DbTypes.Types.Long:
                        pgParameter = new NpgsqlParameter(parameterName, NpgsqlTypes.NpgsqlDbType.Bigint);
                        position = command.Parameters.Add(pgParameter);
                        break;
                    case DbTypes.Types.Json:
                        pgParameter = new NpgsqlParameter(parameterName, NpgsqlTypes.NpgsqlDbType.Json);
                        position = command.Parameters.Add(pgParameter);
                        break;
                    case DbTypes.Types.DateTime:
                        pgParameter = new NpgsqlParameter(parameterName, NpgsqlTypes.NpgsqlDbType.Timestamp);
                        position = command.Parameters.Add(pgParameter);
                        break;
                    case DbTypes.Types.Date:
                        pgParameter = new NpgsqlParameter(parameterName, NpgsqlTypes.NpgsqlDbType.Date);
                        position = command.Parameters.Add(pgParameter);
                        break;
                    case DbTypes.Types.Decimal:
                        pgParameter = new NpgsqlParameter(parameterName, NpgsqlTypes.NpgsqlDbType.Numeric);
                        position = command.Parameters.Add(pgParameter);
                        break;
                    case DbTypes.Types.ByteArray:
                        pgParameter = new NpgsqlParameter(parameterName, NpgsqlTypes.NpgsqlDbType.Bytea);
                        position = command.Parameters.Add(pgParameter);
                        break;
                    default:
                        pgParameter = new NpgsqlParameter(parameterName, null);
                        position = command.Parameters.Add(pgParameter);
                        break;
                }
                parameter = command.Parameters[position];
            }
            catch (Exception)
            {

                throw;
            }
            return parameter;

        }
        public async Task<int> ExecuteNonQuery(DbCommand command)
        {
            const int maxAttempts = 2;
            for (int attempt = 1; attempt <= maxAttempts; attempt++)
            {
                try
                {
                    var affectedRowCount = await command.ExecuteNonQueryAsync();
                    command.Dispose();
                    return affectedRowCount;
                }
                catch (NpgsqlException ex) when (IsConnectionLost(ex) && attempt < maxAttempts)
                {
                    Console.WriteLine($"Database connection lost during ExecuteNonQuery (attempt {attempt}): {ex.Message}");
                    command = RecreateCommand(command);
                    await ResetConnectionAsync();
                }
                catch (Exception)
                {
                    command?.Dispose();
                    throw;
                }
            }
            command?.Dispose();
            throw new DbException(DbException.Codes.ConnectionLost, "Database connection was lost. Please try again.");
        }

        public async Task<DbDataReader> Execute(DbCommand command)
        {
            const int maxAttempts = 2;
            for (int attempt = 1; attempt <= maxAttempts; attempt++)
            {
                try
                {
                    return await command.ExecuteReaderAsync();
                }
                catch (NpgsqlException ex) when (IsConnectionLost(ex) && attempt < maxAttempts)
                {
                    Console.WriteLine($"Database connection lost during query execution (attempt {attempt}): {ex.Message}");
                    command = RecreateCommand(command);
                    await ResetConnectionAsync();
                }
                catch (NpgsqlException ex) when (IsConnectionLost(ex))
                {
                    Console.WriteLine($"Database connection lost during query execution: {ex.Message}");
                    command?.Dispose();
                    throw new DbException(DbException.Codes.ConnectionLost, "Database connection was lost. Please try again.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Database query execution failed: {ex.Message}");
                    command?.Dispose();
                    throw;
                }
            }
            command?.Dispose();
            throw new DbException(DbException.Codes.ConnectionLost, "Database connection was lost. Please try again.");
        }
    }
}
