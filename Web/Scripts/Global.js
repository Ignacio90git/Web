var formatoFechaPicker = "dd-mm-yyyy";
var formatoFechaHoraPicker = "DD-MM-YYYY HH:mm:ss";
var formatoFechaPickerMoment = formatoFechaPicker.toUpperCase();
var formatoFechaHoraPickerMoment = "DD-MM-YYYY HH:mm:ss";
var formatoFechaModel = "YYYYMMDD";

(function ($) {
    $.fn.FormAsJSON = function (treatCommaAsNumber) {
        if (treatCommaAsNumber === undefined) treatCommaAsNumber = true;
        var formAsArray = $(this).serializeArray();
        $(":disabled[name]", this).each(function () {
            formAsArray.push({ name: this.name, value: $(this).val() });
        });
        var result = {};
        $.each(formAsArray,
            function (i, obj) {
                try {
                    var num = obj.value != null
                        ? (treatCommaAsNumber ? obj.value.replace(/[,]/g, "") : obj.value)
                        : null;
                    var isnum = $.isNumeric(num);
                    if (!(obj.name in result))
                        result[obj.name] = isnum ? num : obj.value;
                } catch (error) {
                    throw (error);
                }
            });
        return result;
    };
}(jQuery));

$.fn.filterByData = function (prop, val) {
    return this.filter(
        function () { return $(this).data(prop) == val; }
    );
}

function ImageToBase64(URL, localStorageVariableName) {
    let image;
    image = new Image();
    image.crossOrigin = 'Anonymous';
    image.addEventListener('load', function () {
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        try {
            localStorage.setItem(localStorageVariableName, canvas.toDataURL('image/png'));
        } catch (err) {
            console.error(err)
        }
    });
    image.src = URL;
}


function HideLoading() {
    $.LoadingOverlay("hide");
}

var isHTML = RegExp.prototype.test.bind(/<(?=.*? .*?\/ ?>|br|hr|input|!--|wbr)[a-z]+.*?>|<([a-z]+).*?<\/\1>/i);

function DoPostNoResponse(vUrl, vJson, showLoading) {
    $.ajax({ //Do an ajax post to the controller
        method: "POST",
        url: vUrl,
        data: vJson,
        beforeSend: function () {
            if (showLoading === true) {
                /*     ShowLoading()*/
            };
        },
        complete: function () {
            if (showLoading === true) {
                /*     HideLoading();*/
            };
        },
        error: function (a, b, c) {
            console.log(a, b, c);
        }
    });
}

function LoadViewWithModel(vUrl, vModelJson) {
    GetResponse(vUrl,
        vModelJson,
        function (out) {
            document.open();
            document.write(out);
            document.close();
        });
}


function GetResponse(vUrl, vJson, callback) {
    $.ajax({
        method: "POST",
        url: vUrl,
        data: vJson,
        success: function (response) {
            try {
                $.each(response,
                    function (n, v) {
                        try {
                            response[n] = jQuery.parseJSON(v);
                            $.each(response[n],
                                function (n2, v2) {
                                    try {
                                        response[n][n2] = jQuery.parseJSON(v2);
                                    } catch (e2) {
                                    }
                                });
                        } catch (e) {
                            $.each(response[n],
                                function (n2, v2) {
                                    try {
                                        response[n][n2] = jQuery.parseJSON(v2);
                                    } catch (e2) {
                                    }
                                });
                        }
                    });
                callback(response);
            } catch (ex) {
                callback(response);
            }
        },
        error: function (a, b, c) {
            console.log(a, b, c);
        }
    });
}

function GetResponseWithOut(vUrl, vJson, callback) {
    $.ajax({
        method: "POST",
        url: vUrl,
        data: vJson,
        success: function (response) {
            try {
                $.each(response,
                    function (n, v) {
                        try {
                            response[n] = jQuery.parseJSON(v);
                            $.each(response[n],
                                function (n2, v2) {
                                    try {
                                        response[n][n2] = jQuery.parseJSON(v2);
                                    } catch (e2) {
                                    }
                                });
                        } catch (e) {
                            $.each(response[n],
                                function (n2, v2) {
                                    try {
                                        response[n][n2] = jQuery.parseJSON(v2);
                                    } catch (e2) {
                                    }
                                });
                        }
                    });
                callback(response);
            } catch (ex) {
                callback(response);
            }
        },
        error: function (a, b, c) {
            console.log(a, b, c);
        }
    });
}


function createCellPos(n) {
    var ordA = "A".charCodeAt(0);
    var ordZ = "Z".charCodeAt(0);
    var len = ordZ - ordA + 1;
    var s = "";

    while (n >= 0) {
        s = String.fromCharCode(n % len + ordA) + s;
        n = Math.floor(n / len) - 1;
    }

    return s;
}

