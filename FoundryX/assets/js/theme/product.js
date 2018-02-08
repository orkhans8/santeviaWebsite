import $ from 'jquery';
import _ from 'lodash';
import PageManager from '../PageManager';
import ProductUtils from './product/product-utils';
import priceTemplates from './product/priceTemplates';
import FormValidator from './components/FormValidator';
import ProductImages from './product/ProductImages';
import ProductBulkPricing from './product/bulk-pricing';
import ProductReviews from './product/reviews';
import Tabs from 'bc-tabs';
import loading from './components/loading';

export default class Product extends PageManager {
  constructor() {
    super();

    this.el = '[data-product-container]';
    this.$el = $(this.el);

    new ProductBulkPricing();
    new Tabs();
  }

  loaded() {
    new ProductReviews(this.context);
    this.images = new ProductImages($('.single-product-slideshow'), this.context);

    this.ProductUtils = new ProductUtils(this.el, {
      priceWithoutTaxTemplate: priceTemplates.withoutTax,
      priceWithTaxTemplate: priceTemplates.withTax,
      priceSavedTemplate: priceTemplates.saved,
      callbacks: {
        willUpdate: () => loading(this.$el, true),
        didUpdate: () => loading(this.$el, true),
        switchImage: _.bind(this.images.newImage, this.images),
      },
    }).init(this.context);
  }
}
