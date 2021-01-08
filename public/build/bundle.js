
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function each(items, fn) {
        let str = '';
        for (let i = 0; i < items.length; i += 1) {
            str += fn(items[i], i);
        }
        return str;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Ourfood.svelte generated by Svelte v3.31.2 */

    const file = "src\\Ourfood.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i].id;
    	child_ctx[5] = list[i].img;
    	child_ctx[6] = list[i].name;
    	child_ctx[7] = list[i].view;
    	child_ctx[8] = list[i].date;
    	child_ctx[9] = list[i].eat;
    	child_ctx[10] = list[i].country1;
    	child_ctx[11] = list[i].country2;
    	child_ctx[12] = list[i].iconheart;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i].starimg;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i].id;
    	child_ctx[5] = list[i].img;
    	child_ctx[6] = list[i].name;
    	child_ctx[7] = list[i].view;
    	child_ctx[8] = list[i].date;
    	child_ctx[9] = list[i].eat;
    	child_ctx[10] = list[i].country1;
    	child_ctx[12] = list[i].iconheart;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i].starimg;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i].id;
    	child_ctx[5] = list[i].img;
    	child_ctx[6] = list[i].name;
    	child_ctx[7] = list[i].view;
    	child_ctx[8] = list[i].date;
    	child_ctx[9] = list[i].eat;
    	child_ctx[10] = list[i].country1;
    	child_ctx[11] = list[i].country2;
    	child_ctx[12] = list[i].iconheart;
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i].starimg;
    	return child_ctx;
    }

    // (103:24) {#each star as {starimg}
    function create_each_block_5(ctx) {
    	let li;
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			i = element("i");
    			t = space();
    			attr_dev(i, "class", ctx[15]);
    			attr_dev(i, "aria-hidden", "true");
    			add_location(i, file, 104, 32, 2903);
    			add_location(li, file, 103, 28, 2865);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, i);
    			append_dev(li, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(103:24) {#each star as {starimg}",
    		ctx
    	});

    	return block;
    }

    // (88:4) {#each meal as {id,img,name,view,date,eat,country1,country2,iconheart}
    function create_each_block_4(ctx) {
    	let li2;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let i0;
    	let t1;
    	let div6;
    	let div2;
    	let a;
    	let t2_value = /*name*/ ctx[6] + "";
    	let t2;
    	let t3;
    	let i1;
    	let t4;
    	let div3;
    	let ul0;
    	let t5;
    	let span;
    	let t6_value = /*view*/ ctx[7] + "";
    	let t6;
    	let t7;
    	let t8;
    	let div5;
    	let ul1;
    	let li0;
    	let t9_value = /*country1*/ ctx[10] + "";
    	let t9;
    	let t10;
    	let li1;
    	let t11_value = /*country2*/ ctx[11] + "";
    	let t11;
    	let t12;
    	let div4;
    	let i2;
    	let t13_value = /*date*/ ctx[8] + "";
    	let t13;
    	let each_value_5 = /*star*/ ctx[2];
    	validate_each_argument(each_value_5);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	const block = {
    		c: function create() {
    			li2 = element("li");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			i0 = element("i");
    			t1 = space();
    			div6 = element("div");
    			div2 = element("div");
    			a = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			i1 = element("i");
    			t4 = space();
    			div3 = element("div");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			span = element("span");
    			t6 = text(t6_value);
    			t7 = text(" Preview");
    			t8 = space();
    			div5 = element("div");
    			ul1 = element("ul");
    			li0 = element("li");
    			t9 = text(t9_value);
    			t10 = space();
    			li1 = element("li");
    			t11 = text(t11_value);
    			t12 = space();
    			div4 = element("div");
    			i2 = element("i");
    			t13 = text(t13_value);
    			if (img.src !== (img_src_value = /*img*/ ctx[5])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "hamburger.png");
    			add_location(img, file, 90, 16, 2350);
    			attr_dev(i0, "class", ctx[9]);
    			add_location(i0, file, 92, 20, 2456);
    			attr_dev(div0, "class", "food-items-icon");
    			add_location(div0, file, 91, 16, 2405);
    			attr_dev(div1, "class", "food");
    			add_location(div1, file, 89, 12, 2314);
    			add_location(a, file, 97, 20, 2619);
    			attr_dev(i1, "class", ctx[12]);
    			attr_dev(i1, "aria-hidden", "true");
    			add_location(i1, file, 98, 20, 2654);
    			attr_dev(div2, "class", "food-name");
    			add_location(div2, file, 96, 16, 2574);
    			add_location(ul0, file, 101, 20, 2779);
    			add_location(span, file, 108, 20, 3060);
    			attr_dev(div3, "class", "price");
    			add_location(div3, file, 100, 16, 2738);
    			add_location(li0, file, 112, 24, 3202);
    			add_location(li1, file, 113, 24, 3247);
    			add_location(ul1, file, 111, 20, 3172);
    			attr_dev(i2, "class", "fa fa-clock-o");
    			attr_dev(i2, "aria-hidden", "true");
    			add_location(i2, file, 115, 25, 3320);
    			add_location(div4, file, 115, 20, 3315);
    			attr_dev(div5, "class", "country");
    			add_location(div5, file, 110, 16, 3129);
    			attr_dev(div6, "class", "info-food");
    			add_location(div6, file, 95, 12, 2533);
    			attr_dev(li2, "class", "col-main");
    			add_location(li2, file, 88, 8, 2279);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li2, anchor);
    			append_dev(li2, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(li2, t1);
    			append_dev(li2, div6);
    			append_dev(div6, div2);
    			append_dev(div2, a);
    			append_dev(a, t2);
    			append_dev(div2, t3);
    			append_dev(div2, i1);
    			append_dev(div6, t4);
    			append_dev(div6, div3);
    			append_dev(div3, ul0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul0, null);
    			}

    			append_dev(div3, t5);
    			append_dev(div3, span);
    			append_dev(span, t6);
    			append_dev(span, t7);
    			append_dev(div6, t8);
    			append_dev(div6, div5);
    			append_dev(div5, ul1);
    			append_dev(ul1, li0);
    			append_dev(li0, t9);
    			append_dev(ul1, t10);
    			append_dev(ul1, li1);
    			append_dev(li1, t11);
    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(div4, i2);
    			append_dev(div4, t13);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*star*/ 4) {
    				each_value_5 = /*star*/ ctx[2];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_5.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(88:4) {#each meal as {id,img,name,view,date,eat,country1,country2,iconheart}",
    		ctx
    	});

    	return block;
    }

    // (136:24) {#each star as {starimg}
    function create_each_block_3(ctx) {
    	let li;
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			i = element("i");
    			t = space();
    			attr_dev(i, "class", ctx[15]);
    			attr_dev(i, "aria-hidden", "true");
    			add_location(i, file, 137, 32, 4154);
    			add_location(li, file, 136, 28, 4116);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, i);
    			append_dev(li, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(136:24) {#each star as {starimg}",
    		ctx
    	});

    	return block;
    }

    // (121:4) {#each meals as {id,img,name,view,date,eat,country1,iconheart}
    function create_each_block_2(ctx) {
    	let li1;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let i0;
    	let t1;
    	let div6;
    	let div2;
    	let a;
    	let t2_value = /*name*/ ctx[6] + "";
    	let t2;
    	let t3;
    	let i1;
    	let t4;
    	let div3;
    	let ul0;
    	let t5;
    	let span;
    	let t6_value = /*view*/ ctx[7] + "";
    	let t6;
    	let t7;
    	let t8;
    	let div5;
    	let ul1;
    	let li0;
    	let t9_value = /*country1*/ ctx[10] + "";
    	let t9;
    	let t10;
    	let div4;
    	let i2;
    	let t11_value = /*date*/ ctx[8] + "";
    	let t11;
    	let t12;
    	let each_value_3 = /*star*/ ctx[2];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			li1 = element("li");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			i0 = element("i");
    			t1 = space();
    			div6 = element("div");
    			div2 = element("div");
    			a = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			i1 = element("i");
    			t4 = space();
    			div3 = element("div");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			span = element("span");
    			t6 = text(t6_value);
    			t7 = text(" Preview");
    			t8 = space();
    			div5 = element("div");
    			ul1 = element("ul");
    			li0 = element("li");
    			t9 = text(t9_value);
    			t10 = space();
    			div4 = element("div");
    			i2 = element("i");
    			t11 = text(t11_value);
    			t12 = space();
    			if (img.src !== (img_src_value = /*img*/ ctx[5])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "hamburger.png");
    			add_location(img, file, 123, 16, 3601);
    			attr_dev(i0, "class", ctx[9]);
    			add_location(i0, file, 125, 20, 3707);
    			attr_dev(div0, "class", "food-items-icon");
    			add_location(div0, file, 124, 16, 3656);
    			attr_dev(div1, "class", "food");
    			add_location(div1, file, 122, 12, 3565);
    			add_location(a, file, 130, 20, 3870);
    			attr_dev(i1, "class", ctx[12]);
    			attr_dev(i1, "aria-hidden", "true");
    			add_location(i1, file, 131, 20, 3905);
    			attr_dev(div2, "class", "food-name");
    			add_location(div2, file, 129, 16, 3825);
    			add_location(ul0, file, 134, 20, 4030);
    			add_location(span, file, 141, 20, 4311);
    			attr_dev(div3, "class", "price");
    			add_location(div3, file, 133, 16, 3989);
    			add_location(li0, file, 145, 24, 4453);
    			add_location(ul1, file, 144, 20, 4423);
    			attr_dev(i2, "class", "fa fa-clock-o");
    			attr_dev(i2, "aria-hidden", "true");
    			add_location(i2, file, 147, 25, 4526);
    			add_location(div4, file, 147, 20, 4521);
    			attr_dev(div5, "class", "country");
    			add_location(div5, file, 143, 16, 4380);
    			attr_dev(div6, "class", "info-food");
    			add_location(div6, file, 128, 12, 3784);
    			attr_dev(li1, "class", "col-main");
    			add_location(li1, file, 121, 8, 3530);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li1, anchor);
    			append_dev(li1, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(li1, t1);
    			append_dev(li1, div6);
    			append_dev(div6, div2);
    			append_dev(div2, a);
    			append_dev(a, t2);
    			append_dev(div2, t3);
    			append_dev(div2, i1);
    			append_dev(div6, t4);
    			append_dev(div6, div3);
    			append_dev(div3, ul0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul0, null);
    			}

    			append_dev(div3, t5);
    			append_dev(div3, span);
    			append_dev(span, t6);
    			append_dev(span, t7);
    			append_dev(div6, t8);
    			append_dev(div6, div5);
    			append_dev(div5, ul1);
    			append_dev(ul1, li0);
    			append_dev(li0, t9);
    			append_dev(div5, t10);
    			append_dev(div5, div4);
    			append_dev(div4, i2);
    			append_dev(div4, t11);
    			append_dev(li1, t12);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*star*/ 4) {
    				each_value_3 = /*star*/ ctx[2];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(121:4) {#each meals as {id,img,name,view,date,eat,country1,iconheart}",
    		ctx
    	});

    	return block;
    }

    // (180:24) {#each star as {starimg}
    function create_each_block_1(ctx) {
    	let li;
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			i = element("i");
    			t = space();
    			attr_dev(i, "class", ctx[15]);
    			attr_dev(i, "aria-hidden", "true");
    			add_location(i, file, 181, 32, 5535);
    			add_location(li, file, 180, 28, 5497);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, i);
    			append_dev(li, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(180:24) {#each star as {starimg}",
    		ctx
    	});

    	return block;
    }

    // (164:4) {#each popular as {id,img,name,view,date,eat,country1,country2,iconheart }}
    function create_each_block(ctx) {
    	let li2;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let i0;
    	let t1;
    	let div6;
    	let div2;
    	let a;
    	let t2_value = /*name*/ ctx[6] + "";
    	let t2;
    	let t3;
    	let i1;
    	let t4;
    	let div3;
    	let ul0;
    	let t5;
    	let span;
    	let t6_value = /*view*/ ctx[7] + "";
    	let t6;
    	let t7;
    	let t8;
    	let div5;
    	let ul1;
    	let li0;
    	let t9_value = /*country1*/ ctx[10] + "";
    	let t9;
    	let t10;
    	let li1;
    	let t11_value = /*country2*/ ctx[11] + "";
    	let t11;
    	let t12;
    	let div4;
    	let i2;
    	let t13_value = /*date*/ ctx[8] + "";
    	let t13;
    	let t14;
    	let each_value_1 = /*star*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			li2 = element("li");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			i0 = element("i");
    			t1 = space();
    			div6 = element("div");
    			div2 = element("div");
    			a = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			i1 = element("i");
    			t4 = space();
    			div3 = element("div");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			span = element("span");
    			t6 = text(t6_value);
    			t7 = text(" Previews");
    			t8 = space();
    			div5 = element("div");
    			ul1 = element("ul");
    			li0 = element("li");
    			t9 = text(t9_value);
    			t10 = space();
    			li1 = element("li");
    			t11 = text(t11_value);
    			t12 = space();
    			div4 = element("div");
    			i2 = element("i");
    			t13 = text(t13_value);
    			t14 = space();
    			if (img.src !== (img_src_value = /*img*/ ctx[5])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "hamburger.png");
    			add_location(img, file, 166, 16, 4964);
    			attr_dev(i0, "class", ctx[9]);
    			add_location(i0, file, 168, 20, 5070);
    			attr_dev(div0, "class", "food-items-icon");
    			add_location(div0, file, 167, 16, 5019);
    			attr_dev(div1, "class", "food");
    			add_location(div1, file, 165, 12, 4928);
    			add_location(a, file, 174, 20, 5251);
    			attr_dev(i1, "class", ctx[12]);
    			attr_dev(i1, "aria-hidden", "true");
    			add_location(i1, file, 175, 20, 5286);
    			attr_dev(div2, "class", "food-name");
    			add_location(div2, file, 173, 16, 5206);
    			add_location(ul0, file, 178, 20, 5411);
    			add_location(span, file, 185, 20, 5692);
    			attr_dev(div3, "class", "price");
    			add_location(div3, file, 177, 16, 5370);
    			add_location(li0, file, 189, 24, 5835);
    			add_location(li1, file, 190, 24, 5880);
    			add_location(ul1, file, 188, 20, 5805);
    			attr_dev(i2, "class", "fa fa-clock-o");
    			attr_dev(i2, "aria-hidden", "true");
    			add_location(i2, file, 192, 25, 5953);
    			add_location(div4, file, 192, 20, 5948);
    			attr_dev(div5, "class", "country");
    			add_location(div5, file, 187, 16, 5762);
    			attr_dev(div6, "class", "info-food");
    			add_location(div6, file, 172, 12, 5165);
    			attr_dev(li2, "class", "col-main");
    			add_location(li2, file, 164, 8, 4893);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li2, anchor);
    			append_dev(li2, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(li2, t1);
    			append_dev(li2, div6);
    			append_dev(div6, div2);
    			append_dev(div2, a);
    			append_dev(a, t2);
    			append_dev(div2, t3);
    			append_dev(div2, i1);
    			append_dev(div6, t4);
    			append_dev(div6, div3);
    			append_dev(div3, ul0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul0, null);
    			}

    			append_dev(div3, t5);
    			append_dev(div3, span);
    			append_dev(span, t6);
    			append_dev(span, t7);
    			append_dev(div6, t8);
    			append_dev(div6, div5);
    			append_dev(div5, ul1);
    			append_dev(ul1, li0);
    			append_dev(li0, t9);
    			append_dev(ul1, t10);
    			append_dev(ul1, li1);
    			append_dev(li1, t11);
    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(div4, i2);
    			append_dev(div4, t13);
    			append_dev(li2, t14);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*star*/ 4) {
    				each_value_1 = /*star*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(164:4) {#each popular as {id,img,name,view,date,eat,country1,country2,iconheart }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let ul0;
    	let t0;
    	let t1;
    	let div1;
    	let div0;
    	let t3;
    	let ul1;
    	let each_value_4 = /*meal*/ ctx[0];
    	validate_each_argument(each_value_4);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_2[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	let each_value_2 = /*meals*/ ctx[3];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value = /*popular*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t0 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "POPULAR";
    			t3 = space();
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul0, "class", "row main");
    			add_location(ul0, file, 86, 0, 2170);
    			attr_dev(div0, "class", "title-feature");
    			add_location(div0, file, 159, 4, 4729);
    			attr_dev(div1, "class", "feature");
    			add_location(div1, file, 158, 0, 4702);
    			attr_dev(ul1, "class", "row main");
    			add_location(ul1, file, 162, 0, 4781);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul0, anchor);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(ul0, null);
    			}

    			append_dev(ul0, t0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul0, null);
    			}

    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, ul1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*meal, star*/ 5) {
    				each_value_4 = /*meal*/ ctx[0];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_4(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(ul0, t0);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_4.length;
    			}

    			if (dirty & /*meals, star*/ 12) {
    				each_value_2 = /*meals*/ ctx[3];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*popular, star*/ 6) {
    				each_value = /*popular*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul0);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(ul1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Ourfood", slots, []);

    	let meal = [
    		{
    			id: "1",
    			name: "Pakistani Chicken Platter",
    			img: "./img/mam.png",
    			view: "32",
    			date: "20-30",
    			eat: "fas fa-mortar-pestle",
    			country1: "Indian",
    			country2: "Pakistani",
    			iconheart: "fa fa-heart"
    		},
    		{
    			id: "2",
    			name: "Risotto",
    			img: "./img/combo.png",
    			view: "20",
    			date: "10-20",
    			eat: "fas fa-mortar-pestle",
    			country1: "Intalian",
    			country2: "Eurpeon",
    			iconheart: "far fa-heart"
    		}
    	];

    	let popular = [
    		{
    			id: "4",
    			name: "Moussouka",
    			img: "./img/banhkep.png",
    			view: "55",
    			date: "15-25",
    			eat: "fas fa-hamburger",
    			country1: "Intalian",
    			country2: "Greek",
    			iconheart: "fa fa-heart"
    		},
    		{
    			id: "5",
    			name: "Capachino",
    			img: "./img/capachinno.png",
    			view: "72",
    			date: "20-30",
    			eat: "fas fa-wine-glass-alt",
    			country1: "American",
    			country2: "Eurpeon",
    			iconheart: "fa fa-heart"
    		},
    		{
    			id: "6",
    			name: "Arabic Mandi",
    			img: "./img/arabic.png",
    			view: "34",
    			date: "35-45",
    			eat: "fas fa-mortar-pestle",
    			country1: "Arabic",
    			country2: "Turkish",
    			iconheart: "far fa-heart"
    		}
    	];

    	let star = [
    		{ starimg: "fa fa-star" },
    		{ starimg: "fa fa-star" },
    		{ starimg: "fa fa-star" },
    		{ starimg: "fa fa-star" },
    		{ starimg: "far fa-star" }
    	];

    	let meals = [
    		{
    			id: "3",
    			name: "Maslenitca",
    			img: "./img/banh.png",
    			view: "45",
    			date: "20-30",
    			eat: "fas fa-stroopwafel",
    			country1: "Russian",
    			country2: "",
    			iconheart: "fa fa-heart"
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Ourfood> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ meal, popular, star, meals });

    	$$self.$inject_state = $$props => {
    		if ("meal" in $$props) $$invalidate(0, meal = $$props.meal);
    		if ("popular" in $$props) $$invalidate(1, popular = $$props.popular);
    		if ("star" in $$props) $$invalidate(2, star = $$props.star);
    		if ("meals" in $$props) $$invalidate(3, meals = $$props.meals);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [meal, popular, star, meals];
    }

    class Ourfood extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ourfood",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\Body.svelte generated by Svelte v3.31.2 */
    const file$1 = "src\\Body.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i].img;
    	child_ctx[2] = list[i].des;
    	child_ctx[3] = list[i].name;
    	child_ctx[4] = list[i].num;
    	return child_ctx;
    }

    // (52:12) {#each menubody as {img, des, name,num}}
    function create_each_block$1(ctx) {
    	let li;
    	let a;
    	let i;
    	let t0_value = /*name*/ ctx[3] + "";
    	let t0;
    	let t1;
    	let t2_value = /*num*/ ctx[4] + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			i = element("i");
    			t0 = text(t0_value);
    			t1 = text(" (");
    			t2 = text(t2_value);
    			t3 = text(")");
    			attr_dev(i, "class", ctx[1]);
    			add_location(i, file$1, 53, 62, 2372);
    			attr_dev(a, "class", "orange-meal");
    			add_location(a, file$1, 53, 39, 2349);
    			attr_dev(li, "class", "items-meal");
    			add_location(li, file$1, 53, 16, 2326);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, i);
    			append_dev(a, t0);
    			append_dev(a, t1);
    			append_dev(a, t2);
    			append_dev(a, t3);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(52:12) {#each menubody as {img, des, name,num}}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div11;
    	let div5;
    	let div4;
    	let div1;
    	let div0;
    	let h10;
    	let t1;
    	let h11;
    	let t3;
    	let h12;
    	let t5;
    	let div3;
    	let div2;
    	let button0;
    	let i0;
    	let span0;
    	let t6;
    	let h30;
    	let t8;
    	let button1;
    	let i1;
    	let span1;
    	let t9;
    	let h31;
    	let t11;
    	let div9;
    	let div6;
    	let t13;
    	let div8;
    	let form;
    	let input;
    	let t14;
    	let i2;
    	let t15;
    	let div7;
    	let button2;
    	let i3;
    	let t16;
    	let div10;
    	let ul;
    	let t17;
    	let ourfood;
    	let current;
    	let each_value = /*menubody*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	ourfood = new Ourfood({ $$inline: true });

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Find Healthy And";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "Favourite foods";
    			t3 = space();
    			h12 = element("h1");
    			h12.textContent = "Near you";
    			t5 = space();
    			div3 = element("div");
    			div2 = element("div");
    			button0 = element("button");
    			i0 = element("i");
    			span0 = element("span");
    			t6 = text("Download on the ");
    			h30 = element("h3");
    			h30.textContent = "App Store";
    			t8 = space();
    			button1 = element("button");
    			i1 = element("i");
    			span1 = element("span");
    			t9 = text("GET IT ON ");
    			h31 = element("h3");
    			h31.textContent = "Google Play";
    			t11 = space();
    			div9 = element("div");
    			div6 = element("div");
    			div6.textContent = "OUR MEAL";
    			t13 = space();
    			div8 = element("div");
    			form = element("form");
    			input = element("input");
    			t14 = space();
    			i2 = element("i");
    			t15 = space();
    			div7 = element("div");
    			button2 = element("button");
    			i3 = element("i");
    			t16 = space();
    			div10 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t17 = space();
    			create_component(ourfood.$$.fragment);
    			add_location(h10, file$1, 17, 20, 817);
    			add_location(h11, file$1, 18, 20, 864);
    			add_location(h12, file$1, 19, 20, 910);
    			attr_dev(div0, "class", "header-title");
    			add_location(div0, file$1, 16, 16, 769);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$1, 15, 12, 734);
    			attr_dev(i0, "class", "fab fa-apple");
    			attr_dev(i0, "aria-hidden", "true");
    			add_location(i0, file$1, 24, 43, 1089);
    			add_location(h30, file$1, 24, 112, 1158);
    			add_location(span0, file$1, 24, 90, 1136);
    			attr_dev(button0, "class", "btn-as");
    			add_location(button0, file$1, 24, 20, 1066);
    			attr_dev(i1, "class", "fab fa-google-play");
    			attr_dev(i1, "aria-hidden", "true");
    			add_location(i1, file$1, 25, 43, 1237);
    			add_location(h31, file$1, 25, 112, 1306);
    			add_location(span1, file$1, 25, 96, 1290);
    			attr_dev(button1, "class", "btn-gg");
    			add_location(button1, file$1, 25, 20, 1214);
    			attr_dev(div2, "class", "header-btn");
    			add_location(div2, file$1, 23, 16, 1020);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$1, 22, 12, 985);
    			attr_dev(div4, "class", "home-table");
    			add_location(div4, file$1, 14, 8, 696);
    			attr_dev(div5, "class", "home-bg-img");
    			add_location(div5, file$1, 13, 4, 661);
    			attr_dev(div6, "class", "title-feature");
    			add_location(div6, file$1, 33, 8, 1477);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "search");
    			attr_dev(input, "placeholder", "search");
    			add_location(input, file$1, 37, 16, 1623);
    			attr_dev(i2, "class", "fa fa-search");
    			attr_dev(i2, "aria-hidden", "true");
    			add_location(i2, file$1, 39, 16, 1765);
    			attr_dev(form, "class", "search-form");
    			add_location(form, file$1, 35, 12, 1562);
    			attr_dev(i3, "class", "fa fa-sliders");
    			attr_dev(i3, "aria-hidden", "true");
    			add_location(i3, file$1, 42, 46, 1918);
    			attr_dev(button2, "class", "btn-btnslider");
    			add_location(button2, file$1, 42, 16, 1888);
    			attr_dev(div7, "class", "icon-slider");
    			add_location(div7, file$1, 41, 12, 1845);
    			attr_dev(div8, "class", "search");
    			add_location(div8, file$1, 34, 8, 1528);
    			attr_dev(div9, "class", "feature");
    			add_location(div9, file$1, 32, 4, 1446);
    			attr_dev(ul, "class", "menu-ourmeal");
    			add_location(ul, file$1, 50, 8, 2107);
    			attr_dev(div10, "class", "menu");
    			add_location(div10, file$1, 49, 4, 2079);
    			attr_dev(div11, "class", "container");
    			add_location(div11, file$1, 12, 0, 632);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h10);
    			append_dev(div0, t1);
    			append_dev(div0, h11);
    			append_dev(div0, t3);
    			append_dev(div0, h12);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(button0, i0);
    			append_dev(button0, span0);
    			append_dev(span0, t6);
    			append_dev(span0, h30);
    			append_dev(div2, t8);
    			append_dev(div2, button1);
    			append_dev(button1, i1);
    			append_dev(button1, span1);
    			append_dev(span1, t9);
    			append_dev(span1, h31);
    			append_dev(div11, t11);
    			append_dev(div11, div9);
    			append_dev(div9, div6);
    			append_dev(div9, t13);
    			append_dev(div9, div8);
    			append_dev(div8, form);
    			append_dev(form, input);
    			append_dev(form, t14);
    			append_dev(form, i2);
    			append_dev(div8, t15);
    			append_dev(div8, div7);
    			append_dev(div7, button2);
    			append_dev(button2, i3);
    			append_dev(div11, t16);
    			append_dev(div11, div10);
    			append_dev(div10, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div11, t17);
    			mount_component(ourfood, div11, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*menubody*/ 1) {
    				each_value = /*menubody*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ourfood.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ourfood.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div11);
    			destroy_each(each_blocks, detaching);
    			destroy_component(ourfood);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Body", slots, []);

    	let menubody = [
    		{
    			id: "0",
    			img: "",
    			name: "All",
    			num: "170"
    		},
    		{
    			id: "1",
    			img: "fas fa-hamburger",
    			des: "hamburger.png",
    			name: "Find",
    			num: "23"
    		},
    		{
    			id: "2",
    			img: "fas fa-mortar-pestle",
    			des: "nisk.png",
    			name: "About Us",
    			num: "41"
    		},
    		{
    			id: "3",
    			img: "fas fa-wine-glass-alt",
    			des: "cup.png",
    			name: "How It Works",
    			num: "53"
    		},
    		{
    			id: "4",
    			img: "fas fa-stroopwafel",
    			des: "cake.png",
    			name: "Plans",
    			num: "33"
    		},
    		{
    			id: "5",
    			img: "fas fa-hamburger",
    			des: "hamburger2.png",
    			name: "Contact Us",
    			num: "20"
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Body> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ each, Ourfood, menubody });

    	$$self.$inject_state = $$props => {
    		if ("menubody" in $$props) $$invalidate(0, menubody = $$props.menubody);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [menubody];
    }

    class Body extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Body",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\Home.svelte generated by Svelte v3.31.2 */

    const file$2 = "src\\Home.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let ul;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let li2;
    	let t5;
    	let div0;
    	let h3;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "\"";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "People who loves to eat are always Best People";
    			t3 = space();
    			li2 = element("li");
    			li2.textContent = "\"";
    			t5 = space();
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "JULIA CHILD";
    			add_location(li0, file$2, 2, 8, 62);
    			add_location(li1, file$2, 3, 8, 82);
    			add_location(li2, file$2, 4, 8, 147);
    			attr_dev(ul, "class", "status-eat");
    			add_location(ul, file$2, 1, 4, 29);
    			add_location(h3, file$2, 7, 8, 207);
    			attr_dev(div0, "class", "sub-title");
    			add_location(div0, file$2, 6, 4, 174);
    			attr_dev(div1, "class", "container");
    			add_location(div1, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.31.2 */
    const file$3 = "src\\App.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i].id;
    	child_ctx[0] = list[i].name;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i].id;
    	child_ctx[0] = list[i].name;
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i].name;
    	return child_ctx;
    }

    // (88:7) {#each header as { name }}
    function create_each_block_2$1(ctx) {
    	let li;
    	let a;
    	let t_value = /*name*/ ctx[0] + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "navbar-collapse");
    			add_location(a, file$3, 88, 29, 1684);
    			attr_dev(li, "class", "nav-item");
    			add_location(li, file$3, 88, 8, 1663);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(88:7) {#each header as { name }}",
    		ctx
    	});

    	return block;
    }

    // (151:9) {#each international as { id,name }}
    function create_each_block_1$1(ctx) {
    	let li;
    	let a;
    	let t_value = /*name*/ ctx[0] + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "id", ctx[5]);
    			attr_dev(a, "class", "svelte-weud0k");
    			add_location(a, file$3, 152, 11, 3332);
    			attr_dev(li, "class", "column");
    			add_location(li, file$3, 151, 10, 3301);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(151:9) {#each international as { id,name }}",
    		ctx
    	});

    	return block;
    }

    // (158:9) {#each internationals as { id,name }}
    function create_each_block$2(ctx) {
    	let li;
    	let a;
    	let t0_value = /*name*/ ctx[0] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "id", ctx[5]);
    			attr_dev(a, "class", "svelte-weud0k");
    			add_location(a, file$3, 159, 11, 3517);
    			attr_dev(li, "class", "columns");
    			add_location(li, file$3, 158, 10, 3485);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(158:9) {#each internationals as { id,name }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let div17;
    	let div3;
    	let header_1;
    	let div2;
    	let a;
    	let h30;
    	let t1;
    	let nav;
    	let ul0;
    	let t2;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t3;
    	let button0;
    	let i;
    	let t4;
    	let t5;
    	let home;
    	let t6;
    	let body;
    	let t7;
    	let div16;
    	let div6;
    	let div5;
    	let h31;
    	let t8;
    	let br;
    	let t9;
    	let t10;
    	let div4;
    	let t11;
    	let ul1;
    	let li0;
    	let t12;
    	let li1;
    	let t14;
    	let li2;
    	let t16;
    	let li3;
    	let t17;
    	let li4;
    	let t19;
    	let div15;
    	let div14;
    	let div12;
    	let div9;
    	let h32;
    	let t21;
    	let div8;
    	let div7;
    	let t22;
    	let script;
    	let t24;
    	let div11;
    	let h33;
    	let t26;
    	let div10;
    	let ul2;
    	let t27;
    	let t28;
    	let div13;
    	let button1;
    	let current;
    	let each_value_2 = /*header*/ ctx[1];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	home = new Home({ $$inline: true });
    	body = new Body({ $$inline: true });
    	let each_value_1 = /*international*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*internationals*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			div17 = element("div");
    			div3 = element("div");
    			header_1 = element("header");
    			div2 = element("div");
    			a = element("a");
    			h30 = element("h3");
    			h30.textContent = "KUKS FRESH";
    			t1 = space();
    			nav = element("nav");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t2 = space();
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t3 = space();
    			button0 = element("button");
    			i = element("i");
    			t4 = text("(5)Items");
    			t5 = space();
    			create_component(home.$$.fragment);
    			t6 = space();
    			create_component(body.$$.fragment);
    			t7 = space();
    			div16 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			h31 = element("h3");
    			t8 = text("Your Meal Has ");
    			br = element("br");
    			t9 = text("Been Shipped");
    			t10 = space();
    			div4 = element("div");
    			t11 = space();
    			ul1 = element("ul");
    			li0 = element("li");
    			t12 = space();
    			li1 = element("li");
    			li1.textContent = "m";
    			t14 = space();
    			li2 = element("li");
    			li2.textContent = ":";
    			t16 = space();
    			li3 = element("li");
    			t17 = space();
    			li4 = element("li");
    			li4.textContent = "s";
    			t19 = space();
    			div15 = element("div");
    			div14 = element("div");
    			div12 = element("div");
    			div9 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Price/ Serving";
    			t21 = space();
    			div8 = element("div");
    			div7 = element("div");
    			t22 = space();
    			script = element("script");
    			script.textContent = "$(document).ready(function() {\n\t\t\t\t\t\t\t\t\tvar one = $(\".range-example-2\").asRange({\n\t\t\t\t\t\t\t\t\trange: true,\n\t\t\t\t\t\t\t\t\tlimit: true,\n\t\t\t\t\t\t\t\t\ttip: {\n\t\t\t\t\t\t\t\t\t\tactive: 'onMove'\n\t\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\t\t});\n\t\t\t\t\t\t\t\t\tconsole.log(one.asRange('set', [0, 20]));\n\t\t\t\t\t\t\t\t});";
    			t24 = space();
    			div11 = element("div");
    			h33 = element("h3");
    			h33.textContent = "Cusine";
    			t26 = space();
    			div10 = element("div");
    			ul2 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t27 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t28 = space();
    			div13 = element("div");
    			button1 = element("button");
    			button1.textContent = "Select";
    			add_location(h30, file$3, 82, 6, 1473);
    			attr_dev(a, "class", "nav-brand");
    			add_location(a, file$3, 81, 5, 1445);
    			attr_dev(ul0, "class", "main-nav-list");
    			add_location(ul0, file$3, 85, 6, 1537);
    			attr_dev(img, "class", "author");
    			if (img.src !== (img_src_value = "./img/Image39.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Image39.png");
    			add_location(img, file$3, 94, 8, 1852);
    			attr_dev(div0, "class", "border-img");
    			add_location(div0, file$3, 93, 7, 1819);
    			attr_dev(i, "class", "fa fa-shopping-cart");
    			attr_dev(i, "aria-hidden", "true");
    			add_location(i, file$3, 97, 8, 1976);
    			attr_dev(button0, "class", "submit-items");
    			add_location(button0, file$3, 96, 7, 1938);
    			attr_dev(div1, "class", "author-submit");
    			add_location(div1, file$3, 92, 6, 1784);
    			attr_dev(nav, "class", "main-nav");
    			add_location(nav, file$3, 84, 5, 1508);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$3, 79, 4, 1374);
    			attr_dev(header_1, "class", "main-header");
    			add_location(header_1, file$3, 78, 3, 1341);
    			attr_dev(div3, "class", "felt");
    			add_location(div3, file$3, 77, 2, 1319);
    			add_location(br, file$3, 113, 68, 2320);
    			set_style(h31, "text-align", "center");
    			set_style(h31, "margin", "0 4px 0 0");
    			add_location(h31, file$3, 113, 5, 2257);
    			attr_dev(div4, "class", "img-shipper");
    			add_location(div4, file$3, 114, 5, 2348);
    			attr_dev(li0, "id", "hours");
    			add_location(li0, file$3, 116, 6, 2410);
    			attr_dev(li1, "id", "text");
    			add_location(li1, file$3, 117, 6, 2437);
    			attr_dev(li2, "id", "point");
    			add_location(li2, file$3, 118, 6, 2464);
    			attr_dev(li3, "id", "min");
    			add_location(li3, file$3, 119, 6, 2492);
    			attr_dev(li4, "id", "text");
    			add_location(li4, file$3, 120, 6, 2517);
    			attr_dev(ul1, "class", "date-time");
    			add_location(ul1, file$3, 115, 5, 2381);
    			attr_dev(div5, "class", "adverti");
    			add_location(div5, file$3, 112, 4, 2230);
    			attr_dev(div6, "class", "item-right");
    			add_location(div6, file$3, 111, 3, 2201);
    			add_location(h32, file$3, 129, 7, 2695);
    			attr_dev(div7, "class", "range-example-2");
    			add_location(div7, file$3, 131, 8, 2756);
    			add_location(script, file$3, 132, 8, 2800);
    			attr_dev(div8, "class", "example svelte-weud0k");
    			add_location(div8, file$3, 130, 7, 2726);
    			attr_dev(div9, "class", "items-price-top");
    			add_location(div9, file$3, 128, 6, 2658);
    			add_location(h33, file$3, 147, 7, 3161);
    			attr_dev(ul2, "class", "selector");
    			add_location(ul2, file$3, 149, 8, 3223);
    			attr_dev(div10, "class", "selector-country");
    			add_location(div10, file$3, 148, 7, 3184);
    			attr_dev(div11, "class", "items-price-top");
    			add_location(div11, file$3, 146, 6, 3124);
    			attr_dev(div12, "class", "top-cus");
    			add_location(div12, file$3, 127, 5, 2630);
    			attr_dev(button1, "class", "select-cus");
    			add_location(button1, file$3, 169, 6, 3703);
    			attr_dev(div13, "class", "bottom-cus");
    			add_location(div13, file$3, 168, 5, 3672);
    			attr_dev(div14, "class", "adverti");
    			add_location(div14, file$3, 126, 4, 2603);
    			attr_dev(div15, "class", "item-right");
    			add_location(div15, file$3, 125, 3, 2574);
    			attr_dev(div16, "class", "right");
    			add_location(div16, file$3, 110, 2, 2178);
    			attr_dev(div17, "class", "bg-body");
    			add_location(div17, file$3, 76, 1, 1295);
    			add_location(main, file$3, 73, 0, 1284);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div17);
    			append_dev(div17, div3);
    			append_dev(div3, header_1);
    			append_dev(header_1, div2);
    			append_dev(div2, a);
    			append_dev(a, h30);
    			append_dev(div2, t1);
    			append_dev(div2, nav);
    			append_dev(nav, ul0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(ul0, null);
    			}

    			append_dev(nav, t2);
    			append_dev(nav, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t3);
    			append_dev(div1, button0);
    			append_dev(button0, i);
    			append_dev(button0, t4);
    			append_dev(div3, t5);
    			mount_component(home, div3, null);
    			append_dev(div3, t6);
    			mount_component(body, div3, null);
    			append_dev(div17, t7);
    			append_dev(div17, div16);
    			append_dev(div16, div6);
    			append_dev(div6, div5);
    			append_dev(div5, h31);
    			append_dev(h31, t8);
    			append_dev(h31, br);
    			append_dev(h31, t9);
    			append_dev(div5, t10);
    			append_dev(div5, div4);
    			append_dev(div5, t11);
    			append_dev(div5, ul1);
    			append_dev(ul1, li0);
    			append_dev(ul1, t12);
    			append_dev(ul1, li1);
    			append_dev(ul1, t14);
    			append_dev(ul1, li2);
    			append_dev(ul1, t16);
    			append_dev(ul1, li3);
    			append_dev(ul1, t17);
    			append_dev(ul1, li4);
    			append_dev(div16, t19);
    			append_dev(div16, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div12);
    			append_dev(div12, div9);
    			append_dev(div9, h32);
    			append_dev(div9, t21);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div8, t22);
    			append_dev(div8, script);
    			append_dev(div12, t24);
    			append_dev(div12, div11);
    			append_dev(div11, h33);
    			append_dev(div11, t26);
    			append_dev(div11, div10);
    			append_dev(div10, ul2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul2, null);
    			}

    			append_dev(ul2, t27);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul2, null);
    			}

    			append_dev(div14, t28);
    			append_dev(div14, div13);
    			append_dev(div13, button1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*header*/ 2) {
    				each_value_2 = /*header*/ ctx[1];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2$1(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty & /*international*/ 4) {
    				each_value_1 = /*international*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul2, t27);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*internationals*/ 8) {
    				each_value = /*internationals*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			transition_in(body.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			transition_out(body.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_2, detaching);
    			destroy_component(home);
    			destroy_component(body);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { name } = $$props, { count } = $$props;

    	// $: doubled = count * 2;
    	// function doubleHandleclick() {
    	// 	count += 1;
    	// }
    	// import Fluid from "svelte-fluid-header"
    	let header = [
    		{ id: "1", name: "Find" },
    		{ id: "2", name: "About Us" },
    		{ id: "3", name: "How It Works" },
    		{ id: "4", name: "Plans" },
    		{ id: "5", name: "Contact Us" }
    	];

    	let international = [
    		{ id: "1", name: "American" },
    		{ id: "2", name: "Indian" },
    		{ id: "3", name: "Italian" },
    		{ id: "4", name: "Persian" },
    		{ id: "5", name: "Russian" }
    	];

    	let internationals = [
    		{ id: "6", name: "Italian" },
    		{ id: "7", name: "Japanese" },
    		{ id: "8", name: "Latin" },
    		{ id: "9", name: "Mexican" },
    		{ id: "10", name: "Seafood" }
    	];

    	const writable_props = ["name", "count"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("count" in $$props) $$invalidate(4, count = $$props.count);
    	};

    	$$self.$capture_state = () => ({
    		Body,
    		Home,
    		name,
    		count,
    		header,
    		international,
    		internationals
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("count" in $$props) $$invalidate(4, count = $$props.count);
    		if ("header" in $$props) $$invalidate(1, header = $$props.header);
    		if ("international" in $$props) $$invalidate(2, international = $$props.international);
    		if ("internationals" in $$props) $$invalidate(3, internationals = $$props.internationals);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, header, international, internationals, count];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { name: 0, count: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}

    		if (/*count*/ ctx[4] === undefined && !("count" in props)) {
    			console.warn("<App> was created without expected prop 'count'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get count() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set count(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world',
    		count: 0,
    		
    	}

    });

    // let count = 0;

    return app;

}());
//# sourceMappingURL=bundle.js.map
