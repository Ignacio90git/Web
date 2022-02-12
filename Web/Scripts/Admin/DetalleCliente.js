
$(document).ready(function () {
    BuildDireccion();
    BuildTelefono();
    BuildContacto()

    $("#tablePhone_filter").attr("style", "display: none;");
    $("#tableAddress_filter").attr("style", "display: none;");
    $("#tableContac_filter").attr("style", "display: none;");

    $("#formDetalleCliente").on("submit",
        function (e) {
            e.preventDefault();
            var form = $(this);
            var jsonForm = form.FormAsJSON();

            var request = jsonForm;

            GetResponse(CrearCliente,
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
            location.href = "Cliente";
        });

    $("#btnSaveCliente").on("click",
        function () {
            var request = $("#formDetalleCliente").FormAsJSON();
            GetResponse(CrearCliente, request,
                function (out) {
                    if (out.Success) {
                        location.href = "Cliente";
                    } else {

                    }
                });
        });

    $("#btnSaveDirecciones").on("click",
        function (e) {
            e.preventDefault();
            var request = $("#formDetalleDireccion").FormAsJSON();
            if (request.Id <= 0) {
                if (modelJson.Ctrl_DireccionclienteList == null) {
                    modelJson.Ctrl_DireccionclienteList = [];
                }
                if (request.Id <= 0) {
                    request.Id = modelJson.Ctrl_DireccionclienteList.length + 1;
                    modelJson.Ctrl_DireccionclienteList.push(request);

                } else {
                    var objIndex = modelJson.Ctrl_DireccionclienteList.findIndex(obj => obj.Id == request.Id);
                    modelJson.Ctrl_DireccionclienteList[objIndex] = request;

                }
                ReloadTable(modelJson.Ctrl_DireccionclienteList);
            } else {
                GetResponse(CrearDireccion,
                    request,
                    function (out) {
                        if (out.Success) {

                            ReloadTable(out.Data);
                        } else {

                        }
                    });
            }
        });

    $("#btnSaveTelefono").on("click",
        function (e) {
            e.preventDefault();
            var request = $("#formDetalleTelefono").FormAsJSON();
            if (request.Id <= 0) {
                if (modelJson.Ctrl_TelefonoClienteList == null) {
                    modelJson.Ctrl_TelefonoClienteList = [];
                }
                if (request.Id <= 0) {
                    request.Id = modelJson.Ctrl_TelefonoClienteList.length + 1;
                    modelJson.Ctrl_TelefonoClienteList.push(request);

                } else {
                    var objIndex = modelJson.Ctrl_TelefonoClienteList.findIndex(obj => obj.Id == request.Id);
                    modelJson.Ctrl_TelefonoClienteList[objIndex] = request;

                }
                ReloadTablePhone(modelJson.Ctrl_TelefonoClienteList);
            } else {
                GetResponse(CrearDireccion,
                    request,
                    function (out) {
                        if (out.Success) {

                            ReloadTablePhone(out.Data);
                        } else {

                        }
                    });
            }
        });

    $("#btnSaveContacto").on("click",
        function (e) {
            e.preventDefault();
            var request = $("#formDetalleContacto").FormAsJSON();
            if (request.Id <= 0) {
                if (modelJson.Ctrl_ContactoList == null) {
                    modelJson.Ctrl_ContactoList = [];
                }
                if (request.Id <= 0) {
                    request.Id = modelJson.Ctrl_ContactoList.length + 1;
                    modelJson.Ctrl_ContactoList.push(request);

                } else {
                    var objIndex = modelJson.Ctrl_ContactoList.findIndex(obj => obj.Id == request.Id);
                    modelJson.Ctrl_ContactoList[objIndex] = request;

                }
                ReloadTableContac(modelJson.Ctrl_ContactoList);
            } else {
                GetResponse(CrearDireccion,
                    request,
                    function (out) {
                        if (out.Success) {

                            ReloadTableContac(out.Data);
                        } else {

                        }
                    });
            }
        });

});

function BuildTelefono() {
    var columnsGrid =
        [
            { data: "Telefono" }
        ];
    tablePhone = $("#tablePhone").DataTable({
        'paging': false, // Table pagination
        'ordering': false, // Column ordering
        'info': false, // Bottom left status text
        'search': false,
        responsive: false,
        scrollX: true,
        lengthChange: false,
        dom: "Bfrtip",
        "aaSorting": [],
        buttons: [],
        destroy: true,
        columns: columnsGrid,
        language: {
            "lengthMenu": "Mostrando _MENU_ registros por página",
            "zeroRecords": "Sin información",
            "info": "Mostrando registros _START_ a _END_ de _TOTAL_",
            "infoEmpty": "Sin información",
        },
    });
    tablePhone.clear();
    if (modelJson.Ctrl_TelefonoClienteList != null) {
        tablePhone.rows.add(modelJson.Ctrl_TelefonoClienteList).draw();
    }
    tablePhone.responsive.recalc();
    tablePhone.responsive.rebuild();
}

function ReloadTablePhone(telefono) {
    debugger;
    modelJson.Ctrl_TelefonoClienteList = telefono;
    tablePhone.clear();
    tablePhone.rows.add(modelJson.Ctrl_TelefonoClienteList).draw();
    tablePhone.responsive.recalc();
    tablePhone.responsive.rebuild();
};

function BuildDireccion() {
    var columnsGrid =
        [
            { data: "Direccion" },
            { data: "CodigoPostal" }
        ];
    tableAddress = $("#tableAddress").DataTable({
        'paging': false, // Table pagination
        'ordering': false, // Column ordering
        'info': false, // Bottom left status text
        'search': false,
        responsive: false,
        scrollX: true,
        lengthChange: false,
        dom: "Bfrtip",
        "aaSorting": [],
        buttons: [],
        destroy: true,
        columns: columnsGrid,
        language: {
            "lengthMenu": "Mostrando _MENU_ registros por página",
            "zeroRecords": "Sin información",
            "info": "Mostrando registros _START_ a _END_ de _TOTAL_",
            "infoEmpty": "Sin información",
        },

    });
    tableAddress.clear();
    if (modelJson.Ctrl_DireccionclienteList != null) {
        tableAddress.rows.add(modelJson.Ctrl_DireccionclienteList).draw();
    }
    tableAddress.responsive.recalc();
    tableAddress.responsive.rebuild();
}

function ReloadTable(direcciones) {
    modelJson.Ctrl_DireccionclienteList = direcciones;
    tableAddress.clear();
    tableAddress.rows.add(modelJson.Ctrl_DireccionclienteList).draw();
    tableAddress.responsive.recalc();
    tableAddress.responsive.rebuild();
};

function BuildContacto() {
    var columnsGridContac =
        [
            { data: "Nombre" },
            { data: "Puesto" },
            { data: "Email" },
            { data: "Telefono" }
        ];
    tableContac = $("#tableContac").DataTable({
        'paging': false, // Table pagination
        'ordering': false, // Column ordering
        'info': false, // Bottom left status text
        'search': false,
        responsive: false,
        scrollX: true,
        lengthChange: false,
        dom: "Bfrtip",
        "aaSorting": [],
        buttons: [],
        destroy: true,
        columns: columnsGridContac,
        language: {
            "lengthMenu": "Mostrando _MENU_ registros por página",
            "zeroRecords": "Sin información",
            "info": "Mostrando registros _START_ a _END_ de _TOTAL_",
            "infoEmpty": "Sin información",
        },

    });
    tableContac.clear();
    if (modelJson.Ctrl_ContactoList != null) {
        tableContac.rows.add(modelJson.Ctrl_ContactoList).draw();
    }
    tableContac.responsive.recalc();
    tableContac.responsive.rebuild();
}

function ReloadTableContac(contac) {
    modelJson.Ctrl_ContactoList = contac;
    tableContac.clear();
    tableContac.rows.add(modelJson.Ctrl_ContactoList).draw();
    tableContac.responsive.recalc();
    tableContac.responsive.rebuild();
};