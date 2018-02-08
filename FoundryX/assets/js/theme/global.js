import $ from 'jquery';
import PageManager from '../PageManager';
import utils from '@bigcommerce/stencil-utils';
import ThemeInit from './global/theme-init';
import Navigation from './components/navigation';
import SelectWrapper from './components/SelectWrapper';
import HeaderTools from './global/header-tools';
import CurrencySelector from './global/currency-selector';
import QuickShop from './product/QuickShop';
import updateCartPreview from './global/update-cart-preview';
import dismissable from './core/alertDismissable';
import scrollReveal from 'scrollreveal';
import FormValidator from './components/FormValidator';
import FileUploadWrapper from './components/FileUploadWrapper';
import validetta from 'validetta';

export default class Global extends PageManager {
  constructor() {
    super();

    new Navigation($('.navigation'));
    new HeaderTools($('.header-tools'));
    new CurrencySelector($('.currency-selector'));
    new CurrencySelector($('.mobile-currency-selector'));

    const $select = $('select');
    if ($select.length) {
      $select.each((i, el) => {
        new SelectWrapper(el);
      });
    }

  }

  appendCountryMessage($country1, $country2, $link) {      
      var msgBar = '<div class="country-warning-message"><div class="container"><div class="row"><div class="col-12"><span>It looks like you\'re shopping from ' + $country1 + '. <a href="' + $link + '">Click here to shop our ' + $country2 + ' store.</a></span></div></div></div></div>';
      $('body').prepend(msgBar);
      $('.country-warning-message').slideDown( "slow");
  }

  loaded(next) {
    this.validator = new FormValidator(this.context);
    this.validator.initGlobal();
    var that = this;

    // bind click on dismissable alerts
    dismissable();

    updateCartPreview();

    const $quickShop = $('[data-quick-shop-trigger]');
    if ($quickShop.length) {
      new QuickShop('[data-quick-shop]', this.context);
    }

    const $upload = $('.form-field-file input');
    if ($upload.length) {
      $upload.each((i, el) => {
        new FileUploadWrapper(el, this.context).updateFilename();
      });
    }

    /*
     *  Geo Ip detection through maxmind GeoIp2
     *  Couldn't find a useful / compatible NPM package, so geoip2.js
     *  is enqueued in base.html
     */

    geoip2.country(function (response) {

      var country = response.country.iso_code;

      if (that.context.baseUrl == 'ca.santevia.com' && country == 'US') {
        that.appendCountryMessage('the United States', 'US', 'https://www.santevia.com');
      } else if (that.context.baseUrl == 'www.santevia.com' && country == 'CA') {
        that.appendCountryMessage('Canada', 'Canadian', 'https://ca.santevia.com');
      }

    }, null, { w3cGeolocationDisabled: true });



    /*
     *  Country bar functionality
     */
      
    $(window).scroll(function() {
        var $scroll_position = $(window).scrollTop(),
            height = $('.country-warning-message').height();
        if ($scroll_position > 200) {
            $('body').addClass('sticky-warning-message').css('padding-top', height);
            setTimeout(function(){

                $('.country-warning-message').addClass('fade-in');

            }, 500);
        } else {
            $('body').removeClass('sticky-warning-message').css('padding-top', 0);
            $('.country-warning-message').removeClass('fade-in');
        }
     });

    /*
     *  Used for flag active states
     */

    var url = window.location.href,
        caFlag = $('.store-selector .ca'),
        usFlag = $('.store-selector .us'),
        caPretty = "ca.santevia.com",
        caLong = "store-4e06e",
        usPretty = "www.santevia.com",
        usPretty2 = "http://santevia.com",
        usLong = "store-3cd41";

    if (url.indexOf(caPretty) !== -1 || url.indexOf(caLong) !== -1) {
      caFlag.addClass('active');
    } else if (url.indexOf(usPretty) !== -1 || url.indexOf(usLong) !== -1 || url.indexOf(usPretty2) !== -1) {
      usFlag.addClass('active');
    }

    next();
  }
}
