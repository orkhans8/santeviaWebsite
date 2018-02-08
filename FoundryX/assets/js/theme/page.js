import PageManager from '../PageManager';
import Carousel from './components/Carousel';
import Slick from 'slick-carousel';
import 'slick-carousel/slick/slick.css';
import YouTubePlayer from 'youtube-player';

export default class Page extends PageManager {
    constructor() {
        super();
    }

	youtubeParser(url){
		var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
		var match = url.match(regExp);
		return (match&&match[7].length==11)? match[7] : false;
	}

    initSlick() {

    	if ( $( '.slider' ).length ) {
		    $('.slider').slick({
		      infinite: true,
		      slidesToShow: 3,
		      slidesToScroll: 1,
		      centerMode: true,
		      centerPadding: '0px',
		      nextArrow: '<span class="next"><i class="crew-icon-thin-arrow-right"></i></span>',
		      prevArrow:'<span class="prev"><i class="crew-icon-thin-arrow-left"></i></span>',
		      infinite: false,
		      responsive: [

		        {
		          breakpoint: 789,
		          settings: {
		            slidesToShow: 1,
		            slidesToScroll: 1
		          }
		        }
		      ]
		    });

		    $('.item').on( "click", function() {
		    	var index = $(this).data('slick-index');
			  $('.slider').slick('slickGoTo', index);
			});



		    $('.slider').on('afterChange', function(event, slick, currentSlide, nextSlide){
		        var elSlide = $(slick.$slides[currentSlide]);
		        var dataIndex = elSlide.data('slick-index');

		      $('.associated-slider .desc').each(function(){
		        if ($(this).data('content') == dataIndex) {
		          $(this).show();
		        } else {
		          $(this).hide();
		        }  
		      });

		    });
		}

    }

    loaded(next) {
    	
		if ( $( '.video-container' ).length ) {    	
		    $('.play-video').on('click', function(e) {
	          $('.video-frame').addClass('playing-video');
	          $(".video-container iframe")[0].src += "&autoplay=1";
	          e.preventDefault();
	        });
	    }
    

    	if ( $( '[data-carousel-slides]' ).length ) {

	    let player;
	    var youtubeUrl = this.context.youTubeUrl;

	    if (youtubeUrl) {
	      var poster = document.querySelector('.poster'),
	          vidId = this.youtubeParser(youtubeUrl),
	          posterUrl = this.context.youTubePoster;


	      if (posterUrl) {
	          poster.style.backgroundImage = "url('"+posterUrl+"')";
	      } else {
	          poster.style.backgroundImage = "url('https://img.youtube.com/vi/"+vidId+"/maxresdefault.jpg')";
	      }

	      
	       
	      var playerDefaults = {autoplay: 1, autohide: 1, modestbranding: 1, rel: 0, showinfo: 0, controls: 0, disablekb: 1, enablejsapi: 0, iv_load_policy: 3 };
	      player = YouTubePlayer('player', {
	          videoId: vidId,
	          playerVars: playerDefaults
	      });

	      
	      player.playVideo().then(function () {

	         if (poster.classList.contains('is-paused')){
	            poster.classList.remove('is-paused');
	          } 

	      });
	    
	  /*
	      player.on('ready', (event) => { 

	      

	      });
	  */
	      player.on('stateChange', (event) => {
	            if (event.data === YT.PlayerState.ENDED) {
	            player.playVideo(); 
	        }
	      });
	    }

	    	// Load up the carousel stuff on internal custom pages (mapped in app.js)
		    this.Carousel = new Carousel({
		      el: '[data-carousel-slides]',
		      delay: this.context.carouselDelay,
		      nav: '[data-carousel-pagination]',
		    });


		    this.initSlick();
		    next();
	    }
    }
}
