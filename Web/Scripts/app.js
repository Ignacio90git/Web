/**
 * This library was created to emulate some jQuery features
 * used in this template only with Javascript and DOM
 * manipulation functions (IE10+).
 * All methods were designed for an adequate and specific use
 * and don't perform a deep validation on the arguments provided.
 *
 * IMPORTANT:
 * ==========
 * It's suggested NOT to use this library extensively unless you
 * understand what each method does. Instead, use only JS or
 * you might even need jQuery.
 */

(function(global, factory) {
    if (typeof exports === 'object') { // CommonJS-like
        module.exports = factory();
    } else { // Browser
        if (typeof global.jQuery === 'undefined')
            global.$ = factory();
    }
}(this, function() {

    // HELPERS
    function arrayFrom(obj) {
        return ('length' in obj) && (obj !== window) ? [].slice.call(obj) : [obj];
    }

    function filter(ctx, fn) {
        return [].filter.call(ctx, fn);
    }

    function map(ctx, fn) {
        return [].map.call(ctx, fn);
    }

    function matches(item, selector) {
        return (Element.prototype.matches || Element.prototype.msMatchesSelector).call(item, selector)
    }

    // Events handler with simple scoped events support
    var EventHandler = function() {
        this.events = {};
    }
    EventHandler.prototype = {
        // event accepts: 'click' or 'click.scope'
        bind: function(event, listener, target) {
            var type = event.split('.')[0];
            target.addEventListener(type, listener, false);
            this.events[event] = {
                type: type,
                listener: listener
            }
        },
        unbind: function(event, target) {
            if (event in this.events) {
                target.removeEventListener(this.events[event].type, this.events[event].listener, false);
                delete this.events[event];
            }
        }
    }

    // Object Definition
    var Wrap = function(selector) {
        this.selector = selector;
        return this._setup([]);
    }

    // CONSTRUCTOR
    Wrap.Constructor = function(param, attrs) {
        var el = new Wrap(param);
        return el.init(attrs);
    };

    // Core methods
    Wrap.prototype = {
        constructor: Wrap,
        /**
         * Initialize the object depending on param type
         * [attrs] only to handle $(htmlString, {attributes})
         */
        init: function(attrs) {
            // empty object
            if (!this.selector) return this;
            // selector === string
            if (typeof this.selector === 'string') {
                // if looks like markup, try to create an element
                if (this.selector[0] === '<') {
                    var elem = this._setup([this._create(this.selector)])
                    return attrs ? elem.attr(attrs) : elem;
                } else
                    return this._setup(arrayFrom(document.querySelectorAll(this.selector)))
            }
            // selector === DOMElement
            if (this.selector.nodeType)
                return this._setup([this.selector])
            else // shorthand for DOMReady
                if (typeof this.selector === 'function')
                    return this._setup([document]).ready(this.selector)
            // Array like objects (e.g. NodeList/HTMLCollection)
            return this._setup(arrayFrom(this.selector))
        },
        /**
         * Creates a DOM element from a string
         * Strictly supports the form: '<tag>' or '<tag/>'
         */
        _create: function(str) {
            var nodeName = str.substr(str.indexOf('<') + 1, str.indexOf('>') - 1).replace('/', '')
            return document.createElement(nodeName);
        },
        /** setup properties and array to element set */
        _setup: function(elements) {
            var i = 0;
            for (; i < elements.length; i++) delete this[i]; // clean up old set
            this.elements = elements;
            this.length = elements.length;
            for (i = 0; i < elements.length; i++) this[i] = elements[i] // new set
            return this;
        },
        _first: function(cb, ret) {
            var f = this.elements[0];
            return f ? (cb ? cb.call(this, f) : f) : ret;
        },
        /** Common function for class manipulation  */
        _classes: function(method, classname) {
            var cls = classname.split(' ');
            if (cls.length > 1) {
                cls.forEach(this._classes.bind(this, method))
            } else {
                if (method === 'contains') {
                    var elem = this._first();
                    return elem ? elem.classList.contains(classname) : false;
                }
                return (classname === '') ? this : this.each(function(i, item) {
                    item.classList[method](classname);
                })
            }
        },
        /**
         * Multi purpose function to set or get a (key, value)
         * If no value, works as a getter for the given key
         * key can be an object in the form {key: value, ...}
         */
        _access: function(key, value, fn) {
            if (typeof key === 'object') {
                for (var k in key) {
                    this._access(k, key[k], fn);
                }
            } else if (value === undefined) {
                return this._first(function(elem) {
                    return fn(elem, key);
                });
            }
            return this.each(function(i, item) {
                fn(item, key, value);
            });
        },
        each: function(fn, arr) {
            arr = arr ? arr : this.elements;
            for (var i = 0; i < arr.length; i++) {
                if (fn.call(arr[i], i, arr[i]) === false)
                    break;
            }
            return this;
        }
    }

    /** Allows to extend with new methods */
    Wrap.extend = function(methods) {
        Object.keys(methods).forEach(function(m) {
            Wrap.prototype[m] = methods[m]
        })
    }

    // DOM READY
    Wrap.extend({
        ready: function(fn) {
            if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
                fn();
            } else {
                document.addEventListener('DOMContentLoaded', fn);
            }
            return this;
        }
    })
    // ACCESS
    Wrap.extend({
        /** Get or set a css value */
        css: function(key, value) {
            var getStyle = function(e, k) { return e.style[k] || getComputedStyle(e)[k]; };
            return this._access(key, value, function(item, k, val) {
                var unit = (typeof val === 'number') ? 'px' : '';
                return val === undefined ? getStyle(item, k) : (item.style[k] = val + unit);
            })
        },
        /** Get an attribute or set it */
        attr: function(key, value) {
            return this._access(key, value, function(item, k, val) {
                return val === undefined ? item.getAttribute(k) : item.setAttribute(k, val)
            })
        },
        /** Get a property or set it */
        prop: function(key, value) {
            return this._access(key, value, function(item, k, val) {
                return val === undefined ? item[k] : (item[k] = val);
            })
        },
        position: function() {
            return this._first(function(elem) {
                return { left: elem.offsetLeft, top: elem.offsetTop }
            });
        },
        scrollTop: function(value) {
            return this._access('scrollTop', value, function(item, k, val) {
                return val === undefined ? item[k] : (item[k] = val);
            })
        },
        outerHeight: function(includeMargin) {
            return this._first(function(elem) {
                var style = getComputedStyle(elem);
                var margins = includeMargin ? (parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10)) : 0;
                return elem.offsetHeight + margins;
            });
        },
        /**
         * Find the position of the first element in the set
         * relative to its sibling elements.
         */
        index: function() {
            return this._first(function(el) {
                return arrayFrom(el.parentNode.children).indexOf(el)
            }, -1);
        }
    })
    // LOOKUP
    Wrap.extend({
        children: function(selector) {
            var childs = [];
            this.each(function(i, item) {
                childs = childs.concat(map(item.children, function(item) {
                    return item
                }))
            })
            return Wrap.Constructor(childs).filter(selector);
        },
        siblings: function() {
            var sibs = []
            this.each(function(i, item) {
                sibs = sibs.concat(filter(item.parentNode.children, function(child) {
                    return child !== item;
                }))
            })
            return Wrap.Constructor(sibs)
        },
        /** Return the parent of each element in the current set */
        parent: function() {
            var par = map(this.elements, function(item) {
                return item.parentNode;
            })
            return Wrap.Constructor(par)
        },
        /** Return ALL parents of each element in the current set */
        parents: function(selector) {
            var par = [];
            this.each(function(i, item) {
                for (var p = item.parentElement; p; p = p.parentElement)
                    par.push(p);
            })
            return Wrap.Constructor(par).filter(selector)
        },
        /**
         * Get the descendants of each element in the set, filtered by a selector
         * Selector can't start with ">" (:scope not supported on IE).
         */
        find: function(selector) {
            var found = []
            this.each(function(i, item) {
                found = found.concat(map(item.querySelectorAll( /*':scope ' + */ selector), function(fitem) {
                    return fitem
                }))
            })
            return Wrap.Constructor(found)
        },
        /** filter the actual set based on given selector */
        filter: function(selector) {
            if (!selector) return this;
            var res = filter(this.elements, function(item) {
                return matches(item, selector)
            })
            return Wrap.Constructor(res)
        },
        /** Works only with a string selector */
        is: function(selector) {
            var found = false;
            this.each(function(i, item) {
                return !(found = matches(item, selector))
            })
            return found;
        }
    });
    // ELEMENTS
    Wrap.extend({
        /**
         * append current set to given node
         * expects a dom node or set
         * if element is a set, prepends only the first
         */
        appendTo: function(elem) {
            elem = elem.nodeType ? elem : elem._first()
            return this.each(function(i, item) {
                elem.appendChild(item);
            })
        },
        /**
         * Append a domNode to each element in the set
         * if element is a set, append only the first
         */
        append: function(elem) {
            elem = elem.nodeType ? elem : elem._first()
            return this.each(function(i, item) {
                item.appendChild(elem);
            })
        },
        /**
         * Insert the current set of elements after the element
         * that matches the given selector in param
         */
        insertAfter: function(selector) {
            var target = document.querySelector(selector);
            return this.each(function(i, item) {
                target.parentNode.insertBefore(item, target.nextSibling);
            })
        },
        /**
         * Clones all element in the set
         * returns a new set with the cloned elements
         */
        clone: function() {
            var clones = map(this.elements, function(item) {
                return item.cloneNode(true)
            })
            return Wrap.Constructor(clones);
        },
        /** Remove all node in the set from DOM. */
        remove: function() {
            this.each(function(i, item) {
                delete item.events;
                delete item.data;
                if (item.parentNode) item.parentNode.removeChild(item);
            })
            this._setup([])
        }
    })
    // DATASETS
    Wrap.extend({
        /**
         * Expected key in camelCase format
         * if value provided save data into element set
         * if not, return data for the first element
         */
        data: function(key, value) {
            var hasJSON = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
                dataAttr = 'data-' + key.replace(/[A-Z]/g, '-$&').toLowerCase();
            if (value === undefined) {
                return this._first(function(el) {
                    if (el.data && el.data[key])
                        return el.data[key];
                    else {
                        var data = el.getAttribute(dataAttr)
                        if (data === 'true') return true;
                        if (data === 'false') return false;
                        if (data === +data + '') return +data;
                        if (hasJSON.test(data)) return JSON.parse(data);
                        return data;
                    }
                });
            } else {
                return this.each(function(i, item) {
                    item.data = item.data || {};
                    item.data[key] = value;
                });
            }
        }
    })
    // EVENTS
    Wrap.extend({
        trigger: function(type) {
            type = type.split('.')[0]; // ignore namespace
            var event = document.createEvent('HTMLEvents');
            event.initEvent(type, true, false);
            return this.each(function(i, item) {
                item.dispatchEvent(event);
            })
        },
        blur: function() {
            return this.trigger('blur')
        },
        focus: function() {
            return this.trigger('focus')
        },
        on: function(event, callback) {
            return this.each(function(i, item) {
                if (!item.events) item.events = new EventHandler();
                event.split(' ').forEach(function(ev) {
                    item.events.bind(ev, callback, item);
                })
            })
        },
        off: function(event) {
            return this.each(function(i, item) {
                if (item.events) {
                    item.events.unbind(event, item);
                    delete item.events;
                }
            })
        }
    })
    // CLASSES
    Wrap.extend({
        toggleClass: function(classname) {
            return this._classes('toggle', classname);
        },
        addClass: function(classname) {
            return this._classes('add', classname);
        },
        removeClass: function(classname) {
            return this._classes('remove', classname);
        },
        hasClass: function(classname) {
            return this._classes('contains', classname);
        }
    })


    /**
     * Some basic features in this template relies on Bootstrap
     * plugins, like Collapse, Dropdown and Tab.
     * Below code emulates plugins behavior by toggling classes
     * from elements to allow a minimum interaction without animation.
     * - Only Collapse is required which is used by the sidebar.
     * - Tab and Dropdown are optional features.
     */

    // Emulate jQuery symbol to simplify usage
    var $ = Wrap.Constructor;

    // Emulates Collapse plugin
    Wrap.extend({
        collapse: function(action) {
            return this.each(function(i, item) {
                var $item = $(item).trigger(action + '.bs.collapse');
                if (action === 'toggle') $item.collapse($item.hasClass('show') ? 'hide' : 'show');
                else $item[action === 'show' ? 'addClass' : 'removeClass']('show');
            })
        }
    })
    // Initializations
    $('[data-toggle]').on('click', function(e) {
        var target = $(e.currentTarget);
        if (target.is('a')) e.preventDefault();
        switch (target.data('toggle')) {
            case 'collapse':
                $(target.attr('href')).collapse('toggle');
                break;
            case 'tab':
                target.parent().parent().find('.active').removeClass('active');
                target.addClass('active');
                var tabPane = $(target.attr('href'));
                tabPane.siblings().removeClass('active show');
                tabPane.addClass('active show');
                break;
            case 'dropdown':
                var dd = target.parent().toggleClass('show');
                dd.find('.dropdown-menu').toggleClass('show');
                break;
            default:
                break;
        }
    })


    return Wrap.Constructor

}));
/*!
 *
 * Angle - Bootstrap Admin Template
 *
 * Version: 4.5.5
 * Author: @themicon_co
 * Website: http://themicon.co
 * License: https://wrapbootstrap.com/help/licenses
 *
 */


(function() {
    'use strict';

    $(function() {

        // Restore body classes
        // -----------------------------------
        var $body = $('body');
        new StateToggler().restoreState($body);

        // enable settings toggle after restore
        $('#chk-fixed').prop('checked', $body.hasClass('layout-fixed'));
        $('#chk-collapsed').prop('checked', $body.hasClass('aside-collapsed'));
        $('#chk-collapsed-text').prop('checked', $body.hasClass('aside-collapsed-text'));
        $('#chk-boxed').prop('checked', $body.hasClass('layout-boxed'));
        $('#chk-float').prop('checked', $body.hasClass('aside-float'));
        $('#chk-hover').prop('checked', $body.hasClass('aside-hover'));

        // When ready display the offsidebar
        $('.offsidebar.d-none').removeClass('d-none');

    }); // doc ready

})();
// Knob chart
// -----------------------------------

(function() {
    'use strict';

    $(initKnob);

    function initKnob() {

        if (!$.fn.knob) return;

        var knobLoaderOptions1 = {
            width: '50%', // responsive
            displayInput: true,
            fgColor: APP_COLORS['info']
        };
        $('#knob-chart1').knob(knobLoaderOptions1);

        var knobLoaderOptions2 = {
            width: '50%', // responsive
            displayInput: true,
            fgColor: APP_COLORS['purple'],
            readOnly: true
        };
        $('#knob-chart2').knob(knobLoaderOptions2);

        var knobLoaderOptions3 = {
            width: '50%', // responsive
            displayInput: true,
            fgColor: APP_COLORS['info'],
            bgColor: APP_COLORS['gray'],
            angleOffset: -125,
            angleArc: 250
        };
        $('#knob-chart3').knob(knobLoaderOptions3);

        var knobLoaderOptions4 = {
            width: '50%', // responsive
            displayInput: true,
            fgColor: APP_COLORS['pink'],
            displayPrevious: true,
            thickness: 0.1,
            lineCap: 'round'
        };
        $('#knob-chart4').knob(knobLoaderOptions4);

    }

})();
// Chart JS
// -----------------------------------

(function() {
    'use strict';

    $(initChartJS);

    function initChartJS() {

        if (typeof Chart === 'undefined') return;

        // random values for demo
        var rFactor = function() {
            return Math.round(Math.random() * 100);
        };

        // Line chart
        // -----------------------------------

        var lineData = {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: 'My First dataset',
                backgroundColor: 'rgba(114,102,186,0.2)',
                borderColor: 'rgba(114,102,186,1)',
                pointBorderColor: '#fff',
                data: [rFactor(), rFactor(), rFactor(), rFactor(), rFactor(), rFactor(), rFactor()]
            }, {
                label: 'My Second dataset',
                backgroundColor: 'rgba(35,183,229,0.2)',
                borderColor: 'rgba(35,183,229,1)',
                pointBorderColor: '#fff',
                data: [rFactor(), rFactor(), rFactor(), rFactor(), rFactor(), rFactor(), rFactor()]
            }]
        };

        var lineOptions = {
            legend: {
                display: false
            }
        };
        var linectx = document.getElementById('chartjs-linechart').getContext('2d');
        var lineChart = new Chart(linectx, {
            data: lineData,
            type: 'line',
            options: lineOptions
        });

        // Bar chart
        // -----------------------------------

        var barData = {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                backgroundColor: '#23b7e5',
                borderColor: '#23b7e5',
                data: [rFactor(), rFactor(), rFactor(), rFactor(), rFactor(), rFactor(), rFactor()]
            }, {
                backgroundColor: '#5d9cec',
                borderColor: '#5d9cec',
                data: [rFactor(), rFactor(), rFactor(), rFactor(), rFactor(), rFactor(), rFactor()]
            }]
        };

        var barOptions = {
            legend: {
                display: false
            }
        };
        var barctx = document.getElementById('chartjs-barchart').getContext('2d');
        var barChart = new Chart(barctx, {
            data: barData,
            type: 'bar',
            options: barOptions
        });

        //  Doughnut chart
        // -----------------------------------

        var doughnutData = {
            labels: [
                'Purple',
                'Yellow',
                'Blue'
            ],
            datasets: [{
                data: [300, 50, 100],
                backgroundColor: [
                    '#7266ba',
                    '#fad732',
                    '#23b7e5'
                ],
                hoverBackgroundColor: [
                    '#7266ba',
                    '#fad732',
                    '#23b7e5'
                ]
            }]
        };

        var doughnutOptions = {
            legend: {
                display: false
            }
        };
        var doughnutctx = document.getElementById('chartjs-doughnutchart').getContext('2d');
        var doughnutChart = new Chart(doughnutctx, {
            data: doughnutData,
            type: 'doughnut',
            options: doughnutOptions
        });

        // Pie chart
        // -----------------------------------

        var pieData = {
            labels: [
                'Purple',
                'Yellow',
                'Blue'
            ],
            datasets: [{
                data: [300, 50, 100],
                backgroundColor: [
                    '#7266ba',
                    '#fad732',
                    '#23b7e5'
                ],
                hoverBackgroundColor: [
                    '#7266ba',
                    '#fad732',
                    '#23b7e5'
                ]
            }]
        };

        var pieOptions = {
            legend: {
                display: false
            }
        };
        var piectx = document.getElementById('chartjs-piechart').getContext('2d');
        var pieChart = new Chart(piectx, {
            data: pieData,
            type: 'pie',
            options: pieOptions
        });

        // Polar chart
        // -----------------------------------

        var polarData = {
            datasets: [{
                data: [
                    11,
                    16,
                    7,
                    3
                ],
                backgroundColor: [
                    '#f532e5',
                    '#7266ba',
                    '#f532e5',
                    '#7266ba'
                ],
                label: 'My dataset' // for legend
            }],
            labels: [
                'Label 1',
                'Label 2',
                'Label 3',
                'Label 4'
            ]
        };

        var polarOptions = {
            legend: {
                display: false
            }
        };
        var polarctx = document.getElementById('chartjs-polarchart').getContext('2d');
        var polarChart = new Chart(polarctx, {
            data: polarData,
            type: 'polarArea',
            options: polarOptions
        });

        // Radar chart
        // -----------------------------------

        var radarData = {
            labels: ['Eating', 'Drinking', 'Sleeping', 'Designing', 'Coding', 'Cycling', 'Running'],
            datasets: [{
                label: 'My First dataset',
                backgroundColor: 'rgba(114,102,186,0.2)',
                borderColor: 'rgba(114,102,186,1)',
                data: [65, 59, 90, 81, 56, 55, 40]
            }, {
                label: 'My Second dataset',
                backgroundColor: 'rgba(151,187,205,0.2)',
                borderColor: 'rgba(151,187,205,1)',
                data: [28, 48, 40, 19, 96, 27, 100]
            }]
        };

        var radarOptions = {
            legend: {
                display: false
            }
        };
        var radarctx = document.getElementById('chartjs-radarchart').getContext('2d');
        var radarChart = new Chart(radarctx, {
            data: radarData,
            type: 'radar',
            options: radarOptions
        });

    }

})();
// Chartist
// -----------------------------------

(function() {
    'use strict';

    $(initChartists);

    function initChartists() {

        if (typeof Chartist === 'undefined') return;

        // Bar bipolar
        // -----------------------------------
        var data1 = {
            labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'],
            series: [
                [1, 2, 4, 8, 6, -2, -1, -4, -6, -2]
            ]
        };

        var options1 = {
            high: 10,
            low: -10,
            height: 280,
            axisX: {
                labelInterpolationFnc: function(value, index) {
                    return index % 2 === 0 ? value : null;
                }
            }
        };

        new Chartist.Bar('#ct-bar1', data1, options1);

        // Bar Horizontal
        // -----------------------------------
        new Chartist.Bar('#ct-bar2', {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            series: [
                [5, 4, 3, 7, 5, 10, 3],
                [3, 2, 9, 5, 4, 6, 4]
            ]
        }, {
            seriesBarDistance: 10,
            reverseData: true,
            horizontalBars: true,
            height: 280,
            axisY: {
                offset: 70
            }
        });

        // Line
        // -----------------------------------
        new Chartist.Line('#ct-line1', {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            series: [
                [12, 9, 7, 8, 5],
                [2, 1, 3.5, 7, 3],
                [1, 3, 4, 5, 6]
            ]
        }, {
            fullWidth: true,
            height: 280,
            chartPadding: {
                right: 40
            }
        });


        // SVG Animation
        // -----------------------------------

        var chart1 = new Chartist.Line('#ct-line3', {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            series: [
                [1, 5, 2, 5, 4, 3],
                [2, 3, 4, 8, 1, 2],
                [5, 4, 3, 2, 1, 0.5]
            ]
        }, {
            low: 0,
            showArea: true,
            showPoint: false,
            fullWidth: true,
            height: 300
        });

        chart1.on('draw', function(data) {
            if (data.type === 'line' || data.type === 'area') {
                data.element.animate({
                    d: {
                        begin: 2000 * data.index,
                        dur: 2000,
                        from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
                        to: data.path.clone().stringify(),
                        easing: Chartist.Svg.Easing.easeOutQuint
                    }
                });
            }
        });


        // Slim animation
        // -----------------------------------


        var chart = new Chartist.Line('#ct-line2', {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            series: [
                [12, 9, 7, 8, 5, 4, 6, 2, 3, 3, 4, 6],
                [4, 5, 3, 7, 3, 5, 5, 3, 4, 4, 5, 5],
                [5, 3, 4, 5, 6, 3, 3, 4, 5, 6, 3, 4],
                [3, 4, 5, 6, 7, 6, 4, 5, 6, 7, 6, 3]
            ]
        }, {
            low: 0,
            height: 300
        });

        // Let's put a sequence number aside so we can use it in the event callbacks
        var seq = 0,
            delays = 80,
            durations = 500;

        // Once the chart is fully created we reset the sequence
        chart.on('created', function() {
            seq = 0;
        });

        // On each drawn element by Chartist we use the Chartist.Svg API to trigger SMIL animations
        chart.on('draw', function(data) {
            seq++;

            if (data.type === 'line') {
                // If the drawn element is a line we do a simple opacity fade in. This could also be achieved using CSS3 animations.
                data.element.animate({
                    opacity: {
                        // The delay when we like to start the animation
                        begin: seq * delays + 1000,
                        // Duration of the animation
                        dur: durations,
                        // The value where the animation should start
                        from: 0,
                        // The value where it should end
                        to: 1
                    }
                });
            } else if (data.type === 'label' && data.axis === 'x') {
                data.element.animate({
                    y: {
                        begin: seq * delays,
                        dur: durations,
                        from: data.y + 100,
                        to: data.y,
                        // We can specify an easing function from Chartist.Svg.Easing
                        easing: 'easeOutQuart'
                    }
                });
            } else if (data.type === 'label' && data.axis === 'y') {
                data.element.animate({
                    x: {
                        begin: seq * delays,
                        dur: durations,
                        from: data.x - 100,
                        to: data.x,
                        easing: 'easeOutQuart'
                    }
                });
            } else if (data.type === 'point') {
                data.element.animate({
                    x1: {
                        begin: seq * delays,
                        dur: durations,
                        from: data.x - 10,
                        to: data.x,
                        easing: 'easeOutQuart'
                    },
                    x2: {
                        begin: seq * delays,
                        dur: durations,
                        from: data.x - 10,
                        to: data.x,
                        easing: 'easeOutQuart'
                    },
                    opacity: {
                        begin: seq * delays,
                        dur: durations,
                        from: 0,
                        to: 1,
                        easing: 'easeOutQuart'
                    }
                });
            } else if (data.type === 'grid') {
                // Using data.axis we get x or y which we can use to construct our animation definition objects
                var pos1Animation = {
                    begin: seq * delays,
                    dur: durations,
                    from: data[data.axis.units.pos + '1'] - 30,
                    to: data[data.axis.units.pos + '1'],
                    easing: 'easeOutQuart'
                };

                var pos2Animation = {
                    begin: seq * delays,
                    dur: durations,
                    from: data[data.axis.units.pos + '2'] - 100,
                    to: data[data.axis.units.pos + '2'],
                    easing: 'easeOutQuart'
                };

                var animations = {};
                animations[data.axis.units.pos + '1'] = pos1Animation;
                animations[data.axis.units.pos + '2'] = pos2Animation;
                animations['opacity'] = {
                    begin: seq * delays,
                    dur: durations,
                    from: 0,
                    to: 1,
                    easing: 'easeOutQuart'
                };

                data.element.animate(animations);
            }
        });

        // For the sake of the example we update the chart every time it's created with a delay of 10 seconds
        chart.on('created', function() {
            if (window.__exampleAnimateTimeout) {
                clearTimeout(window.__exampleAnimateTimeout);
                window.__exampleAnimateTimeout = null;
            }
            window.__exampleAnimateTimeout = setTimeout(chart.update.bind(chart), 12000);
        });

    }

})();
// Easypie chart Loader
// -----------------------------------

(function() {
    'use strict';

    $(initEasyPieChart);

    function initEasyPieChart() {

        if (!$.fn.easyPieChart) return;

        // Usage via data attributes
        // <div class="easypie-chart" data-easypiechart data-percent="X" data-optionName="value"></div>
        $('[data-easypiechart]').each(function() {
            var $elem = $(this);
            var options = $elem.data();
            $elem.easyPieChart(options || {});
        });

        // programmatic usage
        var pieOptions1 = {
            animate: {
                duration: 800,
                enabled: true
            },
            barColor: APP_COLORS['success'],
            trackColor: false,
            scaleColor: false,
            lineWidth: 10,
            lineCap: 'circle'
        };
        $('#easypie1').easyPieChart(pieOptions1);

        var pieOptions2 = {
            animate: {
                duration: 800,
                enabled: true
            },
            barColor: APP_COLORS['warning'],
            trackColor: false,
            scaleColor: false,
            lineWidth: 4,
            lineCap: 'circle'
        };
        $('#easypie2').easyPieChart(pieOptions2);

        var pieOptions3 = {
            animate: {
                duration: 800,
                enabled: true
            },
            barColor: APP_COLORS['danger'],
            trackColor: false,
            scaleColor: APP_COLORS['gray'],
            lineWidth: 15,
            lineCap: 'circle'
        };
        $('#easypie3').easyPieChart(pieOptions3);

        var pieOptions4 = {
            animate: {
                duration: 800,
                enabled: true
            },
            barColor: APP_COLORS['danger'],
            trackColor: APP_COLORS['yellow'],
            scaleColor: APP_COLORS['gray-dark'],
            lineWidth: 15,
            lineCap: 'circle'
        };
        $('#easypie4').easyPieChart(pieOptions4);

    }

})();
// CHART SPLINE
// -----------------------------------
(function() {
    'use strict';

    $(initFlotSpline);

    function initFlotSpline() {

        var data = [{
            "label": "Uniques",
            "color": "#768294",
            "data": [
                ["Mar", 70],
                ["Apr", 85],
                ["May", 59],
                ["Jun", 93],
                ["Jul", 66],
                ["Aug", 86],
                ["Sep", 60]
            ]
        }, {
            "label": "Recurrent",
            "color": "#1f92fe",
            "data": [
                ["Mar", 21],
                ["Apr", 12],
                ["May", 27],
                ["Jun", 24],
                ["Jul", 16],
                ["Aug", 39],
                ["Sep", 15]
            ]
        }];

        var datav2 = [{
            "label": "Hours",
            "color": "#23b7e5",
            "data": [
                ["Jan", 70],
                ["Feb", 20],
                ["Mar", 70],
                ["Apr", 85],
                ["May", 59],
                ["Jun", 93],
                ["Jul", 66],
                ["Aug", 86],
                ["Sep", 60],
                ["Oct", 60],
                ["Nov", 12],
                ["Dec", 50]
            ]
        }, {
            "label": "Commits",
            "color": "#7266ba",
            "data": [
                ["Jan", 20],
                ["Feb", 70],
                ["Mar", 30],
                ["Apr", 50],
                ["May", 85],
                ["Jun", 43],
                ["Jul", 96],
                ["Aug", 36],
                ["Sep", 80],
                ["Oct", 10],
                ["Nov", 72],
                ["Dec", 31]
            ]
        }];

        var datav3 = [{
            "label": "Home",
            "color": "#1ba3cd",
            "data": [
                ["1", 38],
                ["2", 40],
                ["3", 42],
                ["4", 48],
                ["5", 50],
                ["6", 70],
                ["7", 145],
                ["8", 70],
                ["9", 59],
                ["10", 48],
                ["11", 38],
                ["12", 29],
                ["13", 30],
                ["14", 22],
                ["15", 28]
            ]
        }, {
            "label": "Overall",
            "color": "#3a3f51",
            "data": [
                ["1", 16],
                ["2", 18],
                ["3", 17],
                ["4", 16],
                ["5", 30],
                ["6", 110],
                ["7", 19],
                ["8", 18],
                ["9", 110],
                ["10", 19],
                ["11", 16],
                ["12", 10],
                ["13", 20],
                ["14", 10],
                ["15", 20]
            ]
        }];

        var options = {
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true,
                    radius: 4
                },
                splines: {
                    show: true,
                    tension: 0.4,
                    lineWidth: 1,
                    fill: 0.5
                }
            },
            grid: {
                borderColor: '#eee',
                borderWidth: 1,
                hoverable: true,
                backgroundColor: '#fcfcfc'
            },
            tooltip: true,
            tooltipOpts: {
                content: function(label, x, y) { return x + ' : ' + y; }
            },
            xaxis: {
                tickColor: '#fcfcfc',
                mode: 'categories'
            },
            yaxis: {
                min: 0,
                max: 150, // optional: use it for a clear represetation
                tickColor: '#eee',
                //position: 'right' or 'left',
                tickFormatter: function(v) {
                    return v /* + ' visitors'*/ ;
                }
            },
            shadowSize: 0
        };

        var chart = $('.chart-spline');
        if (chart.length)
            $.plot(chart, data, options);

        var chartv2 = $('.chart-splinev2');
        if (chartv2.length)
            $.plot(chartv2, datav2, options);

        var chartv3 = $('.chart-splinev3');
        if (chartv3.length)
            $.plot(chartv3, datav3, options);

    }

})();

// CHART AREA
// -----------------------------------
(function() {
    'use strict';


    $(initFlotArea)

    function initFlotArea() {

        var data = [{
            "label": "Uniques",
            "color": "#aad874",
            "data": [
                ["Mar", 50],
                ["Apr", 84],
                ["May", 52],
                ["Jun", 88],
                ["Jul", 69],
                ["Aug", 92],
                ["Sep", 58]
            ]
        }, {
            "label": "Recurrent",
            "color": "#7dc7df",
            "data": [
                ["Mar", 13],
                ["Apr", 44],
                ["May", 44],
                ["Jun", 27],
                ["Jul", 38],
                ["Aug", 11],
                ["Sep", 39]
            ]
        }];

        var options = {
            series: {
                lines: {
                    show: true,
                    fill: 0.8
                },
                points: {
                    show: true,
                    radius: 4
                }
            },
            grid: {
                borderColor: '#eee',
                borderWidth: 1,
                hoverable: true,
                backgroundColor: '#fcfcfc'
            },
            tooltip: true,
            tooltipOpts: {
                content: function(label, x, y) { return x + ' : ' + y; }
            },
            xaxis: {
                tickColor: '#fcfcfc',
                mode: 'categories'
            },
            yaxis: {
                min: 0,
                tickColor: '#eee',
                // position: 'right' or 'left'
                tickFormatter: function(v) {
                    return v + ' visitors';
                }
            },
            shadowSize: 0
        };

        var chart = $('.chart-area');
        if (chart.length)
            $.plot(chart, data, options);

    }

})();

// CHART BAR
// -----------------------------------
(function() {
    'use strict';


    $(initFlotBar)

    function initFlotBar() {

        var data = [{
            "label": "Sales",
            "color": "#9cd159",
            "data": [
                ["Jan", 27],
                ["Feb", 82],
                ["Mar", 56],
                ["Apr", 14],
                ["May", 28],
                ["Jun", 77],
                ["Jul", 23],
                ["Aug", 49],
                ["Sep", 81],
                ["Oct", 20]
            ]
        }];

        var options = {
            series: {
                bars: {
                    align: 'center',
                    lineWidth: 0,
                    show: true,
                    barWidth: 0.6,
                    fill: 0.9
                }
            },
            grid: {
                borderColor: '#eee',
                borderWidth: 1,
                hoverable: true,
                backgroundColor: '#fcfcfc'
            },
            tooltip: true,
            tooltipOpts: {
                content: function(label, x, y) { return x + ' : ' + y; }
            },
            xaxis: {
                tickColor: '#fcfcfc',
                mode: 'categories'
            },
            yaxis: {
                // position: 'right' or 'left'
                tickColor: '#eee'
            },
            shadowSize: 0
        };

        var chart = $('.chart-bar');
        if (chart.length)
            $.plot(chart, data, options);

    }

})();


// CHART BAR STACKED
// -----------------------------------
(function() {
    'use strict';


    $(initFlotBarStacked);

    function initFlotBarStacked() {

        var data = [{
            "label": "Tweets",
            "color": "#51bff2",
            "data": [
                ["Jan", 56],
                ["Feb", 81],
                ["Mar", 97],
                ["Apr", 44],
                ["May", 24],
                ["Jun", 85],
                ["Jul", 94],
                ["Aug", 78],
                ["Sep", 52],
                ["Oct", 17],
                ["Nov", 90],
                ["Dec", 62]
            ]
        }, {
            "label": "Likes",
            "color": "#4a8ef1",
            "data": [
                ["Jan", 69],
                ["Feb", 135],
                ["Mar", 14],
                ["Apr", 100],
                ["May", 100],
                ["Jun", 62],
                ["Jul", 115],
                ["Aug", 22],
                ["Sep", 104],
                ["Oct", 132],
                ["Nov", 72],
                ["Dec", 61]
            ]
        }, {
            "label": "+1",
            "color": "#f0693a",
            "data": [
                ["Jan", 29],
                ["Feb", 36],
                ["Mar", 47],
                ["Apr", 21],
                ["May", 5],
                ["Jun", 49],
                ["Jul", 37],
                ["Aug", 44],
                ["Sep", 28],
                ["Oct", 9],
                ["Nov", 12],
                ["Dec", 35]
            ]
        }];

        var datav2 = [{
            "label": "Pending",
            "color": "#9289ca",
            "data": [
                ["Pj1", 86],
                ["Pj2", 136],
                ["Pj3", 97],
                ["Pj4", 110],
                ["Pj5", 62],
                ["Pj6", 85],
                ["Pj7", 115],
                ["Pj8", 78],
                ["Pj9", 104],
                ["Pj10", 82],
                ["Pj11", 97],
                ["Pj12", 110],
                ["Pj13", 62]
            ]
        }, {
            "label": "Assigned",
            "color": "#7266ba",
            "data": [
                ["Pj1", 49],
                ["Pj2", 81],
                ["Pj3", 47],
                ["Pj4", 44],
                ["Pj5", 100],
                ["Pj6", 49],
                ["Pj7", 94],
                ["Pj8", 44],
                ["Pj9", 52],
                ["Pj10", 17],
                ["Pj11", 47],
                ["Pj12", 44],
                ["Pj13", 100]
            ]
        }, {
            "label": "Completed",
            "color": "#564aa3",
            "data": [
                ["Pj1", 29],
                ["Pj2", 56],
                ["Pj3", 14],
                ["Pj4", 21],
                ["Pj5", 5],
                ["Pj6", 24],
                ["Pj7", 37],
                ["Pj8", 22],
                ["Pj9", 28],
                ["Pj10", 9],
                ["Pj11", 14],
                ["Pj12", 21],
                ["Pj13", 5]
            ]
        }];

        var options = {
            series: {
                stack: true,
                bars: {
                    align: 'center',
                    lineWidth: 0,
                    show: true,
                    barWidth: 0.6,
                    fill: 0.9
                }
            },
            grid: {
                borderColor: '#eee',
                borderWidth: 1,
                hoverable: true,
                backgroundColor: '#fcfcfc'
            },
            tooltip: true,
            tooltipOpts: {
                content: function(label, x, y) { return x + ' : ' + y; }
            },
            xaxis: {
                tickColor: '#fcfcfc',
                mode: 'categories'
            },
            yaxis: {
                // position: 'right' or 'left'
                tickColor: '#eee'
            },
            shadowSize: 0
        };

        var chart = $('.chart-bar-stacked');
        if (chart.length)
            $.plot(chart, data, options);

        var chartv2 = $('.chart-bar-stackedv2');
        if (chartv2.length)
            $.plot(chartv2, datav2, options);

    }

})();

// CHART DONUT
// -----------------------------------
(function() {
    'use strict';


    $(initFlotDonut);

    function initFlotDonut() {

        var data = [{
            "color": "#39C558",
            "data": 60,
            "label": "Coffee"
        }, {
            "color": "#00b4ff",
            "data": 90,
            "label": "CSS"
        }, {
            "color": "#FFBE41",
            "data": 50,
            "label": "LESS"
        }, {
            "color": "#ff3e43",
            "data": 80,
            "label": "Jade"
        }, {
            "color": "#937fc7",
            "data": 116,
            "label": "AngularJS"
        }];

        var options = {
            series: {
                pie: {
                    show: true,
                    innerRadius: 0.5 // This makes the donut shape
                }
            }
        };

        var chart = $('.chart-donut');
        if (chart.length)
            $.plot(chart, data, options);

    }

})();

// CHART LINE
// -----------------------------------
(function() {
    'use strict';


    $(initFlotLine)

    function initFlotLine() {

        var data = [{
            "label": "Complete",
            "color": "#5ab1ef",
            "data": [
                ["Jan", 188],
                ["Feb", 183],
                ["Mar", 185],
                ["Apr", 199],
                ["May", 190],
                ["Jun", 194],
                ["Jul", 194],
                ["Aug", 184],
                ["Sep", 74]
            ]
        }, {
            "label": "In Progress",
            "color": "#f5994e",
            "data": [
                ["Jan", 153],
                ["Feb", 116],
                ["Mar", 136],
                ["Apr", 119],
                ["May", 148],
                ["Jun", 133],
                ["Jul", 118],
                ["Aug", 161],
                ["Sep", 59]
            ]
        }, {
            "label": "Cancelled",
            "color": "#d87a80",
            "data": [
                ["Jan", 111],
                ["Feb", 97],
                ["Mar", 93],
                ["Apr", 110],
                ["May", 102],
                ["Jun", 93],
                ["Jul", 92],
                ["Aug", 92],
                ["Sep", 44]
            ]
        }];

        var options = {
            series: {
                lines: {
                    show: true,
                    fill: 0.01
                },
                points: {
                    show: true,
                    radius: 4
                }
            },
            grid: {
                borderColor: '#eee',
                borderWidth: 1,
                hoverable: true,
                backgroundColor: '#fcfcfc'
            },
            tooltip: true,
            tooltipOpts: {
                content: function(label, x, y) { return x + ' : ' + y; }
            },
            xaxis: {
                tickColor: '#eee',
                mode: 'categories'
            },
            yaxis: {
                // position: 'right' or 'left'
                tickColor: '#eee'
            },
            shadowSize: 0
        };

        var chart = $('.chart-line');
        if (chart.length)
            $.plot(chart, data, options);

    }

})();


// CHART PIE
// -----------------------------------
(function() {
    'use strict';


    $(initFlotPie);

    function initFlotPie() {

        var data = [{
            "label": "jQuery",
            "color": "#4acab4",
            "data": 30
        }, {
            "label": "CSS",
            "color": "#ffea88",
            "data": 40
        }, {
            "label": "LESS",
            "color": "#ff8153",
            "data": 90
        }, {
            "label": "SASS",
            "color": "#878bb6",
            "data": 75
        }, {
            "label": "Jade",
            "color": "#b2d767",
            "data": 120
        }];

        var options = {
            series: {
                pie: {
                    show: true,
                    innerRadius: 0,
                    label: {
                        show: true,
                        radius: 0.8,
                        formatter: function(label, series) {
                            return '<div class="flot-pie-label">' +
                                //label + ' : ' +
                                Math.round(series.percent) +
                                '%</div>';
                        },
                        background: {
                            opacity: 0.8,
                            color: '#222'
                        }
                    }
                }
            }
        };

        var chart = $('.chart-pie');
        if (chart.length)
            $.plot(chart, data, options);

    }

})();
// Morris
// -----------------------------------

(function() {
    'use strict';

    $(initMorris);

    function initMorris() {

        if (typeof Morris === 'undefined') return;

        var chartdata = [
            { y: "2006", a: 100, b: 90 },
            { y: "2007", a: 75, b: 65 },
            { y: "2008", a: 50, b: 40 },
            { y: "2009", a: 75, b: 65 },
            { y: "2010", a: 50, b: 40 },
            { y: "2011", a: 75, b: 65 },
            { y: "2012", a: 100, b: 90 }
        ];

        var donutdata = [
            { label: "Download Sales", value: 12 },
            { label: "In-Store Sales", value: 30 },
            { label: "Mail-Order Sales", value: 20 }
        ];

        // Line Chart
        // -----------------------------------

        new Morris.Line({
            element: 'morris-line',
            data: chartdata,
            xkey: 'y',
            ykeys: ["a", "b"],
            labels: ["Serie A", "Serie B"],
            lineColors: ["#31C0BE", "#7a92a3"],
            resize: true
        });

        // Donut Chart
        // -----------------------------------
        new Morris.Donut({
            element: 'morris-donut',
            data: donutdata,
            colors: ['#f05050', '#fad732', '#ff902b'],
            resize: true
        });

        // Bar Chart
        // -----------------------------------
        new Morris.Bar({
            element: 'morris-bar',
            data: chartdata,
            xkey: 'y',
            ykeys: ["a", "b"],
            labels: ["Series A", "Series B"],
            xLabelMargin: 2,
            barColors: ['#23b7e5', '#f05050'],
            resize: true
        });

        // Area Chart
        // -----------------------------------
        new Morris.Area({
            element: 'morris-area',
            data: chartdata,
            xkey: 'y',
            ykeys: ["a", "b"],
            labels: ["Serie A", "Serie B"],
            lineColors: ['#7266ba', '#23b7e5'],
            resize: true
        });

    }

})();
// Rickshaw
// -----------------------------------

(function() {
    'use strict';

    $(initMorris);

    function initMorris() {

        if (typeof Rickshaw === 'undefined') return;

        var seriesData = [
            [],
            [],
            []
        ];
        var random = new Rickshaw.Fixtures.RandomData(150);

        for (var i = 0; i < 150; i++) {
            random.addData(seriesData);
        }

        var series1 = [{
            color: "#c05020",
            data: seriesData[0],
            name: 'New York'
        }, {
            color: "#30c020",
            data: seriesData[1],
            name: 'London'
        }, {
            color: "#6060c0",
            data: seriesData[2],
            name: 'Tokyo'
        }];

        var graph1 = new Rickshaw.Graph({
            element: document.querySelector("#rickshaw1"),
            series: series1,
            renderer: 'area'
        });

        graph1.render();


        // Graph 2
        // -----------------------------------

        var graph2 = new Rickshaw.Graph({
            element: document.querySelector("#rickshaw2"),
            renderer: 'area',
            stroke: true,
            series: [{
                data: [{ x: 0, y: 40 }, { x: 1, y: 49 }, { x: 2, y: 38 }, { x: 3, y: 30 }, { x: 4, y: 32 }],
                color: '#f05050'
            }, {
                data: [{ x: 0, y: 40 }, { x: 1, y: 49 }, { x: 2, y: 38 }, { x: 3, y: 30 }, { x: 4, y: 32 }],
                color: '#fad732'
            }]
        });

        graph2.render();

        // Graph 3
        // -----------------------------------


        var graph3 = new Rickshaw.Graph({
            element: document.querySelector("#rickshaw3"),
            renderer: 'line',
            series: [{
                data: [{ x: 0, y: 40 }, { x: 1, y: 49 }, { x: 2, y: 38 }, { x: 3, y: 30 }, { x: 4, y: 32 }],
                color: '#7266ba'
            }, {
                data: [{ x: 0, y: 20 }, { x: 1, y: 24 }, { x: 2, y: 19 }, { x: 3, y: 15 }, { x: 4, y: 16 }],
                color: '#23b7e5'
            }]
        });
        graph3.render();


        // Graph 4
        // -----------------------------------


        var graph4 = new Rickshaw.Graph({
            element: document.querySelector("#rickshaw4"),
            renderer: 'bar',
            series: [{
                data: [{ x: 0, y: 40 }, { x: 1, y: 49 }, { x: 2, y: 38 }, { x: 3, y: 30 }, { x: 4, y: 32 }],
                color: '#fad732'
            }, {
                data: [{ x: 0, y: 20 }, { x: 1, y: 24 }, { x: 2, y: 19 }, { x: 3, y: 15 }, { x: 4, y: 16 }],
                color: '#ff902b'

            }]
        });
        graph4.render();

    }

})();
// SPARKLINE
// -----------------------------------

(function() {
    'use strict';

    $(initSparkline);

    function initSparkline() {

        $('[data-sparkline]').each(initSparkLine);

        function initSparkLine() {
            var $element = $(this),
                options = $element.data(),
                values = options.values && options.values.split(',');

            options.type = options.type || 'bar'; // default chart is bar
            options.disableHiddenCheck = true;

            $element.sparkline(values, options);

            if (options.resize) {
                $(window).resize(function() {
                    $element.sparkline(values, options);
                });
            }
        }
    }

})();
// Start Bootstrap JS
// -----------------------------------

(function() {
    'use strict';

    $(initBootstrap);

    function initBootstrap() {

        // necessary check at least til BS doesn't require jQuery
        if (!$.fn || !$.fn.tooltip || !$.fn.popover) return;

        // POPOVER
        // -----------------------------------

        $('[data-toggle="popover"]').popover();

        // TOOLTIP
        // -----------------------------------

        $('[data-toggle="tooltip"]').tooltip({
            container: 'body'
        });

        // DROPDOWN INPUTS
        // -----------------------------------
        $('.dropdown input').on('click focus', function(event) {
            event.stopPropagation();
        });

    }

})();
// Module: card-tools
// -----------------------------------

(function() {
    'use strict';

    $(initCardDismiss);
    $(initCardCollapse);
    $(initCardRefresh);


    /**
     * Helper function to find the closest
     * ascending .card element
     */
    function getCardParent(item) {
        var el = item.parentElement;
        while (el && !el.classList.contains('card'))
            el = el.parentElement
        return el
    }
    /**
     * Helper to trigger custom event
     */
    function triggerEvent(type, item, data) {
        var ev;
        if (typeof CustomEvent === 'function') {
            ev = new CustomEvent(type, { detail: data });
        } else {
            ev = document.createEvent('CustomEvent');
            ev.initCustomEvent(type, true, false, data);
        }
        item.dispatchEvent(ev);
    }

    /**
     * Dismiss cards
     * [data-tool="card-dismiss"]
     */
    function initCardDismiss() {
        var cardtoolSelector = '[data-tool="card-dismiss"]'

        var cardList = [].slice.call(document.querySelectorAll(cardtoolSelector))

        cardList.forEach(function(item) {
            new CardDismiss(item);
        })

        function CardDismiss(item) {
            var EVENT_REMOVE = 'card.remove';
            var EVENT_REMOVED = 'card.removed';

            this.item = item;
            this.cardParent = getCardParent(this.item);
            this.removing = false; // prevents double execution

            this.clickHandler = function(e) {
                if (this.removing) return;
                this.removing = true;
                // pass callbacks via event.detail to confirm/cancel the removal
                triggerEvent(EVENT_REMOVE, this.cardParent, {
                    confirm: this.confirm.bind(this),
                    cancel: this.cancel.bind(this)
                });
            }
            this.confirm = function() {
                this.animate(this.cardParent, function() {
                    triggerEvent(EVENT_REMOVED, this.cardParent);
                    this.remove(this.cardParent);
                })
            }
            this.cancel = function() {
                this.removing = false;
            }
            this.animate = function(item, cb) {
                if ('onanimationend' in window) { // animation supported
                    item.addEventListener('animationend', cb.bind(this))
                    item.className += ' animated bounceOut'; // requires animate.css
                } else cb.call(this) // no animation, just remove
            }
            this.remove = function(item) {
                item.parentNode.removeChild(item);
            }
            // attach listener
            item.addEventListener('click', this.clickHandler.bind(this), false)
        }
    }


    /**
     * Collapsed cards
     * [data-tool="card-collapse"]
     * [data-start-collapsed]
     */
    function initCardCollapse() {
        var cardtoolSelector = '[data-tool="card-collapse"]';
        var cardList = [].slice.call(document.querySelectorAll(cardtoolSelector))

        cardList.forEach(function(item) {
            var initialState = item.hasAttribute('data-start-collapsed')
            new CardCollapse(item, initialState);
        })

        function CardCollapse(item, startCollapsed) {
            var EVENT_SHOW = 'card.collapse.show';
            var EVENT_HIDE = 'card.collapse.hide';

            this.state = true; // true -> show / false -> hide
            this.item = item;
            this.cardParent = getCardParent(this.item);
            this.wrapper = this.cardParent.querySelector('.card-wrapper');

            this.toggleCollapse = function(action) {
                triggerEvent(action ? EVENT_SHOW : EVENT_HIDE, this.cardParent)
                this.wrapper.style.maxHeight = (action ? this.wrapper.scrollHeight : 0) + 'px'
                this.state = action;
                this.updateIcon(action)
            }
            this.updateIcon = function(action) {
                this.item.firstElementChild.className = action ? 'fa fa-minus' : 'fa fa-plus'
            }
            this.clickHandler = function (e) {
                e = e || window.event;
                e.preventDefault();
                this.toggleCollapse(!this.state);
            }
            this.initStyles = function() {
                this.wrapper.style.maxHeight = this.wrapper.scrollHeight + 'px';
                this.wrapper.style.transition = 'max-height 0.5s';
                this.wrapper.style.overflow = 'hidden';
            }

            // prepare styles for collapse animation
            this.initStyles()
            // set initial state if provided
            if (startCollapsed) {
                this.toggleCollapse(false)
            }
            // attach listener
            this.item.addEventListener('click', this.clickHandler.bind(this), false)

        }
    }


    /**
     * Refresh cards
     * [data-tool="card-refresh"]
     * [data-spinner="standard"]
     */
    function initCardRefresh() {

        var cardtoolSelector = '[data-tool="card-refresh"]';
        var cardList = [].slice.call(document.querySelectorAll(cardtoolSelector))

        cardList.forEach(function(item) {
            new CardRefresh(item);
        })

        function CardRefresh(item) {
            var EVENT_REFRESH = 'card.refresh';
            var WHIRL_CLASS = 'whirl';
            var DEFAULT_SPINNER = 'standard'

            this.item = item;
            this.cardParent = getCardParent(this.item)
            this.spinner = ((this.item.dataset || {}).spinner || DEFAULT_SPINNER).split(' '); // support space separated classes

            this.refresh = function(e) {
                var card = this.cardParent;
                // start showing the spinner
                this.showSpinner(card, this.spinner)
                // attach as public method
                card.removeSpinner = this.removeSpinner.bind(this);
                // Trigger the event and send the card
                triggerEvent(EVENT_REFRESH, card, { card: card });
            }
            this.showSpinner = function(card, spinner) {
                card.classList.add(WHIRL_CLASS);
                spinner.forEach(function(s) { card.classList.add(s) })
            }
            this.removeSpinner = function() {
                this.cardParent.classList.remove(WHIRL_CLASS);
            }

            // attach listener
            this.item.addEventListener('click', this.refresh.bind(this), false)

        }
    }

})();
// GLOBAL CONSTANTS
// -----------------------------------

(function() {

    window.APP_COLORS = {
        'primary':                '#5d9cec',
        'success':                '#27c24c',
        'info':                   '#23b7e5',
        'warning':                '#ff902b',
        'danger':                 '#f05050',
        'inverse':                '#131e26',
        'green':                  '#37bc9b',
        'pink':                   '#f532e5',
        'purple':                 '#7266ba',
        'dark':                   '#3a3f51',
        'yellow':                 '#fad732',
        'gray-darker':            '#232735',
        'gray-dark':              '#3a3f51',
        'gray':                   '#dde6e9',
        'gray-light':             '#e4eaec',
        'gray-lighter':           '#edf1f2'
    };

    window.APP_MEDIAQUERY = {
        'desktopLG':             1200,
        'desktop':                992,
        'tablet':                 768,
        'mobile':                 480
    };

})();
// FULLSCREEN
// -----------------------------------

(function () {
    'use strict';

    $(initScreenFull);

    function initScreenFull() {
        if (typeof screenfull === 'undefined') return;

        var $doc = $(document);
        var $fsToggler = $('[data-toggle-fullscreen]');

        // Not supported under IE
        var ua = window.navigator.userAgent;
        if (ua.indexOf("MSIE ") > 0 || !!ua.match(/Trident.*rv\:11\./)) {
            $fsToggler.addClass('d-none'); // hide element
            return; // and abort
        }

        $fsToggler.on('click', function (e) {
            //e.preventDefault();

            if (screenfull.isEnabled) {

                screenfull.toggle();

                // Switch icon indicator
                toggleFSIcon($fsToggler);

            } else {
                console.log('Fullscreen not enabled');
            }
        });

        if (screenfull.raw && screenfull.raw.fullscreenchange)
            $doc.on(screenfull.raw.fullscreenchange, function () {
                toggleFSIcon($fsToggler);
            });

        function toggleFSIcon($element) {
            if (screenfull.isFullscreen)
                $element.children('em').removeClass('fa-expand').addClass('fa-compress');
            else
                $element.children('em').removeClass('fa-compress').addClass('fa-expand');
        }

    }

})();
// LOAD CUSTOM CSS
// -----------------------------------

(function () {
    'use strict';

    $(initLoadCSS);

    function initLoadCSS() {

        $('[data-load-css]').on('click', function (e) {

            var element = $(this);

            if (element.is('a'))
                e.preventDefault();

            var uri = element.data('loadCss'),
                link;

            if (uri) {
                link = createLink(uri);
                if (!link) {
                    $.error('Error creating stylesheet link element.');
                } else {
                    var colorSettings = uri.replace("/Content/css/", "").replace(".css", ""); localStorage.setItem("colorSettings", colorSettings);
                    DoPostNoResponse(UrlCambiarTemaUsuario, { colorSettings: colorSettings }, false);
                }
            } else {
                $.error('No stylesheet location defined.');
            }

        });
    }

    function createLink(uri) {
        var linkId = 'autoloaded-stylesheet',
            oldLink = $('#' + linkId).attr('id', linkId + '-old');

        $('head').append($('<link/>').attr({
            'id': linkId,
            'rel': 'stylesheet',
            'href': uri
        }));

        if (oldLink.length) {
            oldLink.remove();
        }

        return $('#' + linkId);
    }

})();
// TRANSLATION
// -----------------------------------

(function() {
    'use strict';

    $(initTranslation);


    var pathPrefix = '/Content/i18n'; // folder of json files
    var STORAGEKEY = 'jq-appLang';
    var savedLanguage = Storages.localStorage.get(STORAGEKEY);

    function initTranslation() {
        i18next
            .use(i18nextXHRBackend)
            // .use(LanguageDetector)
            .init({
                fallbackLng: savedLanguage || 'en',
                backend: {
                    loadPath: pathPrefix + '/{{ns}}-{{lng}}.json',
                },
                ns: ['site'],
                defaultNS: 'site',
                debug: false
            }, function(err, t) {
                // initialize elements
                applyTranlations();
                // listen to language changes
                attachChangeListener();
            })

        function applyTranlations() {
            var list = [].slice.call(document.querySelectorAll('[data-localize]'))
            list.forEach(function(item) {
                var key = item.getAttribute('data-localize')
                if (i18next.exists(key)) item.innerHTML = i18next.t(key);
            })
        }

        function attachChangeListener() {
            var list = [].slice.call(document.querySelectorAll('[data-set-lang]'))
            list.forEach(function(item) {

                item.addEventListener('click', function(e) {
                    if (e.target.tagName === 'A') e.preventDefault();
                    var lang = item.getAttribute('data-set-lang')
                    if (lang) {
                        i18next.changeLanguage(lang, function(err) {
                            if (err) console.log(err)
                            else {
                                applyTranlations();
                                Storages.localStorage.set(STORAGEKEY, lang);
                            }
                        });
                    }
                    activateDropdown(item)
                });

            })
        }

        function activateDropdown(item) {
            if (item.classList.contains('dropdown-item')) {
                item.parentElement.previousElementSibling.innerHTML = item.innerHTML;
            }
        }

    }


})();
// NAVBAR SEARCH
// -----------------------------------

(function() {
    'use strict';

    $(initNavbarSearch);

    function initNavbarSearch() {

        var navSearch = new navbarSearchInput();

        // Open search input
        var $searchOpen = $('[data-search-open]');

        $searchOpen
            .on('click', function(e) { e.stopPropagation(); })
            .on('click', navSearch.toggle);

        // Close search input
        var $searchDismiss = $('[data-search-dismiss]');
        var inputSelector = '.navbar-form input[type="text"]';

        $(inputSelector)
            .on('click', function(e) { e.stopPropagation(); })
            .on('keyup', function(e) {
                if (e.keyCode == 27) // ESC
                    navSearch.dismiss();
            });

        // click anywhere closes the search
        $(document).on('click', navSearch.dismiss);
        // dismissable options
        $searchDismiss
            .on('click', function(e) { e.stopPropagation(); })
            .on('click', navSearch.dismiss);

    }

    var navbarSearchInput = function() {
        var navbarFormSelector = 'form.navbar-form';
        return {
            toggle: function() {

                var navbarForm = $(navbarFormSelector);

                navbarForm.toggleClass('open');

                var isOpen = navbarForm.hasClass('open');

                navbarForm.find('input')[isOpen ? 'focus' : 'blur']();

            },

            dismiss: function() {
                $(navbarFormSelector)
                    .removeClass('open') // Close control
                    .find('input[type="text"]').blur() // remove focus
                // .val('')                    // Empty input
                ;
            }
        };

    }

})();
// NOW TIMER
// -----------------------------------

(function() {
    'use strict';

    $(initNowTimer);

    function initNowTimer() {

        if (typeof moment === 'undefined') return;

        $('[data-now]').each(function() {
            var element = $(this),
                format = element.data('format');

            function updateTime() {
                var dt = moment(new Date()).format(format);
                element.text(dt);
            }

            updateTime();
            setInterval(updateTime, 1000);

        });
    }

})();
// Toggle RTL mode for demo
// -----------------------------------


(function() {
    'use strict';

    $(initRTL);

    function initRTL() {
        var maincss = $('#maincss');
        var bscss = $('#bscss');
        $('#chk-rtl').on('change', function() {
            // app rtl check
            maincss.attr('href', this.checked ? '/Content/css/app-rtl.css' : '/Content/css/app.css');
            // bootstrap rtl check
            bscss.attr('href', this.checked ? '/Content/css/bootstrap-rtl.css' : '/Content/css/bootstrap.css');
        });
    }

})();
// SIDEBAR
// -----------------------------------


(function() {
    'use strict';

    $(initSidebar);

    var $html;
    var $body;
    var $sidebar;

    function initSidebar() {

        $html = $('html');
        $body = $('body');
        $sidebar = $('.sidebar');

        // AUTOCOLLAPSE ITEMS
        // -----------------------------------

        var sidebarCollapse = $sidebar.find('.collapse');
        sidebarCollapse.on('show.bs.collapse', function(event) {

            event.stopPropagation();
            if ($(this).parents('.collapse').length === 0)
                sidebarCollapse.filter('.show').collapse('hide');

        });

        // SIDEBAR ACTIVE STATE
        // -----------------------------------

        // Find current active item
        var currentItem = $('.sidebar .active').parents('li');

        // hover mode don't try to expand active collapse
        if (!useAsideHover())
            currentItem
            .addClass('active') // activate the parent
            .children('.collapse') // find the collapse
            .collapse('show'); // and show it

        // remove this if you use only collapsible sidebar items
        $sidebar.find('li > a + ul').on('show.bs.collapse', function(e) {
            if (useAsideHover()) e.preventDefault();
        });

        // SIDEBAR COLLAPSED ITEM HANDLER
        // -----------------------------------


        var eventName = isTouch() ? 'click' : 'mouseenter';
        var subNav = $();
        $sidebar.find('.sidebar-nav > li').on(eventName, function(e) {

            if (isSidebarCollapsed() || useAsideHover()) {

                subNav.trigger('mouseleave');
                subNav = toggleMenuItem($(this));

                // Used to detect click and touch events outside the sidebar
                sidebarAddBackdrop();
            }

        });

        var sidebarAnyclickClose = $sidebar.data('sidebarAnyclickClose');

        // Allows to close
        if (typeof sidebarAnyclickClose !== 'undefined') {

            $('.wrapper').on('click.sidebar', function(e) {
                // don't check if sidebar not visible
                if (!$body.hasClass('aside-toggled')) return;

                var $target = $(e.target);
                if (!$target.parents('.aside-container').length && // if not child of sidebar
                    !$target.is('#user-block-toggle') && // user block toggle anchor
                    !$target.parent().is('#user-block-toggle') // user block toggle icon
                ) {
                    $body.removeClass('aside-toggled');
                }

            });
        }
    }

    function sidebarAddBackdrop() {
        var $backdrop = $('<div/>', { 'class': 'sideabr-backdrop' });
        $backdrop.insertAfter('.aside-container').on("click mouseenter", function() {
            removeFloatingNav();
        });
    }

    // Open the collapse sidebar submenu items when on touch devices
    // - desktop only opens on hover
    function toggleTouchItem($element) {
        $element
            .siblings('li')
            .removeClass('open')
        $element
            .toggleClass('open');
    }

    // Handles hover to open items under collapsed menu
    // -----------------------------------
    function toggleMenuItem($listItem) {

        removeFloatingNav();

        var ul = $listItem.children('ul');

        if (!ul.length) return $();
        if ($listItem.hasClass('open')) {
            toggleTouchItem($listItem);
            return $();
        }

        var $aside = $('.aside-container');
        var $asideInner = $('.aside-inner'); // for top offset calculation
        // float aside uses extra padding on aside
        var mar = parseInt($asideInner.css('padding-top'), 0) + parseInt($aside.css('padding-top'), 0);

        var subNav = ul.clone().appendTo($aside);

        toggleTouchItem($listItem);

        var itemTop = ($listItem.position().top + mar) - $sidebar.scrollTop();
        var vwHeight = document.body.clientHeight;

        subNav
            .addClass('nav-floating')
            .css({
                position: isFixed() ? 'fixed' : 'absolute',
                top: itemTop,
                bottom: (subNav.outerHeight(true) + itemTop > vwHeight) ? 0 : 'auto'
            });

        subNav.on('mouseleave', function() {
            toggleTouchItem($listItem);
            subNav.remove();
        });

        return subNav;
    }

    function removeFloatingNav() {
        $('.sidebar-subnav.nav-floating').remove();
        $('.sideabr-backdrop').remove();
        $('.sidebar li.open').removeClass('open');
    }

    function isTouch() {
        return $html.hasClass('touch');
    }

    function isSidebarCollapsed() {
        return $body.hasClass('aside-collapsed') || $body.hasClass('aside-collapsed-text');
    }

    function isSidebarToggled() {
        return $body.hasClass('aside-toggled');
    }

    function isMobile() {
        return document.body.clientWidth < APP_MEDIAQUERY.tablet;
    }

    function isFixed() {
        return $body.hasClass('layout-fixed');
    }

    function useAsideHover() {
        return $body.hasClass('aside-hover');
    }

})();
// SLIMSCROLL
// -----------------------------------

(function() {
    'use strict';

    $(initSlimsSroll);

    function initSlimsSroll() {

        if (!$.fn || !$.fn.slimScroll) return;

        $('[data-scrollable]').each(function() {

            var element = $(this),
                defaultHeight = 250;

            element.slimScroll({
                height: (element.data('height') || defaultHeight)
            });

        });
    }

})();
// Table Check All
// -----------------------------------

(function() {
    'use strict';

    $(initTableCheckAll);

    function initTableCheckAll() {

        $('[data-check-all]').on('change', function() {
            var $this = $(this),
                index = $this.index() + 1,
                checkbox = $this.find('input[type="checkbox"]'),
                table = $this.parents('table');
            // Make sure to affect only the correct checkbox column
            table.find('tbody > tr > td:nth-child(' + index + ') input[type="checkbox"]')
                .prop('checked', checkbox[0].checked);

        });

    }

})();
// TOGGLE STATE
// -----------------------------------

(function() {
    'use strict';

    $(initToggleState);

    function initToggleState() {

        var $body = $('body');
        var toggle = new StateToggler();

        $('[data-toggle-state]')
            .on('click', function(e) {
                // e.preventDefault();
                e.stopPropagation();
                var element = $(this),
                    classname = element.data('toggleState'),
                    target = element.data('target'),
                    noPersist = (element.attr('data-no-persist') !== undefined);

                // Specify a target selector to toggle classname
                // use body by default
                var $target = target ? $(target) : $body;

                if (classname) {
                    if ($target.hasClass(classname)) {
                        $target.removeClass(classname);
                        if (!noPersist)
                            toggle.removeState(classname);
                    } else {
                        $target.addClass(classname);
                        if (!noPersist)
                            toggle.addState(classname);
                    }

                }

                // some elements may need this when toggled class change the content size
                if (typeof(Event) === 'function') { // modern browsers
                    window.dispatchEvent(new Event('resize'));
                } else { // old browsers and IE
                    var resizeEvent = window.document.createEvent('UIEvents');
                    resizeEvent.initUIEvent('resize', true, false, window, 0);
                    window.dispatchEvent(resizeEvent);
                }
            });

    }

    // Handle states to/from localstorage
    var StateToggler = function() {

        var STORAGE_KEY_NAME = 'jq-toggleState';

        /** Add a state to the browser storage to be restored later */
        this.addState = function(classname) {
            var data = Storages.localStorage.get(STORAGE_KEY_NAME);
            if (data instanceof Array) data.push(classname);
            else data = [classname];
            Storages.localStorage.set(STORAGE_KEY_NAME, data);
        };
        /** Remove a state from the browser storage */
        this.removeState = function(classname) {
            var data = Storages.localStorage.get(STORAGE_KEY_NAME);
            if (data) {
                var index = data.indexOf(classname);
                if (index !== -1) data.splice(index, 1);
                Storages.localStorage.set(STORAGE_KEY_NAME, data);
            }
        };
        /** Load the state string and restore the classlist */
        this.restoreState = function($elem) {
            var data = Storages.localStorage.get(STORAGE_KEY_NAME);
            if (data instanceof Array)
                $elem.addClass(data.join(' '));
        };
    };

    window.StateToggler = StateToggler;

})();
/**=========================================================
 * Module: trigger-resize.js
 * Triggers a window resize event from any element
 =========================================================*/

(function() {
    'use strict';

    $(initTriggerResize);

    function initTriggerResize() {
        var element = $('[data-trigger-resize]');
        var value = element.data('triggerResize')
        element.on('click', function() {
            setTimeout(function() {
                // all IE friendly dispatchEvent
                var evt = document.createEvent('UIEvents');
                evt.initUIEvent('resize', true, false, window, 0);
                window.dispatchEvent(evt);
                // modern dispatchEvent way
                // window.dispatchEvent(new Event('resize'));
            }, value || 300);
        });
    }

})();
// Demo Cards
// -----------------------------------

(function() {
    'use strict';

    $(initCardDemo);

    function initCardDemo() {

        /**
         * This functions show a demonstration of how to use
         * the card tools system via custom event.
         */
        var cardList = [].slice.call(document.querySelectorAll('.card.card-demo'));
        cardList.forEach(function(item) {

            item.addEventListener('card.refresh', function(event) {
                // get the card element that is refreshing
                var card = event.detail.card;
                // perform any action here, when it is done,
                // remove the spinner calling "removeSpinner"
                // setTimeout used to simulate async operation
                setTimeout(card.removeSpinner, 3000);
            })
            item.addEventListener('card.collapse.hide', function() {
                console.log('Card Collapse Hide');
            })
            item.addEventListener('card.collapse.show', function() {
                console.log('Card Collapse Show');
            })
            item.addEventListener('card.remove', function(event) {
                var confirm = event.detail.confirm;
                var cancel = event.detail.cancel;
                // perform any action  here
                console.log('Removing Card');
                // Call confirm() to continue removing card
                // otherwise call cancel()
                confirm();
            })
            item.addEventListener('card.removed', function(event) {
                console.log('Removed Card');
            });

        })

    }

})();
// Nestable demo
// -----------------------------------

(function() {
    'use strict';

    $(initNestable);

    function initNestable() {

        if (!$.fn.nestable) return;

        var updateOutput = function(e) {
            var list = e.length ? e : $(e.target),
                output = list.data('output');
            if (window.JSON) {
                output.val(window.JSON.stringify(list.nestable('serialize'))); //, null, 2));
            } else {
                output.val('JSON browser support required for this demo.');
            }
        };

        // activate Nestable for list 1
        $('#nestable').nestable({
                group: 1
            })
            .on('change', updateOutput);

        // activate Nestable for list 2
        $('#nestable2').nestable({
                group: 1
            })
            .on('change', updateOutput);

        // output initial serialised data
        updateOutput($('#nestable').data('output', $('#nestable-output')));
        updateOutput($('#nestable2').data('output', $('#nestable2-output')));

        $('.js-nestable-action').on('click', function(e) {
            var target = $(e.target),
                action = target.data('action');
            if (action === 'expand-all') {
                $('.dd').nestable('expandAll');
            }
            if (action === 'collapse-all') {
                $('.dd').nestable('collapseAll');
            }
        });

    }

})();
/**=========================================================
 * Module: notify.js
 * Create toggleable notifications that fade out automatically.
 * Based on Notify addon from UIKit (http://getuikit.com/docs/addons_notify.html)
 * [data-toggle="notify"]
 * [data-options="options in json format" ]
 =========================================================*/

(function() {
    'use strict';

    $(initNotify);

    function initNotify() {

        var Selector = '[data-notify]',
            autoloadSelector = '[data-onload]',
            doc = $(document);

        $(Selector).each(function() {

            var $this = $(this),
                onload = $this.data('onload');

            if (onload !== undefined) {
                setTimeout(function() {
                    notifyNow($this);
                }, 800);
            }

            $this.on('click', function(e) {
                e.preventDefault();
                notifyNow($this);
            });

        });

    }

    function notifyNow($element) {
        var message = $element.data('message'),
            options = $element.data('options');

        if (!message)
            $.error('Notify: No message specified');

        $.notify(message, options || {});
    }


})();


/**
 * Notify Addon definition as jQuery plugin
 * Adapted version to work with Bootstrap classes
 * More information http://getuikit.com/docs/addons_notify.html
 */

(function() {

    var containers = {},
        messages = {},

        notify = function(options) {

            if ($.type(options) == 'string') {
                options = { message: options };
            }

            if (arguments[1]) {
                options = $.extend(options, $.type(arguments[1]) == 'string' ? { status: arguments[1] } : arguments[1]);
            }

            return (new Message(options)).show();
        },
        closeAll = function(group, instantly) {
            if (group) {
                for (var id in messages) { if (group === messages[id].group) messages[id].close(instantly); }
            } else {
                for (var id in messages) { messages[id].close(instantly); }
            }
        };

    var Message = function(options) {

        var $this = this;

        this.options = $.extend({}, Message.defaults, options);

        this.uuid = "ID" + (new Date().getTime()) + "RAND" + (Math.ceil(Math.random() * 100000));
        this.element = $([
            // alert-dismissable enables bs close icon
            '<div class="uk-notify-message alert-dismissable">',
            '<a class="close">&times;</a>',
            '<div>' + this.options.message + '</div>',
            '</div>'

        ].join('')).data("notifyMessage", this);

        // status
        if (this.options.status) {
            this.element.addClass('alert alert-' + this.options.status);
            this.currentstatus = this.options.status;
        }

        this.group = this.options.group;

        messages[this.uuid] = this;

        if (!containers[this.options.pos]) {
            containers[this.options.pos] = $('<div class="uk-notify uk-notify-' + this.options.pos + '"></div>').appendTo('body').on("click", ".uk-notify-message", function() {
                $(this).data("notifyMessage").close();
            });
        }
    };


    $.extend(Message.prototype, {

        uuid: false,
        element: false,
        timout: false,
        currentstatus: "",
        group: false,

        show: function() {

            if (this.element.is(":visible")) return;

            var $this = this;

            containers[this.options.pos].show().prepend(this.element);

            var marginbottom = parseInt(this.element.css("margin-bottom"), 10);

            this.element.css({ "opacity": 0, "margin-top": -1 * this.element.outerHeight(), "margin-bottom": 0 }).animate({ "opacity": 1, "margin-top": 0, "margin-bottom": marginbottom }, function() {

                if ($this.options.timeout) {

                    var closefn = function() { $this.close(); };

                    $this.timeout = setTimeout(closefn, $this.options.timeout);

                    $this.element.hover(
                        function() { clearTimeout($this.timeout); },
                        function() { $this.timeout = setTimeout(closefn, $this.options.timeout); }
                    );
                }

            });

            return this;
        },

        close: function(instantly) {

            var $this = this,
                finalize = function() {
                    $this.element.remove();

                    if (!containers[$this.options.pos].children().length) {
                        containers[$this.options.pos].hide();
                    }

                    delete messages[$this.uuid];
                };

            if (this.timeout) clearTimeout(this.timeout);

            if (instantly) {
                finalize();
            } else {
                this.element.animate({ "opacity": 0, "margin-top": -1 * this.element.outerHeight(), "margin-bottom": 0 }, function() {
                    finalize();
                });
            }
        },

        content: function(html) {

            var container = this.element.find(">div");

            if (!html) {
                return container.html();
            }

            container.html(html);

            return this;
        },

        status: function(status) {

            if (!status) {
                return this.currentstatus;
            }

            this.element.removeClass('alert alert-' + this.currentstatus).addClass('alert alert-' + status);

            this.currentstatus = status;

            return this;
        }
    });

    Message.defaults = {
        message: "",
        status: "normal",
        timeout: 5000,
        group: null,
        pos: 'top-center'
    };


    $["notify"] = notify;
    $["notify"].message = Message;
    $["notify"].closeAll = closeAll;

    return notify;

}());
/**=========================================================
 * Module: portlet.js
 * Drag and drop any card to change its position
 * The Selector should could be applied to any object that contains
 * card, so .col-* element are ideal.
 =========================================================*/

(function() {
    'use strict';

    var STORAGE_KEY_NAME = 'jq-portletState';

    $(initPortlets);

    function initPortlets() {

        // Component is NOT optional
        if (!$.fn.sortable) return;

        var Selector = '[data-toggle="portlet"]';

        $(Selector).sortable({
            connectWith:          Selector,
            items:                'div.card',
            handle:               '.portlet-handler',
            opacity:              0.7,
            placeholder:          'portlet box-placeholder',
            cancel:               '.portlet-cancel',
            forcePlaceholderSize: true,
            iframeFix:            false,
            tolerance:            'pointer',
            helper:               'original',
            revert:               200,
            forceHelperSize:      true,
            update:               savePortletOrder,
            create:               loadPortletOrder
        })
        // optionally disables mouse selection
        //.disableSelection()
        ;

    }

    function savePortletOrder(event, ui) {

        var data = Storages.localStorage.get(STORAGE_KEY_NAME);

        if (!data) { data = {}; }

        data[this.id] = $(this).sortable('toArray');

        if (data) {
            Storages.localStorage.set(STORAGE_KEY_NAME, data);
        }

    }

    function loadPortletOrder() {

        var data = Storages.localStorage.get(STORAGE_KEY_NAME);

        if (data) {

            var porletId = this.id,
                cards = data[porletId];

            if (cards) {
                var portlet = $('#' + porletId);

                $.each(cards, function(index, value) {
                    $('#' + value).appendTo(portlet);
                });
            }

        }

    }

    // Reset porlet save state
    window.resetPorlets = function(e) {
        Storages.localStorage.remove(STORAGE_KEY_NAME);
        // reload the page
        window.location.reload();
    }

})();
// HTML5 Sortable demo
// -----------------------------------

(function() {
    'use strict';

    $(initSortable);

    function initSortable() {

        if (typeof sortable === 'undefined') return;

        sortable('.sortable', {
            forcePlaceholderSize: true,
            placeholder: '<div class="box-placeholder p0 m0"><div></div></div>'
        });

    }

})();
// Sweet Alert
// -----------------------------------

(function() {
    'use strict';

    $(initSweetAlert);

    function initSweetAlert() {

        $('#swal-demo1').on('click', function(e) {
            e.preventDefault();
            swal("Here's a message!")
        });

        $('#swal-demo2').on('click', function(e) {
            e.preventDefault();
            swal("Here's a message!", "It's pretty, isn't it?")
        });

        $('#swal-demo3').on('click', function(e) {
            e.preventDefault();
            swal("Good job!", "You clicked the button!", "success")
        });

        $('#swal-demo4').on('click', function(e) {
            e.preventDefault();
            swal({
                title: 'Are you sure?',
                text: 'Your will not be able to recover this imaginary file!',
                icon: 'warning',
                buttons: {
                    cancel: true,
                    confirm: {
                        text: 'Yes, delete it!',
                        value: true,
                        visible: true,
                        className: "bg-danger",
                        closeModal: true
                    }
                }
            }).then(function() {
                swal('Booyah!');
            });

        });

        $('#swal-demo5').on('click', function(e) {
            e.preventDefault();
            swal({
                title: 'Are you sure?',
                text: 'Your will not be able to recover this imaginary file!',
                icon: 'warning',
                buttons: {
                    cancel: {
                        text: 'No, cancel plx!',
                        value: null,
                        visible: true,
                        className: "",
                        closeModal: false
                    },
                    confirm: {
                        text: 'Yes, delete it!',
                        value: true,
                        visible: true,
                        className: "bg-danger",
                        closeModal: false
                    }
                }
            }).then(function(isConfirm) {
                if (isConfirm) {
                    swal('Deleted!', 'Your imaginary file has been deleted.', 'success');
                } else {
                    swal('Cancelled', 'Your imaginary file is safe :)', 'error');
                }
            });

        });

    }

})();
// Full Calendar
// -----------------------------------


(function() {
    'use strict';

    // When dom ready, init calendar and events
    $(initFullCalendar);

    function initFullCalendar() {

        if (!$.fn.fullCalendar) return;

        // The element that will display the calendar
        var calendar = $('#calendar');

        var demoEvents = createDemoEvents();

        initExternalEvents(calendar);

        initCalendar(calendar, demoEvents);

    }


    // global shared var to know what we are dragging
    var draggingEvent = null;

    /**
     * ExternalEvent object
     * @param jQuery Object elements Set of element as jQuery objects
     */
    var ExternalEvent = function(elements) {

        if (!elements) return;

        elements.each(function() {
            var $this = $(this);
            // create an Event Object (http://arshaw.com/fullcalendar/docs/event_data/Event_Object/)
            // it doesn't need to have a start or end
            var calendarEventObject = {
                title: $.trim($this.text()) // use the element's text as the event title
            };

            // store the Event Object in the DOM element so we can get to it later
            $this.data('calendarEventObject', calendarEventObject);

            // make the event draggable using jQuery UI
            $this.draggable({
                zIndex: 1070,
                revert: true, // will cause the event to go back to its
                revertDuration: 0 //  original position after the drag
            });

        });
    };

    /**
     * Invoke full calendar plugin and attach behavior
     * @param  jQuery [calElement] The calendar dom element wrapped into jQuery
     * @param  EventObject [events] An object with the event list to load when the calendar displays
     */
    function initCalendar(calElement, events) {

        // check to remove elements from the list
        var removeAfterDrop = $('#remove-after-drop');

        calElement.fullCalendar({
            // isRTL: true,
            header: {
                left: 'prev,next today',
                center: 'title',
                right: 'month,agendaWeek,agendaDay'
            },
            buttonIcons: { // note the space at the beginning
                prev: ' fa fa-caret-left',
                next: ' fa fa-caret-right'
            },
            buttonText: {
                today: 'today',
                month: 'month',
                week: 'week',
                day: 'day'
            },
            editable: true,
            droppable: true, // this allows things to be dropped onto the calendar
            drop: function(date, allDay) { // this function is called when something is dropped

                var $this = $(this),
                    // retrieve the dropped element's stored Event Object
                    originalEventObject = $this.data('calendarEventObject');

                // if something went wrong, abort
                if (!originalEventObject) return;

                // clone the object to avoid multiple events with reference to the same object
                var clonedEventObject = $.extend({}, originalEventObject);

                // assign the reported date
                clonedEventObject.start = date;
                clonedEventObject.allDay = allDay;
                clonedEventObject.backgroundColor = $this.css('background-color');
                clonedEventObject.borderColor = $this.css('border-color');

                // render the event on the calendar
                // the last `true` argument determines if the event "sticks"
                // (http://arshaw.com/fullcalendar/docs/event_rendering/renderEvent/)
                calElement.fullCalendar('renderEvent', clonedEventObject, true);

                // if necessary remove the element from the list
                if (removeAfterDrop.is(':checked')) {
                    $this.remove();
                }
            },
            eventDragStart: function(event, js, ui) {
                draggingEvent = event;
            },
            // This array is the events sources
            events: events
        });
    }

    /**
     * Inits the external events card
     * @param  jQuery [calElement] The calendar dom element wrapped into jQuery
     */
    function initExternalEvents(calElement) {
        // Card with the external events list
        var externalEvents = $('.external-events');

        // init the external events in the card
        new ExternalEvent(externalEvents.children('div'));

        // External event color is danger-red by default
        var currColor = '#f6504d';
        // Color selector button
        var eventAddBtn = $('.external-event-add-btn');
        // New external event name input
        var eventNameInput = $('.external-event-name');
        // Color switchers
        var eventColorSelector = $('.external-event-color-selector .circle');

        // Trash events Droparea
        $('.external-events-trash').droppable({
            accept: '.fc-event',
            activeClass: 'active',
            hoverClass: 'hovered',
            tolerance: 'touch',
            drop: function(event, ui) {

                // You can use this function to send an ajax request
                // to remove the event from the repository

                if (draggingEvent) {
                    var eid = draggingEvent.id || draggingEvent._id;
                    // Remove the event
                    calElement.fullCalendar('removeEvents', eid);
                    // Remove the dom element
                    ui.draggable.remove();
                    // clear
                    draggingEvent = null;
                }
            }
        });

        eventColorSelector.click(function(e) {
            e.preventDefault();
            var $this = $(this);

            // Save color
            currColor = $this.css('background-color');
            // De-select all and select the current one
            eventColorSelector.removeClass('selected');
            $this.addClass('selected');
        });

        eventAddBtn.click(function(e) {
            e.preventDefault();

            // Get event name from input
            var val = eventNameInput.val();
            // Dont allow empty values
            if ($.trim(val) === '') return;

            // Create new event element
            var newEvent = $('<div/>').css({
                    'background-color': currColor,
                    'border-color': currColor,
                    'color': '#fff'
                })
                .html(val);

            // Prepends to the external events list
            externalEvents.prepend(newEvent);
            // Initialize the new event element
            new ExternalEvent(newEvent);
            // Clear input
            eventNameInput.val('');
        });
    }

    /**
     * Creates an array of events to display in the first load of the calendar
     * Wrap into this function a request to a source to get via ajax the stored events
     * @return Array The array with the events
     */
    function createDemoEvents() {
        // Date for the calendar events (dummy data)
        var date = new Date();
        var d = date.getDate(),
            m = date.getMonth(),
            y = date.getFullYear();

        return [{
            title: 'All Day Event',
            start: new Date(y, m, 1),
            backgroundColor: '#f56954', //red
            borderColor: '#f56954' //red
        }, {
            title: 'Long Event',
            start: new Date(y, m, d - 5),
            end: new Date(y, m, d - 2),
            backgroundColor: '#f39c12', //yellow
            borderColor: '#f39c12' //yellow
        }, {
            title: 'Meeting',
            start: new Date(y, m, d, 10, 30),
            allDay: false,
            backgroundColor: '#0073b7', //Blue
            borderColor: '#0073b7' //Blue
        }, {
            title: 'Lunch',
            start: new Date(y, m, d, 12, 0),
            end: new Date(y, m, d, 14, 0),
            allDay: false,
            backgroundColor: '#00c0ef', //Info (aqua)
            borderColor: '#00c0ef' //Info (aqua)
        }, {
            title: 'Birthday Party',
            start: new Date(y, m, d + 1, 19, 0),
            end: new Date(y, m, d + 1, 22, 30),
            allDay: false,
            backgroundColor: '#00a65a', //Success (green)
            borderColor: '#00a65a' //Success (green)
        }, {
            title: 'Open Google',
            start: new Date(y, m, 28),
            end: new Date(y, m, 29),
            url: '//google.com/',
            backgroundColor: '#3c8dbc', //Primary (light-blue)
            borderColor: '#3c8dbc' //Primary (light-blue)
        }];
    }

})();
// JQCloud
// -----------------------------------


(function() {
    'use strict';

    $(initWordCloud);

    function initWordCloud() {

        if (!$.fn.jQCloud) return;

        //Create an array of word objects, each representing a word in the cloud
        var word_array = [
            { text: 'Lorem', weight: 13, /*link: 'http://themicon.co'*/ },
            { text: 'Ipsum', weight: 10.5 },
            { text: 'Dolor', weight: 9.4 },
            { text: 'Sit', weight: 8 },
            { text: 'Amet', weight: 6.2 },
            { text: 'Consectetur', weight: 5 },
            { text: 'Adipiscing', weight: 5 },
            { text: 'Sit', weight: 8 },
            { text: 'Amet', weight: 6.2 },
            { text: 'Consectetur', weight: 5 },
            { text: 'Adipiscing', weight: 5 }
        ];

        $("#jqcloud").jQCloud(word_array, {
            width: 240,
            height: 200,
            steps: 7
        });

    }

})();
// Search Results
// -----------------------------------


(function() {
    'use strict';

    $(initSearch);

    function initSearch() {

        if (!$.fn.slider) return;
        if (!$.fn.chosen) return;
        if (!$.fn.datepicker) return;

        // BOOTSTRAP SLIDER CTRL
        // -----------------------------------

        $('[data-ui-slider]').slider();

        // CHOSEN
        // -----------------------------------

        $('.chosen-select').chosen();

        // DATETIMEPICKER
        // -----------------------------------

        $('#datetimepicker').datepicker({
            language: 'es',
            orientation: 'bottom',
            icons: {
                time: 'fa fa-clock-o',
                date: 'fa fa-calendar',
                up: 'fa fa-chevron-up',
                down: 'fa fa-chevron-down',
                previous: 'fa fa-chevron-left',
                next: 'fa fa-chevron-right',
                today: 'fa fa-crosshairs',
                clear: 'fa fa-trash'
            }
        });

    }

})();
// Color picker
// -----------------------------------

(function() {
    'use strict';

    $(initColorPicker);

    function initColorPicker() {

        if (!$.fn.colorpicker) return;

        $('.demo-colorpicker').colorpicker();

        $('#demo_selectors').colorpicker({
            colorSelectors: {
                'default': '#777777',
                'primary': APP_COLORS['primary'],
                'success': APP_COLORS['success'],
                'info': APP_COLORS['info'],
                'warning': APP_COLORS['warning'],
                'danger': APP_COLORS['danger']
            }
        });

    }

})();
// Forms Demo
// -----------------------------------


(function() {
    'use strict';

    $(initFormsDemo);

    function initFormsDemo() {

        if (!$.fn.slider) return;
        if (!$.fn.chosen) return;
        if (!$.fn.inputmask) return;
        if (!$.fn.filestyle) return;
        if (!$.fn.wysiwyg) return;
        if (!$.fn.datepicker) return;

        // BOOTSTRAP SLIDER CTRL
        // -----------------------------------

        $('[data-ui-slider]').slider();

        // CHOSEN
        // -----------------------------------

        $('.chosen-select').chosen();

        // MASKED
        // -----------------------------------

        $('[data-masked]').inputmask();

        // FILESTYLE
        // -----------------------------------

        $('.filestyle').filestyle();

        // WYSIWYG
        // -----------------------------------

        $('.wysiwyg').wysiwyg();


        // DATETIMEPICKER
        // -----------------------------------

        //$('#datetimepicker1').datepicker({
        //    orientation: 'bottom',
        //    icons: {
        //        time: 'fa fa-clock-o',
        //        date: 'fa fa-calendar',
        //        up: 'fa fa-chevron-up',
        //        down: 'fa fa-chevron-down',
        //        previous: 'fa fa-chevron-left',
        //        next: 'fa fa-chevron-right',
        //        today: 'fa fa-crosshairs',
        //        clear: 'fa fa-trash'
        //    }
        //});
        //// only time
        //$('#datetimepicker2').datepicker({
        //    format: 'mm-dd-yyyy'
        //});

    }

})();
/**=========================================================
 * Module: Image Cropper
 =========================================================*/

(function() {
    'use strict';

    $(initImageCropper);

    function initImageCropper() {

        if (!$.fn.cropper) return;

        var $image = $('.img-container > img'),
            $dataX = $('#dataX'),
            $dataY = $('#dataY'),
            $dataHeight = $('#dataHeight'),
            $dataWidth = $('#dataWidth'),
            $dataRotate = $('#dataRotate'),
            options = {
                // data: {
                //   x: 420,
                //   y: 60,
                //   width: 640,
                //   height: 360
                // },
                // strict: false,
                // responsive: false,
                // checkImageOrigin: false

                // modal: false,
                // guides: false,
                // highlight: false,
                // background: false,

                // autoCrop: false,
                // autoCropArea: 0.5,
                // dragCrop: false,
                // movable: false,
                // rotatable: false,
                // zoomable: false,
                // touchDragZoom: false,
                // mouseWheelZoom: false,
                // cropBoxMovable: false,
                // cropBoxResizable: false,
                // doubleClickToggle: false,

                // minCanvasWidth: 320,
                // minCanvasHeight: 180,
                // minCropBoxWidth: 160,
                // minCropBoxHeight: 90,
                // minContainerWidth: 320,
                // minContainerHeight: 180,

                // build: null,
                // built: null,
                // dragstart: null,
                // dragmove: null,
                // dragend: null,
                // zoomin: null,
                // zoomout: null,

                aspectRatio: 16 / 9,
                preview: '.img-preview',
                crop: function(data) {
                    $dataX.val(Math.round(data.x));
                    $dataY.val(Math.round(data.y));
                    $dataHeight.val(Math.round(data.height));
                    $dataWidth.val(Math.round(data.width));
                    $dataRotate.val(Math.round(data.rotate));
                }
            };

        $image.on({
            'build.cropper': function(e) {
                console.log(e.type);
            },
            'built.cropper': function(e) {
                console.log(e.type);
            },
            'dragstart.cropper': function(e) {
                console.log(e.type, e.dragType);
            },
            'dragmove.cropper': function(e) {
                console.log(e.type, e.dragType);
            },
            'dragend.cropper': function(e) {
                console.log(e.type, e.dragType);
            },
            'zoomin.cropper': function(e) {
                console.log(e.type);
            },
            'zoomout.cropper': function(e) {
                console.log(e.type);
            },
            'change.cropper': function(e) {
                console.log(e.type);
            }
        }).cropper(options);


        // Methods
        $(document.body).on('click', '[data-method]', function() {
            var data = $(this).data(),
                $target,
                result;

            if (!$image.data('cropper')) {
                return;
            }

            if (data.method) {
                data = $.extend({}, data); // Clone a new one

                if (typeof data.target !== 'undefined') {
                    $target = $(data.target);

                    if (typeof data.option === 'undefined') {
                        try {
                            data.option = JSON.parse($target.val());
                        } catch (e) {
                            console.log(e.message);
                        }
                    }
                }

                result = $image.cropper(data.method, data.option);

                if (data.method === 'getCroppedCanvas') {
                    $('#getCroppedCanvasModal').modal().find('.modal-body').html(result);
                }

                if ($.isPlainObject(result) && $target) {
                    try {
                        $target.val(JSON.stringify(result));
                    } catch (e) {
                        console.log(e.message);
                    }
                }

            }
        }).on('keydown', function(e) {

            if (!$image.data('cropper')) {
                return;
            }

            switch (e.which) {
                case 37:
                    e.preventDefault();
                    $image.cropper('move', -1, 0);
                    break;

                case 38:
                    e.preventDefault();
                    $image.cropper('move', 0, -1);
                    break;

                case 39:
                    e.preventDefault();
                    $image.cropper('move', 1, 0);
                    break;

                case 40:
                    e.preventDefault();
                    $image.cropper('move', 0, 1);
                    break;
            }

        });


        // Import image
        var $inputImage = $('#inputImage'),
            URL = window.URL || window.webkitURL,
            blobURL;

        if (URL) {
            $inputImage.change(function() {
                var files = this.files,
                    file;

                if (!$image.data('cropper')) {
                    return;
                }

                if (files && files.length) {
                    file = files[0];

                    if (/^image\/\w+$/.test(file.type)) {
                        blobURL = URL.createObjectURL(file);
                        $image.one('built.cropper', function() {
                            URL.revokeObjectURL(blobURL); // Revoke when load complete
                        }).cropper('reset').cropper('replace', blobURL);
                        $inputImage.val('');
                    } else {
                        alert('Please choose an image file.');
                    }
                }
            });
        } else {
            $inputImage.parent().remove();
        }


        // Options
        $('.docs-options :checkbox').on('change', function() {
            var $this = $(this);

            if (!$image.data('cropper')) {
                return;
            }

            options[$this.val()] = $this.prop('checked');
            $image.cropper('destroy').cropper(options);
        });


        // Tooltips
        $('[data-toggle="tooltip"]').tooltip();

    }

})();
// Select2
// -----------------------------------

(function() {
    'use strict';

    $(initSelect2);

    function initSelect2() {

        if (!$.fn.select2) return;

        // Select 2

        $('#select2-1').select2({
            theme: 'bootstrap4'
        });
        $('#select2-2').select2({
            theme: 'bootstrap4'
        });
        $('#select2-3').select2({
            theme: 'bootstrap4'
        });
        $('#select2-4').select2({
            placeholder: 'Select a state',
            allowClear: true,
            theme: 'bootstrap4'
        });

    }

})();
(function() {
    'use strict';

    if (typeof Dropzone === 'undefined') return;

    // Prevent Dropzone from auto discovering
    // This is useful when you want to create the
    // Dropzone programmatically later
    Dropzone.autoDiscover = false;

    $(initDropzone);

    function initDropzone() {

        // Dropzone settings
        var dropzoneOptions = {
            autoProcessQueue: false,
            uploadMultiple: true,
            parallelUploads: 100,
            maxFiles: 100,
            dictDefaultMessage: '<em class="fa fa-upload text-muted"></em><br>Drop files here to upload', // default messages before first drop
            paramName: 'file', // The name that will be used to transfer the file
            maxFilesize: 2, // MB
            addRemoveLinks: true,
            accept: function(file, done) {
                if (file.name === 'justinbieber.jpg') {
                    done('Naha, you dont. :)');
                } else {
                    done();
                }
            },
            init: function() {
                var dzHandler = this;

                this.element.querySelector('button[type=submit]').addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    dzHandler.processQueue();
                });
                this.on('addedfile', function(file) {
                    console.log('Added file: ' + file.name);
                });
                this.on('removedfile', function(file) {
                    console.log('Removed file: ' + file.name);
                });
                this.on('sendingmultiple', function() {

                });
                this.on('successmultiple', function( /*files, response*/ ) {

                });
                this.on('errormultiple', function( /*files, response*/ ) {

                });
            }

        };

        var dropzoneArea = new Dropzone('#dropzone-area', dropzoneOptions);

    }

})();
// Forms Demo
// -----------------------------------


(function() {
    'use strict';

    $(initWizard);

    function initWizard() {

        if (!$.fn.validate) return;

        // FORM EXAMPLE
        // -----------------------------------
        var form = $("#example-form");
        form.validate({
            errorPlacement: function errorPlacement(error, element) { element.before(error); },
            rules: {
                confirm: {
                    equalTo: "#password"
                }
            }
        });
        form.children("div").steps({
            headerTag: "h4",
            bodyTag: "fieldset",
            transitionEffect: "slideLeft",
            onStepChanging: function(event, currentIndex, newIndex) {
                form.validate().settings.ignore = ":disabled,:hidden";
                return form.valid();
            },
            onFinishing: function(event, currentIndex) {
                form.validate().settings.ignore = ":disabled";
                return form.valid();
            },
            onFinished: function(event, currentIndex) {
                alert("Submitted!");

                // Submit form
                $(this).submit();
            }
        });

        // VERTICAL
        // -----------------------------------

        $("#example-vertical").steps({
            headerTag: "h4",
            bodyTag: "section",
            transitionEffect: "slideLeft",
            stepsOrientation: "vertical"
        });

    }

})();
// Xeditable Demo
// -----------------------------------

(function() {
    'use strict';

    $(initXEditable);

    function initXEditable() {

        if (!$.fn.editable) return

        // Font Awesome support
        $.fn.editableform.buttons =
            '<button type="submit" class="btn btn-primary btn-sm editable-submit">' +
            '<i class="fa fa-fw fa-check"></i>' +
            '</button>' +
            '<button type="button" class="btn btn-default btn-sm editable-cancel">' +
            '<i class="fa fa-fw fa-times"></i>' +
            '</button>';

        //defaults
        //$.fn.editable.defaults.url = 'url/to/server';

        //enable / disable
        $('#enable').click(function() {
            $('#user .editable').editable('toggleDisabled');
        });

        //editables
        $('#username').editable({
            // url: 'url/to/server',
            type: 'text',
            pk: 1,
            name: 'username',
            title: 'Enter username',
            mode: 'inline'
        });

        $('#firstname').editable({
            validate: function(value) {
                if ($.trim(value) === '') return 'This field is required';
            },
            mode: 'inline'
        });

        $('#sex').editable({
            prepend: "not selected",
            source: [
                { value: 1, text: 'Male' },
                { value: 2, text: 'Female' }
            ],
            display: function(value, sourceData) {
                var colors = { "": "gray", 1: "green", 2: "blue" },
                    elem = $.grep(sourceData, function(o) { return o.value == value; });

                if (elem.length) {
                    $(this).text(elem[0].text).css("color", colors[value]);
                } else {
                    $(this).empty();
                }
            },
            mode: 'inline'
        });

        $('#status').editable({
            mode: 'inline'
        });

        $('#group').editable({
            showbuttons: false,
            mode: 'inline'
        });

        $('#dob').editable({
            mode: 'inline'
        });

        $('#event').editable({
            placement: 'right',
            combodate: {
                firstItem: 'name'
            },
            mode: 'inline'
        });

        $('#comments').editable({
            showbuttons: 'bottom',
            mode: 'inline'
        });

        $('#note').editable({
            mode: 'inline'
        });
        $('#pencil').click(function(e) {
            e.stopPropagation();
            e.preventDefault();
            $('#note').editable('toggle');
        });

        $('#user .editable').on('hidden', function(e, reason) {
            if (reason === 'save' || reason === 'nochange') {
                var $next = $(this).closest('tr').next().find('.editable');
                if ($('#autoopen').is(':checked')) {
                    setTimeout(function() {
                        $next.editable('show');
                    }, 300);
                } else {
                    $next.focus();
                }
            }
        });

        // TABLE
        // -----------------------------------

        $('#users a').editable({
            type: 'text',
            name: 'username',
            title: 'Enter username',
            mode: 'inline'
        });

    }

})();
/**=========================================================
 * Module: gmap.js
 * Init Google Map plugin
 =========================================================*/

(function() {
    'use strict';

    $(initGoogleMaps);

    // -------------------------
    // Map Style definition
    // -------------------------
    // Get more styles from http://snazzymaps.com/style/29/light-monochrome
    // - Just replace and assign to 'MapStyles' the new style array
    var MapStyles = [{ featureType: 'water', stylers: [{ visibility: 'on' }, { color: '#bdd1f9' }] }, { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#334165' }] }, { featureType: 'landscape', stylers: [{ color: '#e9ebf1' }] }, { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#c5c6c6' }] }, { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#fff' }] }, { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#fff' }] }, { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#d8dbe0' }] }, { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#cfd5e0' }] }, { featureType: 'administrative', stylers: [{ visibility: 'on' }, { lightness: 33 }] }, { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'on' }, { lightness: 20 }] }, { featureType: 'road', stylers: [{ color: '#d8dbe0', lightness: 20 }] }];


    function initGoogleMaps() {

        if (!$.fn.gMap) return;

        var mapSelector = '[data-gmap]';
        var gMapRefs = [];

        $(mapSelector).each(function() {

            var $this = $(this),
                addresses = $this.data('address') && $this.data('address').split(';'),
                titles = $this.data('title') && $this.data('title').split(';'),
                zoom = $this.data('zoom') || 14,
                maptype = $this.data('maptype') || 'ROADMAP', // or 'TERRAIN'
                markers = [];

            if (addresses) {
                for (var a in addresses) {
                    if (typeof addresses[a] == 'string') {
                        markers.push({
                            address: addresses[a],
                            html: (titles && titles[a]) || '',
                            popup: true /* Always popup */
                        });
                    }
                }

                var options = {
                    controls: {
                        panControl: true,
                        zoomControl: true,
                        mapTypeControl: true,
                        scaleControl: true,
                        streetViewControl: true,
                        overviewMapControl: true
                    },
                    scrollwheel: false,
                    maptype: maptype,
                    markers: markers,
                    zoom: zoom
                    // More options https://github.com/marioestrada/jQuery-gMap
                };

                var gMap = $this.gMap(options);

                var ref = gMap.data('gMap.reference');
                // save in the map references list
                gMapRefs.push(ref);

                // set the styles
                if ($this.data('styled') !== undefined) {

                    ref.setOptions({
                        styles: MapStyles
                    });

                }
            }

        }); //each

    }

})();
// jVectorMap
// -----------------------------------


(function() {
    'use strict';

    $(initVectorMap);

    function initVectorMap() {

        var element = $('[data-vector-map]');

        var seriesData = {
            'CA': 11100, // Canada
            'DE': 2510, // Germany
            'FR': 3710, // France
            'AU': 5710, // Australia
            'GB': 8310, // Great Britain
            'RU': 9310, // Russia
            'BR': 6610, // Brazil
            'IN': 7810, // India
            'CN': 4310, // China
            'US': 839, // USA
            'SA': 410 // Saudi Arabia
        };

        var markersData = [
            { latLng: [41.90, 12.45], name: 'Vatican City' },
            { latLng: [43.73, 7.41], name: 'Monaco' },
            { latLng: [-0.52, 166.93], name: 'Nauru' },
            { latLng: [-8.51, 179.21], name: 'Tuvalu' },
            { latLng: [7.11, 171.06], name: 'Marshall Islands' },
            { latLng: [17.3, -62.73], name: 'Saint Kitts and Nevis' },
            { latLng: [3.2, 73.22], name: 'Maldives' },
            { latLng: [35.88, 14.5], name: 'Malta' },
            { latLng: [41.0, -71.06], name: 'New England' },
            { latLng: [12.05, -61.75], name: 'Grenada' },
            { latLng: [13.16, -59.55], name: 'Barbados' },
            { latLng: [17.11, -61.85], name: 'Antigua and Barbuda' },
            { latLng: [-4.61, 55.45], name: 'Seychelles' },
            { latLng: [7.35, 134.46], name: 'Palau' },
            { latLng: [42.5, 1.51], name: 'Andorra' }
        ];

        new VectorMap(element, seriesData, markersData);

    }

})();
// JVECTOR MAP
// -----------------------------------

(function() {
    'use strict';

    // Allow Global access
    window.VectorMap = VectorMap

    var defaultColors = {
        markerColor: '#23b7e5', // the marker points
        bgColor: 'transparent', // the background
        scaleColors: ['#878c9a'], // the color of the region in the serie
        regionFill: '#bbbec6' // the base region color
    };

    function VectorMap(element, seriesData, markersData) {

        if (!element || !element.length) return;

        var attrs = element.data(),
            mapHeight = attrs.height || '300',
            options = {
                markerColor: attrs.markerColor || defaultColors.markerColor,
                bgColor: attrs.bgColor || defaultColors.bgColor,
                scale: attrs.scale || 1,
                scaleColors: attrs.scaleColors || defaultColors.scaleColors,
                regionFill: attrs.regionFill || defaultColors.regionFill,
                mapName: attrs.mapName || 'world_mill_en'
            };

        element.css('height', mapHeight);

        init(element, options, seriesData, markersData);

        function init($element, opts, series, markers) {

            $element.vectorMap({
                map: opts.mapName,
                backgroundColor: opts.bgColor,
                zoomMin: 1,
                zoomMax: 8,
                zoomOnScroll: false,
                regionStyle: {
                    initial: {
                        'fill': opts.regionFill,
                        'fill-opacity': 1,
                        'stroke': 'none',
                        'stroke-width': 1.5,
                        'stroke-opacity': 1
                    },
                    hover: {
                        'fill-opacity': 0.8
                    },
                    selected: {
                        fill: 'blue'
                    },
                    selectedHover: {}
                },
                focusOn: { x: 0.4, y: 0.6, scale: opts.scale },
                markerStyle: {
                    initial: {
                        fill: opts.markerColor,
                        stroke: opts.markerColor
                    }
                },
                onRegionLabelShow: function(e, el, code) {
                    if (series && series[code])
                        el.html(el.html() + ': ' + series[code] + ' visitors');
                },
                markers: markers,
                series: {
                    regions: [{
                        values: series,
                        scale: opts.scaleColors,
                        normalizeFunction: 'polynomial'
                    }]
                },
            });

        } // end init
    };

})();
/**
 * Used for user pages
 * Login and Register
 */
(function() {
    'use strict';

    $(initParsleyForPages)

    function initParsleyForPages() {

        // Parsley options setup for bootstrap validation classes
        var parsleyOptions = {
            errorClass: 'is-invalid',
            successClass: 'is-valid',
            classHandler: function(ParsleyField) {
                var el = ParsleyField.$element.parents('.form-group').find('input');
                if (!el.length) // support custom checkbox
                    el = ParsleyField.$element.parents('.c-checkbox').find('label');
                return el;
            },
            errorsContainer: function(ParsleyField) {
                return ParsleyField.$element.parents('.form-group');
            },
            errorsWrapper: '<div class="text-help">',
            errorTemplate: '<div></div>'
        };

        // Login form validation with Parsley
        var loginForm = $("#loginForm");
        if (loginForm.length)
            loginForm.parsley(parsleyOptions);

        // Register form validation with Parsley
        var registerForm = $("#registerForm");
        if (registerForm.length)
            registerForm.parsley(parsleyOptions);

    }

})();
// BOOTGRID
// -----------------------------------

(function() {
    'use strict';

    $(initBootgrid);

    function initBootgrid() {

        if (!$.fn.bootgrid) return;

        $('#bootgrid-basic').bootgrid({
            templates: {
                // templates for BS4
                actionButton: '<button class="btn btn-secondary" type="button" title="{{ctx.text}}">{{ctx.content}}</button>',
                actionDropDown: '<div class="{{css.dropDownMenu}}"><button class="btn btn-secondary dropdown-toggle dropdown-toggle-nocaret" type="button" data-toggle="dropdown"><span class="{{css.dropDownMenuText}}">{{ctx.content}}</span></button><ul class="{{css.dropDownMenuItems}}" role="menu"></ul></div>',
                actionDropDownItem: '<li class="dropdown-item"><a href="" data-action="{{ctx.action}}" class="dropdown-link {{css.dropDownItemButton}}">{{ctx.text}}</a></li>',
                actionDropDownCheckboxItem: '<li class="dropdown-item"><label class="dropdown-item p-0"><input name="{{ctx.name}}" type="checkbox" value="1" class="{{css.dropDownItemCheckbox}}" {{ctx.checked}} /> {{ctx.label}}</label></li>',
                paginationItem: '<li class="page-item {{ctx.css}}"><a href="" data-page="{{ctx.page}}" class="page-link {{css.paginationButton}}">{{ctx.text}}</a></li>',
            }
        });

        $('#bootgrid-selection').bootgrid({
            selection: true,
            multiSelect: true,
            rowSelect: true,
            keepSelection: true,
            templates: {
                select:
                    '<div class="checkbox c-checkbox">' +
                        '<label class="mb-0">' +
                            '<input type="{{ctx.type}}" class="{{css.selectBox}}" value="{{ctx.value}}" {{ctx.checked}}>' +
                            '<span class="fa fa-check"></span>' +
                        '</label>'+
                    '</div>',
                // templates for BS4
                actionButton: '<button class="btn btn-secondary" type="button" title="{{ctx.text}}">{{ctx.content}}</button>',
                actionDropDown: '<div class="{{css.dropDownMenu}}"><button class="btn btn-secondary dropdown-toggle dropdown-toggle-nocaret" type="button" data-toggle="dropdown"><span class="{{css.dropDownMenuText}}">{{ctx.content}}</span></button><ul class="{{css.dropDownMenuItems}}" role="menu"></ul></div>',
                actionDropDownItem: '<li class="dropdown-item"><a href="" data-action="{{ctx.action}}" class="dropdown-link {{css.dropDownItemButton}}">{{ctx.text}}</a></li>',
                actionDropDownCheckboxItem: '<li class="dropdown-item"><label class="dropdown-item p-0"><input name="{{ctx.name}}" type="checkbox" value="1" class="{{css.dropDownItemCheckbox}}" {{ctx.checked}} /> {{ctx.label}}</label></li>',
                paginationItem: '<li class="page-item {{ctx.css}}"><a href="" data-page="{{ctx.page}}" class="page-link {{css.paginationButton}}">{{ctx.text}}</a></li>',
            }
        });

        var grid = $('#bootgrid-command').bootgrid({
            formatters: {
                commands: function(column, row) {
                    return '<button type="button" class="btn btn-sm btn-info mr-2 command-edit" data-row-id="' + row.id + '"><em class="fa fa-edit fa-fw"></em></button>' +
                        '<button type="button" class="btn btn-sm btn-danger command-delete" data-row-id="' + row.id + '"><em class="fa fa-trash fa-fw"></em></button>';
                }
            },
            templates: {
                // templates for BS4
                actionButton: '<button class="btn btn-secondary" type="button" title="{{ctx.text}}">{{ctx.content}}</button>',
                actionDropDown: '<div class="{{css.dropDownMenu}}"><button class="btn btn-secondary dropdown-toggle dropdown-toggle-nocaret" type="button" data-toggle="dropdown"><span class="{{css.dropDownMenuText}}">{{ctx.content}}</span></button><ul class="{{css.dropDownMenuItems}}" role="menu"></ul></div>',
                actionDropDownItem: '<li class="dropdown-item"><a href="" data-action="{{ctx.action}}" class="dropdown-link {{css.dropDownItemButton}}">{{ctx.text}}</a></li>',
                actionDropDownCheckboxItem: '<li class="dropdown-item"><label class="dropdown-item p-0"><input name="{{ctx.name}}" type="checkbox" value="1" class="{{css.dropDownItemCheckbox}}" {{ctx.checked}} /> {{ctx.label}}</label></li>',
                paginationItem: '<li class="page-item {{ctx.css}}"><a href="" data-page="{{ctx.page}}" class="page-link {{css.paginationButton}}">{{ctx.text}}</a></li>',
            }
        }).on('loaded.rs.jquery.bootgrid', function() {
            /* Executes after data is loaded and rendered */
            grid.find('.command-edit').on('click', function() {
                console.log('You pressed edit on row: ' + $(this).data('row-id'));
            }).end().find('.command-delete').on('click', function() {
                console.log('You pressed delete on row: ' + $(this).data('row-id'));
            });
        });

    }

})();
// DATATABLES
// -----------------------------------

(function() {
    'use strict';

    $(initDatatables);

    function initDatatables() {

        if (!$.fn.DataTable) return;

        // Zero configuration

        $('#datatable1').DataTable({
            'paging': true, // Table pagination
            'ordering': true, // Column ordering
            'info': true, // Bottom left status text
            responsive: true,
            // Text translation options
            // Note the required keywords between underscores (e.g _MENU_)
            oLanguage: {
                sSearch: '<em class="fas fa-search"></em>',
                sLengthMenu: '_MENU_ records per page',
                info: 'Showing page _PAGE_ of _PAGES_',
                zeroRecords: 'Nothing found - sorry',
                infoEmpty: 'No records available',
                infoFiltered: '(filtered from _MAX_ total records)',
                oPaginate: {
                    sNext: '<em class="fa fa-caret-right"></em>',
                    sPrevious: '<em class="fa fa-caret-left"></em>'
                }
            }
        });


        // Filter

        $('#datatable2').DataTable({
            'paging': true, // Table pagination
            'ordering': true, // Column ordering
            'info': true, // Bottom left status text
            responsive: true,
            // Text translation options
            // Note the required keywords between underscores (e.g _MENU_)
            oLanguage: {
                sSearch: 'Search all columns:',
                sLengthMenu: '_MENU_ records per page',
                info: 'Showing page _PAGE_ of _PAGES_',
                zeroRecords: 'Nothing found - sorry',
                infoEmpty: 'No records available',
                infoFiltered: '(filtered from _MAX_ total records)',
                oPaginate: {
                    sNext: '<em class="fa fa-caret-right"></em>',
                    sPrevious: '<em class="fa fa-caret-left"></em>'
                }
            },
            // Datatable Buttons setup
            dom: 'Bfrtip',
            buttons: [
                { extend: 'copy', className: 'btn-info' },
                { extend: 'csv', className: 'btn-info' },
                { extend: 'excel', className: 'btn-info', title: 'XLS-File' },
                { extend: 'pdf', className: 'btn-info', title: $('title').text() },
                { extend: 'print', className: 'btn-info' }
            ]
        });

        $('#datatable3').DataTable({
            'paging': true, // Table pagination
            'ordering': true, // Column ordering
            'info': true, // Bottom left status text
            responsive: true,
            // Text translation options
            // Note the required keywords between underscores (e.g _MENU_)
            oLanguage: {
                sSearch: 'Search all columns:',
                sLengthMenu: '_MENU_ records per page',
                info: 'Showing page _PAGE_ of _PAGES_',
                zeroRecords: 'Nothing found - sorry',
                infoEmpty: 'No records available',
                infoFiltered: '(filtered from _MAX_ total records)',
                oPaginate: {
                    sNext: '<em class="fa fa-caret-right"></em>',
                    sPrevious: '<em class="fa fa-caret-left"></em>'
                }
            },
            // Datatable key setup
            keys: true
        });

    }

})();
// Custom Code
// -----------------------------------

(function() {
    'use strict';

    $(initCustom);

    function initCustom() {

        // custom code

    }

})();
$(document).ready(function () {

    // Currency Separator
    var commaCounter = 10;

    function numberSeparator(Number) {
        Number += '';

        for (var i = 0; i < commaCounter; i++) {
            Number = Number.replace(',', '');
        }

        x = Number.split('.');
        y = x[0];
        z = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;

        while (rgx.test(y)) {
            y = y.replace(rgx, '$1' + ',' + '$2');
        }
        commaCounter++;
        return y + z;
    }

    // Set Currency Separator to input fields
    $(document).on('keypress , paste', '.number-separator', function (e) {
        if (/^-?\d*[,.]?(\d{0,3},)*(\d{3},)?\d{0,3}$/.test(e.key)) {
            $('.number-separator').on('input', function () {
                e.target.value = numberSeparator(e.target.value);
            });
        } else {
            e.preventDefault();
            return false;
        }
    });


})
/*! jquery-qrcode v0.17.0 - https://larsjung.de/jquery-qrcode/ */
!function(t,r){"object"==typeof exports&&"object"==typeof module?module.exports=r():"function"==typeof define&&define.amd?define("jquery-qrcode",[],r):"object"==typeof exports?exports["jquery-qrcode"]=r():t["jquery-qrcode"]=r()}("undefined"!=typeof self?self:this,function(){return function(e){var n={};function o(t){if(n[t])return n[t].exports;var r=n[t]={i:t,l:!1,exports:{}};return e[t].call(r.exports,r,r.exports,o),r.l=!0,r.exports}return o.m=e,o.c=n,o.d=function(t,r,e){o.o(t,r)||Object.defineProperty(t,r,{enumerable:!0,get:e})},o.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},o.t=function(r,t){if(1&t&&(r=o(r)),8&t)return r;if(4&t&&"object"==typeof r&&r&&r.__esModule)return r;var e=Object.create(null);if(o.r(e),Object.defineProperty(e,"default",{enumerable:!0,value:r}),2&t&&"string"!=typeof r)for(var n in r)o.d(e,n,function(t){return r[t]}.bind(null,n));return e},o.n=function(t){var r=t&&t.__esModule?function(){return t.default}:function(){return t};return o.d(r,"a",r),r},o.o=function(t,r){return Object.prototype.hasOwnProperty.call(t,r)},o.p="",o(o.s=0)}([function(v,t,p){(function(t){function c(t){return t&&"string"==typeof t.tagName&&"IMG"===t.tagName.toUpperCase()}function a(t,r,e,n){var o={},i=p(2);i.stringToBytes=i.stringToBytesFuncs["UTF-8"];var a=i(e,r);a.addData(t),a.make(),n=n||0;var u=a.getModuleCount(),s=u+2*n;return o.text=t,o.level=r,o.version=e,o.module_count=s,o.is_dark=function(t,r){return r-=n,0<=(t-=n)&&t<u&&0<=r&&r<u&&a.isDark(t,r)},o.add_blank=function(a,u,f,c){var l=o.is_dark,g=1/s;o.is_dark=function(t,r){var e=r*g,n=t*g,o=e+g,i=n+g;return l(t,r)&&(o<a||f<e||i<u||c<n)}},o}function h(t,r,e,n,o){e=Math.max(1,e||1),n=Math.min(40,n||40);for(var i=e;i<=n;i+=1)try{return a(t,r,i,o)}catch(t){}}function i(t,r,e){c(e.background)?r.drawImage(e.background,0,0,e.size,e.size):e.background&&(r.fillStyle=e.background,r.fillRect(e.left,e.top,e.size,e.size));var n=e.mode;1===n||2===n?function(t,r,e){var n=e.size,o="bold "+e.mSize*n+"px "+e.fontname,i=d("<canvas/>")[0].getContext("2d");i.font=o;var a=i.measureText(e.label).width,u=e.mSize,f=a/n,c=(1-f)*e.mPosX,l=(1-u)*e.mPosY,g=c+f,s=l+u;1===e.mode?t.add_blank(0,l-.01,n,s+.01):t.add_blank(c-.01,l-.01,.01+g,s+.01),r.fillStyle=e.fontcolor,r.font=o,r.fillText(e.label,c*n,l*n+.75*e.mSize*n)}(t,r,e):!c(e.image)||3!==n&&4!==n||function(t,r,e){var n=e.size,o=e.image.naturalWidth||1,i=e.image.naturalHeight||1,a=e.mSize,u=a*o/i,f=(1-u)*e.mPosX,c=(1-a)*e.mPosY,l=f+u,g=c+a;3===e.mode?t.add_blank(0,c-.01,n,g+.01):t.add_blank(f-.01,c-.01,.01+l,g+.01),r.drawImage(e.image,f*n,c*n,u*n,a*n)}(t,r,e)}function l(t,r,e,n,o,i,a,u){t.is_dark(a,u)&&r.rect(n,o,i,i)}function g(t,r,e,n,o,i,a,u){var f=t.is_dark,c=n+i,l=o+i,g=e.radius*i,s=a-1,h=a+1,d=u-1,v=u+1,p=f(a,u),w=f(s,d),y=f(s,u),m=f(s,v),b=f(a,v),k=f(h,v),C=f(h,u),B=f(h,d),x=f(a,d);p?function(t,r,e,n,o,i,a,u,f,c){a?t.moveTo(r+i,e):t.moveTo(r,e),u?(t.lineTo(n-i,e),t.arcTo(n,e,n,o,i)):t.lineTo(n,e),f?(t.lineTo(n,o-i),t.arcTo(n,o,r,o,i)):t.lineTo(n,o),c?(t.lineTo(r+i,o),t.arcTo(r,o,r,e,i)):t.lineTo(r,o),a?(t.lineTo(r,e+i),t.arcTo(r,e,n,e,i)):t.lineTo(r,e)}(r,n,o,c,l,g,!y&&!x,!y&&!b,!C&&!b,!C&&!x):function(t,r,e,n,o,i,a,u,f,c){a&&(t.moveTo(r+i,e),t.lineTo(r,e),t.lineTo(r,e+i),t.arcTo(r,e,r+i,e,i)),u&&(t.moveTo(n-i,e),t.lineTo(n,e),t.lineTo(n,e+i),t.arcTo(n,e,n-i,e,i)),f&&(t.moveTo(n-i,o),t.lineTo(n,o),t.lineTo(n,o-i),t.arcTo(n,o,n-i,o,i)),c&&(t.moveTo(r+i,o),t.lineTo(r,o),t.lineTo(r,o-i),t.arcTo(r,o,r+i,o,i))}(r,n,o,c,l,g,y&&x&&w,y&&b&&m,C&&b&&k,C&&x&&B)}function n(t,r){var e=h(r.text,r.ecLevel,r.minVersion,r.maxVersion,r.quiet);if(!e)return null;var n=d(t).data("qrcode",e),o=n[0].getContext("2d");return i(e,o,r),function(t,r,e){var n,o,i=t.module_count,a=e.size/i,u=l;for(0<e.radius&&e.radius<=.5&&(u=g),r.beginPath(),n=0;n<i;n+=1)for(o=0;o<i;o+=1)u(t,r,e,e.left+o*a,e.top+n*a,a,n,o);if(c(e.fill)){r.strokeStyle="rgba(0,0,0,0.5)",r.lineWidth=2,r.stroke();var f=r.globalCompositeOperation;r.globalCompositeOperation="destination-out",r.fill(),r.globalCompositeOperation=f,r.clip(),r.drawImage(e.fill,0,0,e.size,e.size),r.restore()}else r.fillStyle=e.fill,r.fill()}(e,o,r),n}function r(t){var r=d("<canvas/>").attr("width",t.size).attr("height",t.size);return n(r,t)}function o(t){return f&&"canvas"===t.render?r(t):f&&"image"===t.render?function(t){return d("<img/>").attr("src",r(t)[0].toDataURL("image/png"))}(t):function(t){var r=h(t.text,t.ecLevel,t.minVersion,t.maxVersion,t.quiet);if(!r)return null;var e,n,o=t.size,i=t.background,a=Math.floor,u=r.module_count,f=a(o/u),c=a(.5*(o-f*u)),l={position:"relative",left:0,top:0,padding:0,margin:0,width:o,height:o},g={position:"absolute",padding:0,margin:0,width:f,height:f,"background-color":t.fill},s=d("<div/>").data("qrcode",r).css(l);for(i&&s.css("background-color",i),e=0;e<u;e+=1)for(n=0;n<u;n+=1)r.is_dark(e,n)&&d("<div/>").css(g).css({left:c+n*f,top:c+e*f}).appendTo(s);return s}(t)}var e,u=t.window,d=u.jQuery,f=!(!(e=u.document.createElement("canvas")).getContext||!e.getContext("2d")),s={render:"canvas",minVersion:1,maxVersion:40,ecLevel:"L",left:0,top:0,size:200,fill:"#000",background:"#fff",text:"no text",radius:0,quiet:0,mode:0,mSize:.1,mPosX:.5,mPosY:.5,label:"no label",fontname:"sans",fontcolor:"#000",image:null};d.fn.qrcode=v.exports=function(t){var e=d.extend({},s,t);return this.each(function(t,r){"canvas"===r.nodeName.toLowerCase()?n(r,e):d(r).append(o(e))})}}).call(this,p(1))},function(t,r){var e;e=function(){return this}();try{e=e||new Function("return this")()}catch(t){"object"==typeof window&&(e=window)}t.exports=e},function(t,r,e){var n,o,i,a=function(){function i(t,r){function a(t,r){l=function(t){for(var r=new Array(t),e=0;e<t;e+=1){r[e]=new Array(t);for(var n=0;n<t;n+=1)r[e][n]=null}return r}(g=4*u+17),e(0,0),e(g-7,0),e(0,g-7),i(),o(),d(t,r),7<=u&&s(t),null==n&&(n=p(u,f,c)),v(n,r)}var u=t,f=w[r],l=null,g=0,n=null,c=[],h={},e=function(t,r){for(var e=-1;e<=7;e+=1)if(!(t+e<=-1||g<=t+e))for(var n=-1;n<=7;n+=1)r+n<=-1||g<=r+n||(l[t+e][r+n]=0<=e&&e<=6&&(0==n||6==n)||0<=n&&n<=6&&(0==e||6==e)||2<=e&&e<=4&&2<=n&&n<=4)},o=function(){for(var t=8;t<g-8;t+=1)null==l[t][6]&&(l[t][6]=t%2==0);for(var r=8;r<g-8;r+=1)null==l[6][r]&&(l[6][r]=r%2==0)},i=function(){for(var t=y.getPatternPosition(u),r=0;r<t.length;r+=1)for(var e=0;e<t.length;e+=1){var n=t[r],o=t[e];if(null==l[n][o])for(var i=-2;i<=2;i+=1)for(var a=-2;a<=2;a+=1)l[n+i][o+a]=-2==i||2==i||-2==a||2==a||0==i&&0==a}},s=function(t){for(var r=y.getBCHTypeNumber(u),e=0;e<18;e+=1){var n=!t&&1==(r>>e&1);l[Math.floor(e/3)][e%3+g-8-3]=n}for(e=0;e<18;e+=1){n=!t&&1==(r>>e&1);l[e%3+g-8-3][Math.floor(e/3)]=n}},d=function(t,r){for(var e=f<<3|r,n=y.getBCHTypeInfo(e),o=0;o<15;o+=1){var i=!t&&1==(n>>o&1);o<6?l[o][8]=i:o<8?l[o+1][8]=i:l[g-15+o][8]=i}for(o=0;o<15;o+=1){i=!t&&1==(n>>o&1);o<8?l[8][g-o-1]=i:o<9?l[8][15-o-1+1]=i:l[8][15-o-1]=i}l[g-8][8]=!t},v=function(t,r){for(var e=-1,n=g-1,o=7,i=0,a=y.getMaskFunction(r),u=g-1;0<u;u-=2)for(6==u&&(u-=1);;){for(var f=0;f<2;f+=1)if(null==l[n][u-f]){var c=!1;i<t.length&&(c=1==(t[i]>>>o&1)),a(n,u-f)&&(c=!c),l[n][u-f]=c,-1==(o-=1)&&(i+=1,o=7)}if((n+=e)<0||g<=n){n-=e,e=-e;break}}},p=function(t,r,e){for(var n=C.getRSBlocks(t,r),o=B(),i=0;i<e.length;i+=1){var a=e[i];o.put(a.getMode(),4),o.put(a.getLength(),y.getLengthInBits(a.getMode(),t)),a.write(o)}var u=0;for(i=0;i<n.length;i+=1)u+=n[i].dataCount;if(o.getLengthInBits()>8*u)throw"code length overflow. ("+o.getLengthInBits()+">"+8*u+")";for(o.getLengthInBits()+4<=8*u&&o.put(0,4);o.getLengthInBits()%8!=0;)o.putBit(!1);for(;!(o.getLengthInBits()>=8*u||(o.put(236,8),o.getLengthInBits()>=8*u));)o.put(17,8);return function(t,r){for(var e=0,n=0,o=0,i=new Array(r.length),a=new Array(r.length),u=0;u<r.length;u+=1){var f=r[u].dataCount,c=r[u].totalCount-f;n=Math.max(n,f),o=Math.max(o,c),i[u]=new Array(f);for(var l=0;l<i[u].length;l+=1)i[u][l]=255&t.getBuffer()[l+e];e+=f;var g=y.getErrorCorrectPolynomial(c),s=m(i[u],g.getLength()-1).mod(g);for(a[u]=new Array(g.getLength()-1),l=0;l<a[u].length;l+=1){var h=l+s.getLength()-a[u].length;a[u][l]=0<=h?s.getAt(h):0}}var d=0;for(l=0;l<r.length;l+=1)d+=r[l].totalCount;var v=new Array(d),p=0;for(l=0;l<n;l+=1)for(u=0;u<r.length;u+=1)l<i[u].length&&(v[p]=i[u][l],p+=1);for(l=0;l<o;l+=1)for(u=0;u<r.length;u+=1)l<a[u].length&&(v[p]=a[u][l],p+=1);return v}(o,n)};return h.addData=function(t,r){var e=null;switch(r=r||"Byte"){case"Numeric":e=x(t);break;case"Alphanumeric":e=T(t);break;case"Byte":e=M(t);break;case"Kanji":e=A(t);break;default:throw"mode:"+r}c.push(e),n=null},h.isDark=function(t,r){if(t<0||g<=t||r<0||g<=r)throw t+","+r;return l[t][r]},h.getModuleCount=function(){return g},h.make=function(){if(u<1){for(var t=1;t<40;t++){for(var r=C.getRSBlocks(t,f),e=B(),n=0;n<c.length;n++){var o=c[n];e.put(o.getMode(),4),e.put(o.getLength(),y.getLengthInBits(o.getMode(),t)),o.write(e)}var i=0;for(n=0;n<r.length;n++)i+=r[n].dataCount;if(e.getLengthInBits()<=8*i)break}u=t}a(!1,function(){for(var t=0,r=0,e=0;e<8;e+=1){a(!0,e);var n=y.getLostPoint(h);(0==e||n<t)&&(t=n,r=e)}return r}())},h.createTableTag=function(t,r){t=t||2;var e="";e+='<table style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: "+(r=void 0===r?4*t:r)+"px;",e+='">',e+="<tbody>";for(var n=0;n<h.getModuleCount();n+=1){e+="<tr>";for(var o=0;o<h.getModuleCount();o+=1)e+='<td style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: 0px;",e+=" width: "+t+"px;",e+=" height: "+t+"px;",e+=" background-color: ",e+=h.isDark(n,o)?"#000000":"#ffffff",e+=";",e+='"/>';e+="</tr>"}return e+="</tbody>",e+="</table>"},h.createSvgTag=function(t,r){var e={};"object"==typeof t&&(t=(e=t).cellSize,r=e.margin),t=t||2,r=void 0===r?4*t:r;var n,o,i,a,u=h.getModuleCount()*t+2*r,f="";for(a="l"+t+",0 0,"+t+" -"+t+",0 0,-"+t+"z ",f+='<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',f+=e.scalable?"":' width="'+u+'px" height="'+u+'px"',f+=' viewBox="0 0 '+u+" "+u+'" ',f+=' preserveAspectRatio="xMinYMin meet">',f+='<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',f+='<path d="',o=0;o<h.getModuleCount();o+=1)for(i=o*t+r,n=0;n<h.getModuleCount();n+=1)h.isDark(o,n)&&(f+="M"+(n*t+r)+","+i+a);return f+='" stroke="transparent" fill="black"/>',f+="</svg>"},h.createDataURL=function(o,t){o=o||2,t=void 0===t?4*o:t;var r=h.getModuleCount()*o+2*t,i=t,a=r-t;return L(r,r,function(t,r){if(i<=t&&t<a&&i<=r&&r<a){var e=Math.floor((t-i)/o),n=Math.floor((r-i)/o);return h.isDark(n,e)?0:1}return 1})},h.createImgTag=function(t,r,e){t=t||2,r=void 0===r?4*t:r;var n=h.getModuleCount()*t+2*r,o="";return o+="<img",o+=' src="',o+=h.createDataURL(t,r),o+='"',o+=' width="',o+=n,o+='"',o+=' height="',o+=n,o+='"',e&&(o+=' alt="',o+=e,o+='"'),o+="/>"},h.createASCII=function(t,r){if((t=t||1)<2)return function(t){t=void 0===t?2:t;var r,e,n,o,i,a=1*h.getModuleCount()+2*t,u=t,f=a-t,c={"██":"█","█ ":"▀"," █":"▄","  ":" "},l={"██":"▀","█ ":"▀"," █":" ","  ":" "},g="";for(r=0;r<a;r+=2){for(n=Math.floor((r-u)/1),o=Math.floor((r+1-u)/1),e=0;e<a;e+=1)i="█",u<=e&&e<f&&u<=r&&r<f&&h.isDark(n,Math.floor((e-u)/1))&&(i=" "),u<=e&&e<f&&u<=r+1&&r+1<f&&h.isDark(o,Math.floor((e-u)/1))?i+=" ":i+="█",g+=t<1&&f<=r+1?l[i]:c[i];g+="\n"}return a%2&&0<t?g.substring(0,g.length-a-1)+Array(1+a).join("▀"):g.substring(0,g.length-1)}(r);t-=1,r=void 0===r?2*t:r;var e,n,o,i,a=h.getModuleCount()*t+2*r,u=r,f=a-r,c=Array(t+1).join("██"),l=Array(t+1).join("  "),g="",s="";for(e=0;e<a;e+=1){for(o=Math.floor((e-u)/t),s="",n=0;n<a;n+=1)i=1,u<=n&&n<f&&u<=e&&e<f&&h.isDark(o,Math.floor((n-u)/t))&&(i=0),s+=i?c:l;for(o=0;o<t;o+=1)g+=s+"\n"}return g.substring(0,g.length-1)},h.renderTo2dContext=function(t,r){r=r||2;for(var e=h.getModuleCount(),n=0;n<e;n++)for(var o=0;o<e;o++)t.fillStyle=h.isDark(n,o)?"black":"white",t.fillRect(n*r,o*r,r,r)},h}i.stringToBytes=(i.stringToBytesFuncs={default:function(t){for(var r=[],e=0;e<t.length;e+=1){var n=t.charCodeAt(e);r.push(255&n)}return r}}).default,i.createStringToBytes=function(u,f){var i=function(){function t(){var t=r.read();if(-1==t)throw"eof";return t}for(var r=S(u),e=0,n={};;){var o=r.read();if(-1==o)break;var i=t(),a=t()<<8|t();n[String.fromCharCode(o<<8|i)]=a,e+=1}if(e!=f)throw e+" != "+f;return n}(),a="?".charCodeAt(0);return function(t){for(var r=[],e=0;e<t.length;e+=1){var n=t.charCodeAt(e);if(n<128)r.push(n);else{var o=i[t.charAt(e)];"number"==typeof o?(255&o)==o?r.push(o):(r.push(o>>>8),r.push(255&o)):r.push(a)}}return r}};var a=1,u=2,o=4,f=8,w={L:1,M:0,Q:3,H:2},n=0,c=1,l=2,g=3,s=4,h=5,d=6,v=7,y=function(){function e(t){for(var r=0;0!=t;)r+=1,t>>>=1;return r}var r=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],t={};return t.getBCHTypeInfo=function(t){for(var r=t<<10;0<=e(r)-e(1335);)r^=1335<<e(r)-e(1335);return 21522^(t<<10|r)},t.getBCHTypeNumber=function(t){for(var r=t<<12;0<=e(r)-e(7973);)r^=7973<<e(r)-e(7973);return t<<12|r},t.getPatternPosition=function(t){return r[t-1]},t.getMaskFunction=function(t){switch(t){case n:return function(t,r){return(t+r)%2==0};case c:return function(t,r){return t%2==0};case l:return function(t,r){return r%3==0};case g:return function(t,r){return(t+r)%3==0};case s:return function(t,r){return(Math.floor(t/2)+Math.floor(r/3))%2==0};case h:return function(t,r){return t*r%2+t*r%3==0};case d:return function(t,r){return(t*r%2+t*r%3)%2==0};case v:return function(t,r){return(t*r%3+(t+r)%2)%2==0};default:throw"bad maskPattern:"+t}},t.getErrorCorrectPolynomial=function(t){for(var r=m([1],0),e=0;e<t;e+=1)r=r.multiply(m([1,p.gexp(e)],0));return r},t.getLengthInBits=function(t,r){if(1<=r&&r<10)switch(t){case a:return 10;case u:return 9;case o:case f:return 8;default:throw"mode:"+t}else if(r<27)switch(t){case a:return 12;case u:return 11;case o:return 16;case f:return 10;default:throw"mode:"+t}else{if(!(r<41))throw"type:"+r;switch(t){case a:return 14;case u:return 13;case o:return 16;case f:return 12;default:throw"mode:"+t}}},t.getLostPoint=function(t){for(var r=t.getModuleCount(),e=0,n=0;n<r;n+=1)for(var o=0;o<r;o+=1){for(var i=0,a=t.isDark(n,o),u=-1;u<=1;u+=1)if(!(n+u<0||r<=n+u))for(var f=-1;f<=1;f+=1)o+f<0||r<=o+f||0==u&&0==f||a==t.isDark(n+u,o+f)&&(i+=1);5<i&&(e+=3+i-5)}for(n=0;n<r-1;n+=1)for(o=0;o<r-1;o+=1){var c=0;t.isDark(n,o)&&(c+=1),t.isDark(n+1,o)&&(c+=1),t.isDark(n,o+1)&&(c+=1),t.isDark(n+1,o+1)&&(c+=1),0!=c&&4!=c||(e+=3)}for(n=0;n<r;n+=1)for(o=0;o<r-6;o+=1)t.isDark(n,o)&&!t.isDark(n,o+1)&&t.isDark(n,o+2)&&t.isDark(n,o+3)&&t.isDark(n,o+4)&&!t.isDark(n,o+5)&&t.isDark(n,o+6)&&(e+=40);for(o=0;o<r;o+=1)for(n=0;n<r-6;n+=1)t.isDark(n,o)&&!t.isDark(n+1,o)&&t.isDark(n+2,o)&&t.isDark(n+3,o)&&t.isDark(n+4,o)&&!t.isDark(n+5,o)&&t.isDark(n+6,o)&&(e+=40);var l=0;for(o=0;o<r;o+=1)for(n=0;n<r;n+=1)t.isDark(n,o)&&(l+=1);return e+=10*(Math.abs(100*l/r/r-50)/5)},t}(),p=function(){for(var r=new Array(256),e=new Array(256),t=0;t<8;t+=1)r[t]=1<<t;for(t=8;t<256;t+=1)r[t]=r[t-4]^r[t-5]^r[t-6]^r[t-8];for(t=0;t<255;t+=1)e[r[t]]=t;var n={glog:function(t){if(t<1)throw"glog("+t+")";return e[t]},gexp:function(t){for(;t<0;)t+=255;for(;256<=t;)t-=255;return r[t]}};return n}();function m(n,o){if(void 0===n.length)throw n.length+"/"+o;var r=function(){for(var t=0;t<n.length&&0==n[t];)t+=1;for(var r=new Array(n.length-t+o),e=0;e<n.length-t;e+=1)r[e]=n[e+t];return r}(),i={getAt:function(t){return r[t]},getLength:function(){return r.length},multiply:function(t){for(var r=new Array(i.getLength()+t.getLength()-1),e=0;e<i.getLength();e+=1)for(var n=0;n<t.getLength();n+=1)r[e+n]^=p.gexp(p.glog(i.getAt(e))+p.glog(t.getAt(n)));return m(r,0)},mod:function(t){if(i.getLength()-t.getLength()<0)return i;for(var r=p.glog(i.getAt(0))-p.glog(t.getAt(0)),e=new Array(i.getLength()),n=0;n<i.getLength();n+=1)e[n]=i.getAt(n);for(n=0;n<t.getLength();n+=1)e[n]^=p.gexp(p.glog(t.getAt(n))+r);return m(e,0).mod(t)}};return i}function b(){var e=[],o={writeByte:function(t){e.push(255&t)},writeShort:function(t){o.writeByte(t),o.writeByte(t>>>8)},writeBytes:function(t,r,e){r=r||0,e=e||t.length;for(var n=0;n<e;n+=1)o.writeByte(t[n+r])},writeString:function(t){for(var r=0;r<t.length;r+=1)o.writeByte(t.charCodeAt(r))},toByteArray:function(){return e},toString:function(){var t="";t+="[";for(var r=0;r<e.length;r+=1)0<r&&(t+=","),t+=e[r];return t+="]"}};return o}var k,t,C=(k=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],(t={}).getRSBlocks=function(t,r){var e=function(t,r){switch(r){case w.L:return k[4*(t-1)+0];case w.M:return k[4*(t-1)+1];case w.Q:return k[4*(t-1)+2];case w.H:return k[4*(t-1)+3];default:return}}(t,r);if(void 0===e)throw"bad rs block @ typeNumber:"+t+"/errorCorrectionLevel:"+r;for(var n,o,i=e.length/3,a=[],u=0;u<i;u+=1)for(var f=e[3*u+0],c=e[3*u+1],l=e[3*u+2],g=0;g<f;g+=1)a.push((n=l,o=void 0,(o={}).totalCount=c,o.dataCount=n,o));return a},t),B=function(){var e=[],n=0,o={getBuffer:function(){return e},getAt:function(t){var r=Math.floor(t/8);return 1==(e[r]>>>7-t%8&1)},put:function(t,r){for(var e=0;e<r;e+=1)o.putBit(1==(t>>>r-e-1&1))},getLengthInBits:function(){return n},putBit:function(t){var r=Math.floor(n/8);e.length<=r&&e.push(0),t&&(e[r]|=128>>>n%8),n+=1}};return o},x=function(t){var r=a,n=t,e={getMode:function(){return r},getLength:function(t){return n.length},write:function(t){for(var r=n,e=0;e+2<r.length;)t.put(o(r.substring(e,e+3)),10),e+=3;e<r.length&&(r.length-e==1?t.put(o(r.substring(e,e+1)),4):r.length-e==2&&t.put(o(r.substring(e,e+2)),7))}},o=function(t){for(var r=0,e=0;e<t.length;e+=1)r=10*r+i(t.charAt(e));return r},i=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);throw"illegal char :"+t};return e},T=function(t){var r=u,n=t,e={getMode:function(){return r},getLength:function(t){return n.length},write:function(t){for(var r=n,e=0;e+1<r.length;)t.put(45*o(r.charAt(e))+o(r.charAt(e+1)),11),e+=2;e<r.length&&t.put(o(r.charAt(e)),6)}},o=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);if("A"<=t&&t<="Z")return t.charCodeAt(0)-"A".charCodeAt(0)+10;switch(t){case" ":return 36;case"$":return 37;case"%":return 38;case"*":return 39;case"+":return 40;case"-":return 41;case".":return 42;case"/":return 43;case":":return 44;default:throw"illegal char :"+t}};return e},M=function(t){var r=o,e=i.stringToBytes(t),n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=0;r<e.length;r+=1)t.put(e[r],8)}};return n},A=function(t){var r=f,n=i.stringToBytesFuncs.SJIS;if(!n)throw"sjis not supported.";!function(t,r){var e=n("友");if(2!=e.length||38726!=(e[0]<<8|e[1]))throw"sjis not supported."}();var o=n(t),e={getMode:function(){return r},getLength:function(t){return~~(o.length/2)},write:function(t){for(var r=o,e=0;e+1<r.length;){var n=(255&r[e])<<8|255&r[e+1];if(33088<=n&&n<=40956)n-=33088;else{if(!(57408<=n&&n<=60351))throw"illegal char at "+(e+1)+"/"+n;n-=49472}n=192*(n>>>8&255)+(255&n),t.put(n,13),e+=2}if(e<r.length)throw"illegal char at "+(e+1)}};return e},S=function(t){var e=t,n=0,o=0,i=0,r={read:function(){for(;i<8;){if(n>=e.length){if(0==i)return-1;throw"unexpected end of file./"+i}var t=e.charAt(n);if(n+=1,"="==t)return i=0,-1;t.match(/^\s$/)||(o=o<<6|a(t.charCodeAt(0)),i+=6)}var r=o>>>i-8&255;return i-=8,r}},a=function(t){if(65<=t&&t<=90)return t-65;if(97<=t&&t<=122)return t-97+26;if(48<=t&&t<=57)return t-48+52;if(43==t)return 62;if(47==t)return 63;throw"c:"+t};return r},L=function(t,r,e){for(var n=function(t,r){var n=t,o=r,g=new Array(t*r),e={setPixel:function(t,r,e){g[r*n+t]=e},write:function(t){t.writeString("GIF87a"),t.writeShort(n),t.writeShort(o),t.writeByte(128),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(255),t.writeByte(255),t.writeByte(255),t.writeString(","),t.writeShort(0),t.writeShort(0),t.writeShort(n),t.writeShort(o),t.writeByte(0);var r=i(2);t.writeByte(2);for(var e=0;255<r.length-e;)t.writeByte(255),t.writeBytes(r,e,255),e+=255;t.writeByte(r.length-e),t.writeBytes(r,e,r.length-e),t.writeByte(0),t.writeString(";")}},i=function(t){for(var r=1<<t,e=1+(1<<t),n=t+1,o=s(),i=0;i<r;i+=1)o.add(String.fromCharCode(i));o.add(String.fromCharCode(r)),o.add(String.fromCharCode(e));var a=b(),u=function(t){var e=t,n=0,o=0,r={write:function(t,r){if(t>>>r!=0)throw"length over";for(;8<=n+r;)e.writeByte(255&(t<<n|o)),r-=8-n,t>>>=8-n,n=o=0;o|=t<<n,n+=r},flush:function(){0<n&&e.writeByte(o)}};return r}(a);u.write(r,n);var f=0,c=String.fromCharCode(g[f]);for(f+=1;f<g.length;){var l=String.fromCharCode(g[f]);f+=1,o.contains(c+l)?c+=l:(u.write(o.indexOf(c),n),o.size()<4095&&(o.size()==1<<n&&(n+=1),o.add(c+l)),c=l)}return u.write(o.indexOf(c),n),u.write(e,n),u.flush(),a.toByteArray()},s=function(){var r={},e=0,n={add:function(t){if(n.contains(t))throw"dup key:"+t;r[t]=e,e+=1},size:function(){return e},indexOf:function(t){return r[t]},contains:function(t){return void 0!==r[t]}};return n};return e}(t,r),o=0;o<r;o+=1)for(var i=0;i<t;i+=1)n.setPixel(i,o,e(i,o));var a=b();n.write(a);for(var u=function(){function e(t){a+=String.fromCharCode(r(63&t))}var n=0,o=0,i=0,a="",t={},r=function(t){if(t<0);else{if(t<26)return 65+t;if(t<52)return t-26+97;if(t<62)return t-52+48;if(62==t)return 43;if(63==t)return 47}throw"n:"+t};return t.writeByte=function(t){for(n=n<<8|255&t,o+=8,i+=1;6<=o;)e(n>>>o-6),o-=6},t.flush=function(){if(0<o&&(e(n<<6-o),o=n=0),i%3!=0)for(var t=3-i%3,r=0;r<t;r+=1)a+="="},t.toString=function(){return a},t}(),f=a.toByteArray(),c=0;c<f.length;c+=1)u.writeByte(f[c]);return u.flush(),"data:image/gif;base64,"+u};return i}();a.stringToBytesFuncs["UTF-8"]=function(t){return function(t){for(var r=[],e=0;e<t.length;e++){var n=t.charCodeAt(e);n<128?r.push(n):n<2048?r.push(192|n>>6,128|63&n):n<55296||57344<=n?r.push(224|n>>12,128|n>>6&63,128|63&n):(e++,n=65536+((1023&n)<<10|1023&t.charCodeAt(e)),r.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|63&n))}return r}(t)},o=[],void 0===(i="function"==typeof(n=function(){return a})?n.apply(r,o):n)||(t.exports=i)}])});
/**
 * jQuery CSS Customizable Scrollbar
 *
 * Copyright 2015, Yuriy Khabarov
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * If you found bug, please contact me via email <13real008@gmail.com>
 *
 * Compressed by http://jscompress.com/
 *
 * @author Yuriy Khabarov aka Gromo
 * @version 0.2.10
 * @url https://github.com/gromo/jquery.scrollbar/
 *
 */
!function(l,e){"function"==typeof define&&define.amd?define(["jquery"],e):e(l.jQuery)}(this,function(l){"use strict";function e(e){if(t.webkit&&!e)return{height:0,width:0};if(!t.data.outer){var o={border:"none","box-sizing":"content-box",height:"200px",margin:"0",padding:"0",width:"200px"};t.data.inner=l("<div>").css(l.extend({},o)),t.data.outer=l("<div>").css(l.extend({left:"-1000px",overflow:"scroll",position:"absolute",top:"-1000px"},o)).append(t.data.inner).appendTo("body")}return t.data.outer.scrollLeft(1e3).scrollTop(1e3),{height:Math.ceil(t.data.outer.offset().top-t.data.inner.offset().top||0),width:Math.ceil(t.data.outer.offset().left-t.data.inner.offset().left||0)}}function o(){var l=e(!0);return!(l.height||l.width)}function s(l){var e=l.originalEvent;return e.axis&&e.axis===e.HORIZONTAL_AXIS?!1:e.wheelDeltaX?!1:!0}var r=!1,t={data:{index:0,name:"scrollbar"},macosx:/mac/i.test(navigator.platform),mobile:/android|webos|iphone|ipad|ipod|blackberry/i.test(navigator.userAgent),overlay:null,scroll:null,scrolls:[],webkit:/webkit/i.test(navigator.userAgent)&&!/edge\/\d+/i.test(navigator.userAgent)};t.scrolls.add=function(l){this.remove(l).push(l)},t.scrolls.remove=function(e){for(;l.inArray(e,this)>=0;)this.splice(l.inArray(e,this),1);return this};var i={autoScrollSize:!0,autoUpdate:!0,debug:!1,disableBodyScroll:!1,duration:200,ignoreMobile:!1,ignoreOverlay:!1,scrollStep:30,showArrows:!1,stepScrolling:!0,scrollx:null,scrolly:null,onDestroy:null,onInit:null,onScroll:null,onUpdate:null},n=function(s){t.scroll||(t.overlay=o(),t.scroll=e(),a(),l(window).resize(function(){var l=!1;if(t.scroll&&(t.scroll.height||t.scroll.width)){var o=e();(o.height!==t.scroll.height||o.width!==t.scroll.width)&&(t.scroll=o,l=!0)}a(l)})),this.container=s,this.namespace=".scrollbar_"+t.data.index++,this.options=l.extend({},i,window.jQueryScrollbarOptions||{}),this.scrollTo=null,this.scrollx={},this.scrolly={},s.data(t.data.name,this),t.scrolls.add(this)};n.prototype={destroy:function(){if(this.wrapper){this.container.removeData(t.data.name),t.scrolls.remove(this);var e=this.container.scrollLeft(),o=this.container.scrollTop();this.container.insertBefore(this.wrapper).css({height:"",margin:"","max-height":""}).removeClass("scroll-content scroll-scrollx_visible scroll-scrolly_visible").off(this.namespace).scrollLeft(e).scrollTop(o),this.scrollx.scroll.removeClass("scroll-scrollx_visible").find("div").andSelf().off(this.namespace),this.scrolly.scroll.removeClass("scroll-scrolly_visible").find("div").andSelf().off(this.namespace),this.wrapper.remove(),l(document).add("body").off(this.namespace),l.isFunction(this.options.onDestroy)&&this.options.onDestroy.apply(this,[this.container])}},init:function(e){var o=this,r=this.container,i=this.containerWrapper||r,n=this.namespace,c=l.extend(this.options,e||{}),a={x:this.scrollx,y:this.scrolly},d=this.wrapper,h={scrollLeft:r.scrollLeft(),scrollTop:r.scrollTop()};if(t.mobile&&c.ignoreMobile||t.overlay&&c.ignoreOverlay||t.macosx&&!t.webkit)return!1;if(d)i.css({height:"auto","margin-bottom":-1*t.scroll.height+"px","margin-right":-1*t.scroll.width+"px","max-height":""});else{if(this.wrapper=d=l("<div>").addClass("scroll-wrapper").addClass(r.attr("class")).css("position","absolute"==r.css("position")?"absolute":"relative").insertBefore(r).append(r),r.is("textarea")&&(this.containerWrapper=i=l("<div>").insertBefore(r).append(r),d.addClass("scroll-textarea")),i.addClass("scroll-content").css({height:"auto","margin-bottom":-1*t.scroll.height+"px","margin-right":-1*t.scroll.width+"px","max-height":""}),r.on("scroll"+n,function(e){l.isFunction(c.onScroll)&&c.onScroll.call(o,{maxScroll:a.y.maxScrollOffset,scroll:r.scrollTop(),size:a.y.size,visible:a.y.visible},{maxScroll:a.x.maxScrollOffset,scroll:r.scrollLeft(),size:a.x.size,visible:a.x.visible}),a.x.isVisible&&a.x.scroll.bar.css("left",r.scrollLeft()*a.x.kx+"px"),a.y.isVisible&&a.y.scroll.bar.css("top",r.scrollTop()*a.y.kx+"px")}),d.on("scroll"+n,function(){d.scrollTop(0).scrollLeft(0)}),c.disableBodyScroll){var p=function(l){s(l)?a.y.isVisible&&a.y.mousewheel(l):a.x.isVisible&&a.x.mousewheel(l)};d.on("MozMousePixelScroll"+n,p),d.on("mousewheel"+n,p),t.mobile&&d.on("touchstart"+n,function(e){var o=e.originalEvent.touches&&e.originalEvent.touches[0]||e,s={pageX:o.pageX,pageY:o.pageY},t={left:r.scrollLeft(),top:r.scrollTop()};l(document).on("touchmove"+n,function(l){var e=l.originalEvent.targetTouches&&l.originalEvent.targetTouches[0]||l;r.scrollLeft(t.left+s.pageX-e.pageX),r.scrollTop(t.top+s.pageY-e.pageY),l.preventDefault()}),l(document).on("touchend"+n,function(){l(document).off(n)})})}l.isFunction(c.onInit)&&c.onInit.apply(this,[r])}l.each(a,function(e,t){var i=null,d=1,h="x"===e?"scrollLeft":"scrollTop",p=c.scrollStep,u=function(){var l=r[h]();r[h](l+p),1==d&&l+p>=f&&(l=r[h]()),-1==d&&f>=l+p&&(l=r[h]()),r[h]()==l&&i&&i()},f=0;t.scroll||(t.scroll=o._getScroll(c["scroll"+e]).addClass("scroll-"+e),c.showArrows&&t.scroll.addClass("scroll-element_arrows_visible"),t.mousewheel=function(l){if(!t.isVisible||"x"===e&&s(l))return!0;if("y"===e&&!s(l))return a.x.mousewheel(l),!0;var i=-1*l.originalEvent.wheelDelta||l.originalEvent.detail,n=t.size-t.visible-t.offset;return(i>0&&n>f||0>i&&f>0)&&(f+=i,0>f&&(f=0),f>n&&(f=n),o.scrollTo=o.scrollTo||{},o.scrollTo[h]=f,setTimeout(function(){o.scrollTo&&(r.stop().animate(o.scrollTo,240,"linear",function(){f=r[h]()}),o.scrollTo=null)},1)),l.preventDefault(),!1},t.scroll.on("MozMousePixelScroll"+n,t.mousewheel).on("mousewheel"+n,t.mousewheel).on("mouseenter"+n,function(){f=r[h]()}),t.scroll.find(".scroll-arrow, .scroll-element_track").on("mousedown"+n,function(s){if(1!=s.which)return!0;d=1;var n={eventOffset:s["x"===e?"pageX":"pageY"],maxScrollValue:t.size-t.visible-t.offset,scrollbarOffset:t.scroll.bar.offset()["x"===e?"left":"top"],scrollbarSize:t.scroll.bar["x"===e?"outerWidth":"outerHeight"]()},a=0,v=0;return l(this).hasClass("scroll-arrow")?(d=l(this).hasClass("scroll-arrow_more")?1:-1,p=c.scrollStep*d,f=d>0?n.maxScrollValue:0):(d=n.eventOffset>n.scrollbarOffset+n.scrollbarSize?1:n.eventOffset<n.scrollbarOffset?-1:0,p=Math.round(.75*t.visible)*d,f=n.eventOffset-n.scrollbarOffset-(c.stepScrolling?1==d?n.scrollbarSize:0:Math.round(n.scrollbarSize/2)),f=r[h]()+f/t.kx),o.scrollTo=o.scrollTo||{},o.scrollTo[h]=c.stepScrolling?r[h]()+p:f,c.stepScrolling&&(i=function(){f=r[h](),clearInterval(v),clearTimeout(a),a=0,v=0},a=setTimeout(function(){v=setInterval(u,40)},c.duration+100)),setTimeout(function(){o.scrollTo&&(r.animate(o.scrollTo,c.duration),o.scrollTo=null)},1),o._handleMouseDown(i,s)}),t.scroll.bar.on("mousedown"+n,function(s){if(1!=s.which)return!0;var i=s["x"===e?"pageX":"pageY"],c=r[h]();return t.scroll.addClass("scroll-draggable"),l(document).on("mousemove"+n,function(l){var o=parseInt((l["x"===e?"pageX":"pageY"]-i)/t.kx,10);r[h](c+o)}),o._handleMouseDown(function(){t.scroll.removeClass("scroll-draggable"),f=r[h]()},s)}))}),l.each(a,function(l,e){var o="scroll-scroll"+l+"_visible",s="x"==l?a.y:a.x;e.scroll.removeClass(o),s.scroll.removeClass(o),i.removeClass(o)}),l.each(a,function(e,o){l.extend(o,"x"==e?{offset:parseInt(r.css("left"),10)||0,size:r.prop("scrollWidth"),visible:d.width()}:{offset:parseInt(r.css("top"),10)||0,size:r.prop("scrollHeight"),visible:d.height()})}),this._updateScroll("x",this.scrollx),this._updateScroll("y",this.scrolly),l.isFunction(c.onUpdate)&&c.onUpdate.apply(this,[r]),l.each(a,function(l,e){var o="x"===l?"left":"top",s="x"===l?"outerWidth":"outerHeight",t="x"===l?"width":"height",i=parseInt(r.css(o),10)||0,n=e.size,a=e.visible+i,d=e.scroll.size[s]()+(parseInt(e.scroll.size.css(o),10)||0);c.autoScrollSize&&(e.scrollbarSize=parseInt(d*a/n,10),e.scroll.bar.css(t,e.scrollbarSize+"px")),e.scrollbarSize=e.scroll.bar[s](),e.kx=(d-e.scrollbarSize)/(n-a)||1,e.maxScrollOffset=n-a}),r.scrollLeft(h.scrollLeft).scrollTop(h.scrollTop).trigger("scroll")},_getScroll:function(e){var o={advanced:['<div class="scroll-element">','<div class="scroll-element_corner"></div>','<div class="scroll-arrow scroll-arrow_less"></div>','<div class="scroll-arrow scroll-arrow_more"></div>','<div class="scroll-element_outer">','<div class="scroll-element_size"></div>','<div class="scroll-element_inner-wrapper">','<div class="scroll-element_inner scroll-element_track">','<div class="scroll-element_inner-bottom"></div>',"</div>","</div>",'<div class="scroll-bar">','<div class="scroll-bar_body">','<div class="scroll-bar_body-inner"></div>',"</div>",'<div class="scroll-bar_bottom"></div>','<div class="scroll-bar_center"></div>',"</div>","</div>","</div>"].join(""),simple:['<div class="scroll-element">','<div class="scroll-element_outer">','<div class="scroll-element_size"></div>','<div class="scroll-element_track"></div>','<div class="scroll-bar"></div>',"</div>","</div>"].join("")};return o[e]&&(e=o[e]),e||(e=o.simple),e="string"==typeof e?l(e).appendTo(this.wrapper):l(e),l.extend(e,{bar:e.find(".scroll-bar"),size:e.find(".scroll-element_size"),track:e.find(".scroll-element_track")}),e},_handleMouseDown:function(e,o){var s=this.namespace;return l(document).on("blur"+s,function(){l(document).add("body").off(s),e&&e()}),l(document).on("dragstart"+s,function(l){return l.preventDefault(),!1}),l(document).on("mouseup"+s,function(){l(document).add("body").off(s),e&&e()}),l("body").on("selectstart"+s,function(l){return l.preventDefault(),!1}),o&&o.preventDefault(),!1},_updateScroll:function(e,o){var s=this.container,r=this.containerWrapper||s,i="scroll-scroll"+e+"_visible",n="x"===e?this.scrolly:this.scrollx,c=parseInt(this.container.css("x"===e?"left":"top"),10)||0,a=this.wrapper,d=o.size,h=o.visible+c;o.isVisible=d-h>1,o.isVisible?(o.scroll.addClass(i),n.scroll.addClass(i),r.addClass(i)):(o.scroll.removeClass(i),n.scroll.removeClass(i),r.removeClass(i)),"y"===e&&(s.is("textarea")||h>d?r.css({height:h+t.scroll.height+"px","max-height":"none"}):r.css({"max-height":h+t.scroll.height+"px"})),(o.size!=s.prop("scrollWidth")||n.size!=s.prop("scrollHeight")||o.visible!=a.width()||n.visible!=a.height()||o.offset!=(parseInt(s.css("left"),10)||0)||n.offset!=(parseInt(s.css("top"),10)||0))&&(l.extend(this.scrollx,{offset:parseInt(s.css("left"),10)||0,size:s.prop("scrollWidth"),visible:a.width()}),l.extend(this.scrolly,{offset:parseInt(s.css("top"),10)||0,size:this.container.prop("scrollHeight"),visible:a.height()}),this._updateScroll("x"===e?"y":"x",n))}};var c=n;l.fn.scrollbar=function(e,o){return"string"!=typeof e&&(o=e,e="init"),"undefined"==typeof o&&(o=[]),l.isArray(o)||(o=[o]),this.not("body, .scroll-wrapper").each(function(){var s=l(this),r=s.data(t.data.name);(r||"init"===e)&&(r||(r=new c(s)),r[e]&&r[e].apply(r,o))}),this},l.fn.scrollbar.options=i;var a=function(){var l=0,e=0;return function(o){var s,i,n,c,d,h,p;for(s=0;s<t.scrolls.length;s++)c=t.scrolls[s],i=c.container,n=c.options,d=c.wrapper,h=c.scrollx,p=c.scrolly,(o||n.autoUpdate&&d&&d.is(":visible")&&(i.prop("scrollWidth")!=h.size||i.prop("scrollHeight")!=p.size||d.width()!=h.visible||d.height()!=p.visible))&&(c.init(),n.debug&&(window.console&&console.log({scrollHeight:i.prop("scrollHeight")+":"+c.scrolly.size,scrollWidth:i.prop("scrollWidth")+":"+c.scrollx.size,visibleHeight:d.height()+":"+c.scrolly.visible,visibleWidth:d.width()+":"+c.scrollx.visible},!0),e++));r&&e>10?(window.console&&console.log("Scroll updates exceed 10"),a=function(){}):(clearTimeout(l),l=setTimeout(a,300))}}();window.angular&&!function(l){l.module("jQueryScrollbar",[]).provider("jQueryScrollbar",function(){var e=i;return{setOptions:function(o){l.extend(e,o)},$get:function(){return{options:l.copy(e)}}}}).directive("jqueryScrollbar",["jQueryScrollbar","$parse",function(l,e){return{restrict:"AC",link:function(o,s,r){var t=e(r.jqueryScrollbar),i=t(o);s.scrollbar(i||l.options).on("$destroy",function(){s.scrollbar("destroy")})}}}])}(window.angular)});

/*
 * LatinNumerosALetras.js
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Daniel M. Spiridione
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @author Daniel M. Spiridione (info@daniel-spiridione.com.ar)
 */
function unidades(num) {
    switch (num) {
        case 1: return 'Un';
        case 2: return 'Dos';
        case 3: return 'Tres';
        case 4: return 'Cuatro';
        case 5: return 'Cinco';
        case 6: return 'Seis';
        case 7: return 'Siete';
        case 8: return 'Ocho';
        case 9: return 'Nueve';
        default: return '';
    }
}

function decenasY(strSin, numUnidades) {
    if (numUnidades > 0) {
        return `${strSin} y ${unidades(numUnidades)}`;
    }

    return strSin;
}

function decenas(num) {
    const numDecena = Math.floor(num / 10);
    const numUnidad = num - (numDecena * 10);

    switch (numDecena) {
        case 1:
            switch (numUnidad) {
                case 0: return 'Diez';
                case 1: return 'Once';
                case 2: return 'Doce';
                case 3: return 'Trece';
                case 4: return 'Catorce';
                case 5: return 'Qunice';
                default: return `Dieci${unidades(numUnidad).toLowerCase()}`;
            }
        case 2:
            switch (numUnidad) {
                case 0: return 'Veinte';
                default: return `Veinti${unidades(numUnidad).toLowerCase()}`;
            }
        case 3: return decenasY('Treinta', numUnidad);
        case 4: return decenasY('Cuarenta', numUnidad);
        case 5: return decenasY('Cincuenta', numUnidad);
        case 6: return decenasY('Sesenta', numUnidad);
        case 7: return decenasY('Setenta', numUnidad);
        case 8: return decenasY('Ochenta', numUnidad);
        case 9: return decenasY('Noventa', numUnidad);
        case 0: return unidades(numUnidad);
        default: return '';
    }
}

function centenas(num) {
    const numCentenas = Math.floor(num / 100);
    const numDecenas = num - (numCentenas * 100);

    switch (numCentenas) {
        case 1:
            if (numDecenas > 0) {
                return `Ciento ${decenas(numDecenas)}`;
            }
            return 'Cien';
        case 2: return `Doscientos ${decenas(numDecenas)}`;
        case 3: return `Trescientos ${decenas(numDecenas)}`;
        case 4: return `Cuatrocientos ${decenas(numDecenas)}`;
        case 5: return `Quinientos ${decenas(numDecenas)}`;
        case 6: return `Seiscientos ${decenas(numDecenas)}`;
        case 7: return `Setecientos ${decenas(numDecenas)}`;
        case 8: return `Ochocientos ${decenas(numDecenas)}`;
        case 9: return `Novecientos ${decenas(numDecenas)}`;
        default: return decenas(numDecenas);
    }
}

function seccion(num, divisor, strSingular, strPlural) {
    const numCientos = Math.floor(num / divisor);
    const numResto = num - (numCientos * divisor);

    let letras = '';

    if (numCientos > 0) {
        if (numCientos > 1) {
            letras = `${centenas(numCientos)} ${strPlural}`;
        } else {
            letras = strSingular;
        }
    }

    if (numResto > 0) {
        letras += '';
    }

    return letras;
}

function miles(num) {
    const divisor = 1000;
    const numCientos = Math.floor(num / divisor);
    const numResto = num - (numCientos * divisor);
    const strMiles = seccion(num, divisor, 'Un Mil', 'Mil');
    const strCentenas = centenas(numResto);

    if (strMiles === '') {
        return strCentenas;
    }

    return `${strMiles} ${strCentenas}`.trim();
}

function millones(num) {
    const divisor = 1000000;
    const numCientos = Math.floor(num / divisor);
    const numResto = num - (numCientos * divisor);
    const strMillones = seccion(num, divisor, 'Un Millón de', 'Millones de');
    const strMiles = miles(numResto);

    if (strMillones === '') {
        return strMiles;
    }

    return `${strMillones} ${strMiles}`.trim();
}

function latinNumerosALetras(num, letrasMonedaPlural, letrasMonedaSingular) {
    const data = {
        numero: num,
        enteros: Math.floor(num),
        centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
        letrasCentavos: '',
        letrasMonedaPlural: letrasMonedaPlural,
        letrasMonedaSingular: letrasMonedaSingular,
        letrasMonedaCentavoPlural: 'centavos',
        letrasMonedaCentavoSingular: 'centavo',
    };

    if (data.centavos > 0) {
        data.letrasCentavos = (() => {
            if (data.centavos === 1) {
                return `con ${millones(data.centavos)} ${data.letrasMonedaCentavoSingular}`;
            }

            return `con ${millones(data.centavos)} ${data.letrasMonedaCentavoPlural}`;
        })();
    }

    if (data.enteros === 0) {
        return `Cero ${data.letrasMonedaPlural} ${data.letrasCentavos}`.trim();
    }

    if (data.enteros === 1) {
        return `${millones(data.enteros)} ${data.letrasMonedaSingular} ${data.letrasCentavos}`.trim();
    }

    return `${millones(data.enteros)} ${data.letrasMonedaPlural} ${data.letrasCentavos}`.trim();
}

//export default latinNumerosALetras;

window.fwSettings = {
    'widget_id': 47000004297
};
!function () { if ("function" != typeof window.FreshworksWidget) { var n = function () { n.q.push(arguments) }; n.q = [], window.FreshworksWidget = n } }()

var FwBootstrap = function (e) { var t = {}; function i(n) { if (t[n]) return t[n].exports; var o = t[n] = { i: n, l: !1, exports: {} }; return e[n].call(o.exports, o, o.exports, i), o.l = !0, o.exports } return i.m = e, i.c = t, i.d = function (e, t, n) { i.o(e, t) || Object.defineProperty(e, t, { enumerable: !0, get: n }) }, i.r = function (e) { "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e, "__esModule", { value: !0 }) }, i.t = function (e, t) { if (1 & t && (e = i(e)), 8 & t) return e; if (4 & t && "object" == typeof e && e && e.__esModule) return e; var n = Object.create(null); if (i.r(n), Object.defineProperty(n, "default", { enumerable: !0, value: e }), 2 & t && "string" != typeof e) for (var o in e) i.d(n, o, function (t) { return e[t] }.bind(null, o)); return n }, i.n = function (e) { var t = e && e.__esModule ? function () { return e.default } : function () { return e }; return i.d(t, "a", t), t }, i.o = function (e, t) { return Object.prototype.hasOwnProperty.call(e, t) }, i.p = "https://widget.freshworks.com/widgetBase/", i(i.s = 0) }([function (e, t, i) { e.exports = i(2) }, function (e, t) { e.exports = "https://widget.freshworks.com/widgetBase/static/media/frame.d7ae132c.css" }, function (e, t, i) { "use strict"; i.r(t); var n = ["FrustrationTracking", "Predictive"], o = { boot: "queueComplete", open: "openWidget", close: "closeWidget", destroy: "destroyWidget", identify: "identifyFormFields", prefill: "prefillFormFields", clear: "clearFormFields", hide: "hideWidget", hideLauncher: "hideLauncher", showLauncher: "showLauncher", show: "showWidget", setLabels: "setLabels", updateSettings: "updateSettings", updatePreviewSettings: "updatePreviewSettings", reloadComponents: "reloadComponents", authenticate: "authenticate", authenticateCallback: "authenticateCallback", logout: "logout", hideFormFields: "hideFormFields", disable: null, disableFormFields: "disableFormFields", hideChoices: "hideChoices" }, s = { id: 1, product_id: 1, account_id: 1, name: "Help widget", settings: { message: "", button_text: "Help", contact_form: { form_type: 2, form_title: "", form_button_text: "Send", form_submit_message: "Thank you for your feedback.", attach_file: !0, screenshot: !0, captcha: !1 }, appearance: { position: 1, offset_from_right: 30, offset_from_left: 30, offset_from_bottom: 30, theme_color: "#2392ec", button_color: "#16193e" }, components: { contact_form: !0, solution_articles: !0 }, predictive_support: { welcome_message: "", message: "We noticed youâ€™re stuck. Tell us what you were trying to accomplish, and our support team will reach out to you as soon as possible.", success_message: "Thanks. We'll be in touch!", domain_list: ["freshpo.com"] }, hide_launcher_bydefault: !0 }, active: !0, updated_at: "2018-10-01T14:16:05+05:30", account_url: "https://localhost.freshdesk-dev.com", languages: { primary: "es-LA", supported: ["en","ca", "cs", "da", "de", "es-LA", "es", "et", "fi", "fr", "hu", "id", "it", "ja-JP", "ko", "nb-NO", "nl", "pl", "pt-BR", "pt-PT", "ru-RU", "sv-SE", "sk", "sl", "tr", "vi", "zh-CN", "uk", "th", "ro", "zh-TW", "lv-LV", "bs", "bg", "hr", "el", "ms", "lt", "sr"] } }; function r() { return window.fwSettings && window.fwSettings.preview } function a(e, t) { return e.indexOf(t) >= 0 } var c = { init: function () { var e = window.fwSettings.widget_id; if (e) if (this.origin = window.location.origin, r()) { var t = s; t.id = e, this.initWidget(t) } else { var i = "".concat("https://widget.freshworks.com", "/widgets/").concat(e, ".json?randomId=").concat(Math.random()); this.fetchSettings(i, this.initWidget.bind(this)) } }, fetchSettings: function (e, t) { var i = new XMLHttpRequest; i.onreadystatechange = function () { 4 === i.readyState && 200 === i.status && t(function (e) { try { return JSON.parse(e) } catch (t) { return e } }(i.response)) }, i.open("get", e), i.responseType = "json", i.send() }, showWidget: function (e) { var t = !1, i = e.meta, n = e.settings, o = e.components; return (o || n.components) && ["contact_form", "solution_articles", "frustration_tracking", "predictive_support"].forEach(function (e) { var s = i && i.data_version && o ? o[e] && o[e].enabled : n.components[e]; t = t || Boolean(s) }), t }, initWidget: function (e) { var t; null != (t = e) && 0 !== Object.keys(t).length && e && this.showWidget(e) && (this.options = e, window.fwSettings.originUrl = this.origin, window.fwSettings.options = e, this.createMountPoint(), this.loadIFrame(), this.loadJS()) }, createMountPoint: function () { var e = document.createElement("div"); e.id = "freshworks-container", e.style.width = "0px", e.style.height = "0px", e.style.bottom = "0px", e.style.right = "0px", e.style.zIndex = Number.MAX_SAFE_INTEGER, e.setAttribute("data-html2canvas-ignore", !0), document.body.appendChild(e); var t = i(1), n = document.createElement("link"); n.id = "freshworks-frame", n.rel = "stylesheet", n.href = t, document.head.appendChild(n) }, loadIFrame: function () { var e = document.createElement("iframe"); e.setAttribute("title", "FreshworksWidget"), e.setAttribute("id", "freshworks-frame"), e.setAttribute("data-html2canvas-ignore", !0), e.style.display = "none", e.onload = function () { var t = document.createElement("link"); t.setAttribute("rel", "preconnect"), t.setAttribute("href", "https://widget.freshworks.com/widgetBase"), e.contentDocument.head.appendChild(t) }, document.body.appendChild(e), this._frame = e; var t = e.contentDocument || e.document; t.open(); var i = '<script src="'.concat("https://widget.freshworks.com/widgetBase", '/widget.js" async defer><\/script>'); t.write(i), t.close(), window.addEventListener ? window.addEventListener("message", this.handleMessage.bind(this), !0) : window.attachEvent("message", this.handleMessage.bind(this), !0) }, loadJS: function () { if (this.isFrustrationTrackingEnabled()) { var e = this.frustrationTrackingData(); if (e && !window.FM && !r()) { var t = document.createElement("script"); t.src = "".concat("https://cdn.freshmarketer.com", "/").concat(e.org_id, "/").concat(e.project_id, ".js"), t.async = !0, document.body.appendChild(t) } } }, helpWidgetMethods: function (e, t, i) { if (e && c[e] && a(Object.keys(o), e)) return c[e](t, i) }, widgetRenderComplete: function () { var e = window.FreshworksWidget && window.FreshworksWidget.q || []; window.FreshworksWidget = this.helpWidgetMethods, e.forEach(function (e) { window.FreshworksWidget.apply(null, e) }), this.postMessage(o.boot) }, handleMessage: function (e) { var t = e.data, i = t.eventName, n = t.data; (i || "function" == typeof this[i]) && this[i](n) }, postMessage: function (e) { var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}; this._frame.contentWindow.postMessage({ eventName: e, data: t }, a(this.origin, "file://") ? null : this.origin) }, boot: function () { this._frame.contentWindow.Widget.mount(this.origin), this.postMessage(o.boot) }, isFrustrationTrackingEnabled: function () { var e = this.options, t = e.meta, i = e.settings, n = e.components; return t && t.data_version && n ? n.frustration_tracking && Boolean(n.frustration_tracking.enabled) : Boolean(i.components.predictive_support) }, frustrationTrackingData: function () { var e = this.options, t = e.meta, i = e.settings, n = e.freshmarketer; return t && t.data_version ? n : i.freshmarketer }, open: function (e, t) { var i = (e || {}).widgetType; if (e && i && a(n, i)) { if (!this.isFrustrationTrackingEnabled() && !r()) return; this._frame.contentWindow.Widget.el || this._frame.contentWindow.Widget.mount(this.origin, e.widgetType) } this.postMessage(o.open, { cardType: e, data: t }) }, close: function () { this.postMessage(o.close) }, prefill: function (e, t) { this.postMessage(o.prefill, { formName: e, formFields: t }) }, identify: function (e, t) { this.postMessage(o.identify, { formName: e, formFields: t }) }, disable: function (e, t) { this.postMessage(o.disableFormFields, { formName: e, formFields: t }) }, clear: function (e) { this.postMessage(o.clear, { formName: e }) }, hide: function (e, t) { e ? t ? this.postMessage(o.hideFormFields, { formName: e, formFields: t }) : "launcher" === e && this.postMessage(o.hideLauncher) : this.postMessage(o.hide) }, show: function (e) { "launcher" === e ? this.postMessage(o.showLauncher) : this.postMessage(o.show) }, hideChoices: function (e, t) { this.postMessage(o.hideChoices, { formName: e, formFieldsAndChoices: t }) }, setLabels: function (e) { this.postMessage(o.setLabels, e) }, updateSettings: function (e) { this.postMessage(o.updateSettings, e) }, updatePreviewSettings: function (e) { this.postMessage(o.updatePreviewSettings, e) }, reloadComponents: function () { this.postMessage(o.reloadComponents) }, destroy: function () { this._frame.contentWindow.Widget.unmount() }, authenticate: function (e) { var t = e.callback, i = e.token, n = t && "function" == typeof t, s = "function" == typeof this.authenticateCallback, r = n || s; n && (this.authenticateCallback = t), this.postMessage(o.authenticate, { token: i, hasCallback: r }) }, logout: function () { this.postMessage(o.logout) } }; c.init() }]);


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndyYXBwZXIuanMiLCJhcHAuaW5pdC5qcyIsImNoYXJ0cy9jaGFydC1rbm9iLmpzIiwiY2hhcnRzL2NoYXJ0LmpzIiwiY2hhcnRzL2NoYXJ0aXN0LmpzIiwiY2hhcnRzL2Vhc3lwaWVjaGFydC5qcyIsImNoYXJ0cy9mbG90LmpzIiwiY2hhcnRzL21vcnJpcy5qcyIsImNoYXJ0cy9yaWNrc2hhdy5qcyIsImNoYXJ0cy9zcGFya2xpbmUuanMiLCJjb21tb24vYm9vdHN0cmFwLXN0YXJ0LmpzIiwiY29tbW9uL2NhcmQtdG9vbHMuanMiLCJjb21tb24vY29uc3RhbnRzLmpzIiwiY29tbW9uL2Z1bGxzY3JlZW4uanMiLCJjb21tb24vbG9hZC1jc3MuanMiLCJjb21tb24vbG9jYWxpemUuanMiLCJjb21tb24vbmF2YmFyLXNlYXJjaC5qcyIsImNvbW1vbi9ub3cuanMiLCJjb21tb24vcnRsLmpzIiwiY29tbW9uL3NpZGViYXIuanMiLCJjb21tb24vc2xpbXNjcm9sbC5qcyIsImNvbW1vbi90YWJsZS1jaGVja2FsbC5qcyIsImNvbW1vbi90b2dnbGUtc3RhdGUuanMiLCJjb21tb24vdHJpZ2dlci1yZXNpemUuanMiLCJlbGVtZW50cy9jYXJkcy5qcyIsImVsZW1lbnRzL25lc3RhYmxlLmpzIiwiZWxlbWVudHMvbm90aWZ5LmpzIiwiZWxlbWVudHMvcG9ybGV0cy5qcyIsImVsZW1lbnRzL3NvcnRhYmxlLmpzIiwiZWxlbWVudHMvc3dlZXRhbGVydC5qcyIsImV4dHJhcy9jYWxlbmRhci5qcyIsImV4dHJhcy9qcWNsb3VkLmpzIiwiZXh0cmFzL3NlYXJjaC5qcyIsImZvcm1zL2NvbG9yLXBpY2tlci5qcyIsImZvcm1zL2Zvcm1zLmpzIiwiZm9ybXMvaW1hZ2Vjcm9wLmpzIiwiZm9ybXMvc2VsZWN0Mi5qcyIsImZvcm1zL3VwbG9hZC5qcyIsImZvcm1zL3dpemFyZC5qcyIsImZvcm1zL3hlZGl0YWJsZS5qcyIsIm1hcHMvZ21hcC5qcyIsIm1hcHMvdmVjdG9yLm1hcC5kZW1vLmpzIiwibWFwcy92ZWN0b3IubWFwLmpzIiwicGFnZXMvcGFnZXMuanMiLCJ0YWJsZXMvYm9vdGdyaWQuanMiLCJ0YWJsZXMvZGF0YXRhYmxlLmpzIiwiY3VzdG9tLmpzIiwiZWFzeS1udW1iZXItc2VwYXJhdG9yLmpzIiwianF1ZXJ5LXFyY29kZS0wLjE3LjAubWluLmpzIiwianF1ZXJ5LnNjcm9sbGJhci5taW4uanMiLCJMYXRpbk51bWVyb3NBTGV0cmFzLmpzIiwiV2lkZ2V0LUZyZXNod29ya3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5cUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9QQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckNBO0FBQ0E7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogVGhpcyBsaWJyYXJ5IHdhcyBjcmVhdGVkIHRvIGVtdWxhdGUgc29tZSBqUXVlcnkgZmVhdHVyZXNcclxuICogdXNlZCBpbiB0aGlzIHRlbXBsYXRlIG9ubHkgd2l0aCBKYXZhc2NyaXB0IGFuZCBET01cclxuICogbWFuaXB1bGF0aW9uIGZ1bmN0aW9ucyAoSUUxMCspLlxyXG4gKiBBbGwgbWV0aG9kcyB3ZXJlIGRlc2lnbmVkIGZvciBhbiBhZGVxdWF0ZSBhbmQgc3BlY2lmaWMgdXNlXHJcbiAqIGFuZCBkb24ndCBwZXJmb3JtIGEgZGVlcCB2YWxpZGF0aW9uIG9uIHRoZSBhcmd1bWVudHMgcHJvdmlkZWQuXHJcbiAqXHJcbiAqIElNUE9SVEFOVDpcclxuICogPT09PT09PT09PVxyXG4gKiBJdCdzIHN1Z2dlc3RlZCBOT1QgdG8gdXNlIHRoaXMgbGlicmFyeSBleHRlbnNpdmVseSB1bmxlc3MgeW91XHJcbiAqIHVuZGVyc3RhbmQgd2hhdCBlYWNoIG1ldGhvZCBkb2VzLiBJbnN0ZWFkLCB1c2Ugb25seSBKUyBvclxyXG4gKiB5b3UgbWlnaHQgZXZlbiBuZWVkIGpRdWVyeS5cclxuICovXHJcblxyXG4oZnVuY3Rpb24oZ2xvYmFsLCBmYWN0b3J5KSB7XHJcbiAgICBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7IC8vIENvbW1vbkpTLWxpa2VcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcclxuICAgIH0gZWxzZSB7IC8vIEJyb3dzZXJcclxuICAgICAgICBpZiAodHlwZW9mIGdsb2JhbC5qUXVlcnkgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICBnbG9iYWwuJCA9IGZhY3RvcnkoKTtcclxuICAgIH1cclxufSh0aGlzLCBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvLyBIRUxQRVJTXHJcbiAgICBmdW5jdGlvbiBhcnJheUZyb20ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuICgnbGVuZ3RoJyBpbiBvYmopICYmIChvYmogIT09IHdpbmRvdykgPyBbXS5zbGljZS5jYWxsKG9iaikgOiBbb2JqXTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBmaWx0ZXIoY3R4LCBmbikge1xyXG4gICAgICAgIHJldHVybiBbXS5maWx0ZXIuY2FsbChjdHgsIGZuKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtYXAoY3R4LCBmbikge1xyXG4gICAgICAgIHJldHVybiBbXS5tYXAuY2FsbChjdHgsIGZuKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtYXRjaGVzKGl0ZW0sIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIChFbGVtZW50LnByb3RvdHlwZS5tYXRjaGVzIHx8IEVsZW1lbnQucHJvdG90eXBlLm1zTWF0Y2hlc1NlbGVjdG9yKS5jYWxsKGl0ZW0sIHNlbGVjdG9yKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEV2ZW50cyBoYW5kbGVyIHdpdGggc2ltcGxlIHNjb3BlZCBldmVudHMgc3VwcG9ydFxyXG4gICAgdmFyIEV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuZXZlbnRzID0ge307XHJcbiAgICB9XHJcbiAgICBFdmVudEhhbmRsZXIucHJvdG90eXBlID0ge1xyXG4gICAgICAgIC8vIGV2ZW50IGFjY2VwdHM6ICdjbGljaycgb3IgJ2NsaWNrLnNjb3BlJ1xyXG4gICAgICAgIGJpbmQ6IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lciwgdGFyZ2V0KSB7XHJcbiAgICAgICAgICAgIHZhciB0eXBlID0gZXZlbnQuc3BsaXQoJy4nKVswXTtcclxuICAgICAgICAgICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIGZhbHNlKTtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHNbZXZlbnRdID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgICAgIGxpc3RlbmVyOiBsaXN0ZW5lclxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB1bmJpbmQ6IGZ1bmN0aW9uKGV2ZW50LCB0YXJnZXQpIHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50IGluIHRoaXMuZXZlbnRzKSB7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmV2ZW50c1tldmVudF0udHlwZSwgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVyLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5ldmVudHNbZXZlbnRdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIE9iamVjdCBEZWZpbml0aW9uXHJcbiAgICB2YXIgV3JhcCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RvciA9IHNlbGVjdG9yO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9zZXR1cChbXSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ09OU1RSVUNUT1JcclxuICAgIFdyYXAuQ29uc3RydWN0b3IgPSBmdW5jdGlvbihwYXJhbSwgYXR0cnMpIHtcclxuICAgICAgICB2YXIgZWwgPSBuZXcgV3JhcChwYXJhbSk7XHJcbiAgICAgICAgcmV0dXJuIGVsLmluaXQoYXR0cnMpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBDb3JlIG1ldGhvZHNcclxuICAgIFdyYXAucHJvdG90eXBlID0ge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yOiBXcmFwLFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEluaXRpYWxpemUgdGhlIG9iamVjdCBkZXBlbmRpbmcgb24gcGFyYW0gdHlwZVxyXG4gICAgICAgICAqIFthdHRyc10gb25seSB0byBoYW5kbGUgJChodG1sU3RyaW5nLCB7YXR0cmlidXRlc30pXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oYXR0cnMpIHtcclxuICAgICAgICAgICAgLy8gZW1wdHkgb2JqZWN0XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5zZWxlY3RvcikgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIC8vIHNlbGVjdG9yID09PSBzdHJpbmdcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnNlbGVjdG9yID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgbG9va3MgbGlrZSBtYXJrdXAsIHRyeSB0byBjcmVhdGUgYW4gZWxlbWVudFxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0b3JbMF0gPT09ICc8Jykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBlbGVtID0gdGhpcy5fc2V0dXAoW3RoaXMuX2NyZWF0ZSh0aGlzLnNlbGVjdG9yKV0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF0dHJzID8gZWxlbS5hdHRyKGF0dHJzKSA6IGVsZW07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc2V0dXAoYXJyYXlGcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5zZWxlY3RvcikpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIHNlbGVjdG9yID09PSBET01FbGVtZW50XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdG9yLm5vZGVUeXBlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NldHVwKFt0aGlzLnNlbGVjdG9yXSlcclxuICAgICAgICAgICAgZWxzZSAvLyBzaG9ydGhhbmQgZm9yIERPTVJlYWR5XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NldHVwKFtkb2N1bWVudF0pLnJlYWR5KHRoaXMuc2VsZWN0b3IpXHJcbiAgICAgICAgICAgIC8vIEFycmF5IGxpa2Ugb2JqZWN0cyAoZS5nLiBOb2RlTGlzdC9IVE1MQ29sbGVjdGlvbilcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NldHVwKGFycmF5RnJvbSh0aGlzLnNlbGVjdG9yKSlcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENyZWF0ZXMgYSBET00gZWxlbWVudCBmcm9tIGEgc3RyaW5nXHJcbiAgICAgICAgICogU3RyaWN0bHkgc3VwcG9ydHMgdGhlIGZvcm06ICc8dGFnPicgb3IgJzx0YWcvPidcclxuICAgICAgICAgKi9cclxuICAgICAgICBfY3JlYXRlOiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICAgICAgdmFyIG5vZGVOYW1lID0gc3RyLnN1YnN0cihzdHIuaW5kZXhPZignPCcpICsgMSwgc3RyLmluZGV4T2YoJz4nKSAtIDEpLnJlcGxhY2UoJy8nLCAnJylcclxuICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyoqIHNldHVwIHByb3BlcnRpZXMgYW5kIGFycmF5IHRvIGVsZW1lbnQgc2V0ICovXHJcbiAgICAgICAgX3NldHVwOiBmdW5jdGlvbihlbGVtZW50cykge1xyXG4gICAgICAgICAgICB2YXIgaSA9IDA7XHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIGRlbGV0ZSB0aGlzW2ldOyAvLyBjbGVhbiB1cCBvbGQgc2V0XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudHMgPSBlbGVtZW50cztcclxuICAgICAgICAgICAgdGhpcy5sZW5ndGggPSBlbGVtZW50cy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykgdGhpc1tpXSA9IGVsZW1lbnRzW2ldIC8vIG5ldyBzZXRcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfZmlyc3Q6IGZ1bmN0aW9uKGNiLCByZXQpIHtcclxuICAgICAgICAgICAgdmFyIGYgPSB0aGlzLmVsZW1lbnRzWzBdO1xyXG4gICAgICAgICAgICByZXR1cm4gZiA/IChjYiA/IGNiLmNhbGwodGhpcywgZikgOiBmKSA6IHJldDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKiBDb21tb24gZnVuY3Rpb24gZm9yIGNsYXNzIG1hbmlwdWxhdGlvbiAgKi9cclxuICAgICAgICBfY2xhc3NlczogZnVuY3Rpb24obWV0aG9kLCBjbGFzc25hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGNscyA9IGNsYXNzbmFtZS5zcGxpdCgnICcpO1xyXG4gICAgICAgICAgICBpZiAoY2xzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgIGNscy5mb3JFYWNoKHRoaXMuX2NsYXNzZXMuYmluZCh0aGlzLCBtZXRob2QpKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKG1ldGhvZCA9PT0gJ2NvbnRhaW5zJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBlbGVtID0gdGhpcy5fZmlyc3QoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxlbSA/IGVsZW0uY2xhc3NMaXN0LmNvbnRhaW5zKGNsYXNzbmFtZSkgOiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiAoY2xhc3NuYW1lID09PSAnJykgPyB0aGlzIDogdGhpcy5lYWNoKGZ1bmN0aW9uKGksIGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmNsYXNzTGlzdFttZXRob2RdKGNsYXNzbmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBNdWx0aSBwdXJwb3NlIGZ1bmN0aW9uIHRvIHNldCBvciBnZXQgYSAoa2V5LCB2YWx1ZSlcclxuICAgICAgICAgKiBJZiBubyB2YWx1ZSwgd29ya3MgYXMgYSBnZXR0ZXIgZm9yIHRoZSBnaXZlbiBrZXlcclxuICAgICAgICAgKiBrZXkgY2FuIGJlIGFuIG9iamVjdCBpbiB0aGUgZm9ybSB7a2V5OiB2YWx1ZSwgLi4ufVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIF9hY2Nlc3M6IGZ1bmN0aW9uKGtleSwgdmFsdWUsIGZuKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiBrZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hY2Nlc3Moaywga2V5W2tdLCBmbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpcnN0KGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4oZWxlbSwga2V5KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oaSwgaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgZm4oaXRlbSwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZWFjaDogZnVuY3Rpb24oZm4sIGFycikge1xyXG4gICAgICAgICAgICBhcnIgPSBhcnIgPyBhcnIgOiB0aGlzLmVsZW1lbnRzO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGZuLmNhbGwoYXJyW2ldLCBpLCBhcnJbaV0pID09PSBmYWxzZSlcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIEFsbG93cyB0byBleHRlbmQgd2l0aCBuZXcgbWV0aG9kcyAqL1xyXG4gICAgV3JhcC5leHRlbmQgPSBmdW5jdGlvbihtZXRob2RzKSB7XHJcbiAgICAgICAgT2JqZWN0LmtleXMobWV0aG9kcykuZm9yRWFjaChmdW5jdGlvbihtKSB7XHJcbiAgICAgICAgICAgIFdyYXAucHJvdG90eXBlW21dID0gbWV0aG9kc1ttXVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy8gRE9NIFJFQURZXHJcbiAgICBXcmFwLmV4dGVuZCh7XHJcbiAgICAgICAgcmVhZHk6IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5hdHRhY2hFdmVudCA/IGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScgOiBkb2N1bWVudC5yZWFkeVN0YXRlICE9PSAnbG9hZGluZycpIHtcclxuICAgICAgICAgICAgICAgIGZuKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZm4pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICAvLyBBQ0NFU1NcclxuICAgIFdyYXAuZXh0ZW5kKHtcclxuICAgICAgICAvKiogR2V0IG9yIHNldCBhIGNzcyB2YWx1ZSAqL1xyXG4gICAgICAgIGNzczogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgZ2V0U3R5bGUgPSBmdW5jdGlvbihlLCBrKSB7IHJldHVybiBlLnN0eWxlW2tdIHx8IGdldENvbXB1dGVkU3R5bGUoZSlba107IH07XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hY2Nlc3Moa2V5LCB2YWx1ZSwgZnVuY3Rpb24oaXRlbSwgaywgdmFsKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdW5pdCA9ICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykgPyAncHgnIDogJyc7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsID09PSB1bmRlZmluZWQgPyBnZXRTdHlsZShpdGVtLCBrKSA6IChpdGVtLnN0eWxlW2tdID0gdmFsICsgdW5pdCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKiogR2V0IGFuIGF0dHJpYnV0ZSBvciBzZXQgaXQgKi9cclxuICAgICAgICBhdHRyOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hY2Nlc3Moa2V5LCB2YWx1ZSwgZnVuY3Rpb24oaXRlbSwgaywgdmFsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsID09PSB1bmRlZmluZWQgPyBpdGVtLmdldEF0dHJpYnV0ZShrKSA6IGl0ZW0uc2V0QXR0cmlidXRlKGssIHZhbClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKiBHZXQgYSBwcm9wZXJ0eSBvciBzZXQgaXQgKi9cclxuICAgICAgICBwcm9wOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hY2Nlc3Moa2V5LCB2YWx1ZSwgZnVuY3Rpb24oaXRlbSwgaywgdmFsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsID09PSB1bmRlZmluZWQgPyBpdGVtW2tdIDogKGl0ZW1ba10gPSB2YWwpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcG9zaXRpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZmlyc3QoZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgbGVmdDogZWxlbS5vZmZzZXRMZWZ0LCB0b3A6IGVsZW0ub2Zmc2V0VG9wIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzY3JvbGxUb3A6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hY2Nlc3MoJ3Njcm9sbFRvcCcsIHZhbHVlLCBmdW5jdGlvbihpdGVtLCBrLCB2YWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWwgPT09IHVuZGVmaW5lZCA/IGl0ZW1ba10gOiAoaXRlbVtrXSA9IHZhbCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSxcclxuICAgICAgICBvdXRlckhlaWdodDogZnVuY3Rpb24oaW5jbHVkZU1hcmdpbikge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZmlyc3QoZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIHZhciBtYXJnaW5zID0gaW5jbHVkZU1hcmdpbiA/IChwYXJzZUludChzdHlsZS5tYXJnaW5Ub3AsIDEwKSArIHBhcnNlSW50KHN0eWxlLm1hcmdpbkJvdHRvbSwgMTApKSA6IDA7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5vZmZzZXRIZWlnaHQgKyBtYXJnaW5zO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEZpbmQgdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBlbGVtZW50IGluIHRoZSBzZXRcclxuICAgICAgICAgKiByZWxhdGl2ZSB0byBpdHMgc2libGluZyBlbGVtZW50cy5cclxuICAgICAgICAgKi9cclxuICAgICAgICBpbmRleDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maXJzdChmdW5jdGlvbihlbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFycmF5RnJvbShlbC5wYXJlbnROb2RlLmNoaWxkcmVuKS5pbmRleE9mKGVsKVxyXG4gICAgICAgICAgICB9LCAtMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC8vIExPT0tVUFxyXG4gICAgV3JhcC5leHRlbmQoe1xyXG4gICAgICAgIGNoaWxkcmVuOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGRzID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuZWFjaChmdW5jdGlvbihpLCBpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICBjaGlsZHMgPSBjaGlsZHMuY29uY2F0KG1hcChpdGVtLmNoaWxkcmVuLCBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW1cclxuICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICByZXR1cm4gV3JhcC5Db25zdHJ1Y3RvcihjaGlsZHMpLmZpbHRlcihzZWxlY3Rvcik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzaWJsaW5nczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBzaWJzID0gW11cclxuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGksIGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHNpYnMgPSBzaWJzLmNvbmNhdChmaWx0ZXIoaXRlbS5wYXJlbnROb2RlLmNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZCAhPT0gaXRlbTtcclxuICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICByZXR1cm4gV3JhcC5Db25zdHJ1Y3RvcihzaWJzKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyoqIFJldHVybiB0aGUgcGFyZW50IG9mIGVhY2ggZWxlbWVudCBpbiB0aGUgY3VycmVudCBzZXQgKi9cclxuICAgICAgICBwYXJlbnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgcGFyID0gbWFwKHRoaXMuZWxlbWVudHMsIGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLnBhcmVudE5vZGU7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHJldHVybiBXcmFwLkNvbnN0cnVjdG9yKHBhcilcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKiBSZXR1cm4gQUxMIHBhcmVudHMgb2YgZWFjaCBlbGVtZW50IGluIHRoZSBjdXJyZW50IHNldCAqL1xyXG4gICAgICAgIHBhcmVudHM6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXIgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGksIGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHAgPSBpdGVtLnBhcmVudEVsZW1lbnQ7IHA7IHAgPSBwLnBhcmVudEVsZW1lbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyLnB1c2gocCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHJldHVybiBXcmFwLkNvbnN0cnVjdG9yKHBhcikuZmlsdGVyKHNlbGVjdG9yKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogR2V0IHRoZSBkZXNjZW5kYW50cyBvZiBlYWNoIGVsZW1lbnQgaW4gdGhlIHNldCwgZmlsdGVyZWQgYnkgYSBzZWxlY3RvclxyXG4gICAgICAgICAqIFNlbGVjdG9yIGNhbid0IHN0YXJ0IHdpdGggXCI+XCIgKDpzY29wZSBub3Qgc3VwcG9ydGVkIG9uIElFKS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBmaW5kOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgZm91bmQgPSBbXVxyXG4gICAgICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSwgaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgZm91bmQgPSBmb3VuZC5jb25jYXQobWFwKGl0ZW0ucXVlcnlTZWxlY3RvckFsbCggLyonOnNjb3BlICcgKyAqLyBzZWxlY3RvciksIGZ1bmN0aW9uKGZpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpdGVtXHJcbiAgICAgICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgcmV0dXJuIFdyYXAuQ29uc3RydWN0b3IoZm91bmQpXHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKiogZmlsdGVyIHRoZSBhY3R1YWwgc2V0IGJhc2VkIG9uIGdpdmVuIHNlbGVjdG9yICovXHJcbiAgICAgICAgZmlsdGVyOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBpZiAoIXNlbGVjdG9yKSByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgdmFyIHJlcyA9IGZpbHRlcih0aGlzLmVsZW1lbnRzLCBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hlcyhpdGVtLCBzZWxlY3RvcilcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgcmV0dXJuIFdyYXAuQ29uc3RydWN0b3IocmVzKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyoqIFdvcmtzIG9ubHkgd2l0aCBhIHN0cmluZyBzZWxlY3RvciAqL1xyXG4gICAgICAgIGlzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGksIGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAhKGZvdW5kID0gbWF0Y2hlcyhpdGVtLCBzZWxlY3RvcikpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHJldHVybiBmb3VuZDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8vIEVMRU1FTlRTXHJcbiAgICBXcmFwLmV4dGVuZCh7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogYXBwZW5kIGN1cnJlbnQgc2V0IHRvIGdpdmVuIG5vZGVcclxuICAgICAgICAgKiBleHBlY3RzIGEgZG9tIG5vZGUgb3Igc2V0XHJcbiAgICAgICAgICogaWYgZWxlbWVudCBpcyBhIHNldCwgcHJlcGVuZHMgb25seSB0aGUgZmlyc3RcclxuICAgICAgICAgKi9cclxuICAgICAgICBhcHBlbmRUbzogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBlbGVtID0gZWxlbS5ub2RlVHlwZSA/IGVsZW0gOiBlbGVtLl9maXJzdCgpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oaSwgaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChpdGVtKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEFwcGVuZCBhIGRvbU5vZGUgdG8gZWFjaCBlbGVtZW50IGluIHRoZSBzZXRcclxuICAgICAgICAgKiBpZiBlbGVtZW50IGlzIGEgc2V0LCBhcHBlbmQgb25seSB0aGUgZmlyc3RcclxuICAgICAgICAgKi9cclxuICAgICAgICBhcHBlbmQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgZWxlbSA9IGVsZW0ubm9kZVR5cGUgPyBlbGVtIDogZWxlbS5fZmlyc3QoKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKGksIGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGl0ZW0uYXBwZW5kQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBJbnNlcnQgdGhlIGN1cnJlbnQgc2V0IG9mIGVsZW1lbnRzIGFmdGVyIHRoZSBlbGVtZW50XHJcbiAgICAgICAgICogdGhhdCBtYXRjaGVzIHRoZSBnaXZlbiBzZWxlY3RvciBpbiBwYXJhbVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGluc2VydEFmdGVyOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oaSwgaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGl0ZW0sIHRhcmdldC5uZXh0U2libGluZyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBDbG9uZXMgYWxsIGVsZW1lbnQgaW4gdGhlIHNldFxyXG4gICAgICAgICAqIHJldHVybnMgYSBuZXcgc2V0IHdpdGggdGhlIGNsb25lZCBlbGVtZW50c1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIGNsb25lcyA9IG1hcCh0aGlzLmVsZW1lbnRzLCBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5jbG9uZU5vZGUodHJ1ZSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgcmV0dXJuIFdyYXAuQ29uc3RydWN0b3IoY2xvbmVzKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKiBSZW1vdmUgYWxsIG5vZGUgaW4gdGhlIHNldCBmcm9tIERPTS4gKi9cclxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSwgaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGl0ZW0uZXZlbnRzO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGl0ZW0uZGF0YTtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtLnBhcmVudE5vZGUpIGl0ZW0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpdGVtKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5fc2V0dXAoW10pXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC8vIERBVEFTRVRTXHJcbiAgICBXcmFwLmV4dGVuZCh7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRXhwZWN0ZWQga2V5IGluIGNhbWVsQ2FzZSBmb3JtYXRcclxuICAgICAgICAgKiBpZiB2YWx1ZSBwcm92aWRlZCBzYXZlIGRhdGEgaW50byBlbGVtZW50IHNldFxyXG4gICAgICAgICAqIGlmIG5vdCwgcmV0dXJuIGRhdGEgZm9yIHRoZSBmaXJzdCBlbGVtZW50XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgaGFzSlNPTiA9IC9eKD86XFx7W1xcd1xcV10qXFx9fFxcW1tcXHdcXFddKlxcXSkkLyxcclxuICAgICAgICAgICAgICAgIGRhdGFBdHRyID0gJ2RhdGEtJyArIGtleS5yZXBsYWNlKC9bQS1aXS9nLCAnLSQmJykudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maXJzdChmdW5jdGlvbihlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbC5kYXRhICYmIGVsLmRhdGFba2V5XSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsLmRhdGFba2V5XTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBlbC5nZXRBdHRyaWJ1dGUoZGF0YUF0dHIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhID09PSAndHJ1ZScpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSA9PT0gJ2ZhbHNlJykgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSA9PT0gK2RhdGEgKyAnJykgcmV0dXJuICtkYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzSlNPTi50ZXN0KGRhdGEpKSByZXR1cm4gSlNPTi5wYXJzZShkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKGksIGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmRhdGEgPSBpdGVtLmRhdGEgfHwge307XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kYXRhW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC8vIEVWRU5UU1xyXG4gICAgV3JhcC5leHRlbmQoe1xyXG4gICAgICAgIHRyaWdnZXI6IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICAgICAgdHlwZSA9IHR5cGUuc3BsaXQoJy4nKVswXTsgLy8gaWdub3JlIG5hbWVzcGFjZVxyXG4gICAgICAgICAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnSFRNTEV2ZW50cycpO1xyXG4gICAgICAgICAgICBldmVudC5pbml0RXZlbnQodHlwZSwgdHJ1ZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKGksIGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGl0ZW0uZGlzcGF0Y2hFdmVudChldmVudCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSxcclxuICAgICAgICBibHVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcignYmx1cicpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBmb2N1czogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoJ2ZvY3VzJylcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uOiBmdW5jdGlvbihldmVudCwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbihpLCBpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uZXZlbnRzKSBpdGVtLmV2ZW50cyA9IG5ldyBFdmVudEhhbmRsZXIoKTtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnNwbGl0KCcgJykuZm9yRWFjaChmdW5jdGlvbihldikge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZXZlbnRzLmJpbmQoZXYsIGNhbGxiYWNrLCBpdGVtKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSxcclxuICAgICAgICBvZmY6IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oaSwgaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0uZXZlbnRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5ldmVudHMudW5iaW5kKGV2ZW50LCBpdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgaXRlbS5ldmVudHM7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC8vIENMQVNTRVNcclxuICAgIFdyYXAuZXh0ZW5kKHtcclxuICAgICAgICB0b2dnbGVDbGFzczogZnVuY3Rpb24oY2xhc3NuYW1lKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jbGFzc2VzKCd0b2dnbGUnLCBjbGFzc25hbWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYWRkQ2xhc3M6IGZ1bmN0aW9uKGNsYXNzbmFtZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY2xhc3NlcygnYWRkJywgY2xhc3NuYW1lKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbihjbGFzc25hbWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NsYXNzZXMoJ3JlbW92ZScsIGNsYXNzbmFtZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBoYXNDbGFzczogZnVuY3Rpb24oY2xhc3NuYW1lKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jbGFzc2VzKCdjb250YWlucycsIGNsYXNzbmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTb21lIGJhc2ljIGZlYXR1cmVzIGluIHRoaXMgdGVtcGxhdGUgcmVsaWVzIG9uIEJvb3RzdHJhcFxyXG4gICAgICogcGx1Z2lucywgbGlrZSBDb2xsYXBzZSwgRHJvcGRvd24gYW5kIFRhYi5cclxuICAgICAqIEJlbG93IGNvZGUgZW11bGF0ZXMgcGx1Z2lucyBiZWhhdmlvciBieSB0b2dnbGluZyBjbGFzc2VzXHJcbiAgICAgKiBmcm9tIGVsZW1lbnRzIHRvIGFsbG93IGEgbWluaW11bSBpbnRlcmFjdGlvbiB3aXRob3V0IGFuaW1hdGlvbi5cclxuICAgICAqIC0gT25seSBDb2xsYXBzZSBpcyByZXF1aXJlZCB3aGljaCBpcyB1c2VkIGJ5IHRoZSBzaWRlYmFyLlxyXG4gICAgICogLSBUYWIgYW5kIERyb3Bkb3duIGFyZSBvcHRpb25hbCBmZWF0dXJlcy5cclxuICAgICAqL1xyXG5cclxuICAgIC8vIEVtdWxhdGUgalF1ZXJ5IHN5bWJvbCB0byBzaW1wbGlmeSB1c2FnZVxyXG4gICAgdmFyICQgPSBXcmFwLkNvbnN0cnVjdG9yO1xyXG5cclxuICAgIC8vIEVtdWxhdGVzIENvbGxhcHNlIHBsdWdpblxyXG4gICAgV3JhcC5leHRlbmQoe1xyXG4gICAgICAgIGNvbGxhcHNlOiBmdW5jdGlvbihhY3Rpb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbihpLCBpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJGl0ZW0gPSAkKGl0ZW0pLnRyaWdnZXIoYWN0aW9uICsgJy5icy5jb2xsYXBzZScpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ3RvZ2dsZScpICRpdGVtLmNvbGxhcHNlKCRpdGVtLmhhc0NsYXNzKCdzaG93JykgPyAnaGlkZScgOiAnc2hvdycpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSAkaXRlbVthY3Rpb24gPT09ICdzaG93JyA/ICdhZGRDbGFzcycgOiAncmVtb3ZlQ2xhc3MnXSgnc2hvdycpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICAvLyBJbml0aWFsaXphdGlvbnNcclxuICAgICQoJ1tkYXRhLXRvZ2dsZV0nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcclxuICAgICAgICBpZiAodGFyZ2V0LmlzKCdhJykpIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBzd2l0Y2ggKHRhcmdldC5kYXRhKCd0b2dnbGUnKSkge1xyXG4gICAgICAgICAgICBjYXNlICdjb2xsYXBzZSc6XHJcbiAgICAgICAgICAgICAgICAkKHRhcmdldC5hdHRyKCdocmVmJykpLmNvbGxhcHNlKCd0b2dnbGUnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd0YWInOlxyXG4gICAgICAgICAgICAgICAgdGFyZ2V0LnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYlBhbmUgPSAkKHRhcmdldC5hdHRyKCdocmVmJykpO1xyXG4gICAgICAgICAgICAgICAgdGFiUGFuZS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKCdhY3RpdmUgc2hvdycpO1xyXG4gICAgICAgICAgICAgICAgdGFiUGFuZS5hZGRDbGFzcygnYWN0aXZlIHNob3cnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdkcm9wZG93bic6XHJcbiAgICAgICAgICAgICAgICB2YXIgZGQgPSB0YXJnZXQucGFyZW50KCkudG9nZ2xlQ2xhc3MoJ3Nob3cnKTtcclxuICAgICAgICAgICAgICAgIGRkLmZpbmQoJy5kcm9wZG93bi1tZW51JykudG9nZ2xlQ2xhc3MoJ3Nob3cnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcblxyXG4gICAgcmV0dXJuIFdyYXAuQ29uc3RydWN0b3JcclxuXHJcbn0pKTsiLCIvKiFcclxuICpcclxuICogQW5nbGUgLSBCb290c3RyYXAgQWRtaW4gVGVtcGxhdGVcclxuICpcclxuICogVmVyc2lvbjogNC41LjVcclxuICogQXV0aG9yOiBAdGhlbWljb25fY29cclxuICogV2Vic2l0ZTogaHR0cDovL3RoZW1pY29uLmNvXHJcbiAqIExpY2Vuc2U6IGh0dHBzOi8vd3JhcGJvb3RzdHJhcC5jb20vaGVscC9saWNlbnNlc1xyXG4gKlxyXG4gKi9cclxuXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgLy8gUmVzdG9yZSBib2R5IGNsYXNzZXNcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIHZhciAkYm9keSA9ICQoJ2JvZHknKTtcclxuICAgICAgICBuZXcgU3RhdGVUb2dnbGVyKCkucmVzdG9yZVN0YXRlKCRib2R5KTtcclxuXHJcbiAgICAgICAgLy8gZW5hYmxlIHNldHRpbmdzIHRvZ2dsZSBhZnRlciByZXN0b3JlXHJcbiAgICAgICAgJCgnI2Noay1maXhlZCcpLnByb3AoJ2NoZWNrZWQnLCAkYm9keS5oYXNDbGFzcygnbGF5b3V0LWZpeGVkJykpO1xyXG4gICAgICAgICQoJyNjaGstY29sbGFwc2VkJykucHJvcCgnY2hlY2tlZCcsICRib2R5Lmhhc0NsYXNzKCdhc2lkZS1jb2xsYXBzZWQnKSk7XHJcbiAgICAgICAgJCgnI2Noay1jb2xsYXBzZWQtdGV4dCcpLnByb3AoJ2NoZWNrZWQnLCAkYm9keS5oYXNDbGFzcygnYXNpZGUtY29sbGFwc2VkLXRleHQnKSk7XHJcbiAgICAgICAgJCgnI2Noay1ib3hlZCcpLnByb3AoJ2NoZWNrZWQnLCAkYm9keS5oYXNDbGFzcygnbGF5b3V0LWJveGVkJykpO1xyXG4gICAgICAgICQoJyNjaGstZmxvYXQnKS5wcm9wKCdjaGVja2VkJywgJGJvZHkuaGFzQ2xhc3MoJ2FzaWRlLWZsb2F0JykpO1xyXG4gICAgICAgICQoJyNjaGstaG92ZXInKS5wcm9wKCdjaGVja2VkJywgJGJvZHkuaGFzQ2xhc3MoJ2FzaWRlLWhvdmVyJykpO1xyXG5cclxuICAgICAgICAvLyBXaGVuIHJlYWR5IGRpc3BsYXkgdGhlIG9mZnNpZGViYXJcclxuICAgICAgICAkKCcub2Zmc2lkZWJhci5kLW5vbmUnKS5yZW1vdmVDbGFzcygnZC1ub25lJyk7XHJcblxyXG4gICAgfSk7IC8vIGRvYyByZWFkeVxyXG5cclxufSkoKTsiLCIvLyBLbm9iIGNoYXJ0XHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0S25vYik7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdEtub2IoKSB7XHJcblxyXG4gICAgICAgIGlmICghJC5mbi5rbm9iKSByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBrbm9iTG9hZGVyT3B0aW9uczEgPSB7XHJcbiAgICAgICAgICAgIHdpZHRoOiAnNTAlJywgLy8gcmVzcG9uc2l2ZVxyXG4gICAgICAgICAgICBkaXNwbGF5SW5wdXQ6IHRydWUsXHJcbiAgICAgICAgICAgIGZnQ29sb3I6IEFQUF9DT0xPUlNbJ2luZm8nXVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgJCgnI2tub2ItY2hhcnQxJykua25vYihrbm9iTG9hZGVyT3B0aW9uczEpO1xyXG5cclxuICAgICAgICB2YXIga25vYkxvYWRlck9wdGlvbnMyID0ge1xyXG4gICAgICAgICAgICB3aWR0aDogJzUwJScsIC8vIHJlc3BvbnNpdmVcclxuICAgICAgICAgICAgZGlzcGxheUlucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBmZ0NvbG9yOiBBUFBfQ09MT1JTWydwdXJwbGUnXSxcclxuICAgICAgICAgICAgcmVhZE9ubHk6IHRydWVcclxuICAgICAgICB9O1xyXG4gICAgICAgICQoJyNrbm9iLWNoYXJ0MicpLmtub2Ioa25vYkxvYWRlck9wdGlvbnMyKTtcclxuXHJcbiAgICAgICAgdmFyIGtub2JMb2FkZXJPcHRpb25zMyA9IHtcclxuICAgICAgICAgICAgd2lkdGg6ICc1MCUnLCAvLyByZXNwb25zaXZlXHJcbiAgICAgICAgICAgIGRpc3BsYXlJbnB1dDogdHJ1ZSxcclxuICAgICAgICAgICAgZmdDb2xvcjogQVBQX0NPTE9SU1snaW5mbyddLFxyXG4gICAgICAgICAgICBiZ0NvbG9yOiBBUFBfQ09MT1JTWydncmF5J10sXHJcbiAgICAgICAgICAgIGFuZ2xlT2Zmc2V0OiAtMTI1LFxyXG4gICAgICAgICAgICBhbmdsZUFyYzogMjUwXHJcbiAgICAgICAgfTtcclxuICAgICAgICAkKCcja25vYi1jaGFydDMnKS5rbm9iKGtub2JMb2FkZXJPcHRpb25zMyk7XHJcblxyXG4gICAgICAgIHZhciBrbm9iTG9hZGVyT3B0aW9uczQgPSB7XHJcbiAgICAgICAgICAgIHdpZHRoOiAnNTAlJywgLy8gcmVzcG9uc2l2ZVxyXG4gICAgICAgICAgICBkaXNwbGF5SW5wdXQ6IHRydWUsXHJcbiAgICAgICAgICAgIGZnQ29sb3I6IEFQUF9DT0xPUlNbJ3BpbmsnXSxcclxuICAgICAgICAgICAgZGlzcGxheVByZXZpb3VzOiB0cnVlLFxyXG4gICAgICAgICAgICB0aGlja25lc3M6IDAuMSxcclxuICAgICAgICAgICAgbGluZUNhcDogJ3JvdW5kJ1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgJCgnI2tub2ItY2hhcnQ0Jykua25vYihrbm9iTG9hZGVyT3B0aW9uczQpO1xyXG5cclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLy8gQ2hhcnQgSlNcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAkKGluaXRDaGFydEpTKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0Q2hhcnRKUygpIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBDaGFydCA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gcmFuZG9tIHZhbHVlcyBmb3IgZGVtb1xyXG4gICAgICAgIHZhciByRmFjdG9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAxMDApO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIExpbmUgY2hhcnRcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB2YXIgbGluZURhdGEgPSB7XHJcbiAgICAgICAgICAgIGxhYmVsczogWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknXSxcclxuICAgICAgICAgICAgZGF0YXNldHM6IFt7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogJ015IEZpcnN0IGRhdGFzZXQnLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAncmdiYSgxMTQsMTAyLDE4NiwwLjIpJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiAncmdiYSgxMTQsMTAyLDE4NiwxKScsXHJcbiAgICAgICAgICAgICAgICBwb2ludEJvcmRlckNvbG9yOiAnI2ZmZicsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBbckZhY3RvcigpLCByRmFjdG9yKCksIHJGYWN0b3IoKSwgckZhY3RvcigpLCByRmFjdG9yKCksIHJGYWN0b3IoKSwgckZhY3RvcigpXVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogJ015IFNlY29uZCBkYXRhc2V0JyxcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMzUsMTgzLDIyOSwwLjIpJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiAncmdiYSgzNSwxODMsMjI5LDEpJyxcclxuICAgICAgICAgICAgICAgIHBvaW50Qm9yZGVyQ29sb3I6ICcjZmZmJyxcclxuICAgICAgICAgICAgICAgIGRhdGE6IFtyRmFjdG9yKCksIHJGYWN0b3IoKSwgckZhY3RvcigpLCByRmFjdG9yKCksIHJGYWN0b3IoKSwgckZhY3RvcigpLCByRmFjdG9yKCldXHJcbiAgICAgICAgICAgIH1dXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIGxpbmVPcHRpb25zID0ge1xyXG4gICAgICAgICAgICBsZWdlbmQ6IHtcclxuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZhbHNlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBsaW5lY3R4ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NoYXJ0anMtbGluZWNoYXJ0JykuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICB2YXIgbGluZUNoYXJ0ID0gbmV3IENoYXJ0KGxpbmVjdHgsIHtcclxuICAgICAgICAgICAgZGF0YTogbGluZURhdGEsXHJcbiAgICAgICAgICAgIHR5cGU6ICdsaW5lJyxcclxuICAgICAgICAgICAgb3B0aW9uczogbGluZU9wdGlvbnNcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQmFyIGNoYXJ0XHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdmFyIGJhckRhdGEgPSB7XHJcbiAgICAgICAgICAgIGxhYmVsczogWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknXSxcclxuICAgICAgICAgICAgZGF0YXNldHM6IFt7XHJcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjMjNiN2U1JyxcclxuICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiAnIzIzYjdlNScsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBbckZhY3RvcigpLCByRmFjdG9yKCksIHJGYWN0b3IoKSwgckZhY3RvcigpLCByRmFjdG9yKCksIHJGYWN0b3IoKSwgckZhY3RvcigpXVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjNWQ5Y2VjJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiAnIzVkOWNlYycsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBbckZhY3RvcigpLCByRmFjdG9yKCksIHJGYWN0b3IoKSwgckZhY3RvcigpLCByRmFjdG9yKCksIHJGYWN0b3IoKSwgckZhY3RvcigpXVxyXG4gICAgICAgICAgICB9XVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBiYXJPcHRpb25zID0ge1xyXG4gICAgICAgICAgICBsZWdlbmQ6IHtcclxuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZhbHNlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBiYXJjdHggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2hhcnRqcy1iYXJjaGFydCcpLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgdmFyIGJhckNoYXJ0ID0gbmV3IENoYXJ0KGJhcmN0eCwge1xyXG4gICAgICAgICAgICBkYXRhOiBiYXJEYXRhLFxyXG4gICAgICAgICAgICB0eXBlOiAnYmFyJyxcclxuICAgICAgICAgICAgb3B0aW9uczogYmFyT3B0aW9uc1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyAgRG91Z2hudXQgY2hhcnRcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB2YXIgZG91Z2hudXREYXRhID0ge1xyXG4gICAgICAgICAgICBsYWJlbHM6IFtcclxuICAgICAgICAgICAgICAgICdQdXJwbGUnLFxyXG4gICAgICAgICAgICAgICAgJ1llbGxvdycsXHJcbiAgICAgICAgICAgICAgICAnQmx1ZSdcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgZGF0YXNldHM6IFt7XHJcbiAgICAgICAgICAgICAgICBkYXRhOiBbMzAwLCA1MCwgMTAwXSxcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogW1xyXG4gICAgICAgICAgICAgICAgICAgICcjNzI2NmJhJyxcclxuICAgICAgICAgICAgICAgICAgICAnI2ZhZDczMicsXHJcbiAgICAgICAgICAgICAgICAgICAgJyMyM2I3ZTUnXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgaG92ZXJCYWNrZ3JvdW5kQ29sb3I6IFtcclxuICAgICAgICAgICAgICAgICAgICAnIzcyNjZiYScsXHJcbiAgICAgICAgICAgICAgICAgICAgJyNmYWQ3MzInLFxyXG4gICAgICAgICAgICAgICAgICAgICcjMjNiN2U1J1xyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBkb3VnaG51dE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIGxlZ2VuZDoge1xyXG4gICAgICAgICAgICAgICAgZGlzcGxheTogZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIGRvdWdobnV0Y3R4ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NoYXJ0anMtZG91Z2hudXRjaGFydCcpLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgdmFyIGRvdWdobnV0Q2hhcnQgPSBuZXcgQ2hhcnQoZG91Z2hudXRjdHgsIHtcclxuICAgICAgICAgICAgZGF0YTogZG91Z2hudXREYXRhLFxyXG4gICAgICAgICAgICB0eXBlOiAnZG91Z2hudXQnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiBkb3VnaG51dE9wdGlvbnNcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gUGllIGNoYXJ0XHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdmFyIHBpZURhdGEgPSB7XHJcbiAgICAgICAgICAgIGxhYmVsczogW1xyXG4gICAgICAgICAgICAgICAgJ1B1cnBsZScsXHJcbiAgICAgICAgICAgICAgICAnWWVsbG93JyxcclxuICAgICAgICAgICAgICAgICdCbHVlJ1xyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBkYXRhc2V0czogW3tcclxuICAgICAgICAgICAgICAgIGRhdGE6IFszMDAsIDUwLCAxMDBdLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgJyM3MjY2YmEnLFxyXG4gICAgICAgICAgICAgICAgICAgICcjZmFkNzMyJyxcclxuICAgICAgICAgICAgICAgICAgICAnIzIzYjdlNSdcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBob3ZlckJhY2tncm91bmRDb2xvcjogW1xyXG4gICAgICAgICAgICAgICAgICAgICcjNzI2NmJhJyxcclxuICAgICAgICAgICAgICAgICAgICAnI2ZhZDczMicsXHJcbiAgICAgICAgICAgICAgICAgICAgJyMyM2I3ZTUnXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH1dXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHBpZU9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIGxlZ2VuZDoge1xyXG4gICAgICAgICAgICAgICAgZGlzcGxheTogZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIHBpZWN0eCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGFydGpzLXBpZWNoYXJ0JykuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICB2YXIgcGllQ2hhcnQgPSBuZXcgQ2hhcnQocGllY3R4LCB7XHJcbiAgICAgICAgICAgIGRhdGE6IHBpZURhdGEsXHJcbiAgICAgICAgICAgIHR5cGU6ICdwaWUnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiBwaWVPcHRpb25zXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFBvbGFyIGNoYXJ0XHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdmFyIHBvbGFyRGF0YSA9IHtcclxuICAgICAgICAgICAgZGF0YXNldHM6IFt7XHJcbiAgICAgICAgICAgICAgICBkYXRhOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgMTEsXHJcbiAgICAgICAgICAgICAgICAgICAgMTYsXHJcbiAgICAgICAgICAgICAgICAgICAgNyxcclxuICAgICAgICAgICAgICAgICAgICAzXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgJyNmNTMyZTUnLFxyXG4gICAgICAgICAgICAgICAgICAgICcjNzI2NmJhJyxcclxuICAgICAgICAgICAgICAgICAgICAnI2Y1MzJlNScsXHJcbiAgICAgICAgICAgICAgICAgICAgJyM3MjY2YmEnXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgbGFiZWw6ICdNeSBkYXRhc2V0JyAvLyBmb3IgbGVnZW5kXHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICBsYWJlbHM6IFtcclxuICAgICAgICAgICAgICAgICdMYWJlbCAxJyxcclxuICAgICAgICAgICAgICAgICdMYWJlbCAyJyxcclxuICAgICAgICAgICAgICAgICdMYWJlbCAzJyxcclxuICAgICAgICAgICAgICAgICdMYWJlbCA0J1xyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHBvbGFyT3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgbGVnZW5kOiB7XHJcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBmYWxzZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgcG9sYXJjdHggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2hhcnRqcy1wb2xhcmNoYXJ0JykuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICB2YXIgcG9sYXJDaGFydCA9IG5ldyBDaGFydChwb2xhcmN0eCwge1xyXG4gICAgICAgICAgICBkYXRhOiBwb2xhckRhdGEsXHJcbiAgICAgICAgICAgIHR5cGU6ICdwb2xhckFyZWEnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiBwb2xhck9wdGlvbnNcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gUmFkYXIgY2hhcnRcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB2YXIgcmFkYXJEYXRhID0ge1xyXG4gICAgICAgICAgICBsYWJlbHM6IFsnRWF0aW5nJywgJ0RyaW5raW5nJywgJ1NsZWVwaW5nJywgJ0Rlc2lnbmluZycsICdDb2RpbmcnLCAnQ3ljbGluZycsICdSdW5uaW5nJ10sXHJcbiAgICAgICAgICAgIGRhdGFzZXRzOiBbe1xyXG4gICAgICAgICAgICAgICAgbGFiZWw6ICdNeSBGaXJzdCBkYXRhc2V0JyxcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMTE0LDEwMiwxODYsMC4yKScsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjogJ3JnYmEoMTE0LDEwMiwxODYsMSknLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogWzY1LCA1OSwgOTAsIDgxLCA1NiwgNTUsIDQwXVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogJ015IFNlY29uZCBkYXRhc2V0JyxcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMTUxLDE4NywyMDUsMC4yKScsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjogJ3JnYmEoMTUxLDE4NywyMDUsMSknLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogWzI4LCA0OCwgNDAsIDE5LCA5NiwgMjcsIDEwMF1cclxuICAgICAgICAgICAgfV1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmFkYXJPcHRpb25zID0ge1xyXG4gICAgICAgICAgICBsZWdlbmQ6IHtcclxuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZhbHNlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciByYWRhcmN0eCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGFydGpzLXJhZGFyY2hhcnQnKS5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgICAgIHZhciByYWRhckNoYXJ0ID0gbmV3IENoYXJ0KHJhZGFyY3R4LCB7XHJcbiAgICAgICAgICAgIGRhdGE6IHJhZGFyRGF0YSxcclxuICAgICAgICAgICAgdHlwZTogJ3JhZGFyJyxcclxuICAgICAgICAgICAgb3B0aW9uczogcmFkYXJPcHRpb25zXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvLyBDaGFydGlzdFxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgICQoaW5pdENoYXJ0aXN0cyk7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdENoYXJ0aXN0cygpIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBDaGFydGlzdCA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gQmFyIGJpcG9sYXJcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIHZhciBkYXRhMSA9IHtcclxuICAgICAgICAgICAgbGFiZWxzOiBbJ1cxJywgJ1cyJywgJ1czJywgJ1c0JywgJ1c1JywgJ1c2JywgJ1c3JywgJ1c4JywgJ1c5JywgJ1cxMCddLFxyXG4gICAgICAgICAgICBzZXJpZXM6IFtcclxuICAgICAgICAgICAgICAgIFsxLCAyLCA0LCA4LCA2LCAtMiwgLTEsIC00LCAtNiwgLTJdXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgb3B0aW9uczEgPSB7XHJcbiAgICAgICAgICAgIGhpZ2g6IDEwLFxyXG4gICAgICAgICAgICBsb3c6IC0xMCxcclxuICAgICAgICAgICAgaGVpZ2h0OiAyODAsXHJcbiAgICAgICAgICAgIGF4aXNYOiB7XHJcbiAgICAgICAgICAgICAgICBsYWJlbEludGVycG9sYXRpb25GbmM6IGZ1bmN0aW9uKHZhbHVlLCBpbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbmRleCAlIDIgPT09IDAgPyB2YWx1ZSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBuZXcgQ2hhcnRpc3QuQmFyKCcjY3QtYmFyMScsIGRhdGExLCBvcHRpb25zMSk7XHJcblxyXG4gICAgICAgIC8vIEJhciBIb3Jpem9udGFsXHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICBuZXcgQ2hhcnRpc3QuQmFyKCcjY3QtYmFyMicsIHtcclxuICAgICAgICAgICAgbGFiZWxzOiBbJ01vbmRheScsICdUdWVzZGF5JywgJ1dlZG5lc2RheScsICdUaHVyc2RheScsICdGcmlkYXknLCAnU2F0dXJkYXknLCAnU3VuZGF5J10sXHJcbiAgICAgICAgICAgIHNlcmllczogW1xyXG4gICAgICAgICAgICAgICAgWzUsIDQsIDMsIDcsIDUsIDEwLCAzXSxcclxuICAgICAgICAgICAgICAgIFszLCAyLCA5LCA1LCA0LCA2LCA0XVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICBzZXJpZXNCYXJEaXN0YW5jZTogMTAsXHJcbiAgICAgICAgICAgIHJldmVyc2VEYXRhOiB0cnVlLFxyXG4gICAgICAgICAgICBob3Jpem9udGFsQmFyczogdHJ1ZSxcclxuICAgICAgICAgICAgaGVpZ2h0OiAyODAsXHJcbiAgICAgICAgICAgIGF4aXNZOiB7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IDcwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gTGluZVxyXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgbmV3IENoYXJ0aXN0LkxpbmUoJyNjdC1saW5lMScsIHtcclxuICAgICAgICAgICAgbGFiZWxzOiBbJ01vbmRheScsICdUdWVzZGF5JywgJ1dlZG5lc2RheScsICdUaHVyc2RheScsICdGcmlkYXknXSxcclxuICAgICAgICAgICAgc2VyaWVzOiBbXHJcbiAgICAgICAgICAgICAgICBbMTIsIDksIDcsIDgsIDVdLFxyXG4gICAgICAgICAgICAgICAgWzIsIDEsIDMuNSwgNywgM10sXHJcbiAgICAgICAgICAgICAgICBbMSwgMywgNCwgNSwgNl1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgICAgZnVsbFdpZHRoOiB0cnVlLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IDI4MCxcclxuICAgICAgICAgICAgY2hhcnRQYWRkaW5nOiB7XHJcbiAgICAgICAgICAgICAgICByaWdodDogNDBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgLy8gU1ZHIEFuaW1hdGlvblxyXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHZhciBjaGFydDEgPSBuZXcgQ2hhcnRpc3QuTGluZSgnI2N0LWxpbmUzJywge1xyXG4gICAgICAgICAgICBsYWJlbHM6IFsnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXSxcclxuICAgICAgICAgICAgc2VyaWVzOiBbXHJcbiAgICAgICAgICAgICAgICBbMSwgNSwgMiwgNSwgNCwgM10sXHJcbiAgICAgICAgICAgICAgICBbMiwgMywgNCwgOCwgMSwgMl0sXHJcbiAgICAgICAgICAgICAgICBbNSwgNCwgMywgMiwgMSwgMC41XVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICBsb3c6IDAsXHJcbiAgICAgICAgICAgIHNob3dBcmVhOiB0cnVlLFxyXG4gICAgICAgICAgICBzaG93UG9pbnQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBmdWxsV2lkdGg6IHRydWUsXHJcbiAgICAgICAgICAgIGhlaWdodDogMzAwXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNoYXJ0MS5vbignZHJhdycsIGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEudHlwZSA9PT0gJ2xpbmUnIHx8IGRhdGEudHlwZSA9PT0gJ2FyZWEnKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhLmVsZW1lbnQuYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiZWdpbjogMjAwMCAqIGRhdGEuaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1cjogMjAwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbTogZGF0YS5wYXRoLmNsb25lKCkuc2NhbGUoMSwgMCkudHJhbnNsYXRlKDAsIGRhdGEuY2hhcnRSZWN0LmhlaWdodCgpKS5zdHJpbmdpZnkoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG86IGRhdGEucGF0aC5jbG9uZSgpLnN0cmluZ2lmeSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmc6IENoYXJ0aXN0LlN2Zy5FYXNpbmcuZWFzZU91dFF1aW50XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgIC8vIFNsaW0gYW5pbWF0aW9uXHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblxyXG4gICAgICAgIHZhciBjaGFydCA9IG5ldyBDaGFydGlzdC5MaW5lKCcjY3QtbGluZTInLCB7XHJcbiAgICAgICAgICAgIGxhYmVsczogWycxJywgJzInLCAnMycsICc0JywgJzUnLCAnNicsICc3JywgJzgnLCAnOScsICcxMCcsICcxMScsICcxMiddLFxyXG4gICAgICAgICAgICBzZXJpZXM6IFtcclxuICAgICAgICAgICAgICAgIFsxMiwgOSwgNywgOCwgNSwgNCwgNiwgMiwgMywgMywgNCwgNl0sXHJcbiAgICAgICAgICAgICAgICBbNCwgNSwgMywgNywgMywgNSwgNSwgMywgNCwgNCwgNSwgNV0sXHJcbiAgICAgICAgICAgICAgICBbNSwgMywgNCwgNSwgNiwgMywgMywgNCwgNSwgNiwgMywgNF0sXHJcbiAgICAgICAgICAgICAgICBbMywgNCwgNSwgNiwgNywgNiwgNCwgNSwgNiwgNywgNiwgM11cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgICAgbG93OiAwLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IDMwMFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBMZXQncyBwdXQgYSBzZXF1ZW5jZSBudW1iZXIgYXNpZGUgc28gd2UgY2FuIHVzZSBpdCBpbiB0aGUgZXZlbnQgY2FsbGJhY2tzXHJcbiAgICAgICAgdmFyIHNlcSA9IDAsXHJcbiAgICAgICAgICAgIGRlbGF5cyA9IDgwLFxyXG4gICAgICAgICAgICBkdXJhdGlvbnMgPSA1MDA7XHJcblxyXG4gICAgICAgIC8vIE9uY2UgdGhlIGNoYXJ0IGlzIGZ1bGx5IGNyZWF0ZWQgd2UgcmVzZXQgdGhlIHNlcXVlbmNlXHJcbiAgICAgICAgY2hhcnQub24oJ2NyZWF0ZWQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgc2VxID0gMDtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gT24gZWFjaCBkcmF3biBlbGVtZW50IGJ5IENoYXJ0aXN0IHdlIHVzZSB0aGUgQ2hhcnRpc3QuU3ZnIEFQSSB0byB0cmlnZ2VyIFNNSUwgYW5pbWF0aW9uc1xyXG4gICAgICAgIGNoYXJ0Lm9uKCdkcmF3JywgZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICAgICBzZXErKztcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRhLnR5cGUgPT09ICdsaW5lJykge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGRyYXduIGVsZW1lbnQgaXMgYSBsaW5lIHdlIGRvIGEgc2ltcGxlIG9wYWNpdHkgZmFkZSBpbi4gVGhpcyBjb3VsZCBhbHNvIGJlIGFjaGlldmVkIHVzaW5nIENTUzMgYW5pbWF0aW9ucy5cclxuICAgICAgICAgICAgICAgIGRhdGEuZWxlbWVudC5hbmltYXRlKHtcclxuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBkZWxheSB3aGVuIHdlIGxpa2UgdG8gc3RhcnQgdGhlIGFuaW1hdGlvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiZWdpbjogc2VxICogZGVsYXlzICsgMTAwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRHVyYXRpb24gb2YgdGhlIGFuaW1hdGlvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXI6IGR1cmF0aW9ucyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHZhbHVlIHdoZXJlIHRoZSBhbmltYXRpb24gc2hvdWxkIHN0YXJ0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyb206IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSB2YWx1ZSB3aGVyZSBpdCBzaG91bGQgZW5kXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvOiAxXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS50eXBlID09PSAnbGFiZWwnICYmIGRhdGEuYXhpcyA9PT0gJ3gnKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhLmVsZW1lbnQuYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgeToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiZWdpbjogc2VxICogZGVsYXlzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXI6IGR1cmF0aW9ucyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbTogZGF0YS55ICsgMTAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0bzogZGF0YS55LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBjYW4gc3BlY2lmeSBhbiBlYXNpbmcgZnVuY3Rpb24gZnJvbSBDaGFydGlzdC5TdmcuRWFzaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZzogJ2Vhc2VPdXRRdWFydCdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLnR5cGUgPT09ICdsYWJlbCcgJiYgZGF0YS5heGlzID09PSAneScpIHtcclxuICAgICAgICAgICAgICAgIGRhdGEuZWxlbWVudC5hbmltYXRlKHtcclxuICAgICAgICAgICAgICAgICAgICB4OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlZ2luOiBzZXEgKiBkZWxheXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1cjogZHVyYXRpb25zLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tOiBkYXRhLnggLSAxMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvOiBkYXRhLngsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZzogJ2Vhc2VPdXRRdWFydCdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLnR5cGUgPT09ICdwb2ludCcpIHtcclxuICAgICAgICAgICAgICAgIGRhdGEuZWxlbWVudC5hbmltYXRlKHtcclxuICAgICAgICAgICAgICAgICAgICB4MToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiZWdpbjogc2VxICogZGVsYXlzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXI6IGR1cmF0aW9ucyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbTogZGF0YS54IC0gMTAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvOiBkYXRhLngsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZzogJ2Vhc2VPdXRRdWFydCdcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHgyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlZ2luOiBzZXEgKiBkZWxheXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1cjogZHVyYXRpb25zLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tOiBkYXRhLnggLSAxMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG86IGRhdGEueCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nOiAnZWFzZU91dFF1YXJ0J1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiZWdpbjogc2VxICogZGVsYXlzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXI6IGR1cmF0aW9ucyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbTogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG86IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZzogJ2Vhc2VPdXRRdWFydCdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLnR5cGUgPT09ICdncmlkJykge1xyXG4gICAgICAgICAgICAgICAgLy8gVXNpbmcgZGF0YS5heGlzIHdlIGdldCB4IG9yIHkgd2hpY2ggd2UgY2FuIHVzZSB0byBjb25zdHJ1Y3Qgb3VyIGFuaW1hdGlvbiBkZWZpbml0aW9uIG9iamVjdHNcclxuICAgICAgICAgICAgICAgIHZhciBwb3MxQW5pbWF0aW9uID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGJlZ2luOiBzZXEgKiBkZWxheXMsXHJcbiAgICAgICAgICAgICAgICAgICAgZHVyOiBkdXJhdGlvbnMsXHJcbiAgICAgICAgICAgICAgICAgICAgZnJvbTogZGF0YVtkYXRhLmF4aXMudW5pdHMucG9zICsgJzEnXSAtIDMwLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvOiBkYXRhW2RhdGEuYXhpcy51bml0cy5wb3MgKyAnMSddLFxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2luZzogJ2Vhc2VPdXRRdWFydCdcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHBvczJBbmltYXRpb24gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmVnaW46IHNlcSAqIGRlbGF5cyxcclxuICAgICAgICAgICAgICAgICAgICBkdXI6IGR1cmF0aW9ucyxcclxuICAgICAgICAgICAgICAgICAgICBmcm9tOiBkYXRhW2RhdGEuYXhpcy51bml0cy5wb3MgKyAnMiddIC0gMTAwLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvOiBkYXRhW2RhdGEuYXhpcy51bml0cy5wb3MgKyAnMiddLFxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2luZzogJ2Vhc2VPdXRRdWFydCdcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGFuaW1hdGlvbnMgPSB7fTtcclxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbnNbZGF0YS5heGlzLnVuaXRzLnBvcyArICcxJ10gPSBwb3MxQW5pbWF0aW9uO1xyXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uc1tkYXRhLmF4aXMudW5pdHMucG9zICsgJzInXSA9IHBvczJBbmltYXRpb247XHJcbiAgICAgICAgICAgICAgICBhbmltYXRpb25zWydvcGFjaXR5J10gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmVnaW46IHNlcSAqIGRlbGF5cyxcclxuICAgICAgICAgICAgICAgICAgICBkdXI6IGR1cmF0aW9ucyxcclxuICAgICAgICAgICAgICAgICAgICBmcm9tOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2luZzogJ2Vhc2VPdXRRdWFydCdcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgZGF0YS5lbGVtZW50LmFuaW1hdGUoYW5pbWF0aW9ucyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gRm9yIHRoZSBzYWtlIG9mIHRoZSBleGFtcGxlIHdlIHVwZGF0ZSB0aGUgY2hhcnQgZXZlcnkgdGltZSBpdCdzIGNyZWF0ZWQgd2l0aCBhIGRlbGF5IG9mIDEwIHNlY29uZHNcclxuICAgICAgICBjaGFydC5vbignY3JlYXRlZCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAod2luZG93Ll9fZXhhbXBsZUFuaW1hdGVUaW1lb3V0KSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQod2luZG93Ll9fZXhhbXBsZUFuaW1hdGVUaW1lb3V0KTtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5fX2V4YW1wbGVBbmltYXRlVGltZW91dCA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgd2luZG93Ll9fZXhhbXBsZUFuaW1hdGVUaW1lb3V0ID0gc2V0VGltZW91dChjaGFydC51cGRhdGUuYmluZChjaGFydCksIDEyMDAwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8vIEVhc3lwaWUgY2hhcnQgTG9hZGVyXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0RWFzeVBpZUNoYXJ0KTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0RWFzeVBpZUNoYXJ0KCkge1xyXG5cclxuICAgICAgICBpZiAoISQuZm4uZWFzeVBpZUNoYXJ0KSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIFVzYWdlIHZpYSBkYXRhIGF0dHJpYnV0ZXNcclxuICAgICAgICAvLyA8ZGl2IGNsYXNzPVwiZWFzeXBpZS1jaGFydFwiIGRhdGEtZWFzeXBpZWNoYXJ0IGRhdGEtcGVyY2VudD1cIlhcIiBkYXRhLW9wdGlvbk5hbWU9XCJ2YWx1ZVwiPjwvZGl2PlxyXG4gICAgICAgICQoJ1tkYXRhLWVhc3lwaWVjaGFydF0nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgJGVsZW0gPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9ICRlbGVtLmRhdGEoKTtcclxuICAgICAgICAgICAgJGVsZW0uZWFzeVBpZUNoYXJ0KG9wdGlvbnMgfHwge30pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBwcm9ncmFtbWF0aWMgdXNhZ2VcclxuICAgICAgICB2YXIgcGllT3B0aW9uczEgPSB7XHJcbiAgICAgICAgICAgIGFuaW1hdGU6IHtcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiA4MDAsXHJcbiAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJhckNvbG9yOiBBUFBfQ09MT1JTWydzdWNjZXNzJ10sXHJcbiAgICAgICAgICAgIHRyYWNrQ29sb3I6IGZhbHNlLFxyXG4gICAgICAgICAgICBzY2FsZUNvbG9yOiBmYWxzZSxcclxuICAgICAgICAgICAgbGluZVdpZHRoOiAxMCxcclxuICAgICAgICAgICAgbGluZUNhcDogJ2NpcmNsZSdcclxuICAgICAgICB9O1xyXG4gICAgICAgICQoJyNlYXN5cGllMScpLmVhc3lQaWVDaGFydChwaWVPcHRpb25zMSk7XHJcblxyXG4gICAgICAgIHZhciBwaWVPcHRpb25zMiA9IHtcclxuICAgICAgICAgICAgYW5pbWF0ZToge1xyXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDgwMCxcclxuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYmFyQ29sb3I6IEFQUF9DT0xPUlNbJ3dhcm5pbmcnXSxcclxuICAgICAgICAgICAgdHJhY2tDb2xvcjogZmFsc2UsXHJcbiAgICAgICAgICAgIHNjYWxlQ29sb3I6IGZhbHNlLFxyXG4gICAgICAgICAgICBsaW5lV2lkdGg6IDQsXHJcbiAgICAgICAgICAgIGxpbmVDYXA6ICdjaXJjbGUnXHJcbiAgICAgICAgfTtcclxuICAgICAgICAkKCcjZWFzeXBpZTInKS5lYXN5UGllQ2hhcnQocGllT3B0aW9uczIpO1xyXG5cclxuICAgICAgICB2YXIgcGllT3B0aW9uczMgPSB7XHJcbiAgICAgICAgICAgIGFuaW1hdGU6IHtcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiA4MDAsXHJcbiAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJhckNvbG9yOiBBUFBfQ09MT1JTWydkYW5nZXInXSxcclxuICAgICAgICAgICAgdHJhY2tDb2xvcjogZmFsc2UsXHJcbiAgICAgICAgICAgIHNjYWxlQ29sb3I6IEFQUF9DT0xPUlNbJ2dyYXknXSxcclxuICAgICAgICAgICAgbGluZVdpZHRoOiAxNSxcclxuICAgICAgICAgICAgbGluZUNhcDogJ2NpcmNsZSdcclxuICAgICAgICB9O1xyXG4gICAgICAgICQoJyNlYXN5cGllMycpLmVhc3lQaWVDaGFydChwaWVPcHRpb25zMyk7XHJcblxyXG4gICAgICAgIHZhciBwaWVPcHRpb25zNCA9IHtcclxuICAgICAgICAgICAgYW5pbWF0ZToge1xyXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDgwMCxcclxuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYmFyQ29sb3I6IEFQUF9DT0xPUlNbJ2RhbmdlciddLFxyXG4gICAgICAgICAgICB0cmFja0NvbG9yOiBBUFBfQ09MT1JTWyd5ZWxsb3cnXSxcclxuICAgICAgICAgICAgc2NhbGVDb2xvcjogQVBQX0NPTE9SU1snZ3JheS1kYXJrJ10sXHJcbiAgICAgICAgICAgIGxpbmVXaWR0aDogMTUsXHJcbiAgICAgICAgICAgIGxpbmVDYXA6ICdjaXJjbGUnXHJcbiAgICAgICAgfTtcclxuICAgICAgICAkKCcjZWFzeXBpZTQnKS5lYXN5UGllQ2hhcnQocGllT3B0aW9uczQpO1xyXG5cclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLy8gQ0hBUlQgU1BMSU5FXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAkKGluaXRGbG90U3BsaW5lKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0RmxvdFNwbGluZSgpIHtcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSBbe1xyXG4gICAgICAgICAgICBcImxhYmVsXCI6IFwiVW5pcXVlc1wiLFxyXG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiIzc2ODI5NFwiLFxyXG4gICAgICAgICAgICBcImRhdGFcIjogW1xyXG4gICAgICAgICAgICAgICAgW1wiTWFyXCIsIDcwXSxcclxuICAgICAgICAgICAgICAgIFtcIkFwclwiLCA4NV0sXHJcbiAgICAgICAgICAgICAgICBbXCJNYXlcIiwgNTldLFxyXG4gICAgICAgICAgICAgICAgW1wiSnVuXCIsIDkzXSxcclxuICAgICAgICAgICAgICAgIFtcIkp1bFwiLCA2Nl0sXHJcbiAgICAgICAgICAgICAgICBbXCJBdWdcIiwgODZdLFxyXG4gICAgICAgICAgICAgICAgW1wiU2VwXCIsIDYwXVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICBcImxhYmVsXCI6IFwiUmVjdXJyZW50XCIsXHJcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCIjMWY5MmZlXCIsXHJcbiAgICAgICAgICAgIFwiZGF0YVwiOiBbXHJcbiAgICAgICAgICAgICAgICBbXCJNYXJcIiwgMjFdLFxyXG4gICAgICAgICAgICAgICAgW1wiQXByXCIsIDEyXSxcclxuICAgICAgICAgICAgICAgIFtcIk1heVwiLCAyN10sXHJcbiAgICAgICAgICAgICAgICBbXCJKdW5cIiwgMjRdLFxyXG4gICAgICAgICAgICAgICAgW1wiSnVsXCIsIDE2XSxcclxuICAgICAgICAgICAgICAgIFtcIkF1Z1wiLCAzOV0sXHJcbiAgICAgICAgICAgICAgICBbXCJTZXBcIiwgMTVdXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XTtcclxuXHJcbiAgICAgICAgdmFyIGRhdGF2MiA9IFt7XHJcbiAgICAgICAgICAgIFwibGFiZWxcIjogXCJIb3Vyc1wiLFxyXG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiIzIzYjdlNVwiLFxyXG4gICAgICAgICAgICBcImRhdGFcIjogW1xyXG4gICAgICAgICAgICAgICAgW1wiSmFuXCIsIDcwXSxcclxuICAgICAgICAgICAgICAgIFtcIkZlYlwiLCAyMF0sXHJcbiAgICAgICAgICAgICAgICBbXCJNYXJcIiwgNzBdLFxyXG4gICAgICAgICAgICAgICAgW1wiQXByXCIsIDg1XSxcclxuICAgICAgICAgICAgICAgIFtcIk1heVwiLCA1OV0sXHJcbiAgICAgICAgICAgICAgICBbXCJKdW5cIiwgOTNdLFxyXG4gICAgICAgICAgICAgICAgW1wiSnVsXCIsIDY2XSxcclxuICAgICAgICAgICAgICAgIFtcIkF1Z1wiLCA4Nl0sXHJcbiAgICAgICAgICAgICAgICBbXCJTZXBcIiwgNjBdLFxyXG4gICAgICAgICAgICAgICAgW1wiT2N0XCIsIDYwXSxcclxuICAgICAgICAgICAgICAgIFtcIk5vdlwiLCAxMl0sXHJcbiAgICAgICAgICAgICAgICBbXCJEZWNcIiwgNTBdXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIFwibGFiZWxcIjogXCJDb21taXRzXCIsXHJcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCIjNzI2NmJhXCIsXHJcbiAgICAgICAgICAgIFwiZGF0YVwiOiBbXHJcbiAgICAgICAgICAgICAgICBbXCJKYW5cIiwgMjBdLFxyXG4gICAgICAgICAgICAgICAgW1wiRmViXCIsIDcwXSxcclxuICAgICAgICAgICAgICAgIFtcIk1hclwiLCAzMF0sXHJcbiAgICAgICAgICAgICAgICBbXCJBcHJcIiwgNTBdLFxyXG4gICAgICAgICAgICAgICAgW1wiTWF5XCIsIDg1XSxcclxuICAgICAgICAgICAgICAgIFtcIkp1blwiLCA0M10sXHJcbiAgICAgICAgICAgICAgICBbXCJKdWxcIiwgOTZdLFxyXG4gICAgICAgICAgICAgICAgW1wiQXVnXCIsIDM2XSxcclxuICAgICAgICAgICAgICAgIFtcIlNlcFwiLCA4MF0sXHJcbiAgICAgICAgICAgICAgICBbXCJPY3RcIiwgMTBdLFxyXG4gICAgICAgICAgICAgICAgW1wiTm92XCIsIDcyXSxcclxuICAgICAgICAgICAgICAgIFtcIkRlY1wiLCAzMV1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1dO1xyXG5cclxuICAgICAgICB2YXIgZGF0YXYzID0gW3tcclxuICAgICAgICAgICAgXCJsYWJlbFwiOiBcIkhvbWVcIixcclxuICAgICAgICAgICAgXCJjb2xvclwiOiBcIiMxYmEzY2RcIixcclxuICAgICAgICAgICAgXCJkYXRhXCI6IFtcclxuICAgICAgICAgICAgICAgIFtcIjFcIiwgMzhdLFxyXG4gICAgICAgICAgICAgICAgW1wiMlwiLCA0MF0sXHJcbiAgICAgICAgICAgICAgICBbXCIzXCIsIDQyXSxcclxuICAgICAgICAgICAgICAgIFtcIjRcIiwgNDhdLFxyXG4gICAgICAgICAgICAgICAgW1wiNVwiLCA1MF0sXHJcbiAgICAgICAgICAgICAgICBbXCI2XCIsIDcwXSxcclxuICAgICAgICAgICAgICAgIFtcIjdcIiwgMTQ1XSxcclxuICAgICAgICAgICAgICAgIFtcIjhcIiwgNzBdLFxyXG4gICAgICAgICAgICAgICAgW1wiOVwiLCA1OV0sXHJcbiAgICAgICAgICAgICAgICBbXCIxMFwiLCA0OF0sXHJcbiAgICAgICAgICAgICAgICBbXCIxMVwiLCAzOF0sXHJcbiAgICAgICAgICAgICAgICBbXCIxMlwiLCAyOV0sXHJcbiAgICAgICAgICAgICAgICBbXCIxM1wiLCAzMF0sXHJcbiAgICAgICAgICAgICAgICBbXCIxNFwiLCAyMl0sXHJcbiAgICAgICAgICAgICAgICBbXCIxNVwiLCAyOF1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgICAgXCJsYWJlbFwiOiBcIk92ZXJhbGxcIixcclxuICAgICAgICAgICAgXCJjb2xvclwiOiBcIiMzYTNmNTFcIixcclxuICAgICAgICAgICAgXCJkYXRhXCI6IFtcclxuICAgICAgICAgICAgICAgIFtcIjFcIiwgMTZdLFxyXG4gICAgICAgICAgICAgICAgW1wiMlwiLCAxOF0sXHJcbiAgICAgICAgICAgICAgICBbXCIzXCIsIDE3XSxcclxuICAgICAgICAgICAgICAgIFtcIjRcIiwgMTZdLFxyXG4gICAgICAgICAgICAgICAgW1wiNVwiLCAzMF0sXHJcbiAgICAgICAgICAgICAgICBbXCI2XCIsIDExMF0sXHJcbiAgICAgICAgICAgICAgICBbXCI3XCIsIDE5XSxcclxuICAgICAgICAgICAgICAgIFtcIjhcIiwgMThdLFxyXG4gICAgICAgICAgICAgICAgW1wiOVwiLCAxMTBdLFxyXG4gICAgICAgICAgICAgICAgW1wiMTBcIiwgMTldLFxyXG4gICAgICAgICAgICAgICAgW1wiMTFcIiwgMTZdLFxyXG4gICAgICAgICAgICAgICAgW1wiMTJcIiwgMTBdLFxyXG4gICAgICAgICAgICAgICAgW1wiMTNcIiwgMjBdLFxyXG4gICAgICAgICAgICAgICAgW1wiMTRcIiwgMTBdLFxyXG4gICAgICAgICAgICAgICAgW1wiMTVcIiwgMjBdXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XTtcclxuXHJcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIHNlcmllczoge1xyXG4gICAgICAgICAgICAgICAgbGluZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBzaG93OiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHBvaW50czoge1xyXG4gICAgICAgICAgICAgICAgICAgIHNob3c6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgcmFkaXVzOiA0XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgc3BsaW5lczoge1xyXG4gICAgICAgICAgICAgICAgICAgIHNob3c6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGVuc2lvbjogMC40LFxyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aDogMSxcclxuICAgICAgICAgICAgICAgICAgICBmaWxsOiAwLjVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ3JpZDoge1xyXG4gICAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICcjZWVlJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlcldpZHRoOiAxLFxyXG4gICAgICAgICAgICAgICAgaG92ZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnI2ZjZmNmYydcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdG9vbHRpcDogdHJ1ZSxcclxuICAgICAgICAgICAgdG9vbHRpcE9wdHM6IHtcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGZ1bmN0aW9uKGxhYmVsLCB4LCB5KSB7IHJldHVybiB4ICsgJyA6ICcgKyB5OyB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHhheGlzOiB7XHJcbiAgICAgICAgICAgICAgICB0aWNrQ29sb3I6ICcjZmNmY2ZjJyxcclxuICAgICAgICAgICAgICAgIG1vZGU6ICdjYXRlZ29yaWVzJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB5YXhpczoge1xyXG4gICAgICAgICAgICAgICAgbWluOiAwLFxyXG4gICAgICAgICAgICAgICAgbWF4OiAxNTAsIC8vIG9wdGlvbmFsOiB1c2UgaXQgZm9yIGEgY2xlYXIgcmVwcmVzZXRhdGlvblxyXG4gICAgICAgICAgICAgICAgdGlja0NvbG9yOiAnI2VlZScsXHJcbiAgICAgICAgICAgICAgICAvL3Bvc2l0aW9uOiAncmlnaHQnIG9yICdsZWZ0JyxcclxuICAgICAgICAgICAgICAgIHRpY2tGb3JtYXR0ZXI6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdiAvKiArICcgdmlzaXRvcnMnKi8gO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzaGFkb3dTaXplOiAwXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIGNoYXJ0ID0gJCgnLmNoYXJ0LXNwbGluZScpO1xyXG4gICAgICAgIGlmIChjaGFydC5sZW5ndGgpXHJcbiAgICAgICAgICAgICQucGxvdChjaGFydCwgZGF0YSwgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgIHZhciBjaGFydHYyID0gJCgnLmNoYXJ0LXNwbGluZXYyJyk7XHJcbiAgICAgICAgaWYgKGNoYXJ0djIubGVuZ3RoKVxyXG4gICAgICAgICAgICAkLnBsb3QoY2hhcnR2MiwgZGF0YXYyLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgdmFyIGNoYXJ0djMgPSAkKCcuY2hhcnQtc3BsaW5ldjMnKTtcclxuICAgICAgICBpZiAoY2hhcnR2My5sZW5ndGgpXHJcbiAgICAgICAgICAgICQucGxvdChjaGFydHYzLCBkYXRhdjMsIG9wdGlvbnMpO1xyXG5cclxuICAgIH1cclxuXHJcbn0pKCk7XHJcblxyXG4vLyBDSEFSVCBBUkVBXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcblxyXG4gICAgJChpbml0RmxvdEFyZWEpXHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdEZsb3RBcmVhKCkge1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IFt7XHJcbiAgICAgICAgICAgIFwibGFiZWxcIjogXCJVbmlxdWVzXCIsXHJcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCIjYWFkODc0XCIsXHJcbiAgICAgICAgICAgIFwiZGF0YVwiOiBbXHJcbiAgICAgICAgICAgICAgICBbXCJNYXJcIiwgNTBdLFxyXG4gICAgICAgICAgICAgICAgW1wiQXByXCIsIDg0XSxcclxuICAgICAgICAgICAgICAgIFtcIk1heVwiLCA1Ml0sXHJcbiAgICAgICAgICAgICAgICBbXCJKdW5cIiwgODhdLFxyXG4gICAgICAgICAgICAgICAgW1wiSnVsXCIsIDY5XSxcclxuICAgICAgICAgICAgICAgIFtcIkF1Z1wiLCA5Ml0sXHJcbiAgICAgICAgICAgICAgICBbXCJTZXBcIiwgNThdXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIFwibGFiZWxcIjogXCJSZWN1cnJlbnRcIixcclxuICAgICAgICAgICAgXCJjb2xvclwiOiBcIiM3ZGM3ZGZcIixcclxuICAgICAgICAgICAgXCJkYXRhXCI6IFtcclxuICAgICAgICAgICAgICAgIFtcIk1hclwiLCAxM10sXHJcbiAgICAgICAgICAgICAgICBbXCJBcHJcIiwgNDRdLFxyXG4gICAgICAgICAgICAgICAgW1wiTWF5XCIsIDQ0XSxcclxuICAgICAgICAgICAgICAgIFtcIkp1blwiLCAyN10sXHJcbiAgICAgICAgICAgICAgICBbXCJKdWxcIiwgMzhdLFxyXG4gICAgICAgICAgICAgICAgW1wiQXVnXCIsIDExXSxcclxuICAgICAgICAgICAgICAgIFtcIlNlcFwiLCAzOV1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1dO1xyXG5cclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgc2VyaWVzOiB7XHJcbiAgICAgICAgICAgICAgICBsaW5lczoge1xyXG4gICAgICAgICAgICAgICAgICAgIHNob3c6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsbDogMC44XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcG9pbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hvdzogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICByYWRpdXM6IDRcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ3JpZDoge1xyXG4gICAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICcjZWVlJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlcldpZHRoOiAxLFxyXG4gICAgICAgICAgICAgICAgaG92ZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnI2ZjZmNmYydcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdG9vbHRpcDogdHJ1ZSxcclxuICAgICAgICAgICAgdG9vbHRpcE9wdHM6IHtcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGZ1bmN0aW9uKGxhYmVsLCB4LCB5KSB7IHJldHVybiB4ICsgJyA6ICcgKyB5OyB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHhheGlzOiB7XHJcbiAgICAgICAgICAgICAgICB0aWNrQ29sb3I6ICcjZmNmY2ZjJyxcclxuICAgICAgICAgICAgICAgIG1vZGU6ICdjYXRlZ29yaWVzJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB5YXhpczoge1xyXG4gICAgICAgICAgICAgICAgbWluOiAwLFxyXG4gICAgICAgICAgICAgICAgdGlja0NvbG9yOiAnI2VlZScsXHJcbiAgICAgICAgICAgICAgICAvLyBwb3NpdGlvbjogJ3JpZ2h0JyBvciAnbGVmdCdcclxuICAgICAgICAgICAgICAgIHRpY2tGb3JtYXR0ZXI6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdiArICcgdmlzaXRvcnMnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzaGFkb3dTaXplOiAwXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIGNoYXJ0ID0gJCgnLmNoYXJ0LWFyZWEnKTtcclxuICAgICAgICBpZiAoY2hhcnQubGVuZ3RoKVxyXG4gICAgICAgICAgICAkLnBsb3QoY2hhcnQsIGRhdGEsIG9wdGlvbnMpO1xyXG5cclxuICAgIH1cclxuXHJcbn0pKCk7XHJcblxyXG4vLyBDSEFSVCBCQVJcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuXHJcbiAgICAkKGluaXRGbG90QmFyKVxyXG5cclxuICAgIGZ1bmN0aW9uIGluaXRGbG90QmFyKCkge1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IFt7XHJcbiAgICAgICAgICAgIFwibGFiZWxcIjogXCJTYWxlc1wiLFxyXG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiIzljZDE1OVwiLFxyXG4gICAgICAgICAgICBcImRhdGFcIjogW1xyXG4gICAgICAgICAgICAgICAgW1wiSmFuXCIsIDI3XSxcclxuICAgICAgICAgICAgICAgIFtcIkZlYlwiLCA4Ml0sXHJcbiAgICAgICAgICAgICAgICBbXCJNYXJcIiwgNTZdLFxyXG4gICAgICAgICAgICAgICAgW1wiQXByXCIsIDE0XSxcclxuICAgICAgICAgICAgICAgIFtcIk1heVwiLCAyOF0sXHJcbiAgICAgICAgICAgICAgICBbXCJKdW5cIiwgNzddLFxyXG4gICAgICAgICAgICAgICAgW1wiSnVsXCIsIDIzXSxcclxuICAgICAgICAgICAgICAgIFtcIkF1Z1wiLCA0OV0sXHJcbiAgICAgICAgICAgICAgICBbXCJTZXBcIiwgODFdLFxyXG4gICAgICAgICAgICAgICAgW1wiT2N0XCIsIDIwXVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfV07XHJcblxyXG4gICAgICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICBzZXJpZXM6IHtcclxuICAgICAgICAgICAgICAgIGJhcnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBhbGlnbjogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIHNob3c6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgYmFyV2lkdGg6IDAuNixcclxuICAgICAgICAgICAgICAgICAgICBmaWxsOiAwLjlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ3JpZDoge1xyXG4gICAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICcjZWVlJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlcldpZHRoOiAxLFxyXG4gICAgICAgICAgICAgICAgaG92ZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnI2ZjZmNmYydcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdG9vbHRpcDogdHJ1ZSxcclxuICAgICAgICAgICAgdG9vbHRpcE9wdHM6IHtcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGZ1bmN0aW9uKGxhYmVsLCB4LCB5KSB7IHJldHVybiB4ICsgJyA6ICcgKyB5OyB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHhheGlzOiB7XHJcbiAgICAgICAgICAgICAgICB0aWNrQ29sb3I6ICcjZmNmY2ZjJyxcclxuICAgICAgICAgICAgICAgIG1vZGU6ICdjYXRlZ29yaWVzJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB5YXhpczoge1xyXG4gICAgICAgICAgICAgICAgLy8gcG9zaXRpb246ICdyaWdodCcgb3IgJ2xlZnQnXHJcbiAgICAgICAgICAgICAgICB0aWNrQ29sb3I6ICcjZWVlJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzaGFkb3dTaXplOiAwXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIGNoYXJ0ID0gJCgnLmNoYXJ0LWJhcicpO1xyXG4gICAgICAgIGlmIChjaGFydC5sZW5ndGgpXHJcbiAgICAgICAgICAgICQucGxvdChjaGFydCwgZGF0YSwgb3B0aW9ucyk7XHJcblxyXG4gICAgfVxyXG5cclxufSkoKTtcclxuXHJcblxyXG4vLyBDSEFSVCBCQVIgU1RBQ0tFRFxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG5cclxuICAgICQoaW5pdEZsb3RCYXJTdGFja2VkKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0RmxvdEJhclN0YWNrZWQoKSB7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0gW3tcclxuICAgICAgICAgICAgXCJsYWJlbFwiOiBcIlR3ZWV0c1wiLFxyXG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiIzUxYmZmMlwiLFxyXG4gICAgICAgICAgICBcImRhdGFcIjogW1xyXG4gICAgICAgICAgICAgICAgW1wiSmFuXCIsIDU2XSxcclxuICAgICAgICAgICAgICAgIFtcIkZlYlwiLCA4MV0sXHJcbiAgICAgICAgICAgICAgICBbXCJNYXJcIiwgOTddLFxyXG4gICAgICAgICAgICAgICAgW1wiQXByXCIsIDQ0XSxcclxuICAgICAgICAgICAgICAgIFtcIk1heVwiLCAyNF0sXHJcbiAgICAgICAgICAgICAgICBbXCJKdW5cIiwgODVdLFxyXG4gICAgICAgICAgICAgICAgW1wiSnVsXCIsIDk0XSxcclxuICAgICAgICAgICAgICAgIFtcIkF1Z1wiLCA3OF0sXHJcbiAgICAgICAgICAgICAgICBbXCJTZXBcIiwgNTJdLFxyXG4gICAgICAgICAgICAgICAgW1wiT2N0XCIsIDE3XSxcclxuICAgICAgICAgICAgICAgIFtcIk5vdlwiLCA5MF0sXHJcbiAgICAgICAgICAgICAgICBbXCJEZWNcIiwgNjJdXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIFwibGFiZWxcIjogXCJMaWtlc1wiLFxyXG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiIzRhOGVmMVwiLFxyXG4gICAgICAgICAgICBcImRhdGFcIjogW1xyXG4gICAgICAgICAgICAgICAgW1wiSmFuXCIsIDY5XSxcclxuICAgICAgICAgICAgICAgIFtcIkZlYlwiLCAxMzVdLFxyXG4gICAgICAgICAgICAgICAgW1wiTWFyXCIsIDE0XSxcclxuICAgICAgICAgICAgICAgIFtcIkFwclwiLCAxMDBdLFxyXG4gICAgICAgICAgICAgICAgW1wiTWF5XCIsIDEwMF0sXHJcbiAgICAgICAgICAgICAgICBbXCJKdW5cIiwgNjJdLFxyXG4gICAgICAgICAgICAgICAgW1wiSnVsXCIsIDExNV0sXHJcbiAgICAgICAgICAgICAgICBbXCJBdWdcIiwgMjJdLFxyXG4gICAgICAgICAgICAgICAgW1wiU2VwXCIsIDEwNF0sXHJcbiAgICAgICAgICAgICAgICBbXCJPY3RcIiwgMTMyXSxcclxuICAgICAgICAgICAgICAgIFtcIk5vdlwiLCA3Ml0sXHJcbiAgICAgICAgICAgICAgICBbXCJEZWNcIiwgNjFdXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIFwibGFiZWxcIjogXCIrMVwiLFxyXG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiI2YwNjkzYVwiLFxyXG4gICAgICAgICAgICBcImRhdGFcIjogW1xyXG4gICAgICAgICAgICAgICAgW1wiSmFuXCIsIDI5XSxcclxuICAgICAgICAgICAgICAgIFtcIkZlYlwiLCAzNl0sXHJcbiAgICAgICAgICAgICAgICBbXCJNYXJcIiwgNDddLFxyXG4gICAgICAgICAgICAgICAgW1wiQXByXCIsIDIxXSxcclxuICAgICAgICAgICAgICAgIFtcIk1heVwiLCA1XSxcclxuICAgICAgICAgICAgICAgIFtcIkp1blwiLCA0OV0sXHJcbiAgICAgICAgICAgICAgICBbXCJKdWxcIiwgMzddLFxyXG4gICAgICAgICAgICAgICAgW1wiQXVnXCIsIDQ0XSxcclxuICAgICAgICAgICAgICAgIFtcIlNlcFwiLCAyOF0sXHJcbiAgICAgICAgICAgICAgICBbXCJPY3RcIiwgOV0sXHJcbiAgICAgICAgICAgICAgICBbXCJOb3ZcIiwgMTJdLFxyXG4gICAgICAgICAgICAgICAgW1wiRGVjXCIsIDM1XVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfV07XHJcblxyXG4gICAgICAgIHZhciBkYXRhdjIgPSBbe1xyXG4gICAgICAgICAgICBcImxhYmVsXCI6IFwiUGVuZGluZ1wiLFxyXG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiIzkyODljYVwiLFxyXG4gICAgICAgICAgICBcImRhdGFcIjogW1xyXG4gICAgICAgICAgICAgICAgW1wiUGoxXCIsIDg2XSxcclxuICAgICAgICAgICAgICAgIFtcIlBqMlwiLCAxMzZdLFxyXG4gICAgICAgICAgICAgICAgW1wiUGozXCIsIDk3XSxcclxuICAgICAgICAgICAgICAgIFtcIlBqNFwiLCAxMTBdLFxyXG4gICAgICAgICAgICAgICAgW1wiUGo1XCIsIDYyXSxcclxuICAgICAgICAgICAgICAgIFtcIlBqNlwiLCA4NV0sXHJcbiAgICAgICAgICAgICAgICBbXCJQajdcIiwgMTE1XSxcclxuICAgICAgICAgICAgICAgIFtcIlBqOFwiLCA3OF0sXHJcbiAgICAgICAgICAgICAgICBbXCJQajlcIiwgMTA0XSxcclxuICAgICAgICAgICAgICAgIFtcIlBqMTBcIiwgODJdLFxyXG4gICAgICAgICAgICAgICAgW1wiUGoxMVwiLCA5N10sXHJcbiAgICAgICAgICAgICAgICBbXCJQajEyXCIsIDExMF0sXHJcbiAgICAgICAgICAgICAgICBbXCJQajEzXCIsIDYyXVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICBcImxhYmVsXCI6IFwiQXNzaWduZWRcIixcclxuICAgICAgICAgICAgXCJjb2xvclwiOiBcIiM3MjY2YmFcIixcclxuICAgICAgICAgICAgXCJkYXRhXCI6IFtcclxuICAgICAgICAgICAgICAgIFtcIlBqMVwiLCA0OV0sXHJcbiAgICAgICAgICAgICAgICBbXCJQajJcIiwgODFdLFxyXG4gICAgICAgICAgICAgICAgW1wiUGozXCIsIDQ3XSxcclxuICAgICAgICAgICAgICAgIFtcIlBqNFwiLCA0NF0sXHJcbiAgICAgICAgICAgICAgICBbXCJQajVcIiwgMTAwXSxcclxuICAgICAgICAgICAgICAgIFtcIlBqNlwiLCA0OV0sXHJcbiAgICAgICAgICAgICAgICBbXCJQajdcIiwgOTRdLFxyXG4gICAgICAgICAgICAgICAgW1wiUGo4XCIsIDQ0XSxcclxuICAgICAgICAgICAgICAgIFtcIlBqOVwiLCA1Ml0sXHJcbiAgICAgICAgICAgICAgICBbXCJQajEwXCIsIDE3XSxcclxuICAgICAgICAgICAgICAgIFtcIlBqMTFcIiwgNDddLFxyXG4gICAgICAgICAgICAgICAgW1wiUGoxMlwiLCA0NF0sXHJcbiAgICAgICAgICAgICAgICBbXCJQajEzXCIsIDEwMF1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgICAgXCJsYWJlbFwiOiBcIkNvbXBsZXRlZFwiLFxyXG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiIzU2NGFhM1wiLFxyXG4gICAgICAgICAgICBcImRhdGFcIjogW1xyXG4gICAgICAgICAgICAgICAgW1wiUGoxXCIsIDI5XSxcclxuICAgICAgICAgICAgICAgIFtcIlBqMlwiLCA1Nl0sXHJcbiAgICAgICAgICAgICAgICBbXCJQajNcIiwgMTRdLFxyXG4gICAgICAgICAgICAgICAgW1wiUGo0XCIsIDIxXSxcclxuICAgICAgICAgICAgICAgIFtcIlBqNVwiLCA1XSxcclxuICAgICAgICAgICAgICAgIFtcIlBqNlwiLCAyNF0sXHJcbiAgICAgICAgICAgICAgICBbXCJQajdcIiwgMzddLFxyXG4gICAgICAgICAgICAgICAgW1wiUGo4XCIsIDIyXSxcclxuICAgICAgICAgICAgICAgIFtcIlBqOVwiLCAyOF0sXHJcbiAgICAgICAgICAgICAgICBbXCJQajEwXCIsIDldLFxyXG4gICAgICAgICAgICAgICAgW1wiUGoxMVwiLCAxNF0sXHJcbiAgICAgICAgICAgICAgICBbXCJQajEyXCIsIDIxXSxcclxuICAgICAgICAgICAgICAgIFtcIlBqMTNcIiwgNV1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1dO1xyXG5cclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgc2VyaWVzOiB7XHJcbiAgICAgICAgICAgICAgICBzdGFjazogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGJhcnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBhbGlnbjogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIHNob3c6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgYmFyV2lkdGg6IDAuNixcclxuICAgICAgICAgICAgICAgICAgICBmaWxsOiAwLjlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ3JpZDoge1xyXG4gICAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICcjZWVlJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlcldpZHRoOiAxLFxyXG4gICAgICAgICAgICAgICAgaG92ZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnI2ZjZmNmYydcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdG9vbHRpcDogdHJ1ZSxcclxuICAgICAgICAgICAgdG9vbHRpcE9wdHM6IHtcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGZ1bmN0aW9uKGxhYmVsLCB4LCB5KSB7IHJldHVybiB4ICsgJyA6ICcgKyB5OyB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHhheGlzOiB7XHJcbiAgICAgICAgICAgICAgICB0aWNrQ29sb3I6ICcjZmNmY2ZjJyxcclxuICAgICAgICAgICAgICAgIG1vZGU6ICdjYXRlZ29yaWVzJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB5YXhpczoge1xyXG4gICAgICAgICAgICAgICAgLy8gcG9zaXRpb246ICdyaWdodCcgb3IgJ2xlZnQnXHJcbiAgICAgICAgICAgICAgICB0aWNrQ29sb3I6ICcjZWVlJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzaGFkb3dTaXplOiAwXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIGNoYXJ0ID0gJCgnLmNoYXJ0LWJhci1zdGFja2VkJyk7XHJcbiAgICAgICAgaWYgKGNoYXJ0Lmxlbmd0aClcclxuICAgICAgICAgICAgJC5wbG90KGNoYXJ0LCBkYXRhLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgdmFyIGNoYXJ0djIgPSAkKCcuY2hhcnQtYmFyLXN0YWNrZWR2MicpO1xyXG4gICAgICAgIGlmIChjaGFydHYyLmxlbmd0aClcclxuICAgICAgICAgICAgJC5wbG90KGNoYXJ0djIsIGRhdGF2Miwgb3B0aW9ucyk7XHJcblxyXG4gICAgfVxyXG5cclxufSkoKTtcclxuXHJcbi8vIENIQVJUIERPTlVUXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcblxyXG4gICAgJChpbml0RmxvdERvbnV0KTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0RmxvdERvbnV0KCkge1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IFt7XHJcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCIjMzlDNTU4XCIsXHJcbiAgICAgICAgICAgIFwiZGF0YVwiOiA2MCxcclxuICAgICAgICAgICAgXCJsYWJlbFwiOiBcIkNvZmZlZVwiXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiIzAwYjRmZlwiLFxyXG4gICAgICAgICAgICBcImRhdGFcIjogOTAsXHJcbiAgICAgICAgICAgIFwibGFiZWxcIjogXCJDU1NcIlxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgICAgXCJjb2xvclwiOiBcIiNGRkJFNDFcIixcclxuICAgICAgICAgICAgXCJkYXRhXCI6IDUwLFxyXG4gICAgICAgICAgICBcImxhYmVsXCI6IFwiTEVTU1wiXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiI2ZmM2U0M1wiLFxyXG4gICAgICAgICAgICBcImRhdGFcIjogODAsXHJcbiAgICAgICAgICAgIFwibGFiZWxcIjogXCJKYWRlXCJcclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCIjOTM3ZmM3XCIsXHJcbiAgICAgICAgICAgIFwiZGF0YVwiOiAxMTYsXHJcbiAgICAgICAgICAgIFwibGFiZWxcIjogXCJBbmd1bGFySlNcIlxyXG4gICAgICAgIH1dO1xyXG5cclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgc2VyaWVzOiB7XHJcbiAgICAgICAgICAgICAgICBwaWU6IHtcclxuICAgICAgICAgICAgICAgICAgICBzaG93OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGlubmVyUmFkaXVzOiAwLjUgLy8gVGhpcyBtYWtlcyB0aGUgZG9udXQgc2hhcGVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBjaGFydCA9ICQoJy5jaGFydC1kb251dCcpO1xyXG4gICAgICAgIGlmIChjaGFydC5sZW5ndGgpXHJcbiAgICAgICAgICAgICQucGxvdChjaGFydCwgZGF0YSwgb3B0aW9ucyk7XHJcblxyXG4gICAgfVxyXG5cclxufSkoKTtcclxuXHJcbi8vIENIQVJUIExJTkVcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuXHJcbiAgICAkKGluaXRGbG90TGluZSlcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0RmxvdExpbmUoKSB7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0gW3tcclxuICAgICAgICAgICAgXCJsYWJlbFwiOiBcIkNvbXBsZXRlXCIsXHJcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCIjNWFiMWVmXCIsXHJcbiAgICAgICAgICAgIFwiZGF0YVwiOiBbXHJcbiAgICAgICAgICAgICAgICBbXCJKYW5cIiwgMTg4XSxcclxuICAgICAgICAgICAgICAgIFtcIkZlYlwiLCAxODNdLFxyXG4gICAgICAgICAgICAgICAgW1wiTWFyXCIsIDE4NV0sXHJcbiAgICAgICAgICAgICAgICBbXCJBcHJcIiwgMTk5XSxcclxuICAgICAgICAgICAgICAgIFtcIk1heVwiLCAxOTBdLFxyXG4gICAgICAgICAgICAgICAgW1wiSnVuXCIsIDE5NF0sXHJcbiAgICAgICAgICAgICAgICBbXCJKdWxcIiwgMTk0XSxcclxuICAgICAgICAgICAgICAgIFtcIkF1Z1wiLCAxODRdLFxyXG4gICAgICAgICAgICAgICAgW1wiU2VwXCIsIDc0XVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICBcImxhYmVsXCI6IFwiSW4gUHJvZ3Jlc3NcIixcclxuICAgICAgICAgICAgXCJjb2xvclwiOiBcIiNmNTk5NGVcIixcclxuICAgICAgICAgICAgXCJkYXRhXCI6IFtcclxuICAgICAgICAgICAgICAgIFtcIkphblwiLCAxNTNdLFxyXG4gICAgICAgICAgICAgICAgW1wiRmViXCIsIDExNl0sXHJcbiAgICAgICAgICAgICAgICBbXCJNYXJcIiwgMTM2XSxcclxuICAgICAgICAgICAgICAgIFtcIkFwclwiLCAxMTldLFxyXG4gICAgICAgICAgICAgICAgW1wiTWF5XCIsIDE0OF0sXHJcbiAgICAgICAgICAgICAgICBbXCJKdW5cIiwgMTMzXSxcclxuICAgICAgICAgICAgICAgIFtcIkp1bFwiLCAxMThdLFxyXG4gICAgICAgICAgICAgICAgW1wiQXVnXCIsIDE2MV0sXHJcbiAgICAgICAgICAgICAgICBbXCJTZXBcIiwgNTldXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIFwibGFiZWxcIjogXCJDYW5jZWxsZWRcIixcclxuICAgICAgICAgICAgXCJjb2xvclwiOiBcIiNkODdhODBcIixcclxuICAgICAgICAgICAgXCJkYXRhXCI6IFtcclxuICAgICAgICAgICAgICAgIFtcIkphblwiLCAxMTFdLFxyXG4gICAgICAgICAgICAgICAgW1wiRmViXCIsIDk3XSxcclxuICAgICAgICAgICAgICAgIFtcIk1hclwiLCA5M10sXHJcbiAgICAgICAgICAgICAgICBbXCJBcHJcIiwgMTEwXSxcclxuICAgICAgICAgICAgICAgIFtcIk1heVwiLCAxMDJdLFxyXG4gICAgICAgICAgICAgICAgW1wiSnVuXCIsIDkzXSxcclxuICAgICAgICAgICAgICAgIFtcIkp1bFwiLCA5Ml0sXHJcbiAgICAgICAgICAgICAgICBbXCJBdWdcIiwgOTJdLFxyXG4gICAgICAgICAgICAgICAgW1wiU2VwXCIsIDQ0XVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfV07XHJcblxyXG4gICAgICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICBzZXJpZXM6IHtcclxuICAgICAgICAgICAgICAgIGxpbmVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hvdzogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBmaWxsOiAwLjAxXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcG9pbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hvdzogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICByYWRpdXM6IDRcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ3JpZDoge1xyXG4gICAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICcjZWVlJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlcldpZHRoOiAxLFxyXG4gICAgICAgICAgICAgICAgaG92ZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnI2ZjZmNmYydcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdG9vbHRpcDogdHJ1ZSxcclxuICAgICAgICAgICAgdG9vbHRpcE9wdHM6IHtcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGZ1bmN0aW9uKGxhYmVsLCB4LCB5KSB7IHJldHVybiB4ICsgJyA6ICcgKyB5OyB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHhheGlzOiB7XHJcbiAgICAgICAgICAgICAgICB0aWNrQ29sb3I6ICcjZWVlJyxcclxuICAgICAgICAgICAgICAgIG1vZGU6ICdjYXRlZ29yaWVzJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB5YXhpczoge1xyXG4gICAgICAgICAgICAgICAgLy8gcG9zaXRpb246ICdyaWdodCcgb3IgJ2xlZnQnXHJcbiAgICAgICAgICAgICAgICB0aWNrQ29sb3I6ICcjZWVlJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzaGFkb3dTaXplOiAwXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIGNoYXJ0ID0gJCgnLmNoYXJ0LWxpbmUnKTtcclxuICAgICAgICBpZiAoY2hhcnQubGVuZ3RoKVxyXG4gICAgICAgICAgICAkLnBsb3QoY2hhcnQsIGRhdGEsIG9wdGlvbnMpO1xyXG5cclxuICAgIH1cclxuXHJcbn0pKCk7XHJcblxyXG5cclxuLy8gQ0hBUlQgUElFXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcblxyXG4gICAgJChpbml0RmxvdFBpZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdEZsb3RQaWUoKSB7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0gW3tcclxuICAgICAgICAgICAgXCJsYWJlbFwiOiBcImpRdWVyeVwiLFxyXG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiIzRhY2FiNFwiLFxyXG4gICAgICAgICAgICBcImRhdGFcIjogMzBcclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIFwibGFiZWxcIjogXCJDU1NcIixcclxuICAgICAgICAgICAgXCJjb2xvclwiOiBcIiNmZmVhODhcIixcclxuICAgICAgICAgICAgXCJkYXRhXCI6IDQwXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICBcImxhYmVsXCI6IFwiTEVTU1wiLFxyXG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiI2ZmODE1M1wiLFxyXG4gICAgICAgICAgICBcImRhdGFcIjogOTBcclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIFwibGFiZWxcIjogXCJTQVNTXCIsXHJcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCIjODc4YmI2XCIsXHJcbiAgICAgICAgICAgIFwiZGF0YVwiOiA3NVxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgICAgXCJsYWJlbFwiOiBcIkphZGVcIixcclxuICAgICAgICAgICAgXCJjb2xvclwiOiBcIiNiMmQ3NjdcIixcclxuICAgICAgICAgICAgXCJkYXRhXCI6IDEyMFxyXG4gICAgICAgIH1dO1xyXG5cclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgc2VyaWVzOiB7XHJcbiAgICAgICAgICAgICAgICBwaWU6IHtcclxuICAgICAgICAgICAgICAgICAgICBzaG93OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGlubmVyUmFkaXVzOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3c6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhZGl1czogMC44LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uKGxhYmVsLCBzZXJpZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz1cImZsb3QtcGllLWxhYmVsXCI+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9sYWJlbCArICcgOiAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnJvdW5kKHNlcmllcy5wZXJjZW50KSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyU8L2Rpdj4nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLjgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyMyMjInXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgY2hhcnQgPSAkKCcuY2hhcnQtcGllJyk7XHJcbiAgICAgICAgaWYgKGNoYXJ0Lmxlbmd0aClcclxuICAgICAgICAgICAgJC5wbG90KGNoYXJ0LCBkYXRhLCBvcHRpb25zKTtcclxuXHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8vIE1vcnJpc1xyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgICQoaW5pdE1vcnJpcyk7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdE1vcnJpcygpIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBNb3JyaXMgPT09ICd1bmRlZmluZWQnKSByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBjaGFydGRhdGEgPSBbXHJcbiAgICAgICAgICAgIHsgeTogXCIyMDA2XCIsIGE6IDEwMCwgYjogOTAgfSxcclxuICAgICAgICAgICAgeyB5OiBcIjIwMDdcIiwgYTogNzUsIGI6IDY1IH0sXHJcbiAgICAgICAgICAgIHsgeTogXCIyMDA4XCIsIGE6IDUwLCBiOiA0MCB9LFxyXG4gICAgICAgICAgICB7IHk6IFwiMjAwOVwiLCBhOiA3NSwgYjogNjUgfSxcclxuICAgICAgICAgICAgeyB5OiBcIjIwMTBcIiwgYTogNTAsIGI6IDQwIH0sXHJcbiAgICAgICAgICAgIHsgeTogXCIyMDExXCIsIGE6IDc1LCBiOiA2NSB9LFxyXG4gICAgICAgICAgICB7IHk6IFwiMjAxMlwiLCBhOiAxMDAsIGI6IDkwIH1cclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICB2YXIgZG9udXRkYXRhID0gW1xyXG4gICAgICAgICAgICB7IGxhYmVsOiBcIkRvd25sb2FkIFNhbGVzXCIsIHZhbHVlOiAxMiB9LFxyXG4gICAgICAgICAgICB7IGxhYmVsOiBcIkluLVN0b3JlIFNhbGVzXCIsIHZhbHVlOiAzMCB9LFxyXG4gICAgICAgICAgICB7IGxhYmVsOiBcIk1haWwtT3JkZXIgU2FsZXNcIiwgdmFsdWU6IDIwIH1cclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICAvLyBMaW5lIENoYXJ0XHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgbmV3IE1vcnJpcy5MaW5lKHtcclxuICAgICAgICAgICAgZWxlbWVudDogJ21vcnJpcy1saW5lJyxcclxuICAgICAgICAgICAgZGF0YTogY2hhcnRkYXRhLFxyXG4gICAgICAgICAgICB4a2V5OiAneScsXHJcbiAgICAgICAgICAgIHlrZXlzOiBbXCJhXCIsIFwiYlwiXSxcclxuICAgICAgICAgICAgbGFiZWxzOiBbXCJTZXJpZSBBXCIsIFwiU2VyaWUgQlwiXSxcclxuICAgICAgICAgICAgbGluZUNvbG9yczogW1wiIzMxQzBCRVwiLCBcIiM3YTkyYTNcIl0sXHJcbiAgICAgICAgICAgIHJlc2l6ZTogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBEb251dCBDaGFydFxyXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgbmV3IE1vcnJpcy5Eb251dCh7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6ICdtb3JyaXMtZG9udXQnLFxyXG4gICAgICAgICAgICBkYXRhOiBkb251dGRhdGEsXHJcbiAgICAgICAgICAgIGNvbG9yczogWycjZjA1MDUwJywgJyNmYWQ3MzInLCAnI2ZmOTAyYiddLFxyXG4gICAgICAgICAgICByZXNpemU6IHRydWVcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQmFyIENoYXJ0XHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICBuZXcgTW9ycmlzLkJhcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6ICdtb3JyaXMtYmFyJyxcclxuICAgICAgICAgICAgZGF0YTogY2hhcnRkYXRhLFxyXG4gICAgICAgICAgICB4a2V5OiAneScsXHJcbiAgICAgICAgICAgIHlrZXlzOiBbXCJhXCIsIFwiYlwiXSxcclxuICAgICAgICAgICAgbGFiZWxzOiBbXCJTZXJpZXMgQVwiLCBcIlNlcmllcyBCXCJdLFxyXG4gICAgICAgICAgICB4TGFiZWxNYXJnaW46IDIsXHJcbiAgICAgICAgICAgIGJhckNvbG9yczogWycjMjNiN2U1JywgJyNmMDUwNTAnXSxcclxuICAgICAgICAgICAgcmVzaXplOiB0cnVlXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEFyZWEgQ2hhcnRcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIG5ldyBNb3JyaXMuQXJlYSh7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6ICdtb3JyaXMtYXJlYScsXHJcbiAgICAgICAgICAgIGRhdGE6IGNoYXJ0ZGF0YSxcclxuICAgICAgICAgICAgeGtleTogJ3knLFxyXG4gICAgICAgICAgICB5a2V5czogW1wiYVwiLCBcImJcIl0sXHJcbiAgICAgICAgICAgIGxhYmVsczogW1wiU2VyaWUgQVwiLCBcIlNlcmllIEJcIl0sXHJcbiAgICAgICAgICAgIGxpbmVDb2xvcnM6IFsnIzcyNjZiYScsICcjMjNiN2U1J10sXHJcbiAgICAgICAgICAgIHJlc2l6ZTogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLy8gUmlja3NoYXdcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAkKGluaXRNb3JyaXMpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXRNb3JyaXMoKSB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgUmlja3NoYXcgPT09ICd1bmRlZmluZWQnKSByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBzZXJpZXNEYXRhID0gW1xyXG4gICAgICAgICAgICBbXSxcclxuICAgICAgICAgICAgW10sXHJcbiAgICAgICAgICAgIFtdXHJcbiAgICAgICAgXTtcclxuICAgICAgICB2YXIgcmFuZG9tID0gbmV3IFJpY2tzaGF3LkZpeHR1cmVzLlJhbmRvbURhdGEoMTUwKTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNTA7IGkrKykge1xyXG4gICAgICAgICAgICByYW5kb20uYWRkRGF0YShzZXJpZXNEYXRhKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzZXJpZXMxID0gW3tcclxuICAgICAgICAgICAgY29sb3I6IFwiI2MwNTAyMFwiLFxyXG4gICAgICAgICAgICBkYXRhOiBzZXJpZXNEYXRhWzBdLFxyXG4gICAgICAgICAgICBuYW1lOiAnTmV3IFlvcmsnXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICBjb2xvcjogXCIjMzBjMDIwXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IHNlcmllc0RhdGFbMV0sXHJcbiAgICAgICAgICAgIG5hbWU6ICdMb25kb24nXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICBjb2xvcjogXCIjNjA2MGMwXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IHNlcmllc0RhdGFbMl0sXHJcbiAgICAgICAgICAgIG5hbWU6ICdUb2t5bydcclxuICAgICAgICB9XTtcclxuXHJcbiAgICAgICAgdmFyIGdyYXBoMSA9IG5ldyBSaWNrc2hhdy5HcmFwaCh7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcmlja3NoYXcxXCIpLFxyXG4gICAgICAgICAgICBzZXJpZXM6IHNlcmllczEsXHJcbiAgICAgICAgICAgIHJlbmRlcmVyOiAnYXJlYSdcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZ3JhcGgxLnJlbmRlcigpO1xyXG5cclxuXHJcbiAgICAgICAgLy8gR3JhcGggMlxyXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHZhciBncmFwaDIgPSBuZXcgUmlja3NoYXcuR3JhcGgoe1xyXG4gICAgICAgICAgICBlbGVtZW50OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3JpY2tzaGF3MlwiKSxcclxuICAgICAgICAgICAgcmVuZGVyZXI6ICdhcmVhJyxcclxuICAgICAgICAgICAgc3Ryb2tlOiB0cnVlLFxyXG4gICAgICAgICAgICBzZXJpZXM6IFt7XHJcbiAgICAgICAgICAgICAgICBkYXRhOiBbeyB4OiAwLCB5OiA0MCB9LCB7IHg6IDEsIHk6IDQ5IH0sIHsgeDogMiwgeTogMzggfSwgeyB4OiAzLCB5OiAzMCB9LCB7IHg6IDQsIHk6IDMyIH1dLFxyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjZjA1MDUwJ1xyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBkYXRhOiBbeyB4OiAwLCB5OiA0MCB9LCB7IHg6IDEsIHk6IDQ5IH0sIHsgeDogMiwgeTogMzggfSwgeyB4OiAzLCB5OiAzMCB9LCB7IHg6IDQsIHk6IDMyIH1dLFxyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjZmFkNzMyJ1xyXG4gICAgICAgICAgICB9XVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBncmFwaDIucmVuZGVyKCk7XHJcblxyXG4gICAgICAgIC8vIEdyYXBoIDNcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHJcbiAgICAgICAgdmFyIGdyYXBoMyA9IG5ldyBSaWNrc2hhdy5HcmFwaCh7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcmlja3NoYXczXCIpLFxyXG4gICAgICAgICAgICByZW5kZXJlcjogJ2xpbmUnLFxyXG4gICAgICAgICAgICBzZXJpZXM6IFt7XHJcbiAgICAgICAgICAgICAgICBkYXRhOiBbeyB4OiAwLCB5OiA0MCB9LCB7IHg6IDEsIHk6IDQ5IH0sIHsgeDogMiwgeTogMzggfSwgeyB4OiAzLCB5OiAzMCB9LCB7IHg6IDQsIHk6IDMyIH1dLFxyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjNzI2NmJhJ1xyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBkYXRhOiBbeyB4OiAwLCB5OiAyMCB9LCB7IHg6IDEsIHk6IDI0IH0sIHsgeDogMiwgeTogMTkgfSwgeyB4OiAzLCB5OiAxNSB9LCB7IHg6IDQsIHk6IDE2IH1dLFxyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjMjNiN2U1J1xyXG4gICAgICAgICAgICB9XVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGdyYXBoMy5yZW5kZXIoKTtcclxuXHJcblxyXG4gICAgICAgIC8vIEdyYXBoIDRcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHJcbiAgICAgICAgdmFyIGdyYXBoNCA9IG5ldyBSaWNrc2hhdy5HcmFwaCh7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcmlja3NoYXc0XCIpLFxyXG4gICAgICAgICAgICByZW5kZXJlcjogJ2JhcicsXHJcbiAgICAgICAgICAgIHNlcmllczogW3tcclxuICAgICAgICAgICAgICAgIGRhdGE6IFt7IHg6IDAsIHk6IDQwIH0sIHsgeDogMSwgeTogNDkgfSwgeyB4OiAyLCB5OiAzOCB9LCB7IHg6IDMsIHk6IDMwIH0sIHsgeDogNCwgeTogMzIgfV0sXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNmYWQ3MzInXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIGRhdGE6IFt7IHg6IDAsIHk6IDIwIH0sIHsgeDogMSwgeTogMjQgfSwgeyB4OiAyLCB5OiAxOSB9LCB7IHg6IDMsIHk6IDE1IH0sIHsgeDogNCwgeTogMTYgfV0sXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNmZjkwMmInXHJcblxyXG4gICAgICAgICAgICB9XVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGdyYXBoNC5yZW5kZXIoKTtcclxuXHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8vIFNQQVJLTElORVxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgICQoaW5pdFNwYXJrbGluZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdFNwYXJrbGluZSgpIHtcclxuXHJcbiAgICAgICAgJCgnW2RhdGEtc3BhcmtsaW5lXScpLmVhY2goaW5pdFNwYXJrTGluZSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGluaXRTcGFya0xpbmUoKSB7XHJcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gJGVsZW1lbnQuZGF0YSgpLFxyXG4gICAgICAgICAgICAgICAgdmFsdWVzID0gb3B0aW9ucy52YWx1ZXMgJiYgb3B0aW9ucy52YWx1ZXMuc3BsaXQoJywnKTtcclxuXHJcbiAgICAgICAgICAgIG9wdGlvbnMudHlwZSA9IG9wdGlvbnMudHlwZSB8fCAnYmFyJzsgLy8gZGVmYXVsdCBjaGFydCBpcyBiYXJcclxuICAgICAgICAgICAgb3B0aW9ucy5kaXNhYmxlSGlkZGVuQ2hlY2sgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgJGVsZW1lbnQuc3BhcmtsaW5lKHZhbHVlcywgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5yZXNpemUpIHtcclxuICAgICAgICAgICAgICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJGVsZW1lbnQuc3BhcmtsaW5lKHZhbHVlcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLy8gU3RhcnQgQm9vdHN0cmFwIEpTXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0Qm9vdHN0cmFwKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0Qm9vdHN0cmFwKCkge1xyXG5cclxuICAgICAgICAvLyBuZWNlc3NhcnkgY2hlY2sgYXQgbGVhc3QgdGlsIEJTIGRvZXNuJ3QgcmVxdWlyZSBqUXVlcnlcclxuICAgICAgICBpZiAoISQuZm4gfHwgISQuZm4udG9vbHRpcCB8fCAhJC5mbi5wb3BvdmVyKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIFBPUE9WRVJcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICAkKCdbZGF0YS10b2dnbGU9XCJwb3BvdmVyXCJdJykucG9wb3ZlcigpO1xyXG5cclxuICAgICAgICAvLyBUT09MVElQXHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoe1xyXG4gICAgICAgICAgICBjb250YWluZXI6ICdib2R5J1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBEUk9QRE9XTiBJTlBVVFNcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgICQoJy5kcm9wZG93biBpbnB1dCcpLm9uKCdjbGljayBmb2N1cycsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLy8gTW9kdWxlOiBjYXJkLXRvb2xzXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0Q2FyZERpc21pc3MpO1xyXG4gICAgJChpbml0Q2FyZENvbGxhcHNlKTtcclxuICAgICQoaW5pdENhcmRSZWZyZXNoKTtcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIZWxwZXIgZnVuY3Rpb24gdG8gZmluZCB0aGUgY2xvc2VzdFxyXG4gICAgICogYXNjZW5kaW5nIC5jYXJkIGVsZW1lbnRcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0Q2FyZFBhcmVudChpdGVtKSB7XHJcbiAgICAgICAgdmFyIGVsID0gaXRlbS5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgIHdoaWxlIChlbCAmJiAhZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdjYXJkJykpXHJcbiAgICAgICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudFxyXG4gICAgICAgIHJldHVybiBlbFxyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBIZWxwZXIgdG8gdHJpZ2dlciBjdXN0b20gZXZlbnRcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gdHJpZ2dlckV2ZW50KHR5cGUsIGl0ZW0sIGRhdGEpIHtcclxuICAgICAgICB2YXIgZXY7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBDdXN0b21FdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICBldiA9IG5ldyBDdXN0b21FdmVudCh0eXBlLCB7IGRldGFpbDogZGF0YSB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xyXG4gICAgICAgICAgICBldi5pbml0Q3VzdG9tRXZlbnQodHlwZSwgdHJ1ZSwgZmFsc2UsIGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpdGVtLmRpc3BhdGNoRXZlbnQoZXYpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGlzbWlzcyBjYXJkc1xyXG4gICAgICogW2RhdGEtdG9vbD1cImNhcmQtZGlzbWlzc1wiXVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBpbml0Q2FyZERpc21pc3MoKSB7XHJcbiAgICAgICAgdmFyIGNhcmR0b29sU2VsZWN0b3IgPSAnW2RhdGEtdG9vbD1cImNhcmQtZGlzbWlzc1wiXSdcclxuXHJcbiAgICAgICAgdmFyIGNhcmRMaXN0ID0gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGNhcmR0b29sU2VsZWN0b3IpKVxyXG5cclxuICAgICAgICBjYXJkTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgICAgbmV3IENhcmREaXNtaXNzKGl0ZW0pO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIENhcmREaXNtaXNzKGl0ZW0pIHtcclxuICAgICAgICAgICAgdmFyIEVWRU5UX1JFTU9WRSA9ICdjYXJkLnJlbW92ZSc7XHJcbiAgICAgICAgICAgIHZhciBFVkVOVF9SRU1PVkVEID0gJ2NhcmQucmVtb3ZlZCc7XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW0gPSBpdGVtO1xyXG4gICAgICAgICAgICB0aGlzLmNhcmRQYXJlbnQgPSBnZXRDYXJkUGFyZW50KHRoaXMuaXRlbSk7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZpbmcgPSBmYWxzZTsgLy8gcHJldmVudHMgZG91YmxlIGV4ZWN1dGlvblxyXG5cclxuICAgICAgICAgICAgdGhpcy5jbGlja0hhbmRsZXIgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5yZW1vdmluZykgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAvLyBwYXNzIGNhbGxiYWNrcyB2aWEgZXZlbnQuZGV0YWlsIHRvIGNvbmZpcm0vY2FuY2VsIHRoZSByZW1vdmFsXHJcbiAgICAgICAgICAgICAgICB0cmlnZ2VyRXZlbnQoRVZFTlRfUkVNT1ZFLCB0aGlzLmNhcmRQYXJlbnQsIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25maXJtOiB0aGlzLmNvbmZpcm0uYmluZCh0aGlzKSxcclxuICAgICAgICAgICAgICAgICAgICBjYW5jZWw6IHRoaXMuY2FuY2VsLmJpbmQodGhpcylcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuY29uZmlybSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hbmltYXRlKHRoaXMuY2FyZFBhcmVudCwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlckV2ZW50KEVWRU5UX1JFTU9WRUQsIHRoaXMuY2FyZFBhcmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmUodGhpcy5jYXJkUGFyZW50KTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5jYW5jZWwgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFuaW1hdGUgPSBmdW5jdGlvbihpdGVtLCBjYikge1xyXG4gICAgICAgICAgICAgICAgaWYgKCdvbmFuaW1hdGlvbmVuZCcgaW4gd2luZG93KSB7IC8vIGFuaW1hdGlvbiBzdXBwb3J0ZWRcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbmVuZCcsIGNiLmJpbmQodGhpcykpXHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jbGFzc05hbWUgKz0gJyBhbmltYXRlZCBib3VuY2VPdXQnOyAvLyByZXF1aXJlcyBhbmltYXRlLmNzc1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGNiLmNhbGwodGhpcykgLy8gbm8gYW5pbWF0aW9uLCBqdXN0IHJlbW92ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlID0gZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgaXRlbS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGl0ZW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGF0dGFjaCBsaXN0ZW5lclxyXG4gICAgICAgICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5jbGlja0hhbmRsZXIuYmluZCh0aGlzKSwgZmFsc2UpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbGxhcHNlZCBjYXJkc1xyXG4gICAgICogW2RhdGEtdG9vbD1cImNhcmQtY29sbGFwc2VcIl1cclxuICAgICAqIFtkYXRhLXN0YXJ0LWNvbGxhcHNlZF1cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gaW5pdENhcmRDb2xsYXBzZSgpIHtcclxuICAgICAgICB2YXIgY2FyZHRvb2xTZWxlY3RvciA9ICdbZGF0YS10b29sPVwiY2FyZC1jb2xsYXBzZVwiXSc7XHJcbiAgICAgICAgdmFyIGNhcmRMaXN0ID0gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGNhcmR0b29sU2VsZWN0b3IpKVxyXG5cclxuICAgICAgICBjYXJkTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgICAgdmFyIGluaXRpYWxTdGF0ZSA9IGl0ZW0uaGFzQXR0cmlidXRlKCdkYXRhLXN0YXJ0LWNvbGxhcHNlZCcpXHJcbiAgICAgICAgICAgIG5ldyBDYXJkQ29sbGFwc2UoaXRlbSwgaW5pdGlhbFN0YXRlKTtcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBDYXJkQ29sbGFwc2UoaXRlbSwgc3RhcnRDb2xsYXBzZWQpIHtcclxuICAgICAgICAgICAgdmFyIEVWRU5UX1NIT1cgPSAnY2FyZC5jb2xsYXBzZS5zaG93JztcclxuICAgICAgICAgICAgdmFyIEVWRU5UX0hJREUgPSAnY2FyZC5jb2xsYXBzZS5oaWRlJztcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSB0cnVlOyAvLyB0cnVlIC0+IHNob3cgLyBmYWxzZSAtPiBoaWRlXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbSA9IGl0ZW07XHJcbiAgICAgICAgICAgIHRoaXMuY2FyZFBhcmVudCA9IGdldENhcmRQYXJlbnQodGhpcy5pdGVtKTtcclxuICAgICAgICAgICAgdGhpcy53cmFwcGVyID0gdGhpcy5jYXJkUGFyZW50LnF1ZXJ5U2VsZWN0b3IoJy5jYXJkLXdyYXBwZXInKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlQ29sbGFwc2UgPSBmdW5jdGlvbihhY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIHRyaWdnZXJFdmVudChhY3Rpb24gPyBFVkVOVF9TSE9XIDogRVZFTlRfSElERSwgdGhpcy5jYXJkUGFyZW50KVxyXG4gICAgICAgICAgICAgICAgdGhpcy53cmFwcGVyLnN0eWxlLm1heEhlaWdodCA9IChhY3Rpb24gPyB0aGlzLndyYXBwZXIuc2Nyb2xsSGVpZ2h0IDogMCkgKyAncHgnXHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gYWN0aW9uO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVJY29uKGFjdGlvbilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUljb24gPSBmdW5jdGlvbihhY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbS5maXJzdEVsZW1lbnRDaGlsZC5jbGFzc05hbWUgPSBhY3Rpb24gPyAnZmEgZmEtbWludXMnIDogJ2ZhIGZhLXBsdXMnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5jbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50b2dnbGVDb2xsYXBzZSghdGhpcy5zdGF0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5pbml0U3R5bGVzID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBwZXIuc3R5bGUubWF4SGVpZ2h0ID0gdGhpcy53cmFwcGVyLnNjcm9sbEhlaWdodCArICdweCc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBwZXIuc3R5bGUudHJhbnNpdGlvbiA9ICdtYXgtaGVpZ2h0IDAuNXMnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy53cmFwcGVyLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHByZXBhcmUgc3R5bGVzIGZvciBjb2xsYXBzZSBhbmltYXRpb25cclxuICAgICAgICAgICAgdGhpcy5pbml0U3R5bGVzKClcclxuICAgICAgICAgICAgLy8gc2V0IGluaXRpYWwgc3RhdGUgaWYgcHJvdmlkZWRcclxuICAgICAgICAgICAgaWYgKHN0YXJ0Q29sbGFwc2VkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZUNvbGxhcHNlKGZhbHNlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGF0dGFjaCBsaXN0ZW5lclxyXG4gICAgICAgICAgICB0aGlzLml0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmNsaWNrSGFuZGxlci5iaW5kKHRoaXMpLCBmYWxzZSlcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZnJlc2ggY2FyZHNcclxuICAgICAqIFtkYXRhLXRvb2w9XCJjYXJkLXJlZnJlc2hcIl1cclxuICAgICAqIFtkYXRhLXNwaW5uZXI9XCJzdGFuZGFyZFwiXVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBpbml0Q2FyZFJlZnJlc2goKSB7XHJcblxyXG4gICAgICAgIHZhciBjYXJkdG9vbFNlbGVjdG9yID0gJ1tkYXRhLXRvb2w9XCJjYXJkLXJlZnJlc2hcIl0nO1xyXG4gICAgICAgIHZhciBjYXJkTGlzdCA9IFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChjYXJkdG9vbFNlbGVjdG9yKSlcclxuXHJcbiAgICAgICAgY2FyZExpc3QuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgICAgIG5ldyBDYXJkUmVmcmVzaChpdGVtKTtcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBDYXJkUmVmcmVzaChpdGVtKSB7XHJcbiAgICAgICAgICAgIHZhciBFVkVOVF9SRUZSRVNIID0gJ2NhcmQucmVmcmVzaCc7XHJcbiAgICAgICAgICAgIHZhciBXSElSTF9DTEFTUyA9ICd3aGlybCc7XHJcbiAgICAgICAgICAgIHZhciBERUZBVUxUX1NQSU5ORVIgPSAnc3RhbmRhcmQnXHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW0gPSBpdGVtO1xyXG4gICAgICAgICAgICB0aGlzLmNhcmRQYXJlbnQgPSBnZXRDYXJkUGFyZW50KHRoaXMuaXRlbSlcclxuICAgICAgICAgICAgdGhpcy5zcGlubmVyID0gKCh0aGlzLml0ZW0uZGF0YXNldCB8fCB7fSkuc3Bpbm5lciB8fCBERUZBVUxUX1NQSU5ORVIpLnNwbGl0KCcgJyk7IC8vIHN1cHBvcnQgc3BhY2Ugc2VwYXJhdGVkIGNsYXNzZXNcclxuXHJcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaCA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjYXJkID0gdGhpcy5jYXJkUGFyZW50O1xyXG4gICAgICAgICAgICAgICAgLy8gc3RhcnQgc2hvd2luZyB0aGUgc3Bpbm5lclxyXG4gICAgICAgICAgICAgICAgdGhpcy5zaG93U3Bpbm5lcihjYXJkLCB0aGlzLnNwaW5uZXIpXHJcbiAgICAgICAgICAgICAgICAvLyBhdHRhY2ggYXMgcHVibGljIG1ldGhvZFxyXG4gICAgICAgICAgICAgICAgY2FyZC5yZW1vdmVTcGlubmVyID0gdGhpcy5yZW1vdmVTcGlubmVyLmJpbmQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAvLyBUcmlnZ2VyIHRoZSBldmVudCBhbmQgc2VuZCB0aGUgY2FyZFxyXG4gICAgICAgICAgICAgICAgdHJpZ2dlckV2ZW50KEVWRU5UX1JFRlJFU0gsIGNhcmQsIHsgY2FyZDogY2FyZCB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnNob3dTcGlubmVyID0gZnVuY3Rpb24oY2FyZCwgc3Bpbm5lcikge1xyXG4gICAgICAgICAgICAgICAgY2FyZC5jbGFzc0xpc3QuYWRkKFdISVJMX0NMQVNTKTtcclxuICAgICAgICAgICAgICAgIHNwaW5uZXIuZm9yRWFjaChmdW5jdGlvbihzKSB7IGNhcmQuY2xhc3NMaXN0LmFkZChzKSB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlU3Bpbm5lciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkUGFyZW50LmNsYXNzTGlzdC5yZW1vdmUoV0hJUkxfQ0xBU1MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBhdHRhY2ggbGlzdGVuZXJcclxuICAgICAgICAgICAgdGhpcy5pdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5yZWZyZXNoLmJpbmQodGhpcyksIGZhbHNlKVxyXG5cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8vIEdMT0JBTCBDT05TVEFOVFNcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbihmdW5jdGlvbigpIHtcclxuXHJcbiAgICB3aW5kb3cuQVBQX0NPTE9SUyA9IHtcclxuICAgICAgICAncHJpbWFyeSc6ICAgICAgICAgICAgICAgICcjNWQ5Y2VjJyxcclxuICAgICAgICAnc3VjY2Vzcyc6ICAgICAgICAgICAgICAgICcjMjdjMjRjJyxcclxuICAgICAgICAnaW5mbyc6ICAgICAgICAgICAgICAgICAgICcjMjNiN2U1JyxcclxuICAgICAgICAnd2FybmluZyc6ICAgICAgICAgICAgICAgICcjZmY5MDJiJyxcclxuICAgICAgICAnZGFuZ2VyJzogICAgICAgICAgICAgICAgICcjZjA1MDUwJyxcclxuICAgICAgICAnaW52ZXJzZSc6ICAgICAgICAgICAgICAgICcjMTMxZTI2JyxcclxuICAgICAgICAnZ3JlZW4nOiAgICAgICAgICAgICAgICAgICcjMzdiYzliJyxcclxuICAgICAgICAncGluayc6ICAgICAgICAgICAgICAgICAgICcjZjUzMmU1JyxcclxuICAgICAgICAncHVycGxlJzogICAgICAgICAgICAgICAgICcjNzI2NmJhJyxcclxuICAgICAgICAnZGFyayc6ICAgICAgICAgICAgICAgICAgICcjM2EzZjUxJyxcclxuICAgICAgICAneWVsbG93JzogICAgICAgICAgICAgICAgICcjZmFkNzMyJyxcclxuICAgICAgICAnZ3JheS1kYXJrZXInOiAgICAgICAgICAgICcjMjMyNzM1JyxcclxuICAgICAgICAnZ3JheS1kYXJrJzogICAgICAgICAgICAgICcjM2EzZjUxJyxcclxuICAgICAgICAnZ3JheSc6ICAgICAgICAgICAgICAgICAgICcjZGRlNmU5JyxcclxuICAgICAgICAnZ3JheS1saWdodCc6ICAgICAgICAgICAgICcjZTRlYWVjJyxcclxuICAgICAgICAnZ3JheS1saWdodGVyJzogICAgICAgICAgICcjZWRmMWYyJ1xyXG4gICAgfTtcclxuXHJcbiAgICB3aW5kb3cuQVBQX01FRElBUVVFUlkgPSB7XHJcbiAgICAgICAgJ2Rlc2t0b3BMRyc6ICAgICAgICAgICAgIDEyMDAsXHJcbiAgICAgICAgJ2Rlc2t0b3AnOiAgICAgICAgICAgICAgICA5OTIsXHJcbiAgICAgICAgJ3RhYmxldCc6ICAgICAgICAgICAgICAgICA3NjgsXHJcbiAgICAgICAgJ21vYmlsZSc6ICAgICAgICAgICAgICAgICA0ODBcclxuICAgIH07XHJcblxyXG59KSgpOyIsIi8vIEZVTExTQ1JFRU5cclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbihmdW5jdGlvbiAoKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0U2NyZWVuRnVsbCk7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdFNjcmVlbkZ1bGwoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBzY3JlZW5mdWxsID09PSAndW5kZWZpbmVkJykgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgJGRvYyA9ICQoZG9jdW1lbnQpO1xyXG4gICAgICAgIHZhciAkZnNUb2dnbGVyID0gJCgnW2RhdGEtdG9nZ2xlLWZ1bGxzY3JlZW5dJyk7XHJcblxyXG4gICAgICAgIC8vIE5vdCBzdXBwb3J0ZWQgdW5kZXIgSUVcclxuICAgICAgICB2YXIgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudDtcclxuICAgICAgICBpZiAodWEuaW5kZXhPZihcIk1TSUUgXCIpID4gMCB8fCAhIXVhLm1hdGNoKC9UcmlkZW50LipydlxcOjExXFwuLykpIHtcclxuICAgICAgICAgICAgJGZzVG9nZ2xlci5hZGRDbGFzcygnZC1ub25lJyk7IC8vIGhpZGUgZWxlbWVudFxyXG4gICAgICAgICAgICByZXR1cm47IC8vIGFuZCBhYm9ydFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJGZzVG9nZ2xlci5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAvL2UucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzY3JlZW5mdWxsLmlzRW5hYmxlZCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHNjcmVlbmZ1bGwudG9nZ2xlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU3dpdGNoIGljb24gaW5kaWNhdG9yXHJcbiAgICAgICAgICAgICAgICB0b2dnbGVGU0ljb24oJGZzVG9nZ2xlcik7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0Z1bGxzY3JlZW4gbm90IGVuYWJsZWQnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoc2NyZWVuZnVsbC5yYXcgJiYgc2NyZWVuZnVsbC5yYXcuZnVsbHNjcmVlbmNoYW5nZSlcclxuICAgICAgICAgICAgJGRvYy5vbihzY3JlZW5mdWxsLnJhdy5mdWxsc2NyZWVuY2hhbmdlLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVGU0ljb24oJGZzVG9nZ2xlcik7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiB0b2dnbGVGU0ljb24oJGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgaWYgKHNjcmVlbmZ1bGwuaXNGdWxsc2NyZWVuKVxyXG4gICAgICAgICAgICAgICAgJGVsZW1lbnQuY2hpbGRyZW4oJ2VtJykucmVtb3ZlQ2xhc3MoJ2ZhLWV4cGFuZCcpLmFkZENsYXNzKCdmYS1jb21wcmVzcycpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkZWxlbWVudC5jaGlsZHJlbignZW0nKS5yZW1vdmVDbGFzcygnZmEtY29tcHJlc3MnKS5hZGRDbGFzcygnZmEtZXhwYW5kJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLy8gTE9BRCBDVVNUT00gQ1NTXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4oZnVuY3Rpb24gKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgICQoaW5pdExvYWRDU1MpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXRMb2FkQ1NTKCkge1xyXG5cclxuICAgICAgICAkKCdbZGF0YS1sb2FkLWNzc10nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGVsZW1lbnQuaXMoJ2EnKSlcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgIHZhciB1cmkgPSBlbGVtZW50LmRhdGEoJ2xvYWRDc3MnKSxcclxuICAgICAgICAgICAgICAgIGxpbms7XHJcblxyXG4gICAgICAgICAgICBpZiAodXJpKSB7XHJcbiAgICAgICAgICAgICAgICBsaW5rID0gY3JlYXRlTGluayh1cmkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFsaW5rKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJC5lcnJvcignRXJyb3IgY3JlYXRpbmcgc3R5bGVzaGVldCBsaW5rIGVsZW1lbnQuJyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2xvclNldHRpbmdzID0gdXJpLnJlcGxhY2UoXCIvQ29udGVudC9jc3MvXCIsIFwiXCIpLnJlcGxhY2UoXCIuY3NzXCIsIFwiXCIpOyBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImNvbG9yU2V0dGluZ3NcIiwgY29sb3JTZXR0aW5ncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgRG9Qb3N0Tm9SZXNwb25zZShVcmxDYW1iaWFyVGVtYVVzdWFyaW8sIHsgY29sb3JTZXR0aW5nczogY29sb3JTZXR0aW5ncyB9LCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkLmVycm9yKCdObyBzdHlsZXNoZWV0IGxvY2F0aW9uIGRlZmluZWQuJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY3JlYXRlTGluayh1cmkpIHtcclxuICAgICAgICB2YXIgbGlua0lkID0gJ2F1dG9sb2FkZWQtc3R5bGVzaGVldCcsXHJcbiAgICAgICAgICAgIG9sZExpbmsgPSAkKCcjJyArIGxpbmtJZCkuYXR0cignaWQnLCBsaW5rSWQgKyAnLW9sZCcpO1xyXG5cclxuICAgICAgICAkKCdoZWFkJykuYXBwZW5kKCQoJzxsaW5rLz4nKS5hdHRyKHtcclxuICAgICAgICAgICAgJ2lkJzogbGlua0lkLFxyXG4gICAgICAgICAgICAncmVsJzogJ3N0eWxlc2hlZXQnLFxyXG4gICAgICAgICAgICAnaHJlZic6IHVyaVxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgaWYgKG9sZExpbmsubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIG9sZExpbmsucmVtb3ZlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gJCgnIycgKyBsaW5rSWQpO1xyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvLyBUUkFOU0xBVElPTlxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgICQoaW5pdFRyYW5zbGF0aW9uKTtcclxuXHJcblxyXG4gICAgdmFyIHBhdGhQcmVmaXggPSAnL0NvbnRlbnQvaTE4bic7IC8vIGZvbGRlciBvZiBqc29uIGZpbGVzXHJcbiAgICB2YXIgU1RPUkFHRUtFWSA9ICdqcS1hcHBMYW5nJztcclxuICAgIHZhciBzYXZlZExhbmd1YWdlID0gU3RvcmFnZXMubG9jYWxTdG9yYWdlLmdldChTVE9SQUdFS0VZKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0VHJhbnNsYXRpb24oKSB7XHJcbiAgICAgICAgaTE4bmV4dFxyXG4gICAgICAgICAgICAudXNlKGkxOG5leHRYSFJCYWNrZW5kKVxyXG4gICAgICAgICAgICAvLyAudXNlKExhbmd1YWdlRGV0ZWN0b3IpXHJcbiAgICAgICAgICAgIC5pbml0KHtcclxuICAgICAgICAgICAgICAgIGZhbGxiYWNrTG5nOiBzYXZlZExhbmd1YWdlIHx8ICdlbicsXHJcbiAgICAgICAgICAgICAgICBiYWNrZW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZFBhdGg6IHBhdGhQcmVmaXggKyAnL3t7bnN9fS17e2xuZ319Lmpzb24nLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG5zOiBbJ3NpdGUnXSxcclxuICAgICAgICAgICAgICAgIGRlZmF1bHROUzogJ3NpdGUnLFxyXG4gICAgICAgICAgICAgICAgZGVidWc6IGZhbHNlXHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGVyciwgdCkge1xyXG4gICAgICAgICAgICAgICAgLy8gaW5pdGlhbGl6ZSBlbGVtZW50c1xyXG4gICAgICAgICAgICAgICAgYXBwbHlUcmFubGF0aW9ucygpO1xyXG4gICAgICAgICAgICAgICAgLy8gbGlzdGVuIHRvIGxhbmd1YWdlIGNoYW5nZXNcclxuICAgICAgICAgICAgICAgIGF0dGFjaENoYW5nZUxpc3RlbmVyKCk7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGFwcGx5VHJhbmxhdGlvbnMoKSB7XHJcbiAgICAgICAgICAgIHZhciBsaXN0ID0gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1sb2NhbGl6ZV0nKSlcclxuICAgICAgICAgICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBpdGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1sb2NhbGl6ZScpXHJcbiAgICAgICAgICAgICAgICBpZiAoaTE4bmV4dC5leGlzdHMoa2V5KSkgaXRlbS5pbm5lckhUTUwgPSBpMThuZXh0LnQoa2V5KTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGF0dGFjaENoYW5nZUxpc3RlbmVyKCkge1xyXG4gICAgICAgICAgICB2YXIgbGlzdCA9IFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtc2V0LWxhbmddJykpXHJcbiAgICAgICAgICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZS50YXJnZXQudGFnTmFtZSA9PT0gJ0EnKSBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhbmcgPSBpdGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1zZXQtbGFuZycpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaTE4bmV4dC5jaGFuZ2VMYW5ndWFnZShsYW5nLCBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIGNvbnNvbGUubG9nKGVycilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5VHJhbmxhdGlvbnMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdG9yYWdlcy5sb2NhbFN0b3JhZ2Uuc2V0KFNUT1JBR0VLRVksIGxhbmcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZhdGVEcm9wZG93bihpdGVtKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gYWN0aXZhdGVEcm9wZG93bihpdGVtKSB7XHJcbiAgICAgICAgICAgIGlmIChpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZHJvcGRvd24taXRlbScpKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVtLnBhcmVudEVsZW1lbnQucHJldmlvdXNFbGVtZW50U2libGluZy5pbm5lckhUTUwgPSBpdGVtLmlubmVySFRNTDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG5cclxufSkoKTsiLCIvLyBOQVZCQVIgU0VBUkNIXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0TmF2YmFyU2VhcmNoKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0TmF2YmFyU2VhcmNoKCkge1xyXG5cclxuICAgICAgICB2YXIgbmF2U2VhcmNoID0gbmV3IG5hdmJhclNlYXJjaElucHV0KCk7XHJcblxyXG4gICAgICAgIC8vIE9wZW4gc2VhcmNoIGlucHV0XHJcbiAgICAgICAgdmFyICRzZWFyY2hPcGVuID0gJCgnW2RhdGEtc2VhcmNoLW9wZW5dJyk7XHJcblxyXG4gICAgICAgICRzZWFyY2hPcGVuXHJcbiAgICAgICAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7IGUuc3RvcFByb3BhZ2F0aW9uKCk7IH0pXHJcbiAgICAgICAgICAgIC5vbignY2xpY2snLCBuYXZTZWFyY2gudG9nZ2xlKTtcclxuXHJcbiAgICAgICAgLy8gQ2xvc2Ugc2VhcmNoIGlucHV0XHJcbiAgICAgICAgdmFyICRzZWFyY2hEaXNtaXNzID0gJCgnW2RhdGEtc2VhcmNoLWRpc21pc3NdJyk7XHJcbiAgICAgICAgdmFyIGlucHV0U2VsZWN0b3IgPSAnLm5hdmJhci1mb3JtIGlucHV0W3R5cGU9XCJ0ZXh0XCJdJztcclxuXHJcbiAgICAgICAgJChpbnB1dFNlbGVjdG9yKVxyXG4gICAgICAgICAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkgeyBlLnN0b3BQcm9wYWdhdGlvbigpOyB9KVxyXG4gICAgICAgICAgICAub24oJ2tleXVwJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGUua2V5Q29kZSA9PSAyNykgLy8gRVNDXHJcbiAgICAgICAgICAgICAgICAgICAgbmF2U2VhcmNoLmRpc21pc3MoKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIGNsaWNrIGFueXdoZXJlIGNsb3NlcyB0aGUgc2VhcmNoXHJcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgbmF2U2VhcmNoLmRpc21pc3MpO1xyXG4gICAgICAgIC8vIGRpc21pc3NhYmxlIG9wdGlvbnNcclxuICAgICAgICAkc2VhcmNoRGlzbWlzc1xyXG4gICAgICAgICAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkgeyBlLnN0b3BQcm9wYWdhdGlvbigpOyB9KVxyXG4gICAgICAgICAgICAub24oJ2NsaWNrJywgbmF2U2VhcmNoLmRpc21pc3MpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICB2YXIgbmF2YmFyU2VhcmNoSW5wdXQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbmF2YmFyRm9ybVNlbGVjdG9yID0gJ2Zvcm0ubmF2YmFyLWZvcm0nO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG5hdmJhckZvcm0gPSAkKG5hdmJhckZvcm1TZWxlY3Rvcik7XHJcblxyXG4gICAgICAgICAgICAgICAgbmF2YmFyRm9ybS50b2dnbGVDbGFzcygnb3BlbicpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBpc09wZW4gPSBuYXZiYXJGb3JtLmhhc0NsYXNzKCdvcGVuJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgbmF2YmFyRm9ybS5maW5kKCdpbnB1dCcpW2lzT3BlbiA/ICdmb2N1cycgOiAnYmx1ciddKCk7XHJcblxyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgZGlzbWlzczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAkKG5hdmJhckZvcm1TZWxlY3RvcilcclxuICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ29wZW4nKSAvLyBDbG9zZSBjb250cm9sXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ2lucHV0W3R5cGU9XCJ0ZXh0XCJdJykuYmx1cigpIC8vIHJlbW92ZSBmb2N1c1xyXG4gICAgICAgICAgICAgICAgLy8gLnZhbCgnJykgICAgICAgICAgICAgICAgICAgIC8vIEVtcHR5IGlucHV0XHJcbiAgICAgICAgICAgICAgICA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLy8gTk9XIFRJTUVSXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0Tm93VGltZXIpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXROb3dUaW1lcigpIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBtb21lbnQgPT09ICd1bmRlZmluZWQnKSByZXR1cm47XHJcblxyXG4gICAgICAgICQoJ1tkYXRhLW5vd10nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBlbGVtZW50LmRhdGEoJ2Zvcm1hdCcpO1xyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gdXBkYXRlVGltZSgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBkdCA9IG1vbWVudChuZXcgRGF0ZSgpKS5mb3JtYXQoZm9ybWF0KTtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQudGV4dChkdCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHVwZGF0ZVRpbWUoKTtcclxuICAgICAgICAgICAgc2V0SW50ZXJ2YWwodXBkYXRlVGltZSwgMTAwMCk7XHJcblxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvLyBUb2dnbGUgUlRMIG1vZGUgZm9yIGRlbW9cclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0UlRMKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0UlRMKCkge1xyXG4gICAgICAgIHZhciBtYWluY3NzID0gJCgnI21haW5jc3MnKTtcclxuICAgICAgICB2YXIgYnNjc3MgPSAkKCcjYnNjc3MnKTtcclxuICAgICAgICAkKCcjY2hrLXJ0bCcpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgLy8gYXBwIHJ0bCBjaGVja1xyXG4gICAgICAgICAgICBtYWluY3NzLmF0dHIoJ2hyZWYnLCB0aGlzLmNoZWNrZWQgPyAnL0NvbnRlbnQvY3NzL2FwcC1ydGwuY3NzJyA6ICcvQ29udGVudC9jc3MvYXBwLmNzcycpO1xyXG4gICAgICAgICAgICAvLyBib290c3RyYXAgcnRsIGNoZWNrXHJcbiAgICAgICAgICAgIGJzY3NzLmF0dHIoJ2hyZWYnLCB0aGlzLmNoZWNrZWQgPyAnL0NvbnRlbnQvY3NzL2Jvb3RzdHJhcC1ydGwuY3NzJyA6ICcvQ29udGVudC9jc3MvYm9vdHN0cmFwLmNzcycpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvLyBTSURFQkFSXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgICQoaW5pdFNpZGViYXIpO1xyXG5cclxuICAgIHZhciAkaHRtbDtcclxuICAgIHZhciAkYm9keTtcclxuICAgIHZhciAkc2lkZWJhcjtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0U2lkZWJhcigpIHtcclxuXHJcbiAgICAgICAgJGh0bWwgPSAkKCdodG1sJyk7XHJcbiAgICAgICAgJGJvZHkgPSAkKCdib2R5Jyk7XHJcbiAgICAgICAgJHNpZGViYXIgPSAkKCcuc2lkZWJhcicpO1xyXG5cclxuICAgICAgICAvLyBBVVRPQ09MTEFQU0UgSVRFTVNcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB2YXIgc2lkZWJhckNvbGxhcHNlID0gJHNpZGViYXIuZmluZCgnLmNvbGxhcHNlJyk7XHJcbiAgICAgICAgc2lkZWJhckNvbGxhcHNlLm9uKCdzaG93LmJzLmNvbGxhcHNlJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuXHJcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBpZiAoJCh0aGlzKS5wYXJlbnRzKCcuY29sbGFwc2UnKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICBzaWRlYmFyQ29sbGFwc2UuZmlsdGVyKCcuc2hvdycpLmNvbGxhcHNlKCdoaWRlJyk7XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBTSURFQkFSIEFDVElWRSBTVEFURVxyXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIC8vIEZpbmQgY3VycmVudCBhY3RpdmUgaXRlbVxyXG4gICAgICAgIHZhciBjdXJyZW50SXRlbSA9ICQoJy5zaWRlYmFyIC5hY3RpdmUnKS5wYXJlbnRzKCdsaScpO1xyXG5cclxuICAgICAgICAvLyBob3ZlciBtb2RlIGRvbid0IHRyeSB0byBleHBhbmQgYWN0aXZlIGNvbGxhcHNlXHJcbiAgICAgICAgaWYgKCF1c2VBc2lkZUhvdmVyKCkpXHJcbiAgICAgICAgICAgIGN1cnJlbnRJdGVtXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJykgLy8gYWN0aXZhdGUgdGhlIHBhcmVudFxyXG4gICAgICAgICAgICAuY2hpbGRyZW4oJy5jb2xsYXBzZScpIC8vIGZpbmQgdGhlIGNvbGxhcHNlXHJcbiAgICAgICAgICAgIC5jb2xsYXBzZSgnc2hvdycpOyAvLyBhbmQgc2hvdyBpdFxyXG5cclxuICAgICAgICAvLyByZW1vdmUgdGhpcyBpZiB5b3UgdXNlIG9ubHkgY29sbGFwc2libGUgc2lkZWJhciBpdGVtc1xyXG4gICAgICAgICRzaWRlYmFyLmZpbmQoJ2xpID4gYSArIHVsJykub24oJ3Nob3cuYnMuY29sbGFwc2UnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIGlmICh1c2VBc2lkZUhvdmVyKCkpIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gU0lERUJBUiBDT0xMQVBTRUQgSVRFTSBIQU5ETEVSXHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblxyXG4gICAgICAgIHZhciBldmVudE5hbWUgPSBpc1RvdWNoKCkgPyAnY2xpY2snIDogJ21vdXNlZW50ZXInO1xyXG4gICAgICAgIHZhciBzdWJOYXYgPSAkKCk7XHJcbiAgICAgICAgJHNpZGViYXIuZmluZCgnLnNpZGViYXItbmF2ID4gbGknKS5vbihldmVudE5hbWUsIGZ1bmN0aW9uKGUpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc1NpZGViYXJDb2xsYXBzZWQoKSB8fCB1c2VBc2lkZUhvdmVyKCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBzdWJOYXYudHJpZ2dlcignbW91c2VsZWF2ZScpO1xyXG4gICAgICAgICAgICAgICAgc3ViTmF2ID0gdG9nZ2xlTWVudUl0ZW0oJCh0aGlzKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVXNlZCB0byBkZXRlY3QgY2xpY2sgYW5kIHRvdWNoIGV2ZW50cyBvdXRzaWRlIHRoZSBzaWRlYmFyXHJcbiAgICAgICAgICAgICAgICBzaWRlYmFyQWRkQmFja2Ryb3AoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIHNpZGViYXJBbnljbGlja0Nsb3NlID0gJHNpZGViYXIuZGF0YSgnc2lkZWJhckFueWNsaWNrQ2xvc2UnKTtcclxuXHJcbiAgICAgICAgLy8gQWxsb3dzIHRvIGNsb3NlXHJcbiAgICAgICAgaWYgKHR5cGVvZiBzaWRlYmFyQW55Y2xpY2tDbG9zZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHJcbiAgICAgICAgICAgICQoJy53cmFwcGVyJykub24oJ2NsaWNrLnNpZGViYXInLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBkb24ndCBjaGVjayBpZiBzaWRlYmFyIG5vdCB2aXNpYmxlXHJcbiAgICAgICAgICAgICAgICBpZiAoISRib2R5Lmhhc0NsYXNzKCdhc2lkZS10b2dnbGVkJykpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgJHRhcmdldCA9ICQoZS50YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEkdGFyZ2V0LnBhcmVudHMoJy5hc2lkZS1jb250YWluZXInKS5sZW5ndGggJiYgLy8gaWYgbm90IGNoaWxkIG9mIHNpZGViYXJcclxuICAgICAgICAgICAgICAgICAgICAhJHRhcmdldC5pcygnI3VzZXItYmxvY2stdG9nZ2xlJykgJiYgLy8gdXNlciBibG9jayB0b2dnbGUgYW5jaG9yXHJcbiAgICAgICAgICAgICAgICAgICAgISR0YXJnZXQucGFyZW50KCkuaXMoJyN1c2VyLWJsb2NrLXRvZ2dsZScpIC8vIHVzZXIgYmxvY2sgdG9nZ2xlIGljb25cclxuICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgICRib2R5LnJlbW92ZUNsYXNzKCdhc2lkZS10b2dnbGVkJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc2lkZWJhckFkZEJhY2tkcm9wKCkge1xyXG4gICAgICAgIHZhciAkYmFja2Ryb3AgPSAkKCc8ZGl2Lz4nLCB7ICdjbGFzcyc6ICdzaWRlYWJyLWJhY2tkcm9wJyB9KTtcclxuICAgICAgICAkYmFja2Ryb3AuaW5zZXJ0QWZ0ZXIoJy5hc2lkZS1jb250YWluZXInKS5vbihcImNsaWNrIG1vdXNlZW50ZXJcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUZsb2F0aW5nTmF2KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3BlbiB0aGUgY29sbGFwc2Ugc2lkZWJhciBzdWJtZW51IGl0ZW1zIHdoZW4gb24gdG91Y2ggZGV2aWNlc1xyXG4gICAgLy8gLSBkZXNrdG9wIG9ubHkgb3BlbnMgb24gaG92ZXJcclxuICAgIGZ1bmN0aW9uIHRvZ2dsZVRvdWNoSXRlbSgkZWxlbWVudCkge1xyXG4gICAgICAgICRlbGVtZW50XHJcbiAgICAgICAgICAgIC5zaWJsaW5ncygnbGknKVxyXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ29wZW4nKVxyXG4gICAgICAgICRlbGVtZW50XHJcbiAgICAgICAgICAgIC50b2dnbGVDbGFzcygnb3BlbicpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhhbmRsZXMgaG92ZXIgdG8gb3BlbiBpdGVtcyB1bmRlciBjb2xsYXBzZWQgbWVudVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHRvZ2dsZU1lbnVJdGVtKCRsaXN0SXRlbSkge1xyXG5cclxuICAgICAgICByZW1vdmVGbG9hdGluZ05hdigpO1xyXG5cclxuICAgICAgICB2YXIgdWwgPSAkbGlzdEl0ZW0uY2hpbGRyZW4oJ3VsJyk7XHJcblxyXG4gICAgICAgIGlmICghdWwubGVuZ3RoKSByZXR1cm4gJCgpO1xyXG4gICAgICAgIGlmICgkbGlzdEl0ZW0uaGFzQ2xhc3MoJ29wZW4nKSkge1xyXG4gICAgICAgICAgICB0b2dnbGVUb3VjaEl0ZW0oJGxpc3RJdGVtKTtcclxuICAgICAgICAgICAgcmV0dXJuICQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciAkYXNpZGUgPSAkKCcuYXNpZGUtY29udGFpbmVyJyk7XHJcbiAgICAgICAgdmFyICRhc2lkZUlubmVyID0gJCgnLmFzaWRlLWlubmVyJyk7IC8vIGZvciB0b3Agb2Zmc2V0IGNhbGN1bGF0aW9uXHJcbiAgICAgICAgLy8gZmxvYXQgYXNpZGUgdXNlcyBleHRyYSBwYWRkaW5nIG9uIGFzaWRlXHJcbiAgICAgICAgdmFyIG1hciA9IHBhcnNlSW50KCRhc2lkZUlubmVyLmNzcygncGFkZGluZy10b3AnKSwgMCkgKyBwYXJzZUludCgkYXNpZGUuY3NzKCdwYWRkaW5nLXRvcCcpLCAwKTtcclxuXHJcbiAgICAgICAgdmFyIHN1Yk5hdiA9IHVsLmNsb25lKCkuYXBwZW5kVG8oJGFzaWRlKTtcclxuXHJcbiAgICAgICAgdG9nZ2xlVG91Y2hJdGVtKCRsaXN0SXRlbSk7XHJcblxyXG4gICAgICAgIHZhciBpdGVtVG9wID0gKCRsaXN0SXRlbS5wb3NpdGlvbigpLnRvcCArIG1hcikgLSAkc2lkZWJhci5zY3JvbGxUb3AoKTtcclxuICAgICAgICB2YXIgdndIZWlnaHQgPSBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodDtcclxuXHJcbiAgICAgICAgc3ViTmF2XHJcbiAgICAgICAgICAgIC5hZGRDbGFzcygnbmF2LWZsb2F0aW5nJylcclxuICAgICAgICAgICAgLmNzcyh7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogaXNGaXhlZCgpID8gJ2ZpeGVkJyA6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICB0b3A6IGl0ZW1Ub3AsXHJcbiAgICAgICAgICAgICAgICBib3R0b206IChzdWJOYXYub3V0ZXJIZWlnaHQodHJ1ZSkgKyBpdGVtVG9wID4gdndIZWlnaHQpID8gMCA6ICdhdXRvJ1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc3ViTmF2Lm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHRvZ2dsZVRvdWNoSXRlbSgkbGlzdEl0ZW0pO1xyXG4gICAgICAgICAgICBzdWJOYXYucmVtb3ZlKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBzdWJOYXY7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVtb3ZlRmxvYXRpbmdOYXYoKSB7XHJcbiAgICAgICAgJCgnLnNpZGViYXItc3VibmF2Lm5hdi1mbG9hdGluZycpLnJlbW92ZSgpO1xyXG4gICAgICAgICQoJy5zaWRlYWJyLWJhY2tkcm9wJykucmVtb3ZlKCk7XHJcbiAgICAgICAgJCgnLnNpZGViYXIgbGkub3BlbicpLnJlbW92ZUNsYXNzKCdvcGVuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNUb3VjaCgpIHtcclxuICAgICAgICByZXR1cm4gJGh0bWwuaGFzQ2xhc3MoJ3RvdWNoJyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNTaWRlYmFyQ29sbGFwc2VkKCkge1xyXG4gICAgICAgIHJldHVybiAkYm9keS5oYXNDbGFzcygnYXNpZGUtY29sbGFwc2VkJykgfHwgJGJvZHkuaGFzQ2xhc3MoJ2FzaWRlLWNvbGxhcHNlZC10ZXh0Jyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNTaWRlYmFyVG9nZ2xlZCgpIHtcclxuICAgICAgICByZXR1cm4gJGJvZHkuaGFzQ2xhc3MoJ2FzaWRlLXRvZ2dsZWQnKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpc01vYmlsZSgpIHtcclxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aCA8IEFQUF9NRURJQVFVRVJZLnRhYmxldDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpc0ZpeGVkKCkge1xyXG4gICAgICAgIHJldHVybiAkYm9keS5oYXNDbGFzcygnbGF5b3V0LWZpeGVkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdXNlQXNpZGVIb3ZlcigpIHtcclxuICAgICAgICByZXR1cm4gJGJvZHkuaGFzQ2xhc3MoJ2FzaWRlLWhvdmVyJyk7XHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8vIFNMSU1TQ1JPTExcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAkKGluaXRTbGltc1Nyb2xsKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0U2xpbXNTcm9sbCgpIHtcclxuXHJcbiAgICAgICAgaWYgKCEkLmZuIHx8ICEkLmZuLnNsaW1TY3JvbGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgJCgnW2RhdGEtc2Nyb2xsYWJsZV0nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdEhlaWdodCA9IDI1MDtcclxuXHJcbiAgICAgICAgICAgIGVsZW1lbnQuc2xpbVNjcm9sbCh7XHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IChlbGVtZW50LmRhdGEoJ2hlaWdodCcpIHx8IGRlZmF1bHRIZWlnaHQpXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLy8gVGFibGUgQ2hlY2sgQWxsXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0VGFibGVDaGVja0FsbCk7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdFRhYmxlQ2hlY2tBbGwoKSB7XHJcblxyXG4gICAgICAgICQoJ1tkYXRhLWNoZWNrLWFsbF0nKS5vbignY2hhbmdlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICAgICBpbmRleCA9ICR0aGlzLmluZGV4KCkgKyAxLFxyXG4gICAgICAgICAgICAgICAgY2hlY2tib3ggPSAkdGhpcy5maW5kKCdpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0nKSxcclxuICAgICAgICAgICAgICAgIHRhYmxlID0gJHRoaXMucGFyZW50cygndGFibGUnKTtcclxuICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRvIGFmZmVjdCBvbmx5IHRoZSBjb3JyZWN0IGNoZWNrYm94IGNvbHVtblxyXG4gICAgICAgICAgICB0YWJsZS5maW5kKCd0Ym9keSA+IHRyID4gdGQ6bnRoLWNoaWxkKCcgKyBpbmRleCArICcpIGlucHV0W3R5cGU9XCJjaGVja2JveFwiXScpXHJcbiAgICAgICAgICAgICAgICAucHJvcCgnY2hlY2tlZCcsIGNoZWNrYm94WzBdLmNoZWNrZWQpO1xyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8vIFRPR0dMRSBTVEFURVxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgICQoaW5pdFRvZ2dsZVN0YXRlKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0VG9nZ2xlU3RhdGUoKSB7XHJcblxyXG4gICAgICAgIHZhciAkYm9keSA9ICQoJ2JvZHknKTtcclxuICAgICAgICB2YXIgdG9nZ2xlID0gbmV3IFN0YXRlVG9nZ2xlcigpO1xyXG5cclxuICAgICAgICAkKCdbZGF0YS10b2dnbGUtc3RhdGVdJylcclxuICAgICAgICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbWVudCA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NuYW1lID0gZWxlbWVudC5kYXRhKCd0b2dnbGVTdGF0ZScpLFxyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldCA9IGVsZW1lbnQuZGF0YSgndGFyZ2V0JyksXHJcbiAgICAgICAgICAgICAgICAgICAgbm9QZXJzaXN0ID0gKGVsZW1lbnQuYXR0cignZGF0YS1uby1wZXJzaXN0JykgIT09IHVuZGVmaW5lZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU3BlY2lmeSBhIHRhcmdldCBzZWxlY3RvciB0byB0b2dnbGUgY2xhc3NuYW1lXHJcbiAgICAgICAgICAgICAgICAvLyB1c2UgYm9keSBieSBkZWZhdWx0XHJcbiAgICAgICAgICAgICAgICB2YXIgJHRhcmdldCA9IHRhcmdldCA/ICQodGFyZ2V0KSA6ICRib2R5O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjbGFzc25hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJHRhcmdldC5oYXNDbGFzcyhjbGFzc25hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0YXJnZXQucmVtb3ZlQ2xhc3MoY2xhc3NuYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFub1BlcnNpc3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGUucmVtb3ZlU3RhdGUoY2xhc3NuYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGFyZ2V0LmFkZENsYXNzKGNsYXNzbmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbm9QZXJzaXN0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlLmFkZFN0YXRlKGNsYXNzbmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBzb21lIGVsZW1lbnRzIG1heSBuZWVkIHRoaXMgd2hlbiB0b2dnbGVkIGNsYXNzIGNoYW5nZSB0aGUgY29udGVudCBzaXplXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mKEV2ZW50KSA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBtb2Rlcm4gYnJvd3NlcnNcclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ3Jlc2l6ZScpKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7IC8vIG9sZCBicm93c2VycyBhbmQgSUVcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzaXplRXZlbnQgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ1VJRXZlbnRzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplRXZlbnQuaW5pdFVJRXZlbnQoJ3Jlc2l6ZScsIHRydWUsIGZhbHNlLCB3aW5kb3csIDApO1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KHJlc2l6ZUV2ZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vIEhhbmRsZSBzdGF0ZXMgdG8vZnJvbSBsb2NhbHN0b3JhZ2VcclxuICAgIHZhciBTdGF0ZVRvZ2dsZXIgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIFNUT1JBR0VfS0VZX05BTUUgPSAnanEtdG9nZ2xlU3RhdGUnO1xyXG5cclxuICAgICAgICAvKiogQWRkIGEgc3RhdGUgdG8gdGhlIGJyb3dzZXIgc3RvcmFnZSB0byBiZSByZXN0b3JlZCBsYXRlciAqL1xyXG4gICAgICAgIHRoaXMuYWRkU3RhdGUgPSBmdW5jdGlvbihjbGFzc25hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBTdG9yYWdlcy5sb2NhbFN0b3JhZ2UuZ2V0KFNUT1JBR0VfS0VZX05BTUUpO1xyXG4gICAgICAgICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5KSBkYXRhLnB1c2goY2xhc3NuYW1lKTtcclxuICAgICAgICAgICAgZWxzZSBkYXRhID0gW2NsYXNzbmFtZV07XHJcbiAgICAgICAgICAgIFN0b3JhZ2VzLmxvY2FsU3RvcmFnZS5zZXQoU1RPUkFHRV9LRVlfTkFNRSwgZGF0YSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKiogUmVtb3ZlIGEgc3RhdGUgZnJvbSB0aGUgYnJvd3NlciBzdG9yYWdlICovXHJcbiAgICAgICAgdGhpcy5yZW1vdmVTdGF0ZSA9IGZ1bmN0aW9uKGNsYXNzbmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IFN0b3JhZ2VzLmxvY2FsU3RvcmFnZS5nZXQoU1RPUkFHRV9LRVlfTkFNRSk7XHJcbiAgICAgICAgICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBkYXRhLmluZGV4T2YoY2xhc3NuYW1lKTtcclxuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIGRhdGEuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICAgICAgICAgIFN0b3JhZ2VzLmxvY2FsU3RvcmFnZS5zZXQoU1RPUkFHRV9LRVlfTkFNRSwgZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIC8qKiBMb2FkIHRoZSBzdGF0ZSBzdHJpbmcgYW5kIHJlc3RvcmUgdGhlIGNsYXNzbGlzdCAqL1xyXG4gICAgICAgIHRoaXMucmVzdG9yZVN0YXRlID0gZnVuY3Rpb24oJGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBTdG9yYWdlcy5sb2NhbFN0b3JhZ2UuZ2V0KFNUT1JBR0VfS0VZX05BTUUpO1xyXG4gICAgICAgICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5KVxyXG4gICAgICAgICAgICAgICAgJGVsZW0uYWRkQ2xhc3MoZGF0YS5qb2luKCcgJykpO1xyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG5cclxuICAgIHdpbmRvdy5TdGF0ZVRvZ2dsZXIgPSBTdGF0ZVRvZ2dsZXI7XHJcblxyXG59KSgpOyIsIi8qKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBNb2R1bGU6IHRyaWdnZXItcmVzaXplLmpzXHJcbiAqIFRyaWdnZXJzIGEgd2luZG93IHJlc2l6ZSBldmVudCBmcm9tIGFueSBlbGVtZW50XHJcbiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgICQoaW5pdFRyaWdnZXJSZXNpemUpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXRUcmlnZ2VyUmVzaXplKCkge1xyXG4gICAgICAgIHZhciBlbGVtZW50ID0gJCgnW2RhdGEtdHJpZ2dlci1yZXNpemVdJyk7XHJcbiAgICAgICAgdmFyIHZhbHVlID0gZWxlbWVudC5kYXRhKCd0cmlnZ2VyUmVzaXplJylcclxuICAgICAgICBlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gYWxsIElFIGZyaWVuZGx5IGRpc3BhdGNoRXZlbnRcclxuICAgICAgICAgICAgICAgIHZhciBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnVUlFdmVudHMnKTtcclxuICAgICAgICAgICAgICAgIGV2dC5pbml0VUlFdmVudCgncmVzaXplJywgdHJ1ZSwgZmFsc2UsIHdpbmRvdywgMCk7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChldnQpO1xyXG4gICAgICAgICAgICAgICAgLy8gbW9kZXJuIGRpc3BhdGNoRXZlbnQgd2F5XHJcbiAgICAgICAgICAgICAgICAvLyB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ3Jlc2l6ZScpKTtcclxuICAgICAgICAgICAgfSwgdmFsdWUgfHwgMzAwKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLy8gRGVtbyBDYXJkc1xyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgICQoaW5pdENhcmREZW1vKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0Q2FyZERlbW8oKSB7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoaXMgZnVuY3Rpb25zIHNob3cgYSBkZW1vbnN0cmF0aW9uIG9mIGhvdyB0byB1c2VcclxuICAgICAgICAgKiB0aGUgY2FyZCB0b29scyBzeXN0ZW0gdmlhIGN1c3RvbSBldmVudC5cclxuICAgICAgICAgKi9cclxuICAgICAgICB2YXIgY2FyZExpc3QgPSBbXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYXJkLmNhcmQtZGVtbycpKTtcclxuICAgICAgICBjYXJkTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcclxuXHJcbiAgICAgICAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2FyZC5yZWZyZXNoJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgIC8vIGdldCB0aGUgY2FyZCBlbGVtZW50IHRoYXQgaXMgcmVmcmVzaGluZ1xyXG4gICAgICAgICAgICAgICAgdmFyIGNhcmQgPSBldmVudC5kZXRhaWwuY2FyZDtcclxuICAgICAgICAgICAgICAgIC8vIHBlcmZvcm0gYW55IGFjdGlvbiBoZXJlLCB3aGVuIGl0IGlzIGRvbmUsXHJcbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIHNwaW5uZXIgY2FsbGluZyBcInJlbW92ZVNwaW5uZXJcIlxyXG4gICAgICAgICAgICAgICAgLy8gc2V0VGltZW91dCB1c2VkIHRvIHNpbXVsYXRlIGFzeW5jIG9wZXJhdGlvblxyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChjYXJkLnJlbW92ZVNwaW5uZXIsIDMwMDApO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NhcmQuY29sbGFwc2UuaGlkZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0NhcmQgQ29sbGFwc2UgSGlkZScpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NhcmQuY29sbGFwc2Uuc2hvdycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0NhcmQgQ29sbGFwc2UgU2hvdycpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NhcmQucmVtb3ZlJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb25maXJtID0gZXZlbnQuZGV0YWlsLmNvbmZpcm07XHJcbiAgICAgICAgICAgICAgICB2YXIgY2FuY2VsID0gZXZlbnQuZGV0YWlsLmNhbmNlbDtcclxuICAgICAgICAgICAgICAgIC8vIHBlcmZvcm0gYW55IGFjdGlvbiAgaGVyZVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1JlbW92aW5nIENhcmQnKTtcclxuICAgICAgICAgICAgICAgIC8vIENhbGwgY29uZmlybSgpIHRvIGNvbnRpbnVlIHJlbW92aW5nIGNhcmRcclxuICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSBjYWxsIGNhbmNlbCgpXHJcbiAgICAgICAgICAgICAgICBjb25maXJtKCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2FyZC5yZW1vdmVkJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZW1vdmVkIENhcmQnKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvLyBOZXN0YWJsZSBkZW1vXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0TmVzdGFibGUpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXROZXN0YWJsZSgpIHtcclxuXHJcbiAgICAgICAgaWYgKCEkLmZuLm5lc3RhYmxlKSByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciB1cGRhdGVPdXRwdXQgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIHZhciBsaXN0ID0gZS5sZW5ndGggPyBlIDogJChlLnRhcmdldCksXHJcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBsaXN0LmRhdGEoJ291dHB1dCcpO1xyXG4gICAgICAgICAgICBpZiAod2luZG93LkpTT04pIHtcclxuICAgICAgICAgICAgICAgIG91dHB1dC52YWwod2luZG93LkpTT04uc3RyaW5naWZ5KGxpc3QubmVzdGFibGUoJ3NlcmlhbGl6ZScpKSk7IC8vLCBudWxsLCAyKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQudmFsKCdKU09OIGJyb3dzZXIgc3VwcG9ydCByZXF1aXJlZCBmb3IgdGhpcyBkZW1vLicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gYWN0aXZhdGUgTmVzdGFibGUgZm9yIGxpc3QgMVxyXG4gICAgICAgICQoJyNuZXN0YWJsZScpLm5lc3RhYmxlKHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiAxXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbignY2hhbmdlJywgdXBkYXRlT3V0cHV0KTtcclxuXHJcbiAgICAgICAgLy8gYWN0aXZhdGUgTmVzdGFibGUgZm9yIGxpc3QgMlxyXG4gICAgICAgICQoJyNuZXN0YWJsZTInKS5uZXN0YWJsZSh7XHJcbiAgICAgICAgICAgICAgICBncm91cDogMVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oJ2NoYW5nZScsIHVwZGF0ZU91dHB1dCk7XHJcblxyXG4gICAgICAgIC8vIG91dHB1dCBpbml0aWFsIHNlcmlhbGlzZWQgZGF0YVxyXG4gICAgICAgIHVwZGF0ZU91dHB1dCgkKCcjbmVzdGFibGUnKS5kYXRhKCdvdXRwdXQnLCAkKCcjbmVzdGFibGUtb3V0cHV0JykpKTtcclxuICAgICAgICB1cGRhdGVPdXRwdXQoJCgnI25lc3RhYmxlMicpLmRhdGEoJ291dHB1dCcsICQoJyNuZXN0YWJsZTItb3V0cHV0JykpKTtcclxuXHJcbiAgICAgICAgJCgnLmpzLW5lc3RhYmxlLWFjdGlvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgdmFyIHRhcmdldCA9ICQoZS50YXJnZXQpLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uID0gdGFyZ2V0LmRhdGEoJ2FjdGlvbicpO1xyXG4gICAgICAgICAgICBpZiAoYWN0aW9uID09PSAnZXhwYW5kLWFsbCcpIHtcclxuICAgICAgICAgICAgICAgICQoJy5kZCcpLm5lc3RhYmxlKCdleHBhbmRBbGwnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoYWN0aW9uID09PSAnY29sbGFwc2UtYWxsJykge1xyXG4gICAgICAgICAgICAgICAgJCgnLmRkJykubmVzdGFibGUoJ2NvbGxhcHNlQWxsJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8qKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBNb2R1bGU6IG5vdGlmeS5qc1xyXG4gKiBDcmVhdGUgdG9nZ2xlYWJsZSBub3RpZmljYXRpb25zIHRoYXQgZmFkZSBvdXQgYXV0b21hdGljYWxseS5cclxuICogQmFzZWQgb24gTm90aWZ5IGFkZG9uIGZyb20gVUlLaXQgKGh0dHA6Ly9nZXR1aWtpdC5jb20vZG9jcy9hZGRvbnNfbm90aWZ5Lmh0bWwpXHJcbiAqIFtkYXRhLXRvZ2dsZT1cIm5vdGlmeVwiXVxyXG4gKiBbZGF0YS1vcHRpb25zPVwib3B0aW9ucyBpbiBqc29uIGZvcm1hdFwiIF1cclxuID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0Tm90aWZ5KTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0Tm90aWZ5KCkge1xyXG5cclxuICAgICAgICB2YXIgU2VsZWN0b3IgPSAnW2RhdGEtbm90aWZ5XScsXHJcbiAgICAgICAgICAgIGF1dG9sb2FkU2VsZWN0b3IgPSAnW2RhdGEtb25sb2FkXScsXHJcbiAgICAgICAgICAgIGRvYyA9ICQoZG9jdW1lbnQpO1xyXG5cclxuICAgICAgICAkKFNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgIG9ubG9hZCA9ICR0aGlzLmRhdGEoJ29ubG9hZCcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG9ubG9hZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vdGlmeU5vdygkdGhpcyk7XHJcbiAgICAgICAgICAgICAgICB9LCA4MDApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAkdGhpcy5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICBub3RpZnlOb3coJHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG5vdGlmeU5vdygkZWxlbWVudCkge1xyXG4gICAgICAgIHZhciBtZXNzYWdlID0gJGVsZW1lbnQuZGF0YSgnbWVzc2FnZScpLFxyXG4gICAgICAgICAgICBvcHRpb25zID0gJGVsZW1lbnQuZGF0YSgnb3B0aW9ucycpO1xyXG5cclxuICAgICAgICBpZiAoIW1lc3NhZ2UpXHJcbiAgICAgICAgICAgICQuZXJyb3IoJ05vdGlmeTogTm8gbWVzc2FnZSBzcGVjaWZpZWQnKTtcclxuXHJcbiAgICAgICAgJC5ub3RpZnkobWVzc2FnZSwgb3B0aW9ucyB8fCB7fSk7XHJcbiAgICB9XHJcblxyXG5cclxufSkoKTtcclxuXHJcblxyXG4vKipcclxuICogTm90aWZ5IEFkZG9uIGRlZmluaXRpb24gYXMgalF1ZXJ5IHBsdWdpblxyXG4gKiBBZGFwdGVkIHZlcnNpb24gdG8gd29yayB3aXRoIEJvb3RzdHJhcCBjbGFzc2VzXHJcbiAqIE1vcmUgaW5mb3JtYXRpb24gaHR0cDovL2dldHVpa2l0LmNvbS9kb2NzL2FkZG9uc19ub3RpZnkuaHRtbFxyXG4gKi9cclxuXHJcbihmdW5jdGlvbigpIHtcclxuXHJcbiAgICB2YXIgY29udGFpbmVycyA9IHt9LFxyXG4gICAgICAgIG1lc3NhZ2VzID0ge30sXHJcblxyXG4gICAgICAgIG5vdGlmeSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICgkLnR5cGUob3B0aW9ucykgPT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB7IG1lc3NhZ2U6IG9wdGlvbnMgfTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1sxXSkge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9ICQuZXh0ZW5kKG9wdGlvbnMsICQudHlwZShhcmd1bWVudHNbMV0pID09ICdzdHJpbmcnID8geyBzdGF0dXM6IGFyZ3VtZW50c1sxXSB9IDogYXJndW1lbnRzWzFdKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIChuZXcgTWVzc2FnZShvcHRpb25zKSkuc2hvdygpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2xvc2VBbGwgPSBmdW5jdGlvbihncm91cCwgaW5zdGFudGx5KSB7XHJcbiAgICAgICAgICAgIGlmIChncm91cCkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaWQgaW4gbWVzc2FnZXMpIHsgaWYgKGdyb3VwID09PSBtZXNzYWdlc1tpZF0uZ3JvdXApIG1lc3NhZ2VzW2lkXS5jbG9zZShpbnN0YW50bHkpOyB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpZCBpbiBtZXNzYWdlcykgeyBtZXNzYWdlc1tpZF0uY2xvc2UoaW5zdGFudGx5KTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB2YXIgTWVzc2FnZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIE1lc3NhZ2UuZGVmYXVsdHMsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICB0aGlzLnV1aWQgPSBcIklEXCIgKyAobmV3IERhdGUoKS5nZXRUaW1lKCkpICsgXCJSQU5EXCIgKyAoTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiAxMDAwMDApKTtcclxuICAgICAgICB0aGlzLmVsZW1lbnQgPSAkKFtcclxuICAgICAgICAgICAgLy8gYWxlcnQtZGlzbWlzc2FibGUgZW5hYmxlcyBicyBjbG9zZSBpY29uXHJcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwidWstbm90aWZ5LW1lc3NhZ2UgYWxlcnQtZGlzbWlzc2FibGVcIj4nLFxyXG4gICAgICAgICAgICAnPGEgY2xhc3M9XCJjbG9zZVwiPiZ0aW1lczs8L2E+JyxcclxuICAgICAgICAgICAgJzxkaXY+JyArIHRoaXMub3B0aW9ucy5tZXNzYWdlICsgJzwvZGl2PicsXHJcbiAgICAgICAgICAgICc8L2Rpdj4nXHJcblxyXG4gICAgICAgIF0uam9pbignJykpLmRhdGEoXCJub3RpZnlNZXNzYWdlXCIsIHRoaXMpO1xyXG5cclxuICAgICAgICAvLyBzdGF0dXNcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnN0YXR1cykge1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYWRkQ2xhc3MoJ2FsZXJ0IGFsZXJ0LScgKyB0aGlzLm9wdGlvbnMuc3RhdHVzKTtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50c3RhdHVzID0gdGhpcy5vcHRpb25zLnN0YXR1cztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZ3JvdXAgPSB0aGlzLm9wdGlvbnMuZ3JvdXA7XHJcblxyXG4gICAgICAgIG1lc3NhZ2VzW3RoaXMudXVpZF0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIWNvbnRhaW5lcnNbdGhpcy5vcHRpb25zLnBvc10pIHtcclxuICAgICAgICAgICAgY29udGFpbmVyc1t0aGlzLm9wdGlvbnMucG9zXSA9ICQoJzxkaXYgY2xhc3M9XCJ1ay1ub3RpZnkgdWstbm90aWZ5LScgKyB0aGlzLm9wdGlvbnMucG9zICsgJ1wiPjwvZGl2PicpLmFwcGVuZFRvKCdib2R5Jykub24oXCJjbGlja1wiLCBcIi51ay1ub3RpZnktbWVzc2FnZVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcykuZGF0YShcIm5vdGlmeU1lc3NhZ2VcIikuY2xvc2UoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgJC5leHRlbmQoTWVzc2FnZS5wcm90b3R5cGUsIHtcclxuXHJcbiAgICAgICAgdXVpZDogZmFsc2UsXHJcbiAgICAgICAgZWxlbWVudDogZmFsc2UsXHJcbiAgICAgICAgdGltb3V0OiBmYWxzZSxcclxuICAgICAgICBjdXJyZW50c3RhdHVzOiBcIlwiLFxyXG4gICAgICAgIGdyb3VwOiBmYWxzZSxcclxuXHJcbiAgICAgICAgc2hvdzogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50LmlzKFwiOnZpc2libGVcIikpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICBjb250YWluZXJzW3RoaXMub3B0aW9ucy5wb3NdLnNob3coKS5wcmVwZW5kKHRoaXMuZWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgbWFyZ2luYm90dG9tID0gcGFyc2VJbnQodGhpcy5lbGVtZW50LmNzcyhcIm1hcmdpbi1ib3R0b21cIiksIDEwKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jc3MoeyBcIm9wYWNpdHlcIjogMCwgXCJtYXJnaW4tdG9wXCI6IC0xICogdGhpcy5lbGVtZW50Lm91dGVySGVpZ2h0KCksIFwibWFyZ2luLWJvdHRvbVwiOiAwIH0pLmFuaW1hdGUoeyBcIm9wYWNpdHlcIjogMSwgXCJtYXJnaW4tdG9wXCI6IDAsIFwibWFyZ2luLWJvdHRvbVwiOiBtYXJnaW5ib3R0b20gfSwgZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCR0aGlzLm9wdGlvbnMudGltZW91dCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2xvc2VmbiA9IGZ1bmN0aW9uKCkgeyAkdGhpcy5jbG9zZSgpOyB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAkdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChjbG9zZWZuLCAkdGhpcy5vcHRpb25zLnRpbWVvdXQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAkdGhpcy5lbGVtZW50LmhvdmVyKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHsgY2xlYXJUaW1lb3V0KCR0aGlzLnRpbWVvdXQpOyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHsgJHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoY2xvc2VmbiwgJHRoaXMub3B0aW9ucy50aW1lb3V0KTsgfVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbihpbnN0YW50bHkpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICBmaW5hbGl6ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0aGlzLmVsZW1lbnQucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghY29udGFpbmVyc1skdGhpcy5vcHRpb25zLnBvc10uY2hpbGRyZW4oKS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyc1skdGhpcy5vcHRpb25zLnBvc10uaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1lc3NhZ2VzWyR0aGlzLnV1aWRdO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXQpIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGluc3RhbnRseSkge1xyXG4gICAgICAgICAgICAgICAgZmluYWxpemUoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hbmltYXRlKHsgXCJvcGFjaXR5XCI6IDAsIFwibWFyZ2luLXRvcFwiOiAtMSAqIHRoaXMuZWxlbWVudC5vdXRlckhlaWdodCgpLCBcIm1hcmdpbi1ib3R0b21cIjogMCB9LCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBmaW5hbGl6ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBjb250ZW50OiBmdW5jdGlvbihodG1sKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gdGhpcy5lbGVtZW50LmZpbmQoXCI+ZGl2XCIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFodG1sKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGFpbmVyLmh0bWwoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29udGFpbmVyLmh0bWwoaHRtbCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzdGF0dXM6IGZ1bmN0aW9uKHN0YXR1cykge1xyXG5cclxuICAgICAgICAgICAgaWYgKCFzdGF0dXMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRzdGF0dXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5yZW1vdmVDbGFzcygnYWxlcnQgYWxlcnQtJyArIHRoaXMuY3VycmVudHN0YXR1cykuYWRkQ2xhc3MoJ2FsZXJ0IGFsZXJ0LScgKyBzdGF0dXMpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50c3RhdHVzID0gc3RhdHVzO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgTWVzc2FnZS5kZWZhdWx0cyA9IHtcclxuICAgICAgICBtZXNzYWdlOiBcIlwiLFxyXG4gICAgICAgIHN0YXR1czogXCJub3JtYWxcIixcclxuICAgICAgICB0aW1lb3V0OiA1MDAwLFxyXG4gICAgICAgIGdyb3VwOiBudWxsLFxyXG4gICAgICAgIHBvczogJ3RvcC1jZW50ZXInXHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAkW1wibm90aWZ5XCJdID0gbm90aWZ5O1xyXG4gICAgJFtcIm5vdGlmeVwiXS5tZXNzYWdlID0gTWVzc2FnZTtcclxuICAgICRbXCJub3RpZnlcIl0uY2xvc2VBbGwgPSBjbG9zZUFsbDtcclxuXHJcbiAgICByZXR1cm4gbm90aWZ5O1xyXG5cclxufSgpKTsiLCIvKio9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICogTW9kdWxlOiBwb3J0bGV0LmpzXHJcbiAqIERyYWcgYW5kIGRyb3AgYW55IGNhcmQgdG8gY2hhbmdlIGl0cyBwb3NpdGlvblxyXG4gKiBUaGUgU2VsZWN0b3Igc2hvdWxkIGNvdWxkIGJlIGFwcGxpZWQgdG8gYW55IG9iamVjdCB0aGF0IGNvbnRhaW5zXHJcbiAqIGNhcmQsIHNvIC5jb2wtKiBlbGVtZW50IGFyZSBpZGVhbC5cclxuID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIFNUT1JBR0VfS0VZX05BTUUgPSAnanEtcG9ydGxldFN0YXRlJztcclxuXHJcbiAgICAkKGluaXRQb3J0bGV0cyk7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdFBvcnRsZXRzKCkge1xyXG5cclxuICAgICAgICAvLyBDb21wb25lbnQgaXMgTk9UIG9wdGlvbmFsXHJcbiAgICAgICAgaWYgKCEkLmZuLnNvcnRhYmxlKSByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBTZWxlY3RvciA9ICdbZGF0YS10b2dnbGU9XCJwb3J0bGV0XCJdJztcclxuXHJcbiAgICAgICAgJChTZWxlY3Rvcikuc29ydGFibGUoe1xyXG4gICAgICAgICAgICBjb25uZWN0V2l0aDogICAgICAgICAgU2VsZWN0b3IsXHJcbiAgICAgICAgICAgIGl0ZW1zOiAgICAgICAgICAgICAgICAnZGl2LmNhcmQnLFxyXG4gICAgICAgICAgICBoYW5kbGU6ICAgICAgICAgICAgICAgJy5wb3J0bGV0LWhhbmRsZXInLFxyXG4gICAgICAgICAgICBvcGFjaXR5OiAgICAgICAgICAgICAgMC43LFxyXG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogICAgICAgICAgJ3BvcnRsZXQgYm94LXBsYWNlaG9sZGVyJyxcclxuICAgICAgICAgICAgY2FuY2VsOiAgICAgICAgICAgICAgICcucG9ydGxldC1jYW5jZWwnLFxyXG4gICAgICAgICAgICBmb3JjZVBsYWNlaG9sZGVyU2l6ZTogdHJ1ZSxcclxuICAgICAgICAgICAgaWZyYW1lRml4OiAgICAgICAgICAgIGZhbHNlLFxyXG4gICAgICAgICAgICB0b2xlcmFuY2U6ICAgICAgICAgICAgJ3BvaW50ZXInLFxyXG4gICAgICAgICAgICBoZWxwZXI6ICAgICAgICAgICAgICAgJ29yaWdpbmFsJyxcclxuICAgICAgICAgICAgcmV2ZXJ0OiAgICAgICAgICAgICAgIDIwMCxcclxuICAgICAgICAgICAgZm9yY2VIZWxwZXJTaXplOiAgICAgIHRydWUsXHJcbiAgICAgICAgICAgIHVwZGF0ZTogICAgICAgICAgICAgICBzYXZlUG9ydGxldE9yZGVyLFxyXG4gICAgICAgICAgICBjcmVhdGU6ICAgICAgICAgICAgICAgbG9hZFBvcnRsZXRPcmRlclxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLy8gb3B0aW9uYWxseSBkaXNhYmxlcyBtb3VzZSBzZWxlY3Rpb25cclxuICAgICAgICAvLy5kaXNhYmxlU2VsZWN0aW9uKClcclxuICAgICAgICA7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNhdmVQb3J0bGV0T3JkZXIoZXZlbnQsIHVpKSB7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0gU3RvcmFnZXMubG9jYWxTdG9yYWdlLmdldChTVE9SQUdFX0tFWV9OQU1FKTtcclxuXHJcbiAgICAgICAgaWYgKCFkYXRhKSB7IGRhdGEgPSB7fTsgfVxyXG5cclxuICAgICAgICBkYXRhW3RoaXMuaWRdID0gJCh0aGlzKS5zb3J0YWJsZSgndG9BcnJheScpO1xyXG5cclxuICAgICAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgICAgICBTdG9yYWdlcy5sb2NhbFN0b3JhZ2Uuc2V0KFNUT1JBR0VfS0VZX05BTUUsIGRhdGEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFBvcnRsZXRPcmRlcigpIHtcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSBTdG9yYWdlcy5sb2NhbFN0b3JhZ2UuZ2V0KFNUT1JBR0VfS0VZX05BTUUpO1xyXG5cclxuICAgICAgICBpZiAoZGF0YSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHBvcmxldElkID0gdGhpcy5pZCxcclxuICAgICAgICAgICAgICAgIGNhcmRzID0gZGF0YVtwb3JsZXRJZF07XHJcblxyXG4gICAgICAgICAgICBpZiAoY2FyZHMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwb3J0bGV0ID0gJCgnIycgKyBwb3JsZXRJZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgJC5lYWNoKGNhcmRzLCBmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjJyArIHZhbHVlKS5hcHBlbmRUbyhwb3J0bGV0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVzZXQgcG9ybGV0IHNhdmUgc3RhdGVcclxuICAgIHdpbmRvdy5yZXNldFBvcmxldHMgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgU3RvcmFnZXMubG9jYWxTdG9yYWdlLnJlbW92ZShTVE9SQUdFX0tFWV9OQU1FKTtcclxuICAgICAgICAvLyByZWxvYWQgdGhlIHBhZ2VcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8vIEhUTUw1IFNvcnRhYmxlIGRlbW9cclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAkKGluaXRTb3J0YWJsZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdFNvcnRhYmxlKCkge1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIHNvcnRhYmxlID09PSAndW5kZWZpbmVkJykgcmV0dXJuO1xyXG5cclxuICAgICAgICBzb3J0YWJsZSgnLnNvcnRhYmxlJywge1xyXG4gICAgICAgICAgICBmb3JjZVBsYWNlaG9sZGVyU2l6ZTogdHJ1ZSxcclxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6ICc8ZGl2IGNsYXNzPVwiYm94LXBsYWNlaG9sZGVyIHAwIG0wXCI+PGRpdj48L2Rpdj48L2Rpdj4nXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvLyBTd2VldCBBbGVydFxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgICQoaW5pdFN3ZWV0QWxlcnQpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXRTd2VldEFsZXJ0KCkge1xyXG5cclxuICAgICAgICAkKCcjc3dhbC1kZW1vMScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBzd2FsKFwiSGVyZSdzIGEgbWVzc2FnZSFcIilcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJCgnI3N3YWwtZGVtbzInKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgc3dhbChcIkhlcmUncyBhIG1lc3NhZ2UhXCIsIFwiSXQncyBwcmV0dHksIGlzbid0IGl0P1wiKVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkKCcjc3dhbC1kZW1vMycpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBzd2FsKFwiR29vZCBqb2IhXCIsIFwiWW91IGNsaWNrZWQgdGhlIGJ1dHRvbiFcIiwgXCJzdWNjZXNzXCIpXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICQoJyNzd2FsLWRlbW80Jykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHN3YWwoe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdBcmUgeW91IHN1cmU/JyxcclxuICAgICAgICAgICAgICAgIHRleHQ6ICdZb3VyIHdpbGwgbm90IGJlIGFibGUgdG8gcmVjb3ZlciB0aGlzIGltYWdpbmFyeSBmaWxlIScsXHJcbiAgICAgICAgICAgICAgICBpY29uOiAnd2FybmluZycsXHJcbiAgICAgICAgICAgICAgICBidXR0b25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpcm06IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ1llcywgZGVsZXRlIGl0IScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IFwiYmctZGFuZ2VyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb3NlTW9kYWw6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBzd2FsKCdCb295YWghJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJCgnI3N3YWwtZGVtbzUnKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgc3dhbCh7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0FyZSB5b3Ugc3VyZT8nLFxyXG4gICAgICAgICAgICAgICAgdGV4dDogJ1lvdXIgd2lsbCBub3QgYmUgYWJsZSB0byByZWNvdmVyIHRoaXMgaW1hZ2luYXJ5IGZpbGUhJyxcclxuICAgICAgICAgICAgICAgIGljb246ICd3YXJuaW5nJyxcclxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBjYW5jZWw6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ05vLCBjYW5jZWwgcGx4IScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb3NlTW9kYWw6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBjb25maXJtOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdZZXMsIGRlbGV0ZSBpdCEnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBcImJnLWRhbmdlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9zZU1vZGFsOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbihpc0NvbmZpcm0pIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc0NvbmZpcm0pIHtcclxuICAgICAgICAgICAgICAgICAgICBzd2FsKCdEZWxldGVkIScsICdZb3VyIGltYWdpbmFyeSBmaWxlIGhhcyBiZWVuIGRlbGV0ZWQuJywgJ3N1Y2Nlc3MnKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3dhbCgnQ2FuY2VsbGVkJywgJ1lvdXIgaW1hZ2luYXJ5IGZpbGUgaXMgc2FmZSA6KScsICdlcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvLyBGdWxsIENhbGVuZGFyXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIC8vIFdoZW4gZG9tIHJlYWR5LCBpbml0IGNhbGVuZGFyIGFuZCBldmVudHNcclxuICAgICQoaW5pdEZ1bGxDYWxlbmRhcik7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdEZ1bGxDYWxlbmRhcigpIHtcclxuXHJcbiAgICAgICAgaWYgKCEkLmZuLmZ1bGxDYWxlbmRhcikgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBUaGUgZWxlbWVudCB0aGF0IHdpbGwgZGlzcGxheSB0aGUgY2FsZW5kYXJcclxuICAgICAgICB2YXIgY2FsZW5kYXIgPSAkKCcjY2FsZW5kYXInKTtcclxuXHJcbiAgICAgICAgdmFyIGRlbW9FdmVudHMgPSBjcmVhdGVEZW1vRXZlbnRzKCk7XHJcblxyXG4gICAgICAgIGluaXRFeHRlcm5hbEV2ZW50cyhjYWxlbmRhcik7XHJcblxyXG4gICAgICAgIGluaXRDYWxlbmRhcihjYWxlbmRhciwgZGVtb0V2ZW50cyk7XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBnbG9iYWwgc2hhcmVkIHZhciB0byBrbm93IHdoYXQgd2UgYXJlIGRyYWdnaW5nXHJcbiAgICB2YXIgZHJhZ2dpbmdFdmVudCA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeHRlcm5hbEV2ZW50IG9iamVjdFxyXG4gICAgICogQHBhcmFtIGpRdWVyeSBPYmplY3QgZWxlbWVudHMgU2V0IG9mIGVsZW1lbnQgYXMgalF1ZXJ5IG9iamVjdHNcclxuICAgICAqL1xyXG4gICAgdmFyIEV4dGVybmFsRXZlbnQgPSBmdW5jdGlvbihlbGVtZW50cykge1xyXG5cclxuICAgICAgICBpZiAoIWVsZW1lbnRzKSByZXR1cm47XHJcblxyXG4gICAgICAgIGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhbiBFdmVudCBPYmplY3QgKGh0dHA6Ly9hcnNoYXcuY29tL2Z1bGxjYWxlbmRhci9kb2NzL2V2ZW50X2RhdGEvRXZlbnRfT2JqZWN0LylcclxuICAgICAgICAgICAgLy8gaXQgZG9lc24ndCBuZWVkIHRvIGhhdmUgYSBzdGFydCBvciBlbmRcclxuICAgICAgICAgICAgdmFyIGNhbGVuZGFyRXZlbnRPYmplY3QgPSB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJC50cmltKCR0aGlzLnRleHQoKSkgLy8gdXNlIHRoZSBlbGVtZW50J3MgdGV4dCBhcyB0aGUgZXZlbnQgdGl0bGVcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIHN0b3JlIHRoZSBFdmVudCBPYmplY3QgaW4gdGhlIERPTSBlbGVtZW50IHNvIHdlIGNhbiBnZXQgdG8gaXQgbGF0ZXJcclxuICAgICAgICAgICAgJHRoaXMuZGF0YSgnY2FsZW5kYXJFdmVudE9iamVjdCcsIGNhbGVuZGFyRXZlbnRPYmplY3QpO1xyXG5cclxuICAgICAgICAgICAgLy8gbWFrZSB0aGUgZXZlbnQgZHJhZ2dhYmxlIHVzaW5nIGpRdWVyeSBVSVxyXG4gICAgICAgICAgICAkdGhpcy5kcmFnZ2FibGUoe1xyXG4gICAgICAgICAgICAgICAgekluZGV4OiAxMDcwLFxyXG4gICAgICAgICAgICAgICAgcmV2ZXJ0OiB0cnVlLCAvLyB3aWxsIGNhdXNlIHRoZSBldmVudCB0byBnbyBiYWNrIHRvIGl0c1xyXG4gICAgICAgICAgICAgICAgcmV2ZXJ0RHVyYXRpb246IDAgLy8gIG9yaWdpbmFsIHBvc2l0aW9uIGFmdGVyIHRoZSBkcmFnXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnZva2UgZnVsbCBjYWxlbmRhciBwbHVnaW4gYW5kIGF0dGFjaCBiZWhhdmlvclxyXG4gICAgICogQHBhcmFtICBqUXVlcnkgW2NhbEVsZW1lbnRdIFRoZSBjYWxlbmRhciBkb20gZWxlbWVudCB3cmFwcGVkIGludG8galF1ZXJ5XHJcbiAgICAgKiBAcGFyYW0gIEV2ZW50T2JqZWN0IFtldmVudHNdIEFuIG9iamVjdCB3aXRoIHRoZSBldmVudCBsaXN0IHRvIGxvYWQgd2hlbiB0aGUgY2FsZW5kYXIgZGlzcGxheXNcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gaW5pdENhbGVuZGFyKGNhbEVsZW1lbnQsIGV2ZW50cykge1xyXG5cclxuICAgICAgICAvLyBjaGVjayB0byByZW1vdmUgZWxlbWVudHMgZnJvbSB0aGUgbGlzdFxyXG4gICAgICAgIHZhciByZW1vdmVBZnRlckRyb3AgPSAkKCcjcmVtb3ZlLWFmdGVyLWRyb3AnKTtcclxuXHJcbiAgICAgICAgY2FsRWxlbWVudC5mdWxsQ2FsZW5kYXIoe1xyXG4gICAgICAgICAgICAvLyBpc1JUTDogdHJ1ZSxcclxuICAgICAgICAgICAgaGVhZGVyOiB7XHJcbiAgICAgICAgICAgICAgICBsZWZ0OiAncHJldixuZXh0IHRvZGF5JyxcclxuICAgICAgICAgICAgICAgIGNlbnRlcjogJ3RpdGxlJyxcclxuICAgICAgICAgICAgICAgIHJpZ2h0OiAnbW9udGgsYWdlbmRhV2VlayxhZ2VuZGFEYXknXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJ1dHRvbkljb25zOiB7IC8vIG5vdGUgdGhlIHNwYWNlIGF0IHRoZSBiZWdpbm5pbmdcclxuICAgICAgICAgICAgICAgIHByZXY6ICcgZmEgZmEtY2FyZXQtbGVmdCcsXHJcbiAgICAgICAgICAgICAgICBuZXh0OiAnIGZhIGZhLWNhcmV0LXJpZ2h0J1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBidXR0b25UZXh0OiB7XHJcbiAgICAgICAgICAgICAgICB0b2RheTogJ3RvZGF5JyxcclxuICAgICAgICAgICAgICAgIG1vbnRoOiAnbW9udGgnLFxyXG4gICAgICAgICAgICAgICAgd2VlazogJ3dlZWsnLFxyXG4gICAgICAgICAgICAgICAgZGF5OiAnZGF5J1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlZGl0YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgZHJvcHBhYmxlOiB0cnVlLCAvLyB0aGlzIGFsbG93cyB0aGluZ3MgdG8gYmUgZHJvcHBlZCBvbnRvIHRoZSBjYWxlbmRhclxyXG4gICAgICAgICAgICBkcm9wOiBmdW5jdGlvbihkYXRlLCBhbGxEYXkpIHsgLy8gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiBzb21ldGhpbmcgaXMgZHJvcHBlZFxyXG5cclxuICAgICAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmV0cmlldmUgdGhlIGRyb3BwZWQgZWxlbWVudCdzIHN0b3JlZCBFdmVudCBPYmplY3RcclxuICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbEV2ZW50T2JqZWN0ID0gJHRoaXMuZGF0YSgnY2FsZW5kYXJFdmVudE9iamVjdCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGlmIHNvbWV0aGluZyB3ZW50IHdyb25nLCBhYm9ydFxyXG4gICAgICAgICAgICAgICAgaWYgKCFvcmlnaW5hbEV2ZW50T2JqZWN0KSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY2xvbmUgdGhlIG9iamVjdCB0byBhdm9pZCBtdWx0aXBsZSBldmVudHMgd2l0aCByZWZlcmVuY2UgdG8gdGhlIHNhbWUgb2JqZWN0XHJcbiAgICAgICAgICAgICAgICB2YXIgY2xvbmVkRXZlbnRPYmplY3QgPSAkLmV4dGVuZCh7fSwgb3JpZ2luYWxFdmVudE9iamVjdCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gYXNzaWduIHRoZSByZXBvcnRlZCBkYXRlXHJcbiAgICAgICAgICAgICAgICBjbG9uZWRFdmVudE9iamVjdC5zdGFydCA9IGRhdGU7XHJcbiAgICAgICAgICAgICAgICBjbG9uZWRFdmVudE9iamVjdC5hbGxEYXkgPSBhbGxEYXk7XHJcbiAgICAgICAgICAgICAgICBjbG9uZWRFdmVudE9iamVjdC5iYWNrZ3JvdW5kQ29sb3IgPSAkdGhpcy5jc3MoJ2JhY2tncm91bmQtY29sb3InKTtcclxuICAgICAgICAgICAgICAgIGNsb25lZEV2ZW50T2JqZWN0LmJvcmRlckNvbG9yID0gJHRoaXMuY3NzKCdib3JkZXItY29sb3InKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyByZW5kZXIgdGhlIGV2ZW50IG9uIHRoZSBjYWxlbmRhclxyXG4gICAgICAgICAgICAgICAgLy8gdGhlIGxhc3QgYHRydWVgIGFyZ3VtZW50IGRldGVybWluZXMgaWYgdGhlIGV2ZW50IFwic3RpY2tzXCJcclxuICAgICAgICAgICAgICAgIC8vIChodHRwOi8vYXJzaGF3LmNvbS9mdWxsY2FsZW5kYXIvZG9jcy9ldmVudF9yZW5kZXJpbmcvcmVuZGVyRXZlbnQvKVxyXG4gICAgICAgICAgICAgICAgY2FsRWxlbWVudC5mdWxsQ2FsZW5kYXIoJ3JlbmRlckV2ZW50JywgY2xvbmVkRXZlbnRPYmplY3QsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGlmIG5lY2Vzc2FyeSByZW1vdmUgdGhlIGVsZW1lbnQgZnJvbSB0aGUgbGlzdFxyXG4gICAgICAgICAgICAgICAgaWYgKHJlbW92ZUFmdGVyRHJvcC5pcygnOmNoZWNrZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0aGlzLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBldmVudERyYWdTdGFydDogZnVuY3Rpb24oZXZlbnQsIGpzLCB1aSkge1xyXG4gICAgICAgICAgICAgICAgZHJhZ2dpbmdFdmVudCA9IGV2ZW50O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBUaGlzIGFycmF5IGlzIHRoZSBldmVudHMgc291cmNlc1xyXG4gICAgICAgICAgICBldmVudHM6IGV2ZW50c1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdHMgdGhlIGV4dGVybmFsIGV2ZW50cyBjYXJkXHJcbiAgICAgKiBAcGFyYW0gIGpRdWVyeSBbY2FsRWxlbWVudF0gVGhlIGNhbGVuZGFyIGRvbSBlbGVtZW50IHdyYXBwZWQgaW50byBqUXVlcnlcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gaW5pdEV4dGVybmFsRXZlbnRzKGNhbEVsZW1lbnQpIHtcclxuICAgICAgICAvLyBDYXJkIHdpdGggdGhlIGV4dGVybmFsIGV2ZW50cyBsaXN0XHJcbiAgICAgICAgdmFyIGV4dGVybmFsRXZlbnRzID0gJCgnLmV4dGVybmFsLWV2ZW50cycpO1xyXG5cclxuICAgICAgICAvLyBpbml0IHRoZSBleHRlcm5hbCBldmVudHMgaW4gdGhlIGNhcmRcclxuICAgICAgICBuZXcgRXh0ZXJuYWxFdmVudChleHRlcm5hbEV2ZW50cy5jaGlsZHJlbignZGl2JykpO1xyXG5cclxuICAgICAgICAvLyBFeHRlcm5hbCBldmVudCBjb2xvciBpcyBkYW5nZXItcmVkIGJ5IGRlZmF1bHRcclxuICAgICAgICB2YXIgY3VyckNvbG9yID0gJyNmNjUwNGQnO1xyXG4gICAgICAgIC8vIENvbG9yIHNlbGVjdG9yIGJ1dHRvblxyXG4gICAgICAgIHZhciBldmVudEFkZEJ0biA9ICQoJy5leHRlcm5hbC1ldmVudC1hZGQtYnRuJyk7XHJcbiAgICAgICAgLy8gTmV3IGV4dGVybmFsIGV2ZW50IG5hbWUgaW5wdXRcclxuICAgICAgICB2YXIgZXZlbnROYW1lSW5wdXQgPSAkKCcuZXh0ZXJuYWwtZXZlbnQtbmFtZScpO1xyXG4gICAgICAgIC8vIENvbG9yIHN3aXRjaGVyc1xyXG4gICAgICAgIHZhciBldmVudENvbG9yU2VsZWN0b3IgPSAkKCcuZXh0ZXJuYWwtZXZlbnQtY29sb3Itc2VsZWN0b3IgLmNpcmNsZScpO1xyXG5cclxuICAgICAgICAvLyBUcmFzaCBldmVudHMgRHJvcGFyZWFcclxuICAgICAgICAkKCcuZXh0ZXJuYWwtZXZlbnRzLXRyYXNoJykuZHJvcHBhYmxlKHtcclxuICAgICAgICAgICAgYWNjZXB0OiAnLmZjLWV2ZW50JyxcclxuICAgICAgICAgICAgYWN0aXZlQ2xhc3M6ICdhY3RpdmUnLFxyXG4gICAgICAgICAgICBob3ZlckNsYXNzOiAnaG92ZXJlZCcsXHJcbiAgICAgICAgICAgIHRvbGVyYW5jZTogJ3RvdWNoJyxcclxuICAgICAgICAgICAgZHJvcDogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gWW91IGNhbiB1c2UgdGhpcyBmdW5jdGlvbiB0byBzZW5kIGFuIGFqYXggcmVxdWVzdFxyXG4gICAgICAgICAgICAgICAgLy8gdG8gcmVtb3ZlIHRoZSBldmVudCBmcm9tIHRoZSByZXBvc2l0b3J5XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGRyYWdnaW5nRXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZWlkID0gZHJhZ2dpbmdFdmVudC5pZCB8fCBkcmFnZ2luZ0V2ZW50Ll9pZDtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIGV2ZW50XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsRWxlbWVudC5mdWxsQ2FsZW5kYXIoJ3JlbW92ZUV2ZW50cycsIGVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBkb20gZWxlbWVudFxyXG4gICAgICAgICAgICAgICAgICAgIHVpLmRyYWdnYWJsZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBjbGVhclxyXG4gICAgICAgICAgICAgICAgICAgIGRyYWdnaW5nRXZlbnQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGV2ZW50Q29sb3JTZWxlY3Rvci5jbGljayhmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNhdmUgY29sb3JcclxuICAgICAgICAgICAgY3VyckNvbG9yID0gJHRoaXMuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJyk7XHJcbiAgICAgICAgICAgIC8vIERlLXNlbGVjdCBhbGwgYW5kIHNlbGVjdCB0aGUgY3VycmVudCBvbmVcclxuICAgICAgICAgICAgZXZlbnRDb2xvclNlbGVjdG9yLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpO1xyXG4gICAgICAgICAgICAkdGhpcy5hZGRDbGFzcygnc2VsZWN0ZWQnKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZXZlbnRBZGRCdG4uY2xpY2soZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgZXZlbnQgbmFtZSBmcm9tIGlucHV0XHJcbiAgICAgICAgICAgIHZhciB2YWwgPSBldmVudE5hbWVJbnB1dC52YWwoKTtcclxuICAgICAgICAgICAgLy8gRG9udCBhbGxvdyBlbXB0eSB2YWx1ZXNcclxuICAgICAgICAgICAgaWYgKCQudHJpbSh2YWwpID09PSAnJykgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIG5ldyBldmVudCBlbGVtZW50XHJcbiAgICAgICAgICAgIHZhciBuZXdFdmVudCA9ICQoJzxkaXYvPicpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiBjdXJyQ29sb3IsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2JvcmRlci1jb2xvcic6IGN1cnJDb2xvcixcclxuICAgICAgICAgICAgICAgICAgICAnY29sb3InOiAnI2ZmZidcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuaHRtbCh2YWwpO1xyXG5cclxuICAgICAgICAgICAgLy8gUHJlcGVuZHMgdG8gdGhlIGV4dGVybmFsIGV2ZW50cyBsaXN0XHJcbiAgICAgICAgICAgIGV4dGVybmFsRXZlbnRzLnByZXBlbmQobmV3RXZlbnQpO1xyXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIHRoZSBuZXcgZXZlbnQgZWxlbWVudFxyXG4gICAgICAgICAgICBuZXcgRXh0ZXJuYWxFdmVudChuZXdFdmVudCk7XHJcbiAgICAgICAgICAgIC8vIENsZWFyIGlucHV0XHJcbiAgICAgICAgICAgIGV2ZW50TmFtZUlucHV0LnZhbCgnJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGFuIGFycmF5IG9mIGV2ZW50cyB0byBkaXNwbGF5IGluIHRoZSBmaXJzdCBsb2FkIG9mIHRoZSBjYWxlbmRhclxyXG4gICAgICogV3JhcCBpbnRvIHRoaXMgZnVuY3Rpb24gYSByZXF1ZXN0IHRvIGEgc291cmNlIHRvIGdldCB2aWEgYWpheCB0aGUgc3RvcmVkIGV2ZW50c1xyXG4gICAgICogQHJldHVybiBBcnJheSBUaGUgYXJyYXkgd2l0aCB0aGUgZXZlbnRzXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGNyZWF0ZURlbW9FdmVudHMoKSB7XHJcbiAgICAgICAgLy8gRGF0ZSBmb3IgdGhlIGNhbGVuZGFyIGV2ZW50cyAoZHVtbXkgZGF0YSlcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgdmFyIGQgPSBkYXRlLmdldERhdGUoKSxcclxuICAgICAgICAgICAgbSA9IGRhdGUuZ2V0TW9udGgoKSxcclxuICAgICAgICAgICAgeSA9IGRhdGUuZ2V0RnVsbFllYXIoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFt7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnQWxsIERheSBFdmVudCcsXHJcbiAgICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZSh5LCBtLCAxKSxcclxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnI2Y1Njk1NCcsIC8vcmVkXHJcbiAgICAgICAgICAgIGJvcmRlckNvbG9yOiAnI2Y1Njk1NCcgLy9yZWRcclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnTG9uZyBFdmVudCcsXHJcbiAgICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZSh5LCBtLCBkIC0gNSksXHJcbiAgICAgICAgICAgIGVuZDogbmV3IERhdGUoeSwgbSwgZCAtIDIpLFxyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjZjM5YzEyJywgLy95ZWxsb3dcclxuICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICcjZjM5YzEyJyAvL3llbGxvd1xyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgICAgdGl0bGU6ICdNZWV0aW5nJyxcclxuICAgICAgICAgICAgc3RhcnQ6IG5ldyBEYXRlKHksIG0sIGQsIDEwLCAzMCksXHJcbiAgICAgICAgICAgIGFsbERheTogZmFsc2UsXHJcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJyMwMDczYjcnLCAvL0JsdWVcclxuICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICcjMDA3M2I3JyAvL0JsdWVcclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnTHVuY2gnLFxyXG4gICAgICAgICAgICBzdGFydDogbmV3IERhdGUoeSwgbSwgZCwgMTIsIDApLFxyXG4gICAgICAgICAgICBlbmQ6IG5ldyBEYXRlKHksIG0sIGQsIDE0LCAwKSxcclxuICAgICAgICAgICAgYWxsRGF5OiBmYWxzZSxcclxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnIzAwYzBlZicsIC8vSW5mbyAoYXF1YSlcclxuICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICcjMDBjMGVmJyAvL0luZm8gKGFxdWEpXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICB0aXRsZTogJ0JpcnRoZGF5IFBhcnR5JyxcclxuICAgICAgICAgICAgc3RhcnQ6IG5ldyBEYXRlKHksIG0sIGQgKyAxLCAxOSwgMCksXHJcbiAgICAgICAgICAgIGVuZDogbmV3IERhdGUoeSwgbSwgZCArIDEsIDIyLCAzMCksXHJcbiAgICAgICAgICAgIGFsbERheTogZmFsc2UsXHJcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJyMwMGE2NWEnLCAvL1N1Y2Nlc3MgKGdyZWVuKVxyXG4gICAgICAgICAgICBib3JkZXJDb2xvcjogJyMwMGE2NWEnIC8vU3VjY2VzcyAoZ3JlZW4pXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICB0aXRsZTogJ09wZW4gR29vZ2xlJyxcclxuICAgICAgICAgICAgc3RhcnQ6IG5ldyBEYXRlKHksIG0sIDI4KSxcclxuICAgICAgICAgICAgZW5kOiBuZXcgRGF0ZSh5LCBtLCAyOSksXHJcbiAgICAgICAgICAgIHVybDogJy8vZ29vZ2xlLmNvbS8nLFxyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjM2M4ZGJjJywgLy9QcmltYXJ5IChsaWdodC1ibHVlKVxyXG4gICAgICAgICAgICBib3JkZXJDb2xvcjogJyMzYzhkYmMnIC8vUHJpbWFyeSAobGlnaHQtYmx1ZSlcclxuICAgICAgICB9XTtcclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLy8gSlFDbG91ZFxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAkKGluaXRXb3JkQ2xvdWQpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXRXb3JkQ2xvdWQoKSB7XHJcblxyXG4gICAgICAgIGlmICghJC5mbi5qUUNsb3VkKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vQ3JlYXRlIGFuIGFycmF5IG9mIHdvcmQgb2JqZWN0cywgZWFjaCByZXByZXNlbnRpbmcgYSB3b3JkIGluIHRoZSBjbG91ZFxyXG4gICAgICAgIHZhciB3b3JkX2FycmF5ID0gW1xyXG4gICAgICAgICAgICB7IHRleHQ6ICdMb3JlbScsIHdlaWdodDogMTMsIC8qbGluazogJ2h0dHA6Ly90aGVtaWNvbi5jbycqLyB9LFxyXG4gICAgICAgICAgICB7IHRleHQ6ICdJcHN1bScsIHdlaWdodDogMTAuNSB9LFxyXG4gICAgICAgICAgICB7IHRleHQ6ICdEb2xvcicsIHdlaWdodDogOS40IH0sXHJcbiAgICAgICAgICAgIHsgdGV4dDogJ1NpdCcsIHdlaWdodDogOCB9LFxyXG4gICAgICAgICAgICB7IHRleHQ6ICdBbWV0Jywgd2VpZ2h0OiA2LjIgfSxcclxuICAgICAgICAgICAgeyB0ZXh0OiAnQ29uc2VjdGV0dXInLCB3ZWlnaHQ6IDUgfSxcclxuICAgICAgICAgICAgeyB0ZXh0OiAnQWRpcGlzY2luZycsIHdlaWdodDogNSB9LFxyXG4gICAgICAgICAgICB7IHRleHQ6ICdTaXQnLCB3ZWlnaHQ6IDggfSxcclxuICAgICAgICAgICAgeyB0ZXh0OiAnQW1ldCcsIHdlaWdodDogNi4yIH0sXHJcbiAgICAgICAgICAgIHsgdGV4dDogJ0NvbnNlY3RldHVyJywgd2VpZ2h0OiA1IH0sXHJcbiAgICAgICAgICAgIHsgdGV4dDogJ0FkaXBpc2NpbmcnLCB3ZWlnaHQ6IDUgfVxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgICQoXCIjanFjbG91ZFwiKS5qUUNsb3VkKHdvcmRfYXJyYXksIHtcclxuICAgICAgICAgICAgd2lkdGg6IDI0MCxcclxuICAgICAgICAgICAgaGVpZ2h0OiAyMDAsXHJcbiAgICAgICAgICAgIHN0ZXBzOiA3XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvLyBTZWFyY2ggUmVzdWx0c1xyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAkKGluaXRTZWFyY2gpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXRTZWFyY2goKSB7XHJcblxyXG4gICAgICAgIGlmICghJC5mbi5zbGlkZXIpIHJldHVybjtcclxuICAgICAgICBpZiAoISQuZm4uY2hvc2VuKSByZXR1cm47XHJcbiAgICAgICAgaWYgKCEkLmZuLmRhdGVwaWNrZXIpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gQk9PVFNUUkFQIFNMSURFUiBDVFJMXHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgJCgnW2RhdGEtdWktc2xpZGVyXScpLnNsaWRlcigpO1xyXG5cclxuICAgICAgICAvLyBDSE9TRU5cclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICAkKCcuY2hvc2VuLXNlbGVjdCcpLmNob3NlbigpO1xyXG5cclxuICAgICAgICAvLyBEQVRFVElNRVBJQ0tFUlxyXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgICQoJyNkYXRldGltZXBpY2tlcicpLmRhdGVwaWNrZXIoe1xyXG4gICAgICAgICAgICBsYW5ndWFnZTogJ2VzJyxcclxuICAgICAgICAgICAgb3JpZW50YXRpb246ICdib3R0b20nLFxyXG4gICAgICAgICAgICBpY29uczoge1xyXG4gICAgICAgICAgICAgICAgdGltZTogJ2ZhIGZhLWNsb2NrLW8nLFxyXG4gICAgICAgICAgICAgICAgZGF0ZTogJ2ZhIGZhLWNhbGVuZGFyJyxcclxuICAgICAgICAgICAgICAgIHVwOiAnZmEgZmEtY2hldnJvbi11cCcsXHJcbiAgICAgICAgICAgICAgICBkb3duOiAnZmEgZmEtY2hldnJvbi1kb3duJyxcclxuICAgICAgICAgICAgICAgIHByZXZpb3VzOiAnZmEgZmEtY2hldnJvbi1sZWZ0JyxcclxuICAgICAgICAgICAgICAgIG5leHQ6ICdmYSBmYS1jaGV2cm9uLXJpZ2h0JyxcclxuICAgICAgICAgICAgICAgIHRvZGF5OiAnZmEgZmEtY3Jvc3NoYWlycycsXHJcbiAgICAgICAgICAgICAgICBjbGVhcjogJ2ZhIGZhLXRyYXNoJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvLyBDb2xvciBwaWNrZXJcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAkKGluaXRDb2xvclBpY2tlcik7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdENvbG9yUGlja2VyKCkge1xyXG5cclxuICAgICAgICBpZiAoISQuZm4uY29sb3JwaWNrZXIpIHJldHVybjtcclxuXHJcbiAgICAgICAgJCgnLmRlbW8tY29sb3JwaWNrZXInKS5jb2xvcnBpY2tlcigpO1xyXG5cclxuICAgICAgICAkKCcjZGVtb19zZWxlY3RvcnMnKS5jb2xvcnBpY2tlcih7XHJcbiAgICAgICAgICAgIGNvbG9yU2VsZWN0b3JzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGVmYXVsdCc6ICcjNzc3Nzc3JyxcclxuICAgICAgICAgICAgICAgICdwcmltYXJ5JzogQVBQX0NPTE9SU1sncHJpbWFyeSddLFxyXG4gICAgICAgICAgICAgICAgJ3N1Y2Nlc3MnOiBBUFBfQ09MT1JTWydzdWNjZXNzJ10sXHJcbiAgICAgICAgICAgICAgICAnaW5mbyc6IEFQUF9DT0xPUlNbJ2luZm8nXSxcclxuICAgICAgICAgICAgICAgICd3YXJuaW5nJzogQVBQX0NPTE9SU1snd2FybmluZyddLFxyXG4gICAgICAgICAgICAgICAgJ2Rhbmdlcic6IEFQUF9DT0xPUlNbJ2RhbmdlciddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8vIEZvcm1zIERlbW9cclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0Rm9ybXNEZW1vKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0Rm9ybXNEZW1vKCkge1xyXG5cclxuICAgICAgICBpZiAoISQuZm4uc2xpZGVyKSByZXR1cm47XHJcbiAgICAgICAgaWYgKCEkLmZuLmNob3NlbikgcmV0dXJuO1xyXG4gICAgICAgIGlmICghJC5mbi5pbnB1dG1hc2spIHJldHVybjtcclxuICAgICAgICBpZiAoISQuZm4uZmlsZXN0eWxlKSByZXR1cm47XHJcbiAgICAgICAgaWYgKCEkLmZuLnd5c2l3eWcpIHJldHVybjtcclxuICAgICAgICBpZiAoISQuZm4uZGF0ZXBpY2tlcikgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBCT09UU1RSQVAgU0xJREVSIENUUkxcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICAkKCdbZGF0YS11aS1zbGlkZXJdJykuc2xpZGVyKCk7XHJcblxyXG4gICAgICAgIC8vIENIT1NFTlxyXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgICQoJy5jaG9zZW4tc2VsZWN0JykuY2hvc2VuKCk7XHJcblxyXG4gICAgICAgIC8vIE1BU0tFRFxyXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgICQoJ1tkYXRhLW1hc2tlZF0nKS5pbnB1dG1hc2soKTtcclxuXHJcbiAgICAgICAgLy8gRklMRVNUWUxFXHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgJCgnLmZpbGVzdHlsZScpLmZpbGVzdHlsZSgpO1xyXG5cclxuICAgICAgICAvLyBXWVNJV1lHXHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgJCgnLnd5c2l3eWcnKS53eXNpd3lnKCk7XHJcblxyXG5cclxuICAgICAgICAvLyBEQVRFVElNRVBJQ0tFUlxyXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIC8vJCgnI2RhdGV0aW1lcGlja2VyMScpLmRhdGVwaWNrZXIoe1xyXG4gICAgICAgIC8vICAgIG9yaWVudGF0aW9uOiAnYm90dG9tJyxcclxuICAgICAgICAvLyAgICBpY29uczoge1xyXG4gICAgICAgIC8vICAgICAgICB0aW1lOiAnZmEgZmEtY2xvY2stbycsXHJcbiAgICAgICAgLy8gICAgICAgIGRhdGU6ICdmYSBmYS1jYWxlbmRhcicsXHJcbiAgICAgICAgLy8gICAgICAgIHVwOiAnZmEgZmEtY2hldnJvbi11cCcsXHJcbiAgICAgICAgLy8gICAgICAgIGRvd246ICdmYSBmYS1jaGV2cm9uLWRvd24nLFxyXG4gICAgICAgIC8vICAgICAgICBwcmV2aW91czogJ2ZhIGZhLWNoZXZyb24tbGVmdCcsXHJcbiAgICAgICAgLy8gICAgICAgIG5leHQ6ICdmYSBmYS1jaGV2cm9uLXJpZ2h0JyxcclxuICAgICAgICAvLyAgICAgICAgdG9kYXk6ICdmYSBmYS1jcm9zc2hhaXJzJyxcclxuICAgICAgICAvLyAgICAgICAgY2xlYXI6ICdmYSBmYS10cmFzaCdcclxuICAgICAgICAvLyAgICB9XHJcbiAgICAgICAgLy99KTtcclxuICAgICAgICAvLy8vIG9ubHkgdGltZVxyXG4gICAgICAgIC8vJCgnI2RhdGV0aW1lcGlja2VyMicpLmRhdGVwaWNrZXIoe1xyXG4gICAgICAgIC8vICAgIGZvcm1hdDogJ21tLWRkLXl5eXknXHJcbiAgICAgICAgLy99KTtcclxuXHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8qKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBNb2R1bGU6IEltYWdlIENyb3BwZXJcclxuID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0SW1hZ2VDcm9wcGVyKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0SW1hZ2VDcm9wcGVyKCkge1xyXG5cclxuICAgICAgICBpZiAoISQuZm4uY3JvcHBlcikgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgJGltYWdlID0gJCgnLmltZy1jb250YWluZXIgPiBpbWcnKSxcclxuICAgICAgICAgICAgJGRhdGFYID0gJCgnI2RhdGFYJyksXHJcbiAgICAgICAgICAgICRkYXRhWSA9ICQoJyNkYXRhWScpLFxyXG4gICAgICAgICAgICAkZGF0YUhlaWdodCA9ICQoJyNkYXRhSGVpZ2h0JyksXHJcbiAgICAgICAgICAgICRkYXRhV2lkdGggPSAkKCcjZGF0YVdpZHRoJyksXHJcbiAgICAgICAgICAgICRkYXRhUm90YXRlID0gJCgnI2RhdGFSb3RhdGUnKSxcclxuICAgICAgICAgICAgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgIC8vIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIC8vICAgeDogNDIwLFxyXG4gICAgICAgICAgICAgICAgLy8gICB5OiA2MCxcclxuICAgICAgICAgICAgICAgIC8vICAgd2lkdGg6IDY0MCxcclxuICAgICAgICAgICAgICAgIC8vICAgaGVpZ2h0OiAzNjBcclxuICAgICAgICAgICAgICAgIC8vIH0sXHJcbiAgICAgICAgICAgICAgICAvLyBzdHJpY3Q6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgLy8gcmVzcG9uc2l2ZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAvLyBjaGVja0ltYWdlT3JpZ2luOiBmYWxzZVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIG1vZGFsOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIC8vIGd1aWRlczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAvLyBoaWdobGlnaHQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgLy8gYmFja2dyb3VuZDogZmFsc2UsXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gYXV0b0Nyb3A6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgLy8gYXV0b0Nyb3BBcmVhOiAwLjUsXHJcbiAgICAgICAgICAgICAgICAvLyBkcmFnQ3JvcDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAvLyBtb3ZhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIC8vIHJvdGF0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAvLyB6b29tYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAvLyB0b3VjaERyYWdab29tOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIC8vIG1vdXNlV2hlZWxab29tOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIC8vIGNyb3BCb3hNb3ZhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIC8vIGNyb3BCb3hSZXNpemFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgLy8gZG91YmxlQ2xpY2tUb2dnbGU6IGZhbHNlLFxyXG5cclxuICAgICAgICAgICAgICAgIC8vIG1pbkNhbnZhc1dpZHRoOiAzMjAsXHJcbiAgICAgICAgICAgICAgICAvLyBtaW5DYW52YXNIZWlnaHQ6IDE4MCxcclxuICAgICAgICAgICAgICAgIC8vIG1pbkNyb3BCb3hXaWR0aDogMTYwLFxyXG4gICAgICAgICAgICAgICAgLy8gbWluQ3JvcEJveEhlaWdodDogOTAsXHJcbiAgICAgICAgICAgICAgICAvLyBtaW5Db250YWluZXJXaWR0aDogMzIwLFxyXG4gICAgICAgICAgICAgICAgLy8gbWluQ29udGFpbmVySGVpZ2h0OiAxODAsXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gYnVpbGQ6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAvLyBidWlsdDogbnVsbCxcclxuICAgICAgICAgICAgICAgIC8vIGRyYWdzdGFydDogbnVsbCxcclxuICAgICAgICAgICAgICAgIC8vIGRyYWdtb3ZlOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgLy8gZHJhZ2VuZDogbnVsbCxcclxuICAgICAgICAgICAgICAgIC8vIHpvb21pbjogbnVsbCxcclxuICAgICAgICAgICAgICAgIC8vIHpvb21vdXQ6IG51bGwsXHJcblxyXG4gICAgICAgICAgICAgICAgYXNwZWN0UmF0aW86IDE2IC8gOSxcclxuICAgICAgICAgICAgICAgIHByZXZpZXc6ICcuaW1nLXByZXZpZXcnLFxyXG4gICAgICAgICAgICAgICAgY3JvcDogZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICRkYXRhWC52YWwoTWF0aC5yb3VuZChkYXRhLngpKTtcclxuICAgICAgICAgICAgICAgICAgICAkZGF0YVkudmFsKE1hdGgucm91bmQoZGF0YS55KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJGRhdGFIZWlnaHQudmFsKE1hdGgucm91bmQoZGF0YS5oZWlnaHQpKTtcclxuICAgICAgICAgICAgICAgICAgICAkZGF0YVdpZHRoLnZhbChNYXRoLnJvdW5kKGRhdGEud2lkdGgpKTtcclxuICAgICAgICAgICAgICAgICAgICAkZGF0YVJvdGF0ZS52YWwoTWF0aC5yb3VuZChkYXRhLnJvdGF0ZSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAkaW1hZ2Uub24oe1xyXG4gICAgICAgICAgICAnYnVpbGQuY3JvcHBlcic6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUudHlwZSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICdidWlsdC5jcm9wcGVyJzogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZS50eXBlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgJ2RyYWdzdGFydC5jcm9wcGVyJzogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZS50eXBlLCBlLmRyYWdUeXBlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgJ2RyYWdtb3ZlLmNyb3BwZXInOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlLnR5cGUsIGUuZHJhZ1R5cGUpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAnZHJhZ2VuZC5jcm9wcGVyJzogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZS50eXBlLCBlLmRyYWdUeXBlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgJ3pvb21pbi5jcm9wcGVyJzogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZS50eXBlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgJ3pvb21vdXQuY3JvcHBlcic6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUudHlwZSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICdjaGFuZ2UuY3JvcHBlcic6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUudHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KS5jcm9wcGVyKG9wdGlvbnMpO1xyXG5cclxuXHJcbiAgICAgICAgLy8gTWV0aG9kc1xyXG4gICAgICAgICQoZG9jdW1lbnQuYm9keSkub24oJ2NsaWNrJywgJ1tkYXRhLW1ldGhvZF0nLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSAkKHRoaXMpLmRhdGEoKSxcclxuICAgICAgICAgICAgICAgICR0YXJnZXQsXHJcbiAgICAgICAgICAgICAgICByZXN1bHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoISRpbWFnZS5kYXRhKCdjcm9wcGVyJykpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGRhdGEubWV0aG9kKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoe30sIGRhdGEpOyAvLyBDbG9uZSBhIG5ldyBvbmVcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEudGFyZ2V0ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgICAgICR0YXJnZXQgPSAkKGRhdGEudGFyZ2V0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhLm9wdGlvbiA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEub3B0aW9uID0gSlNPTi5wYXJzZSgkdGFyZ2V0LnZhbCgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZS5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAkaW1hZ2UuY3JvcHBlcihkYXRhLm1ldGhvZCwgZGF0YS5vcHRpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLm1ldGhvZCA9PT0gJ2dldENyb3BwZWRDYW52YXMnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI2dldENyb3BwZWRDYW52YXNNb2RhbCcpLm1vZGFsKCkuZmluZCgnLm1vZGFsLWJvZHknKS5odG1sKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChyZXN1bHQpICYmICR0YXJnZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGFyZ2V0LnZhbChKU09OLnN0cmluZ2lmeShyZXN1bHQpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUubWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pLm9uKCdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKCEkaW1hZ2UuZGF0YSgnY3JvcHBlcicpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAoZS53aGljaCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAzNzpcclxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJGltYWdlLmNyb3BwZXIoJ21vdmUnLCAtMSwgMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAzODpcclxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJGltYWdlLmNyb3BwZXIoJ21vdmUnLCAwLCAtMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAzOTpcclxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJGltYWdlLmNyb3BwZXIoJ21vdmUnLCAxLCAwKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlIDQwOlxyXG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAkaW1hZ2UuY3JvcHBlcignbW92ZScsIDAsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgLy8gSW1wb3J0IGltYWdlXHJcbiAgICAgICAgdmFyICRpbnB1dEltYWdlID0gJCgnI2lucHV0SW1hZ2UnKSxcclxuICAgICAgICAgICAgVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMLFxyXG4gICAgICAgICAgICBibG9iVVJMO1xyXG5cclxuICAgICAgICBpZiAoVVJMKSB7XHJcbiAgICAgICAgICAgICRpbnB1dEltYWdlLmNoYW5nZShmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaWxlcyA9IHRoaXMuZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoISRpbWFnZS5kYXRhKCdjcm9wcGVyJykpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGZpbGVzICYmIGZpbGVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSBmaWxlc1swXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKC9eaW1hZ2VcXC9cXHcrJC8udGVzdChmaWxlLnR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2JVUkwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkaW1hZ2Uub25lKCdidWlsdC5jcm9wcGVyJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKGJsb2JVUkwpOyAvLyBSZXZva2Ugd2hlbiBsb2FkIGNvbXBsZXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNyb3BwZXIoJ3Jlc2V0JykuY3JvcHBlcigncmVwbGFjZScsIGJsb2JVUkwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5wdXRJbWFnZS52YWwoJycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdQbGVhc2UgY2hvb3NlIGFuIGltYWdlIGZpbGUuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkaW5wdXRJbWFnZS5wYXJlbnQoKS5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvLyBPcHRpb25zXHJcbiAgICAgICAgJCgnLmRvY3Mtb3B0aW9ucyA6Y2hlY2tib3gnKS5vbignY2hhbmdlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoISRpbWFnZS5kYXRhKCdjcm9wcGVyJykpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgb3B0aW9uc1skdGhpcy52YWwoKV0gPSAkdGhpcy5wcm9wKCdjaGVja2VkJyk7XHJcbiAgICAgICAgICAgICRpbWFnZS5jcm9wcGVyKCdkZXN0cm95JykuY3JvcHBlcihvcHRpb25zKTtcclxuICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgIC8vIFRvb2x0aXBzXHJcbiAgICAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoKTtcclxuXHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8vIFNlbGVjdDJcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAkKGluaXRTZWxlY3QyKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0U2VsZWN0MigpIHtcclxuXHJcbiAgICAgICAgaWYgKCEkLmZuLnNlbGVjdDIpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gU2VsZWN0IDJcclxuXHJcbiAgICAgICAgJCgnI3NlbGVjdDItMScpLnNlbGVjdDIoe1xyXG4gICAgICAgICAgICB0aGVtZTogJ2Jvb3RzdHJhcDQnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJCgnI3NlbGVjdDItMicpLnNlbGVjdDIoe1xyXG4gICAgICAgICAgICB0aGVtZTogJ2Jvb3RzdHJhcDQnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJCgnI3NlbGVjdDItMycpLnNlbGVjdDIoe1xyXG4gICAgICAgICAgICB0aGVtZTogJ2Jvb3RzdHJhcDQnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJCgnI3NlbGVjdDItNCcpLnNlbGVjdDIoe1xyXG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogJ1NlbGVjdCBhIHN0YXRlJyxcclxuICAgICAgICAgICAgYWxsb3dDbGVhcjogdHJ1ZSxcclxuICAgICAgICAgICAgdGhlbWU6ICdib290c3RyYXA0J1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIGlmICh0eXBlb2YgRHJvcHpvbmUgPT09ICd1bmRlZmluZWQnKSByZXR1cm47XHJcblxyXG4gICAgLy8gUHJldmVudCBEcm9wem9uZSBmcm9tIGF1dG8gZGlzY292ZXJpbmdcclxuICAgIC8vIFRoaXMgaXMgdXNlZnVsIHdoZW4geW91IHdhbnQgdG8gY3JlYXRlIHRoZVxyXG4gICAgLy8gRHJvcHpvbmUgcHJvZ3JhbW1hdGljYWxseSBsYXRlclxyXG4gICAgRHJvcHpvbmUuYXV0b0Rpc2NvdmVyID0gZmFsc2U7XHJcblxyXG4gICAgJChpbml0RHJvcHpvbmUpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXREcm9wem9uZSgpIHtcclxuXHJcbiAgICAgICAgLy8gRHJvcHpvbmUgc2V0dGluZ3NcclxuICAgICAgICB2YXIgZHJvcHpvbmVPcHRpb25zID0ge1xyXG4gICAgICAgICAgICBhdXRvUHJvY2Vzc1F1ZXVlOiBmYWxzZSxcclxuICAgICAgICAgICAgdXBsb2FkTXVsdGlwbGU6IHRydWUsXHJcbiAgICAgICAgICAgIHBhcmFsbGVsVXBsb2FkczogMTAwLFxyXG4gICAgICAgICAgICBtYXhGaWxlczogMTAwLFxyXG4gICAgICAgICAgICBkaWN0RGVmYXVsdE1lc3NhZ2U6ICc8ZW0gY2xhc3M9XCJmYSBmYS11cGxvYWQgdGV4dC1tdXRlZFwiPjwvZW0+PGJyPkRyb3AgZmlsZXMgaGVyZSB0byB1cGxvYWQnLCAvLyBkZWZhdWx0IG1lc3NhZ2VzIGJlZm9yZSBmaXJzdCBkcm9wXHJcbiAgICAgICAgICAgIHBhcmFtTmFtZTogJ2ZpbGUnLCAvLyBUaGUgbmFtZSB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2ZlciB0aGUgZmlsZVxyXG4gICAgICAgICAgICBtYXhGaWxlc2l6ZTogMiwgLy8gTUJcclxuICAgICAgICAgICAgYWRkUmVtb3ZlTGlua3M6IHRydWUsXHJcbiAgICAgICAgICAgIGFjY2VwdDogZnVuY3Rpb24oZmlsZSwgZG9uZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpbGUubmFtZSA9PT0gJ2p1c3RpbmJpZWJlci5qcGcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9uZSgnTmFoYSwgeW91IGRvbnQuIDopJyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGRvbmUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZHpIYW5kbGVyID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignYnV0dG9uW3R5cGU9c3VibWl0XScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGR6SGFuZGxlci5wcm9jZXNzUXVldWUoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbignYWRkZWRmaWxlJywgZnVuY3Rpb24oZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBZGRlZCBmaWxlOiAnICsgZmlsZS5uYW1lKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbigncmVtb3ZlZGZpbGUnLCBmdW5jdGlvbihmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1JlbW92ZWQgZmlsZTogJyArIGZpbGUubmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMub24oJ3NlbmRpbmdtdWx0aXBsZScsIGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbignc3VjY2Vzc211bHRpcGxlJywgZnVuY3Rpb24oIC8qZmlsZXMsIHJlc3BvbnNlKi8gKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uKCdlcnJvcm11bHRpcGxlJywgZnVuY3Rpb24oIC8qZmlsZXMsIHJlc3BvbnNlKi8gKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIGRyb3B6b25lQXJlYSA9IG5ldyBEcm9wem9uZSgnI2Ryb3B6b25lLWFyZWEnLCBkcm9wem9uZU9wdGlvbnMpO1xyXG5cclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLy8gRm9ybXMgRGVtb1xyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAkKGluaXRXaXphcmQpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXRXaXphcmQoKSB7XHJcblxyXG4gICAgICAgIGlmICghJC5mbi52YWxpZGF0ZSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBGT1JNIEVYQU1QTEVcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIHZhciBmb3JtID0gJChcIiNleGFtcGxlLWZvcm1cIik7XHJcbiAgICAgICAgZm9ybS52YWxpZGF0ZSh7XHJcbiAgICAgICAgICAgIGVycm9yUGxhY2VtZW50OiBmdW5jdGlvbiBlcnJvclBsYWNlbWVudChlcnJvciwgZWxlbWVudCkgeyBlbGVtZW50LmJlZm9yZShlcnJvcik7IH0sXHJcbiAgICAgICAgICAgIHJ1bGVzOiB7XHJcbiAgICAgICAgICAgICAgICBjb25maXJtOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXF1YWxUbzogXCIjcGFzc3dvcmRcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZm9ybS5jaGlsZHJlbihcImRpdlwiKS5zdGVwcyh7XHJcbiAgICAgICAgICAgIGhlYWRlclRhZzogXCJoNFwiLFxyXG4gICAgICAgICAgICBib2R5VGFnOiBcImZpZWxkc2V0XCIsXHJcbiAgICAgICAgICAgIHRyYW5zaXRpb25FZmZlY3Q6IFwic2xpZGVMZWZ0XCIsXHJcbiAgICAgICAgICAgIG9uU3RlcENoYW5naW5nOiBmdW5jdGlvbihldmVudCwgY3VycmVudEluZGV4LCBuZXdJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgZm9ybS52YWxpZGF0ZSgpLnNldHRpbmdzLmlnbm9yZSA9IFwiOmRpc2FibGVkLDpoaWRkZW5cIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmb3JtLnZhbGlkKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uRmluaXNoaW5nOiBmdW5jdGlvbihldmVudCwgY3VycmVudEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICBmb3JtLnZhbGlkYXRlKCkuc2V0dGluZ3MuaWdub3JlID0gXCI6ZGlzYWJsZWRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmb3JtLnZhbGlkKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uRmluaXNoZWQ6IGZ1bmN0aW9uKGV2ZW50LCBjdXJyZW50SW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwiU3VibWl0dGVkIVwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTdWJtaXQgZm9ybVxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5zdWJtaXQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBWRVJUSUNBTFxyXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgICQoXCIjZXhhbXBsZS12ZXJ0aWNhbFwiKS5zdGVwcyh7XHJcbiAgICAgICAgICAgIGhlYWRlclRhZzogXCJoNFwiLFxyXG4gICAgICAgICAgICBib2R5VGFnOiBcInNlY3Rpb25cIixcclxuICAgICAgICAgICAgdHJhbnNpdGlvbkVmZmVjdDogXCJzbGlkZUxlZnRcIixcclxuICAgICAgICAgICAgc3RlcHNPcmllbnRhdGlvbjogXCJ2ZXJ0aWNhbFwiXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvLyBYZWRpdGFibGUgRGVtb1xyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgICQoaW5pdFhFZGl0YWJsZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdFhFZGl0YWJsZSgpIHtcclxuXHJcbiAgICAgICAgaWYgKCEkLmZuLmVkaXRhYmxlKSByZXR1cm5cclxuXHJcbiAgICAgICAgLy8gRm9udCBBd2Vzb21lIHN1cHBvcnRcclxuICAgICAgICAkLmZuLmVkaXRhYmxlZm9ybS5idXR0b25zID1cclxuICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cInN1Ym1pdFwiIGNsYXNzPVwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1zbSBlZGl0YWJsZS1zdWJtaXRcIj4nICtcclxuICAgICAgICAgICAgJzxpIGNsYXNzPVwiZmEgZmEtZncgZmEtY2hlY2tcIj48L2k+JyArXHJcbiAgICAgICAgICAgICc8L2J1dHRvbj4nICtcclxuICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi1zbSBlZGl0YWJsZS1jYW5jZWxcIj4nICtcclxuICAgICAgICAgICAgJzxpIGNsYXNzPVwiZmEgZmEtZncgZmEtdGltZXNcIj48L2k+JyArXHJcbiAgICAgICAgICAgICc8L2J1dHRvbj4nO1xyXG5cclxuICAgICAgICAvL2RlZmF1bHRzXHJcbiAgICAgICAgLy8kLmZuLmVkaXRhYmxlLmRlZmF1bHRzLnVybCA9ICd1cmwvdG8vc2VydmVyJztcclxuXHJcbiAgICAgICAgLy9lbmFibGUgLyBkaXNhYmxlXHJcbiAgICAgICAgJCgnI2VuYWJsZScpLmNsaWNrKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAkKCcjdXNlciAuZWRpdGFibGUnKS5lZGl0YWJsZSgndG9nZ2xlRGlzYWJsZWQnKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy9lZGl0YWJsZXNcclxuICAgICAgICAkKCcjdXNlcm5hbWUnKS5lZGl0YWJsZSh7XHJcbiAgICAgICAgICAgIC8vIHVybDogJ3VybC90by9zZXJ2ZXInLFxyXG4gICAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgIHBrOiAxLFxyXG4gICAgICAgICAgICBuYW1lOiAndXNlcm5hbWUnLFxyXG4gICAgICAgICAgICB0aXRsZTogJ0VudGVyIHVzZXJuYW1lJyxcclxuICAgICAgICAgICAgbW9kZTogJ2lubGluZSdcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJCgnI2ZpcnN0bmFtZScpLmVkaXRhYmxlKHtcclxuICAgICAgICAgICAgdmFsaWRhdGU6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoJC50cmltKHZhbHVlKSA9PT0gJycpIHJldHVybiAnVGhpcyBmaWVsZCBpcyByZXF1aXJlZCc7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1vZGU6ICdpbmxpbmUnXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICQoJyNzZXgnKS5lZGl0YWJsZSh7XHJcbiAgICAgICAgICAgIHByZXBlbmQ6IFwibm90IHNlbGVjdGVkXCIsXHJcbiAgICAgICAgICAgIHNvdXJjZTogW1xyXG4gICAgICAgICAgICAgICAgeyB2YWx1ZTogMSwgdGV4dDogJ01hbGUnIH0sXHJcbiAgICAgICAgICAgICAgICB7IHZhbHVlOiAyLCB0ZXh0OiAnRmVtYWxlJyB9XHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIGRpc3BsYXk6IGZ1bmN0aW9uKHZhbHVlLCBzb3VyY2VEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29sb3JzID0geyBcIlwiOiBcImdyYXlcIiwgMTogXCJncmVlblwiLCAyOiBcImJsdWVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSAkLmdyZXAoc291cmNlRGF0YSwgZnVuY3Rpb24obykgeyByZXR1cm4gby52YWx1ZSA9PSB2YWx1ZTsgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGVsZW0ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS50ZXh0KGVsZW1bMF0udGV4dCkuY3NzKFwiY29sb3JcIiwgY29sb3JzW3ZhbHVlXSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuZW1wdHkoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbW9kZTogJ2lubGluZSdcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJCgnI3N0YXR1cycpLmVkaXRhYmxlKHtcclxuICAgICAgICAgICAgbW9kZTogJ2lubGluZSdcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJCgnI2dyb3VwJykuZWRpdGFibGUoe1xyXG4gICAgICAgICAgICBzaG93YnV0dG9uczogZmFsc2UsXHJcbiAgICAgICAgICAgIG1vZGU6ICdpbmxpbmUnXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICQoJyNkb2InKS5lZGl0YWJsZSh7XHJcbiAgICAgICAgICAgIG1vZGU6ICdpbmxpbmUnXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICQoJyNldmVudCcpLmVkaXRhYmxlKHtcclxuICAgICAgICAgICAgcGxhY2VtZW50OiAncmlnaHQnLFxyXG4gICAgICAgICAgICBjb21ib2RhdGU6IHtcclxuICAgICAgICAgICAgICAgIGZpcnN0SXRlbTogJ25hbWUnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1vZGU6ICdpbmxpbmUnXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICQoJyNjb21tZW50cycpLmVkaXRhYmxlKHtcclxuICAgICAgICAgICAgc2hvd2J1dHRvbnM6ICdib3R0b20nLFxyXG4gICAgICAgICAgICBtb2RlOiAnaW5saW5lJ1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkKCcjbm90ZScpLmVkaXRhYmxlKHtcclxuICAgICAgICAgICAgbW9kZTogJ2lubGluZSdcclxuICAgICAgICB9KTtcclxuICAgICAgICAkKCcjcGVuY2lsJykuY2xpY2soZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICQoJyNub3RlJykuZWRpdGFibGUoJ3RvZ2dsZScpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkKCcjdXNlciAuZWRpdGFibGUnKS5vbignaGlkZGVuJywgZnVuY3Rpb24oZSwgcmVhc29uKSB7XHJcbiAgICAgICAgICAgIGlmIChyZWFzb24gPT09ICdzYXZlJyB8fCByZWFzb24gPT09ICdub2NoYW5nZScpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkbmV4dCA9ICQodGhpcykuY2xvc2VzdCgndHInKS5uZXh0KCkuZmluZCgnLmVkaXRhYmxlJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoJCgnI2F1dG9vcGVuJykuaXMoJzpjaGVja2VkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkbmV4dC5lZGl0YWJsZSgnc2hvdycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIDMwMCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICRuZXh0LmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVEFCTEVcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICAkKCcjdXNlcnMgYScpLmVkaXRhYmxlKHtcclxuICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICBuYW1lOiAndXNlcm5hbWUnLFxyXG4gICAgICAgICAgICB0aXRsZTogJ0VudGVyIHVzZXJuYW1lJyxcclxuICAgICAgICAgICAgbW9kZTogJ2lubGluZSdcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8qKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBNb2R1bGU6IGdtYXAuanNcclxuICogSW5pdCBHb29nbGUgTWFwIHBsdWdpblxyXG4gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ki9cclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAkKGluaXRHb29nbGVNYXBzKTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBNYXAgU3R5bGUgZGVmaW5pdGlvblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gR2V0IG1vcmUgc3R5bGVzIGZyb20gaHR0cDovL3NuYXp6eW1hcHMuY29tL3N0eWxlLzI5L2xpZ2h0LW1vbm9jaHJvbWVcclxuICAgIC8vIC0gSnVzdCByZXBsYWNlIGFuZCBhc3NpZ24gdG8gJ01hcFN0eWxlcycgdGhlIG5ldyBzdHlsZSBhcnJheVxyXG4gICAgdmFyIE1hcFN0eWxlcyA9IFt7IGZlYXR1cmVUeXBlOiAnd2F0ZXInLCBzdHlsZXJzOiBbeyB2aXNpYmlsaXR5OiAnb24nIH0sIHsgY29sb3I6ICcjYmRkMWY5JyB9XSB9LCB7IGZlYXR1cmVUeXBlOiAnYWxsJywgZWxlbWVudFR5cGU6ICdsYWJlbHMudGV4dC5maWxsJywgc3R5bGVyczogW3sgY29sb3I6ICcjMzM0MTY1JyB9XSB9LCB7IGZlYXR1cmVUeXBlOiAnbGFuZHNjYXBlJywgc3R5bGVyczogW3sgY29sb3I6ICcjZTllYmYxJyB9XSB9LCB7IGZlYXR1cmVUeXBlOiAncm9hZC5oaWdod2F5JywgZWxlbWVudFR5cGU6ICdnZW9tZXRyeScsIHN0eWxlcnM6IFt7IGNvbG9yOiAnI2M1YzZjNicgfV0gfSwgeyBmZWF0dXJlVHlwZTogJ3JvYWQuYXJ0ZXJpYWwnLCBlbGVtZW50VHlwZTogJ2dlb21ldHJ5Jywgc3R5bGVyczogW3sgY29sb3I6ICcjZmZmJyB9XSB9LCB7IGZlYXR1cmVUeXBlOiAncm9hZC5sb2NhbCcsIGVsZW1lbnRUeXBlOiAnZ2VvbWV0cnknLCBzdHlsZXJzOiBbeyBjb2xvcjogJyNmZmYnIH1dIH0sIHsgZmVhdHVyZVR5cGU6ICd0cmFuc2l0JywgZWxlbWVudFR5cGU6ICdnZW9tZXRyeScsIHN0eWxlcnM6IFt7IGNvbG9yOiAnI2Q4ZGJlMCcgfV0gfSwgeyBmZWF0dXJlVHlwZTogJ3BvaScsIGVsZW1lbnRUeXBlOiAnZ2VvbWV0cnknLCBzdHlsZXJzOiBbeyBjb2xvcjogJyNjZmQ1ZTAnIH1dIH0sIHsgZmVhdHVyZVR5cGU6ICdhZG1pbmlzdHJhdGl2ZScsIHN0eWxlcnM6IFt7IHZpc2liaWxpdHk6ICdvbicgfSwgeyBsaWdodG5lc3M6IDMzIH1dIH0sIHsgZmVhdHVyZVR5cGU6ICdwb2kucGFyaycsIGVsZW1lbnRUeXBlOiAnbGFiZWxzJywgc3R5bGVyczogW3sgdmlzaWJpbGl0eTogJ29uJyB9LCB7IGxpZ2h0bmVzczogMjAgfV0gfSwgeyBmZWF0dXJlVHlwZTogJ3JvYWQnLCBzdHlsZXJzOiBbeyBjb2xvcjogJyNkOGRiZTAnLCBsaWdodG5lc3M6IDIwIH1dIH1dO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBpbml0R29vZ2xlTWFwcygpIHtcclxuXHJcbiAgICAgICAgaWYgKCEkLmZuLmdNYXApIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIG1hcFNlbGVjdG9yID0gJ1tkYXRhLWdtYXBdJztcclxuICAgICAgICB2YXIgZ01hcFJlZnMgPSBbXTtcclxuXHJcbiAgICAgICAgJChtYXBTZWxlY3RvcikuZWFjaChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICAgICBhZGRyZXNzZXMgPSAkdGhpcy5kYXRhKCdhZGRyZXNzJykgJiYgJHRoaXMuZGF0YSgnYWRkcmVzcycpLnNwbGl0KCc7JyksXHJcbiAgICAgICAgICAgICAgICB0aXRsZXMgPSAkdGhpcy5kYXRhKCd0aXRsZScpICYmICR0aGlzLmRhdGEoJ3RpdGxlJykuc3BsaXQoJzsnKSxcclxuICAgICAgICAgICAgICAgIHpvb20gPSAkdGhpcy5kYXRhKCd6b29tJykgfHwgMTQsXHJcbiAgICAgICAgICAgICAgICBtYXB0eXBlID0gJHRoaXMuZGF0YSgnbWFwdHlwZScpIHx8ICdST0FETUFQJywgLy8gb3IgJ1RFUlJBSU4nXHJcbiAgICAgICAgICAgICAgICBtYXJrZXJzID0gW107XHJcblxyXG4gICAgICAgICAgICBpZiAoYWRkcmVzc2VzKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBhIGluIGFkZHJlc3Nlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYWRkcmVzc2VzW2FdID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlcnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRyZXNzOiBhZGRyZXNzZXNbYV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sOiAodGl0bGVzICYmIHRpdGxlc1thXSkgfHwgJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3B1cDogdHJ1ZSAvKiBBbHdheXMgcG9wdXAgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhbkNvbnRyb2w6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvb21Db250cm9sOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBUeXBlQ29udHJvbDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGVDb250cm9sOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJlZXRWaWV3Q29udHJvbDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcnZpZXdNYXBDb250cm9sOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBzY3JvbGx3aGVlbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFwdHlwZTogbWFwdHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBtYXJrZXJzOiBtYXJrZXJzLFxyXG4gICAgICAgICAgICAgICAgICAgIHpvb206IHpvb21cclxuICAgICAgICAgICAgICAgICAgICAvLyBNb3JlIG9wdGlvbnMgaHR0cHM6Ly9naXRodWIuY29tL21hcmlvZXN0cmFkYS9qUXVlcnktZ01hcFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZ01hcCA9ICR0aGlzLmdNYXAob3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJlZiA9IGdNYXAuZGF0YSgnZ01hcC5yZWZlcmVuY2UnKTtcclxuICAgICAgICAgICAgICAgIC8vIHNhdmUgaW4gdGhlIG1hcCByZWZlcmVuY2VzIGxpc3RcclxuICAgICAgICAgICAgICAgIGdNYXBSZWZzLnB1c2gocmVmKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBzZXQgdGhlIHN0eWxlc1xyXG4gICAgICAgICAgICAgICAgaWYgKCR0aGlzLmRhdGEoJ3N0eWxlZCcpICE9PSB1bmRlZmluZWQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmVmLnNldE9wdGlvbnMoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZXM6IE1hcFN0eWxlc1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9KTsgLy9lYWNoXHJcblxyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvLyBqVmVjdG9yTWFwXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgICQoaW5pdFZlY3Rvck1hcCk7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdFZlY3Rvck1hcCgpIHtcclxuXHJcbiAgICAgICAgdmFyIGVsZW1lbnQgPSAkKCdbZGF0YS12ZWN0b3ItbWFwXScpO1xyXG5cclxuICAgICAgICB2YXIgc2VyaWVzRGF0YSA9IHtcclxuICAgICAgICAgICAgJ0NBJzogMTExMDAsIC8vIENhbmFkYVxyXG4gICAgICAgICAgICAnREUnOiAyNTEwLCAvLyBHZXJtYW55XHJcbiAgICAgICAgICAgICdGUic6IDM3MTAsIC8vIEZyYW5jZVxyXG4gICAgICAgICAgICAnQVUnOiA1NzEwLCAvLyBBdXN0cmFsaWFcclxuICAgICAgICAgICAgJ0dCJzogODMxMCwgLy8gR3JlYXQgQnJpdGFpblxyXG4gICAgICAgICAgICAnUlUnOiA5MzEwLCAvLyBSdXNzaWFcclxuICAgICAgICAgICAgJ0JSJzogNjYxMCwgLy8gQnJhemlsXHJcbiAgICAgICAgICAgICdJTic6IDc4MTAsIC8vIEluZGlhXHJcbiAgICAgICAgICAgICdDTic6IDQzMTAsIC8vIENoaW5hXHJcbiAgICAgICAgICAgICdVUyc6IDgzOSwgLy8gVVNBXHJcbiAgICAgICAgICAgICdTQSc6IDQxMCAvLyBTYXVkaSBBcmFiaWFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgbWFya2Vyc0RhdGEgPSBbXHJcbiAgICAgICAgICAgIHsgbGF0TG5nOiBbNDEuOTAsIDEyLjQ1XSwgbmFtZTogJ1ZhdGljYW4gQ2l0eScgfSxcclxuICAgICAgICAgICAgeyBsYXRMbmc6IFs0My43MywgNy40MV0sIG5hbWU6ICdNb25hY28nIH0sXHJcbiAgICAgICAgICAgIHsgbGF0TG5nOiBbLTAuNTIsIDE2Ni45M10sIG5hbWU6ICdOYXVydScgfSxcclxuICAgICAgICAgICAgeyBsYXRMbmc6IFstOC41MSwgMTc5LjIxXSwgbmFtZTogJ1R1dmFsdScgfSxcclxuICAgICAgICAgICAgeyBsYXRMbmc6IFs3LjExLCAxNzEuMDZdLCBuYW1lOiAnTWFyc2hhbGwgSXNsYW5kcycgfSxcclxuICAgICAgICAgICAgeyBsYXRMbmc6IFsxNy4zLCAtNjIuNzNdLCBuYW1lOiAnU2FpbnQgS2l0dHMgYW5kIE5ldmlzJyB9LFxyXG4gICAgICAgICAgICB7IGxhdExuZzogWzMuMiwgNzMuMjJdLCBuYW1lOiAnTWFsZGl2ZXMnIH0sXHJcbiAgICAgICAgICAgIHsgbGF0TG5nOiBbMzUuODgsIDE0LjVdLCBuYW1lOiAnTWFsdGEnIH0sXHJcbiAgICAgICAgICAgIHsgbGF0TG5nOiBbNDEuMCwgLTcxLjA2XSwgbmFtZTogJ05ldyBFbmdsYW5kJyB9LFxyXG4gICAgICAgICAgICB7IGxhdExuZzogWzEyLjA1LCAtNjEuNzVdLCBuYW1lOiAnR3JlbmFkYScgfSxcclxuICAgICAgICAgICAgeyBsYXRMbmc6IFsxMy4xNiwgLTU5LjU1XSwgbmFtZTogJ0JhcmJhZG9zJyB9LFxyXG4gICAgICAgICAgICB7IGxhdExuZzogWzE3LjExLCAtNjEuODVdLCBuYW1lOiAnQW50aWd1YSBhbmQgQmFyYnVkYScgfSxcclxuICAgICAgICAgICAgeyBsYXRMbmc6IFstNC42MSwgNTUuNDVdLCBuYW1lOiAnU2V5Y2hlbGxlcycgfSxcclxuICAgICAgICAgICAgeyBsYXRMbmc6IFs3LjM1LCAxMzQuNDZdLCBuYW1lOiAnUGFsYXUnIH0sXHJcbiAgICAgICAgICAgIHsgbGF0TG5nOiBbNDIuNSwgMS41MV0sIG5hbWU6ICdBbmRvcnJhJyB9XHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgbmV3IFZlY3Rvck1hcChlbGVtZW50LCBzZXJpZXNEYXRhLCBtYXJrZXJzRGF0YSk7XHJcblxyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvLyBKVkVDVE9SIE1BUFxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIC8vIEFsbG93IEdsb2JhbCBhY2Nlc3NcclxuICAgIHdpbmRvdy5WZWN0b3JNYXAgPSBWZWN0b3JNYXBcclxuXHJcbiAgICB2YXIgZGVmYXVsdENvbG9ycyA9IHtcclxuICAgICAgICBtYXJrZXJDb2xvcjogJyMyM2I3ZTUnLCAvLyB0aGUgbWFya2VyIHBvaW50c1xyXG4gICAgICAgIGJnQ29sb3I6ICd0cmFuc3BhcmVudCcsIC8vIHRoZSBiYWNrZ3JvdW5kXHJcbiAgICAgICAgc2NhbGVDb2xvcnM6IFsnIzg3OGM5YSddLCAvLyB0aGUgY29sb3Igb2YgdGhlIHJlZ2lvbiBpbiB0aGUgc2VyaWVcclxuICAgICAgICByZWdpb25GaWxsOiAnI2JiYmVjNicgLy8gdGhlIGJhc2UgcmVnaW9uIGNvbG9yXHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIFZlY3Rvck1hcChlbGVtZW50LCBzZXJpZXNEYXRhLCBtYXJrZXJzRGF0YSkge1xyXG5cclxuICAgICAgICBpZiAoIWVsZW1lbnQgfHwgIWVsZW1lbnQubGVuZ3RoKSByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBhdHRycyA9IGVsZW1lbnQuZGF0YSgpLFxyXG4gICAgICAgICAgICBtYXBIZWlnaHQgPSBhdHRycy5oZWlnaHQgfHwgJzMwMCcsXHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgICAgICBtYXJrZXJDb2xvcjogYXR0cnMubWFya2VyQ29sb3IgfHwgZGVmYXVsdENvbG9ycy5tYXJrZXJDb2xvcixcclxuICAgICAgICAgICAgICAgIGJnQ29sb3I6IGF0dHJzLmJnQ29sb3IgfHwgZGVmYXVsdENvbG9ycy5iZ0NvbG9yLFxyXG4gICAgICAgICAgICAgICAgc2NhbGU6IGF0dHJzLnNjYWxlIHx8IDEsXHJcbiAgICAgICAgICAgICAgICBzY2FsZUNvbG9yczogYXR0cnMuc2NhbGVDb2xvcnMgfHwgZGVmYXVsdENvbG9ycy5zY2FsZUNvbG9ycyxcclxuICAgICAgICAgICAgICAgIHJlZ2lvbkZpbGw6IGF0dHJzLnJlZ2lvbkZpbGwgfHwgZGVmYXVsdENvbG9ycy5yZWdpb25GaWxsLFxyXG4gICAgICAgICAgICAgICAgbWFwTmFtZTogYXR0cnMubWFwTmFtZSB8fCAnd29ybGRfbWlsbF9lbidcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZWxlbWVudC5jc3MoJ2hlaWdodCcsIG1hcEhlaWdodCk7XHJcblxyXG4gICAgICAgIGluaXQoZWxlbWVudCwgb3B0aW9ucywgc2VyaWVzRGF0YSwgbWFya2Vyc0RhdGEpO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBpbml0KCRlbGVtZW50LCBvcHRzLCBzZXJpZXMsIG1hcmtlcnMpIHtcclxuXHJcbiAgICAgICAgICAgICRlbGVtZW50LnZlY3Rvck1hcCh7XHJcbiAgICAgICAgICAgICAgICBtYXA6IG9wdHMubWFwTmFtZSxcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogb3B0cy5iZ0NvbG9yLFxyXG4gICAgICAgICAgICAgICAgem9vbU1pbjogMSxcclxuICAgICAgICAgICAgICAgIHpvb21NYXg6IDgsXHJcbiAgICAgICAgICAgICAgICB6b29tT25TY3JvbGw6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcmVnaW9uU3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBpbml0aWFsOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdmaWxsJzogb3B0cy5yZWdpb25GaWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnZmlsbC1vcGFjaXR5JzogMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ3N0cm9rZSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ3N0cm9rZS13aWR0aCc6IDEuNSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ3N0cm9rZS1vcGFjaXR5JzogMVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgaG92ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2ZpbGwtb3BhY2l0eSc6IDAuOFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsbDogJ2JsdWUnXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZEhvdmVyOiB7fVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGZvY3VzT246IHsgeDogMC40LCB5OiAwLjYsIHNjYWxlOiBvcHRzLnNjYWxlIH0sXHJcbiAgICAgICAgICAgICAgICBtYXJrZXJTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIGluaXRpYWw6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsbDogb3B0cy5tYXJrZXJDb2xvcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlOiBvcHRzLm1hcmtlckNvbG9yXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG9uUmVnaW9uTGFiZWxTaG93OiBmdW5jdGlvbihlLCBlbCwgY29kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZXJpZXMgJiYgc2VyaWVzW2NvZGVdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5odG1sKGVsLmh0bWwoKSArICc6ICcgKyBzZXJpZXNbY29kZV0gKyAnIHZpc2l0b3JzJyk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgbWFya2VyczogbWFya2VycyxcclxuICAgICAgICAgICAgICAgIHNlcmllczoge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlZ2lvbnM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlczogc2VyaWVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FsZTogb3B0cy5zY2FsZUNvbG9ycyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplRnVuY3Rpb246ICdwb2x5bm9taWFsJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSAvLyBlbmQgaW5pdFxyXG4gICAgfTtcclxuXHJcbn0pKCk7IiwiLyoqXHJcbiAqIFVzZWQgZm9yIHVzZXIgcGFnZXNcclxuICogTG9naW4gYW5kIFJlZ2lzdGVyXHJcbiAqL1xyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0UGFyc2xleUZvclBhZ2VzKVxyXG5cclxuICAgIGZ1bmN0aW9uIGluaXRQYXJzbGV5Rm9yUGFnZXMoKSB7XHJcblxyXG4gICAgICAgIC8vIFBhcnNsZXkgb3B0aW9ucyBzZXR1cCBmb3IgYm9vdHN0cmFwIHZhbGlkYXRpb24gY2xhc3Nlc1xyXG4gICAgICAgIHZhciBwYXJzbGV5T3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgZXJyb3JDbGFzczogJ2lzLWludmFsaWQnLFxyXG4gICAgICAgICAgICBzdWNjZXNzQ2xhc3M6ICdpcy12YWxpZCcsXHJcbiAgICAgICAgICAgIGNsYXNzSGFuZGxlcjogZnVuY3Rpb24oUGFyc2xleUZpZWxkKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWwgPSBQYXJzbGV5RmllbGQuJGVsZW1lbnQucGFyZW50cygnLmZvcm0tZ3JvdXAnKS5maW5kKCdpbnB1dCcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFlbC5sZW5ndGgpIC8vIHN1cHBvcnQgY3VzdG9tIGNoZWNrYm94XHJcbiAgICAgICAgICAgICAgICAgICAgZWwgPSBQYXJzbGV5RmllbGQuJGVsZW1lbnQucGFyZW50cygnLmMtY2hlY2tib3gnKS5maW5kKCdsYWJlbCcpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcnNDb250YWluZXI6IGZ1bmN0aW9uKFBhcnNsZXlGaWVsZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFBhcnNsZXlGaWVsZC4kZWxlbWVudC5wYXJlbnRzKCcuZm9ybS1ncm91cCcpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcnNXcmFwcGVyOiAnPGRpdiBjbGFzcz1cInRleHQtaGVscFwiPicsXHJcbiAgICAgICAgICAgIGVycm9yVGVtcGxhdGU6ICc8ZGl2PjwvZGl2PidcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBMb2dpbiBmb3JtIHZhbGlkYXRpb24gd2l0aCBQYXJzbGV5XHJcbiAgICAgICAgdmFyIGxvZ2luRm9ybSA9ICQoXCIjbG9naW5Gb3JtXCIpO1xyXG4gICAgICAgIGlmIChsb2dpbkZvcm0ubGVuZ3RoKVxyXG4gICAgICAgICAgICBsb2dpbkZvcm0ucGFyc2xleShwYXJzbGV5T3B0aW9ucyk7XHJcblxyXG4gICAgICAgIC8vIFJlZ2lzdGVyIGZvcm0gdmFsaWRhdGlvbiB3aXRoIFBhcnNsZXlcclxuICAgICAgICB2YXIgcmVnaXN0ZXJGb3JtID0gJChcIiNyZWdpc3RlckZvcm1cIik7XHJcbiAgICAgICAgaWYgKHJlZ2lzdGVyRm9ybS5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJlZ2lzdGVyRm9ybS5wYXJzbGV5KHBhcnNsZXlPcHRpb25zKTtcclxuXHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8vIEJPT1RHUklEXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgJChpbml0Qm9vdGdyaWQpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXRCb290Z3JpZCgpIHtcclxuXHJcbiAgICAgICAgaWYgKCEkLmZuLmJvb3RncmlkKSByZXR1cm47XHJcblxyXG4gICAgICAgICQoJyNib290Z3JpZC1iYXNpYycpLmJvb3RncmlkKHtcclxuICAgICAgICAgICAgdGVtcGxhdGVzOiB7XHJcbiAgICAgICAgICAgICAgICAvLyB0ZW1wbGF0ZXMgZm9yIEJTNFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uQnV0dG9uOiAnPGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tc2Vjb25kYXJ5XCIgdHlwZT1cImJ1dHRvblwiIHRpdGxlPVwie3tjdHgudGV4dH19XCI+e3tjdHguY29udGVudH19PC9idXR0b24+JyxcclxuICAgICAgICAgICAgICAgIGFjdGlvbkRyb3BEb3duOiAnPGRpdiBjbGFzcz1cInt7Y3NzLmRyb3BEb3duTWVudX19XCI+PGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tc2Vjb25kYXJ5IGRyb3Bkb3duLXRvZ2dsZSBkcm9wZG93bi10b2dnbGUtbm9jYXJldFwiIHR5cGU9XCJidXR0b25cIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCI+PHNwYW4gY2xhc3M9XCJ7e2Nzcy5kcm9wRG93bk1lbnVUZXh0fX1cIj57e2N0eC5jb250ZW50fX08L3NwYW4+PC9idXR0b24+PHVsIGNsYXNzPVwie3tjc3MuZHJvcERvd25NZW51SXRlbXN9fVwiIHJvbGU9XCJtZW51XCI+PC91bD48L2Rpdj4nLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uRHJvcERvd25JdGVtOiAnPGxpIGNsYXNzPVwiZHJvcGRvd24taXRlbVwiPjxhIGhyZWY9XCJcIiBkYXRhLWFjdGlvbj1cInt7Y3R4LmFjdGlvbn19XCIgY2xhc3M9XCJkcm9wZG93bi1saW5rIHt7Y3NzLmRyb3BEb3duSXRlbUJ1dHRvbn19XCI+e3tjdHgudGV4dH19PC9hPjwvbGk+JyxcclxuICAgICAgICAgICAgICAgIGFjdGlvbkRyb3BEb3duQ2hlY2tib3hJdGVtOiAnPGxpIGNsYXNzPVwiZHJvcGRvd24taXRlbVwiPjxsYWJlbCBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gcC0wXCI+PGlucHV0IG5hbWU9XCJ7e2N0eC5uYW1lfX1cIiB0eXBlPVwiY2hlY2tib3hcIiB2YWx1ZT1cIjFcIiBjbGFzcz1cInt7Y3NzLmRyb3BEb3duSXRlbUNoZWNrYm94fX1cIiB7e2N0eC5jaGVja2VkfX0gLz4ge3tjdHgubGFiZWx9fTwvbGFiZWw+PC9saT4nLFxyXG4gICAgICAgICAgICAgICAgcGFnaW5hdGlvbkl0ZW06ICc8bGkgY2xhc3M9XCJwYWdlLWl0ZW0ge3tjdHguY3NzfX1cIj48YSBocmVmPVwiXCIgZGF0YS1wYWdlPVwie3tjdHgucGFnZX19XCIgY2xhc3M9XCJwYWdlLWxpbmsge3tjc3MucGFnaW5hdGlvbkJ1dHRvbn19XCI+e3tjdHgudGV4dH19PC9hPjwvbGk+JyxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkKCcjYm9vdGdyaWQtc2VsZWN0aW9uJykuYm9vdGdyaWQoe1xyXG4gICAgICAgICAgICBzZWxlY3Rpb246IHRydWUsXHJcbiAgICAgICAgICAgIG11bHRpU2VsZWN0OiB0cnVlLFxyXG4gICAgICAgICAgICByb3dTZWxlY3Q6IHRydWUsXHJcbiAgICAgICAgICAgIGtlZXBTZWxlY3Rpb246IHRydWUsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlczoge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0OlxyXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY2hlY2tib3ggYy1jaGVja2JveFwiPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwibWItMFwiPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwie3tjdHgudHlwZX19XCIgY2xhc3M9XCJ7e2Nzcy5zZWxlY3RCb3h9fVwiIHZhbHVlPVwie3tjdHgudmFsdWV9fVwiIHt7Y3R4LmNoZWNrZWR9fT4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImZhIGZhLWNoZWNrXCI+PC9zcGFuPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nLFxyXG4gICAgICAgICAgICAgICAgLy8gdGVtcGxhdGVzIGZvciBCUzRcclxuICAgICAgICAgICAgICAgIGFjdGlvbkJ1dHRvbjogJzxidXR0b24gY2xhc3M9XCJidG4gYnRuLXNlY29uZGFyeVwiIHR5cGU9XCJidXR0b25cIiB0aXRsZT1cInt7Y3R4LnRleHR9fVwiPnt7Y3R4LmNvbnRlbnR9fTwvYnV0dG9uPicsXHJcbiAgICAgICAgICAgICAgICBhY3Rpb25Ecm9wRG93bjogJzxkaXYgY2xhc3M9XCJ7e2Nzcy5kcm9wRG93bk1lbnV9fVwiPjxidXR0b24gY2xhc3M9XCJidG4gYnRuLXNlY29uZGFyeSBkcm9wZG93bi10b2dnbGUgZHJvcGRvd24tdG9nZ2xlLW5vY2FyZXRcIiB0eXBlPVwiYnV0dG9uXCIgZGF0YS10b2dnbGU9XCJkcm9wZG93blwiPjxzcGFuIGNsYXNzPVwie3tjc3MuZHJvcERvd25NZW51VGV4dH19XCI+e3tjdHguY29udGVudH19PC9zcGFuPjwvYnV0dG9uPjx1bCBjbGFzcz1cInt7Y3NzLmRyb3BEb3duTWVudUl0ZW1zfX1cIiByb2xlPVwibWVudVwiPjwvdWw+PC9kaXY+JyxcclxuICAgICAgICAgICAgICAgIGFjdGlvbkRyb3BEb3duSXRlbTogJzxsaSBjbGFzcz1cImRyb3Bkb3duLWl0ZW1cIj48YSBocmVmPVwiXCIgZGF0YS1hY3Rpb249XCJ7e2N0eC5hY3Rpb259fVwiIGNsYXNzPVwiZHJvcGRvd24tbGluayB7e2Nzcy5kcm9wRG93bkl0ZW1CdXR0b259fVwiPnt7Y3R4LnRleHR9fTwvYT48L2xpPicsXHJcbiAgICAgICAgICAgICAgICBhY3Rpb25Ecm9wRG93bkNoZWNrYm94SXRlbTogJzxsaSBjbGFzcz1cImRyb3Bkb3duLWl0ZW1cIj48bGFiZWwgY2xhc3M9XCJkcm9wZG93bi1pdGVtIHAtMFwiPjxpbnB1dCBuYW1lPVwie3tjdHgubmFtZX19XCIgdHlwZT1cImNoZWNrYm94XCIgdmFsdWU9XCIxXCIgY2xhc3M9XCJ7e2Nzcy5kcm9wRG93bkl0ZW1DaGVja2JveH19XCIge3tjdHguY2hlY2tlZH19IC8+IHt7Y3R4LmxhYmVsfX08L2xhYmVsPjwvbGk+JyxcclxuICAgICAgICAgICAgICAgIHBhZ2luYXRpb25JdGVtOiAnPGxpIGNsYXNzPVwicGFnZS1pdGVtIHt7Y3R4LmNzc319XCI+PGEgaHJlZj1cIlwiIGRhdGEtcGFnZT1cInt7Y3R4LnBhZ2V9fVwiIGNsYXNzPVwicGFnZS1saW5rIHt7Y3NzLnBhZ2luYXRpb25CdXR0b259fVwiPnt7Y3R4LnRleHR9fTwvYT48L2xpPicsXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIGdyaWQgPSAkKCcjYm9vdGdyaWQtY29tbWFuZCcpLmJvb3RncmlkKHtcclxuICAgICAgICAgICAgZm9ybWF0dGVyczoge1xyXG4gICAgICAgICAgICAgICAgY29tbWFuZHM6IGZ1bmN0aW9uKGNvbHVtbiwgcm93KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tc20gYnRuLWluZm8gbXItMiBjb21tYW5kLWVkaXRcIiBkYXRhLXJvdy1pZD1cIicgKyByb3cuaWQgKyAnXCI+PGVtIGNsYXNzPVwiZmEgZmEtZWRpdCBmYS1md1wiPjwvZW0+PC9idXR0b24+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tc20gYnRuLWRhbmdlciBjb21tYW5kLWRlbGV0ZVwiIGRhdGEtcm93LWlkPVwiJyArIHJvdy5pZCArICdcIj48ZW0gY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1md1wiPjwvZW0+PC9idXR0b24+JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGVtcGxhdGVzOiB7XHJcbiAgICAgICAgICAgICAgICAvLyB0ZW1wbGF0ZXMgZm9yIEJTNFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uQnV0dG9uOiAnPGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tc2Vjb25kYXJ5XCIgdHlwZT1cImJ1dHRvblwiIHRpdGxlPVwie3tjdHgudGV4dH19XCI+e3tjdHguY29udGVudH19PC9idXR0b24+JyxcclxuICAgICAgICAgICAgICAgIGFjdGlvbkRyb3BEb3duOiAnPGRpdiBjbGFzcz1cInt7Y3NzLmRyb3BEb3duTWVudX19XCI+PGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tc2Vjb25kYXJ5IGRyb3Bkb3duLXRvZ2dsZSBkcm9wZG93bi10b2dnbGUtbm9jYXJldFwiIHR5cGU9XCJidXR0b25cIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCI+PHNwYW4gY2xhc3M9XCJ7e2Nzcy5kcm9wRG93bk1lbnVUZXh0fX1cIj57e2N0eC5jb250ZW50fX08L3NwYW4+PC9idXR0b24+PHVsIGNsYXNzPVwie3tjc3MuZHJvcERvd25NZW51SXRlbXN9fVwiIHJvbGU9XCJtZW51XCI+PC91bD48L2Rpdj4nLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uRHJvcERvd25JdGVtOiAnPGxpIGNsYXNzPVwiZHJvcGRvd24taXRlbVwiPjxhIGhyZWY9XCJcIiBkYXRhLWFjdGlvbj1cInt7Y3R4LmFjdGlvbn19XCIgY2xhc3M9XCJkcm9wZG93bi1saW5rIHt7Y3NzLmRyb3BEb3duSXRlbUJ1dHRvbn19XCI+e3tjdHgudGV4dH19PC9hPjwvbGk+JyxcclxuICAgICAgICAgICAgICAgIGFjdGlvbkRyb3BEb3duQ2hlY2tib3hJdGVtOiAnPGxpIGNsYXNzPVwiZHJvcGRvd24taXRlbVwiPjxsYWJlbCBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gcC0wXCI+PGlucHV0IG5hbWU9XCJ7e2N0eC5uYW1lfX1cIiB0eXBlPVwiY2hlY2tib3hcIiB2YWx1ZT1cIjFcIiBjbGFzcz1cInt7Y3NzLmRyb3BEb3duSXRlbUNoZWNrYm94fX1cIiB7e2N0eC5jaGVja2VkfX0gLz4ge3tjdHgubGFiZWx9fTwvbGFiZWw+PC9saT4nLFxyXG4gICAgICAgICAgICAgICAgcGFnaW5hdGlvbkl0ZW06ICc8bGkgY2xhc3M9XCJwYWdlLWl0ZW0ge3tjdHguY3NzfX1cIj48YSBocmVmPVwiXCIgZGF0YS1wYWdlPVwie3tjdHgucGFnZX19XCIgY2xhc3M9XCJwYWdlLWxpbmsge3tjc3MucGFnaW5hdGlvbkJ1dHRvbn19XCI+e3tjdHgudGV4dH19PC9hPjwvbGk+JyxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pLm9uKCdsb2FkZWQucnMuanF1ZXJ5LmJvb3RncmlkJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8qIEV4ZWN1dGVzIGFmdGVyIGRhdGEgaXMgbG9hZGVkIGFuZCByZW5kZXJlZCAqL1xyXG4gICAgICAgICAgICBncmlkLmZpbmQoJy5jb21tYW5kLWVkaXQnKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdZb3UgcHJlc3NlZCBlZGl0IG9uIHJvdzogJyArICQodGhpcykuZGF0YSgncm93LWlkJykpO1xyXG4gICAgICAgICAgICB9KS5lbmQoKS5maW5kKCcuY29tbWFuZC1kZWxldGUnKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdZb3UgcHJlc3NlZCBkZWxldGUgb24gcm93OiAnICsgJCh0aGlzKS5kYXRhKCdyb3ctaWQnKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLy8gREFUQVRBQkxFU1xyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgICQoaW5pdERhdGF0YWJsZXMpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXREYXRhdGFibGVzKCkge1xyXG5cclxuICAgICAgICBpZiAoISQuZm4uRGF0YVRhYmxlKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIFplcm8gY29uZmlndXJhdGlvblxyXG5cclxuICAgICAgICAkKCcjZGF0YXRhYmxlMScpLkRhdGFUYWJsZSh7XHJcbiAgICAgICAgICAgICdwYWdpbmcnOiB0cnVlLCAvLyBUYWJsZSBwYWdpbmF0aW9uXHJcbiAgICAgICAgICAgICdvcmRlcmluZyc6IHRydWUsIC8vIENvbHVtbiBvcmRlcmluZ1xyXG4gICAgICAgICAgICAnaW5mbyc6IHRydWUsIC8vIEJvdHRvbSBsZWZ0IHN0YXR1cyB0ZXh0XHJcbiAgICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXHJcbiAgICAgICAgICAgIC8vIFRleHQgdHJhbnNsYXRpb24gb3B0aW9uc1xyXG4gICAgICAgICAgICAvLyBOb3RlIHRoZSByZXF1aXJlZCBrZXl3b3JkcyBiZXR3ZWVuIHVuZGVyc2NvcmVzIChlLmcgX01FTlVfKVxyXG4gICAgICAgICAgICBvTGFuZ3VhZ2U6IHtcclxuICAgICAgICAgICAgICAgIHNTZWFyY2g6ICc8ZW0gY2xhc3M9XCJmYXMgZmEtc2VhcmNoXCI+PC9lbT4nLFxyXG4gICAgICAgICAgICAgICAgc0xlbmd0aE1lbnU6ICdfTUVOVV8gcmVjb3JkcyBwZXIgcGFnZScsXHJcbiAgICAgICAgICAgICAgICBpbmZvOiAnU2hvd2luZyBwYWdlIF9QQUdFXyBvZiBfUEFHRVNfJyxcclxuICAgICAgICAgICAgICAgIHplcm9SZWNvcmRzOiAnTm90aGluZyBmb3VuZCAtIHNvcnJ5JyxcclxuICAgICAgICAgICAgICAgIGluZm9FbXB0eTogJ05vIHJlY29yZHMgYXZhaWxhYmxlJyxcclxuICAgICAgICAgICAgICAgIGluZm9GaWx0ZXJlZDogJyhmaWx0ZXJlZCBmcm9tIF9NQVhfIHRvdGFsIHJlY29yZHMpJyxcclxuICAgICAgICAgICAgICAgIG9QYWdpbmF0ZToge1xyXG4gICAgICAgICAgICAgICAgICAgIHNOZXh0OiAnPGVtIGNsYXNzPVwiZmEgZmEtY2FyZXQtcmlnaHRcIj48L2VtPicsXHJcbiAgICAgICAgICAgICAgICAgICAgc1ByZXZpb3VzOiAnPGVtIGNsYXNzPVwiZmEgZmEtY2FyZXQtbGVmdFwiPjwvZW0+J1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICAvLyBGaWx0ZXJcclxuXHJcbiAgICAgICAgJCgnI2RhdGF0YWJsZTInKS5EYXRhVGFibGUoe1xyXG4gICAgICAgICAgICAncGFnaW5nJzogdHJ1ZSwgLy8gVGFibGUgcGFnaW5hdGlvblxyXG4gICAgICAgICAgICAnb3JkZXJpbmcnOiB0cnVlLCAvLyBDb2x1bW4gb3JkZXJpbmdcclxuICAgICAgICAgICAgJ2luZm8nOiB0cnVlLCAvLyBCb3R0b20gbGVmdCBzdGF0dXMgdGV4dFxyXG4gICAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxyXG4gICAgICAgICAgICAvLyBUZXh0IHRyYW5zbGF0aW9uIG9wdGlvbnNcclxuICAgICAgICAgICAgLy8gTm90ZSB0aGUgcmVxdWlyZWQga2V5d29yZHMgYmV0d2VlbiB1bmRlcnNjb3JlcyAoZS5nIF9NRU5VXylcclxuICAgICAgICAgICAgb0xhbmd1YWdlOiB7XHJcbiAgICAgICAgICAgICAgICBzU2VhcmNoOiAnU2VhcmNoIGFsbCBjb2x1bW5zOicsXHJcbiAgICAgICAgICAgICAgICBzTGVuZ3RoTWVudTogJ19NRU5VXyByZWNvcmRzIHBlciBwYWdlJyxcclxuICAgICAgICAgICAgICAgIGluZm86ICdTaG93aW5nIHBhZ2UgX1BBR0VfIG9mIF9QQUdFU18nLFxyXG4gICAgICAgICAgICAgICAgemVyb1JlY29yZHM6ICdOb3RoaW5nIGZvdW5kIC0gc29ycnknLFxyXG4gICAgICAgICAgICAgICAgaW5mb0VtcHR5OiAnTm8gcmVjb3JkcyBhdmFpbGFibGUnLFxyXG4gICAgICAgICAgICAgICAgaW5mb0ZpbHRlcmVkOiAnKGZpbHRlcmVkIGZyb20gX01BWF8gdG90YWwgcmVjb3JkcyknLFxyXG4gICAgICAgICAgICAgICAgb1BhZ2luYXRlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc05leHQ6ICc8ZW0gY2xhc3M9XCJmYSBmYS1jYXJldC1yaWdodFwiPjwvZW0+JyxcclxuICAgICAgICAgICAgICAgICAgICBzUHJldmlvdXM6ICc8ZW0gY2xhc3M9XCJmYSBmYS1jYXJldC1sZWZ0XCI+PC9lbT4nXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIERhdGF0YWJsZSBCdXR0b25zIHNldHVwXHJcbiAgICAgICAgICAgIGRvbTogJ0JmcnRpcCcsXHJcbiAgICAgICAgICAgIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgIHsgZXh0ZW5kOiAnY29weScsIGNsYXNzTmFtZTogJ2J0bi1pbmZvJyB9LFxyXG4gICAgICAgICAgICAgICAgeyBleHRlbmQ6ICdjc3YnLCBjbGFzc05hbWU6ICdidG4taW5mbycgfSxcclxuICAgICAgICAgICAgICAgIHsgZXh0ZW5kOiAnZXhjZWwnLCBjbGFzc05hbWU6ICdidG4taW5mbycsIHRpdGxlOiAnWExTLUZpbGUnIH0sXHJcbiAgICAgICAgICAgICAgICB7IGV4dGVuZDogJ3BkZicsIGNsYXNzTmFtZTogJ2J0bi1pbmZvJywgdGl0bGU6ICQoJ3RpdGxlJykudGV4dCgpIH0sXHJcbiAgICAgICAgICAgICAgICB7IGV4dGVuZDogJ3ByaW50JywgY2xhc3NOYW1lOiAnYnRuLWluZm8nIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkKCcjZGF0YXRhYmxlMycpLkRhdGFUYWJsZSh7XHJcbiAgICAgICAgICAgICdwYWdpbmcnOiB0cnVlLCAvLyBUYWJsZSBwYWdpbmF0aW9uXHJcbiAgICAgICAgICAgICdvcmRlcmluZyc6IHRydWUsIC8vIENvbHVtbiBvcmRlcmluZ1xyXG4gICAgICAgICAgICAnaW5mbyc6IHRydWUsIC8vIEJvdHRvbSBsZWZ0IHN0YXR1cyB0ZXh0XHJcbiAgICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXHJcbiAgICAgICAgICAgIC8vIFRleHQgdHJhbnNsYXRpb24gb3B0aW9uc1xyXG4gICAgICAgICAgICAvLyBOb3RlIHRoZSByZXF1aXJlZCBrZXl3b3JkcyBiZXR3ZWVuIHVuZGVyc2NvcmVzIChlLmcgX01FTlVfKVxyXG4gICAgICAgICAgICBvTGFuZ3VhZ2U6IHtcclxuICAgICAgICAgICAgICAgIHNTZWFyY2g6ICdTZWFyY2ggYWxsIGNvbHVtbnM6JyxcclxuICAgICAgICAgICAgICAgIHNMZW5ndGhNZW51OiAnX01FTlVfIHJlY29yZHMgcGVyIHBhZ2UnLFxyXG4gICAgICAgICAgICAgICAgaW5mbzogJ1Nob3dpbmcgcGFnZSBfUEFHRV8gb2YgX1BBR0VTXycsXHJcbiAgICAgICAgICAgICAgICB6ZXJvUmVjb3JkczogJ05vdGhpbmcgZm91bmQgLSBzb3JyeScsXHJcbiAgICAgICAgICAgICAgICBpbmZvRW1wdHk6ICdObyByZWNvcmRzIGF2YWlsYWJsZScsXHJcbiAgICAgICAgICAgICAgICBpbmZvRmlsdGVyZWQ6ICcoZmlsdGVyZWQgZnJvbSBfTUFYXyB0b3RhbCByZWNvcmRzKScsXHJcbiAgICAgICAgICAgICAgICBvUGFnaW5hdGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBzTmV4dDogJzxlbSBjbGFzcz1cImZhIGZhLWNhcmV0LXJpZ2h0XCI+PC9lbT4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHNQcmV2aW91czogJzxlbSBjbGFzcz1cImZhIGZhLWNhcmV0LWxlZnRcIj48L2VtPidcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gRGF0YXRhYmxlIGtleSBzZXR1cFxyXG4gICAgICAgICAgICBrZXlzOiB0cnVlXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvLyBDdXN0b20gQ29kZVxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgICQoaW5pdEN1c3RvbSk7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdEN1c3RvbSgpIHtcclxuXHJcbiAgICAgICAgLy8gY3VzdG9tIGNvZGVcclxuXHJcbiAgICB9XHJcblxyXG59KSgpOyIsIiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAvLyBDdXJyZW5jeSBTZXBhcmF0b3JcclxuICAgIHZhciBjb21tYUNvdW50ZXIgPSAxMDtcclxuXHJcbiAgICBmdW5jdGlvbiBudW1iZXJTZXBhcmF0b3IoTnVtYmVyKSB7XHJcbiAgICAgICAgTnVtYmVyICs9ICcnO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbW1hQ291bnRlcjsgaSsrKSB7XHJcbiAgICAgICAgICAgIE51bWJlciA9IE51bWJlci5yZXBsYWNlKCcsJywgJycpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgeCA9IE51bWJlci5zcGxpdCgnLicpO1xyXG4gICAgICAgIHkgPSB4WzBdO1xyXG4gICAgICAgIHogPSB4Lmxlbmd0aCA+IDEgPyAnLicgKyB4WzFdIDogJyc7XHJcbiAgICAgICAgdmFyIHJneCA9IC8oXFxkKykoXFxkezN9KS87XHJcblxyXG4gICAgICAgIHdoaWxlIChyZ3gudGVzdCh5KSkge1xyXG4gICAgICAgICAgICB5ID0geS5yZXBsYWNlKHJneCwgJyQxJyArICcsJyArICckMicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb21tYUNvdW50ZXIrKztcclxuICAgICAgICByZXR1cm4geSArIHo7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2V0IEN1cnJlbmN5IFNlcGFyYXRvciB0byBpbnB1dCBmaWVsZHNcclxuICAgICQoZG9jdW1lbnQpLm9uKCdrZXlwcmVzcyAsIHBhc3RlJywgJy5udW1iZXItc2VwYXJhdG9yJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBpZiAoL14tP1xcZCpbLC5dPyhcXGR7MCwzfSwpKihcXGR7M30sKT9cXGR7MCwzfSQvLnRlc3QoZS5rZXkpKSB7XHJcbiAgICAgICAgICAgICQoJy5udW1iZXItc2VwYXJhdG9yJykub24oJ2lucHV0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZS50YXJnZXQudmFsdWUgPSBudW1iZXJTZXBhcmF0b3IoZS50YXJnZXQudmFsdWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcblxyXG59KSIsIi8qISBqcXVlcnktcXJjb2RlIHYwLjE3LjAgLSBodHRwczovL2xhcnNqdW5nLmRlL2pxdWVyeS1xcmNvZGUvICovXHJcbiFmdW5jdGlvbih0LHIpe1wib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzJiZcIm9iamVjdFwiPT10eXBlb2YgbW9kdWxlP21vZHVsZS5leHBvcnRzPXIoKTpcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQ/ZGVmaW5lKFwianF1ZXJ5LXFyY29kZVwiLFtdLHIpOlwib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzP2V4cG9ydHNbXCJqcXVlcnktcXJjb2RlXCJdPXIoKTp0W1wianF1ZXJ5LXFyY29kZVwiXT1yKCl9KFwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcyxmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbihlKXt2YXIgbj17fTtmdW5jdGlvbiBvKHQpe2lmKG5bdF0pcmV0dXJuIG5bdF0uZXhwb3J0czt2YXIgcj1uW3RdPXtpOnQsbDohMSxleHBvcnRzOnt9fTtyZXR1cm4gZVt0XS5jYWxsKHIuZXhwb3J0cyxyLHIuZXhwb3J0cyxvKSxyLmw9ITAsci5leHBvcnRzfXJldHVybiBvLm09ZSxvLmM9bixvLmQ9ZnVuY3Rpb24odCxyLGUpe28ubyh0LHIpfHxPYmplY3QuZGVmaW5lUHJvcGVydHkodCxyLHtlbnVtZXJhYmxlOiEwLGdldDplfSl9LG8ucj1mdW5jdGlvbih0KXtcInVuZGVmaW5lZFwiIT10eXBlb2YgU3ltYm9sJiZTeW1ib2wudG9TdHJpbmdUYWcmJk9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0LFN5bWJvbC50b1N0cmluZ1RhZyx7dmFsdWU6XCJNb2R1bGVcIn0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0LFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pfSxvLnQ9ZnVuY3Rpb24ocix0KXtpZigxJnQmJihyPW8ocikpLDgmdClyZXR1cm4gcjtpZig0JnQmJlwib2JqZWN0XCI9PXR5cGVvZiByJiZyJiZyLl9fZXNNb2R1bGUpcmV0dXJuIHI7dmFyIGU9T2JqZWN0LmNyZWF0ZShudWxsKTtpZihvLnIoZSksT2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJkZWZhdWx0XCIse2VudW1lcmFibGU6ITAsdmFsdWU6cn0pLDImdCYmXCJzdHJpbmdcIiE9dHlwZW9mIHIpZm9yKHZhciBuIGluIHIpby5kKGUsbixmdW5jdGlvbih0KXtyZXR1cm4gclt0XX0uYmluZChudWxsLG4pKTtyZXR1cm4gZX0sby5uPWZ1bmN0aW9uKHQpe3ZhciByPXQmJnQuX19lc01vZHVsZT9mdW5jdGlvbigpe3JldHVybiB0LmRlZmF1bHR9OmZ1bmN0aW9uKCl7cmV0dXJuIHR9O3JldHVybiBvLmQocixcImFcIixyKSxyfSxvLm89ZnVuY3Rpb24odCxyKXtyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHQscil9LG8ucD1cIlwiLG8oby5zPTApfShbZnVuY3Rpb24odix0LHApeyhmdW5jdGlvbih0KXtmdW5jdGlvbiBjKHQpe3JldHVybiB0JiZcInN0cmluZ1wiPT10eXBlb2YgdC50YWdOYW1lJiZcIklNR1wiPT09dC50YWdOYW1lLnRvVXBwZXJDYXNlKCl9ZnVuY3Rpb24gYSh0LHIsZSxuKXt2YXIgbz17fSxpPXAoMik7aS5zdHJpbmdUb0J5dGVzPWkuc3RyaW5nVG9CeXRlc0Z1bmNzW1wiVVRGLThcIl07dmFyIGE9aShlLHIpO2EuYWRkRGF0YSh0KSxhLm1ha2UoKSxuPW58fDA7dmFyIHU9YS5nZXRNb2R1bGVDb3VudCgpLHM9dSsyKm47cmV0dXJuIG8udGV4dD10LG8ubGV2ZWw9cixvLnZlcnNpb249ZSxvLm1vZHVsZV9jb3VudD1zLG8uaXNfZGFyaz1mdW5jdGlvbih0LHIpe3JldHVybiByLT1uLDA8PSh0LT1uKSYmdDx1JiYwPD1yJiZyPHUmJmEuaXNEYXJrKHQscil9LG8uYWRkX2JsYW5rPWZ1bmN0aW9uKGEsdSxmLGMpe3ZhciBsPW8uaXNfZGFyayxnPTEvcztvLmlzX2Rhcms9ZnVuY3Rpb24odCxyKXt2YXIgZT1yKmcsbj10Kmcsbz1lK2csaT1uK2c7cmV0dXJuIGwodCxyKSYmKG88YXx8ZjxlfHxpPHV8fGM8bil9fSxvfWZ1bmN0aW9uIGgodCxyLGUsbixvKXtlPU1hdGgubWF4KDEsZXx8MSksbj1NYXRoLm1pbig0MCxufHw0MCk7Zm9yKHZhciBpPWU7aTw9bjtpKz0xKXRyeXtyZXR1cm4gYSh0LHIsaSxvKX1jYXRjaCh0KXt9fWZ1bmN0aW9uIGkodCxyLGUpe2MoZS5iYWNrZ3JvdW5kKT9yLmRyYXdJbWFnZShlLmJhY2tncm91bmQsMCwwLGUuc2l6ZSxlLnNpemUpOmUuYmFja2dyb3VuZCYmKHIuZmlsbFN0eWxlPWUuYmFja2dyb3VuZCxyLmZpbGxSZWN0KGUubGVmdCxlLnRvcCxlLnNpemUsZS5zaXplKSk7dmFyIG49ZS5tb2RlOzE9PT1ufHwyPT09bj9mdW5jdGlvbih0LHIsZSl7dmFyIG49ZS5zaXplLG89XCJib2xkIFwiK2UubVNpemUqbitcInB4IFwiK2UuZm9udG5hbWUsaT1kKFwiPGNhbnZhcy8+XCIpWzBdLmdldENvbnRleHQoXCIyZFwiKTtpLmZvbnQ9bzt2YXIgYT1pLm1lYXN1cmVUZXh0KGUubGFiZWwpLndpZHRoLHU9ZS5tU2l6ZSxmPWEvbixjPSgxLWYpKmUubVBvc1gsbD0oMS11KSplLm1Qb3NZLGc9YytmLHM9bCt1OzE9PT1lLm1vZGU/dC5hZGRfYmxhbmsoMCxsLS4wMSxuLHMrLjAxKTp0LmFkZF9ibGFuayhjLS4wMSxsLS4wMSwuMDErZyxzKy4wMSksci5maWxsU3R5bGU9ZS5mb250Y29sb3Isci5mb250PW8sci5maWxsVGV4dChlLmxhYmVsLGMqbixsKm4rLjc1KmUubVNpemUqbil9KHQscixlKTohYyhlLmltYWdlKXx8MyE9PW4mJjQhPT1ufHxmdW5jdGlvbih0LHIsZSl7dmFyIG49ZS5zaXplLG89ZS5pbWFnZS5uYXR1cmFsV2lkdGh8fDEsaT1lLmltYWdlLm5hdHVyYWxIZWlnaHR8fDEsYT1lLm1TaXplLHU9YSpvL2ksZj0oMS11KSplLm1Qb3NYLGM9KDEtYSkqZS5tUG9zWSxsPWYrdSxnPWMrYTszPT09ZS5tb2RlP3QuYWRkX2JsYW5rKDAsYy0uMDEsbixnKy4wMSk6dC5hZGRfYmxhbmsoZi0uMDEsYy0uMDEsLjAxK2wsZysuMDEpLHIuZHJhd0ltYWdlKGUuaW1hZ2UsZipuLGMqbix1Km4sYSpuKX0odCxyLGUpfWZ1bmN0aW9uIGwodCxyLGUsbixvLGksYSx1KXt0LmlzX2RhcmsoYSx1KSYmci5yZWN0KG4sbyxpLGkpfWZ1bmN0aW9uIGcodCxyLGUsbixvLGksYSx1KXt2YXIgZj10LmlzX2RhcmssYz1uK2ksbD1vK2ksZz1lLnJhZGl1cyppLHM9YS0xLGg9YSsxLGQ9dS0xLHY9dSsxLHA9ZihhLHUpLHc9ZihzLGQpLHk9ZihzLHUpLG09ZihzLHYpLGI9ZihhLHYpLGs9ZihoLHYpLEM9ZihoLHUpLEI9ZihoLGQpLHg9ZihhLGQpO3A/ZnVuY3Rpb24odCxyLGUsbixvLGksYSx1LGYsYyl7YT90Lm1vdmVUbyhyK2ksZSk6dC5tb3ZlVG8ocixlKSx1Pyh0LmxpbmVUbyhuLWksZSksdC5hcmNUbyhuLGUsbixvLGkpKTp0LmxpbmVUbyhuLGUpLGY/KHQubGluZVRvKG4sby1pKSx0LmFyY1RvKG4sbyxyLG8saSkpOnQubGluZVRvKG4sbyksYz8odC5saW5lVG8ocitpLG8pLHQuYXJjVG8ocixvLHIsZSxpKSk6dC5saW5lVG8ocixvKSxhPyh0LmxpbmVUbyhyLGUraSksdC5hcmNUbyhyLGUsbixlLGkpKTp0LmxpbmVUbyhyLGUpfShyLG4sbyxjLGwsZywheSYmIXgsIXkmJiFiLCFDJiYhYiwhQyYmIXgpOmZ1bmN0aW9uKHQscixlLG4sbyxpLGEsdSxmLGMpe2EmJih0Lm1vdmVUbyhyK2ksZSksdC5saW5lVG8ocixlKSx0LmxpbmVUbyhyLGUraSksdC5hcmNUbyhyLGUscitpLGUsaSkpLHUmJih0Lm1vdmVUbyhuLWksZSksdC5saW5lVG8obixlKSx0LmxpbmVUbyhuLGUraSksdC5hcmNUbyhuLGUsbi1pLGUsaSkpLGYmJih0Lm1vdmVUbyhuLWksbyksdC5saW5lVG8obixvKSx0LmxpbmVUbyhuLG8taSksdC5hcmNUbyhuLG8sbi1pLG8saSkpLGMmJih0Lm1vdmVUbyhyK2ksbyksdC5saW5lVG8ocixvKSx0LmxpbmVUbyhyLG8taSksdC5hcmNUbyhyLG8scitpLG8saSkpfShyLG4sbyxjLGwsZyx5JiZ4JiZ3LHkmJmImJm0sQyYmYiYmayxDJiZ4JiZCKX1mdW5jdGlvbiBuKHQscil7dmFyIGU9aChyLnRleHQsci5lY0xldmVsLHIubWluVmVyc2lvbixyLm1heFZlcnNpb24sci5xdWlldCk7aWYoIWUpcmV0dXJuIG51bGw7dmFyIG49ZCh0KS5kYXRhKFwicXJjb2RlXCIsZSksbz1uWzBdLmdldENvbnRleHQoXCIyZFwiKTtyZXR1cm4gaShlLG8sciksZnVuY3Rpb24odCxyLGUpe3ZhciBuLG8saT10Lm1vZHVsZV9jb3VudCxhPWUuc2l6ZS9pLHU9bDtmb3IoMDxlLnJhZGl1cyYmZS5yYWRpdXM8PS41JiYodT1nKSxyLmJlZ2luUGF0aCgpLG49MDtuPGk7bis9MSlmb3Iobz0wO288aTtvKz0xKXUodCxyLGUsZS5sZWZ0K28qYSxlLnRvcCtuKmEsYSxuLG8pO2lmKGMoZS5maWxsKSl7ci5zdHJva2VTdHlsZT1cInJnYmEoMCwwLDAsMC41KVwiLHIubGluZVdpZHRoPTIsci5zdHJva2UoKTt2YXIgZj1yLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbjtyLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbj1cImRlc3RpbmF0aW9uLW91dFwiLHIuZmlsbCgpLHIuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uPWYsci5jbGlwKCksci5kcmF3SW1hZ2UoZS5maWxsLDAsMCxlLnNpemUsZS5zaXplKSxyLnJlc3RvcmUoKX1lbHNlIHIuZmlsbFN0eWxlPWUuZmlsbCxyLmZpbGwoKX0oZSxvLHIpLG59ZnVuY3Rpb24gcih0KXt2YXIgcj1kKFwiPGNhbnZhcy8+XCIpLmF0dHIoXCJ3aWR0aFwiLHQuc2l6ZSkuYXR0cihcImhlaWdodFwiLHQuc2l6ZSk7cmV0dXJuIG4ocix0KX1mdW5jdGlvbiBvKHQpe3JldHVybiBmJiZcImNhbnZhc1wiPT09dC5yZW5kZXI/cih0KTpmJiZcImltYWdlXCI9PT10LnJlbmRlcj9mdW5jdGlvbih0KXtyZXR1cm4gZChcIjxpbWcvPlwiKS5hdHRyKFwic3JjXCIscih0KVswXS50b0RhdGFVUkwoXCJpbWFnZS9wbmdcIikpfSh0KTpmdW5jdGlvbih0KXt2YXIgcj1oKHQudGV4dCx0LmVjTGV2ZWwsdC5taW5WZXJzaW9uLHQubWF4VmVyc2lvbix0LnF1aWV0KTtpZighcilyZXR1cm4gbnVsbDt2YXIgZSxuLG89dC5zaXplLGk9dC5iYWNrZ3JvdW5kLGE9TWF0aC5mbG9vcix1PXIubW9kdWxlX2NvdW50LGY9YShvL3UpLGM9YSguNSooby1mKnUpKSxsPXtwb3NpdGlvbjpcInJlbGF0aXZlXCIsbGVmdDowLHRvcDowLHBhZGRpbmc6MCxtYXJnaW46MCx3aWR0aDpvLGhlaWdodDpvfSxnPXtwb3NpdGlvbjpcImFic29sdXRlXCIscGFkZGluZzowLG1hcmdpbjowLHdpZHRoOmYsaGVpZ2h0OmYsXCJiYWNrZ3JvdW5kLWNvbG9yXCI6dC5maWxsfSxzPWQoXCI8ZGl2Lz5cIikuZGF0YShcInFyY29kZVwiLHIpLmNzcyhsKTtmb3IoaSYmcy5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsaSksZT0wO2U8dTtlKz0xKWZvcihuPTA7bjx1O24rPTEpci5pc19kYXJrKGUsbikmJmQoXCI8ZGl2Lz5cIikuY3NzKGcpLmNzcyh7bGVmdDpjK24qZix0b3A6YytlKmZ9KS5hcHBlbmRUbyhzKTtyZXR1cm4gc30odCl9dmFyIGUsdT10LndpbmRvdyxkPXUualF1ZXJ5LGY9ISghKGU9dS5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpKS5nZXRDb250ZXh0fHwhZS5nZXRDb250ZXh0KFwiMmRcIikpLHM9e3JlbmRlcjpcImNhbnZhc1wiLG1pblZlcnNpb246MSxtYXhWZXJzaW9uOjQwLGVjTGV2ZWw6XCJMXCIsbGVmdDowLHRvcDowLHNpemU6MjAwLGZpbGw6XCIjMDAwXCIsYmFja2dyb3VuZDpcIiNmZmZcIix0ZXh0Olwibm8gdGV4dFwiLHJhZGl1czowLHF1aWV0OjAsbW9kZTowLG1TaXplOi4xLG1Qb3NYOi41LG1Qb3NZOi41LGxhYmVsOlwibm8gbGFiZWxcIixmb250bmFtZTpcInNhbnNcIixmb250Y29sb3I6XCIjMDAwXCIsaW1hZ2U6bnVsbH07ZC5mbi5xcmNvZGU9di5leHBvcnRzPWZ1bmN0aW9uKHQpe3ZhciBlPWQuZXh0ZW5kKHt9LHMsdCk7cmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbih0LHIpe1wiY2FudmFzXCI9PT1yLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk/bihyLGUpOmQocikuYXBwZW5kKG8oZSkpfSl9fSkuY2FsbCh0aGlzLHAoMSkpfSxmdW5jdGlvbih0LHIpe3ZhciBlO2U9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpc30oKTt0cnl7ZT1lfHxuZXcgRnVuY3Rpb24oXCJyZXR1cm4gdGhpc1wiKSgpfWNhdGNoKHQpe1wib2JqZWN0XCI9PXR5cGVvZiB3aW5kb3cmJihlPXdpbmRvdyl9dC5leHBvcnRzPWV9LGZ1bmN0aW9uKHQscixlKXt2YXIgbixvLGksYT1mdW5jdGlvbigpe2Z1bmN0aW9uIGkodCxyKXtmdW5jdGlvbiBhKHQscil7bD1mdW5jdGlvbih0KXtmb3IodmFyIHI9bmV3IEFycmF5KHQpLGU9MDtlPHQ7ZSs9MSl7cltlXT1uZXcgQXJyYXkodCk7Zm9yKHZhciBuPTA7bjx0O24rPTEpcltlXVtuXT1udWxsfXJldHVybiByfShnPTQqdSsxNyksZSgwLDApLGUoZy03LDApLGUoMCxnLTcpLGkoKSxvKCksZCh0LHIpLDc8PXUmJnModCksbnVsbD09biYmKG49cCh1LGYsYykpLHYobixyKX12YXIgdT10LGY9d1tyXSxsPW51bGwsZz0wLG49bnVsbCxjPVtdLGg9e30sZT1mdW5jdGlvbih0LHIpe2Zvcih2YXIgZT0tMTtlPD03O2UrPTEpaWYoISh0K2U8PS0xfHxnPD10K2UpKWZvcih2YXIgbj0tMTtuPD03O24rPTEpcituPD0tMXx8Zzw9citufHwobFt0K2VdW3Irbl09MDw9ZSYmZTw9NiYmKDA9PW58fDY9PW4pfHwwPD1uJiZuPD02JiYoMD09ZXx8Nj09ZSl8fDI8PWUmJmU8PTQmJjI8PW4mJm48PTQpfSxvPWZ1bmN0aW9uKCl7Zm9yKHZhciB0PTg7dDxnLTg7dCs9MSludWxsPT1sW3RdWzZdJiYobFt0XVs2XT10JTI9PTApO2Zvcih2YXIgcj04O3I8Zy04O3IrPTEpbnVsbD09bFs2XVtyXSYmKGxbNl1bcl09ciUyPT0wKX0saT1mdW5jdGlvbigpe2Zvcih2YXIgdD15LmdldFBhdHRlcm5Qb3NpdGlvbih1KSxyPTA7cjx0Lmxlbmd0aDtyKz0xKWZvcih2YXIgZT0wO2U8dC5sZW5ndGg7ZSs9MSl7dmFyIG49dFtyXSxvPXRbZV07aWYobnVsbD09bFtuXVtvXSlmb3IodmFyIGk9LTI7aTw9MjtpKz0xKWZvcih2YXIgYT0tMjthPD0yO2ErPTEpbFtuK2ldW28rYV09LTI9PWl8fDI9PWl8fC0yPT1hfHwyPT1hfHwwPT1pJiYwPT1hfX0scz1mdW5jdGlvbih0KXtmb3IodmFyIHI9eS5nZXRCQ0hUeXBlTnVtYmVyKHUpLGU9MDtlPDE4O2UrPTEpe3ZhciBuPSF0JiYxPT0ocj4+ZSYxKTtsW01hdGguZmxvb3IoZS8zKV1bZSUzK2ctOC0zXT1ufWZvcihlPTA7ZTwxODtlKz0xKXtuPSF0JiYxPT0ocj4+ZSYxKTtsW2UlMytnLTgtM11bTWF0aC5mbG9vcihlLzMpXT1ufX0sZD1mdW5jdGlvbih0LHIpe2Zvcih2YXIgZT1mPDwzfHIsbj15LmdldEJDSFR5cGVJbmZvKGUpLG89MDtvPDE1O28rPTEpe3ZhciBpPSF0JiYxPT0obj4+byYxKTtvPDY/bFtvXVs4XT1pOm88OD9sW28rMV1bOF09aTpsW2ctMTUrb11bOF09aX1mb3Iobz0wO288MTU7bys9MSl7aT0hdCYmMT09KG4+Pm8mMSk7bzw4P2xbOF1bZy1vLTFdPWk6bzw5P2xbOF1bMTUtby0xKzFdPWk6bFs4XVsxNS1vLTFdPWl9bFtnLThdWzhdPSF0fSx2PWZ1bmN0aW9uKHQscil7Zm9yKHZhciBlPS0xLG49Zy0xLG89NyxpPTAsYT15LmdldE1hc2tGdW5jdGlvbihyKSx1PWctMTswPHU7dS09Milmb3IoNj09dSYmKHUtPTEpOzspe2Zvcih2YXIgZj0wO2Y8MjtmKz0xKWlmKG51bGw9PWxbbl1bdS1mXSl7dmFyIGM9ITE7aTx0Lmxlbmd0aCYmKGM9MT09KHRbaV0+Pj5vJjEpKSxhKG4sdS1mKSYmKGM9IWMpLGxbbl1bdS1mXT1jLC0xPT0oby09MSkmJihpKz0xLG89Nyl9aWYoKG4rPWUpPDB8fGc8PW4pe24tPWUsZT0tZTticmVha319fSxwPWZ1bmN0aW9uKHQscixlKXtmb3IodmFyIG49Qy5nZXRSU0Jsb2Nrcyh0LHIpLG89QigpLGk9MDtpPGUubGVuZ3RoO2krPTEpe3ZhciBhPWVbaV07by5wdXQoYS5nZXRNb2RlKCksNCksby5wdXQoYS5nZXRMZW5ndGgoKSx5LmdldExlbmd0aEluQml0cyhhLmdldE1vZGUoKSx0KSksYS53cml0ZShvKX12YXIgdT0wO2ZvcihpPTA7aTxuLmxlbmd0aDtpKz0xKXUrPW5baV0uZGF0YUNvdW50O2lmKG8uZ2V0TGVuZ3RoSW5CaXRzKCk+OCp1KXRocm93XCJjb2RlIGxlbmd0aCBvdmVyZmxvdy4gKFwiK28uZ2V0TGVuZ3RoSW5CaXRzKCkrXCI+XCIrOCp1K1wiKVwiO2ZvcihvLmdldExlbmd0aEluQml0cygpKzQ8PTgqdSYmby5wdXQoMCw0KTtvLmdldExlbmd0aEluQml0cygpJTghPTA7KW8ucHV0Qml0KCExKTtmb3IoOyEoby5nZXRMZW5ndGhJbkJpdHMoKT49OCp1fHwoby5wdXQoMjM2LDgpLG8uZ2V0TGVuZ3RoSW5CaXRzKCk+PTgqdSkpOylvLnB1dCgxNyw4KTtyZXR1cm4gZnVuY3Rpb24odCxyKXtmb3IodmFyIGU9MCxuPTAsbz0wLGk9bmV3IEFycmF5KHIubGVuZ3RoKSxhPW5ldyBBcnJheShyLmxlbmd0aCksdT0wO3U8ci5sZW5ndGg7dSs9MSl7dmFyIGY9clt1XS5kYXRhQ291bnQsYz1yW3VdLnRvdGFsQ291bnQtZjtuPU1hdGgubWF4KG4sZiksbz1NYXRoLm1heChvLGMpLGlbdV09bmV3IEFycmF5KGYpO2Zvcih2YXIgbD0wO2w8aVt1XS5sZW5ndGg7bCs9MSlpW3VdW2xdPTI1NSZ0LmdldEJ1ZmZlcigpW2wrZV07ZSs9Zjt2YXIgZz15LmdldEVycm9yQ29ycmVjdFBvbHlub21pYWwoYykscz1tKGlbdV0sZy5nZXRMZW5ndGgoKS0xKS5tb2QoZyk7Zm9yKGFbdV09bmV3IEFycmF5KGcuZ2V0TGVuZ3RoKCktMSksbD0wO2w8YVt1XS5sZW5ndGg7bCs9MSl7dmFyIGg9bCtzLmdldExlbmd0aCgpLWFbdV0ubGVuZ3RoO2FbdV1bbF09MDw9aD9zLmdldEF0KGgpOjB9fXZhciBkPTA7Zm9yKGw9MDtsPHIubGVuZ3RoO2wrPTEpZCs9cltsXS50b3RhbENvdW50O3ZhciB2PW5ldyBBcnJheShkKSxwPTA7Zm9yKGw9MDtsPG47bCs9MSlmb3IodT0wO3U8ci5sZW5ndGg7dSs9MSlsPGlbdV0ubGVuZ3RoJiYodltwXT1pW3VdW2xdLHArPTEpO2ZvcihsPTA7bDxvO2wrPTEpZm9yKHU9MDt1PHIubGVuZ3RoO3UrPTEpbDxhW3VdLmxlbmd0aCYmKHZbcF09YVt1XVtsXSxwKz0xKTtyZXR1cm4gdn0obyxuKX07cmV0dXJuIGguYWRkRGF0YT1mdW5jdGlvbih0LHIpe3ZhciBlPW51bGw7c3dpdGNoKHI9cnx8XCJCeXRlXCIpe2Nhc2VcIk51bWVyaWNcIjplPXgodCk7YnJlYWs7Y2FzZVwiQWxwaGFudW1lcmljXCI6ZT1UKHQpO2JyZWFrO2Nhc2VcIkJ5dGVcIjplPU0odCk7YnJlYWs7Y2FzZVwiS2FuamlcIjplPUEodCk7YnJlYWs7ZGVmYXVsdDp0aHJvd1wibW9kZTpcIityfWMucHVzaChlKSxuPW51bGx9LGguaXNEYXJrPWZ1bmN0aW9uKHQscil7aWYodDwwfHxnPD10fHxyPDB8fGc8PXIpdGhyb3cgdCtcIixcIityO3JldHVybiBsW3RdW3JdfSxoLmdldE1vZHVsZUNvdW50PWZ1bmN0aW9uKCl7cmV0dXJuIGd9LGgubWFrZT1mdW5jdGlvbigpe2lmKHU8MSl7Zm9yKHZhciB0PTE7dDw0MDt0Kyspe2Zvcih2YXIgcj1DLmdldFJTQmxvY2tzKHQsZiksZT1CKCksbj0wO248Yy5sZW5ndGg7bisrKXt2YXIgbz1jW25dO2UucHV0KG8uZ2V0TW9kZSgpLDQpLGUucHV0KG8uZ2V0TGVuZ3RoKCkseS5nZXRMZW5ndGhJbkJpdHMoby5nZXRNb2RlKCksdCkpLG8ud3JpdGUoZSl9dmFyIGk9MDtmb3Iobj0wO248ci5sZW5ndGg7bisrKWkrPXJbbl0uZGF0YUNvdW50O2lmKGUuZ2V0TGVuZ3RoSW5CaXRzKCk8PTgqaSlicmVha311PXR9YSghMSxmdW5jdGlvbigpe2Zvcih2YXIgdD0wLHI9MCxlPTA7ZTw4O2UrPTEpe2EoITAsZSk7dmFyIG49eS5nZXRMb3N0UG9pbnQoaCk7KDA9PWV8fG48dCkmJih0PW4scj1lKX1yZXR1cm4gcn0oKSl9LGguY3JlYXRlVGFibGVUYWc9ZnVuY3Rpb24odCxyKXt0PXR8fDI7dmFyIGU9XCJcIjtlKz0nPHRhYmxlIHN0eWxlPVwiJyxlKz1cIiBib3JkZXItd2lkdGg6IDBweDsgYm9yZGVyLXN0eWxlOiBub25lO1wiLGUrPVwiIGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7XCIsZSs9XCIgcGFkZGluZzogMHB4OyBtYXJnaW46IFwiKyhyPXZvaWQgMD09PXI/NCp0OnIpK1wicHg7XCIsZSs9J1wiPicsZSs9XCI8dGJvZHk+XCI7Zm9yKHZhciBuPTA7bjxoLmdldE1vZHVsZUNvdW50KCk7bis9MSl7ZSs9XCI8dHI+XCI7Zm9yKHZhciBvPTA7bzxoLmdldE1vZHVsZUNvdW50KCk7bys9MSllKz0nPHRkIHN0eWxlPVwiJyxlKz1cIiBib3JkZXItd2lkdGg6IDBweDsgYm9yZGVyLXN0eWxlOiBub25lO1wiLGUrPVwiIGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7XCIsZSs9XCIgcGFkZGluZzogMHB4OyBtYXJnaW46IDBweDtcIixlKz1cIiB3aWR0aDogXCIrdCtcInB4O1wiLGUrPVwiIGhlaWdodDogXCIrdCtcInB4O1wiLGUrPVwiIGJhY2tncm91bmQtY29sb3I6IFwiLGUrPWguaXNEYXJrKG4sbyk/XCIjMDAwMDAwXCI6XCIjZmZmZmZmXCIsZSs9XCI7XCIsZSs9J1wiLz4nO2UrPVwiPC90cj5cIn1yZXR1cm4gZSs9XCI8L3Rib2R5PlwiLGUrPVwiPC90YWJsZT5cIn0saC5jcmVhdGVTdmdUYWc9ZnVuY3Rpb24odCxyKXt2YXIgZT17fTtcIm9iamVjdFwiPT10eXBlb2YgdCYmKHQ9KGU9dCkuY2VsbFNpemUscj1lLm1hcmdpbiksdD10fHwyLHI9dm9pZCAwPT09cj80KnQ6cjt2YXIgbixvLGksYSx1PWguZ2V0TW9kdWxlQ291bnQoKSp0KzIqcixmPVwiXCI7Zm9yKGE9XCJsXCIrdCtcIiwwIDAsXCIrdCtcIiAtXCIrdCtcIiwwIDAsLVwiK3QrXCJ6IFwiLGYrPSc8c3ZnIHZlcnNpb249XCIxLjFcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCInLGYrPWUuc2NhbGFibGU/XCJcIjonIHdpZHRoPVwiJyt1KydweFwiIGhlaWdodD1cIicrdSsncHhcIicsZis9JyB2aWV3Qm94PVwiMCAwICcrdStcIiBcIit1KydcIiAnLGYrPScgcHJlc2VydmVBc3BlY3RSYXRpbz1cInhNaW5ZTWluIG1lZXRcIj4nLGYrPSc8cmVjdCB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9XCIxMDAlXCIgZmlsbD1cIndoaXRlXCIgY3g9XCIwXCIgY3k9XCIwXCIvPicsZis9JzxwYXRoIGQ9XCInLG89MDtvPGguZ2V0TW9kdWxlQ291bnQoKTtvKz0xKWZvcihpPW8qdCtyLG49MDtuPGguZ2V0TW9kdWxlQ291bnQoKTtuKz0xKWguaXNEYXJrKG8sbikmJihmKz1cIk1cIisobip0K3IpK1wiLFwiK2krYSk7cmV0dXJuIGYrPSdcIiBzdHJva2U9XCJ0cmFuc3BhcmVudFwiIGZpbGw9XCJibGFja1wiLz4nLGYrPVwiPC9zdmc+XCJ9LGguY3JlYXRlRGF0YVVSTD1mdW5jdGlvbihvLHQpe289b3x8Mix0PXZvaWQgMD09PXQ/NCpvOnQ7dmFyIHI9aC5nZXRNb2R1bGVDb3VudCgpKm8rMip0LGk9dCxhPXItdDtyZXR1cm4gTChyLHIsZnVuY3Rpb24odCxyKXtpZihpPD10JiZ0PGEmJmk8PXImJnI8YSl7dmFyIGU9TWF0aC5mbG9vcigodC1pKS9vKSxuPU1hdGguZmxvb3IoKHItaSkvbyk7cmV0dXJuIGguaXNEYXJrKG4sZSk/MDoxfXJldHVybiAxfSl9LGguY3JlYXRlSW1nVGFnPWZ1bmN0aW9uKHQscixlKXt0PXR8fDIscj12b2lkIDA9PT1yPzQqdDpyO3ZhciBuPWguZ2V0TW9kdWxlQ291bnQoKSp0KzIqcixvPVwiXCI7cmV0dXJuIG8rPVwiPGltZ1wiLG8rPScgc3JjPVwiJyxvKz1oLmNyZWF0ZURhdGFVUkwodCxyKSxvKz0nXCInLG8rPScgd2lkdGg9XCInLG8rPW4sbys9J1wiJyxvKz0nIGhlaWdodD1cIicsbys9bixvKz0nXCInLGUmJihvKz0nIGFsdD1cIicsbys9ZSxvKz0nXCInKSxvKz1cIi8+XCJ9LGguY3JlYXRlQVNDSUk9ZnVuY3Rpb24odCxyKXtpZigodD10fHwxKTwyKXJldHVybiBmdW5jdGlvbih0KXt0PXZvaWQgMD09PXQ/Mjp0O3ZhciByLGUsbixvLGksYT0xKmguZ2V0TW9kdWxlQ291bnQoKSsyKnQsdT10LGY9YS10LGM9e1wi4paI4paIXCI6XCLilohcIixcIuKWiCBcIjpcIuKWgFwiLFwiIOKWiFwiOlwi4paEXCIsXCIgIFwiOlwiIFwifSxsPXtcIuKWiOKWiFwiOlwi4paAXCIsXCLiloggXCI6XCLiloBcIixcIiDilohcIjpcIiBcIixcIiAgXCI6XCIgXCJ9LGc9XCJcIjtmb3Iocj0wO3I8YTtyKz0yKXtmb3Iobj1NYXRoLmZsb29yKChyLXUpLzEpLG89TWF0aC5mbG9vcigocisxLXUpLzEpLGU9MDtlPGE7ZSs9MSlpPVwi4paIXCIsdTw9ZSYmZTxmJiZ1PD1yJiZyPGYmJmguaXNEYXJrKG4sTWF0aC5mbG9vcigoZS11KS8xKSkmJihpPVwiIFwiKSx1PD1lJiZlPGYmJnU8PXIrMSYmcisxPGYmJmguaXNEYXJrKG8sTWF0aC5mbG9vcigoZS11KS8xKSk/aSs9XCIgXCI6aSs9XCLilohcIixnKz10PDEmJmY8PXIrMT9sW2ldOmNbaV07Zys9XCJcXG5cIn1yZXR1cm4gYSUyJiYwPHQ/Zy5zdWJzdHJpbmcoMCxnLmxlbmd0aC1hLTEpK0FycmF5KDErYSkuam9pbihcIuKWgFwiKTpnLnN1YnN0cmluZygwLGcubGVuZ3RoLTEpfShyKTt0LT0xLHI9dm9pZCAwPT09cj8yKnQ6cjt2YXIgZSxuLG8saSxhPWguZ2V0TW9kdWxlQ291bnQoKSp0KzIqcix1PXIsZj1hLXIsYz1BcnJheSh0KzEpLmpvaW4oXCLilojilohcIiksbD1BcnJheSh0KzEpLmpvaW4oXCIgIFwiKSxnPVwiXCIscz1cIlwiO2ZvcihlPTA7ZTxhO2UrPTEpe2ZvcihvPU1hdGguZmxvb3IoKGUtdSkvdCkscz1cIlwiLG49MDtuPGE7bis9MSlpPTEsdTw9biYmbjxmJiZ1PD1lJiZlPGYmJmguaXNEYXJrKG8sTWF0aC5mbG9vcigobi11KS90KSkmJihpPTApLHMrPWk/YzpsO2ZvcihvPTA7bzx0O28rPTEpZys9cytcIlxcblwifXJldHVybiBnLnN1YnN0cmluZygwLGcubGVuZ3RoLTEpfSxoLnJlbmRlclRvMmRDb250ZXh0PWZ1bmN0aW9uKHQscil7cj1yfHwyO2Zvcih2YXIgZT1oLmdldE1vZHVsZUNvdW50KCksbj0wO248ZTtuKyspZm9yKHZhciBvPTA7bzxlO28rKyl0LmZpbGxTdHlsZT1oLmlzRGFyayhuLG8pP1wiYmxhY2tcIjpcIndoaXRlXCIsdC5maWxsUmVjdChuKnIsbypyLHIscil9LGh9aS5zdHJpbmdUb0J5dGVzPShpLnN0cmluZ1RvQnl0ZXNGdW5jcz17ZGVmYXVsdDpmdW5jdGlvbih0KXtmb3IodmFyIHI9W10sZT0wO2U8dC5sZW5ndGg7ZSs9MSl7dmFyIG49dC5jaGFyQ29kZUF0KGUpO3IucHVzaCgyNTUmbil9cmV0dXJuIHJ9fSkuZGVmYXVsdCxpLmNyZWF0ZVN0cmluZ1RvQnl0ZXM9ZnVuY3Rpb24odSxmKXt2YXIgaT1mdW5jdGlvbigpe2Z1bmN0aW9uIHQoKXt2YXIgdD1yLnJlYWQoKTtpZigtMT09dCl0aHJvd1wiZW9mXCI7cmV0dXJuIHR9Zm9yKHZhciByPVModSksZT0wLG49e307Oyl7dmFyIG89ci5yZWFkKCk7aWYoLTE9PW8pYnJlYWs7dmFyIGk9dCgpLGE9dCgpPDw4fHQoKTtuW1N0cmluZy5mcm9tQ2hhckNvZGUobzw8OHxpKV09YSxlKz0xfWlmKGUhPWYpdGhyb3cgZStcIiAhPSBcIitmO3JldHVybiBufSgpLGE9XCI/XCIuY2hhckNvZGVBdCgwKTtyZXR1cm4gZnVuY3Rpb24odCl7Zm9yKHZhciByPVtdLGU9MDtlPHQubGVuZ3RoO2UrPTEpe3ZhciBuPXQuY2hhckNvZGVBdChlKTtpZihuPDEyOClyLnB1c2gobik7ZWxzZXt2YXIgbz1pW3QuY2hhckF0KGUpXTtcIm51bWJlclwiPT10eXBlb2Ygbz8oMjU1Jm8pPT1vP3IucHVzaChvKTooci5wdXNoKG8+Pj44KSxyLnB1c2goMjU1Jm8pKTpyLnB1c2goYSl9fXJldHVybiByfX07dmFyIGE9MSx1PTIsbz00LGY9OCx3PXtMOjEsTTowLFE6MyxIOjJ9LG49MCxjPTEsbD0yLGc9MyxzPTQsaD01LGQ9Nix2PTcseT1mdW5jdGlvbigpe2Z1bmN0aW9uIGUodCl7Zm9yKHZhciByPTA7MCE9dDspcis9MSx0Pj4+PTE7cmV0dXJuIHJ9dmFyIHI9W1tdLFs2LDE4XSxbNiwyMl0sWzYsMjZdLFs2LDMwXSxbNiwzNF0sWzYsMjIsMzhdLFs2LDI0LDQyXSxbNiwyNiw0Nl0sWzYsMjgsNTBdLFs2LDMwLDU0XSxbNiwzMiw1OF0sWzYsMzQsNjJdLFs2LDI2LDQ2LDY2XSxbNiwyNiw0OCw3MF0sWzYsMjYsNTAsNzRdLFs2LDMwLDU0LDc4XSxbNiwzMCw1Niw4Ml0sWzYsMzAsNTgsODZdLFs2LDM0LDYyLDkwXSxbNiwyOCw1MCw3Miw5NF0sWzYsMjYsNTAsNzQsOThdLFs2LDMwLDU0LDc4LDEwMl0sWzYsMjgsNTQsODAsMTA2XSxbNiwzMiw1OCw4NCwxMTBdLFs2LDMwLDU4LDg2LDExNF0sWzYsMzQsNjIsOTAsMTE4XSxbNiwyNiw1MCw3NCw5OCwxMjJdLFs2LDMwLDU0LDc4LDEwMiwxMjZdLFs2LDI2LDUyLDc4LDEwNCwxMzBdLFs2LDMwLDU2LDgyLDEwOCwxMzRdLFs2LDM0LDYwLDg2LDExMiwxMzhdLFs2LDMwLDU4LDg2LDExNCwxNDJdLFs2LDM0LDYyLDkwLDExOCwxNDZdLFs2LDMwLDU0LDc4LDEwMiwxMjYsMTUwXSxbNiwyNCw1MCw3NiwxMDIsMTI4LDE1NF0sWzYsMjgsNTQsODAsMTA2LDEzMiwxNThdLFs2LDMyLDU4LDg0LDExMCwxMzYsMTYyXSxbNiwyNiw1NCw4MiwxMTAsMTM4LDE2Nl0sWzYsMzAsNTgsODYsMTE0LDE0MiwxNzBdXSx0PXt9O3JldHVybiB0LmdldEJDSFR5cGVJbmZvPWZ1bmN0aW9uKHQpe2Zvcih2YXIgcj10PDwxMDswPD1lKHIpLWUoMTMzNSk7KXJePTEzMzU8PGUociktZSgxMzM1KTtyZXR1cm4gMjE1MjJeKHQ8PDEwfHIpfSx0LmdldEJDSFR5cGVOdW1iZXI9ZnVuY3Rpb24odCl7Zm9yKHZhciByPXQ8PDEyOzA8PWUociktZSg3OTczKTspcl49Nzk3Mzw8ZShyKS1lKDc5NzMpO3JldHVybiB0PDwxMnxyfSx0LmdldFBhdHRlcm5Qb3NpdGlvbj1mdW5jdGlvbih0KXtyZXR1cm4gclt0LTFdfSx0LmdldE1hc2tGdW5jdGlvbj1mdW5jdGlvbih0KXtzd2l0Y2godCl7Y2FzZSBuOnJldHVybiBmdW5jdGlvbih0LHIpe3JldHVybih0K3IpJTI9PTB9O2Nhc2UgYzpyZXR1cm4gZnVuY3Rpb24odCxyKXtyZXR1cm4gdCUyPT0wfTtjYXNlIGw6cmV0dXJuIGZ1bmN0aW9uKHQscil7cmV0dXJuIHIlMz09MH07Y2FzZSBnOnJldHVybiBmdW5jdGlvbih0LHIpe3JldHVybih0K3IpJTM9PTB9O2Nhc2UgczpyZXR1cm4gZnVuY3Rpb24odCxyKXtyZXR1cm4oTWF0aC5mbG9vcih0LzIpK01hdGguZmxvb3Ioci8zKSklMj09MH07Y2FzZSBoOnJldHVybiBmdW5jdGlvbih0LHIpe3JldHVybiB0KnIlMit0KnIlMz09MH07Y2FzZSBkOnJldHVybiBmdW5jdGlvbih0LHIpe3JldHVybih0KnIlMit0KnIlMyklMj09MH07Y2FzZSB2OnJldHVybiBmdW5jdGlvbih0LHIpe3JldHVybih0KnIlMysodCtyKSUyKSUyPT0wfTtkZWZhdWx0OnRocm93XCJiYWQgbWFza1BhdHRlcm46XCIrdH19LHQuZ2V0RXJyb3JDb3JyZWN0UG9seW5vbWlhbD1mdW5jdGlvbih0KXtmb3IodmFyIHI9bShbMV0sMCksZT0wO2U8dDtlKz0xKXI9ci5tdWx0aXBseShtKFsxLHAuZ2V4cChlKV0sMCkpO3JldHVybiByfSx0LmdldExlbmd0aEluQml0cz1mdW5jdGlvbih0LHIpe2lmKDE8PXImJnI8MTApc3dpdGNoKHQpe2Nhc2UgYTpyZXR1cm4gMTA7Y2FzZSB1OnJldHVybiA5O2Nhc2UgbzpjYXNlIGY6cmV0dXJuIDg7ZGVmYXVsdDp0aHJvd1wibW9kZTpcIit0fWVsc2UgaWYocjwyNylzd2l0Y2godCl7Y2FzZSBhOnJldHVybiAxMjtjYXNlIHU6cmV0dXJuIDExO2Nhc2UgbzpyZXR1cm4gMTY7Y2FzZSBmOnJldHVybiAxMDtkZWZhdWx0OnRocm93XCJtb2RlOlwiK3R9ZWxzZXtpZighKHI8NDEpKXRocm93XCJ0eXBlOlwiK3I7c3dpdGNoKHQpe2Nhc2UgYTpyZXR1cm4gMTQ7Y2FzZSB1OnJldHVybiAxMztjYXNlIG86cmV0dXJuIDE2O2Nhc2UgZjpyZXR1cm4gMTI7ZGVmYXVsdDp0aHJvd1wibW9kZTpcIit0fX19LHQuZ2V0TG9zdFBvaW50PWZ1bmN0aW9uKHQpe2Zvcih2YXIgcj10LmdldE1vZHVsZUNvdW50KCksZT0wLG49MDtuPHI7bis9MSlmb3IodmFyIG89MDtvPHI7bys9MSl7Zm9yKHZhciBpPTAsYT10LmlzRGFyayhuLG8pLHU9LTE7dTw9MTt1Kz0xKWlmKCEobit1PDB8fHI8PW4rdSkpZm9yKHZhciBmPS0xO2Y8PTE7Zis9MSlvK2Y8MHx8cjw9bytmfHwwPT11JiYwPT1mfHxhPT10LmlzRGFyayhuK3UsbytmKSYmKGkrPTEpOzU8aSYmKGUrPTMraS01KX1mb3Iobj0wO248ci0xO24rPTEpZm9yKG89MDtvPHItMTtvKz0xKXt2YXIgYz0wO3QuaXNEYXJrKG4sbykmJihjKz0xKSx0LmlzRGFyayhuKzEsbykmJihjKz0xKSx0LmlzRGFyayhuLG8rMSkmJihjKz0xKSx0LmlzRGFyayhuKzEsbysxKSYmKGMrPTEpLDAhPWMmJjQhPWN8fChlKz0zKX1mb3Iobj0wO248cjtuKz0xKWZvcihvPTA7bzxyLTY7bys9MSl0LmlzRGFyayhuLG8pJiYhdC5pc0RhcmsobixvKzEpJiZ0LmlzRGFyayhuLG8rMikmJnQuaXNEYXJrKG4sbyszKSYmdC5pc0RhcmsobixvKzQpJiYhdC5pc0RhcmsobixvKzUpJiZ0LmlzRGFyayhuLG8rNikmJihlKz00MCk7Zm9yKG89MDtvPHI7bys9MSlmb3Iobj0wO248ci02O24rPTEpdC5pc0RhcmsobixvKSYmIXQuaXNEYXJrKG4rMSxvKSYmdC5pc0RhcmsobisyLG8pJiZ0LmlzRGFyayhuKzMsbykmJnQuaXNEYXJrKG4rNCxvKSYmIXQuaXNEYXJrKG4rNSxvKSYmdC5pc0Rhcmsobis2LG8pJiYoZSs9NDApO3ZhciBsPTA7Zm9yKG89MDtvPHI7bys9MSlmb3Iobj0wO248cjtuKz0xKXQuaXNEYXJrKG4sbykmJihsKz0xKTtyZXR1cm4gZSs9MTAqKE1hdGguYWJzKDEwMCpsL3Ivci01MCkvNSl9LHR9KCkscD1mdW5jdGlvbigpe2Zvcih2YXIgcj1uZXcgQXJyYXkoMjU2KSxlPW5ldyBBcnJheSgyNTYpLHQ9MDt0PDg7dCs9MSlyW3RdPTE8PHQ7Zm9yKHQ9ODt0PDI1Njt0Kz0xKXJbdF09clt0LTRdXnJbdC01XV5yW3QtNl1eclt0LThdO2Zvcih0PTA7dDwyNTU7dCs9MSllW3JbdF1dPXQ7dmFyIG49e2dsb2c6ZnVuY3Rpb24odCl7aWYodDwxKXRocm93XCJnbG9nKFwiK3QrXCIpXCI7cmV0dXJuIGVbdF19LGdleHA6ZnVuY3Rpb24odCl7Zm9yKDt0PDA7KXQrPTI1NTtmb3IoOzI1Njw9dDspdC09MjU1O3JldHVybiByW3RdfX07cmV0dXJuIG59KCk7ZnVuY3Rpb24gbShuLG8pe2lmKHZvaWQgMD09PW4ubGVuZ3RoKXRocm93IG4ubGVuZ3RoK1wiL1wiK287dmFyIHI9ZnVuY3Rpb24oKXtmb3IodmFyIHQ9MDt0PG4ubGVuZ3RoJiYwPT1uW3RdOyl0Kz0xO2Zvcih2YXIgcj1uZXcgQXJyYXkobi5sZW5ndGgtdCtvKSxlPTA7ZTxuLmxlbmd0aC10O2UrPTEpcltlXT1uW2UrdF07cmV0dXJuIHJ9KCksaT17Z2V0QXQ6ZnVuY3Rpb24odCl7cmV0dXJuIHJbdF19LGdldExlbmd0aDpmdW5jdGlvbigpe3JldHVybiByLmxlbmd0aH0sbXVsdGlwbHk6ZnVuY3Rpb24odCl7Zm9yKHZhciByPW5ldyBBcnJheShpLmdldExlbmd0aCgpK3QuZ2V0TGVuZ3RoKCktMSksZT0wO2U8aS5nZXRMZW5ndGgoKTtlKz0xKWZvcih2YXIgbj0wO248dC5nZXRMZW5ndGgoKTtuKz0xKXJbZStuXV49cC5nZXhwKHAuZ2xvZyhpLmdldEF0KGUpKStwLmdsb2codC5nZXRBdChuKSkpO3JldHVybiBtKHIsMCl9LG1vZDpmdW5jdGlvbih0KXtpZihpLmdldExlbmd0aCgpLXQuZ2V0TGVuZ3RoKCk8MClyZXR1cm4gaTtmb3IodmFyIHI9cC5nbG9nKGkuZ2V0QXQoMCkpLXAuZ2xvZyh0LmdldEF0KDApKSxlPW5ldyBBcnJheShpLmdldExlbmd0aCgpKSxuPTA7bjxpLmdldExlbmd0aCgpO24rPTEpZVtuXT1pLmdldEF0KG4pO2ZvcihuPTA7bjx0LmdldExlbmd0aCgpO24rPTEpZVtuXV49cC5nZXhwKHAuZ2xvZyh0LmdldEF0KG4pKStyKTtyZXR1cm4gbShlLDApLm1vZCh0KX19O3JldHVybiBpfWZ1bmN0aW9uIGIoKXt2YXIgZT1bXSxvPXt3cml0ZUJ5dGU6ZnVuY3Rpb24odCl7ZS5wdXNoKDI1NSZ0KX0sd3JpdGVTaG9ydDpmdW5jdGlvbih0KXtvLndyaXRlQnl0ZSh0KSxvLndyaXRlQnl0ZSh0Pj4+OCl9LHdyaXRlQnl0ZXM6ZnVuY3Rpb24odCxyLGUpe3I9cnx8MCxlPWV8fHQubGVuZ3RoO2Zvcih2YXIgbj0wO248ZTtuKz0xKW8ud3JpdGVCeXRlKHRbbityXSl9LHdyaXRlU3RyaW5nOmZ1bmN0aW9uKHQpe2Zvcih2YXIgcj0wO3I8dC5sZW5ndGg7cis9MSlvLndyaXRlQnl0ZSh0LmNoYXJDb2RlQXQocikpfSx0b0J5dGVBcnJheTpmdW5jdGlvbigpe3JldHVybiBlfSx0b1N0cmluZzpmdW5jdGlvbigpe3ZhciB0PVwiXCI7dCs9XCJbXCI7Zm9yKHZhciByPTA7cjxlLmxlbmd0aDtyKz0xKTA8ciYmKHQrPVwiLFwiKSx0Kz1lW3JdO3JldHVybiB0Kz1cIl1cIn19O3JldHVybiBvfXZhciBrLHQsQz0oaz1bWzEsMjYsMTldLFsxLDI2LDE2XSxbMSwyNiwxM10sWzEsMjYsOV0sWzEsNDQsMzRdLFsxLDQ0LDI4XSxbMSw0NCwyMl0sWzEsNDQsMTZdLFsxLDcwLDU1XSxbMSw3MCw0NF0sWzIsMzUsMTddLFsyLDM1LDEzXSxbMSwxMDAsODBdLFsyLDUwLDMyXSxbMiw1MCwyNF0sWzQsMjUsOV0sWzEsMTM0LDEwOF0sWzIsNjcsNDNdLFsyLDMzLDE1LDIsMzQsMTZdLFsyLDMzLDExLDIsMzQsMTJdLFsyLDg2LDY4XSxbNCw0MywyN10sWzQsNDMsMTldLFs0LDQzLDE1XSxbMiw5OCw3OF0sWzQsNDksMzFdLFsyLDMyLDE0LDQsMzMsMTVdLFs0LDM5LDEzLDEsNDAsMTRdLFsyLDEyMSw5N10sWzIsNjAsMzgsMiw2MSwzOV0sWzQsNDAsMTgsMiw0MSwxOV0sWzQsNDAsMTQsMiw0MSwxNV0sWzIsMTQ2LDExNl0sWzMsNTgsMzYsMiw1OSwzN10sWzQsMzYsMTYsNCwzNywxN10sWzQsMzYsMTIsNCwzNywxM10sWzIsODYsNjgsMiw4Nyw2OV0sWzQsNjksNDMsMSw3MCw0NF0sWzYsNDMsMTksMiw0NCwyMF0sWzYsNDMsMTUsMiw0NCwxNl0sWzQsMTAxLDgxXSxbMSw4MCw1MCw0LDgxLDUxXSxbNCw1MCwyMiw0LDUxLDIzXSxbMywzNiwxMiw4LDM3LDEzXSxbMiwxMTYsOTIsMiwxMTcsOTNdLFs2LDU4LDM2LDIsNTksMzddLFs0LDQ2LDIwLDYsNDcsMjFdLFs3LDQyLDE0LDQsNDMsMTVdLFs0LDEzMywxMDddLFs4LDU5LDM3LDEsNjAsMzhdLFs4LDQ0LDIwLDQsNDUsMjFdLFsxMiwzMywxMSw0LDM0LDEyXSxbMywxNDUsMTE1LDEsMTQ2LDExNl0sWzQsNjQsNDAsNSw2NSw0MV0sWzExLDM2LDE2LDUsMzcsMTddLFsxMSwzNiwxMiw1LDM3LDEzXSxbNSwxMDksODcsMSwxMTAsODhdLFs1LDY1LDQxLDUsNjYsNDJdLFs1LDU0LDI0LDcsNTUsMjVdLFsxMSwzNiwxMiw3LDM3LDEzXSxbNSwxMjIsOTgsMSwxMjMsOTldLFs3LDczLDQ1LDMsNzQsNDZdLFsxNSw0MywxOSwyLDQ0LDIwXSxbMyw0NSwxNSwxMyw0NiwxNl0sWzEsMTM1LDEwNyw1LDEzNiwxMDhdLFsxMCw3NCw0NiwxLDc1LDQ3XSxbMSw1MCwyMiwxNSw1MSwyM10sWzIsNDIsMTQsMTcsNDMsMTVdLFs1LDE1MCwxMjAsMSwxNTEsMTIxXSxbOSw2OSw0Myw0LDcwLDQ0XSxbMTcsNTAsMjIsMSw1MSwyM10sWzIsNDIsMTQsMTksNDMsMTVdLFszLDE0MSwxMTMsNCwxNDIsMTE0XSxbMyw3MCw0NCwxMSw3MSw0NV0sWzE3LDQ3LDIxLDQsNDgsMjJdLFs5LDM5LDEzLDE2LDQwLDE0XSxbMywxMzUsMTA3LDUsMTM2LDEwOF0sWzMsNjcsNDEsMTMsNjgsNDJdLFsxNSw1NCwyNCw1LDU1LDI1XSxbMTUsNDMsMTUsMTAsNDQsMTZdLFs0LDE0NCwxMTYsNCwxNDUsMTE3XSxbMTcsNjgsNDJdLFsxNyw1MCwyMiw2LDUxLDIzXSxbMTksNDYsMTYsNiw0NywxN10sWzIsMTM5LDExMSw3LDE0MCwxMTJdLFsxNyw3NCw0Nl0sWzcsNTQsMjQsMTYsNTUsMjVdLFszNCwzNywxM10sWzQsMTUxLDEyMSw1LDE1MiwxMjJdLFs0LDc1LDQ3LDE0LDc2LDQ4XSxbMTEsNTQsMjQsMTQsNTUsMjVdLFsxNiw0NSwxNSwxNCw0NiwxNl0sWzYsMTQ3LDExNyw0LDE0OCwxMThdLFs2LDczLDQ1LDE0LDc0LDQ2XSxbMTEsNTQsMjQsMTYsNTUsMjVdLFszMCw0NiwxNiwyLDQ3LDE3XSxbOCwxMzIsMTA2LDQsMTMzLDEwN10sWzgsNzUsNDcsMTMsNzYsNDhdLFs3LDU0LDI0LDIyLDU1LDI1XSxbMjIsNDUsMTUsMTMsNDYsMTZdLFsxMCwxNDIsMTE0LDIsMTQzLDExNV0sWzE5LDc0LDQ2LDQsNzUsNDddLFsyOCw1MCwyMiw2LDUxLDIzXSxbMzMsNDYsMTYsNCw0NywxN10sWzgsMTUyLDEyMiw0LDE1MywxMjNdLFsyMiw3Myw0NSwzLDc0LDQ2XSxbOCw1MywyMywyNiw1NCwyNF0sWzEyLDQ1LDE1LDI4LDQ2LDE2XSxbMywxNDcsMTE3LDEwLDE0OCwxMThdLFszLDczLDQ1LDIzLDc0LDQ2XSxbNCw1NCwyNCwzMSw1NSwyNV0sWzExLDQ1LDE1LDMxLDQ2LDE2XSxbNywxNDYsMTE2LDcsMTQ3LDExN10sWzIxLDczLDQ1LDcsNzQsNDZdLFsxLDUzLDIzLDM3LDU0LDI0XSxbMTksNDUsMTUsMjYsNDYsMTZdLFs1LDE0NSwxMTUsMTAsMTQ2LDExNl0sWzE5LDc1LDQ3LDEwLDc2LDQ4XSxbMTUsNTQsMjQsMjUsNTUsMjVdLFsyMyw0NSwxNSwyNSw0NiwxNl0sWzEzLDE0NSwxMTUsMywxNDYsMTE2XSxbMiw3NCw0NiwyOSw3NSw0N10sWzQyLDU0LDI0LDEsNTUsMjVdLFsyMyw0NSwxNSwyOCw0NiwxNl0sWzE3LDE0NSwxMTVdLFsxMCw3NCw0NiwyMyw3NSw0N10sWzEwLDU0LDI0LDM1LDU1LDI1XSxbMTksNDUsMTUsMzUsNDYsMTZdLFsxNywxNDUsMTE1LDEsMTQ2LDExNl0sWzE0LDc0LDQ2LDIxLDc1LDQ3XSxbMjksNTQsMjQsMTksNTUsMjVdLFsxMSw0NSwxNSw0Niw0NiwxNl0sWzEzLDE0NSwxMTUsNiwxNDYsMTE2XSxbMTQsNzQsNDYsMjMsNzUsNDddLFs0NCw1NCwyNCw3LDU1LDI1XSxbNTksNDYsMTYsMSw0NywxN10sWzEyLDE1MSwxMjEsNywxNTIsMTIyXSxbMTIsNzUsNDcsMjYsNzYsNDhdLFszOSw1NCwyNCwxNCw1NSwyNV0sWzIyLDQ1LDE1LDQxLDQ2LDE2XSxbNiwxNTEsMTIxLDE0LDE1MiwxMjJdLFs2LDc1LDQ3LDM0LDc2LDQ4XSxbNDYsNTQsMjQsMTAsNTUsMjVdLFsyLDQ1LDE1LDY0LDQ2LDE2XSxbMTcsMTUyLDEyMiw0LDE1MywxMjNdLFsyOSw3NCw0NiwxNCw3NSw0N10sWzQ5LDU0LDI0LDEwLDU1LDI1XSxbMjQsNDUsMTUsNDYsNDYsMTZdLFs0LDE1MiwxMjIsMTgsMTUzLDEyM10sWzEzLDc0LDQ2LDMyLDc1LDQ3XSxbNDgsNTQsMjQsMTQsNTUsMjVdLFs0Miw0NSwxNSwzMiw0NiwxNl0sWzIwLDE0NywxMTcsNCwxNDgsMTE4XSxbNDAsNzUsNDcsNyw3Niw0OF0sWzQzLDU0LDI0LDIyLDU1LDI1XSxbMTAsNDUsMTUsNjcsNDYsMTZdLFsxOSwxNDgsMTE4LDYsMTQ5LDExOV0sWzE4LDc1LDQ3LDMxLDc2LDQ4XSxbMzQsNTQsMjQsMzQsNTUsMjVdLFsyMCw0NSwxNSw2MSw0NiwxNl1dLCh0PXt9KS5nZXRSU0Jsb2Nrcz1mdW5jdGlvbih0LHIpe3ZhciBlPWZ1bmN0aW9uKHQscil7c3dpdGNoKHIpe2Nhc2Ugdy5MOnJldHVybiBrWzQqKHQtMSkrMF07Y2FzZSB3Lk06cmV0dXJuIGtbNCoodC0xKSsxXTtjYXNlIHcuUTpyZXR1cm4ga1s0Kih0LTEpKzJdO2Nhc2Ugdy5IOnJldHVybiBrWzQqKHQtMSkrM107ZGVmYXVsdDpyZXR1cm59fSh0LHIpO2lmKHZvaWQgMD09PWUpdGhyb3dcImJhZCBycyBibG9jayBAIHR5cGVOdW1iZXI6XCIrdCtcIi9lcnJvckNvcnJlY3Rpb25MZXZlbDpcIityO2Zvcih2YXIgbixvLGk9ZS5sZW5ndGgvMyxhPVtdLHU9MDt1PGk7dSs9MSlmb3IodmFyIGY9ZVszKnUrMF0sYz1lWzMqdSsxXSxsPWVbMyp1KzJdLGc9MDtnPGY7Zys9MSlhLnB1c2goKG49bCxvPXZvaWQgMCwobz17fSkudG90YWxDb3VudD1jLG8uZGF0YUNvdW50PW4sbykpO3JldHVybiBhfSx0KSxCPWZ1bmN0aW9uKCl7dmFyIGU9W10sbj0wLG89e2dldEJ1ZmZlcjpmdW5jdGlvbigpe3JldHVybiBlfSxnZXRBdDpmdW5jdGlvbih0KXt2YXIgcj1NYXRoLmZsb29yKHQvOCk7cmV0dXJuIDE9PShlW3JdPj4+Ny10JTgmMSl9LHB1dDpmdW5jdGlvbih0LHIpe2Zvcih2YXIgZT0wO2U8cjtlKz0xKW8ucHV0Qml0KDE9PSh0Pj4+ci1lLTEmMSkpfSxnZXRMZW5ndGhJbkJpdHM6ZnVuY3Rpb24oKXtyZXR1cm4gbn0scHV0Qml0OmZ1bmN0aW9uKHQpe3ZhciByPU1hdGguZmxvb3Iobi84KTtlLmxlbmd0aDw9ciYmZS5wdXNoKDApLHQmJihlW3JdfD0xMjg+Pj5uJTgpLG4rPTF9fTtyZXR1cm4gb30seD1mdW5jdGlvbih0KXt2YXIgcj1hLG49dCxlPXtnZXRNb2RlOmZ1bmN0aW9uKCl7cmV0dXJuIHJ9LGdldExlbmd0aDpmdW5jdGlvbih0KXtyZXR1cm4gbi5sZW5ndGh9LHdyaXRlOmZ1bmN0aW9uKHQpe2Zvcih2YXIgcj1uLGU9MDtlKzI8ci5sZW5ndGg7KXQucHV0KG8oci5zdWJzdHJpbmcoZSxlKzMpKSwxMCksZSs9MztlPHIubGVuZ3RoJiYoci5sZW5ndGgtZT09MT90LnB1dChvKHIuc3Vic3RyaW5nKGUsZSsxKSksNCk6ci5sZW5ndGgtZT09MiYmdC5wdXQobyhyLnN1YnN0cmluZyhlLGUrMikpLDcpKX19LG89ZnVuY3Rpb24odCl7Zm9yKHZhciByPTAsZT0wO2U8dC5sZW5ndGg7ZSs9MSlyPTEwKnIraSh0LmNoYXJBdChlKSk7cmV0dXJuIHJ9LGk9ZnVuY3Rpb24odCl7aWYoXCIwXCI8PXQmJnQ8PVwiOVwiKXJldHVybiB0LmNoYXJDb2RlQXQoMCktXCIwXCIuY2hhckNvZGVBdCgwKTt0aHJvd1wiaWxsZWdhbCBjaGFyIDpcIit0fTtyZXR1cm4gZX0sVD1mdW5jdGlvbih0KXt2YXIgcj11LG49dCxlPXtnZXRNb2RlOmZ1bmN0aW9uKCl7cmV0dXJuIHJ9LGdldExlbmd0aDpmdW5jdGlvbih0KXtyZXR1cm4gbi5sZW5ndGh9LHdyaXRlOmZ1bmN0aW9uKHQpe2Zvcih2YXIgcj1uLGU9MDtlKzE8ci5sZW5ndGg7KXQucHV0KDQ1Km8oci5jaGFyQXQoZSkpK28oci5jaGFyQXQoZSsxKSksMTEpLGUrPTI7ZTxyLmxlbmd0aCYmdC5wdXQobyhyLmNoYXJBdChlKSksNil9fSxvPWZ1bmN0aW9uKHQpe2lmKFwiMFwiPD10JiZ0PD1cIjlcIilyZXR1cm4gdC5jaGFyQ29kZUF0KDApLVwiMFwiLmNoYXJDb2RlQXQoMCk7aWYoXCJBXCI8PXQmJnQ8PVwiWlwiKXJldHVybiB0LmNoYXJDb2RlQXQoMCktXCJBXCIuY2hhckNvZGVBdCgwKSsxMDtzd2l0Y2godCl7Y2FzZVwiIFwiOnJldHVybiAzNjtjYXNlXCIkXCI6cmV0dXJuIDM3O2Nhc2VcIiVcIjpyZXR1cm4gMzg7Y2FzZVwiKlwiOnJldHVybiAzOTtjYXNlXCIrXCI6cmV0dXJuIDQwO2Nhc2VcIi1cIjpyZXR1cm4gNDE7Y2FzZVwiLlwiOnJldHVybiA0MjtjYXNlXCIvXCI6cmV0dXJuIDQzO2Nhc2VcIjpcIjpyZXR1cm4gNDQ7ZGVmYXVsdDp0aHJvd1wiaWxsZWdhbCBjaGFyIDpcIit0fX07cmV0dXJuIGV9LE09ZnVuY3Rpb24odCl7dmFyIHI9byxlPWkuc3RyaW5nVG9CeXRlcyh0KSxuPXtnZXRNb2RlOmZ1bmN0aW9uKCl7cmV0dXJuIHJ9LGdldExlbmd0aDpmdW5jdGlvbih0KXtyZXR1cm4gZS5sZW5ndGh9LHdyaXRlOmZ1bmN0aW9uKHQpe2Zvcih2YXIgcj0wO3I8ZS5sZW5ndGg7cis9MSl0LnB1dChlW3JdLDgpfX07cmV0dXJuIG59LEE9ZnVuY3Rpb24odCl7dmFyIHI9ZixuPWkuc3RyaW5nVG9CeXRlc0Z1bmNzLlNKSVM7aWYoIW4pdGhyb3dcInNqaXMgbm90IHN1cHBvcnRlZC5cIjshZnVuY3Rpb24odCxyKXt2YXIgZT1uKFwi5Y+LXCIpO2lmKDIhPWUubGVuZ3RofHwzODcyNiE9KGVbMF08PDh8ZVsxXSkpdGhyb3dcInNqaXMgbm90IHN1cHBvcnRlZC5cIn0oKTt2YXIgbz1uKHQpLGU9e2dldE1vZGU6ZnVuY3Rpb24oKXtyZXR1cm4gcn0sZ2V0TGVuZ3RoOmZ1bmN0aW9uKHQpe3JldHVybn5+KG8ubGVuZ3RoLzIpfSx3cml0ZTpmdW5jdGlvbih0KXtmb3IodmFyIHI9byxlPTA7ZSsxPHIubGVuZ3RoOyl7dmFyIG49KDI1NSZyW2VdKTw8OHwyNTUmcltlKzFdO2lmKDMzMDg4PD1uJiZuPD00MDk1NiluLT0zMzA4ODtlbHNle2lmKCEoNTc0MDg8PW4mJm48PTYwMzUxKSl0aHJvd1wiaWxsZWdhbCBjaGFyIGF0IFwiKyhlKzEpK1wiL1wiK247bi09NDk0NzJ9bj0xOTIqKG4+Pj44JjI1NSkrKDI1NSZuKSx0LnB1dChuLDEzKSxlKz0yfWlmKGU8ci5sZW5ndGgpdGhyb3dcImlsbGVnYWwgY2hhciBhdCBcIisoZSsxKX19O3JldHVybiBlfSxTPWZ1bmN0aW9uKHQpe3ZhciBlPXQsbj0wLG89MCxpPTAscj17cmVhZDpmdW5jdGlvbigpe2Zvcig7aTw4Oyl7aWYobj49ZS5sZW5ndGgpe2lmKDA9PWkpcmV0dXJuLTE7dGhyb3dcInVuZXhwZWN0ZWQgZW5kIG9mIGZpbGUuL1wiK2l9dmFyIHQ9ZS5jaGFyQXQobik7aWYobis9MSxcIj1cIj09dClyZXR1cm4gaT0wLC0xO3QubWF0Y2goL15cXHMkLyl8fChvPW88PDZ8YSh0LmNoYXJDb2RlQXQoMCkpLGkrPTYpfXZhciByPW8+Pj5pLTgmMjU1O3JldHVybiBpLT04LHJ9fSxhPWZ1bmN0aW9uKHQpe2lmKDY1PD10JiZ0PD05MClyZXR1cm4gdC02NTtpZig5Nzw9dCYmdDw9MTIyKXJldHVybiB0LTk3KzI2O2lmKDQ4PD10JiZ0PD01NylyZXR1cm4gdC00OCs1MjtpZig0Mz09dClyZXR1cm4gNjI7aWYoNDc9PXQpcmV0dXJuIDYzO3Rocm93XCJjOlwiK3R9O3JldHVybiByfSxMPWZ1bmN0aW9uKHQscixlKXtmb3IodmFyIG49ZnVuY3Rpb24odCxyKXt2YXIgbj10LG89cixnPW5ldyBBcnJheSh0KnIpLGU9e3NldFBpeGVsOmZ1bmN0aW9uKHQscixlKXtnW3Iqbit0XT1lfSx3cml0ZTpmdW5jdGlvbih0KXt0LndyaXRlU3RyaW5nKFwiR0lGODdhXCIpLHQud3JpdGVTaG9ydChuKSx0LndyaXRlU2hvcnQobyksdC53cml0ZUJ5dGUoMTI4KSx0LndyaXRlQnl0ZSgwKSx0LndyaXRlQnl0ZSgwKSx0LndyaXRlQnl0ZSgwKSx0LndyaXRlQnl0ZSgwKSx0LndyaXRlQnl0ZSgwKSx0LndyaXRlQnl0ZSgyNTUpLHQud3JpdGVCeXRlKDI1NSksdC53cml0ZUJ5dGUoMjU1KSx0LndyaXRlU3RyaW5nKFwiLFwiKSx0LndyaXRlU2hvcnQoMCksdC53cml0ZVNob3J0KDApLHQud3JpdGVTaG9ydChuKSx0LndyaXRlU2hvcnQobyksdC53cml0ZUJ5dGUoMCk7dmFyIHI9aSgyKTt0LndyaXRlQnl0ZSgyKTtmb3IodmFyIGU9MDsyNTU8ci5sZW5ndGgtZTspdC53cml0ZUJ5dGUoMjU1KSx0LndyaXRlQnl0ZXMocixlLDI1NSksZSs9MjU1O3Qud3JpdGVCeXRlKHIubGVuZ3RoLWUpLHQud3JpdGVCeXRlcyhyLGUsci5sZW5ndGgtZSksdC53cml0ZUJ5dGUoMCksdC53cml0ZVN0cmluZyhcIjtcIil9fSxpPWZ1bmN0aW9uKHQpe2Zvcih2YXIgcj0xPDx0LGU9MSsoMTw8dCksbj10KzEsbz1zKCksaT0wO2k8cjtpKz0xKW8uYWRkKFN0cmluZy5mcm9tQ2hhckNvZGUoaSkpO28uYWRkKFN0cmluZy5mcm9tQ2hhckNvZGUocikpLG8uYWRkKFN0cmluZy5mcm9tQ2hhckNvZGUoZSkpO3ZhciBhPWIoKSx1PWZ1bmN0aW9uKHQpe3ZhciBlPXQsbj0wLG89MCxyPXt3cml0ZTpmdW5jdGlvbih0LHIpe2lmKHQ+Pj5yIT0wKXRocm93XCJsZW5ndGggb3ZlclwiO2Zvcig7ODw9bityOyllLndyaXRlQnl0ZSgyNTUmKHQ8PG58bykpLHItPTgtbix0Pj4+PTgtbixuPW89MDtvfD10PDxuLG4rPXJ9LGZsdXNoOmZ1bmN0aW9uKCl7MDxuJiZlLndyaXRlQnl0ZShvKX19O3JldHVybiByfShhKTt1LndyaXRlKHIsbik7dmFyIGY9MCxjPVN0cmluZy5mcm9tQ2hhckNvZGUoZ1tmXSk7Zm9yKGYrPTE7ZjxnLmxlbmd0aDspe3ZhciBsPVN0cmluZy5mcm9tQ2hhckNvZGUoZ1tmXSk7Zis9MSxvLmNvbnRhaW5zKGMrbCk/Yys9bDoodS53cml0ZShvLmluZGV4T2YoYyksbiksby5zaXplKCk8NDA5NSYmKG8uc2l6ZSgpPT0xPDxuJiYobis9MSksby5hZGQoYytsKSksYz1sKX1yZXR1cm4gdS53cml0ZShvLmluZGV4T2YoYyksbiksdS53cml0ZShlLG4pLHUuZmx1c2goKSxhLnRvQnl0ZUFycmF5KCl9LHM9ZnVuY3Rpb24oKXt2YXIgcj17fSxlPTAsbj17YWRkOmZ1bmN0aW9uKHQpe2lmKG4uY29udGFpbnModCkpdGhyb3dcImR1cCBrZXk6XCIrdDtyW3RdPWUsZSs9MX0sc2l6ZTpmdW5jdGlvbigpe3JldHVybiBlfSxpbmRleE9mOmZ1bmN0aW9uKHQpe3JldHVybiByW3RdfSxjb250YWluczpmdW5jdGlvbih0KXtyZXR1cm4gdm9pZCAwIT09clt0XX19O3JldHVybiBufTtyZXR1cm4gZX0odCxyKSxvPTA7bzxyO28rPTEpZm9yKHZhciBpPTA7aTx0O2krPTEpbi5zZXRQaXhlbChpLG8sZShpLG8pKTt2YXIgYT1iKCk7bi53cml0ZShhKTtmb3IodmFyIHU9ZnVuY3Rpb24oKXtmdW5jdGlvbiBlKHQpe2ErPVN0cmluZy5mcm9tQ2hhckNvZGUocig2MyZ0KSl9dmFyIG49MCxvPTAsaT0wLGE9XCJcIix0PXt9LHI9ZnVuY3Rpb24odCl7aWYodDwwKTtlbHNle2lmKHQ8MjYpcmV0dXJuIDY1K3Q7aWYodDw1MilyZXR1cm4gdC0yNis5NztpZih0PDYyKXJldHVybiB0LTUyKzQ4O2lmKDYyPT10KXJldHVybiA0MztpZig2Mz09dClyZXR1cm4gNDd9dGhyb3dcIm46XCIrdH07cmV0dXJuIHQud3JpdGVCeXRlPWZ1bmN0aW9uKHQpe2ZvcihuPW48PDh8MjU1JnQsbys9OCxpKz0xOzY8PW87KWUobj4+Pm8tNiksby09Nn0sdC5mbHVzaD1mdW5jdGlvbigpe2lmKDA8byYmKGUobjw8Ni1vKSxvPW49MCksaSUzIT0wKWZvcih2YXIgdD0zLWklMyxyPTA7cjx0O3IrPTEpYSs9XCI9XCJ9LHQudG9TdHJpbmc9ZnVuY3Rpb24oKXtyZXR1cm4gYX0sdH0oKSxmPWEudG9CeXRlQXJyYXkoKSxjPTA7YzxmLmxlbmd0aDtjKz0xKXUud3JpdGVCeXRlKGZbY10pO3JldHVybiB1LmZsdXNoKCksXCJkYXRhOmltYWdlL2dpZjtiYXNlNjQsXCIrdX07cmV0dXJuIGl9KCk7YS5zdHJpbmdUb0J5dGVzRnVuY3NbXCJVVEYtOFwiXT1mdW5jdGlvbih0KXtyZXR1cm4gZnVuY3Rpb24odCl7Zm9yKHZhciByPVtdLGU9MDtlPHQubGVuZ3RoO2UrKyl7dmFyIG49dC5jaGFyQ29kZUF0KGUpO248MTI4P3IucHVzaChuKTpuPDIwNDg/ci5wdXNoKDE5MnxuPj42LDEyOHw2MyZuKTpuPDU1Mjk2fHw1NzM0NDw9bj9yLnB1c2goMjI0fG4+PjEyLDEyOHxuPj42JjYzLDEyOHw2MyZuKTooZSsrLG49NjU1MzYrKCgxMDIzJm4pPDwxMHwxMDIzJnQuY2hhckNvZGVBdChlKSksci5wdXNoKDI0MHxuPj4xOCwxMjh8bj4+MTImNjMsMTI4fG4+PjYmNjMsMTI4fDYzJm4pKX1yZXR1cm4gcn0odCl9LG89W10sdm9pZCAwPT09KGk9XCJmdW5jdGlvblwiPT10eXBlb2Yobj1mdW5jdGlvbigpe3JldHVybiBhfSk/bi5hcHBseShyLG8pOm4pfHwodC5leHBvcnRzPWkpfV0pfSk7IiwiLyoqXHJcbiAqIGpRdWVyeSBDU1MgQ3VzdG9taXphYmxlIFNjcm9sbGJhclxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgMjAxNSwgWXVyaXkgS2hhYmFyb3ZcclxuICogRHVhbCBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIG9yIEdQTCBWZXJzaW9uIDIgbGljZW5zZXMuXHJcbiAqXHJcbiAqIElmIHlvdSBmb3VuZCBidWcsIHBsZWFzZSBjb250YWN0IG1lIHZpYSBlbWFpbCA8MTNyZWFsMDA4QGdtYWlsLmNvbT5cclxuICpcclxuICogQ29tcHJlc3NlZCBieSBodHRwOi8vanNjb21wcmVzcy5jb20vXHJcbiAqXHJcbiAqIEBhdXRob3IgWXVyaXkgS2hhYmFyb3YgYWthIEdyb21vXHJcbiAqIEB2ZXJzaW9uIDAuMi4xMFxyXG4gKiBAdXJsIGh0dHBzOi8vZ2l0aHViLmNvbS9ncm9tby9qcXVlcnkuc2Nyb2xsYmFyL1xyXG4gKlxyXG4gKi9cclxuIWZ1bmN0aW9uKGwsZSl7XCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kP2RlZmluZShbXCJqcXVlcnlcIl0sZSk6ZShsLmpRdWVyeSl9KHRoaXMsZnVuY3Rpb24obCl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZShlKXtpZih0LndlYmtpdCYmIWUpcmV0dXJue2hlaWdodDowLHdpZHRoOjB9O2lmKCF0LmRhdGEub3V0ZXIpe3ZhciBvPXtib3JkZXI6XCJub25lXCIsXCJib3gtc2l6aW5nXCI6XCJjb250ZW50LWJveFwiLGhlaWdodDpcIjIwMHB4XCIsbWFyZ2luOlwiMFwiLHBhZGRpbmc6XCIwXCIsd2lkdGg6XCIyMDBweFwifTt0LmRhdGEuaW5uZXI9bChcIjxkaXY+XCIpLmNzcyhsLmV4dGVuZCh7fSxvKSksdC5kYXRhLm91dGVyPWwoXCI8ZGl2PlwiKS5jc3MobC5leHRlbmQoe2xlZnQ6XCItMTAwMHB4XCIsb3ZlcmZsb3c6XCJzY3JvbGxcIixwb3NpdGlvbjpcImFic29sdXRlXCIsdG9wOlwiLTEwMDBweFwifSxvKSkuYXBwZW5kKHQuZGF0YS5pbm5lcikuYXBwZW5kVG8oXCJib2R5XCIpfXJldHVybiB0LmRhdGEub3V0ZXIuc2Nyb2xsTGVmdCgxZTMpLnNjcm9sbFRvcCgxZTMpLHtoZWlnaHQ6TWF0aC5jZWlsKHQuZGF0YS5vdXRlci5vZmZzZXQoKS50b3AtdC5kYXRhLmlubmVyLm9mZnNldCgpLnRvcHx8MCksd2lkdGg6TWF0aC5jZWlsKHQuZGF0YS5vdXRlci5vZmZzZXQoKS5sZWZ0LXQuZGF0YS5pbm5lci5vZmZzZXQoKS5sZWZ0fHwwKX19ZnVuY3Rpb24gbygpe3ZhciBsPWUoITApO3JldHVybiEobC5oZWlnaHR8fGwud2lkdGgpfWZ1bmN0aW9uIHMobCl7dmFyIGU9bC5vcmlnaW5hbEV2ZW50O3JldHVybiBlLmF4aXMmJmUuYXhpcz09PWUuSE9SSVpPTlRBTF9BWElTPyExOmUud2hlZWxEZWx0YVg/ITE6ITB9dmFyIHI9ITEsdD17ZGF0YTp7aW5kZXg6MCxuYW1lOlwic2Nyb2xsYmFyXCJ9LG1hY29zeDovbWFjL2kudGVzdChuYXZpZ2F0b3IucGxhdGZvcm0pLG1vYmlsZTovYW5kcm9pZHx3ZWJvc3xpcGhvbmV8aXBhZHxpcG9kfGJsYWNrYmVycnkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpLG92ZXJsYXk6bnVsbCxzY3JvbGw6bnVsbCxzY3JvbGxzOltdLHdlYmtpdDovd2Via2l0L2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSYmIS9lZGdlXFwvXFxkKy9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCl9O3Quc2Nyb2xscy5hZGQ9ZnVuY3Rpb24obCl7dGhpcy5yZW1vdmUobCkucHVzaChsKX0sdC5zY3JvbGxzLnJlbW92ZT1mdW5jdGlvbihlKXtmb3IoO2wuaW5BcnJheShlLHRoaXMpPj0wOyl0aGlzLnNwbGljZShsLmluQXJyYXkoZSx0aGlzKSwxKTtyZXR1cm4gdGhpc307dmFyIGk9e2F1dG9TY3JvbGxTaXplOiEwLGF1dG9VcGRhdGU6ITAsZGVidWc6ITEsZGlzYWJsZUJvZHlTY3JvbGw6ITEsZHVyYXRpb246MjAwLGlnbm9yZU1vYmlsZTohMSxpZ25vcmVPdmVybGF5OiExLHNjcm9sbFN0ZXA6MzAsc2hvd0Fycm93czohMSxzdGVwU2Nyb2xsaW5nOiEwLHNjcm9sbHg6bnVsbCxzY3JvbGx5Om51bGwsb25EZXN0cm95Om51bGwsb25Jbml0Om51bGwsb25TY3JvbGw6bnVsbCxvblVwZGF0ZTpudWxsfSxuPWZ1bmN0aW9uKHMpe3Quc2Nyb2xsfHwodC5vdmVybGF5PW8oKSx0LnNjcm9sbD1lKCksYSgpLGwod2luZG93KS5yZXNpemUoZnVuY3Rpb24oKXt2YXIgbD0hMTtpZih0LnNjcm9sbCYmKHQuc2Nyb2xsLmhlaWdodHx8dC5zY3JvbGwud2lkdGgpKXt2YXIgbz1lKCk7KG8uaGVpZ2h0IT09dC5zY3JvbGwuaGVpZ2h0fHxvLndpZHRoIT09dC5zY3JvbGwud2lkdGgpJiYodC5zY3JvbGw9byxsPSEwKX1hKGwpfSkpLHRoaXMuY29udGFpbmVyPXMsdGhpcy5uYW1lc3BhY2U9XCIuc2Nyb2xsYmFyX1wiK3QuZGF0YS5pbmRleCsrLHRoaXMub3B0aW9ucz1sLmV4dGVuZCh7fSxpLHdpbmRvdy5qUXVlcnlTY3JvbGxiYXJPcHRpb25zfHx7fSksdGhpcy5zY3JvbGxUbz1udWxsLHRoaXMuc2Nyb2xseD17fSx0aGlzLnNjcm9sbHk9e30scy5kYXRhKHQuZGF0YS5uYW1lLHRoaXMpLHQuc2Nyb2xscy5hZGQodGhpcyl9O24ucHJvdG90eXBlPXtkZXN0cm95OmZ1bmN0aW9uKCl7aWYodGhpcy53cmFwcGVyKXt0aGlzLmNvbnRhaW5lci5yZW1vdmVEYXRhKHQuZGF0YS5uYW1lKSx0LnNjcm9sbHMucmVtb3ZlKHRoaXMpO3ZhciBlPXRoaXMuY29udGFpbmVyLnNjcm9sbExlZnQoKSxvPXRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCgpO3RoaXMuY29udGFpbmVyLmluc2VydEJlZm9yZSh0aGlzLndyYXBwZXIpLmNzcyh7aGVpZ2h0OlwiXCIsbWFyZ2luOlwiXCIsXCJtYXgtaGVpZ2h0XCI6XCJcIn0pLnJlbW92ZUNsYXNzKFwic2Nyb2xsLWNvbnRlbnQgc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSBzY3JvbGwtc2Nyb2xseV92aXNpYmxlXCIpLm9mZih0aGlzLm5hbWVzcGFjZSkuc2Nyb2xsTGVmdChlKS5zY3JvbGxUb3AobyksdGhpcy5zY3JvbGx4LnNjcm9sbC5yZW1vdmVDbGFzcyhcInNjcm9sbC1zY3JvbGx4X3Zpc2libGVcIikuZmluZChcImRpdlwiKS5hbmRTZWxmKCkub2ZmKHRoaXMubmFtZXNwYWNlKSx0aGlzLnNjcm9sbHkuc2Nyb2xsLnJlbW92ZUNsYXNzKFwic2Nyb2xsLXNjcm9sbHlfdmlzaWJsZVwiKS5maW5kKFwiZGl2XCIpLmFuZFNlbGYoKS5vZmYodGhpcy5uYW1lc3BhY2UpLHRoaXMud3JhcHBlci5yZW1vdmUoKSxsKGRvY3VtZW50KS5hZGQoXCJib2R5XCIpLm9mZih0aGlzLm5hbWVzcGFjZSksbC5pc0Z1bmN0aW9uKHRoaXMub3B0aW9ucy5vbkRlc3Ryb3kpJiZ0aGlzLm9wdGlvbnMub25EZXN0cm95LmFwcGx5KHRoaXMsW3RoaXMuY29udGFpbmVyXSl9fSxpbml0OmZ1bmN0aW9uKGUpe3ZhciBvPXRoaXMscj10aGlzLmNvbnRhaW5lcixpPXRoaXMuY29udGFpbmVyV3JhcHBlcnx8cixuPXRoaXMubmFtZXNwYWNlLGM9bC5leHRlbmQodGhpcy5vcHRpb25zLGV8fHt9KSxhPXt4OnRoaXMuc2Nyb2xseCx5OnRoaXMuc2Nyb2xseX0sZD10aGlzLndyYXBwZXIsaD17c2Nyb2xsTGVmdDpyLnNjcm9sbExlZnQoKSxzY3JvbGxUb3A6ci5zY3JvbGxUb3AoKX07aWYodC5tb2JpbGUmJmMuaWdub3JlTW9iaWxlfHx0Lm92ZXJsYXkmJmMuaWdub3JlT3ZlcmxheXx8dC5tYWNvc3gmJiF0LndlYmtpdClyZXR1cm4hMTtpZihkKWkuY3NzKHtoZWlnaHQ6XCJhdXRvXCIsXCJtYXJnaW4tYm90dG9tXCI6LTEqdC5zY3JvbGwuaGVpZ2h0K1wicHhcIixcIm1hcmdpbi1yaWdodFwiOi0xKnQuc2Nyb2xsLndpZHRoK1wicHhcIixcIm1heC1oZWlnaHRcIjpcIlwifSk7ZWxzZXtpZih0aGlzLndyYXBwZXI9ZD1sKFwiPGRpdj5cIikuYWRkQ2xhc3MoXCJzY3JvbGwtd3JhcHBlclwiKS5hZGRDbGFzcyhyLmF0dHIoXCJjbGFzc1wiKSkuY3NzKFwicG9zaXRpb25cIixcImFic29sdXRlXCI9PXIuY3NzKFwicG9zaXRpb25cIik/XCJhYnNvbHV0ZVwiOlwicmVsYXRpdmVcIikuaW5zZXJ0QmVmb3JlKHIpLmFwcGVuZChyKSxyLmlzKFwidGV4dGFyZWFcIikmJih0aGlzLmNvbnRhaW5lcldyYXBwZXI9aT1sKFwiPGRpdj5cIikuaW5zZXJ0QmVmb3JlKHIpLmFwcGVuZChyKSxkLmFkZENsYXNzKFwic2Nyb2xsLXRleHRhcmVhXCIpKSxpLmFkZENsYXNzKFwic2Nyb2xsLWNvbnRlbnRcIikuY3NzKHtoZWlnaHQ6XCJhdXRvXCIsXCJtYXJnaW4tYm90dG9tXCI6LTEqdC5zY3JvbGwuaGVpZ2h0K1wicHhcIixcIm1hcmdpbi1yaWdodFwiOi0xKnQuc2Nyb2xsLndpZHRoK1wicHhcIixcIm1heC1oZWlnaHRcIjpcIlwifSksci5vbihcInNjcm9sbFwiK24sZnVuY3Rpb24oZSl7bC5pc0Z1bmN0aW9uKGMub25TY3JvbGwpJiZjLm9uU2Nyb2xsLmNhbGwobyx7bWF4U2Nyb2xsOmEueS5tYXhTY3JvbGxPZmZzZXQsc2Nyb2xsOnIuc2Nyb2xsVG9wKCksc2l6ZTphLnkuc2l6ZSx2aXNpYmxlOmEueS52aXNpYmxlfSx7bWF4U2Nyb2xsOmEueC5tYXhTY3JvbGxPZmZzZXQsc2Nyb2xsOnIuc2Nyb2xsTGVmdCgpLHNpemU6YS54LnNpemUsdmlzaWJsZTphLngudmlzaWJsZX0pLGEueC5pc1Zpc2libGUmJmEueC5zY3JvbGwuYmFyLmNzcyhcImxlZnRcIixyLnNjcm9sbExlZnQoKSphLngua3grXCJweFwiKSxhLnkuaXNWaXNpYmxlJiZhLnkuc2Nyb2xsLmJhci5jc3MoXCJ0b3BcIixyLnNjcm9sbFRvcCgpKmEueS5reCtcInB4XCIpfSksZC5vbihcInNjcm9sbFwiK24sZnVuY3Rpb24oKXtkLnNjcm9sbFRvcCgwKS5zY3JvbGxMZWZ0KDApfSksYy5kaXNhYmxlQm9keVNjcm9sbCl7dmFyIHA9ZnVuY3Rpb24obCl7cyhsKT9hLnkuaXNWaXNpYmxlJiZhLnkubW91c2V3aGVlbChsKTphLnguaXNWaXNpYmxlJiZhLngubW91c2V3aGVlbChsKX07ZC5vbihcIk1vek1vdXNlUGl4ZWxTY3JvbGxcIituLHApLGQub24oXCJtb3VzZXdoZWVsXCIrbixwKSx0Lm1vYmlsZSYmZC5vbihcInRvdWNoc3RhcnRcIituLGZ1bmN0aW9uKGUpe3ZhciBvPWUub3JpZ2luYWxFdmVudC50b3VjaGVzJiZlLm9yaWdpbmFsRXZlbnQudG91Y2hlc1swXXx8ZSxzPXtwYWdlWDpvLnBhZ2VYLHBhZ2VZOm8ucGFnZVl9LHQ9e2xlZnQ6ci5zY3JvbGxMZWZ0KCksdG9wOnIuc2Nyb2xsVG9wKCl9O2woZG9jdW1lbnQpLm9uKFwidG91Y2htb3ZlXCIrbixmdW5jdGlvbihsKXt2YXIgZT1sLm9yaWdpbmFsRXZlbnQudGFyZ2V0VG91Y2hlcyYmbC5vcmlnaW5hbEV2ZW50LnRhcmdldFRvdWNoZXNbMF18fGw7ci5zY3JvbGxMZWZ0KHQubGVmdCtzLnBhZ2VYLWUucGFnZVgpLHIuc2Nyb2xsVG9wKHQudG9wK3MucGFnZVktZS5wYWdlWSksbC5wcmV2ZW50RGVmYXVsdCgpfSksbChkb2N1bWVudCkub24oXCJ0b3VjaGVuZFwiK24sZnVuY3Rpb24oKXtsKGRvY3VtZW50KS5vZmYobil9KX0pfWwuaXNGdW5jdGlvbihjLm9uSW5pdCkmJmMub25Jbml0LmFwcGx5KHRoaXMsW3JdKX1sLmVhY2goYSxmdW5jdGlvbihlLHQpe3ZhciBpPW51bGwsZD0xLGg9XCJ4XCI9PT1lP1wic2Nyb2xsTGVmdFwiOlwic2Nyb2xsVG9wXCIscD1jLnNjcm9sbFN0ZXAsdT1mdW5jdGlvbigpe3ZhciBsPXJbaF0oKTtyW2hdKGwrcCksMT09ZCYmbCtwPj1mJiYobD1yW2hdKCkpLC0xPT1kJiZmPj1sK3AmJihsPXJbaF0oKSkscltoXSgpPT1sJiZpJiZpKCl9LGY9MDt0LnNjcm9sbHx8KHQuc2Nyb2xsPW8uX2dldFNjcm9sbChjW1wic2Nyb2xsXCIrZV0pLmFkZENsYXNzKFwic2Nyb2xsLVwiK2UpLGMuc2hvd0Fycm93cyYmdC5zY3JvbGwuYWRkQ2xhc3MoXCJzY3JvbGwtZWxlbWVudF9hcnJvd3NfdmlzaWJsZVwiKSx0Lm1vdXNld2hlZWw9ZnVuY3Rpb24obCl7aWYoIXQuaXNWaXNpYmxlfHxcInhcIj09PWUmJnMobCkpcmV0dXJuITA7aWYoXCJ5XCI9PT1lJiYhcyhsKSlyZXR1cm4gYS54Lm1vdXNld2hlZWwobCksITA7dmFyIGk9LTEqbC5vcmlnaW5hbEV2ZW50LndoZWVsRGVsdGF8fGwub3JpZ2luYWxFdmVudC5kZXRhaWwsbj10LnNpemUtdC52aXNpYmxlLXQub2Zmc2V0O3JldHVybihpPjAmJm4+Znx8MD5pJiZmPjApJiYoZis9aSwwPmYmJihmPTApLGY+biYmKGY9biksby5zY3JvbGxUbz1vLnNjcm9sbFRvfHx7fSxvLnNjcm9sbFRvW2hdPWYsc2V0VGltZW91dChmdW5jdGlvbigpe28uc2Nyb2xsVG8mJihyLnN0b3AoKS5hbmltYXRlKG8uc2Nyb2xsVG8sMjQwLFwibGluZWFyXCIsZnVuY3Rpb24oKXtmPXJbaF0oKX0pLG8uc2Nyb2xsVG89bnVsbCl9LDEpKSxsLnByZXZlbnREZWZhdWx0KCksITF9LHQuc2Nyb2xsLm9uKFwiTW96TW91c2VQaXhlbFNjcm9sbFwiK24sdC5tb3VzZXdoZWVsKS5vbihcIm1vdXNld2hlZWxcIituLHQubW91c2V3aGVlbCkub24oXCJtb3VzZWVudGVyXCIrbixmdW5jdGlvbigpe2Y9cltoXSgpfSksdC5zY3JvbGwuZmluZChcIi5zY3JvbGwtYXJyb3csIC5zY3JvbGwtZWxlbWVudF90cmFja1wiKS5vbihcIm1vdXNlZG93blwiK24sZnVuY3Rpb24ocyl7aWYoMSE9cy53aGljaClyZXR1cm4hMDtkPTE7dmFyIG49e2V2ZW50T2Zmc2V0OnNbXCJ4XCI9PT1lP1wicGFnZVhcIjpcInBhZ2VZXCJdLG1heFNjcm9sbFZhbHVlOnQuc2l6ZS10LnZpc2libGUtdC5vZmZzZXQsc2Nyb2xsYmFyT2Zmc2V0OnQuc2Nyb2xsLmJhci5vZmZzZXQoKVtcInhcIj09PWU/XCJsZWZ0XCI6XCJ0b3BcIl0sc2Nyb2xsYmFyU2l6ZTp0LnNjcm9sbC5iYXJbXCJ4XCI9PT1lP1wib3V0ZXJXaWR0aFwiOlwib3V0ZXJIZWlnaHRcIl0oKX0sYT0wLHY9MDtyZXR1cm4gbCh0aGlzKS5oYXNDbGFzcyhcInNjcm9sbC1hcnJvd1wiKT8oZD1sKHRoaXMpLmhhc0NsYXNzKFwic2Nyb2xsLWFycm93X21vcmVcIik/MTotMSxwPWMuc2Nyb2xsU3RlcCpkLGY9ZD4wP24ubWF4U2Nyb2xsVmFsdWU6MCk6KGQ9bi5ldmVudE9mZnNldD5uLnNjcm9sbGJhck9mZnNldCtuLnNjcm9sbGJhclNpemU/MTpuLmV2ZW50T2Zmc2V0PG4uc2Nyb2xsYmFyT2Zmc2V0Py0xOjAscD1NYXRoLnJvdW5kKC43NSp0LnZpc2libGUpKmQsZj1uLmV2ZW50T2Zmc2V0LW4uc2Nyb2xsYmFyT2Zmc2V0LShjLnN0ZXBTY3JvbGxpbmc/MT09ZD9uLnNjcm9sbGJhclNpemU6MDpNYXRoLnJvdW5kKG4uc2Nyb2xsYmFyU2l6ZS8yKSksZj1yW2hdKCkrZi90Lmt4KSxvLnNjcm9sbFRvPW8uc2Nyb2xsVG98fHt9LG8uc2Nyb2xsVG9baF09Yy5zdGVwU2Nyb2xsaW5nP3JbaF0oKStwOmYsYy5zdGVwU2Nyb2xsaW5nJiYoaT1mdW5jdGlvbigpe2Y9cltoXSgpLGNsZWFySW50ZXJ2YWwodiksY2xlYXJUaW1lb3V0KGEpLGE9MCx2PTB9LGE9c2V0VGltZW91dChmdW5jdGlvbigpe3Y9c2V0SW50ZXJ2YWwodSw0MCl9LGMuZHVyYXRpb24rMTAwKSksc2V0VGltZW91dChmdW5jdGlvbigpe28uc2Nyb2xsVG8mJihyLmFuaW1hdGUoby5zY3JvbGxUbyxjLmR1cmF0aW9uKSxvLnNjcm9sbFRvPW51bGwpfSwxKSxvLl9oYW5kbGVNb3VzZURvd24oaSxzKX0pLHQuc2Nyb2xsLmJhci5vbihcIm1vdXNlZG93blwiK24sZnVuY3Rpb24ocyl7aWYoMSE9cy53aGljaClyZXR1cm4hMDt2YXIgaT1zW1wieFwiPT09ZT9cInBhZ2VYXCI6XCJwYWdlWVwiXSxjPXJbaF0oKTtyZXR1cm4gdC5zY3JvbGwuYWRkQ2xhc3MoXCJzY3JvbGwtZHJhZ2dhYmxlXCIpLGwoZG9jdW1lbnQpLm9uKFwibW91c2Vtb3ZlXCIrbixmdW5jdGlvbihsKXt2YXIgbz1wYXJzZUludCgobFtcInhcIj09PWU/XCJwYWdlWFwiOlwicGFnZVlcIl0taSkvdC5reCwxMCk7cltoXShjK28pfSksby5faGFuZGxlTW91c2VEb3duKGZ1bmN0aW9uKCl7dC5zY3JvbGwucmVtb3ZlQ2xhc3MoXCJzY3JvbGwtZHJhZ2dhYmxlXCIpLGY9cltoXSgpfSxzKX0pKX0pLGwuZWFjaChhLGZ1bmN0aW9uKGwsZSl7dmFyIG89XCJzY3JvbGwtc2Nyb2xsXCIrbCtcIl92aXNpYmxlXCIscz1cInhcIj09bD9hLnk6YS54O2Uuc2Nyb2xsLnJlbW92ZUNsYXNzKG8pLHMuc2Nyb2xsLnJlbW92ZUNsYXNzKG8pLGkucmVtb3ZlQ2xhc3Mobyl9KSxsLmVhY2goYSxmdW5jdGlvbihlLG8pe2wuZXh0ZW5kKG8sXCJ4XCI9PWU/e29mZnNldDpwYXJzZUludChyLmNzcyhcImxlZnRcIiksMTApfHwwLHNpemU6ci5wcm9wKFwic2Nyb2xsV2lkdGhcIiksdmlzaWJsZTpkLndpZHRoKCl9OntvZmZzZXQ6cGFyc2VJbnQoci5jc3MoXCJ0b3BcIiksMTApfHwwLHNpemU6ci5wcm9wKFwic2Nyb2xsSGVpZ2h0XCIpLHZpc2libGU6ZC5oZWlnaHQoKX0pfSksdGhpcy5fdXBkYXRlU2Nyb2xsKFwieFwiLHRoaXMuc2Nyb2xseCksdGhpcy5fdXBkYXRlU2Nyb2xsKFwieVwiLHRoaXMuc2Nyb2xseSksbC5pc0Z1bmN0aW9uKGMub25VcGRhdGUpJiZjLm9uVXBkYXRlLmFwcGx5KHRoaXMsW3JdKSxsLmVhY2goYSxmdW5jdGlvbihsLGUpe3ZhciBvPVwieFwiPT09bD9cImxlZnRcIjpcInRvcFwiLHM9XCJ4XCI9PT1sP1wib3V0ZXJXaWR0aFwiOlwib3V0ZXJIZWlnaHRcIix0PVwieFwiPT09bD9cIndpZHRoXCI6XCJoZWlnaHRcIixpPXBhcnNlSW50KHIuY3NzKG8pLDEwKXx8MCxuPWUuc2l6ZSxhPWUudmlzaWJsZStpLGQ9ZS5zY3JvbGwuc2l6ZVtzXSgpKyhwYXJzZUludChlLnNjcm9sbC5zaXplLmNzcyhvKSwxMCl8fDApO2MuYXV0b1Njcm9sbFNpemUmJihlLnNjcm9sbGJhclNpemU9cGFyc2VJbnQoZCphL24sMTApLGUuc2Nyb2xsLmJhci5jc3ModCxlLnNjcm9sbGJhclNpemUrXCJweFwiKSksZS5zY3JvbGxiYXJTaXplPWUuc2Nyb2xsLmJhcltzXSgpLGUua3g9KGQtZS5zY3JvbGxiYXJTaXplKS8obi1hKXx8MSxlLm1heFNjcm9sbE9mZnNldD1uLWF9KSxyLnNjcm9sbExlZnQoaC5zY3JvbGxMZWZ0KS5zY3JvbGxUb3AoaC5zY3JvbGxUb3ApLnRyaWdnZXIoXCJzY3JvbGxcIil9LF9nZXRTY3JvbGw6ZnVuY3Rpb24oZSl7dmFyIG89e2FkdmFuY2VkOlsnPGRpdiBjbGFzcz1cInNjcm9sbC1lbGVtZW50XCI+JywnPGRpdiBjbGFzcz1cInNjcm9sbC1lbGVtZW50X2Nvcm5lclwiPjwvZGl2PicsJzxkaXYgY2xhc3M9XCJzY3JvbGwtYXJyb3cgc2Nyb2xsLWFycm93X2xlc3NcIj48L2Rpdj4nLCc8ZGl2IGNsYXNzPVwic2Nyb2xsLWFycm93IHNjcm9sbC1hcnJvd19tb3JlXCI+PC9kaXY+JywnPGRpdiBjbGFzcz1cInNjcm9sbC1lbGVtZW50X291dGVyXCI+JywnPGRpdiBjbGFzcz1cInNjcm9sbC1lbGVtZW50X3NpemVcIj48L2Rpdj4nLCc8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRfaW5uZXItd3JhcHBlclwiPicsJzxkaXYgY2xhc3M9XCJzY3JvbGwtZWxlbWVudF9pbm5lciBzY3JvbGwtZWxlbWVudF90cmFja1wiPicsJzxkaXYgY2xhc3M9XCJzY3JvbGwtZWxlbWVudF9pbm5lci1ib3R0b21cIj48L2Rpdj4nLFwiPC9kaXY+XCIsXCI8L2Rpdj5cIiwnPGRpdiBjbGFzcz1cInNjcm9sbC1iYXJcIj4nLCc8ZGl2IGNsYXNzPVwic2Nyb2xsLWJhcl9ib2R5XCI+JywnPGRpdiBjbGFzcz1cInNjcm9sbC1iYXJfYm9keS1pbm5lclwiPjwvZGl2PicsXCI8L2Rpdj5cIiwnPGRpdiBjbGFzcz1cInNjcm9sbC1iYXJfYm90dG9tXCI+PC9kaXY+JywnPGRpdiBjbGFzcz1cInNjcm9sbC1iYXJfY2VudGVyXCI+PC9kaXY+JyxcIjwvZGl2PlwiLFwiPC9kaXY+XCIsXCI8L2Rpdj5cIl0uam9pbihcIlwiKSxzaW1wbGU6Wyc8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRcIj4nLCc8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRfb3V0ZXJcIj4nLCc8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRfc2l6ZVwiPjwvZGl2PicsJzxkaXYgY2xhc3M9XCJzY3JvbGwtZWxlbWVudF90cmFja1wiPjwvZGl2PicsJzxkaXYgY2xhc3M9XCJzY3JvbGwtYmFyXCI+PC9kaXY+JyxcIjwvZGl2PlwiLFwiPC9kaXY+XCJdLmpvaW4oXCJcIil9O3JldHVybiBvW2VdJiYoZT1vW2VdKSxlfHwoZT1vLnNpbXBsZSksZT1cInN0cmluZ1wiPT10eXBlb2YgZT9sKGUpLmFwcGVuZFRvKHRoaXMud3JhcHBlcik6bChlKSxsLmV4dGVuZChlLHtiYXI6ZS5maW5kKFwiLnNjcm9sbC1iYXJcIiksc2l6ZTplLmZpbmQoXCIuc2Nyb2xsLWVsZW1lbnRfc2l6ZVwiKSx0cmFjazplLmZpbmQoXCIuc2Nyb2xsLWVsZW1lbnRfdHJhY2tcIil9KSxlfSxfaGFuZGxlTW91c2VEb3duOmZ1bmN0aW9uKGUsbyl7dmFyIHM9dGhpcy5uYW1lc3BhY2U7cmV0dXJuIGwoZG9jdW1lbnQpLm9uKFwiYmx1clwiK3MsZnVuY3Rpb24oKXtsKGRvY3VtZW50KS5hZGQoXCJib2R5XCIpLm9mZihzKSxlJiZlKCl9KSxsKGRvY3VtZW50KS5vbihcImRyYWdzdGFydFwiK3MsZnVuY3Rpb24obCl7cmV0dXJuIGwucHJldmVudERlZmF1bHQoKSwhMX0pLGwoZG9jdW1lbnQpLm9uKFwibW91c2V1cFwiK3MsZnVuY3Rpb24oKXtsKGRvY3VtZW50KS5hZGQoXCJib2R5XCIpLm9mZihzKSxlJiZlKCl9KSxsKFwiYm9keVwiKS5vbihcInNlbGVjdHN0YXJ0XCIrcyxmdW5jdGlvbihsKXtyZXR1cm4gbC5wcmV2ZW50RGVmYXVsdCgpLCExfSksbyYmby5wcmV2ZW50RGVmYXVsdCgpLCExfSxfdXBkYXRlU2Nyb2xsOmZ1bmN0aW9uKGUsbyl7dmFyIHM9dGhpcy5jb250YWluZXIscj10aGlzLmNvbnRhaW5lcldyYXBwZXJ8fHMsaT1cInNjcm9sbC1zY3JvbGxcIitlK1wiX3Zpc2libGVcIixuPVwieFwiPT09ZT90aGlzLnNjcm9sbHk6dGhpcy5zY3JvbGx4LGM9cGFyc2VJbnQodGhpcy5jb250YWluZXIuY3NzKFwieFwiPT09ZT9cImxlZnRcIjpcInRvcFwiKSwxMCl8fDAsYT10aGlzLndyYXBwZXIsZD1vLnNpemUsaD1vLnZpc2libGUrYztvLmlzVmlzaWJsZT1kLWg+MSxvLmlzVmlzaWJsZT8oby5zY3JvbGwuYWRkQ2xhc3MoaSksbi5zY3JvbGwuYWRkQ2xhc3MoaSksci5hZGRDbGFzcyhpKSk6KG8uc2Nyb2xsLnJlbW92ZUNsYXNzKGkpLG4uc2Nyb2xsLnJlbW92ZUNsYXNzKGkpLHIucmVtb3ZlQ2xhc3MoaSkpLFwieVwiPT09ZSYmKHMuaXMoXCJ0ZXh0YXJlYVwiKXx8aD5kP3IuY3NzKHtoZWlnaHQ6aCt0LnNjcm9sbC5oZWlnaHQrXCJweFwiLFwibWF4LWhlaWdodFwiOlwibm9uZVwifSk6ci5jc3Moe1wibWF4LWhlaWdodFwiOmgrdC5zY3JvbGwuaGVpZ2h0K1wicHhcIn0pKSwoby5zaXplIT1zLnByb3AoXCJzY3JvbGxXaWR0aFwiKXx8bi5zaXplIT1zLnByb3AoXCJzY3JvbGxIZWlnaHRcIil8fG8udmlzaWJsZSE9YS53aWR0aCgpfHxuLnZpc2libGUhPWEuaGVpZ2h0KCl8fG8ub2Zmc2V0IT0ocGFyc2VJbnQocy5jc3MoXCJsZWZ0XCIpLDEwKXx8MCl8fG4ub2Zmc2V0IT0ocGFyc2VJbnQocy5jc3MoXCJ0b3BcIiksMTApfHwwKSkmJihsLmV4dGVuZCh0aGlzLnNjcm9sbHgse29mZnNldDpwYXJzZUludChzLmNzcyhcImxlZnRcIiksMTApfHwwLHNpemU6cy5wcm9wKFwic2Nyb2xsV2lkdGhcIiksdmlzaWJsZTphLndpZHRoKCl9KSxsLmV4dGVuZCh0aGlzLnNjcm9sbHkse29mZnNldDpwYXJzZUludChzLmNzcyhcInRvcFwiKSwxMCl8fDAsc2l6ZTp0aGlzLmNvbnRhaW5lci5wcm9wKFwic2Nyb2xsSGVpZ2h0XCIpLHZpc2libGU6YS5oZWlnaHQoKX0pLHRoaXMuX3VwZGF0ZVNjcm9sbChcInhcIj09PWU/XCJ5XCI6XCJ4XCIsbikpfX07dmFyIGM9bjtsLmZuLnNjcm9sbGJhcj1mdW5jdGlvbihlLG8pe3JldHVyblwic3RyaW5nXCIhPXR5cGVvZiBlJiYobz1lLGU9XCJpbml0XCIpLFwidW5kZWZpbmVkXCI9PXR5cGVvZiBvJiYobz1bXSksbC5pc0FycmF5KG8pfHwobz1bb10pLHRoaXMubm90KFwiYm9keSwgLnNjcm9sbC13cmFwcGVyXCIpLmVhY2goZnVuY3Rpb24oKXt2YXIgcz1sKHRoaXMpLHI9cy5kYXRhKHQuZGF0YS5uYW1lKTsocnx8XCJpbml0XCI9PT1lKSYmKHJ8fChyPW5ldyBjKHMpKSxyW2VdJiZyW2VdLmFwcGx5KHIsbykpfSksdGhpc30sbC5mbi5zY3JvbGxiYXIub3B0aW9ucz1pO3ZhciBhPWZ1bmN0aW9uKCl7dmFyIGw9MCxlPTA7cmV0dXJuIGZ1bmN0aW9uKG8pe3ZhciBzLGksbixjLGQsaCxwO2ZvcihzPTA7czx0LnNjcm9sbHMubGVuZ3RoO3MrKyljPXQuc2Nyb2xsc1tzXSxpPWMuY29udGFpbmVyLG49Yy5vcHRpb25zLGQ9Yy53cmFwcGVyLGg9Yy5zY3JvbGx4LHA9Yy5zY3JvbGx5LChvfHxuLmF1dG9VcGRhdGUmJmQmJmQuaXMoXCI6dmlzaWJsZVwiKSYmKGkucHJvcChcInNjcm9sbFdpZHRoXCIpIT1oLnNpemV8fGkucHJvcChcInNjcm9sbEhlaWdodFwiKSE9cC5zaXplfHxkLndpZHRoKCkhPWgudmlzaWJsZXx8ZC5oZWlnaHQoKSE9cC52aXNpYmxlKSkmJihjLmluaXQoKSxuLmRlYnVnJiYod2luZG93LmNvbnNvbGUmJmNvbnNvbGUubG9nKHtzY3JvbGxIZWlnaHQ6aS5wcm9wKFwic2Nyb2xsSGVpZ2h0XCIpK1wiOlwiK2Muc2Nyb2xseS5zaXplLHNjcm9sbFdpZHRoOmkucHJvcChcInNjcm9sbFdpZHRoXCIpK1wiOlwiK2Muc2Nyb2xseC5zaXplLHZpc2libGVIZWlnaHQ6ZC5oZWlnaHQoKStcIjpcIitjLnNjcm9sbHkudmlzaWJsZSx2aXNpYmxlV2lkdGg6ZC53aWR0aCgpK1wiOlwiK2Muc2Nyb2xseC52aXNpYmxlfSwhMCksZSsrKSk7ciYmZT4xMD8od2luZG93LmNvbnNvbGUmJmNvbnNvbGUubG9nKFwiU2Nyb2xsIHVwZGF0ZXMgZXhjZWVkIDEwXCIpLGE9ZnVuY3Rpb24oKXt9KTooY2xlYXJUaW1lb3V0KGwpLGw9c2V0VGltZW91dChhLDMwMCkpfX0oKTt3aW5kb3cuYW5ndWxhciYmIWZ1bmN0aW9uKGwpe2wubW9kdWxlKFwialF1ZXJ5U2Nyb2xsYmFyXCIsW10pLnByb3ZpZGVyKFwialF1ZXJ5U2Nyb2xsYmFyXCIsZnVuY3Rpb24oKXt2YXIgZT1pO3JldHVybntzZXRPcHRpb25zOmZ1bmN0aW9uKG8pe2wuZXh0ZW5kKGUsbyl9LCRnZXQ6ZnVuY3Rpb24oKXtyZXR1cm57b3B0aW9uczpsLmNvcHkoZSl9fX19KS5kaXJlY3RpdmUoXCJqcXVlcnlTY3JvbGxiYXJcIixbXCJqUXVlcnlTY3JvbGxiYXJcIixcIiRwYXJzZVwiLGZ1bmN0aW9uKGwsZSl7cmV0dXJue3Jlc3RyaWN0OlwiQUNcIixsaW5rOmZ1bmN0aW9uKG8scyxyKXt2YXIgdD1lKHIuanF1ZXJ5U2Nyb2xsYmFyKSxpPXQobyk7cy5zY3JvbGxiYXIoaXx8bC5vcHRpb25zKS5vbihcIiRkZXN0cm95XCIsZnVuY3Rpb24oKXtzLnNjcm9sbGJhcihcImRlc3Ryb3lcIil9KX19fV0pfSh3aW5kb3cuYW5ndWxhcil9KTsiLCJcclxuLypcclxuICogTGF0aW5OdW1lcm9zQUxldHJhcy5qc1xyXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcclxuICpcclxuICogQ29weXJpZ2h0IChjKSAyMDE2IERhbmllbCBNLiBTcGlyaWRpb25lXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvIGRlYWxcclxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xyXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXHJcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xyXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxyXG4gKlxyXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcclxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICpcclxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcclxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXHJcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxyXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXHJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXHJcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXHJcbiAqIFNPRlRXQVJFLlxyXG4gKlxyXG4gKiBAYXV0aG9yIERhbmllbCBNLiBTcGlyaWRpb25lIChpbmZvQGRhbmllbC1zcGlyaWRpb25lLmNvbS5hcilcclxuICovXHJcbmZ1bmN0aW9uIHVuaWRhZGVzKG51bSkge1xyXG4gICAgc3dpdGNoIChudW0pIHtcclxuICAgICAgICBjYXNlIDE6IHJldHVybiAnVW4nO1xyXG4gICAgICAgIGNhc2UgMjogcmV0dXJuICdEb3MnO1xyXG4gICAgICAgIGNhc2UgMzogcmV0dXJuICdUcmVzJztcclxuICAgICAgICBjYXNlIDQ6IHJldHVybiAnQ3VhdHJvJztcclxuICAgICAgICBjYXNlIDU6IHJldHVybiAnQ2luY28nO1xyXG4gICAgICAgIGNhc2UgNjogcmV0dXJuICdTZWlzJztcclxuICAgICAgICBjYXNlIDc6IHJldHVybiAnU2lldGUnO1xyXG4gICAgICAgIGNhc2UgODogcmV0dXJuICdPY2hvJztcclxuICAgICAgICBjYXNlIDk6IHJldHVybiAnTnVldmUnO1xyXG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiAnJztcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGVjZW5hc1koc3RyU2luLCBudW1VbmlkYWRlcykge1xyXG4gICAgaWYgKG51bVVuaWRhZGVzID4gMCkge1xyXG4gICAgICAgIHJldHVybiBgJHtzdHJTaW59IHkgJHt1bmlkYWRlcyhudW1VbmlkYWRlcyl9YDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3RyU2luO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkZWNlbmFzKG51bSkge1xyXG4gICAgY29uc3QgbnVtRGVjZW5hID0gTWF0aC5mbG9vcihudW0gLyAxMCk7XHJcbiAgICBjb25zdCBudW1VbmlkYWQgPSBudW0gLSAobnVtRGVjZW5hICogMTApO1xyXG5cclxuICAgIHN3aXRjaCAobnVtRGVjZW5hKSB7XHJcbiAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgICBzd2l0Y2ggKG51bVVuaWRhZCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAwOiByZXR1cm4gJ0RpZXonO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAxOiByZXR1cm4gJ09uY2UnO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAyOiByZXR1cm4gJ0RvY2UnO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAzOiByZXR1cm4gJ1RyZWNlJztcclxuICAgICAgICAgICAgICAgIGNhc2UgNDogcmV0dXJuICdDYXRvcmNlJztcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogcmV0dXJuICdRdW5pY2UnO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIGBEaWVjaSR7dW5pZGFkZXMobnVtVW5pZGFkKS50b0xvd2VyQ2FzZSgpfWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICAgIHN3aXRjaCAobnVtVW5pZGFkKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDA6IHJldHVybiAnVmVpbnRlJztcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBgVmVpbnRpJHt1bmlkYWRlcyhudW1VbmlkYWQpLnRvTG93ZXJDYXNlKCl9YDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgMzogcmV0dXJuIGRlY2VuYXNZKCdUcmVpbnRhJywgbnVtVW5pZGFkKTtcclxuICAgICAgICBjYXNlIDQ6IHJldHVybiBkZWNlbmFzWSgnQ3VhcmVudGEnLCBudW1VbmlkYWQpO1xyXG4gICAgICAgIGNhc2UgNTogcmV0dXJuIGRlY2VuYXNZKCdDaW5jdWVudGEnLCBudW1VbmlkYWQpO1xyXG4gICAgICAgIGNhc2UgNjogcmV0dXJuIGRlY2VuYXNZKCdTZXNlbnRhJywgbnVtVW5pZGFkKTtcclxuICAgICAgICBjYXNlIDc6IHJldHVybiBkZWNlbmFzWSgnU2V0ZW50YScsIG51bVVuaWRhZCk7XHJcbiAgICAgICAgY2FzZSA4OiByZXR1cm4gZGVjZW5hc1koJ09jaGVudGEnLCBudW1VbmlkYWQpO1xyXG4gICAgICAgIGNhc2UgOTogcmV0dXJuIGRlY2VuYXNZKCdOb3ZlbnRhJywgbnVtVW5pZGFkKTtcclxuICAgICAgICBjYXNlIDA6IHJldHVybiB1bmlkYWRlcyhudW1VbmlkYWQpO1xyXG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiAnJztcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY2VudGVuYXMobnVtKSB7XHJcbiAgICBjb25zdCBudW1DZW50ZW5hcyA9IE1hdGguZmxvb3IobnVtIC8gMTAwKTtcclxuICAgIGNvbnN0IG51bURlY2VuYXMgPSBudW0gLSAobnVtQ2VudGVuYXMgKiAxMDApO1xyXG5cclxuICAgIHN3aXRjaCAobnVtQ2VudGVuYXMpIHtcclxuICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICAgIGlmIChudW1EZWNlbmFzID4gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGBDaWVudG8gJHtkZWNlbmFzKG51bURlY2VuYXMpfWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuICdDaWVuJztcclxuICAgICAgICBjYXNlIDI6IHJldHVybiBgRG9zY2llbnRvcyAke2RlY2VuYXMobnVtRGVjZW5hcyl9YDtcclxuICAgICAgICBjYXNlIDM6IHJldHVybiBgVHJlc2NpZW50b3MgJHtkZWNlbmFzKG51bURlY2VuYXMpfWA7XHJcbiAgICAgICAgY2FzZSA0OiByZXR1cm4gYEN1YXRyb2NpZW50b3MgJHtkZWNlbmFzKG51bURlY2VuYXMpfWA7XHJcbiAgICAgICAgY2FzZSA1OiByZXR1cm4gYFF1aW5pZW50b3MgJHtkZWNlbmFzKG51bURlY2VuYXMpfWA7XHJcbiAgICAgICAgY2FzZSA2OiByZXR1cm4gYFNlaXNjaWVudG9zICR7ZGVjZW5hcyhudW1EZWNlbmFzKX1gO1xyXG4gICAgICAgIGNhc2UgNzogcmV0dXJuIGBTZXRlY2llbnRvcyAke2RlY2VuYXMobnVtRGVjZW5hcyl9YDtcclxuICAgICAgICBjYXNlIDg6IHJldHVybiBgT2Nob2NpZW50b3MgJHtkZWNlbmFzKG51bURlY2VuYXMpfWA7XHJcbiAgICAgICAgY2FzZSA5OiByZXR1cm4gYE5vdmVjaWVudG9zICR7ZGVjZW5hcyhudW1EZWNlbmFzKX1gO1xyXG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiBkZWNlbmFzKG51bURlY2VuYXMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZWNjaW9uKG51bSwgZGl2aXNvciwgc3RyU2luZ3VsYXIsIHN0clBsdXJhbCkge1xyXG4gICAgY29uc3QgbnVtQ2llbnRvcyA9IE1hdGguZmxvb3IobnVtIC8gZGl2aXNvcik7XHJcbiAgICBjb25zdCBudW1SZXN0byA9IG51bSAtIChudW1DaWVudG9zICogZGl2aXNvcik7XHJcblxyXG4gICAgbGV0IGxldHJhcyA9ICcnO1xyXG5cclxuICAgIGlmIChudW1DaWVudG9zID4gMCkge1xyXG4gICAgICAgIGlmIChudW1DaWVudG9zID4gMSkge1xyXG4gICAgICAgICAgICBsZXRyYXMgPSBgJHtjZW50ZW5hcyhudW1DaWVudG9zKX0gJHtzdHJQbHVyYWx9YDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXRyYXMgPSBzdHJTaW5ndWxhcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG51bVJlc3RvID4gMCkge1xyXG4gICAgICAgIGxldHJhcyArPSAnJztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbGV0cmFzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtaWxlcyhudW0pIHtcclxuICAgIGNvbnN0IGRpdmlzb3IgPSAxMDAwO1xyXG4gICAgY29uc3QgbnVtQ2llbnRvcyA9IE1hdGguZmxvb3IobnVtIC8gZGl2aXNvcik7XHJcbiAgICBjb25zdCBudW1SZXN0byA9IG51bSAtIChudW1DaWVudG9zICogZGl2aXNvcik7XHJcbiAgICBjb25zdCBzdHJNaWxlcyA9IHNlY2Npb24obnVtLCBkaXZpc29yLCAnVW4gTWlsJywgJ01pbCcpO1xyXG4gICAgY29uc3Qgc3RyQ2VudGVuYXMgPSBjZW50ZW5hcyhudW1SZXN0byk7XHJcblxyXG4gICAgaWYgKHN0ck1pbGVzID09PSAnJykge1xyXG4gICAgICAgIHJldHVybiBzdHJDZW50ZW5hcztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYCR7c3RyTWlsZXN9ICR7c3RyQ2VudGVuYXN9YC50cmltKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1pbGxvbmVzKG51bSkge1xyXG4gICAgY29uc3QgZGl2aXNvciA9IDEwMDAwMDA7XHJcbiAgICBjb25zdCBudW1DaWVudG9zID0gTWF0aC5mbG9vcihudW0gLyBkaXZpc29yKTtcclxuICAgIGNvbnN0IG51bVJlc3RvID0gbnVtIC0gKG51bUNpZW50b3MgKiBkaXZpc29yKTtcclxuICAgIGNvbnN0IHN0ck1pbGxvbmVzID0gc2VjY2lvbihudW0sIGRpdmlzb3IsICdVbiBNaWxsw7NuIGRlJywgJ01pbGxvbmVzIGRlJyk7XHJcbiAgICBjb25zdCBzdHJNaWxlcyA9IG1pbGVzKG51bVJlc3RvKTtcclxuXHJcbiAgICBpZiAoc3RyTWlsbG9uZXMgPT09ICcnKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ck1pbGVzO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBgJHtzdHJNaWxsb25lc30gJHtzdHJNaWxlc31gLnRyaW0oKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbGF0aW5OdW1lcm9zQUxldHJhcyhudW0sIGxldHJhc01vbmVkYVBsdXJhbCwgbGV0cmFzTW9uZWRhU2luZ3VsYXIpIHtcclxuICAgIGNvbnN0IGRhdGEgPSB7XHJcbiAgICAgICAgbnVtZXJvOiBudW0sXHJcbiAgICAgICAgZW50ZXJvczogTWF0aC5mbG9vcihudW0pLFxyXG4gICAgICAgIGNlbnRhdm9zOiAoKChNYXRoLnJvdW5kKG51bSAqIDEwMCkpIC0gKE1hdGguZmxvb3IobnVtKSAqIDEwMCkpKSxcclxuICAgICAgICBsZXRyYXNDZW50YXZvczogJycsXHJcbiAgICAgICAgbGV0cmFzTW9uZWRhUGx1cmFsOiBsZXRyYXNNb25lZGFQbHVyYWwsXHJcbiAgICAgICAgbGV0cmFzTW9uZWRhU2luZ3VsYXI6IGxldHJhc01vbmVkYVNpbmd1bGFyLFxyXG4gICAgICAgIGxldHJhc01vbmVkYUNlbnRhdm9QbHVyYWw6ICdjZW50YXZvcycsXHJcbiAgICAgICAgbGV0cmFzTW9uZWRhQ2VudGF2b1Npbmd1bGFyOiAnY2VudGF2bycsXHJcbiAgICB9O1xyXG5cclxuICAgIGlmIChkYXRhLmNlbnRhdm9zID4gMCkge1xyXG4gICAgICAgIGRhdGEubGV0cmFzQ2VudGF2b3MgPSAoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5jZW50YXZvcyA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGBjb24gJHttaWxsb25lcyhkYXRhLmNlbnRhdm9zKX0gJHtkYXRhLmxldHJhc01vbmVkYUNlbnRhdm9TaW5ndWxhcn1gO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYGNvbiAke21pbGxvbmVzKGRhdGEuY2VudGF2b3MpfSAke2RhdGEubGV0cmFzTW9uZWRhQ2VudGF2b1BsdXJhbH1gO1xyXG4gICAgICAgIH0pKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRhdGEuZW50ZXJvcyA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiBgQ2VybyAke2RhdGEubGV0cmFzTW9uZWRhUGx1cmFsfSAke2RhdGEubGV0cmFzQ2VudGF2b3N9YC50cmltKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRhdGEuZW50ZXJvcyA9PT0gMSkge1xyXG4gICAgICAgIHJldHVybiBgJHttaWxsb25lcyhkYXRhLmVudGVyb3MpfSAke2RhdGEubGV0cmFzTW9uZWRhU2luZ3VsYXJ9ICR7ZGF0YS5sZXRyYXNDZW50YXZvc31gLnRyaW0oKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYCR7bWlsbG9uZXMoZGF0YS5lbnRlcm9zKX0gJHtkYXRhLmxldHJhc01vbmVkYVBsdXJhbH0gJHtkYXRhLmxldHJhc0NlbnRhdm9zfWAudHJpbSgpO1xyXG59XHJcblxyXG4vL2V4cG9ydCBkZWZhdWx0IGxhdGluTnVtZXJvc0FMZXRyYXM7XHJcbiIsIndpbmRvdy5md1NldHRpbmdzID0ge1xyXG4gICAgJ3dpZGdldF9pZCc6IDQ3MDAwMDA0Mjk3XHJcbn07XHJcbiFmdW5jdGlvbiAoKSB7IGlmIChcImZ1bmN0aW9uXCIgIT0gdHlwZW9mIHdpbmRvdy5GcmVzaHdvcmtzV2lkZ2V0KSB7IHZhciBuID0gZnVuY3Rpb24gKCkgeyBuLnEucHVzaChhcmd1bWVudHMpIH07IG4ucSA9IFtdLCB3aW5kb3cuRnJlc2h3b3Jrc1dpZGdldCA9IG4gfSB9KClcclxuXHJcbnZhciBGd0Jvb3RzdHJhcCA9IGZ1bmN0aW9uIChlKSB7IHZhciB0ID0ge307IGZ1bmN0aW9uIGkobikgeyBpZiAodFtuXSkgcmV0dXJuIHRbbl0uZXhwb3J0czsgdmFyIG8gPSB0W25dID0geyBpOiBuLCBsOiAhMSwgZXhwb3J0czoge30gfTsgcmV0dXJuIGVbbl0uY2FsbChvLmV4cG9ydHMsIG8sIG8uZXhwb3J0cywgaSksIG8ubCA9ICEwLCBvLmV4cG9ydHMgfSByZXR1cm4gaS5tID0gZSwgaS5jID0gdCwgaS5kID0gZnVuY3Rpb24gKGUsIHQsIG4pIHsgaS5vKGUsIHQpIHx8IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlLCB0LCB7IGVudW1lcmFibGU6ICEwLCBnZXQ6IG4gfSkgfSwgaS5yID0gZnVuY3Rpb24gKGUpIHsgXCJ1bmRlZmluZWRcIiAhPSB0eXBlb2YgU3ltYm9sICYmIFN5bWJvbC50b1N0cmluZ1RhZyAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkoZSwgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiBcIk1vZHVsZVwiIH0pLCBPYmplY3QuZGVmaW5lUHJvcGVydHkoZSwgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6ICEwIH0pIH0sIGkudCA9IGZ1bmN0aW9uIChlLCB0KSB7IGlmICgxICYgdCAmJiAoZSA9IGkoZSkpLCA4ICYgdCkgcmV0dXJuIGU7IGlmICg0ICYgdCAmJiBcIm9iamVjdFwiID09IHR5cGVvZiBlICYmIGUgJiYgZS5fX2VzTW9kdWxlKSByZXR1cm4gZTsgdmFyIG4gPSBPYmplY3QuY3JlYXRlKG51bGwpOyBpZiAoaS5yKG4pLCBPYmplY3QuZGVmaW5lUHJvcGVydHkobiwgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogITAsIHZhbHVlOiBlIH0pLCAyICYgdCAmJiBcInN0cmluZ1wiICE9IHR5cGVvZiBlKSBmb3IgKHZhciBvIGluIGUpIGkuZChuLCBvLCBmdW5jdGlvbiAodCkgeyByZXR1cm4gZVt0XSB9LmJpbmQobnVsbCwgbykpOyByZXR1cm4gbiB9LCBpLm4gPSBmdW5jdGlvbiAoZSkgeyB2YXIgdCA9IGUgJiYgZS5fX2VzTW9kdWxlID8gZnVuY3Rpb24gKCkgeyByZXR1cm4gZS5kZWZhdWx0IH0gOiBmdW5jdGlvbiAoKSB7IHJldHVybiBlIH07IHJldHVybiBpLmQodCwgXCJhXCIsIHQpLCB0IH0sIGkubyA9IGZ1bmN0aW9uIChlLCB0KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZSwgdCkgfSwgaS5wID0gXCJodHRwczovL3dpZGdldC5mcmVzaHdvcmtzLmNvbS93aWRnZXRCYXNlL1wiLCBpKGkucyA9IDApIH0oW2Z1bmN0aW9uIChlLCB0LCBpKSB7IGUuZXhwb3J0cyA9IGkoMikgfSwgZnVuY3Rpb24gKGUsIHQpIHsgZS5leHBvcnRzID0gXCJodHRwczovL3dpZGdldC5mcmVzaHdvcmtzLmNvbS93aWRnZXRCYXNlL3N0YXRpYy9tZWRpYS9mcmFtZS5kN2FlMTMyYy5jc3NcIiB9LCBmdW5jdGlvbiAoZSwgdCwgaSkgeyBcInVzZSBzdHJpY3RcIjsgaS5yKHQpOyB2YXIgbiA9IFtcIkZydXN0cmF0aW9uVHJhY2tpbmdcIiwgXCJQcmVkaWN0aXZlXCJdLCBvID0geyBib290OiBcInF1ZXVlQ29tcGxldGVcIiwgb3BlbjogXCJvcGVuV2lkZ2V0XCIsIGNsb3NlOiBcImNsb3NlV2lkZ2V0XCIsIGRlc3Ryb3k6IFwiZGVzdHJveVdpZGdldFwiLCBpZGVudGlmeTogXCJpZGVudGlmeUZvcm1GaWVsZHNcIiwgcHJlZmlsbDogXCJwcmVmaWxsRm9ybUZpZWxkc1wiLCBjbGVhcjogXCJjbGVhckZvcm1GaWVsZHNcIiwgaGlkZTogXCJoaWRlV2lkZ2V0XCIsIGhpZGVMYXVuY2hlcjogXCJoaWRlTGF1bmNoZXJcIiwgc2hvd0xhdW5jaGVyOiBcInNob3dMYXVuY2hlclwiLCBzaG93OiBcInNob3dXaWRnZXRcIiwgc2V0TGFiZWxzOiBcInNldExhYmVsc1wiLCB1cGRhdGVTZXR0aW5nczogXCJ1cGRhdGVTZXR0aW5nc1wiLCB1cGRhdGVQcmV2aWV3U2V0dGluZ3M6IFwidXBkYXRlUHJldmlld1NldHRpbmdzXCIsIHJlbG9hZENvbXBvbmVudHM6IFwicmVsb2FkQ29tcG9uZW50c1wiLCBhdXRoZW50aWNhdGU6IFwiYXV0aGVudGljYXRlXCIsIGF1dGhlbnRpY2F0ZUNhbGxiYWNrOiBcImF1dGhlbnRpY2F0ZUNhbGxiYWNrXCIsIGxvZ291dDogXCJsb2dvdXRcIiwgaGlkZUZvcm1GaWVsZHM6IFwiaGlkZUZvcm1GaWVsZHNcIiwgZGlzYWJsZTogbnVsbCwgZGlzYWJsZUZvcm1GaWVsZHM6IFwiZGlzYWJsZUZvcm1GaWVsZHNcIiwgaGlkZUNob2ljZXM6IFwiaGlkZUNob2ljZXNcIiB9LCBzID0geyBpZDogMSwgcHJvZHVjdF9pZDogMSwgYWNjb3VudF9pZDogMSwgbmFtZTogXCJIZWxwIHdpZGdldFwiLCBzZXR0aW5nczogeyBtZXNzYWdlOiBcIlwiLCBidXR0b25fdGV4dDogXCJIZWxwXCIsIGNvbnRhY3RfZm9ybTogeyBmb3JtX3R5cGU6IDIsIGZvcm1fdGl0bGU6IFwiXCIsIGZvcm1fYnV0dG9uX3RleHQ6IFwiU2VuZFwiLCBmb3JtX3N1Ym1pdF9tZXNzYWdlOiBcIlRoYW5rIHlvdSBmb3IgeW91ciBmZWVkYmFjay5cIiwgYXR0YWNoX2ZpbGU6ICEwLCBzY3JlZW5zaG90OiAhMCwgY2FwdGNoYTogITEgfSwgYXBwZWFyYW5jZTogeyBwb3NpdGlvbjogMSwgb2Zmc2V0X2Zyb21fcmlnaHQ6IDMwLCBvZmZzZXRfZnJvbV9sZWZ0OiAzMCwgb2Zmc2V0X2Zyb21fYm90dG9tOiAzMCwgdGhlbWVfY29sb3I6IFwiIzIzOTJlY1wiLCBidXR0b25fY29sb3I6IFwiIzE2MTkzZVwiIH0sIGNvbXBvbmVudHM6IHsgY29udGFjdF9mb3JtOiAhMCwgc29sdXRpb25fYXJ0aWNsZXM6ICEwIH0sIHByZWRpY3RpdmVfc3VwcG9ydDogeyB3ZWxjb21lX21lc3NhZ2U6IFwiXCIsIG1lc3NhZ2U6IFwiV2Ugbm90aWNlZCB5b3XDouKCrOKEonJlIHN0dWNrLiBUZWxsIHVzIHdoYXQgeW91IHdlcmUgdHJ5aW5nIHRvIGFjY29tcGxpc2gsIGFuZCBvdXIgc3VwcG9ydCB0ZWFtIHdpbGwgcmVhY2ggb3V0IHRvIHlvdSBhcyBzb29uIGFzIHBvc3NpYmxlLlwiLCBzdWNjZXNzX21lc3NhZ2U6IFwiVGhhbmtzLiBXZSdsbCBiZSBpbiB0b3VjaCFcIiwgZG9tYWluX2xpc3Q6IFtcImZyZXNocG8uY29tXCJdIH0sIGhpZGVfbGF1bmNoZXJfYnlkZWZhdWx0OiAhMCB9LCBhY3RpdmU6ICEwLCB1cGRhdGVkX2F0OiBcIjIwMTgtMTAtMDFUMTQ6MTY6MDUrMDU6MzBcIiwgYWNjb3VudF91cmw6IFwiaHR0cHM6Ly9sb2NhbGhvc3QuZnJlc2hkZXNrLWRldi5jb21cIiwgbGFuZ3VhZ2VzOiB7IHByaW1hcnk6IFwiZXMtTEFcIiwgc3VwcG9ydGVkOiBbXCJlblwiLFwiY2FcIiwgXCJjc1wiLCBcImRhXCIsIFwiZGVcIiwgXCJlcy1MQVwiLCBcImVzXCIsIFwiZXRcIiwgXCJmaVwiLCBcImZyXCIsIFwiaHVcIiwgXCJpZFwiLCBcIml0XCIsIFwiamEtSlBcIiwgXCJrb1wiLCBcIm5iLU5PXCIsIFwibmxcIiwgXCJwbFwiLCBcInB0LUJSXCIsIFwicHQtUFRcIiwgXCJydS1SVVwiLCBcInN2LVNFXCIsIFwic2tcIiwgXCJzbFwiLCBcInRyXCIsIFwidmlcIiwgXCJ6aC1DTlwiLCBcInVrXCIsIFwidGhcIiwgXCJyb1wiLCBcInpoLVRXXCIsIFwibHYtTFZcIiwgXCJic1wiLCBcImJnXCIsIFwiaHJcIiwgXCJlbFwiLCBcIm1zXCIsIFwibHRcIiwgXCJzclwiXSB9IH07IGZ1bmN0aW9uIHIoKSB7IHJldHVybiB3aW5kb3cuZndTZXR0aW5ncyAmJiB3aW5kb3cuZndTZXR0aW5ncy5wcmV2aWV3IH0gZnVuY3Rpb24gYShlLCB0KSB7IHJldHVybiBlLmluZGV4T2YodCkgPj0gMCB9IHZhciBjID0geyBpbml0OiBmdW5jdGlvbiAoKSB7IHZhciBlID0gd2luZG93LmZ3U2V0dGluZ3Mud2lkZ2V0X2lkOyBpZiAoZSkgaWYgKHRoaXMub3JpZ2luID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiwgcigpKSB7IHZhciB0ID0gczsgdC5pZCA9IGUsIHRoaXMuaW5pdFdpZGdldCh0KSB9IGVsc2UgeyB2YXIgaSA9IFwiXCIuY29uY2F0KFwiaHR0cHM6Ly93aWRnZXQuZnJlc2h3b3Jrcy5jb21cIiwgXCIvd2lkZ2V0cy9cIikuY29uY2F0KGUsIFwiLmpzb24/cmFuZG9tSWQ9XCIpLmNvbmNhdChNYXRoLnJhbmRvbSgpKTsgdGhpcy5mZXRjaFNldHRpbmdzKGksIHRoaXMuaW5pdFdpZGdldC5iaW5kKHRoaXMpKSB9IH0sIGZldGNoU2V0dGluZ3M6IGZ1bmN0aW9uIChlLCB0KSB7IHZhciBpID0gbmV3IFhNTEh0dHBSZXF1ZXN0OyBpLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHsgNCA9PT0gaS5yZWFkeVN0YXRlICYmIDIwMCA9PT0gaS5zdGF0dXMgJiYgdChmdW5jdGlvbiAoZSkgeyB0cnkgeyByZXR1cm4gSlNPTi5wYXJzZShlKSB9IGNhdGNoICh0KSB7IHJldHVybiBlIH0gfShpLnJlc3BvbnNlKSkgfSwgaS5vcGVuKFwiZ2V0XCIsIGUpLCBpLnJlc3BvbnNlVHlwZSA9IFwianNvblwiLCBpLnNlbmQoKSB9LCBzaG93V2lkZ2V0OiBmdW5jdGlvbiAoZSkgeyB2YXIgdCA9ICExLCBpID0gZS5tZXRhLCBuID0gZS5zZXR0aW5ncywgbyA9IGUuY29tcG9uZW50czsgcmV0dXJuIChvIHx8IG4uY29tcG9uZW50cykgJiYgW1wiY29udGFjdF9mb3JtXCIsIFwic29sdXRpb25fYXJ0aWNsZXNcIiwgXCJmcnVzdHJhdGlvbl90cmFja2luZ1wiLCBcInByZWRpY3RpdmVfc3VwcG9ydFwiXS5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7IHZhciBzID0gaSAmJiBpLmRhdGFfdmVyc2lvbiAmJiBvID8gb1tlXSAmJiBvW2VdLmVuYWJsZWQgOiBuLmNvbXBvbmVudHNbZV07IHQgPSB0IHx8IEJvb2xlYW4ocykgfSksIHQgfSwgaW5pdFdpZGdldDogZnVuY3Rpb24gKGUpIHsgdmFyIHQ7IG51bGwgIT0gKHQgPSBlKSAmJiAwICE9PSBPYmplY3Qua2V5cyh0KS5sZW5ndGggJiYgZSAmJiB0aGlzLnNob3dXaWRnZXQoZSkgJiYgKHRoaXMub3B0aW9ucyA9IGUsIHdpbmRvdy5md1NldHRpbmdzLm9yaWdpblVybCA9IHRoaXMub3JpZ2luLCB3aW5kb3cuZndTZXR0aW5ncy5vcHRpb25zID0gZSwgdGhpcy5jcmVhdGVNb3VudFBvaW50KCksIHRoaXMubG9hZElGcmFtZSgpLCB0aGlzLmxvYWRKUygpKSB9LCBjcmVhdGVNb3VudFBvaW50OiBmdW5jdGlvbiAoKSB7IHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTsgZS5pZCA9IFwiZnJlc2h3b3Jrcy1jb250YWluZXJcIiwgZS5zdHlsZS53aWR0aCA9IFwiMHB4XCIsIGUuc3R5bGUuaGVpZ2h0ID0gXCIwcHhcIiwgZS5zdHlsZS5ib3R0b20gPSBcIjBweFwiLCBlLnN0eWxlLnJpZ2h0ID0gXCIwcHhcIiwgZS5zdHlsZS56SW5kZXggPSBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiwgZS5zZXRBdHRyaWJ1dGUoXCJkYXRhLWh0bWwyY2FudmFzLWlnbm9yZVwiLCAhMCksIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZSk7IHZhciB0ID0gaSgxKSwgbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaW5rXCIpOyBuLmlkID0gXCJmcmVzaHdvcmtzLWZyYW1lXCIsIG4ucmVsID0gXCJzdHlsZXNoZWV0XCIsIG4uaHJlZiA9IHQsIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobikgfSwgbG9hZElGcmFtZTogZnVuY3Rpb24gKCkgeyB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7IGUuc2V0QXR0cmlidXRlKFwidGl0bGVcIiwgXCJGcmVzaHdvcmtzV2lkZ2V0XCIpLCBlLnNldEF0dHJpYnV0ZShcImlkXCIsIFwiZnJlc2h3b3Jrcy1mcmFtZVwiKSwgZS5zZXRBdHRyaWJ1dGUoXCJkYXRhLWh0bWwyY2FudmFzLWlnbm9yZVwiLCAhMCksIGUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiLCBlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHsgdmFyIHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlua1wiKTsgdC5zZXRBdHRyaWJ1dGUoXCJyZWxcIiwgXCJwcmVjb25uZWN0XCIpLCB0LnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJodHRwczovL3dpZGdldC5mcmVzaHdvcmtzLmNvbS93aWRnZXRCYXNlXCIpLCBlLmNvbnRlbnREb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHQpIH0sIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZSksIHRoaXMuX2ZyYW1lID0gZTsgdmFyIHQgPSBlLmNvbnRlbnREb2N1bWVudCB8fCBlLmRvY3VtZW50OyB0Lm9wZW4oKTsgdmFyIGkgPSAnPHNjcmlwdCBzcmM9XCInLmNvbmNhdChcImh0dHBzOi8vd2lkZ2V0LmZyZXNod29ya3MuY29tL3dpZGdldEJhc2VcIiwgJy93aWRnZXQuanNcIiBhc3luYyBkZWZlcj48XFwvc2NyaXB0PicpOyB0LndyaXRlKGkpLCB0LmNsb3NlKCksIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyID8gd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMuaGFuZGxlTWVzc2FnZS5iaW5kKHRoaXMpLCAhMCkgOiB3aW5kb3cuYXR0YWNoRXZlbnQoXCJtZXNzYWdlXCIsIHRoaXMuaGFuZGxlTWVzc2FnZS5iaW5kKHRoaXMpLCAhMCkgfSwgbG9hZEpTOiBmdW5jdGlvbiAoKSB7IGlmICh0aGlzLmlzRnJ1c3RyYXRpb25UcmFja2luZ0VuYWJsZWQoKSkgeyB2YXIgZSA9IHRoaXMuZnJ1c3RyYXRpb25UcmFja2luZ0RhdGEoKTsgaWYgKGUgJiYgIXdpbmRvdy5GTSAmJiAhcigpKSB7IHZhciB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTsgdC5zcmMgPSBcIlwiLmNvbmNhdChcImh0dHBzOi8vY2RuLmZyZXNobWFya2V0ZXIuY29tXCIsIFwiL1wiKS5jb25jYXQoZS5vcmdfaWQsIFwiL1wiKS5jb25jYXQoZS5wcm9qZWN0X2lkLCBcIi5qc1wiKSwgdC5hc3luYyA9ICEwLCBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHQpIH0gfSB9LCBoZWxwV2lkZ2V0TWV0aG9kczogZnVuY3Rpb24gKGUsIHQsIGkpIHsgaWYgKGUgJiYgY1tlXSAmJiBhKE9iamVjdC5rZXlzKG8pLCBlKSkgcmV0dXJuIGNbZV0odCwgaSkgfSwgd2lkZ2V0UmVuZGVyQ29tcGxldGU6IGZ1bmN0aW9uICgpIHsgdmFyIGUgPSB3aW5kb3cuRnJlc2h3b3Jrc1dpZGdldCAmJiB3aW5kb3cuRnJlc2h3b3Jrc1dpZGdldC5xIHx8IFtdOyB3aW5kb3cuRnJlc2h3b3Jrc1dpZGdldCA9IHRoaXMuaGVscFdpZGdldE1ldGhvZHMsIGUuZm9yRWFjaChmdW5jdGlvbiAoZSkgeyB3aW5kb3cuRnJlc2h3b3Jrc1dpZGdldC5hcHBseShudWxsLCBlKSB9KSwgdGhpcy5wb3N0TWVzc2FnZShvLmJvb3QpIH0sIGhhbmRsZU1lc3NhZ2U6IGZ1bmN0aW9uIChlKSB7IHZhciB0ID0gZS5kYXRhLCBpID0gdC5ldmVudE5hbWUsIG4gPSB0LmRhdGE7IChpIHx8IFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgdGhpc1tpXSkgJiYgdGhpc1tpXShuKSB9LCBwb3N0TWVzc2FnZTogZnVuY3Rpb24gKGUpIHsgdmFyIHQgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiB2b2lkIDAgIT09IGFyZ3VtZW50c1sxXSA/IGFyZ3VtZW50c1sxXSA6IHt9OyB0aGlzLl9mcmFtZS5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKHsgZXZlbnROYW1lOiBlLCBkYXRhOiB0IH0sIGEodGhpcy5vcmlnaW4sIFwiZmlsZTovL1wiKSA/IG51bGwgOiB0aGlzLm9yaWdpbikgfSwgYm9vdDogZnVuY3Rpb24gKCkgeyB0aGlzLl9mcmFtZS5jb250ZW50V2luZG93LldpZGdldC5tb3VudCh0aGlzLm9yaWdpbiksIHRoaXMucG9zdE1lc3NhZ2Uoby5ib290KSB9LCBpc0ZydXN0cmF0aW9uVHJhY2tpbmdFbmFibGVkOiBmdW5jdGlvbiAoKSB7IHZhciBlID0gdGhpcy5vcHRpb25zLCB0ID0gZS5tZXRhLCBpID0gZS5zZXR0aW5ncywgbiA9IGUuY29tcG9uZW50czsgcmV0dXJuIHQgJiYgdC5kYXRhX3ZlcnNpb24gJiYgbiA/IG4uZnJ1c3RyYXRpb25fdHJhY2tpbmcgJiYgQm9vbGVhbihuLmZydXN0cmF0aW9uX3RyYWNraW5nLmVuYWJsZWQpIDogQm9vbGVhbihpLmNvbXBvbmVudHMucHJlZGljdGl2ZV9zdXBwb3J0KSB9LCBmcnVzdHJhdGlvblRyYWNraW5nRGF0YTogZnVuY3Rpb24gKCkgeyB2YXIgZSA9IHRoaXMub3B0aW9ucywgdCA9IGUubWV0YSwgaSA9IGUuc2V0dGluZ3MsIG4gPSBlLmZyZXNobWFya2V0ZXI7IHJldHVybiB0ICYmIHQuZGF0YV92ZXJzaW9uID8gbiA6IGkuZnJlc2htYXJrZXRlciB9LCBvcGVuOiBmdW5jdGlvbiAoZSwgdCkgeyB2YXIgaSA9IChlIHx8IHt9KS53aWRnZXRUeXBlOyBpZiAoZSAmJiBpICYmIGEobiwgaSkpIHsgaWYgKCF0aGlzLmlzRnJ1c3RyYXRpb25UcmFja2luZ0VuYWJsZWQoKSAmJiAhcigpKSByZXR1cm47IHRoaXMuX2ZyYW1lLmNvbnRlbnRXaW5kb3cuV2lkZ2V0LmVsIHx8IHRoaXMuX2ZyYW1lLmNvbnRlbnRXaW5kb3cuV2lkZ2V0Lm1vdW50KHRoaXMub3JpZ2luLCBlLndpZGdldFR5cGUpIH0gdGhpcy5wb3N0TWVzc2FnZShvLm9wZW4sIHsgY2FyZFR5cGU6IGUsIGRhdGE6IHQgfSkgfSwgY2xvc2U6IGZ1bmN0aW9uICgpIHsgdGhpcy5wb3N0TWVzc2FnZShvLmNsb3NlKSB9LCBwcmVmaWxsOiBmdW5jdGlvbiAoZSwgdCkgeyB0aGlzLnBvc3RNZXNzYWdlKG8ucHJlZmlsbCwgeyBmb3JtTmFtZTogZSwgZm9ybUZpZWxkczogdCB9KSB9LCBpZGVudGlmeTogZnVuY3Rpb24gKGUsIHQpIHsgdGhpcy5wb3N0TWVzc2FnZShvLmlkZW50aWZ5LCB7IGZvcm1OYW1lOiBlLCBmb3JtRmllbGRzOiB0IH0pIH0sIGRpc2FibGU6IGZ1bmN0aW9uIChlLCB0KSB7IHRoaXMucG9zdE1lc3NhZ2Uoby5kaXNhYmxlRm9ybUZpZWxkcywgeyBmb3JtTmFtZTogZSwgZm9ybUZpZWxkczogdCB9KSB9LCBjbGVhcjogZnVuY3Rpb24gKGUpIHsgdGhpcy5wb3N0TWVzc2FnZShvLmNsZWFyLCB7IGZvcm1OYW1lOiBlIH0pIH0sIGhpZGU6IGZ1bmN0aW9uIChlLCB0KSB7IGUgPyB0ID8gdGhpcy5wb3N0TWVzc2FnZShvLmhpZGVGb3JtRmllbGRzLCB7IGZvcm1OYW1lOiBlLCBmb3JtRmllbGRzOiB0IH0pIDogXCJsYXVuY2hlclwiID09PSBlICYmIHRoaXMucG9zdE1lc3NhZ2Uoby5oaWRlTGF1bmNoZXIpIDogdGhpcy5wb3N0TWVzc2FnZShvLmhpZGUpIH0sIHNob3c6IGZ1bmN0aW9uIChlKSB7IFwibGF1bmNoZXJcIiA9PT0gZSA/IHRoaXMucG9zdE1lc3NhZ2Uoby5zaG93TGF1bmNoZXIpIDogdGhpcy5wb3N0TWVzc2FnZShvLnNob3cpIH0sIGhpZGVDaG9pY2VzOiBmdW5jdGlvbiAoZSwgdCkgeyB0aGlzLnBvc3RNZXNzYWdlKG8uaGlkZUNob2ljZXMsIHsgZm9ybU5hbWU6IGUsIGZvcm1GaWVsZHNBbmRDaG9pY2VzOiB0IH0pIH0sIHNldExhYmVsczogZnVuY3Rpb24gKGUpIHsgdGhpcy5wb3N0TWVzc2FnZShvLnNldExhYmVscywgZSkgfSwgdXBkYXRlU2V0dGluZ3M6IGZ1bmN0aW9uIChlKSB7IHRoaXMucG9zdE1lc3NhZ2Uoby51cGRhdGVTZXR0aW5ncywgZSkgfSwgdXBkYXRlUHJldmlld1NldHRpbmdzOiBmdW5jdGlvbiAoZSkgeyB0aGlzLnBvc3RNZXNzYWdlKG8udXBkYXRlUHJldmlld1NldHRpbmdzLCBlKSB9LCByZWxvYWRDb21wb25lbnRzOiBmdW5jdGlvbiAoKSB7IHRoaXMucG9zdE1lc3NhZ2Uoby5yZWxvYWRDb21wb25lbnRzKSB9LCBkZXN0cm95OiBmdW5jdGlvbiAoKSB7IHRoaXMuX2ZyYW1lLmNvbnRlbnRXaW5kb3cuV2lkZ2V0LnVubW91bnQoKSB9LCBhdXRoZW50aWNhdGU6IGZ1bmN0aW9uIChlKSB7IHZhciB0ID0gZS5jYWxsYmFjaywgaSA9IGUudG9rZW4sIG4gPSB0ICYmIFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgdCwgcyA9IFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgdGhpcy5hdXRoZW50aWNhdGVDYWxsYmFjaywgciA9IG4gfHwgczsgbiAmJiAodGhpcy5hdXRoZW50aWNhdGVDYWxsYmFjayA9IHQpLCB0aGlzLnBvc3RNZXNzYWdlKG8uYXV0aGVudGljYXRlLCB7IHRva2VuOiBpLCBoYXNDYWxsYmFjazogciB9KSB9LCBsb2dvdXQ6IGZ1bmN0aW9uICgpIHsgdGhpcy5wb3N0TWVzc2FnZShvLmxvZ291dCkgfSB9OyBjLmluaXQoKSB9XSk7XHJcblxyXG4iXX0=
