const setNewPage = (value = 1) => {
  localStorage.setItem(PAGE, String(value));
};

const getCurrentPage = (): string => {
  return localStorage.getItem(PAGE) || '1';
};

const getLimit = () => {
  return localStorage.getItem(LIMIT) || '6';
};

const setLimit = (value = '1') => {
  localStorage.setItem(LIMIT, value);
};

const getFilter = () => {
  return localStorage.getItem(FILTER) || 'false';
};

const setFilter = (value = false) => {
  localStorage.setItem(FILTER, `${value}`);
};

const updateLimitIfChange = () => {
  const limit = getLimit();
  const searchParams = new URLSearchParams(location.search);
  const queryLimit = searchParams.get('limit') || '6';

  if (limit !== queryLimit) {
    setLimit(queryLimit);
  }
};

const updatePageIfChange = () => {
  const searchParams = new URLSearchParams(location.search);
  const queryPage = searchParams.get('page') || '1';

  const page = getCurrentPage();
  if (page !== queryPage) {
    setNewPage(+queryPage);
  }

  if (Number(queryPage) < 1) {
    alert(PAGE_DOES_NOT_EXIST);
    setNewPage();
  }
};

const updateFilterIfChange = () => {
  const filter = getFilter();
  const searchParams = new URLSearchParams(location.search);
  const queryFilter = searchParams.get('filter') || 'false';

  if (filter !== queryFilter) {
    setFilter(queryFilter === 'true');
  }
};