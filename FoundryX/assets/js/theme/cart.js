import PageManager from '../PageManager';
import $ from 'jquery';
import _ from 'lodash';
import utils from '@bigcommerce/stencil-utils';
import GiftWrap from './cart/gift-wrap';
import ShippingEstimator from './cart/shipping-estimator';
import bindCartCodeEvents from './cart/bindCartCodeEvents';

export default class Cart extends PageManager {
  constructor() {
    super();
    this.giftWrap = new GiftWrap();
  }

  loaded(next) {
    this.$cartContent = $('[data-cart-content]');
    this.$cartTotals = $('[data-cart-totals]');
    this.bindEvents();

    new ShippingEstimator(this.context, $('[data-shipping-estimator]'));

    if (window.ApplePaySession && $('.dev-environment').length) {
      $(document.body).addClass('apple-pay-supported');
    }

    next();
  }

  // Updates the cart displayed, showing new totals in table and below.
  cartUpdate($target) {
    const itemId = $target.data('cart-itemid');
    const $el = $('#qty-' + itemId);
    const qty = parseInt($el.val(), 10);
    const oldQty = parseInt($el.data('orig-qty'), 10);

    // If quantity set to 0 (or otherwise falsey), confirm removal
    if (!qty) {
      const remove = confirm(Theme.messages.cart.remove_item);
      if (!remove) {
        $el.val(oldQty);
        return;
      }
    }

    // Disable the cart while updates are running...
    this.$cartContent.addClass('deactivated');
    this.$cartTotals.addClass('deactivated');

    utils.api.cart.itemUpdate(itemId, qty, (err, response) => {
      if (response.data.status === 'succeed') {
        // if the quantity is changed "1" from "0", we have to remove the row.
        const remove = (qty === 0);
        this.refreshContent(remove);
      } else {
        $el.val(oldQty);
        // TODO: Better error messages possible? 'out_of_stock' is a bit limiting.
        alert(response.data.errors.join('\n'));
        this.$cartContent.removeClass('deactivated');
        this.$cartTotals.removeClass('deactivated');
      }
    });
  }

  /*-----------------------------------------------------------------*/

  // Reloads the table and footer, then triggers the header update.
  refreshContent(remove) {
    const $cartItemsRows = $('[data-item-row]', this.$cartContent),
    options = {
      template: {
        content: 'cart/content',
        totals: 'cart/footer',
      }
    };

    // Remove last item from cart? Reload
    if (remove && $cartItemsRows.length == 1) {
      return window.location.reload();
    }

    utils.api.cart.getContent(options, (err, response) => {

      this.$cartContent.html(response.content);
      this.$cartTotals.html(response.totals);

      const quantity = $('[data-cart-quantity]', this.$cartContent).data('cart-quantity') || 0;
      this.bindEstimatorEvents();
      this.giftWrap.init();
      this.$cartContent.removeClass('deactivated');
      this.$cartTotals.removeClass('deactivated');
      $('body').trigger('cart-quantity-update');
    });
  }

  bindEstimatorEvents() {
    const $estimatorContainer = $('.shipping-estimator'),
    $estimatorForm = $('.estimator-form');

    $estimatorForm.on('submit', (event) => {
      const params = {
        country_id: $('[name="shipping-country"]', $estimatorForm).val(),
        state_id: $('[name="shipping-state"]', $estimatorForm).val(),
        zip_code: $('[name="shipping-zip"]', $estimatorForm).val()
      };

      event.preventDefault();

      utils.api.cart.getShippingQuotes(params, 'cart/shipping-quotes', (err, response) => {
        $('.shipping-quotes').html(response.content);

        // bind the select button
        $('.select-shipping-quote').on('click', (event) => {
          const $quoteId = $('.shipping-quote:checked').val();

          event.preventDefault();

          utils.api.cart.submitShippingQuote($quoteId, (response) => {
            this.refreshContent();
            // TODO: Not quite working yet. Refresh cart when quote submitted.
          });
        });
      });
    });

    this.$cartTotals.on('click','.shipping-estimate-show', (event) => {
      event.preventDefault();

      $(event.currentTarget).addClass('hidden');;
      $estimatorContainer.removeClass('hidden');;
      $('.shipping-estimate-hide').removeClass('hidden');;
    });

    this.$cartTotals.on('click','.shipping-estimate-hide', (event) => {
      event.preventDefault();

      $estimatorContainer.addClass('hidden');;
      $('.shipping-estimate-show').removeClass('hidden');;
      $('.shipping-estimate-hide').addClass('hidden');;
    });
  }

  quantityChangeButtons() {
    const updateRow = _.bind(_.debounce(this.cartUpdate, 750), this);

    this.$cartContent.on('click', '[data-quantity-change] button', (event) => {
      event.preventDefault();

      const $target = $(event.currentTarget);
      const $qtyInput = $target.siblings('input');

      if ($target.data('action') === 'inc') {
        $qtyInput.val( parseInt($qtyInput.val(),10) + 1 );
      } else if ($qtyInput.val() > 0) {
        $qtyInput.val( parseInt($qtyInput.val(),10) - 1 );
      }

      updateRow($qtyInput);
    });
  }

  quantityInputChange() {
    const updateRow = _.bind(_.debounce(this.cartUpdate, 750), this);
    let timer;

    this.$cartContent.on('keyup','[data-cart-update]', (event) => {
      clearTimeout(timer);

      timer = setTimeout(function() {
        const $target = $(event.currentTarget);
        updateRow($target);
      }, 750);
    });

    $('body').trigger('cart-quantity-update');
  }

  bindEvents() {
    bindCartCodeEvents($('.cart-promo-codes'));
    bindCartCodeEvents($('.cart-gift-certificates'));
    this.bindEstimatorEvents();
    this.quantityChangeButtons();
    this.quantityInputChange();
    this.giftWrap.init();
  }
}
