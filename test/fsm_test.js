var path = require('path'),
    Browser = require('zombie'),
    browser = new Browser({ site:'file://' }),
    ns,
    ST = {
        ST1: 'st1',
        ST2: 'st2',
        ST3: 'st3'
    },
    target_path = path.resolve(module.filename, '../fsm.html');

describe('[fsm]', function() {
    before(function(done) {
        browser.visit(target_path, done);
        ns = browser.window;
    });

    it('initialize', function() {
        var methods = [],
            opts, result, fsm;

        methods[ST.ST1] = [];
        methods[ST.ST1][ST.ST2] = function() {
            result = 'st1_st2';
        };
        methods[ST.ST1][ST.ST1] = function() {
            result = 'st1_st1';
        };
        methods[ST.ST2] = [];
        methods[ST.ST2][ST.ST1] = function() {
            result = 'st2_st1';
        };

        opts = {
            defaultState: ST.ST1,
            methods: methods
        },
        fsm = new ns._FSM(opts);

        // st1 -> st2
        fsm.run(ST.ST2);
        result.should.equal('st1_st2');

        // st2 -> st1
        fsm.run(ST.ST1);
        result.should.equal('st2_st1');

        // st1 -> st1
        fsm.run(ST.ST1);
        result.should.equal('st1_st1');
    });

    it('setMethod', function() {
        var tmp,
            opts = {
                defaultState: ST.ST1
            },
            fsm = new ns._FSM(opts);

        fsm.setMethod(ST.ST1, ST.ST2, function() {
            tmp = 'changed';
        });
        fsm.run(ST.ST2);

        tmp.should.equal('changed');
    });

    it('setMethods', function() {
        var tmp,
            opts = {
                defaultState: ST.ST1
            },
            fsm = new ns._FSM(opts),
            methods;

        methods = [
            { from: ST.ST1, to: ST.ST2, method: function(){tmp = 'st1_to_st2';} },
            { from: ST.ST2, to: ST.ST3, method: function(){tmp = 'st2_to_st3';} },
            { from: ST.ST3, to: ST.ST1, method: function(){tmp = 'st3_to_st1';} }
        ];

        // ST1 -> ST2
        fsm.setMethods(methods);
        fsm.run(ST.ST2);
        tmp.should.equal('st1_to_st2');

        // ST2 -> ST3
        fsm.setMethods(methods);
        fsm.run(ST.ST3);
        tmp.should.equal('st2_to_st3');

        // ST3 -> ST1
        fsm.setMethods(methods);
        fsm.run(ST.ST1);
        tmp.should.equal('st3_to_st1');
    });
});

describe('[FSMRouter]', function() {
    before(function(done) {
        browser.visit(target_path, done);
        ns = browser.window;
    });

    it('init', function() {
        var options = {},
            TestRouter,
            tmp = '',
            router;

            options[ST.ST1] = {};
            options[ST.ST1][ST.ST2] = function() {
                tmp = 'st1_to_st2';
            };
            options.default_state = ST.ST1;

            TestRouter = ns.Backbone.FSMRouter.extend({
                default_state: 'st1',
                routes: {
                    st1: "f1",
                    st2: "f2",
                    st3: "f3"
                },
                f1: function() {
                },
                f2: function() {
                },
                f3: function() {
                },
                st1_st2: function() {
                    tmp = 'st1_to_st2';
                },
                st2_st1: function() {
                    tmp = 'st2_to_st1';
                },
                st1_st1: function() {
                    tmp = 'st1_to_st1';
                }
            });
            router = new TestRouter();

            // st1 -> st2
            router.trigger('route:st2');
            tmp.should.equal('st1_to_st2');

            // st2 -> st1
            router.trigger('route:st1');
            tmp.should.equal('st2_to_st1');

            // st1 -> st1
            router.trigger('route:st1');
            tmp.should.equal('st1_to_st1');
    });
});
