var table = null;

$(document).ready(function () {
    $("#formBuscadorCliente").on("submit",
        function (e) {
            e.preventDefault();
            EjecutarBusqueda();
        });

    $(".body-content").on("click",
        ".btnEditar",
        function () {
            var $this = $(this);
            var tr = $this.parents("tr");
            var data = table.row(tr).data();
            LoadViewWithModel(DetalleCliente, data);
        });

    $("#btnRegistrar").on("click",
        function () {
            LoadViewWithModel(DetalleCliente, { Id: 0 });
        });


    EjecutarBusqueda();
});

function EjecutarBusqueda() {
    var request = $("#formBuscadorCliente").FormAsJSON();
    GetResponse(BuscarCliente,
        request,
        function (out) {
            if (out.Success) {
                if (out.Data != undefined) {
                    $(".containerGridBuscador").show();
                    var columnsGrid =
                        [
                            { data: "Nombre" },
                            { data: "Rfc" },
                            { data: "Pais", "width": "5%" },
                            { data: "Email", "width": "5%" },
                            { data: "IdMercado", "width": "5%" },
                            { data: "Id", "bSortable": false, "width": "15%" }
                        ];
                    table = $("#gridBuscador").DataTable({
                        'paging': true, // Table pagination
                        'ordering': true, // Column ordering
                        'info': true, // Bottom left status text
                        responsive: false,
                        scrollX: true,
                        lengthChange: false,
                        dom: "Bfrtip",
                        "aaSorting": [],

                        destroy: true,
                        columns: columnsGrid,
                        // Footer de la tabla de lista de cliente
                        language: {
                            "lengthMenu": "Mostrando _MENU_ registros por página",
                            "zeroRecords": "Sin información",
                            "info": "Mostrando registros _START_ a _END_ de _TOTAL_",
                            "infoEmpty": "Sin información",
                            "search": "<em class='fas fa-search'></em>",
                            "searchPlaceholder": "Buscar...",
                            "paginate": {
                                "first": "Primero",
                                "last": "Último",
                                "next": "Siguiente",
                                "previous": "Anterior"
                            },
                        },
                        createdRow: function (row, data, index) {
                            var htmlBtn =
                                '<div class="form-group text-center"><button type="button" class="btn btn-success btn-sm btnEditar" data-toggle="tooltip" data-placement="left" title="Editar/Detalles">Editar</button>';
                            htmlBtn = `${htmlBtn}</div>`;
                            $("td", row).eq(5).html(htmlBtn);
                        }
                    });
                    table.clear();
                    table.rows.add(out.Data).draw();
                    table.responsive.recalc();
                    table.responsive.rebuild();
                } else {
                    table = null;
                    $("#gridBuscador tbody").empty();
                    $(".containerGridBuscador").hide();
                }

            } else {
                table = null;
                $("#gridBuscador tbody").empty();
                $(".containerGridBuscador").hide();

            }
        });
}