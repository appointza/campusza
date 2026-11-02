namespace Campusza.Utils
{
    public class DbException : Exception
    {
        public Codes Code { get; set; }

        public DbException(Codes code) : base(code.ToString())
        {
            Code = code;
        }

        public DbException(Codes code, string message) : base(message)
        {
            Code = code;
        }

        public enum Codes
        {
            ConnectionStringNotFound,
            ConnectionNotOpened,
            TransactionNotBegun,
            ConnectionLost

        }

    }
}
