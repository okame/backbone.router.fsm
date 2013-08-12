/**
 * @fileOverview hoge
 */
var Backbone = Backbone || {};
Backbone.FSMRouter = Backbone.FSMRouter || {};

// Namespace
(function(ns){
    'use strict';

    /* ---------------------------------
     *  Public
     * --------------------------------- */
    /**
     * @constructor
     * @param {object} opts
     * opts.defaultState: {string} default state.
     * opts.methods: {Array[Array]} 2 dimensional array of function 
     * and set of functions.
     * opts[from][to]: called if state change from [from] to [to].
     * @param context {object} when opts.mehods call.
     */
    function FSM(_opts, context) {
        if(typeof _opts !== 'object') {
            throw new Error('[FSM] arguments of FSM constructer must be object.');
        }

        var opts = _opts || {};

        this.st = opts.defaultState || null;
        this.methods = opts.methods || [];
        this.context = context || {};
    }

    /**
     * change state to [st] and call target method.
     * e.g., this[prev_st][st] is called.
     * @param st {string} state chagen to.
     * @param {Array} arguments for a method of prev_st to st.
     */
    function run(st, args) {
        var from = this.st,
            to = st;

        callMethod.call(this, from, to, args);
        this.st = st;
    }

    /**
     * set callabck when this run to anywhere.
     * @param from {string} previous state.
     * @param to {string} next state.
     * @param cb {function} callback.
     */
    function setMethod(from, to, cb) {
        var methods = this.methods;

        if(!from || !to || !cb) {
            throw new Error('[FSM:setMethod] arguments required.');
        }

        if(typeof cb !== 'function') {
            throw new Error('[FSM:setMethod] [cb] must be function.');
        }

        if(typeof methods[from] === 'undefined') {
            methods[from] = [];
        }

        methods[from][to] = cb;
    }

    /**
     * set multiple callbacks.
     * @param opts {object} callbacks.
     * e.g., 
     * opts = {
     *     {from: st1, to: st2, method: [function]}
     * }
     */
    function setMethods(opts) {
        var key, trg;

        for(key in opts) {
            trg = opts[key];
            this.setMethod(trg.from, trg.to, trg.method);
        }
    }

    /* ---------------------------------
     *  Private
     * --------------------------------- */
    function callMethod(from, to, args) {
        if(typeof this.methods[from] === 'undefined') {
            console.debug('[FSM:callMethod] method for [from '+from+'] is undefined.');
            return;
        }
        if(typeof this.methods[from][to] !== 'function') {
            console.debug('[FSM:callMethod] method for [from '+from+' to '+to+'] is undefined.');
            return;
        }

        this.methods[from][to].call(this.context, args);
    }

    // Export
    FSM.fn = FSM.prototype;
    FSM.fn.run = run;
    FSM.fn.setMethod = setMethod;
    FSM.fn.setMethods = setMethods;
    window._FSM = FSM;

    /* ---------------------------------
     *  Backbone.FSMRouter
     * --------------------------------- */
    if(_.isUndefined(Backbone)) {
        throw new Error('[FSMRouter] Backbone module required.');
    }

    var FSMRouter = Backbone.Router.extend({
        constructor: function() {
            this.state = this.default_state;
            this.fsm = new FSM({ defaultState: this.state });
            Backbone.Router.apply(this, arguments);
        },

        /**
         * @override
         */
        _bindRoutes: function() {
          if (!this.routes) return;
          this.routes = _.result(this, 'routes');
          var route, routes = _.keys(this.routes),
              _route, _routes, cb;

          while ((route = routes.pop()) !== undefined) {
            this.route(route, this.routes[route]);
            this.on('route:'+route, _.bind(this.fsm.run, this.fsm, route));
            _routes = _.keys(this.routes);

            // 状態遷移によるcallbackの登録
            while ((_route = _routes.pop()) !== undefined) {
              cb = this[route+'_'+_route];
              if(_.isFunction(cb)) {
                this.fsm.setMethod(route, _route, cb);
              }
            }
          }
        }
    });
    
    ns.FSMRouter = FSMRouter;

})(Backbone.Router);
