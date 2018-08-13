// hideshow.js --- HideShow JS file
//
// Copyright (C) 2014 All Right Reserved, Fabrice Niessen
//
// This file is free software: you can redistribute it and/or
// modify it under the terms of the GNU General Public License as
// published by the Free Software Foundation, either version 3 of
// the License, or (at your option) any later version.
//
// This file is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// Author: Fabrice Niessen <(concat "fniessen" at-sign "pirilampo.org")>
// URL: https://github.com/fniessen/hide-show/
// Version: 20140131.2037

// var HS_COLLAPSIBLE_HEADERS = $('h3, h4, h5'); // collapsible headers

if (typeof HS_STARTUP_FOLDED === 'undefined') {
    var HS_STARTUP_FOLDED = false;      // Show just the overview, or show all.
}

if (typeof HS_SHOW_ALL_TEXT === 'undefined') {
    var HS_SHOW_ALL_TEXT = '[Expand all]';
}
if (typeof HS_HIDE_ALL_TEXT === 'undefined') {
    var HS_HIDE_ALL_TEXT = '[Collapse all]';
}

if (typeof HS_ALWAYS_DISPLAY_ICON === 'undefined') {
    var HS_ALWAYS_DISPLAY_ICON = false; // Display an icon for all states, or
                                        // just when closed.
}

if (typeof HS_ICON_CLOSED === 'undefined') {
    var HS_ICON_CLOSED = '&#x25B7;';    // white right-pointing triangle
}
if (typeof HS_ICON_OPEN === 'undefined') {
    var HS_ICON_OPEN = '&#x25BD;';      // white down-pointing triangle
}
if (typeof HS_ICON_EMPTY === 'undefined') {
    var HS_ICON_EMPTY = '&#x25A0;';     // black square
}

if (typeof HS_SHOW_ALL_OPEN_DONE_TREES === 'undefined') {
    var HS_SHOW_ALL_OPEN_DONE_TREES = false; // Expand all will open DONE trees.
}

if (typeof HS_CLASS === 'undefined') {
    var HS_CLASS = 'hsCollapsible';
}

// Expand a header
function hsExpand(header) {
    hsExpand2(header, true);
}

// Expand a header
function hsExpand2(header, expandDoneHeader) {
    // Ignore non collapsible entries
    if (!header.parent().hasClass(HS_CLASS)) return;

    // Do not expand DONE node if not required
    if (hsIsDoneHeader(header) && !expandDoneHeader) return;

    header.children('span[class="ellipsis"]').remove();
    if (HS_ALWAYS_DISPLAY_ICON == true) {
        header.append('<span class="ellipsis"> ' + HS_ICON_OPEN + '</span>');
    }
    header.parent().removeClass('hsCollapsed').addClass('hsExpanded');
    header.nextAll().show();
}

// Expand a header and all sub headers
function hsRecursiveExpand(header) {
    hsExpand(header);
    header.parent().find('.hsCollapsed').each(function() {
        hsExpand2($(this).children(':header'), HS_SHOW_ALL_OPEN_DONE_TREES);
    });
}

// Collapse a header
function hsCollapse(header) {
    // Ignore non collapsible entries
    if (!header.parent().hasClass(HS_CLASS)) return;

    header.children('span[class="ellipsis"]').remove();
    header.append('<span class="ellipsis"> ' + HS_ICON_CLOSED + '</span>');
    header.parent().removeClass('hsExpanded').addClass('hsCollapsed');
    // header.nextAll().hide('fast');
    header.nextAll().hide();
}

// Toggle a header
function hsToggleCollapsing(header) {
    if (header.parent().hasClass('hsCollapsed'))
        hsExpand(header);
    else if (header.parent().hasClass('hsExpanded'))
        hsCollapse(header);
}

// Expand all headers
function hsExpandAll() {
    $('#content .hsCollapsed').each(function() {
        hsExpand2($(this).children(':header'), HS_SHOW_ALL_OPEN_DONE_TREES);
    });
}

// Collapse all headers
function hsCollapseAll() {
    $('#content .hsExpanded').each(function() {
        hsCollapse($(this).children(':header'));
    });
}

