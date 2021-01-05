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
    flip: f => F().curry((a, b) => (f => f(b)(a))(F().curry(f)))
  }))(() => x(x))
));

let L = (x => x(x))(x => (
  (L => ({
    get: F.curry((obj, path) => (
      path.reduce((acc, key) => (acc || {})[key], obj)
    )),
  }))(() => x(x))
));