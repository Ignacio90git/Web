using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Runtime.Serialization;
using System.Web.Script.Serialization;

namespace Utils
{
    public static class Extensions
    {
        public static Dictionary<string, object> ToPropertyDictionary(this object o, bool includeLists = true)
        {
            var props = o.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance)
                         .Where(p => !Attribute.IsDefined(p, typeof(IgnoreDataMemberAttribute))).ToList();
            props = props.Where(p => includeLists || !p.PropertyType.IsGenericList()).ToList();
            return props.ToDictionary
            (
                p => p.Name,
                p => p.GetValue(o)
            );
        }

        public static string ToQueryString(this object o)
        {
            var arrayProps = o.ToPropertyDictionary(false)
                              .Where(e => e.Value != null)
                              .Select
                              (
                                  e =>
                                      $"{e.Key}={(e.Value is DateTime || (e.Value as DateTime?).HasValue ? e.Value?.ToString() : Uri.EscapeDataString(e.Value?.ToString()))}"
                              ).ToList();
            return string.Join("&", arrayProps);
        }

        public static T JToObject<T>(this object value)
        {
            var result = default(T);
            if (value == null)
            {
                return result;
            }

            switch (value)
            {
                case JObject jObject:
                    result = jObject.ToObject<T>(new JsonSerializer { NullValueHandling = NullValueHandling.Ignore });
                    break;
                case JArray array:
                    result = array.ToObject<T>(new JsonSerializer { NullValueHandling = NullValueHandling.Ignore });
                    break;
                default:
                    result = (T)value;
                    break;
            }

            try
            {
                var props = new List<PropertyInfo>(result.GetType().GetProperties());
                var resultObject = props.JToObject(result);
                result = (T)resultObject;
            }
#pragma warning disable 168
            catch (Exception ex)
#pragma warning restore 168
            {
                // ignored
            }

            return result;
        }

        public static object JToObject(this List<PropertyInfo> objectProperties, object value)
        {
            if (objectProperties != null && objectProperties.Count > 0)
            {
                if (objectProperties.Any(propertyInfo =>
                    propertyInfo.PropertyType == typeof(JObject) || propertyInfo.PropertyType == typeof(JArray) ||
                    propertyInfo.IsNonStringEnumerable()))
                {
                    foreach (var propertyInfo in objectProperties)
                    {
                        if (propertyInfo.IsNonStringEnumerable())
                        {
                            var a = (IList)propertyInfo.GetValue(value, null);
                            if (a == null)
                            {
                                continue;
                            }

                            for (var i = 0; i < a.Count; i++)
                            {
                                var itemList = a[i];
                                var innerValue = "";
                                switch (itemList)
                                {
                                    case JObject jObject:
                                        innerValue = jObject.ToString();
                                        break;
                                    case JArray array:
                                        innerValue = array.ToString();
                                        break;
                                }

                                if (string.IsNullOrEmpty(innerValue))
                                {
                                    continue;
                                }

                                var serializer = new JavaScriptSerializer();
                                var jsonObject = serializer.Deserialize<dynamic>(innerValue);
                                a[i] = (object)jsonObject;
                            }
                        }

                        object innerObject = null;
                        if (propertyInfo.PropertyType == typeof(JObject))
                        {
                            var innerValue = ((JObject)propertyInfo.GetValue(value, null)).ToString();
                            var serializer = new JavaScriptSerializer();
                            var jsonObject = serializer.Deserialize<dynamic>(innerValue);
                            innerObject = (object)jsonObject;
                        }

                        if (propertyInfo.PropertyType == typeof(JArray))
                        {
                            var innerValue = ((JArray)propertyInfo.GetValue(value, null)).ToString();
                            var serializer = new JavaScriptSerializer();
                            var jsonObject = serializer.Deserialize<dynamic>(innerValue);
                            innerObject = (object)jsonObject;
                        }

                        if (innerObject != null)
                        {
                            var props = new List<PropertyInfo>(innerObject.GetType().GetProperties());
                            innerObject = props.JToObject(innerObject);
                            propertyInfo.SetValue(value, innerObject);
                        }
                    }
                }
            }

            return value;
        }

        public static bool IsNonStringEnumerable(this PropertyInfo pi)
        {
            return pi != null && pi.PropertyType.IsNonStringEnumerable();
        }

        public static bool IsNonStringEnumerable(this Type type)
        {
            if (type == null || type == typeof(string))
            {
                return false;
            }

            return typeof(IEnumerable).IsAssignableFrom(type);
        }

        public static bool IsGenericList(this Type type)
        {
            return type.Name.Contains("List`1") || !type.IsGenericType && type.GetInterface("IList`1") != null;
        }

    }
}