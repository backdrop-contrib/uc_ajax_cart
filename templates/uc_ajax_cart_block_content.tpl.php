<?php
/**
 * @file
 *
 * Theme file for non empty cart.
 */
?>
<div id="cart-block-contents-ajax">
  <table class="cart-block-items">
    <thead>
      <tr>
        <th colspan="4">
          <?php print t('Products')?>
        </th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ( $items as $item ):?>
      <tr class="odd">
        <td class="cart-block-item-qty">
          <?php print $item['qty'] ?>
        </td>
        <td class="cart-block-item-title">
          <?php print $item['title']; print $item['descr']; ?>
        </td>
        <td>
          <?php print $item['total'] ?>
        </td>
        <td colspan="4" class="cart-block-item-desc">
          <?php print $item['remove_link'] ?>
        </td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
<table>
  <tbody>
    <tr>
      <td class="cart-block-summary-items">
        <?php print $items_text; ?>
      </td>
      <td class="cart-block-summary-total">
        <label><?php print t('Total'); ?>: </label><?php print $total ;?>
      </td>
      <td colspan="2" class="cart-block-summary-links">
        <?php print $cart_links; ?>
      </td>
    </tr>
  </tbody>
</table>
