let F = (x => x(x))(x => (
  (F => ({
    define: f => (...as) => (
      (x => x(x))(x => (...as) => (
        (s => (
          f(s,...as)
        ))((...as) => x(x)(...as))
      ))(...as)
    ),
    pipe: (...fs) => (
      F().define((s, fs, acc) => (
        fs.length != 0
          ? (
            (f => (
              s(fs, a => acc(f(a)))
            ))(fs.pop())
          )
          : acc
      ))(fs, a => a)
    ),
    compose: (...fs) => (
      F().define((s, fs, acc) => (
        fs.length != 0
          ? (
            (f => (
              s(fs, a => f(acc(a)))
            ))(fs.pop())
          )
          : acc
      ))(fs, a => a)
    ),
    curry: f => (
      F().define((curry, acc, f) => (
        (...args) => (
          (args => {
            if (f.length == 0)
              return f(...args);
            if (args.length < f.length)
              return curry(args, f);
            if (f.length < args.length)
              throw new Error('curry');
            return f(...args);
          })([...acc,...args])
        )
      ))([], f)
    ),
    flip: f => curry((a, b) => (f => f(b)(a))(curry(f)))
  }))(() => x(x))
));

let L = (x => x(x))(x => (
  (L => ({
    get: F.curry((obj, path) => (
      path.reduce((acc, key) => (acc || {})[key], obj)
    )),
  }))(() => x(x))
));

window.onload = (f => ev => (
  f(ev),
  (ev => (
    (dict => (
      (({ws,instruments,authPayload}) => (
        ws.onerror = ev => {},
        ws.onopen = ev => (
          ws.onmessage = (
            F.pipe(
              () => ev => {},
              onmessage => ev => (
                //alert(JSON.stringify(parse(ev.data),null,2)),
                onmessage(ev)
              ),
              onmessage => (
                F.define((s, instruments, onmessage) => (
                  instruments.length != 0
                    ? (
                      s(instruments.slice(0, -1), (
                        ev => (
                          onmessage(ev),
                          (instrument => (
                            ((resp) => (
                              resp['InstrumentId'] === dict[instrument]
                                ? (
                                 // alert(JSON.stringify(resp, null, 2)),
                                  ((open, last, change) => (
                                    updateLastPrice(instrument, last),
                                    update24HourChange(instrument, change)
                                  ))(resp['SessionOpen'], resp['LastTradedPx'], resp['Rolling24HrPxChange'])
                                )
                                : undefined
                            ))(
                              F.compose(
                                parse,
                                F.flip(L.get)(['o']),
                                parse
                              )(ev.data)
                            )
                          ))((as => as[as.length - 1])(instruments))
                        )
                      ))
                    )
                    : onmessage
                ))(instruments.slice(), onmessage)
              ),
            )()
          ),
          ws.send(JSON.stringify({
            m: 0,
            n: 'AuthenticateUser',
            i: 0,
            o: JSON.stringify(authPayload),
          })),
          F.define((s, instruments) => (
            instruments.length != 0
              ? (
                (instrument => (
                  ws.send(JSON.stringify({
                    m: 0,
                    n: 'GetLevel1',
                    i: 0,
                    o: JSON.stringify({
                      'OMSId': 1,
                      'InstrumentId': dict[instrument],
                    }),
                  })),
                  s(instruments)
                ))(instruments.pop())
              )
              : undefined
          ))(instruments.slice())
        )
      ))({
        ws: new WebSocket('wss://api.cryptosx.io/WSGateway/'),
        instruments: Object.keys(dict),
        authPayload: {
          "APIKey": "cf0edf34467dfc58df725a62af1780ea",
          "Signature": "f73c4b163bdf4013acfd38b4f6b685b1becf0dd4551ed110e18ea4145634f91f",
          "UserId": "3405",
          "Nonce": "1426851470"
        },
      })
    ))({
      'cctusdt': 21,
      'agwdusd': 22,
    })
  ))(ev)
))(window.onload);

function parse(data) {
  try {
    return JSON.parse(data);
  } catch (err) {
    return undefined;
  }
};

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