export function ketchConsentBindingScript(pageLanguage: string): string {
  const language = JSON.stringify(pageLanguage)

  return `(function(){
    var bridge=window.__nb1KetchConsentBridge=window.__nb1KetchConsentBridge||{bound:false};
    window.__nb1Consent=window.__nb1Consent||{};

    function applyKetchConsent(consent){
      if(typeof window.gtag!=='function')return;
      var purposes=consent&&consent.purposes||{};
      window.__nb1Consent=purposes;
      window.gtag('consent','update',{
        analytics_storage:purposes.analytics?'granted':'denied',
        ad_storage:purposes.targeted_advertising?'granted':'denied',
        ad_user_data:purposes.targeted_advertising?'granted':'denied',
        ad_personalization:purposes.targeted_advertising?'granted':'denied'
      });
    }

    function bind(){
      if(bridge.bound)return true;
      if(typeof window.ketch!=='function')return false;
      try{
        var pageLang=${language};
        if(pageLang){
          window.ketch('setLanguage',pageLang);
          window.ketch('on','willShowExperience',function(experience,next){
            if(experience&&next){experience.language=pageLang;next(experience);}
          });
        }
        window.ketch('getConsent',function(consent){
          if(consent&&consent.purposes)applyKetchConsent(consent);
        });
        window.ketch('on','consent',applyKetchConsent);
        bridge.bound=true;
        return true;
      }catch(error){
        bridge.bound=false;
        return false;
      }
    }

    if(!bind()){
      var attempts=0;
      var timer=window.setInterval(function(){
        attempts+=1;
        if(bind()||attempts>=200)window.clearInterval(timer);
      },50);
    }
  })();`
}
