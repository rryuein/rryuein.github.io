//侧边栏音乐播放与小仓鼠，aplayer.ejs已弃用

/* ---------- 0. 播放器只有三种形态，全部由下面三个函数负责 ----------
   ① 侧栏内联   .aplayer-unfixed.aplayeropened        → display:block + position:sticky，290×65
   ② 左下角悬浮 .aplayer.aplayer-fixed.aplayer-narrow  → position:fixed
   ③ 隐藏       .aplayer-unfixed（display:none）

   关键：.aplayer-unfixed 本身就是 display:none，所以「进侧栏」时漏掉 .aplayeropened
   播放器会整个消失 —— 以前滚动那条分支就是这么把音乐栏搞丢的。
   新增形态请只改这三个函数，别在别处手拼类名。 */

$(document).ready(function () {
    /* 滚动时在「侧栏内联」和「左下角悬浮」之间切换 */
    $(window).on('scroll', function () {
        var side = document.querySelector('.sideimg')
        var sticky = document.querySelector('.sidesticky')
        if (!side || !sticky) return
        var ap = realPlayer()
        if (!ap) return
        if (sticky.getBoundingClientRect().top <= 46) {
            // 侧栏吸顶：展开进 .musicbar；播放器还停在左下角时也顺手收回来
            if ($('.musicbar').hasClass('musicbaropen') || $(ap).hasClass('aplayer-fixed')) {
                placeInMusicBar(ap)
            }
        } else if ($('.musicbar').hasClass('musicbaropen')) {
            // 侧栏还没吸顶：收成左下角小条，否则会跟着侧栏一起滚出屏幕
            collapseToCorner(ap)
        }
    })
})
$(function(){
    $('body').on('click', '.aplayer', function(){
      if($('.aplayer-button').hasClass('aplayer-play')) {
        $('.aplayer-lrc').removeClass('lrc-show');
      } else {
        $('.aplayer-lrc').addClass('lrc-show');
      }
    })
})
/* ---------- 1. 顺序加载库：APlayer 必须在 Meting 之前 ---------- */
var libsPromise = null;
function loadScript(src, timeout) {
  return new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    var done = false;
    var timer = null;

    function fail (msg) {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      reject(new Error(msg));
    }

    s.src = src;
    s.async = true;
    s.onload = function () {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      resolve();
    };
    s.onerror = function () { fail('[player] 加载失败：' + src); };
    // CDN 被墙 / 证书错误 / 返回挂住时，onload、onerror 可能都不来。
    // 没有超时的话 mountAplayer() 的 Promise 永远 pending，mounting 永远是 true，
    // 音乐按钮从此再也点不动（表现为“音乐失效”）。
    timer = setTimeout(function () { fail('[player] 加载超时（15s）：' + src); }, timeout || 15000);
    document.head.appendChild(s);
  });
}
function ensureLibs() {
  if (libsPromise) return libsPromise;
  libsPromise = Promise.resolve()
    .then(function () {
      // APlayer 先就位
      if (!window.APlayer) return loadScript('https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js');
    })
    .then(function () {
      // 再定义 meting-js 自定义元素
      if (!window.customElements.get('meting-js')) return loadScript('https://cdn.jsdelivr.net/npm/meting@2/dist/Meting.min.js');
    })
    .catch(function (e) {
      // 失败后把缓存清掉，否则后续每次点击都拿到同一个 rejected promise → 永久失效
      libsPromise = null;
      throw e;
    });
  return libsPromise;
}

/* ---------- 2. 只在第一次点击时实例化 ---------- */
var mounting = false;
function mountAplayer() {
  var host = document.getElementById('aplayer-host');
  var tpl  = document.getElementById('aplayer-tpl');
  if (!host || !tpl) return Promise.resolve(null);
  if (host.querySelector('meting-js')) return Promise.resolve(null); // 已经挂过了

  return ensureLibs().then(function () {
    host.appendChild(document.importNode(tpl.content, true)); // ← 这一刻才连 DOM、才 connectedCallback、才 fetch 歌单
  });
}

/* ---------- 3. 三种形态 ---------- */

/* ① 进侧栏的 .musicbar：先把形态定好再搬家，否则会按 .aplayer-fixed 在左下角先定位一下 */
function placeInMusicBar (ap) {
  var slot = document.querySelector('.musicbar');
  if (!ap || !slot) return false;
  $(ap).removeClass('aplayer-fixed aplayer-narrow').addClass('aplayer-unfixed aplayeropened');
  $('.aplayer-body').css('width', '290px');
  $('.aplayer-list').css('max-height', '270px');
  $('.aplayer-list ol').css('max-height', '270px');
  $('.aplayer-list').addClass('aplayer-listleft');
  $('.musicbar').addClass('musicbaropen');
  $('#music').css('border-radius', 'inherit');
  $('#mouse').css('border-radius', 'inherit');
  if (ap.parentNode !== slot) slot.appendChild(ap);
  return true;
}

