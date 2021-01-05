let _updateLastPrice1 = (f => (a, b) => f(a, b))(updateLastPrice());

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
                                  //alert(JSON.stringify(resp, null, 2)),
                                  ((open, last, change) => (
                                    _updateLastPrice1(instrument, last),
                                    update24HourChange(instrument, change)
                                  ))(resp['SessionOpen'].toString(), resp['LastTradedPx'].toString(), resp['Rolling24HrPxChange'].toString())
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