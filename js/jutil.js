let parse = data => {
  try {
    return JSON.parse(data);
  } catch (err) {
    return undefined;
  }
};

let updateLastPrice = (prevPrices = {}) => (instrument, price) => {
  (e => {
    if (!!e) {
      if (!!price) {
        ((decimalPlaces, nPrice) => {
          if (!isNaN(nPrice)) {
            (price => {
              decimalPlaces = L.get(price.split('.')[1], ['length']);
              (prev => {
                if (!prev) {
                  new countUp.CountUp(e, price, { decimalPlaces, prefix: '$', duration: 0.2 }).start();
                } else {
                  new countUp.CountUp(e, price, { decimalPlaces, prefix: '$', duration: 0.2, startVal: prev }).start();
                }
              })(prevPrices[instrument]);
              prevPrices[instrument] = price;
            })(
              (decimalPlaces => (
                !!decimalPlaces ? nPrice.toFixed(decimalPlaces) : price
              ))(({
                'btcusd': 2,
                'ethusd': 2,
                'bchusd': 2,
                'ltcusd': 2,
                'xrpusd': 5,
              })[instrument])
            )
          }
        })(2, parseFloat(price));
      } else {
        e.innerHTML = `$${price || '--'}`;
      }
    }
  })(document.getElementById(`price-${instrument.toUpperCase()}`));
};

let update24HourChange = (instrument, change) => {
  (es => (
    es.forEach(e => {
      if (!!e) {
        if (!!change) {
          new countUp.CountUp(e, change, { decimalPlaces: 2, suffix: '%', duration: 0.2 }).start();
        } else {
          e.innerHTML = `${change || '--.--'}%`;
        }
        (change => {
          if (isNaN(change)) {
          } else if (change < 0) {
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
};