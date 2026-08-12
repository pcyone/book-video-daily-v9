(function () {
  function fitIdentityTitle(selector) {
    var el = document.querySelector(selector || ".identity-title");
    if (!el) return null;

    var size = 104;
    if (window.__hyperframes && window.__hyperframes.fitTextFontSize) {
      var fit = window.__hyperframes.fitTextFontSize(el.textContent, {
        fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
        fontWeight: 900,
        maxWidth: 948,
        baseFontSize: 104,
        minFontSize: 16,
        step: 1,
      });
      size = fit.fontSize;
    } else {
      size = Math.min(104, Math.floor(948 / Math.max(1, el.textContent.length)));
    }

    el.style.fontSize = size + "px";
    el.dataset.fittedFontSize = String(size);
    return size;
  }

  window.BookVideoDailyV9 = window.BookVideoDailyV9 || {};
  window.BookVideoDailyV9.fitIdentityTitle = fitIdentityTitle;
})();
