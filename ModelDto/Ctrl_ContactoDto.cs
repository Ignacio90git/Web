using Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ModelDto
{
    public class Ctrl_ContactoDto
    {
        public long Id { get; set; }
        public long? IdCliente { get; set; }
        public string Nombre { get; set; }
        public string Puesto { get; set; }
        public string Email { get; set; }
        public string Telefono { get; set; }

        public List<Ctrl_ClienteDto> Ctrl_ClienteList { get; set; }
        public Ctrl_ClienteDto Ctrl_Cliente { get; set; }

        public static Ctrl_ContactoDto FromModel(Ctrl_Contacto model)
        {
            return new Ctrl_ContactoDto()
            {
                Id = model.Id,
                IdCliente = model.IdCliente,
                Nombre = model.Nombre,
                Puesto = model.Puesto,
                Email = model.Email,
                Telefono = model.Telefono,
            };
        }

        public Ctrl_Contacto ToModel()
        {
            return new Ctrl_Contacto()
            {
                Id = Id,
                IdCliente = IdCliente,
                Nombre = Nombre,
                Puesto = Puesto,
                Email = Email,
                Telefono = Telefono,
            };
        }
    }
}
