jQuery.safetynet
================
A smarter in-browser "unsaved changes" warning  
[http://github.com/mmonteleone/jquery.safetynet][0]  

What?
-----

Web browsers provide an `onbeforeunload` "event" for allowing prompting of a user before she navigates away from a page.  By default, this event is somewhat inflexible, and has no intelligence of its own.

jQuery.safetynet is a simple [jQuery][3] plugin that monitors a form for changes and provides a save warning when navigating away in an intelligent manner.

### Features:

* Monitors the form for *true* changes, not just `onchange` events.  i.e. typing in an input that results in the input having a truly  different value on the input's `onblur` relative to when the page loaded or safetynet was last refreshed. (thanks to [jQuery.netchanger][9])
* Smart enough to track when a previously truly changed field is later reverted back to its original state, and to not warn if all inputs are reverted back to their original states.  So if a user changes some fields, tries to leave, is warned about the unsaved changes and cancels leaving, changes modifed fields back to their original values, and again tries to leave, she will not be warned.  jQuery.safetynet tracks changes on an input-by-input level.  (thanks again to  [jQuery.netchanger][9])
* Can distinguish between a normal attempted navigation away from the page and a navigation away due to a requested form submission, since it should not warn in the latter case.
* Exposes a simple API for other code to: 
  * Manually raise and cancel field-scoped changes on jQuery.safetynet.  This is useful for custom widgets like drag-and-drop, etc.
  * Manually suppress save warnings if necessary
* Compatible with jQuery 1.3 and 1.4.  When used with 1.4 monitors document internally via `live` instead of `bind` to automatically account for DOM changes after page load.  This is configurable.

### Basic Example

Given the setup...  

    $('input,select,textarea').safetynet({message: "You didn't save your work yet!"});
   
jQuery.safetynet will monitor inputs, selects, and textareas for actual content changes, and if one occurs, will warn the user upon leaving that she has unsaved changes.  And because jQuery.safetynet uses the [jQuery.netchanger][9] plugin behind the scenes, it's smart enough to know to only consider true content changes from their original values, and also to consider when inputs are reverted back to their original state, and not to warn.

As a shortcut, the above could have been setup using its default message and input selectors:

    $.safetynet();
    

Requirements, installation, and notes
-------------------------------------

jQuery.safetynet requires:

* [jQuery][3] 1.3.2 or greater
* [jQuery.netchanger][9] 0.9.2 or greater plugin

Both are included with jQuery.safetynet.

You can download the [zipped release][8] containing a minified build with examples and documentation or the development master with unit tests by cloning `git://github.com/mmonteleone/jquery.safetynet.git`.

jQuery.safetynet requires [jquery][3] 1.3.2, and [jQuery.netchanger][9] 0.9.1 and can be installed thusly 

    <script type="text/javascript" src="jquery-1.4.2.min.js"></script>
    <script type="text/javascript" src="jquery.netchanger.min.js"></script>
    <script type="text/javascript" src="jquery.safetynet.min.js"></script>

jQuery.safetynet includes a full unit test suite, and has been verified to work against Firefox 3.5, Safari 4, Internet Explorer 6,7,8, Chrome, and Opera 9 and 10.  Please feel free to test its suite against other browsers.

jQuery 1.4 Bonus
----------------

Safetynet works great with jQuery 1.3, but it's even better with 1.4.  When used with jQuery 1.4, jQuery.safetynet automatically assumes monitoring the document and its fields via netchanger with `.live()` instead of `.bind()`, allowing for any newly added DOM elements to also be protected by safetynet.  

This behavior can be overridden by specifying the 'live' option, and is only allowed with jQuery 1.4.

Also when used with jQuery 1.4+, jQuery.safetynet, takes into account that changed inputs could be possibly deleted before a user attempts to navigate away from the page, and doesn't take those inputs' changes into acccount.

Complete API
------------

### Activation

Within the `document.ready` event, call

    $('input,select,textarea').safetynet(options);
   
where options is an optional object literal of options.  This registers the matched controls to be guarded for unsubmitted changes, and to warn the user if the user navigates away without submitting.

As a shortcut,    

    $.safetynet(options);  

is an alias for `$('input,select,textarea,fileupload').safetynet(options);`

Only one activation of jQuery.safetynet is allowed per page.  Subsequent attempts will throw an exceptions.

### Options

* **message**: The message to show the user when navigating away from a non-submitted form
  * *default*: `'Your unsaved changes will be lost.'`
* **fields**: Selector of default fields to monitor when using the `$.safetynet()` shortcut alias syntax instead of `$('fieldselector').safetynet();`
  * *default*: `'input,select,textarea,fileupload'`
* **form**: Selector of forms on which to bind their `submit` event to suppress the prompting of a save warning, as form submissions should not logically warn the user of unsaved changes.
  * *default*: `'form'`
* **netChangerEvents**: events on which to check for changes to the control, and raise the netchanger events.  This shouldn't usually need to be changed.
  * *default*: `'change,keyup,paste'`
* **live**: whether to monitor document and fields via `live` instead of `bind`, allowing for newly added DOM content to also be protected by safetynet automatically.
  * *default*: `true` when using jQuery 1.4 or greater.  `false` otherwise.  Passing `true` without jQuery 1.4 or greater throws an exception.

### Functions

* **jQuery.safetynet.raiseChange(key):**  Manually registers a change with the plugin, so that a warning is prompted when the user navigates away. This can be useful for custom widgets like drag-and-drop to register their changed states.  
**key:** *a key is required since changes are tracked per-control in order to be able to cancel changes per-control. Key can be literal string to associate change with, or a jQuery object to traverse and associate changes with each matched element*

        // key as literal string
        $.safetynet.raiseChange('item-dragged-5');

        // key as jQuery. (raises change on all text inputs)        
        $.safetynet.raiseChange($('input[type="text"]'));  

* **jQuery.safetynet.clearChange(key):**  Manually un-registers a change with the plugin.  As with automatically raised/cleared changes, if this is the last change to clear, the warning prompt will no longer be set to display on next page navigation.  
**key:** *A key is required since changes are tracked per-control.  Key can be literal string to associate change with, or a jQuery object to traverse and associate changes with each matched element.*
    
        // key as literal string
        $.safetynet.clearChange('item-dragged-5');  
        
        // key as jQuery. (clears any changes from text inputs)
        // especially useful before removing fields from the DOM
        // as those fields may have previously raised changes with 
        // safetynet, and once they're gone, can not be cleared
        $.safetynet.clearChange($('input[type="text"]'));  

* **jQuery.safetynet.clearAllChanges()**:  Manually un-registers all raised changes.  Warning prompt will not display on next page navigation.

        $.safetynet.clearAllChanges();

* **jQuery.safetynet.hasChanges()**:  Returns whether there are currently-registered changes.

        var willFormWarn = $.safetynet.hasChanges();

* **jQuery.safetynet.suppressed(value)**:  Returns and/or sets the suppressed state.  Allows for manually suppressing the save warning, even if there are raised changes.  
**val** *optional value to set for the suppressed state*

        $.safetynet.suppressed(true);  // will block form from warning even if it has changes

How to Contribute
-----------------

Development Requirements (for building and test running):

* Ruby + Rake, PackR, rubyzip gems: for building and minifying
* Java: if you want to test using the included [JsTestDriver][6] setup

Clone the source at `git://github.com/mmonteleone/jquery.safetynet.git` and have at it.

The following build tasks are available:

    rake build     # builds package and minifies
    rake test      # runs jQuery.netchanger specs against QUnit testrunner in default browser
    rake server    # downloads, starts JsTestDriver server, binds common browsers
    rake testdrive # runs jQuery.safetynet specs against running JsTestDriver server
    rake release   # builds a releasable zip package

&lt;shameless&gt;Incidentally jQuery.safetynet's unit tests use QUnit along with one of my other projects, [Pavlov][4], a behavioral QUnit extension&lt;/shameless&gt;

Changelog
---------

* 0.9.5 - When used with jQuery 1.4 or greater, takes into account that changed inputs could have been subsequently deleted, and so ignores their raised changes 
Fixes issue 3 http://github.com/mmonteleone/jquery.safetynet/issues/#issue/3
* 0.9.4 - Fixed issue with non-named, but id'd, inputs not being properly distinguished http://github.com/mmonteleone/jquery.safetynet/issues/#issue/2 
* 0.9.3 - Added workaround for the still-outstanding [issue](http://dev.jquery.com/ticket/6166) in jQuery 1.4.2, thereby giving safetynet full jQuery 1.4.2 compatibility.  This also now requires upgrading the netchanger plugin to 0.9.2 or greater.
* 0.9.2 - jQuery.safetynet.clearChange and jQuery.safetynet.raiseChange now overloaded to accept both explicit keys and jQuery objects
* 0.9.1 - Added support for new 'live' option in conjunction with new jQuery 1.4 support
* 0.9.0 - Initial Release

License
-------

The MIT License

Copyright (c) 2009 Michael Monteleone, http://michaelmonteleone.net

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[0]: http://github.com/mmonteleone/jquery.safetynet "jQuery.safetynet"
[1]: http://michaelmonteleone.net "Michael Monteleone"
[3]: http://jquery.com "jQuery"
[4]: http://github.com/mmonteleone/pavlov "Pavlov"
[6]: http://code.google.com/p/js-test-driver/ "JsTestDriver"
[7]: http://github.com/mmonteleone/jquery.safetynet/raw/master/jquery.safetynet.js "raw safetynet script"
[8]: http://cloud.github.com/downloads/mmonteleone/jquery.safetynet/jquery.safetynet.zip "jQuery.safetynet Release"
[9]: http://github.com/mmonteleone/jquery.netchanger "jQuery.netchanger"