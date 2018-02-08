import PageManager from '../PageManager';
import FacetedSearch from './components/faceted-search';
import ThemeUtilities from './global/theme-utilities';
import ProductCompare from './global/product-compare';

export default class Category extends PageManager {
  constructor() {
    super();

    this.utils = new ThemeUtilities();
  }

  loaded(next) {
    if ($('.faceted-search').length) {
      this._initializeFacetedSearch();
    }

    if ($('.compare-enabled').length) {
      this.Compare = new ProductCompare();
    }
  }

  _initializeFacetedSearch() {
    const requestOptions = {
      config: {
        category: {
          shop_by_price: true
        }
      },
      template: {
        productListing: 'category/product-index',
        filters: 'category/filters'
      },
      showMore: 'category/show-more'
    };

    const options = {
      blocker: '.progress-overlay',
      bodyClass: 'ajax-progress',
      showMore: 'category/show-more'
    };

    new FacetedSearch(requestOptions, options, (content) => {
      $('.product-grid-filters').html(content.filters);
      $('.product-grid-list').html(content.productListing);
    });
  }
}
