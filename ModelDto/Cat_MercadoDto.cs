using Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ModelDto
{
    public class Cat_MercadoDto
    {
        public long Id { get; set; }
        public string Nombre { get; set; }
        public string Clave { get; set; }

        public static Cat_MercadoDto FromModel(Cat_Mercado model)
        {
            return new Cat_MercadoDto()
            {
                Id = model.Id,
                Nombre = model.Nombre,
                Clave = model.Clave,
            };
        }

        public Cat_Mercado ToModel()
        {
            return new Cat_Mercado()
            {
                Id = Id,
                Nombre = Nombre,
                Clave = Clave,
            };
        }
    }
}
