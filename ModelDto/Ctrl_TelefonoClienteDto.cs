using Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ModelDto
{
    public class Ctrl_TelefonoClienteDto
    {
        public long Id { get; set; }
        public long IdCliente { get; set; }
        public string Telefono { get; set; }

        public static Ctrl_TelefonoClienteDto FromModel(Ctrl_TelefonoCliente model)
        {
            return new Ctrl_TelefonoClienteDto()
            {
                Id = model.Id,
                IdCliente = model.IdCliente,
                Telefono = model.Telefono,
            };
        }

        public Ctrl_TelefonoCliente ToModel()
        {
            return new Ctrl_TelefonoCliente()
            {
                Id = Id,
                IdCliente = IdCliente,
                Telefono = Telefono,
            };
        }
    }
}
