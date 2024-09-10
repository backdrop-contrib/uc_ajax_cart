Backdrop.behaviors.ucAjaxCart = {
  attach: function (context, settings) {

    if (!Backdrop.uc_ajax_cart) {

      // First initialization.

      // Set up UC Ajax Cart namespace.
      Backdrop.uc_ajax_cart = {};

      // Populate namespace.
      Backdrop.uc_ajax_cart.cart_open_state = true;
      Backdrop.uc_ajax_cart.cart_wrapper = $('.block-uc-ajax-cart-delta-0', context);
      Backdrop.uc_ajax_cart.cart_pane = $('#ajaxCartUpdate #cart-block-contents-ajax', context);
      Backdrop.uc_ajax_cart.update_container = $('#ajaxCartUpdate', context);
      Backdrop.uc_ajax_cart.unblock_handler = { attach: function () { Backdrop.uc_ajax_cart.blockUI_blocked -= 1;}}
      Backdrop.uc_ajax_cart.blockUI_blocked = 0;

      // BlockUI settings.
      $.blockUI.defaults.growlCSS.opacity = 1;
      $.blockUI.defaults.timeout = Backdrop.settings.uc_ajax_cart.TIMEOUT;
      $.blockUI.defaults.onUnblock = Backdrop.uc_ajax_cart.unblock_handler;

      // Other one time processes.
      ///////////////////////////

      // Hide update cart button if needed.
      $('.hidden-update-bt').hide();


      // Add open cart class because initially is opened.
      Backdrop.uc_ajax_cart.cart_wrapper.addClass('cart-open');

      if (Backdrop.settings.uc_ajax_cart.COLLAPSIBLE_CART) {
        // Check open state tracking.
        if (Backdrop.settings.uc_ajax_cart.TRACK_CLOSED_STATE) {
          ajaxCartCheckCookieCartState();
        }
        else if (Backdrop.settings.uc_ajax_cart.INITIAL_CLOSED_STATE) {
          // Close cart block.
          ajaxCartCloseCart();
        }
      }
    }


    // Set up ajax-cart-view-handler.
    $('#ajax-cart-view-handler').attr('href', '#')
    .text(Backdrop.t('Load cart content'))
    .click(ajaxCartUpdateBlockCart);



    // Ubercart Cart links support.
    $('a.ajax-cart-link').not('.ajax-cart-processed').each(function () {
      var $elem = $(this);
      // Check for ajaxify class.
      if (_checkAjaxify($elem)) {
        $elem.bind('click', function () {
          ajaxCartBlockUI(Backdrop.settings.uc_ajax_cart.ADD_TITLE,
                          '<div class="messages status">' + Backdrop.settings.uc_ajax_cart.ADD_MESSAGE + '</div>');
          $.get(Backdrop.settings.uc_ajax_cart.CART_LINK_CALLBACK,
                    { href: this.href },
                    ajaxCartFormSubmitted);
          return false;
        })
      }
    }).addClass('ajax-cart-processed');

    // Ubercart submit.
    $('form.ajax-cart-submit-form input.ajax-cart-submit-form-button').not('.ajax-cart-processed, #edit-update').each(function () {
      var $elem = $(this);
      // Check for ajaxify class.
      if (_checkAjaxify($elem)) {
        $elem.click(function () {
          var form = $(this).parents('form').eq(0);
          form.ajaxSubmit({
            url : Backdrop.settings.uc_ajax_cart.CALLBACK,
            beforeSubmit : function () {
              ajaxCartBlockUI(Backdrop.settings.uc_ajax_cart.ADD_TITLE,
                              '<div class="messages status">' + Backdrop.settings.uc_ajax_cart.ADD_MESSAGE + '</div>')},
            success : ajaxCartFormSubmitted,
            type : 'post'
          });
          return false;
        });
      }
    }).addClass('ajax-cart-processed');




    // Check for autoupdate cart block.
    if ($('#ajaxCartUpdate').not('.ajax-cart-processed').hasClass('load-on-view')) {
      $('#ajaxCartUpdate').addClass('ajax-cart-processed');
      ajaxCartUpdateBlockCart();
    }

    // Call behaviors over cart block.
    ajaxCartCartBlockBehaviors();

    // Call behaviors over cart page.
    ajaxCartCartPageBehaviors();
  }
}
  
  // Submits product changes using AJAX and updates cart and cart block accordingly.
  function ajaxCartSubmit() {
    $(this).parents('form').ajaxSubmit({
      url: Backdrop.settings.uc_ajax_cart.UPDATE_CALLBACK,
      success: function(response) {
        var message = response || 'Cart updated successfully.';
        ajaxCartFormSubmitted(message);
        $('#uc-cart-view-form input').removeAttr('disabled');
      },
      beforeSubmit: function () {
        $('#uc-cart-view-form input').attr('disabled', 'disabled');
        // ajaxCartBlockUI(Backdrop.settings.uc_ajax_cart.ADD_TITLE, '<div class="messages status">' + Backdrop.settings.uc_ajax_cart.UPDATE_MESSAGE + '</div>');
      }
    });
    return false;
  }
  
  // Triggers cart submit button.
  function triggerCartSubmit() {
    $('#uc-cart-view-form #edit-update').click();
  }
  
  
  // Process behaviors for the cart from cart page.
  function ajaxCartCartPageBehaviors(context) {
  
    if (Backdrop.settings.uc_ajax_cart.AJAXIFY_CART_PAGE) {
  
      // Set handler for cart submit button.
      $('#uc-cart-view-form #edit-update').not('.ajax-cart-processed').bind('click', ajaxCartSubmit)
      .addClass('ajax-cart-processed');
  
      // Trigger submit button when cart qty form input elements are changed.
      $('#uc-cart-view-form .qty input').not('.ajax-cart-processed').bind('change', triggerCartSubmit)
      .addClass('ajax-cart-processed');


      $('#uc-cart-view-form .remove input').not('.ajax-cart-processed').each(function () {
        var elem = $(this);
        elem.click(function (e) {
          e.preventDefault();
          $(this).parents('tr').eq(0).find('td.qty input.form-text').val('0');
          triggerCartSubmit();
          return false;
        });
        elem.addClass('ajax-cart-processed');
      });
    }
  }
  
  
  // Process behaviors for the cart block.
  function ajaxCartCartBlockBehaviors(context) {
     // Is the cart in the receieved context?
     var cart_pane = $('#ajaxCartUpdate #cart-block-contents-ajax');
     if (cart_pane.length) {
       Backdrop.uc_ajax_cart.cart_pane = cart_pane;
  
      $('#ajaxCartToggleView').not('.ajax-cart-processed').click(function () {
        ajaxCartToggleView();
        return false;
      })
      .addClass('ajax-cart-processed');
     }
  }
  
  
  // Opens cart block.
  // Sets cookie if track open state enabled.
  function ajaxCartOpenCart(instantly) {
    if (!Backdrop.uc_ajax_cart.cart_open_state) {
      Backdrop.uc_ajax_cart.cart_open_state = true;
      if ((!instantly) && (Backdrop.settings.uc_ajax_cart.CART_PANE_EFFECT)) {
        Backdrop.uc_ajax_cart.cart_pane.slideDown(Backdrop.settings.uc_ajax_cart.CART_PANE_EFFECT_DURATION);
      }
      else {
        Backdrop.uc_ajax_cart.cart_pane.show();
      }
      Backdrop.uc_ajax_cart.cart_wrapper.addClass('cart-open');
  
      if (Backdrop.settings.uc_ajax_cart.TRACK_CLOSED_STATE) {
        $.cookie('ajax-cart-visible', '1', { path: '/'});
      }
    }
  }
  
  
  // Closes cart block.
  // Sets cookie if track open state enabled.
  function ajaxCartCloseCart(instantly) {
    if (Backdrop.uc_ajax_cart.cart_open_state) {
      Backdrop.uc_ajax_cart.cart_open_state = false;
      if ((!instantly) && (Backdrop.settings.uc_ajax_cart.CART_PANE_EFFECT)) {
        Backdrop.uc_ajax_cart.cart_pane.slideUp(Backdrop.settings.uc_ajax_cart.CART_PANE_EFFECT_DURATION);
      }
      else {
        Backdrop.uc_ajax_cart.cart_pane.hide();
      }
      Backdrop.uc_ajax_cart.cart_wrapper.removeClass('cart-open');
  
      if (Backdrop.settings.uc_ajax_cart.TRACK_CLOSED_STATE && ($.cookie('ajax-cart-visible') != '0')) {
        $.cookie('ajax-cart-visible', '0', { path: '/'});
      }
    }
  }
  
  
  // Initialize cart page ajax update feature.
  // Simply call behaviors for cart page with right context.
  function ajaxCartInitCartView() {
  
    // Hide update cart button if needed.
    $('.hidden-update-bt').hide();
  
    ajaxCartCartPageBehaviors($('#cart-form-pane'));
  }
  
  // Initialize cart block.
  // Simply call behaviors for cart block with right context.
  function ajaxCartInitCartBlock(context) {
    ajaxCartCartBlockBehaviors(context);
  
    // Cart has been loaded, so it's shown, change state accordingly.
    Backdrop.uc_ajax_cart.cart_open_state = true;
  
    if (Backdrop.settings.uc_ajax_cart.COLLAPSIBLE_CART) {
      // Check this is the right state.
      if (Backdrop.settings.uc_ajax_cart.TRACK_CLOSED_STATE) {
        ajaxCartCheckCookieCartState();
      } else if (Backdrop.settings.uc_ajax_cart.INITIAL_CLOSED_STATE) {
         ajaxCartCloseCart(true);
      }
  
    }
  }
  
  
  // Checks open state cookie and changes cart open state accordingly.
  function ajaxCartCheckCookieCartState() {
    var cookie_state = $.cookie('ajax-cart-visible');
  
    if (Backdrop.uc_ajax_cart.cart_open_state != cookie_state) {
      if (cookie_state == true) {
        ajaxCartOpenCart(true);
      }
      else {
        ajaxCartCloseCart(true);
      }
    }
  }
  
  
  // Show message using BlockUI anc configured layout.
  function ajaxCartShowMessageProxy(title, message) {
  
    if (Backdrop.settings.uc_ajax_cart.HIDE_CART_OPERATIONS) {
      return;
    }
  
    // Check if UI is blocked. Blocked UI implies no fader in to avoid flickering.
    var fadein = 0;
    if (!Backdrop.uc_ajax_cart.blockUI_blocked) {
      fadein = 500;
    }
  
    Backdrop.uc_ajax_cart.blockUI_blocked += 1;
    if (Backdrop.settings.uc_ajax_cart.BLOCK_UI == 1) {
      $.blockUI({ message : '<h2>' + title + '</h2>' + message, fadeIn: fadein });
    }
    else {
      var $m = $('<div class="growlUI"></div>');
      if (title) {
        $m.append('<h1>' + title + '</h1>');
      }
  
      if (message) {
        $m.append('<h2>' + message + '</h2>');
      }
  
      $.blockUI({
        message: $m,
        fadeIn: fadein,
        fadeOut: 700,
        showOverlay: false,
        centerY: false,
        css: {
          width: '350px',
          top: '10px',
          left: '',
          right: '10px',
          border: 'none',
          padding: '5px',
          backgroundColor: '#000',
          '-webkit-border-radius': '10px',
          '-moz-border-radius': '10px',
          'border-radius': '10px',
          color: '#fff',
          opacity: 1
        }
      });
    }
  }
  
  
  function ajaxCartShowMessageProxyClose() {
    $.unblockUI();
  }
  
  
  // Toggle cart block.
  function ajaxCartToggleView() {
    Backdrop.uc_ajax_cart.cart_open_state ? ajaxCartCloseCart() : ajaxCartOpenCart();
  }
  
  
  // Processes after cart form is submitted.
  function ajaxCartFormSubmitted(e) {
    // Enable input elements from cart from cart page.
    $('form.ajax-cart-submit-form input').attr('disabled', false);
  
    // Update cart block.
    ajaxCartUpdateBlockCart();
  
    ajaxCartBlockUI(Backdrop.settings.uc_ajax_cart.CART_OPERATION, e);
    ajaxCartReloadCartView();
  }
  
  
  function ajaxCartBlockUI(title, message) {
    ajaxCartShowMessageProxy(title, message);
  }
  
  
  function ajaxCartBlockUIRemove(url) {
    $('#uc-cart-view-form input').attr('disabled', 'disabled');
    ajaxCartBlockUI(Backdrop.settings.uc_ajax_cart.REMOVE_TITLE,
      '<div class="messages status">' + Backdrop.settings.uc_ajax_cart.REMOVE_MESSAGE + '</div>');
    // ajaxCartShowMessageProxy(Backdrop.settings.uc_ajax_cart.REMOVE_TITLE, Backdrop.settings.uc_ajax_cart.REMOVE_MESSAGE);
    $.post(url, ajaxCartFormSubmitted);
    return false;
  }
  
  function ajaxCartUpdateBlockCart() {
    $.ajax({
      url: Backdrop.settings.uc_ajax_cart.SHOW_CALLBACK,
      type: 'GET',
      success: function(response) {
        Backdrop.uc_ajax_cart.update_container.html(response);
        
        ajaxCartInitCartBlock(Backdrop.uc_ajax_cart.cart_wrapper);
      },
      error: function(xhr, status, error) {
        console.error('AJAX request failed:', status, error);
      }
    });
  
    return false;
  }
  
  function ajaxCartReloadCartView() {
    if ($('#cart-form-pane').length) {
      $.ajax({
        url: Backdrop.settings.uc_ajax_cart.SHOW_VIEW_CALLBACK,
        type: 'GET',
        success: function(response) {
          $('#cart-form-pane').html(response);
          ajaxCartInitCartView();
        },
        error: function(xhr, status, error) {
          console.error('AJAX request failed:', status, error);
        }
      });
    }
  }
  
  function ajaxCartUpdateCartViewUpdated(e) {
    ajaxCartUpdateBlockCart();
    ajaxCartInitCartView();
  }
  
  
  function ajaxCartShowMessages(e) {
    if (e != "") {
      clearTimeout();
      ajaxCartShowMessageProxy('Message', e);
    }
  }
  
  function _checkAjaxify($elem) {
    var rc = true;
    if (Backdrop.settings.uc_ajax_cart.AJAXIFY_CLASS) {
      rc = $elem.parents().add($elem).is('.' + Backdrop.settings.uc_ajax_cart.AJAXIFY_CLASS);
      rc = Backdrop.settings.uc_ajax_cart.AJAXIFY_CLASS_EXCLUDES ? !rc : rc;
    }
    return rc;
  }
  