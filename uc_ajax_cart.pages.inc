<?php

/**
 * @file
 * Helper functions for process cart links
 */

/**
 * @todo Please document this function.
 * @see http://drupal.org/node/1354
 */
function uc_ajax_cart_links_process($arg1) {
  $messages = array();

  // Fail if the link is restricted.
  // TODO This variable was probably removed in Backdrop without replacement.
  $data = variable_get('uc_cart_links_restrictions', '');
  if (!empty($data)) {
    // TODO This variable was probably removed in Backdrop without replacement.
    $restrictions = explode("\n", variable_get('uc_cart_links_restrictions', ''));
    if (!empty($restrictions) && !in_array($arg1, $restrictions)) {
      // TODO This variable was probably removed in Backdrop without replacement.
      $url = variable_get('uc_cart_links_invalid_page', '');
      if (empty($url)) {
        backdrop_get_message(t('Sorry no valid product'));
      }
      return;
    }
  }

  // Split apart the cart link on the -.
  $actions = explode('-', backdrop_strtolower($arg1));
  $rebuild_cart = FALSE;

  foreach ($actions as $action) {
    switch (backdrop_substr($action, 0, 1)) {
      // Set the ID of the cart link.
      case 'i':
        $id = backdrop_substr($action, 1);
        break;

        // Add a product to the cart.
      case 'p':
        // Set the default product variables.
        $p = array(
          'nid' => 0,
          'qty' => 1,
          'data' => array(),
        );
        $msg = TRUE;

        // Parse the product action to adjust the product variables.
        $parts = explode('_', $action);
        foreach ($parts as $part) {
          switch (backdrop_substr($part, 0, 1)) {
            // Set the product node ID: p23
            case 'p':
              $p['nid'] = intval(backdrop_substr($part, 1));
              break;
              // Set the quantity to add to cart: q2
            case 'q':
              $p['qty'] = intval(backdrop_substr($part, 1));
              break;
              // Set an attribute/option for the product: a3o6
            case 'a':
              $attribute = intval(backdrop_substr($part, 1, strpos($part, 'o') - 1));
              $option = intval(backdrop_substr($part, strpos($part, 'o') + 1));
              $p['attributes'][$attribute] = (string) $option;
              break;
              // Suppress the add to cart message: m0
            case 'm':
              $msg = intval(backdrop_substr($part, 1)) == 1?TRUE : FALSE;
              break;
          }
        }

        // Add the item to the cart, suppressing the default redirect.
        if ($p['nid'] > 0 && $p['qty'] > 0) {
          // If it's a product kit, we need black magic to make everything work
          // right. In other words, we have to simulate FAPI's form values.
          $node = node_load($p['nid']);
          if (is_array($node->products)) {
            foreach ($node->products as $nid => $product) {
              $p['data']['products'][$nid] = array(
                'nid' => $nid,
                'qty' => $product->qty,
              );
            }
          }
          uc_cart_add_item($p['nid'], $p['qty'], $p['data'] + module_invoke_all('add_to_cart_data', $p), NULL, $msg, FALSE, FALSE);
          $rebuild_cart = TRUE;
        }
        break;

        // Empty the shopping cart.
      case 'e':
        // TODO This variable was probably removed in Backdrop without replacement.
        if (variable_get('uc_cart_links_empty', TRUE)) {
          uc_cart_empty(uc_cart_get_id());
        }
        break;

        // Display a pre-configured message.
      case 'm':
        // Load the messages if they haven't been loaded yet.
        if (empty($messages)) {
          // TODO This variable was probably removed in Backdrop without replacement.
          $data = explode("\n", variable_get('uc_cart_links_messages', ''));
          foreach ($data as $message) {
            $mdata = explode('|', $message);
            $messages[$mdata[0]] = $mdata[1];
          }
        }

        // Parse the message key and display it if it exists.
        $mkey = intval(backdrop_substr($action, 1));
        if (!empty($messages[$mkey])) {
          backdrop_set_message($messages[$mkey]);
        }
        break;
    }

    // Rebuild the cart cache if necessary.
    if ($rebuild_cart) {
      uc_cart_get_contents(NULL, 'rebuild');
    }
  }

  // TODO This variable was probably removed in Backdrop without replacement.
  if (variable_get('uc_cart_links_track', TRUE)) {
    $exists = db_query("SELECT clicks FROM {uc_cart_link_clicks} WHERE cart_link_id = :cart_link_id", array(':cart_link_id' => $id))->fetchField();
    if (intval($exists) == 0) {
      // TODO Please review the conversion of this statement to the D7 database API syntax.
      /* db_query("INSERT INTO {uc_cart_link_clicks} (cart_link_id, clicks, last_click) VALUES ('%s', 1, %d)", $id, REQUEST_TIME) */
      $id = db_insert('uc_cart_link_clicks')
  ->fields(array(
        'cart_link_id' => $id,
        'clicks' => 1,
        'last_click' => REQUEST_TIME,
      ))
  ->execute();
    }
    else {
      // TODO Please review the conversion of this statement to the D7 database API syntax.
      /* db_query("UPDATE {uc_cart_link_clicks} SET clicks = clicks + 1, last_click = %d WHERE cart_link_id = '%s'", REQUEST_TIME, $id) */
      db_update('uc_cart_link_clicks')
  ->fields(array(
        'clicks' => clicks + 1,
        'last_click' => REQUEST_TIME,
      ))
  ->condition('cart_link_id', $id)
  ->execute();
    }
  }
}
