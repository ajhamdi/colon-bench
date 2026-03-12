window.HELP_IMPROVE_VIDEOJS = false;

$(document).ready(function () {
  // Navbar burger toggle
  $(".navbar-burger").click(function () {
    $(".navbar-burger").toggleClass("is-active");
    $(".navbar-menu").toggleClass("is-active");
  });

  // Bulma carousel
  var options = {
    slidesToScroll: 1,
    slidesToShow: 3,
    loop: true,
    infinite: true,
    autoplay: false,
    autoplaySpeed: 3000,
  };
  bulmaCarousel.attach('.carousel:not(.annotation-carousel)', options);
  bulmaCarousel.attach('.annotation-carousel', {
    slidesToScroll: 1,
    slidesToShow: 3,
    loop: true,
    infinite: true,
    autoplay: false,
  });
  bulmaSlider.attach();

  // Autoplay annotation videos when carousel is in viewport
  var annotationCarousel = document.querySelector('.annotation-carousel');
  if (annotationCarousel) {
    var annotationObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var videos = annotationCarousel.querySelectorAll('video');
        if (entry.isIntersecting) {
          videos.forEach(function (v) {
            var source = v.querySelector('source');
            if (source && !source.src && source.dataset && source.dataset.src) {
              source.src = source.dataset.src;
              v.load();
            }
            v.play().catch(function () {});
          });
        } else {
          videos.forEach(function (v) {
            v.pause();
          });
        }
      });
    }, { threshold: 0.2 });
    annotationObserver.observe(annotationCarousel);
  }

  // Tab switching (scoped per tab group)
  $('.tabs li').on('click', function () {
    var tabId = $(this).data('tab');
    var $tabGroup = $(this).closest('.tabs');
    var $tabContent = $tabGroup.next('.tab-content');
    $tabGroup.find('li').removeClass('is-active');
    $(this).addClass('is-active');
    $tabContent.find('.tab-pane').hide();
    $('#' + tabId).show();
  });

  // Expandable sections
  $('.expandable-toggle').on('click', function () {
    var targetId = $(this).data('target');
    var $target = $('#' + targetId);
    $(this).toggleClass('collapsed');
    $target.toggleClass('collapsed');
  });

  // Animated counters with Intersection Observer
  var countersAnimated = false;
  var counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !countersAnimated) {
        countersAnimated = true;
        animateCounters();
      }
    });
  }, { threshold: 0.3 });

  var statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    counterObserver.observe(statsSection);
  }

  function animateCounters() {
    $('.stat-number').each(function () {
      var $el = $(this);
      var target = parseFloat($el.data('target'));
      var suffix = $el.data('suffix') || '';
      var decimals = parseInt($el.data('decimals')) || 0;
      var duration = 1500;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        // Ease out quad
        var eased = 1 - (1 - progress) * (1 - progress);
        var current = eased * target;
        $el.text(current.toFixed(decimals) + suffix);
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }
      requestAnimationFrame(step);
    });
  }

  // Lazy video loading
  var videoObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var video = entry.target;
        var source = video.querySelector('source');
        if (source && source.dataset.src) {
          source.src = source.dataset.src;
          video.load();
        }
        videoObserver.unobserve(video);
      }
    });
  }, { rootMargin: '200px' });

  document.querySelectorAll('video[preload="none"]').forEach(function (video) {
    videoObserver.observe(video);
  });

  // Video Comparison Sliders (Before/After crop style)
  document.querySelectorAll('.video-compare').forEach(function (container) {
    var before = container.querySelector('.bal-before');
    var beforeInset = container.querySelector('.bal-before-inset');
    var handle = container.querySelector('.bal-handle');
    var videoAfter = container.querySelector('.bal-after video');
    var videoBefore = container.querySelector('.bal-before-inset video');

    // Set inset width to full container width so the video is never squeezed
    function syncInsetWidth() {
      beforeInset.style.width = container.offsetWidth + 'px';
    }
    syncInsetWidth();
    window.addEventListener('resize', syncInsetWidth);

    // Mouse interaction
    container.addEventListener('mousemove', function (e) {
      var containerWidth = container.offsetWidth;
      var offsetX = e.offsetX;
      // If the event target is a child, recalculate relative to container
      if (e.target !== container) {
        var rect = container.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
      }
      if (offsetX > 10 && offsetX < containerWidth - 10) {
        var pct = (offsetX * 100) / containerWidth;
        before.style.width = pct + '%';
        handle.style.left = pct + '%';
      }
    });

    // Touch interaction
    container.addEventListener('touchstart', function () {
      container.addEventListener('touchmove', onTouchMove);
    }, { passive: true });

    function onTouchMove(e) {
      var containerWidth = container.offsetWidth;
      var rect = container.getBoundingClientRect();
      var touchX = e.touches[0].clientX - rect.left;
      if (touchX > 10 && touchX < containerWidth - 10) {
        var pct = (touchX * 100) / containerWidth;
        before.style.width = pct + '%';
        handle.style.left = pct + '%';
      }
    }

    // Lazy-load and autoplay both videos when visible
    var loaded = false;
    var compareObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (!loaded) {
            loaded = true;
            [videoAfter, videoBefore].forEach(function (v) {
              var src = v.querySelector('source');
              if (src && src.dataset.src) {
                src.src = src.dataset.src;
                delete src.dataset.src;
                v.load();
              }
            });
            // Wait for both to be ready, then play
            var readyCount = 0;
            function onReady() {
              readyCount++;
              if (readyCount === 2) {
                syncInsetWidth();
                playBoth();
              }
            }
            videoAfter.addEventListener('canplay', onReady, { once: true });
            videoBefore.addEventListener('canplay', onReady, { once: true });
          } else {
            playBoth();
          }
        } else {
          videoAfter.pause();
          videoBefore.pause();
        }
      });
    }, { rootMargin: '200px' });
    compareObserver.observe(container);

    function playBoth() {
      videoAfter.currentTime = 0;
      videoBefore.currentTime = 0;
      videoAfter.play().catch(function () {});
      videoBefore.play().catch(function () {});
    }

    // Keep videos in sync
    videoAfter.addEventListener('timeupdate', function () {
      if (Math.abs(videoAfter.currentTime - videoBefore.currentTime) > 0.15) {
        videoBefore.currentTime = videoAfter.currentTime;
      }
    });
  });
});
