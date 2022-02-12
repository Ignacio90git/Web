using Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ModelDto
{
    public class Ctrl_ClienteDto
    {
        public long Id { get; set; }
        public string Nombre { get; set; }
        public string Rfc { get; set; }
        public string Pais { get; set; }
        public string Email { get; set; }
        public long IdMercado { get; set; }

        public List<Cat_MercadoDto> MercadoList { get; set; }

        public List<Ctrl_DireccionclienteDto> Ctrl_DireccionclienteList { get; set; }
        public Ctrl_DireccionclienteDto Ctrl_Direccioncliente { get; set; }

        public List<Ctrl_TelefonoClienteDto> Ctrl_TelefonoClienteList { get; set; }
        public Ctrl_TelefonoClienteDto Ctrl_TelefonoCliente { get; set; }

        public List<Ctrl_ContactoDto> Ctrl_ContactoList { get; set; }
        public Ctrl_ContactoDto Ctrl_Contacto { get; set; }


        public static Ctrl_ClienteDto FromModel(Ctrl_Cliente model)
        {
            var Ctrl_ClienteDto = new Ctrl_ClienteDto()
            {
                Id = model.Id,
                Nombre = model.Nombre,
                Rfc = model.Rfc,
                Pais = model.Pais,
                Email = model.Email,
                IdMercado = model.IdMercado
            };


            return Ctrl_ClienteDto;
        }

        public Ctrl_Cliente ToModel()
        {
            return new Ctrl_Cliente()
            {
                Id = Id,
                Nombre = Nombre,
                Rfc = Rfc,
                Pais = Pais,
                Email = Email,
                IdMercado = IdMercado,
            };
        }
    }
}
