(function(){
  'use strict';

  var STORAGE_COOKIE = 'mlp_cookie_ok';
  var STORAGE_NL     = 'mlp_nl_dismissed_at';
  var NL_DISMISS_MS  = 30 * 24 * 60 * 60 * 1000; // 30 giorni
  var NL_DELAY_MS    = 12000;                    // 12 secondi
  var NL_SCROLL_PCT  = 0.4;                      // 40% scroll

  // Path relativo a privacy.html (dalla root o da /projects/)
  var inProjects = /\/projects\//.test(location.pathname);
  var PRIVACY_HREF = inProjects ? '../privacy.html' : 'privacy.html';

  // ====== COOKIE BANNER ======
  function buildCookieBanner(){
    if(localStorage.getItem(STORAGE_COOKIE) === '1') return null;
    var el = document.createElement('div');
    el.className = 'mlp-cookie';
    el.setAttribute('role','dialog');
    el.setAttribute('aria-label','Informativa cookie');
    el.innerHTML =
      '<p>Usiamo solo cookie tecnici essenziali per il funzionamento del sito. Niente tracking, niente profilazione. Per saperne di più leggi la <a href="'+PRIVACY_HREF+'">Privacy Policy</a>.</p>'+
      '<button type="button">OK</button>';
    el.querySelector('button').addEventListener('click', function(){
      localStorage.setItem(STORAGE_COOKIE, '1');
      el.classList.remove('is-on');
      setTimeout(function(){ el.remove(); maybeShowNewsletter(); }, 450);
    });
    document.body.appendChild(el);
    requestAnimationFrame(function(){ el.classList.add('is-on'); });
    return el;
  }

  // ====== NEWSLETTER MODAL ======
  var nlTimer = null;
  var nlShown = false;

  function shouldShowNewsletter(){
    if(nlShown) return false;
    var raw = localStorage.getItem(STORAGE_NL);
    if(!raw) return true;
    var ts = parseInt(raw, 10);
    if(isNaN(ts)) return true;
    return (Date.now() - ts) > NL_DISMISS_MS;
  }

  function buildNewsletterModal(){
    if(document.querySelector('.mlp-nl')) return;
    var el = document.createElement('div');
    el.className = 'mlp-nl';
    el.setAttribute('role','dialog');
    el.setAttribute('aria-modal','true');
    el.setAttribute('aria-label','Iscrizione alla newsletter');
    el.innerHTML =
      '<div class="mlp-nl-card">'+
        '<button type="button" class="mlp-nl-close" aria-label="Chiudi">&times;</button>'+
        '<div class="mlp-nl-kicker">— Newsletter</div>'+
        '<h3 class="mlp-nl-title">Parliamoci<span class="italic">,</span><br/>quando ne vale la pena.</h3>'+
        '<p class="mlp-nl-text">Niente cadenza, niente riempitivi. Scriviamo solo quando c\u2019\u00e8 qualcosa che vale: un progetto, una lettura, un\u2019idea che ha preso forma. Se non abbiamo nulla di interessante da dire, stiamo zitti.</p>'+
        '<form class="mlp-nl-form" action="https://formsubmit.co/info@mlpstudiocreativo.com" method="POST" novalidate>'+
          '<input type="hidden" name="_subject" value="Nuova iscrizione newsletter \u2014 MLP Studio Creativo" />'+
          '<input type="hidden" name="_template" value="table" />'+
          '<input type="hidden" name="_captcha" value="false" />'+
          '<input type="hidden" name="origine" value="Newsletter popup" />'+
          '<input type="text" name="_honey" class="mlp-nl-hp" tabindex="-1" aria-hidden="true" autocomplete="off" />'+
          '<div class="mlp-nl-field">'+
            '<label for="mlp-nl-email">Email <span aria-hidden="true">*</span></label>'+
            '<input id="mlp-nl-email" type="email" name="email" required autocomplete="email" />'+
          '</div>'+
          '<label class="mlp-nl-consent">'+
            '<input type="checkbox" name="privacy" required />'+
            '<span>Accetto la <a href="'+PRIVACY_HREF+'" target="_blank" rel="noopener">Privacy Policy</a> e il trattamento dei dati ai sensi del GDPR.</span>'+
          '</label>'+
          '<button type="submit">Iscrivimi</button>'+
          '<div class="mlp-nl-foot">Puoi cancellarti quando vuoi con un click.</div>'+
        '</form>'+
        '<div class="mlp-nl-success">'+
          '<h4>Siamo in contatto.</h4>'+
          '<p>Grazie. Ti scriviamo solo quando c\u2019\u00e8 davvero qualcosa che vale.</p>'+
        '</div>'+
      '</div>';
    document.body.appendChild(el);

    function close(persist){
      if(persist){ localStorage.setItem(STORAGE_NL, String(Date.now())); }
      el.classList.remove('is-on');
      setTimeout(function(){ el.remove(); document.body.style.overflow=''; }, 500);
    }

    el.querySelector('.mlp-nl-close').addEventListener('click', function(){ close(true); });
    el.addEventListener('click', function(e){ if(e.target === el){ close(true); } });
    document.addEventListener('keydown', function escHandler(e){
      if(e.key === 'Escape'){ close(true); document.removeEventListener('keydown', escHandler); }
    });

    var form = el.querySelector('form');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!form.checkValidity()){ form.reportValidity(); return; }
      var btn = form.querySelector('button[type="submit"]');
      var original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Invio in corso...';
      var fd = new FormData(form);
      fetch('https://formsubmit.co/ajax/info@mlpstudiocreativo.com', {
        method:'POST',
        headers:{ 'Accept':'application/json' },
        body: fd
      }).then(function(r){ return r.json(); }).then(function(data){
        if(data.success === 'true' || data.success === true){
          localStorage.setItem(STORAGE_NL, String(Date.now()));
          el.classList.add('is-sent');
          setTimeout(function(){ close(false); }, 2800);
        } else {
          throw new Error(data.message || 'Errore');
        }
      }).catch(function(){
        btn.disabled = false;
        btn.textContent = original;
        alert('Non siamo riusciti a iscriverti. Riprova o scrivici a info@mlpstudiocreativo.com');
      });
    });

    requestAnimationFrame(function(){
      el.classList.add('is-on');
      document.body.style.overflow = 'hidden';
      var emailInput = el.querySelector('input[type="email"]');
      if(emailInput){ setTimeout(function(){ emailInput.focus(); }, 650); }
    });

    nlShown = true;
  }

  function maybeShowNewsletter(){
    if(!shouldShowNewsletter()) return;
    if(localStorage.getItem(STORAGE_COOKIE) !== '1') return; // aspetta che l'utente gestisca i cookie prima
    buildNewsletterModal();
  }

  function armNewsletterTriggers(){
    if(!shouldShowNewsletter()) return;
    nlTimer = setTimeout(maybeShowNewsletter, NL_DELAY_MS);
    window.addEventListener('scroll', function onScroll(){
      var h = document.documentElement;
      var scrolled = (h.scrollTop || document.body.scrollTop) + window.innerHeight;
      var total = h.scrollHeight;
      if(total > 0 && (scrolled / total) >= NL_SCROLL_PCT){
        window.removeEventListener('scroll', onScroll);
        maybeShowNewsletter();
      }
    }, { passive:true });
  }

  function init(){
    // Se la pagina ha l'intro cinematografica (solo index.html), aspetta che finisca
    var hasIntro = document.querySelector('.intro, .intro-curtain');
    var delay = hasIntro ? 5200 : 200;
    setTimeout(function(){
      buildCookieBanner();
      armNewsletterTriggers();
    }, delay);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
