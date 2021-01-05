let _updateLastPrice0 = (f => (a, b) => f(a, b))(updateLastPrice());

window.onload = (f => ev => (
  f(ev),
  (ev => (
    [
      ['btcusd', 'ethusd', 'bchusd', 'ltcusd', 'xrpusd'],
    ]
      .reduce((_, instruments) => {
        instruments
          .reduce((acc, instrument) => (
            (f => acc.then(f))(() => (
              fetchDetail(instrument)
                .then(resp => (
                  F.curry(_updateLastPrice0)(instrument)(resp[0].toString()),
                  F.curry(update24HourChange)(instrument)(resp[1].toString())
                ))
            ))
          ), Promise.resolve())
          .catch(() => {});
    
        instruments
          .forEach(instrument => (
            rec()((s) => (
              new Promise(r => setTimeout(r, 8.64*1e7))
                .then(() => fetch24HourChange(instrument))
                .then(F.curry(update24HourChange)(instrument))
                .catch(() => {})
                .then(() => [])
                .then(args => s(...args))
            ))()
              .catch(() => {})
          ));
        
        let ws = new WebSocket('wss://ws.bitstamp.net');
        ws.onopen = function(ev) {
          instruments
            .reduce((acc, instrument) => (
              (f => acc.then(f))(onmessage => (
                Promise.resolve({
                  channel: `live_trades_${instrument}`
                })
                  .then(state => (
                    ws.send(JSON.stringify({
                      "event": "bts:subscribe",
                      "data": {
                          "channel": state.channel
                      }
                    })),
                    onmessage = (f => (
                      function(ev) {
                        (() => {
                          let channel = L.get(parse(ev.data), ['channel']);
                          let instrument = channel.replace('live_trades_', '');
                          if (channel === state.channel) {
                            (price => (
                              !price
                                ? undefined
                                : (
                                  (price => {
                                    if (!!price) {
                                      _updateLastPrice0(instrument, price);
                                    }
                                  })(price.toString())
                                )
                            ))(L.get(parse(ev.data), ['data', 'price']));
                          }
                        })(f(ev))
                      }
                    ))(onmessage)
                  ))
              ))
            ), Promise.resolve(function(ev) {}))
            .then(onmessage => ws.onmessage = onmessage)
            .catch(console.log)
        };
        ws.onerror = function(ev) {};
      }, undefined)
  ))(ev)
))(window.onload);

function fetchDetail(instrument) {
  return (
    fetch(`https://cryptosx-initiate.herokuapp.com/?url=https://www.bitstamp.net/api/v2/ticker/${instrument}/`)
      .then(res => res.json())
      .then(res => (
        ((open, last) => ([
          res['last'],
          isNaN(open) || isNaN(last) ? undefined : (((open - last) / last * 1e2).toFixed(2))
        ]))(parseFloat(res['open']), parseFloat(res['last']))
      ))
  );
};

function fetch24HourChange(instrument) {
  return (
    fetch(`https://cryptosx-initiate.herokuapp.com/?url=https://www.bitstamp.net/api/v2/ticker/${instrument}/`)
      .then(res => res.json())
      .then(res => (
        ((open, last) => (
          isNaN(open) || isNaN(last) ? undefined : (((open - last) / last * 1e2).toFixed(2))
        ))(parseFloat(res['open']), parseFloat(res['last']))
      ))
  );
};

function rec(lift = a => a, unlift = a => a) {
  return fn => {
    let rec = (fn, ...args) => ({ rec, thunk: () => fn(...args) });
    return (
      (fn => (...args) => (
        (x => x(x))(
          x => (...args) => (
            Promise.resolve(() => (
              fn((s => (...args) => lift(s(...args)))(
                (...args) => x(x)(...args)
              ), ...args)
            ))
              .then(rec)
          )
        )(...args)
          .then(async (s) => {
            while (s && s.rec === rec) {
              s = await unlift(s.thunk());
            }
            return s;
          })
      ))(fn)
    );
  }
};