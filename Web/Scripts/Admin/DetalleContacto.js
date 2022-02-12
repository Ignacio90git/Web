
$(document).ready(function () {

    $("#formDetalleContacto").on("submit",
        function (e) {
            e.preventDefault();
            var form = $(this);
            var jsonForm = form.FormAsJSON();

            var request = jsonForm;

            GetResponse(CrearContacto,
                request,
                function (out) {
                    if (out.Success) {
                        location.href = Index;

                    } else {

                    }
                });
        });

    $("#btnReturn").on("click",
        function () {
            location.href = "Contacto";
        });

    $("#btnSaveContacto").on("click",
        function () {
            var request = $("#formDetalleContacto").FormAsJSON();
            GetResponse(CrearContacto, request,
                function (out) {
                    if (out.Success) {
                        location.href = "Contacto";
                    } else {

                    }
                });
        });

});
