// HyperMD, copyright (c) by laobubu
// Distributed under an MIT license: http://laobubu.net/hypermd/LICENSE
//
// Provides HyperMD **base functions**
//

(function (mod) {
  var CODEMIRROR_ROOT = window.CODEMIRROR_ROOT || "codemirror/"
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    module.exports = mod(
      require(CODEMIRROR_ROOT + "lib/codemirror")
    )
  else if (typeof define == "function" && define.amd) // AMD
    define([
      CODEMIRROR_ROOT + "lib/codemirror",
    ], mod)
  else // Plain browser env
    window.HyperMD = mod(window.CodeMirror)
})(function (CodeMirror) {
  var HyperMD = {
    /**
    * CodeMirror's `getLineTokens` might merge adjacent chars with same styles,
    * but this one won't.
    *
    * This one will consume more memory.
    *
    * @param {CodeMirror.LineHandle} line
    * @returns {string[]} every char's style
    */
    getEveryCharToken: function (line) {
      var ans = new Array(line.text.length)
      var ss = line.styles
      var i = 0

      if (ss) {
        // CodeMirror already parsed this line. Use cache
        for (var j = 1; j < ss.length; j += 2) {
          var i_to = ss[j], s = ss[j + 1]
          while (i < i_to) ans[i++] = s
        }
      } else {
        // Emmm... slow method
        var cm = line.parent.cm || line.parent.parent.cm || line.parent.parent.parent.cm
        ss = cm.getLineTokens(line.lineNo())
        for (var j = 0; j < ss.length; j++) {
          var i_to = ss[j].end, s = ss[j].type
          while (i < i_to) ans[i++] = s
        }
      }
      return ans
    },

    /**
     * After load a new mode (programming language),
     * call this to update all Markdown code-fences' apperance
     *
     * @param {CodeMirror.Editor} cm
     * @param {RegExp} [testRE] (optional) a regexp that matches code-fence's beginning line
     */
    reHighlight: function (cm, testRE) {
      if (!testRE) testRE = /^```\s*\S/
      cm.eachLine(function (line) {
        if (testRE.test(line.text)) {
          // found a beginning of code block
          // make a "change" event on this line, and re-highlighting
          var lineNo = line.lineNo()
          var lineLen = line.text.length
          cm.replaceRange(
            line.text.charAt(lineLen - 1),
            { line: lineNo, ch: lineLen - 1 },
            { line: lineNo, ch: lineLen }
          )
        }
      })
    },

    /**
     * make a debounced function
     *
     * @param {function} fn
     * @param {number} delay in ms
     */
    debounce: function (fn, delay) {
      var deferTask = 0
      var notClearBefore = 0
      var run = function () { fn(); deferTask = 0; }
      var ans = function () {
        var nowTime = +new Date()
        if (deferTask) {
          if (nowTime < notClearBefore) return
          else clearTimeout(deferTask)
        }
        deferTask = setTimeout(run, delay)
        notClearBefore = nowTime + 100  // allow 100ms error
      }
      ans.stop = function() {
        if (!deferTask) return
        clearTimeout(deferTask)
        deferTask = 0
      }

      return ans
    },

    /**
     * clean line measure caches (if needed) 
     * and re-position cursor
     * 
     * partially extracted from codemirror.js : function updateSelection(cm)
     * 
     * @param {CodeMirror.Editor} cm
     * @param {boolean} skipCacheCleaning
     */
    updateCursorDisplay: function (cm, skipCacheCleaning) {
      if (!skipCacheCleaning) {
        // // only process affected lines?
        // var lines = []
        // var vfrom = cm.display.viewFrom, vto = cm.display.viewTo
        // var selections = cm.listSelections()
        // var line
        // for (var i = 0; i < selections.length; i++) {
        //   line = selections[i].head.line; if (line >= vfrom && line <= vto && lines.indexOf(line) === -1) lines.push(line)
        //   line = selections[i].anchor.line; if (line >= vfrom && line <= vto && lines.indexOf(line) === -1) lines.push(line)
        // }
        
        var lvs = cm.display.view // LineView s
        for (var i = 0; i < lvs.length; i++) {
          // var j = lines.indexOf(lvs[i].line.lineNo())
          // if (j === -1) continue

          if (lvs[i].measure) lvs[i].measure.cache = {}
        }
      }

      setTimeout(function () {
        cm.display.input.showSelection(cm.display.input.prepareSelection())
      }, 60) // wait for css style
    },
  }
  return HyperMD
})