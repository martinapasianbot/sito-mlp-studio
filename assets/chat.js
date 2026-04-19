(function(){
  'use strict';

  // URL del Cloudflare Worker che gestisce la chiamata a Gemini.
  // Da sostituire col URL effettivo dopo il deploy del Worker.
  var API_URL = 'https://mlp-ai-chat.martinapasianbot.workers.dev/';

  var GREETING = "Ciao. Sono l\u2019assistente di MLP Studio Creativo. Posso raccontarti dei nostri servizi, del nostro approccio o di come iniziare un progetto con noi. Cosa vuoi sapere?";
  var FAB_DELAY_MS = 6000; // quando compare il pulsante dopo il load (dopo l'intro)

  var fab, panel, bodyEl, inputEl, sendBtn;
  var history = []; // {role:'user'|'assistant', content:'...'}
  var isSending = false;

  function h(html){ var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

  function buildFab(){
    fab = h(
      '<button class="mlp-chat-fab" type="button" aria-label="Apri chat con assistente AI">'+
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
      '<div class="mlp-chat" role="dialog" aria-label="Assistente MLP Studio Creativo">'+
        '<div class="mlp-chat-head">'+
          '<div>'+
            '<h4>Parliamoci</h4>'+
            '<div class="sub">Assistente AI \u00b7 MLP Studio</div>'+
          '</div>'+
          '<button type="button" class="mlp-chat-close" aria-label="Chiudi">'+
            '<svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M6 18L18 6"/></svg>'+
          '</button>'+
        '</div>'+
        '<div class="mlp-chat-body" aria-live="polite"></div>'+
        '<div class="mlp-chat-input">'+
          '<textarea rows="1" placeholder="Scrivi una domanda..." aria-label="Scrivi un messaggio"></textarea>'+
          '<button type="button" class="mlp-chat-send" aria-label="Invia">'+
            '<svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"/></svg>'+
          '</button>'+
        '</div>'+
        '<div class="mlp-chat-foot">Risposte generate da AI \u00b7 Per contatti reali <a href="#contatti">vai al form</a></div>'+
      '</div>'
    );
    document.body.appendChild(panel);
    bodyEl = panel.querySelector('.mlp-chat-body');
    inputEl = panel.querySelector('textarea');
    sendBtn = panel.querySelector('.mlp-chat-send');

    panel.querySelector('.mlp-chat-close').addEventListener('click', togglePanel);
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
    fab.setAttribute('aria-label', isOpen ? 'Chiudi chat' : 'Apri chat con assistente AI');
    if(isOpen){
      if(bodyEl.childElementCount === 0){ addBotMessage(GREETING); }
      setTimeout(function(){ inputEl.focus(); }, 300);
    }
  }

  function addMessage(role, text){
    var el = document.createElement('div');
    el.className = 'mlp-msg ' + (role === 'user' ? 'user' : 'bot');
    el.textContent = text;
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return el;
  }
  function addBotMessage(text){ addMessage('bot', text); }
  function addUserMessage(text){ addMessage('user', text); }

  function showTyping(){
    var el = h('<div class="mlp-typing"><span></span><span></span><span></span></div>');
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return el;
  }

  function sendMessage(){
    if(isSending) return;
    var text = inputEl.value.trim();
    if(!text) return;
    addUserMessage(text);
    history.push({ role:'user', content: text });
    inputEl.value = '';
    inputEl.style.height = 'auto';
    isSending = true;
    sendBtn.disabled = true;
    var typing = showTyping();

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-20) })
    }).then(function(r){ return r.json(); }).then(function(data){
      typing.remove();
      if(data && data.reply){
        history.push({ role:'assistant', content: data.reply });
        addBotMessage(data.reply);
      } else {
        addBotMessage('Scusa, al momento non riesco a rispondere. Puoi scriverci direttamente a info@mlpstudiocreativo.com.');
      }
    }).catch(function(){
      typing.remove();
      addBotMessage('Qualcosa non ha funzionato. Se hai fretta, puoi scriverci a info@mlpstudiocreativo.com o usare il form contatti.');
    }).finally(function(){
      isSending = false;
      sendBtn.disabled = false;
      inputEl.focus();
    });
  }

  function init(){
    var hasIntro = document.querySelector('.intro, .intro-curtain');
    var delay = hasIntro ? FAB_DELAY_MS : 800;
    setTimeout(function(){
      buildFab();
      buildPanel();
    }, delay);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
