using Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ModelDto
{
    public class Ctrl_DireccionclienteDto
    {
        public long Id { get; set; }
        public long IdCliente { get; set; }
        public string Direccion { get; set; }
        public string CodigoPostal { get; set; }
        public string Contacto { get; set; }

        public static Ctrl_DireccionclienteDto FromModel(Ctrl_Direccioncliente model)
        {
            return new Ctrl_DireccionclienteDto()
            {
                Id = model.Id,
                IdCliente = model.IdCliente,
                Direccion = model.Direccion,
                CodigoPostal = model.CodigoPostal,
                Contacto = model.Contacto,
            };
        }

        public Ctrl_Direccioncliente ToModel()
        {
            return new Ctrl_Direccioncliente()
            {
                Id = Id,
                IdCliente = IdCliente,
                Direccion = Direccion,
                CodigoPostal = CodigoPostal,
                Contacto = Contacto,
            };
        }

    }
}
