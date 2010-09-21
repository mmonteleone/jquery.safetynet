QUnit.specify.globalApi = true;

QUnit.specify("jQuery.safetynet", function() {
    var specification = function() {
        // setup some helpers

        // capture local references to current jquery objects
        // since the globals may get out of sync in the async
        // test runner
        var $ = window.$,
            jQuery = window.jQuery;
        var is14OrGreater = Number($.fn.jquery.split('.').slice(0,2).join('.')) >= 1.4;
        var binderMethod = is14OrGreater ? 'live' : 'bind';

        // shortcut for building up and breaking down stub forms
        var FormBuilder = {
            clear: function(){
                $('div#testbed form').empty();
                $('form').die('submit');
                $('form').unbind('submit');
            },
            addTextInput: function(name, value, id){
                var attributes = "",
                    hasName = typeof(name) !== 'undefined' && name !== '',
                    hasId = typeof(id) !== 'undefined' && id !== '';
                // small hack for backwards compat of tests
                // if only a name was passed, use for both id and name.
                // if id was passed, use explicitly for id.  and use name explicitly for name
                if(hasName && !hasId) {
                    attributes = 'id="' + name + '" name="' + name + '" ';
                } else {
                    if(hasId) {
                        attributes += 'id="' + id + '" ';
                    }
                    if(hasName) {
                        attributes += 'name="' + name + '" ';                        
                    }
                }
                var input = $('<input class="test" type="text" ' + attributes + ' value="' + value + '" />');
                $('div#testbed form').append(input);
                return input;
            },
            addRadioInput: function(name, value, checked){
                var input = $('<input class="test" type="radio" id="' + name + '" name="' + name + '" value="' + value + '" ' + (checked ? 'checked="checked"' : '') + ' />');
                $('div#testbed form').append(input);
                return input;
            },
            addCheckboxInput: function(name, value, checked){
                var input = $('<input class="test" type="checkbox" id="' + name + '" name="' + name + '" value="' + value + '" ' + (checked ? 'checked="checked"' : '') + ' />');
                $('div#testbed form').append(input);
                return input;
            },
            addTextArea: function(name, value){
                var input = $('<textarea class="test" name="' + name + '" id="' + name + '">' + value + '</textarea>');
                $('div#testbed form').append(input);
                return input;
            },
            addSelect: function(name, value, opts){
                var options = $.map(opts,function(o){ return '<option value="'+o+'">'+o+'</option>' }).join('');
                var select = $('<select class="test" id="'+name+'" name="'+name+'">'+options+'</select>');
                $('div#testbed form').append(select);
                select.val(value);
                return select;
            },
            addButton: function(name, value) {
                var input = $('<input class="test" type="button" id="' + name + '" name="' + name + '" value="' + value + '" />');
                $('div#testbed form').append(input);
                return input;
            },
            addSubmitButton: function(name, value) {
                var input = $('<input class="test" type="submit" id="' + name + '" name="' + name + '" value="' + value + '" />');
                $('div#testbed form').append(input);
                return input;
            }
        };


        describe("jQuery.safetynet", function(){
            after(function(){
                $.safetynet.clearAllChanges();
                $.safetynet.suppressed(false);
                window.onbeforeunload = null;
                $('input[type="submit"]').die('click');
                $('input[type="submit"]').unbind('click');
            });

            it("should be equivalent to calling jQuery(jQuery.safetynet.defaults.fields).safetynet(options)", function(){
                var originalSafetynet = $.fn.safetynet;
                try{
                    var passedOptions;
                    var selection;
                    $.fn.safetynet = function(opts) {
                        passedOptions = opts;
                        selection = this;
                    };
                    var someOpts = {a:1,b:2};
                    $.safetynet(someOpts);
                    assert(someOpts).isSameAs(passedOptions);
                    assert(selection.size()).equals(2);
                } finally {
                    $.fn.safetynet = originalSafetynet;
                }
            });

            describe("defaults", function(){
                it("should have a default message option of 'Your unsaved changes will be lost.'", function(){
                    assert($.safetynet.defaults.message).equals('Your unsaved changes will be lost.');
                });
                it("should have a default fields option of 'input,select,textarea,fileupload'", function(){
                    assert($.safetynet.defaults.fields).equals('input,select,textarea,fileupload');
                });
                it("should have a default netChangerEvents option of 'change,keyup,paste'", function(){
                    assert($.safetynet.defaults.netChangerEvents).equals('change,keyup,paste');
                });
                it("should have proper live setting (true if >= 1.4)", function(){
                    if(is14OrGreater) {
                        assert($.safetynet.defaults.live).isTrue("should be true");
                    } else {
                        assert($.safetynet.defaults.live).isFalse("should be false");
                    }
                });
            });

            describe("raiseChange()", function(){
                describe("when key is string literal", function(){
                    var key = "a";
                    it("should throw exception if not provided a key", function(){
                        assert(function(){
                            $.safetynet.raiseChange();
                        }).throwsException("key is required when raising a jQuery.safetynet change");
                    });
                    it("should add a change so that hasChanges should result in true", function(){
                        assert($.safetynet.hasChanges()).isFalse();
                        $.safetynet.raiseChange(key);
                        assert($.safetynet.hasChanges()).isTrue();
                    });
                });
                describe("when key is JQuery object", function(){
                    var sel1;
                    before(function(){
                        FormBuilder.addTextInput("t1","t1");
                        FormBuilder.addTextInput("t2","t2");
                        FormBuilder.addTextInput("t3","t3");

                        sel1 = $('input[type="text"]');
                    });
                    after(function(){
                        FormBuilder.clear();
                    });
                    it("should throw exception if not provided a key", function(){
                        assert(function(){
                            $.safetynet.raiseChange();
                        }).throwsException("key is required when raising a jQuery.safetynet change");
                    });
                    it("should add a change so that hasChanges should result in true", function(){
                        assert($.safetynet.hasChanges()).isFalse();
                        $.safetynet.raiseChange(sel1);
                        assert($.safetynet.hasChanges()).isTrue();
                    });
                });
            });

            describe("clearChange()", function(){
                it("should throw exception if not provided a key", function(){
                    assert(function(){
                        $.safetynet.clearChange();
                    }).throwsException("key is required when clearing a jQuery.safetynet change");
                });
                describe("when key is string literal", function(){
                    var keyA = "a";
                    var keyB = "b";
                    it("should remove change so that hasChanges returns true when was only change raised", function(){
                        assert($.safetynet.hasChanges()).isFalse();
                        $.safetynet.raiseChange(keyA);
                        $.safetynet.raiseChange(keyB);
                        assert($.safetynet.hasChanges()).isTrue();
                        $.safetynet.clearChange(keyA);
                        assert($.safetynet.hasChanges()).isTrue();
                    });
                    it("should remove change so that hasChanges returns false when was not only change raised", function(){
                        assert($.safetynet.hasChanges()).isFalse();
                        $.safetynet.raiseChange(keyA);
                        $.safetynet.raiseChange(keyB);
                        assert($.safetynet.hasChanges()).isTrue();
                        $.safetynet.clearChange(keyA);
                        $.safetynet.clearChange(keyB);
                        assert($.safetynet.hasChanges()).isFalse();
                    });
                });
                describe("when key is jQuery object", function(){
                    var sel1, sel2;
                    before(function(){
                        FormBuilder.addTextInput("t1","t1");
                        FormBuilder.addTextInput("t2","t2");
                        FormBuilder.addTextInput("t3","t3");
                        FormBuilder.addTextArea("ta1","ta1");
                        FormBuilder.addTextArea("ta2","ta2");
                        FormBuilder.addTextArea("ta3","ta3");

                        sel1 = $('input[type="text"]');
                        sel2 = $('textarea');
                    });
                    after(function(){
                        FormBuilder.clear();
                    });

                    it("should remove change so that hasChanges returns true when was only change raised", function(){
                        assert($.safetynet.hasChanges()).isFalse();
                        $.safetynet.raiseChange(sel1);
                        $.safetynet.raiseChange(sel2);
                        assert($.safetynet.hasChanges()).isTrue();
                        $.safetynet.clearChange(sel1);
                        assert($.safetynet.hasChanges()).isTrue();
                    });
                    it("should remove change so that hasChanges returns false when was not only change raised", function(){
                        assert($.safetynet.hasChanges()).isFalse();
                        $.safetynet.raiseChange(sel1);
                        $.safetynet.raiseChange(sel2);
                        assert($.safetynet.hasChanges()).isTrue();
                        $.safetynet.clearChange(sel1);
                        $.safetynet.clearChange(sel2);
                        assert($.safetynet.hasChanges()).isFalse();
                    });

                });
            });

            describe("clearAllChanges()", function(){
                it("should remove all raised changes so that hasChanges returns false no matter how many added", function(){
                    assert($.safetynet.hasChanges()).isFalse();
                    $.safetynet.raiseChange("a");
                    $.safetynet.raiseChange("b");
                    $.safetynet.raiseChange("c");
                    assert($.safetynet.hasChanges()).isTrue();
                    $.safetynet.clearAllChanges();
                    assert($.safetynet.hasChanges()).isFalse();
                });
            });

            describe("hasChanges()", function(){
                it("should return false when no changes raised", function(){
                    assert($.safetynet.hasChanges()).isFalse();
                });
                it("should return true when 2 changes raised, 1 cleared", function(){
                    assert($.safetynet.hasChanges()).isFalse();
                    $.safetynet.raiseChange("a");
                    $.safetynet.raiseChange("b");
                    assert($.safetynet.hasChanges()).isTrue();
                    $.safetynet.clearChange("a");
                    assert($.safetynet.hasChanges()).isTrue();
                });
                it("should return false when 2 changes raised, both cleared", function(){
                    assert($.safetynet.hasChanges()).isFalse();
                    $.safetynet.raiseChange("a");
                    $.safetynet.raiseChange("b");
                    assert($.safetynet.hasChanges()).isTrue();
                    $.safetynet.clearChange("a");
                    $.safetynet.clearChange("b");
                    assert($.safetynet.hasChanges()).isFalse();
                });
                
                if(is14OrGreater) {
                    it("should return false when changes raised, but changed inputs removed", function(){
                        // setup some inputs
                        FormBuilder.addTextInput('t1','v1');
                        FormBuilder.addTextInput('t2','v2');
                        opts = {
                            message: 'Your unsaved changes will be lost.',
                            fields: 'input.test,select.test,textarea.test,fileupload.test',
                            form: 'form',
                            netChangerEvents: 'change,keyup,paste',
                            live: is14OrGreater
                        };

                        $(opts.fields).safetynet(opts);
                        assert($.safetynet.hasChanges()).isFalse();
                        $('input[name="t1"]').trigger('netchange');
                        assert($.safetynet.hasChanges()).isTrue();
                    
                        // now clear the inputs
                        FormBuilder.clear();
                    
                        // now assert that the previously recorded changes are gone
                        assert($.safetynet.hasChanges()).isFalse();

                        // reset stuff
                        $.safetynet.clearAllChanges();
                        $.safetynet.suppressed(false);
                        window.onbeforeunload = null;
                        $('input[type="submit"]').die('click');
                        $('input[type="submit"]').unbind('click');                    
                    });  
                }              
                
            });

            describe("suppressed()", function(){
                it("should return current value of suppressed", function(){
                    assert($.safetynet.suppressed()).isFalse();
                    assert($.safetynet.suppressed(true)).isTrue();
                    assert($.safetynet.suppressed()).isTrue();
                    assert($.safetynet.suppressed(false)).isFalse();
                    assert($.safetynet.suppressed()).isFalse();
                });
                it("should set new value of suppressed and return it if passed one", function(){
                    assert($.safetynet.suppressed(true)).isTrue();
                    assert($.safetynet.suppressed()).isTrue();
                    assert($.safetynet.suppressed(false)).isFalse();
                    assert($.safetynet.suppressed()).isFalse();
                });
            });
        });

        describe("jQuery.fn.safetynet", function(){

            var opts;

            before(function(){
                FormBuilder.addTextInput('t1','v1');
                FormBuilder.addTextInput('t2','v2');
                opts = {
                    message: 'Your unsaved changes will be lost.',
                    fields: 'input.test,select.test,textarea.test,fileupload.test',
                    form: 'form',
                    netChangerEvents: 'change,keyup,paste',
                    live: is14OrGreater
                };
            });

            after(function(){
                FormBuilder.clear();
                $.safetynet.clearAllChanges();
                $.safetynet.suppressed(false);
                window.onbeforeunload = null;
                $('input[type="submit"]').die('click');
                $('input[type="submit"]').unbind('click');
            });

            it("should throw exception if jQuery.netchanger is not defined", function(){
                var originalNetchanger = $.fn.netchanger;
                try {
                    // temporarily mock netchanger being absent
                    delete $.fn['netchanger'];
                    assert(function(){
                        $(opts.fields).safetynet(opts);
                    }).throwsException('jQuery.safetynet requires a missing dependency, jQuery.netchanger.');
                } finally {
                    $.fn.netchanger = originalNetchanger;
                }
            });

            it("should throw an exception when specifying live when jq version doesn't support (<1.4 only)", function(){
                if(is14OrGreater) {
                    try{
                        $.safetynet({live:true});
                    } catch(e) {
                        assert.fail('should have allowed live when 1.4')
                    }
                } else {
                    assert(function(){
                        $.safetynet({live:true});
                    }).throwsException('Use of the live option requires jQuery 1.4 or greater');
                }
            });

            it("should activate netchanger on selection, using netChangerEvents option and live option", function(){
                var originalNetchanger = $.fn.netchanger;
                try {
                    var calls = [];
                    // temporarily mock netchanger
                    $.fn.netchanger = function(opts) {
                        calls.push({selection:this,options:opts});
                        return this;
                    };
                    $(opts.fields).safetynet(opts);
                    assert(calls.length).equals(1);
                    assert(calls[0].selection.length).equals(2);
                    assert(calls[0].options.events).equals('change,keyup,paste');
                    assert(calls[0].options.live).equals(opts.live);
                } finally {
                    $.fn.netchanger = originalNetchanger;
                }
            });
            it("should only allow one activation per page", function(){
                $(opts.fields).safetynet(opts);
                assert(function(){
                    $(opts.fields).safetynet(opts);
                }).throwsException('Only one activation of jQuery.safetynet is allowed per page');
            });
            it("should bind netchange on selection to raising changes so that hasChanges returns true", function(){
                $(opts.fields).safetynet(opts);
                assert($.safetynet.hasChanges()).isFalse();
                $('input[name="t1"]').trigger('netchange');
                assert($.safetynet.hasChanges()).isTrue();
            });
            it("should bind revertchange on selection to raising changes so that hasChanges returns false", function(){
                $(opts.fields).safetynet(opts);
                assert($.safetynet.hasChanges()).isFalse();
                $('input[name="t1"]').trigger('netchange');
                assert($.safetynet.hasChanges()).isTrue();
                $('input[name="t1"]').trigger('revertchange');
                assert($.safetynet.hasChanges()).isFalse();
            });
            it("should be able to differentiate between non-named, non-id'd but separate inputs when raising/clearing changes",function(){
                // identified ones
                var t1 = FormBuilder.addTextInput('t1','v1');
                var t2 = FormBuilder.addTextInput('t2','v2');
                // anonymous inputs
                var t3 = FormBuilder.addTextInput('','v3');
                var t4 = FormBuilder.addTextInput('','v4');

                $(opts.fields).safetynet(opts);
                assert($.safetynet.hasChanges()).isFalse();
                t1.trigger('netchange');
                t2.trigger('netchange');
                t3.trigger('netchange');
                t4.trigger('netchange');
                assert($.safetynet.hasChanges()).isTrue();
                t1.trigger('revertchange');
                t2.trigger('revertchange');
                assert($.safetynet.hasChanges()).isTrue();
                t3.trigger('revertchange');
                assert($.safetynet.hasChanges()).isTrue();
                t4.trigger('revertchange');
                assert($.safetynet.hasChanges()).isFalse();
            });
            it("should be able to differentiate between non-named, but id'd separate inputs when raising/clearing changes", function(){
                // identified ones
                var t1 = FormBuilder.addTextInput('t1','v1');
                var t2 = FormBuilder.addTextInput('t2','v2');
                // anonymous inputs
                var t3 = FormBuilder.addTextInput('','v3','id3');
                var t4 = FormBuilder.addTextInput('','v4','id4');

                $(opts.fields).safetynet(opts);
                assert($.safetynet.hasChanges()).isFalse();
                t1.trigger('netchange');
                t2.trigger('netchange');
                t3.trigger('netchange');
                t4.trigger('netchange');
                assert($.safetynet.hasChanges()).isTrue();
                t1.trigger('revertchange');
                t2.trigger('revertchange');
                assert($.safetynet.hasChanges()).isTrue();
                t3.trigger('revertchange');
                assert($.safetynet.hasChanges()).isTrue();
                t4.trigger('revertchange');
                assert($.safetynet.hasChanges()).isFalse();              
            });
            it("should return original selection", function(){
                var selection = $(opts.fields);
                assert($(selection).safetynet(opts).fields).isSameAs(selection.fields);
            });
            it("should set a function to window.onbeforeload", function(){
                assert(window.onbeforeunload).isNull();
                $(opts.fields).safetynet(opts);
                assert(window.onbeforeunload).isNotNull();
            });
            it("should return settings.message from onbeforeload fn when !supressed() and hasChanges()",function(){
                var originals = {
                    suppressed: $.safetynet.suppressed,
                    hasChanges: $.safetynet.hasChanges
                };
                try {
                    // temporarily mock suppressed and haschanges
                    $.safetynet.suppressed = function() { return false; }
                    $.safetynet.hasChanges = function() { return true; }
                    $(opts.fields).safetynet(opts);
                    var beforeUnloadFn = window.onbeforeunload;
                    assert(beforeUnloadFn()).equals(opts.message);
                }
                finally {
                    // restore non-mocked versions
                    $.extend($.safetynet, originals);
                }
            });
            it("should return undefined from onbeforeload fn when !supressed() and !hasChanges()", function(){
                var originals = {
                    suppressed: $.safetynet.suppressed,
                    hasChanges: $.safetynet.hasChanges
                };
                try {
                    // temporarily mock suppressed and haschanges
                    $.safetynet.suppressed = function() { return false; }
                    $.safetynet.hasChanges = function() { return false; }
                    $(opts.fields).safetynet(opts);
                    var beforeUnloadFn = window.onbeforeunload;
                    assert(beforeUnloadFn()).isUndefined();
                }
                finally {
                    // restore non-mocked versions
                    $.extend($.safetynet, originals);
                }
            });
            it("should return undefined from onbeforeload fn when supressed() and hasChanges()", function(){
                var originals = {
                    suppressed: $.safetynet.suppressed,
                    hasChanges: $.safetynet.hasChanges
                };
                try {
                    // temporarily mock suppressed and haschanges
                    $.safetynet.suppressed = function() { return true; }
                    $.safetynet.hasChanges = function() { return true; }
                    $(opts.fields).safetynet(opts);
                    var beforeUnloadFn = window.onbeforeunload;
                    assert(beforeUnloadFn()).isUndefined();
                }
                finally {
                    // restore non-mocked versions
                    $.extend($.safetynet, originals);
                }
            });
            it("should unsupress after running onbeforeload when was suppressed", function(){
                $(opts.fields).safetynet(opts);
                $.safetynet.raiseChange('somekey');
                $.safetynet.suppressed(true);
                var beforeUnloadFn = window.onbeforeunload;
                assert($.safetynet.suppressed()).isTrue();
                assert(beforeUnloadFn()).isUndefined();
                assert($.safetynet.suppressed()).isFalse();
            });
            it("should return undefined from onbeforeload fn when supressed() and !hasChanges()", function(){
                var originals = {
                    suppressed: $.safetynet.suppressed,
                    hasChanges: $.safetynet.hasChanges
                };
                try {
                    // temporarily mock suppressed and haschanges
                    $.safetynet.suppressed = function() { return true; }
                    $.safetynet.hasChanges = function() { return false; }
                    $(opts.fields).safetynet(opts);
                    var beforeUnloadFn = window.onbeforeunload;
                    assert(beforeUnloadFn()).isUndefined();
                }
                finally {
                    // restore non-mocked versions
                    $.extend($.safetynet, originals);
                }
            });
            it("should bind submit on form to supressed(true)", function(){
                var b1 = FormBuilder.addSubmitButton('submittor','go!');
                $(opts.fields).safetynet(opts);
                // mock onbeforeunload since we don't care about its call for this,
                // and its call will interfere with our check
                window.onbeforeunload = function() { };
                assert($.safetynet.suppressed()).isFalse()
                // block true submits, just want to see what happens up until it
                $(opts.form)
                    .bind('submit',function(e){ e.preventDefault(); })
                    .submit();
                assert($.safetynet.suppressed()).isTrue()
            });
        });
    };


    /**
     * naive replication of $.each since
     * jquery is not defined at this point
     */
    var each = function(items, fn) {
        for(var i=0;i<items.length;i++) {
            var item = items[i];
            fn(item);
        };
    };

    /**
     * run entire test suite against multiple loaded versions
     * of jquery.
     *
     * Assumes they have each been loaded and set to notConflict(true)
     * aliased as jq14, jq13, etc.
     */
    each(["1.3.2","1.4.1","1.4.2"], function(version) {
        describe("in jQ " + version, function(){
            $ = jQuery = window['jq_' + version.replace(/\./g,'_')];
            specification();
        });
    });
});

