function PeriodFilter({ period, setPeriod }) {
  return (
    <select
      value={period}
      onChange={(event) => setPeriod(event.target.value)}
      className="period-filter"
    >
      <option value="all">Todo o período</option>
      <option value="7">Últimos 7 dias</option>
      <option value="30">Últimos 30 dias</option>
      <option value="90">Últimos 90 dias</option>
    </select>
  );
}

export default PeriodFilter;
