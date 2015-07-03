(function () {
    (function init() {
        polyfillGetElementsByClassName();
        polyfillQuerySelectorAll();
        polyfillQuerySelector();
        var containers = document.getElementsByClassName("adc-imageCounter");
        for (var j = 0, l = containers.length; j < l; j++) {
            var labels = containers[j].getElementsByTagName("label");
            for (var i = 0, k = labels.length; i < k; i++) {
                labels[i].onmouseover = displayHover();
                labels[i].onmouseout = hideHover();
                labels[i].onclick = incrementCounter;
                simplboxConstructorCall(labels[i].htmlFor);
            }
            var minus = document.querySelectorAll("#" + containers[j].id + " .Minus"),
                plus = document.querySelectorAll("#" + containers[j].id + " .Plus");
            for (var n = 0, m = minus.length; n < m; n++) {
                minus[n].onclick = decrementCounter;
                plus[n].onclick = incrementCounter;
            }
            var inputs = document.querySelectorAll("#" + containers[j].id + " .Count");
            for (var p = 0, q = inputs.length; p < q; p++) {
                inputs[p].children[1].onkeypress = function(e){
                    validateInputNumber(e, this);
                };
                inputs[p].children[1].oninput = verifyMax(containers[j].id);
                inputs[p].children[1].onchange = toggleSelectionState();
                inputs[p].children[1].onchange();
            }
            var exclusives = document.querySelectorAll("#" + containers[j].id + " .exclusiveItemWrapper");
            for (var r = 0, s = exclusives.length; r < s; r++) {
                exclusives[r].onclick = toggleExclusive();
            }
        }
        updateTotal();
    }());

    // Polyfill: Add a getElementsByClassName function IE < 9
    function polyfillGetElementsByClassName() {
        if (!document.getElementsByClassName) {
            document.getElementsByClassName = function (search) {
                var d = document, elements, pattern, i, results = [];
                if (d.querySelectorAll) { // IE8
                    return d.querySelectorAll("." + search);
                }
                if (d.evaluate) { // IE6, IE7
                    pattern = ".//*[contains(concat(' ', @class, ' '), ' " + search + " ')]";
                    elements = d.evaluate(pattern, d, null, 0, null);
                    while ((i = elements.iterateNext())) {
                        results.push(i);
                    }
                } else {
                    elements = d.getElementsByTagName("*");
                    pattern = new RegExp("(^|\\s)" + search + "(\\s|$)");
                    for (var j = 0, l = elements.length; j < l; j++) {
                        if (pattern.test(elements[j].className)) {
                            results.push(elements[j]);
                        }
                    }
                }
                return results;
            }
        }
    }

    // Polyfill: Add a querySelectorAll function IE 7
    function polyfillQuerySelectorAll() {
        if (!document.querySelectorAll) {
            document.querySelectorAll = function (selectors) {
                var style = document.createElement('style'), elements = [], element;
                document.documentElement.firstChild.appendChild(style);
                document._qsa = [];

                style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
                window.scrollBy(0, 0);
                style.parentNode.removeChild(style);

                while (document._qsa.length) {
                    element = document._qsa.shift();
                    element.style.removeAttribute('x-qsa');
                    elements.push(element);
                }
                document._qsa = null;
                return elements;
            }
        }
    }

    // Polyfill: Add a querySelector function IE 7
    function polyfillQuerySelector() {
        if (!document.querySelector) {
            document.querySelector = function (selectors) {
                var elements = document.querySelectorAll(selectors);
                return (elements.length) ? elements[0] : null;
            };
        }
    }

    function hasClass(ele, cls) {
        return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    }

    function addClass(ele, cls) {
        if (!hasClass(ele, cls)) ele.className += " " + cls;
    }

    function removeClass(ele, cls) {
        if (hasClass(ele, cls)) {
            var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
            ele.className = ele.className.replace(reg, '');
        }
    }

    function displayHover() {
        return function () {
            if (hasClass(this.parentNode, "responseItem")) {
                var input = document.getElementById(this.htmlFor),
                    cls = "stateOff",
                    clsHover = "stateHover",
                    obj = this.children[0].children[0];
                if (!(input.value >= 1) || (isNaN(input.value))) {
                    removeClass(obj, cls);
                    addClass(obj, clsHover);
                }
            }
        }
    }

    function hideHover() {
        return function () {
            if (hasClass(this.parentNode, "responseItem")) {
                var input = document.getElementById(this.htmlFor),
                    cls = "stateOff",
                    clsHover = "stateHover",
                    obj = this.children[0].children[0];
                if (!(input.value >= 1) || (isNaN(input.value))) {
                    removeClass(obj, clsHover);
                    addClass(obj, cls);
                }
            }
        }
    }

    function incrementCounter() {
        var input = document.getElementById(this.getAttribute("data-id")),
            counter = document.getElementById("id" + this.getAttribute("data-id")),
            value = parseInt(input.value, 10),
            maxValue = parseFloat(input.parentNode.parentNode.parentNode.getAttribute("data-maxspent").replace(/\s+/g, "")),
            price = input.parentNode.parentNode.getAttribute("data-price").replace(/\s+/g, ""),
            sum = calculateSum(this.getAttribute("data-adcid")),
            nextSum = (sum + (price != "" ? parseFloat(price) : 1));
        value = isNaN(value) ? 0 : value;
        if (!(value >= parseInt(input.getAttribute("max"), 10)) && nextSum <= maxValue && !isNaN(maxValue)
            || !(value >= parseInt(input.getAttribute("max"), 10)) && isNaN(maxValue)) {
            value++;
        }
        input.value = (value != 0) ? value.toString() : "";
        counter.innerHTML = (value != 0) ? value.toString() : "";
        input.onchange();
        manageExclusives(this);
    }

    function decrementCounter() {
        var input = document.getElementById(this.getAttribute("data-id")),
            counter = document.getElementById("id" + this.getAttribute("data-id")),
            value = parseInt(input.value, 10);
        if (!isNaN(value)) {
            if (value >= 1) value--;
            input.value = (value != 0) ? value.toString() : "";
            counter.innerHTML = (value != 0) ? value.toString() : "";
            input.onchange();
        }
    }

    function toggleSelectionState() {
        return function () {
            var cls = "stateOff",
                clsHover = "stateHover",
                clsSel = "stateOn",
                obj = this.parentNode.parentNode.children[0].children[0].children[0],
                counter = this.parentNode.parentNode.children[2];
            if (this.value >= 1) {
                removeClass(obj, cls);
                removeClass(obj, clsHover);
                addClass(obj, clsSel);
                counter.style.display = "";
                manageExclusives(this);
            } else {
                this.value = "";
                removeClass(obj, clsSel);
                addClass(obj, cls);
                counter.style.display = "none";
            }
            counter.children[0].innerHTML = this.value.toString();
            updateTotal();
        }
    }

    function toggleExclusive() {
        return function () {
            var input = document.getElementById(this.getAttribute("data-id")),
                cls = "exclusiveItem",
                clsSel = "exclusiveItemSelected",
                obj = this.children[0];
            if (input.value >= 1) {
                input.value = "";
                addClass(obj, cls);
                removeClass(obj, clsSel);
            } else {
                input.value = "1";
                addClass(obj, clsSel);
                removeClass(obj, cls);
                manageExclusives(this);
            }
        }
    }

    function manageExclusives(ele) {
        var  condition = (ele.className != "exclusiveItemWrapper"),
            cls = (condition) ? " .exclusiveItemWrapper" : " .responseItem",
            items = document.querySelectorAll("#" + ele.getAttribute("data-adcid").toString() + cls);
        for (var i = 0, j = items.length; i < j; i++) {
            var selector = (condition)? items[i].getAttribute("data-id") : items[i].children[0].getAttribute("data-id"),
                input = document.getElementById(selector);
            if (input.value >= 1) {
                input.value = "";
                if (condition) {
                    addClass(input.parentNode, "exclusiveItem");
                    removeClass(input.parentNode, "exclusiveItemSelected");
                } else {
                    input.onchange();
                }
            }
        }
        if (!condition) {
            var excls = document.querySelectorAll("#" + ele.getAttribute("data-adcid").toString() + " .exclusiveItemWrapper");
            for (var k = 0, l = excls.length; k < l; k++) {
                var selectorExcl = excls[k].getAttribute("data-id"),
                    inputExcl = document.getElementById(selectorExcl);
                if (excls[k] !== ele && inputExcl.value >= 1) {
                    inputExcl.value = "";
                    addClass(inputExcl.parentNode, "exclusiveItem");
                    removeClass(inputExcl.parentNode, "exclusiveItemSelected");
                }
            }
        }
    }

    function simplboxConstructorCall(strId) {
        var preLoadIconOn = function () {
            var newE = document.createElement("div"),
                newB = document.createElement("div");
            newE.setAttribute("id", "simplbox-loading");
            newE.appendChild(newB);
            document.body.appendChild(newE);
        },
        preLoadIconOff = function () {
            var elE = document.getElementById("simplbox-loading");
            elE.parentNode.removeChild(elE);
        },
        overlayOn = function () {
            var newA = document.createElement("div");
            newA.setAttribute("id", "simplbox-overlay");
            document.body.appendChild(newA);
        },
        overlayOff = function () {
            var elA = document.getElementById("simplbox-overlay");
            elA.parentNode.removeChild(elA);
        };
        var img = new SimplBox(document.querySelectorAll("[data-simplbox='" + strId + "']"), {
            onStart: overlayOn,
            onEnd: overlayOff,
            onImageLoadStart: preLoadIconOn,
            onImageLoadEnd: preLoadIconOff
        });
        img.init();
    }

    function alwaysTwoDigit(amount) {
        var i = parseFloat(amount);
        if (isNaN(i)) i = 0.00;
        var minus = "";
        if (i < 0) minus = "-";
        i = Math.abs(i);
        i = parseInt((i + .005) * 100);
        i = i / 100;
        var s = i.toString();
        if (s.indexOf(".") < 0) s += ".00";
        if (s.indexOf(".") == (s.length - 2)) s += "0";
        s = minus + s;
        return s;
    }

    function updateTotal() {
        var containers = document.getElementsByClassName("adc-imageCounter");
        for (var j = 0, l = containers.length; j < l; j++) {
            var sum = calculateSum(containers[j].id),
                maxValue = parseFloat(containers[j].getAttribute("data-maxspent").replace(/\s+/g, "")),
                isRemain = containers[j].getAttribute("data-isremain"),
                totalValue = document.getElementById(containers[j].id + "_totalValue");
            if ((isRemain == "1" && !isNaN(maxValue))) {
                totalValue.innerHTML = alwaysTwoDigit(maxValue - sum);
            } else {
                totalValue.innerHTML = alwaysTwoDigit(sum);
            }
        }
    }

    function calculateSum(strAdcId) {
        var sum = 0,
            inputs = document.querySelectorAll("#" + strAdcId + " .Count"),
            prices = document.querySelectorAll("#" + strAdcId + " .responseItem");
        for (var i = 0, j = inputs.length; i < j; i++) {
            var input = inputs[i].children[1].value,
                price = prices[i].getAttribute("data-price").replace(/\s+/g, "");
            sum += ((!isNaN(parseFloat(input)) ? parseFloat(input) : 0) * (price != "" ? parseFloat(price) : 1))
        }
        return sum;
    }

    function verifyMax(strAdcId) {
        return function () {
            var maxValue = parseFloat(document.getElementById(strAdcId).getAttribute("data-maxspent").replace(/\s+/g, ""));
            if (calculateSum(strAdcId) > maxValue && !isNaN(maxValue)) {
                this.value = ((parseFloat(this.value) - 1) >= 1) ? (parseFloat(this.value) - 1) : "";
            }
        }
    }

    function validateInputNumber(e, obj){
        var evt = e || window.event,
            code = evt.keyCode || evt.charCode,
            max = parseInt(obj.getAttribute("max"), 10),
            maxValue = parseFloat(obj.parentNode.parentNode.parentNode.getAttribute("data-maxspent").replace(/\s+/g, "")),
            newStr = parseFloat(String.fromCharCode(code)),
            oldValue = ((!obj.value) ? "" : obj.value.toString()),
            newValue = parseFloat("" + oldValue + newStr.toString()),
            price = parseFloat(obj.parentNode.parentNode.getAttribute("data-price").replace(/\s+/g, "")),
            diff = parseFloat("" + oldValue + newStr.toString()) - parseFloat(oldValue),
            sum = calculateSum(obj.getAttribute("data-adcid"));

        if ((!(code >= 48 && code <= 57)
            && code != 46
            && code != 8
            && code != 37
            && code != 39)
            || (!isNaN(maxValue) && !isNaN(diff) && (((diff * price) + sum) > maxValue))
            || (!isNaN(newValue) && !isNaN(max) && (newValue > max))) {

                if (!e.preventDefault) {
                    e.returnValue = false;
                } else {
                    e.preventDefault();
                }
        }
    }

}());