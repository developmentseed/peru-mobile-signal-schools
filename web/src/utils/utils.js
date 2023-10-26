export const calculateSignalIndex = (ant_data) => {
  const total_sum = ant_data
    .map((i) => (i.plus_1mb ? 3 : 1))
    .reduce((accumulator, val) => {
      return accumulator + val;
    }, 0);
  return total_sum;
};
