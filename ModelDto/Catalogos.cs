using ApiComm;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Utils;

namespace ModelDto
{
    public class Catalogos
    {
        public static List<Cat_MercadoDto> Mercado(string ApiName, bool Filtro, string Url, string Method)
        {
            var lista = Generic<Cat_MercadoDto>(ApiName, Url, Method);
            if (Filtro)
                lista.Add(new Cat_MercadoDto
                {
                    Id = 0,
                    Nombre = "Todos"
                });
            lista = lista.OrderBy(item => item.Id).ToList();
            return lista;
        }

        public static List<Ctrl_ClienteDto> Clientes(string ApiName, bool Filtro, string Url, string Method)
        {
            var lista = Generic<Ctrl_ClienteDto>(ApiName, Url, Method);
            if (Filtro)
                lista.Add(new Ctrl_ClienteDto
                {
                    Id = 0,
                    Nombre = "Todos"
                });
            lista = lista.OrderBy(item => item.Id).ToList();
            return lista;
        }

        public static List<Ctrl_DireccionclienteDto> Direccion(string ApiName, bool Filtro, string Url, string Method, long Id)
        {
            var listaDatabase = GenericData<Ctrl_DireccionclienteDto>(ApiName, Url, Method, Id);
            listaDatabase = listaDatabase.OrderBy(item => item.Id).ToList();
            var lista = new List<Ctrl_DireccionclienteDto>();
            lista.AddRange(listaDatabase);
            return lista;
        }

        public static List<Ctrl_TelefonoClienteDto> Telefono(string ApiName, bool Filtro, string Url, string Method, long Id)
        {
            var listaDatabase = GenericData<Ctrl_TelefonoClienteDto>(ApiName, Url, Method, Id);
            listaDatabase = listaDatabase.OrderBy(item => item.Id).ToList();
            var lista = new List<Ctrl_TelefonoClienteDto>();
            lista.AddRange(listaDatabase);
            return lista;
        }

        public static List<Ctrl_ContactoDto> Contacto(string ApiName, bool Filtro, string Url, string Method, long Id)
        {
            var listaDatabase = GenericData<Ctrl_ContactoDto>(ApiName, Url, Method, Id);
            listaDatabase = listaDatabase.OrderBy(item => item.Id).ToList();
            var lista = new List<Ctrl_ContactoDto>();
            lista.AddRange(listaDatabase);
            return lista;
        }


        private static List<T> Generic<T>(string endpointCatalogo, string url, string Method)
        {
            var apiResponse = RestUtility.CallService<GenericResponse>($"{url}/api/{endpointCatalogo}", string.Empty, null, Method) as GenericResponse;
            if (apiResponse == null) throw new Exception("Error");
            if (!apiResponse.Success) return new List<T>();
            return apiResponse.Data.JToObject<List<T>>();
        }

        private static List<T> GenericData<T>(string endpointCatalogo, string url, string Method, long Id)
        {
            var apiResponse = RestUtility.CallService<GenericResponse>($"{url}/api/{endpointCatalogo}", string.Empty, null, Method, new { Id = Id }) as GenericResponse;
            if (apiResponse == null) throw new Exception("Error");
            if (!apiResponse.Success) return new List<T>();
            return apiResponse.Data.JToObject<List<T>>();
        }
    }
}
