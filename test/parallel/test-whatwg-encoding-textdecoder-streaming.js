'use strict';

// From: https://github.com/w3c/web-platform-tests/blob/fa9436d12c5edb21704c3382e299aaac31683b24/encoding/textdecoder-streaming.html

const common = require('../common');

const assert = require('assert');
const {
  TextDecoder
} = require('util');

const string =
  '\x00123ABCabc\x80\xFF\u0100\u1000\uFFFD\uD800\uDC00\uDBFF\uDFFF';
const octets = {
  'utf-8': [
    0x00, 0x31, 0x32, 0x33, 0x41, 0x42, 0x43, 0x61, 0x62, 0x63, 0xc2, 0x80,
    0xc3, 0xbf, 0xc4, 0x80, 0xe1, 0x80, 0x80, 0xef, 0xbf, 0xbd, 0xf0, 0x90,
    0x80, 0x80, 0xf4, 0x8f, 0xbf, 0xbf],
  'utf-16le': [
    0x00, 0x00, 0x31, 0x00, 0x32, 0x00, 0x33, 0x00, 0x41, 0x00, 0x42, 0x00,
    0x43, 0x00, 0x61, 0x00, 0x62, 0x00, 0x63, 0x00, 0x80, 0x00, 0xFF, 0x00,
    0x00, 0x01, 0x00, 0x10, 0xFD, 0xFF, 0x00, 0xD8, 0x00, 0xDC, 0xFF, 0xDB,
    0xFF, 0xDF],
  'utf-16be': [
    0x00, 0x00, 0x00, 0x31, 0x00, 0x32, 0x00, 0x33, 0x00, 0x41, 0x00, 0x42,
    0x00, 0x43, 0x00, 0x61, 0x00, 0x62, 0x00, 0x63, 0x00, 0x80, 0x00, 0xFF,
    0x01, 0x00, 0x10, 0x00, 0xFF, 0xFD, 0xD8, 0x00, 0xDC, 0x00, 0xDB, 0xFF,
    0xDF, 0xFF]
};

Object.keys(octets).forEach((encoding) => {
  if (encoding === 'utf-16be' && !common.hasIntl) {
    console.log('skipping utf-16be because missing Intl');
    return;
  }
  for (let len = 1; len <= 5; ++len) {
    const encoded = octets[encoding];
    const decoder = new TextDecoder(encoding);
    let out = '';
    for (let i = 0; i < encoded.length; i += len) {
      const sub = [];
      for (let j = i; j < encoded.length && j < i + len; ++j)
        sub.push(encoded[j]);
      out += decoder.decode(new Uint8Array(sub), { stream: true });
    }
    out += decoder.decode();
    assert.strictEqual(out, string);
  }
});
