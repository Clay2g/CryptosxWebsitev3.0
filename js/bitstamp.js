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
                  curry(updateLastPrice)(instrument)(resp[0]),
                  curry(update24HourChange)(instrument)(resp[1])
                ))
            ))
          ), Promise.resolve())
          .catch(() => {});
    
        instruments
          .forEach(instrument => (
            rec()((s) => (
              new Promise(r => setTimeout(r, 8.64*1e7))
                .then(() => fetch24HourChange(instrument))
                .then(curry(update24HourChange)(instrument))
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
                          let channel = lodashGet(parse(ev.data), ['channel']);
                          let instrument = channel.replace('live_trades_', '');
                          if (channel === state.channel) {
                            (price => {
                              if (!!price) {
                                updateLastPrice(instrument, price);
                              }
                            })(lodashGet(parse(ev.data), ['data', 'price']))
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

function parse(data) {
  try {
    return JSON.parse(data);
  } catch (err) {
    return undefined;
  }
};

function lodashGet(obj, path) {
  return path.reduce((acc, key) => (acc || {})[key], obj);
}

function updateLastPrice(instrument, price) {
  (e => {
    if (!!e) {
      if (!!price) {
        ((decimalPlaces, nPrice) => {
          if (!isNaN(nPrice)) {
            if (typeof price === 'string') {
              decimalPlaces = lodashGet(price.split('.')[1], ['length']);
            }
            new countUp.CountUp(e, price, {decimalPlaces,prefix:'$',duration:0.2}).start();
          }
        })(2, parseFloat(price));
      } else {
        e.innerHTML = `$${price || '--'}`;
      }
    }
  })(document.getElementById(`price-${instrument.toUpperCase()}`));
}

function update24HourChange(instrument, change) {
  (es => (
    es.forEach(e => {
      if (!!e) {
        if (!!change) {
          new countUp.CountUp(e, change, {decimalPlaces:2,suffix:'%',duration:0.2}).start();
        } else {
          e.innerHTML = `${change || '--.--'}%`;
        }
        (change => {
          if (isNaN(change)) {
          } else if (change < 0 ) {
            e.style.color = 'red';
          } else {
            e.style.color = 'green';
          }
        })(parseFloat(change))
      }
    })
  ))([
    document.getElementById(`change-${instrument.toUpperCase()}`),
    document.getElementById(`change0-${instrument.toUpperCase()}`)
  ]);
}

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

function curry(fn) {
  let _curry = (acc = []) => fn => (
    (...args) => (
      (args => {
        if (fn.length == 0)
          return fn(...args);
        if (args.length < fn.length)
          return _curry(args)(fn);
        if (fn.length < args.length)
          throw new Error('curry');
        return fn(...args);
      })([...acc,...args])
    )
  );
  return _curry()(fn);
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