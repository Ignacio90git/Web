using System;
using System.Security.Cryptography;
using System.Text;

namespace Utils
{
    public class HashWithSaltResult
    {
        public HashWithSaltResult(string salt, string digest)
        {
            Salt = salt;
            Digest = digest;
        }

        public string Salt { get; }


        public string Digest { get; set; }
    }

    public class Rng
    {

        public string GenerateRandomCryptographicKey(int keyLength)
        {
            return Convert.ToBase64String(GenerateRandomCryptographicBytes(keyLength));
        }


        public byte[] GenerateRandomCryptographicBytes(int keyLength)
        {
            var rngCryptoServiceProvider = new RNGCryptoServiceProvider();
            var randomBytes = new byte[keyLength];
            rngCryptoServiceProvider.GetBytes(randomBytes);
            return randomBytes;
        }
    }

    public class PasswordWithSaltHasher
    {

        public HashWithSaltResult HashWithSalt(string password, int saltLength, HashAlgorithm hashAlgo)
        {
            var rng = new Rng();
            var salt = rng.GenerateRandomCryptographicKey(saltLength);
            var saltBytes = Encoding.UTF8.GetBytes(salt);
            var passwordWithSalt = password + salt;
            var passwordWithSaltBytes = Encoding.UTF8.GetBytes(passwordWithSalt);
            var digestBytes = hashAlgo.ComputeHash(passwordWithSaltBytes);
            return new HashWithSaltResult(Convert.ToBase64String(saltBytes), Convert.ToBase64String(digestBytes));
        }
    }
}