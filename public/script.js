var myWin;
$(function() {
  $('head').append('<link rel="stylesheet" href="/CustomWindow.scss">');
  myWin = new BrowserWindow();
});

class CustomWindow {
  static template = fetch("/CustomWindow.html").then(d => d.text());
  
  constructor(width=0, height=0, {left=0, top=0, name="", icon="", groupWith="CustomWindow"} = {}) {
    this.width = width;
    this.height = height;
    this.init = (async () => {
      this.win = $(await CustomWindow.template).appendTo('body');
      this.fullscreen = width && height;
      this.width = width ? width : 500;
      this.height = height ? height : 500;
      // TODO: automaticly determine proper position based on screen & window size
      this.left = left; this.top = top;
      this.toggleSize();
      var appinfo = this.win.find('.appinfo');
      this.makeDragable(this.win[0], appinfo[0]);
      this.name = $().text.bind(appinfo);
      this.name(name);
      
      // Register functionalities
      this.win.find('button[title="Close"]').click(this.close.bind(this));
      this.win.find('.fa-window-restore').click(this.toggleSize.bind(this));
    })();
  }
  
  minimise() {
    
  }
  
  toggleSize() {
    this.fullscreen = !this.fullscreen;
    this.win.css({
      width: (this.fullscreen ? '100%' : this.width),
      height: (this.fullscreen ? '100%' : this.height),
      left: (this.fullscreen ? '0' : this.left),
      top: (this.fullscreen ? '0' : this.top),
    });
  }
  
  close() {
    this.win.css('animation-name', 'fadeout');
    window.setTimeout($().remove.bind(this.win), 300);
  }

  topbarVisible(visible) {
    if (visible) this.win.find('.topbar').show();
    else this.win.find('.topbar').hide();
  }

  makeDragable(elmnt, handle=undefined) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (handle != undefined) {
      // if present, the header is where you move the DIV from:
      handle.onmousedown = dragMouseDown.bind(this);
    } else {
      // otherwise, move the DIV from anywhere inside the DIV:
      elmnt.onmousedown = dragMouseDown.bind(this);
    }

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement.bind(this);
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag.bind(this);
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      this.left -= pos1; this.top -= pos2;
      console.debug("DRAGGING:", pos1, pos2, pos3, pos4)
      // set the element's new position:
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
      
      if (this.fullscreen) this.toggleSize();
      else if (pos3 <= 0) { this.toggleSize(); this.win.css('width', '50%'); closeDragElement() }
      else if (pos4 <= 0) { this.toggleSize(); closeDragElement() }
    }

    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
}

class BrowserWindow extends CustomWindow {
  static template = fetch("/BrowserWindow.html").then(d => d.text())
  static stylesheet;
  static prefs = JSON.parse(localStorage.prefs || (localStorage.prefs = "{}"));
  
  constructor(width=0, height=0) {
    var parent = super(width, height);
    if (!localStorage.bookmarks) localStorage.bookmarks = [];
    if (!BrowserWindow.stylesheet) BrowserWindow.stylesheet = !!$('head').append('<link rel="stylesheet" href="/BrowserWindow.scss">');
    this.init = (async () => {
      await parent.init;
      $(await BrowserWindow.template).appendTo(this.win);
      this.win.addClass('BrowserWindow');
      for (var i=0; i<3; i++) this.newTab("https://www.wikipedia.org");
      //this.tabs = [new this.#Tab(this)];
      
      // Register functionalities
      this.win.find('.searchbox').on('keydown', (ev) => {
        if (ev.key === 'Enter') {
          var fixedURL = ((BrowserWindow.isURL(ev.target.value)) ? '' : 'google.com/search?q=') + ev.target.value
          this.navigateTo('https://proxy.funblaster22.repl.co/?url=' + fixedURL);
          ev.target.value = fixedURL;
        }
      });
      this.win.find('.fa-star').click(this.addBookmark.bind(this));
    })();
  }

  static isURL(str) {
    return !!str.match(/^(https?:\/\/)|^(\w+\.)+(com|net|co|gov|org|gg|me|info|io)/i);
  }

  addBookmark() {
    var bookmark = $(`<button>${"Bookmark"}</button>`).appendTo('.bookmarks');
    var goto = this.win.find('iframe:visible')[0].src;
    bookmark.click(this.navigateTo.bind(this, goto));
    localStorage.bookmarks.push(goto);
  }
  
  showBookmarks() {
    
  }
  
  restoreTabs() {
    
  }

  navigateTo(url) {
    this.win.find('iframe:visible')[0].src = url
  }
  
  // TODO: make Tab class?
  newTab(url="about:blank") {
    var appinfo = this.win.find('.appinfo');
    var tab = $(`<div class="tab selected">Tab<button class="closeTab fas fa-times"></button></div>`).appendTo(appinfo);
    var iframe = $(`<iframe src=${url}></iframe>`).appendTo(this.win);
    tab.click(focus.bind(this));
    tab.find('button').click(close.bind(this));
    tab.click();
    tab.animate({maxWidth: 200});
    
    function focus(e) {
      e.stopPropagation();
      var $target = $(e.target);
      console.debug(e.target);
      this.win.find('.selected').removeClass('selected');
      $target.addClass('selected');
      
      this.win.find('.searchbox').val(url)
      
      this.win.find('iframe').hide();
      iframe.show();
    }
    
    function close(e) {
      if (tab.hasClass('selected')) {
        try { (tab[0].nextElementSibling || tab[0].previousElementSibling).click() }
        catch (err) { this.close() }
      }
      tab.animate({maxWidth: 0, paddingRight: 0}, 200, tab.remove.bind(tab));
      iframe.remove();
    }
  }

  /*#Tab = class Tab {
    constructor(parent, url="https://www.google.com") {
      
      
    }
  }*/
}

class PopupWindow extends CustomWindow {
  constructor(url="about:blank", width=300, height=300) {
    super(width, height).init.then(() => {
      this.name("Popup Window");
      this.win.append(`<div style="background-color: var(--bg-color);">${url}</div><iframe src="${url}"></iframe>`)
    });
  }
}