import PageManager from '../PageManager';
import FacetedSearch from './components/faceted-search';
import ThemeUtilities from './global/theme-utilities';
import ProductCompare from './global/product-compare';
import Tabs from 'bc-tabs';

export default class Search extends PageManager {
  constructor() {
    super();

    this.utils = new ThemeUtilities();
  }

  _initializeFacetedSearch() {
    const requestOptions = {
      config: {
        category: {
          shop_by_price: true
        }
      },
      template: {
        productListing: 'search/product-index',
        filters: 'search/filters'
      }
    };

    const options = {
      blocker: '.progress-overlay',
      bodyClass: 'ajax-progress',
      showMore: 'search/show-more'
    };

    new FacetedSearch(requestOptions, options, (content) => {
      $('.product-grid-filters').html(content.filters);
      $('.product-grid-list').html(content.productListing);
    });
  }

  loaded(next) {
    if ($('.faceted-search').length) {
      this._initializeFacetedSearch();
    }

    if ($('.compare-enabled').length) {
      this.Compare = new ProductCompare();
    }

    this.tabs = new Tabs;
  }
}