/* ② 左下角悬浮窄条：必须先从 .musicbar 里搬出来，因为 .musicbar 马上要 display:none */
function collapseToCorner (ap) {
  var host = document.getElementById('aplayer-host');
  if (!ap) return false;
  if (host && ap.parentNode !== host) host.appendChild(ap);
  $(ap).addClass('aplayer-fixed aplayer-narrow aplayeropened')
      .removeClass('aplayer-unfixed')
      .css({ position: '', top: '' });      // 清掉内联值，让 .aplayer-fixed 的 fixed 生效
  $('.aplayer-body').css('width', '');      // 让 APlayer 的 66px !important 说话
  $('.musicbar').removeClass('musicbaropen');   // 侧栏那 65px 占位收起
  $('.aplayer-listleft').removeClass('aplayer-listleft');
  return true;
}

/* ③ 隐藏：用户加载期间又点了“收起”，或者从收起态换页回来 */
function hidePlayer (ap) {
  var host = document.getElementById('aplayer-host');
  if (!ap) return false;
  if (host && ap.parentNode !== host) host.appendChild(ap);
  $(ap).removeClass('aplayer-fixed aplayer-narrow aplayeropened').addClass('aplayer-unfixed');
  $('.musicbar').removeClass('musicbaropen');
  return true;
}

/* ---------- 4. MetingJS 是异步建 APlayer 的，等它出现 ----------
   以前这里是 setTimeout(…, 8000) 到点就 disconnect()：
   网速/歌单接口慢的时候 APlayer 是 8 秒之后才建出来的，于是永远停在 .aplayer-fixed（左下角）。
   现在改成「观察整个 body + 轮询兜底」，一直等到它出现为止，不再到点放弃。 */
function whenPlayer (cb, warnAfter) {
  var done = false;
  var mo = null;
  var fast = null;   // 前 45 秒的高频轮询
  var slow = null;   // 之后降频兜底

  function check () {
    var ap = realPlayer();
    if (ap) finish(ap);
  }

  function finish (ap) {
    if (done || !ap) return;
    done = true;
    if (mo) mo.disconnect();
    if (fast) clearInterval(fast);
    if (slow) clearInterval(slow);
    try { cb(ap); } catch (e) { console.error('[player] 摆放播放器失败：', e); }
  }

  var now = realPlayer();                 // 已经有播放器就直接摆（第二次点“音乐”走这里）
  if (now) return finish(now);

  mo = new MutationObserver(check);
  mo.observe(document.body, { childList: true, subtree: true });

  // MutationObserver 偶尔会漏（节点在同一个 tick 里被反复搬动），加个轮询兜底
  fast = setInterval(check, 300);

  // 到点还没出现：把“卡在哪一步”说清楚，并把高频轮询降下来（继续等，不放弃）
  function diagnose () {
    var missing = [];
    if (!window.APlayer) missing.push('APlayer 没加载');
    if (!window.customElements.get('meting-js')) missing.push('meting-js 没注册');
    if (!document.getElementById('aplayer-host')) missing.push('页面里没有 #aplayer-host');
    if (missing.length) return missing.join('、') + '（库没加载成功，看 Network 里 APlayer/Meting 的请求）';
    return '库都在，多半是歌单接口没返回（Network 里看 meting 的 fetch）';
  }

  setTimeout(function () {
    if (done) return;
    if (fast) { clearInterval(fast); fast = null; }
    slow = setInterval(check, 2000);
    console.warn('[player] 等了 ' + Math.round((warnAfter || 15000) / 1000) +
      ' 秒还没出现 .aplayer：' + diagnose());
  }, warnAfter || 15000);
}

/* ---------- 5. 重写 addmusic ---------- */
var wantOpen = false;                    // 用户意图：加载期间又点了一次“收起”时，别回头又弹出来
window.addmusic = function () {          // 必须是 window 上，避免被 sakura-app.js 那份覆盖
  if ($('.musicbar').hasClass('musicbaropen')) {   // 已展开 → 收起
    wantOpen = false;
    $('.musicbar').removeClass('musicbaropen');
    $('.aplayer-listleft').removeClass('aplayer-listleft');
    $('.aplayeropened').removeClass('aplayeropened');
    $('#music').css('border-radius', '');
    $('#mouse').css('border-radius', '')
    return;
  }
  if (mounting) return;
  mounting = true;
  wantOpen = true;

  // 先给 UI 反馈：撑开 290×65 的槽位，加载期间显示背景 loading
  $('.musicbar').addClass('musicbaropen');

  mountAplayer().then(function () {
    mounting = false;
    whenPlayer(function (ap) {
      if (!wantOpen) { hidePlayer(ap); return; }   // 加载期间用户已经点了收起
      placeInMusicBar(ap);
    });
  }).catch(function () {
    mounting = false;
    wantOpen = false;
    $('.musicbar').removeClass('musicbaropen');
    console.error('[player] APlayer/Meting 加载失败');
  });
};
/* ---------- 6. pjax：保存 / 恢复音乐区 ---------- */

