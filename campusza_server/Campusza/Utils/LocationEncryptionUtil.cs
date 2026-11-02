using System.Security.Cryptography;
using System.Text;

namespace Campusza.Utils
{
    public static class LocationEncryptionUtil
    {
        private static readonly string SECRET_KEY = "AppointzaSecretKey2024"; // Should match client secret

        /// <summary>
        /// Encode location ID for template URL using HMAC-SHA256
        /// </summary>
        public static string EncodeLocationId(long locationId)
        {
            try
            {
                var locationString = locationId.ToString();
                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                var dataToSign = $"{locationString}:{timestamp}";
                
                var hmac = GenerateHmacSha256(SECRET_KEY, dataToSign);
                var encodedData = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{dataToSign}:{hmac}"));
                
                return encodedData;
            }
            catch (Exception)
            {
                // Fallback to simple base64 encoding
                return Convert.ToBase64String(Encoding.UTF8.GetBytes(locationId.ToString()));
            }
        }

        /// <summary>
        /// Decode location ID from template URL
        /// </summary>
        public static long DecodeLocationId(string encodedId)
        {
            try
            {
                Console.WriteLine($"Decoding encrypted ID: {encodedId}");
                var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encodedId));
                Console.WriteLine($"Decoded string: {decoded}");
                
                // Check if it's in the new format: LOC_25_1757198044038
                if (decoded.StartsWith("LOC_"))
                {
                    var parts = decoded.Split('_');
                    Console.WriteLine($"Split parts count: {parts.Length}");
                    
                    if (parts.Length == 3 && parts[0] == "LOC")
                    {
                        var locationString = parts[1];
                        var timestampString = parts[2];
                        
                        Console.WriteLine($"Location: {locationString}, Timestamp: {timestampString}");
                        
                        if (long.TryParse(locationString, out var locationId) && 
                            long.TryParse(timestampString, out var timestamp))
                        {
                            // Check if timestamp is not too old (24 hours)
                            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                            var maxAge = 24 * 60 * 60 * 1000; // 24 hours
                            var age = now - timestamp;
                            
                            Console.WriteLine($"Current time: {now}, Timestamp: {timestamp}, Age: {age}ms, Max age: {maxAge}ms");
                            
                            if (age <= maxAge)
                            {
                                Console.WriteLine($"Successfully decoded location ID: {locationId}");
                                return locationId;
                            }
                            else
                            {
                                Console.WriteLine("URL has expired");
                                return 0;
                            }
                        }
                        else
                        {
                            Console.WriteLine("Failed to parse location or timestamp");
                        }
                    }
                    else
                    {
                        Console.WriteLine("Invalid LOC format");
                    }
                }
                else
                {
                    Console.WriteLine("Not in LOC format, trying fallback");
                }
                
                // Fallback to simple base64 decoding
                Console.WriteLine("Trying fallback to simple base64 decoding");
                if (long.TryParse(decoded, out var fallbackId))
                {
                    Console.WriteLine($"Fallback successful, location ID: {fallbackId}");
                    return fallbackId;
                }
                
                Console.WriteLine("All decoding methods failed");
                return 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception during decoding: {ex.Message}");
                return 0;
            }
        }

        /// <summary>
        /// Generate HMAC-SHA256 hash
        /// </summary>
        private static string GenerateHmacSha256(string key, string data)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var dataBytes = Encoding.UTF8.GetBytes(data);
            
            using (var hmac = new HMACSHA256(keyBytes))
            {
                var hashBytes = hmac.ComputeHash(dataBytes);
                var sb = new StringBuilder();
                foreach (byte b in hashBytes)
                {
                    sb.Append(b.ToString("x2"));
                }
                return sb.ToString();
            }
        }

        /// <summary>
        /// Simple base64 encoding for backward compatibility
        /// </summary>
        public static string EncodeLocationIdSimple(long locationId)
        {
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(locationId.ToString()));
        }

        /// <summary>
        /// Simple base64 decoding for backward compatibility
        /// </summary>
        public static long DecodeLocationIdSimple(string encodedId)
        {
            try
            {
                var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encodedId));
                return long.TryParse(decoded, out var id) ? id : 0;
            }
            catch
            {
                return 0;
            }
        }
    }
}
