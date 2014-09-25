/**
 * Wake up!
 * Grab a brush and put a little makeup!
 *
 * @requires jQuery
 * @requires lodash
 */
var Makeup = (function($, _) {
    var makeup;

    var internationalDelimiters = {
        be: '__',
        bm: '--',
        em: '--',
        mm: '--'
    };

    var russianDelimiters = {
        be: '__',
        bm: '_',
        em: '_',
        mm: '_'
    };

    /**
     * @param {string} re
     * @returns {string}
     */
    function escapeRegExp(re) {
        return re.replace(/([?!\.{}[+\-\]^|$(=:)\/\\*])/g, '\\$1');
    }

    /**
     * @param {string} str
     * @returns {string}
     */
    function stripTags(str) {
        return str.replace(/<[^>]+>/g, '');
    }

    function Makeup(options) {
        if (typeof makeup == 'object') {
            return makeup;
        } else {
            makeup = this;
        }

        makeup._init(options);
    }

    Makeup.prototype = {
        constructor: Makeup,

        _state: {},

        _init: function(options) {

            this._params = this._viewModel(_.merge({

                selectors: {
                    element: '.makeup',

                    searchInput: '.makeup__search-input',

                    sidebar: '.makeup__aside',
                    scroller: '.makeup__aside-in',
                    scrollerTrack: '.makeup__aside-track',
                    scrollerTrackBar: '.makeup__aside-track-bar',
                    module: '.makeup__module',
                    moduleHeader: '.makeup__module-header',
                    moduleType: '.makeup__subnav-link',

                    modeControl: '.makeup__mode',
                    bgControl: '.makeup__bg',

                    slider: '.makeup__slider',
                    sliderTrack: '.makeup__slider-track',
                    sliderTrackRunner: '.makeup__slider-track-runner',

                    ruler: '.makeup__ruler-track',
                    rulerTrack: '.makeup__ruler-track-in',
                    rulerTrackActive: '.makeup__ruler-track-active',
                    rulerTrackRunner: '.makeup__ruler-track-runner',
                    rulerTrackPoint: '.makeup__ruler-track-point',

                    statusBar: '.makeup__status',

                    box: '.makeup__main',
                    container: '.makeup__container',
                    containerImage: '.makeup__container-image',
                    containerMarkup: '.makeup__container-markup'
                },

                modifiers: {
                    hiddenModule: 'makeup__module--hidden',
                    hiddenModuleType: 'makeup__subnav-link--hidden',
                    baron: 'makeup__aside--baron'
                },

                menu: {
                    tooltip: 'Toggle menu',
                    checked: true
                },

                search: {
                    placeholder: ''
                },

                mode: {
                    label: 'Mode',

                    items: [
                        {
                            tooltip: 'Image',
                            value: '1',
                            checked: true
                        },
                        {
                            tooltip: 'Markup',
                            value: '2',
                        },
                        {
                            tooltip: 'Markup and image',
                            value: '3',
                        },
                        {
                            tooltip: 'Markup and inversed image',
                            value: '4',
                        }
                    ]
                },

                background: {
                    label: 'Background',

                    items: [
                        {
                            tooltip: 'Gray',
                            value: 'color',
                            checked: true
                        },
                        {
                            tooltip: 'Transparency grid',
                            value: 'transparency'
                        }
                    ]
                },

                transparency: {
                    label: 'Transparency',

                    slider: {
                        min: 0,
                        max: 1,
                        value: 1
                    }
                },

                zoom: {
                    label: 'Zoom',

                    slider: {
                        min: 1,
                        max: 4,
                        value: 1
                    }
                },

                ruler: {
                    h: {
                        type: 'ruler',
                        name: 'makeup-ruler-h',

                        slider: {
                            min: 0,
                            max: 2000,
                            value: 400
                        }
                    },
                    v: {
                        type: 'ruler',
                        name: 'makeup-ruler-v',

                        slider: {
                            min: 0,
                            max: 1000,
                            step: 10
                        }
                    }
                },

                renderModule: function() {},

                delimiters: internationalDelimiters

            }, options));

            $('body').append(makeupTemplates.makeup(this._params));

            this._state = new State();
            this._bindListeners();
        },

        _bindListeners: function() {
            var makeup = this,
                params = this._params,
                win = $(window);
            /*
            Baron
            Rader
            — меню
            — поиск
            — смена режима
            — смена фона
            — масштаб
            — прозрачность
            — сворачивание/разворачивание элементов списка
            — линейки
            — дополнительно: статусбар (ховер по элементам, комментарии к модулю/типу)
            — дополнительно: настройки (масштаб)
            */

            win.on('statechange', function(e) {
                makeup._setState(e.state);
            });

            this._bindMenuListeners();

            if (params.search) {
                this._bindSearchListeners();
            }

            if (params.mode) {
                this._bindModesListeners();
            }

            if (params.background) {
                this._bindBackgroundsListeners();
            }

            if (params.transparency) {
                this._bindTransparencyListeners();
            }

            if (params.zoom) {
                this._bindZoomListeners();
            }

            if (params.ruler) {
                this._bindRulerListeners();
            }
        },

        /**
         * Menu
         */
        _bindMenuListeners: function() {
            var that = this,
                sidebar = $(this._params.selectors.sidebar),
                moduleHeader = $(this._params.selectors.moduleHeader),
                moduleType = $(this._params.selectors.moduleType);

            moduleHeader.on('click', function() {
                var directory = this.parentNode;

                if (that._mod(directory).expandable) {
                    toggleMenuItem(directory);
                } else {
                    var id = directory.dataset.id,
                        module = that._params.modules[id];

                    that._setStatus(escapeHTML(module.name));

                    setCurrent(this);
                    that._renderModule(module);
                }
            });

            moduleType.on('click', function() {
                var directory = this.parentNode.parentNode,
                    id = directory.dataset.id,
                    module = that._params.modules[id];

                that._setStatus(escapeHTML(module.name) + ' → ' + escapeHTML(trimString($(this).text())));

                setCurrent(this);
                that._renderModule(module);
            });

            if (this._params.menu) {
                var toggleMenu = $('#makeup-menu');

                toggleMenu.on('change', function() {
                    makeup._state.set({ menu: this.checked });
                });
            }

            this._baron = sidebar.baron({
                scroller: this._params.selectors.scroller,
                track:    this._params.selectors.scrollerTrack,
                bar:      this._params.selectors.scrollerTrackBar,
                barOnCls: this._params.modifiers.baron
            });

            /**
             * Toggle navigation item
             */
            function toggleMenuItem(directory) {
                that._mod(directory, {expanded: !that._mod(directory).expanded});
                that._baron.update();
            }

            /**
             * Set current menu item
             */
            function setCurrent(currentItem) {
                moduleHeader.each(function(i) {
                    that._mod(moduleHeader[i], {current: false});
                });
                moduleType.each(function(i) {
                    that._mod(moduleType[i], {current: false});
                });

                that._mod(currentItem, {current: true});
            }
        },

        /**
         * Search control listeners
         */
        _bindSearchListeners: function() {
            var makeup = this,
                searchInput = $(makeup._params.selectors.searchInput),
                module = $(makeup._params.selectors.module),
                moduleType = $(makeup._params.selectors.moduleType);

            searchInput.on('keyup', function() {
                module.removeClass(makeup._params.modifiers.hiddenModule);
                moduleType.removeClass(makeup._params.modifiers.hiddenModuleType);

                var re = searchInput.val().replace(/\s+/g, '');

                if (!re) {
                    return;
                }

                var re = _(re)
                    .reduce(function(chars, chr) {
                        chars.push(escapeRegExp(chr));
                        return chars;
                    }, [])
                    .join('.*?');

                re = new RegExp('.*?' + re + '.*?', 'i');

                moduleType.each(function() {
                    if (!re.test(stripTags(this.innerHTML).replace(/\s+/g, ''))) {
                        this._shown = false;
                        $(this).addClass(makeup._params.modifiers.hiddenModuleType);
                    } else {
                        this._shown = true;
                    }
                });

                module.each(function() {
                    makeup._mod(this, {expanded: false});

                    var moduleType = $(this).find(makeup._params.selectors.moduleType);
                    var hasShown = false;

                    moduleType.each(function() {
                        if (this._shown) {
                            hasShown = true;
                            return false;
                        }
                    });

                    if (hasShown) {
                        makeup._mod(this, {expanded: true});
                    } else {
                        $(this).addClass(makeup._params.modifiers.hiddenModule);
                    }
                });
            });
        },

        /**
         * Mode control listeners
         */
        _bindModesListeners: function() {
            var makeup = this,
                makeupElement = $(makeup._params.selectors.element),
                modeControl = $(makeup._params.selectors.modeControl);

            modeControl.on('change', function() {
                var value;

                modeControl.each(function(i) {
                    if (modeControl[i].checked == true) {
                        value = modeControl[i].value;
                    }
                });

                makeup._mod(makeupElement[0], {mode: value});
            });
        },

        /**
         * Background control listeners
         */
        _bindBackgroundsListeners: function() {
            var makeup = this,
                makeupElement = $(makeup._params.selectors.element),
                bgControl = $(makeup._params.selectors.bgControl);

            bgControl.on('change', function() {
                var value;

                bgControl.each(function(i) {
                    if (bgControl[i].checked == true) {
                        value = bgControl[i].value;
                    }
                });

                makeup._mod(makeupElement[0], {bg: value});
            });
        },

        /**
         * Background control listeners
         */
        _bindTransparencyListeners: function() {
            var makeup = this,

                min = this._params.transparency.slider.min,
                max = this._params.transparency.slider.max,
                value = this._params.transparency.slider.value,

                slider = $(this._params.selectors.slider).filter('.makeup__slider--transparency'),
                sliderTrack = slider.find(this._params.selectors.sliderTrack),
                sliderTrackRunner = slider.find(this._params.selectors.sliderTrackRunner),
                sliderTrackPoint = slider.find(this._params.selectors.sliderTrackPoint);


            sliderTrack.rader({
                points: sliderTrackPoint,
                runners: sliderTrackRunner,
                runnersVal: [value],
                values: [min, max],
                pointsPos: [min, max],

                onUpdate: function(e) {
                    var value = Math.round(e.minVal * 100) / 100;

                    makeup._state.set({ transparency: value });
                }
            });
        },

        /**
         * Background control listeners
         */
        _bindZoomListeners: function() {
            var makeup = this,

                min = this._params.zoom.slider.min,
                max = this._params.zoom.slider.max,
                value = this._params.zoom.slider.value,

                slider = $(this._params.selectors.slider).filter('.makeup__slider--zoom'),
                sliderTrack = slider.find(this._params.selectors.sliderTrack),
                sliderTrackRunner = slider.find(this._params.selectors.sliderTrackRunner),
                sliderTrackPoint = slider.find(this._params.selectors.sliderTrackPoint);


            sliderTrack.rader({
                points: sliderTrackPoint,
                runners: sliderTrackRunner,
                runnersVal: [value],
                values: [min, max],
                pointsPos: [min, max],

                onUpdate: function(e) {
                    var value = Math.round(e.minVal * 100) / 100;

                    makeup._state.set({ zoom: value });
                }
            });
        },

        /**
         * Background control listeners
         */
        _bindRulerListeners: function() {
            var makeup = this,

                ruler = $(this._params.selectors.ruler),
                rulerTrack = ruler.find(this._params.selectors.rulerTrack),
                rulerTrackActive = ruler.find(this._params.selectors.rulerTrackActive),
                rulerTrackRunner = ruler.find(this._params.selectors.rulerTrackRunner),
                rulerTrackPoint = ruler.find(this._params.selectors.rulerTrackPoint),

                min = this._params.ruler.h.slider.min,
                max = this._params.ruler.h.slider.max,
                value = this._params.ruler.h.slider.value,

                horizontalRuler,
                pos = [],
                i = 0;

            while (i <= 2000) {
                pos.push(i);
                i += 100;
            }

            horizontalRuler = rulerTrack.rader({
                trackActive: rulerTrackActive,
                runners: rulerTrackRunner,
                points: rulerTrackPoint,
                pointsPos: pos,
                values: [min, max],
                stickingRadius: 5,
                onUpdate: function(e) {
                    makeup._state.set({ width: e.maxVal.toFixed(0) })
                }
            });

            horizontalRuler.pos(0, 0);
            horizontalRuler.pos(1, value);
        },

        /**
         * Set application state from object
         *
         * @param {Object} state
         */
        _setState: function(state) {
            if (!state) {
                return;
            }

            var params = this._params,
                makeupElement = $(this._params.selectors.element),
                box = $(this._params.selectors.box),
                container = $(this._params.selectors.container);

            // Menu toggler
            if (state.hasOwnProperty('menu')) {
                this._mod(makeupElement[0], {menu: state.menu});
            }

            // Transparency
            if (state.hasOwnProperty('transparency')) {
                container.css({
                    opacity: validateRangeValue(state.transparency, params.transparency.slider)
                });
            }

            // Zoom
            if (state.hasOwnProperty('zoom')) {
                container.css({
                    transform: 'scale(' + validateRangeValue(state.zoom, params.zoom.slider) + ')'
                });
            }

            // Width
            if (state.hasOwnProperty('width')) {
                container.css({
                    width: validateRangeValue(state.width, params.ruler.h.slider) + 'px'
                });
            }

            /**
             * Validate range value
             *
             * @param {Number} value
             * @param {Object} options
             */
            function validateRangeValue(value, options) {
                if (value < options.min) {
                    return options.min;
                }

                if (value > options.max) {
                    return options.max;
                }

                return value;
            }
        },

        /**
         * Sets text on status bar
         *
         * @param {String} str text of status
         */
        _setStatus: function(str) {
            var that = this;

            $(that._params.selectors.statusBar).text(str || '');
        },

        /**
         * Render module
         */
        _renderModule: function(module) {
            console.log(module);

            // User method
            this._params.renderModule(module);
        },

        /**
         * Устанавливает модификаторы modifiers на элемент el
         *
         * @param {HTMLElement} el - нода, на которую будет устанавливаться можификаторы
         * @param {Object} modifiers - одноуровневый объект модификаторов
         */
        _mod: function(el, modifiers) {
            if (!el.mod) {
                el.mod = this._parseMod(el);
                //el.blockName = this._detectBEM(el, this.delimiters).blockName;
                el.blockName = el.classList[0];
            }

            if (!modifiers) {
                return el.mod;
            } else {
                var newMods = _.merge(_.clone(el.mod), modifiers),
                    oldMods = el.mod,
                    operations = [];

                _(newMods).forIn(function(value, key) {

                    console.log(key, !oldMods[key]);

                    // Add modifier
                    if (!oldMods[key]) {
                        operations.push({key: key, value: value, isRemove: false});
                        return;
                    }

                    // Remove modifier
                    if (!value) {
                        operations.push({key: key, value: oldMods[key], isRemove: true});
                        return;
                    }

                    // Change value
                    operations.push(
                        {key: key, value: oldMods[key], isRemove: true},
                        {key: key, value: value, isRemove: false}
                    );

                });

                _(operations).forEach(function(item) {
                    var value = item.value === true ? '' : '-' + item.value,
                        modifier = el.blockName + '--' + item.key + value;

                    if (item.isRemove) {
                        $(el).removeClass(modifier);
                    } else {
                        $(el).addClass(modifier);
                    }
                });

                el.mod = newMods;
            }
        },

        /**
         * Пытается найти имя блока или элемента в классах, тип элемента (блок или элемент)
         *
         * @param {HTMLElement} el - детектируемый дом-элемент
         * @param {Object} delimiters - объект разделителей
         * @return {Object} - объект результата парсинга
         */
        _detectBEM: function(el, delimiters) {
            delimiters = delimiters || this._params.delimiters;
            if (delimiters.be == delimiters.bm || delimiters.be == delimiters.mm) {
                throw new Error('Block-Element delimiter must be unique!');
            }

            var type; // el является блоком или элементом

            // Пытаемся найти имя блока
            var name = _.find(el.classList, function(cls) { // Итерируем по всем классам на элементе
                return _.reduce(delimiters, function(result, value, key) { // И возвращаем первый попавшийся, в составе которого нет ни одного разделителя
                    return result && cls.indexOf(value) == -1;
                }, true);
            });

            if (name) {
                type = 'block';
            } else { // Если блок не нашёлся, пытаемся найти имя элемента
                var dems = _.omit(delimiters, ['be']);

                name = _.find(el.classList, function(cls) { // Итерируем по всем классам на элементе
                    return !_.reduce(dems, function(result, value, key) { // И возвращаем первый попавшийся, в составе которого нет ни одного разделителя
                        re = new RegExp('([A-Za-z\d]|^)' + value + '[A-Za-z\d]'); // 'awefa_qwe', '_qwew' -> true, 'freafewAWEr' -> false
                        return result || cls.match(re);
                    }, false);
                });

                if (name) {
                    type = 'element';
                } else {
                    throw new Error('No blockname nor elementname found in classes: ' + el.classList.join(', '));
                }
            }

            return {
                type: type,
                name: name,
                blockName: name.split(delimiters.be)[0],
                elementName: type == 'element' ? name : null
            };
        },

        /**
         * Парсит модификаторы по классам с дом-элемента
         *
         * @param {HTMLElement} el - дом-элемент, с которого будут считываться модификаторы
         * @param {Object} delimiters - объект разделителей
         * @param {Object} params - дополнительные параметры, например, использование бевиса
         * @return {Object} - объект модификаторов
         */
        _parseMod: function(el, delimiters, params) {
            params = params || {};
            delimiters = delimiters || this._params.delimiters;

            var bem = this._detectBEM(el, delimiters, params);

            // Переделываем классы в объект модификаторов
            var mods = _.reduce(el.classList, function(result, cls) {
                if (cls == bem.name) {
                    return result;
                }

                var re;
                var delm = bem.mode == 'block' ? delimiters.bm : delimiters.em;

                if (params.bevis) {
                    re = new RegExp('^' + delm + '([\w\-]*)'); // '_state_open' -> 'state_open'
                } else {
                    re = new RegExp('^' + bem.name + delm + '([\w\-]*)'); // '(block__)element_state_open' -> 'state_open'
                }
                var tail = _.compact(cls.replace(re, '').split(delimiters.mm));

                if (tail) {
                    var key = tail[0];
                    var value = tail[1];

                    if (!value) {
                        value = 'true';
                    }

                    result[key] = value;
                }

                return result;
            }, {});

            return mods;
        },

        /**
         * View model
         */
        _viewModel: function(data) {
            var model = data || {},
                out = model;

            if (model && model.modules) {
                out.modules = this._parseCollection(model.modules);
            }

            console.log(out);
            return out;
        },

        /**
         * Parse item
         */
        _parseItem: function(item) {
            var out = {};

            if (typeof item == 'string') {
                out.name = item;
            } else if (item instanceof Object) {
                var children = item.items,
                    documentation = item.documentation,
                    meta = item.meta;

                out = item;
                out.name = out.name || 'Untitled';

                // Documentation
                if (documentation) {
                    if (documentation instanceof Array && documentation.length) {
                        out.documentation = this._parseCollection(documentation, this._parseDocumentation);
                    } else if (typeof documentation == 'string') {
                        out.documentation = [this._parseDocumentation(documentation)];
                    }
                }

                // Meta
                if (item.meta && item.meta instanceof Array && item.meta.length) {
                    out.meta = this._parseCollection(meta, this._parseMeta);
                }

                // Children
                if (children && children instanceof Array && children.length) {
                    out.items = this._parseCollection(children);
                }
            }

            out.label = out.label || out.name;

            return out;
        },

        /**
         * Parse collection
         */
        _parseCollection: function(arr, func) {
            var out = [],
                that = this;

            _(arr).compact().forEach(function(item) {
                out.push(func ? func(item) : that._parseItem(item));
            });

            return out;
        },

        /**
         * Parse documentation
         */
        _parseDocumentation: function(item) {
            var out = {};

            if (typeof item == 'string') {
                out.link = item;
            } else if (item instanceof Object && item.link) {
                out.link = item.link;
                out.label = item.label || out.link;

                if (item.modifier) {
                    out.modifier = item.modifier;
                }
            }

            return out;
        },

        /**
         * Parse meta
         */
        _parseMeta: function(item) {
            var out = {};

            if (typeof item == 'string') {
                out.key = item;
            } else if (item instanceof Object && item.key) {
                out = item;
            }

            return out;
        }
    };

    /**
     * @param {string} str
     * @returns {string}
     */
    function trimString(str) {
        return str.replace(/^\s+|\s+$/g, '');
    }

    /**
     * @param {string} str
     * @returns {string}
     */
    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    if (typeof TEST != 'undefined' && TEST) {
        //module.exports = Makeup.prototype;
    }

    return Makeup;
})(jQuery, _);
