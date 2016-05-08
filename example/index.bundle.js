(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var AVS = require('../');
var player = AVS.Player;

var avs = new AVS({
  debug: true,
  clientId: 'amzn1.application-oa2-client.8871610ede8d4d91ac26122569319ed7',
  deviceId: 'gastro_club',
  deviceSerialNumber: 123456,
  redirectUri: 'https://' + window.location.host + '/authresponse'
});
window.avs = avs;

avs.on(AVS.EventTypes.TOKEN_SET, function () {
  loginBtn.disabled = true;
  logoutBtn.disabled = false;
  startRecording.disabled = false;
  stopRecording.disabled = true;
});

avs.on(AVS.EventTypes.RECORD_START, function () {
  startRecording.disabled = true;
  stopRecording.disabled = false;
});

avs.on(AVS.EventTypes.RECORD_STOP, function () {
  startRecording.disabled = false;
  stopRecording.disabled = true;
});

avs.on(AVS.EventTypes.LOGOUT, function () {
  loginBtn.disabled = false;
  logoutBtn.disabled = true;
  startRecording.disabled = true;
  stopRecording.disabled = true;
});

avs.on(AVS.EventTypes.TOKEN_INVALID, function () {
  avs.logout().then(login);
});

avs.on(AVS.EventTypes.LOG, log);
avs.on(AVS.EventTypes.ERROR, logError);

avs.player.on(AVS.Player.EventTypes.LOG, log);
avs.player.on(AVS.Player.EventTypes.ERROR, logError);

avs.player.on(AVS.Player.EventTypes.PLAY, function () {
  playAudio.disabled = true;
  replayAudio.disabled = true;
  pauseAudio.disabled = false;
  stopAudio.disabled = false;
});

avs.player.on(AVS.Player.EventTypes.ENDED, function () {
  playAudio.disabled = true;
  replayAudio.disabled = false;
  pauseAudio.disabled = true;
  stopAudio.disabled = true;
});

avs.player.on(AVS.Player.EventTypes.STOP, function () {
  playAudio.disabled = true;
  replayAudio.disabled = false;
  pauseAudio.disabled = false;
  stopAudio.disabled = false;
});

avs.player.on(AVS.Player.EventTypes.PAUSE, function () {
  playAudio.disabled = false;
  replayAudio.disabled = false;
  pauseAudio.disabled = true;
  stopAudio.disabled = true;
});

avs.player.on(AVS.Player.EventTypes.REPLAY, function () {
  playAudio.disabled = true;
  replayAudio.disabled = true;
  pauseAudio.disabled = false;
  stopAudio.disabled = false;
});

function log(message) {
  logOutput.innerHTML = '<li>LOG: ' + message + '</li>' + logOutput.innerHTML;
}

function logError(error) {
  logOutput.innerHTML = '<li>ERROR: ' + error + '</li>' + logOutput.innerHTML;
}

function logAudioBlob(blob, message) {
  return new Promise(function (resolve, reject) {
    var a = document.createElement('a');
    var aDownload = document.createElement('a');
    var url = window.URL.createObjectURL(blob);
    var ext = blob.type.indexOf('mpeg') > -1 ? 'mp3' : 'wav';
    var filename = Date.now() + '.' + ext;
    a.href = url;
    a.target = '_blank';
    aDownload.href = url;
    a.textContent = filename;
    aDownload.download = filename;
    aDownload.textContent = 'download';

    audioLogOutput.innerHTML = '<li>' + message + ': ' + a.outerHTML + ' ' + aDownload.outerHTML + '</li>' + audioLogOutput.innerHTML;
    resolve(blob);
  });
}

var loginBtn = document.getElementById('login');
var logoutBtn = document.getElementById('logout');
var logOutput = document.getElementById('log');
var audioLogOutput = document.getElementById('audioLog');
var startRecording = document.getElementById('startRecording');
var stopRecording = document.getElementById('stopRecording');
var stopAudio = document.getElementById('stopAudio');
var pauseAudio = document.getElementById('pauseAudio');
var playAudio = document.getElementById('playAudio');
var replayAudio = document.getElementById('replayAudio');

/*
 // If using client secret
 avs.getCodeFromUrl()
 .then(code => avs.getTokenFromCode(code))
 .then(token => localStorage.setItem('token', token))
 .then(refreshToken => localStorage.setItem('refreshToken', refreshToken))
 .then(() => avs.requestMic())
 .then(() => avs.refreshToken())
 .catch(() => {

 });
 */

avs.getTokenFromUrl().then(function () {
  return avs.getToken();
}).then(function (token) {
  return localStorage.setItem('token', token);
}).then(function () {
  return avs.requestMic();
}).catch(function () {
  var cachedToken = localStorage.getItem('token');

  if (cachedToken) {
    avs.setToken(cachedToken);
    return avs.requestMic();
  }
});

loginBtn.addEventListener('click', login);

function login(event) {
  return avs.login().then(function () {
    return avs.requestMic();
  }).catch(function () {});

  /*
   // If using client secret
   avs.login({responseType: 'code'})
   .then(() => avs.requestMic())
   .catch(() => {});
   */
}

logoutBtn.addEventListener('click', logout);

function logout() {
  return avs.logout().then(function () {
    localStorage.removeItem('token');
    window.location.hash = '';
  });
}

startRecording.addEventListener('click', function () {
  avs.startRecording();
});

stopRecording.addEventListener('click', function () {
  console.log(avs);
  avs.stopRecording().then(function (dataView) {
    avs.player.emptyQueue()
    // .then(() => avs.audioToBlob(dataView))
    // .then(blob => logAudioBlob(blob, 'VOICE'))
    // .then(() => avs.player.enqueue(dataView))
    // .then(() => avs.player.play())
    .catch(function (error) {
      console.error(error);
    });

    var ab = false;
    //sendBlob(blob);
    avs.sendAudio(dataView).then(function (_ref) {
      var xhr = _ref.xhr;
      var response = _ref.response;


      var promises = [];
      var audioMap = {};
      var directives = null;

      if (response.multipart.length) {
        (function () {
          var findAudioFromContentId = function findAudioFromContentId(contentId) {
            contentId = contentId.replace('cid:', '');
            for (var key in audioMap) {
              if (key.indexOf(contentId) > -1) {
                return audioMap[key];
              }
            }
          };

          response.multipart.forEach(function (multipart) {
            console.log(multipart);
            var body = multipart.body;
            if (multipart.headers && multipart.headers['Content-Type'] === 'application/json') {
              try {
                body = JSON.parse(body);
              } catch (error) {
                console.error(error);
              }

              if (body && body.messageBody && body.messageBody.directives) {
                directives = body.messageBody.directives;
              }
            } else if (multipart.headers['Content-Type'] === 'audio/mpeg') {
              var start = multipart.meta.body.byteOffset.start;
              var end = multipart.meta.body.byteOffset.end;

              /**
               * Not sure if bug in buffer module or in http message parser
               * because it's joining arraybuffers so I have to this to
               * seperate them out.
               */
              var slicedBody = xhr.response.slice(start, end);

              //promises.push(avs.player.enqueue(slicedBody));
              audioMap[multipart.headers['Content-ID']] = slicedBody;
            }
          });

          directives.forEach(function (directive) {

            if (directive.namespace === 'SpeechSynthesizer') {
              if (directive.name === 'speak') {
                var contentId = directive.payload.audioContent;
                var audio = findAudioFromContentId(contentId);
                if (audio) {
                  avs.audioToBlob(audio).then(function (blob) {
                    return logAudioBlob(blob, 'RESPONSE');
                  });
                  promises.push(avs.player.enqueue(audio));
                }
              }
            } else if (directive.namespace === 'AudioPlayer') {
              if (directive.name === 'play') {
                var streams = directive.payload.audioItem.streams;
                streams.forEach(function (stream) {
                  var streamUrl = stream.streamUrl;

                  var audio = findAudioFromContentId(streamUrl);
                  if (audio) {
                    avs.audioToBlob(audio).then(function (blob) {
                      return logAudioBlob(blob, 'RESPONSE');
                    });
                    promises.push(avs.player.enqueue(audio));
                  } else if (streamUrl.indexOf('http') > -1) {
                    var _xhr = new XMLHttpRequest();
                    var url = '/parse-m3u?url=' + streamUrl.replace(/!.*$/, '');
                    _xhr.open('GET', url, true);
                    _xhr.responseType = 'json';
                    _xhr.onload = function (event) {
                      var urls = event.currentTarget.response;

                      urls.forEach(function (url) {
                        avs.player.enqueue(url);
                      });
                    };
                    _xhr.send();
                  }
                });
              } else if (directive.namespace === 'SpeechRecognizer') {
                if (directive.name === 'listen') {
                  var timeout = directive.payload.timeoutIntervalInMillis;
                  // enable mic
                }
              }
            }
          });

          if (promises.length) {
            Promise.all(promises).then(function () {
              avs.player.playQueue();
            }).then(function () {
              checkForLocation();
            });
          }
        })();
      }
    }).catch(function (error) {
      console.error(error);
    });
  });
});

stopAudio.addEventListener('click', function (event) {
  avs.player.stop();
});

pauseAudio.addEventListener('click', function (event) {
  avs.player.pause();
});

playAudio.addEventListener('click', function (event) {
  avs.player.play();
});

replayAudio.addEventListener('click', function (event) {
  avs.player.replay();
});
function checkForLocation() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://thegastro.club/lastevent', true);
  xhr.responseType = 'json';
  xhr.onload = function (event) {
    if (xhr.status == 200) {
      var resp = xhr.response;
      console.log(resp);
    }
  };
  xhr.send();
}
function sendBlob(blob) {
  var xhr = new XMLHttpRequest();
  var fd = new FormData();

  fd.append('fname', 'audio.wav');
  fd.append('data', blob);

  xhr.open('POST', 'http://localhost:5555/audio', true);
  xhr.responseType = 'blob';

  xhr.onload = function (event) {
    if (xhr.status == 200) {
      console.log(xhr.response);
      //const responseBlob = new Blob([xhr.response], {type: 'audio/mp3'});
    }
  };

  xhr.send(fd);
}

},{"../":6}],2:[function(require,module,exports){
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],3:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; i++) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  that.write(string, encoding)
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

function arrayIndexOf (arr, val, byteOffset, encoding) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var foundIndex = -1
  for (var i = 0; byteOffset + i < arrLength; i++) {
    if (read(arr, byteOffset + i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
      if (foundIndex === -1) foundIndex = i
      if (i - foundIndex + 1 === valLength) return (byteOffset + foundIndex) * indexSize
    } else {
      if (foundIndex !== -1) i -= i - foundIndex
      foundIndex = -1
    }
  }
  return -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  if (Buffer.isBuffer(val)) {
    // special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(this, val, byteOffset, encoding)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset, encoding)
  }

  throw new TypeError('val must be string, number or Buffer')
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; i++) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; i++) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":2,"ieee754":4,"isarray":5}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],6:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function () {
  'use strict';

  var AVS = require('./lib/AVS');

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = AVS;
    }
    exports.AVS = AVS;
  }

  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return AVS;
    });
  }

  if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object') {
    window.AVS = AVS;
  }
})();

},{"./lib/AVS":7}],7:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = require('buffer').Buffer;
var qs = require('qs');
var httpMessageParser = require('http-message-parser');

var AMAZON_ERROR_CODES = require('./AmazonErrorCodes.js');
var Observable = require('./Observable.js');
var Player = require('./Player.js');
var arrayBufferToString = require('./utils/arrayBufferToString.js');
var writeUTFBytes = require('./utils/writeUTFBytes.js');
var mergeBuffers = require('./utils/mergeBuffers.js');
var interleave = require('./utils/interleave.js');
var downsampleBuffer = require('./utils/downsampleBuffer.js');

var AVS = function () {
  function AVS() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, AVS);

    Observable(this);

    this._bufferSize = 2048;
    this._inputChannels = 1;
    this._outputChannels = 1;
    this._leftChannel = [];
    this._rightChannel = [];
    this._audioContext = null;
    this._recorder = null;
    this._sampleRate = null;
    this._outputSampleRate = 16000;
    this._audioInput = null;
    this._volumeNode = null;
    this._debug = false;
    this._token = null;
    this._refreshToken = null;
    this._clientId = null;
    this._clientSecret = null;
    this._deviceId = null;
    this._deviceSerialNumber = null;
    this._redirectUri = null;
    this._audioQueue = [];

    if (options.token) {
      this.setToken(options.token);
    }

    if (options.refreshToken) {
      this.setRefreshToken(options.refreshToken);
    }

    if (options.clientId) {
      this.setClientId(options.clientId);
    }

    if (options.clientSecret) {
      this.setClientSecret(options.clientSecret);
    }

    if (options.deviceId) {
      this.setDeviceId(options.deviceId);
    }

    if (options.deviceSerialNumber) {
      this.setDeviceSerialNumber(options.deviceSerialNumber);
    }

    if (options.redirectUri) {
      this.setRedirectUri(options.redirectUri);
    }

    if (options.debug) {
      this.setDebug(options.debug);
    }

    this.player = new Player();
  }

  _createClass(AVS, [{
    key: '_log',
    value: function _log(type, message) {
      var _this = this;

      if (type && !message) {
        message = type;
        type = 'log';
      }

      setTimeout(function () {
        _this.emit(AVS.EventTypes.LOG, message);
      }, 0);

      if (this._debug) {
        console[type](message);
      }
    }
  }, {
    key: 'login',
    value: function login() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return this.promptUserLogin(options);
    }
  }, {
    key: 'logout',
    value: function logout() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2._token = null;
        _this2._refreshToken = null;
        _this2.emit(AVS.EventTypes.LOGOUT);
        _this2._log('Logged out');
        resolve();
      });
    }
  }, {
    key: 'promptUserLogin',
    value: function promptUserLogin() {
      var _this3 = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? { responseType: 'token', newWindow: false } : arguments[0];

      return new Promise(function (resolve, reject) {
        if (typeof options.responseType === 'undefined') {
          options.responseType = 'token';
        }

        if (typeof options.responseType !== 'string') {
          var error = new Error('`responseType` must a string.');
          _this3._log(error);
          return reject(error);
        }

        var newWindow = !!options.newWindow;

        var responseType = options.responseType;

        if (!(responseType === 'code' || responseType === 'token')) {
          var _error = new Error('`responseType` must be either `code` or `token`.');
          _this3._log(_error);
          return reject(_error);
        }

        var scope = 'alexa:all';
        var scopeData = _defineProperty({}, scope, {
          productID: _this3._deviceId,
          productInstanceAttributes: {
            deviceSerialNumber: _this3._deviceSerialNumber
          }
        });

        var authUrl = 'https://www.amazon.com/ap/oa?client_id=' + _this3._clientId + '&scope=' + encodeURIComponent(scope) + '&scope_data=' + encodeURIComponent(JSON.stringify(scopeData)) + '&response_type=' + responseType + '&redirect_uri=' + encodeURI(_this3._redirectUri);

        if (newWindow) {
          window.open(authUrl);
        } else {
          window.location.href = authUrl;
        }
      });
    }
  }, {
    key: 'getTokenFromCode',
    value: function getTokenFromCode(code) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        if (typeof code !== 'string') {
          var error = new TypeError('`code` must be a string.');
          _this4._log(error);
          return reject(error);
        }

        var grantType = 'authorization_code';
        var postData = 'grant_type=' + grantType + '&code=' + code + '&client_id=' + _this4._clientId + '&client_secret=' + _this4._clientSecret + '&redirect_uri=' + encodeURIComponent(_this4._redirectUri);
        var url = 'https://api.amazon.com/auth/o2/token';

        var xhr = new XMLHttpRequest();

        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
        xhr.onload = function (event) {
          var response = xhr.response;

          try {
            response = JSON.parse(xhr.response);
          } catch (error) {
            _this4._log(error);
            return reject(error);
          }

          var isObject = response instanceof Object;
          var errorDescription = isObject && response.error_description;

          if (errorDescription) {
            var _error2 = new Error(errorDescription);
            _this4._log(_error2);
            return reject(_error2);
          }

          var token = response.access_token;
          var refreshToken = response.refresh_token;
          var tokenType = response.token_type;
          var expiresIn = response.expiresIn;

          _this4.setToken(token);
          _this4.setRefreshToken(refreshToken);

          _this4.emit(AVS.EventTypes.LOGIN);
          _this4._log('Logged in.');
          resolve(response);
        };

        xhr.onerror = function (error) {
          _this4._log(error);
          reject(error);
        };

        xhr.send(postData);
      });
    }
  }, {
    key: 'refreshToken',
    value: function refreshToken() {
      var _this5 = this;

      return this.getTokenFromRefreshToken(this._refreshToken).then(function () {
        return {
          token: _this5._token,
          refreshToken: _this5._refreshToken
        };
      });
    }
  }, {
    key: 'getTokenFromRefreshToken',
    value: function getTokenFromRefreshToken() {
      var _this6 = this;

      var refreshToken = arguments.length <= 0 || arguments[0] === undefined ? this._refreshToken : arguments[0];

      return new Promise(function (resolve, reject) {
        if (typeof refreshToken !== 'string') {
          var error = new Error('`refreshToken` must a string.');
          _this6._log(error);
          return reject(error);
        }

        var grantType = 'refresh_token';
        var postData = 'grant_type=' + grantType + '&refresh_token=' + refreshToken + '&client_id=' + _this6._clientId + '&client_secret=' + _this6._clientSecret + '&redirect_uri=' + encodeURIComponent(_this6._redirectUri);
        var url = 'https://api.amazon.com/auth/o2/token';
        var xhr = new XMLHttpRequest();

        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
        xhr.responseType = 'json';
        xhr.onload = function (event) {
          var response = xhr.response;

          if (response.error) {
            var _error3 = response.error.message;
            _this6.emit(AVS.EventTypes.ERROR, _error3);

            return reject(_error3);
          } else {
            var token = response.access_token;
            var _refreshToken = response.refresh_token;

            _this6.setToken(token);
            _this6.setRefreshToken(_refreshToken);

            return resolve(token);
          }
        };

        xhr.onerror = function (error) {
          _this6._log(error);
          reject(error);
        };

        xhr.send(postData);
      });
    }
  }, {
    key: 'getTokenFromUrl',
    value: function getTokenFromUrl() {
      var _this7 = this;

      return new Promise(function (resolve, reject) {
        var hash = window.location.hash.substr(1);

        var query = qs.parse(hash);
        var token = query.access_token;
        var refreshToken = query.refresh_token;
        var tokenType = query.token_type;
        var expiresIn = query.expiresIn;

        if (token) {
          _this7.setToken(token);
          _this7.emit(AVS.EventTypes.LOGIN);
          _this7._log('Logged in.');

          if (refreshToken) {
            _this7.setRefreshToken(refreshToken);
          }

          return resolve(token);
        }

        return reject();
      });
    }
  }, {
    key: 'getCodeFromUrl',
    value: function getCodeFromUrl() {
      return new Promise(function (resolve, reject) {
        var query = qs.parse(window.location.search.substr(1));
        var code = query.code;

        if (code) {
          return resolve(code);
        }

        return reject(null);
      });
    }
  }, {
    key: 'setToken',
    value: function setToken(token) {
      var _this8 = this;

      return new Promise(function (resolve, reject) {
        if (typeof token === 'string') {
          _this8._token = token;
          _this8.emit(AVS.EventTypes.TOKEN_SET);
          _this8._log('Token set.');
          resolve(_this8._token);
        } else {
          var error = new TypeError('`token` must be a string.');
          _this8._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'setRefreshToken',
    value: function setRefreshToken(refreshToken) {
      var _this9 = this;

      return new Promise(function (resolve, reject) {
        if (typeof refreshToken === 'string') {
          _this9._refreshToken = refreshToken;
          _this9.emit(AVS.EventTypes.REFRESH_TOKEN_SET);
          _this9._log('Refresh token set.');
          resolve(_this9._refreshToken);
        } else {
          var error = new TypeError('`refreshToken` must be a string.');
          _this9._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'setClientId',
    value: function setClientId(clientId) {
      var _this10 = this;

      return new Promise(function (resolve, reject) {
        if (typeof clientId === 'string') {
          _this10._clientId = clientId;
          resolve(_this10._clientId);
        } else {
          var error = new TypeError('`clientId` must be a string.');
          _this10._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'setClientSecret',
    value: function setClientSecret(clientSecret) {
      var _this11 = this;

      return new Promise(function (resolve, reject) {
        if (typeof clientSecret === 'string') {
          _this11._clientSecret = clientSecret;
          resolve(_this11._clientSecret);
        } else {
          var error = new TypeError('`clientSecret` must be a string');
          _this11._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'setDeviceId',
    value: function setDeviceId(deviceId) {
      var _this12 = this;

      return new Promise(function (resolve, reject) {
        if (typeof deviceId === 'string') {
          _this12._deviceId = deviceId;
          resolve(_this12._deviceId);
        } else {
          var error = new TypeError('`deviceId` must be a string.');
          _this12._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'setDeviceSerialNumber',
    value: function setDeviceSerialNumber(deviceSerialNumber) {
      var _this13 = this;

      return new Promise(function (resolve, reject) {
        if (typeof deviceSerialNumber === 'number' || typeof deviceSerialNumber === 'string') {
          _this13._deviceSerialNumber = deviceSerialNumber;
          resolve(_this13._deviceSerialNumber);
        } else {
          var error = new TypeError('`deviceSerialNumber` must be a number or string.');
          _this13._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'setRedirectUri',
    value: function setRedirectUri(redirectUri) {
      var _this14 = this;

      return new Promise(function (resolve, reject) {
        if (typeof redirectUri === 'string') {
          _this14._redirectUri = redirectUri;
          resolve(_this14._redirectUri);
        } else {
          var error = new TypeError('`redirectUri` must be a string.');
          _this14._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'setDebug',
    value: function setDebug(debug) {
      var _this15 = this;

      return new Promise(function (resolve, reject) {
        if (typeof debug === 'boolean') {
          _this15._debug = debug;
          resolve(_this15._debug);
        } else {
          var error = new TypeError('`debug` must be a boolean.');
          _this15._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'getToken',
    value: function getToken() {
      var _this16 = this;

      return new Promise(function (resolve, reject) {
        var token = _this16._token;

        if (token) {
          return resolve(token);
        }

        return reject();
      });
    }
  }, {
    key: 'getRefreshToken',
    value: function getRefreshToken() {
      var _this17 = this;

      return new Promise(function (resolve, reject) {
        var refreshToken = _this17._refreshToken;

        if (refreshToken) {
          return resolve(refreshToken);
        }

        return reject();
      });
    }
  }, {
    key: 'requestMic',
    value: function requestMic() {
      var _this18 = this;

      return new Promise(function (resolve, reject) {
        _this18._log('Requesting microphone.');

        // Ensure that the file can be loaded in environments where navigator is not defined (node servers)
        if (!navigator.getUserMedia) {
          navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        }

        navigator.getUserMedia({
          audio: true
        }, function (stream) {
          _this18._log('Microphone connected.');
          return _this18.connectMediaStream(stream).then(resolve);
        }, function (error) {
          _this18._log('error', error);
          _this18.emit(AVS.EventTypes.ERROR, error);
          return reject(error);
        });
      });
    }
  }, {
    key: 'connectMediaStream',
    value: function connectMediaStream(stream) {
      var _this19 = this;

      return new Promise(function (resolve, reject) {
        var isMediaStream = Object.prototype.toString.call(stream) === '[object MediaStream]';

        if (!isMediaStream) {
          var error = new TypeError('Argument must be a `MediaStream` object.');
          _this19._log('error', error);
          _this19.emit(AVS.EventTypes.ERROR, error);
          return reject(error);
        }

        _this19._audioContext = new AudioContext();
        _this19._sampleRate = _this19._audioContext.sampleRate;

        _this19._log('Sample rate: ' + _this19._sampleRate + '.');

        _this19._volumeNode = _this19._audioContext.createGain();
        _this19._audioInput = _this19._audioContext.createMediaStreamSource(stream);

        _this19._audioInput.connect(_this19._volumeNode);

        _this19._recorder = _this19._audioContext.createScriptProcessor(_this19._bufferSize, _this19._inputChannels, _this19._outputChannels);

        _this19._recorder.onaudioprocess = function (event) {
          if (!_this19._isRecording) {
            return false;
          }

          var left = event.inputBuffer.getChannelData(0);
          _this19._leftChannel.push(new Float32Array(left));

          if (_this19._inputChannels > 1) {
            var right = event.inputBuffer.getChannelData(1);
            _this19._rightChannel.push(new Float32Array(right));
          }

          _this19._recordingLength += _this19._bufferSize;
        };

        _this19._volumeNode.connect(_this19._recorder);
        _this19._recorder.connect(_this19._audioContext.destination);
        _this19._log('Media stream connected.');

        return resolve(stream);
      });
    }
  }, {
    key: 'startRecording',
    value: function startRecording() {
      var _this20 = this;

      return new Promise(function (resolve, reject) {
        if (!_this20._audioInput) {
          var error = new Error('No Media Stream connected.');
          _this20._log('error', error);
          _this20.emit(AVS.EventTypes.ERROR, error);
          return reject(error);
        }

        _this20._isRecording = true;
        _this20._leftChannel.length = _this20._rightChannel.length = 0;
        _this20._recordingLength = 0;
        _this20._log('Recording started.');
        _this20.emit(AVS.EventTypes.RECORD_START);

        return resolve();
      });
    }
  }, {
    key: 'stopRecording',
    value: function stopRecording() {
      var _this21 = this;

      return new Promise(function (resolve, reject) {
        if (!_this21._isRecording) {
          _this21.emit(AVS.EventTypes.RECORD_STOP);
          _this21._log('Recording stopped.');
          return resolve();
        }

        _this21._isRecording = false;

        var leftBuffer = mergeBuffers(_this21._leftChannel, _this21._recordingLength);
        var interleaved = null;

        if (_this21._outputChannels > 1) {
          var rightBuffer = mergeBuffers(_this21._rightChannel, _this21._recordingLength);
          interleaved = interleave(leftBuffer, rightBuffer);
        } else {
          interleaved = interleave(leftBuffer);
        }

        interleaved = downsampleBuffer(interleaved, _this21._sampleRate, _this21._outputSampleRate);

        var buffer = new ArrayBuffer(44 + interleaved.length * 2);
        var view = new DataView(buffer);

        /**
         * @credit https://github.com/mattdiamond/Recorderjs
         */
        writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 44 + interleaved.length * 2, true);
        writeUTFBytes(view, 8, 'WAVE');
        writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, _this21._outputChannels, true);
        view.setUint32(24, _this21._outputSampleRate, true);
        view.setUint32(28, _this21._outputSampleRate * 4, true);
        view.setUint16(32, 4, true);
        view.setUint16(34, 16, true);
        writeUTFBytes(view, 36, 'data');
        view.setUint32(40, interleaved.length * 2, true);

        var length = interleaved.length;
        var volume = 1;
        var index = 44;

        for (var i = 0; i < length; i++) {
          view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
          index += 2;
        }

        _this21._log('Recording stopped.');
        _this21.emit(AVS.EventTypes.RECORD_STOP);
        return resolve(view);
      });
    }
  }, {
    key: 'sendAudio',
    value: function sendAudio(dataView) {
      var _this22 = this;

      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        var url = 'https://access-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize';

        xhr.open('POST', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function (event) {
          var buffer = new Buffer(xhr.response);

          if (xhr.status === 200) {
            var parsedMessage = httpMessageParser(buffer);
            resolve({ xhr: xhr, response: parsedMessage });
          } else {
            var error = new Error('An error occured with request.');
            var response = {};

            if (!xhr.response.byteLength) {
              error = new Error('Empty response.');
            } else {
              try {
                response = JSON.parse(arrayBufferToString(buffer));
              } catch (err) {
                error = err;
              }
            }

            if (response.error instanceof Object) {
              if (response.error.code === AMAZON_ERROR_CODES.InvalidAccessTokenException) {
                _this22.emit(AVS.EventTypes.TOKEN_INVALID);
              }

              error = response.error.message;
            }

            _this22.emit(AVS.EventTypes.ERROR, error);
            return reject(error);
          }
        };

        xhr.onerror = function (error) {
          _this22._log(error);
          reject(error);
        };

        var BOUNDARY = 'BOUNDARY1234';
        var BOUNDARY_DASHES = '--';
        var NEWLINE = '\r\n';
        var METADATA_CONTENT_DISPOSITION = 'Content-Disposition: form-data; name="metadata"';
        var METADATA_CONTENT_TYPE = 'Content-Type: application/json; charset=UTF-8';
        var AUDIO_CONTENT_TYPE = 'Content-Type: audio/L16; rate=16000; channels=1';
        var AUDIO_CONTENT_DISPOSITION = 'Content-Disposition: form-data; name="audio"';

        var metadata = {
          messageHeader: {},
          messageBody: {
            profile: 'alexa-close-talk',
            locale: 'en-us',
            format: 'audio/L16; rate=16000; channels=1'
          }
        };

        var postDataStart = [NEWLINE, BOUNDARY_DASHES, BOUNDARY, NEWLINE, METADATA_CONTENT_DISPOSITION, NEWLINE, METADATA_CONTENT_TYPE, NEWLINE, NEWLINE, JSON.stringify(metadata), NEWLINE, BOUNDARY_DASHES, BOUNDARY, NEWLINE, AUDIO_CONTENT_DISPOSITION, NEWLINE, AUDIO_CONTENT_TYPE, NEWLINE, NEWLINE].join('');

        var postDataEnd = [NEWLINE, BOUNDARY_DASHES, BOUNDARY, BOUNDARY_DASHES, NEWLINE].join('');

        var size = postDataStart.length + dataView.byteLength + postDataEnd.length;
        var uint8Array = new Uint8Array(size);
        var i = 0;

        for (; i < postDataStart.length; i++) {
          uint8Array[i] = postDataStart.charCodeAt(i) & 0xFF;
        }

        for (var j = 0; j < dataView.byteLength; i++, j++) {
          uint8Array[i] = dataView.getUint8(j);
        }

        for (var _j = 0; _j < postDataEnd.length; i++, _j++) {
          uint8Array[i] = postDataEnd.charCodeAt(_j) & 0xFF;
        }

        var payload = uint8Array.buffer;

        xhr.setRequestHeader('Authorization', 'Bearer ' + _this22._token);
        xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + BOUNDARY);
        xhr.send(payload);
      });
    }
  }, {
    key: 'audioToBlob',
    value: function audioToBlob(audio) {
      return new Promise(function (resolve, reject) {
        var blob = new Blob([audio], { type: 'audio/mpeg' });

        resolve(blob);
      });
    }
  }], [{
    key: 'EventTypes',
    get: function get() {
      return {
        LOG: 'log',
        ERROR: 'error',
        LOGIN: 'login',
        LOGOUT: 'logout',
        RECORD_START: 'recordStart',
        RECORD_STOP: 'recordStop',
        TOKEN_SET: 'tokenSet',
        REFRESH_TOKEN_SET: 'refreshTokenSet',
        TOKEN_INVALID: 'tokenInvalid'
      };
    }
  }, {
    key: 'Player',
    get: function get() {
      return Player;
    }
  }]);

  return AVS;
}();

module.exports = AVS;

},{"./AmazonErrorCodes.js":8,"./Observable.js":9,"./Player.js":10,"./utils/arrayBufferToString.js":12,"./utils/downsampleBuffer.js":13,"./utils/interleave.js":14,"./utils/mergeBuffers.js":15,"./utils/writeUTFBytes.js":16,"buffer":3,"http-message-parser":17,"qs":18}],8:[function(require,module,exports){
'use strict';

module.exports = {
  InvalidAccessTokenException: 'com.amazon.alexahttpproxy.exceptions.InvalidAccessTokenException'
};

},{}],9:[function(require,module,exports){
'use strict';

function Observable(el) {
  var callbacks = {};

  el.on = function (name, fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('Second argument for "on" method must be a function.');
    }

    (callbacks[name] = callbacks[name] || []).push(fn);

    return el;
  };

  el.one = function (name, fn) {
    fn.one = true;
    return el.on.call(el, name, fn);
  };

  el.off = function (name, fn) {
    if (name === '*') {
      callbacks = {};
      return callbacks;
    }

    if (!callbacks[name]) {
      return false;
    }

    if (fn) {
      if (typeof fn !== 'function') {
        throw new TypeError('Second argument for "off" method must be a function.');
      }

      callbacks[name] = callbacks[name].map(function (fm, i) {
        if (fm === fn) {
          callbacks[name].splice(i, 1);
        }
      });
    } else {
      delete callbacks[name];
    }
  };

  el.emit = function (name /*, args */) {
    if (!callbacks[name] || !callbacks[name].length) {
      return;
    }

    var args = [].slice.call(arguments, 1);

    callbacks[name].forEach(function (fn, i) {
      if (fn) {
        fn.apply(fn, args);
        if (fn.one) {
          callbacks[name].splice(i, 1);
        }
      }
    });

    return el;
  };

  return el;
}

module.exports = Observable;

},{}],10:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Observable = require('./Observable');
var arrayBufferToAudioBuffer = require('./utils/arrayBufferToAudioBuffer');
var toString = Object.prototype.toString;

var Player = function () {
  function Player() {
    _classCallCheck(this, Player);

    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    this._queue = [];
    this._currentSource = null;
    this._currentBuffer = null;
    this._context = new AudioContext();

    Observable(this);
  }

  _createClass(Player, [{
    key: '_log',
    value: function _log(type, message) {
      var _this = this;

      if (type && !message) {
        message = type;
        type = 'log';
      }

      setTimeout(function () {
        _this.emit(Player.EventTypes.LOG, message);
      }, 0);

      if (this._debug) {
        console[type](message);
      }
    }
  }, {
    key: 'emptyQueue',
    value: function emptyQueue() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2._queue = [];
        _this2._audio = null;
        _this2._currentBuffer = null;
        _this2._currentSource = null;
        resolve();
      });
    }
  }, {
    key: 'enqueue',
    value: function enqueue(item) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        if (!item) {
          var error = new Error('argument cannot be empty.');
          _this3._log(error);
          return reject(error);
        }

        var stringType = toString.call(item).replace(/\[.*\s(\w+)\]/, '$1');

        var proceed = function proceed(audioBuffer) {
          _this3._queue.push(audioBuffer);
          _this3._log('Enqueue audio');
          _this3.emit(Player.EventTypes.ENQUEUE);
          return resolve(audioBuffer);
        };

        if (stringType === 'DataView' || stringType === 'Uint8Array') {
          return arrayBufferToAudioBuffer(item.buffer, _this3._context).then(proceed);
        } else if (stringType === 'AudioBuffer') {
          return proceed(item);
        } else if (stringType === 'ArrayBuffer') {
          return arrayBufferToAudioBuffer(item, _this3._context).then(proceed);
        } else if (stringType === 'String') {
          return proceed(item);
        } else {
          var _error = new Error('Invalid type.');
          _this3.emit('error', _error);
          return reject(_error);
        }
      });
    }
  }, {
    key: 'deque',
    value: function deque() {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        var item = _this4._queue.shift();

        if (item) {
          _this4._log('Deque audio');
          _this4.emit(Player.EventTypes.DEQUE);
          return resolve(item);
        }

        return reject();
      });
    }
  }, {
    key: 'play',
    value: function play() {
      var _this5 = this;

      return new Promise(function (resolve, reject) {
        if (_this5._context.state === 'suspended') {
          _this5._context.resume();

          _this5._log('Play audio');
          _this5.emit(Player.EventTypes.PLAY);
          resolve();
        } else if (_this5._audio && _this5._audio.paused) {
          _this5._log('Play audio');
          _this5.emit(Player.EventTypes.PLAY);
          _this5._audio.play();
          resolve();
        } else {
          return _this5.deque().then(function (audioBuffer) {
            _this5._log('Play audio');
            _this5.emit(Player.EventTypes.PLAY);
            if (typeof audioBuffer === 'string') {
              return _this5.playUrl(audioBuffer);
            }
            return _this5.playAudioBuffer(audioBuffer);
          }).then(resolve);
        }
      });
    }
  }, {
    key: 'playQueue',
    value: function playQueue() {
      var _this6 = this;

      return this.play().then(function () {
        if (_this6._queue.length) {
          return _this6.playQueue();
        }
      });
    }
  }, {
    key: 'stop',
    value: function stop() {
      var _this7 = this;

      return new Promise(function (resolve, reject) {
        if (_this7._currentSource) {
          _this7._currentSource.onended = function () {};
          _this7._currentSource.stop();
        }

        if (_this7._audio) {
          _this7._audio.onended = function () {};
          _this7._audio.currentTime = 0;
          _this7._audio.pause();
        }

        _this7._log('Stop audio');
        _this7.emit(Player.EventTypes.STOP);
      });
    }
  }, {
    key: 'pause',
    value: function pause() {
      var _this8 = this;

      return new Promise(function (resolve, reject) {
        if (_this8._currentSource && _this8._context.state === 'running') {
          _this8._context.suspend();
        }

        if (_this8._audio) {
          _this8._audio.pause();
        }

        _this8._log('Pause audio');
        _this8.emit(Player.EventTypes.PAUSE);
      });
    }
  }, {
    key: 'replay',
    value: function replay() {
      var _this9 = this;

      return new Promise(function (resolve, reject) {
        if (_this9._currentBuffer) {
          _this9._log('Replay audio');
          _this9.emit(Player.EventTypes.REPLAY);

          if (_this9._context.state === 'suspended') {
            _this9._context.resume();
          }

          if (_this9._currentSource) {
            _this9._currentSource.stop();
            _this9._currentSource.onended = function () {};
          }
          return _this9.playAudioBuffer(_this9._currentBuffer);
        } else if (_this9._audio) {
          _this9._log('Replay audio');
          _this9.emit(Player.EventTypes.REPLAY);
          return _this9.playUrl(_this9._audio.src);
        } else {
          var error = new Error('No audio source loaded.');
          _this9.emit('error', error);
          reject();
        }
      });
    }
  }, {
    key: 'playBlob',
    value: function playBlob(blob) {
      var _this10 = this;

      return new Promise(function (resolve, reject) {
        if (!blob) {
          reject();
        }

        var objectUrl = URL.createObjectURL(blob);
        var audio = new Audio();
        audio.src = objectUrl;
        _this10._currentBuffer = null;
        _this10._currentSource = null;
        _this10._audio = audio;

        audio.onended = function () {
          _this10._log('Audio ended');
          _this10.emit(Player.EventTypes.ENDED);
          resolve();
        };

        audio.onerror = function (error) {
          _this10.emit('error', error);
          reject(error);
        };

        audio.onload = function (event) {
          URL.revokeObjectUrl(objectUrl);
        };

        audio.play();
      });
    }
  }, {
    key: 'playAudioBuffer',
    value: function playAudioBuffer(buffer) {
      var _this11 = this;

      return new Promise(function (resolve, reject) {
        if (!buffer) {
          reject();
        }

        var source = _this11._context.createBufferSource();
        source.buffer = buffer;
        source.connect(_this11._context.destination);
        source.start(0);
        _this11._currentBuffer = buffer;
        _this11._currentSource = source;
        _this11._audio = null;

        source.onended = function (event) {
          _this11._log('Audio ended');
          _this11.emit(Player.EventTypes.ENDED);
          resolve();
        };

        source.onerror = function (error) {
          _this11.emit('error', error);
          reject(error);
        };
      });
    }
  }, {
    key: 'playUrl',
    value: function playUrl(url) {
      var _this12 = this;

      return new Promise(function (resolve, reject) {
        var audio = new Audio();
        audio.src = url;
        _this12._currentBuffer = null;
        _this12._currentSource = null;
        _this12._audio = audio;

        audio.onended = function (event) {
          _this12._log('Audio ended');
          _this12.emit(Player.EventTypes.ENDED);
          resolve();
        };

        audio.onerror = function (error) {
          _this12.emit('error', error);
          reject(error);
        };

        audio.play();
      });
    }
  }], [{
    key: 'EventTypes',
    get: function get() {
      return {
        LOG: 'log',
        ERROR: 'error',
        PLAY: 'play',
        REPLAY: 'replay',
        PAUSE: 'pause',
        STOP: 'pause',
        ENQUEUE: 'enqueue',
        DEQUE: 'deque'
      };
    }
  }]);

  return Player;
}();

module.exports = Player;

},{"./Observable":9,"./utils/arrayBufferToAudioBuffer":11}],11:[function(require,module,exports){
'use strict';

function arrayBufferToAudioBuffer(arrayBuffer, context) {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  return new Promise(function (resolve, reject) {
    if (context) {
      if (Object.prototype.toString.call(context) !== '[object AudioContext]') {
        throw new TypeError('`context` must be an AudioContext');
      }
    } else {
      context = new AudioContext();
    }

    context.decodeAudioData(arrayBuffer, function (data) {
      resolve(data);
    }, reject);
  });
}

module.exports = arrayBufferToAudioBuffer;

},{}],12:[function(require,module,exports){
'use strict';

/**
 * @credit https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String?hl=en
 */

function arrayBufferToString(buffer) {
  return String.fromCharCode.apply(null, new Uint16Array(buffer));
}

module.exports = arrayBufferToString;

},{}],13:[function(require,module,exports){
'use strict';

/**
 * @credit http://stackoverflow.com/a/26245260
 */

function downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
  if (inputSampleRate === outputSampleRate) {
    return buffer;
  }

  if (inputSampleRate < outputSampleRate) {
    throw new Error('Output sample rate must be less than input sample rate.');
  }

  var sampleRateRatio = inputSampleRate / outputSampleRate;
  var newLength = Math.round(buffer.length / sampleRateRatio);
  var result = new Float32Array(newLength);
  var offsetResult = 0;
  var offsetBuffer = 0;

  while (offsetResult < result.length) {
    var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    var accum = 0;
    var count = 0;

    for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }

    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

module.exports = downsampleBuffer;

},{}],14:[function(require,module,exports){
'use strict';

/**
 * @credit https://github.com/mattdiamond/Recorderjs
 */

function interleave(leftChannel, rightChannel) {
  if (leftChannel && !rightChannel) {
    return leftChannel;
  }

  var length = leftChannel.length + rightChannel.length;
  var result = new Float32Array(length);
  var inputIndex = 0;

  for (var index = 0; index < length;) {
    result[index++] = leftChannel[inputIndex];
    result[index++] = rightChannel[inputIndex];
    inputIndex++;
  }

  return result;
}

module.exports = interleave;

},{}],15:[function(require,module,exports){
'use strict';

/**
 * @credit https://github.com/mattdiamond/Recorderjs
 */

function mergeBuffers(channelBuffer, recordingLength) {
  var result = new Float32Array(recordingLength);
  var length = channelBuffer.length;
  var offset = 0;

  for (var i = 0; i < length; i++) {
    var buffer = channelBuffer[i];

    result.set(buffer, offset);
    offset += buffer.length;
  }

  return result;
}

module.exports = mergeBuffers;

},{}],16:[function(require,module,exports){
'use strict';

/**
 * @credit https://github.com/mattdiamond/Recorderjs
 */

function writeUTFBytes(view, offset, string) {
  var length = string.length;

  for (var i = 0; i < length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

module.exports = writeUTFBytes;

},{}],17:[function(require,module,exports){
(function (global,Buffer){
(function(root) {
  'use strict';

  function httpMessageParser(message) {
    const result = {
      httpVersion: null,
      statusCode: null,
      statusMessage: null,
      method: null,
      url: null,
      headers: null,
      body: null,
      boundary: null,
      multipart: null
    };

    var messageString = '';
    var headerNewlineIndex = 0;
    var fullBoundary = null;

    if (httpMessageParser._isBuffer(message)) {
      messageString = message.toString();
    } else if (typeof message === 'string') {
      messageString = message;
      message = httpMessageParser._createBuffer(messageString);
    } else {
      return result;
    }

    /*
     * Strip extra return characters
     */
    messageString = messageString.replace(/\r\n/gim, '\n');

    /*
     * Trim leading whitespace
     */
    (function() {
      const firstNonWhitespaceRegex = /[\w-]+/gim;
      const firstNonWhitespaceIndex = messageString.search(firstNonWhitespaceRegex);
      if (firstNonWhitespaceIndex > 0) {
        message = message.slice(firstNonWhitespaceIndex, message.length);
        messageString = message.toString();
      }
    })();

    /* Parse request line
     */
    (function() {
      const possibleRequestLine = messageString.split(/\n|\r\n/)[0];
      const requestLineMatch = possibleRequestLine.match(httpMessageParser._requestLineRegex);

      if (Array.isArray(requestLineMatch) && requestLineMatch.length > 1) {
        result.httpVersion = parseFloat(requestLineMatch[1]);
        result.statusCode = parseInt(requestLineMatch[2]);
        result.statusMessage = requestLineMatch[3];
      } else {
        const responseLineMath = possibleRequestLine.match(httpMessageParser._responseLineRegex);
        if (Array.isArray(responseLineMath) && responseLineMath.length > 1) {
          result.method = responseLineMath[1];
          result.url = responseLineMath[2];
          result.httpVersion = parseFloat(responseLineMath[3]);
        }
      }
    })();

    /* Parse headers
     */
    (function() {
      headerNewlineIndex = messageString.search(httpMessageParser._headerNewlineRegex);
      if (headerNewlineIndex > -1) {
        headerNewlineIndex = headerNewlineIndex + 1; // 1 for newline length
      } else {
        /* There's no line breaks so check if request line exists
         * because the message might be all headers and no body
         */
        if (result.httpVersion) {
          headerNewlineIndex = messageString.length;
        }
      }

      const headersString = messageString.substr(0, headerNewlineIndex);
      const headers = httpMessageParser._parseHeaders(headersString);

      if (Object.keys(headers).length > 0) {
        result.headers = headers;

        // TOOD: extract boundary.
      }
    })();

    /* Try to get boundary if no boundary header
     */
    (function() {
      if (!result.boundary) {
        const boundaryMatch = messageString.match(httpMessageParser._boundaryRegex);

        if (Array.isArray(boundaryMatch) && boundaryMatch.length) {
          fullBoundary = boundaryMatch[0].replace(/[\r\n]+/gi, '');
          const boundary = fullBoundary.replace(/^--/,'');
          result.boundary = boundary;
        }
      }
    })();

    /* Parse body
     */
    (function() {
      var start = headerNewlineIndex;
      var end = message.length;
      const firstBoundaryIndex = messageString.indexOf(fullBoundary);

      if (firstBoundaryIndex > -1) {
        start = headerNewlineIndex;
        end = firstBoundaryIndex;
      }

      if (headerNewlineIndex > -1) {
        const body = message.slice(start, end);

        if (body && body.length) {
          result.body = httpMessageParser._isFakeBuffer(body) ? body.toString() : body;
        }
      }
    })();

    /* Parse multipart sections
     */
    (function() {
      if (result.boundary) {
        const multipartStart = messageString.indexOf(fullBoundary) + fullBoundary.length;
        const multipartEnd = messageString.lastIndexOf(fullBoundary);
        const multipartBody = messageString.substr(multipartStart, multipartEnd);
        const parts = multipartBody.split(fullBoundary);

        result.multipart = parts.filter(httpMessageParser._isTruthy).map(function(part, i) {
          const result = {
            headers: null,
            body: null,
            meta: {
              body: {
                byteOffset: {
                  start: null,
                  end: null
                }
              }
            }
          };

          const newlineRegex = /\n\n|\r\n\r\n/gim;
          var newlineIndex = 0;
          var newlineMatch = newlineRegex.exec(part);
          var body = null;

          if (newlineMatch) {
            newlineIndex = newlineMatch.index;
            if (newlineMatch.index <= 0) {
              newlineMatch = newlineRegex.exec(part);
              if (newlineMatch) {
                newlineIndex = newlineMatch.index;
              }
            }
          }

          const possibleHeadersString = part.substr(0, newlineIndex);

          let startOffset = null;
          let endOffset = null;

          if (newlineIndex > -1) {
            const headers = httpMessageParser._parseHeaders(possibleHeadersString);
            if (Object.keys(headers).length > 0) {
              result.headers = headers;

              var boundaryIndexes = [];
              for (var j = 0; j < message.length; j++) {
                var boundaryMatch = message.slice(j, j + fullBoundary.length).toString();

                if (boundaryMatch === fullBoundary) {
                  boundaryIndexes.push(j);
                }
              }

              var boundaryNewlineIndexes = [];
              boundaryIndexes.slice(0, boundaryIndexes.length - 1).forEach(function(m, k) {
                const partBody = message.slice(boundaryIndexes[k], boundaryIndexes[k + 1]).toString();
                var headerNewlineIndex = partBody.search(/\n\n|\r\n\r\n/gim) + 2;
                headerNewlineIndex  = boundaryIndexes[k] + headerNewlineIndex;
                boundaryNewlineIndexes.push(headerNewlineIndex);
              });

              startOffset = boundaryNewlineIndexes[i];
              endOffset = boundaryIndexes[i + 1];
              body = message.slice(startOffset, endOffset);
            } else {
              body = part;
            }
          } else {
            body = part;
          }

          result.body = httpMessageParser._isFakeBuffer(body) ? body.toString() : body;
          result.meta.body.byteOffset.start = startOffset;
          result.meta.body.byteOffset.end = endOffset;

          return result;
        });
      }
    })();

    return result;
  }

  httpMessageParser._isTruthy = function _isTruthy(v) {
    return !!v;
  };

  httpMessageParser._isNumeric = function _isNumeric(v) {
    if (typeof v === 'number' && !isNaN(v)) {
      return true;
    }

    v = (v||'').toString().trim();

    if (!v) {
      return false;
    }

    return !isNaN(v);
  };

  httpMessageParser._isBuffer = function(item) {
    return ((httpMessageParser._isNodeBufferSupported() &&
            typeof global === 'object' &&
            global.Buffer.isBuffer(item)) ||
            (item instanceof Object &&
             item._isBuffer));
  };

  httpMessageParser._isNodeBufferSupported = function() {
    return (typeof global === 'object' &&
            typeof global.Buffer === 'function' &&
            typeof global.Buffer.isBuffer === 'function');
  };

  httpMessageParser._parseHeaders = function _parseHeaders(body) {
    const headers = {};

    if (typeof body !== 'string') {
      return headers;
    }

    body.split(/[\r\n]/).forEach(function(string) {
      const match = string.match(/([\w-]+):\s*(.*)/i);

      if (Array.isArray(match) && match.length === 3) {
        const key = match[1];
        const value = match[2];

        headers[key] = httpMessageParser._isNumeric(value) ? Number(value) : value;
      }
    });

    return headers;
  };

  httpMessageParser._requestLineRegex = /HTTP\/(1\.0|1\.1|2\.0)\s+(\d+)\s+([\w\s-_]+)/i;
  httpMessageParser._responseLineRegex = /(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD|TRACE|CONNECT)\s+(.*)\s+HTTP\/(1\.0|1\.1|2\.0)/i;
  httpMessageParser._headerNewlineRegex = /^[\r\n]+/gim;
  httpMessageParser._boundaryRegex = /(\n|\r\n)+--[\w-]+(\n|\r\n)+/g;

  httpMessageParser._createBuffer = function(data) {
    if (httpMessageParser._isNodeBufferSupported()) {
      return new Buffer(data);
    }

    return new httpMessageParser._FakeBuffer(data);
  };

  httpMessageParser._isFakeBuffer = function isFakeBuffer(obj) {
    return obj instanceof httpMessageParser._FakeBuffer;
  };

  httpMessageParser._FakeBuffer = function FakeBuffer(data) {
    if (!(this instanceof httpMessageParser._FakeBuffer)) {
      return new httpMessageParser._FakeBuffer(data);
    }

    this.data = [];

    if (Array.isArray(data)) {
      this.data = data;
    } else if (typeof data === 'string') {
      this.data = [].slice.call(data);
    }

    function LiveObject() {}
    Object.defineProperty(LiveObject.prototype, 'length', {
      get: function() {
        return this.data.length;
      }.bind(this)
    });

    this.length = (new LiveObject()).length;
  };

  httpMessageParser._FakeBuffer.prototype.slice = function slice() {
    var newArray = [].slice.apply(this.data, arguments);
    return new httpMessageParser._FakeBuffer(newArray);
  };

  httpMessageParser._FakeBuffer.prototype.search = function search() {
    return [].search.apply(this.data, arguments);
  };

  httpMessageParser._FakeBuffer.prototype.indexOf = function indexOf() {
    return [].indexOf.apply(this.data, arguments);
  };

  httpMessageParser._FakeBuffer.prototype.toString = function toString() {
    return this.data.join('');
  };

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = httpMessageParser;
    }
    exports.httpMessageParser = httpMessageParser;
  } else if (typeof define === 'function' && define.amd) {
    define([], function() {
      return httpMessageParser;
    });
  } else {
    root.httpMessageParser = httpMessageParser;
  }

})(this);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)

},{"buffer":3}],18:[function(require,module,exports){
'use strict';

var Stringify = require('./stringify');
var Parse = require('./parse');

module.exports = {
    stringify: Stringify,
    parse: Parse
};

},{"./parse":19,"./stringify":20}],19:[function(require,module,exports){
'use strict';

var Utils = require('./utils');

var internals = {
    delimiter: '&',
    depth: 5,
    arrayLimit: 20,
    parameterLimit: 1000,
    strictNullHandling: false,
    plainObjects: false,
    allowPrototypes: false,
    allowDots: false
};

internals.parseValues = function (str, options) {
    var obj = {};
    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

    for (var i = 0; i < parts.length; ++i) {
        var part = parts[i];
        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

        if (pos === -1) {
            obj[Utils.decode(part)] = '';

            if (options.strictNullHandling) {
                obj[Utils.decode(part)] = null;
            }
        } else {
            var key = Utils.decode(part.slice(0, pos));
            var val = Utils.decode(part.slice(pos + 1));

            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = [].concat(obj[key]).concat(val);
            } else {
                obj[key] = val;
            }
        }
    }

    return obj;
};

internals.parseObject = function (chain, val, options) {
    if (!chain.length) {
        return val;
    }

    var root = chain.shift();

    var obj;
    if (root === '[]') {
        obj = [];
        obj = obj.concat(internals.parseObject(chain, val, options));
    } else {
        obj = options.plainObjects ? Object.create(null) : {};
        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
        var index = parseInt(cleanRoot, 10);
        if (
            !isNaN(index) &&
            root !== cleanRoot &&
            String(index) === cleanRoot &&
            index >= 0 &&
            (options.parseArrays && index <= options.arrayLimit)
        ) {
            obj = [];
            obj[index] = internals.parseObject(chain, val, options);
        } else {
            obj[cleanRoot] = internals.parseObject(chain, val, options);
        }
    }

    return obj;
};

internals.parseKeys = function (givenKey, val, options) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^\.\[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var parent = /^([^\[\]]*)/;
    var child = /(\[[^\[\]]*\])/g;

    // Get the parent

    var segment = parent.exec(key);

    // Stash the parent if it exists

    var keys = [];
    if (segment[1]) {
        // If we aren't using plain objects, optionally prefix keys
        // that would overwrite object prototype properties
        if (!options.plainObjects && Object.prototype.hasOwnProperty(segment[1])) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(segment[1]);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while ((segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {
            if (!options.allowPrototypes) {
                continue;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return internals.parseObject(keys, val, options);
};

module.exports = function (str, opts) {
    var options = opts || {};
    options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : internals.delimiter;
    options.depth = typeof options.depth === 'number' ? options.depth : internals.depth;
    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : internals.arrayLimit;
    options.parseArrays = options.parseArrays !== false;
    options.allowDots = typeof options.allowDots === 'boolean' ? options.allowDots : internals.allowDots;
    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : internals.plainObjects;
    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : internals.allowPrototypes;
    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : internals.parameterLimit;
    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;

    if (
        str === '' ||
        str === null ||
        typeof str === 'undefined'
    ) {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? internals.parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = internals.parseKeys(key, tempObj[key], options);
        obj = Utils.merge(obj, newObj, options);
    }

    return Utils.compact(obj);
};

},{"./utils":21}],20:[function(require,module,exports){
'use strict';

var Utils = require('./utils');

var internals = {
    delimiter: '&',
    arrayPrefixGenerators: {
        brackets: function (prefix) {
            return prefix + '[]';
        },
        indices: function (prefix, key) {
            return prefix + '[' + key + ']';
        },
        repeat: function (prefix) {
            return prefix;
        }
    },
    strictNullHandling: false,
    skipNulls: false,
    encode: true
};

internals.stringify = function (object, prefix, generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots) {
    var obj = object;
    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (Utils.isBuffer(obj)) {
        obj = String(obj);
    } else if (obj instanceof Date) {
        obj = obj.toISOString();
    } else if (obj === null) {
        if (strictNullHandling) {
            return encode ? Utils.encode(prefix) : prefix;
        }

        obj = '';
    }

    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        if (encode) {
            return [Utils.encode(prefix) + '=' + Utils.encode(obj)];
        }
        return [prefix + '=' + obj];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (Array.isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        if (Array.isArray(obj)) {
            values = values.concat(internals.stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots));
        } else {
            values = values.concat(internals.stringify(obj[key], prefix + (allowDots ? '.' + key : '[' + key + ']'), generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots));
        }
    }

    return values;
};

module.exports = function (object, opts) {
    var obj = object;
    var options = opts || {};
    var delimiter = typeof options.delimiter === 'undefined' ? internals.delimiter : options.delimiter;
    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;
    var skipNulls = typeof options.skipNulls === 'boolean' ? options.skipNulls : internals.skipNulls;
    var encode = typeof options.encode === 'boolean' ? options.encode : internals.encode;
    var sort = typeof options.sort === 'function' ? options.sort : null;
    var allowDots = typeof options.allowDots === 'undefined' ? false : options.allowDots;
    var objKeys;
    var filter;
    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (Array.isArray(options.filter)) {
        objKeys = filter = options.filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (options.arrayFormat in internals.arrayPrefixGenerators) {
        arrayFormat = options.arrayFormat;
    } else if ('indices' in options) {
        arrayFormat = options.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = internals.arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (sort) {
        objKeys.sort(sort);
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        keys = keys.concat(internals.stringify(obj[key], key, generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots));
    }

    return keys.join(delimiter);
};

},{"./utils":21}],21:[function(require,module,exports){
'use strict';

var hexTable = (function () {
    var array = new Array(256);
    for (var i = 0; i < 256; ++i) {
        array[i] = '%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase();
    }

    return array;
}());

exports.arrayToObject = function (source, options) {
    var obj = options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

exports.merge = function (target, source, options) {
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (Array.isArray(target)) {
            target.push(source);
        } else if (typeof target === 'object') {
            target[source] = true;
        } else {
            return [target, source];
        }

        return target;
    }

    if (typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (Array.isArray(target) && !Array.isArray(source)) {
        mergeTarget = exports.arrayToObject(target, options);
    }

	return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (Object.prototype.hasOwnProperty.call(acc, key)) {
            acc[key] = exports.merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
		return acc;
    }, mergeTarget);
};

exports.decode = function (str) {
    try {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    } catch (e) {
        return str;
    }
};

exports.encode = function (str) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = typeof str === 'string' ? str : String(str);

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D || // -
            c === 0x2E || // .
            c === 0x5F || // _
            c === 0x7E || // ~
            (c >= 0x30 && c <= 0x39) || // 0-9
            (c >= 0x41 && c <= 0x5A) || // a-z
            (c >= 0x61 && c <= 0x7A) // A-Z
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += (hexTable[0xF0 | (c >> 18)] + hexTable[0x80 | ((c >> 12) & 0x3F)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
    }

    return out;
};

exports.compact = function (obj, references) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    var refs = references || [];
    var lookup = refs.indexOf(obj);
    if (lookup !== -1) {
        return refs[lookup];
    }

    refs.push(obj);

    if (Array.isArray(obj)) {
        var compacted = [];

        for (var i = 0; i < obj.length; ++i) {
            if (typeof obj[i] !== 'undefined') {
                compacted.push(obj[i]);
            }
        }

        return compacted;
    }

    var keys = Object.keys(obj);
    for (var j = 0; j < keys.length; ++j) {
        var key = keys[j];
        obj[key] = exports.compact(obj[key], refs);
    }

    return obj;
};

exports.isRegExp = function (obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

exports.isBuffer = function (obj) {
    if (obj === null || typeof obj === 'undefined') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qcyIsIm5vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pc2FycmF5L2luZGV4LmpzIiwiLi4vaW5kZXguanMiLCIuLi9saWIvQVZTLmpzIiwiLi4vbGliL0FtYXpvbkVycm9yQ29kZXMuanMiLCIuLi9saWIvT2JzZXJ2YWJsZS5qcyIsIi4uL2xpYi9QbGF5ZXIuanMiLCIuLi9saWIvdXRpbHMvYXJyYXlCdWZmZXJUb0F1ZGlvQnVmZmVyLmpzIiwiLi4vbGliL3V0aWxzL2FycmF5QnVmZmVyVG9TdHJpbmcuanMiLCIuLi9saWIvdXRpbHMvZG93bnNhbXBsZUJ1ZmZlci5qcyIsIi4uL2xpYi91dGlscy9pbnRlcmxlYXZlLmpzIiwiLi4vbGliL3V0aWxzL21lcmdlQnVmZmVycy5qcyIsIi4uL2xpYi91dGlscy93cml0ZVVURkJ5dGVzLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2h0dHAtbWVzc2FnZS1wYXJzZXIvaHR0cC1tZXNzYWdlLXBhcnNlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9xcy9saWIvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvcXMvbGliL3BhcnNlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3FzL2xpYi9zdHJpbmdpZnkuanMiLCIuLi9ub2RlX21vZHVsZXMvcXMvbGliL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLE1BQU0sUUFBUSxLQUFSLENBQVo7QUFDQSxJQUFNLFNBQVMsSUFBSSxNQUFuQjs7QUFFQSxJQUFNLE1BQU0sSUFBSSxHQUFKLENBQVE7QUFDbEIsU0FBTyxJQURXO0FBRWxCLFlBQVUsK0RBRlE7QUFHbEIsWUFBVSxhQUhRO0FBSWxCLHNCQUFvQixNQUpG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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9xREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDTEEsQ0FBQyxZQUFXO0FBQ1Y7O0FBRUEsTUFBTSxNQUFNLFFBQVEsV0FBUixDQUFaOztBQUVBLE1BQUksT0FBTyxPQUFQLEtBQW1CLFdBQXZCLEVBQW9DO0FBQ2xDLFFBQUksT0FBTyxNQUFQLEtBQWtCLFdBQWxCLElBQWlDLE9BQU8sT0FBNUMsRUFBcUQ7QUFDbkQsZ0JBQVUsT0FBTyxPQUFQLEdBQWlCLEdBQTNCO0FBQ0Q7QUFDRCxZQUFRLEdBQVIsR0FBYyxHQUFkO0FBQ0Q7O0FBRUQsTUFBSSxPQUFPLE1BQVAsS0FBa0IsVUFBbEIsSUFBZ0MsT0FBTyxHQUEzQyxFQUFnRDtBQUM5QyxXQUFPLEVBQVAsRUFBVyxZQUFXO0FBQ3BCLGFBQU8sR0FBUDtBQUNELEtBRkQ7QUFHRDs7QUFFRCxNQUFJLFFBQU8sTUFBUCx5Q0FBTyxNQUFQLE9BQWtCLFFBQXRCLEVBQWdDO0FBQzlCLFdBQU8sR0FBUCxHQUFhLEdBQWI7QUFDRDtBQUNGLENBckJEOzs7QUNBQTs7Ozs7Ozs7QUFFQSxJQUFNLFNBQVMsUUFBUSxRQUFSLEVBQWtCLE1BQWpDO0FBQ0EsSUFBTSxLQUFLLFFBQVEsSUFBUixDQUFYO0FBQ0EsSUFBTSxvQkFBb0IsUUFBUSxxQkFBUixDQUExQjs7QUFFQSxJQUFNLHFCQUFxQixRQUFRLHVCQUFSLENBQTNCO0FBQ0EsSUFBTSxhQUFhLFFBQVEsaUJBQVIsQ0FBbkI7QUFDQSxJQUFNLFNBQVMsUUFBUSxhQUFSLENBQWY7QUFDQSxJQUFNLHNCQUFzQixRQUFRLGdDQUFSLENBQTVCO0FBQ0EsSUFBTSxnQkFBZ0IsUUFBUSwwQkFBUixDQUF0QjtBQUNBLElBQU0sZUFBZSxRQUFRLHlCQUFSLENBQXJCO0FBQ0EsSUFBTSxhQUFhLFFBQVEsdUJBQVIsQ0FBbkI7QUFDQSxJQUFNLG1CQUFtQixRQUFRLDZCQUFSLENBQXpCOztJQUVNLEc7QUFDSixpQkFBMEI7QUFBQSxRQUFkLE9BQWMseURBQUosRUFBSTs7QUFBQTs7QUFDeEIsZUFBVyxJQUFYOztBQUVBLFNBQUssV0FBTCxHQUFtQixJQUFuQjtBQUNBLFNBQUssY0FBTCxHQUFzQixDQUF0QjtBQUNBLFNBQUssZUFBTCxHQUF1QixDQUF2QjtBQUNBLFNBQUssWUFBTCxHQUFvQixFQUFwQjtBQUNBLFNBQUssYUFBTCxHQUFxQixFQUFyQjtBQUNBLFNBQUssYUFBTCxHQUFxQixJQUFyQjtBQUNBLFNBQUssU0FBTCxHQUFpQixJQUFqQjtBQUNBLFNBQUssV0FBTCxHQUFtQixJQUFuQjtBQUNBLFNBQUssaUJBQUwsR0FBeUIsS0FBekI7QUFDQSxTQUFLLFdBQUwsR0FBbUIsSUFBbkI7QUFDQSxTQUFLLFdBQUwsR0FBbUIsSUFBbkI7QUFDQSxTQUFLLE1BQUwsR0FBYyxLQUFkO0FBQ0EsU0FBSyxNQUFMLEdBQWMsSUFBZDtBQUNBLFNBQUssYUFBTCxHQUFxQixJQUFyQjtBQUNBLFNBQUssU0FBTCxHQUFpQixJQUFqQjtBQUNBLFNBQUssYUFBTCxHQUFxQixJQUFyQjtBQUNBLFNBQUssU0FBTCxHQUFnQixJQUFoQjtBQUNBLFNBQUssbUJBQUwsR0FBMkIsSUFBM0I7QUFDQSxTQUFLLFlBQUwsR0FBb0IsSUFBcEI7QUFDQSxTQUFLLFdBQUwsR0FBbUIsRUFBbkI7O0FBRUEsUUFBSSxRQUFRLEtBQVosRUFBbUI7QUFDakIsV0FBSyxRQUFMLENBQWMsUUFBUSxLQUF0QjtBQUNEOztBQUVELFFBQUksUUFBUSxZQUFaLEVBQTBCO0FBQ3hCLFdBQUssZUFBTCxDQUFxQixRQUFRLFlBQTdCO0FBQ0Q7O0FBRUQsUUFBSSxRQUFRLFFBQVosRUFBc0I7QUFDcEIsV0FBSyxXQUFMLENBQWlCLFFBQVEsUUFBekI7QUFDRDs7QUFFRCxRQUFJLFFBQVEsWUFBWixFQUEwQjtBQUN4QixXQUFLLGVBQUwsQ0FBcUIsUUFBUSxZQUE3QjtBQUNEOztBQUVELFFBQUksUUFBUSxRQUFaLEVBQXNCO0FBQ3BCLFdBQUssV0FBTCxDQUFpQixRQUFRLFFBQXpCO0FBQ0Q7O0FBRUQsUUFBSSxRQUFRLGtCQUFaLEVBQWdDO0FBQzlCLFdBQUsscUJBQUwsQ0FBMkIsUUFBUSxrQkFBbkM7QUFDRDs7QUFFRCxRQUFJLFFBQVEsV0FBWixFQUF5QjtBQUN2QixXQUFLLGNBQUwsQ0FBb0IsUUFBUSxXQUE1QjtBQUNEOztBQUVELFFBQUksUUFBUSxLQUFaLEVBQW1CO0FBQ2pCLFdBQUssUUFBTCxDQUFjLFFBQVEsS0FBdEI7QUFDRDs7QUFFRCxTQUFLLE1BQUwsR0FBYyxJQUFJLE1BQUosRUFBZDtBQUNEOzs7O3lCQUVJLEksRUFBTSxPLEVBQVM7QUFBQTs7QUFDbEIsVUFBSSxRQUFRLENBQUMsT0FBYixFQUFzQjtBQUNwQixrQkFBVSxJQUFWO0FBQ0EsZUFBTyxLQUFQO0FBQ0Q7O0FBRUQsaUJBQVcsWUFBTTtBQUNmLGNBQUssSUFBTCxDQUFVLElBQUksVUFBSixDQUFlLEdBQXpCLEVBQThCLE9BQTlCO0FBQ0QsT0FGRCxFQUVHLENBRkg7O0FBSUEsVUFBSSxLQUFLLE1BQVQsRUFBaUI7QUFDZixnQkFBUSxJQUFSLEVBQWMsT0FBZDtBQUNEO0FBQ0Y7Ozs0QkFFbUI7QUFBQSxVQUFkLE9BQWMseURBQUosRUFBSTs7QUFDbEIsYUFBTyxLQUFLLGVBQUwsQ0FBcUIsT0FBckIsQ0FBUDtBQUNEOzs7NkJBRVE7QUFBQTs7QUFDUCxhQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsZUFBSyxNQUFMLEdBQWMsSUFBZDtBQUNBLGVBQUssYUFBTCxHQUFxQixJQUFyQjtBQUNBLGVBQUssSUFBTCxDQUFVLElBQUksVUFBSixDQUFlLE1BQXpCO0FBQ0EsZUFBSyxJQUFMLENBQVUsWUFBVjtBQUNBO0FBQ0QsT0FOTSxDQUFQO0FBT0Q7OztzQ0FFb0U7QUFBQTs7QUFBQSxVQUFyRCxPQUFxRCx5REFBM0MsRUFBQyxjQUFjLE9BQWYsRUFBd0IsV0FBVyxLQUFuQyxFQUEyQzs7QUFDbkUsYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLFlBQUksT0FBTyxRQUFRLFlBQWYsS0FBZ0MsV0FBcEMsRUFBaUQ7QUFDL0Msa0JBQVEsWUFBUixHQUF1QixPQUF2QjtBQUNEOztBQUVELFlBQUksT0FBTyxRQUFRLFlBQWYsS0FBZ0MsUUFBcEMsRUFBOEM7QUFDNUMsY0FBTSxRQUFRLElBQUksS0FBSixDQUFVLCtCQUFWLENBQWQ7QUFDQSxpQkFBSyxJQUFMLENBQVUsS0FBVjtBQUNBLGlCQUFPLE9BQU8sS0FBUCxDQUFQO0FBQ0Q7O0FBRUQsWUFBTSxZQUFZLENBQUMsQ0FBQyxRQUFRLFNBQTVCOztBQUVBLFlBQU0sZUFBZSxRQUFRLFlBQTdCOztBQUVBLFlBQUksRUFBRSxpQkFBaUIsTUFBakIsSUFBMkIsaUJBQWlCLE9BQTlDLENBQUosRUFBNEQ7QUFDMUQsY0FBTSxTQUFRLElBQUksS0FBSixDQUFVLGtEQUFWLENBQWQ7QUFDQSxpQkFBSyxJQUFMLENBQVUsTUFBVjtBQUNBLGlCQUFPLE9BQU8sTUFBUCxDQUFQO0FBQ0Q7O0FBRUQsWUFBTSxRQUFRLFdBQWQ7QUFDQSxZQUFNLGdDQUNILEtBREcsRUFDSztBQUNQLHFCQUFXLE9BQUssU0FEVDtBQUVQLHFDQUEyQjtBQUN6QixnQ0FBb0IsT0FBSztBQURBO0FBRnBCLFNBREwsQ0FBTjs7QUFTQSxZQUFNLHNEQUFvRCxPQUFLLFNBQXpELGVBQTRFLG1CQUFtQixLQUFuQixDQUE1RSxvQkFBb0gsbUJBQW1CLEtBQUssU0FBTCxDQUFlLFNBQWYsQ0FBbkIsQ0FBcEgsdUJBQW1MLFlBQW5MLHNCQUFnTixVQUFVLE9BQUssWUFBZixDQUF0Tjs7QUFFQSxZQUFJLFNBQUosRUFBZTtBQUNiLGlCQUFPLElBQVAsQ0FBWSxPQUFaO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsaUJBQU8sUUFBUCxDQUFnQixJQUFoQixHQUF1QixPQUF2QjtBQUNEO0FBQ0YsT0F0Q00sQ0FBUDtBQXVDRDs7O3FDQUVnQixJLEVBQU07QUFBQTs7QUFDckIsYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLFlBQUksT0FBTyxJQUFQLEtBQWdCLFFBQXBCLEVBQThCO0FBQzVCLGNBQU0sUUFBUSxJQUFJLFNBQUosQ0FBYywwQkFBZCxDQUFkO0FBQ0EsaUJBQUssSUFBTCxDQUFVLEtBQVY7QUFDQSxpQkFBTyxPQUFPLEtBQVAsQ0FBUDtBQUNEOztBQUVELFlBQU0sWUFBWSxvQkFBbEI7QUFDQSxZQUFNLDJCQUF5QixTQUF6QixjQUEyQyxJQUEzQyxtQkFBNkQsT0FBSyxTQUFsRSx1QkFBNkYsT0FBSyxhQUFsRyxzQkFBZ0ksbUJBQW1CLE9BQUssWUFBeEIsQ0FBdEk7QUFDQSxZQUFNLE1BQU0sc0NBQVo7O0FBRUEsWUFBTSxNQUFNLElBQUksY0FBSixFQUFaOztBQUVBLFlBQUksSUFBSixDQUFTLE1BQVQsRUFBaUIsR0FBakIsRUFBc0IsSUFBdEI7QUFDQSxZQUFJLGdCQUFKLENBQXFCLGNBQXJCLEVBQXFDLGlEQUFyQztBQUNBLFlBQUksTUFBSixHQUFhLFVBQUMsS0FBRCxFQUFXO0FBQ3RCLGNBQUksV0FBVyxJQUFJLFFBQW5COztBQUVBLGNBQUk7QUFDRix1QkFBVyxLQUFLLEtBQUwsQ0FBVyxJQUFJLFFBQWYsQ0FBWDtBQUNELFdBRkQsQ0FFRSxPQUFPLEtBQVAsRUFBYztBQUNkLG1CQUFLLElBQUwsQ0FBVSxLQUFWO0FBQ0EsbUJBQU8sT0FBTyxLQUFQLENBQVA7QUFDRDs7QUFFRCxjQUFNLFdBQVcsb0JBQW9CLE1BQXJDO0FBQ0EsY0FBTSxtQkFBbUIsWUFBWSxTQUFTLGlCQUE5Qzs7QUFFQSxjQUFJLGdCQUFKLEVBQXNCO0FBQ3BCLGdCQUFNLFVBQVEsSUFBSSxLQUFKLENBQVUsZ0JBQVYsQ0FBZDtBQUNBLG1CQUFLLElBQUwsQ0FBVSxPQUFWO0FBQ0EsbUJBQU8sT0FBTyxPQUFQLENBQVA7QUFDRDs7QUFFRCxjQUFNLFFBQVEsU0FBUyxZQUF2QjtBQUNBLGNBQU0sZUFBZSxTQUFTLGFBQTlCO0FBQ0EsY0FBTSxZQUFZLFNBQVMsVUFBM0I7QUFDQSxjQUFNLFlBQVksU0FBUyxTQUEzQjs7QUFFQSxpQkFBSyxRQUFMLENBQWMsS0FBZDtBQUNBLGlCQUFLLGVBQUwsQ0FBcUIsWUFBckI7O0FBRUEsaUJBQUssSUFBTCxDQUFVLElBQUksVUFBSixDQUFlLEtBQXpCO0FBQ0EsaUJBQUssSUFBTCxDQUFVLFlBQVY7QUFDQSxrQkFBUSxRQUFSO0FBQ0QsU0E5QkQ7O0FBZ0NBLFlBQUksT0FBSixHQUFjLFVBQUMsS0FBRCxFQUFXO0FBQ3ZCLGlCQUFLLElBQUwsQ0FBVSxLQUFWO0FBQ0EsaUJBQU8sS0FBUDtBQUNELFNBSEQ7O0FBS0EsWUFBSSxJQUFKLENBQVMsUUFBVDtBQUNELE9BckRNLENBQVA7QUFzREQ7OzttQ0FFYztBQUFBOztBQUNiLGFBQU8sS0FBSyx3QkFBTCxDQUE4QixLQUFLLGFBQW5DLEVBQ04sSUFETSxDQUNELFlBQU07QUFDVixlQUFPO0FBQ0wsaUJBQU8sT0FBSyxNQURQO0FBRUwsd0JBQWMsT0FBSztBQUZkLFNBQVA7QUFJRCxPQU5NLENBQVA7QUFPRDs7OytDQUUyRDtBQUFBOztBQUFBLFVBQW5DLFlBQW1DLHlEQUFwQixLQUFLLGFBQWU7O0FBQzFELGFBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxZQUFJLE9BQU8sWUFBUCxLQUF3QixRQUE1QixFQUFzQztBQUNwQyxjQUFNLFFBQVEsSUFBSSxLQUFKLENBQVUsK0JBQVYsQ0FBZDtBQUNBLGlCQUFLLElBQUwsQ0FBVSxLQUFWO0FBQ0EsaUJBQU8sT0FBTyxLQUFQLENBQVA7QUFDRDs7QUFFRCxZQUFNLFlBQVksZUFBbEI7QUFDQSxZQUFNLDJCQUF5QixTQUF6Qix1QkFBb0QsWUFBcEQsbUJBQThFLE9BQUssU0FBbkYsdUJBQThHLE9BQUssYUFBbkgsc0JBQWlKLG1CQUFtQixPQUFLLFlBQXhCLENBQXZKO0FBQ0EsWUFBTSxNQUFNLHNDQUFaO0FBQ0EsWUFBTSxNQUFNLElBQUksY0FBSixFQUFaOztBQUVBLFlBQUksSUFBSixDQUFTLE1BQVQsRUFBaUIsR0FBakIsRUFBc0IsSUFBdEI7QUFDQSxZQUFJLGdCQUFKLENBQXFCLGNBQXJCLEVBQXFDLGlEQUFyQztBQUNBLFlBQUksWUFBSixHQUFtQixNQUFuQjtBQUNBLFlBQUksTUFBSixHQUFhLFVBQUMsS0FBRCxFQUFXO0FBQ3RCLGNBQU0sV0FBVyxJQUFJLFFBQXJCOztBQUVBLGNBQUksU0FBUyxLQUFiLEVBQW9CO0FBQ2xCLGdCQUFNLFVBQVEsU0FBUyxLQUFULENBQWUsT0FBN0I7QUFDQSxtQkFBSyxJQUFMLENBQVUsSUFBSSxVQUFKLENBQWUsS0FBekIsRUFBZ0MsT0FBaEM7O0FBRUEsbUJBQU8sT0FBTyxPQUFQLENBQVA7QUFDRCxXQUxELE1BS1E7QUFDTixnQkFBTSxRQUFRLFNBQVMsWUFBdkI7QUFDQSxnQkFBTSxnQkFBZSxTQUFTLGFBQTlCOztBQUVBLG1CQUFLLFFBQUwsQ0FBYyxLQUFkO0FBQ0EsbUJBQUssZUFBTCxDQUFxQixhQUFyQjs7QUFFQSxtQkFBTyxRQUFRLEtBQVIsQ0FBUDtBQUNEO0FBQ0YsU0FqQkQ7O0FBbUJBLFlBQUksT0FBSixHQUFjLFVBQUMsS0FBRCxFQUFXO0FBQ3ZCLGlCQUFLLElBQUwsQ0FBVSxLQUFWO0FBQ0EsaUJBQU8sS0FBUDtBQUNELFNBSEQ7O0FBS0EsWUFBSSxJQUFKLENBQVMsUUFBVDtBQUNELE9BeENNLENBQVA7QUF5Q0Q7OztzQ0FFaUI7QUFBQTs7QUFDaEIsYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLFlBQUksT0FBTyxPQUFPLFFBQVAsQ0FBZ0IsSUFBaEIsQ0FBcUIsTUFBckIsQ0FBNEIsQ0FBNUIsQ0FBWDs7QUFFQSxZQUFNLFFBQVEsR0FBRyxLQUFILENBQVMsSUFBVCxDQUFkO0FBQ0EsWUFBTSxRQUFRLE1BQU0sWUFBcEI7QUFDQSxZQUFNLGVBQWUsTUFBTSxhQUEzQjtBQUNBLFlBQU0sWUFBWSxNQUFNLFVBQXhCO0FBQ0EsWUFBTSxZQUFZLE1BQU0sU0FBeEI7O0FBRUEsWUFBSSxLQUFKLEVBQVc7QUFDVCxpQkFBSyxRQUFMLENBQWMsS0FBZDtBQUNBLGlCQUFLLElBQUwsQ0FBVSxJQUFJLFVBQUosQ0FBZSxLQUF6QjtBQUNBLGlCQUFLLElBQUwsQ0FBVSxZQUFWOztBQUVBLGNBQUksWUFBSixFQUFrQjtBQUNoQixtQkFBSyxlQUFMLENBQXFCLFlBQXJCO0FBQ0Q7O0FBRUQsaUJBQU8sUUFBUSxLQUFSLENBQVA7QUFDRDs7QUFFRCxlQUFPLFFBQVA7QUFDRCxPQXRCTSxDQUFQO0FBdUJEOzs7cUNBRWdCO0FBQ2YsYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLFlBQU0sUUFBUSxHQUFHLEtBQUgsQ0FBUyxPQUFPLFFBQVAsQ0FBZ0IsTUFBaEIsQ0FBdUIsTUFBdkIsQ0FBOEIsQ0FBOUIsQ0FBVCxDQUFkO0FBQ0EsWUFBTSxPQUFPLE1BQU0sSUFBbkI7O0FBRUEsWUFBSSxJQUFKLEVBQVU7QUFDUixpQkFBTyxRQUFRLElBQVIsQ0FBUDtBQUNEOztBQUVELGVBQU8sT0FBTyxJQUFQLENBQVA7QUFDRCxPQVRNLENBQVA7QUFVRDs7OzZCQUVRLEssRUFBTztBQUFBOztBQUNkLGFBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxZQUFJLE9BQU8sS0FBUCxLQUFpQixRQUFyQixFQUErQjtBQUM3QixpQkFBSyxNQUFMLEdBQWMsS0FBZDtBQUNBLGlCQUFLLElBQUwsQ0FBVSxJQUFJLFVBQUosQ0FBZSxTQUF6QjtBQUNBLGlCQUFLLElBQUwsQ0FBVSxZQUFWO0FBQ0Esa0JBQVEsT0FBSyxNQUFiO0FBQ0QsU0FMRCxNQUtPO0FBQ0wsY0FBTSxRQUFRLElBQUksU0FBSixDQUFjLDJCQUFkLENBQWQ7QUFDQSxpQkFBSyxJQUFMLENBQVUsS0FBVjtBQUNBLGlCQUFPLEtBQVA7QUFDRDtBQUNGLE9BWE0sQ0FBUDtBQVlEOzs7b0NBRWUsWSxFQUFjO0FBQUE7O0FBQzVCLGFBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxZQUFJLE9BQU8sWUFBUCxLQUF3QixRQUE1QixFQUFzQztBQUNwQyxpQkFBSyxhQUFMLEdBQXFCLFlBQXJCO0FBQ0EsaUJBQUssSUFBTCxDQUFVLElBQUksVUFBSixDQUFlLGlCQUF6QjtBQUNBLGlCQUFLLElBQUwsQ0FBVSxvQkFBVjtBQUNBLGtCQUFRLE9BQUssYUFBYjtBQUNELFNBTEQsTUFLTztBQUNMLGNBQU0sUUFBUSxJQUFJLFNBQUosQ0FBYyxrQ0FBZCxDQUFkO0FBQ0EsaUJBQUssSUFBTCxDQUFVLEtBQVY7QUFDQSxpQkFBTyxLQUFQO0FBQ0Q7QUFDRixPQVhNLENBQVA7QUFZRDs7O2dDQUVXLFEsRUFBVTtBQUFBOztBQUNwQixhQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsWUFBSSxPQUFPLFFBQVAsS0FBb0IsUUFBeEIsRUFBa0M7QUFDaEMsa0JBQUssU0FBTCxHQUFpQixRQUFqQjtBQUNBLGtCQUFRLFFBQUssU0FBYjtBQUNELFNBSEQsTUFHTztBQUNMLGNBQU0sUUFBUSxJQUFJLFNBQUosQ0FBYyw4QkFBZCxDQUFkO0FBQ0Esa0JBQUssSUFBTCxDQUFVLEtBQVY7QUFDQSxpQkFBTyxLQUFQO0FBQ0Q7QUFDRixPQVRNLENBQVA7QUFVRDs7O29DQUVlLFksRUFBYztBQUFBOztBQUM1QixhQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsWUFBSSxPQUFPLFlBQVAsS0FBd0IsUUFBNUIsRUFBc0M7QUFDcEMsa0JBQUssYUFBTCxHQUFxQixZQUFyQjtBQUNBLGtCQUFRLFFBQUssYUFBYjtBQUNELFNBSEQsTUFHTztBQUNMLGNBQU0sUUFBUSxJQUFJLFNBQUosQ0FBYyxpQ0FBZCxDQUFkO0FBQ0Esa0JBQUssSUFBTCxDQUFVLEtBQVY7QUFDQSxpQkFBTyxLQUFQO0FBQ0Q7QUFDRixPQVRNLENBQVA7QUFVRDs7O2dDQUVXLFEsRUFBVTtBQUFBOztBQUNwQixhQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsWUFBSSxPQUFPLFFBQVAsS0FBb0IsUUFBeEIsRUFBa0M7QUFDaEMsa0JBQUssU0FBTCxHQUFpQixRQUFqQjtBQUNBLGtCQUFRLFFBQUssU0FBYjtBQUNELFNBSEQsTUFHTztBQUNMLGNBQU0sUUFBUSxJQUFJLFNBQUosQ0FBYyw4QkFBZCxDQUFkO0FBQ0Esa0JBQUssSUFBTCxDQUFVLEtBQVY7QUFDQSxpQkFBTyxLQUFQO0FBQ0Q7QUFDRixPQVRNLENBQVA7QUFVRDs7OzBDQUVxQixrQixFQUFvQjtBQUFBOztBQUN4QyxhQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsWUFBSSxPQUFPLGtCQUFQLEtBQThCLFFBQTlCLElBQTBDLE9BQU8sa0JBQVAsS0FBOEIsUUFBNUUsRUFBc0Y7QUFDcEYsa0JBQUssbUJBQUwsR0FBMkIsa0JBQTNCO0FBQ0Esa0JBQVEsUUFBSyxtQkFBYjtBQUNELFNBSEQsTUFHTztBQUNMLGNBQU0sUUFBUSxJQUFJLFNBQUosQ0FBYyxrREFBZCxDQUFkO0FBQ0Esa0JBQUssSUFBTCxDQUFVLEtBQVY7QUFDQSxpQkFBTyxLQUFQO0FBQ0Q7QUFDRixPQVRNLENBQVA7QUFVRDs7O21DQUVjLFcsRUFBYTtBQUFBOztBQUMxQixhQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsWUFBSSxPQUFPLFdBQVAsS0FBdUIsUUFBM0IsRUFBcUM7QUFDbkMsa0JBQUssWUFBTCxHQUFvQixXQUFwQjtBQUNBLGtCQUFRLFFBQUssWUFBYjtBQUNELFNBSEQsTUFHTztBQUNMLGNBQU0sUUFBUSxJQUFJLFNBQUosQ0FBYyxpQ0FBZCxDQUFkO0FBQ0Esa0JBQUssSUFBTCxDQUFVLEtBQVY7QUFDQSxpQkFBTyxLQUFQO0FBQ0Q7QUFDRixPQVRNLENBQVA7QUFVRDs7OzZCQUVRLEssRUFBTztBQUFBOztBQUNkLGFBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxZQUFJLE9BQU8sS0FBUCxLQUFpQixTQUFyQixFQUFnQztBQUM5QixrQkFBSyxNQUFMLEdBQWMsS0FBZDtBQUNBLGtCQUFRLFFBQUssTUFBYjtBQUNELFNBSEQsTUFHTztBQUNMLGNBQU0sUUFBUSxJQUFJLFNBQUosQ0FBYyw0QkFBZCxDQUFkO0FBQ0Esa0JBQUssSUFBTCxDQUFVLEtBQVY7QUFDQSxpQkFBTyxLQUFQO0FBQ0Q7QUFDRixPQVRNLENBQVA7QUFVRDs7OytCQUVVO0FBQUE7O0FBQ1QsYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLFlBQU0sUUFBUSxRQUFLLE1BQW5COztBQUVBLFlBQUksS0FBSixFQUFXO0FBQ1QsaUJBQU8sUUFBUSxLQUFSLENBQVA7QUFDRDs7QUFFRCxlQUFPLFFBQVA7QUFDRCxPQVJNLENBQVA7QUFTRDs7O3NDQUVpQjtBQUFBOztBQUNoQixhQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsWUFBTSxlQUFlLFFBQUssYUFBMUI7O0FBRUEsWUFBSSxZQUFKLEVBQWtCO0FBQ2hCLGlCQUFPLFFBQVEsWUFBUixDQUFQO0FBQ0Q7O0FBRUQsZUFBTyxRQUFQO0FBQ0QsT0FSTSxDQUFQO0FBU0Q7OztpQ0FFWTtBQUFBOztBQUNYLGFBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxnQkFBSyxJQUFMLENBQVUsd0JBQVY7OztBQUdBLFlBQUksQ0FBQyxVQUFVLFlBQWYsRUFBNkI7QUFDM0Isb0JBQVUsWUFBVixHQUF5QixVQUFVLFlBQVYsSUFBMEIsVUFBVSxrQkFBcEMsSUFDdkIsVUFBVSxlQURhLElBQ00sVUFBVSxjQUR6QztBQUVEOztBQUVELGtCQUFVLFlBQVYsQ0FBdUI7QUFDckIsaUJBQU87QUFEYyxTQUF2QixFQUVHLFVBQUMsTUFBRCxFQUFZO0FBQ2Isa0JBQUssSUFBTCxDQUFVLHVCQUFWO0FBQ0EsaUJBQU8sUUFBSyxrQkFBTCxDQUF3QixNQUF4QixFQUFnQyxJQUFoQyxDQUFxQyxPQUFyQyxDQUFQO0FBQ0QsU0FMRCxFQUtHLFVBQUMsS0FBRCxFQUFXO0FBQ1osa0JBQUssSUFBTCxDQUFVLE9BQVYsRUFBbUIsS0FBbkI7QUFDQSxrQkFBSyxJQUFMLENBQVUsSUFBSSxVQUFKLENBQWUsS0FBekIsRUFBZ0MsS0FBaEM7QUFDQSxpQkFBTyxPQUFPLEtBQVAsQ0FBUDtBQUNELFNBVEQ7QUFVRCxPQW5CTSxDQUFQO0FBb0JEOzs7dUNBRWtCLE0sRUFBUTtBQUFBOztBQUN6QixhQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsWUFBTSxnQkFBZ0IsT0FBTyxTQUFQLENBQWlCLFFBQWpCLENBQTBCLElBQTFCLENBQStCLE1BQS9CLE1BQTJDLHNCQUFqRTs7QUFFQSxZQUFJLENBQUMsYUFBTCxFQUFvQjtBQUNsQixjQUFNLFFBQVEsSUFBSSxTQUFKLENBQWMsMENBQWQsQ0FBZDtBQUNBLGtCQUFLLElBQUwsQ0FBVSxPQUFWLEVBQW1CLEtBQW5CO0FBQ0Esa0JBQUssSUFBTCxDQUFVLElBQUksVUFBSixDQUFlLEtBQXpCLEVBQWdDLEtBQWhDO0FBQ0EsaUJBQU8sT0FBTyxLQUFQLENBQVA7QUFDRDs7QUFFRCxnQkFBSyxhQUFMLEdBQXFCLElBQUksWUFBSixFQUFyQjtBQUNBLGdCQUFLLFdBQUwsR0FBbUIsUUFBSyxhQUFMLENBQW1CLFVBQXRDOztBQUVBLGdCQUFLLElBQUwsbUJBQTBCLFFBQUssV0FBL0I7O0FBRUEsZ0JBQUssV0FBTCxHQUFtQixRQUFLLGFBQUwsQ0FBbUIsVUFBbkIsRUFBbkI7QUFDQSxnQkFBSyxXQUFMLEdBQW1CLFFBQUssYUFBTCxDQUFtQix1QkFBbkIsQ0FBMkMsTUFBM0MsQ0FBbkI7O0FBRUEsZ0JBQUssV0FBTCxDQUFpQixPQUFqQixDQUF5QixRQUFLLFdBQTlCOztBQUVBLGdCQUFLLFNBQUwsR0FBaUIsUUFBSyxhQUFMLENBQW1CLHFCQUFuQixDQUF5QyxRQUFLLFdBQTlDLEVBQTJELFFBQUssY0FBaEUsRUFBZ0YsUUFBSyxlQUFyRixDQUFqQjs7QUFFQSxnQkFBSyxTQUFMLENBQWUsY0FBZixHQUFnQyxVQUFDLEtBQUQsRUFBVztBQUN6QyxjQUFJLENBQUMsUUFBSyxZQUFWLEVBQXdCO0FBQ3RCLG1CQUFPLEtBQVA7QUFDRDs7QUFFRCxjQUFNLE9BQU8sTUFBTSxXQUFOLENBQWtCLGNBQWxCLENBQWlDLENBQWpDLENBQWI7QUFDQSxrQkFBSyxZQUFMLENBQWtCLElBQWxCLENBQXVCLElBQUksWUFBSixDQUFpQixJQUFqQixDQUF2Qjs7QUFFQSxjQUFJLFFBQUssY0FBTCxHQUFzQixDQUExQixFQUE2QjtBQUMzQixnQkFBTSxRQUFRLE1BQU0sV0FBTixDQUFrQixjQUFsQixDQUFpQyxDQUFqQyxDQUFkO0FBQ0Esb0JBQUssYUFBTCxDQUFtQixJQUFuQixDQUF3QixJQUFJLFlBQUosQ0FBaUIsS0FBakIsQ0FBeEI7QUFDRDs7QUFFRCxrQkFBSyxnQkFBTCxJQUF5QixRQUFLLFdBQTlCO0FBQ0QsU0FkRDs7QUFnQkEsZ0JBQUssV0FBTCxDQUFpQixPQUFqQixDQUF5QixRQUFLLFNBQTlCO0FBQ0EsZ0JBQUssU0FBTCxDQUFlLE9BQWYsQ0FBdUIsUUFBSyxhQUFMLENBQW1CLFdBQTFDO0FBQ0EsZ0JBQUssSUFBTDs7QUFFQSxlQUFPLFFBQVEsTUFBUixDQUFQO0FBQ0QsT0EzQ00sQ0FBUDtBQTRDRDs7O3FDQUVnQjtBQUFBOztBQUNmLGFBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxZQUFJLENBQUMsUUFBSyxXQUFWLEVBQXVCO0FBQ3JCLGNBQU0sUUFBUSxJQUFJLEtBQUosQ0FBVSw0QkFBVixDQUFkO0FBQ0Esa0JBQUssSUFBTCxDQUFVLE9BQVYsRUFBbUIsS0FBbkI7QUFDQSxrQkFBSyxJQUFMLENBQVUsSUFBSSxVQUFKLENBQWUsS0FBekIsRUFBZ0MsS0FBaEM7QUFDQSxpQkFBTyxPQUFPLEtBQVAsQ0FBUDtBQUNEOztBQUVELGdCQUFLLFlBQUwsR0FBb0IsSUFBcEI7QUFDQSxnQkFBSyxZQUFMLENBQWtCLE1BQWxCLEdBQTJCLFFBQUssYUFBTCxDQUFtQixNQUFuQixHQUE0QixDQUF2RDtBQUNBLGdCQUFLLGdCQUFMLEdBQXdCLENBQXhCO0FBQ0EsZ0JBQUssSUFBTDtBQUNBLGdCQUFLLElBQUwsQ0FBVSxJQUFJLFVBQUosQ0FBZSxZQUF6Qjs7QUFFQSxlQUFPLFNBQVA7QUFDRCxPQWZNLENBQVA7QUFnQkQ7OztvQ0FFZTtBQUFBOztBQUNkLGFBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxZQUFJLENBQUMsUUFBSyxZQUFWLEVBQXdCO0FBQ3RCLGtCQUFLLElBQUwsQ0FBVSxJQUFJLFVBQUosQ0FBZSxXQUF6QjtBQUNBLGtCQUFLLElBQUwsQ0FBVSxvQkFBVjtBQUNBLGlCQUFPLFNBQVA7QUFDRDs7QUFFRCxnQkFBSyxZQUFMLEdBQW9CLEtBQXBCOztBQUVBLFlBQU0sYUFBYSxhQUFhLFFBQUssWUFBbEIsRUFBZ0MsUUFBSyxnQkFBckMsQ0FBbkI7QUFDQSxZQUFJLGNBQWMsSUFBbEI7O0FBRUEsWUFBSSxRQUFLLGVBQUwsR0FBdUIsQ0FBM0IsRUFBOEI7QUFDNUIsY0FBTSxjQUFjLGFBQWEsUUFBSyxhQUFsQixFQUFpQyxRQUFLLGdCQUF0QyxDQUFwQjtBQUNBLHdCQUFjLFdBQVcsVUFBWCxFQUF1QixXQUF2QixDQUFkO0FBQ0QsU0FIRCxNQUdPO0FBQ0wsd0JBQWMsV0FBVyxVQUFYLENBQWQ7QUFDRDs7QUFFRCxzQkFBYyxpQkFBaUIsV0FBakIsRUFBOEIsUUFBSyxXQUFuQyxFQUFnRCxRQUFLLGlCQUFyRCxDQUFkOztBQUVBLFlBQU0sU0FBUyxJQUFJLFdBQUosQ0FBZ0IsS0FBSyxZQUFZLE1BQVosR0FBcUIsQ0FBMUMsQ0FBZjtBQUNBLFlBQU0sT0FBTyxJQUFJLFFBQUosQ0FBYSxNQUFiLENBQWI7Ozs7O0FBS0Esc0JBQWMsSUFBZCxFQUFvQixDQUFwQixFQUF1QixNQUF2QjtBQUNBLGFBQUssU0FBTCxDQUFlLENBQWYsRUFBa0IsS0FBSyxZQUFZLE1BQVosR0FBcUIsQ0FBNUMsRUFBK0MsSUFBL0M7QUFDQSxzQkFBYyxJQUFkLEVBQW9CLENBQXBCLEVBQXVCLE1BQXZCO0FBQ0Esc0JBQWMsSUFBZCxFQUFvQixFQUFwQixFQUF3QixNQUF4QjtBQUNBLGFBQUssU0FBTCxDQUFlLEVBQWYsRUFBbUIsRUFBbkIsRUFBdUIsSUFBdkI7QUFDQSxhQUFLLFNBQUwsQ0FBZSxFQUFmLEVBQW1CLENBQW5CLEVBQXNCLElBQXRCO0FBQ0EsYUFBSyxTQUFMLENBQWUsRUFBZixFQUFtQixRQUFLLGVBQXhCLEVBQXlDLElBQXpDO0FBQ0EsYUFBSyxTQUFMLENBQWUsRUFBZixFQUFtQixRQUFLLGlCQUF4QixFQUEyQyxJQUEzQztBQUNBLGFBQUssU0FBTCxDQUFlLEVBQWYsRUFBbUIsUUFBSyxpQkFBTCxHQUF5QixDQUE1QyxFQUErQyxJQUEvQztBQUNBLGFBQUssU0FBTCxDQUFlLEVBQWYsRUFBbUIsQ0FBbkIsRUFBc0IsSUFBdEI7QUFDQSxhQUFLLFNBQUwsQ0FBZSxFQUFmLEVBQW1CLEVBQW5CLEVBQXVCLElBQXZCO0FBQ0Esc0JBQWMsSUFBZCxFQUFvQixFQUFwQixFQUF3QixNQUF4QjtBQUNBLGFBQUssU0FBTCxDQUFlLEVBQWYsRUFBbUIsWUFBWSxNQUFaLEdBQXFCLENBQXhDLEVBQTJDLElBQTNDOztBQUVBLFlBQU0sU0FBUyxZQUFZLE1BQTNCO0FBQ0EsWUFBTSxTQUFTLENBQWY7QUFDQSxZQUFJLFFBQVEsRUFBWjs7QUFFQSxhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksTUFBcEIsRUFBNEIsR0FBNUIsRUFBZ0M7QUFDOUIsZUFBSyxRQUFMLENBQWMsS0FBZCxFQUFxQixZQUFZLENBQVosS0FBa0IsU0FBUyxNQUEzQixDQUFyQixFQUF5RCxJQUF6RDtBQUNBLG1CQUFTLENBQVQ7QUFDRDs7QUFFRCxnQkFBSyxJQUFMO0FBQ0EsZ0JBQUssSUFBTCxDQUFVLElBQUksVUFBSixDQUFlLFdBQXpCO0FBQ0EsZUFBTyxRQUFRLElBQVIsQ0FBUDtBQUNELE9BckRNLENBQVA7QUFzREQ7Ozs4QkFFVSxRLEVBQVU7QUFBQTs7QUFDbkIsYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLFlBQU0sTUFBTSxJQUFJLGNBQUosRUFBWjtBQUNBLFlBQU0sTUFBTSxzRUFBWjs7QUFFQSxZQUFJLElBQUosQ0FBUyxNQUFULEVBQWlCLEdBQWpCLEVBQXNCLElBQXRCO0FBQ0EsWUFBSSxZQUFKLEdBQW1CLGFBQW5CO0FBQ0EsWUFBSSxNQUFKLEdBQWEsVUFBQyxLQUFELEVBQVc7QUFDdEIsY0FBTSxTQUFTLElBQUksTUFBSixDQUFXLElBQUksUUFBZixDQUFmOztBQUVBLGNBQUksSUFBSSxNQUFKLEtBQWUsR0FBbkIsRUFBd0I7QUFDdEIsZ0JBQU0sZ0JBQWdCLGtCQUFrQixNQUFsQixDQUF0QjtBQUNBLG9CQUFRLEVBQUMsUUFBRCxFQUFNLFVBQVUsYUFBaEIsRUFBUjtBQUNELFdBSEQsTUFHTztBQUNMLGdCQUFJLFFBQVEsSUFBSSxLQUFKLENBQVUsZ0NBQVYsQ0FBWjtBQUNBLGdCQUFJLFdBQVcsRUFBZjs7QUFFQSxnQkFBSSxDQUFDLElBQUksUUFBSixDQUFhLFVBQWxCLEVBQThCO0FBQzVCLHNCQUFRLElBQUksS0FBSixDQUFVLGlCQUFWLENBQVI7QUFDRCxhQUZELE1BRU87QUFDTCxrQkFBSTtBQUNGLDJCQUFXLEtBQUssS0FBTCxDQUFXLG9CQUFvQixNQUFwQixDQUFYLENBQVg7QUFDRCxlQUZELENBRUUsT0FBTSxHQUFOLEVBQVc7QUFDWCx3QkFBUSxHQUFSO0FBQ0Q7QUFDRjs7QUFFRCxnQkFBSSxTQUFTLEtBQVQsWUFBMEIsTUFBOUIsRUFBc0M7QUFDcEMsa0JBQUksU0FBUyxLQUFULENBQWUsSUFBZixLQUF3QixtQkFBbUIsMkJBQS9DLEVBQTRFO0FBQzFFLHdCQUFLLElBQUwsQ0FBVSxJQUFJLFVBQUosQ0FBZSxhQUF6QjtBQUNEOztBQUVELHNCQUFRLFNBQVMsS0FBVCxDQUFlLE9BQXZCO0FBQ0Q7O0FBRUQsb0JBQUssSUFBTCxDQUFVLElBQUksVUFBSixDQUFlLEtBQXpCLEVBQWdDLEtBQWhDO0FBQ0EsbUJBQU8sT0FBTyxLQUFQLENBQVA7QUFDRDtBQUNGLFNBL0JEOztBQWlDQSxZQUFJLE9BQUosR0FBYyxVQUFDLEtBQUQsRUFBVztBQUN2QixrQkFBSyxJQUFMLENBQVUsS0FBVjtBQUNBLGlCQUFPLEtBQVA7QUFDRCxTQUhEOztBQUtBLFlBQU0sV0FBVyxjQUFqQjtBQUNBLFlBQU0sa0JBQWtCLElBQXhCO0FBQ0EsWUFBTSxVQUFVLE1BQWhCO0FBQ0EsWUFBTSwrQkFBK0IsaURBQXJDO0FBQ0EsWUFBTSx3QkFBd0IsK0NBQTlCO0FBQ0EsWUFBTSxxQkFBcUIsaURBQTNCO0FBQ0EsWUFBTSw0QkFBNEIsOENBQWxDOztBQUVBLFlBQU0sV0FBVztBQUNmLHlCQUFlLEVBREE7QUFFZix1QkFBYTtBQUNYLHFCQUFTLGtCQURFO0FBRVgsb0JBQVEsT0FGRztBQUdYLG9CQUFRO0FBSEc7QUFGRSxTQUFqQjs7QUFTQSxZQUFNLGdCQUFnQixDQUNwQixPQURvQixFQUNYLGVBRFcsRUFDTSxRQUROLEVBQ2dCLE9BRGhCLEVBQ3lCLDRCQUR6QixFQUN1RCxPQUR2RCxFQUNnRSxxQkFEaEUsRUFFcEIsT0FGb0IsRUFFWCxPQUZXLEVBRUYsS0FBSyxTQUFMLENBQWUsUUFBZixDQUZFLEVBRXdCLE9BRnhCLEVBRWlDLGVBRmpDLEVBRWtELFFBRmxELEVBRTRELE9BRjVELEVBR3BCLHlCQUhvQixFQUdPLE9BSFAsRUFHZ0Isa0JBSGhCLEVBR29DLE9BSHBDLEVBRzZDLE9BSDdDLEVBSXBCLElBSm9CLENBSWYsRUFKZSxDQUF0Qjs7QUFNQSxZQUFNLGNBQWMsQ0FBQyxPQUFELEVBQVUsZUFBVixFQUEyQixRQUEzQixFQUFxQyxlQUFyQyxFQUFzRCxPQUF0RCxFQUErRCxJQUEvRCxDQUFvRSxFQUFwRSxDQUFwQjs7QUFFQSxZQUFNLE9BQU8sY0FBYyxNQUFkLEdBQXVCLFNBQVMsVUFBaEMsR0FBNkMsWUFBWSxNQUF0RTtBQUNBLFlBQU0sYUFBYSxJQUFJLFVBQUosQ0FBZSxJQUFmLENBQW5CO0FBQ0EsWUFBSSxJQUFJLENBQVI7O0FBRUEsZUFBTyxJQUFJLGNBQWMsTUFBekIsRUFBaUMsR0FBakMsRUFBc0M7QUFDcEMscUJBQVcsQ0FBWCxJQUFnQixjQUFjLFVBQWQsQ0FBeUIsQ0FBekIsSUFBOEIsSUFBOUM7QUFDRDs7QUFFRCxhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksU0FBUyxVQUE3QixFQUEwQyxLQUFLLEdBQS9DLEVBQW9EO0FBQ2xELHFCQUFXLENBQVgsSUFBZ0IsU0FBUyxRQUFULENBQWtCLENBQWxCLENBQWhCO0FBQ0Q7O0FBRUQsYUFBSyxJQUFJLEtBQUksQ0FBYixFQUFnQixLQUFJLFlBQVksTUFBaEMsRUFBd0MsS0FBSyxJQUE3QyxFQUFrRDtBQUNoRCxxQkFBVyxDQUFYLElBQWdCLFlBQVksVUFBWixDQUF1QixFQUF2QixJQUE0QixJQUE1QztBQUNEOztBQUVELFlBQU0sVUFBVSxXQUFXLE1BQTNCOztBQUVBLFlBQUksZ0JBQUosQ0FBcUIsZUFBckIsY0FBZ0QsUUFBSyxNQUFyRDtBQUNBLFlBQUksZ0JBQUosQ0FBcUIsY0FBckIsRUFBcUMsbUNBQW1DLFFBQXhFO0FBQ0EsWUFBSSxJQUFKLENBQVMsT0FBVDtBQUNELE9BMUZNLENBQVA7QUEyRkQ7OztnQ0FFVyxLLEVBQU87QUFDakIsYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLFlBQU0sT0FBTyxJQUFJLElBQUosQ0FBUyxDQUFDLEtBQUQsQ0FBVCxFQUFrQixFQUFDLE1BQU0sWUFBUCxFQUFsQixDQUFiOztBQUVBLGdCQUFRLElBQVI7QUFDRCxPQUpNLENBQVA7QUFLRDs7O3dCQUV1QjtBQUN0QixhQUFPO0FBQ0wsYUFBSyxLQURBO0FBRUwsZUFBTyxPQUZGO0FBR0wsZUFBTyxPQUhGO0FBSUwsZ0JBQVEsUUFKSDtBQUtMLHNCQUFjLGFBTFQ7QUFNTCxxQkFBYSxZQU5SO0FBT0wsbUJBQVcsVUFQTjtBQVFMLDJCQUFtQixpQkFSZDtBQVNMLHVCQUFlO0FBVFYsT0FBUDtBQVdEOzs7d0JBRW1CO0FBQ2xCLGFBQU8sTUFBUDtBQUNEOzs7Ozs7QUFHSCxPQUFPLE9BQVAsR0FBaUIsR0FBakI7OztBQ3ZyQkE7O0FBRUEsT0FBTyxPQUFQLEdBQWlCO0FBQ2YsK0JBQTZCO0FBRGQsQ0FBakI7OztBQ0ZBOztBQUVBLFNBQVMsVUFBVCxDQUFvQixFQUFwQixFQUF3QjtBQUN0QixNQUFJLFlBQVksRUFBaEI7O0FBRUEsS0FBRyxFQUFILEdBQVEsVUFBUyxJQUFULEVBQWUsRUFBZixFQUFtQjtBQUN6QixRQUFJLE9BQU8sRUFBUCxLQUFjLFVBQWxCLEVBQThCO0FBQzVCLFlBQU0sSUFBSSxTQUFKLENBQWMscURBQWQsQ0FBTjtBQUNEOztBQUVELEtBQUMsVUFBVSxJQUFWLElBQWtCLFVBQVUsSUFBVixLQUFtQixFQUF0QyxFQUEwQyxJQUExQyxDQUErQyxFQUEvQzs7QUFFQSxXQUFPLEVBQVA7QUFDRCxHQVJEOztBQVVBLEtBQUcsR0FBSCxHQUFTLFVBQVMsSUFBVCxFQUFlLEVBQWYsRUFBbUI7QUFDMUIsT0FBRyxHQUFILEdBQVMsSUFBVDtBQUNBLFdBQU8sR0FBRyxFQUFILENBQU0sSUFBTixDQUFXLEVBQVgsRUFBZSxJQUFmLEVBQXFCLEVBQXJCLENBQVA7QUFDRCxHQUhEOztBQUtBLEtBQUcsR0FBSCxHQUFTLFVBQVMsSUFBVCxFQUFlLEVBQWYsRUFBbUI7QUFDMUIsUUFBSSxTQUFTLEdBQWIsRUFBa0I7QUFDaEIsa0JBQVksRUFBWjtBQUNBLGFBQU8sU0FBUDtBQUNEOztBQUVELFFBQUksQ0FBQyxVQUFVLElBQVYsQ0FBTCxFQUFzQjtBQUNwQixhQUFPLEtBQVA7QUFDRDs7QUFFRCxRQUFJLEVBQUosRUFBUTtBQUNOLFVBQUksT0FBTyxFQUFQLEtBQWMsVUFBbEIsRUFBOEI7QUFDNUIsY0FBTSxJQUFJLFNBQUosQ0FBYyxzREFBZCxDQUFOO0FBQ0Q7O0FBRUQsZ0JBQVUsSUFBVixJQUFrQixVQUFVLElBQVYsRUFBZ0IsR0FBaEIsQ0FBb0IsVUFBUyxFQUFULEVBQWEsQ0FBYixFQUFnQjtBQUNwRCxZQUFJLE9BQU8sRUFBWCxFQUFlO0FBQ2Isb0JBQVUsSUFBVixFQUFnQixNQUFoQixDQUF1QixDQUF2QixFQUEwQixDQUExQjtBQUNEO0FBQ0YsT0FKaUIsQ0FBbEI7QUFLRCxLQVZELE1BVU87QUFDTCxhQUFPLFVBQVUsSUFBVixDQUFQO0FBQ0Q7QUFDRixHQXZCRDs7QUF5QkEsS0FBRyxJQUFILEdBQVUsVUFBUyxJLFlBQVQsRUFBMkI7QUFDbkMsUUFBSSxDQUFDLFVBQVUsSUFBVixDQUFELElBQW9CLENBQUMsVUFBVSxJQUFWLEVBQWdCLE1BQXpDLEVBQWlEO0FBQy9DO0FBQ0Q7O0FBRUQsUUFBTSxPQUFPLEdBQUcsS0FBSCxDQUFTLElBQVQsQ0FBYyxTQUFkLEVBQXlCLENBQXpCLENBQWI7O0FBRUEsY0FBVSxJQUFWLEVBQWdCLE9BQWhCLENBQXdCLFVBQVMsRUFBVCxFQUFhLENBQWIsRUFBZ0I7QUFDdEMsVUFBSSxFQUFKLEVBQVE7QUFDTixXQUFHLEtBQUgsQ0FBUyxFQUFULEVBQWEsSUFBYjtBQUNBLFlBQUksR0FBRyxHQUFQLEVBQVk7QUFDVixvQkFBVSxJQUFWLEVBQWdCLE1BQWhCLENBQXVCLENBQXZCLEVBQTBCLENBQTFCO0FBQ0Q7QUFDRjtBQUNGLEtBUEQ7O0FBU0EsV0FBTyxFQUFQO0FBQ0QsR0FqQkQ7O0FBbUJBLFNBQU8sRUFBUDtBQUNEOztBQUVELE9BQU8sT0FBUCxHQUFpQixVQUFqQjs7O0FDbkVBOzs7Ozs7QUFFQSxJQUFNLGFBQWEsUUFBUSxjQUFSLENBQW5CO0FBQ0EsSUFBTSwyQkFBMkIsUUFBUSxrQ0FBUixDQUFqQztBQUNBLElBQU0sV0FBVyxPQUFPLFNBQVAsQ0FBaUIsUUFBbEM7O0lBRU0sTTtBQUNKLG9CQUFjO0FBQUE7O0FBQ1osV0FBTyxZQUFQLEdBQXNCLE9BQU8sWUFBUCxJQUF1QixPQUFPLGtCQUFwRDs7QUFFQSxTQUFLLE1BQUwsR0FBYyxFQUFkO0FBQ0EsU0FBSyxjQUFMLEdBQXNCLElBQXRCO0FBQ0EsU0FBSyxjQUFMLEdBQXNCLElBQXRCO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLElBQUksWUFBSixFQUFoQjs7QUFFQSxlQUFXLElBQVg7QUFDRDs7Ozt5QkFFSSxJLEVBQU0sTyxFQUFTO0FBQUE7O0FBQ2xCLFVBQUksUUFBUSxDQUFDLE9BQWIsRUFBc0I7QUFDcEIsa0JBQVUsSUFBVjtBQUNBLGVBQU8sS0FBUDtBQUNEOztBQUVELGlCQUFXLFlBQU07QUFDZixjQUFLLElBQUwsQ0FBVSxPQUFPLFVBQVAsQ0FBa0IsR0FBNUIsRUFBaUMsT0FBakM7QUFDRCxPQUZELEVBRUcsQ0FGSDs7QUFJQSxVQUFJLEtBQUssTUFBVCxFQUFpQjtBQUNmLGdCQUFRLElBQVIsRUFBYyxPQUFkO0FBQ0Q7QUFDRjs7O2lDQUVZO0FBQUE7O0FBQ1gsYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLGVBQUssTUFBTCxHQUFjLEVBQWQ7QUFDQSxlQUFLLE1BQUwsR0FBYyxJQUFkO0FBQ0EsZUFBSyxjQUFMLEdBQXNCLElBQXRCO0FBQ0EsZUFBSyxjQUFMLEdBQXNCLElBQXRCO0FBQ0E7QUFDRCxPQU5NLENBQVA7QUFPRDs7OzRCQUVPLEksRUFBTTtBQUFBOztBQUNaLGFBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxZQUFJLENBQUMsSUFBTCxFQUFXO0FBQ1QsY0FBTSxRQUFRLElBQUksS0FBSixDQUFVLDJCQUFWLENBQWQ7QUFDQSxpQkFBSyxJQUFMLENBQVUsS0FBVjtBQUNBLGlCQUFPLE9BQU8sS0FBUCxDQUFQO0FBQ0Q7O0FBRUQsWUFBTSxhQUFhLFNBQVMsSUFBVCxDQUFjLElBQWQsRUFBb0IsT0FBcEIsQ0FBNEIsZUFBNUIsRUFBNkMsSUFBN0MsQ0FBbkI7O0FBRUEsWUFBTSxVQUFVLFNBQVYsT0FBVSxDQUFDLFdBQUQsRUFBaUI7QUFDL0IsaUJBQUssTUFBTCxDQUFZLElBQVosQ0FBaUIsV0FBakI7QUFDQSxpQkFBSyxJQUFMLENBQVUsZUFBVjtBQUNBLGlCQUFLLElBQUwsQ0FBVSxPQUFPLFVBQVAsQ0FBa0IsT0FBNUI7QUFDQSxpQkFBTyxRQUFRLFdBQVIsQ0FBUDtBQUNELFNBTEQ7O0FBT0EsWUFBSSxlQUFlLFVBQWYsSUFBNkIsZUFBZSxZQUFoRCxFQUE4RDtBQUM1RCxpQkFBTyx5QkFBeUIsS0FBSyxNQUE5QixFQUFzQyxPQUFLLFFBQTNDLEVBQ04sSUFETSxDQUNELE9BREMsQ0FBUDtBQUVELFNBSEQsTUFHTyxJQUFJLGVBQWUsYUFBbkIsRUFBa0M7QUFDdkMsaUJBQU8sUUFBUSxJQUFSLENBQVA7QUFDRCxTQUZNLE1BRUEsSUFBSSxlQUFlLGFBQW5CLEVBQWtDO0FBQ3ZDLGlCQUFPLHlCQUF5QixJQUF6QixFQUErQixPQUFLLFFBQXBDLEVBQ04sSUFETSxDQUNELE9BREMsQ0FBUDtBQUVELFNBSE0sTUFHQSxJQUFJLGVBQWUsUUFBbkIsRUFBNkI7QUFDbEMsaUJBQU8sUUFBUSxJQUFSLENBQVA7QUFDRCxTQUZNLE1BRUE7QUFDTCxjQUFNLFNBQVEsSUFBSSxLQUFKLENBQVUsZUFBVixDQUFkO0FBQ0EsaUJBQUssSUFBTCxDQUFVLE9BQVYsRUFBbUIsTUFBbkI7QUFDQSxpQkFBTyxPQUFPLE1BQVAsQ0FBUDtBQUNEO0FBQ0YsT0EvQk0sQ0FBUDtBQWdDRDs7OzRCQUVPO0FBQUE7O0FBQ04sYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLFlBQU0sT0FBTyxPQUFLLE1BQUwsQ0FBWSxLQUFaLEVBQWI7O0FBRUEsWUFBSSxJQUFKLEVBQVU7QUFDUixpQkFBSyxJQUFMLENBQVUsYUFBVjtBQUNBLGlCQUFLLElBQUwsQ0FBVSxPQUFPLFVBQVAsQ0FBa0IsS0FBNUI7QUFDQSxpQkFBTyxRQUFRLElBQVIsQ0FBUDtBQUNEOztBQUVELGVBQU8sUUFBUDtBQUNELE9BVk0sQ0FBUDtBQVdEOzs7MkJBRU07QUFBQTs7QUFDTCxhQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsWUFBSSxPQUFLLFFBQUwsQ0FBYyxLQUFkLEtBQXdCLFdBQTVCLEVBQXlDO0FBQ3ZDLGlCQUFLLFFBQUwsQ0FBYyxNQUFkOztBQUVBLGlCQUFLLElBQUwsQ0FBVSxZQUFWO0FBQ0EsaUJBQUssSUFBTCxDQUFVLE9BQU8sVUFBUCxDQUFrQixJQUE1QjtBQUNBO0FBQ0QsU0FORCxNQU1PLElBQUksT0FBSyxNQUFMLElBQWUsT0FBSyxNQUFMLENBQVksTUFBL0IsRUFBdUM7QUFDNUMsaUJBQUssSUFBTCxDQUFVLFlBQVY7QUFDQSxpQkFBSyxJQUFMLENBQVUsT0FBTyxVQUFQLENBQWtCLElBQTVCO0FBQ0EsaUJBQUssTUFBTCxDQUFZLElBQVo7QUFDQTtBQUNELFNBTE0sTUFLQTtBQUNMLGlCQUFPLE9BQUssS0FBTCxHQUNOLElBRE0sQ0FDRCx1QkFBZTtBQUNuQixtQkFBSyxJQUFMLENBQVUsWUFBVjtBQUNBLG1CQUFLLElBQUwsQ0FBVSxPQUFPLFVBQVAsQ0FBa0IsSUFBNUI7QUFDQSxnQkFBSSxPQUFPLFdBQVAsS0FBdUIsUUFBM0IsRUFBcUM7QUFDbkMscUJBQU8sT0FBSyxPQUFMLENBQWEsV0FBYixDQUFQO0FBQ0Q7QUFDRCxtQkFBTyxPQUFLLGVBQUwsQ0FBcUIsV0FBckIsQ0FBUDtBQUNELFdBUk0sRUFRSixJQVJJLENBUUMsT0FSRCxDQUFQO0FBU0Q7QUFDRixPQXZCTSxDQUFQO0FBd0JEOzs7Z0NBRVc7QUFBQTs7QUFDVixhQUFPLEtBQUssSUFBTCxHQUFZLElBQVosQ0FBaUIsWUFBTTtBQUM1QixZQUFJLE9BQUssTUFBTCxDQUFZLE1BQWhCLEVBQXdCO0FBQ3RCLGlCQUFPLE9BQUssU0FBTCxFQUFQO0FBQ0Q7QUFDRixPQUpNLENBQVA7QUFLRDs7OzJCQUVNO0FBQUE7O0FBQ0wsYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3BDLFlBQUksT0FBSyxjQUFULEVBQXlCO0FBQ3ZCLGlCQUFLLGNBQUwsQ0FBb0IsT0FBcEIsR0FBOEIsWUFBVyxDQUFFLENBQTNDO0FBQ0EsaUJBQUssY0FBTCxDQUFvQixJQUFwQjtBQUNEOztBQUVELFlBQUksT0FBSyxNQUFULEVBQWlCO0FBQ2YsaUJBQUssTUFBTCxDQUFZLE9BQVosR0FBc0IsWUFBVyxDQUFFLENBQW5DO0FBQ0EsaUJBQUssTUFBTCxDQUFZLFdBQVosR0FBMEIsQ0FBMUI7QUFDQSxpQkFBSyxNQUFMLENBQVksS0FBWjtBQUNEOztBQUVELGVBQUssSUFBTCxDQUFVLFlBQVY7QUFDQSxlQUFLLElBQUwsQ0FBVSxPQUFPLFVBQVAsQ0FBa0IsSUFBNUI7QUFDSCxPQWRNLENBQVA7QUFlRDs7OzRCQUVPO0FBQUE7O0FBQ04sYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3BDLFlBQUksT0FBSyxjQUFMLElBQXVCLE9BQUssUUFBTCxDQUFjLEtBQWQsS0FBd0IsU0FBbkQsRUFBOEQ7QUFDNUQsaUJBQUssUUFBTCxDQUFjLE9BQWQ7QUFDRDs7QUFFRCxZQUFJLE9BQUssTUFBVCxFQUFpQjtBQUNmLGlCQUFLLE1BQUwsQ0FBWSxLQUFaO0FBQ0Q7O0FBRUQsZUFBSyxJQUFMLENBQVUsYUFBVjtBQUNBLGVBQUssSUFBTCxDQUFVLE9BQU8sVUFBUCxDQUFrQixLQUE1QjtBQUNILE9BWE0sQ0FBUDtBQVlEOzs7NkJBRVE7QUFBQTs7QUFDUCxhQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDcEMsWUFBSSxPQUFLLGNBQVQsRUFBeUI7QUFDdkIsaUJBQUssSUFBTCxDQUFVLGNBQVY7QUFDQSxpQkFBSyxJQUFMLENBQVUsT0FBTyxVQUFQLENBQWtCLE1BQTVCOztBQUVBLGNBQUksT0FBSyxRQUFMLENBQWMsS0FBZCxLQUF3QixXQUE1QixFQUF5QztBQUN2QyxtQkFBSyxRQUFMLENBQWMsTUFBZDtBQUNEOztBQUVELGNBQUksT0FBSyxjQUFULEVBQXlCO0FBQ3ZCLG1CQUFLLGNBQUwsQ0FBb0IsSUFBcEI7QUFDQSxtQkFBSyxjQUFMLENBQW9CLE9BQXBCLEdBQThCLFlBQVcsQ0FBRSxDQUEzQztBQUNEO0FBQ0QsaUJBQU8sT0FBSyxlQUFMLENBQXFCLE9BQUssY0FBMUIsQ0FBUDtBQUNELFNBYkQsTUFhTyxJQUFJLE9BQUssTUFBVCxFQUFpQjtBQUN0QixpQkFBSyxJQUFMLENBQVUsY0FBVjtBQUNBLGlCQUFLLElBQUwsQ0FBVSxPQUFPLFVBQVAsQ0FBa0IsTUFBNUI7QUFDQSxpQkFBTyxPQUFLLE9BQUwsQ0FBYSxPQUFLLE1BQUwsQ0FBWSxHQUF6QixDQUFQO0FBQ0QsU0FKTSxNQUlBO0FBQ0wsY0FBTSxRQUFRLElBQUksS0FBSixDQUFVLHlCQUFWLENBQWQ7QUFDQSxpQkFBSyxJQUFMLENBQVUsT0FBVixFQUFtQixLQUFuQjtBQUNBO0FBQ0Q7QUFDSixPQXZCTSxDQUFQO0FBd0JEOzs7NkJBRVEsSSxFQUFNO0FBQUE7O0FBQ2IsYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLFlBQUksQ0FBQyxJQUFMLEVBQVc7QUFDVDtBQUNEOztBQUVELFlBQU0sWUFBWSxJQUFJLGVBQUosQ0FBb0IsSUFBcEIsQ0FBbEI7QUFDQSxZQUFNLFFBQVEsSUFBSSxLQUFKLEVBQWQ7QUFDQSxjQUFNLEdBQU4sR0FBWSxTQUFaO0FBQ0EsZ0JBQUssY0FBTCxHQUFzQixJQUF0QjtBQUNBLGdCQUFLLGNBQUwsR0FBc0IsSUFBdEI7QUFDQSxnQkFBSyxNQUFMLEdBQWMsS0FBZDs7QUFFQSxjQUFNLE9BQU4sR0FBZ0IsWUFBTTtBQUNwQixrQkFBSyxJQUFMLENBQVUsYUFBVjtBQUNBLGtCQUFLLElBQUwsQ0FBVSxPQUFPLFVBQVAsQ0FBa0IsS0FBNUI7QUFDQTtBQUNELFNBSkQ7O0FBTUEsY0FBTSxPQUFOLEdBQWdCLFVBQUMsS0FBRCxFQUFXO0FBQ3pCLGtCQUFLLElBQUwsQ0FBVSxPQUFWLEVBQW1CLEtBQW5CO0FBQ0EsaUJBQU8sS0FBUDtBQUNELFNBSEQ7O0FBS0EsY0FBTSxNQUFOLEdBQWUsVUFBQyxLQUFELEVBQVc7QUFDeEIsY0FBSSxlQUFKLENBQW9CLFNBQXBCO0FBQ0QsU0FGRDs7QUFJQSxjQUFNLElBQU47QUFDRCxPQTVCTSxDQUFQO0FBNkJEOzs7b0NBRWUsTSxFQUFRO0FBQUE7O0FBQ3RCLGFBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxZQUFJLENBQUMsTUFBTCxFQUFhO0FBQ1g7QUFDRDs7QUFFRCxZQUFNLFNBQVMsUUFBSyxRQUFMLENBQWMsa0JBQWQsRUFBZjtBQUNBLGVBQU8sTUFBUCxHQUFnQixNQUFoQjtBQUNBLGVBQU8sT0FBUCxDQUFlLFFBQUssUUFBTCxDQUFjLFdBQTdCO0FBQ0EsZUFBTyxLQUFQLENBQWEsQ0FBYjtBQUNBLGdCQUFLLGNBQUwsR0FBc0IsTUFBdEI7QUFDQSxnQkFBSyxjQUFMLEdBQXNCLE1BQXRCO0FBQ0EsZ0JBQUssTUFBTCxHQUFjLElBQWQ7O0FBRUEsZUFBTyxPQUFQLEdBQWlCLFVBQUMsS0FBRCxFQUFXO0FBQzFCLGtCQUFLLElBQUwsQ0FBVSxhQUFWO0FBQ0Esa0JBQUssSUFBTCxDQUFVLE9BQU8sVUFBUCxDQUFrQixLQUE1QjtBQUNBO0FBQ0QsU0FKRDs7QUFNQSxlQUFPLE9BQVAsR0FBaUIsVUFBQyxLQUFELEVBQVc7QUFDMUIsa0JBQUssSUFBTCxDQUFVLE9BQVYsRUFBbUIsS0FBbkI7QUFDQSxpQkFBTyxLQUFQO0FBQ0QsU0FIRDtBQUlELE9BdkJNLENBQVA7QUF3QkQ7Ozs0QkFFTyxHLEVBQUs7QUFBQTs7QUFDWCxhQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsWUFBTSxRQUFRLElBQUksS0FBSixFQUFkO0FBQ0EsY0FBTSxHQUFOLEdBQVksR0FBWjtBQUNBLGdCQUFLLGNBQUwsR0FBc0IsSUFBdEI7QUFDQSxnQkFBSyxjQUFMLEdBQXNCLElBQXRCO0FBQ0EsZ0JBQUssTUFBTCxHQUFjLEtBQWQ7O0FBRUEsY0FBTSxPQUFOLEdBQWdCLFVBQUMsS0FBRCxFQUFXO0FBQ3pCLGtCQUFLLElBQUwsQ0FBVSxhQUFWO0FBQ0Esa0JBQUssSUFBTCxDQUFVLE9BQU8sVUFBUCxDQUFrQixLQUE1QjtBQUNBO0FBQ0QsU0FKRDs7QUFNQSxjQUFNLE9BQU4sR0FBZ0IsVUFBQyxLQUFELEVBQVc7QUFDekIsa0JBQUssSUFBTCxDQUFVLE9BQVYsRUFBbUIsS0FBbkI7QUFDQSxpQkFBTyxLQUFQO0FBQ0QsU0FIRDs7QUFLQSxjQUFNLElBQU47QUFDRCxPQW5CTSxDQUFQO0FBb0JEOzs7d0JBRXVCO0FBQ3RCLGFBQU87QUFDTCxhQUFLLEtBREE7QUFFTCxlQUFPLE9BRkY7QUFHTCxjQUFNLE1BSEQ7QUFJTCxnQkFBUSxRQUpIO0FBS0wsZUFBTyxPQUxGO0FBTUwsY0FBTSxPQU5EO0FBT0wsaUJBQVMsU0FQSjtBQVFMLGVBQU87QUFSRixPQUFQO0FBVUQ7Ozs7OztBQUdILE9BQU8sT0FBUCxHQUFpQixNQUFqQjs7O0FDM1JBOztBQUVBLFNBQVMsd0JBQVQsQ0FBa0MsV0FBbEMsRUFBK0MsT0FBL0MsRUFBd0Q7QUFDdEQsU0FBTyxZQUFQLEdBQXNCLE9BQU8sWUFBUCxJQUF1QixPQUFPLGtCQUFwRDs7QUFFQSxTQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsUUFBSSxPQUFKLEVBQWE7QUFDWCxVQUFJLE9BQU8sU0FBUCxDQUFpQixRQUFqQixDQUEwQixJQUExQixDQUErQixPQUEvQixNQUE0Qyx1QkFBaEQsRUFBeUU7QUFDdkUsY0FBTSxJQUFJLFNBQUosQ0FBYyxtQ0FBZCxDQUFOO0FBQ0Q7QUFDRixLQUpELE1BSU87QUFDTCxnQkFBVSxJQUFJLFlBQUosRUFBVjtBQUNEOztBQUVELFlBQVEsZUFBUixDQUF3QixXQUF4QixFQUFxQyxVQUFDLElBQUQsRUFBVTtBQUM3QyxjQUFRLElBQVI7QUFDRCxLQUZELEVBRUcsTUFGSDtBQUdELEdBWk0sQ0FBUDtBQWFEOztBQUVELE9BQU8sT0FBUCxHQUFpQix3QkFBakI7OztBQ3BCQTs7Ozs7O0FBS0EsU0FBUyxtQkFBVCxDQUE2QixNQUE3QixFQUFxQztBQUNuQyxTQUFPLE9BQU8sWUFBUCxDQUFvQixLQUFwQixDQUEwQixJQUExQixFQUFnQyxJQUFJLFdBQUosQ0FBZ0IsTUFBaEIsQ0FBaEMsQ0FBUDtBQUNEOztBQUVELE9BQU8sT0FBUCxHQUFpQixtQkFBakI7OztBQ1RBOzs7Ozs7QUFLQSxTQUFTLGdCQUFULENBQTBCLE1BQTFCLEVBQWtDLGVBQWxDLEVBQW1ELGdCQUFuRCxFQUFxRTtBQUNuRSxNQUFJLG9CQUFvQixnQkFBeEIsRUFBMEM7QUFDeEMsV0FBTyxNQUFQO0FBQ0Q7O0FBRUQsTUFBSSxrQkFBa0IsZ0JBQXRCLEVBQXdDO0FBQ3RDLFVBQU0sSUFBSSxLQUFKLENBQVUseURBQVYsQ0FBTjtBQUNEOztBQUVELE1BQU0sa0JBQWtCLGtCQUFrQixnQkFBMUM7QUFDQSxNQUFNLFlBQVksS0FBSyxLQUFMLENBQVcsT0FBTyxNQUFQLEdBQWdCLGVBQTNCLENBQWxCO0FBQ0EsTUFBSSxTQUFTLElBQUksWUFBSixDQUFpQixTQUFqQixDQUFiO0FBQ0EsTUFBSSxlQUFlLENBQW5CO0FBQ0EsTUFBSSxlQUFlLENBQW5COztBQUVBLFNBQU8sZUFBZSxPQUFPLE1BQTdCLEVBQXFDO0FBQ25DLFFBQUksbUJBQW1CLEtBQUssS0FBTCxDQUFXLENBQUMsZUFBZSxDQUFoQixJQUFxQixlQUFoQyxDQUF2QjtBQUNBLFFBQUksUUFBUSxDQUFaO0FBQ0EsUUFBSSxRQUFRLENBQVo7O0FBRUEsU0FBSyxJQUFJLElBQUksWUFBYixFQUEyQixJQUFJLGdCQUFKLElBQXdCLElBQUksT0FBTyxNQUE5RCxFQUFzRSxHQUF0RSxFQUEyRTtBQUN6RSxlQUFTLE9BQU8sQ0FBUCxDQUFUO0FBQ0E7QUFDRDs7QUFFRCxXQUFPLFlBQVAsSUFBdUIsUUFBUSxLQUEvQjtBQUNBO0FBQ0EsbUJBQWUsZ0JBQWY7QUFDRDs7QUFFRCxTQUFPLE1BQVA7QUFDRDs7QUFFRCxPQUFPLE9BQVAsR0FBaUIsZ0JBQWpCOzs7QUN0Q0E7Ozs7OztBQUtBLFNBQVMsVUFBVCxDQUFvQixXQUFwQixFQUFpQyxZQUFqQyxFQUErQztBQUM3QyxNQUFJLGVBQWUsQ0FBQyxZQUFwQixFQUFrQztBQUNoQyxXQUFPLFdBQVA7QUFDRDs7QUFFRCxNQUFNLFNBQVMsWUFBWSxNQUFaLEdBQXFCLGFBQWEsTUFBakQ7QUFDQSxNQUFJLFNBQVMsSUFBSSxZQUFKLENBQWlCLE1BQWpCLENBQWI7QUFDQSxNQUFJLGFBQWEsQ0FBakI7O0FBRUEsT0FBSyxJQUFJLFFBQVEsQ0FBakIsRUFBb0IsUUFBUSxNQUE1QixHQUFxQztBQUNuQyxXQUFPLE9BQVAsSUFBa0IsWUFBWSxVQUFaLENBQWxCO0FBQ0EsV0FBTyxPQUFQLElBQWtCLGFBQWEsVUFBYixDQUFsQjtBQUNBO0FBQ0Q7O0FBRUQsU0FBTyxNQUFQO0FBQ0Q7O0FBRUQsT0FBTyxPQUFQLEdBQWlCLFVBQWpCOzs7QUN2QkE7Ozs7OztBQUtBLFNBQVMsWUFBVCxDQUFzQixhQUF0QixFQUFxQyxlQUFyQyxFQUFxRDtBQUNuRCxNQUFNLFNBQVMsSUFBSSxZQUFKLENBQWlCLGVBQWpCLENBQWY7QUFDQSxNQUFNLFNBQVMsY0FBYyxNQUE3QjtBQUNBLE1BQUksU0FBUyxDQUFiOztBQUVBLE9BQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxNQUFwQixFQUE0QixHQUE1QixFQUFnQztBQUM5QixRQUFJLFNBQVMsY0FBYyxDQUFkLENBQWI7O0FBRUEsV0FBTyxHQUFQLENBQVcsTUFBWCxFQUFtQixNQUFuQjtBQUNBLGNBQVUsT0FBTyxNQUFqQjtBQUNEOztBQUVELFNBQU8sTUFBUDtBQUNEOztBQUVELE9BQU8sT0FBUCxHQUFpQixZQUFqQjs7O0FDcEJBOzs7Ozs7QUFLQSxTQUFTLGFBQVQsQ0FBdUIsSUFBdkIsRUFBNkIsTUFBN0IsRUFBcUMsTUFBckMsRUFBNkM7QUFDM0MsTUFBTSxTQUFTLE9BQU8sTUFBdEI7O0FBRUEsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLE1BQXBCLEVBQTRCLEdBQTVCLEVBQWdDO0FBQzlCLFNBQUssUUFBTCxDQUFjLFNBQVMsQ0FBdkIsRUFBMEIsT0FBTyxVQUFQLENBQWtCLENBQWxCLENBQTFCO0FBQ0Q7QUFDRjs7QUFFRCxPQUFPLE9BQVAsR0FBaUIsYUFBakI7Ozs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDalZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBBVlMgPSByZXF1aXJlKCcuLi8nKTtcbmNvbnN0IHBsYXllciA9IEFWUy5QbGF5ZXI7XG5cbmNvbnN0IGF2cyA9IG5ldyBBVlMoe1xuICBkZWJ1ZzogdHJ1ZSxcbiAgY2xpZW50SWQ6ICdhbXpuMS5hcHBsaWNhdGlvbi1vYTItY2xpZW50Ljg4NzE2MTBlZGU4ZDRkOTFhYzI2MTIyNTY5MzE5ZWQ3JyxcbiAgZGV2aWNlSWQ6ICdnYXN0cm9fY2x1YicsXG4gIGRldmljZVNlcmlhbE51bWJlcjogMTIzNDU2LFxuICByZWRpcmVjdFVyaTogYGh0dHBzOi8vJHt3aW5kb3cubG9jYXRpb24uaG9zdH0vYXV0aHJlc3BvbnNlYFxufSk7XG53aW5kb3cuYXZzID0gYXZzO1xuXG5hdnMub24oQVZTLkV2ZW50VHlwZXMuVE9LRU5fU0VULCAoKSA9PiB7XG4gIGxvZ2luQnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgbG9nb3V0QnRuLmRpc2FibGVkID0gZmFsc2U7XG4gIHN0YXJ0UmVjb3JkaW5nLmRpc2FibGVkID0gZmFsc2U7XG4gIHN0b3BSZWNvcmRpbmcuZGlzYWJsZWQgPSB0cnVlO1xufSk7XG5cbmF2cy5vbihBVlMuRXZlbnRUeXBlcy5SRUNPUkRfU1RBUlQsICgpID0+IHtcbiAgc3RhcnRSZWNvcmRpbmcuZGlzYWJsZWQgPSB0cnVlO1xuICBzdG9wUmVjb3JkaW5nLmRpc2FibGVkID0gZmFsc2U7XG59KTtcblxuYXZzLm9uKEFWUy5FdmVudFR5cGVzLlJFQ09SRF9TVE9QLCAoKSA9PiB7XG4gIHN0YXJ0UmVjb3JkaW5nLmRpc2FibGVkID0gZmFsc2U7XG4gIHN0b3BSZWNvcmRpbmcuZGlzYWJsZWQgPSB0cnVlO1xufSk7XG5cbmF2cy5vbihBVlMuRXZlbnRUeXBlcy5MT0dPVVQsICgpID0+IHtcbiAgbG9naW5CdG4uZGlzYWJsZWQgPSBmYWxzZTtcbiAgbG9nb3V0QnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgc3RhcnRSZWNvcmRpbmcuZGlzYWJsZWQgPSB0cnVlO1xuICBzdG9wUmVjb3JkaW5nLmRpc2FibGVkID0gdHJ1ZTtcbn0pO1xuXG5hdnMub24oQVZTLkV2ZW50VHlwZXMuVE9LRU5fSU5WQUxJRCwgKCkgPT4ge1xuICBhdnMubG9nb3V0KClcbiAgICAudGhlbihsb2dpbilcbn0pO1xuXG5hdnMub24oQVZTLkV2ZW50VHlwZXMuTE9HLCBsb2cpO1xuYXZzLm9uKEFWUy5FdmVudFR5cGVzLkVSUk9SLCBsb2dFcnJvcik7XG5cbmF2cy5wbGF5ZXIub24oQVZTLlBsYXllci5FdmVudFR5cGVzLkxPRywgbG9nKTtcbmF2cy5wbGF5ZXIub24oQVZTLlBsYXllci5FdmVudFR5cGVzLkVSUk9SLCBsb2dFcnJvcik7XG5cbmF2cy5wbGF5ZXIub24oQVZTLlBsYXllci5FdmVudFR5cGVzLlBMQVksICgpID0+IHtcbiAgcGxheUF1ZGlvLmRpc2FibGVkID0gdHJ1ZTtcbiAgcmVwbGF5QXVkaW8uZGlzYWJsZWQgPSB0cnVlO1xuICBwYXVzZUF1ZGlvLmRpc2FibGVkID0gZmFsc2U7XG4gIHN0b3BBdWRpby5kaXNhYmxlZCA9IGZhbHNlO1xufSk7XG5cbmF2cy5wbGF5ZXIub24oQVZTLlBsYXllci5FdmVudFR5cGVzLkVOREVELCAoKSA9PiB7XG4gIHBsYXlBdWRpby5kaXNhYmxlZCA9IHRydWU7XG4gIHJlcGxheUF1ZGlvLmRpc2FibGVkID0gZmFsc2U7XG4gIHBhdXNlQXVkaW8uZGlzYWJsZWQgPSB0cnVlO1xuICBzdG9wQXVkaW8uZGlzYWJsZWQgPSB0cnVlO1xufSk7XG5cbmF2cy5wbGF5ZXIub24oQVZTLlBsYXllci5FdmVudFR5cGVzLlNUT1AsICgpID0+IHtcbiAgcGxheUF1ZGlvLmRpc2FibGVkID0gdHJ1ZTtcbiAgcmVwbGF5QXVkaW8uZGlzYWJsZWQgPSBmYWxzZTtcbiAgcGF1c2VBdWRpby5kaXNhYmxlZCA9IGZhbHNlO1xuICBzdG9wQXVkaW8uZGlzYWJsZWQgPSBmYWxzZTtcbn0pO1xuXG5hdnMucGxheWVyLm9uKEFWUy5QbGF5ZXIuRXZlbnRUeXBlcy5QQVVTRSwgKCkgPT4ge1xuICBwbGF5QXVkaW8uZGlzYWJsZWQgPSBmYWxzZTtcbiAgcmVwbGF5QXVkaW8uZGlzYWJsZWQgPSBmYWxzZTtcbiAgcGF1c2VBdWRpby5kaXNhYmxlZCA9IHRydWU7XG4gIHN0b3BBdWRpby5kaXNhYmxlZCA9IHRydWU7XG59KTtcblxuYXZzLnBsYXllci5vbihBVlMuUGxheWVyLkV2ZW50VHlwZXMuUkVQTEFZLCAoKSA9PiB7XG4gIHBsYXlBdWRpby5kaXNhYmxlZCA9IHRydWU7XG4gIHJlcGxheUF1ZGlvLmRpc2FibGVkID0gdHJ1ZTtcbiAgcGF1c2VBdWRpby5kaXNhYmxlZCA9IGZhbHNlO1xuICBzdG9wQXVkaW8uZGlzYWJsZWQgPSBmYWxzZTtcbn0pO1xuXG5mdW5jdGlvbiBsb2cobWVzc2FnZSkge1xuICBsb2dPdXRwdXQuaW5uZXJIVE1MID0gYDxsaT5MT0c6ICR7bWVzc2FnZX08L2xpPmAgKyBsb2dPdXRwdXQuaW5uZXJIVE1MO1xufVxuXG5mdW5jdGlvbiBsb2dFcnJvcihlcnJvcikge1xuICBsb2dPdXRwdXQuaW5uZXJIVE1MID0gYDxsaT5FUlJPUjogJHtlcnJvcn08L2xpPmAgKyBsb2dPdXRwdXQuaW5uZXJIVE1MO1xufVxuXG5mdW5jdGlvbiBsb2dBdWRpb0Jsb2IoYmxvYiwgbWVzc2FnZSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgY29uc3QgYURvd25sb2FkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIGNvbnN0IHVybCA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgIGNvbnN0IGV4dCA9IGJsb2IudHlwZS5pbmRleE9mKCdtcGVnJykgPiAtMSA/ICdtcDMnIDogJ3dhdic7XG4gICAgY29uc3QgZmlsZW5hbWUgPSBgJHtEYXRlLm5vdygpfS4ke2V4dH1gO1xuICAgIGEuaHJlZiA9IHVybDtcbiAgICBhLnRhcmdldCA9ICdfYmxhbmsnO1xuICAgIGFEb3dubG9hZC5ocmVmID0gdXJsO1xuICAgIGEudGV4dENvbnRlbnQgPSBmaWxlbmFtZTtcbiAgICBhRG93bmxvYWQuZG93bmxvYWQgPSBmaWxlbmFtZTtcbiAgICBhRG93bmxvYWQudGV4dENvbnRlbnQgPSBgZG93bmxvYWRgO1xuXG4gICAgYXVkaW9Mb2dPdXRwdXQuaW5uZXJIVE1MID0gYDxsaT4ke21lc3NhZ2V9OiAke2Eub3V0ZXJIVE1MfSAke2FEb3dubG9hZC5vdXRlckhUTUx9PC9saT5gICsgYXVkaW9Mb2dPdXRwdXQuaW5uZXJIVE1MO1xuICAgIHJlc29sdmUoYmxvYik7XG4gIH0pO1xufVxuXG5jb25zdCBsb2dpbkJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbicpO1xuY29uc3QgbG9nb3V0QnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ291dCcpO1xuY29uc3QgbG9nT3V0cHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZycpO1xuY29uc3QgYXVkaW9Mb2dPdXRwdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXVkaW9Mb2cnKTtcbmNvbnN0IHN0YXJ0UmVjb3JkaW5nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXJ0UmVjb3JkaW5nJyk7XG5jb25zdCBzdG9wUmVjb3JkaW5nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0b3BSZWNvcmRpbmcnKTtcbmNvbnN0IHN0b3BBdWRpbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdG9wQXVkaW8nKTtcbmNvbnN0IHBhdXNlQXVkaW8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGF1c2VBdWRpbycpO1xuY29uc3QgcGxheUF1ZGlvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BsYXlBdWRpbycpO1xuY29uc3QgcmVwbGF5QXVkaW8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVwbGF5QXVkaW8nKTtcblxuLypcbiAvLyBJZiB1c2luZyBjbGllbnQgc2VjcmV0XG4gYXZzLmdldENvZGVGcm9tVXJsKClcbiAudGhlbihjb2RlID0+IGF2cy5nZXRUb2tlbkZyb21Db2RlKGNvZGUpKVxuIC50aGVuKHRva2VuID0+IGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0b2tlbicsIHRva2VuKSlcbiAudGhlbihyZWZyZXNoVG9rZW4gPT4gbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3JlZnJlc2hUb2tlbicsIHJlZnJlc2hUb2tlbikpXG4gLnRoZW4oKCkgPT4gYXZzLnJlcXVlc3RNaWMoKSlcbiAudGhlbigoKSA9PiBhdnMucmVmcmVzaFRva2VuKCkpXG4gLmNhdGNoKCgpID0+IHtcblxuIH0pO1xuICovXG5cbmF2cy5nZXRUb2tlbkZyb21VcmwoKVxuICAudGhlbigoKSA9PiBhdnMuZ2V0VG9rZW4oKSlcbiAgLnRoZW4odG9rZW4gPT4gbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Rva2VuJywgdG9rZW4pKVxuICAudGhlbigoKSA9PiBhdnMucmVxdWVzdE1pYygpKVxuICAuY2F0Y2goKCkgPT4ge1xuICAgIGNvbnN0IGNhY2hlZFRva2VuID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Rva2VuJyk7XG5cbiAgICBpZiAoY2FjaGVkVG9rZW4pIHtcbiAgICAgIGF2cy5zZXRUb2tlbihjYWNoZWRUb2tlbik7XG4gICAgICByZXR1cm4gYXZzLnJlcXVlc3RNaWMoKTtcbiAgICB9XG4gIH0pO1xuXG5sb2dpbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGxvZ2luKTtcblxuZnVuY3Rpb24gbG9naW4oZXZlbnQpIHtcbiAgcmV0dXJuIGF2cy5sb2dpbigpXG4gICAgLnRoZW4oKCkgPT4gYXZzLnJlcXVlc3RNaWMoKSlcbiAgICAuY2F0Y2goKCkgPT4ge1xuICAgIH0pO1xuXG4gIC8qXG4gICAvLyBJZiB1c2luZyBjbGllbnQgc2VjcmV0XG4gICBhdnMubG9naW4oe3Jlc3BvbnNlVHlwZTogJ2NvZGUnfSlcbiAgIC50aGVuKCgpID0+IGF2cy5yZXF1ZXN0TWljKCkpXG4gICAuY2F0Y2goKCkgPT4ge30pO1xuICAgKi9cbn1cblxubG9nb3V0QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgbG9nb3V0KTtcblxuZnVuY3Rpb24gbG9nb3V0KCkge1xuICByZXR1cm4gYXZzLmxvZ291dCgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XG4gICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcnO1xuICAgIH0pO1xufVxuXG5zdGFydFJlY29yZGluZy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgYXZzLnN0YXJ0UmVjb3JkaW5nKCk7XG59KTtcblxuc3RvcFJlY29yZGluZy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgY29uc29sZS5sb2coYXZzKTtcbiAgYXZzLnN0b3BSZWNvcmRpbmcoKS50aGVuKGRhdGFWaWV3ID0+IHtcbiAgICBhdnMucGxheWVyLmVtcHR5UXVldWUoKVxuICAgICAgLy8gLnRoZW4oKCkgPT4gYXZzLmF1ZGlvVG9CbG9iKGRhdGFWaWV3KSlcbiAgICAgIC8vIC50aGVuKGJsb2IgPT4gbG9nQXVkaW9CbG9iKGJsb2IsICdWT0lDRScpKVxuICAgICAgLy8gLnRoZW4oKCkgPT4gYXZzLnBsYXllci5lbnF1ZXVlKGRhdGFWaWV3KSlcbiAgICAgIC8vIC50aGVuKCgpID0+IGF2cy5wbGF5ZXIucGxheSgpKVxuICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICB9KTtcblxuICAgIHZhciBhYiA9IGZhbHNlO1xuICAgIC8vc2VuZEJsb2IoYmxvYik7XG4gICAgYXZzLnNlbmRBdWRpbyhkYXRhVmlldylcbiAgICAgIC50aGVuKCh7eGhyLCByZXNwb25zZX0pID0+IHtcblxuICAgICAgICB2YXIgcHJvbWlzZXMgPSBbXTtcbiAgICAgICAgdmFyIGF1ZGlvTWFwID0ge307XG4gICAgICAgIHZhciBkaXJlY3RpdmVzID0gbnVsbDtcblxuICAgICAgICBpZiAocmVzcG9uc2UubXVsdGlwYXJ0Lmxlbmd0aCkge1xuICAgICAgICAgIHJlc3BvbnNlLm11bHRpcGFydC5mb3JFYWNoKG11bHRpcGFydCA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtdWx0aXBhcnQpO1xuICAgICAgICAgICAgbGV0IGJvZHkgPSBtdWx0aXBhcnQuYm9keTtcbiAgICAgICAgICAgIGlmIChtdWx0aXBhcnQuaGVhZGVycyAmJiBtdWx0aXBhcnQuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPT09ICdhcHBsaWNhdGlvbi9qc29uJykge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGJvZHkgPSBKU09OLnBhcnNlKGJvZHkpO1xuXG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoYm9keSAmJiBib2R5Lm1lc3NhZ2VCb2R5ICYmIGJvZHkubWVzc2FnZUJvZHkuZGlyZWN0aXZlcykge1xuICAgICAgICAgICAgICAgIGRpcmVjdGl2ZXMgPSBib2R5Lm1lc3NhZ2VCb2R5LmRpcmVjdGl2ZXM7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAobXVsdGlwYXJ0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID09PSAnYXVkaW8vbXBlZycpIHtcbiAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBtdWx0aXBhcnQubWV0YS5ib2R5LmJ5dGVPZmZzZXQuc3RhcnQ7XG4gICAgICAgICAgICAgIGNvbnN0IGVuZCA9IG11bHRpcGFydC5tZXRhLmJvZHkuYnl0ZU9mZnNldC5lbmQ7XG5cbiAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAqIE5vdCBzdXJlIGlmIGJ1ZyBpbiBidWZmZXIgbW9kdWxlIG9yIGluIGh0dHAgbWVzc2FnZSBwYXJzZXJcbiAgICAgICAgICAgICAgICogYmVjYXVzZSBpdCdzIGpvaW5pbmcgYXJyYXlidWZmZXJzIHNvIEkgaGF2ZSB0byB0aGlzIHRvXG4gICAgICAgICAgICAgICAqIHNlcGVyYXRlIHRoZW0gb3V0LlxuICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgdmFyIHNsaWNlZEJvZHkgPSB4aHIucmVzcG9uc2Uuc2xpY2Uoc3RhcnQsIGVuZCk7XG5cbiAgICAgICAgICAgICAgLy9wcm9taXNlcy5wdXNoKGF2cy5wbGF5ZXIuZW5xdWV1ZShzbGljZWRCb2R5KSk7XG4gICAgICAgICAgICAgIGF1ZGlvTWFwW211bHRpcGFydC5oZWFkZXJzWydDb250ZW50LUlEJ11dID0gc2xpY2VkQm9keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGZ1bmN0aW9uIGZpbmRBdWRpb0Zyb21Db250ZW50SWQoY29udGVudElkKSB7XG4gICAgICAgICAgICBjb250ZW50SWQgPSBjb250ZW50SWQucmVwbGFjZSgnY2lkOicsICcnKTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBhdWRpb01hcCkge1xuICAgICAgICAgICAgICBpZiAoa2V5LmluZGV4T2YoY29udGVudElkKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF1ZGlvTWFwW2tleV07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBkaXJlY3RpdmVzLmZvckVhY2goZGlyZWN0aXZlID0+IHtcblxuICAgICAgICAgICAgaWYgKGRpcmVjdGl2ZS5uYW1lc3BhY2UgPT09ICdTcGVlY2hTeW50aGVzaXplcicpIHtcbiAgICAgICAgICAgICAgaWYgKGRpcmVjdGl2ZS5uYW1lID09PSAnc3BlYWsnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudElkID0gZGlyZWN0aXZlLnBheWxvYWQuYXVkaW9Db250ZW50O1xuICAgICAgICAgICAgICAgIGNvbnN0IGF1ZGlvID0gZmluZEF1ZGlvRnJvbUNvbnRlbnRJZChjb250ZW50SWQpO1xuICAgICAgICAgICAgICAgIGlmIChhdWRpbykge1xuICAgICAgICAgICAgICAgICAgYXZzLmF1ZGlvVG9CbG9iKGF1ZGlvKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihibG9iID0+IGxvZ0F1ZGlvQmxvYihibG9iLCAnUkVTUE9OU0UnKSk7XG4gICAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKGF2cy5wbGF5ZXIuZW5xdWV1ZShhdWRpbykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChkaXJlY3RpdmUubmFtZXNwYWNlID09PSAnQXVkaW9QbGF5ZXInKSB7XG4gICAgICAgICAgICAgIGlmIChkaXJlY3RpdmUubmFtZSA9PT0gJ3BsYXknKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RyZWFtcyA9IGRpcmVjdGl2ZS5wYXlsb2FkLmF1ZGlvSXRlbS5zdHJlYW1zO1xuICAgICAgICAgICAgICAgIHN0cmVhbXMuZm9yRWFjaChzdHJlYW0gPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3Qgc3RyZWFtVXJsID0gc3RyZWFtLnN0cmVhbVVybDtcblxuICAgICAgICAgICAgICAgICAgY29uc3QgYXVkaW8gPSBmaW5kQXVkaW9Gcm9tQ29udGVudElkKHN0cmVhbVVybCk7XG4gICAgICAgICAgICAgICAgICBpZiAoYXVkaW8pIHtcbiAgICAgICAgICAgICAgICAgICAgYXZzLmF1ZGlvVG9CbG9iKGF1ZGlvKVxuICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGJsb2IgPT4gbG9nQXVkaW9CbG9iKGJsb2IsICdSRVNQT05TRScpKTtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaChhdnMucGxheWVyLmVucXVldWUoYXVkaW8pKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RyZWFtVXJsLmluZGV4T2YoJ2h0dHAnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1cmwgPSBgL3BhcnNlLW0zdT91cmw9JHtzdHJlYW1VcmwucmVwbGFjZSgvIS4qJC8sICcnKX1gO1xuICAgICAgICAgICAgICAgICAgICB4aHIub3BlbignR0VUJywgdXJsLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdqc29uJztcbiAgICAgICAgICAgICAgICAgICAgeGhyLm9ubG9hZCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHVybHMgPSBldmVudC5jdXJyZW50VGFyZ2V0LnJlc3BvbnNlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgdXJscy5mb3JFYWNoKHVybCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdnMucGxheWVyLmVucXVldWUodXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgeGhyLnNlbmQoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChkaXJlY3RpdmUubmFtZXNwYWNlID09PSAnU3BlZWNoUmVjb2duaXplcicpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aXZlLm5hbWUgPT09ICdsaXN0ZW4nKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB0aW1lb3V0ID0gZGlyZWN0aXZlLnBheWxvYWQudGltZW91dEludGVydmFsSW5NaWxsaXM7XG4gICAgICAgICAgICAgICAgICAvLyBlbmFibGUgbWljXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAocHJvbWlzZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGF2cy5wbGF5ZXIucGxheVF1ZXVlKClcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLnRoZW4oKCk9PiB7XG4gICAgICAgICAgICAgICAgY2hlY2tGb3JMb2NhdGlvbigpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgfSlcblxuICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICB9KTtcbiAgfSk7XG59KTtcblxuc3RvcEF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gIGF2cy5wbGF5ZXIuc3RvcCgpO1xufSk7XG5cbnBhdXNlQXVkaW8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcbiAgYXZzLnBsYXllci5wYXVzZSgpO1xufSk7XG5cbnBsYXlBdWRpby5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICBhdnMucGxheWVyLnBsYXkoKTtcbn0pO1xuXG5yZXBsYXlBdWRpby5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICBhdnMucGxheWVyLnJlcGxheSgpO1xufSk7XG5mdW5jdGlvbiBjaGVja0ZvckxvY2F0aW9uKCkge1xuICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgeGhyLm9wZW4oJ0dFVCcsICdodHRwczovL3RoZWdhc3Ryby5jbHViL2xhc3RldmVudCcsIHRydWUpO1xuICB4aHIucmVzcG9uc2VUeXBlID0gJ2pzb24nO1xuICB4aHIub25sb2FkID0gKGV2ZW50KSA9PiB7XG4gICAgaWYgKHhoci5zdGF0dXMgPT0gMjAwKSB7XG4gICAgICBsZXQgcmVzcCA9IHhoci5yZXNwb25zZTtcbiAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgIH1cbiAgfVxuICB4aHIuc2VuZCgpO1xufVxuZnVuY3Rpb24gc2VuZEJsb2IoYmxvYikge1xuICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgY29uc3QgZmQgPSBuZXcgRm9ybURhdGEoKTtcblxuICBmZC5hcHBlbmQoJ2ZuYW1lJywgJ2F1ZGlvLndhdicpO1xuICBmZC5hcHBlbmQoJ2RhdGEnLCBibG9iKTtcblxuICB4aHIub3BlbignUE9TVCcsICdodHRwOi8vbG9jYWxob3N0OjU1NTUvYXVkaW8nLCB0cnVlKTtcbiAgeGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJztcblxuICB4aHIub25sb2FkID0gKGV2ZW50KSA9PiB7XG4gICAgaWYgKHhoci5zdGF0dXMgPT0gMjAwKSB7XG4gICAgICBjb25zb2xlLmxvZyh4aHIucmVzcG9uc2UpO1xuICAgICAgLy9jb25zdCByZXNwb25zZUJsb2IgPSBuZXcgQmxvYihbeGhyLnJlc3BvbnNlXSwge3R5cGU6ICdhdWRpby9tcDMnfSk7XG4gICAgfVxuICB9O1xuXG4gIHhoci5zZW5kKGZkKTtcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnRzLnRvQnl0ZUFycmF5ID0gdG9CeXRlQXJyYXlcbmV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IGZyb21CeXRlQXJyYXlcblxudmFyIGxvb2t1cCA9IFtdXG52YXIgcmV2TG9va3VwID0gW11cbnZhciBBcnIgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgPyBVaW50OEFycmF5IDogQXJyYXlcblxuZnVuY3Rpb24gaW5pdCAoKSB7XG4gIHZhciBjb2RlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjb2RlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgbG9va3VwW2ldID0gY29kZVtpXVxuICAgIHJldkxvb2t1cFtjb2RlLmNoYXJDb2RlQXQoaSldID0gaVxuICB9XG5cbiAgcmV2TG9va3VwWyctJy5jaGFyQ29kZUF0KDApXSA9IDYyXG4gIHJldkxvb2t1cFsnXycuY2hhckNvZGVBdCgwKV0gPSA2M1xufVxuXG5pbml0KClcblxuZnVuY3Rpb24gdG9CeXRlQXJyYXkgKGI2NCkge1xuICB2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuICB2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXG4gIGlmIChsZW4gJSA0ID4gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG4gIH1cblxuICAvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuICAvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG4gIC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuICAvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcbiAgLy8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuICBwbGFjZUhvbGRlcnMgPSBiNjRbbGVuIC0gMl0gPT09ICc9JyA/IDIgOiBiNjRbbGVuIC0gMV0gPT09ICc9JyA/IDEgOiAwXG5cbiAgLy8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG4gIGFyciA9IG5ldyBBcnIobGVuICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cbiAgLy8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuICBsID0gcGxhY2VIb2xkZXJzID4gMCA/IGxlbiAtIDQgOiBsZW5cblxuICB2YXIgTCA9IDBcblxuICBmb3IgKGkgPSAwLCBqID0gMDsgaSA8IGw7IGkgKz0gNCwgaiArPSAzKSB7XG4gICAgdG1wID0gKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTgpIHwgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDEyKSB8IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA8PCA2KSB8IHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMyldXG4gICAgYXJyW0wrK10gPSAodG1wID4+IDE2KSAmIDB4RkZcbiAgICBhcnJbTCsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW0wrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG4gICAgdG1wID0gKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMikgfCAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPj4gNClcbiAgICBhcnJbTCsrXSA9IHRtcCAmIDB4RkZcbiAgfSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcbiAgICB0bXAgPSAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxMCkgfCAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgNCkgfCAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPj4gMilcbiAgICBhcnJbTCsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW0wrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG4gIHJldHVybiBsb29rdXBbbnVtID4+IDE4ICYgMHgzRl0gKyBsb29rdXBbbnVtID4+IDEyICYgMHgzRl0gKyBsb29rdXBbbnVtID4+IDYgJiAweDNGXSArIGxvb2t1cFtudW0gJiAweDNGXVxufVxuXG5mdW5jdGlvbiBlbmNvZGVDaHVuayAodWludDgsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHRtcFxuICB2YXIgb3V0cHV0ID0gW11cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpICs9IDMpIHtcbiAgICB0bXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG4gICAgb3V0cHV0LnB1c2godHJpcGxldFRvQmFzZTY0KHRtcCkpXG4gIH1cbiAgcmV0dXJuIG91dHB1dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBmcm9tQnl0ZUFycmF5ICh1aW50OCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW4gPSB1aW50OC5sZW5ndGhcbiAgdmFyIGV4dHJhQnl0ZXMgPSBsZW4gJSAzIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG4gIHZhciBvdXRwdXQgPSAnJ1xuICB2YXIgcGFydHMgPSBbXVxuICB2YXIgbWF4Q2h1bmtMZW5ndGggPSAxNjM4MyAvLyBtdXN0IGJlIG11bHRpcGxlIG9mIDNcblxuICAvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4yID0gbGVuIC0gZXh0cmFCeXRlczsgaSA8IGxlbjI7IGkgKz0gbWF4Q2h1bmtMZW5ndGgpIHtcbiAgICBwYXJ0cy5wdXNoKGVuY29kZUNodW5rKHVpbnQ4LCBpLCAoaSArIG1heENodW5rTGVuZ3RoKSA+IGxlbjIgPyBsZW4yIDogKGkgKyBtYXhDaHVua0xlbmd0aCkpKVxuICB9XG5cbiAgLy8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuICBpZiAoZXh0cmFCeXRlcyA9PT0gMSkge1xuICAgIHRtcCA9IHVpbnQ4W2xlbiAtIDFdXG4gICAgb3V0cHV0ICs9IGxvb2t1cFt0bXAgPj4gMl1cbiAgICBvdXRwdXQgKz0gbG9va3VwWyh0bXAgPDwgNCkgJiAweDNGXVxuICAgIG91dHB1dCArPSAnPT0nXG4gIH0gZWxzZSBpZiAoZXh0cmFCeXRlcyA9PT0gMikge1xuICAgIHRtcCA9ICh1aW50OFtsZW4gLSAyXSA8PCA4KSArICh1aW50OFtsZW4gLSAxXSlcbiAgICBvdXRwdXQgKz0gbG9va3VwW3RtcCA+PiAxMF1cbiAgICBvdXRwdXQgKz0gbG9va3VwWyh0bXAgPj4gNCkgJiAweDNGXVxuICAgIG91dHB1dCArPSBsb29rdXBbKHRtcCA8PCAyKSAmIDB4M0ZdXG4gICAgb3V0cHV0ICs9ICc9J1xuICB9XG5cbiAgcGFydHMucHVzaChvdXRwdXQpXG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJycpXG59XG4iLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xuXG4ndXNlIHN0cmljdCdcblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpc2FycmF5JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBEdWUgdG8gdmFyaW91cyBicm93c2VyIGJ1Z3MsIHNvbWV0aW1lcyB0aGUgT2JqZWN0IGltcGxlbWVudGF0aW9uIHdpbGwgYmUgdXNlZCBldmVuXG4gKiB3aGVuIHRoZSBicm93c2VyIHN1cHBvcnRzIHR5cGVkIGFycmF5cy5cbiAqXG4gKiBOb3RlOlxuICpcbiAqICAgLSBGaXJlZm94IDQtMjkgbGFja3Mgc3VwcG9ydCBmb3IgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YCBpbnN0YW5jZXMsXG4gKiAgICAgU2VlOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzguXG4gKlxuICogICAtIENocm9tZSA5LTEwIGlzIG1pc3NpbmcgdGhlIGBUeXBlZEFycmF5LnByb3RvdHlwZS5zdWJhcnJheWAgZnVuY3Rpb24uXG4gKlxuICogICAtIElFMTAgaGFzIGEgYnJva2VuIGBUeXBlZEFycmF5LnByb3RvdHlwZS5zdWJhcnJheWAgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhcnJheXMgb2ZcbiAqICAgICBpbmNvcnJlY3QgbGVuZ3RoIGluIHNvbWUgc2l0dWF0aW9ucy5cblxuICogV2UgZGV0ZWN0IHRoZXNlIGJ1Z2d5IGJyb3dzZXJzIGFuZCBzZXQgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYCB0byBgZmFsc2VgIHNvIHRoZXlcbiAqIGdldCB0aGUgT2JqZWN0IGltcGxlbWVudGF0aW9uLCB3aGljaCBpcyBzbG93ZXIgYnV0IGJlaGF2ZXMgY29ycmVjdGx5LlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IGdsb2JhbC5UWVBFRF9BUlJBWV9TVVBQT1JUICE9PSB1bmRlZmluZWRcbiAgPyBnbG9iYWwuVFlQRURfQVJSQVlfU1VQUE9SVFxuICA6IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuLypcbiAqIEV4cG9ydCBrTWF4TGVuZ3RoIGFmdGVyIHR5cGVkIGFycmF5IHN1cHBvcnQgaXMgZGV0ZXJtaW5lZC5cbiAqL1xuZXhwb3J0cy5rTWF4TGVuZ3RoID0ga01heExlbmd0aCgpXG5cbmZ1bmN0aW9uIHR5cGVkQXJyYXlTdXBwb3J0ICgpIHtcbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyICYmIC8vIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkXG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgJiYgLy8gY2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gICAgICAgIGFyci5zdWJhcnJheSgxLCAxKS5ieXRlTGVuZ3RoID09PSAwIC8vIGllMTAgaGFzIGJyb2tlbiBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5mdW5jdGlvbiBrTWF4TGVuZ3RoICgpIHtcbiAgcmV0dXJuIEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUXG4gICAgPyAweDdmZmZmZmZmXG4gICAgOiAweDNmZmZmZmZmXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlciAodGhhdCwgbGVuZ3RoKSB7XG4gIGlmIChrTWF4TGVuZ3RoKCkgPCBsZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW52YWxpZCB0eXBlZCBhcnJheSBsZW5ndGgnKVxuICB9XG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlLCBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIHRoYXQgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gICAgdGhhdC5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIGlmICh0aGF0ID09PSBudWxsKSB7XG4gICAgICB0aGF0ID0gbmV3IEJ1ZmZlcihsZW5ndGgpXG4gICAgfVxuICAgIHRoYXQubGVuZ3RoID0gbGVuZ3RoXG4gIH1cblxuICByZXR1cm4gdGhhdFxufVxuXG4vKipcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgaGF2ZSB0aGVpclxuICogcHJvdG90eXBlIGNoYW5nZWQgdG8gYEJ1ZmZlci5wcm90b3R5cGVgLiBGdXJ0aGVybW9yZSwgYEJ1ZmZlcmAgaXMgYSBzdWJjbGFzcyBvZlxuICogYFVpbnQ4QXJyYXlgLCBzbyB0aGUgcmV0dXJuZWQgaW5zdGFuY2VzIHdpbGwgaGF2ZSBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgbWV0aG9kc1xuICogYW5kIHRoZSBgVWludDhBcnJheWAgbWV0aG9kcy4gU3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXRcbiAqIHJldHVybnMgYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogVGhlIGBVaW50OEFycmF5YCBwcm90b3R5cGUgcmVtYWlucyB1bm1vZGlmaWVkLlxuICovXG5cbmZ1bmN0aW9uIEJ1ZmZlciAoYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiAhKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICAvLyBDb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZ09yT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnSWYgZW5jb2RpbmcgaXMgc3BlY2lmaWVkIHRoZW4gdGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBzdHJpbmcnXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBhbGxvY1Vuc2FmZSh0aGlzLCBhcmcpXG4gIH1cbiAgcmV0dXJuIGZyb20odGhpcywgYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG4vLyBUT0RPOiBMZWdhY3ksIG5vdCBuZWVkZWQgYW55bW9yZS4gUmVtb3ZlIGluIG5leHQgbWFqb3IgdmVyc2lvbi5cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgYXJyLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiBmcm9tICh0aGF0LCB2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJ2YWx1ZVwiIGFyZ3VtZW50IG11c3Qgbm90IGJlIGEgbnVtYmVyJylcbiAgfVxuXG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIgIT09ICd1bmRlZmluZWQnICYmIHZhbHVlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHRoYXQsIHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHRoYXQsIHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0KVxuICB9XG5cbiAgcmV0dXJuIGZyb21PYmplY3QodGhhdCwgdmFsdWUpXG59XG5cbi8qKlxuICogRnVuY3Rpb25hbGx5IGVxdWl2YWxlbnQgdG8gQnVmZmVyKGFyZywgZW5jb2RpbmcpIGJ1dCB0aHJvd3MgYSBUeXBlRXJyb3JcbiAqIGlmIHZhbHVlIGlzIGEgbnVtYmVyLlxuICogQnVmZmVyLmZyb20oc3RyWywgZW5jb2RpbmddKVxuICogQnVmZmVyLmZyb20oYXJyYXkpXG4gKiBCdWZmZXIuZnJvbShidWZmZXIpXG4gKiBCdWZmZXIuZnJvbShhcnJheUJ1ZmZlclssIGJ5dGVPZmZzZXRbLCBsZW5ndGhdXSlcbiAqKi9cbkJ1ZmZlci5mcm9tID0gZnVuY3Rpb24gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGZyb20obnVsbCwgdmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gIEJ1ZmZlci5wcm90b3R5cGUuX19wcm90b19fID0gVWludDhBcnJheS5wcm90b3R5cGVcbiAgQnVmZmVyLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXlcbiAgaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC5zcGVjaWVzICYmXG4gICAgICBCdWZmZXJbU3ltYm9sLnNwZWNpZXNdID09PSBCdWZmZXIpIHtcbiAgICAvLyBGaXggc3ViYXJyYXkoKSBpbiBFUzIwMTYuIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvcHVsbC85N1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIsIFN5bWJvbC5zcGVjaWVzLCB7XG4gICAgICB2YWx1ZTogbnVsbCxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pXG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzZXJ0U2l6ZSAoc2l6ZSkge1xuICBpZiAodHlwZW9mIHNpemUgIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBiZSBhIG51bWJlcicpXG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2MgKHRoYXQsIHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgaWYgKHNpemUgPD0gMCkge1xuICAgIHJldHVybiBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSlcbiAgfVxuICBpZiAoZmlsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT25seSBwYXkgYXR0ZW50aW9uIHRvIGVuY29kaW5nIGlmIGl0J3MgYSBzdHJpbmcuIFRoaXNcbiAgICAvLyBwcmV2ZW50cyBhY2NpZGVudGFsbHkgc2VuZGluZyBpbiBhIG51bWJlciB0aGF0IHdvdWxkXG4gICAgLy8gYmUgaW50ZXJwcmV0dGVkIGFzIGEgc3RhcnQgb2Zmc2V0LlxuICAgIHJldHVybiB0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnXG4gICAgICA/IGNyZWF0ZUJ1ZmZlcih0aGF0LCBzaXplKS5maWxsKGZpbGwsIGVuY29kaW5nKVxuICAgICAgOiBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSkuZmlsbChmaWxsKVxuICB9XG4gIHJldHVybiBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiBhbGxvYyhzaXplWywgZmlsbFssIGVuY29kaW5nXV0pXG4gKiovXG5CdWZmZXIuYWxsb2MgPSBmdW5jdGlvbiAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGFsbG9jKG51bGwsIHNpemUsIGZpbGwsIGVuY29kaW5nKVxufVxuXG5mdW5jdGlvbiBhbGxvY1Vuc2FmZSAodGhhdCwgc2l6ZSkge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIHRoYXQgPSBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSA8IDAgPyAwIDogY2hlY2tlZChzaXplKSB8IDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgdGhhdFtpXSA9IDBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIEJ1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShudWxsLCBzaXplKVxufVxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIFNsb3dCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShudWxsLCBzaXplKVxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nICh0aGF0LCBzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gIH1cblxuICBpZiAoIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiZW5jb2RpbmdcIiBtdXN0IGJlIGEgdmFsaWQgc3RyaW5nIGVuY29kaW5nJylcbiAgfVxuXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB0aGF0ID0gY3JlYXRlQnVmZmVyKHRoYXQsIGxlbmd0aClcblxuICB0aGF0LndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUxpa2UgKHRoYXQsIGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBjcmVhdGVCdWZmZXIodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyICh0aGF0LCBhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKSB7XG4gIGFycmF5LmJ5dGVMZW5ndGggLy8gdGhpcyB0aHJvd3MgaWYgYGFycmF5YCBpcyBub3QgYSB2YWxpZCBBcnJheUJ1ZmZlclxuXG4gIGlmIChieXRlT2Zmc2V0IDwgMCB8fCBhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcXCdvZmZzZXRcXCcgaXMgb3V0IG9mIGJvdW5kcycpXG4gIH1cblxuICBpZiAoYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQgKyAobGVuZ3RoIHx8IDApKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1xcJ2xlbmd0aFxcJyBpcyBvdXQgb2YgYm91bmRzJylcbiAgfVxuXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQpXG4gIH0gZWxzZSB7XG4gICAgYXJyYXkgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UsIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgdGhhdCA9IGFycmF5XG4gICAgdGhhdC5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQgPSBmcm9tQXJyYXlMaWtlKHRoYXQsIGFycmF5KVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKHRoYXQsIG9iaikge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iaikpIHtcbiAgICB2YXIgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDBcbiAgICB0aGF0ID0gY3JlYXRlQnVmZmVyKHRoYXQsIGxlbilcblxuICAgIGlmICh0aGF0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoYXRcbiAgICB9XG5cbiAgICBvYmouY29weSh0aGF0LCAwLCAwLCBsZW4pXG4gICAgcmV0dXJuIHRoYXRcbiAgfVxuXG4gIGlmIChvYmopIHtcbiAgICBpZiAoKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgb2JqLmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB8fCAnbGVuZ3RoJyBpbiBvYmopIHtcbiAgICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgaXNuYW4ob2JqLmxlbmd0aCkpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcih0aGF0LCAwKVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZyb21BcnJheUxpa2UodGhhdCwgb2JqKVxuICAgIH1cblxuICAgIGlmIChvYmoudHlwZSA9PT0gJ0J1ZmZlcicgJiYgaXNBcnJheShvYmouZGF0YSkpIHtcbiAgICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKHRoYXQsIG9iai5kYXRhKVxuICAgIH1cbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCBvciBhcnJheS1saWtlIG9iamVjdC4nKVxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwga01heExlbmd0aGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBrTWF4TGVuZ3RoKCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsga01heExlbmd0aCgpLnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAoK2xlbmd0aCAhPSBsZW5ndGgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbiAgICBsZW5ndGggPSAwXG4gIH1cbiAgcmV0dXJuIEJ1ZmZlci5hbGxvYygrbGVuZ3RoKVxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyBtdXN0IGJlIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV1cbiAgICAgIHkgPSBiW2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiBpc0VuY29kaW5nIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdCAobGlzdCwgbGVuZ3RoKSB7XG4gIGlmICghaXNBcnJheShsaXN0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gIH1cblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gQnVmZmVyLmFsbG9jKDApXG4gIH1cblxuICB2YXIgaVxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWZmZXIgPSBCdWZmZXIuYWxsb2NVbnNhZmUobGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBidWYgPSBsaXN0W2ldXG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgICB9XG4gICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpXG4gICAgcG9zICs9IGJ1Zi5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sZW5ndGhcbiAgfVxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgQXJyYXlCdWZmZXIuaXNWaWV3ID09PSAnZnVuY3Rpb24nICYmXG4gICAgICAoQXJyYXlCdWZmZXIuaXNWaWV3KHN0cmluZykgfHwgc3RyaW5nIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5ieXRlTGVuZ3RoXG4gIH1cbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgc3RyaW5nID0gJycgKyBzdHJpbmdcbiAgfVxuXG4gIHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChsZW4gPT09IDApIHJldHVybiAwXG5cbiAgLy8gVXNlIGEgZm9yIGxvb3AgdG8gYXZvaWQgcmVjdXJzaW9uXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgLy8gRGVwcmVjYXRlZFxuICAgICAgY2FzZSAncmF3JzpcbiAgICAgIGNhc2UgJ3Jhd3MnOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgLy8gTm8gbmVlZCB0byB2ZXJpZnkgdGhhdCBcInRoaXMubGVuZ3RoIDw9IE1BWF9VSU5UMzJcIiBzaW5jZSBpdCdzIGEgcmVhZC1vbmx5XG4gIC8vIHByb3BlcnR5IG9mIGEgdHlwZWQgYXJyYXkuXG5cbiAgLy8gVGhpcyBiZWhhdmVzIG5laXRoZXIgbGlrZSBTdHJpbmcgbm9yIFVpbnQ4QXJyYXkgaW4gdGhhdCB3ZSBzZXQgc3RhcnQvZW5kXG4gIC8vIHRvIHRoZWlyIHVwcGVyL2xvd2VyIGJvdW5kcyBpZiB0aGUgdmFsdWUgcGFzc2VkIGlzIG91dCBvZiByYW5nZS5cbiAgLy8gdW5kZWZpbmVkIGlzIGhhbmRsZWQgc3BlY2lhbGx5IGFzIHBlciBFQ01BLTI2MiA2dGggRWRpdGlvbixcbiAgLy8gU2VjdGlvbiAxMy4zLjMuNyBSdW50aW1lIFNlbWFudGljczogS2V5ZWRCaW5kaW5nSW5pdGlhbGl6YXRpb24uXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkIHx8IHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIC8vIFJldHVybiBlYXJseSBpZiBzdGFydCA+IHRoaXMubGVuZ3RoLiBEb25lIGhlcmUgdG8gcHJldmVudCBwb3RlbnRpYWwgdWludDMyXG4gIC8vIGNvZXJjaW9uIGZhaWwgYmVsb3cuXG4gIGlmIChzdGFydCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKGVuZCA8PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICAvLyBGb3JjZSBjb2Vyc2lvbiB0byB1aW50MzIuIFRoaXMgd2lsbCBhbHNvIGNvZXJjZSBmYWxzZXkvTmFOIHZhbHVlcyB0byAwLlxuICBlbmQgPj4+PSAwXG4gIHN0YXJ0ID4+Pj0gMFxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gYmluYXJ5U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFRoZSBwcm9wZXJ0eSBpcyB1c2VkIGJ5IGBCdWZmZXIuaXNCdWZmZXJgIGFuZCBgaXMtYnVmZmVyYCAoaW4gU2FmYXJpIDUtNykgdG8gZGV0ZWN0XG4vLyBCdWZmZXIgaW5zdGFuY2VzLlxuQnVmZmVyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlXG5cbmZ1bmN0aW9uIHN3YXAgKGIsIG4sIG0pIHtcbiAgdmFyIGkgPSBiW25dXG4gIGJbbl0gPSBiW21dXG4gIGJbbV0gPSBpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDE2ID0gZnVuY3Rpb24gc3dhcDE2ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAxNi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAzMiA9IGZ1bmN0aW9uIHN3YXAzMiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgNCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMzItYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDMpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDIpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoIHwgMFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgaWYgKHRoaXMubGVuZ3RoID4gMCkge1xuICAgIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkubWF0Y2goLy57Mn0vZykuam9pbignICcpXG4gICAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KSBzdHIgKz0gJyAuLi4gJ1xuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKHRhcmdldCwgc3RhcnQsIGVuZCwgdGhpc1N0YXJ0LCB0aGlzRW5kKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5kID0gdGFyZ2V0ID8gdGFyZ2V0Lmxlbmd0aCA6IDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzU3RhcnQgPSAwXG4gIH1cbiAgaWYgKHRoaXNFbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNFbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBlbmQgPiB0YXJnZXQubGVuZ3RoIHx8IHRoaXNTdGFydCA8IDAgfHwgdGhpc0VuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ291dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQgJiYgc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIHN0YXJ0ID4+Pj0gMFxuICBlbmQgPj4+PSAwXG4gIHRoaXNTdGFydCA+Pj49IDBcbiAgdGhpc0VuZCA+Pj49IDBcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0KSByZXR1cm4gMFxuXG4gIHZhciB4ID0gdGhpc0VuZCAtIHRoaXNTdGFydFxuICB2YXIgeSA9IGVuZCAtIHN0YXJ0XG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuXG4gIHZhciB0aGlzQ29weSA9IHRoaXMuc2xpY2UodGhpc1N0YXJ0LCB0aGlzRW5kKVxuICB2YXIgdGFyZ2V0Q29weSA9IHRhcmdldC5zbGljZShzdGFydCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc0NvcHlbaV0gIT09IHRhcmdldENvcHlbaV0pIHtcbiAgICAgIHggPSB0aGlzQ29weVtpXVxuICAgICAgeSA9IHRhcmdldENvcHlbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5mdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICB2YXIgaW5kZXhTaXplID0gMVxuICB2YXIgYXJyTGVuZ3RoID0gYXJyLmxlbmd0aFxuICB2YXIgdmFsTGVuZ3RoID0gdmFsLmxlbmd0aFxuXG4gIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoZW5jb2RpbmcgPT09ICd1Y3MyJyB8fCBlbmNvZGluZyA9PT0gJ3Vjcy0yJyB8fFxuICAgICAgICBlbmNvZGluZyA9PT0gJ3V0ZjE2bGUnIHx8IGVuY29kaW5nID09PSAndXRmLTE2bGUnKSB7XG4gICAgICBpZiAoYXJyLmxlbmd0aCA8IDIgfHwgdmFsLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICBpbmRleFNpemUgPSAyXG4gICAgICBhcnJMZW5ndGggLz0gMlxuICAgICAgdmFsTGVuZ3RoIC89IDJcbiAgICAgIGJ5dGVPZmZzZXQgLz0gMlxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKGJ1ZiwgaSkge1xuICAgIGlmIChpbmRleFNpemUgPT09IDEpIHtcbiAgICAgIHJldHVybiBidWZbaV1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJ1Zi5yZWFkVUludDE2QkUoaSAqIGluZGV4U2l6ZSlcbiAgICB9XG4gIH1cblxuICB2YXIgZm91bmRJbmRleCA9IC0xXG4gIGZvciAodmFyIGkgPSAwOyBieXRlT2Zmc2V0ICsgaSA8IGFyckxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHJlYWQoYXJyLCBieXRlT2Zmc2V0ICsgaSkgPT09IHJlYWQodmFsLCBmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleCkpIHtcbiAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGlcbiAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbExlbmd0aCkgcmV0dXJuIChieXRlT2Zmc2V0ICsgZm91bmRJbmRleCkgKiBpbmRleFNpemVcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGZvdW5kSW5kZXggIT09IC0xKSBpIC09IGkgLSBmb3VuZEluZGV4XG4gICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBieXRlT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gYnl0ZU9mZnNldFxuICAgIGJ5dGVPZmZzZXQgPSAwXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIHtcbiAgICBieXRlT2Zmc2V0ID0gMHg3ZmZmZmZmZlxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkge1xuICAgIGJ5dGVPZmZzZXQgPSAtMHg4MDAwMDAwMFxuICB9XG4gIGJ5dGVPZmZzZXQgPj49IDBcblxuICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVybiAtMVxuICBpZiAoYnl0ZU9mZnNldCA+PSB0aGlzLmxlbmd0aCkgcmV0dXJuIC0xXG5cbiAgLy8gTmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBNYXRoLm1heCh0aGlzLmxlbmd0aCArIGJ5dGVPZmZzZXQsIDApXG5cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIHNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZylcbiAgfVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbCh0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YodGhpcywgWyB2YWwgXSwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWwgbXVzdCBiZSBzdHJpbmcsIG51bWJlciBvciBCdWZmZXInKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluY2x1ZGVzID0gZnVuY3Rpb24gaW5jbHVkZXMgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIHRoaXMuaW5kZXhPZih2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSAhPT0gLTFcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICAvLyBtdXN0IGJlIGFuIGV2ZW4gbnVtYmVyIG9mIGRpZ2l0c1xuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAoc3RyTGVuICUgMiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChpc05hTihwYXJzZWQpKSByZXR1cm4gaVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmluYXJ5V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiB1Y3MyV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gd3JpdGUgKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcpXG4gIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgb2Zmc2V0WywgbGVuZ3RoXVssIGVuY29kaW5nXSlcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggfCAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgLy8gbGVnYWN5IHdyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKSAtIHJlbW92ZSBpbiB2MC4xM1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdCdWZmZXIud3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0WywgbGVuZ3RoXSkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCdcbiAgICApXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIC8vIFdhcm5pbmc6IG1heExlbmd0aCBub3QgdGFrZW4gaW50byBhY2NvdW50IGluIGJhc2U2NFdyaXRlXG4gICAgICAgIHJldHVybiBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdWNzMldyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcbiAgdmFyIHJlcyA9IFtdXG5cbiAgdmFyIGkgPSBzdGFydFxuICB3aGlsZSAoaSA8IGVuZCkge1xuICAgIHZhciBmaXJzdEJ5dGUgPSBidWZbaV1cbiAgICB2YXIgY29kZVBvaW50ID0gbnVsbFxuICAgIHZhciBieXRlc1BlclNlcXVlbmNlID0gKGZpcnN0Qnl0ZSA+IDB4RUYpID8gNFxuICAgICAgOiAoZmlyc3RCeXRlID4gMHhERikgPyAzXG4gICAgICA6IChmaXJzdEJ5dGUgPiAweEJGKSA/IDJcbiAgICAgIDogMVxuXG4gICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgdmFyIHNlY29uZEJ5dGUsIHRoaXJkQnl0ZSwgZm91cnRoQnl0ZSwgdGVtcENvZGVQb2ludFxuXG4gICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChmaXJzdEJ5dGUgPCAweDgwKSB7XG4gICAgICAgICAgICBjb2RlUG9pbnQgPSBmaXJzdEJ5dGVcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxRikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4QyB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKHRoaXJkQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0ZGICYmICh0ZW1wQ29kZVBvaW50IDwgMHhEODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweERGRkYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGZvdXJ0aEJ5dGUgPSBidWZbaSArIDNdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwICYmIChmb3VydGhCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweDEyIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweEMgfCAodGhpcmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKGZvdXJ0aEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweEZGRkYgJiYgdGVtcENvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA9PT0gbnVsbCkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBnZW5lcmF0ZSBhIHZhbGlkIGNvZGVQb2ludCBzbyBpbnNlcnQgYVxuICAgICAgLy8gcmVwbGFjZW1lbnQgY2hhciAoVStGRkZEKSBhbmQgYWR2YW5jZSBvbmx5IDEgYnl0ZVxuICAgICAgY29kZVBvaW50ID0gMHhGRkZEXG4gICAgICBieXRlc1BlclNlcXVlbmNlID0gMVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhGRkZGKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDBcbiAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMClcbiAgICAgIGNvZGVQb2ludCA9IDB4REMwMCB8IGNvZGVQb2ludCAmIDB4M0ZGXG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KVxuICAgIGkgKz0gYnl0ZXNQZXJTZXF1ZW5jZVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUNvZGVQb2ludHNBcnJheShyZXMpXG59XG5cbi8vIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyNzQ3MjcyLzY4MDc0MiwgdGhlIGJyb3dzZXIgd2l0aFxuLy8gdGhlIGxvd2VzdCBsaW1pdCBpcyBDaHJvbWUsIHdpdGggMHgxMDAwMCBhcmdzLlxuLy8gV2UgZ28gMSBtYWduaXR1ZGUgbGVzcywgZm9yIHNhZmV0eVxudmFyIE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwXG5cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICB2YXIgbGVuID0gY29kZVBvaW50cy5sZW5ndGhcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG5cbiAgLy8gRGVjb2RlIGluIGNodW5rcyB0byBhdm9pZCBcImNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiLlxuICB2YXIgcmVzID0gJydcbiAgdmFyIGkgPSAwXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0gJiAweDdGKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gYmluYXJ5U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2kgKyAxXSAqIDI1NilcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiBzbGljZSAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgICBuZXdCdWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICB9IGVsc2Uge1xuICAgIHZhciBzbGljZUxlbiA9IGVuZCAtIHN0YXJ0XG4gICAgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47IGkrKykge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcbiAgfVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF1cbiAgdmFyIG11bCA9IDFcbiAgd2hpbGUgKGJ5dGVMZW5ndGggPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIHJlYWRVSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiByZWFkVUludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50QkUgPSBmdW5jdGlvbiByZWFkSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gcmVhZEludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgMjQpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdExFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiByZWFkRG91YmxlQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVVSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCA0KTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSAtIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSArIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcbiAgdmFyIGlcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHN0YXJ0IDwgdGFyZ2V0U3RhcnQgJiYgdGFyZ2V0U3RhcnQgPCBlbmQpIHtcbiAgICAvLyBkZXNjZW5kaW5nIGNvcHkgZnJvbSBlbmRcbiAgICBmb3IgKGkgPSBsZW4gLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSBpZiAobGVuIDwgMTAwMCB8fCAhQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBhc2NlbmRpbmcgY29weSBmcm9tIHN0YXJ0XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBVaW50OEFycmF5LnByb3RvdHlwZS5zZXQuY2FsbChcbiAgICAgIHRhcmdldCxcbiAgICAgIHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSxcbiAgICAgIHRhcmdldFN0YXJ0XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBVc2FnZTpcbi8vICAgIGJ1ZmZlci5maWxsKG51bWJlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoYnVmZmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChzdHJpbmdbLCBvZmZzZXRbLCBlbmRdXVssIGVuY29kaW5nXSlcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbCwgc3RhcnQsIGVuZCwgZW5jb2RpbmcpIHtcbiAgLy8gSGFuZGxlIHN0cmluZyBjYXNlczpcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gc3RhcnRcbiAgICAgIHN0YXJ0ID0gMFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IGVuZFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDEpIHtcbiAgICAgIHZhciBjb2RlID0gdmFsLmNoYXJDb2RlQXQoMClcbiAgICAgIGlmIChjb2RlIDwgMjU2KSB7XG4gICAgICAgIHZhbCA9IGNvZGVcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZW5jb2RpbmcgbXVzdCBiZSBhIHN0cmluZycpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnICYmICFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAyNTVcbiAgfVxuXG4gIC8vIEludmFsaWQgcmFuZ2VzIGFyZSBub3Qgc2V0IHRvIGEgZGVmYXVsdCwgc28gY2FuIHJhbmdlIGNoZWNrIGVhcmx5LlxuICBpZiAoc3RhcnQgPCAwIHx8IHRoaXMubGVuZ3RoIDwgc3RhcnQgfHwgdGhpcy5sZW5ndGggPCBlbmQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignT3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCF2YWwpIHZhbCA9IDBcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gdmFsXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IEJ1ZmZlci5pc0J1ZmZlcih2YWwpXG4gICAgICA/IHZhbFxuICAgICAgOiB1dGY4VG9CeXRlcyhuZXcgQnVmZmVyKHZhbCwgZW5jb2RpbmcpLnRvU3RyaW5nKCkpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGZvciAoaSA9IDA7IGkgPCBlbmQgLSBzdGFydDsgaSsrKSB7XG4gICAgICB0aGlzW2kgKyBzdGFydF0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teK1xcLzAtOUEtWmEtei1fXS9nXG5cbmZ1bmN0aW9uIGJhc2U2NGNsZWFuIChzdHIpIHtcbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0cmluZ3RyaW0oc3RyKS5yZXBsYWNlKElOVkFMSURfQkFTRTY0X1JFLCAnJylcbiAgLy8gTm9kZSBjb252ZXJ0cyBzdHJpbmdzIHdpdGggbGVuZ3RoIDwgMiB0byAnJ1xuICBpZiAoc3RyLmxlbmd0aCA8IDIpIHJldHVybiAnJ1xuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiBzdHJpbmd0cmltIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gKGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDApICsgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIGlzbmFuICh2YWwpIHtcbiAgcmV0dXJuIHZhbCAhPT0gdmFsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG59XG4iLCJleHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsInZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKGFycikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29uc3QgQVZTID0gcmVxdWlyZSgnLi9saWIvQVZTJyk7XG5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gQVZTO1xuICAgIH1cbiAgICBleHBvcnRzLkFWUyA9IEFWUztcbiAgfVxuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoW10sIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIEFWUztcbiAgICB9KTtcbiAgfVxuXG4gIGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0Jykge1xuICAgIHdpbmRvdy5BVlMgPSBBVlM7XG4gIH1cbn0pKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IEJ1ZmZlciA9IHJlcXVpcmUoJ2J1ZmZlcicpLkJ1ZmZlcjtcbmNvbnN0IHFzID0gcmVxdWlyZSgncXMnKTtcbmNvbnN0IGh0dHBNZXNzYWdlUGFyc2VyID0gcmVxdWlyZSgnaHR0cC1tZXNzYWdlLXBhcnNlcicpO1xuXG5jb25zdCBBTUFaT05fRVJST1JfQ09ERVMgPSByZXF1aXJlKCcuL0FtYXpvbkVycm9yQ29kZXMuanMnKTtcbmNvbnN0IE9ic2VydmFibGUgPSByZXF1aXJlKCcuL09ic2VydmFibGUuanMnKTtcbmNvbnN0IFBsYXllciA9IHJlcXVpcmUoJy4vUGxheWVyLmpzJyk7XG5jb25zdCBhcnJheUJ1ZmZlclRvU3RyaW5nID0gcmVxdWlyZSgnLi91dGlscy9hcnJheUJ1ZmZlclRvU3RyaW5nLmpzJyk7XG5jb25zdCB3cml0ZVVURkJ5dGVzID0gcmVxdWlyZSgnLi91dGlscy93cml0ZVVURkJ5dGVzLmpzJyk7XG5jb25zdCBtZXJnZUJ1ZmZlcnMgPSByZXF1aXJlKCcuL3V0aWxzL21lcmdlQnVmZmVycy5qcycpO1xuY29uc3QgaW50ZXJsZWF2ZSA9IHJlcXVpcmUoJy4vdXRpbHMvaW50ZXJsZWF2ZS5qcycpO1xuY29uc3QgZG93bnNhbXBsZUJ1ZmZlciA9IHJlcXVpcmUoJy4vdXRpbHMvZG93bnNhbXBsZUJ1ZmZlci5qcycpO1xuXG5jbGFzcyBBVlMge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICBPYnNlcnZhYmxlKHRoaXMpO1xuXG4gICAgdGhpcy5fYnVmZmVyU2l6ZSA9IDIwNDg7XG4gICAgdGhpcy5faW5wdXRDaGFubmVscyA9IDE7XG4gICAgdGhpcy5fb3V0cHV0Q2hhbm5lbHMgPSAxO1xuICAgIHRoaXMuX2xlZnRDaGFubmVsID0gW107XG4gICAgdGhpcy5fcmlnaHRDaGFubmVsID0gW107XG4gICAgdGhpcy5fYXVkaW9Db250ZXh0ID0gbnVsbDtcbiAgICB0aGlzLl9yZWNvcmRlciA9IG51bGw7XG4gICAgdGhpcy5fc2FtcGxlUmF0ZSA9IG51bGw7XG4gICAgdGhpcy5fb3V0cHV0U2FtcGxlUmF0ZSA9IDE2MDAwO1xuICAgIHRoaXMuX2F1ZGlvSW5wdXQgPSBudWxsO1xuICAgIHRoaXMuX3ZvbHVtZU5vZGUgPSBudWxsO1xuICAgIHRoaXMuX2RlYnVnID0gZmFsc2U7XG4gICAgdGhpcy5fdG9rZW4gPSBudWxsO1xuICAgIHRoaXMuX3JlZnJlc2hUb2tlbiA9IG51bGw7XG4gICAgdGhpcy5fY2xpZW50SWQgPSBudWxsO1xuICAgIHRoaXMuX2NsaWVudFNlY3JldCA9IG51bGw7XG4gICAgdGhpcy5fZGV2aWNlSWQ9IG51bGw7XG4gICAgdGhpcy5fZGV2aWNlU2VyaWFsTnVtYmVyID0gbnVsbDtcbiAgICB0aGlzLl9yZWRpcmVjdFVyaSA9IG51bGw7XG4gICAgdGhpcy5fYXVkaW9RdWV1ZSA9IFtdO1xuXG4gICAgaWYgKG9wdGlvbnMudG9rZW4pIHtcbiAgICAgIHRoaXMuc2V0VG9rZW4ob3B0aW9ucy50b2tlbik7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMucmVmcmVzaFRva2VuKSB7XG4gICAgICB0aGlzLnNldFJlZnJlc2hUb2tlbihvcHRpb25zLnJlZnJlc2hUb2tlbik7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuY2xpZW50SWQpIHtcbiAgICAgIHRoaXMuc2V0Q2xpZW50SWQob3B0aW9ucy5jbGllbnRJZCk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuY2xpZW50U2VjcmV0KSB7XG4gICAgICB0aGlzLnNldENsaWVudFNlY3JldChvcHRpb25zLmNsaWVudFNlY3JldCk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuZGV2aWNlSWQpIHtcbiAgICAgIHRoaXMuc2V0RGV2aWNlSWQob3B0aW9ucy5kZXZpY2VJZCk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuZGV2aWNlU2VyaWFsTnVtYmVyKSB7XG4gICAgICB0aGlzLnNldERldmljZVNlcmlhbE51bWJlcihvcHRpb25zLmRldmljZVNlcmlhbE51bWJlcik7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMucmVkaXJlY3RVcmkpIHtcbiAgICAgIHRoaXMuc2V0UmVkaXJlY3RVcmkob3B0aW9ucy5yZWRpcmVjdFVyaSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuZGVidWcpIHtcbiAgICAgIHRoaXMuc2V0RGVidWcob3B0aW9ucy5kZWJ1Zyk7XG4gICAgfVxuXG4gICAgdGhpcy5wbGF5ZXIgPSBuZXcgUGxheWVyKCk7XG4gIH1cblxuICBfbG9nKHR5cGUsIG1lc3NhZ2UpIHtcbiAgICBpZiAodHlwZSAmJiAhbWVzc2FnZSkge1xuICAgICAgbWVzc2FnZSA9IHR5cGU7XG4gICAgICB0eXBlID0gJ2xvZyc7XG4gICAgfVxuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLmVtaXQoQVZTLkV2ZW50VHlwZXMuTE9HLCBtZXNzYWdlKTtcbiAgICB9LCAwKTtcblxuICAgIGlmICh0aGlzLl9kZWJ1Zykge1xuICAgICAgY29uc29sZVt0eXBlXShtZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICBsb2dpbihvcHRpb25zID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5wcm9tcHRVc2VyTG9naW4ob3B0aW9ucyk7XG4gIH1cblxuICBsb2dvdXQoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuX3Rva2VuID0gbnVsbDtcbiAgICAgIHRoaXMuX3JlZnJlc2hUb2tlbiA9IG51bGw7XG4gICAgICB0aGlzLmVtaXQoQVZTLkV2ZW50VHlwZXMuTE9HT1VUKTtcbiAgICAgIHRoaXMuX2xvZygnTG9nZ2VkIG91dCcpO1xuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJvbXB0VXNlckxvZ2luKG9wdGlvbnMgPSB7cmVzcG9uc2VUeXBlOiAndG9rZW4nLCBuZXdXaW5kb3c6IGZhbHNlfSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZiAodHlwZW9mIG9wdGlvbnMucmVzcG9uc2VUeXBlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBvcHRpb25zLnJlc3BvbnNlVHlwZSA9ICd0b2tlbic7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yZXNwb25zZVR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKCdgcmVzcG9uc2VUeXBlYCBtdXN0IGEgc3RyaW5nLicpO1xuICAgICAgICB0aGlzLl9sb2coZXJyb3IpO1xuICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmV3V2luZG93ID0gISFvcHRpb25zLm5ld1dpbmRvdztcblxuICAgICAgY29uc3QgcmVzcG9uc2VUeXBlID0gb3B0aW9ucy5yZXNwb25zZVR5cGU7XG5cbiAgICAgIGlmICghKHJlc3BvbnNlVHlwZSA9PT0gJ2NvZGUnIHx8IHJlc3BvbnNlVHlwZSA9PT0gJ3Rva2VuJykpIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoJ2ByZXNwb25zZVR5cGVgIG11c3QgYmUgZWl0aGVyIGBjb2RlYCBvciBgdG9rZW5gLicpO1xuICAgICAgICB0aGlzLl9sb2coZXJyb3IpO1xuICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2NvcGUgPSAnYWxleGE6YWxsJztcbiAgICAgIGNvbnN0IHNjb3BlRGF0YSA9IHtcbiAgICAgICAgW3Njb3BlXToge1xuICAgICAgICAgIHByb2R1Y3RJRDogdGhpcy5fZGV2aWNlSWQsXG4gICAgICAgICAgcHJvZHVjdEluc3RhbmNlQXR0cmlidXRlczoge1xuICAgICAgICAgICAgZGV2aWNlU2VyaWFsTnVtYmVyOiB0aGlzLl9kZXZpY2VTZXJpYWxOdW1iZXJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGF1dGhVcmwgPSBgaHR0cHM6Ly93d3cuYW1hem9uLmNvbS9hcC9vYT9jbGllbnRfaWQ9JHt0aGlzLl9jbGllbnRJZH0mc2NvcGU9JHtlbmNvZGVVUklDb21wb25lbnQoc2NvcGUpfSZzY29wZV9kYXRhPSR7ZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHNjb3BlRGF0YSkpfSZyZXNwb25zZV90eXBlPSR7cmVzcG9uc2VUeXBlfSZyZWRpcmVjdF91cmk9JHtlbmNvZGVVUkkodGhpcy5fcmVkaXJlY3RVcmkpfWBcblxuICAgICAgaWYgKG5ld1dpbmRvdykge1xuICAgICAgICB3aW5kb3cub3BlbihhdXRoVXJsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gYXV0aFVybDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGdldFRva2VuRnJvbUNvZGUoY29kZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGNvZGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IFR5cGVFcnJvcignYGNvZGVgIG11c3QgYmUgYSBzdHJpbmcuJyk7XG4gICAgICAgIHRoaXMuX2xvZyhlcnJvcik7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBncmFudFR5cGUgPSAnYXV0aG9yaXphdGlvbl9jb2RlJztcbiAgICAgIGNvbnN0IHBvc3REYXRhID0gYGdyYW50X3R5cGU9JHtncmFudFR5cGV9JmNvZGU9JHtjb2RlfSZjbGllbnRfaWQ9JHt0aGlzLl9jbGllbnRJZH0mY2xpZW50X3NlY3JldD0ke3RoaXMuX2NsaWVudFNlY3JldH0mcmVkaXJlY3RfdXJpPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuX3JlZGlyZWN0VXJpKX1gO1xuICAgICAgY29uc3QgdXJsID0gJ2h0dHBzOi8vYXBpLmFtYXpvbi5jb20vYXV0aC9vMi90b2tlbic7XG5cbiAgICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICB4aHIub3BlbignUE9TVCcsIHVybCwgdHJ1ZSk7XG4gICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDtjaGFyc2V0PVVURi04Jyk7XG4gICAgICB4aHIub25sb2FkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGxldCByZXNwb25zZSA9IHhoci5yZXNwb25zZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2UpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHRoaXMuX2xvZyhlcnJvcik7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpc09iamVjdCA9IHJlc3BvbnNlIGluc3RhbmNlb2YgT2JqZWN0O1xuICAgICAgICBjb25zdCBlcnJvckRlc2NyaXB0aW9uID0gaXNPYmplY3QgJiYgcmVzcG9uc2UuZXJyb3JfZGVzY3JpcHRpb247XG5cbiAgICAgICAgaWYgKGVycm9yRGVzY3JpcHRpb24pIHtcbiAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihlcnJvckRlc2NyaXB0aW9uKTtcbiAgICAgICAgICB0aGlzLl9sb2coZXJyb3IpO1xuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdG9rZW4gPSByZXNwb25zZS5hY2Nlc3NfdG9rZW47XG4gICAgICAgIGNvbnN0IHJlZnJlc2hUb2tlbiA9IHJlc3BvbnNlLnJlZnJlc2hfdG9rZW47XG4gICAgICAgIGNvbnN0IHRva2VuVHlwZSA9IHJlc3BvbnNlLnRva2VuX3R5cGU7XG4gICAgICAgIGNvbnN0IGV4cGlyZXNJbiA9IHJlc3BvbnNlLmV4cGlyZXNJbjtcblxuICAgICAgICB0aGlzLnNldFRva2VuKHRva2VuKVxuICAgICAgICB0aGlzLnNldFJlZnJlc2hUb2tlbihyZWZyZXNoVG9rZW4pXG5cbiAgICAgICAgdGhpcy5lbWl0KEFWUy5FdmVudFR5cGVzLkxPR0lOKTtcbiAgICAgICAgdGhpcy5fbG9nKCdMb2dnZWQgaW4uJyk7XG4gICAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgfTtcblxuICAgICAgeGhyLm9uZXJyb3IgPSAoZXJyb3IpID0+IHtcbiAgICAgICAgdGhpcy5fbG9nKGVycm9yKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH07XG5cbiAgICAgIHhoci5zZW5kKHBvc3REYXRhKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlZnJlc2hUb2tlbigpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRUb2tlbkZyb21SZWZyZXNoVG9rZW4odGhpcy5fcmVmcmVzaFRva2VuKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRva2VuOiB0aGlzLl90b2tlbixcbiAgICAgICAgcmVmcmVzaFRva2VuOiB0aGlzLl9yZWZyZXNoVG9rZW5cbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBnZXRUb2tlbkZyb21SZWZyZXNoVG9rZW4ocmVmcmVzaFRva2VuID0gdGhpcy5fcmVmcmVzaFRva2VuKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgcmVmcmVzaFRva2VuICE9PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcignYHJlZnJlc2hUb2tlbmAgbXVzdCBhIHN0cmluZy4nKTtcbiAgICAgICAgdGhpcy5fbG9nKGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGdyYW50VHlwZSA9ICdyZWZyZXNoX3Rva2VuJztcbiAgICAgIGNvbnN0IHBvc3REYXRhID0gYGdyYW50X3R5cGU9JHtncmFudFR5cGV9JnJlZnJlc2hfdG9rZW49JHtyZWZyZXNoVG9rZW59JmNsaWVudF9pZD0ke3RoaXMuX2NsaWVudElkfSZjbGllbnRfc2VjcmV0PSR7dGhpcy5fY2xpZW50U2VjcmV0fSZyZWRpcmVjdF91cmk9JHtlbmNvZGVVUklDb21wb25lbnQodGhpcy5fcmVkaXJlY3RVcmkpfWA7XG4gICAgICBjb25zdCB1cmwgPSAnaHR0cHM6Ly9hcGkuYW1hem9uLmNvbS9hdXRoL28yL3Rva2VuJztcbiAgICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICB4aHIub3BlbignUE9TVCcsIHVybCwgdHJ1ZSk7XG4gICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDtjaGFyc2V0PVVURi04Jyk7XG4gICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2pzb24nO1xuICAgICAgeGhyLm9ubG9hZCA9IChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IHhoci5yZXNwb25zZTtcblxuICAgICAgICBpZiAocmVzcG9uc2UuZXJyb3IpIHtcbiAgICAgICAgICBjb25zdCBlcnJvciA9IHJlc3BvbnNlLmVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgdGhpcy5lbWl0KEFWUy5FdmVudFR5cGVzLkVSUk9SLCBlcnJvcik7XG5cbiAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlICB7XG4gICAgICAgICAgY29uc3QgdG9rZW4gPSByZXNwb25zZS5hY2Nlc3NfdG9rZW47XG4gICAgICAgICAgY29uc3QgcmVmcmVzaFRva2VuID0gcmVzcG9uc2UucmVmcmVzaF90b2tlbjtcblxuICAgICAgICAgIHRoaXMuc2V0VG9rZW4odG9rZW4pO1xuICAgICAgICAgIHRoaXMuc2V0UmVmcmVzaFRva2VuKHJlZnJlc2hUb2tlbik7XG5cbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZSh0b2tlbik7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHhoci5vbmVycm9yID0gKGVycm9yKSA9PiB7XG4gICAgICAgIHRoaXMuX2xvZyhlcnJvcik7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9O1xuXG4gICAgICB4aHIuc2VuZChwb3N0RGF0YSk7XG4gICAgfSk7XG4gIH1cblxuICBnZXRUb2tlbkZyb21VcmwoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGxldCBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyKDEpO1xuXG4gICAgICBjb25zdCBxdWVyeSA9IHFzLnBhcnNlKGhhc2gpO1xuICAgICAgY29uc3QgdG9rZW4gPSBxdWVyeS5hY2Nlc3NfdG9rZW47XG4gICAgICBjb25zdCByZWZyZXNoVG9rZW4gPSBxdWVyeS5yZWZyZXNoX3Rva2VuO1xuICAgICAgY29uc3QgdG9rZW5UeXBlID0gcXVlcnkudG9rZW5fdHlwZTtcbiAgICAgIGNvbnN0IGV4cGlyZXNJbiA9IHF1ZXJ5LmV4cGlyZXNJbjtcblxuICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgIHRoaXMuc2V0VG9rZW4odG9rZW4pXG4gICAgICAgIHRoaXMuZW1pdChBVlMuRXZlbnRUeXBlcy5MT0dJTik7XG4gICAgICAgIHRoaXMuX2xvZygnTG9nZ2VkIGluLicpO1xuXG4gICAgICAgIGlmIChyZWZyZXNoVG9rZW4pIHtcbiAgICAgICAgICB0aGlzLnNldFJlZnJlc2hUb2tlbihyZWZyZXNoVG9rZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc29sdmUodG9rZW4pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVqZWN0KCk7XG4gICAgfSk7XG4gIH1cblxuICBnZXRDb2RlRnJvbVVybCgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgcXVlcnkgPSBxcy5wYXJzZSh3aW5kb3cubG9jYXRpb24uc2VhcmNoLnN1YnN0cigxKSk7XG4gICAgICBjb25zdCBjb2RlID0gcXVlcnkuY29kZTtcblxuICAgICAgaWYgKGNvZGUpIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoY29kZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZWplY3QobnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICBzZXRUb2tlbih0b2tlbikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLl90b2tlbiA9IHRva2VuO1xuICAgICAgICB0aGlzLmVtaXQoQVZTLkV2ZW50VHlwZXMuVE9LRU5fU0VUKTtcbiAgICAgICAgdGhpcy5fbG9nKCdUb2tlbiBzZXQuJyk7XG4gICAgICAgIHJlc29sdmUodGhpcy5fdG9rZW4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgVHlwZUVycm9yKCdgdG9rZW5gIG11c3QgYmUgYSBzdHJpbmcuJyk7XG4gICAgICAgIHRoaXMuX2xvZyhlcnJvcik7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzZXRSZWZyZXNoVG9rZW4ocmVmcmVzaFRva2VuKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgcmVmcmVzaFRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLl9yZWZyZXNoVG9rZW4gPSByZWZyZXNoVG9rZW47XG4gICAgICAgIHRoaXMuZW1pdChBVlMuRXZlbnRUeXBlcy5SRUZSRVNIX1RPS0VOX1NFVCk7XG4gICAgICAgIHRoaXMuX2xvZygnUmVmcmVzaCB0b2tlbiBzZXQuJyk7XG4gICAgICAgIHJlc29sdmUodGhpcy5fcmVmcmVzaFRva2VuKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IFR5cGVFcnJvcignYHJlZnJlc2hUb2tlbmAgbXVzdCBiZSBhIHN0cmluZy4nKTtcbiAgICAgICAgdGhpcy5fbG9nKGVycm9yKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNldENsaWVudElkKGNsaWVudElkKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgY2xpZW50SWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuX2NsaWVudElkID0gY2xpZW50SWQ7XG4gICAgICAgIHJlc29sdmUodGhpcy5fY2xpZW50SWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgVHlwZUVycm9yKCdgY2xpZW50SWRgIG11c3QgYmUgYSBzdHJpbmcuJyk7XG4gICAgICAgIHRoaXMuX2xvZyhlcnJvcik7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzZXRDbGllbnRTZWNyZXQoY2xpZW50U2VjcmV0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgY2xpZW50U2VjcmV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLl9jbGllbnRTZWNyZXQgPSBjbGllbnRTZWNyZXQ7XG4gICAgICAgIHJlc29sdmUodGhpcy5fY2xpZW50U2VjcmV0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IFR5cGVFcnJvcignYGNsaWVudFNlY3JldGAgbXVzdCBiZSBhIHN0cmluZycpO1xuICAgICAgICB0aGlzLl9sb2coZXJyb3IpO1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc2V0RGV2aWNlSWQoZGV2aWNlSWQpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBkZXZpY2VJZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhpcy5fZGV2aWNlSWQgPSBkZXZpY2VJZDtcbiAgICAgICAgcmVzb2x2ZSh0aGlzLl9kZXZpY2VJZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBUeXBlRXJyb3IoJ2BkZXZpY2VJZGAgbXVzdCBiZSBhIHN0cmluZy4nKTtcbiAgICAgICAgdGhpcy5fbG9nKGVycm9yKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNldERldmljZVNlcmlhbE51bWJlcihkZXZpY2VTZXJpYWxOdW1iZXIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBkZXZpY2VTZXJpYWxOdW1iZXIgPT09ICdudW1iZXInIHx8IHR5cGVvZiBkZXZpY2VTZXJpYWxOdW1iZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuX2RldmljZVNlcmlhbE51bWJlciA9IGRldmljZVNlcmlhbE51bWJlcjtcbiAgICAgICAgcmVzb2x2ZSh0aGlzLl9kZXZpY2VTZXJpYWxOdW1iZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgVHlwZUVycm9yKCdgZGV2aWNlU2VyaWFsTnVtYmVyYCBtdXN0IGJlIGEgbnVtYmVyIG9yIHN0cmluZy4nKTtcbiAgICAgICAgdGhpcy5fbG9nKGVycm9yKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNldFJlZGlyZWN0VXJpKHJlZGlyZWN0VXJpKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgcmVkaXJlY3RVcmkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuX3JlZGlyZWN0VXJpID0gcmVkaXJlY3RVcmk7XG4gICAgICAgIHJlc29sdmUodGhpcy5fcmVkaXJlY3RVcmkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgVHlwZUVycm9yKCdgcmVkaXJlY3RVcmlgIG11c3QgYmUgYSBzdHJpbmcuJyk7XG4gICAgICAgIHRoaXMuX2xvZyhlcnJvcik7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzZXREZWJ1ZyhkZWJ1Zykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGRlYnVnID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgdGhpcy5fZGVidWcgPSBkZWJ1ZztcbiAgICAgICAgcmVzb2x2ZSh0aGlzLl9kZWJ1Zyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBUeXBlRXJyb3IoJ2BkZWJ1Z2AgbXVzdCBiZSBhIGJvb2xlYW4uJyk7XG4gICAgICAgIHRoaXMuX2xvZyhlcnJvcik7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBnZXRUb2tlbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgdG9rZW4gPSB0aGlzLl90b2tlbjtcblxuICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlKHRva2VuKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlamVjdCgpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0UmVmcmVzaFRva2VuKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCByZWZyZXNoVG9rZW4gPSB0aGlzLl9yZWZyZXNoVG9rZW47XG5cbiAgICAgIGlmIChyZWZyZXNoVG9rZW4pIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUocmVmcmVzaFRva2VuKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlamVjdCgpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVxdWVzdE1pYygpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5fbG9nKCdSZXF1ZXN0aW5nIG1pY3JvcGhvbmUuJyk7XG5cbiAgICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBmaWxlIGNhbiBiZSBsb2FkZWQgaW4gZW52aXJvbm1lbnRzIHdoZXJlIG5hdmlnYXRvciBpcyBub3QgZGVmaW5lZCAobm9kZSBzZXJ2ZXJzKVxuICAgICAgaWYgKCFuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhKSB7XG4gICAgICAgIG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgPSBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEgfHxcbiAgICAgICAgICBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tc0dldFVzZXJNZWRpYTtcbiAgICAgIH1cblxuICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSh7XG4gICAgICAgIGF1ZGlvOiB0cnVlXG4gICAgICB9LCAoc3RyZWFtKSA9PiB7XG4gICAgICAgIHRoaXMuX2xvZygnTWljcm9waG9uZSBjb25uZWN0ZWQuJyk7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3RNZWRpYVN0cmVhbShzdHJlYW0pLnRoZW4ocmVzb2x2ZSk7XG4gICAgICB9LCAoZXJyb3IpID0+IHtcbiAgICAgICAgdGhpcy5fbG9nKCdlcnJvcicsIGVycm9yKTtcbiAgICAgICAgdGhpcy5lbWl0KEFWUy5FdmVudFR5cGVzLkVSUk9SLCBlcnJvcik7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBjb25uZWN0TWVkaWFTdHJlYW0oc3RyZWFtKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IGlzTWVkaWFTdHJlYW0gPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc3RyZWFtKSA9PT0gJ1tvYmplY3QgTWVkaWFTdHJlYW1dJztcblxuICAgICAgaWYgKCFpc01lZGlhU3RyZWFtKSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIGBNZWRpYVN0cmVhbWAgb2JqZWN0LicpXG4gICAgICAgIHRoaXMuX2xvZygnZXJyb3InLCBlcnJvcilcbiAgICAgICAgdGhpcy5lbWl0KEFWUy5FdmVudFR5cGVzLkVSUk9SLCBlcnJvcik7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9hdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgICB0aGlzLl9zYW1wbGVSYXRlID0gdGhpcy5fYXVkaW9Db250ZXh0LnNhbXBsZVJhdGU7XG5cbiAgICAgIHRoaXMuX2xvZyhgU2FtcGxlIHJhdGU6ICR7dGhpcy5fc2FtcGxlUmF0ZX0uYCk7XG5cbiAgICAgIHRoaXMuX3ZvbHVtZU5vZGUgPSB0aGlzLl9hdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgdGhpcy5fYXVkaW9JbnB1dCA9IHRoaXMuX2F1ZGlvQ29udGV4dC5jcmVhdGVNZWRpYVN0cmVhbVNvdXJjZShzdHJlYW0pO1xuXG4gICAgICB0aGlzLl9hdWRpb0lucHV0LmNvbm5lY3QodGhpcy5fdm9sdW1lTm9kZSk7XG5cbiAgICAgIHRoaXMuX3JlY29yZGVyID0gdGhpcy5fYXVkaW9Db250ZXh0LmNyZWF0ZVNjcmlwdFByb2Nlc3Nvcih0aGlzLl9idWZmZXJTaXplLCB0aGlzLl9pbnB1dENoYW5uZWxzLCB0aGlzLl9vdXRwdXRDaGFubmVscyk7XG5cbiAgICAgIHRoaXMuX3JlY29yZGVyLm9uYXVkaW9wcm9jZXNzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5faXNSZWNvcmRpbmcpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsZWZ0ID0gZXZlbnQuaW5wdXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoMCk7XG4gICAgICAgIHRoaXMuX2xlZnRDaGFubmVsLnB1c2gobmV3IEZsb2F0MzJBcnJheShsZWZ0KSk7XG5cbiAgICAgICAgaWYgKHRoaXMuX2lucHV0Q2hhbm5lbHMgPiAxKSB7XG4gICAgICAgICAgY29uc3QgcmlnaHQgPSBldmVudC5pbnB1dEJ1ZmZlci5nZXRDaGFubmVsRGF0YSgxKTtcbiAgICAgICAgICB0aGlzLl9yaWdodENoYW5uZWwucHVzaChuZXcgRmxvYXQzMkFycmF5KHJpZ2h0KSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9yZWNvcmRpbmdMZW5ndGggKz0gdGhpcy5fYnVmZmVyU2l6ZTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuX3ZvbHVtZU5vZGUuY29ubmVjdCh0aGlzLl9yZWNvcmRlcik7XG4gICAgICB0aGlzLl9yZWNvcmRlci5jb25uZWN0KHRoaXMuX2F1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG4gICAgICB0aGlzLl9sb2coYE1lZGlhIHN0cmVhbSBjb25uZWN0ZWQuYCk7XG5cbiAgICAgIHJldHVybiByZXNvbHZlKHN0cmVhbSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGFydFJlY29yZGluZygpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLl9hdWRpb0lucHV0KSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKCdObyBNZWRpYSBTdHJlYW0gY29ubmVjdGVkLicpO1xuICAgICAgICB0aGlzLl9sb2coJ2Vycm9yJywgZXJyb3IpO1xuICAgICAgICB0aGlzLmVtaXQoQVZTLkV2ZW50VHlwZXMuRVJST1IsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2lzUmVjb3JkaW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMuX2xlZnRDaGFubmVsLmxlbmd0aCA9IHRoaXMuX3JpZ2h0Q2hhbm5lbC5sZW5ndGggPSAwO1xuICAgICAgdGhpcy5fcmVjb3JkaW5nTGVuZ3RoID0gMDtcbiAgICAgIHRoaXMuX2xvZyhgUmVjb3JkaW5nIHN0YXJ0ZWQuYCk7XG4gICAgICB0aGlzLmVtaXQoQVZTLkV2ZW50VHlwZXMuUkVDT1JEX1NUQVJUKTtcblxuICAgICAgcmV0dXJuIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0b3BSZWNvcmRpbmcoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmICghdGhpcy5faXNSZWNvcmRpbmcpIHtcbiAgICAgICAgdGhpcy5lbWl0KEFWUy5FdmVudFR5cGVzLlJFQ09SRF9TVE9QKTtcbiAgICAgICAgdGhpcy5fbG9nKCdSZWNvcmRpbmcgc3RvcHBlZC4nKTtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5faXNSZWNvcmRpbmcgPSBmYWxzZTtcblxuICAgICAgY29uc3QgbGVmdEJ1ZmZlciA9IG1lcmdlQnVmZmVycyh0aGlzLl9sZWZ0Q2hhbm5lbCwgdGhpcy5fcmVjb3JkaW5nTGVuZ3RoKTtcbiAgICAgIGxldCBpbnRlcmxlYXZlZCA9IG51bGw7XG5cbiAgICAgIGlmICh0aGlzLl9vdXRwdXRDaGFubmVscyA+IDEpIHtcbiAgICAgICAgY29uc3QgcmlnaHRCdWZmZXIgPSBtZXJnZUJ1ZmZlcnModGhpcy5fcmlnaHRDaGFubmVsLCB0aGlzLl9yZWNvcmRpbmdMZW5ndGgpO1xuICAgICAgICBpbnRlcmxlYXZlZCA9IGludGVybGVhdmUobGVmdEJ1ZmZlciwgcmlnaHRCdWZmZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW50ZXJsZWF2ZWQgPSBpbnRlcmxlYXZlKGxlZnRCdWZmZXIpO1xuICAgICAgfVxuXG4gICAgICBpbnRlcmxlYXZlZCA9IGRvd25zYW1wbGVCdWZmZXIoaW50ZXJsZWF2ZWQsIHRoaXMuX3NhbXBsZVJhdGUsIHRoaXMuX291dHB1dFNhbXBsZVJhdGUpO1xuXG4gICAgICBjb25zdCBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoNDQgKyBpbnRlcmxlYXZlZC5sZW5ndGggKiAyKTtcbiAgICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcblxuICAgICAgLyoqXG4gICAgICAgKiBAY3JlZGl0IGh0dHBzOi8vZ2l0aHViLmNvbS9tYXR0ZGlhbW9uZC9SZWNvcmRlcmpzXG4gICAgICAgKi9cbiAgICAgIHdyaXRlVVRGQnl0ZXModmlldywgMCwgJ1JJRkYnKTtcbiAgICAgIHZpZXcuc2V0VWludDMyKDQsIDQ0ICsgaW50ZXJsZWF2ZWQubGVuZ3RoICogMiwgdHJ1ZSk7XG4gICAgICB3cml0ZVVURkJ5dGVzKHZpZXcsIDgsICdXQVZFJyk7XG4gICAgICB3cml0ZVVURkJ5dGVzKHZpZXcsIDEyLCAnZm10ICcpO1xuICAgICAgdmlldy5zZXRVaW50MzIoMTYsIDE2LCB0cnVlKTtcbiAgICAgIHZpZXcuc2V0VWludDE2KDIwLCAxLCB0cnVlKTtcbiAgICAgIHZpZXcuc2V0VWludDE2KDIyLCB0aGlzLl9vdXRwdXRDaGFubmVscywgdHJ1ZSk7XG4gICAgICB2aWV3LnNldFVpbnQzMigyNCwgdGhpcy5fb3V0cHV0U2FtcGxlUmF0ZSwgdHJ1ZSk7XG4gICAgICB2aWV3LnNldFVpbnQzMigyOCwgdGhpcy5fb3V0cHV0U2FtcGxlUmF0ZSAqIDQsIHRydWUpO1xuICAgICAgdmlldy5zZXRVaW50MTYoMzIsIDQsIHRydWUpO1xuICAgICAgdmlldy5zZXRVaW50MTYoMzQsIDE2LCB0cnVlKTtcbiAgICAgIHdyaXRlVVRGQnl0ZXModmlldywgMzYsICdkYXRhJyk7XG4gICAgICB2aWV3LnNldFVpbnQzMig0MCwgaW50ZXJsZWF2ZWQubGVuZ3RoICogMiwgdHJ1ZSk7XG5cbiAgICAgIGNvbnN0IGxlbmd0aCA9IGludGVybGVhdmVkLmxlbmd0aDtcbiAgICAgIGNvbnN0IHZvbHVtZSA9IDE7XG4gICAgICBsZXQgaW5kZXggPSA0NDtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKyl7XG4gICAgICAgIHZpZXcuc2V0SW50MTYoaW5kZXgsIGludGVybGVhdmVkW2ldICogKDB4N0ZGRiAqIHZvbHVtZSksIHRydWUpO1xuICAgICAgICBpbmRleCArPSAyO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9sb2coYFJlY29yZGluZyBzdG9wcGVkLmApO1xuICAgICAgdGhpcy5lbWl0KEFWUy5FdmVudFR5cGVzLlJFQ09SRF9TVE9QKTtcbiAgICAgIHJldHVybiByZXNvbHZlKHZpZXcpO1xuICAgIH0pO1xuICB9XG5cbiAgc2VuZEF1ZGlvIChkYXRhVmlldykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgIGNvbnN0IHVybCA9ICdodHRwczovL2FjY2Vzcy1hbGV4YS1uYS5hbWF6b24uY29tL3YxL2F2cy9zcGVlY2hyZWNvZ25pemVyL3JlY29nbml6ZSc7XG5cbiAgICAgIHhoci5vcGVuKCdQT1NUJywgdXJsLCB0cnVlKTtcbiAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuICAgICAgeGhyLm9ubG9hZCA9IChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBidWZmZXIgPSBuZXcgQnVmZmVyKHhoci5yZXNwb25zZSk7XG5cbiAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZE1lc3NhZ2UgPSBodHRwTWVzc2FnZVBhcnNlcihidWZmZXIpO1xuICAgICAgICAgIHJlc29sdmUoe3hociwgcmVzcG9uc2U6IHBhcnNlZE1lc3NhZ2V9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZXQgZXJyb3IgPSBuZXcgRXJyb3IoJ0FuIGVycm9yIG9jY3VyZWQgd2l0aCByZXF1ZXN0LicpO1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IHt9O1xuXG4gICAgICAgICAgaWYgKCF4aHIucmVzcG9uc2UuYnl0ZUxlbmd0aCkge1xuICAgICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ0VtcHR5IHJlc3BvbnNlLicpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICByZXNwb25zZSA9IEpTT04ucGFyc2UoYXJyYXlCdWZmZXJUb1N0cmluZyhidWZmZXIpKTtcbiAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICAgIGVycm9yID0gZXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChyZXNwb25zZS5lcnJvciBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9yLmNvZGUgPT09IEFNQVpPTl9FUlJPUl9DT0RFUy5JbnZhbGlkQWNjZXNzVG9rZW5FeGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgdGhpcy5lbWl0KEFWUy5FdmVudFR5cGVzLlRPS0VOX0lOVkFMSUQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlcnJvciA9IHJlc3BvbnNlLmVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5lbWl0KEFWUy5FdmVudFR5cGVzLkVSUk9SLCBlcnJvcik7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHhoci5vbmVycm9yID0gKGVycm9yKSA9PiB7XG4gICAgICAgIHRoaXMuX2xvZyhlcnJvcik7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBCT1VOREFSWSA9ICdCT1VOREFSWTEyMzQnO1xuICAgICAgY29uc3QgQk9VTkRBUllfREFTSEVTID0gJy0tJztcbiAgICAgIGNvbnN0IE5FV0xJTkUgPSAnXFxyXFxuJztcbiAgICAgIGNvbnN0IE1FVEFEQVRBX0NPTlRFTlRfRElTUE9TSVRJT04gPSAnQ29udGVudC1EaXNwb3NpdGlvbjogZm9ybS1kYXRhOyBuYW1lPVwibWV0YWRhdGFcIic7XG4gICAgICBjb25zdCBNRVRBREFUQV9DT05URU5UX1RZUEUgPSAnQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PVVURi04JztcbiAgICAgIGNvbnN0IEFVRElPX0NPTlRFTlRfVFlQRSA9ICdDb250ZW50LVR5cGU6IGF1ZGlvL0wxNjsgcmF0ZT0xNjAwMDsgY2hhbm5lbHM9MSc7XG4gICAgICBjb25zdCBBVURJT19DT05URU5UX0RJU1BPU0lUSU9OID0gJ0NvbnRlbnQtRGlzcG9zaXRpb246IGZvcm0tZGF0YTsgbmFtZT1cImF1ZGlvXCInO1xuXG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHtcbiAgICAgICAgbWVzc2FnZUhlYWRlcjoge30sXG4gICAgICAgIG1lc3NhZ2VCb2R5OiB7XG4gICAgICAgICAgcHJvZmlsZTogJ2FsZXhhLWNsb3NlLXRhbGsnLFxuICAgICAgICAgIGxvY2FsZTogJ2VuLXVzJyxcbiAgICAgICAgICBmb3JtYXQ6ICdhdWRpby9MMTY7IHJhdGU9MTYwMDA7IGNoYW5uZWxzPTEnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHBvc3REYXRhU3RhcnQgPSBbXG4gICAgICAgIE5FV0xJTkUsIEJPVU5EQVJZX0RBU0hFUywgQk9VTkRBUlksIE5FV0xJTkUsIE1FVEFEQVRBX0NPTlRFTlRfRElTUE9TSVRJT04sIE5FV0xJTkUsIE1FVEFEQVRBX0NPTlRFTlRfVFlQRSxcbiAgICAgICAgTkVXTElORSwgTkVXTElORSwgSlNPTi5zdHJpbmdpZnkobWV0YWRhdGEpLCBORVdMSU5FLCBCT1VOREFSWV9EQVNIRVMsIEJPVU5EQVJZLCBORVdMSU5FLFxuICAgICAgICBBVURJT19DT05URU5UX0RJU1BPU0lUSU9OLCBORVdMSU5FLCBBVURJT19DT05URU5UX1RZUEUsIE5FV0xJTkUsIE5FV0xJTkVcbiAgICAgIF0uam9pbignJyk7XG5cbiAgICAgIGNvbnN0IHBvc3REYXRhRW5kID0gW05FV0xJTkUsIEJPVU5EQVJZX0RBU0hFUywgQk9VTkRBUlksIEJPVU5EQVJZX0RBU0hFUywgTkVXTElORV0uam9pbignJyk7XG5cbiAgICAgIGNvbnN0IHNpemUgPSBwb3N0RGF0YVN0YXJ0Lmxlbmd0aCArIGRhdGFWaWV3LmJ5dGVMZW5ndGggKyBwb3N0RGF0YUVuZC5sZW5ndGg7XG4gICAgICBjb25zdCB1aW50OEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoc2l6ZSk7XG4gICAgICBsZXQgaSA9IDA7XG5cbiAgICAgIGZvciAoOyBpIDwgcG9zdERhdGFTdGFydC5sZW5ndGg7IGkrKykge1xuICAgICAgICB1aW50OEFycmF5W2ldID0gcG9zdERhdGFTdGFydC5jaGFyQ29kZUF0KGkpICYgMHhGRjtcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBkYXRhVmlldy5ieXRlTGVuZ3RoIDsgaSsrLCBqKyspIHtcbiAgICAgICAgdWludDhBcnJheVtpXSA9IGRhdGFWaWV3LmdldFVpbnQ4KGopO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBvc3REYXRhRW5kLmxlbmd0aDsgaSsrLCBqKyspIHtcbiAgICAgICAgdWludDhBcnJheVtpXSA9IHBvc3REYXRhRW5kLmNoYXJDb2RlQXQoaikgJiAweEZGO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwYXlsb2FkID0gdWludDhBcnJheS5idWZmZXI7XG5cbiAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke3RoaXMuX3Rva2VufWApO1xuICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdtdWx0aXBhcnQvZm9ybS1kYXRhOyBib3VuZGFyeT0nICsgQk9VTkRBUlkpO1xuICAgICAgeGhyLnNlbmQocGF5bG9hZCk7XG4gICAgfSk7XG4gIH1cblxuICBhdWRpb1RvQmxvYihhdWRpbykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2F1ZGlvXSwge3R5cGU6ICdhdWRpby9tcGVnJ30pO1xuXG4gICAgICByZXNvbHZlKGJsb2IpO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGdldCBFdmVudFR5cGVzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBMT0c6ICdsb2cnLFxuICAgICAgRVJST1I6ICdlcnJvcicsXG4gICAgICBMT0dJTjogJ2xvZ2luJyxcbiAgICAgIExPR09VVDogJ2xvZ291dCcsXG4gICAgICBSRUNPUkRfU1RBUlQ6ICdyZWNvcmRTdGFydCcsXG4gICAgICBSRUNPUkRfU1RPUDogJ3JlY29yZFN0b3AnLFxuICAgICAgVE9LRU5fU0VUOiAndG9rZW5TZXQnLFxuICAgICAgUkVGUkVTSF9UT0tFTl9TRVQ6ICdyZWZyZXNoVG9rZW5TZXQnLFxuICAgICAgVE9LRU5fSU5WQUxJRDogJ3Rva2VuSW52YWxpZCdcbiAgICB9O1xuICB9XG5cbiAgc3RhdGljIGdldCBQbGF5ZXIoKSB7XG4gICAgcmV0dXJuIFBsYXllcjtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFWUztcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEludmFsaWRBY2Nlc3NUb2tlbkV4Y2VwdGlvbjogJ2NvbS5hbWF6b24uYWxleGFodHRwcHJveHkuZXhjZXB0aW9ucy5JbnZhbGlkQWNjZXNzVG9rZW5FeGNlcHRpb24nXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBPYnNlcnZhYmxlKGVsKSB7XG4gIGxldCBjYWxsYmFja3MgPSB7fTtcblxuICBlbC5vbiA9IGZ1bmN0aW9uKG5hbWUsIGZuKSB7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU2Vjb25kIGFyZ3VtZW50IGZvciBcIm9uXCIgbWV0aG9kIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICAoY2FsbGJhY2tzW25hbWVdID0gY2FsbGJhY2tzW25hbWVdIHx8IFtdKS5wdXNoKGZuKTtcblxuICAgIHJldHVybiBlbDtcbiAgfTtcblxuICBlbC5vbmUgPSBmdW5jdGlvbihuYW1lLCBmbikge1xuICAgIGZuLm9uZSA9IHRydWU7XG4gICAgcmV0dXJuIGVsLm9uLmNhbGwoZWwsIG5hbWUsIGZuKTtcbiAgfTtcblxuICBlbC5vZmYgPSBmdW5jdGlvbihuYW1lLCBmbikge1xuICAgIGlmIChuYW1lID09PSAnKicpIHtcbiAgICAgIGNhbGxiYWNrcyA9IHt9O1xuICAgICAgcmV0dXJuIGNhbGxiYWNrc1xuICAgIH1cblxuICAgIGlmICghY2FsbGJhY2tzW25hbWVdKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGZuKSB7XG4gICAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1NlY29uZCBhcmd1bWVudCBmb3IgXCJvZmZcIiBtZXRob2QgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICAgICAgfVxuXG4gICAgICBjYWxsYmFja3NbbmFtZV0gPSBjYWxsYmFja3NbbmFtZV0ubWFwKGZ1bmN0aW9uKGZtLCBpKSB7XG4gICAgICAgIGlmIChmbSA9PT0gZm4pIHtcbiAgICAgICAgICBjYWxsYmFja3NbbmFtZV0uc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNhbGxiYWNrc1tuYW1lXTtcbiAgICB9XG4gIH07XG5cbiAgZWwuZW1pdCA9IGZ1bmN0aW9uKG5hbWUgLyosIGFyZ3MgKi8pIHtcbiAgICBpZiAoIWNhbGxiYWNrc1tuYW1lXSB8fCAhY2FsbGJhY2tzW25hbWVdLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICBjYWxsYmFja3NbbmFtZV0uZm9yRWFjaChmdW5jdGlvbihmbiwgaSkge1xuICAgICAgaWYgKGZuKSB7XG4gICAgICAgIGZuLmFwcGx5KGZuLCBhcmdzKTtcbiAgICAgICAgaWYgKGZuLm9uZSkge1xuICAgICAgICAgIGNhbGxiYWNrc1tuYW1lXS5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBlbDtcbiAgfTtcblxuICByZXR1cm4gZWw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gT2JzZXJ2YWJsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgT2JzZXJ2YWJsZSA9IHJlcXVpcmUoJy4vT2JzZXJ2YWJsZScpO1xuY29uc3QgYXJyYXlCdWZmZXJUb0F1ZGlvQnVmZmVyID0gcmVxdWlyZSgnLi91dGlscy9hcnJheUJ1ZmZlclRvQXVkaW9CdWZmZXInKTtcbmNvbnN0IHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuY2xhc3MgUGxheWVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgd2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcblxuICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgdGhpcy5fY3VycmVudFNvdXJjZSA9IG51bGw7XG4gICAgdGhpcy5fY3VycmVudEJ1ZmZlciA9IG51bGw7XG4gICAgdGhpcy5fY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcblxuICAgIE9ic2VydmFibGUodGhpcyk7XG4gIH1cblxuICBfbG9nKHR5cGUsIG1lc3NhZ2UpIHtcbiAgICBpZiAodHlwZSAmJiAhbWVzc2FnZSkge1xuICAgICAgbWVzc2FnZSA9IHR5cGU7XG4gICAgICB0eXBlID0gJ2xvZyc7XG4gICAgfVxuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLmVtaXQoUGxheWVyLkV2ZW50VHlwZXMuTE9HLCBtZXNzYWdlKTtcbiAgICB9LCAwKTtcblxuICAgIGlmICh0aGlzLl9kZWJ1Zykge1xuICAgICAgY29uc29sZVt0eXBlXShtZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICBlbXB0eVF1ZXVlKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgICAgdGhpcy5fYXVkaW8gPSBudWxsO1xuICAgICAgdGhpcy5fY3VycmVudEJ1ZmZlciA9IG51bGw7XG4gICAgICB0aGlzLl9jdXJyZW50U291cmNlID0gbnVsbDtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGVucXVldWUoaXRlbSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoJ2FyZ3VtZW50IGNhbm5vdCBiZSBlbXB0eS4nKTtcbiAgICAgICAgdGhpcy5fbG9nKGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0cmluZ1R5cGUgPSB0b1N0cmluZy5jYWxsKGl0ZW0pLnJlcGxhY2UoL1xcWy4qXFxzKFxcdyspXFxdLywgJyQxJyk7XG5cbiAgICAgIGNvbnN0IHByb2NlZWQgPSAoYXVkaW9CdWZmZXIpID0+IHtcbiAgICAgICAgdGhpcy5fcXVldWUucHVzaChhdWRpb0J1ZmZlcik7XG4gICAgICAgIHRoaXMuX2xvZygnRW5xdWV1ZSBhdWRpbycpO1xuICAgICAgICB0aGlzLmVtaXQoUGxheWVyLkV2ZW50VHlwZXMuRU5RVUVVRSk7XG4gICAgICAgIHJldHVybiByZXNvbHZlKGF1ZGlvQnVmZmVyKTtcbiAgICAgIH07XG5cbiAgICAgIGlmIChzdHJpbmdUeXBlID09PSAnRGF0YVZpZXcnIHx8IHN0cmluZ1R5cGUgPT09ICdVaW50OEFycmF5Jykge1xuICAgICAgICByZXR1cm4gYXJyYXlCdWZmZXJUb0F1ZGlvQnVmZmVyKGl0ZW0uYnVmZmVyLCB0aGlzLl9jb250ZXh0KVxuICAgICAgICAudGhlbihwcm9jZWVkKTtcbiAgICAgIH0gZWxzZSBpZiAoc3RyaW5nVHlwZSA9PT0gJ0F1ZGlvQnVmZmVyJykge1xuICAgICAgICByZXR1cm4gcHJvY2VlZChpdGVtKTtcbiAgICAgIH0gZWxzZSBpZiAoc3RyaW5nVHlwZSA9PT0gJ0FycmF5QnVmZmVyJykge1xuICAgICAgICByZXR1cm4gYXJyYXlCdWZmZXJUb0F1ZGlvQnVmZmVyKGl0ZW0sIHRoaXMuX2NvbnRleHQpXG4gICAgICAgIC50aGVuKHByb2NlZWQpO1xuICAgICAgfSBlbHNlIGlmIChzdHJpbmdUeXBlID09PSAnU3RyaW5nJykge1xuICAgICAgICByZXR1cm4gcHJvY2VlZChpdGVtKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKCdJbnZhbGlkIHR5cGUuJyk7XG4gICAgICAgIHRoaXMuZW1pdCgnZXJyb3InLCBlcnJvcik7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZGVxdWUoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9xdWV1ZS5zaGlmdCgpO1xuXG4gICAgICBpZiAoaXRlbSkge1xuICAgICAgICB0aGlzLl9sb2coJ0RlcXVlIGF1ZGlvJyk7XG4gICAgICAgIHRoaXMuZW1pdChQbGF5ZXIuRXZlbnRUeXBlcy5ERVFVRSk7XG4gICAgICAgIHJldHVybiByZXNvbHZlKGl0ZW0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVqZWN0KCk7XG4gICAgfSk7XG4gIH1cblxuICBwbGF5KCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZiAodGhpcy5fY29udGV4dC5zdGF0ZSA9PT0gJ3N1c3BlbmRlZCcpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dC5yZXN1bWUoKTtcblxuICAgICAgICB0aGlzLl9sb2coJ1BsYXkgYXVkaW8nKTtcbiAgICAgICAgdGhpcy5lbWl0KFBsYXllci5FdmVudFR5cGVzLlBMQVkpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2F1ZGlvICYmIHRoaXMuX2F1ZGlvLnBhdXNlZCkge1xuICAgICAgICB0aGlzLl9sb2coJ1BsYXkgYXVkaW8nKTtcbiAgICAgICAgdGhpcy5lbWl0KFBsYXllci5FdmVudFR5cGVzLlBMQVkpO1xuICAgICAgICB0aGlzLl9hdWRpby5wbGF5KCk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlcXVlKClcbiAgICAgICAgLnRoZW4oYXVkaW9CdWZmZXIgPT4ge1xuICAgICAgICAgIHRoaXMuX2xvZygnUGxheSBhdWRpbycpO1xuICAgICAgICAgIHRoaXMuZW1pdChQbGF5ZXIuRXZlbnRUeXBlcy5QTEFZKTtcbiAgICAgICAgICBpZiAodHlwZW9mIGF1ZGlvQnVmZmVyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGxheVVybChhdWRpb0J1ZmZlcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0aGlzLnBsYXlBdWRpb0J1ZmZlcihhdWRpb0J1ZmZlcik7XG4gICAgICAgIH0pLnRoZW4ocmVzb2x2ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwbGF5UXVldWUoKSB7XG4gICAgcmV0dXJuIHRoaXMucGxheSgpLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuX3F1ZXVlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wbGF5UXVldWUoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRTb3VyY2UpIHtcbiAgICAgICAgICB0aGlzLl9jdXJyZW50U291cmNlLm9uZW5kZWQgPSBmdW5jdGlvbigpIHt9O1xuICAgICAgICAgIHRoaXMuX2N1cnJlbnRTb3VyY2Uuc3RvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2F1ZGlvKSB7XG4gICAgICAgICAgdGhpcy5fYXVkaW8ub25lbmRlZCA9IGZ1bmN0aW9uKCkge307XG4gICAgICAgICAgdGhpcy5fYXVkaW8uY3VycmVudFRpbWUgPSAwO1xuICAgICAgICAgIHRoaXMuX2F1ZGlvLnBhdXNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9sb2coJ1N0b3AgYXVkaW8nKTtcbiAgICAgICAgdGhpcy5lbWl0KFBsYXllci5FdmVudFR5cGVzLlNUT1ApO1xuICAgIH0pO1xuICB9XG5cbiAgcGF1c2UoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRTb3VyY2UgJiYgdGhpcy5fY29udGV4dC5zdGF0ZSA9PT0gJ3J1bm5pbmcnKSB7XG4gICAgICAgICAgdGhpcy5fY29udGV4dC5zdXNwZW5kKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fYXVkaW8pIHtcbiAgICAgICAgICB0aGlzLl9hdWRpby5wYXVzZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fbG9nKCdQYXVzZSBhdWRpbycpO1xuICAgICAgICB0aGlzLmVtaXQoUGxheWVyLkV2ZW50VHlwZXMuUEFVU0UpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVwbGF5KCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50QnVmZmVyKSB7XG4gICAgICAgICAgdGhpcy5fbG9nKCdSZXBsYXkgYXVkaW8nKTtcbiAgICAgICAgICB0aGlzLmVtaXQoUGxheWVyLkV2ZW50VHlwZXMuUkVQTEFZKTtcblxuICAgICAgICAgIGlmICh0aGlzLl9jb250ZXh0LnN0YXRlID09PSAnc3VzcGVuZGVkJykge1xuICAgICAgICAgICAgdGhpcy5fY29udGV4dC5yZXN1bWUoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodGhpcy5fY3VycmVudFNvdXJjZSkge1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudFNvdXJjZS5zdG9wKCk7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50U291cmNlLm9uZW5kZWQgPSBmdW5jdGlvbigpIHt9O1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5wbGF5QXVkaW9CdWZmZXIodGhpcy5fY3VycmVudEJ1ZmZlcik7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYXVkaW8pIHtcbiAgICAgICAgICB0aGlzLl9sb2coJ1JlcGxheSBhdWRpbycpO1xuICAgICAgICAgIHRoaXMuZW1pdChQbGF5ZXIuRXZlbnRUeXBlcy5SRVBMQVkpO1xuICAgICAgICAgIHJldHVybiB0aGlzLnBsYXlVcmwodGhpcy5fYXVkaW8uc3JjKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcignTm8gYXVkaW8gc291cmNlIGxvYWRlZC4nKTtcbiAgICAgICAgICB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyb3IpXG4gICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHBsYXlCbG9iKGJsb2IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKCFibG9iKSB7XG4gICAgICAgIHJlamVjdCgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBvYmplY3RVcmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgY29uc3QgYXVkaW8gPSBuZXcgQXVkaW8oKTtcbiAgICAgIGF1ZGlvLnNyYyA9IG9iamVjdFVybDtcbiAgICAgIHRoaXMuX2N1cnJlbnRCdWZmZXIgPSBudWxsO1xuICAgICAgdGhpcy5fY3VycmVudFNvdXJjZSA9IG51bGw7XG4gICAgICB0aGlzLl9hdWRpbyA9IGF1ZGlvO1xuXG4gICAgICBhdWRpby5vbmVuZGVkID0gKCkgPT4ge1xuICAgICAgICB0aGlzLl9sb2coJ0F1ZGlvIGVuZGVkJyk7XG4gICAgICAgIHRoaXMuZW1pdChQbGF5ZXIuRXZlbnRUeXBlcy5FTkRFRCk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH07XG5cbiAgICAgIGF1ZGlvLm9uZXJyb3IgPSAoZXJyb3IpID0+IHtcbiAgICAgICAgdGhpcy5lbWl0KCdlcnJvcicsIGVycm9yKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH07XG5cbiAgICAgIGF1ZGlvLm9ubG9hZCA9IChldmVudCkgPT4ge1xuICAgICAgICBVUkwucmV2b2tlT2JqZWN0VXJsKG9iamVjdFVybCk7XG4gICAgICB9O1xuXG4gICAgICBhdWRpby5wbGF5KCk7XG4gICAgfSk7XG4gIH1cblxuICBwbGF5QXVkaW9CdWZmZXIoYnVmZmVyKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmICghYnVmZmVyKSB7XG4gICAgICAgIHJlamVjdCgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzb3VyY2UgPSB0aGlzLl9jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuICAgICAgc291cmNlLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgIHNvdXJjZS5jb25uZWN0KHRoaXMuX2NvbnRleHQuZGVzdGluYXRpb24pO1xuICAgICAgc291cmNlLnN0YXJ0KDApO1xuICAgICAgdGhpcy5fY3VycmVudEJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgIHRoaXMuX2N1cnJlbnRTb3VyY2UgPSBzb3VyY2U7XG4gICAgICB0aGlzLl9hdWRpbyA9IG51bGw7XG5cbiAgICAgIHNvdXJjZS5vbmVuZGVkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuX2xvZygnQXVkaW8gZW5kZWQnKTtcbiAgICAgICAgdGhpcy5lbWl0KFBsYXllci5FdmVudFR5cGVzLkVOREVEKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfTtcblxuICAgICAgc291cmNlLm9uZXJyb3IgPSAoZXJyb3IpID0+IHtcbiAgICAgICAgdGhpcy5lbWl0KCdlcnJvcicsIGVycm9yKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBwbGF5VXJsKHVybCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBhdWRpbyA9IG5ldyBBdWRpbygpO1xuICAgICAgYXVkaW8uc3JjID0gdXJsO1xuICAgICAgdGhpcy5fY3VycmVudEJ1ZmZlciA9IG51bGw7XG4gICAgICB0aGlzLl9jdXJyZW50U291cmNlID0gbnVsbDtcbiAgICAgIHRoaXMuX2F1ZGlvID0gYXVkaW87XG5cbiAgICAgIGF1ZGlvLm9uZW5kZWQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy5fbG9nKCdBdWRpbyBlbmRlZCcpO1xuICAgICAgICB0aGlzLmVtaXQoUGxheWVyLkV2ZW50VHlwZXMuRU5ERUQpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuXG4gICAgICBhdWRpby5vbmVycm9yID0gKGVycm9yKSA9PiB7XG4gICAgICAgIHRoaXMuZW1pdCgnZXJyb3InLCBlcnJvcik7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9O1xuXG4gICAgICBhdWRpby5wbGF5KCk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgZ2V0IEV2ZW50VHlwZXMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIExPRzogJ2xvZycsXG4gICAgICBFUlJPUjogJ2Vycm9yJyxcbiAgICAgIFBMQVk6ICdwbGF5JyxcbiAgICAgIFJFUExBWTogJ3JlcGxheScsXG4gICAgICBQQVVTRTogJ3BhdXNlJyxcbiAgICAgIFNUT1A6ICdwYXVzZScsXG4gICAgICBFTlFVRVVFOiAnZW5xdWV1ZScsXG4gICAgICBERVFVRTogJ2RlcXVlJ1xuICAgIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGFycmF5QnVmZmVyVG9BdWRpb0J1ZmZlcihhcnJheUJ1ZmZlciwgY29udGV4dCkge1xuICB3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgaWYgKGNvbnRleHQpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoY29udGV4dCkgIT09ICdbb2JqZWN0IEF1ZGlvQ29udGV4dF0nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2Bjb250ZXh0YCBtdXN0IGJlIGFuIEF1ZGlvQ29udGV4dCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuICAgIH1cblxuICAgIGNvbnRleHQuZGVjb2RlQXVkaW9EYXRhKGFycmF5QnVmZmVyLCAoZGF0YSkgPT4ge1xuICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICB9LCByZWplY3QpO1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheUJ1ZmZlclRvQXVkaW9CdWZmZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQGNyZWRpdCBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS93ZWIvdXBkYXRlcy8yMDEyLzA2L0hvdy10by1jb252ZXJ0LUFycmF5QnVmZmVyLXRvLWFuZC1mcm9tLVN0cmluZz9obD1lblxuICovXG5mdW5jdGlvbiBhcnJheUJ1ZmZlclRvU3RyaW5nKGJ1ZmZlcikge1xuICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBuZXcgVWludDE2QXJyYXkoYnVmZmVyKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlCdWZmZXJUb1N0cmluZztcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAY3JlZGl0IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzI2MjQ1MjYwXG4gKi9cbmZ1bmN0aW9uIGRvd25zYW1wbGVCdWZmZXIoYnVmZmVyLCBpbnB1dFNhbXBsZVJhdGUsIG91dHB1dFNhbXBsZVJhdGUpIHtcbiAgaWYgKGlucHV0U2FtcGxlUmF0ZSA9PT0gb3V0cHV0U2FtcGxlUmF0ZSkge1xuICAgIHJldHVybiBidWZmZXI7XG4gIH1cblxuICBpZiAoaW5wdXRTYW1wbGVSYXRlIDwgb3V0cHV0U2FtcGxlUmF0ZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignT3V0cHV0IHNhbXBsZSByYXRlIG11c3QgYmUgbGVzcyB0aGFuIGlucHV0IHNhbXBsZSByYXRlLicpO1xuICB9XG5cbiAgY29uc3Qgc2FtcGxlUmF0ZVJhdGlvID0gaW5wdXRTYW1wbGVSYXRlIC8gb3V0cHV0U2FtcGxlUmF0ZTtcbiAgY29uc3QgbmV3TGVuZ3RoID0gTWF0aC5yb3VuZChidWZmZXIubGVuZ3RoIC8gc2FtcGxlUmF0ZVJhdGlvKTtcbiAgbGV0IHJlc3VsdCA9IG5ldyBGbG9hdDMyQXJyYXkobmV3TGVuZ3RoKTtcbiAgbGV0IG9mZnNldFJlc3VsdCA9IDA7XG4gIGxldCBvZmZzZXRCdWZmZXIgPSAwO1xuXG4gIHdoaWxlIChvZmZzZXRSZXN1bHQgPCByZXN1bHQubGVuZ3RoKSB7XG4gICAgbGV0IG5leHRPZmZzZXRCdWZmZXIgPSBNYXRoLnJvdW5kKChvZmZzZXRSZXN1bHQgKyAxKSAqIHNhbXBsZVJhdGVSYXRpbyk7XG4gICAgbGV0IGFjY3VtID0gMDtcbiAgICBsZXQgY291bnQgPSAwO1xuXG4gICAgZm9yICh2YXIgaSA9IG9mZnNldEJ1ZmZlcjsgaSA8IG5leHRPZmZzZXRCdWZmZXIgJiYgaSA8IGJ1ZmZlci5sZW5ndGg7IGkrKykge1xuICAgICAgYWNjdW0gKz0gYnVmZmVyW2ldO1xuICAgICAgY291bnQrKztcbiAgICB9XG5cbiAgICByZXN1bHRbb2Zmc2V0UmVzdWx0XSA9IGFjY3VtIC8gY291bnQ7XG4gICAgb2Zmc2V0UmVzdWx0Kys7XG4gICAgb2Zmc2V0QnVmZmVyID0gbmV4dE9mZnNldEJ1ZmZlcjtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZG93bnNhbXBsZUJ1ZmZlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAY3JlZGl0IGh0dHBzOi8vZ2l0aHViLmNvbS9tYXR0ZGlhbW9uZC9SZWNvcmRlcmpzXG4gKi9cbmZ1bmN0aW9uIGludGVybGVhdmUobGVmdENoYW5uZWwsIHJpZ2h0Q2hhbm5lbCkge1xuICBpZiAobGVmdENoYW5uZWwgJiYgIXJpZ2h0Q2hhbm5lbCkge1xuICAgIHJldHVybiBsZWZ0Q2hhbm5lbDtcbiAgfVxuXG4gIGNvbnN0IGxlbmd0aCA9IGxlZnRDaGFubmVsLmxlbmd0aCArIHJpZ2h0Q2hhbm5lbC5sZW5ndGg7XG4gIGxldCByZXN1bHQgPSBuZXcgRmxvYXQzMkFycmF5KGxlbmd0aCk7XG4gIGxldCBpbnB1dEluZGV4ID0gMDtcblxuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyApe1xuICAgIHJlc3VsdFtpbmRleCsrXSA9IGxlZnRDaGFubmVsW2lucHV0SW5kZXhdO1xuICAgIHJlc3VsdFtpbmRleCsrXSA9IHJpZ2h0Q2hhbm5lbFtpbnB1dEluZGV4XTtcbiAgICBpbnB1dEluZGV4Kys7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGludGVybGVhdmU7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQGNyZWRpdCBodHRwczovL2dpdGh1Yi5jb20vbWF0dGRpYW1vbmQvUmVjb3JkZXJqc1xuICovXG5mdW5jdGlvbiBtZXJnZUJ1ZmZlcnMoY2hhbm5lbEJ1ZmZlciwgcmVjb3JkaW5nTGVuZ3RoKXtcbiAgY29uc3QgcmVzdWx0ID0gbmV3IEZsb2F0MzJBcnJheShyZWNvcmRpbmdMZW5ndGgpO1xuICBjb25zdCBsZW5ndGggPSBjaGFubmVsQnVmZmVyLmxlbmd0aDtcbiAgbGV0IG9mZnNldCA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKyl7XG4gICAgbGV0IGJ1ZmZlciA9IGNoYW5uZWxCdWZmZXJbaV07XG5cbiAgICByZXN1bHQuc2V0KGJ1ZmZlciwgb2Zmc2V0KTtcbiAgICBvZmZzZXQgKz0gYnVmZmVyLmxlbmd0aDtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWVyZ2VCdWZmZXJzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBjcmVkaXQgaHR0cHM6Ly9naXRodWIuY29tL21hdHRkaWFtb25kL1JlY29yZGVyanNcbiAqL1xuZnVuY3Rpb24gd3JpdGVVVEZCeXRlcyh2aWV3LCBvZmZzZXQsIHN0cmluZykge1xuICBjb25zdCBsZW5ndGggPSBzdHJpbmcubGVuZ3RoO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspe1xuICAgIHZpZXcuc2V0VWludDgob2Zmc2V0ICsgaSwgc3RyaW5nLmNoYXJDb2RlQXQoaSkpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gd3JpdGVVVEZCeXRlcztcbiIsIihmdW5jdGlvbihyb290KSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBmdW5jdGlvbiBodHRwTWVzc2FnZVBhcnNlcihtZXNzYWdlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgaHR0cFZlcnNpb246IG51bGwsXG4gICAgICBzdGF0dXNDb2RlOiBudWxsLFxuICAgICAgc3RhdHVzTWVzc2FnZTogbnVsbCxcbiAgICAgIG1ldGhvZDogbnVsbCxcbiAgICAgIHVybDogbnVsbCxcbiAgICAgIGhlYWRlcnM6IG51bGwsXG4gICAgICBib2R5OiBudWxsLFxuICAgICAgYm91bmRhcnk6IG51bGwsXG4gICAgICBtdWx0aXBhcnQ6IG51bGxcbiAgICB9O1xuXG4gICAgdmFyIG1lc3NhZ2VTdHJpbmcgPSAnJztcbiAgICB2YXIgaGVhZGVyTmV3bGluZUluZGV4ID0gMDtcbiAgICB2YXIgZnVsbEJvdW5kYXJ5ID0gbnVsbDtcblxuICAgIGlmIChodHRwTWVzc2FnZVBhcnNlci5faXNCdWZmZXIobWVzc2FnZSkpIHtcbiAgICAgIG1lc3NhZ2VTdHJpbmcgPSBtZXNzYWdlLnRvU3RyaW5nKCk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbWVzc2FnZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIG1lc3NhZ2VTdHJpbmcgPSBtZXNzYWdlO1xuICAgICAgbWVzc2FnZSA9IGh0dHBNZXNzYWdlUGFyc2VyLl9jcmVhdGVCdWZmZXIobWVzc2FnZVN0cmluZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBTdHJpcCBleHRyYSByZXR1cm4gY2hhcmFjdGVyc1xuICAgICAqL1xuICAgIG1lc3NhZ2VTdHJpbmcgPSBtZXNzYWdlU3RyaW5nLnJlcGxhY2UoL1xcclxcbi9naW0sICdcXG4nKTtcblxuICAgIC8qXG4gICAgICogVHJpbSBsZWFkaW5nIHdoaXRlc3BhY2VcbiAgICAgKi9cbiAgICAoZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBmaXJzdE5vbldoaXRlc3BhY2VSZWdleCA9IC9bXFx3LV0rL2dpbTtcbiAgICAgIGNvbnN0IGZpcnN0Tm9uV2hpdGVzcGFjZUluZGV4ID0gbWVzc2FnZVN0cmluZy5zZWFyY2goZmlyc3ROb25XaGl0ZXNwYWNlUmVnZXgpO1xuICAgICAgaWYgKGZpcnN0Tm9uV2hpdGVzcGFjZUluZGV4ID4gMCkge1xuICAgICAgICBtZXNzYWdlID0gbWVzc2FnZS5zbGljZShmaXJzdE5vbldoaXRlc3BhY2VJbmRleCwgbWVzc2FnZS5sZW5ndGgpO1xuICAgICAgICBtZXNzYWdlU3RyaW5nID0gbWVzc2FnZS50b1N0cmluZygpO1xuICAgICAgfVxuICAgIH0pKCk7XG5cbiAgICAvKiBQYXJzZSByZXF1ZXN0IGxpbmVcbiAgICAgKi9cbiAgICAoZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBwb3NzaWJsZVJlcXVlc3RMaW5lID0gbWVzc2FnZVN0cmluZy5zcGxpdCgvXFxufFxcclxcbi8pWzBdO1xuICAgICAgY29uc3QgcmVxdWVzdExpbmVNYXRjaCA9IHBvc3NpYmxlUmVxdWVzdExpbmUubWF0Y2goaHR0cE1lc3NhZ2VQYXJzZXIuX3JlcXVlc3RMaW5lUmVnZXgpO1xuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXF1ZXN0TGluZU1hdGNoKSAmJiByZXF1ZXN0TGluZU1hdGNoLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgcmVzdWx0Lmh0dHBWZXJzaW9uID0gcGFyc2VGbG9hdChyZXF1ZXN0TGluZU1hdGNoWzFdKTtcbiAgICAgICAgcmVzdWx0LnN0YXR1c0NvZGUgPSBwYXJzZUludChyZXF1ZXN0TGluZU1hdGNoWzJdKTtcbiAgICAgICAgcmVzdWx0LnN0YXR1c01lc3NhZ2UgPSByZXF1ZXN0TGluZU1hdGNoWzNdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2VMaW5lTWF0aCA9IHBvc3NpYmxlUmVxdWVzdExpbmUubWF0Y2goaHR0cE1lc3NhZ2VQYXJzZXIuX3Jlc3BvbnNlTGluZVJlZ2V4KTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzcG9uc2VMaW5lTWF0aCkgJiYgcmVzcG9uc2VMaW5lTWF0aC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgcmVzdWx0Lm1ldGhvZCA9IHJlc3BvbnNlTGluZU1hdGhbMV07XG4gICAgICAgICAgcmVzdWx0LnVybCA9IHJlc3BvbnNlTGluZU1hdGhbMl07XG4gICAgICAgICAgcmVzdWx0Lmh0dHBWZXJzaW9uID0gcGFyc2VGbG9hdChyZXNwb25zZUxpbmVNYXRoWzNdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pKCk7XG5cbiAgICAvKiBQYXJzZSBoZWFkZXJzXG4gICAgICovXG4gICAgKGZ1bmN0aW9uKCkge1xuICAgICAgaGVhZGVyTmV3bGluZUluZGV4ID0gbWVzc2FnZVN0cmluZy5zZWFyY2goaHR0cE1lc3NhZ2VQYXJzZXIuX2hlYWRlck5ld2xpbmVSZWdleCk7XG4gICAgICBpZiAoaGVhZGVyTmV3bGluZUluZGV4ID4gLTEpIHtcbiAgICAgICAgaGVhZGVyTmV3bGluZUluZGV4ID0gaGVhZGVyTmV3bGluZUluZGV4ICsgMTsgLy8gMSBmb3IgbmV3bGluZSBsZW5ndGhcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8qIFRoZXJlJ3Mgbm8gbGluZSBicmVha3Mgc28gY2hlY2sgaWYgcmVxdWVzdCBsaW5lIGV4aXN0c1xuICAgICAgICAgKiBiZWNhdXNlIHRoZSBtZXNzYWdlIG1pZ2h0IGJlIGFsbCBoZWFkZXJzIGFuZCBubyBib2R5XG4gICAgICAgICAqL1xuICAgICAgICBpZiAocmVzdWx0Lmh0dHBWZXJzaW9uKSB7XG4gICAgICAgICAgaGVhZGVyTmV3bGluZUluZGV4ID0gbWVzc2FnZVN0cmluZy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgaGVhZGVyc1N0cmluZyA9IG1lc3NhZ2VTdHJpbmcuc3Vic3RyKDAsIGhlYWRlck5ld2xpbmVJbmRleCk7XG4gICAgICBjb25zdCBoZWFkZXJzID0gaHR0cE1lc3NhZ2VQYXJzZXIuX3BhcnNlSGVhZGVycyhoZWFkZXJzU3RyaW5nKTtcblxuICAgICAgaWYgKE9iamVjdC5rZXlzKGhlYWRlcnMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmVzdWx0LmhlYWRlcnMgPSBoZWFkZXJzO1xuXG4gICAgICAgIC8vIFRPT0Q6IGV4dHJhY3QgYm91bmRhcnkuXG4gICAgICB9XG4gICAgfSkoKTtcblxuICAgIC8qIFRyeSB0byBnZXQgYm91bmRhcnkgaWYgbm8gYm91bmRhcnkgaGVhZGVyXG4gICAgICovXG4gICAgKGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFyZXN1bHQuYm91bmRhcnkpIHtcbiAgICAgICAgY29uc3QgYm91bmRhcnlNYXRjaCA9IG1lc3NhZ2VTdHJpbmcubWF0Y2goaHR0cE1lc3NhZ2VQYXJzZXIuX2JvdW5kYXJ5UmVnZXgpO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGJvdW5kYXJ5TWF0Y2gpICYmIGJvdW5kYXJ5TWF0Y2gubGVuZ3RoKSB7XG4gICAgICAgICAgZnVsbEJvdW5kYXJ5ID0gYm91bmRhcnlNYXRjaFswXS5yZXBsYWNlKC9bXFxyXFxuXSsvZ2ksICcnKTtcbiAgICAgICAgICBjb25zdCBib3VuZGFyeSA9IGZ1bGxCb3VuZGFyeS5yZXBsYWNlKC9eLS0vLCcnKTtcbiAgICAgICAgICByZXN1bHQuYm91bmRhcnkgPSBib3VuZGFyeTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pKCk7XG5cbiAgICAvKiBQYXJzZSBib2R5XG4gICAgICovXG4gICAgKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHN0YXJ0ID0gaGVhZGVyTmV3bGluZUluZGV4O1xuICAgICAgdmFyIGVuZCA9IG1lc3NhZ2UubGVuZ3RoO1xuICAgICAgY29uc3QgZmlyc3RCb3VuZGFyeUluZGV4ID0gbWVzc2FnZVN0cmluZy5pbmRleE9mKGZ1bGxCb3VuZGFyeSk7XG5cbiAgICAgIGlmIChmaXJzdEJvdW5kYXJ5SW5kZXggPiAtMSkge1xuICAgICAgICBzdGFydCA9IGhlYWRlck5ld2xpbmVJbmRleDtcbiAgICAgICAgZW5kID0gZmlyc3RCb3VuZGFyeUluZGV4O1xuICAgICAgfVxuXG4gICAgICBpZiAoaGVhZGVyTmV3bGluZUluZGV4ID4gLTEpIHtcbiAgICAgICAgY29uc3QgYm9keSA9IG1lc3NhZ2Uuc2xpY2Uoc3RhcnQsIGVuZCk7XG5cbiAgICAgICAgaWYgKGJvZHkgJiYgYm9keS5sZW5ndGgpIHtcbiAgICAgICAgICByZXN1bHQuYm9keSA9IGh0dHBNZXNzYWdlUGFyc2VyLl9pc0Zha2VCdWZmZXIoYm9keSkgPyBib2R5LnRvU3RyaW5nKCkgOiBib2R5O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkoKTtcblxuICAgIC8qIFBhcnNlIG11bHRpcGFydCBzZWN0aW9uc1xuICAgICAqL1xuICAgIChmdW5jdGlvbigpIHtcbiAgICAgIGlmIChyZXN1bHQuYm91bmRhcnkpIHtcbiAgICAgICAgY29uc3QgbXVsdGlwYXJ0U3RhcnQgPSBtZXNzYWdlU3RyaW5nLmluZGV4T2YoZnVsbEJvdW5kYXJ5KSArIGZ1bGxCb3VuZGFyeS5sZW5ndGg7XG4gICAgICAgIGNvbnN0IG11bHRpcGFydEVuZCA9IG1lc3NhZ2VTdHJpbmcubGFzdEluZGV4T2YoZnVsbEJvdW5kYXJ5KTtcbiAgICAgICAgY29uc3QgbXVsdGlwYXJ0Qm9keSA9IG1lc3NhZ2VTdHJpbmcuc3Vic3RyKG11bHRpcGFydFN0YXJ0LCBtdWx0aXBhcnRFbmQpO1xuICAgICAgICBjb25zdCBwYXJ0cyA9IG11bHRpcGFydEJvZHkuc3BsaXQoZnVsbEJvdW5kYXJ5KTtcblxuICAgICAgICByZXN1bHQubXVsdGlwYXJ0ID0gcGFydHMuZmlsdGVyKGh0dHBNZXNzYWdlUGFyc2VyLl9pc1RydXRoeSkubWFwKGZ1bmN0aW9uKHBhcnQsIGkpIHtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICAgICAgICBoZWFkZXJzOiBudWxsLFxuICAgICAgICAgICAgYm9keTogbnVsbCxcbiAgICAgICAgICAgIG1ldGE6IHtcbiAgICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICAgIGJ5dGVPZmZzZXQ6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXJ0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgZW5kOiBudWxsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGNvbnN0IG5ld2xpbmVSZWdleCA9IC9cXG5cXG58XFxyXFxuXFxyXFxuL2dpbTtcbiAgICAgICAgICB2YXIgbmV3bGluZUluZGV4ID0gMDtcbiAgICAgICAgICB2YXIgbmV3bGluZU1hdGNoID0gbmV3bGluZVJlZ2V4LmV4ZWMocGFydCk7XG4gICAgICAgICAgdmFyIGJvZHkgPSBudWxsO1xuXG4gICAgICAgICAgaWYgKG5ld2xpbmVNYXRjaCkge1xuICAgICAgICAgICAgbmV3bGluZUluZGV4ID0gbmV3bGluZU1hdGNoLmluZGV4O1xuICAgICAgICAgICAgaWYgKG5ld2xpbmVNYXRjaC5pbmRleCA8PSAwKSB7XG4gICAgICAgICAgICAgIG5ld2xpbmVNYXRjaCA9IG5ld2xpbmVSZWdleC5leGVjKHBhcnQpO1xuICAgICAgICAgICAgICBpZiAobmV3bGluZU1hdGNoKSB7XG4gICAgICAgICAgICAgICAgbmV3bGluZUluZGV4ID0gbmV3bGluZU1hdGNoLmluZGV4O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgcG9zc2libGVIZWFkZXJzU3RyaW5nID0gcGFydC5zdWJzdHIoMCwgbmV3bGluZUluZGV4KTtcblxuICAgICAgICAgIGxldCBzdGFydE9mZnNldCA9IG51bGw7XG4gICAgICAgICAgbGV0IGVuZE9mZnNldCA9IG51bGw7XG5cbiAgICAgICAgICBpZiAobmV3bGluZUluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGNvbnN0IGhlYWRlcnMgPSBodHRwTWVzc2FnZVBhcnNlci5fcGFyc2VIZWFkZXJzKHBvc3NpYmxlSGVhZGVyc1N0cmluZyk7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMoaGVhZGVycykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICByZXN1bHQuaGVhZGVycyA9IGhlYWRlcnM7XG5cbiAgICAgICAgICAgICAgdmFyIGJvdW5kYXJ5SW5kZXhlcyA9IFtdO1xuICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1lc3NhZ2UubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgYm91bmRhcnlNYXRjaCA9IG1lc3NhZ2Uuc2xpY2UoaiwgaiArIGZ1bGxCb3VuZGFyeS5sZW5ndGgpLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYm91bmRhcnlNYXRjaCA9PT0gZnVsbEJvdW5kYXJ5KSB7XG4gICAgICAgICAgICAgICAgICBib3VuZGFyeUluZGV4ZXMucHVzaChqKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB2YXIgYm91bmRhcnlOZXdsaW5lSW5kZXhlcyA9IFtdO1xuICAgICAgICAgICAgICBib3VuZGFyeUluZGV4ZXMuc2xpY2UoMCwgYm91bmRhcnlJbmRleGVzLmxlbmd0aCAtIDEpLmZvckVhY2goZnVuY3Rpb24obSwgaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnRCb2R5ID0gbWVzc2FnZS5zbGljZShib3VuZGFyeUluZGV4ZXNba10sIGJvdW5kYXJ5SW5kZXhlc1trICsgMV0pLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgdmFyIGhlYWRlck5ld2xpbmVJbmRleCA9IHBhcnRCb2R5LnNlYXJjaCgvXFxuXFxufFxcclxcblxcclxcbi9naW0pICsgMjtcbiAgICAgICAgICAgICAgICBoZWFkZXJOZXdsaW5lSW5kZXggID0gYm91bmRhcnlJbmRleGVzW2tdICsgaGVhZGVyTmV3bGluZUluZGV4O1xuICAgICAgICAgICAgICAgIGJvdW5kYXJ5TmV3bGluZUluZGV4ZXMucHVzaChoZWFkZXJOZXdsaW5lSW5kZXgpO1xuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICBzdGFydE9mZnNldCA9IGJvdW5kYXJ5TmV3bGluZUluZGV4ZXNbaV07XG4gICAgICAgICAgICAgIGVuZE9mZnNldCA9IGJvdW5kYXJ5SW5kZXhlc1tpICsgMV07XG4gICAgICAgICAgICAgIGJvZHkgPSBtZXNzYWdlLnNsaWNlKHN0YXJ0T2Zmc2V0LCBlbmRPZmZzZXQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYm9keSA9IHBhcnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJvZHkgPSBwYXJ0O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlc3VsdC5ib2R5ID0gaHR0cE1lc3NhZ2VQYXJzZXIuX2lzRmFrZUJ1ZmZlcihib2R5KSA/IGJvZHkudG9TdHJpbmcoKSA6IGJvZHk7XG4gICAgICAgICAgcmVzdWx0Lm1ldGEuYm9keS5ieXRlT2Zmc2V0LnN0YXJ0ID0gc3RhcnRPZmZzZXQ7XG4gICAgICAgICAgcmVzdWx0Lm1ldGEuYm9keS5ieXRlT2Zmc2V0LmVuZCA9IGVuZE9mZnNldDtcblxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKCk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgaHR0cE1lc3NhZ2VQYXJzZXIuX2lzVHJ1dGh5ID0gZnVuY3Rpb24gX2lzVHJ1dGh5KHYpIHtcbiAgICByZXR1cm4gISF2O1xuICB9O1xuXG4gIGh0dHBNZXNzYWdlUGFyc2VyLl9pc051bWVyaWMgPSBmdW5jdGlvbiBfaXNOdW1lcmljKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT09ICdudW1iZXInICYmICFpc05hTih2KSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdiA9ICh2fHwnJykudG9TdHJpbmcoKS50cmltKCk7XG5cbiAgICBpZiAoIXYpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gIWlzTmFOKHYpO1xuICB9O1xuXG4gIGh0dHBNZXNzYWdlUGFyc2VyLl9pc0J1ZmZlciA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICByZXR1cm4gKChodHRwTWVzc2FnZVBhcnNlci5faXNOb2RlQnVmZmVyU3VwcG9ydGVkKCkgJiZcbiAgICAgICAgICAgIHR5cGVvZiBnbG9iYWwgPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICBnbG9iYWwuQnVmZmVyLmlzQnVmZmVyKGl0ZW0pKSB8fFxuICAgICAgICAgICAgKGl0ZW0gaW5zdGFuY2VvZiBPYmplY3QgJiZcbiAgICAgICAgICAgICBpdGVtLl9pc0J1ZmZlcikpO1xuICB9O1xuXG4gIGh0dHBNZXNzYWdlUGFyc2VyLl9pc05vZGVCdWZmZXJTdXBwb3J0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBnbG9iYWwgPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICB0eXBlb2YgZ2xvYmFsLkJ1ZmZlciA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICAgICAgdHlwZW9mIGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIgPT09ICdmdW5jdGlvbicpO1xuICB9O1xuXG4gIGh0dHBNZXNzYWdlUGFyc2VyLl9wYXJzZUhlYWRlcnMgPSBmdW5jdGlvbiBfcGFyc2VIZWFkZXJzKGJvZHkpIHtcbiAgICBjb25zdCBoZWFkZXJzID0ge307XG5cbiAgICBpZiAodHlwZW9mIGJvZHkgIT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gaGVhZGVycztcbiAgICB9XG5cbiAgICBib2R5LnNwbGl0KC9bXFxyXFxuXS8pLmZvckVhY2goZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICBjb25zdCBtYXRjaCA9IHN0cmluZy5tYXRjaCgvKFtcXHctXSspOlxccyooLiopL2kpO1xuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShtYXRjaCkgJiYgbWF0Y2gubGVuZ3RoID09PSAzKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IG1hdGNoWzFdO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IG1hdGNoWzJdO1xuXG4gICAgICAgIGhlYWRlcnNba2V5XSA9IGh0dHBNZXNzYWdlUGFyc2VyLl9pc051bWVyaWModmFsdWUpID8gTnVtYmVyKHZhbHVlKSA6IHZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGhlYWRlcnM7XG4gIH07XG5cbiAgaHR0cE1lc3NhZ2VQYXJzZXIuX3JlcXVlc3RMaW5lUmVnZXggPSAvSFRUUFxcLygxXFwuMHwxXFwuMXwyXFwuMClcXHMrKFxcZCspXFxzKyhbXFx3XFxzLV9dKykvaTtcbiAgaHR0cE1lc3NhZ2VQYXJzZXIuX3Jlc3BvbnNlTGluZVJlZ2V4ID0gLyhHRVR8UE9TVHxQVVR8REVMRVRFfFBBVENIfE9QVElPTlN8SEVBRHxUUkFDRXxDT05ORUNUKVxccysoLiopXFxzK0hUVFBcXC8oMVxcLjB8MVxcLjF8MlxcLjApL2k7XG4gIGh0dHBNZXNzYWdlUGFyc2VyLl9oZWFkZXJOZXdsaW5lUmVnZXggPSAvXltcXHJcXG5dKy9naW07XG4gIGh0dHBNZXNzYWdlUGFyc2VyLl9ib3VuZGFyeVJlZ2V4ID0gLyhcXG58XFxyXFxuKSstLVtcXHctXSsoXFxufFxcclxcbikrL2c7XG5cbiAgaHR0cE1lc3NhZ2VQYXJzZXIuX2NyZWF0ZUJ1ZmZlciA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBpZiAoaHR0cE1lc3NhZ2VQYXJzZXIuX2lzTm9kZUJ1ZmZlclN1cHBvcnRlZCgpKSB7XG4gICAgICByZXR1cm4gbmV3IEJ1ZmZlcihkYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IGh0dHBNZXNzYWdlUGFyc2VyLl9GYWtlQnVmZmVyKGRhdGEpO1xuICB9O1xuXG4gIGh0dHBNZXNzYWdlUGFyc2VyLl9pc0Zha2VCdWZmZXIgPSBmdW5jdGlvbiBpc0Zha2VCdWZmZXIob2JqKSB7XG4gICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIGh0dHBNZXNzYWdlUGFyc2VyLl9GYWtlQnVmZmVyO1xuICB9O1xuXG4gIGh0dHBNZXNzYWdlUGFyc2VyLl9GYWtlQnVmZmVyID0gZnVuY3Rpb24gRmFrZUJ1ZmZlcihkYXRhKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIGh0dHBNZXNzYWdlUGFyc2VyLl9GYWtlQnVmZmVyKSkge1xuICAgICAgcmV0dXJuIG5ldyBodHRwTWVzc2FnZVBhcnNlci5fRmFrZUJ1ZmZlcihkYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLmRhdGEgPSBbXTtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmRhdGEgPSBbXS5zbGljZS5jYWxsKGRhdGEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIExpdmVPYmplY3QoKSB7fVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShMaXZlT2JqZWN0LnByb3RvdHlwZSwgJ2xlbmd0aCcsIHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGEubGVuZ3RoO1xuICAgICAgfS5iaW5kKHRoaXMpXG4gICAgfSk7XG5cbiAgICB0aGlzLmxlbmd0aCA9IChuZXcgTGl2ZU9iamVjdCgpKS5sZW5ndGg7XG4gIH07XG5cbiAgaHR0cE1lc3NhZ2VQYXJzZXIuX0Zha2VCdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UoKSB7XG4gICAgdmFyIG5ld0FycmF5ID0gW10uc2xpY2UuYXBwbHkodGhpcy5kYXRhLCBhcmd1bWVudHMpO1xuICAgIHJldHVybiBuZXcgaHR0cE1lc3NhZ2VQYXJzZXIuX0Zha2VCdWZmZXIobmV3QXJyYXkpO1xuICB9O1xuXG4gIGh0dHBNZXNzYWdlUGFyc2VyLl9GYWtlQnVmZmVyLnByb3RvdHlwZS5zZWFyY2ggPSBmdW5jdGlvbiBzZWFyY2goKSB7XG4gICAgcmV0dXJuIFtdLnNlYXJjaC5hcHBseSh0aGlzLmRhdGEsIGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgaHR0cE1lc3NhZ2VQYXJzZXIuX0Zha2VCdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mKCkge1xuICAgIHJldHVybiBbXS5pbmRleE9mLmFwcGx5KHRoaXMuZGF0YSwgYXJndW1lbnRzKTtcbiAgfTtcblxuICBodHRwTWVzc2FnZVBhcnNlci5fRmFrZUJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmpvaW4oJycpO1xuICB9O1xuXG4gIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGh0dHBNZXNzYWdlUGFyc2VyO1xuICAgIH1cbiAgICBleHBvcnRzLmh0dHBNZXNzYWdlUGFyc2VyID0gaHR0cE1lc3NhZ2VQYXJzZXI7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKFtdLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBodHRwTWVzc2FnZVBhcnNlcjtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByb290Lmh0dHBNZXNzYWdlUGFyc2VyID0gaHR0cE1lc3NhZ2VQYXJzZXI7XG4gIH1cblxufSkodGhpcyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBTdHJpbmdpZnkgPSByZXF1aXJlKCcuL3N0cmluZ2lmeScpO1xudmFyIFBhcnNlID0gcmVxdWlyZSgnLi9wYXJzZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzdHJpbmdpZnk6IFN0cmluZ2lmeSxcbiAgICBwYXJzZTogUGFyc2Vcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxudmFyIGludGVybmFscyA9IHtcbiAgICBkZWxpbWl0ZXI6ICcmJyxcbiAgICBkZXB0aDogNSxcbiAgICBhcnJheUxpbWl0OiAyMCxcbiAgICBwYXJhbWV0ZXJMaW1pdDogMTAwMCxcbiAgICBzdHJpY3ROdWxsSGFuZGxpbmc6IGZhbHNlLFxuICAgIHBsYWluT2JqZWN0czogZmFsc2UsXG4gICAgYWxsb3dQcm90b3R5cGVzOiBmYWxzZSxcbiAgICBhbGxvd0RvdHM6IGZhbHNlXG59O1xuXG5pbnRlcm5hbHMucGFyc2VWYWx1ZXMgPSBmdW5jdGlvbiAoc3RyLCBvcHRpb25zKSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdChvcHRpb25zLmRlbGltaXRlciwgb3B0aW9ucy5wYXJhbWV0ZXJMaW1pdCA9PT0gSW5maW5pdHkgPyB1bmRlZmluZWQgOiBvcHRpb25zLnBhcmFtZXRlckxpbWl0KTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHBhcnQgPSBwYXJ0c1tpXTtcbiAgICAgICAgdmFyIHBvcyA9IHBhcnQuaW5kZXhPZignXT0nKSA9PT0gLTEgPyBwYXJ0LmluZGV4T2YoJz0nKSA6IHBhcnQuaW5kZXhPZignXT0nKSArIDE7XG5cbiAgICAgICAgaWYgKHBvcyA9PT0gLTEpIHtcbiAgICAgICAgICAgIG9ialtVdGlscy5kZWNvZGUocGFydCldID0gJyc7XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnN0cmljdE51bGxIYW5kbGluZykge1xuICAgICAgICAgICAgICAgIG9ialtVdGlscy5kZWNvZGUocGFydCldID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBVdGlscy5kZWNvZGUocGFydC5zbGljZSgwLCBwb3MpKTtcbiAgICAgICAgICAgIHZhciB2YWwgPSBVdGlscy5kZWNvZGUocGFydC5zbGljZShwb3MgKyAxKSk7XG5cbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgb2JqW2tleV0gPSBbXS5jb25jYXQob2JqW2tleV0pLmNvbmNhdCh2YWwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvYmpba2V5XSA9IHZhbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvYmo7XG59O1xuXG5pbnRlcm5hbHMucGFyc2VPYmplY3QgPSBmdW5jdGlvbiAoY2hhaW4sIHZhbCwgb3B0aW9ucykge1xuICAgIGlmICghY2hhaW4ubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuXG4gICAgdmFyIHJvb3QgPSBjaGFpbi5zaGlmdCgpO1xuXG4gICAgdmFyIG9iajtcbiAgICBpZiAocm9vdCA9PT0gJ1tdJykge1xuICAgICAgICBvYmogPSBbXTtcbiAgICAgICAgb2JqID0gb2JqLmNvbmNhdChpbnRlcm5hbHMucGFyc2VPYmplY3QoY2hhaW4sIHZhbCwgb3B0aW9ucykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG9iaiA9IG9wdGlvbnMucGxhaW5PYmplY3RzID8gT2JqZWN0LmNyZWF0ZShudWxsKSA6IHt9O1xuICAgICAgICB2YXIgY2xlYW5Sb290ID0gcm9vdFswXSA9PT0gJ1snICYmIHJvb3Rbcm9vdC5sZW5ndGggLSAxXSA9PT0gJ10nID8gcm9vdC5zbGljZSgxLCByb290Lmxlbmd0aCAtIDEpIDogcm9vdDtcbiAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQoY2xlYW5Sb290LCAxMCk7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICFpc05hTihpbmRleCkgJiZcbiAgICAgICAgICAgIHJvb3QgIT09IGNsZWFuUm9vdCAmJlxuICAgICAgICAgICAgU3RyaW5nKGluZGV4KSA9PT0gY2xlYW5Sb290ICYmXG4gICAgICAgICAgICBpbmRleCA+PSAwICYmXG4gICAgICAgICAgICAob3B0aW9ucy5wYXJzZUFycmF5cyAmJiBpbmRleCA8PSBvcHRpb25zLmFycmF5TGltaXQpXG4gICAgICAgICkge1xuICAgICAgICAgICAgb2JqID0gW107XG4gICAgICAgICAgICBvYmpbaW5kZXhdID0gaW50ZXJuYWxzLnBhcnNlT2JqZWN0KGNoYWluLCB2YWwsIG9wdGlvbnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2JqW2NsZWFuUm9vdF0gPSBpbnRlcm5hbHMucGFyc2VPYmplY3QoY2hhaW4sIHZhbCwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb2JqO1xufTtcblxuaW50ZXJuYWxzLnBhcnNlS2V5cyA9IGZ1bmN0aW9uIChnaXZlbktleSwgdmFsLCBvcHRpb25zKSB7XG4gICAgaWYgKCFnaXZlbktleSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVHJhbnNmb3JtIGRvdCBub3RhdGlvbiB0byBicmFja2V0IG5vdGF0aW9uXG4gICAgdmFyIGtleSA9IG9wdGlvbnMuYWxsb3dEb3RzID8gZ2l2ZW5LZXkucmVwbGFjZSgvXFwuKFteXFwuXFxbXSspL2csICdbJDFdJykgOiBnaXZlbktleTtcblxuICAgIC8vIFRoZSByZWdleCBjaHVua3NcblxuICAgIHZhciBwYXJlbnQgPSAvXihbXlxcW1xcXV0qKS87XG4gICAgdmFyIGNoaWxkID0gLyhcXFtbXlxcW1xcXV0qXFxdKS9nO1xuXG4gICAgLy8gR2V0IHRoZSBwYXJlbnRcblxuICAgIHZhciBzZWdtZW50ID0gcGFyZW50LmV4ZWMoa2V5KTtcblxuICAgIC8vIFN0YXNoIHRoZSBwYXJlbnQgaWYgaXQgZXhpc3RzXG5cbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGlmIChzZWdtZW50WzFdKSB7XG4gICAgICAgIC8vIElmIHdlIGFyZW4ndCB1c2luZyBwbGFpbiBvYmplY3RzLCBvcHRpb25hbGx5IHByZWZpeCBrZXlzXG4gICAgICAgIC8vIHRoYXQgd291bGQgb3ZlcndyaXRlIG9iamVjdCBwcm90b3R5cGUgcHJvcGVydGllc1xuICAgICAgICBpZiAoIW9wdGlvbnMucGxhaW5PYmplY3RzICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkoc2VnbWVudFsxXSkpIHtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5hbGxvd1Byb3RvdHlwZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBrZXlzLnB1c2goc2VnbWVudFsxXSk7XG4gICAgfVxuXG4gICAgLy8gTG9vcCB0aHJvdWdoIGNoaWxkcmVuIGFwcGVuZGluZyB0byB0aGUgYXJyYXkgdW50aWwgd2UgaGl0IGRlcHRoXG5cbiAgICB2YXIgaSA9IDA7XG4gICAgd2hpbGUgKChzZWdtZW50ID0gY2hpbGQuZXhlYyhrZXkpKSAhPT0gbnVsbCAmJiBpIDwgb3B0aW9ucy5kZXB0aCkge1xuICAgICAgICBpICs9IDE7XG4gICAgICAgIGlmICghb3B0aW9ucy5wbGFpbk9iamVjdHMgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eShzZWdtZW50WzFdLnJlcGxhY2UoL1xcW3xcXF0vZywgJycpKSkge1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zLmFsbG93UHJvdG90eXBlcykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGtleXMucHVzaChzZWdtZW50WzFdKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSdzIGEgcmVtYWluZGVyLCBqdXN0IGFkZCB3aGF0ZXZlciBpcyBsZWZ0XG5cbiAgICBpZiAoc2VnbWVudCkge1xuICAgICAgICBrZXlzLnB1c2goJ1snICsga2V5LnNsaWNlKHNlZ21lbnQuaW5kZXgpICsgJ10nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW50ZXJuYWxzLnBhcnNlT2JqZWN0KGtleXMsIHZhbCwgb3B0aW9ucyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzdHIsIG9wdHMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IG9wdHMgfHwge307XG4gICAgb3B0aW9ucy5kZWxpbWl0ZXIgPSB0eXBlb2Ygb3B0aW9ucy5kZWxpbWl0ZXIgPT09ICdzdHJpbmcnIHx8IFV0aWxzLmlzUmVnRXhwKG9wdGlvbnMuZGVsaW1pdGVyKSA/IG9wdGlvbnMuZGVsaW1pdGVyIDogaW50ZXJuYWxzLmRlbGltaXRlcjtcbiAgICBvcHRpb25zLmRlcHRoID0gdHlwZW9mIG9wdGlvbnMuZGVwdGggPT09ICdudW1iZXInID8gb3B0aW9ucy5kZXB0aCA6IGludGVybmFscy5kZXB0aDtcbiAgICBvcHRpb25zLmFycmF5TGltaXQgPSB0eXBlb2Ygb3B0aW9ucy5hcnJheUxpbWl0ID09PSAnbnVtYmVyJyA/IG9wdGlvbnMuYXJyYXlMaW1pdCA6IGludGVybmFscy5hcnJheUxpbWl0O1xuICAgIG9wdGlvbnMucGFyc2VBcnJheXMgPSBvcHRpb25zLnBhcnNlQXJyYXlzICE9PSBmYWxzZTtcbiAgICBvcHRpb25zLmFsbG93RG90cyA9IHR5cGVvZiBvcHRpb25zLmFsbG93RG90cyA9PT0gJ2Jvb2xlYW4nID8gb3B0aW9ucy5hbGxvd0RvdHMgOiBpbnRlcm5hbHMuYWxsb3dEb3RzO1xuICAgIG9wdGlvbnMucGxhaW5PYmplY3RzID0gdHlwZW9mIG9wdGlvbnMucGxhaW5PYmplY3RzID09PSAnYm9vbGVhbicgPyBvcHRpb25zLnBsYWluT2JqZWN0cyA6IGludGVybmFscy5wbGFpbk9iamVjdHM7XG4gICAgb3B0aW9ucy5hbGxvd1Byb3RvdHlwZXMgPSB0eXBlb2Ygb3B0aW9ucy5hbGxvd1Byb3RvdHlwZXMgPT09ICdib29sZWFuJyA/IG9wdGlvbnMuYWxsb3dQcm90b3R5cGVzIDogaW50ZXJuYWxzLmFsbG93UHJvdG90eXBlcztcbiAgICBvcHRpb25zLnBhcmFtZXRlckxpbWl0ID0gdHlwZW9mIG9wdGlvbnMucGFyYW1ldGVyTGltaXQgPT09ICdudW1iZXInID8gb3B0aW9ucy5wYXJhbWV0ZXJMaW1pdCA6IGludGVybmFscy5wYXJhbWV0ZXJMaW1pdDtcbiAgICBvcHRpb25zLnN0cmljdE51bGxIYW5kbGluZyA9IHR5cGVvZiBvcHRpb25zLnN0cmljdE51bGxIYW5kbGluZyA9PT0gJ2Jvb2xlYW4nID8gb3B0aW9ucy5zdHJpY3ROdWxsSGFuZGxpbmcgOiBpbnRlcm5hbHMuc3RyaWN0TnVsbEhhbmRsaW5nO1xuXG4gICAgaWYgKFxuICAgICAgICBzdHIgPT09ICcnIHx8XG4gICAgICAgIHN0ciA9PT0gbnVsbCB8fFxuICAgICAgICB0eXBlb2Ygc3RyID09PSAndW5kZWZpbmVkJ1xuICAgICkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5wbGFpbk9iamVjdHMgPyBPYmplY3QuY3JlYXRlKG51bGwpIDoge307XG4gICAgfVxuXG4gICAgdmFyIHRlbXBPYmogPSB0eXBlb2Ygc3RyID09PSAnc3RyaW5nJyA/IGludGVybmFscy5wYXJzZVZhbHVlcyhzdHIsIG9wdGlvbnMpIDogc3RyO1xuICAgIHZhciBvYmogPSBvcHRpb25zLnBsYWluT2JqZWN0cyA/IE9iamVjdC5jcmVhdGUobnVsbCkgOiB7fTtcblxuICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUga2V5cyBhbmQgc2V0dXAgdGhlIG5ldyBvYmplY3RcblxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModGVtcE9iaik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICB2YXIgbmV3T2JqID0gaW50ZXJuYWxzLnBhcnNlS2V5cyhrZXksIHRlbXBPYmpba2V5XSwgb3B0aW9ucyk7XG4gICAgICAgIG9iaiA9IFV0aWxzLm1lcmdlKG9iaiwgbmV3T2JqLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gVXRpbHMuY29tcGFjdChvYmopO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgaW50ZXJuYWxzID0ge1xuICAgIGRlbGltaXRlcjogJyYnLFxuICAgIGFycmF5UHJlZml4R2VuZXJhdG9yczoge1xuICAgICAgICBicmFja2V0czogZnVuY3Rpb24gKHByZWZpeCkge1xuICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArICdbXSc7XG4gICAgICAgIH0sXG4gICAgICAgIGluZGljZXM6IGZ1bmN0aW9uIChwcmVmaXgsIGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArICdbJyArIGtleSArICddJztcbiAgICAgICAgfSxcbiAgICAgICAgcmVwZWF0OiBmdW5jdGlvbiAocHJlZml4KSB7XG4gICAgICAgICAgICByZXR1cm4gcHJlZml4O1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzdHJpY3ROdWxsSGFuZGxpbmc6IGZhbHNlLFxuICAgIHNraXBOdWxsczogZmFsc2UsXG4gICAgZW5jb2RlOiB0cnVlXG59O1xuXG5pbnRlcm5hbHMuc3RyaW5naWZ5ID0gZnVuY3Rpb24gKG9iamVjdCwgcHJlZml4LCBnZW5lcmF0ZUFycmF5UHJlZml4LCBzdHJpY3ROdWxsSGFuZGxpbmcsIHNraXBOdWxscywgZW5jb2RlLCBmaWx0ZXIsIHNvcnQsIGFsbG93RG90cykge1xuICAgIHZhciBvYmogPSBvYmplY3Q7XG4gICAgaWYgKHR5cGVvZiBmaWx0ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgb2JqID0gZmlsdGVyKHByZWZpeCwgb2JqKTtcbiAgICB9IGVsc2UgaWYgKFV0aWxzLmlzQnVmZmVyKG9iaikpIHtcbiAgICAgICAgb2JqID0gU3RyaW5nKG9iaik7XG4gICAgfSBlbHNlIGlmIChvYmogaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgIG9iaiA9IG9iai50b0lTT1N0cmluZygpO1xuICAgIH0gZWxzZSBpZiAob2JqID09PSBudWxsKSB7XG4gICAgICAgIGlmIChzdHJpY3ROdWxsSGFuZGxpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBlbmNvZGUgPyBVdGlscy5lbmNvZGUocHJlZml4KSA6IHByZWZpeDtcbiAgICAgICAgfVxuXG4gICAgICAgIG9iaiA9ICcnO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygb2JqID09PSAnbnVtYmVyJyB8fCB0eXBlb2Ygb2JqID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgaWYgKGVuY29kZSkge1xuICAgICAgICAgICAgcmV0dXJuIFtVdGlscy5lbmNvZGUocHJlZml4KSArICc9JyArIFV0aWxzLmVuY29kZShvYmopXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW3ByZWZpeCArICc9JyArIG9ial07XG4gICAgfVxuXG4gICAgdmFyIHZhbHVlcyA9IFtdO1xuXG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfVxuXG4gICAgdmFyIG9iaktleXM7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZmlsdGVyKSkge1xuICAgICAgICBvYmpLZXlzID0gZmlsdGVyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgICAgICAgb2JqS2V5cyA9IHNvcnQgPyBrZXlzLnNvcnQoc29ydCkgOiBrZXlzO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqS2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIga2V5ID0gb2JqS2V5c1tpXTtcblxuICAgICAgICBpZiAoc2tpcE51bGxzICYmIG9ialtrZXldID09PSBudWxsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICAgICAgICAgIHZhbHVlcyA9IHZhbHVlcy5jb25jYXQoaW50ZXJuYWxzLnN0cmluZ2lmeShvYmpba2V5XSwgZ2VuZXJhdGVBcnJheVByZWZpeChwcmVmaXgsIGtleSksIGdlbmVyYXRlQXJyYXlQcmVmaXgsIHN0cmljdE51bGxIYW5kbGluZywgc2tpcE51bGxzLCBlbmNvZGUsIGZpbHRlciwgc29ydCwgYWxsb3dEb3RzKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZXMgPSB2YWx1ZXMuY29uY2F0KGludGVybmFscy5zdHJpbmdpZnkob2JqW2tleV0sIHByZWZpeCArIChhbGxvd0RvdHMgPyAnLicgKyBrZXkgOiAnWycgKyBrZXkgKyAnXScpLCBnZW5lcmF0ZUFycmF5UHJlZml4LCBzdHJpY3ROdWxsSGFuZGxpbmcsIHNraXBOdWxscywgZW5jb2RlLCBmaWx0ZXIsIHNvcnQsIGFsbG93RG90cykpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iamVjdCwgb3B0cykge1xuICAgIHZhciBvYmogPSBvYmplY3Q7XG4gICAgdmFyIG9wdGlvbnMgPSBvcHRzIHx8IHt9O1xuICAgIHZhciBkZWxpbWl0ZXIgPSB0eXBlb2Ygb3B0aW9ucy5kZWxpbWl0ZXIgPT09ICd1bmRlZmluZWQnID8gaW50ZXJuYWxzLmRlbGltaXRlciA6IG9wdGlvbnMuZGVsaW1pdGVyO1xuICAgIHZhciBzdHJpY3ROdWxsSGFuZGxpbmcgPSB0eXBlb2Ygb3B0aW9ucy5zdHJpY3ROdWxsSGFuZGxpbmcgPT09ICdib29sZWFuJyA/IG9wdGlvbnMuc3RyaWN0TnVsbEhhbmRsaW5nIDogaW50ZXJuYWxzLnN0cmljdE51bGxIYW5kbGluZztcbiAgICB2YXIgc2tpcE51bGxzID0gdHlwZW9mIG9wdGlvbnMuc2tpcE51bGxzID09PSAnYm9vbGVhbicgPyBvcHRpb25zLnNraXBOdWxscyA6IGludGVybmFscy5za2lwTnVsbHM7XG4gICAgdmFyIGVuY29kZSA9IHR5cGVvZiBvcHRpb25zLmVuY29kZSA9PT0gJ2Jvb2xlYW4nID8gb3B0aW9ucy5lbmNvZGUgOiBpbnRlcm5hbHMuZW5jb2RlO1xuICAgIHZhciBzb3J0ID0gdHlwZW9mIG9wdGlvbnMuc29ydCA9PT0gJ2Z1bmN0aW9uJyA/IG9wdGlvbnMuc29ydCA6IG51bGw7XG4gICAgdmFyIGFsbG93RG90cyA9IHR5cGVvZiBvcHRpb25zLmFsbG93RG90cyA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6IG9wdGlvbnMuYWxsb3dEb3RzO1xuICAgIHZhciBvYmpLZXlzO1xuICAgIHZhciBmaWx0ZXI7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLmZpbHRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBmaWx0ZXIgPSBvcHRpb25zLmZpbHRlcjtcbiAgICAgICAgb2JqID0gZmlsdGVyKCcnLCBvYmopO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmZpbHRlcikpIHtcbiAgICAgICAgb2JqS2V5cyA9IGZpbHRlciA9IG9wdGlvbnMuZmlsdGVyO1xuICAgIH1cblxuICAgIHZhciBrZXlzID0gW107XG5cbiAgICBpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcgfHwgb2JqID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICB2YXIgYXJyYXlGb3JtYXQ7XG4gICAgaWYgKG9wdGlvbnMuYXJyYXlGb3JtYXQgaW4gaW50ZXJuYWxzLmFycmF5UHJlZml4R2VuZXJhdG9ycykge1xuICAgICAgICBhcnJheUZvcm1hdCA9IG9wdGlvbnMuYXJyYXlGb3JtYXQ7XG4gICAgfSBlbHNlIGlmICgnaW5kaWNlcycgaW4gb3B0aW9ucykge1xuICAgICAgICBhcnJheUZvcm1hdCA9IG9wdGlvbnMuaW5kaWNlcyA/ICdpbmRpY2VzJyA6ICdyZXBlYXQnO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGFycmF5Rm9ybWF0ID0gJ2luZGljZXMnO1xuICAgIH1cblxuICAgIHZhciBnZW5lcmF0ZUFycmF5UHJlZml4ID0gaW50ZXJuYWxzLmFycmF5UHJlZml4R2VuZXJhdG9yc1thcnJheUZvcm1hdF07XG5cbiAgICBpZiAoIW9iaktleXMpIHtcbiAgICAgICAgb2JqS2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAgfVxuXG4gICAgaWYgKHNvcnQpIHtcbiAgICAgICAgb2JqS2V5cy5zb3J0KHNvcnQpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqS2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIga2V5ID0gb2JqS2V5c1tpXTtcblxuICAgICAgICBpZiAoc2tpcE51bGxzICYmIG9ialtrZXldID09PSBudWxsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGtleXMgPSBrZXlzLmNvbmNhdChpbnRlcm5hbHMuc3RyaW5naWZ5KG9ialtrZXldLCBrZXksIGdlbmVyYXRlQXJyYXlQcmVmaXgsIHN0cmljdE51bGxIYW5kbGluZywgc2tpcE51bGxzLCBlbmNvZGUsIGZpbHRlciwgc29ydCwgYWxsb3dEb3RzKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGtleXMuam9pbihkZWxpbWl0ZXIpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhleFRhYmxlID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJyYXkgPSBuZXcgQXJyYXkoMjU2KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgKytpKSB7XG4gICAgICAgIGFycmF5W2ldID0gJyUnICsgKChpIDwgMTYgPyAnMCcgOiAnJykgKyBpLnRvU3RyaW5nKDE2KSkudG9VcHBlckNhc2UoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJyYXk7XG59KCkpO1xuXG5leHBvcnRzLmFycmF5VG9PYmplY3QgPSBmdW5jdGlvbiAoc291cmNlLCBvcHRpb25zKSB7XG4gICAgdmFyIG9iaiA9IG9wdGlvbnMucGxhaW5PYmplY3RzID8gT2JqZWN0LmNyZWF0ZShudWxsKSA6IHt9O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc291cmNlLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc291cmNlW2ldICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgb2JqW2ldID0gc291cmNlW2ldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbmV4cG9ydHMubWVyZ2UgPSBmdW5jdGlvbiAodGFyZ2V0LCBzb3VyY2UsIG9wdGlvbnMpIHtcbiAgICBpZiAoIXNvdXJjZSkge1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygc291cmNlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0YXJnZXQpKSB7XG4gICAgICAgICAgICB0YXJnZXQucHVzaChzb3VyY2UpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0YXJnZXQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0YXJnZXRbc291cmNlXSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW3RhcmdldCwgc291cmNlXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0YXJnZXQgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBbdGFyZ2V0XS5jb25jYXQoc291cmNlKTtcbiAgICB9XG5cbiAgICB2YXIgbWVyZ2VUYXJnZXQgPSB0YXJnZXQ7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodGFyZ2V0KSAmJiAhQXJyYXkuaXNBcnJheShzb3VyY2UpKSB7XG4gICAgICAgIG1lcmdlVGFyZ2V0ID0gZXhwb3J0cy5hcnJheVRvT2JqZWN0KHRhcmdldCwgb3B0aW9ucyk7XG4gICAgfVxuXG5cdHJldHVybiBPYmplY3Qua2V5cyhzb3VyY2UpLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBrZXkpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gc291cmNlW2tleV07XG5cbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChhY2MsIGtleSkpIHtcbiAgICAgICAgICAgIGFjY1trZXldID0gZXhwb3J0cy5tZXJnZShhY2Nba2V5XSwgdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWNjW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuXHRcdHJldHVybiBhY2M7XG4gICAgfSwgbWVyZ2VUYXJnZXQpO1xufTtcblxuZXhwb3J0cy5kZWNvZGUgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzdHIucmVwbGFjZSgvXFwrL2csICcgJykpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG59O1xuXG5leHBvcnRzLmVuY29kZSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAvLyBUaGlzIGNvZGUgd2FzIG9yaWdpbmFsbHkgd3JpdHRlbiBieSBCcmlhbiBXaGl0ZSAobXNjZGV4KSBmb3IgdGhlIGlvLmpzIGNvcmUgcXVlcnlzdHJpbmcgbGlicmFyeS5cbiAgICAvLyBJdCBoYXMgYmVlbiBhZGFwdGVkIGhlcmUgZm9yIHN0cmljdGVyIGFkaGVyZW5jZSB0byBSRkMgMzk4NlxuICAgIGlmIChzdHIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuXG4gICAgdmFyIHN0cmluZyA9IHR5cGVvZiBzdHIgPT09ICdzdHJpbmcnID8gc3RyIDogU3RyaW5nKHN0cik7XG5cbiAgICB2YXIgb3V0ID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGMgPSBzdHJpbmcuY2hhckNvZGVBdChpKTtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBjID09PSAweDJEIHx8IC8vIC1cbiAgICAgICAgICAgIGMgPT09IDB4MkUgfHwgLy8gLlxuICAgICAgICAgICAgYyA9PT0gMHg1RiB8fCAvLyBfXG4gICAgICAgICAgICBjID09PSAweDdFIHx8IC8vIH5cbiAgICAgICAgICAgIChjID49IDB4MzAgJiYgYyA8PSAweDM5KSB8fCAvLyAwLTlcbiAgICAgICAgICAgIChjID49IDB4NDEgJiYgYyA8PSAweDVBKSB8fCAvLyBhLXpcbiAgICAgICAgICAgIChjID49IDB4NjEgJiYgYyA8PSAweDdBKSAvLyBBLVpcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBvdXQgKz0gc3RyaW5nLmNoYXJBdChpKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGMgPCAweDgwKSB7XG4gICAgICAgICAgICBvdXQgPSBvdXQgKyBoZXhUYWJsZVtjXTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGMgPCAweDgwMCkge1xuICAgICAgICAgICAgb3V0ID0gb3V0ICsgKGhleFRhYmxlWzB4QzAgfCAoYyA+PiA2KV0gKyBoZXhUYWJsZVsweDgwIHwgKGMgJiAweDNGKV0pO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYyA8IDB4RDgwMCB8fCBjID49IDB4RTAwMCkge1xuICAgICAgICAgICAgb3V0ID0gb3V0ICsgKGhleFRhYmxlWzB4RTAgfCAoYyA+PiAxMildICsgaGV4VGFibGVbMHg4MCB8ICgoYyA+PiA2KSAmIDB4M0YpXSArIGhleFRhYmxlWzB4ODAgfCAoYyAmIDB4M0YpXSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGkgKz0gMTtcbiAgICAgICAgYyA9IDB4MTAwMDAgKyAoKChjICYgMHgzRkYpIDw8IDEwKSB8IChzdHJpbmcuY2hhckNvZGVBdChpKSAmIDB4M0ZGKSk7XG4gICAgICAgIG91dCArPSAoaGV4VGFibGVbMHhGMCB8IChjID4+IDE4KV0gKyBoZXhUYWJsZVsweDgwIHwgKChjID4+IDEyKSAmIDB4M0YpXSArIGhleFRhYmxlWzB4ODAgfCAoKGMgPj4gNikgJiAweDNGKV0gKyBoZXhUYWJsZVsweDgwIHwgKGMgJiAweDNGKV0pO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG5leHBvcnRzLmNvbXBhY3QgPSBmdW5jdGlvbiAob2JqLCByZWZlcmVuY2VzKSB7XG4gICAgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnIHx8IG9iaiA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cblxuICAgIHZhciByZWZzID0gcmVmZXJlbmNlcyB8fCBbXTtcbiAgICB2YXIgbG9va3VwID0gcmVmcy5pbmRleE9mKG9iaik7XG4gICAgaWYgKGxvb2t1cCAhPT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIHJlZnNbbG9va3VwXTtcbiAgICB9XG5cbiAgICByZWZzLnB1c2gob2JqKTtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICAgICAgdmFyIGNvbXBhY3RlZCA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9ialtpXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBjb21wYWN0ZWQucHVzaChvYmpbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvbXBhY3RlZDtcbiAgICB9XG5cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBrZXlzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2pdO1xuICAgICAgICBvYmpba2V5XSA9IGV4cG9ydHMuY29tcGFjdChvYmpba2V5XSwgcmVmcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbmV4cG9ydHMuaXNSZWdFeHAgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBSZWdFeHBdJztcbn07XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgaWYgKG9iaiA9PT0gbnVsbCB8fCB0eXBlb2Ygb2JqID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuICEhKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IuaXNCdWZmZXIgJiYgb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyKG9iaikpO1xufTtcbiJdfQ==
