'use strict';

const common = require('../common');
if (!common.hasCrypto)
  common.skip('missing crypto');

const Countdown = require('../common/countdown');
const http2 = require('http2');
const assert = require('assert');

const server = http2.createServer({ settings: { maxConcurrentStreams: 1 } });

let c = 0;

server.on('stream', (stream) => {
  assert.strictEqual(++c, 1);
  stream.respond();
  setImmediate(() => {
    stream.end('ok');
    assert.strictEqual(--c, 0);
  });
});

server.listen(0, common.mustCall(() => {
  const client = http2.connect(`http://localhost:${server.address().port}`);

  const countdown = new Countdown(3, common.mustCall(() => {
    server.close();
    client.destroy();
  }));

  // Test that the maxConcurrentStreams setting is strictly enforced

  client.on('remoteSettings', common.mustCall(() => {
    assert.strictEqual(client.remoteSettings.maxConcurrentStreams, 1);

    // This one should be ok
    {
      const req = client.request();
      req.resume();
      req.on('end', () => {
        countdown.dec();

        setImmediate(() => {
          const req = client.request();
          req.resume();
          req.on('end', () => countdown.dec());
        });
      });
    }

    // This one should fail
    {
      const req = client.request();
      req.resume();
      // TODO(jasnell): Still investigating precisely why, but on Windows,
      //                the error is not emitted because the underlying
      //                mechanism ensures that only one request is sent
      //                at a time per the maxConcurrentStreams setting.
      //                This likely has to do with the way the response
      //                is being handled on the server side. This is safe
      //                to ignore on Windows because of the assert.strictEqual
      //                check in the on('stream') handler which ensures that
      //                only one request is being handled at any given time.
      if (!common.isWindows) {
        req.on('error', common.expectsError({
          code: 'ERR_HTTP2_STREAM_ERROR',
          type: Error,
          message: 'Stream closed with error code 11'
        }));
      }
      req.on('end', () => countdown.dec());
    }
  }));
}));
