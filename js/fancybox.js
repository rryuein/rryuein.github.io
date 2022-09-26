$(document).ready(function() {
  $('img').not('.notice img').not('.copyright-wrap img').not('.sidebar-image img').not('.author-profile .profile img').not(".mdl-menu img").not(".something-else-logo img").not('.lazyload').not('.top-social_v2 img').not('.wl-emoji-popup .wl-tabs .wl-tab .wl-emoji').each(function() {
    if ($(this).parent().hasClass('fancybox')) return;
    if ($(this).hasClass('nofancybox')) return;
    var alt = this.alt;
    if (alt) $(this).after('<span class="caption">' + '</span>');
    $(this).wrap('<a href="' + ($(this).attr('data-src') == null ? this.src : $(this).attr('data-src')) + '" title="' + alt + '" class="fancybox"></a>');
  });
  $(this).find('.fancybox').each(function(){
    $(this).attr('rel', 'article');
  });
});
$(document).ready(function() {
  $("a[href$='.jpg'],a[href$='.png'],a[href$='.gif'],a[href$='.webp']").attr('rel', 'gallery').fancybox({
    helpers : {
    title: { type: 'inside'}
    }
  });
});