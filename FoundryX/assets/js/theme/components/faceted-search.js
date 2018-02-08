import { hooks, api } from '@bigcommerce/stencil-utils';
import $ from 'jquery';
import Url from 'url';
import 'history.js/scripts/bundled-uncompressed/html4+html5/jquery.history';

function goToUrl(url) {
  // TODO: Wait for a fix from BC re: malformed pagination links
  History.pushState({}, document.title, url);
}

export default class FacetedSearch {
  constructor(requestOptions, options, callback ) {
    this.requestOptions = requestOptions;
    this.callback = callback;
    this.$body = $(document.body);

    this.options = $.extend({
      blocker: '.faceted-search-spinner',
      currentFiltersBlock: '.facet-selected-filters',
      sidebarToggle: '.faceted-sidebar-toggle',
      moreToggle: '.faceted-search-more',
      bodyClass: 'scroll-locked',
      moreFacets: '[data-show-more-facets]'
    }, options);

    this._bindEvents();
    this._bindHooks();
  }


  // -------------------------- Event Binding -------------------------- //

  _bindEvents() {

    $(document.body).on('click', this.options.sidebarToggle, (event) => {
      this._toggleSidebar(event);
    });

    $(window).on('statechange', this._onStateChange.bind(this));

    this.$body.on('click', this.options.moreFacets, (event) => {
      this._showMoreFacets(event);
    });
  }

  _bindHooks() {
    hooks.on('facetedSearch-facet-clicked', this._onFacetClick.bind(this));
    hooks.on('facetedSearch-range-submitted', this._onRangeSubmit.bind(this));
    hooks.on('sortBy-submitted', this._onSortBySubmit.bind(this));
  }


  // -------------------------- Filter Visibility Toggle -------------------------- //

  _toggleSidebar(event) {
    event.preventDefault();
    const $target = $(event.currentTarget);
    $target.toggleClass('button-alt');
    $target.parent().find('.faceted-search, .sorting').toggleClass('visible button-alt');
  }


  // -------------------------- State Change Triggers -------------------------- //

  _onFacetClick(event) {
    event.preventDefault();

    const $target = $(event.currentTarget);
    const url = $target.attr('href');

    if ($target.hasClass('selected-filter-item')) {
      this._updateCurrentFacets($target.parent());
    }

    if ($target.hasClass('clear-all')) {
      $(this.options.currentFiltersBlock).remove();
    }

    goToUrl(url);
  }


  _showMoreFacets(event) {
    // Show/hide extra facets based on settings for product filtering
    event.preventDefault();

    const $toggle = $(event.currentTarget);
    const $navList = $($toggle.attr('href'));
    const facet = $navList.data('facet');
    const $container = $navList.parent('[data-facet-filter-wrapper]');
    const facetUrl = History.getState().url;

    if (!$container.find('[data-additional-facets-list]').length) {
      if (this.options.showMore) {
        api.getPage(facetUrl, {
          template: this.options.showMore,
          params: {
            list_all: facet,
          },
        }, (err, response) => {
          if (err) {
            throw new Error(err);
          }
          $(response).insertAfter($navList);
          this._toggleFacetLists({$container, $navList, $toggle});
        });
      }
    } else {
      this._toggleFacetLists({$container, $navList, $toggle});
    }

    $navList.toggle();

    // Toggle more/less link
    $toggle.children().toggle();

    return false;
  }

  _toggleFacetLists($els, blocker = false) {
    const {$container, $navList, $toggle} = $els;
    const $navListOriginal = $(`[data-facet="${facet}"]`);
    const facet = $navList.data('facet');

    // Hide original list
    $navListOriginal.toggle();

    // Toggle new list
    $container
      .find('[data-additional-facets-list]')
      .toggle();
  }

  _onRangeSubmit(event) {
    event.preventDefault();

    const url = Url.parse(location.href);
    let queryParams = $(event.currentTarget).serialize();

    if ($(document.body).hasClass('template-search')) {
      const currentSearch = `search_query=${$('.faceted-search').data('search-query')}` || '';
      queryParams = `${queryParams}&${currentSearch}`;
    }

    goToUrl(Url.format({ pathname: url.pathname, search: '?' + queryParams }));
  }

  _onSortBySubmit(event) {
    event.preventDefault();

    const url = Url.parse(location.href, true);
    const queryParams = $(event.currentTarget).serialize().split('=');

    url.query[queryParams[0]] = queryParams[1];
    delete url.query['page'];

    goToUrl(Url.format({ pathname: url.pathname, query: url.query }));
  }

  _onStateChange(event) {
    this._enterProgressState();

    api.getPage(History.getState().url, this.requestOptions, (err, content) => {
      this._leaveProgressState();

      if (err) { throw new Error(err); }

      this._refreshView(content);
    });
  }

  _refreshView(content) {
    if (content) {
      this.callback(content);
    }
  }

  /*
   * If there is more than one active filter, just remove the one
   * If it's the only filter, remove the whole thing
   */
  _updateCurrentFacets($listItem) {
    if ($listItem.siblings().length) {
      $listItem.remove();
    } else {
      $(this.options.currentFiltersBlock).remove();
    }
  }

  // -------------------------- Overlay toggling -------------------------- //

  _enterProgressState() {
    $(document.body).addClass(this.options.bodyClass);
    $(this.options.blocker).addClass('visible');
  }

  _leaveProgressState() {
    $(document.body).removeClass(this.options.bodyClass);
    $(this.options.blocker).removeClass('visible');
  }

}