function FormatDTExcelSheet(xlsx) {
    var sheet = xlsx.xl.worksheets["sheet1.xml"];
    // => Se coloca el estilo 22 de DataTables a los titulos del Excel
    // Estilo 22: Bold, blue background
    $("row:first c", sheet).attr("s", "22");

    var lastCol = sheet.getElementsByTagName("col").length - 1;
    var colRange = createCellPos(lastCol) + "1";
    //Has to be done this way to avoid creation of unwanted namespace atributes.
    var afSerializer = new XMLSerializer();
    var xmlString = afSerializer.serializeToString(sheet);
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlString, "text/xml");
    var xlsxFilter = xmlDoc.createElementNS("http://schemas.openxmlformats.org/spreadsheetml/2006/main", "autoFilter");
    var filterAttr = xmlDoc.createAttribute("ref");
    filterAttr.value = "A1:" + colRange;
    xlsxFilter.setAttributeNode(filterAttr);
    sheet.getElementsByTagName("worksheet")[0].appendChild(xlsxFilter);
}

function InitTagsInput() {
    $("input[data-role='tagsinput']").each(function (index, element) {
        // element == this
        $(element).tagsinput({});
    });
}


function InitCheckBoxInput() {
    //$(".form-check-input").wrap("<div class='checkbox c-checkbox'></div>");
    //$("<span class='fa fa-check'></span>").insertAfter(".form-check-input");

}




function IsDate(value) {
    switch (typeof value) {
        case "number":
            return true;
        case "string":
            return !isNaN(Date.parse(value));
        case "object":
            if (value instanceof Date) {
                return !isNaN(value.getTime());
            }
        default:
            return false;
    }
}

function DownloadDataBase64(data, fileName, mimeType) {
    var bytes = this.base64ToArrayBuffer(data);
    return DownloadDataBytes(bytes, fileName, mimeType);
}

function DownloadDataBytes(data, fileName, mimeType) {
    var returnValue = { Success: false, Message: "" };
    try {
        var isFileSaverSupported = !!new Blob;
        if (!isFileSaverSupported) {
            throw "";
        }
    } catch (errSupport) {
        returnValue.Message = "Descargas con Blob no soportadas!";
    }
    try {
        var blob = new Blob([data], { type: mimeType });
        saveAs(blob, fileName);
        returnValue.Success = true;
    } catch (errDownload) {
        returnValue.Message = errDownload.message;
    }
    return returnValue;
}

function base64ToArrayBuffer(base64) {
    var binaryString = window.atob(base64);
    var binaryLen = binaryString.length;
    var bytes = new Uint8Array(binaryLen);
    for (var i = 0; i < binaryLen; i++) {
        var ascii = binaryString.charCodeAt(i);
        bytes[i] = ascii;
    }
    return bytes;
}

function uint8ToString(buf) {
    var i, length, out = "";
    for (i = 0, length = buf.length; i < length; i += 1) {
        out += String.fromCharCode(buf[i]);
    }
    return out;
}

function uint8ToBase64(dataArray) {
    return btoa(uint8ToString(dataArray));
}

function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime(); //Timestamp
    var d2 = (performance && performance.now && (performance.now() * 1000)) ||
        0; //Time in microseconds since page-load or 0 if unsupported
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,
        function (c) {
            var r = Math.random() * 16; //random number between 0 and 16
            if (d > 0) { //Use timestamp until depleted
                r = (d + r) % 16 | 0;
                d = Math.floor(d / 16);
            } else { //Use microseconds since page-load if supported
                r = (d2 + r) % 16 | 0;
                d2 = Math.floor(d2 / 16);
            }
            return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
        });
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, "g"), replace);
}

function ArePropertiesEmpty(obj) {
    for (var key in obj) {
        if (obj[key] !== null && obj[key] != "")
            return false;
    }
    return true;
}

function GetFileExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

function ShowNotification(content, statusType) {
    var faIcon = "";
    switch (statusType) {
        case "primary":
            faIcon = "fas fa-info-circle";
            break;
        case "success":
            faIcon = "fas fa-check-circle";
            break;
        case "warning":
            faIcon = "fas fa-exclamation-circle";
            break;
        case "danger":
            faIcon = "fas fa-times-circle";
            break;
        default:
            faIcon = "fas fa-exclamation-circle";
            break;
    }
    $.notify(`<em class="${faIcon}"></em> ${content}`,
        {
            status: statusType,
            pos: "top-right"
        });
}

function fileToByteArray(file) {
    return new Promise((resolve, reject) => {
        try {
            let reader = new FileReader();
            let fileByteArray = [];
            reader.readAsArrayBuffer(file);
            reader.onloadend = (evt) => {
                if (evt.target.readyState == FileReader.DONE) {
                    let arrayBuffer = evt.target.result,
                        array = new Uint8Array(arrayBuffer);
                    for (byte of array) {
                        fileByteArray.push(byte);
                    }
                }
                resolve(fileByteArray);
            }
        }
        catch (e) {
            reject(e);
        }
    })
}

function FormatNumberAsCurrency(number, currency, locale) {
    var digitNumber = numeral(number).value();
    var formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,

        // These options are needed to round to whole numbers if that's what you want.
        //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
        //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
    });
    return formatter.format(digitNumber);
}
