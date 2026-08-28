export function ketchConsentBindingScript(): string {
  return `(function(){
    var bridge=window.__nb1KetchConsentBridge=window.__nb1KetchConsentBridge||{bound:false,lastConsentKey:null};
    window.__nb1Consent=window.__nb1Consent||{};
    window.__nb1ConsentResolved=window.__nb1ConsentResolved===true;

    function scrubAdvertisingAttribution(){
      var storageKey='nb1_checkout_attribution';
      try{
        var raw=window.sessionStorage&&window.sessionStorage.getItem(storageKey);
        if(!raw)return;
        var stored=JSON.parse(raw);
        if(!stored||typeof stored!=='object'||Array.isArray(stored)){
          window.sessionStorage.removeItem(storageKey);
          return;
        }
        delete stored.gclid;
        delete stored.gbraid;
        delete stored.wbraid;
        delete stored.fbclid;
        if(Object.keys(stored).length){
          window.sessionStorage.setItem(storageKey,JSON.stringify(stored));
        }else{
          window.sessionStorage.removeItem(storageKey);
        }
      }catch(error){
        try{window.sessionStorage&&window.sessionStorage.removeItem(storageKey);}catch(ignore){}
      }
    }

    function applyKetchConsent(consent){
      var purposes=consent&&consent.purposes||{};
      var analyticsConsent=purposes.analytics===true;
      var marketingConsent=purposes.targeted_advertising===true;
      var consentKey=(analyticsConsent?'1':'0')+':'+(marketingConsent?'1':'0');
      window.__nb1Consent=purposes;
      window.__nb1ConsentResolved=true;
      if(bridge.lastConsentKey===consentKey)return;
      bridge.lastConsentKey=consentKey;
      if(!marketingConsent)scrubAdvertisingAttribution();
      if(typeof window.gtag==='function'){
        window.gtag('consent','update',{
          analytics_storage:analyticsConsent?'granted':'denied',
          ad_storage:marketingConsent?'granted':'denied',
          ad_user_data:marketingConsent?'granted':'denied',
          ad_personalization:marketingConsent?'granted':'denied'
        });
      }
      window.dataLayer=window.dataLayer||[];
      window.dataLayer.push({
        event:'nb1_consent_resolved',
        analytics_consent:analyticsConsent,
        marketing_consent:marketingConsent
      });
      if(typeof window.dispatchEvent==='function'){
        window.dispatchEvent(new Event('nb1:consent-resolved'));
      }
    }

    function markKetchBannerModal(){
      var apply=function(){
        try{
          var banner=window.document&&window.document.getElementById('ketch-consent-banner');
          if(banner)banner.setAttribute('aria-modal','true');
        }catch(error){}
      };
      if(typeof window.requestAnimationFrame==='function')window.requestAnimationFrame(apply);
      else apply();
    }

    function bind(){
      if(bridge.bound)return true;
      if(typeof window.ketch!=='function')return false;
      try{
        window.ketch('getConsent',function(consent){
          if(consent&&consent.purposes)applyKetchConsent(consent);
        });
        window.ketch('on','consent',applyKetchConsent);
        window.ketch('on','hasShownExperience',markKetchBannerModal);
        markKetchBannerModal();
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
