using System;
using System.Collections.Generic;
using System.Linq;
using Utils;
using ModelDto;
using Model;
using System.Configuration;
using System.Web.Http;

namespace API.Controllers
{
    public class AdminController : ApiController
    {
        // GET: Admin
        #region Cliente
        [HttpPost]
        [Route("api/read")]
        public GenericResponse ClienteRead(Ctrl_ClienteDto model)
        {
            var mResponse = new GenericResponse();
            try
            {
                using (var context = new MinsaitBDEntities())
                {
                    // var listaObj = new List<VEmpeladosWeb>();
                    // var Nombre = model.Nombre == null ? "" : model.Nombre;
                    // listaObj = context.VEmpeladosWeb.Where(item =>
                    //     (string.IsNullOrEmpty(Nombre) || item.Nombre.Contains(Nombre))
                    //    && (model.IdDepartamento == 0 || item.IdDepartamento == model.IdDepartamento)
                    //).ToList();

                    var listaObj = new List<Ctrl_Cliente>();
                    var Nombre = model.Nombre == null ? "" : model.Nombre;
                    var pais = model.Pais == null ? "" : model.Pais;
                    listaObj = context.Ctrl_Cliente.Where(item =>
                        (string.IsNullOrEmpty(Nombre) || item.Nombre.Contains(Nombre)) && (string.IsNullOrEmpty(pais) || item.Nombre.Contains(pais))

                   ).ToList();

                    mResponse.Data = listaObj.AsEnumerable().Select(Ctrl_ClienteDto.FromModel).OrderByDescending(item => item.Nombre).ToList();
                }
            }
            catch (Exception ex)
            {
                mResponse.Success = false;
                mResponse.Message = ex.ToString();
                mResponse.Data = null;
            }

            return mResponse;
        }

        [HttpGet]
        [Route("api/detail")]
        public GenericResponse ClienteDetail(long Id)
        {
            var mResponse = new GenericResponse();
            try
            {
                Ctrl_ClienteDto cliente;
                using (var context = new MinsaitBDEntities())
                {
                    var listaEntities = context.Ctrl_Cliente.Find(Id);
                    if (listaEntities == null) throw new Exception("Error");
                    cliente = Ctrl_ClienteDto.FromModel(listaEntities);
                }

                mResponse.Data = cliente;
            }
            catch (Exception ex)
            {
                mResponse.Success = false;
                mResponse.Message = ex.ToString();
                mResponse.Data = null;
            }

            return mResponse;
        }

