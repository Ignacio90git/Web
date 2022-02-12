
namespace Utils
{
    public class GenericResponse
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = null;
        public object Data { get; set; } = null;
        public string ViewRedirection { get; set; } = "";
    }
}