//MCB
$(document).ready(function() {
    $(window).on('scroll',function() {
        if((window.innerHeight - 350)>=document.querySelector(".sideimg").getBoundingClientRect().top){
            if(document.querySelector('.musicbaropen')==undefined){
                $('.aplayer-unfixed').css("position","")
                $('.aplayer-unfixed').css("top","")                
                return;
            }
            else{
                $('.aplayer-fixed').addClass('aplayer-unfixed');
                $('.aplayer-body').css("width","290px")
                $('.aplayer-fixed').removeClass('aplayer-narrow');            
                $('.aplayer-fixed').removeClass('aplayer-fixed');
            }
            if(document.querySelector(".sidesticky").getBoundingClientRect().top!=20){
                $('.aplayeropened').css("position","relative")
                $('.aplayeropened').css("top","-70px")
            } else {
                $('.aplayeropened').css("position","sticky")
            }
        }
        else{
            $('.aplayer-unfixed').addClass('aplayer-fixed');
            $('.aplayer-body').css("width","400px")
            $('.musicbaropen').removeClass('musicbaropen');
            $('.aplayer-listleft').removeClass('aplayer-listleft');
            $('.aplayer-unfixed').css("position","")
            $('.aplayer-unfixed').css("top","")                
            $('.aplayer-unfixed').css("position","")
            $('.aplayer-unfixed').css("top","")                
            $('.aplayer-unfixed').addClass('aplayer-narrow');            
            $('.aplayer-unfixed').removeClass('aplayer-unfixed');
        }
    })
})
function addmusic(){
    if(document.querySelector('.musicbaropen')==undefined){
        $('.musicbar').addClass('musicbaropen');
        $('.aplayer-list').addClass('aplayer-listleft');
        $('.aplayer').addClass('aplayeropened');
        $('#music').css("border-radius","inherit");
        $('#candy').css("border-radius","inherit");
        var bodyhight=window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        $(document).scrollTop(bodyhight-1);
    } else {
        $('.musicbaropen').removeClass('musicbaropen');
        $('.aplayer-listleft').removeClass('aplayer-listleft');
        $('.aplayeropened').removeClass('aplayeropened');
        $('#music').css("border-bottom-left-radius","20px");
        $('#candy').css("border-bottom-right-radius","20px");        
    }
}
