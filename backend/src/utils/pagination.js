/**
 * @param {Object} query - Express req.query object
 * @returns {{ page: number, limit: number, offset: number }}
 */
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * @param {Array} data - Array of records
 * @param {number} total - Total count of records
 * @param {number} page - Current page number
 * @param {number} limit - Records per page
 * @returns {{ data: Array, pagination: { total: number, page: number, limit: number, totalPages: number, hasNext: boolean, hasPrev: boolean } }}
 */
const paginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

module.exports = {
  getPaginationParams,
  paginatedResponse
};