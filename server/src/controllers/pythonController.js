/**
 * Generic controllers that forward requests to the Python service.
 * Used by the monitoring, analysis and reports modules.
 */
const pythonService = require('../services/pythonService');
const { sendSuccess } = require('../utils/response');

const forward =
  (pythonPath, { method = 'GET', message = 'Success', statusCode = 200 } = {}) =>
  async (req, res) => {
    const data = await pythonService.request(pythonPath, {
      method,
      query: req.query,
      body: method === 'GET' ? undefined : req.body,
    });
    return sendSuccess(res, data, { message, statusCode });
  };

module.exports = { forward };
