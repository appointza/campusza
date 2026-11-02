using System.Security.Cryptography;
using System.Text;

namespace Campusza.Utils
{
    public class CustomCryptography
    {
        public string CalculateSHA256Hash(string input)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] inputBytes = Encoding.UTF8.GetBytes(input);
                byte[] hashBytes = sha256.ComputeHash(inputBytes);

                StringBuilder builder = new StringBuilder();
                foreach (byte b in hashBytes)
                {
                    builder.Append(b.ToString("x2")); // Convert byte to hexadecimal representation
                }

                return builder.ToString();
            }
        }
        public byte[] CalculateHmacSha256Binary(string key, string data)
        {
            byte[] keyBytes = Encoding.UTF8.GetBytes(key);
            byte[] dataBytes = Encoding.UTF8.GetBytes(data);
            using (HMACSHA256 hmac = new HMACSHA256(keyBytes))
            {
                var bytes = hmac.ComputeHash(dataBytes);
                return bytes;
            }
        }
        public string CalculateHmacSha256(string key, string data)
        {
            // Convert the key and data to byte arrays
            byte[] keyBytes = Encoding.UTF8.GetBytes(key);
            byte[] dataBytes = Encoding.UTF8.GetBytes(data);

            // Create an instance of HMACSHA256
            using (HMACSHA256 hmac = new HMACSHA256(keyBytes))
            {
                // Compute the hash of the data
                byte[] hashBytes = hmac.ComputeHash(dataBytes);

                // Convert the hash to a hexadecimal string
                StringBuilder sb = new StringBuilder();
                foreach (byte b in hashBytes)
                {
                    sb.Append(b.ToString("x2"));
                }

                return sb.ToString();
            }
        }
        public string EncodeBase64(string data)
        {
            byte[] originalBytes = System.Text.Encoding.UTF8.GetBytes(data);
            string base64String = Convert.ToBase64String(originalBytes);
            return base64String;
        }
        public string EncodeBase64(byte[] data)
        {
            string base64String = Convert.ToBase64String(data);
            return base64String;
        }
        public string DecodeBase64(string data)
        {
            byte[] base64Bytes = Convert.FromBase64String(data);
            string decodedString = System.Text.Encoding.UTF8.GetString(base64Bytes);
            return decodedString;
        }
    }
}
