exports.codeGenerator = () => {
  //   const MIN_VALUE = 100000;
  //   const MAX_VALUE = 999999;

  const MIN_VALUE = 100000; // minimum value (inclusive)
  const MAX_VALUE = 999999; // maximum value (inclusive)
  const rsvpCode =
    Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE;

  //   const code =
  //     Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MAX_VALUE;
  const code =
    Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE;
  return code;
};
