(function(){
  'use strict';

  // Chat del sito MLP Studio Creativo. Server: Cloudflare Worker "mlp-assistente" (~/Developer/mlp-assistente).
  // Si attiva sulle pagine che caricano questo file. Stile in assets/chat.css (+ regole consenso in fondo a quel file).
  var API_URL = 'https://mlp-assistente.mlpstudiocreativo.workers.dev/chat';

  var GREETING = "Ciao, sono l’assistente di MLP Studio Creativo. Posso raccontarti cosa facciamo e, se hai un progetto, fissarti una call gratuita di 30 minuti con Martina. Di cosa ti occupi?";
  var FAB_DELAY_MS = 6000;

  var fab, panel, bodyEl, inputEl, sendBtn, consentEl;
  var history = [];
  var isSending = false;
  var consenso = false;
  var cid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);

  function h(html){ var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

  function buildFab(){
    fab = h(
      '<button class="mlp-chat-fab" type="button" aria-label="Apri la chat con lo studio">'+
        '<span class="mlp-chat-pulse"></span>'+
        '<svg class="icon-chat" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12c0 4.418-4.03 8-9 8-1.264 0-2.473-.232-3.574-.653L3 20l1.39-4.17C3.51 14.74 3 13.42 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>'+
        '<svg class="icon-close" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M6 18L18 6"/></svg>'+
      '</button>'
    );
    document.body.appendChild(fab);
    fab.addEventListener('click', togglePanel);
    requestAnimationFrame(function(){ fab.classList.add('is-on'); });
  }

  function buildPanel(){
    panel = h(
      '<div class="mlp-chat" role="dialog" aria-label="Chat con MLP Studio Creativo">'+
        '<div class="mlp-chat-head">'+
          '<div>'+
            '<h4>Parliamoci</h4>'+
            '<div class="sub">Assistente · MLP Studio</div>'+
          '</div>'+
          '<button type="button" class="mlp-chat-close" aria-label="Chiudi">'+
            '<svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M6 18L18 6"/></svg>'+
          '</button>'+
        '</div>'+
        '<div class="mlp-chat-body" aria-live="polite"></div>'+
        '<div class="mlp-chat-consent">'+
          '<p>Le risposte sono scritte da un assistente con intelligenza artificiale. I dati che inserisci (nome, azienda, email e informazioni sul progetto) servono solo a ricontattarti e a organizzare la call. <a href="/privacy.html#assistente" target="_blank" rel="noopener">Informativa privacy</a></p>'+
          '<button type="button" class="mlp-chat-accept">Ho letto, iniziamo</button>'+
        '</div>'+
        '<div class="mlp-chat-input" hidden>'+
          '<textarea rows="1" placeholder="Scrivi un messaggio..." aria-label="Scrivi un messaggio" maxlength="1500"></textarea>'+
          '<button type="button" class="mlp-chat-send" aria-label="Invia">'+
            '<svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"/></svg>'+
          '</button>'+
        '</div>'+
        '<div class="mlp-chat-foot">Assistente AI · Oppure scrivici a mlpstudiocreativo@gmail.com</div>'+
      '</div>'
    );
    document.body.appendChild(panel);
    bodyEl = panel.querySelector('.mlp-chat-body');
    inputEl = panel.querySelector('textarea');
    sendBtn = panel.querySelector('.mlp-chat-send');
    consentEl = panel.querySelector('.mlp-chat-consent');

    panel.querySelector('.mlp-chat-close').addEventListener('click', togglePanel);
    panel.querySelector('.mlp-chat-accept').addEventListener('click', function(){
      consenso = true;
      consentEl.hidden = true;
      panel.querySelector('.mlp-chat-input').hidden = false;
      setTimeout(function(){ inputEl.focus(); }, 50);
    });
    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', function(e){
      if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }
    });
    inputEl.addEventListener('input', function(){
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    });
  }

  function togglePanel(){
    var isOpen = panel.classList.toggle('is-on');
    fab.classList.toggle('is-open', isOpen);
    fab.setAttribute('aria-label', isOpen ? 'Chiudi la chat' : 'Apri la chat con lo studio');
    if(isOpen && bodyEl.childElementCount === 0){ addMessage('bot', GREETING); }
    if(isOpen && consenso){ setTimeout(function(){ inputEl.focus(); }, 300); }
  }

  function addMessage(role, text){
    var el = document.createElement('div');
    el.className = 'mlp-msg ' + (role === 'user' ? 'user' : 'bot');
    el.textContent = text;
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return el;
  }

  function showTyping(){
    var el = h('<div class="mlp-typing"><span></span><span></span><span></span></div>');
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return el;
  }

  function sendMessage(){
    if(isSending || !consenso) return;
    var text = inputEl.value.trim();
    if(!text) return;
    addMessage('user', text);
    history.push({ role:'user', content: text });
    inputEl.value = '';
    inputEl.style.height = 'auto';
    isSending = true;
    sendBtn.disabled = true;
    var typing = showTyping();

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-30), cid: cid, consenso: true })
    }).then(function(r){ return r.json(); }).then(function(data){
      typing.remove();
      if(data && data.reply){
        history.push({ role:'assistant', content: data.reply });
        addMessage('bot', data.reply);
      } else {
        history.pop();
        addMessage('bot', 'Scusa, al momento non riesco a rispondere. Puoi scriverci a mlpstudiocreativo@gmail.com.');
      }
    }).catch(function(){
      typing.remove();
      history.pop();
      addMessage('bot', 'Il messaggio non è partito. Riprova tra poco, oppure scrivici a mlpstudiocreativo@gmail.com.');
    }).finally(function(){
      isSending = false;
      sendBtn.disabled = false;
      inputEl.focus();
    });
  }

  function init(){
    var hasIntro = document.querySelector('.intro, .intro-curtain');
    setTimeout(function(){ buildFab(); buildPanel(); }, hasIntro ? FAB_DELAY_MS : 800);
  }

  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
