//TOC
$(document).ready(function() {
    if ($(".toc").length > 0 && document.body.clientWidth > 1000) {
        if ($(".pattern-center").length > 0) { //有图的情况
            tocbot.init({
                // Where to render the table of contents.
                tocSelector: '.toc', // 放置目录的容器
                // Where to grab the headings to build the table of contents.
                contentSelector: '.entry-content', // 正文内容所在
                // Which headings to grab inside of the contentSelector element.
                scrollSmooth: true,
                headingSelector: 'h1, h2, h3, h4, h5', // 需要索引的标题级别
                headingsOffset: -400,
                scrollSmoothOffset: -85,
            });
        } else {
            tocbot.init({
                // Where to render the table of contents.
                tocSelector: '.toc', // 放置目录的容器
                // Where to grab the headings to build the table of contents.
                contentSelector: '.entry-content', // 正文内容所在
                // Which headings to grab inside of the contentSelector element.
                scrollSmooth: true,
                headingSelector: 'h1, h2, h3, h4, h5', // 需要索引的标题级别
                headingsOffset: -85,
                scrollSmoothOffset: -85,
            });
        }
        $(window).on('scroll', function() {
            if(document.querySelector(".is-active-li")!=undefined){            
                var activeDiv = document.querySelector(".is-active-li").getBoundingClientRect().top;
                var marked = document.querySelector('.toc-list-item').getBoundingClientRect().top;
                setTimeout(() => {
                    $('.toc-container').scrollTop(activeDiv-marked-40);
                }, 100); 
            }        
        })
    }
});