        [HttpPost]
        [Route("api/create")]
        public GenericResponse ClienteCreate(Ctrl_ClienteDto clienteDto)
        {
            var mResponse = new GenericResponse();
            try
            {
                using (var context = new MinsaitBDEntities())
                {
                    var exists = context.Ctrl_Cliente.Any(entityItem =>
                        entityItem.Nombre.Equals(clienteDto.Nombre, StringComparison.OrdinalIgnoreCase));
                    if (exists)
                        throw new Exception($"El cliente con nombre {clienteDto.Nombre} ya se encuentra registrado");
                    var cliente = clienteDto.ToModel();
                    context.Ctrl_Cliente.Add(cliente);
                    using (var transaction = context.Database.BeginTransaction())
                    {
                        try
                        {
                            context.SaveChanges();
                            transaction.Commit();
                            mResponse.Message = "Ok";
                            mResponse.Data = cliente.Id;
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                //log
                mResponse.Success = false;
                mResponse.Message = "";
                mResponse.Data = null;
            }
            return mResponse;
        }

        [HttpPost]
        [Route("api/update")]
        public GenericResponse ClienteUpdate(Ctrl_ClienteDto clienteDto)
        {
            var mResponse = new GenericResponse();
            try
            {
                using (var context = new MinsaitBDEntities())
                {
                    var existente = context.Ctrl_Cliente.Find(clienteDto.Id);
                    var dtoBefore = Ctrl_ClienteDto.FromModel(existente);
                    var dtoAfter = clienteDto;
                    if (existente == null) throw new Exception("Ya existe");
                    var updated = clienteDto.ToModel();
                    context.Entry(existente).CurrentValues.SetValues(updated);
                    using (var transaction = context.Database.BeginTransaction())
                    {
                        try
                        {
                            context.SaveChanges();
                            transaction.Commit();
                            mResponse.Message = "Se actualizo correcto";
                            mResponse.Data = existente.Id;
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                mResponse.Success = false;
                mResponse.Message = "";
                mResponse.Data = null;
            }
            return mResponse;
        }
        #endregion

        [HttpPost]
        [Route("api/saveDireccion")]
        public GenericResponse DireccionCreate(Ctrl_ClienteDto clienteDto)
        {
            var mResponse = new GenericResponse();
            try
            {
                var direccion = new Ctrl_DireccionclienteDto();
                var telefono = new Ctrl_TelefonoClienteDto();
                var contacto = new Ctrl_ContactoDto();
                using (var context = new MinsaitBDEntities())
                {
                    if (clienteDto.Ctrl_Direccioncliente != null)
                    {
                        direccion.CodigoPostal = clienteDto.Ctrl_Direccioncliente.CodigoPostal;
                        direccion.Direccion = clienteDto.Ctrl_Direccioncliente.Direccion;
                        direccion.IdCliente = clienteDto.Id;
                        direccion.Contacto = "";
                        var dir = direccion.ToModel();
                        context.Ctrl_Direccioncliente.Add(dir);
                        using (var transaction = context.Database.BeginTransaction())
                        {
                            try
                            {

                                context.SaveChanges();
                                transaction.Commit();
                                var listaEntities = context.Ctrl_Direccioncliente.Where(w => w.IdCliente == clienteDto.Id);
                                var listaObj = listaEntities.AsEnumerable().Select(Ctrl_DireccionclienteDto.FromModel).ToList();
                                mResponse.Message = "Ok";
                                mResponse.Data = listaObj;
                            }
                            catch (Exception ex)
                            {
                                transaction.Rollback();
                                throw;
                            }
                        }
                    }
                    else if (clienteDto.Ctrl_TelefonoCliente != null)
                    {
                        telefono.IdCliente = clienteDto.Id;
                        telefono.Telefono = clienteDto.Ctrl_TelefonoCliente.Telefono;
                        var tel = telefono.ToModel();
                        context.Ctrl_TelefonoCliente.Add(tel);
                        using (var transaction = context.Database.BeginTransaction())
                        {
                            try
                            {
                                context.SaveChanges();
                                transaction.Commit();
                                var listaEntities = context.Ctrl_TelefonoCliente.Where(w => w.IdCliente == clienteDto.Id);
                                var listaObj = listaEntities.AsEnumerable().Select(Ctrl_TelefonoClienteDto.FromModel).ToList();
                                mResponse.Message = "Ok";
                                mResponse.Data = listaObj;
                            }
                            catch (Exception ex)
                            {
                                transaction.Rollback();
                                throw;
                            }
                        }
                    }
                    else if (clienteDto.Ctrl_Contacto != null)
                    {
                        contacto.IdCliente = clienteDto.Id;
                        contacto.Nombre = clienteDto.Ctrl_Contacto.Nombre;
                        contacto.Puesto = clienteDto.Ctrl_Contacto.Puesto;
                        contacto.Email = clienteDto.Ctrl_Contacto.Email;
                        contacto.Telefono = clienteDto.Ctrl_Contacto.Telefono;
                        var con = contacto.ToModel();
                        context.Ctrl_Contacto.Add(con);
                        using (var transaction = context.Database.BeginTransaction())
                        {
                            try
                            {
                                context.SaveChanges();
                                transaction.Commit();
                                var listaEntities = context.Ctrl_Contacto.Where(w => w.IdCliente == clienteDto.Id);
                                var listaObj = listaEntities.AsEnumerable().Select(Ctrl_ContactoDto.FromModel).ToList();
                                mResponse.Message = "Ok";
                                mResponse.Data = listaObj;
                            }
                            catch (Exception ex)
                            {
                                transaction.Rollback();
                                throw;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                //log
                mResponse.Success = false;
                mResponse.Message = "";
                mResponse.Data = null;
            }
            return mResponse;
        }


        #region Contacto
        [HttpPost]
        [Route("api/readContacto")]
        public GenericResponse ContactoRead(Ctrl_ContactoDto model)
        {
            var mResponse = new GenericResponse();
            try
            {
                using (var context = new MinsaitBDEntities())
                {
                    var listaObj = new List<Ctrl_Contacto>();
                    var Nombre = model.Nombre == null ? "" : model.Nombre;
                    var Puesto = model.Puesto == null ? "" : model.Puesto;
                    var Email = model.Email == null ? "" : model.Email;
                    listaObj = context.Ctrl_Contacto.Where(item =>
                        (string.IsNullOrEmpty(Nombre) || item.Nombre.Contains(Nombre))
                       && (string.IsNullOrEmpty(Puesto) || item.Nombre.Contains(Puesto))
                           && (string.IsNullOrEmpty(Email) || item.Nombre.Contains(Email))
                   ).ToList();

                    mResponse.Data = listaObj.AsEnumerable().Select(Ctrl_ContactoDto.FromModel).OrderByDescending(item => item.Nombre).ToList();
                }
            }
            catch (Exception ex)
            {
                mResponse.Success = false;
                mResponse.Message = ex.ToString();
                mResponse.Data = null;
            }

            return mResponse;
        }

        [HttpGet]
        [Route("api/detailContacto")]
        public GenericResponse ContactoDetail(long Id)
        {
            var mResponse = new GenericResponse();
            try
            {
                Ctrl_ContactoDto contacto;
                using (var context = new MinsaitBDEntities())
                {
                    var listaEntities = context.Ctrl_Contacto.Find(Id);
                    if (listaEntities == null) throw new Exception("Error");
                    contacto = Ctrl_ContactoDto.FromModel(listaEntities);
                }

                mResponse.Data = contacto;
            }
            catch (Exception ex)
            {
                //log
                mResponse.Success = false;
                mResponse.Message = ex.ToString();
                mResponse.Data = null;
            }

            return mResponse;
        }

        [HttpPost]
        [Route("api/createContacto")]
        public GenericResponse ContactoCreate(Ctrl_ContactoDto model)
        {
            var mResponse = new GenericResponse();
            try
            {
                using (var context = new MinsaitBDEntities())
                {
                    var exists = context.Ctrl_Contacto.Any(entityItem =>
                        entityItem.Nombre.Equals(model.Nombre, StringComparison.OrdinalIgnoreCase));
                    if (exists)
                        throw new Exception($"El empleado con nombre {model.Nombre} ya se encuentra registrado");
                    var contac = model.ToModel();
                    context.Ctrl_Contacto.Add(contac);
                    using (var transaction = context.Database.BeginTransaction())
                    {
                        try
                        {
                            context.SaveChanges();
                            transaction.Commit();
                            mResponse.Message = "Ok";
                            mResponse.Data = contac.Id;
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                //log
                mResponse.Success = false;
                mResponse.Message = "";
                mResponse.Data = null;
            }
            return mResponse;
        }

        [HttpPost]
        [Route("api/updateContacto")]
        public GenericResponse ContactoUpdate(Ctrl_ContactoDto model)
        {
            var mResponse = new GenericResponse();
            try
            {
                using (var context = new MinsaitBDEntities())
                {
                    var existente = context.Ctrl_Contacto.Find(model.Id);
                    var dtoBefore = Ctrl_ContactoDto.FromModel(existente);
                    var dtoAfter = model;
                    if (existente == null) throw new Exception("Ya existe");
                    var updated = model.ToModel();
                    context.Entry(existente).CurrentValues.SetValues(updated);
                    using (var transaction = context.Database.BeginTransaction())
                    {
                        try
                        {
                            context.SaveChanges();
                            transaction.Commit();
                            mResponse.Message = "Se actualizo correcto";
                            mResponse.Data = existente.Id;
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                mResponse.Success = false;
                mResponse.Message = "";
                mResponse.Data = null;
            }
            return mResponse;
        }
        #endregion

        #region CATALOGOS
        [HttpGet]
        [Route("api/mercado")]
        public GenericResponse Mercado()
        {
            string cnstr = ConfigurationManager.ConnectionStrings["MinsaitBDEntities"].ToString();
            var mResponse = new GenericResponse();
            try
            {
                using (var context = new MinsaitBDEntities())
                {
                    mResponse.Data = null;
                    var listaObj = context.Cat_Mercado.Where(w => w.Nombre != "").ToList();
                    if (listaObj != null)
                        mResponse.Data = listaObj.AsEnumerable().Select(Cat_MercadoDto.FromModel).OrderByDescending(item => item.Nombre).ToList();
                }
            }
            catch (Exception ex)
            {
                mResponse.Success = false;
                mResponse.Message = ex.ToString();
                mResponse.Data = null;
            }

            return mResponse;
        }

        [HttpGet]
        [Route("api/direccion")]
        public GenericResponse Direccion(long Id)
        {
            string cnstr = ConfigurationManager.ConnectionStrings["MinsaitBDEntities"].ToString();
            var mResponse = new GenericResponse();
            try
            {
                using (var context = new MinsaitBDEntities())
                {
                    mResponse.Data = null;
                    var listaObj = context.Ctrl_Direccioncliente.Where(w => w.IdCliente == Id).ToList();
                    if (listaObj != null)
                        mResponse.Data = listaObj.AsEnumerable().Select(Ctrl_DireccionclienteDto.FromModel).OrderByDescending(item => item.Direccion).ToList();
                }
            }
            catch (Exception ex)
            {
                mResponse.Success = false;
                mResponse.Message = ex.ToString();
                mResponse.Data = null;
            }

            return mResponse;
        }

        [HttpGet]
        [Route("api/telefono")]
        public GenericResponse Telefono(long Id)
        {
            string cnstr = ConfigurationManager.ConnectionStrings["MinsaitBDEntities"].ToString();
            var mResponse = new GenericResponse();
            try
            {
                using (var context = new MinsaitBDEntities())
                {
                    mResponse.Data = null;
                    var listaObj = context.Ctrl_TelefonoCliente.Where(w => w.IdCliente == Id).ToList();
                    if (listaObj != null)
                        mResponse.Data = listaObj.AsEnumerable().Select(Ctrl_TelefonoClienteDto.FromModel).ToList();
                }
            }
            catch (Exception ex)
            {
                mResponse.Success = false;
                mResponse.Message = ex.ToString();
                mResponse.Data = null;
            }

            return mResponse;
        }

        [HttpGet]
        [Route("api/contacto")]
        public GenericResponse Contacto(long Id)
        {
            string cnstr = ConfigurationManager.ConnectionStrings["MinsaitBDEntities"].ToString();
            var mResponse = new GenericResponse();
            try
            {
                using (var context = new MinsaitBDEntities())
                {
                    mResponse.Data = null;
                    var listaObj = context.Ctrl_Contacto.Where(w => w.IdCliente == Id).ToList();
                    if (listaObj != null)
                        mResponse.Data = listaObj.AsEnumerable().Select(Ctrl_ContactoDto.FromModel).ToList();
                }
            }
            catch (Exception ex)
            {
                mResponse.Success = false;
                mResponse.Message = ex.ToString();
                mResponse.Data = null;
            }

            return mResponse;
        }

        [HttpGet]
        [Route("api/clientes")]
        public GenericResponse Clientes()
        {
            string cnstr = ConfigurationManager.ConnectionStrings["MinsaitBDEntities"].ToString();
            var mResponse = new GenericResponse();
            try
            {
                using (var context = new MinsaitBDEntities())
                {
                    mResponse.Data = null;
                    var listaObj = context.Ctrl_Cliente.Where(w => w.Nombre != "").ToList();
                    if (listaObj != null)
                        mResponse.Data = listaObj.AsEnumerable().Select(Ctrl_ClienteDto.FromModel).ToList();
                }
            }
            catch (Exception ex)
            {
                mResponse.Success = false;
                mResponse.Message = ex.ToString();
                mResponse.Data = null;
            }

            return mResponse;
        }

        #endregion
    }
}