const Applet = imports.ui.applet;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const Settings = imports.ui.settings;
const Lang = imports.lang;

function MyApplet(metadata, orientation, panelHeight, instanceId) {
  this._init(metadata, orientation, panelHeight, instanceId);
}

MyApplet.prototype = {
  __proto__: Applet.TextApplet.prototype,

  _init: function(metadata, orientation, panelHeight, instanceId) {
    Applet.TextApplet.prototype._init.call(this, orientation, panelHeight, instanceId);
    this.metadata = metadata;
    this.actor.style_class = 'sysmon-text-label';
    // Monospace + padded fields = constant pixel width, so the readout
    // never resizes and pinned taskbar icons stay put.
    try {
      let kids = this.actor.get_children();
      let lbl = (kids && kids.length) ? kids[0].get_child() : null;
      if (!lbl) lbl = (kids && kids.length) ? kids[0] : null;
      if (lbl && lbl.set_style) lbl.set_style('font-family: monospace;');
    } catch(e) {}
    this._prevNet = null;
    this._prevCpu = null;
    this._prevT = 0;
    this._iface = this._defaultIface();
    this._loopTid = 0;

    // --- configurable via right-click -> Configure ---
    this.interval = 500;
    this.showCpu = true;
    this.showMemory = true;
    this.showNetwork = true;
    this.popupNetwork = true;
    this.popupSystem = true;
    this.popupCores = true;
    this.settings = new Settings.AppletSettings(this, metadata.uuid, instanceId);
    this.settings.bindProperty(Settings.BindingDirection.IN, 'interval', 'interval', this._applyInterval, null);
    this.settings.bindProperty(Settings.BindingDirection.IN, 'show-cpu', 'showCpu', this._onToggle, null);
    this.settings.bindProperty(Settings.BindingDirection.IN, 'show-memory', 'showMemory', this._onToggle, null);
    this.settings.bindProperty(Settings.BindingDirection.IN, 'show-network', 'showNetwork', this._onToggle, null);
    this.settings.bindProperty(Settings.BindingDirection.IN, 'popup-network', 'popupNetwork', this._applyGroups, null);
    this.settings.bindProperty(Settings.BindingDirection.IN, 'popup-system', 'popupSystem', this._applyGroups, null);
    this.settings.bindProperty(Settings.BindingDirection.IN, 'popup-cores', 'popupCores', this._applyGroups, null);

    this.set_applet_label('…');

    this._buildMenu(orientation);

    // --- hover to open, like a tooltip popup ---
    this._openTid = 0;
    this._closeTid = 0;
    this.actor.connect('enter-event', Lang.bind(this, this._onEnter));
    this.actor.connect('leave-event', Lang.bind(this, this._onLeave));
    this.menu.actor.connect('enter-event', Lang.bind(this, this._onEnter));
    this.menu.actor.connect('leave-event', Lang.bind(this, this._onLeave));

    this._tick();       // instant first paint
    this._startLoop();  // then realtime repeat
  },

  // ---------------------------------------------------------------- settings
  _applyInterval: function() {
    // restart the realtime loop with the configured cadence
    if (this._loopTid) { Mainloop.source_remove(this._loopTid); this._loopTid = 0; }
    this._startLoop();
  },

  _onToggle: function() {
    // taskbar text composition changed settings — repaint instantly
    this._prevT = 0; // force a fresh CPU sample so no bogus -values appear
    this._tick();
  },

  _applyGroups: function() {
    if (!this._groupWidgets) return;
    for (let w of (this._groupWidgets.network || []))
      if (w && w.set_visible) w.set_visible(this.popupNetwork);
    let sys = this._groupWidgets.system || [];
    for (let i = 0; i < sys.length; i++)
      if (sys[i].set_visible) sys[i].set_visible(this.popupSystem && !(sys[i]._isCoreRow && !this.popupCores));
  },

  // ---------------------------------------------------------------- helpers
  _read: function(path) {
    try { return String(GLib.file_get_contents(path)[1]); }
    catch(e) { return ''; }
  },

  _defaultIface: function() {
    try {
      let lines = this._read('/proc/net/route').split('\n');
      for (let l of lines) {
        let f = l.trim().split(/\s+/);
        if (f[1] === '00000000' && f[0] !== 'Iface') return f[0];
      }
    } catch(e) {}
    return 'enp2s0';
  },

  _fmtRate: function(bps) {
    let s;
    if (bps < 1024) s = Math.round(bps) + 'B';
    else if (bps < 1048576) s = (bps / 1024).toFixed(1).replace(/\.0$/, '') + 'K';
    else s = (bps / 1048576).toFixed(1).replace(/\.0$/, '') + 'M';
    // Fixed width: pad to 6 chars so layout never shifts.
    while (s.length < 6) s = ' ' + s;
    return s;
  },

  _fmtMem: function(kb) {
    let s;
    if (kb < 1048576) s = Math.round(kb / 1024) + 'M';
    else s = (kb / 1048576).toFixed(1).replace(/\.0$/, '') + 'G';
    while (s.length < 5) s = ' ' + s;
    return s;
  },

  _fmtTotal: function(b) {
    let s;
    if (b < 1024) s = Math.round(b) + ' B';
    else if (b < 1048576) s = (b / 1024).toFixed(2) + ' KB';
    else if (b < 1073741824) s = (b / 1048576).toFixed(2) + ' MB';
    else s = (b / 1073741824).toFixed(2) + ' GB';
    return s;
  },

  _ifaceType: function(name) {
    if (name === 'lo') return 'Loopback';
    if (name.indexOf('wl') === 0) return 'Wi-Fi';
    if (name.indexOf('ww') === 0) return 'Cellular';
    return 'Ethernet';
  },

  // ------------------------------------------------------- netspeed-style popup
  _row: function(key) {
    let box = new St.BoxLayout({
      vertical: false,
      style: 'padding: 2px 16px; spacing: 0px;'
    });
    let k = new St.Label({
      text: key,
      style: 'color: #b8bcbe; font-size: 12.5px; min-width: 150px;'
    });
    let v = new St.Label({
      text: '—',
      style: 'color: #f2f2f2; font-size: 12.5px; font-family: monospace;'
    });
    box.add(k);
    box.add(v);
    return { box: box, val: v };
  },

  _headerRow: function(text) {
    let l = new St.Label({
      text: text,
      style: 'color: #e8eaed; font-size: 13px; font-weight: bold; padding: 8px 16px 4px 16px;'
    });
    return l;
  },

  _separator: function() {
    return new St.BoxLayout({ style: 'background-color: rgba(255,255,255,0.10); height: 1px; margin: 6px 12px;' });
  },

  _buildMenu: function(orientation) {
    this._menuManager = new PopupMenu.PopupMenuManager(this);
    this.menu = new Applet.AppletPopupMenu(this, orientation);
    this._menuManager.addMenu(this.menu);

    let root = new St.BoxLayout({
      vertical: true,
      style: 'background-color: rgba(24,26,27,0.98); border-radius: 10px; padding: 4px 0px 10px 0px; box-shadow: 0 4px 14px rgba(0,0,0,0.55);'
    });

    root.add(this._headerRow('Interface: ' + this._iface + ' (' + this._ifaceType(this._iface) + ')'));
    root.add(this._separator());

    this._popup = {};
    this._groupWidgets = { network: [], system: [] };
    this._groupWidgets.network.push(root.get_children()[(root.get_children().length - 2)]);
    this._groupWidgets.network.push(root.get_children()[(root.get_children().length - 1)]);
    let rows = [
      ['Download speed',  'down'],
      ['Upload speed',    'up'],
      ['Total downloaded','totDown'],
      ['Total uploaded',  'totUp'],
      ['Max speed',       'max'],
      ['MAC address',     'mac'],
      ['IP address',      'ip'],
      ['Gateway',         'gw'],
    ];
    for (let i = 0; i < rows.length; i++) {
      let r = this._row(rows[i][0]);
      this._popup[rows[i][1]] = r.val;
      root.add(r.box);
      this._groupWidgets.network.push(r.box);
    }

    root.add(this._separator());
    root.add(this._headerRow('System'));
    this._groupWidgets.system.push(root.get_children()[(root.get_children().length - 2)]);
    this._groupWidgets.system.push(root.get_children()[(root.get_children().length - 1)]);

    let sysRows = [
      ['CPU usage',  'cpu'],
      ['Memory',     'mem'],
    ];
    for (let i = 0; i < sysRows.length; i++) {
      let r = this._row(sysRows[i][0]);
      this._popup[sysRows[i][1]] = r.val;
      root.add(r.box);
      this._groupWidgets.system.push(r.box);
    }

    // per-core rows (up to 8 cores are shown)
    let coreCount = this._coreCount();
    this._popup.cores = [];
    for (let i = 0; i < coreCount; i++) {
      let r = this._row('Core ' + i);
      this._popup.cores.push(r.val);
      root.add(r.box);
      r.box._isCoreRow = true;
      this._groupWidgets.system.push(r.box);
    }

    this._applyGroups();

    let item = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      hover: false
    });
    item.addActor(root, { expand: true, span: -1, align: St.Align.START });
    item.actor.set_style('padding: 0px; background-color: transparent;');
    this.menu.addMenuItem(item);

    // static rows: max speed + MAC
    let speedFile = this._read('/sys/class/net/' + this._iface + '/speed');
    let maxSpeed = (speedFile && parseInt(speedFile, 10) > 0) ? parseInt(speedFile, 10) + ' Mb/s' : '—';
    this._popup.max.text = maxSpeed;
    let mac = (this._read('/sys/class/net/' + this._iface + '/address') || '').trim();
    this._popup.mac.text = mac || '—';
    let ipGw = this._ipAndGateway();
    this._popup.ip.text = ipGw.ip;
    this._popup.gw.text = ipGw.gw;
  },

  // parse the cpuN lines count from /proc/stat
  _coreCount: function() {
    let n = 0;
    for (let l of this._read('/proc/stat').split('\n')) {
      if (l.indexOf('cpu') === 0 && l[3] >= '0' && l[3] <= '9') n++;
    }
    return Math.min(n, 8);
  },

  // local IPv4 of the interface + default gateway
  _ipAndGateway: function() {
    let ip = '—', gw = '—';
    try {
      let [res, out] = GLib.spawn_command_line_sync('ip -o -4 addr show dev ' + this._iface);
      if (res) {
        let m = String(out).match(/inet\s+([0-9.]+)/);
        if (m) ip = m[1];
      }
    } catch(e) {}
    try {
      for (let l of this._read('/proc/net/route').split('\n')) {
        let f = l.trim().split(/\s+/);
        if (f[0] === this._iface && f[1] === '00000000') {
          // gateway hex (little endian) -> dotted quad
          let hex = parseInt(f[2], 16);
          gw = (hex & 0xff) + '.' + ((hex >> 8) & 0xff) + '.' + ((hex >> 16) & 0xff) + '.' + ((hex >>> 24) & 0xff);
          break;
        }
      }
    } catch(e) {}
    return { ip: ip, gw: gw };
  },

  _refreshPopup: function(downR, upR, totDown, totUp, cpuPct, memUsed, memTotal) {
    if (!this._popup) return;
    this._popup.down.text = this._fmtTotal(downR).replace(/(B|KB|MB|GB)/, '$1/s');
    this._popup.up.text = this._fmtTotal(upR).replace(/(B|KB|MB|GB)/, '$1/s');
    this._popup.totDown.text = this._fmtTotal(totDown);
    this._popup.totUp.text = this._fmtTotal(totUp);
    this._popup.cpu.text = (cpuPct === null) ? ' —' : ' ' + cpuPct + '%';
    this._popup.mem.text = ' ' + this._fmtMem(memUsed).trim() + ' / ' + this._fmtMem(memTotal).trim();
    // per-core bump bars
    if (this._popup.cores && this._coresLast) {
      for (let i = 0; i < this._popup.cores.length; i++) {
        this._popup.cores[i].text = ' ' + this._coreBar(this._coresLast[i]);
      }
    }
  },

  // 10-char text bar, monospace-friendly: ███░░░░░░ 34%
  _coreBar: function(pct) {
    if (pct === undefined || pct === null) return '░░░░░░░░░ —';
    let filled = Math.max(0, Math.min(10, Math.round(pct / 10)));
    let bar = '';
    for (let i = 0; i < 10; i++) bar += (i < filled) ? '█' : '░';
    return bar + ' ' + pct + '%';
  },

  // ------------------------------------------------------------------ hover
  _onEnter: function() {
    if (this._closeTid) { Mainloop.source_remove(this._closeTid); this._closeTid = 0; }
    if (this.menu.isOpen || this._openTid) return false;
    this._openTid = Mainloop.timeout_add(200, Lang.bind(this, function() {
      this._openTid = 0;
      if (!this.menu.isOpen) this.menu.open();
      return false;
    }));
    return false;
  },

  _onLeave: function() {
    if (this._openTid) { Mainloop.source_remove(this._openTid); this._openTid = 0; }
    if (!this.menu.isOpen || this._closeTid) return false;
    this._closeTid = Mainloop.timeout_add(300, Lang.bind(this, function() {
      this._closeTid = 0;
      if (this.menu.isOpen) this.menu.close();
      return false;
    }));
    return false;
  },

  on_applet_clicked: function() {
    if (!this.menu.isOpen) this.menu.open();
    else this.menu.close();
  },

  on_applet_removed_from_panel: function() {
    if (this._openTid) Mainloop.source_remove(this._openTid);
    if (this._closeTid) Mainloop.source_remove(this._closeTid);
    if (this._loopTid) Mainloop.source_remove(this._loopTid);
    if (this.settings) try { this.settings.finalize(); } catch(e) {}
    if (this.menu) this.menu.destroy();
  },

  // ------------------------------------------------------------------- core
  _tick: function() {
    try {
      let now = Date.now() / 1000;
      let dt = this._prevT > 0 ? (now - this._prevT) : 1;
      this._prevT = now;

      // --- CPU ---
      let cpuPct = null;
      let cpuLines = this._read('/proc/stat').split('\n');
      let cpuLine = cpuLines[0];
      if (cpuLine.indexOf('cpu ') === 0) {
        let f = cpuLine.replace('cpu', '').trim().split(/\s+/).map(Number);
        // idle = idle + iowait; total = all jiffies
        let idle = f[3] + (f.length > 4 ? f[4] : 0);
        let total = f.reduce(function(a, b) { return a + b; }, 0);
        if (this._prevCpu) {
          let dTotal = total - this._prevCpu.total;
          let dIdle = idle - this._prevCpu.idle;
          if (dTotal > 0) cpuPct = Math.round(100 * (dTotal - dIdle) / dTotal);
        }
        this._prevCpu = { idle: idle, total: total };
      }
      // per-core jiffies
      this._coresPct = null;
      let nowCores = [];
      for (let l of cpuLines) {
        if (l.indexOf('cpu') === 0 && l[3] >= '0' && l[3] <= '9')
          nowCores.push(l.replace('cpu', '').trim().split(/\s+/).map(Number));
      }
      if (this._prevCores && this._prevCores.length === nowCores.length) {
        let out = [];
        for (let i = 0; i < nowCores.length; i++) {
          let t = nowCores[i], p = this._prevCores[i];
          let tot = t.reduce(function(a, b) { return a + b; }, 0) - p.reduce(function(a, b) { return a + b; }, 0);
          let idl = (t[3] + (t.length > 4 ? t[4] : 0)) - (p[3] + (p.length > 4 ? p[4] : 0));
          out.push(tot > 0 ? Math.round(100 * (tot - idl) / tot) : 0);
        }
        this._coresPct = out;
      }
      this._prevCores = nowCores;

      // --- MEM ---
      let memTotal = 0, memAvail = 0;
      for (let l of this._read('/proc/meminfo').split('\n')) {
        if (l.indexOf('MemTotal:') === 0) memTotal = parseInt(l.replace(/[^0-9]/g, ''), 10);
        else if (l.indexOf('MemAvailable:') === 0) memAvail = parseInt(l.replace(/[^0-9]/g, ''), 10);
      }
      let memUsed = memTotal - memAvail;

      // --- NET ---
      let down = 0, up = 0;
      for (let l of this._read('/proc/net/dev').split('\n')) {
        let m = l.trim().match(/^([^:]+):\s*(.+)$/);
        if (m && m[1] === this._iface) {
          let f = m[2].trim().split(/\s+/).map(Number);
          down = f[0]; up = f[8];
        }
      }
      let downR = 0, upR = 0;
      if (this._prevNet) {
        downR = Math.max(0, (down - this._prevNet.down) / dt);
        upR = Math.max(0, (up - this._prevNet.up) / dt);
      }
      this._prevNet = { down: down, up: up };

      let cpuStr = (cpuPct === null) ? ' --%' : (cpuPct + '%');
      while (cpuStr.length < 4) cpuStr = ' ' + cpuStr;

      let label = '';
      if (this.showCpu) label += 'CPU ' + cpuStr;
      if (this.showMemory) label += (label ? ' ' : '') + 'MEM ' + this._fmtMem(memUsed);
      if (this.showNetwork) label += (label ? ' ' : '') + ('▼' + this._fmtRate(downR) + ' ▲' + this._fmtRate(upR));
      if (!label) label = '👷 ' + Math.round(memTotal / 1024) + 'M host';
      // Don't rescale the panel source actor while a popup is open:
      // panel relayout would close the menu mid-hover.
      if (!(this.menu && this.menu.isOpen)) this.set_applet_label(label);

      // keep the netspeed-style popup live while it's open
      if (this.menu && this.menu.isOpen && this._popup) {
        this._coresLast = this._coresPct;
        this._refreshPopup(downR, upR, down, up, cpuPct, memUsed, memTotal);
      } else {
        this._coresLast = null;
      }
    } catch(e) {}
    // Realtime: 4 updates/sec. timeout_add repeats while we return true.
    return true;
  },

  _startLoop: function() {
    this._loopTid = Mainloop.timeout_add(this.interval > 0 ? this.interval : 500, () => this._tick());
  }
};

function main(metadata, orientation, panelHeight, instanceId) {
  return new MyApplet(metadata, orientation, panelHeight, instanceId);
}
