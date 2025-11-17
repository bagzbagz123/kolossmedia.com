(function ($) {
	jQuery(window).on('elementor/frontend/init', function(){
		elementorFrontend.hooks.addAction( 'frontend/element_ready/brandslider-widget.default', function( $scope ) {
		   const elem = $scope.find('.tc_brand_carousel');
		   const sClass = elem[0].id;
		//    const data = elem.attr('slider_settings');
		//    const str_data = data.replace(/'/g, '"')
		//    const s_options = JSON.parse(str_data);
		//    let s_autopaly;
		//    let desk_space= parseInt(s_options.desktopSpace); let tab_space = parseInt(s_options.tabletSpace); let mobile_space = parseInt(s_options.mobileSpace)
		//    let s_speed = parseInt(s_options.speed);
		//    if(s_options.autoplay === 'yes'){
		// 	s_autopaly = {
		// 		 delay: s_options.autoplayDelay,
		// 		 disableOnInteraction: false,
		// 	 }
		//    }else{
		// 	s_autopaly = false
		//   }
			var swiper = new Swiper("#"+sClass, {
						effect: "coverflow",
						grabCursor: true,
						centeredSlides: true,
						slidesPerView: "auto",
						coverflowEffect: {
						rotate: 20,
						stretch: 0,
						depth: 350,
						modifier: 1,
						slideShadows: true,
						},
						navigation: {						
							nextEl: '.tc_navigation.swiper-button-next',
							prevEl: '.tc_navigation.swiper-button-prev',
						},
						pagination: {
							el: '.tc_brand_pagination',
							type: 'bullets',
							clickable: true,
						},
		
				});
		});



		elementorFrontend.hooks.addAction( 'frontend/element_ready/video-tab-widget.default', function( $scope ) {
			jQuery(".video_tabs_nav ul li:first-child").addClass('vc_active');
			jQuery(".tc_tab_nav").addClass('vc_active');

			$('.video_tabs_nav a').click(function() {

				// Check for active
				$('.video_tabs_nav li').removeClass('vc_active');
				$(this).parent().addClass('vc_active');
			
				// Display active tab
				let currentTab = $(this).attr('href');
				$('.video-tabs-content div').hide();
				$(currentTab).show();

			
				return false;
			  });


			$('.tc_tab_nav').click(function(){
				// Check for active
				$('.tc_tab_nav').removeClass('vc_active');
				$(this).addClass('vc_active');
			
				// Display active tab
				let currentTab = $(this).attr('href');
				$('.video-tabs-content div').hide();
				$(currentTab).show() ;
			
				return false;
			})
		
		});


		elementorFrontend.hooks.addAction( 'frontend/element_ready/logo-slider-widget.default', function( $scope ) {
			const elem = $scope.find('.tc_logo_carousel');
			const sClass = elem[0].id;
			var swiper = new Swiper("#"+sClass, {
					slidesPerView: 'auto',
					centeredSlides: true,
					loop: true,
					spaceBetween: 20,
					//grabCursor: true,
					//freeMode: true,
					speed: 3000,
					//freeModeMomentum: false,
					autoplay: {
						delay: 0,
						disableOnInteraction: false,
					  },

			});

		 });





		 elementorFrontend.hooks.addAction( 'frontend/element_ready/video-slider-widget.default', function( $scope ) {
			const elem = $scope.find('.tc_video_carousel');
			const sClass = elem[0].id;

			 var swiper = new Swiper("#"+sClass, {
				slidesPerView: 2,
				spaceBetween: 40,
				speed: 700,
				centeredSlides: true,
				navigation: {						
					nextEl: '.tc_video_navigation.swiper-button-next',
					prevEl: '.tc_video_navigation.swiper-button-prev',
				},
				effect: 'coverflow',
				grabCursor: true,
				centeredSlides: true,
				slidesPerView: 'auto',
				coverflowEffect: {
					rotate: 0,
					stretch: 0,
					depth: 50,
					modifier: 1,
					slideShadows: true,
				},
				pagination: {
				  el: ".swiper-pagination",
				  clickable: true,
				},
				breakpoints: {
					// when window width is >= 320px
					0: {
				     spaceBetween: 20,
					},
					// when window width is >= 480px
					600:{
						spaceBetween: 30,
					}
				},
			   on: {
				 slideChange: function (el) {
					 $('.swiper-slide').each(function () {
					 var youtubePlayer = $(this).find('iframe').get(0);
						 if (youtubePlayer) {
						 youtubePlayer.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
						 }
					 });
				 },
				},
			  });


		 });


		
	
	});
})(jQuery);