// Add click events to H3/H4/H5 headers which have contents.
function hsInit() {
    for (var i = 3; i <= 5; i++) {
        $('#content .outline-' + i).each(function() {
            var header = $(this).children(':header');
            if (header.siblings().length > 0) {
                $(this).addClass(HS_CLASS);
                header.css({cursor: 'pointer'});
                header.click(function() {
                    hsToggleCollapsing($(this)); });

                // Allow to override global Collapse/Expand default on an entry
                // basis (see property `:HTML_CONTAINER_CLASS:')
                if (header.parent().hasClass('hsCollapsed')) {
                    hsCollapse(header);
                } else if (header.parent().hasClass('hsExpanded')) {
                    hsExpand(header);
                } else {
                    hsSetDefaultVisibility(header);
                }
            }
            else {
                if (HS_ALWAYS_DISPLAY_ICON == true) {
                    header.append('<span class="ellipsis"> ' + HS_ICON_EMPTY
                                   + '</span>');
                }
                $(this).addClass('hsEmpty');
            }
        });
    }

    // Add buttons
    $('.title').after($('<div class="buttons dontprint"></div>'));
    $('.buttons').append($('<span>' + HS_SHOW_ALL_TEXT + '</span>')
                 .addClass('hsButton')
                 .click(hsExpandAll));
    $('.buttons').append($('<span>' + HS_HIDE_ALL_TEXT + '</span>')
                 .addClass('hsButton')
                 .click(hsCollapseAll));
}

// Returns true if a header is a DONE header
function hsIsDoneHeader(header) {
    return $('span.done', header).length;
}

// Sets the default visibility state to a header
function hsSetDefaultVisibility(header) {
    if (HS_STARTUP_FOLDED) {
        hsCollapse(header);
    }
    else {
        if (!hsIsDoneHeader(header) | HS_SHOW_ALL_OPEN_DONE_TREES) {
            hsExpand(header);
        }
        else {
            hsCollapse(header);
        }
    }
}

// Expands an anchor, i.e. expand all parent headers
function hsExpandAnchor(id) {
    // alert(id);
    if (id) {
        // alert($(id + '.hsNode').length);
        $(id).parents('.hsCollapsed').each(function() {
            hsExpand2($(this).children(':header'), true);
        });
    }
}

// go to next task to review
function reviewTaskNext() {
    if ($('.review').length == 0) {     // first task
        hsCollapseAll();
        $('h3:visible > span.todo :first').parent().parent().addClass('review');
    } else {                            // next task
        var curTask = $('.review').children('h3');
        curTask.parent().removeClass('review');
        hsCollapse(curTask);
        curTask.parent().nextAll('.outline-3').find('span.todo').first()
            .closest('.outline-3').addClass('review');
    }
    $('html, #content').css({background: '#909090'}); // pseudo-overlay
    hsRecursiveExpand($('.review').children('h3'));
    $('html, body').animate({
        scrollTop: $(".review").offset().top
    }, 200);
}

// go to previous task to review
function reviewTaskPrev() {
    if ($('.review').length > 0) {
        var curTask = $('.review').children('h3');
        curTask.parent().removeClass('review');
        hsCollapse(curTask);
        curTask.parent().prevAll('.outline-3').find('span.todo').last()
            .closest('.outline-3').addClass('review');
    }
    $('html, #content').css({background: '#909090'}); // pseudo-overlay
    hsExpand($('.review').children('h3'));
    $('html, body').animate({
        scrollTop: $(".review").offset().top
    }, 200);
}

// stop reviewing tasks
function reviewTaskQuit() {
    $('html, #content').css({background: '#FFFFFF'}); // pseudo-overlay
    $('.review').removeClass('review');
}

// $(document).ready(function() {
//     hsInit();
//     hsDefaultExpanded();
//
//     // all headers now are collapsed
//     // but we must show the header which was referenced by a trailing #anchor
//     // in the URL, and its parents
//     var url = document.location.toString();
//     if (url.match('#')) { // the URL contains an anchor
//         var id_anchor = url.split('#')[1];
//         expandAnchorSection(id_anchor);
//     }
//
//     // internal links to anchors, e.g. <a href='#sec2'>, should also expand the
//     // destination section before scrolling there
//     $('a[href^="#"]').not($('#tabs a[href^="#"]')).each(function() {
//         var caller = this;
//         $(caller).click(function (event) {
//             var href = $(caller).attr('href');
//             var id_href = href.substr(1);
//             expandAnchorSection(id_href);
//             return false;
//         });
//     });
// });

function hsHideTodoKeyword(kw) {
    $('span.' + kw).addClass('hsHidden').parent().parent().hide();
}

function hsShowTodoKeyword(kw) {
    $('span.' + kw).removeClass('hsHidden').parent().parent().show();
    // XXX Show if parent is not collapsed!
}