var apState = { open: false };

/* 真正的播放器只有一只：它要么收在常驻容器 #aplayer-host 里，
   要么被搬进了当前页面的 .musicbar。
   不能无脑用 document.querySelector('.aplayer') —— 前进/后退恢复缓存快照时
   曾经会带进来一份“死副本”，那样搬错对象就会出现两三个音乐栏。
   （副本本身现在已在 pjax-reload.js 的 pjax:beforeReplace 里剔掉，这里是第二道保险） */
function realPlayer () {
    var host = document.getElementById('aplayer-host');
    var ap = host && host.querySelector('.aplayer');
    return ap || document.querySelector('.aplayer');
}

window.musicBar = {
  save: function () {                                   // 换页前
    apState.open = $('.musicbar').hasClass('musicbaropen');
    var ap   = realPlayer();
    var host = document.getElementById('aplayer-host');
    if (!ap || !host) return;
    if (ap.parentNode !== host) host.appendChild(ap);
    // 换页这一下先藏起来，免得在页面底部露出来；restore 会放回 .musicbar。
    // 注意：这里只动播放器自己的类，不碰 .musicbaropen ——
    // jquery-pjax 的 beforeReplace 可能被触发多次，动槽位状态会把 apState.open 记错。
    if (apState.open) $(ap).addClass('aplayer-unfixed').removeClass('aplayeropened');
  },
  restore: function () {
    var ap   = realPlayer();
    var host = document.getElementById('aplayer-host');
    var slot = document.querySelector('.musicbar');
    if (!ap || !host) return;

    // 兜底：恢复出来的音乐区/常驻容器里若还留着播放器副本，清掉（只动这两处，不碰正文）
    if (slot) $(slot).find('.aplayer').not(ap).remove();
    $(host).find('.aplayer').not(ap).remove();

    if (apState.open && slot) placeInMusicBar(ap);          // 该展开 → 搬进当前音乐区
    else hidePlayer(ap);                                    // 收起态：藏进常驻容器
  }
};

$(document).on('pjax:beforeReplace', function () { window.musicBar.save(); });//然后再sakura-app中pajx:complete后重载恢复

/* 仓鼠实现  */
function addmouse(){
    if(document.querySelector('#ifm')==null){
        var iframe=document.createElement("iframe");
        iframe.id="ifm";
        iframe.setAttribute("frameborder", "0");
        iframe.src="https://cdn.abowman.com/widgets/hamster/hamster.html?up_bgColor=eeeeee&up_bodyColor=e6debe&up_earColor=d4c898&up_snoutColor=f7f4e9&up_eyeColor=000000&up_feetColor=d4c898&up_tailColor=e6debe&up_waterColor=e0efff&up_foodColor=cba920&up_wheelColor=ffffff&up_wheelOuterColor=ff4d4d&up_wheelCenterColor=e4eb2f&up_wheelSpokeColor=dedede";
        if(document.querySelector('.sideimg #hamster')!=null){
            document.querySelector('.sideimg #hamster').appendChild(iframe);
        }
    }
}
/* 使用moveBefore()函数移动，避免在pjax时被销毁，这么好的函数怎么不早告诉我（不支持的浏览器直接放弃，建议使用“高端”浏览器） */
function beforeMove(el, target) {
  if (target.moveBefore) { try { target.moveBefore(el, null); return; } catch (e) {} }
}

var mouseHost = null;
function addOutMouse() {
  if (mouseHost && document.body.contains(mouseHost)) return mouseHost;
  mouseHost = document.createElement('div');
  mouseHost.id = 'mouse-host';
  mouseHost.style.cssText =
    'position:fixed;top:0;left:0;z-index:2;display:none;overflow:hidden;' +
    'border-radius:20px;pointer-events:auto;will-change:transform';
  document.body.appendChild(mouseHost);      
  return mouseHost;                         
}//在重载区外临时创建容器

$(document).on('pjax:beforeReplace', function () {
  var f = document.getElementById('ifm'), host = addOutMouse();
  if (f && host) beforeMove(f, host);            // 先搬出 #page
});
$(document).on('pjax:complete', function () {
  var f = document.getElementById('ifm'), slot = document.querySelector('#hamster');
  if (f && slot) beforeMove(f, slot);            // 再搬回新侧栏
});
