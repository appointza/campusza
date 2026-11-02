using System.Data.Common;

namespace Campusza.Utils
{
    public interface IQueryBuilderProvider
    {
        IQueryBuilder GetQueryBuilder(string queryString);
    }

    public class QueryBuilderProvider : IQueryBuilderProvider
    {
        public IQueryBuilder GetQueryBuilder(String queryString)
        {
            return new QueryBuilder(queryString);
        }
    }

    public interface IQueryBuilder
    {
        void AddOrderBy(QueryBuilder.Order order, string orderby);
        void AddGroupBy(string groupBy);

        void AddParameter(string columnName, string operatorSymbol, string parameterName, object parameterValue, DbTypes.Types parameterType);
        void AddParameter(String conditionString, String parameterName, object parameterValue, DbTypes.Types parameterType);
        DbCommand GetCommand(IDb db);
        void AddLimitOffset(long limit, long offset);
    }

    public class QueryBuilder : IQueryBuilder
    {
        private String _queryString;
        private String? _orderBy;
        private String? _order;
        private String _groupBy;
        private long _limit;
        private long _offset;
        private List<Parameter> _parameterList = new List<Parameter>();
        public QueryBuilder(String queryString)
        {
            _queryString = queryString;
        }
        public void AddParameter(String columnName, String operatorSymbol, String parameterName, object parameterValue, DbTypes.Types parameterType)
        {
            Parameter parameter = new Parameter();
            parameter.ConditionString = $"{ columnName} { operatorSymbol} @{ parameterName}";
            parameter.ParameterName = parameterName;
            parameter.ParameterValue = parameterValue;
            parameter.ParameterType = parameterType;
            _parameterList.Add(parameter);
        }
        public void AddParameter(String conditionString, String parameterName, object parameterValue, DbTypes.Types parameterType)
        {
            Parameter parameter = new Parameter();
            parameter.ConditionString = conditionString;
            parameter.ParameterName = parameterName;
            parameter.ParameterValue = parameterValue;
            parameter.ParameterType = parameterType;
            _parameterList.Add(parameter);
        }
        public void AddOrderBy(Order order, String orderby)
        {
            _orderBy = orderby;
            _order = order.ToString();
        }
        public void AddGroupBy(String groupby)
        {
            _groupBy = groupby;
        }
        public void AddLimitOffset(long limit, long offset)
        {
            _limit = limit;
            _offset = offset;
        }
        public DbCommand GetCommand(IDb db)
        {
            DbCommand command = db.GetCommand();

            bool isFirstElement = true;
            _parameterList.ForEach(e =>
            {
                if (isFirstElement)
                {
                    isFirstElement = false;
                    _queryString += $@" WHERE {e.ConditionString} ";
                }
                else
                {
                    _queryString += $@" AND {e.ConditionString} ";
                }
                db.AddParameter(command, e.ParameterName, e.ParameterType).Value = e.ParameterValue;
            });

            
            if (!(String.IsNullOrEmpty(_groupBy)))
            {
                _queryString += $" GROUP BY {_groupBy} ";
            }

            if (!(String.IsNullOrEmpty(_order) && String.IsNullOrEmpty(_orderBy)))
            {
                _queryString += $" ORDER BY {_orderBy} {_order} ";
            }

            if (_limit > 0)
            {
                _queryString += $" LIMIT {_limit}  OFFSET {_offset} ";
            }

            command.CommandText = _queryString;
            return command;
        }
        public class Parameter
        {
            public string ConditionString { get; set; }
            public String ParameterName { get; set; }
            public object ParameterValue { get; set; }
            public DbTypes.Types ParameterType { get; set; }
        }
        public enum Order
        {
            ASC,
            DESC
        }
    }
}
