/*!
 * pjax-reload.js —— 前进 / 后退（popstate）后，把 pjax 换页该做的重载全部补上
 *
 * 为什么需要这个文件（改代码前请先读这段）：
 *
 *   主题里其实存在【两份】jquery-pjax：
 *     ① source/js/pjax.js      —— 本主题改过的版本，popstate 分支被整段注释掉了；
 *     ② lib.min.js 内置的那份   —— 因为 footer.ejs 里 lib.min.js 在 pjax.js 之后加载，
 *        它会把 $.pjax / $.fn.pjax 整体覆盖掉，所以【真正生效的是 ②】。
 *
 *   ② 的 popstate 分支在“命中它自己的 DOM 缓存”时只发三个事件：
 *         pjax:start → pjax:beforeReplace → pjax:end
 *   唯独【不发 pjax:complete】。而主题所有“换页后重载”的逻辑都挂在 pjax:complete 上：
 *         · sakura-app.js 的 Siren 链（AH/PE/CE/VA/MJ/AB/TOC/BSZ/MCB）
 *         · player.js 的 musicBar.restore()、小仓鼠搬回侧栏
 *         · track.js 的 tocbot 重新初始化
 *         · #pjax-box 脚本块 / script[data-pjax] 重跑（fancybox、jQCloud、Headroom、图表）
 *   结果就是：点链接换页一切正常，一按后退/前进就“部分函数没加载 / 报错”。
 *
 * 本文件做三件事：
 *   1) 补齐事件：pjax:end 时若本轮导航没有出现过 pjax:complete，就补发一次
 *      —— 这样前进/后退与普通点链接走的是完全相同的一套重载流程；
 *   2) 兜底内容：popstate 之后如果地址栏变了、但 #page 还是旧内容
 *      （没有缓存条目 / history.state 丢失 / 容器不匹配），主动用 $.pjax 拉一次；
 *   3) 对外出口：window.PjaxReload.reloadAll() / .ensureContent()，需要时可以手动重载。
 *
 * 注意：不要再去取消注释 source/js/pjax.js 里的 onPjaxPopstate ——
 *   它和 lib.min.js 里的那份会同时挂在 popstate.pjax 命名空间上、各用各的缓存，
 *   一旦同时生效会互相打架（重复恢复、前进后退原地打转）。
 */
