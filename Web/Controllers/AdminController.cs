using ApiComm;
using ModelDto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using Utils;

namespace Web.Controllers
{
    public class AdminController : Controller
    {
        // GET: Admin
        #region Cliente
        public ActionResult Cliente()
        {
            var model = new Ctrl_ClienteDto();
            Task.WaitAll(new List<Task>
            {
                Task.Factory.StartNew(() =>
                {

                    model.MercadoList = Catalogos.Mercado("mercado", false, "http://localhost:58828", "GET");
                }),
            }.ToArray());
            return View("Cliente", model);
        }

        public async Task<ActionResult> BuscarCliente(Ctrl_ClienteDto model)
        {
            var response = new GenericResponse();
            try
            {
                var apiResponse = await RestUtility.CallServiceAsync<GenericResponse>($"http://localhost:58828//api/read", string.Empty, model, "POST", null) as GenericResponse;
                if (apiResponse == null) throw new Exception("Error");
                response = apiResponse;
                if (apiResponse.Success) apiResponse.Data = apiResponse.Data.JToObject<List<Ctrl_ClienteDto>>();
            }
            catch (Exception ex)
            {
                var message = ex.ToString();
                response.Success = false;
                response.Message = message;
                response.Data = null;
            }
            return response.ToJsonResult();
        }

        public ActionResult DetalleCliente(long Id)
        {
            var model = new Ctrl_ClienteDto
            {
                MercadoList = new List<Cat_MercadoDto>(),
            };
            if (Id > 0)
            {
                var apiResponse = RestUtility.CallService<GenericResponse>($"http://localhost:58828//api/detail", string.Empty, null, "GET", new { Id }) as GenericResponse;
                if (apiResponse == null) throw new Exception("Error");
                if (!apiResponse.Success) return apiResponse.ToJsonResult();
                model = apiResponse.Data.JToObject<Ctrl_ClienteDto>();

            }
            Task.WaitAll(new List<Task>
            {
                Task.Factory.StartNew(() =>
                {
                    model.MercadoList = Catalogos.Mercado("mercado", false, "http://localhost:58828", "GET");
                    model.Ctrl_Direccioncliente =  model.Ctrl_Direccioncliente;
                    model.Ctrl_DireccionclienteList = Catalogos.Direccion("direccion", false, "http://localhost:58828", "GET", model.Id);
                    model.Ctrl_TelefonoCliente = model.Ctrl_TelefonoCliente;
                    model.Ctrl_TelefonoClienteList = Catalogos.Telefono("telefono", false, "http://localhost:58828", "GET", model.Id);
                    model.Ctrl_Contacto = model.Ctrl_Contacto;
                    model.Ctrl_ContactoList = Catalogos.Contacto("contacto", false, "http://localhost:58828", "GET", model.Id);
                }),
            }.ToArray());

            return View("DetalleCliente", model);
        }


        public async Task<ActionResult> CrearCliente(Ctrl_ClienteDto model)
        {
            var response = new GenericResponse();
            try
            {
                var apiResponse = await RestUtility.CallServiceAsync<GenericResponse>(model.Id <= 0 ? $"http://localhost:58828/api/create" : $"http://localhost:58828/api/update",
                    string.Empty, model, "POST", null) as GenericResponse;
                if (apiResponse == null)
                {
                    throw new Exception("Error");
                }
                response = apiResponse;
            }
            catch (Exception ex)
            {
                var message = "";
                response.Success = false;
                response.Message = message;
                response.Data = null;
            }

            return response.ToJsonResult();
        }

        #endregion

        public ActionResult DetalleClienteDireccion(Ctrl_DireccionclienteDto model)
        {
            return PartialView("_DireccionCliente", model);
        }

        public async Task<ActionResult> CrearModificarDireccion(Ctrl_ClienteDto model)
        {
            var response = new GenericResponse();
            try
            {
                var apiResponse = await RestUtility.CallServiceAsync<GenericResponse>($"http://localhost:58828/api/saveDireccion",
                    string.Empty, model, "Post", null) as GenericResponse;
                if (apiResponse == null)
                {
                    throw new Exception("Error");
                }
                if (apiResponse.Success)
                {
                    apiResponse.Data = apiResponse.Data.JToObject<List<Ctrl_DireccionclienteDto>>();
                }
                response = apiResponse;
            }
            catch (Exception ex)
            {
                var message = "";
                response.Success = false;
                response.Message = message;
                response.Data = null;
            }

            return response.ToJsonResult();
        }

        #region CONTACTO
        public ActionResult Contacto()
        {
            var model = new Ctrl_ContactoDto();
            return View("Contacto", model);
        }

        public async Task<ActionResult> BuscarContacto(Ctrl_ContactoDto model)
        {
            var response = new GenericResponse();
            try
            {
                var apiResponse = await RestUtility.CallServiceAsync<GenericResponse>($"http://localhost:58828//api/readContacto", string.Empty, model, "POST", null) as GenericResponse;
                if (apiResponse == null) throw new Exception("Error");
                response = apiResponse;
                if (apiResponse.Success) apiResponse.Data = apiResponse.Data.JToObject<List<Ctrl_ContactoDto>>();
            }
            catch (Exception ex)
            {
                var message = ex.ToString();
                response.Success = false;
                response.Message = message;
                response.Data = null;
            }
            return response.ToJsonResult();
        }

        public ActionResult DetalleContacto(long Id)
        {
            var model = new Ctrl_ContactoDto();

            if (Id > 0)
            {
                var apiResponse = RestUtility.CallService<GenericResponse>($"http://localhost:58828//api/detailContacto", string.Empty, null, "GET", new { Id }) as GenericResponse;
                if (apiResponse == null) throw new Exception("Error");
                if (!apiResponse.Success) return apiResponse.ToJsonResult();
                model = apiResponse.Data.JToObject<Ctrl_ContactoDto>();

            }
            Task.WaitAll(new List<Task>
            {
                Task.Factory.StartNew(() =>
                {
                    model.Ctrl_ClienteList = Catalogos.Clientes("clientes", false, "http://localhost:58828", "GET");
                }),
            }.ToArray());

            return View("DetalleContacto", model);
        }

        public async Task<ActionResult> CrearContacto(Ctrl_ContactoDto model)
        {
            var response = new GenericResponse();
            try
            {
                var apiResponse = await RestUtility.CallServiceAsync<GenericResponse>(model.Id <= 0 ? $"http://localhost:58828/api/createContacto" : $"http://localhost:58828/api/updateContacto",
                    string.Empty, model, "POST", null) as GenericResponse;
                if (apiResponse == null)
                {
                    throw new Exception("Error");
                }
                response = apiResponse;
            }
            catch (Exception ex)
            {
                var message = "";
                response.Success = false;
                response.Message = message;
                response.Data = null;
            }

            return response.ToJsonResult();
        }
        #endregion

    }
}