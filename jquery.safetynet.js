(function($){
    
    var changeFlags = {},       // Stores a listing of raised changes by their key
        suppressed = false,     // whether or not warning should be suppressed
        uniqueIdentifiers = 0,  // accumulator for providing page-unique ids for anonymous elements
        activated = false,      // whether or not the plugin has already been activated for a given page
        idDataKey = 'safetynet-identifier';  // key to use internally for storing ids on .data()

    var fieldIdentifierFor = function(selection) {
        selection = $(selection);

        var name = selection.attr('name');
        if(name !== undefined && !isNullOrEmpty(name)) {
            return name;
        }

        var id = selection.attr('id');
        if(id !== undefined && !isNullOrEmpty(id)) {
            return name;
        }

        var uid = selection.data(idDataKey);
        if(uid === undefined) {
            uid = uniqueIdentifiers++;
            selection.data(idDataKey, uid);
        }
        return uid;
    };    

    var countProperties = function(obj) {
        if(obj.__count__ !== undefined) {
            return obj.__count__;
        } else {
            var count = 0;
            for (var k in obj) {
                if (obj.hasOwnProperty(k)) {
                    count++;
                }
            }
            return count;
        }
    };

    var isNullOrEmpty = function(obj) {
        return obj === null ||
            (obj.length !== undefined && obj.length === 0);
    };
    
    $.fn.safetynet = function(options){
        var settings = $.extend({}, $.safetynet.defaults, options || {});
        
        var selection = this;
        
        if(activated) {
            throw('Only one activation of jQuery.safetynet is allowed per page');
        }
        activated = true;
        
        if($.fn.netchanger === undefined) {
            throw('jQuery.safetynet requires a missing dependency, jQuery.netchanger.');
        }
        
        this.netchanger({events: settings.netChangerEvents})
            .bind('netchange', function(){
                $.safetynet.raiseChange(fieldIdentifierFor(this));
                })
            .bind('revertchange', function(){
                $.safetynet.clearChange(fieldIdentifierFor(this));
                });
        
        window.onbeforeunload = function() { 
            if($.safetynet.suppressed()) {              
                $.safetynet.suppressed(false);
                return undefined;
            }
            return $.safetynet.hasChanges() ? settings.message : undefined;             
        };
        $(settings.form)
            .bind('submit', function(){ $.safetynet.suppressed(true); });
        
        return this;
    };

    $.safetynet = function(options){
        $($.safetynet.defaults.fields).safetynet(options);
    };

    $.extend($.safetynet,{
        raiseChange: function(key) {
            if(key === undefined || isNullOrEmpty(key)) {
                throw("key is required when raising a jQuery.safetynet change");
            }
            changeFlags[key] = true;
        },
        clearChange: function(key) {
            if(key === undefined || isNullOrEmpty(key)) {
                throw("key is required when clearing a jQuery.safetynet change");
            }
            delete changeFlags[key];
        },
        clearAllChanges: function(key) {
            changeFlags = {};
            activated = false;
        },
        suppressed: function(val) {
            if(arguments.length === 1) {
                suppressed = val;                
            }
            return suppressed;
        },
        hasChanges: function() {
            return countProperties(changeFlags) > 0;
        },
        version: '0.9.0',
        defaults: {
            message: 'Your unsaved changes will be lost.',
            fields: 'input,select,textarea,fileupload',
            form: 'form',
            netChangerEvents: 'change,keyup,paste'
        }
    });
})(jQuery);