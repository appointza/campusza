using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    internal static class ExamDbReader
    {
        internal static TimeSpan ReadTimeSpan(DbDataReader reader, string column)
        {
            var value = reader[column];
            if (value == DBNull.Value || value == null)
                return TimeSpan.Zero;
            if (value is TimeSpan ts)
                return ts;
            if (value is DateTime dt)
                return dt.TimeOfDay;
            if (value is TimeOnly t)
                return t.ToTimeSpan();
            if (TimeSpan.TryParse(Convert.ToString(value, CultureInfo.InvariantCulture), CultureInfo.InvariantCulture, out var parsed))
                return parsed;
            return TimeSpan.Zero;
        }

        internal static string ReadOptionalString(DbDataReader reader, string column, string fallback = "")
        {
            try
            {
                var ordinal = reader.GetOrdinal(column);
                if (reader.IsDBNull(ordinal))
                    return fallback;
                return reader.GetString(ordinal);
            }
            catch (IndexOutOfRangeException)
            {
                return fallback;
            }
        }
    }
}
