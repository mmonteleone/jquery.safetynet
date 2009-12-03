/**
 * jQuery.safetynet
 * A smarter in-browser "unsaved changes" warning
 *
 * version 0.9.0
 * 
 * http://michaelmonteleone.net/projects/safetynet
 * http://github.com/mmonteleone/jquery.safetynet
 *
 * Copyright (c) 2009 Michael Monteleone
 * Licensed under terms of the MIT License (README.markdown)
 */
(function($){
    
    var changeFlags = {},       // Stores a listing of raised changes by their key
        suppressed = false,     // whether or not warning should be suppressed
        uniqueIdentifiers = 0,  // accumulator for providing page-unique ids for anonymous elements
        activated = false,      // whether or not the plugin has already been activated for a given page
        idDataKey = 'safetynet-identifier';  // key to use internally for storing ids on .data()

    /**
     * Helper which returns a unique identifier for a given input
     * Yes, ieally an input should have a name, 
     * but this saves the day even when they don't
     * @param {jQuery} selection selection of an input
     * @returns {string} key
     */
    var fieldIdentifierFor = function(selection) {
        selection = $(selection);

        // if field has a name, use that
        var name = selection.attr('name');
        if(name !== undefined && !isNullOrEmpty(name)) {
            return name;
        }

        // otherwise, if has an id, use that
        var id = selection.attr('id');
        if(id !== undefined && !isNullOrEmpty(id)) {
            return name;
        }

        // finally, if neither, just make up a new unique
        // key for it and store it for later
        var uid = selection.data(idDataKey);
        if(uid === undefined) {
            uid = uniqueIdentifiers++;
            selection.data(idDataKey, uid);
        }
        return uid;
    };    

    /**
     * Helper which returns the number of properties
     * on an object.  Used to know how many changes are 
     * currently cached in the changeFlags object
     * @param {object} obj Any object
     * @returns {Number} the number of properties on the object
     */
    var countProperties = function(obj) {
        // helpful modern browsers can alreay do this.
        if(obj.__count__ !== undefined) {
            return obj.__count__;
        } else {
            // and others can't.
            var count = 0;
            for (var k in obj) {
                if (obj.hasOwnProperty(k)) {
                    count++;
                }
            }
            return count;
        }
    };

    /**
     * Helper which returns whether an object is null
     * or in the case that it's a string or array, if it's empty
     * @param {Object} obj Object to check (could be string too)
     * @returns {Boolean} whether or not item is null or empty
     */
    var isNullOrEmpty = function(obj) {
        return obj === null ||
            (obj.length !== undefined && obj.length === 0);
    };
    
    /**
     * SafetyNet plugin.  Registers the matched selectors for tracking changes
     * in order to logically display a warning prompt when leaving an un-submitted form.
     * @param {Object} options optional object literal of plugin options
     */
    $.fn.safetynet = function(options){
        var settings = $.extend({}, $.safetynet.defaults, options || {});
        
        var selection = this;
        
        if(activated) {
            throw('Only one activation of jQuery.safetynet is allowed per page');
        }
        activated = true;
        
        // throw an exception if netchanger wasn't loadeds
        if($.fn.netchanger === undefined) {
            throw('jQuery.safetynet requires a missing dependency, jQuery.netchanger.');
        }
        
        // set up selected inputs to raise netchanger events
        this.netchanger({events: settings.netChangerEvents})
            // register an input's change on 'netchange'
            .bind('netchange', function(){
                $.safetynet.raiseChange(fieldIdentifierFor(this));
                })
            // clear an input's change on 'revertchange's
            .bind('revertchange', function(){
                $.safetynet.clearChange(fieldIdentifierFor(this));
                });
        
        // hook onto the onbeforeunload
        // this is a strange pseudo-event that can't be jQuery.fn.bind()'ed to
        window.onbeforeunload = function() { 
            // when suppressed, don't do anything but clear the suppression
            if($.safetynet.suppressed()) {              
                $.safetynet.suppressed(false);
                return undefined;
            }
            // show the popup only if there's changes
            // returning null from an onbeforeunload is the (strange) way of making it do nothing
            return $.safetynet.hasChanges() ? settings.message : undefined;             
        };
        // set form submissions to suppress warnings
        $(settings.form)
            .bind('submit', function(){ $.safetynet.suppressed(true); });
        
        return this;
    };

    /**
     * Shortcut alias for $($.safetynet.defaults.fields).safetynet(options);
     * @param {Object} options
     */
    $.safetynet = function(options){
        $($.safetynet.defaults.fields).safetynet(options);
    };

    $.extend($.safetynet,{
        /**
         * Manually registers a change with Safetynet, so that a warning is 
         * prompted when the user navigates away.  This can be useful for custom 
         * widgets like drag-and-drop to register their changed states.
         * @param {String} key a key is required since changes are tracked per-control
         *  in order to be able to cancel changes per-control. 
         */
        raiseChange: function(key) {
            if(key === undefined || isNullOrEmpty(key)) {
                throw("key is required when raising a jQuery.safetynet change");
            }
            changeFlags[key] = true;
        },
        /**
         * Manually un-registers a change with Safetynet.
         * As with automatically raised/cleared changes, if this is the last change to clear,
         * the warning prompt will no longer be set to display on next page navigation.
         * @param {String} key A key is required since changes are tracked per-control.
         */
        clearChange: function(key) {
            if(key === undefined || isNullOrEmpty(key)) {
                throw("key is required when clearing a jQuery.safetynet change");
            }
            delete changeFlags[key];
        },
        /**
         * Manually un-registers all raised changes.
         * Warning prompt will not display on next page navigation.
         */
        clearAllChanges: function(key) {
            changeFlags = {};
            activated = false;
        },
        /**
         * Returns and/or sets the suppressed state.  
         * Allows for manually suppressing the save warning, even if there are raised changes.  
         * @param {Boolean} val optional value to set for the suppressed state
         */
        suppressed: function(val) {
            if(arguments.length === 1) {
                suppressed = val;                
            }
            return suppressed;
        },
        /**
         * Returns whether there are currently-registered changes.
         */
        hasChanges: function() {
            return countProperties(changeFlags) > 0;
        },
        version: '0.9.0',
        defaults: {
            // The message to show the user when navigating away from a non-submitted form
            message: 'Your unsaved changes will be lost.',
            // Selector of default fields to monitor when using the `$.safetynet()` shortcut alias
            fields: 'input,select,textarea,fileupload',
            // Selector of forms on which to bind their `submit` event to suppress prompting
            form: 'form',
            // events on which to check for changes to the control
            netChangerEvents: 'change,keyup,paste'
        }
    });
})(jQuery);