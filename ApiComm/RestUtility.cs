using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Utils;

namespace ApiComm
{
    public class RestUtility
    {
        public static async Task<object> CallServiceAsync<T>(string url, string operation, object requestBodyObject, string ApiMethod, object parameters = null)
            where T : class
        {
            // Initialize an HttpWebRequest for the current URL.
            try
            {
                if (parameters != null)
                    switch (parameters)
                    {
                        case string sParameters:
                            url += $"?{sParameters}";
                            break;
                        case Dictionary<string, string> dParameters:
                            url += $"?{string.Join("&", dParameters.Select(param => $"{param.Key}={param.Value}"))}";
                            break;
                        default:
                            url += $"?{parameters.ToQueryString()}";
                            break;
                    }

                var webReq = (HttpWebRequest)WebRequest.Create(url);
                webReq.Method = ApiMethod;
                webReq.Accept = "application/json";
                webReq.Timeout = 30 * 60 * 1000;

                //Add key to header if operation is supplied
                if (!string.IsNullOrEmpty(operation)) webReq.Headers["Operation"] = operation;

                //Serialize request object as JSON and write to request body
                if (requestBodyObject != null)
                {
                    var requestBody = JsonConvert.SerializeObject(requestBodyObject);
                    var bytes = Encoding.UTF8.GetBytes(requestBody);
                    webReq.ContentLength = bytes.Length;
                    webReq.ContentType = "application/json";
                    using (var streamWriter = webReq.GetRequestStream())
                    {
                        streamWriter.Write(bytes, 0, bytes.Length);
                    }
                }

                var response = await webReq.GetResponseAsync();

                if (response == null) return default;

                var streamReader = new StreamReader(response.GetResponseStream());

                var responseContent = streamReader.ReadToEnd().Trim();

                var jsonObject = JsonConvert.DeserializeObject<T>(responseContent);

                return jsonObject;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public static object CallService<T>(string url, string operation, object requestBodyObject, string ApiMethod, object parameters = null)
            where T : class
        {
            // Initialize an HttpWebRequest for the current URL.
            HttpWebRequest webReq = null;
            try
            {
                if (parameters != null)
                {
                    switch (parameters)
                    {
                        case string sParameters:
                            url += $"?{sParameters}";
                            break;
                        case Dictionary<string, string> dParameters:
                            url += $"?{string.Join("&", dParameters.Select(param => $"{param.Key}={param.Value}"))}";
                            break;
                        default:
                            url += $"?{parameters.ToQueryString()}";
                            break;
                    }

                    url = Uri.EscapeUriString(url);
                }

                webReq = (HttpWebRequest)WebRequest.Create(url);
                webReq.Method = ApiMethod;
                webReq.Accept = "application/json";
                webReq.Timeout = 30 * 60 * 1000;

                //Add key to header if operation is supplied
                if (!string.IsNullOrEmpty(operation)) webReq.Headers["Operation"] = operation;

                //Serialize request object as JSON and write to request body
                if (requestBodyObject != null)
                {
                    var requestBody = JsonConvert.SerializeObject(requestBodyObject);
                    webReq.ContentLength = requestBody.Length;
                    webReq.ContentType = "application/json";
                    var streamWriter = new StreamWriter(webReq.GetRequestStream(), Encoding.ASCII);
                    streamWriter.Write(requestBody);
                    streamWriter.Close();
                }

                var response = webReq.GetResponse();

                if (response == null) return default;

                var streamReader = new StreamReader(response.GetResponseStream());

                var responseContent = streamReader.ReadToEnd().Trim();

                var jsonObject = JsonConvert.DeserializeObject<T>(responseContent);

                return jsonObject;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

    }
}