(function ($, window, document) {
  'use strict'

  var SELECTOR = {
    page: '#page', // pjax 的替换容器，见 sakura-app.js 的 $(document).pjax(..., '#page', ...)
    scripts: 'script[data-pjax]', // 需要跟着换页重跑的脚本（headroom 等）
    blocks: '[id="pjax-box"], .pjax-reload' // 需要跟着换页重跑的脚本块（fancybox / jQCloud / Headroom）
  }

  var completed = false // 本轮导航是否已经发过 pjax:complete
  var handledSig = '' // 已重载过的「地址 + state.id」，给 popstate 去重用

  /* ------------------------------------------------------------------ *
   * 小工具
   * ------------------------------------------------------------------ */

  function strip (href) {
    return String(href || '').split('#')[0]
  }

  // 一次导航的唯一指纹：地址 + history 里那次记录的 id
  function signature () {
    var state = $.pjax && $.pjax.state
    return strip(window.location.href) + '|' + (state && state.id ? state.id : '')
  }

  function reloadAll (reason) {
    // 不再复制一份“重载清单”，而是把事件补出来，让所有挂在 pjax:complete 上的
    // 既有逻辑（Siren 链、musicBar、脚本块、tocbot…）原样跑一遍。
    $(document).trigger('pjax:complete', [null, reason || 'manual', {}])
    handledSig = signature()
  }

  /* ------------------------------------------------------------------ *
   * 1. 脚本 / 脚本块重跑（原来写在 footer.ejs 的内联 <script> 里）
   * ------------------------------------------------------------------ */

  function reattach (el) {
    var $el = $(el)
    if (!$el.parent().length) return
    // 先 remove 再 append：jQuery 重新插入时会重新执行脚本，
    // 外链走 jQuery._evalUrl（cache: true），命中的是浏览器缓存，不会额外下载。
    $el.parent().append($el.remove())
  }

  function rerunScripts () {
    var page = document.querySelector(SELECTOR.page)

    // ① 单个脚本（data-pjax 标记的）
    //    #page 里的脚本在 jQuery 把新内容插进 DOM 时已经执行过一次，这里跳过，
    //    否则图表（echarts）之类的初始化会跑两遍。
    $(SELECTOR.scripts).each(function () {
      if (page && $.contains(page, this)) return
      reattach(this)
    })

    // ② 整个脚本块（fancybox 包图片、jQCloud 画词云、Headroom 初始化都在块内）
    $(SELECTOR.blocks).each(function () {
      if (page && $.contains(page, this)) return
      reattach(this)
    })
  }

  /* ------------------------------------------------------------------ *
   * 2. 事件：补齐 pjax:complete（前进后退命中缓存时唯一缺的那一环）
   * ------------------------------------------------------------------ */

  $(document)
    .on('pjax:start', function () {
      // ajax 换页和缓存恢复都会先发 pjax:start
      completed = false
    })
    .on('pjax:complete', function () {
      completed = true
    })
    .on('pjax:end', function (e, xhr, options) {
      if (completed) {
        // 普通点链接换页：complete 已经跑过了，这里只记指纹
        handledSig = signature()
        return
      }
      // 前进 / 后退命中 lib.min.js 内置 pjax 的 DOM 缓存：
      // 只发了 start / beforeReplace / end，补一次 complete，让重载链照常执行。
      $(document).trigger('pjax:complete', [xhr, 'cache-restore', options || {}])
      completed = true
      handledSig = signature()
    })

  // 换页后的脚本重跑（与原先 footer.ejs 内联版本等价）
  $(document).on('pjax:complete', rerunScripts)

  /* ------------------------------------------------------------------ *
   * 3. 换入前：剔掉缓存快照里的“常驻元素副本”
   *
   * pjax 的缓存快照是在【点击换页的瞬间】拍的（pjax() 里的 cachePush），
   * 早于 pjax:beforeReplace 把播放器/仓鼠搬出 #page。所以只要换页时音乐区是展开的，
   * 快照里就带着一份 .aplayer 的副本（仓鼠同理，带着 #ifm）。
   * 恢复快照时会把它插回页面，于是每后退/前进一次就多一份不会出声的“音乐栏”。
   *
   * 这些元素在换页时是被 player.js【搬出去再搬回来】的，从不重建，
   * 因此快照里那份副本必须扔掉。
   * 只清音乐区（.musicbar）和仓鼠位（#hamster）里的，正文里自己嵌的播放器不受影响。
   * ------------------------------------------------------------------ */
  $(document).on('pjax:beforeReplace', function (e, contents) {
    if (!contents || !contents.length) return
    var $contents = $(contents)
    $contents.filter('.musicbar, #hamster').find('.aplayer, #ifm').remove()
    $contents.find('.musicbar .aplayer, #hamster #ifm').remove()
  })

  /* ------------------------------------------------------------------ *
   * 4. popstate 兜底：内容没跟上地址栏时，主动拉一次
   * ------------------------------------------------------------------ */

  function ensureContent () {
    if (!(window.Poi && window.Poi.pjax)) return false // 主题没开 pjax
    if (!$.pjax || !$.support.pjax) return false
    if (!$(SELECTOR.page).length) return false

    var xhr = $.pjax.xhr
    if (xhr && xhr.readyState > 0 && xhr.readyState < 4) return true // 已经在拉取，等它的 complete

    var state = $.pjax.state
    if (state && strip(state.url) === strip(window.location.href)) return false // 内容已经对上了

    $.pjax({
      url: window.location.href, // 地址栏已经是目标地址
      container: SELECTOR.page,
      fragment: SELECTOR.page,
      push: false, // 不能再 push，否则后退会“原地打转”
      replace: true, // 把 state 盖回当前条目，方便下次比较
      scrollTo: false, // 保留浏览器恢复的滚动位置
      timeout: 8000
    })
    return true
  }

  // 注意：lib.min.js 内置的 popstate 处理器注册得比这里早，而且是同步执行完的。
  // 所以用 setTimeout(0) 等它处理完，再判断“到底有没有把 #page 换掉”。
  window.addEventListener('popstate', function () {
    setTimeout(function () {
      try {
        if (ensureContent()) return // 已经在重新拉取，等它的 pjax:complete
        if (signature() === handledSig) return // 缓存恢复 + 补齐 complete 都已经做过
        reloadAll('popstate') // 其它情况（有 state 但没恢复内容）兜底重载
      } catch (err) {
        // 兜底逻辑本身不能把页面搞挂：失败就整页刷新，回到确定状态
        console.error('[pjax-reload] popstate 处理失败，改为整页刷新：', err)
        window.location.reload()
      }
    }, 0)
  }, false)

  // bfcache（浏览器整个页面的快照）恢复：不会有任何 pjax 事件，手动重载一遍
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && window.Poi && window.Poi.pjax) reloadAll('bfcache')
  }, false)

  /* ------------------------------------------------------------------ *
   * 5. 对外出口
   * ------------------------------------------------------------------ */

  window.PjaxReload = {
    reloadAll: reloadAll, // 手动把“换页后要重载的东西”全部重跑一遍
    ensureContent: ensureContent, // 手动检查内容是否与地址栏一致，不一致就补拉
    rerunScripts: rerunScripts, // 只重跑脚本 / 脚本块
    signature: signature
  }
})(jQuery, window, document)
