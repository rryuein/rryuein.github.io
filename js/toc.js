//TOC
function initToc() {
  if (!$('.toc').length) return;                    // 没有目录容器
  if (document.body.clientWidth <= 1000) return;    // 窄屏不启用
  if (typeof tocbot === 'undefined') return;        // 库未就绪

  var hasPattern = $('.pattern-center').length > 0; // 有头图时标题偏移不同
  tocbot.init({
    tocSelector: '.toc',
    contentSelector: '.entry-content',
    headingSelector: 'h1, h2, h3, h4, h5',
    scrollSmooth: true,
    headingsOffset: hasPattern ? -400 : -85,
    scrollSmoothOffset: -85,
  });

  // 目录容器跟随高亮项；用命名空间，避免换页后叠加多份
  $(window).off('scroll.tocAuto').on('scroll.tocAuto', function () {
    var active = document.querySelector('.is-active-li');
    var first  = document.querySelector('.toc-list-item');
    if (!active || !first) return;
    var d = active.getBoundingClientRect().top - first.getBoundingClientRect().top;
    $('.toc-container').scrollTop(d - 40);
  });
}

$(document).ready(initToc);                 // ① 首屏
$(document).on('pjax:complete', initToc);   // ② 点击换页 + 前进/后退（popstate→$.pjax 也走这里）
window.addEventListener('pageshow', function (e) {
  if (e.persisted) initToc();               // ③ bfcache 整页快照恢复
});