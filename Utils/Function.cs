using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;


namespace Utils
{
    public static class Function
    {
        public static ActionResult ToJsonResult(this object obj)
        {
            var content = new ContentResult
            {
                Content = JsonConvert.SerializeObject(obj),
                ContentType = "application/json"
            };
            return content;
        }

        //public static HashWithSaltResult GeneratePassword(string plainText)
        //{
        //    var pwHasher = new PasswordWithSaltHasher();
        //    var hashResultSha512 = pwHasher.HashWithSalt(plainText, 64, SHA512.Create());
        //    return hashResultSha512;
        //}

    }
}
